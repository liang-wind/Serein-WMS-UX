/* ============================================================
   海外仓 WMS · 供应商管理模块（mod-supplier.js）
   本文件只做「注册」，不改动任何既有文件，从根本上避免多模块并发改同一处：
     1. WMS.DB.supplier        种子数据（演示数据 · 已存在则合并不覆盖）
     2. WMS.STATUS_BY.supplier  状态 → 徽章（cls / text）
     3. WMS.STATUS_TEXT.supplier 状态中文名（Tab 计数 / 反馈文案）
     4. WMS.RENDER.supplier     表格行渲染
     5. WMS.OPS.supplier        行内操作按钮（按状态显隐）
     6. WMS.ACTIONS.supplier    档案 / 绩效 / 停用 / 新建
     7. 抽屉扩展 TITLE_EXTRA / FIELDS_EXTRA / LINES_EXTRA
   供应商（国内发货方）≠ 货主（货权方）：供应商只影响入库段，货主决定库存归属与计费。
   ============================================================ */
(function () {
  'use strict';
  if (!window.WMS) { return; }

  /* ================= 1. 种子数据（演示数据） ================= */
  WMS.DB.supplier = WMS.DB.supplier || [];

  var SEED = [
    {
      id: 'SP-001', name: '深圳致远电子', region: '广东 · 深圳',
      contact: '李敏', phone: '+86 755 8812 4471',
      cat: '3C 电子 · 家居日用',
      tenantId: 'TN-00041', tenantName: '深圳致远电子',
      lots: 186, lotsM: 24, onTime: 97.3, shortRate: 0.8, badM: 0,
      lastIn: '10-11', since: '2023-08', settle: '月结 30 天',
      status: 'ok',
      note: '既是发货方也是货主（同一主体兼具两种身份）。累计 186 批次无短装破损，主力供应 4 个 SKU。',
      perf: [
        { m: '07 月', lots: 18, onTime: 97.8, short: 0.6, late: 0 },
        { m: '08 月', lots: 20, onTime: 97.0, short: 0.9, late: 1 },
        { m: '09 月', lots: 19, onTime: 97.4, short: 0.7, late: 0 },
        { m: '10 月', lots: 24, onTime: 97.1, short: 0.9, late: 1 }
      ],
      timeline: [
        { t: '08-12 09:30', title: '供应商建档', meta: 'Serein · 首票 ASN 到 LAX-01', state: 'done' },
        { t: '10-11 14:20', title: '最近到货', meta: 'ASN-20261011-0142 · 320 箱 · LAX-01', state: 'done' }
      ]
    },
    {
      id: 'SP-002', name: '义乌恒发家居', region: '浙江 · 义乌',
      contact: '张成', phone: '+86 579 8663 1120',
      cat: '家居日用',
      tenantId: 'TN-00086', tenantName: '义乌恒发家居',
      lots: 132, lotsM: 16, onTime: 95.6, shortRate: 1.4, badM: 1,
      lastIn: '10-11', since: '2024-11', settle: '周结',
      status: 'ok',
      note: '家居大货为主，每周固定发运 EWR-02；退货换标业务占比高。',
      perf: [
        { m: '07 月', lots: 15, onTime: 95.7, short: 1.3, late: 1 },
        { m: '08 月', lots: 17, onTime: 96.5, short: 1.0, late: 0 },
        { m: '09 月', lots: 14, onTime: 95.0, short: 1.6, late: 1 },
        { m: '10 月', lots: 16, onTime: 95.4, short: 1.5, late: 1 }
      ],
      timeline: [
        { t: '11-05 10:20', title: '供应商建档', meta: '王运营 · 首票 ASN 到 EWR-02', state: 'done' },
        { t: '10-11 16:30', title: '最近到货', meta: 'ASN-20261011-0141 · 空运 118 箱', state: 'active' }
      ]
    },
    {
      id: 'SP-003', name: '东莞精工五金', region: '广东 · 东莞',
      contact: '周立', phone: '+86 769 2288 5507',
      cat: '五金工具 · 3C 电子',
      tenantId: 'TN-00108', tenantName: '东莞精工五金',
      lots: 158, lotsM: 21, onTime: 98.1, shortRate: 0.5, badM: 0,
      lastIn: '10-11', since: '2023-11', settle: '月结 30 天',
      status: 'ok',
      note: '近 4 个月准时到货率全网最高；铁运中欧班列为主，箱规统一、极少短装。',
      perf: [
        { m: '07 月', lots: 17, onTime: 98.2, short: 0.4, late: 0 },
        { m: '08 月', lots: 19, onTime: 98.4, short: 0.3, late: 0 },
        { m: '09 月', lots: 16, onTime: 97.9, short: 0.6, late: 1 },
        { m: '10 月', lots: 21, onTime: 98.0, short: 0.5, late: 0 }
      ],
      timeline: [
        { t: '11-18 14:02', title: '供应商建档', meta: '刘主管 · 首票 ASN 到 BHX-03', state: 'done' },
        { t: '10-11 09:15', title: '最近到货', meta: 'ASN-20261011-0138 · 中欧班列 542 箱', state: 'done' }
      ]
    },
    {
      id: 'SP-004', name: '宁波海诚日用', region: '浙江 · 宁波',
      contact: '陈海', phone: '+86 574 8722 3390',
      cat: '家居日用 · 运动户外',
      tenantId: 'TN-00094', tenantName: '宁波海诚日用',
      lots: 94, lotsM: 12, onTime: 88.4, shortRate: 4.6, badM: 3,
      lastIn: '10-10', since: '2024-09', settle: '月结 30 天',
      status: 'watch',
      note: '近 2 个月短装与破损集中上升：10-10 的 ASN-20261010-0131 短装 4 箱 + 外箱破损 2 箱，已列入观察名单并暂停新增采购单。',
      perf: [
        { m: '07 月', lots: 14, onTime: 93.1, short: 2.0, late: 1 },
        { m: '08 月', lots: 13, onTime: 91.2, short: 2.8, late: 1 },
        { m: '09 月', lots: 12, onTime: 89.6, short: 4.1, late: 2 },
        { m: '10 月', lots: 12, onTime: 88.4, short: 4.6, late: 2 }
      ],
      timeline: [
        { t: '09-20 16:48', title: '供应商建档', meta: 'Serein · 首票 ASN 到 LAX-01', state: 'done' },
        { t: '10-10 09:10', title: '验收异常挂起', meta: '短装 4 箱 + 破损 2 箱 · 待索赔', state: 'error' }
      ]
    },
    {
      id: 'SP-005', name: '苏州明达玩具', region: '江苏 · 苏州',
      contact: '吴晓', phone: '+86 512 6688 4402',
      cat: '玩具母婴',
      tenantId: 'TN-00115', tenantName: '苏州明达玩具',
      lots: 76, lotsM: 11, onTime: 96.2, shortRate: 1.1, badM: 0,
      lastIn: '10-10', since: '2024-06', settle: '月结 30 天',
      status: 'ok',
      note: '玩具类小件为主，海运整柜到 FRA-04；到货稳定，短装率低于 2% 门槛。',
      perf: [
        { m: '07 月', lots: 9, onTime: 96.0, short: 1.2, late: 0 },
        { m: '08 月', lots: 10, onTime: 96.8, short: 0.9, late: 0 },
        { m: '09 月', lots: 8, onTime: 95.5, short: 1.3, late: 1 },
        { m: '10 月', lots: 11, onTime: 96.4, short: 1.0, late: 0 }
      ],
      timeline: [
        { t: '06-11 11:30', title: '供应商建档', meta: '王运营 · 首票 ASN 到 FRA-04', state: 'done' },
        { t: '10-10 13:20', title: '最近到货', meta: 'ASN-20261010-0127 · 海运 264 箱', state: 'done' }
      ]
    },
    {
      id: 'SP-006', name: '中山灯饰照明', region: '广东 · 中山',
      contact: '郑明', phone: '+86 760 2233 7719',
      cat: '灯具照明',
      tenantId: 'TN-00123', tenantName: '中山灯饰照明',
      lots: 61, lotsM: 9, onTime: 93.8, shortRate: 2.2, badM: 1,
      lastIn: '10-09', since: '2025-04', settle: '月结 60 天',
      status: 'ok',
      note: '空运批次玻璃件易破损，已要求加强内衬包装；近 4 个月准时率有改善趋势。',
      perf: [
        { m: '07 月', lots: 8, onTime: 94.6, short: 2.0, late: 0 },
        { m: '08 月', lots: 7, onTime: 93.5, short: 2.4, late: 1 },
        { m: '09 月', lots: 6, onTime: 93.0, short: 2.6, late: 1 },
        { m: '10 月', lots: 9, onTime: 94.1, short: 1.9, late: 0 }
      ],
      timeline: [
        { t: '04-08 15:12', title: '供应商建档', meta: 'Serein · 首票 ASN 到 BHX-03', state: 'done' },
        { t: '10-11 22:00', title: '批次起飞', meta: 'CZ3017 · 预计 10-12 抵 BHX-03', state: 'active' }
      ]
    },
    {
      id: 'SP-007', name: '泉州鞋业外贸', region: '福建 · 泉州',
      contact: '林芳', phone: '+86 595 2255 8814',
      cat: '服饰鞋包',
      tenantId: 'TN-00102', tenantName: '泉州鞋业外贸',
      lots: 88, lotsM: 1, onTime: 84.6, shortRate: 5.3, badM: 0,
      lastIn: '10-09', since: '2023-05', settle: '月结 15 天',
      status: 'stop',
      note: '已于 10-10 停用：07–09 月短装率连续超 5%（4.8% / 5.6% / 5.9%）。在途 2 单已转由 SP-009 温州杰士鞋业 承接，历史批次仍按原档案追溯。',
      perf: [
        { m: '07 月', lots: 10, onTime: 86.2, short: 4.8, late: 2 },
        { m: '08 月', lots: 8, onTime: 84.0, short: 5.6, late: 2 },
        { m: '09 月', lots: 6, onTime: 83.5, short: 5.9, late: 2 },
        { m: '10 月', lots: 1, onTime: 100, short: 0, late: 0 }
      ],
      timeline: [
        { t: '05-09 09:05', title: '供应商建档', meta: '刘主管 · 首票 ASN 到 EWR-02', state: 'done' },
        { t: '10-09 13:40', title: '最后到货', meta: 'ASN-20261009-0119 · 890 箱 · EWR-02', state: 'done' },
        { t: '10-10 17:20', title: '停止供货', meta: '连续短装超 5% · 暂停新建 ASN', state: 'error' }
      ]
    },
    {
      id: 'SP-008', name: '广州美联塑胶制品', region: '广东 · 广州',
      contact: '梁楷', phone: '+86 20 3866 5120',
      cat: '塑胶制品',
      tenantId: 'TN-00041', tenantName: '深圳致远电子',
      lots: 43, lotsM: 8, onTime: 96.8, shortRate: 0.9, badM: 0,
      lastIn: '10-08', since: '2024-12', settle: '票结',
      status: 'ok',
      note: '发货方与货权方分离的典型：货物由广州美联塑胶制品发出，货权归深圳致远电子（TN-00041），验收合格后计入该货主台账。',
      perf: [
        { m: '07 月', lots: 6, onTime: 97.0, short: 0.8, late: 0 },
        { m: '08 月', lots: 7, onTime: 96.5, short: 1.0, late: 0 },
        { m: '09 月', lots: 5, onTime: 96.2, short: 1.1, late: 0 },
        { m: '10 月', lots: 8, onTime: 97.2, short: 0.7, late: 0 }
      ],
      timeline: [
        { t: '12-06 10:15', title: '供应商建档', meta: 'Serein · 代深圳致远电子发货', state: 'done' },
        { t: '10-08 11:40', title: '最近到货', meta: 'ASN-20261008-0115 · 海运 128 箱', state: 'done' }
      ]
    },
    {
      id: 'SP-009', name: '温州杰士鞋业', region: '浙江 · 温州',
      contact: '徐杰', phone: '+86 577 8866 2233',
      cat: '服饰鞋包',
      tenantId: 'TN-00102', tenantName: '泉州鞋业外贸',
      lots: 28, lotsM: 6, onTime: 90.2, shortRate: 3.5, badM: 1,
      lastIn: '10-07', since: '2025-08', settle: '月结 30 天',
      status: 'watch',
      note: '接替 SP-007 的鞋类货源，前两个月表现不稳，短装率高于 2% 门槛，暂列观察名单。',
      perf: [
        { m: '07 月', lots: 5, onTime: 91.0, short: 3.1, late: 0 },
        { m: '08 月', lots: 6, onTime: 90.5, short: 3.4, late: 0 },
        { m: '09 月', lots: 4, onTime: 89.6, short: 3.8, late: 1 },
        { m: '10 月', lots: 6, onTime: 89.8, short: 3.6, late: 1 }
      ],
      timeline: [
        { t: '08-05 09:20', title: '供应商建档', meta: '刘主管 · 鞋类备选货源', state: 'done' },
        { t: '10-07 15:05', title: '最近到货', meta: 'ASN-20261007-0108 · 海运 96 箱', state: 'done' }
      ]
    },
    {
      id: 'SP-010', name: '佛山电器照明', region: '广东 · 佛山',
      contact: '霍伟', phone: '+86 757 8288 4466',
      cat: '灯具照明 · 3C 电子',
      tenantId: 'TN-00123', tenantName: '中山灯饰照明',
      lots: 35, lotsM: 7, onTime: 94.9, shortRate: 1.7, badM: 1,
      lastIn: '10-09', since: '2025-06', settle: '月结 30 天',
      status: 'ok',
      note: '与 SP-006 同属灯饰类，发货方与货权方分离：货权归中山灯饰照明（TN-00123）。',
      perf: [
        { m: '07 月', lots: 5, onTime: 95.2, short: 1.5, late: 0 },
        { m: '08 月', lots: 6, onTime: 94.6, short: 1.8, late: 0 },
        { m: '09 月', lots: 4, onTime: 94.0, short: 2.0, late: 0 },
        { m: '10 月', lots: 7, onTime: 95.4, short: 1.4, late: 0 }
      ],
      timeline: [
        { t: '06-10 11:00', title: '供应商建档', meta: 'Serein · 灯饰类第二货源', state: 'done' },
        { t: '10-09 10:30', title: '最近到货', meta: 'ASN-20261009-0116 · 空运 62 箱', state: 'done' }
      ]
    }
  ];

  /* 已存在（localStorage 还原）则按 id 合并，绝不整表覆盖 */
  SEED.forEach(function (s) {
    if (!WMS.find('supplier', s.id)) { WMS.DB.supplier.push(s); }
  });

  /* ================= 2. 状态 → 徽章 ================= */
  WMS.STATUS_BY.supplier = {
    ok:    { cls: 'b-done',  text: '合作中' },
    watch: { cls: 'b-wait',  text: '观察' },
    stop:  { cls: 'b-err',   text: '已停用' }
  };
  /* Tab 计数 / 反馈文案用的中文名（与上面 text 严格一致，才能被 Tab 过滤命中） */
  WMS.STATUS_TEXT.supplier = {
    ok:    '合作中',
    watch: '观察',
    stop:  '已停用'
  };

  /* ================= 3. 表格行渲染 ================= */
  WMS.RENDER.supplier = function (r) {
    var otCls = r.onTime >= 95 ? 'ok' : (r.onTime >= 90 ? 'warn' : 'bad');
    var srCls = r.shortRate >= 3 ? 'text-danger' : (r.shortRate >= 1.5 ? 'text-warning' : '');
    var perf = r.lots > 0
      ? WMS.bar(r.onTime, otCls)
      : '<span class="hint">尚无到货</span>';
    var short = r.lots > 0
      ? '<span class="' + srCls + '">' + r.shortRate + '%</span>'
      : '<span class="hint">—</span>';
    return '<tr data-id="' + r.id + '">' +
      '<td><button class="td-link td-num td-strong" type="button" data-drawer="supplier:' + r.id + '">' + r.id + '</button></td>' +
      '<td class="td-strong">' + WMS.esc(r.name) + '</td>' +
      '<td>' + WMS.esc(r.contact) + ' <span class="hint">' + WMS.esc(r.phone) + '</span></td>' +
      '<td>' + WMS.esc(r.cat) + '</td>' +
      '<td>' + WMS.esc(r.tenantName) + ' <span class="hint num">' + WMS.esc(r.tenantId) + '</span></td>' +
      '<td class="td-num">' + WMS.num(r.lots) + '</td>' +
      '<td>' + perf + '</td>' +
      '<td class="td-num">' + short + '</td>' +
      '<td>' + WMS.statusText('supplier', r.status) + '</td>' +
      '<td class="td-ops">' + WMS.ops('supplier', r) + '</td>' +
    '</tr>';
  };

  /* ================= 4. 行内操作按钮 ================= */
  WMS.OPS.supplier = [
    { k: 'view', t: '档案', on: ['ok', 'watch', 'stop'] },
    { k: 'perf', t: '绩效', on: ['ok', 'watch'] },
    { k: 'stop', t: '停用', on: ['ok'], danger: true }
  ];

  /* ================= 5. 动作 ================= */
  WMS.ACTIONS.supplier = {
    /* 档案：打开详情抽屉 */
    view: function (r) {
      WMS.openDrawer('supplier:' + r.id);
      return { msg: null };
    },

    /* 绩效：近 4 个月到货明细 */
    perf: function (r) {
      var rows = (r.perf || []).map(function (p) {
        return [
          p.m,
          p.lots ? String(p.lots) : '0',
          p.lots ? p.onTime + '%' : '—',
          p.lots ? p.short + '%' : '—',
          p.lots ? p.late + ' 批' : '—'
        ];
      });
      if (!rows.length) {
        rows = [['10 月', '0', '—', '—', '尚无到货记录']];
      }
      WMS.listModal(
        '到货绩效 · ' + r.name,
        ['月份', '到货批次', '准时到货率', '短装率', '超时批次'],
        rows,
        '目标：准时到货率 ≥ 95%、短装率 ≤ 2%。汇总 ' + r.id + '：累计 ' + WMS.num(r.lots) +
        ' 批次、准时 ' + r.onTime + '%、短装 ' + r.shortRate + '%。以上为近 4 个月明细（演示数据）。'
      );
      return { msg: null };
    },

    /* 停用：表单确认后改写状态，不再接收新 ASN */
    stop: function (r) {
      WMS.formModal({
        title: '停用供应商 · ' + r.name,
        desc: r.id + ' 当前准时到货率 ' + r.onTime + '% · 累计到货 ' + WMS.num(r.lots) +
              ' 批次。停用后不再从该供应商创建 ASN，历史批次仍可追溯。',
        ok: '确认停用',
        danger: true,
        fields: [
          { k: 'reason', label: '停用原因', type: 'select', required: true,
            options: ['质量不稳', '短装破损频发', '到货不及时', '价格调整', '业务调整', '其他'],
            value: '短装破损频发' },
          { k: 'memo', label: '备注', type: 'textarea', span: true, placeholder: '选填，将记入审计日志' }
        ],
        onSubmit: function (v) {
          r.status = 'stop';
          r.note = '已于 ' + WMS.now() + ' 停用：' + v.reason + (v.memo ? ' · ' + v.memo : '');
          WMS.push(r, '供应商已停用', v.reason + ' · 暂停新建 ASN', 'error');
          WMS.save();
          WMS.renderAll();
          return { msg: r.id + ' ' + r.name + ' 已停用 · 不再接收新 ASN' };
        }
      });
      return { msg: null };
    },

    /* 新建：工具栏「新建供应商」（data-action="supplier:*:create"） */
    create: function () {
      var tenants = (WMS.DB.tenant || []).map(function (t) { return t.name; });
      WMS.formModal({
        title: '新建供应商',
        desc: '供应商是国内发货方（ASN 的 supplier 字段），可与货主是同一家公司，也可以只替货主发货。',
        ok: '创建供应商',
        fields: [
          { k: 'name', label: '供应商名称', required: true, placeholder: '如 广州美联塑胶制品',
            help: '国内发货方，货从谁那里发出' },
          { k: 'contact', label: '联系人', required: true },
          { k: 'phone', label: '联系电话', required: true, placeholder: '+86 xxx xxxx xxxx' },
          { k: 'cat', label: '主要供货品类', type: 'select', required: true,
            options: ['3C 电子', '家居日用', '五金工具', '服饰鞋包', '灯具照明', '玩具母婴', '运动户外', '塑胶制品'] },
          { k: 'tenantName', label: '供货货主', type: 'select', required: true,
            options: tenants.length ? tenants : ['深圳致远电子'], value: '深圳致远电子',
            help: '货权方：验收合格后库存计入该货主台账' },
          { k: 'region', label: '注册地', placeholder: '如 广东 · 广州' },
          { k: 'settle', label: '结算方式', type: 'select',
            options: ['月结 30 天', '月结 60 天', '周结', '票结'], value: '月结 30 天' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('SP-0', 'supplier');
          var t = null;
          (WMS.DB.tenant || []).forEach(function (x) { if (x.name === v.tenantName) { t = x; } });
          WMS.DB.supplier.unshift({
            id: id,
            name: v.name,
            region: v.region || '—',
            contact: v.contact,
            phone: v.phone,
            cat: v.cat,
            tenantId: t ? t.id : '—',
            tenantName: v.tenantName,
            lots: 0, lotsM: 0, onTime: 0, shortRate: 0, badM: 0,
            lastIn: '—', since: '2026-10', settle: v.settle,
            status: 'ok',
            note: '新建供应商 ' + WMS.now() + ' · 尚无到货记录，绩效将在首批 ASN 验收后按实际数据统计。',
            perf: [],
            timeline: [
              { t: WMS.now(), title: '供应商建档', meta: 'Serein · ' + v.cat, state: 'active' },
              { t: '—', title: '首批到货', meta: '待创建 ASN 后归集', state: 'pending' }
            ]
          });
          WMS.save();
          WMS.renderAll();
          return {
            msg: null,
            modal: { title: '供应商已创建', desc: '供货货主：' + v.tenantName + ' · 尚无到货记录', id: id }
          };
        }
      });
      return { msg: null };
    }
  };

  /* ================= 6. 抽屉扩展 ================= */
  WMS.TITLE_EXTRA.supplier = function (r) {
    return '供应商 · ' + WMS.esc(r.name) + '（' + WMS.esc(r.region) + '）';
  };

  WMS.FIELDS_EXTRA.supplier = function (r, add) {
    add('供应商编码', r.id);
    add('注册地', WMS.esc(r.region));
    add('联系人', WMS.esc(r.contact) + ' · ' + WMS.esc(r.phone));
    add('主要供货品类', WMS.esc(r.cat));
    add('供货货主', WMS.esc(r.tenantName) + ' <span class="hint num">' + WMS.esc(r.tenantId) + '</span>');
    add('累计到货批次', WMS.num(r.lots) + ' 批');
    add('本月到货批次', WMS.num(r.lotsM) + ' 批');
    add('准时到货率', r.onTime + '%');
    add('短装率', r.shortRate + '%');
    add('本月短装 / 破损', WMS.num(r.badM) + ' 批');
    add('最近到货', WMS.esc(r.lastIn));
    add('合作起始', WMS.esc(r.since));
    add('结算方式', WMS.esc(r.settle));
  };

  WMS.LINES_EXTRA.supplier = function (r) {
    var h = '';

    /* 近期到货批次：取自在库 ASN 数据，按供应商名归集 */
    var asns = (WMS.DB.asn || []).filter(function (a) { return a.supplier === r.name; });
    h += '<section class="drawer-sec"><h3>近期到货批次 · ' + asns.length + ' 单</h3>';
    if (asns.length) {
      h += '<div class="table-wrap"><table><thead><tr>' +
        '<th scope="col">ASN</th><th scope="col">货主</th><th scope="col">仓库</th>' +
        '<th scope="col">箱数</th><th scope="col">ETA</th><th scope="col">状态</th>' +
        '</tr></thead><tbody>';
      asns.forEach(function (a) {
        h += '<tr><td class="td-num">' + WMS.short(a.id) + '</td>' +
          '<td>' + WMS.esc(a.tenant) + '</td>' +
          '<td class="td-num">' + WMS.esc(a.wh) + '</td>' +
          '<td class="td-num">' + WMS.num(a.box) + '</td>' +
          '<td class="td-num">' + WMS.esc(a.eta) + '</td>' +
          '<td>' + WMS.statusText('asn', a.status) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    } else {
      h += '<div class="note-box info">当前 ASN 池中没有该供应商的在册单（演示数据只保留 7 张近期入库单），历史到货见上方绩效汇总。</div>';
    }
    h += '</section>';

    /* 绩效 bullet：近 4 个月准时到货率 vs 目标 95% */
    h += '<section class="drawer-sec"><h3>准时到货率 · 近 4 个月</h3>';
    (r.perf || []).forEach(function (p) {
      var has = p.lots > 0;
      var ok = has && p.onTime >= 95;
      h += '<div class="bullet-item"><div class="bullet-top">' +
        '<span class="bullet-name">' + WMS.esc(p.m) + '</span>' +
        '<span class="bullet-code num">' + (has ? p.lots + ' 批' : '无到货') + '</span>' +
        '<span class="bullet-pct' + (has ? (ok ? '' : ' text-warning') : '') + '">' +
          (has ? p.onTime + '%' : '—') + '</span>' +
        '</div>' +
        '<div class="bullet-track" role="img" aria-label="' + WMS.esc(p.m) + ' 准时到货率 ' +
          (has ? p.onTime + '%' : '无到货') + (ok ? '，达标' : '，未达标') + '，目标 95%">' +
          '<span class="bullet-zone z-bad" style="width:90%"></span>' +
          '<span class="bullet-zone z-mid" style="left:90%;width:5%"></span>' +
          '<span class="bullet-zone z-good" style="left:95%;width:5%"></span>' +
          (has ? '<span class="bullet-measure" style="width:' + p.onTime + '%"></span>' : '') +
          '<span class="bullet-target" style="left:95%"></span>' +
        '</div></div>';
    });
    h += '<p class="bullet-legend">' +
      '<span><i style="background:var(--range-bad)"></i>&lt;90% 未达标</span>' +
      '<span><i style="background:var(--range-mid)"></i>90–95% 接近</span>' +
      '<span><i style="background:var(--range-good)"></i>≥95% 达标</span>' +
      '<span><i style="background:var(--color-foreground);width:3px;height:12px;border-radius:0"></i>目标 95%</span>' +
      '</p></section>';

    /* 与货主的关系：同一主体 or 货货分离 */
    var same = r.name === r.tenantName;
    h += '<section class="drawer-sec"><h3>与货主的关系</h3>' +
      '<div class="note-box' + (same ? '' : ' info') + '">' +
      (same
        ? '本供应商与货主为同一主体：既负责国内发货，也拥有货权，库存与账目均记在 ' +
          WMS.esc(r.tenantName) + '（' + WMS.esc(r.tenantId) + '）名下。'
        : '发货方与货权方分离：货物由 ' + WMS.esc(r.name) + ' 发出，货权归 ' +
          WMS.esc(r.tenantName) + '（' + WMS.esc(r.tenantId) + '），验收合格后计入该货主台账，' +
          '仓储费与操作费也按货主记账。') +
      '</div></section>';

    return h;
  };

  /* ================= 7. 首屏渲染 ================= */
  WMS.renderAll();
})();
