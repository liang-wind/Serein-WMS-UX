/* ============================================================
   海外仓 WMS · 物流跟踪中心  mod-tracking.js
   把散落在 toast 里的「轨迹停滞」「承运商查询工单」收敛成可跟踪的中心。
   本文件只接入一个新业务域 shipment（运单），通过引擎注册表挂载，
   不改动 data.js / app.js / actions.js / ui.js / shell.js：

     WMS.DB.shipment                 运单主数据（演示数据）
     WMS.STATUS_BY.shipment          状态徽章（文案即 Tab 文案）
     WMS.STATUS_TEXT.shipment        状态中文名（Tab 计数用）
     WMS.RENDER.shipment             运单列表行渲染
     WMS.OPS.shipment                行内可用动作
     WMS.ACTIONS.shipment            动作实现（轨迹 / 查询工单 / 确认妥投 / 批量查询）
     WMS.TITLE_EXTRA.shipment        抽屉副标题
     WMS.FIELDS_EXTRA.shipment       抽屉基本信息
     WMS.LINES_EXTRA.shipment        抽屉「尾程轨迹」时间线（本模块核心）
   ============================================================ */
(function () {
  'use strict';

  var pad4 = function (n) { var s = String(n); while (s.length < 4) s = '0' + s; return s; };

  /* 停滞时长配色：>24h 危险 · 12–24h 预警 */
  var stallCls = function (h) {
    return h >= 24 ? 'text-danger' : (h >= 12 ? 'text-warning' : '');
  };
  var stallTxt = function (h) { return h > 0 ? h + 'h' : '—'; };

  /* 追加轨迹节点：与引擎 WMS.push 同语义，但写在 events 上。
     不能直接用 WMS.push——它写 r.timeline，会让抽屉里同时出现
     「尾程轨迹」（LINES_EXTRA）与「作业轨迹」（drawerHTML 自动渲染）两段重复时间线。 */
  function appendEvent(r, title, meta, state) {
    if (!r.events) r.events = [];
    r.events.forEach(function (e) { if (e.state === 'active') e.state = 'done'; });
    r.events.push({ t: WMS.now(), title: title, meta: meta, state: state || 'active' });
  }

  /* ================= 1. 运单主数据（演示数据） ================= */
  function seedShipments() {
    return [
      {
        id: '1Z884…4207', outId: 'OUT-20261011-3572', tenant: '安克创新科技', tn: 'TN-00073',
        ch: 'Amazon FBA', wh: 'LAX-01', carrier: 'UPS', country: '美国', pieces: 6,
        shipAt: '10-11 11:00', lastAt: '10-11 20:14', stall: 6, eta: '10-13 18:00',
        status: 'transit', issue: '', ticket: '',
        note: 'Ontario 中转场已装载 JFK 方向干线，预计 10-13 进入派送站。',
        events: [
          { t: '10-11 11:00', title: '已收件', meta: 'LAX-01 交接 UPS 首趟揽收 · 6 件', state: 'done' },
          { t: '10-11 14:20', title: '离开始发地', meta: 'Ontario CA 航空枢纽起飞', state: 'done' },
          { t: '10-11 18:05', title: '到达分拨中心', meta: 'UPS Ontario CA 中转场分拣', state: 'done' },
          { t: '10-11 20:14', title: '运输中', meta: '装载 JFK 方向干线', state: 'active' },
          { t: '—', title: '到达目的国派送点', meta: '待承运商扫描', state: 'pending' }
        ]
      },
      {
        id: '1Z884…4188', outId: 'OUT-20261011-3549', tenant: '深圳致远电子', tn: 'TN-00041',
        ch: 'Amazon FBA', wh: 'EWR-02', carrier: 'UPS', country: '美国', pieces: 24,
        shipAt: '10-11 18:05', lastAt: '10-11 21:50', stall: 3, eta: '10-13 18:00',
        status: 'transit', issue: '', ticket: '',
        note: 'FBA 补货 24 件已交接 UPS 末班，库存预占随交接释放。',
        events: [
          { t: '10-11 18:05', title: '已收件', meta: 'EWR-02 交接 UPS 末班截单 · 24 件', state: 'done' },
          { t: '10-11 21:36', title: '离开始发地', meta: 'Philadelphia PA 枢纽起飞', state: 'done' },
          { t: '10-11 21:50', title: '运输中', meta: '装载 Columbus OH 方向干线', state: 'active' }
        ]
      },
      {
        id: 'JD01…5580', outId: 'OUT-20261011-3568', tenant: '苏州明达玩具', tn: 'TN-00115',
        ch: 'eBay', wh: 'BHX-03', carrier: 'DHL', country: '德国', pieces: 11,
        shipAt: '10-11 12:30', lastAt: '10-11 21:02', stall: 2, eta: '待清关放行',
        status: 'out', issue: 'customs', ticket: '',
        note: '德国清关要求补充 HS 编码与申报价，已通知货主苏州明达玩具补件。',
        events: [
          { t: '10-11 12:30', title: '已收件', meta: 'BHX-03 交接 DHL · 11 件', state: 'done' },
          { t: '10-11 15:40', title: '离开始发地', meta: 'East Midlands 航班起飞', state: 'done' },
          { t: '10-11 20:14', title: '到达分拨中心', meta: 'DHL Leipzig 中转场', state: 'done' },
          { t: '10-11 21:02', title: '清关异常', meta: 'HS 编码与申报价待补 · 停滞 2h', state: 'active', bad: true },
          { t: '—', title: '清关完成', meta: '待承运商回复补件', state: 'pending' }
        ]
      },
      {
        id: 'JD01…5541', outId: 'OUT-20261011-3533', tenant: '中山灯饰照明', tn: 'TN-00123',
        ch: 'eBay', wh: 'FRA-04', carrier: 'DHL', country: '奥地利', pieces: 8,
        shipAt: '10-11 19:30', lastAt: '10-11 20:40', stall: 0, eta: '10-14 12:00',
        status: 'transit', issue: '', ticket: '',
        note: '已赶上 19:30 DHL 夜间航班，暂无异常。',
        events: [
          { t: '10-11 19:30', title: '已收件', meta: 'FRA-04 交接 DHL 夜间航班 · 8 件', state: 'done' },
          { t: '10-11 20:02', title: '离开始发地', meta: '装载法兰克福航线', state: 'done' },
          { t: '10-11 20:40', title: '运输中', meta: '等待下一个扫描节点', state: 'active' }
        ]
      },
      {
        id: '7712…0461', outId: 'OUT-20261011-3560', tenant: '安克创新科技', tn: 'TN-00073',
        ch: 'Amazon FBM', wh: 'LAX-01', carrier: 'FedEx', country: '美国', pieces: 1,
        shipAt: '10-10 17:05', lastAt: '10-10 19:30', stall: 26, eta: '已超 SLA 1h',
        status: 'delay', issue: 'stall', ticket: 'CQ-20261010-0883',
        note: '轨迹停滞 26 小时，最后扫描停留在 FedEx Memphis 中转中心。已超 SLA 1 小时，查询工单 CQ-20261010-0883 跟进中。',
        events: [
          { t: '10-10 15:40', title: '已收件', meta: 'LAX-01 交接 FedEx 末班截单 · 1 件', state: 'done' },
          { t: '10-10 17:05', title: '离开始发地', meta: 'Ontario CA 航空枢纽起飞', state: 'done' },
          { t: '10-10 19:30', title: '到达分拨中心', meta: 'FedEx Memphis 中转场', state: 'done' },
          { t: '10-10 21:12', title: '离开中转场', meta: '装载 JFK 方向干线', state: 'done' },
          { t: '10-10 22:40', title: '轨迹停滞', meta: 'Memphis 无出境扫描逾 26h · 工单 CQ-20261010-0883 跟进中', state: 'active', bad: true },
          { t: '—', title: '到达目的国派送点', meta: '待轨迹恢复', state: 'pending' },
          { t: '—', title: '已妥投', meta: '预计 10-13', state: 'pending' }
        ]
      },
      {
        id: 'RM00…9134', outId: 'OUT-20261011-3571', tenant: '中山灯饰照明', tn: 'TN-00123',
        ch: 'Shopify 独立站', wh: 'EWR-02', carrier: 'Royal Mail', country: '英国', pieces: 2,
        shipAt: '10-11 17:20', lastAt: '10-11 22:10', stall: 1, eta: '10-13 12:00',
        status: 'transit', issue: '', ticket: '',
        note: '已进入 Heathrow 世界邮件中心，暂无异常。',
        events: [
          { t: '10-11 17:20', title: '已收件', meta: 'EWR-02 交接 Royal Mail · 2 件', state: 'done' },
          { t: '10-11 22:10', title: '离开始发地', meta: 'Heathrow 世界邮件中心', state: 'done' },
          { t: '10-11 22:10', title: '运输中', meta: '装载区域派送线路', state: 'active' }
        ]
      },
      {
        id: 'RM00…9102', outId: 'OUT-20261011-3541', tenant: '乐歌家居科技', tn: 'TN-00058',
        ch: 'Shopify 独立站', wh: 'BHX-03', carrier: 'Royal Mail', country: '英国', pieces: 3,
        shipAt: '10-11 14:05', lastAt: '10-11 15:12', stall: 20, eta: '暂停 · 待补地址',
        status: 'out', issue: 'addr', ticket: 'CS-2291',
        note: '收件地址缺门牌号与邮编，Royal Mail 无法生成面单。客服工单 CS-2291 跟进中，2 小时内未回复将退款处理。',
        events: [
          { t: '10-11 14:05', title: '已收件', meta: 'BHX-03 拣货打包完成 · 面单待生成', state: 'done' },
          { t: '10-11 15:12', title: '地址异常', meta: '缺门牌号与邮编 · 工单 CS-2291 跟进中 · 停滞 20h', state: 'active', bad: true },
          { t: '—', title: '地址补全后重新交运', meta: '待客服回复买家', state: 'pending' }
        ]
      },
      {
        id: 'CL93…2278', outId: 'OUT-20261011-3554', tenant: '义乌恒发家居', tn: 'TN-00086',
        ch: 'Temu 半托管', wh: 'FRA-04', carrier: 'Colissimo', country: '法国', pieces: 4,
        shipAt: '10-11 19:35', lastAt: '10-11 23:18', stall: 1, eta: '10-13 18:00',
        status: 'transit', issue: '', ticket: '',
        note: '已进入 Roissy 分拨中心，预计 10-13 派送。',
        events: [
          { t: '10-11 19:35', title: '已收件', meta: 'FRA-04 交接 Colissimo · 4 件', state: 'done' },
          { t: '10-11 23:18', title: '到达分拨中心', meta: 'Roissy 分拨中心', state: 'done' },
          { t: '10-11 23:18', title: '运输中', meta: '装载 Lyon 方向', state: 'active' }
        ]
      },
      {
        id: '1Z884…4163', outId: 'OUT-20261010-3512', tenant: '乐歌家居科技', tn: 'TN-00058',
        ch: 'Shopify 独立站', wh: 'LAX-01', carrier: 'UPS', country: '加拿大', pieces: 3,
        shipAt: '10-10 16:40', lastAt: '10-11 10:26', stall: 0, eta: '已妥投',
        status: 'delivered', issue: '', ticket: '', deliveredAt: '10-11 10:26',
        note: 'UPS POD 已回传，本人签收于 10-11 10:26。',
        events: [
          { t: '10-10 16:40', title: '已收件', meta: 'LAX-01 交接 UPS 首趟 · 3 件', state: 'done' },
          { t: '10-10 19:20', title: '离开始发地', meta: 'Ontario CA 航空枢纽起飞', state: 'done' },
          { t: '10-10 23:05', title: '到达分拨中心', meta: 'UPS Toronto 中转场', state: 'done' },
          { t: '10-11 02:14', title: '清关完成', meta: '申报 CAD 58.20 · 无税放行', state: 'done' },
          { t: '10-11 06:30', title: '到达目的国派送点', meta: 'Mississauga 派送站', state: 'done' },
          { t: '10-11 08:52', title: '派送中', meta: '快递员 R. Chen', state: 'done' },
          { t: '10-11 10:26', title: '已妥投', meta: '本人签收', state: 'done' }
        ]
      },
      {
        id: 'CL93…2241', outId: 'OUT-20261009-3498', tenant: '宁波海诚日用', tn: 'TN-00094',
        ch: 'Amazon FBM', wh: 'FRA-04', carrier: 'Colissimo', country: '法国', pieces: 2,
        shipAt: '10-09 15:20', lastAt: '10-11 16:30', stall: 0, eta: '已退回',
        status: 'returned', issue: 'ret', ticket: '',
        note: '买家取消订单拒收，包裹已退回 FRA-04，退件质检后按货主策略处置。',
        events: [
          { t: '10-09 15:20', title: '已收件', meta: 'FRA-04 交接 Colissimo · 2 件', state: 'done' },
          { t: '10-09 18:40', title: '离开始发地', meta: 'Frankfurt 分拨中心', state: 'done' },
          { t: '10-10 09:15', title: '到达目的国派送点', meta: 'Lyon 派送站', state: 'done' },
          { t: '10-10 14:22', title: '派送失败', meta: '收件人不在家 · 已留言二次派送', state: 'done' },
          { t: '10-11 10:05', title: '拒收退回', meta: '买家取消订单拒收', state: 'done' },
          { t: '10-11 16:30', title: '已退回 FRA-04', meta: '待退件质检入库', state: 'active' }
        ]
      }
    ];
  }

  WMS.DB.shipment = WMS.DB.shipment || [];
  if (!WMS.DB.shipment.length) WMS.DB.shipment = seedShipments();

  /* ================= 2. 状态徽章（文案 = Tab 文案） ================= */
  WMS.STATUS_BY.shipment = {
    transit:   { cls: 'b-ing',     text: '运输中' },
    delay:     { cls: 'b-wait',    text: '轨迹停滞' },
    out:       { cls: 'b-err',     text: '异常' },
    delivered: { cls: 'b-done',    text: '已妥投' },
    returned:  { cls: 'b-neutral', text: '已退回' }
  };
  WMS.STATUS_TEXT.shipment = {
    transit: '运输中', delay: '轨迹停滞', out: '异常', delivered: '已妥投', returned: '已退回'
  };

  /* ================= 3. 运单列表渲染 =================
     列序（0 起）：0 运单号 · 1 关联出库单 · 2 货主 · 3 渠道 · 4 仓库 · 5 承运商
                  6 目的国 · 7 发货时间 · 8 最后轨迹时间 · 9 停滞时长 · 10 状态 · 11 操作
     tracking.html 的 data-filter-col 与 data-wh-col 均按此列序声明。 */
  WMS.RENDER.shipment = function (r) {
    var stallC = stallCls(r.stall);
    var outCell = WMS.find('out', r.outId)
      ? '<button class="td-link td-num" type="button" data-drawer="out:' + r.outId + '">' +
        WMS.short(r.outId) + '</button>'
      : '<span class="td-num">' + WMS.short(r.outId) + '</span>';
    return '<tr data-id="' + r.id + '">' +
      '<td><button class="td-link td-num td-strong" type="button" data-drawer="shipment:' + r.id + '">' +
        r.id + '</button></td>' +
      '<td>' + outCell + '</td>' +
      '<td>' + WMS.esc(r.tenant) + '<span class="hint num"> ' + r.tn + '</span></td>' +
      '<td>' + WMS.esc(r.ch) + '</td>' +
      '<td class="td-num">' + r.wh + '</td>' +
      '<td>' + r.carrier + '</td>' +
      '<td>' + WMS.esc(r.country) + '</td>' +
      '<td class="td-num">' + r.shipAt + '</td>' +
      '<td class="td-num">' + r.lastAt + '</td>' +
      '<td class="td-num td-strong ' + stallC + '">' + stallTxt(r.stall) + '</td>' +
      '<td>' + WMS.statusText('shipment', r.status) + '</td>' +
      '<td class="td-ops">' + WMS.ops('shipment', r) + '</td>' +
    '</tr>';
  };

  /* ================= 4. 行内可用动作 ================= */
  WMS.OPS.shipment = [
    { k: 'view',    t: '轨迹',       on: ['transit', 'delay', 'out', 'delivered', 'returned'] },
    { k: 'query',   t: '承运商查询', on: ['delay', 'out'], danger: true },
    { k: 'confirm', t: '确认妥投',   on: ['delay', 'transit'] }
  ];

  /* ================= 5. 抽屉扩展 ================= */
  WMS.TITLE_EXTRA.shipment = function (r) {
    return '运单 · ' + r.carrier + ' · ' + r.country;
  };

  WMS.FIELDS_EXTRA.shipment = function (r, add) {
    add('运单号', r.id);
    add('关联出库单', WMS.short(r.outId));
    add('货主', WMS.esc(r.tenant) + '<span class="hint num"> ' + r.tn + '</span>');
    add('销售渠道', WMS.esc(r.ch));
    add('发货仓', r.wh);
    add('承运商', r.carrier);
    add('目的国', r.country);
    add('件数', r.pieces);
    add('发货时间', r.shipAt);
    add('最后轨迹时间', r.lastAt);
    add('停滞时长', '<span class="num ' + stallCls(r.stall) + '">' + stallTxt(r.stall) + '</span>');
    add('查询工单', r.ticket || '—');
    add('预计妥投', r.eta);
  };

  /* ================= 6. 轨迹时间线（本页核心） ================= */
  function stepsHTML(r) {
    var ev = r.events || [];
    if (!ev.length) return '<div class="empty"><p>暂无轨迹节点</p></div>';
    var h = '<div class="stepper" style="margin-top:10px">';
    ev.forEach(function (e, i) {
      var st = e.state === 'done' ? 'done' : (e.state === 'active' ? 'active' : 'pending');
      var dot = st === 'done' ? '✓' : (e.bad ? '!' : (i + 1));
      h += '<div class="step ' + st + '">' +
             '<span class="step-dot" aria-hidden="true">' + dot + '</span>' +
             '<div class="step-body">' +
               '<div class="step-title' + (e.bad ? ' text-danger' : '') + '">' + WMS.esc(e.title) + '</div>' +
               '<div class="step-meta">' + WMS.esc(e.t) + (e.meta ? ' · ' + WMS.esc(e.meta) : '') + '</div>' +
             '</div>' +
           '</div>';
    });
    return h + '</div>';
  }

  WMS.LINES_EXTRA.shipment = function (r) {
    return '<section class="drawer-sec"><h3>尾程轨迹 · ' + (r.events || []).length +
      ' 个节点</h3>' + stepsHTML(r) + '</section>';
  };

  /* 页面级宿主：tracking.html 里的 <div data-timeline="运单号">，渲染摘要 + 时间线 */
  function blockHTML(r) {
    return '<dl class="dl" style="margin:2px 0 0">' +
        '<dt>运单号</dt><dd class="num">' + WMS.esc(r.id) + '</dd>' +
        '<dt>关联出库单</dt><dd class="num">' + WMS.esc(WMS.short(r.outId)) + '</dd>' +
        '<dt>承运商 / 目的国</dt><dd>' + WMS.esc(r.carrier) + ' · ' + WMS.esc(r.country) + '</dd>' +
        '<dt>最后轨迹</dt><dd class="num">' + WMS.esc(r.lastAt) + '</dd>' +
        '<dt>停滞时长</dt><dd class="num ' + stallCls(r.stall) + '">' + stallTxt(r.stall) + '</dd>' +
      '</dl>' + stepsHTML(r);
  }

  function renderTimelineHosts() {
    WMS.$$('[data-timeline]').forEach(function (host) {
      var r = WMS.find('shipment', host.getAttribute('data-timeline'));
      host.innerHTML = r ? blockHTML(r) : '<div class="empty"><p>未找到运单轨迹</p></div>';
    });
  }

  /* 包装而非改写引擎的 renderAll：表格刷新后同步刷新页面时间线宿主 */
  if (!WMS.renderAll.__trackingWrapped) {
    var prevRenderAll = WMS.renderAll;
    WMS.renderAll = function () {
      prevRenderAll();
      renderTimelineHosts();
    };
    WMS.renderAll.__trackingWrapped = true;
  }

  /* ================= 7. 动作实现 ================= */
  var TICKET_SEQ = 332;
  var QUERY_TYPES = ['轨迹停滞催促', '清关资料补充', '地址异常更正', '拒收退回核实', '破损索赔'];
  var ISSUE_TYPE = { stall: '轨迹停滞催促', customs: '清关资料补充', addr: '地址异常更正', ret: '拒收退回核实' };
  var ISSUE_TEXT = { stall: '轨迹停滞', customs: '清关异常', addr: '地址异常', ret: '拒收退回' };

  WMS.ACTIONS.shipment = {

    /* 轨迹：弹窗列出一条运单的完整 Webhook 节点 */
    view: function (r) {
      var rows = (r.events || []).map(function (e) {
        return [WMS.esc(e.t), WMS.esc(e.title), WMS.esc(e.meta || '—')];
      });
      WMS.listModal('尾程轨迹 · ' + r.id, ['时间', '节点', '说明'], rows,
        '轨迹由承运商 Webhook 汇聚，' + r.carrier + ' 推送间隔通常为 2–6 小时；本页数据为演示数据。');
      return { msg: null };
    },

    /* 承运商查询工单：表单提交，写入工单号并回写轨迹 */
    query: function (r) {
      WMS.formModal({
        title: '承运商查询工单 · ' + r.id,
        desc: r.carrier + ' · ' + r.outId + ' · ' + r.country + ' · 最后轨迹 ' + r.lastAt,
        ok: '提交工单',
        danger: true,
        fields: [
          { k: 'type', label: '查询类型', type: 'select', required: true,
            value: ISSUE_TYPE[r.issue] || '轨迹停滞催促', options: QUERY_TYPES },
          { k: 'carrier', label: '承运商', type: 'select', required: true,
            value: r.carrier, options: ['UPS', 'FedEx', 'DHL', 'Royal Mail', 'Colissimo'] },
          { k: 'sla', label: '要求回复时限', type: 'number', value: 4,
            help: '小时 · 超时未回复将自动升级至承运商大客户经理' },
          { k: 'memo', label: '补充说明', type: 'textarea', span: true, value: r.note || '',
            placeholder: '选填 · 将随工单发送给承运商' }
        ],
        onSubmit: function (v) {
          var no = 'CQ-20261011-' + pad4(TICKET_SEQ++);
          r.ticket = no;
          r.note = '已向 ' + v.carrier + ' 提交「' + v.type + '」工单 ' + no +
            '（要求 ' + v.sla + 'h 内回复）' + (v.memo ? ' · ' + v.memo : '');
          appendEvent(r, '承运商查询工单已提交', no + ' · ' + v.type + ' · 要求 ' + v.sla + 'h 回复', 'active');
          return {
            msg: r.id + ' 查询工单 ' + no + ' 已提交 · ' + v.type,
            modal: {
              title: '查询工单已提交',
              desc: '工单 ' + no + ' 已同步至 ' + v.carrier + ' 承运商后台，回复后轨迹将自动回写本页。',
              id: no
            }
          };
        }
      });
      return { msg: null };
    },

    /* 确认妥投：POD 未回传时按回执时间手工闭环 */
    confirm: function (r) {
      WMS.formModal({
        title: '确认妥投 · ' + r.id,
        desc: r.carrier + ' · ' + r.outId + ' · ' + r.country + ' · 最后轨迹 ' + r.lastAt,
        ok: '确认妥投',
        fields: [
          { k: 'at', label: '妥投时间', type: 'text', required: true, value: WMS.now(),
            placeholder: 'MM-DD HH:MM', help: '按承运商 POD 回执时间填写' },
          { k: 'sign', label: '签收方式', type: 'select', required: true, value: '本人签收',
            options: ['本人签收', '门卫/前台代收', '快递柜', '门口留置', '自提点自提'] },
          { k: 'memo', label: '备注', type: 'textarea', span: true, placeholder: '选填 · 将写入轨迹与账单' }
        ],
        onSubmit: function (v) {
          r.status = 'delivered';
          r.stall = 0;
          r.eta = '已妥投';
          r.deliveredAt = v.at;
          r.note = v.sign + ' · ' + (v.memo || '承运商 POD 已回传');
          appendEvent(r, '已确认妥投', v.at + ' · ' + v.sign, 'done');
          return {
            msg: r.id + ' 已确认妥投 · ' + v.at + ' · ' + v.sign,
            modal: {
              title: '妥投已确认',
              desc: '运单 ' + r.id + ' 已标记为妥投，轨迹将在 24h 后归档，账单按妥投日结算。',
              id: r.id
            }
          };
        }
      });
      return { msg: null };
    },

    /* 批量发起承运商查询：对当前「轨迹停滞 / 异常」运单逐张建工单 */
    batch: function () {
      var list = (WMS.DB.shipment || []).filter(function (x) {
        return x.status === 'delay' || x.status === 'out';
      });
      if (!list.length) return { msg: '当前没有待查询的异常运单（轨迹停滞 / 异常）', type: 'warn' };
      var made = [];
      list.forEach(function (x) {
        var no = 'CQ-20261011-' + pad4(TICKET_SEQ++);
        x.ticket = no;
        x.note = '已向 ' + x.carrier + ' 批量提交「' + (ISSUE_TYPE[x.issue] || '轨迹停滞催促') + '」工单 ' + no;
        appendEvent(x, '承运商查询工单已提交',
          no + ' · 批量催办 · ' + (ISSUE_TEXT[x.issue] || '轨迹停滞'), 'active');
        made.push(no + ' · ' + x.id);
      });
      WMS.resultModal({
        title: '批量查询工单已提交',
        desc: '共 ' + made.length + ' 张工单已同步至对应承运商后台，回复后自动回写轨迹。',
        id: made.join(' / ')
      });
      return { msg: null };
    }
  };

  /* ================= 8. 首屏渲染 ================= */
  renderTimelineHosts();
  WMS.renderAll();
})();
