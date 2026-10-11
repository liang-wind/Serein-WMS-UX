/* ============================================================
   海外仓 WMS · 应用引擎 (1/3) 核心
   表格由数据渲染 · 详情抽屉 · 表单弹窗 · 状态流转
   ============================================================ */
window.WMS = window.WMS || {};

/* ---------------- 工具 ---------------- */
WMS.esc = function (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
WMS.num = function (n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
/* 单号缩写：RTN-20261011-0181 → RTN-…0181 */
WMS.short = function (s) {
  s = String(s == null ? '' : s);
  var p = s.split('-');
  return p.length > 1 ? p[0] + '-…' + p[p.length - 1] : s;
};
WMS.find = function (kind, id) {
  var a = WMS.DB[kind] || [];
  for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
  return null;
};
WMS.$ = function (s, r) { return (r || document).querySelector(s); };
/* 兼容旧代码中的裸 $() 调用（原文件简写丢失导致的 ReferenceError） */
var $ = function (s, r) { return WMS.$(s, r); };
WMS.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

/* toast 依赖 ui.js，缺失时降级到 alert */
WMS.toast = function (msg, type) {
  if (window.wmsToast) window.wmsToast(msg, type);
};

/* ---------------- 进度条 ---------------- */
WMS.bar = function (pct, cls) {
  pct = Math.max(0, Math.min(100, pct));
  return '<span class="progress-row"><span class="progress ' + (cls || '') +
    '"><span style="width:' + pct + '%"></span></span><b>' + pct + '%</b></span>';
};

/* ============================================================
   表格渲染
   ============================================================ */
WMS.RENDER = {};

WMS.RENDER.asn = function (r) {
  var pct = r.box ? Math.round(r.got / r.box * 100) : 0;
  var barCls = r.status === 'error' ? 'bad' : (pct === 100 ? 'ok' : '');
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="asn:' + r.id + '">' + r.id + '</button></td>' +
    '<td>' + WMS.esc(r.supplier) + '</td>' +
    '<td class="td-strong">' + WMS.esc(r.tenant || r.supplier) + '</td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td><span class="badge b-neutral">' + r.mode + '</span></td>' +
    '<td class="td-num">' + r.box + '</td>' +
    '<td><span class="progress-row"><span class="progress ' + barCls + '"><span style="width:' + pct + '%"></span></span><b>' + pct + '%</b></span></td>' +
    '<td class="td-num">' + r.eta + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('asn', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.sku = function (r) {
  var pct = r.safety ? Math.round(r.avail / (r.safety * 2) * 100) : 100;
  pct = Math.max(0, Math.min(100, pct));
  var cls = pct < 30 ? 'bad' : (pct < 60 ? 'warn' : 'ok');
  var act = r.status === 'oos' ? '紧急补货' : (r.status === 'low' ? '补货' :
            (r.status === 'lock' ? '释放' : (r.status === 'slow' ? '促销' : '调整')));
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="sku:' + r.id + '">' + r.id + '</button></td>' +
    '<td>' + WMS.esc(r.name) + ' <span class="hint">' + WMS.esc(r.cat || '') + '</span></td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td class="td-num">' + r.loc + '</td>' +
    '<td class="td-num td-strong">' + WMS.num(r.avail) + '</td>' +
    '<td class="td-num">' + WMS.num(r.lock) + '</td>' +
    '<td class="td-num">' + WMS.num(r.safety) + '</td>' +
    '<td>' + WMS.bar(pct, cls) + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('sku', r, act) + '</td>' +
  '</tr>';
};

WMS.RENDER.out = function (r) {
  var slaCls = /超时|15:00/.test(r.sla) && r.status === 'stalled' ? 'text-danger' : '';
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="out:' + r.id + '">' + r.id + '</button></td>' +
    '<td>' + WMS.esc(r.ch) + '</td>' +
    '<td class="td-strong">' + WMS.esc(r.tenant || '—') + '</td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td>' + r.carrier + '</td>' +
    '<td class="td-num">' + r.tracking + '</td>' +
    '<td class="td-num">' + r.pieces + '</td>' +
    '<td class="td-num ' + slaCls + '">' + r.sla + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('out', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.loc = function (r) {
  var cls = r.fill >= 90 ? 'bad' : (r.fill >= 40 ? 'ok' : '');
  var ownCls = (r.own || '').indexOf('独占') === 0 ? 'b-done' : ((r.own || '') === '公共区' ? 'b-neutral' : 'b-ing');
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num td-strong" type="button" data-drawer="loc:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td>' + r.zone + '</td>' +
    '<td>' + r.type + '</td>' +
    '<td><span class="badge ' + ownCls + '">' + WMS.esc(r.own || '混放') + '</span></td>' +
    '<td class="td-num">' + WMS.esc(r.sku) + '</td>' +
    '<td>' + WMS.bar(r.fill, cls) + '</td>' +
    '<td>' + WMS.statusText('loc', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('loc', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.rpt = function (r) {
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-strong" type="button" data-drawer="rpt:' + r.id + '">' + WMS.esc(r.name) + '</button></td>' +
    '<td><span class="badge b-neutral">' + r.cat + '</span>' +
    (r.dim ? ' <span class="hint">' + r.dim + '</span>' : '') + '</td>' +
    '<td>' + r.freq + '</td>' +
    '<td>' + r.owner + '</td>' +
    '<td class="td-num">' + r.subs + '</td>' +
    '<td class="td-num">' + r.last + '</td>' +
    '<td>' + WMS.statusText('rpt', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('rpt', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.usr = function (r) {
  return '<tr data-id="' + r.id + '">' +
    '<td class="td-strong">' + WMS.esc(r.name) + '</td>' +
    '<td><span class="role-tag">' + r.role + '</span></td>' +
    '<td class="td-num">' + r.whs + '</td>' +
    '<td class="hint">' + WMS.esc(r.scope || '—') + '</td>' +
    '<td class="td-num">' + r.phone + '</td>' +
    '<td class="td-num">' + r.last + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('usr', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.order = function (r) {
  var whCls = r.status === 'block' ? 'b-err' : (r.status === 'assign' ? 'b-wait' : 'b-done');
  var scoreCls = (r.status === 'block' || r.score === '可用 0') ? 'hint text-danger' : 'hint';
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="order:' + r.id + '">' + r.id + '</button></td>' +
    '<td>' + WMS.esc(r.ch) + '</td>' +
    '<td>' + WMS.esc(r.tenant) + '</td>' +
    '<td class="td-num">' + r.pieces + ' 件 / ' + r.skus + ' SKU</td>' +
    '<td>' + r.country + ' · ' + WMS.esc(r.city) + '</td>' +
    '<td><span class="badge ' + whCls + '">' + WMS.esc(r.wh) + '</span> <span class="' + scoreCls + '">' + WMS.esc(r.score) + '</span></td>' +
    '<td>' + WMS.statusText('order', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('order', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.ret = function (r) {
  var gMap = {'可售':'b-done', '待翻新':'b-ing', '残损':'b-err'};
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="ret:' + r.id + '">' + r.id + '</button></td>' +
    '<td><span class="badge b-neutral">' + WMS.esc(r.type) + '</span></td>' +
    '<td>' + WMS.esc(r.tenant) + '</td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td class="td-num">' + r.qty + '</td>' +
    '<td class="td-num">' + r.sku + '</td>' +
    '<td><span class="badge ' + (gMap[r.grade] || 'b-neutral') + '">' + WMS.esc(r.grade) + '</span></td>' +
    '<td>' + WMS.statusText('ret', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('ret', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.retn = function (r) {
  var tMap = {'上架':'b-ing', '换标':'b-neutral', '翻新':'b-neutral', '重新上架':'b-wait', '销毁':'b-err'};
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num td-strong" type="button" data-drawer="retn:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-num">' + WMS.short(r.src) + '</td>' +
    '<td>' + WMS.esc(r.tenant) + '</td>' +
    '<td class="td-num">' + r.sku + ' · ' + r.qty + '</td>' +
    '<td><span class="badge ' + (tMap[r.act] || 'b-neutral') + '">' + WMS.esc(r.act) + '</span></td>' +
    '<td class="td-num">' + WMS.esc(r.tag) + '</td>' +
    '<td>' + WMS.esc(r.owner) + '</td>' +
    '<td>' + WMS.statusText('retn', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('retn', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.tenant = function (r) {
  var arCls = r.status === 'paused' ? 'td-num text-danger' : 'td-num';
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="tenant:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-strong">' + WMS.esc(r.name) + '</td>' +
    '<td>' + WMS.esc(r.ch) + '</td>' +
    '<td class="td-num">' + r.cur + '</td>' +
    '<td><span class="badge b-neutral">' + WMS.esc(r.tpl) + '</span></td>' +
    '<td><span class="badge b-neutral">' + WMS.esc(r.policy) + '</span></td>' +
    '<td class="' + arCls + '">' + r.ar + '</td>' +
    '<td>' + WMS.statusText('tenant', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('tenant', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.bill = function (r) {
  var dueCls = r.status === 'overdue' ? 'td-num text-danger' : 'td-num';
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="bill:' + r.id + '">' + r.id + '</button></td>' +
    '<td>' + WMS.esc(r.tenant) + '</td>' +
    '<td class="td-num">' + WMS.esc(r.period) + '</td>' +
    '<td class="td-num">' + r.sys + '</td>' +
    '<td class="td-num">' + r.conf + '</td>' +
    '<td class="td-num ' + (r.diffCls || '') + '">' + r.diff + '</td>' +
    '<td class="' + dueCls + '">' + r.due + '</td>' +
    '<td>' + WMS.statusText('bill', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('bill', r) + '</td>' +
  '</tr>';
};

WMS.RENDER.pda = function (r) {
  var typeCls = r.type === '上架' ? 'b-ing' : 'b-neutral';
  var pMap = {'高':'b-err', '中':'b-wait', '低':'b-neutral'};
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num td-strong" type="button" data-drawer="pda:' + r.id + '">' + r.id + '</button></td>' +
    '<td><span class="badge ' + typeCls + '">' + WMS.esc(r.type) + '</span></td>' +
    '<td class="td-num">' + WMS.esc(r.target) + '</td>' +
    '<td class="td-num">' + r.qty + '</td>' +
    '<td><span class="badge ' + (pMap[r.prio] || 'b-neutral') + '">' + WMS.esc(r.prio) + '</span></td>' +
    '<td class="td-ops">' + WMS.ops('pda', r) + '</td>' +
  '</tr>';
};

/* ---------- 仓库 ---------- */
WMS.RENDER.wh = function (r) {
  var capCls = r.fill >= 90 ? 'bad' : (r.fill >= 70 ? 'warn' : 'ok');
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num td-strong" type="button" data-drawer="wh:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-strong">' + WMS.esc(r.name) + '</td>' +
    '<td>' + WMS.esc(r.country) + '</td>' +
    '<td class="num" style="font-size:11.5px;color:var(--color-muted-foreground)">' + WMS.esc(r.tz) + '</td>' +
    '<td class="td-num">' + r.cur + '</td>' +
    '<td class="td-num">' + WMS.num(r.locs) + '</td>' +
    '<td class="td-num">' + r.docks + '</td>' +
    '<td>' + WMS.bar(r.fill, capCls) + '</td>' +
    '<td class="td-num">' + r.tenants + '</td>' +
    '<td>' + WMS.statusText('wh', r.status) + '</td>' +
    '<td class="td-ops">' + WMS.ops('wh', r) + '</td>' +
  '</tr>';
};

/* ---------- 库存流水 ---------- */
WMS.RENDER.ledger = function (r) {
  var dirCls = r.dir === 'IN' ? 'b-done' : (r.dir === 'OUT' ? 'b-err' : 'b-wait');
  var qtyCls = r.dir === 'IN' ? 'text-success' : (r.dir === 'OUT' ? 'text-danger' : 'text-warning');
  var sign = r.dir === 'IN' ? '+' : (r.dir === 'OUT' ? '-' : '±');
  var qtyTxt = sign + (r.qty === 0 ? '0' : WMS.num(r.qty));
  return '<tr data-id="' + r.id + '">' +
    '<td class="td-num" style="white-space:nowrap">' + r.t + '</td>' +
    '<td><button class="td-link td-num" type="button" data-drawer="ledger:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td>' + WMS.esc(r.tenant) + '</td>' +
    '<td class="td-num">' + r.sku + '</td>' +
    '<td class="td-num">' + WMS.esc(r.lot) + '</td>' +
    '<td class="td-num">' + WMS.esc(r.loc) + '</td>' +
    '<td class="' + qtyCls + ' td-num td-strong">' + qtyTxt + '</td>' +
    '<td class="td-num" style="font-size:11.5px">' + WMS.esc(r.from) + ' <span class="text-muted">→</span> ' + WMS.esc(r.to) + '</td>' +
    '<td class="td-num">' + r.docType + '</td>' +
    '<td><button class="td-link td-num" type="button" data-drawer="' + r.docType.toLowerCase() + ':' + r.doc + '">' + WMS.esc(r.doc) + '</button></td>' +
    '<td>' + WMS.esc(r.op) + '</td>' +
    '<td class="td-num">' + r.device + '</td>' +
    '<td class="td-num td-strong">' + WMS.num(r.balance) + '</td>' +
  '</tr>';
};

/* 总览页的精简行（入库 / 出库） */
WMS.RENDER.asnMini = function (r) {
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="asn:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-strong">' + WMS.esc(r.tenant || r.supplier) + '</td>' +
    '<td class="td-num">' + r.wh + '</td>' +
    '<td class="td-num">' + r.box + '</td>' +
    '<td class="td-num">' + r.eta + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
  '</tr>';
};
WMS.RENDER.outMini = function (r) {
  return '<tr data-id="' + r.id + '">' +
    '<td><button class="td-link td-num" type="button" data-drawer="out:' + r.id + '">' + r.id + '</button></td>' +
    '<td class="td-strong">' + WMS.esc(r.tenant || '—') + '</td>' +
    '<td>' + r.country + '</td>' +
    '<td>' + r.carrier + '</td>' +
    '<td class="td-num">' + r.tracking + '</td>' +
    '<td>' + WMS.statusText('', r.status) + '</td>' +
  '</tr>';
};

/* ---------------- 操作按钮定义 ---------------- */
WMS.OPS = {
  asn: [
    {k:'arrive', t:'登记到货', on:['booked']},
    {k:'recv',   t:'收货',     on:['receiving']},
    {k:'inspect',t:'验收',     on:['inspecting']},
    {k:'putaway',t:'上架',     on:['putaway']},
    {k:'claim',  t:'处理异常', on:['error'], danger:true}
  ],
  sku: [
    {k:'replenish', t:'补货', on:['low','oos']},
    {k:'release',   t:'释放', on:['lock']},
    {k:'promo',     t:'促销', on:['slow']},
    {k:'adjust',    t:'调整', on:['ok']}
  ],
  out: [
    {k:'pick',    t:'开始拣货', on:['waiting']},
    {k:'pack',    t:'开始打包', on:['picking']},
    {k:'label',   t:'打单交接', on:['topack','ready']},
    {k:'trace',   t:'查询轨迹', on:['stalled'], danger:true},
    {k:'fixaddr', t:'修正地址', on:['addrerr'], danger:true}
  ],
  loc: [
    {k:'assign', t:'分配', on:['free']},
    {k:'lock',   t:'锁定', on:['full']},
    {k:'unlock', t:'解锁', on:['lock']},
    {k:'count',  t:'盘点', on:['part','full']}
  ],
  rpt: [
    {k:'view',  t:'查看', on:['ok','pending','failed']},
    {k:'gen',   t:'生成', on:['pending','failed']},
    {k:'dl',    t:'下载', on:['ok']}
  ],
  usr: [
    {k:'perms',   t:'编辑权限', on:['on','off']},
    {k:'disable', t:'停用', on:['on'], danger:true},
    {k:'enable',  t:'启用', on:['off']}
  ],
  order: [
    {k:'send',    t:'下发',   on:['held']},
    {k:'split',   t:'拆单',   on:['assign'], danger:true},
    {k:'nostock', t:'处理',   on:['block'],  danger:true},
    {k:'back',    t:'退回',   on:['block'],  danger:true},
    {k:'track',   t:'跟踪',   on:['sent','returned']}
  ],
  ret: [
    {k:'book',    t:'预约收货', on:['arrive']},
    {k:'qc',      t:'质检',     on:['qc']},
    {k:'refurb',  t:'翻新',     on:['qc']},
    {k:'relabel', t:'换标',     on:['relabel']},
    {k:'scrap',   t:'报废',     on:['relabel','qc'], danger:true}
  ],
  retn: [
    {k:'print',     t:'打印',     on:['printing']},
    {k:'startfix',  t:'开始翻新', on:['waitfix']},
    {k:'finishfix', t:'完成翻新', on:['doing']},
    {k:'put',       t:'上架',     on:['waitput']},
    {k:'destroy',   t:'销毁',     on:['waitdestroy'], danger:true}
  ],
  tenant: [
    {k:'view',  t:'货主视图', on:['co','renew','paused']},
    {k:'renew', t:'发起续约', on:['renew']},
    {k:'dun',   t:'催收',     on:['paused']}
  ],
  bill: [
    {k:'push',    t:'推送',     on:['confirm']},
    {k:'recon',   t:'对账',     on:['diff'], danger:true},
    {k:'remind',  t:'提醒',     on:['topay']},
    {k:'pay',     t:'登记回款', on:['topay','overdue']},
    {k:'suspend', t:'停用服务', on:['overdue'], danger:true}
  ],
  pda: [
    {k:'open',   t:'打开', on:['todo','doing']},
    {k:'claim',  t:'领取', on:['todo']},
    {k:'finish', t:'完成', on:['doing']}
  ],
  wh: [
    {k:'view',   t:'配置',   on:['active','hold']},
    {k:'enable', t:'启用',   on:['setup','hold']},
    {k:'pause',  t:'停用',   on:['active'], danger:true},
    {k:'zone',   t:'库区管理', on:['active']}
  ],
  ledger: [
    {k:'view',    t:'详情',   on:['IN','OUT','ADJ']},
    {k:'trace',   t:'追溯单据', on:['IN','OUT','ADJ']}
  ]
};

WMS.ops = function (kind, r, overrideLabel) {
  var defs = WMS.OPS[kind] || [];
  var html = '<button class="btn-link" type="button" data-drawer="' + kind + ':' + r.id + '">详情</button>';
  for (var i = 0; i < defs.length; i++) {
    var d = defs[i];
    if (d.on.indexOf(r.status) === -1) continue;
    var label = (i === 0 && overrideLabel) ? overrideLabel : d.t;
    html += '<button class="btn-link' + (d.danger ? ' danger' : '') + '" type="button" ' +
            'data-action="' + kind + ':' + r.id + ':' + d.k + '">' + label + '</button>';
  }
  return html;
};

/* ---------------- 渲染入口 ---------------- */
WMS.renderAll = function () {
  WMS.$$('[data-render]').forEach(function (tb) {
    var kind = tb.getAttribute('data-render');
    var src = tb.getAttribute('data-source') || kind;
    var rows = WMS.DB[src] || [];
    var limit = parseInt(tb.getAttribute('data-limit') || '0', 10);
    if (limit > 0 && rows.length > limit) rows = rows.slice(0, limit);
    var fn = WMS.RENDER[kind] || WMS.RENDER[src];
    if (!rows.length || !fn) {
      tb.innerHTML = '<tr class="no-result"><td colspan="20"><div class="empty"><p>暂无数据</p></div></td></tr>';
      return;
    }
    var out = [];
    for (var i = 0; i < rows.length; i++) out.push(fn(rows[i]));
    tb.innerHTML = out.join('');
  });
  if (window.wmsApplyFilters) window.wmsApplyFilters();
  WMS.renderNotify();
  if (WMS.syncTabs) WMS.syncTabs();
  if (WMS.syncPager) WMS.syncPager();
  if (WMS.syncKpis) WMS.syncKpis();
  if (WMS.drawerSpec) {
    var p = WMS.drawerSpec.split(':');
    var r = WMS.find(p[0], p.slice(1).join(':'));
    if (r && WMS.drawer) WMS.drawer.innerHTML = WMS.drawerHTML(p[0], r);
    else if (r === null) WMS.closeDrawer();
  }
};

/* ---------------- 通知（顶栏铃铛） ---------------- */
WMS.renderNotify = function () {
  var list = WMS.DB.notify || [];
  var unread = 0, i;
  for (i = 0; i < list.length; i++) if (!list[i].read) unread++;
  var bell = $('[data-notify-toggle]');
  if (bell) {
    var dot = $('.badge-dot', bell);
    if (dot) {
      if (unread) { dot.textContent = unread > 9 ? '9+' : unread; dot.style.display = ''; }
      else dot.style.display = 'none';
    }
    bell.setAttribute('aria-label', '通知，' + unread + ' 条未读');
  }
};

/* ============================================================
   详情抽屉
   ============================================================ */
WMS.drawer = null;

WMS.drawerHTML = function (kind, r) {
  var h = '';

  /* 头部 */
  h += '<div class="drawer-head"><div><h2>' + WMS.esc(r.id) + '</h2>' +
       '<div class="sub">' + WMS.titleOf(kind, r) + ' · ' + WMS.badgeOf(kind, r) + '</div></div>' +
       '<button class="drawer-close" type="button" data-close-drawer aria-label="关闭">' +
       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
       '</button></div>';

  h += '<div class="drawer-body">';

  /* 关键提示 */
  if (r.note) {
    var danger = r.status === 'error' || r.status === 'stalled' || r.status === 'addrerr' ||
                 r.status === 'oos' || r.status === 'low' || r.status === 'failed';
    h += '<div class="note-box' + (danger ? '' : ' info') + '">' + WMS.esc(r.note) + '</div>';
  }

  /* 基本信息 */
  h += '<section class="drawer-sec"><h3>基本信息</h3><dl class="dl">' + WMS.fieldsOf(kind, r) + '</dl></section>';

  /* 明细 */
  var lines = WMS.linesOf(kind, r);
  if (lines) h += lines;

  /* 时间线 */
  if (r.timeline && r.timeline.length) {
    h += '<section class="drawer-sec"><h3>作业轨迹</h3><div class="stepper">';
    for (var i = 0; i < r.timeline.length; i++) {
      var t = r.timeline[i];
      var ic = t.state === 'done' ? '✓' : (t.state === 'error' ? '!' : (i + 1));
      h += '<div class="step ' + t.state + '"><span class="step-dot" aria-hidden="true">' + ic + '</span>' +
           '<div class="step-body"><div class="step-title">' + WMS.esc(t.title) + '</div>' +
           '<div class="step-meta">' + WMS.esc(t.t) + ' · ' + WMS.esc(t.meta) + '</div></div></div>';
    }
    h += '</div></section>';
  }

  h += '</div>';

  /* 底部动作 */
  h += '<div class="drawer-foot">' +
       '<button class="btn" type="button" data-print>打印详情</button>' +
       WMS.footAction(kind, r) +
       '</div>';
  return h;
};

/* ============================================================
   模块扩展注册表
   新增业务模块时，只需在自己的 assets/mod-*.js 里向这三个对象注册，
   无需改动本文件，从根本上避免多模块并发修改同一处。
     WMS.TITLE_EXTRA[kind] = function (r) { return '标题副文本'; }
     WMS.FIELDS_EXTRA[kind] = function (r, add) { add('标签','值'); }
     WMS.LINES_EXTRA[kind]  = function (r) { return '<section…>…</section>'; }
   ============================================================ */
WMS.TITLE_EXTRA = {};
WMS.FIELDS_EXTRA = {};
WMS.LINES_EXTRA = {};

WMS.titleOf = function (kind, r) {
  if (WMS.TITLE_EXTRA[kind]) return WMS.TITLE_EXTRA[kind](r);
  var m = {asn:'入库单', sku:'库存 SKU', out:'出库单', loc:'库位', rpt:'报表', usr:'用户账号',
           order:'平台订单', ret:'退件单', retn:'处置队列', tenant:'货主', bill:'账单', pda:'PDA 任务', wh:'仓库', ledger:'库存流水'};
  var sub = {
    asn: r.supplier + ' · ' + r.wh,
    sku: r.name + ' · ' + r.wh,
    out: r.ch + ' · ' + r.carrier,
    loc: r.zone + ' ' + r.type + ' · ' + r.wh,
    rpt: r.cat + ' · ' + r.freq,
    usr: r.role + ' · ' + r.whs,
    order: r.ch + ' · ' + r.tenant,
    ret: r.type + ' · ' + r.tenant,
    retn: r.act + ' · ' + r.tenant,
    tenant: r.tpl + ' · ' + r.cur,
    bill: r.tenant + ' · ' + r.period,
    pda: r.type + ' · ' + r.target,
    wh: r.country + ' · ' + r.tz,
    ledger: r.tenant + ' · ' + r.sku + ' · ' + (r.dir === 'IN' ? '+' : (r.dir === 'OUT' ? '-' : '±')) + (r.qty === 0 ? '0' : WMS.num(r.qty))
  };
  return (m[kind] || '') + ' · ' + (sub[kind] || '');
};

WMS.badgeOf = function (kind, r) {
  if (WMS.STATUS_BY[kind]) {
    var b = WMS.STATUS_BY[kind][r.status];
    return b ? b.text : r.status;
  }
  return WMS.statusText(kind === 'loc' ? 'loc' : (kind === 'rpt' ? 'rpt' : ''), r.status)
    .replace(/<[^>]*>/g, '');
};

WMS.fieldsOf = function (kind, r) {
  var f = [];
  var add = function (k, v) { f.push('<dt>' + k + '</dt><dd>' + v + '</dd>'); };

  if (WMS.FIELDS_EXTRA[kind]) { WMS.FIELDS_EXTRA[kind](r, add); return f.join(''); }
  if (kind === 'asn') {
    add('货主', WMS.esc(r.tenant || r.supplier));
    add('供应商', WMS.esc(r.supplier));
    add('联系人', WMS.esc(r.contact) + ' · ' + r.phone);
    add('目的仓', r.wh);
    add('运输方式', r.mode);
    add('箱数进度', r.got + ' / ' + r.box + ' 箱');
    add('预计到货', r.eta);
    add('卸货月台', r.dock);
    add('柜号/板号', WMS.esc(r.container));
    add('毛重', r.weight);
    add('采购单号', r.po);
    add('创建', r.created + ' · ' + r.creator);
  } else if (kind === 'sku') {
    add('商品名称', WMS.esc(r.name));
    add('品类', r.cat);
    add('所在仓', r.wh);
    add('主库位', r.loc);
    add('可用 / 锁定', WMS.num(r.avail) + ' / ' + WMS.num(r.lock));
    add('安全线', WMS.num(r.safety));
    add('单位成本', r.cost);
    add('供应商', WMS.esc(r.supplier));
    add('最近入库', r.lastIn);
    add('周转', r.turnover);
    add('动销', r.velocity);
  } else if (kind === 'out') {
    add('货主', WMS.esc(r.tenant || '—'));
    add('销售渠道', WMS.esc(r.ch));
    add('仓库', r.wh);
    add('目的国', r.country);
    add('承运商', r.carrier);
    add('运单号', r.tracking);
    add('件数', r.pieces);
    add('SLA 截止', r.sla);
    add('运费', r.cost);
    add('收件人', WMS.esc(r.customer));
    add('地址', WMS.esc(r.addr));
  } else if (kind === 'loc') {
    add('仓库', r.wh);
    add('库区', r.zone);
    add('类型', r.type);
    add('货主归属', WMS.esc(r.own || '混放'));
    add('存放 SKU', WMS.esc(r.sku));
    add('商品', WMS.esc(r.name));
    add('容积', WMS.esc(r.cap));
    add('批次', WMS.esc(r.batch));
    add('最近盘点', r.lastCount);
    add('绑定拣货员', r.picker);
  } else if (kind === 'rpt') {
    add('分类', r.cat);
    add('更新频率', r.freq);
    add('负责人', r.owner);
    add('订阅数', r.subs);
    add('统计区间', r.range);
    add('最近生成', r.last);
    add('说明', WMS.esc(r.desc));
  } else if (kind === 'usr') {
    add('姓名', WMS.esc(r.name));
    add('角色', r.role);
    add('邮箱', WMS.esc(r.email));
    add('手机号', r.phone);
    add('管辖仓库', r.whs);
    add('最近登录', r.last);
    var p = [], k;
    for (k in r.perms) if (r.perms[k]) p.push(k);
    add('已授权', p.length ? p.join(' · ') : '无');
  } else if (kind === 'order') {
    add('渠道', WMS.esc(r.ch));
    add('货主', WMS.esc(r.tenant));
    add('收货地', r.country + ' · ' + WMS.esc(r.city));
    add('SKU / 件数', r.skus + ' SKU / ' + r.pieces + ' 件');
    add('分仓结果', WMS.esc(r.wh) + '（' + WMS.esc(r.score) + '）');
    add('承运商', r.carrier);
    add('状态', WMS.statusTextOf('order', r.status));
  } else if (kind === 'ret') {
    add('退货类型', WMS.esc(r.type));
    add('货主', WMS.esc(r.tenant));
    add('收货仓', r.wh);
    add('件数', r.qty);
    add('SKU', r.sku);
    add('商品', WMS.esc(r.name));
    add('质检分级', WMS.esc(r.grade));
    add('存放位置', WMS.esc(r.loc));
    add('退货原因', WMS.esc(r.reason));
  } else if (kind === 'retn') {
    add('来源退件单', WMS.short(r.src));
    add('货主', WMS.esc(r.tenant));
    add('SKU / 件数', r.sku + ' / ' + r.qty + ' 件');
    add('目标动作', WMS.esc(r.act));
    add('新标识', WMS.esc(r.tag));
    add('负责人', WMS.esc(r.owner));
    add('作业仓', r.wh);
  } else if (kind === 'tenant') {
    add('货主名称', WMS.esc(r.name));
    add('对接渠道', WMS.esc(r.ch));
    add('币种', r.cur);
    add('计费模板', WMS.esc(r.tpl));
    add('库位策略', WMS.esc(r.policy));
    add('账面应收', r.ar);
    add('联系人', WMS.esc(r.contact) + ' · ' + r.phone);
    add('合作起始', r.since);
    add('管辖仓库', r.whs);
    add('本月出库', r.outM);
    add('账期', r.term);
  } else if (kind === 'wh') {
    add('仓库编码', r.id);
    add('仓库名称', WMS.esc(r.name));
    add('国家/地区', r.country);
    add('时区', WMS.esc(r.tz));
    add('结算币种', r.cur);
    add('详细地址', WMS.esc(r.addr));
    add('库区划分', WMS.esc(r.zones));
    add('库位总数', WMS.num(r.locs));
    add('月台数量', r.docks);
    add('库容水位', r.fill + '%');
    add('合作货主', r.tenants + ' 家');
    add('建筑面积', WMS.esc(r.area));
    add('库容规格', WMS.esc(r.cap));
    add('承运商截单', WMS.esc(r.cutoff));
    add('作业时间', WMS.esc(r.hrs));
    add('节假日', WMS.esc(r.holiday));
    add('投运时间', r.since);
  } else if (kind === 'bill') {
    add('货主', WMS.esc(r.tenant));
    add('账期', WMS.esc(r.period));
    add('系统金额', r.sys);
    add('货主确认', r.conf);
    add('差异', r.diff);
    add('到期日', r.due);
    add('计价币种', r.cur);
    add('明细笔数', r.lines + ' 笔');
  } else if (kind === 'pda') {
    add('任务类型', WMS.esc(r.type));
    add('目标', WMS.esc(r.target));
    add('件数', r.qty);
    add('优先级', WMS.esc(r.prio));
    add('执行设备', WMS.esc(r.device));
    add('关联单据', WMS.esc(r.doc));
    add('负责人', WMS.esc(r.owner));
  }
  return f.join('');
};

WMS.linesOf = function (kind, r) {
  if (WMS.LINES_EXTRA[kind]) {
    var ex = WMS.LINES_EXTRA[kind](r);
    if (ex) return ex;
  }
  if (kind === 'asn' && r.items && r.items.length) {
    var h = '<section class="drawer-sec"><h3>商品明细 · ' + r.items.length + ' 项</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">SKU</th><th scope="col">品名</th><th scope="col">批次</th><th scope="col">箱数</th></tr></thead><tbody>';
    r.items.forEach(function (it) {
      h += '<tr><td class="td-num">' + it.sku + '</td><td>' + WMS.esc(it.name) +
           '</td><td class="td-num">' + it.lot + '</td><td class="td-num">' + it.qty + '</td></tr>';
    });
    return h + '</tbody></table></div></section>';
  }
  if (kind === 'sku' && r.batches && r.batches.length) {
    var h2 = '<section class="drawer-sec"><h3>批次 · ' + r.batches.length + '</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">批次号</th><th scope="col">数量</th><th scope="col">效期</th><th scope="col">入库</th></tr></thead><tbody>';
    r.batches.forEach(function (b) {
      var expBad = b.exp !== '—' && b.exp < '2026-10-11';
      h2 += '<tr><td class="td-num">' + b.lot + '</td><td class="td-num">' + WMS.num(b.qty) +
            '</td><td class="td-num' + (expBad ? ' text-danger' : '') + '">' + b.exp +
            '</td><td class="td-num">' + b.in + '</td></tr>';
    });
    h2 += '</tbody></table></div>';
    if (r.bins && r.bins.length) {
      h2 += '<h3 style="margin-top:12px">库位分布</h3><div class="table-wrap"><table><thead><tr>' +
        '<th scope="col">库位</th><th scope="col">类型</th><th scope="col">在位</th><th scope="col">锁定</th></tr></thead><tbody>';
      r.bins.forEach(function (b) {
        h2 += '<tr><td class="td-num">' + b.loc + '</td><td>' + b.type +
              '</td><td class="td-num">' + WMS.num(b.qty) + '</td><td class="td-num">' + WMS.num(b.lock) + '</td></tr>';
      });
      h2 += '</tbody></table></div>';
    }
    return h2 + '</section>';
  }
  if (kind === 'out' && r.items && r.items.length) {
    var h3 = '<section class="drawer-sec"><h3>拣货明细 · ' + r.pieces + ' 件</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">SKU</th><th scope="col">品名</th><th scope="col">库位</th><th scope="col">数量</th></tr></thead><tbody>';
    r.items.forEach(function (it) {
      h3 += '<tr><td class="td-num">' + it.sku + '</td><td>' + WMS.esc(it.name) +
            '</td><td class="td-num">' + it.loc + '</td><td class="td-num">' + it.qty + '</td></tr>';
    });
    return h3 + '</tbody></table></div></section>';
  }
  if (kind === 'rpt' && r.rows && r.rows.length) {
    var h4 = '<section class="drawer-sec"><h3>数据预览</h3><div class="table-wrap"><table><thead><tr>';
    r.cols.forEach(function (c) { h4 += '<th scope="col">' + WMS.esc(c) + '</th>'; });
    h4 += '</tr></thead><tbody>';
    r.rows.forEach(function (row) {
      h4 += '<tr>';
      row.forEach(function (c, i) {
        h4 += '<td class="' + (i === 0 ? 'td-strong' : 'td-num') + '">' + WMS.esc(c) + '</td>';
      });
      h4 += '</tr>';
    });
    return h4 + '</tbody></table></div></section>';
  }
  if (kind === 'rpt' && r.sum && r.sum.length) {
    var h5 = '<section class="drawer-sec"><h3>结论摘要</h3><div class="alert-list">';
    r.sum.forEach(function (s) {
      h5 += '<div class="alert sev-low"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 16h.01"/><path d="M12 8v4"/></svg>' +
            '<div class="alert-body"><div class="alert-title">' + WMS.esc(s) + '</div></div></div>';
    });
    return h5 + '</div></section>';
  }
  if (kind === 'order' && r.items && r.items.length) {
    var h6 = '<section class="drawer-sec"><h3>商品明细 · ' + r.items.length + ' 项</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">SKU</th><th scope="col">品名</th><th scope="col">数量</th></tr></thead><tbody>';
    r.items.forEach(function (it) {
      h6 += '<tr><td class="td-num">' + it.sku + '</td><td>' + WMS.esc(it.name) +
            '</td><td class="td-num">' + it.qty + '</td></tr>';
    });
    return h6 + '</tbody></table></div></section>';
  }
  if (kind === 'wh') {
    var zh = '<section class="drawer-sec"><h3>库区与月台</h3><div class="table-wrap"><table><thead><tr>' +
      '<th scope="col">项目</th><th scope="col">数量 / 内容</th><th scope="col">状态</th></tr></thead><tbody>';
    var zrows = [
      { k: '库区划分', v: WMS.esc(r.zones), ok: r.locs > 0, yes: '已生成', no: '待规划' },
      { k: '库位总数', v: WMS.num(r.locs), ok: r.locs > 0, yes: '已导入', no: '未导入' },
      { k: '月台数量', v: r.docks + ' 个', ok: true, yes: '可用', no: '不可用' },
      { k: '合作货主', v: r.tenants + ' 家', ok: r.tenants > 0, yes: '已授权', no: '未开通' },
      { k: '承运商交接', v: WMS.esc(r.cutoff), ok: r.status === 'active', yes: '已配置', no: '待配置' }
    ];
    zrows.forEach(function (x) {
      zh += '<tr><td>' + x.k + '</td><td class="td-num">' + x.v + '</td><td class="' +
            (x.ok ? 'text-success' : 'text-warning') + '">' + (x.ok ? x.yes : x.no) + '</td></tr>';
    });
    zh += '</tbody></table></div></section>';

    var ck = '<section class="drawer-sec"><h3>投运前检查</h3><div class="check-list">';
    var checks = [
      { t: '库区与库位已生成', ok: r.locs > 0 },
      { t: '货主已授权入驻', ok: r.tenants > 0 },
      { t: '承运商交接与截单时间已配置', ok: r.status === 'active' },
      { t: '作业时间与节假日已设定', ok: r.hrs !== '待定' }
    ];
    checks.forEach(function (c, i) {
      ck += '<div class="check"><input type="checkbox" id="wck' + i + '" ' + (c.ok ? 'checked' : '') + ' disabled>' +
            '<div class="check-body"><label class="check-title" for="wck' + i + '">' + c.t + '</label>' +
            '<div class="check-help">' + (c.ok ? '已完成' : '未完成 · 完成后才能启用仓库') + '</div></div></div>';
    });
    return zh + ck + '</div></section>';
  }
  return '';
};

WMS.footAction = function (kind, r) {
  var defs = WMS.OPS[kind] || [];
  for (var i = 0; i < defs.length; i++) {
    if (defs[i].on.indexOf(r.status) !== -1) {
      return '<button class="btn ' + (defs[i].danger ? 'btn-danger' : 'btn-primary') + '" type="button" ' +
             'data-action="' + kind + ':' + r.id + ':' + defs[i].k + '">' + defs[i].t + '</button>';
    }
  }
  return '<button class="btn" type="button" data-close-drawer>关闭</button>';
};

WMS.openDrawer = function (spec) {
  var p = spec.split(':');
  var kind = p[0], id = p.slice(1).join(':');
  var r = WMS.find(kind, id);
  if (!r) { WMS.toast('记录不存在：' + id, 'error'); return; }

  if (!WMS.drawer) {
    WMS.drawer = document.createElement('div');
    WMS.drawer.className = 'drawer';
    WMS.drawer.setAttribute('role', 'dialog');
    WMS.drawer.setAttribute('aria-modal', 'true');
    WMS.drawer.setAttribute('aria-label', '详情');
    document.body.appendChild(WMS.drawer);
    WMS.drawerBD = document.createElement('div');
    WMS.drawerBD.className = 'drawer-backdrop';
    document.body.appendChild(WMS.drawerBD);
    WMS.drawerBD.addEventListener('click', WMS.closeDrawer);
  }
  WMS.drawer.innerHTML = WMS.drawerHTML(kind, r);
  WMS.drawerSpec = spec;
  WMS.drawer.setAttribute('aria-label', id + ' 详情');
  requestAnimationFrame(function () {
    WMS.drawer.classList.add('open');
    WMS.drawerBD.classList.add('open');
  });
  WMS.lastFocus = document.activeElement;
  var c = WMS.$('.drawer-close', WMS.drawer);
  if (c) c.focus();
};

WMS.closeDrawer = function () {
  if (!WMS.drawer) return;
  WMS.drawer.classList.remove('open');
  WMS.drawerBD.classList.remove('open');
  WMS.drawerSpec = null;
  if (WMS.lastFocus && WMS.lastFocus.focus) WMS.lastFocus.focus();
};
