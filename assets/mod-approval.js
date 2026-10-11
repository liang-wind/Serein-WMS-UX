/* ============================================================
   海外仓 WMS · 审批中心模块（FIX-12）

   报废确认 / 库存调整 / 盘点差异 / 账单差异 / 仓库停用
   这五类单据此前走到「待确认」就没有出口（单据走死）。
   本模块给它们统一的审批出口：
     · 通过  → 真正落库（扣库存 / 调库存 / 清差异 / 停仓库）
     · 驳回  → 回滚或解锁，回到申请前状态
     · 全程写审计留痕，可回溯

   本文件只做「注册」，不改动 assets 下任何既有文件：
     WMS.DB.approval                    种子数据（演示数据）
     WMS.STATUS_BY / STATUS_TEXT.approval
     WMS.RENDER / OPS / ACTIONS.approval
     WMS.TITLE_EXTRA / FIELDS_EXTRA / LINES_EXTRA.approval
   加载顺序：data → shell → ui → app → actions → 本文件（最后）
   ============================================================ */
(function () {
  'use strict';

  /* ================= 工具 ================= */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* 'MM-DD HH:MM' → 分钟数（同月内精确，跨月按 31 天近似） */
  function toMin(s) {
    var m = /^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})$/.exec(String(s == null ? '' : s).trim());
    if (!m) return null;
    return ((+m[1]) * 31 + (+m[2])) * 1440 + (+m[3]) * 60 + (+m[4]);
  }
  /* 已等待分钟数（待审批） */
  function waitMinOf(r) {
    var a = toMin(r.at), b = toMin(WMS.now());
    return (a === null || b === null) ? null : (b - a);
  }
  /* 已处理分钟数（已决策） */
  function procMinOf(r) {
    var a = toMin(r.at), b = toMin(r.decidedAt);
    return (a === null || b === null) ? null : (b - a);
  }
  function fmtDur(min) {
    if (min == null || isNaN(min)) return '—';
    var m = Math.max(0, Math.round(min));
    var h = Math.floor(m / 60), r = m % 60;
    return h > 0 ? (h + 'h' + (r < 10 ? '0' + r : r) + 'm') : (m + 'm');
  }
  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  /* ================= 审批类型字典 ================= */
  var TYPE = {
    'scrap-ret': { label: '退件报废确认', short: '报废', cls: 'b-err' },
    'count-diff': { label: '盘点差异调整', short: '盘点', cls: 'b-wait' },
    'adj':        { label: '库存调整单',   short: '调整', cls: 'b-ing' },
    'bill-diff':  { label: '账单差异调整', short: '账单', cls: 'b-neutral' },
    'wh-pause':   { label: '仓库停用',     short: '停用', cls: 'b-err' }
  };
  function typeOf(r) { return TYPE[r.effect] || { label: r.type || '—', short: '其他', cls: 'b-neutral' }; }

  function amtText(r) {
    if (r.amt == null) return '—';
    var a = Number(r.amt) || 0;
    return (a > 0 ? '+$' : (a < 0 ? '-$' : '$')) + WMS.num(Math.abs(a).toFixed(2));
  }
  function amtCls(r) {
    if (r.amt == null) return 'text-muted';
    var a = Number(r.amt) || 0;
    return a > 0 ? 'text-success' : (a < 0 ? 'text-danger' : 'text-muted');
  }
  function qtyText(r) {
    return (r.sku == null || r.sku === '—') ? '全仓 · 不涉及 SKU' : (r.sku + ' × ' + r.qty + ' 件');
  }
  /* 表格用的短形式（列宽优先） */
  function qtyShort(r) {
    return (r.sku == null || r.sku === '—') ? '—' : (r.sku + ' × ' + r.qty);
  }

  /* 决策后果说明（抽屉「通过 / 驳回后果」与审计留痕共用） */
  function effectDesc(r, pass) {
    var d = r.qty > 0 ? '+' : '';
    switch (r.effect) {
      case 'scrap-ret':
        return pass
          ? '从可用库存扣减 ' + r.qty + ' 件，退件单置为已完成、销毁队列同步关闭，并写入库存流水。'
          : '退件单回到「待换标」决策队列，可用库存与销毁队列均不改变，可重新提交申请。';
      case 'count-diff':
        return pass
          ? '按 ' + d + r.qty + ' 件调整可用库存，盘点库位解锁、盘点任务置为已完成，并写入库存流水。'
          : '只解锁盘点库位并把任务转「待复核」，库存数字一个都不动。';
      case 'adj':
        return pass
          ? '可用库存按 ' + d + r.qty + ' 件调整，并写入库存流水。'
          : '完全不动库存，仅在审批记录中留存结论。';
      case 'bill-diff':
        return pass
          ? '账单确认金额改为系统金额、差异清零，状态转入「对账中」。'
          : '账单保持差异状态，并标记待二次核对。';
      case 'wh-pause':
        return pass
          ? '仓库 ' + (r.target || r.doc) + ' 置为「已停用」，在库库存冻结，未完成作业继续执行。'
          : '仓库 ' + (r.target || r.doc) + ' 恢复「运营中」，可随时重新提交停用申请。';
    }
    return '—';
  }

  /* ============================================================
     1. 种子数据（演示数据，覆盖 5 类 effect，共 9 条）
     单号 / SKU / 货主 / 数量均与全站一致，已决策记录的后果
     已体现在 seed 数字里（可用库存、账单确认金额、仓库状态）。
     ============================================================ */
  WMS.DB.approval = WMS.DB.approval || [
    {
      id: 'AP-20261011-0001', type: '退件报废确认', effect: 'scrap-ret',
      doc: 'RTN-20261011-0192', tenant: '苏州明达玩具', wh: 'FRA-04',
      sku: 'SKU-11708', qty: 36, amt: -284.40,
      applicant: '刘主管', at: '10-10 17:32',
      reason: 'FBA 移除 36 件外包装全部残损不可售，货主已同意销毁；需审批通过后才能扣减可用库存并关闭退件单。',
      note: '退件单当前停在「待换标 / 报废」决策态，审批通过才会真正扣减库存。',
      status: 'pending',
      timeline: [
        { t: '10-10 16:10', title: '退件到仓', meta: 'FBA 移除单 36 件 · 全部残损', state: 'done' },
        { t: '10-10 17:30', title: '报废申请已提交', meta: '刘主管 · 待货主确认', state: 'done' },
        { t: '10-10 17:32', title: '进入审批中心排队', meta: '等待 陈工 审批 · SLA 24h', state: 'active' }
      ],
      audit: [
        { t: '10-10 17:30', op: '刘主管', act: '提交申请', detail: '退件报废确认 · SKU-11708 × 36 件 · -$284.40' },
        { t: '10-10 17:32', op: '系统', act: '进入待办', detail: '分配审批人 陈工 · 关联退件单 RTN-20261011-0192 置为待确认' }
      ]
    },
    {
      id: 'AP-20261011-0002', type: '盘点差异调整', effect: 'count-diff',
      doc: 'CN-20261011-014', loc: 'D-02-09', tenant: '宁波海诚日用', wh: 'FRA-04',
      sku: 'SKU-33478', qty: -12, amt: -33.12,
      applicant: '王运营', at: '10-11 17:12',
      reason: 'D 区循环盘点快照与实物相差 12 件（盘亏），为 FRA-04 6 张待复核差异单之一；审批后才能调整可用库存并解锁盘点库位。',
      note: '盘点任务 CN-20261011-014 进行中，D-02-09 处于锁定态，审批通过后解锁。',
      status: 'pending',
      timeline: [
        { t: '10-11 09:58', title: '盘点快照锁定', meta: 'D-02-09 · 88 件转入 quarantine', state: 'done' },
        { t: '10-11 16:50', title: '实盘复核完成', meta: '盘亏 12 件 · 待审批', state: 'done' },
        { t: '10-11 17:12', title: '进入审批中心排队', meta: '等待 陈工 审批 · SLA 24h', state: 'active' }
      ],
      audit: [
        { t: '10-11 16:50', op: '王运营', act: '提交申请', detail: '盘点差异调整 · SKU-33478 × -12 件 · -$33.12' },
        { t: '10-11 17:12', op: '系统', act: '进入待办', detail: '分配审批人 陈工 · 库位 D-02-09 保持锁定' }
      ]
    },
    {
      id: 'AP-20261011-0003', type: '盘点差异调整', effect: 'count-diff',
      doc: 'CN-20261011-015', loc: 'A-03-12', tenant: '深圳致远电子', wh: 'LAX-01',
      sku: 'SKU-88231', qty: 3, amt: 10.26,
      applicant: '刘主管', at: '10-11 07:52', status: 'approved',
      decidedBy: '陈工', decidedAt: '10-11 08:40',
      reason: 'A 区动态盘点复盘，A-03-12 盘盈 3 件（上架错记），审批后加回可用库存。',
      note: '已于 10-11 08:40 通过，可用库存加回 3 件，当前 12 件已含本次盘盈。',
      timeline: [
        { t: '10-11 07:40', title: '动态盘点开始', meta: 'A 区 · 12 个库位', state: 'done' },
        { t: '10-11 07:52', title: '差异单已提交', meta: '盘盈 3 件 · 待审批', state: 'done' },
        { t: '10-11 08:40', title: '审批通过', meta: '陈工 · 可用库存 +3 件', state: 'done' }
      ],
      audit: [
        { t: '10-11 07:52', op: '刘主管', act: '提交申请', detail: '盘点差异调整 · SKU-88231 × +3 件 · +$10.26' },
        { t: '10-11 08:40', op: '陈工', act: '通过', detail: '落库：可用库存 9 → 12 件，库位 A-03-12 解锁' }
      ]
    },
    {
      id: 'AP-20261011-0004', type: '库存调整单', effect: 'adj',
      doc: 'ADJ-20261011-0067', tenant: '深圳致远电子', wh: 'LAX-01',
      sku: 'SKU-88231', qty: -2, amt: -6.84,
      applicant: '刘主管', at: '10-11 12:13',
      reason: 'A-03-12 拣货时发现 2 件外壳破裂不可售，申请破损报废并从可用库存扣减。',
      note: '调整单未通过前可用库存不变，拣货仍按原数量分配。',
      status: 'pending',
      timeline: [
        { t: '10-11 12:05', title: '破损登记', meta: 'A-03-12 · 2 件外壳破裂', state: 'done' },
        { t: '10-11 12:13', title: '调整单已提交', meta: '刘主管 · 待审批', state: 'done' },
        { t: '10-11 12:13', title: '进入审批中心排队', meta: '等待 陈工 审批 · SLA 24h', state: 'active' }
      ],
      audit: [
        { t: '10-11 12:13', op: '刘主管', act: '提交申请', detail: '库存调整单 · SKU-88231 × -2 件 · -$6.84' },
        { t: '10-11 12:13', op: '系统', act: '进入待办', detail: '分配审批人 陈工 · 关联调整单 ADJ-20261011-0067' }
      ]
    },
    {
      id: 'AP-20261010-0016', type: '库存调整单', effect: 'adj',
      doc: 'ADJ-20261010-0031', tenant: '深圳致远电子', wh: 'LAX-01',
      sku: 'SKU-44122', qty: -2, amt: -4.20,
      applicant: '刘主管', at: '10-10 14:05', status: 'approved',
      decidedBy: '陈工', decidedAt: '10-10 15:44',
      reason: '盘点少货 2 件，申请按盘点差异扣减可用库存（对应流水 LG-20261010-00705）。',
      note: '已于 10-10 15:44 通过，SKU-44122 可用库存 64 → 62 件，流水已写入。',
      timeline: [
        { t: '10-10 14:05', title: '调整单已提交', meta: '刘主管 · 盘点少货 2 件', state: 'done' },
        { t: '10-10 15:44', title: '审批通过', meta: '陈工 · 可用库存 -2 件', state: 'done' },
        { t: '10-10 15:44', title: '库存流水已写入', meta: 'LG-20261010-00705 · ADJUST', state: 'done' }
      ],
      audit: [
        { t: '10-10 14:05', op: '刘主管', act: '提交申请', detail: '库存调整单 · SKU-44122 × -2 件 · -$4.20' },
        { t: '10-10 15:44', op: '陈工', act: '通过', detail: '落库：可用库存 64 → 62 件，写入库存流水' }
      ]
    },
    {
      id: 'AP-20261011-0005', type: '账单差异调整', effect: 'bill-diff',
      doc: 'INV-202610-0038', tenant: '乐歌家居科技', wh: 'BHX-03',
      sku: '—', qty: 0, amt: 3060,
      applicant: '王运营', at: '10-10 23:52',
      reason: '货主少认 3,060 美元（托盘仓储天数计算口径差异），申请按系统金额入账并转入对账。',
      note: '差异未确认前账单停留在「差异」，通过后才按系统金额结账。',
      status: 'pending',
      timeline: [
        { t: '10-10 23:40', title: '账单差异已标记', meta: 'INV-202610-0038 · +$3,060', state: 'done' },
        { t: '10-10 23:52', title: '差异调整已提交', meta: '王运营 · 待审批', state: 'done' },
        { t: '10-10 23:52', title: '进入审批中心排队', meta: '等待 陈工 审批 · SLA 24h', state: 'active' }
      ],
      audit: [
        { t: '10-10 23:52', op: '王运营', act: '提交申请', detail: '账单差异调整 · INV-202610-0038 · +$3,060.00' },
        { t: '10-10 23:52', op: '系统', act: '进入待办', detail: '分配审批人 陈工 · 账单保持差异态' }
      ]
    },
    {
      id: 'AP-20261010-0012', type: '账单差异调整', effect: 'bill-diff',
      doc: 'INV-202610-0035', tenant: '安克创新科技', wh: 'LAX-01',
      sku: '—', qty: 0, amt: 340,
      applicant: '王运营', at: '10-11 06:30', status: 'approved',
      decidedBy: '陈工', decidedAt: '10-11 08:05',
      reason: '货主确认金额少 340 美元（入库操作费分段口径），申请按系统金额入账。',
      note: '已于 10-11 08:05 通过，账单确认金额改为 $18,940、差异清零并转入对账中。',
      timeline: [
        { t: '10-11 06:30', title: '差异调整已提交', meta: '王运营 · 差 $340', state: 'done' },
        { t: '10-11 08:05', title: '审批通过', meta: '陈工 · 按系统金额入账', state: 'done' },
        { t: '10-11 08:05', title: '账单转入对账', meta: 'INV-202610-0035 · 差异 $0', state: 'done' }
      ],
      audit: [
        { t: '10-11 06:30', op: '王运营', act: '提交申请', detail: '账单差异调整 · INV-202610-0035 · +$340.00' },
        { t: '10-11 08:05', op: '陈工', act: '通过', detail: '落库：确认金额 $18,940 · 差异清零 · 转入对账中' }
      ]
    },
    {
      id: 'AP-20261011-0006', type: '仓库停用', effect: 'wh-pause',
      doc: 'BHX-03', target: 'BHX-03', tenant: '—', wh: 'BHX-03',
      sku: '—', qty: 0, amt: null,
      applicant: '陈工', at: '10-11 15:35',
      reason: 'BHX-03 库容 91.6% 超限，申请 10-15 起停用 5 天加装高层货架；停用期间在库库存冻结、未完成作业继续执行。',
      note: '停用未通过前仓库保持运营中，ASN 与出库单照常下发。',
      status: 'pending',
      timeline: [
        { t: '10-11 15:20', title: '扩容预警触发', meta: 'BHX-03 · 库容 91.6%', state: 'done' },
        { t: '10-11 15:35', title: '停用申请已提交', meta: '陈工 · 10-15 起停用 5 天', state: 'done' },
        { t: '10-11 15:35', title: '进入审批中心排队', meta: '等待 陈工 审批 · SLA 24h', state: 'active' }
      ],
      audit: [
        { t: '10-11 15:35', op: '陈工', act: '提交申请', detail: '仓库停用 · BHX-03 · 停用 5 天扩容整改' },
        { t: '10-11 15:35', op: '系统', act: '进入待办', detail: '分配审批人 陈工 · 仓库保持运营中' }
      ]
    },
    {
      id: 'AP-20261010-0009', type: '仓库停用', effect: 'wh-pause',
      doc: 'LAX-01', target: 'LAX-01', tenant: '—', wh: 'LAX-01',
      sku: '—', qty: 0, amt: null,
      applicant: '王运营', at: '10-11 08:40', status: 'rejected',
      decidedBy: '陈工', decidedAt: '10-11 09:12',
      reason: '申请 10-20 停用 LAX-01 更换消防管线 1 天，被驳回：主力仓且货权集中度最高，停用影响面过大。',
      note: '已于 10-11 09:12 驳回，LAX-01 保持运营中，可改为分时分区施工后重新提交。',
      timeline: [
        { t: '10-11 08:40', title: '停用申请已提交', meta: '王运营 · 消防管线更换', state: 'done' },
        { t: '10-11 09:12', title: '审批驳回', meta: '陈工 · 影响面过大', state: 'error' },
        { t: '10-11 09:12', title: '仓库恢复运营', meta: 'LAX-01 · 无需回滚', state: 'done' }
      ],
      audit: [
        { t: '10-11 08:40', op: '王运营', act: '提交申请', detail: '仓库停用 · LAX-01 · 停用 1 天' },
        { t: '10-11 09:12', op: '陈工', act: '驳回', detail: '回滚：LAX-01 恢复运营中 · 驳回理由已通知申请人' }
      ]
    }
  ];

  /* ============================================================
     2. 状态注册（徽章 + Tab 计数）
     ============================================================ */
  WMS.STATUS_BY.approval = {
    pending:  { cls: 'b-wait', text: '待审批' },
    approved: { cls: 'b-done', text: '已通过' },
    rejected: { cls: 'b-err',  text: '已驳回' }
  };
  /* syncTabs 走 statusTextOf(kind, status)，必须同步注册中文名 */
  WMS.STATUS_TEXT.approval = {
    pending: '待审批', approved: '已通过', rejected: '已驳回'
  };

  /* ============================================================
     3. 列表渲染（列序必须与表头 / data-filter-col 一致）
        0 审批单号 · 1 类型 · 2 关联单据 · 3 货主 · 4 仓库
        5 SKU/数量 · 6 影响金额 · 7 申请人 · 8 申请时间
        9 等待时长 · 10 状态 · 11 操作
     ============================================================ */
  WMS.RENDER.approval = function (r) {
    var t = typeOf(r);
    var wait = waitMinOf(r);
    var over = (r.status === 'pending' && wait !== null && wait > 1440);
    var waitTxt = (r.status === 'pending') ? fmtDur(wait) : '—';

    /* 操作列：详情（抽屉）+ 数据驱动的 通过 / 驳回 */
    var ops = '<button class="btn-link" type="button" data-drawer="approval:' + r.id + '">详情</button>';
    var defs = WMS.OPS.approval || [];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      if (d.k === 'view' || d.on.indexOf(r.status) === -1) continue;
      ops += '<button class="btn-link' + (d.danger ? ' danger' : '') + '" type="button" ' +
             'data-action="approval:' + r.id + ':' + d.k + '">' + d.t + '</button>';
    }

    return '<tr data-id="' + r.id + '">' +
      '<td><button class="td-link td-num td-strong" type="button" data-drawer="approval:' + r.id + '">' + r.id + '</button></td>' +
      '<td><span class="badge ' + t.cls + '">' + WMS.esc(t.label) + '</span></td>' +
      '<td class="td-num">' + WMS.esc(r.doc) + '</td>' +
      '<td>' + WMS.esc(r.tenant) + '</td>' +
      '<td class="td-num">' + r.wh + '</td>' +
      '<td class="td-num">' + qtyShort(r) + '</td>' +
      '<td class="td-num ' + amtCls(r) + '">' + amtText(r) + '</td>' +
      '<td>' + WMS.esc(r.applicant) + '</td>' +
      '<td class="td-num">' + r.at + '</td>' +
      '<td class="td-num' + (over ? ' text-danger' : '') + '">' + waitTxt + '</td>' +
      '<td>' + WMS.statusText('approval', r.status) + '</td>' +
      '<td class="td-ops">' + ops + '</td>' +
    '</tr>';
  };

  /* ============================================================
     4. 操作按钮定义（on 与 STATUS_BY.approval 的 key 一致）
     ============================================================ */
  WMS.OPS.approval = [
    { k: 'view',    t: '详情', on: ['pending', 'approved', 'rejected'] },
    { k: 'approve', t: '通过', on: ['pending'] },
    { k: 'reject',  t: '驳回', on: ['pending'], danger: true }
  ];

  /* ============================================================
     5. effect 落库 / 回滚（FIX-12 映射表）
        通过 = 真正改库存、单据、账务；驳回 = 回滚或解锁
     ============================================================ */
  /* 追加库存流水（FIX-11：所有库存写入必须留痕） */
  function ledgerAppend(skuId, qty, docType, doc, note, tenant) {
    var s = WMS.find('sku', skuId);
    if (!s || !qty) return;
    var bal = null, i;
    for (i = 0; i < (WMS.DB.ledger || []).length; i++) {
      if (WMS.DB.ledger[i].sku === skuId) { bal = WMS.DB.ledger[i].balance; break; }
    }
    if (bal === null) bal = s.avail;
    var d = new Date();
    var stamp = '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
    var seq = 1;
    for (i = 0; i < (WMS.DB.ledger || []).length; i++) {
      var m = String(WMS.DB.ledger[i].id).match(/(\d+)$/);
      if (m && WMS.DB.ledger[i].id.indexOf('LG-' + stamp) === 0) seq = Math.max(seq, parseInt(m[1], 10) + 1);
    }
    var tail = '' + seq;
    while (tail.length < 5) tail = '0' + tail;
    WMS.DB.ledger.unshift({
      id: 'LG-' + stamp + '-' + tail, t: WMS.now(), wh: s.wh, tenant: tenant || s.supplier,
      sku: s.id, name: s.name, lot: '—', loc: s.loc,
      qty: qty, dir: qty > 0 ? 'IN' : 'OUT', from: 'on_hand', to: 'on_hand',
      docType: docType, doc: doc, line: 1, op: '陈工', device: 'WEB',
      balance: Math.max(0, bal + qty), note: note
    });
  }
  function runEffect(r, pass) {
    var e = r.effect;

    if (e === 'scrap-ret') {
      /* 退件报废：通过扣库存并关单；驳回退回待换标 */
      var ret = WMS.find('ret', r.doc), s = WMS.find('sku', r.sku);
      if (pass) {
        if (s) { s.avail = Math.max(0, s.avail - r.qty); WMS.skuStatus(s); }
        if (ret) {
          ret.status = 'done';
          ret.note = r.qty + ' 件报废已通过审批，可用库存已扣减，退件单关闭。';
          WMS.push(ret, '报废确认已通过', r.qty + ' 件已从可用库存扣减', 'done');
        }
        (WMS.DB.retn || []).forEach(function (q) {
          if (q.src === r.doc && (q.act === '销毁' || q.status === 'waitdestroy')) {
            q.status = 'done';
            q.note = '销毁已完成 · ' + r.qty + ' 件影像与报告已归档。';
          }
        });
        ledgerAppend(r.sku, -r.qty, 'RETURN', r.doc,
          '报废审批通过，' + r.qty + ' 件从可用库存扣减（审批单 ' + r.id + '）。', r.tenant);
      } else {
        if (ret) {
          ret.status = 'relabel';
          ret.note = '报废申请已驳回，退回「待换标 / 报废」决策队列，可重新提交或改走换标翻新。';
          WMS.push(ret, '报废确认已驳回', '退回待换标决策队列', 'error');
        }
        (WMS.DB.retn || []).forEach(function (q) {
          if (q.src === r.doc) q.note = '报废被驳回，销毁队列保持「待销毁」，等待重新决策。';
        });
      }
      return;
    }

    if (e === 'count-diff') {
      /* 盘点差异：通过按正负调库存并解锁库位；驳回只解锁 */
      var sku = WMS.find('sku', r.sku), loc = WMS.find('loc', r.loc),
          task = WMS.find('countTask', r.doc);
      var diff = (r.qty > 0 ? '盘盈 ' : '盘亏 ') + Math.abs(r.qty) + ' 件';
      if (pass) {
        if (sku) { sku.avail = Math.max(0, sku.avail + r.qty); WMS.skuStatus(sku); }
        if (loc) {
          loc.status = 'part';
          loc.note = '盘点差异已审批入账，库位已解锁（' + diff + '）。';
        }
        if (task) { task.status = '已完成'; task.diff = (r.qty > 0 ? '+' : '') + r.qty + ' 件'; }
        ledgerAppend(r.sku, r.qty, 'COUNT', r.doc,
          '盘点差异审批通过，' + diff + '（审批单 ' + r.id + '）。', r.tenant);
      } else {
        if (loc) {
          loc.status = 'part';
          loc.note = '盘点差异被驳回，库位已解锁，差异单转待复核，库存不变。';
        }
        if (task) task.status = '待复核';
      }
      return;
    }

    if (e === 'adj') {
      /* 库存调整单：通过调库存；驳回完全不动 */
      var s2 = WMS.find('sku', r.sku);
      if (pass && s2) {
        var before = s2.avail;
        s2.avail = Math.max(0, s2.avail + r.qty);
        WMS.skuStatus(s2);
        s2.note = '库存调整单 ' + r.doc + ' 已通过审批：' + (r.qty > 0 ? '+' : '') + r.qty +
                  ' 件（' + WMS.num(before) + ' → ' + WMS.num(s2.avail) + '）。';
        ledgerAppend(r.sku, r.qty, 'ADJUST', r.doc,
          '库存调整审批通过，' + (r.qty > 0 ? '+' : '') + r.qty + ' 件（审批单 ' + r.id + '）。', r.tenant);
      }
      return;
    }

    if (e === 'bill-diff') {
      /* 账单差异：通过按系统金额入账并转对账；驳回标记待二次核对 */
      var b = WMS.find('bill', r.doc);
      if (!b) return;
      var d2 = (r.amt > 0 ? '+' : '') + '$' + WMS.num(Math.abs(r.amt || 0).toFixed(2));
      if (pass) {
        b.conf = b.sys;
        b.diff = '$0';
        b.diffCls = '';
        b.status = 'recon';
        b.note = '账单差异 ' + d2 + ' 已通过审批，确认金额改为系统金额并转入对账中。';
      } else {
        b.status = 'diff';
        b.diffCls = 'text-danger';
        b.note = '差异申请已驳回，账单保持差异状态，待二次核对（复盘工单已生成）。';
      }
      return;
    }

    if (e === 'wh-pause') {
      /* 仓库停用：通过置 hold；驳回恢复 active */
      var w = WMS.find('wh', r.target || r.doc);
      if (!w) return;
      if (pass) {
        w.status = 'hold';
        w.note = '停用已通过审批：在库库存冻结，未完成作业继续执行，恢复需重新审批。';
        WMS.push(w, '仓库停用已通过', '在库库存冻结', 'error');
      } else {
        w.status = 'active';
        w.note = '停用申请已驳回，仓库恢复正常运营。';
        WMS.push(w, '停用申请已驳回', '恢复运营', 'done');
      }
    }
  }

  /* 统一决策入口：改状态 → 落库/回滚 → 留痕 */
  function decide(r, pass) {
    r.status = pass ? 'approved' : 'rejected';
    r.decidedBy = '陈工';
    r.decidedAt = WMS.now();
    runEffect(r, pass);
    WMS.push(r, pass ? '审批通过' : '审批驳回',
             (pass ? '已落库' : '已回滚') + ' · ' + typeOf(r).label, pass ? 'done' : 'error');
    r.audit = r.audit || [];
    r.audit.unshift({
      t: r.decidedAt, op: '陈工', act: pass ? '通过' : '驳回',
      detail: (pass ? '落库：' : '回滚：') + effectDesc(r, pass)
    });
  }

  /* ============================================================
     6. 业务动作
     ============================================================ */
  WMS.ACTIONS.approval = {
    view: function (r) { WMS.openDrawer('approval:' + r.id); return { msg: null }; },

    approve: function (r) {
      if (!r) return { msg: '没有待审批的单据', type: 'warn' };
      if (r.status !== 'pending') {
        return { msg: r.id + ' 已是「' + WMS.STATUS_BY.approval[r.status].text + '」，不能重复审批', type: 'warn' };
      }
      decide(r, true);
      WMS.save();
      WMS.renderAll();
      return { msg: r.id + ' 已通过 · ' + typeOf(r).label + '已落库' };
    },

    reject: function (r) {
      if (!r) return { msg: '没有待审批的单据', type: 'warn' };
      if (r.status !== 'pending') {
        return { msg: r.id + ' 已是「' + WMS.STATUS_BY.approval[r.status].text + '」，不能重复审批', type: 'warn' };
      }
      decide(r, false);
      WMS.save();
      WMS.renderAll();
      return { msg: r.id + ' 已驳回 · 已回滚到申请前状态' };
    },

    /* id === '*' 时由工具栏「批量通过」触发 */
    batchApprove: function (r, ctx) {
      var pool = (WMS.DB.approval || []).filter(function (x) { return x.status === 'pending'; });
      if (!pool.length) return { msg: '当前没有待审批的单据', type: 'warn' };
      var n = 0;
      pool.forEach(function (x) { decide(x, true); n++; });
      WMS.save();
      WMS.renderAll();
      return { msg: '已批量通过 ' + n + ' 单审批 · 库存与账务已同步落库' };
    }
  };

  /* 抽屉底部动作：引擎的 footAction 取 OPS 第一个匹配项，
     对审批单会落到 view（「详情」），这里改成给出真正的决策按钮，
     其它 kind 仍走引擎原实现。 */
  var baseFootAction = WMS.footAction;
  WMS.footAction = function (kind, r) {
    if (kind !== 'approval') return baseFootAction(kind, r);
    var h = '<button class="btn" type="button" data-print>打印详情</button>';
    if (r.status !== 'pending') return h + '<button class="btn" type="button" data-close-drawer>关闭</button>';
    var defs = WMS.OPS.approval || [];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      if (d.k === 'view' || d.on.indexOf(r.status) === -1) continue;
      h += '<button class="btn ' + (d.danger ? 'btn-danger' : 'btn-primary') + '" type="button" ' +
           'data-action="approval:' + r.id + ':' + d.k + '">' + d.t + '</button>';
    }
    return h;
  };

  /* ============================================================
     7. 抽屉扩展（详情 / 字段 / 明细）
     ============================================================ */
  WMS.TITLE_EXTRA.approval = function (r) {
    return typeOf(r).label + ' · ' + r.doc;
  };

  WMS.FIELDS_EXTRA.approval = function (r, add) {
    add('审批类型', typeOf(r).label + ' <span class="hint">' + WMS.esc(r.effect) + '</span>');
    add('关联单据', WMS.esc(r.doc));
    add('货主', WMS.esc(r.tenant));
    add('仓库', r.wh);
    add('SKU / 数量', qtyText(r));
    add('影响金额', amtText(r));
    add('申请人', WMS.esc(r.applicant));
    add('申请时间', r.at);
    add('等待时长', r.status === 'pending' ? fmtDur(waitMinOf(r)) : '—');
    add('处理时长', r.decidedAt ? fmtDur(procMinOf(r)) : '—');
    add('审批人', WMS.esc(r.decidedBy || '待分配（默认 陈工）'));
    add('决定时间', r.decidedAt || '—');
    add('提交端', 'WEB · 海外仓 WMS');
  };

  WMS.LINES_EXTRA.approval = function (r) {
    var h = '';

    /* 申请理由 */
    h += '<section class="drawer-sec"><h3>申请理由</h3>' +
         '<p style="margin:0;font-size:12.5px;line-height:1.65">' + WMS.esc(r.reason || '—') + '</p></section>';

    /* 通过 / 驳回后果 */
    h += '<section class="drawer-sec"><h3>通过 / 驳回后果</h3>' +
         '<div class="note-box info">通过：' + WMS.esc(effectDesc(r, true)) + '</div>' +
         '<div class="note-box" style="margin-top:8px">驳回：' + WMS.esc(effectDesc(r, false)) + '</div>' +
         '</section>';

    /* 审批留痕（stepper，不受工具栏过滤影响） */
    h += '<section class="drawer-sec"><h3>审批留痕 · ' + ((r.audit || []).length) + ' 条</h3><div class="stepper">';
    (r.audit || []).forEach(function (a, i) {
      h += '<div class="step ' + (i === 0 ? 'active' : 'done') + '">' +
           '<span class="step-dot" aria-hidden="true">' + (i === 0 ? '•' : '✓') + '</span>' +
           '<div class="step-body"><div class="step-title">' + WMS.esc(a.act) + ' · ' + WMS.esc(a.op) + '</div>' +
           '<div class="step-meta">' + WMS.esc(a.t) + ' · ' + WMS.esc(a.detail) + '</div></div></div>';
    });
    h += '</div></section>';

    /* 待审批时给出决策按钮 */
    if (r.status === 'pending') {
      h += '<section class="drawer-sec"><h3>审批操作</h3>' +
           '<div style="display:flex;gap:8px">' +
           '<button class="btn btn-primary" type="button" data-action="approval:' + r.id + ':approve">通过</button>' +
           '<button class="btn btn-danger" type="button" data-action="approval:' + r.id + ':reject">驳回</button>' +
           '</div>' +
           '<div class="note-box" style="margin-top:10px">通过后会立即改写库存、单据与账务并写入审计日志，操作不可撤销。</div>' +
           '</section>';
    }
    return h;
  };

  /* ============================================================
     8. KPI 与超时预警（包一层 syncKpis，随每次渲染刷新）
     ============================================================ */
  var baseSyncKpis = WMS.syncKpis;

  function renderTimeoutList() {
    var host = document.getElementById('timeout-list');
    if (!host) return;
    var list = [];
    (WMS.DB.approval || []).forEach(function (r) {
      if (r.status !== 'pending') return;
      var w = waitMinOf(r);
      if (w === null || w < 240) return;
      list.push({ r: r, w: w });
    });
    list.sort(function (a, b) { return b.w - a.w; });

    setText('timeout-count', list.length ? (list.length + ' 单待跟进') : '全部在 SLA 内');
    if (!list.length) {
      host.innerHTML = '<div class="empty"><p>暂无超时预警 · 全部审批在 SLA 24h 内</p></div>';
      return;
    }
    var ICON = {
      high: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      mid:  '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      low:  '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    };
    host.innerHTML = list.slice(0, 4).map(function (x) {
      var sev = x.w > 1440 ? 'high' : (x.w > 720 ? 'mid' : 'low');
      var t = typeOf(x.r);
      var meta = WMS.esc(x.r.doc) + ' · ' + WMS.esc(x.r.tenant) + ' · ' + x.r.wh +
                 (x.r.sku === '—' ? '' : ' · ' + x.r.sku + ' × ' + x.r.qty);
      return '<div class="alert sev-' + sev + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[sev] + '</svg>' +
        '<div class="alert-body">' +
          '<div class="alert-title">' + x.r.id + ' ' + WMS.esc(t.label) + ' 已等 ' + fmtDur(x.w) +
            (x.w > 1440 ? ' · 超 24h' : '') + '</div>' +
          '<div class="alert-meta">' + meta + '</div>' +
        '</div>' +
        '<span class="alert-time">' + fmtDur(x.w) + '</span>' +
      '</div>';
    }).join('');
  }

  WMS.syncKpis = function () {
    if (baseSyncKpis) baseSyncKpis();

    var rows = WMS.DB.approval || [], i, r;
    var today = WMS.now().slice(0, 5);
    var doneToday = 0, passToday = 0, rejToday = 0, sumMin = 0, nMin = 0;
    var pending = [], over = 0, worst = null;

    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      if (r.status === 'pending') {
        pending.push(r);
        var w = waitMinOf(r);
        if (w !== null && w > 1440) {
          over++;
          if (!worst || w > waitMinOf(worst)) worst = r;
        }
      } else if (r.decidedAt && String(r.decidedAt).slice(0, 5) === today) {
        doneToday++;
        if (r.status === 'approved') passToday++; else rejToday++;
        var p = procMinOf(r);
        if (p !== null) { sumMin += p; nMin++; }
      }
    }

    /* 待我审批：类型构成 */
    var byType = {}, parts = [];
    pending.forEach(function (x) {
      var k = typeOf(x).short;
      byType[k] = (byType[k] || 0) + 1;
    });
    for (var k in byType) parts.push(k + ' ' + byType[k]);
    setText('kpi-pending-delta', parts.length ? parts.join(' · ') : '暂无待审批');

    setText('kpi-today', String(doneToday));
    setText('kpi-today-delta', '通过 ' + passToday + ' · 驳回 ' + rejToday);

    setText('kpi-avg', nMin ? ((sumMin / nMin) / 60).toFixed(1) + 'h' : '—');
    setText('kpi-over', String(over));
    setText('kpi-over-delta', worst
      ? ('最久 ' + WMS.short(worst.id) + ' · 已等 ' + fmtDur(waitMinOf(worst)))
      : '无超时审批 · 全部在 SLA 24h 内');

    renderTimeoutList();
  };

  /* ============================================================
     9. 启动
     ============================================================ */
  WMS.renderAll();
})();
