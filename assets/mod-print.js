/* ============================================================
   海外仓 WMS · 打印中心模块 (mod-print)
   挂在引擎之后加载，只做增量注册，不改引擎与既有页面：
     · 种子数据      WMS.DB.printJob / WMS.DB.printer
     · 状态字典      WMS.STATUS_BY / WMS.STATUS_TEXT
     · 行渲染        WMS.RENDER.printJob / printer
     · 行内操作      WMS.OPS.printJob / printer
     · 动作          WMS.ACTIONS.printJob / printer
     · 抽屉扩展      WMS.TITLE_EXTRA / FIELDS_EXTRA / LINES_EXTRA
   所有业务数字均为演示数据。
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ----------------------------------------------------------
     1. 种子数据（localStorage 为空时注入；有存档则保留用户操作结果）
     ---------------------------------------------------------- */
  WMS.DB.printJob = WMS.DB.printJob || [
    {
      id: 'PJ-20261011-0441', tpl: '箱唛', src: 'ASN-20261011-0142', doc: 'ASN',
      tenant: '深圳致远电子', tenantId: 'TN-00041', wh: 'LAX-01',
      copies: 320, printer: 'LP-LAX-01', by: '陈工', t: '10-11 14:32', attempts: 1,
      status: 'done', note: '320 张箱唛已打印并贴附于对应箱号，收货扫码可直接核对。',
      timeline: [
        { t: '10-11 14:30', title: '任务已提交', meta: '箱唛 · 320 份 · 提交人 陈工', state: 'done' },
        { t: '10-11 14:32', title: '打印完成', meta: 'LP-LAX-01 · 320 张 · 首张校验通过', state: 'done' }
      ]
    },
    {
      id: 'PJ-20261011-0442', tpl: '尾程面单', src: 'OUT-20261011-3572', doc: 'OUT',
      tenant: '安克创新科技', tenantId: 'TN-00073', wh: 'LAX-01',
      copies: 6, printer: 'LP-LAX-02', by: '赵小雨', t: '10-11 14:35', attempts: 1,
      status: 'printing', note: 'UPS 1Z884…4207 面单正在输出，完成后随包裹交接。',
      timeline: [
        { t: '10-11 14:34', title: '任务已提交', meta: '尾程面单 · 6 份 · UPS Ground', state: 'done' },
        { t: '10-11 14:35', title: '打印中', meta: 'LP-LAX-02 · 已输出 4 / 6 张', state: 'active' }
      ]
    },
    {
      id: 'PJ-20261011-0443', tpl: '拣货单', src: 'W-20261011-007', doc: 'WAVE',
      tenant: '深圳致远电子', tenantId: 'TN-00041', wh: 'LAX-01',
      copies: 42, printer: 'LP-LAX-01', by: '刘主管', t: '10-11 14:10', attempts: 2,
      status: 'failed', note: '打印机 LP-LAX-01 碳带耗尽，已自动重试 2 次仍失败，转异常工单 GD-20261011-0451。',
      timeline: [
        { t: '10-11 14:08', title: '任务已提交', meta: '拣货单 · 42 份 · 波次 W-20261011-007', state: 'done' },
        { t: '10-11 14:09', title: '打印失败', meta: '碳带耗尽 · 自动重试 1 / 2', state: 'error' },
        { t: '10-11 14:10', title: '打印失败', meta: '碳带仍耗尽 · 自动重试 2 / 2 用尽', state: 'error' },
        { t: '10-11 14:10', title: '转异常工单', meta: 'GD-20261011-0451 · 待人工重打', state: 'active' }
      ]
    },
    {
      id: 'PJ-20261011-0444', tpl: '商品条码标签', src: 'RTN-20261011-0181', doc: 'RTN',
      tenant: '东莞精工五金', tenantId: 'TN-00108', wh: 'LAX-01',
      copies: 12, printer: 'LP-LAX-01', by: '陈工', t: '10-11 14:02', attempts: 1,
      status: 'queued', note: '换标 12 件，新 FNSKU X002ABCD 标签待打印后重新入仓。',
      timeline: [
        { t: '10-11 14:00', title: '任务已提交', meta: '商品条码标签 · 12 份 · 换标', state: 'done' },
        { t: '10-11 14:02', title: '排队中', meta: '等待 LP-LAX-01 空闲 · 前面还有 1 个任务', state: 'active' }
      ]
    },
    {
      id: 'PJ-20261011-0445', tpl: 'FBA 箱唛', src: 'OUT-20261011-3549', doc: 'OUT',
      tenant: '深圳致远电子', tenantId: 'TN-00041', wh: 'EWR-02',
      copies: 24, printer: 'LP-EWR-01', by: '王大力', t: '10-11 13:26', attempts: 1,
      status: 'done', note: 'FBA 补货 24 件箱唛已打印，随托盘交接 UPS。',
      timeline: [
        { t: '10-11 13:24', title: '任务已提交', meta: 'FBA 箱唛 · 24 份 · Shipment FBA15K2M9', state: 'done' },
        { t: '10-11 13:26', title: '打印完成', meta: 'LP-EWR-01 · 24 张', state: 'done' }
      ]
    },
    {
      id: 'PJ-20261011-0446', tpl: '尾程面单', src: 'OUT-20261011-3568', doc: 'OUT',
      tenant: '苏州明达玩具', tenantId: 'TN-00115', wh: 'BHX-03',
      copies: 11, printer: 'LP-BHX-01', by: '钱大力', t: '10-11 13:04', attempts: 1,
      status: 'done', note: 'DHL JD01…5580 面单 11 张已打印，19:30 夜间航班交接。',
      timeline: [
        { t: '10-11 13:02', title: '任务已提交', meta: '尾程面单 · 11 份 · DHL Paket', state: 'done' },
        { t: '10-11 13:04', title: '打印完成', meta: 'LP-BHX-01 · 11 张', state: 'done' }
      ]
    },
    {
      id: 'PJ-20261011-0447', tpl: '发票', src: 'INV-202610-0041', doc: 'BILL',
      tenant: '深圳致远电子', tenantId: 'TN-00041', wh: 'LAX-01',
      copies: 1, printer: 'LP-LAX-02', by: '陈工', t: '10-11 12:58', attempts: 1,
      status: 'printing', note: '10 月仓储服务费发票 $32,480，A4 打印后推送货主确认。',
      timeline: [
        { t: '10-11 12:56', title: '任务已提交', meta: '发票 · 1 份 · 账期 2026-10', state: 'done' },
        { t: '10-11 12:58', title: '打印中', meta: 'LP-LAX-02 · A4 · 单页', state: 'active' }
      ]
    },
    {
      id: 'PJ-20261011-0448', tpl: '尾程面单', src: 'OUT-20261011-3533', doc: 'OUT',
      tenant: '中山灯饰照明', tenantId: 'TN-00123', wh: 'FRA-04',
      copies: 8, printer: 'LP-FRA-01', by: '王运营', t: '10-11 12:41', attempts: 3,
      status: 'failed', note: '打印机 LP-FRA-01 离线（网络中断），已重试 2 次仍失败，转异常工单 GD-20261011-0448。',
      timeline: [
        { t: '10-11 12:38', title: '任务已提交', meta: '尾程面单 · 8 份 · DHL Paket', state: 'done' },
        { t: '10-11 12:39', title: '打印失败', meta: '设备离线 · 自动重试 1 / 2', state: 'error' },
        { t: '10-11 12:41', title: '打印失败', meta: '设备仍离线 · 自动重试 2 / 2 用尽', state: 'error' }
      ]
    },
    {
      id: 'PJ-20261011-0449', tpl: '箱唛', src: 'ASN-20261011-0138', doc: 'ASN',
      tenant: '东莞精工五金', tenantId: 'TN-00108', wh: 'BHX-03',
      copies: 542, printer: 'LP-BHX-01', by: '刘主管', t: '10-11 11:52', attempts: 1,
      status: 'done', note: '中欧班列 542 箱箱唛已打印，按箱序贴附后进入上架。',
      timeline: [
        { t: '10-11 11:50', title: '任务已提交', meta: '箱唛 · 542 份 · 铁运入库', state: 'done' },
        { t: '10-11 11:52', title: '打印完成', meta: 'LP-BHX-01 · 542 张 · 分 2 批输出', state: 'done' }
      ]
    },
    {
      id: 'PJ-20261011-0450', tpl: '拣货单', src: 'W-20261011-006', doc: 'WAVE',
      tenant: '中山灯饰照明', tenantId: 'TN-00123', wh: 'EWR-02',
      copies: 31, printer: 'LP-EWR-01', by: '刘主管', t: '10-11 11:20', attempts: 1,
      status: 'queued', note: '波次 W-20261011-006 拣货单 31 份，等 LP-EWR-01 空闲后输出。',
      timeline: [
        { t: '10-11 11:18', title: '任务已提交', meta: '拣货单 · 31 份 · 波次 W-20261011-006', state: 'done' },
        { t: '10-11 11:20', title: '排队中', meta: '等待 LP-EWR-01 空闲', state: 'active' }
      ]
    }
  ];

  /* 打印设备：纸张余量 < 20% 即判缺纸并停用该设备 */
  WMS.DB.printer = WMS.DB.printer || [
    {
      id: 'LP-LAX-01', wh: 'LAX-01', type: '标签打印机', paper: 78, today: 3420,
      status: 'online', cur: 'PJ-20261011-0441 · 箱唛',
      note: '4×6 热敏标签，210 张/卷，当前余量约 2 卷。碳带曾于 10-11 14:09 耗尽，已更换。'
    },
    {
      id: 'LP-LAX-02', wh: 'LAX-01', type: '面单打印机', paper: 46, today: 1180,
      status: 'busy', cur: 'PJ-20261011-0442 · 尾程面单',
      note: '面单与 A4 双模，尾程面单走 4×6 热敏，发票走 A4 进纸盒。'
    },
    {
      id: 'LP-EWR-01', wh: 'EWR-02', type: '标签打印机', paper: 62, today: 2040,
      status: 'online', cur: 'PJ-20261011-0450 · 拣货单',
      note: '兼顾面单与 A4，EWR-02 唯一打印设备，建议增补一台热备份。'
    },
    {
      id: 'LP-BHX-01', wh: 'BHX-03', type: '面单打印机', paper: 14, today: 2960,
      status: 'paper', cur: '缺纸停用 · 待更换纸卷',
      note: '余量 14% 已低于 20% 阈值，设备停用并推送补纸提醒；等在途 2 个任务转 LP-EWR-01。'
    },
    {
      id: 'LP-FRA-01', wh: 'FRA-04', type: '面单打印机', paper: 88, today: 640,
      status: 'offline', cur: '网络中断 · 20 分钟无心跳',
      note: '10-11 12:21 起离线，已通知 IT；2 个失败任务待设备恢复后重打。'
    }
  ];

  /* ----------------------------------------------------------
     2. 状态字典（徽章文字与 Tab 文案必须一致）
     ---------------------------------------------------------- */
  WMS.STATUS_BY.printJob = {
    queued:   { cls: 'b-wait', text: '排队中' },
    printing: { cls: 'b-ing',  text: '打印中' },
    done:     { cls: 'b-done', text: '已完成' },
    failed:   { cls: 'b-err',  text: '失败' }
  };
  WMS.STATUS_BY.printer = {
    online:  { cls: 'b-done', text: '在线' },
    busy:    { cls: 'b-ing',  text: '繁忙' },
    offline: { cls: 'b-err',  text: '离线' },
    paper:   { cls: 'b-wait', text: '缺纸' }
  };
  /* Tab 计数依赖 statusTextOf：与上面文字保持一致 */
  WMS.STATUS_TEXT.printJob = { queued: '排队中', printing: '打印中', done: '已完成', failed: '失败' };
  WMS.STATUS_TEXT.printer = { online: '在线', busy: '繁忙', offline: '离线', paper: '缺纸' };

  /* 打印模板字段查表（LINES_EXTRA 打印内容预览用） */
  var TPL_FIELD = {
    '箱唛': [
      ['仓码', 'LAX-01'],
      ['ASN 号', 'ASN-20261011-0142'],
      ['箱序 / 总箱数', '218 / 320'],
      ['货主', '深圳致远电子 TN-00041'],
      ['SKU', 'SKU-88231 · SKU-33478'],
      ['数量', '120 件 / 86 件'],
      ['批次', 'B2604-0912 · B2604-0915']
    ],
    '尾程面单': [
      ['运单号', '1Z884…4207'],
      ['收发件人', 'Marcus T. · 深圳致远电子'],
      ['重量', '4.2 kg（实称）'],
      ['服务类型', 'UPS Ground'],
      ['面单账号', 'UPS-AC-01']
    ],
    '拣货单': [
      ['库位', 'A-03-12 · A-01-04'],
      ['SKU', 'SKU-88231'],
      ['品名', '便携式榨汁杯 450ml'],
      ['数量', '12 件'],
      ['货主', '深圳致远电子 TN-00041'],
      ['批次', 'B2604-0912'],
      ['拣货人', '王大力'],
      ['波次', 'W-20261011-007']
    ],
    '商品条码标签': [
      ['SKU', 'SKU-56012'],
      ['品名', 'LED 感应夜灯 磁吸款'],
      ['条码', '6923451789012'],
      ['库位', 'F-01-01'],
      ['FNSKU', 'X002ABCD'],
      ['批次', 'B2604-0831']
    ],
    'FBA 箱唛': [
      ['Shipment ID', 'FBA15K2M9'],
      ['箱序 / 总箱数', '1 / 24'],
      ['FBA 仓编码', 'FTW1'],
      ['FNSKU', 'X002ABCD']
    ],
    '发票': [
      ['账单号', 'INV-202610-0041'],
      ['货主', '深圳致远电子 TN-00041'],
      ['账期', '2026-10'],
      ['明细笔数', '214 笔'],
      ['金额', '$32,480'],
      ['税率', '0%（退税）'],
      ['备注', '月结 30 天 · 已推送货主确认']
    ]
  };

  /* ----------------------------------------------------------
     3. 行渲染
     ---------------------------------------------------------- */
  WMS.RENDER.printJob = function (r) {
    var attCls = (r.attempts >= 2 || r.status === 'failed') ? 'td-num text-danger td-strong' : 'td-num';
    var docTag = r.doc === 'ASN' ? 'ASN' : (r.doc === 'OUT' ? '出库单' :
                  (r.doc === 'WAVE' ? '波次' : (r.doc === 'RTN' ? '退件' : '账单')));
    return '<tr data-id="' + r.id + '">' +
      '<td><button class="td-link td-num td-strong" type="button" data-drawer="printJob:' + r.id + '">' + r.id + '</button></td>' +
      '<td>' + WMS.esc(r.tpl) + '</td>' +
      '<td class="td-num">' + docTag + ' ' + WMS.short(r.src) + '</td>' +
      '<td class="td-strong">' + WMS.esc(r.tenant) + ' <span class="hint num">' + WMS.esc(r.tenantId) + '</span></td>' +
      '<td class="td-num">' + r.wh + '</td>' +
      '<td class="td-num">' + WMS.num(r.copies) + '</td>' +
      '<td class="td-num">' + WMS.esc(r.printer) + '</td>' +
      '<td>' + WMS.esc(r.by) + '</td>' +
      '<td class="td-num">' + r.t + '</td>' +
      '<td class="' + attCls + '">' + r.attempts + '</td>' +
      '<td>' + WMS.statusText('printJob', r.status) + '</td>' +
      '<td class="td-ops">' + WMS.ops('printJob', r) + '</td>' +
    '</tr>';
  };

  WMS.RENDER.printer = function (r) {
    var lowPaper = r.paper < 20;
    var barCls = lowPaper ? 'warn' : 'ok';
    var whName = (WMS.find('wh', r.wh) || {}).name || r.wh;
    return '<tr data-id="' + r.id + '">' +
      '<td><button class="td-link td-num td-strong" type="button" data-drawer="printer:' + r.id + '">' + r.id + '</button></td>' +
      '<td>' + WMS.esc(whName) + ' <span class="hint num">' + r.wh + '</span></td>' +
      '<td>' + WMS.esc(r.type) + '</td>' +
      '<td>' + WMS.bar(r.paper, barCls) + (lowPaper ? ' <span class="hint text-warning">余量不足</span>' : '') + '</td>' +
      '<td class="td-num">' + WMS.num(r.today) + '</td>' +
      '<td>' + WMS.esc(r.cur) + '</td>' +
      '<td>' + WMS.statusText('printer', r.status) + '</td>' +
      '<td class="td-ops">' + WMS.ops('printer', r) + '</td>' +
    '</tr>';
  };

  /* ----------------------------------------------------------
     4. 行内操作按钮
     ---------------------------------------------------------- */
  WMS.OPS.printJob = [
    { k: 'view',    t: '详情', on: ['queued', 'printing', 'done', 'failed'] },
    { k: 'retry',   t: '重打', on: ['failed'], danger: true },
    { k: 'reprint', t: '补打', on: ['done'] },
    { k: 'cancel',  t: '取消', on: ['queued'], danger: true }
  ];
  WMS.OPS.printer = [
    { k: 'view', t: '状态', on: ['online', 'busy', 'offline', 'paper'] },
    { k: 'test', t: '测试打印', on: ['online', 'busy'] }
  ];

  /* ----------------------------------------------------------
     5. 抽屉扩展注册
     ---------------------------------------------------------- */
  WMS.TITLE_EXTRA.printJob = function (r) {
    return '打印任务 · ' + r.tpl + ' · ' + r.tenant;
  };
  WMS.TITLE_EXTRA.printer = function (r) {
    return '打印设备 · ' + r.type + ' · ' + r.wh;
  };

  WMS.FIELDS_EXTRA.printJob = function (r, add) {
    add('模板类型', WMS.esc(r.tpl));
    add('关联单据', r.doc === 'ASN' ? 'ASN ' : (r.doc === 'OUT' ? '出库单 ' :
        (r.doc === 'WAVE' ? '波次 ' : (r.doc === 'RTN' ? '退件 ' : '账单 '))) + WMS.esc(r.src));
    add('货主', WMS.esc(r.tenant) + ' <span class="hint num">' + WMS.esc(r.tenantId) + '</span>');
    add('作业仓', r.wh);
    add('份数', WMS.num(r.copies) + ' 份');
    add('目标打印机', WMS.esc(r.printer));
    add('提交人', WMS.esc(r.by) + ' · ' + WMS.esc(r.t));
    add('尝试次数', r.attempts + ' 次' + (r.attempts >= 2 ? '（已达自动重试上限）' : ''));
  };

  WMS.FIELDS_EXTRA.printer = function (r, add) {
    add('设备编码', r.id);
    add('位置仓库', r.wh);
    add('设备类型', WMS.esc(r.type));
    add('纸张余量', r.paper + '%' + (r.paper < 20 ? '（低于 20% 阈值）' : ''));
    add('今日打印量', WMS.num(r.today) + ' 张');
    add('当前任务', WMS.esc(r.cur));
  };

  /* 打印内容预览：按模板字段清单渲染，供抽屉“打印内容预览”小节使用 */
  WMS.LINES_EXTRA.printJob = function (r) {
    var list = TPL_FIELD[r.tpl] || [];
    if (!list.length) return '';
    var h = '<section class="drawer-sec"><h3>打印内容预览 · ' + WMS.esc(r.tpl) + ' · ' + WMS.num(r.copies) + ' 份</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">字段</th><th scope="col">内容</th></tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      h += '<tr><td>' + WMS.esc(list[i][0]) + '</td><td class="td-num">' + WMS.esc(list[i][1]) + '</td></tr>';
    }
    h += '</tbody></table></div>' +
      '<div class="note-box info" style="margin-top:10px">字段构成由模板维护：尺寸与目标设备不匹配时会被判「标签格式不匹配」；补打会新建任务并留痕，原任务状态不变。</div>' +
      '</section>';
    return h;
  };

  WMS.LINES_EXTRA.printer = function (r) {
    var jobs = (WMS.DB.printJob || []).filter(function (j) { return j.printer === r.id; });
    var h = '<section class="drawer-sec"><h3>设备任务队列 · ' + jobs.length + ' 项</h3>';
    if (!jobs.length) {
      h += '<div class="note-box info">当前没有指向该设备的打印任务。</div></section>';
      return h;
    }
    h += '<div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">任务号</th><th scope="col">模板</th><th scope="col">份数</th><th scope="col">状态</th></tr></thead><tbody>';
    jobs.forEach(function (j) {
      h += '<tr><td class="td-num">' + WMS.esc(j.id) + '</td><td>' + WMS.esc(j.tpl) +
           '</td><td class="td-num">' + WMS.num(j.copies) + '</td><td>' +
           WMS.statusText('printJob', j.status) + '</td></tr>';
    });
    return h + '</tbody></table></div></section>';
  };

  /* ----------------------------------------------------------
     6. 动作
     ---------------------------------------------------------- */
  WMS.ACTIONS.printJob = {
    view: function (r) { WMS.openDrawer('printJob:' + r.id); return { msg: null }; },
    /* 重打：改旧任务状态（printing → done），attempts +1 */
    retry: function (r) {
      r.attempts = (r.attempts || 0) + 1;
      r.status = 'printing';
      WMS.push(r, '重打中', '第 ' + r.attempts + ' 次尝试 · ' + WMS.esc(r.printer), 'active');
      WMS.toast(r.id + ' 已重打 · 第 ' + r.attempts + ' 次', 'success');
      setTimeout(function () {
        r.status = 'done';
        r.note = '第 ' + r.attempts + ' 次重打成功，' + WMS.num(r.copies) + ' 份已输出至 ' + WMS.esc(r.printer) + '。';
        WMS.push(r, '重打完成', WMS.num(r.copies) + ' 份 · ' + WMS.esc(r.printer), 'done');
        WMS.save(); WMS.renderAll();
        WMS.toast(r.id + ' 重打完成 · ' + WMS.num(r.copies) + ' 份', 'success');
      }, 900);
      return { msg: null };
    },
    /* 补打：不改旧任务，另建一条新任务（nextId），原任务状态保持不变 */
    reprint: function (r) {
      var id = WMS.nextId('PJ-20261011-', 'printJob');
      var created = {
        id: id, tpl: r.tpl, src: r.src, doc: r.doc, tenant: r.tenant, tenantId: r.tenantId,
        wh: r.wh, copies: r.copies, printer: r.printer, by: r.by, t: WMS.now(),
        attempts: 0, status: 'queued',
        note: '由 ' + r.id + ' 补打生成，原任务状态保持不变；补打记录计入审计日志。',
        timeline: [
          { t: WMS.now(), title: '补打任务已创建', meta: '来源 ' + r.id + ' · ' + r.tpl + ' · ' + WMS.num(r.copies) + ' 份', state: 'done' },
          { t: WMS.now(), title: '排队中', meta: '等待 ' + WMS.esc(r.printer) + ' 空闲', state: 'active' }
        ]
      };
      WMS.DB.printJob.unshift(created);
      WMS.save();
      WMS.renderAll();
      WMS.resultModal({
        title: '补打任务已创建',
        desc: '来源 ' + r.id + ' · ' + r.tpl + ' · ' + WMS.num(r.copies) + ' 份；原任务状态不变，补打已计入审计日志。',
        id: id,
        ok: '知道了'
      });
      return { msg: null };
    },
    cancel: function (r) {
      var i = WMS.DB.printJob.indexOf(r);
      if (i > -1) WMS.DB.printJob.splice(i, 1);
      return { msg: r.id + ' 已取消并移出打印队列' };
    },
    /* 工具栏「重打全部失败」：data-action="printJob:*:retryAll" */
    retryAll: function (r, ctx) {
      var pool = (WMS.DB.printJob || []).filter(function (j) { return j.status === 'failed'; });
      if (!pool.length) return { msg: '当前没有失败的打印任务', type: 'warn' };
      pool.forEach(function (j) {
        j.attempts = (j.attempts || 0) + 1;
        j.status = 'printing';
        WMS.push(j, '批量重打中', '第 ' + j.attempts + ' 次尝试 · ' + WMS.esc(j.printer), 'active');
      });
      WMS.toast('已重打 ' + pool.length + ' 个失败任务', 'success');
      setTimeout(function () {
        pool.forEach(function (j) {
          j.status = 'done';
          j.note = '批量重打成功，' + WMS.num(j.copies) + ' 份已输出至 ' + WMS.esc(j.printer) + '。';
          WMS.push(j, '批量重打完成', WMS.num(j.copies) + ' 份 · ' + WMS.esc(j.printer), 'done');
        });
        WMS.save(); WMS.renderAll();
        WMS.toast('批量重打完成 · ' + pool.length + ' 个任务', 'success');
      }, 900);
      return { msg: null };
    },
    /* 新建打印任务：data-action="printJob:*:create" */
    create: function (r, ctx) {
      WMS.formModal({
        title: '新建打印任务',
        desc: '提交后进入打印队列，可重打、补打或取消；打印失败自动重试 2 次。',
        ok: '提交任务',
        fields: [
          { k: 'tpl', label: '模板类型', type: 'select', required: true,
            options: ['箱唛', '尾程面单', '拣货单', '商品条码标签', 'FBA 箱唛', '发票'], value: '箱唛' },
          { k: 'src', label: '关联单据', required: true, placeholder: '如 ASN-20261011-0142',
            help: '入库 ASN、出库单、波次、退件单或账单号' },
          { k: 'wh', label: '作业仓', type: 'select', required: true, options: ['LAX-01', 'EWR-02', 'BHX-03', 'FRA-04'], value: 'LAX-01' },
          { k: 'copies', label: '打印份数', type: 'number', required: true, value: 1 },
          { k: 'printer', label: '目标打印机', type: 'select', required: true, options: ['LP-LAX-01', 'LP-LAX-02', 'LP-EWR-01', 'LP-BHX-01', 'LP-FRA-01'], value: 'LP-LAX-01',
            help: '模板尺寸需与设备匹配，否则会被判格式不匹配' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('PJ-20261011-', 'printJob');
          WMS.DB.printJob.unshift({
            id: id, tpl: v.tpl, src: v.src, doc: 'ASN', tenant: '深圳致远电子', tenantId: 'TN-00041',
            wh: v.wh, copies: v.copies, printer: v.printer, by: '陈工', t: WMS.now(),
            attempts: 0, status: 'queued',
            note: '演示数据：由打印中心手动提交，等待设备空闲后输出。',
            timeline: [
              { t: WMS.now(), title: '任务已提交', meta: v.tpl + ' · ' + WMS.num(v.copies) + ' 份', state: 'done' },
              { t: WMS.now(), title: '排队中', meta: '等待 ' + WMS.esc(v.printer) + ' 空闲', state: 'active' }
            ]
          });
          return { msg: '已创建打印任务 ' + id, modal: { title: '打印任务已创建', desc: v.tpl + ' · ' + WMS.num(v.copies) + ' 份', id: id } };
        }
      });
      return { msg: null };
    }
  };

  WMS.ACTIONS.printer = {
    view: function (r) { WMS.openDrawer('printer:' + r.id); return { msg: null }; },
    test: function (r) {
      WMS.formModal({
        title: '测试打印 · ' + r.id,
        width: 520,
        desc: '向 ' + r.type + ' 输出一张测试页，用于校验尺寸、浓度与进纸。',
        ok: '开始测试',
        fields: [
          { k: 'copies', label: '测试页份数', type: 'number', required: true, value: 1 },
          { k: 'note', label: '测试说明', type: 'select', options: ['日常巡检', '换纸后校验', '维修后验收', '新模板试打'], value: '日常巡检' }
        ],
        onSubmit: function (v) {
          r.today = (r.today || 0) + v.copies;
          WMS.push(r, '测试打印', v.note + ' · ' + WMS.num(v.copies) + ' 张', 'done');
          return { msg: r.id + ' 测试打印完成 · ' + WMS.num(v.copies) + ' 张' };
        }
      });
      return { msg: null };
    }
  };

  /* ----------------------------------------------------------
     7. KPI：打印机在线率（引擎 data-kpi 只能做 count/sum/total，比率自行计算）
     ---------------------------------------------------------- */
  var _renderAll = WMS.renderAll;
  WMS.renderAll = function () {
    _renderAll.apply(WMS, arguments);
    syncPrintKpi();
    /* 打印机状态表是「设备总览」，不参与主表的工具栏 / Tab 筛选 */
    rescuePrinterTable();
  };

  /* 在线率 = 在线 + 繁忙（设备可用即算在线），缺纸与离线均不可用 */
  function syncPrintKpi() {
    var ps = WMS.DB.printer || [];
    var ok = 0, paper = 0, off = 0;
    ps.forEach(function (p) {
      if (p.status === 'online' || p.status === 'busy') ok++;
      else if (p.status === 'paper') paper++;
      else off++;
    });
    var rate = ps.length ? Math.round(ok / ps.length * 100) : 0;
    var el = document.getElementById('kpi-printer-rate');
    if (el) {
      el.innerHTML = rate + '<span class="unit">%</span>';
      el.classList.toggle('text-danger', rate < 60);
      el.classList.toggle('text-warning', rate >= 60 && rate < 80);
    }
    var dl = document.getElementById('kpi-printer-rate-delta');
    if (dl) {
      dl.textContent = '可用 ' + ok + ' / ' + ps.length + ' 台 · 缺纸 ' + paper + ' · 离线 ' + off;
    }
  }

  /* ui.js 的过滤是全局的（作用于页面上所有 table），分两类：
       ① 全局范围：顶栏关键字 + 仓库切换（WMS.applyViewFilter）→ 两张表都该被过滤；
       ② 本页范围：工具栏 data-filter-col + Tab 徽章（ui.js applyFilters）→ 只服务主表。
     打印机状态表定位是「设备总览」，因此对 ② 做恢复：放回被误隐藏的行，
     并清掉误插入的“无结果”行；对 ① 不干预（与主表一起过滤）。
     另注：ui.js 的 input 有 160ms 防抖，故延时需大于它。 */
  function rescuePrinterTable() {
    if (WMS.q || WMS.whCode) return;
    var tb = document.getElementById('printer-table');
    if (!tb || !tb.tBodies) return;
    var rows = $$('tbody tr', tb);
    var hasData = rows.some(function (tr) { return !tr.classList.contains('no-result'); });
    rows.forEach(function (tr) {
      if (tr.classList.contains('no-result')) {
        if (hasData && tr.parentNode) tr.parentNode.removeChild(tr);
        return;
      }
      tr.style.display = '';
    });
  }

  /* 工具栏 input（ui.js 有 160ms 防抖）与 Tab 点击之后，再恢复一次设备表 */
  document.addEventListener('input', function () { setTimeout(rescuePrinterTable, 300); });
  document.addEventListener('change', function () { setTimeout(rescuePrinterTable, 60); });
  document.addEventListener('click', function () { setTimeout(rescuePrinterTable, 60); });

  /* ----------------------------------------------------------
     8. 启动
     ---------------------------------------------------------- */
  WMS.renderAll();
})();
