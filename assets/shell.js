/* 海外仓 WMS · 共享外壳（侧边栏 + 顶栏操作区）
   通过 body[data-page] 决定当前高亮项，保证 12 个页面导航始终一致 */
(function () {
  var page = document.body.getAttribute('data-page') || '';

  /* ---- 仓库主数据 ----
     正式环境应由后端 GET /api/v1/warehouses 提供；
     此处为演示数据，与各页面工具栏的仓库选项保持同源。 */
  window.WMS = window.WMS || {};
  WMS.WH = [
    { code:'LAX-01', name:'美西洛杉矶仓',   country:'美国', tz:'UTC-8 美西（PST/PDT）', currency:'USD', status:'active' },
    { code:'EWR-02', name:'美东新泽港仓',   country:'美国', tz:'UTC-5 美东（EST/EDT）', currency:'USD', status:'active' },
    { code:'BHX-03', name:'英国伯明翰仓',   country:'英国', tz:'UTC+0 英国（GMT/BST）', currency:'GBP', status:'active' },
    { code:'FRA-04', name:'德国法兰克福仓', country:'德国', tz:'UTC+1 德国（CET/CEST）', currency:'EUR', status:'active' }
  ];

  /* 页面在 <body data-wh-col="N"> 声明本页哪个表格列存仓库编码 */
  WMS.whCol = function () {
    var v = parseInt(document.body.getAttribute('data-wh-col'), 10);
    return isNaN(v) ? -1 : v;
  };
  /* 顶栏当前选中的仓库编码，空串 = 全部仓库 */
  WMS.whValue = function () {
    var s = document.getElementById('wh');
    return s ? (s.value || '').trim() : '';
  };

  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var E = '</svg>';

  var NAV = [
    { label: '作业', items: [
      { key:'overview',  href:'index.html',     text:'仓储总览',
        icon:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' },
      { key:'orders',    href:'orders.html',    text:'订单中心', count:'146',
        icon:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>' },
      { key:'inbound',   href:'inbound.html',   text:'入库管理', count:'42',
        icon:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>' },
      { key:'inventory', href:'inventory.html', text:'库存管理',
        icon:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>' },
      { key:'outbound',  href:'outbound.html',  text:'出库发货', count:'18',
        icon:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>' },
      { key:'returns',   href:'returns.html',   text:'退件管理', count:'46',
        icon:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>' },
      { key:'pack',      href:'pack.html',      text:'称重复核台', count:'12',
        icon:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 8.7 12"/><path d="M14 13v6"/><path d="M10 17h8"/>' },
      { key:'count',     href:'count.html',     text:'盘点管理', count:'9',
        icon:'<path d="M3 3v18h18"/><path d="m7 15 3-3 3 3 5-5"/><circle cx="18" cy="6" r="3"/>' },
      { key:'tickets',   href:'tickets.html',   text:'异常工单', count:'15',
        icon:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
      { key:'locations', href:'locations.html', text:'库位管理',
        icon:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>' },
      { key:'warehouses',href:'warehouses.html',text:'仓库管理', count:'5',
        icon:'<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>' }
    ]},
    { label: '主数据', items: [
      { key:'ledger',    href:'ledger.html',    text:'库存流水', count:'1284',
        icon:'<path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>' },
      { key:'products',  href:'products.html',  text:'商品主数据', count:'3108',
        icon:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>' },
      { key:'suppliers', href:'suppliers.html', text:'供应商管理', count:'10',
        icon:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' }
    ]},
    { label: '货主与经营', items: [
      { key:'tenants',   href:'tenants.html',   text:'货主管理', count:'18',
        icon:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
      { key:'approvals', href:'approvals.html', text:'审批中心', count:'5',
        icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
      { key:'billing',   href:'billing.html',   text:'计费中心', count:'14',
        icon:'<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>' },
      { key:'pda',       href:'pda.html',       text:'RF 作业终端', count:'5',
        icon:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>' },
      { key:'tracking',  href:'tracking.html',  text:'物流跟踪', count:'5',
        icon:'<path d="M5 17h14"/><path d="m10 12 3 3 3-3"/><circle cx="17.5" cy="6.5" r="2.5"/><path d="M10 17V6"/><path d="M5 7h6"/>' },
      { key:'print',     href:'print.html',     text:'打印中心', count:'2',
        icon:'<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>' }
    ]},
    { label: '分析', items: [
      { key:'reports',   href:'reports.html',   text:'数据报表',
        icon:'<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>' },
      { key:'settings',  href:'settings.html',  text:'系统设置',
        icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' }
    ]}
  ];

  /* ---- sidebar ---- */
  var sidebar = document.getElementById('sidebar');
  if (sidebar) {
    var h = '';
    h += '<div class="brand">'
       +   '<span class="brand-mark" aria-hidden="true">'
       +     S + '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>' + E
       +   '</span>'
       +   '<span class="brand-text">海外仓 WMS<small>OVERSEAS FULFILLMENT</small></span>'
       + '</div>';

    h += '<nav class="nav" aria-label="主导航">';
    NAV.forEach(function (g) {
      h += '<p class="nav-label">' + g.label + '</p>';
      g.items.forEach(function (it) {
        var cur = it.key === page;
        h += '<a href="' + it.href + '"' + (cur ? ' aria-current="page"' : '') + '>'
           +   S + it.icon + E
           +   '<span>' + it.text + '</span>'
           +   (it.count ? '<em class="count num">' + it.count + '</em>' : '')
           + '</a>';
      });
    });
    h += '</nav>';
    h += '<div class="sidebar-foot">v2.4.1 · 节点 4/4 在线</div>';
    sidebar.innerHTML = h;
  }

  /* ---- topbar actions ---- */
  var host = document.getElementById('topbar-actions');
  if (host) {
    /* 仓库下拉选项：先独立构建，避免把函数表达式嵌进 + 连接链里 */
    var whOpts = '<option value="">全部仓库 (' + WMS.WH.length + ')</option>';
    for (var wi = 0; wi < WMS.WH.length; wi++) {
      var w = WMS.WH[wi];
      whOpts += '<option value="' + w.code + '">' + w.name + ' ' + w.code + '</option>';
    }

    host.outerHTML =
        '<div class="search">'
      +   '<label for="q" class="skip-link">搜索</label>'
      +   S + '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' + E
      +   '<input id="q" type="search" placeholder="搜索 SKU / 单号 / 运单号" autocomplete="off">'
      + '</div>'
      + '<div class="topbar-right">'
      +   '<label for="wh" class="skip-link">选择仓库</label>'
      +   '<select id="wh" class="warehouse-select" aria-label="切换仓库数据范围">' + whOpts + '</select>'
      +   '<span class="scope-chip" id="scope-chip" hidden></span>'
      +   '<button class="icon-btn" type="button" aria-label="通知，3 条未读" data-notify-toggle aria-haspopup="true" aria-expanded="false">'
      +     S + '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' + E
      +     '<span class="badge-dot" aria-hidden="true">3</span>'
      +   '</button>'
      +   '<button class="avatar" type="button" aria-label="用户菜单：陈工" data-menu-toggle aria-haspopup="true" aria-expanded="false">陈</button>'
      + '</div>';
  }
})();
