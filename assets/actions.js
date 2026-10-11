/* ============================================================
   海外仓 WMS · 交互引擎
   把 data-toast 的"假按钮"升级为真实交互：
     · 详情抽屉      [data-drawer="kind:id"]
     · 状态流转      [data-action="kind:id:key"] → WMS.ACTIONS
     · 新建 / 编辑   [data-form="kind"]          → WMS.openForm
     · 真实导出      [data-export="文件名"]       → CSV 下载
     · 列表弹窗      [data-list="countTask"]      → WMS.listModal
     · 通知中心      [data-notify-toggle]
     · 用户菜单      [data-menu-toggle]
     · 状态持久化    localStorage（WMS.save / WMS.resetDemo）
   依赖：data.js（WMS.DB / STATUS）· app.js（渲染 / 抽屉）· ui.js（toast / confirm）
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return WMS.esc(s); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  /* ================= 基础工具 ================= */
  WMS.now = function () {
    var d = new Date();
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  /* 自增单号：WMS.nextId('ASN-20261011-', 'asn') → ASN-20261011-0143 */
  WMS.nextId = function (prefix, kind) {
    var max = 0, i;
    var a = WMS.DB[kind] || [];
    for (i = 0; i < a.length; i++) {
      var m = String(a[i].id).match(/(\d+)$/);
      if (m && a[i].id.indexOf(prefix) === 0) max = Math.max(max, parseInt(m[1], 10));
    }
    var tail = String(max + 1);
    while (tail.length < 4) tail = '0' + tail;
    return prefix + tail;
  };

  /* 时间线推进：把当前 active 置为 done，追加新节点 */
  WMS.push = function (r, title, meta, state) {
    if (!r.timeline) r.timeline = [];
    var i;
    for (i = 0; i < r.timeline.length; i++) {
      if (r.timeline[i].state === 'active') r.timeline[i].state = 'done';
    }
    r.timeline.push({ t: WMS.now(), title: title, meta: meta, state: state || 'active' });
    /* 只保留最近 8 条，避免抽屉过长 */
    if (r.timeline.length > 8) r.timeline = r.timeline.slice(-8);
  };

  /* ============================================================
     库存变更唯一入口（FIX-01 / FIX-11）
     ------------------------------------------------------------
     口径（模型 A · 分池）：
       在库物理量 = avail + lock
       预占 reserve  ：avail -= q, lock += q  （货物仍在仓，被订单占住）
       释放 release  ：lock -= q, avail += q  （退回可用池）
       交接 handover ：lock -= q              （货物离仓）
       上架 putaway  ：avail += q
       退货 ret-in   ：avail += q
       调整 adjust   ：avail ± q
     禁止在业务代码里直接写 s.avail / s.lock，一律走本函数。
     每次变更自动追加一条 inventory_ledger 流水（append-only）。
     ============================================================ */
  WMS.stockMove = function (opt) {
    var sku = opt.sku;
    if (!sku) return { ok: false, msg: '库存记录不存在' };
    var qty = opt.qty || 0, kind = opt.kind;
    if (!kind) return { ok: false, msg: '缺少库存变更类型' };

    var tenant = opt.tenant || sku.supplier || '—';
    var beforeAvail = sku.avail, beforeLock = sku.lock;

    switch (kind) {
      case 'putaway':  if (qty <= 0) return { ok:false, msg:'上架数量必须大于 0' };
                      sku.avail += qty; break;
      case 'ret-in':   if (qty <= 0) return { ok:false, msg:'退货数量必须大于 0' };
                      sku.avail += qty; break;
      case 'reserve':  if (qty > sku.avail) return { ok: false, msg: '可用库存不足：需 ' + qty + '，余 ' + sku.avail };
                      sku.avail -= qty; sku.lock += qty; break;
      case 'release':  var rq = Math.min(qty, sku.lock);
                      if (rq <= 0) return { ok: false, msg: '无锁定库存可释放' };
                      sku.lock -= rq; sku.avail += rq; qty = rq; break;
      case 'handover': var hq = Math.min(qty, sku.lock);
                      if (hq <= 0) return { ok: false, msg: '无锁定库存可交接，请先预占' };
                      sku.lock -= hq; qty = hq; break;
      case 'adjust':   sku.avail = Math.max(0, sku.avail + qty); break;
      default:         return { ok: false, msg: '未知库存变更类型：' + kind };
    }
    WMS.skuStatus(sku);

    if (WMS.DB.ledger) {
      var dir = (kind === 'handover') ? 'OUT' : (kind === 'adjust' ? 'ADJ' : 'IN');
      WMS.DB.ledger.unshift({
        id: WMS.nextId('LG-' + WMS.now().slice(0, 5) + '-', 'ledger'),
        t: WMS.now(), wh: opt.wh || sku.wh, tenant: tenant,
        sku: sku.id, name: sku.name, lot: opt.lot || '—', loc: opt.loc || sku.loc || '—',
        qty: qty, dir: dir,
        from: opt.from || (kind === 'reserve' ? 'on_hand' : 'in_transit'),
        to:   opt.to   || (kind === 'reserve' ? 'allocated' : (kind === 'handover' ? 'shipped' : 'on_hand')),
        docType: opt.docType || 'MANUAL', doc: opt.doc || '—',
        op: opt.op || '系统', device: opt.device || 'WEB',
        balance: sku.avail + sku.lock,
        note: opt.note || ('可用 ' + beforeAvail + '→' + sku.avail + '，锁定 ' + beforeLock + '→' + sku.lock)
      });
    }
    return { ok: true, avail: sku.avail, lock: sku.lock, qty: qty };
  };

  /* 库存状态重算 */
  WMS.skuStatus = function (s) {
    if (s.status === 'lock' && s.lock > 0) return;
    if (s.status === 'slow' && s.avail > 0) return;
    s.status = s.avail === 0 ? 'oos' : (s.avail < s.safety ? 'low' : 'ok');
  };

  /* 退件单联动（处置队列完成时回写来源退件单） */
  WMS.linkRet = function (srcId, status, note) {
    var r = WMS.find('ret', srcId);
    if (!r) return;
    if (status) r.status = status;
    if (note) r.note = note;
    WMS.push(r, '处置队列已回写', note || '关联队列已完成', 'done');
  };

  /* ================= 持久化 ================= */
  var STORE_KEY = 'wms.db.v1';
  WMS.save = function () {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, db: WMS.DB })); } catch (e) {}
  };
  WMS.loadState = function () {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && o.v === 1 && o.db) {
        for (var k in o.db) if (Object.prototype.hasOwnProperty.call(o.db, k)) WMS.DB[k] = o.db[k];
      }
    } catch (e) {}
  };
  WMS.resetDemo = function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    location.reload();
  };

  /* ================= 动作分发 ================= */
  WMS.ACTIONS = {};

  WMS.actSpec = function (spec) {
    var p = String(spec).split(':');
    var kind = p[0], id = p.slice(1, -1).join(':'), key = p[p.length - 1];
    WMS.act(kind, id, key);
  };

  WMS.act = function (kind, id, key, silent) {
    var r = id === '*' ? null : WMS.find(kind, id);
    if (id !== '*' && !r) { WMS.toast('记录不存在：' + id, 'error'); return; }
    var group = WMS.ACTIONS[kind] || {};
    var fn = group[key];
    if (typeof fn !== 'function') { WMS.toast('操作「' + key + '」暂未开放', 'warn'); return; }
    var res = fn(r, { kind: kind, id: id, key: key }) || {};
    WMS.save();
    WMS.renderAll();
    if (!silent && res.msg !== null) WMS.toast(res.msg || '操作完成', res.type || 'success');
    return res;
  };

  /* ================= 表单弹窗 ================= */
  WMS.formModal = function (opts) {
    var lastFocus = document.activeElement;
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    var fields = opts.fields || [];

    var h = '<div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="wms-fm-t">' +
      '<h2 id="wms-fm-t">' + esc(opts.title || '请填写') + '</h2>' +
      (opts.desc ? '<p style="margin:0 0 12px">' + esc(opts.desc) + '</p>' : '') +
      '<form class="modal-scroll" novalidate><div class="form-grid">';

    fields.forEach(function (f) {
      var id = 'fm-' + f.k;
      var cls = 'ctl' + (f.span ? ' span-2' : '');
      var input;
      if (f.type === 'select') {
        input = '<select id="' + id + '" class="' + cls + '">' +
          (f.options || []).map(function (o) {
            return '<option' + (o === f.value ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
      } else if (f.type === 'textarea') {
        input = '<textarea id="' + id + '" class="' + cls + '" rows="3" placeholder="' +
          esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>';
      } else if (f.type === 'checkbox') {
        input = '<div class="check-list">' + (f.options || []).map(function (o) {
          var cid = id + '-' + esc(o.k);
          return '<label class="check" for="' + cid + '" style="padding:5px 0">' +
            '<input type="checkbox" id="' + cid + '" data-k="' + esc(o.k) + '"' + (o.on ? ' checked' : '') + '>' +
            '<div class="check-body"><span class="check-title">' + esc(o.label || o.k) + '</span></div></label>';
        }).join('') + '</div>';
      } else {
        input = '<input id="' + id + '" class="' + cls + '" type="' + (f.type || 'text') + '"' +
          (f.type === 'number' ? ' step="' + (f.step || '1') + '"' : '') +
          ' value="' + esc(f.value == null ? '' : f.value) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
          (f.readonly ? ' readonly' : '') + '>';
      }
      h += '<div class="form-row' + (f.span || f.type === 'checkbox' ? ' span-2' : '') + '">' +
        '<label for="' + id + '">' + esc(f.label) + (f.required ? ' <span class="text-danger">*</span>' : '') + '</label>' +
        input +
        (f.help ? '<span class="help">' + esc(f.help) + '</span>' : '') +
        '<span class="field-error" hidden></span></div>';
    });

    h += '</div></form><div class="modal-actions">' +
      '<button class="btn" type="button" data-x="cancel">' + esc(opts.cancel || '取消') + '</button>' +
      '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-x="ok">' +
      esc(opts.ok || '保存') + '</button></div></div>';

    bd.innerHTML = h;
    document.body.appendChild(bd);
    requestAnimationFrame(function () { bd.classList.add('open'); });

    var close = function () {
      bd.classList.remove('open');
      setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 160);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    var firstInput = $('input,select,textarea', bd);
    if (firstInput) firstInput.focus();

    /* 失焦即时校验 */
    bd.addEventListener('blur', function (e) {
      var row = e.target.closest ? e.target.closest('.form-row') : null;
      if (!row) return;
      var err = $('.field-error', row);
      if (!err) return;
      if (e.target.value === '' && row.querySelector('.text-danger')) {
        err.textContent = '该项必填'; err.hidden = false; e.target.classList.add('invalid');
      } else { err.hidden = true; e.target.classList.remove('invalid'); }
    }, true);

    bd.addEventListener('click', function (e) {
      if (e.target === bd) { close(); return; }
      var x = e.target.getAttribute && e.target.getAttribute('data-x');
      if (x === 'cancel') { close(); return; }
      if (x !== 'ok') return;

      /* 收集 + 校验 */
      var values = {}, ok = true;
      fields.forEach(function (f) {
        var el = $('#fm-' + f.k, bd);
        var row = el ? el.closest('.form-row') : null;
        var err = row ? $('.field-error', row) : null;
        if (f.type === 'checkbox') {
          values[f.k] = $$('input[data-k]', el).filter(function (c) { return c.checked; })
            .map(function (c) { return c.getAttribute('data-k'); });
          return;
        }
        var v = el ? String(el.value).trim() : '';
        if (f.required && !v) {
          ok = false;
          if (err) { err.textContent = '该项必填'; err.hidden = false; }
          if (el) el.classList.add('invalid');
        } else if (f.type === 'number' && v !== '' && isNaN(Number(v))) {
          ok = false;
          if (err) { err.textContent = '请输入数字'; err.hidden = false; }
          if (el) el.classList.add('invalid');
        } else {
          if (err) err.hidden = true;
          if (el) el.classList.remove('invalid');
        }
        values[f.k] = f.type === 'number' ? (v === '' ? 0 : Number(v)) : v;
      });
      if (!ok) { WMS.toast('请检查标红的必填项', 'warn'); return; }

      close();
      var res = opts.onSubmit ? (opts.onSubmit(values) || {}) : {};
      WMS.save();
      WMS.renderAll();
      if (res.modal) WMS.resultModal(res.modal);
      else WMS.toast(res.msg || '已保存', res.type || 'success');
    });

    bd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    });
  };

  /* 成功回执弹窗 */
  WMS.resultModal = function (o) {
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-success"><div class="ok-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</div><h3>' + esc(o.title || '操作成功') + '</h3>' +
      (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') +
      (o.id ? '<span class="ok-id">' + esc(o.id) + '</span>' : '') +
      '</div><div class="modal-actions"><button class="btn btn-dark" type="button" data-x="ok">' +
      esc(o.ok || '知道了') + '</button></div></div>';
    document.body.appendChild(bd);
    requestAnimationFrame(function () { bd.classList.add('open'); });
    var close = function () {
      bd.classList.remove('open');
      setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 160);
    };
    var btn = $('[data-x="ok"]', bd);
    btn.focus();
    bd.addEventListener('click', function (e) {
      if (e.target === bd || e.target.getAttribute('data-x') === 'ok') close();
    });
    bd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  };

  /* 列表弹窗（波次看板 / 盘点任务 / 通知） */
  WMS.listModal = function (title, cols, rows, note) {
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    var body;
    if (rows.length) {
      body = '<div class="table-wrap"><table><thead><tr>' +
        cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr>' + r.map(function (c, i) {
            return '<td class="' + (i === 0 ? 'td-num td-strong' : '') + '">' + c + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      body = '<div class="empty"><p>暂无记录</p></div>';
    }
    bd.innerHTML = '<div class="modal modal-wide" role="dialog" aria-modal="true">' +
      '<h2>' + esc(title) + '</h2><div class="modal-scroll">' + body +
      (note ? '<div class="note-box info" style="margin-top:12px">' + esc(note) + '</div>' : '') +
      '</div><div class="modal-actions"><button class="btn" type="button" data-x="ok">关闭</button></div></div>';
    document.body.appendChild(bd);
    requestAnimationFrame(function () { bd.classList.add('open'); });
    var close = function () {
      bd.classList.remove('open');
      setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 160);
    };
    $('[data-x="ok"]', bd).focus();
    bd.addEventListener('click', function (e) {
      if (e.target === bd || e.target.getAttribute('data-x') === 'ok') close();
    });
    bd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  };

  /* ================= CSV 导出 ================= */
  WMS.downloadCSV = function (cols, rows, name) {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var csv = '\ufeff' + [cols.map(q).join(',')].concat(
      rows.map(function (r) { return r.map(q).join(','); })).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 200);
  };

  WMS.exportTable = function (table, name) {
    var cols = $$('thead th', table).map(function (th) {
      return th.textContent.replace('↕', '').replace('↑', '').replace('↓', '').trim();
    });
    var rows = $$('tbody tr', table).filter(function (tr) {
      return !tr.classList.contains('no-result') && tr.style.display !== 'none';
    }).map(function (tr) {
      return $$('td', tr).map(function (td) { return td.textContent.replace(/\s+/g, ' ').trim(); });
    });
    if (!rows.length) { WMS.toast('当前没有可导出的记录', 'warn'); return; }
    WMS.downloadCSV(cols, rows, name);
    WMS.toast('已导出「' + name + '」CSV · ' + rows.length + ' 条', 'success');
  };

  /* ================= Tab / 分页 / KPI 同步 ================= */
  WMS.syncTabs = function () {
    WMS.$$('.tabs').forEach(function (tabs) {
      var host = tabs.closest('section') || tabs.closest('.card') || document;
      var tb = host.querySelector('[data-render]');
      if (!tb) return;
      var src = tb.getAttribute('data-source') || tb.getAttribute('data-render');
      var rows = WMS.DB[src] || [];
      WMS.$$('.tab', tabs).forEach(function (tab) {
        var label = (tab.textContent || '').replace(/\s+/g, ' ').replace(/[\d,.\s]+$/, '').trim();
        var cnt = $('.tab-count', tab);
        if (!cnt) return;
        var n;
        if (!label || label === '全部') n = rows.length;
        else {
          n = rows.filter(function (r) {
            /* ledger 等表的维度字段是 dir 而非 status，做一次兼容 */
            var st = (r.status !== undefined) ? r.status : r.dir;
            var s = WMS.statusTextOf(src, st) || '';
            return s.indexOf(label) !== -1 || label.indexOf(s) !== -1;
          }).length;
        }
        cnt.textContent = n;
      });
    });
  };

  WMS.syncPager = function () {
    WMS.$$('.pager').forEach(function (p) {
      var host = p.closest('section') || p.closest('.card') || document;
      var tb = host.querySelector('[data-render]');
      if (!tb) return;
      var src = tb.getAttribute('data-source') || tb.getAttribute('data-render');
      var total = (WMS.DB[src] || []).length;
      var span = p.querySelector('span');
      if (span) span.textContent = '共 ' + WMS.num(total) + ' 条 · 每页 20 条 · 第 1 / 1 页';
      WMS.$$('.page-btn', p).forEach(function (b) {
        var t = (b.textContent || '').trim();
        if (/^\d+$/.test(t)) { if (t !== '1') b.style.display = 'none'; }
        else b.disabled = true;
      });
    });
  };

  WMS.syncKpis = function () {
    WMS.$$('[data-kpi]').forEach(function (el) {
      var spec = el.getAttribute('data-kpi');
      var p = spec.split(':');
      var op = p[0], arg = p[1];
      var v = '';
      if (op === 'count') {
        var q = arg.split('.');
        v = WMS.num((WMS.DB[q[0]] || []).filter(function (r) { return r.status === q[1]; }).length);
      } else if (op === 'sum') {
        var q2 = arg.split('.');
        v = WMS.num((WMS.DB[q2[0]] || []).reduce(function (a, r) { return a + (Number(r[q2[1]]) || 0); }, 0));
      } else if (op === 'total') {
        v = WMS.num((WMS.DB[arg] || []).length);
      }
      if (v !== '') el.innerHTML = v + (el.getAttribute('data-kpi-suffix') || '');

      /* 附属说明：按某字段构成统计（如 运输方式分布） */
      var dk = el.getAttribute('data-kpi-delta');
      if (dk) {
        var dq = dk.split('.');
        var src = WMS.DB[dq[0]] || [];
        var counts = {}, dparts = [];
        src.forEach(function (r) {
          var k = String(r[dq[1]] || '其他');
          counts[k] = (counts[k] || 0) + 1;
        });
        for (var k in counts) dparts.push(k + ' ' + counts[k]);
        var dEl = el.parentNode ? el.parentNode.querySelector('.kpi-delta') : null;
        if (dEl) dEl.textContent = dparts.length ? dparts.join(' · ') : '—';
      }
    });

    /* 汇总提示条：共 N 条 */
    WMS.$$('[data-count-src]').forEach(function (el) {
      var src = el.getAttribute('data-count-src');
      el.textContent = '共 ' + WMS.num((WMS.DB[src] || []).length) + ' 条';
    });
  };

  /* ================= 视图过滤（顶栏搜索 + 仓库切换） ================= */
  WMS.q = '';
  WMS.whCode = '';

  WMS.applyViewFilter = function () {
    var q = (WMS.q || '').toLowerCase();
    var wh = WMS.whCode || '';
    if (!q && !wh) return;
    WMS.$$('[data-render]').forEach(function (tb) {
      var any = false;
      WMS.$$('tbody tr', tb).forEach(function (row) {
        if (row.classList.contains('no-result')) { row.parentNode.removeChild(row); return; }
        var txt = row.textContent.toLowerCase();
        var ok = (!q || txt.indexOf(q) !== -1) && (!wh || txt.indexOf(wh.toLowerCase()) !== -1);
        row.style.display = ok ? '' : 'none';
        if (ok) any = true;
      });
      if (!any) {
        var n = tb.tHead ? tb.tHead.rows[0].cells.length : (tb.closest('table').tHead.rows[0].cells.length);
        var tr = document.createElement('tr');
        tr.className = 'no-result';
        tr.innerHTML = '<td colspan="' + n + '"><div class="empty"><p>没有符合条件的记录</p></div></td>';
        tb.appendChild(tr);
      }
    });
  };

  /* ================= 通知中心 / 用户菜单 ================= */
  var panel = null;
  var closePanel = function () {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    WMS.$$('[data-notify-toggle],[data-menu-toggle]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  };

  WMS.toggleNotify = function () {
    if (panel && panel.getAttribute('data-kind') === 'notify') { closePanel(); return; }
    closePanel();
    var list = WMS.DB.notify || [];
    panel = document.createElement('div');
    panel.className = 'menu';
    panel.setAttribute('data-kind', 'notify');
    panel.setAttribute('role', 'menu');
    panel.innerHTML = '<div class="menu-head">通知中心' +
      '<button class="btn-link" type="button" data-notify-readall style="margin-left:auto">全部已读</button></div>' +
      (list.length ? list.map(function (n, i) {
        return '<button class="menu-item" type="button" role="menuitem" data-notify-i="' + i + '">' +
          (n.read ? '<span style="width:6px;flex-shrink:0"></span>' : '<span class="m-dot"></span>') +
          '<span><span class="m-title">' + esc(n.title) + '</span>' +
          '<span class="m-sub" style="display:block">' + esc(n.sub) + '</span></span>' +
          '<span class="m-time">' + esc(n.time) + '</span></button>';
      }).join('') : '<div class="menu-empty">暂无通知</div>');
    document.body.appendChild(panel);
    var bell = $('[data-notify-toggle]');
    if (bell) bell.setAttribute('aria-expanded', 'true');
  };

  WMS.toggleMenu = function () {
    if (panel && panel.getAttribute('data-kind') === 'menu') { closePanel(); return; }
    closePanel();
    panel = document.createElement('div');
    panel.className = 'menu';
    panel.setAttribute('data-kind', 'menu');
    panel.setAttribute('role', 'menu');
    panel.style.width = '220px';
    panel.innerHTML = '<div class="menu-head">陈工 · 仓库主管</div>' +
      '<button class="menu-item" type="button" role="menuitem" data-menu-a="profile"><span class="m-title">个人资料与偏好</span></button>' +
      '<button class="menu-item" type="button" role="menuitem" data-menu-a="audit"><span class="m-title">我的操作日志</span></button>' +
      '<button class="menu-item" type="button" role="menuitem" data-menu-a="reset"><span class="m-title">重置演示数据</span><span class="m-sub" style="display:block">恢复初始状态</span></button>' +
      '<button class="menu-item" type="button" role="menuitem" data-menu-a="logout"><span class="m-title text-danger">退出登录</span></button>';
    document.body.appendChild(panel);
    var btn = $('[data-menu-toggle]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  };

  /* ============================================================
     业务动作表：每个动作改写数据 → 重渲染 → toast
     ============================================================ */

  /* ---- 入库 ASN ---- */
  WMS.ACTIONS.asn = {
    arrive: function (r) {
      r.status = 'receiving';
      WMS.push(r, '车辆已到仓', r.dock + ' · 已登记到货', 'done');
      return { msg: r.id + ' 已登记到货 · ' + r.dock };
    },
    recv: function (r) {
      var step = Math.max(1, Math.round(r.box * 0.25));
      r.got = Math.min(r.box, r.got + step);
      if (r.got >= r.box) {
        r.status = 'inspecting';
        WMS.push(r, '收货完成', r.got + ' / ' + r.box + ' 箱 · 无短装', 'done');
        return { msg: '收货完成 · ' + r.id + ' ' + r.box + ' / ' + r.box + ' 箱' };
      }
      WMS.push(r, '收货扫码', r.got + ' / ' + r.box + ' 箱', 'active');
      return { msg: '已收货 ' + r.got + ' / ' + r.box + ' 箱 · 进度 ' + Math.round(r.got / r.box * 100) + '%' };
    },
    inspect: function (r) {
      r.status = 'putaway';
      WMS.push(r, '验收通过', '合格 ' + r.box + ' · 不良 0', 'done');
      return { msg: r.id + ' 验收通过 · 已转入待上架' };
    },
    putaway: function (r) {
      r.status = 'done';
      WMS.push(r, '全部上架', '已完成 ' + r.box + ' / ' + r.box + ' 箱', 'done');
      var added = 0, skipped = [];
      (r.items || []).forEach(function (it) {
        var s = WMS.find('sku', it.sku);
        if (!s) { skipped.push(it.sku + '（无此 SKU）'); return; }
        if (s.wh !== r.wh) { skipped.push(it.sku + '（仓库不符）'); return; }
        var res = WMS.stockMove({
          sku: s, qty: it.qty, kind: 'putaway',
          tenant: r.tenant || r.supplier, lot: it.lot, loc: s.loc, wh: r.wh,
          doc: r.id, docType: 'ASN', op: '陈工', device: 'WEB',
          note: 'ASN ' + r.id + ' 上架入账 ' + it.qty + ' 件'
        });
        if (res.ok) { s.lastIn = WMS.now(); added += it.qty; }
        else skipped.push(it.sku + '（' + res.msg + '）');
      });
      if (!(r.items || []).length) return { msg: r.id + ' 无商品明细，无法入账 · 请先添加明细行' };
      var m = r.id + ' 已完成上架 · 入账 ' + WMS.num(added) + ' 件可用库存';
      if (skipped.length) m += ' · 跳过 ' + skipped.length + ' 项：' + skipped.join('、');
      return { msg: m };
    },
    claim: function (r) {
      r.status = 'inspecting';
      r.note = '短装 4 箱已挂起索赔（供应商已确认补发），外箱破损 2 箱转不良品区，本单恢复验收。';
      WMS.push(r, '异常已处理', '索赔已发起 · 恢复验收', 'done');
      return { msg: r.id + ' 异常已处理 · 已恢复验收流程' };
    }
  };

  /* ---- 库存 SKU ---- */
  WMS.ACTIONS.sku = {
    replenish: function (r) {
      var q = Math.max(r.safety * 2 - r.avail, 0);
      var res = WMS.stockMove({
        sku: r, qty: q, kind: 'putaway',
        doc: 'RP-' + WMS.now().slice(0, 5), docType: 'REPLENISH',
        op: '仓库主管', device: 'WEB', note: '补货入库 ' + q + ' 件'
      });
      if (res.ok) r.lastIn = WMS.now();
      return { msg: r.id + ' 已补货入库 ' + WMS.num(q) + ' 件 · 可用 ' + WMS.num(r.avail) };
    },
    release: function (r) {
      var q = r.lock;
      r.avail += q; r.lock = 0;
      WMS.skuStatus(r);
      return { msg: r.id + ' 已释放锁定 ' + WMS.num(q) + ' 件' };
    },
    promo: function (r) {
      r.status = 'ok';
      r.note = '已加入欧洲站清仓活动，预计 14 天清空 ' + WMS.num(r.avail) + ' 件库存。';
      return { msg: r.id + ' 已加入促销清仓 · 预计 14 天清空' };
    },
    adjust: function (r) {
      WMS.formModal({
        title: '调整库存 · ' + r.id,
        desc: '调整将写入库存流水并不可撤销，当前可用 ' + WMS.num(r.avail) + ' 件。',
        ok: '提交调整',
        fields: [
          { k: 'delta', label: '调整数量（可为负）', type: 'number', required: true, value: 0, help: '盘盈填正数，盘亏填负数' },
          { k: 'reason', label: '调整原因', type: 'select', options: ['盘点差异', '破损报废', '样品领用', '系统纠错', '其他'], value: '盘点差异' },
          { k: 'memo', label: '备注', type: 'textarea', span: true, placeholder: '选填，将记入审计日志' }
        ],
        onSubmit: function (v) {
          var before = r.avail;
          var res = WMS.stockMove({
            sku: r, qty: Number(v.delta), kind: 'adjust',
            doc: 'ADJ-' + WMS.now().slice(0, 5), docType: 'ADJUST',
            op: '仓库主管', device: 'WEB',
            note: '库存调整：' + v.reason + ' ' + (v.delta > 0 ? '+' : '') + v.delta + ' 件' + (v.memo ? ' · ' + v.memo : '')
          });
          r.note = '库存调整：' + v.reason + ' ' + (v.delta > 0 ? '+' : '') + v.delta + ' 件（' +
            WMS.num(before) + ' → ' + WMS.num(r.avail) + '）' + (v.memo ? ' · ' + v.memo : '');
          if (res.ok) WMS.toast('调整已写入库存流水 · 可用 ' + WMS.num(before) + ' → ' + WMS.num(r.avail), 'success');
          return { msg: r.id + ' 调整完成 · ' + WMS.num(before) + ' → ' + WMS.num(r.avail) + ' 件' };
        }
      });
      return { msg: null };
    }
  };

  /* ---- 出库单 ---- */
  WMS.ACTIONS.out = {
    pick: function (r) {
      r.status = 'picking';
      WMS.push(r, '开始拣货', '拣货员已领取任务', 'active');
      return { msg: r.id + ' 拣货任务已开始 · 推送至 PDA' };
    },
    pack: function (r) {
      r.status = 'topack';
      WMS.push(r, '拣货完成', r.pieces + ' 件已取 · 转打包台', 'done');
      return { msg: r.id + ' 拣货完成 · 已推送打包台' };
    },
    label: function (r) {
      r.status = 'handed';
      WMS.push(r, '交接 ' + r.carrier, '面单已打印 · 交承运商揽收', 'active');
      var moved = 0, short = [];
      (r.items || []).forEach(function (it) {
        var s = WMS.find('sku', it.sku);
        if (!s) { short.push(it.sku + '（无记录）'); return; }
        var res = WMS.stockMove({
          sku: s, qty: it.qty, kind: 'handover',
          tenant: r.tenant, lot: it.lot, loc: s.loc, wh: r.wh,
          doc: r.id, docType: 'OUTBOUND', op: '打包台', device: 'PDA',
          note: r.id + ' 交接 ' + r.carrier + ' · 货物离仓 ' + it.qty + ' 件'
        });
        if (res.ok) moved += res.qty;
        else short.push(it.sku + '（' + res.msg + '）');
      });
      var m = r.id + ' 面单已打印并交接 ' + r.carrier + ' · 离仓 ' + WMS.num(moved) + ' 件';
      if (short.length) m += ' · ' + short.length + ' 项未扣减：' + short.join('、');
      return { msg: m };
    },
    trace: function (r) {
      r.status = 'shipped';
      r.note = '已向 ' + r.carrier + ' 提交查询工单，轨迹已恢复更新。';
      WMS.push(r, '轨迹恢复更新', '查询工单已关闭', 'done');
      return { msg: r.id + ' 轨迹已恢复 · 查询工单闭环' };
    },
    fixaddr: function (r) {
      WMS.formModal({
        title: '修正地址 · ' + r.id,
        desc: '当前地址：' + r.addr,
        ok: '保存并恢复流程',
        fields: [
          { k: 'addr', label: '完整收件地址', value: r.addr, required: true, span: true, placeholder: '门牌号 / 街道 / 城市 / 邮编 / 国家' },
          { k: 'memo', label: '客服工单备注', type: 'textarea', span: true, value: '客服 CS-2291 已联系买家补全地址' }
        ],
        onSubmit: function (v) {
          r.addr = v.addr;
          r.status = 'waiting';
          r.note = v.memo;
          WMS.push(r, '地址已修正', v.addr, 'done');
          return { msg: r.id + ' 地址已修正 · 订单恢复待拣货' };
        }
      });
      return { msg: null };
    }
  };

  /* ---- 库位 ---- */
  WMS.ACTIONS.loc = {
    lock: function (r) {
      window.wmsConfirm({
        title: '锁定库位', danger: true, ok: '锁定',
        desc: r.id + ' 已满载，锁定后不可继续上架，仅允许出库作业。',
        onOk: function () {
          r.status = 'lock';
          r.note = r.id + ' 已锁定 · 不可继续上架，已通知补货组安排溢出位。';
          WMS.save(); WMS.renderAll();
          WMS.toast(r.id + ' 已锁定 · 已通知补货组', 'success');
        }
      });
      return { msg: null };
    },
    assign: function (r) {
      WMS.formModal({
        title: '分配库位 · ' + r.id,
        desc: r.id + '（' + r.wh + ' · ' + r.type + '）',
        ok: '确认分配',
        fields: [
          { k: 'sku', label: 'SKU', required: true, placeholder: '如 SKU-88231' },
          { k: 'name', label: '商品名称', required: true },
          { k: 'qty', label: '预计上架数量', type: 'number', required: true, value: 100 },
          { k: 'batch', label: '批次号', placeholder: '如 B2604-0912' }
        ],
        onSubmit: function (v) {
          r.sku = v.sku; r.name = v.name; r.batch = v.batch || '—';
          r.status = 'part';
          var cap = parseInt(String(r.cap).split('/')[1], 10) || 500;
          r.fill = Math.min(100, Math.round(v.qty / cap * 100));
          r.cap = WMS.num(v.qty) + ' 件 / ' + WMS.num(cap);
          r.note = '已分配给 ' + v.sku + ' · ' + WMS.num(v.qty) + ' 件。';
          return { msg: r.id + ' 已分配给 ' + v.sku + ' · ' + WMS.num(v.qty) + ' 件' };
        }
      });
      return { msg: null };
    },
    unlock: function (r) {
      r.status = 'part';
      r.note = '已解锁，盘点任务已暂停（差异单保留待复核）。';
      return { msg: r.id + ' 已解锁 · 盘点任务已暂停' };
    },
    count: function (r) {
      r.status = 'lock';
      r.note = '循环盘点中（任务 ' + WMS.nextId('CN-20261011-', 'countTask') + '），盘点完成前不可上架。';
      WMS.DB.countTask.unshift({
        id: WMS.nextId('CN-20261011-', 'countTask'), wh: r.wh, zone: r.zone,
        mode: '循环盘点', diff: '—', owner: '陈工', status: '进行中', due: '10-11 22:00'
      });
      return { msg: r.id + ' 已下架盘点任务 · 状态锁定' };
    }
  };

  /* ---- 报表 ---- */
  WMS.ACTIONS.rpt = {
    view: function (r) { WMS.openDrawer('rpt:' + r.id); return { msg: null }; },
    gen: function (r) {
      r.status = 'generating';
      WMS.toast('「' + r.name + '」已开始生成…', 'success');
      setTimeout(function () {
        r.status = 'ok';
        r.last = WMS.now();
        WMS.save();
        WMS.renderAll();
        WMS.toast('「' + r.name + '」生成完成 · ' + r.range, 'success');
      }, 1600);
      return { msg: null };
    },
    dl: function (r) {
      if (!r.cols || !r.rows) { WMS.toast('该报表暂无数据可下载', 'warn'); return { msg: null }; }
      WMS.downloadCSV(r.cols, r.rows, r.name);
      return { msg: '已下载「' + r.name + '」· ' + r.rows.length + ' 行' };
    }
  };

  /* ---- 用户 ---- */
  WMS.ACTIONS.usr = {
    perms: function (r) {
      var all = ['仓储作业', '库存管理', '出库发货', '库位管理', '数据报表', '系统设置'];
      WMS.formModal({
        title: '编辑权限 · ' + r.name,
        desc: '角色：' + r.role + ' · 管辖仓库：' + r.whs,
        ok: '保存权限',
        fields: [
          { k: 'role', label: '角色', type: 'select', options: ['管理员', '主管', '操作员', '只读'], value: r.role },
          { k: 'whs', label: '管辖仓库', type: 'select', options: ['LAX-01 · EWR-02', 'LAX-01', 'EWR-02', 'BHX-03', 'FRA-04', '全部仓库'], value: r.whs },
          { k: 'perms', label: '功能权限', type: 'checkbox', options: all.map(function (k) { return { k: k, on: !!r.perms[k] }; }) }
        ],
        onSubmit: function (v) {
          r.role = v.role; r.whs = v.whs;
          all.forEach(function (k) { r.perms[k] = v.perms.indexOf(k) !== -1 ? 1 : 0; });
          return { msg: r.name + ' 的权限已更新 · ' + v.perms.length + ' 项授权' };
        }
      });
      return { msg: null };
    },
    disable: function (r) {
      window.wmsConfirm({
        title: '停用账号', danger: true, ok: '停用',
        desc: '停用后 ' + r.name + ' 将立即退出登录，未提交的作业会被保留。',
        onOk: function () {
          r.status = 'off';
          WMS.save(); WMS.renderAll();
          WMS.toast(r.name + ' 账号已停用', 'success');
        }
      });
      return { msg: null };
    },
    enable: function (r) {
      r.status = 'on';
      return { msg: r.name + ' 账号已启用 · 恢复全部原有权限' };
    }
  };

  /* ---- 订单池 ---- */
  var outSeq = 3602;
  WMS.ACTIONS.order = {
    send: function (r) {
      outSeq++;
      var outId = 'OUT-20261011-' + outSeq;
      var wh = String(r.wh).split(' + ')[0];
      WMS.DB.out.unshift({
        id: outId, ch: r.ch, wh: wh, country: r.country, carrier: r.carrier,
        tracking: '待生成', pieces: r.pieces, sla: '10-12 12:00', status: 'waiting', cost: '$6.20',
        customer: r.tenant, addr: r.country + ' · ' + r.city,
        items: (r.items || []).map(function (it) {
          var s = WMS.find('sku', it.sku);
          return { sku: it.sku, name: it.name, qty: it.qty, loc: s ? s.loc : '—' };
        }),
        note: '由订单 ' + r.id + ' 下发生成。',
        timeline: [
          { t: WMS.now(), title: '订单下达', meta: r.ch + ' · ' + r.tenant, state: 'done' },
          { t: WMS.now(), title: '已下发 WMS', meta: wh + ' · 待拣货', state: 'active' }
        ]
      });
      r.status = 'sent';
      r.note = '已下发 ' + wh + ' · 出库单 ' + outId;
      WMS.push(r, '已下发 WMS', outId + ' · ' + wh, 'done');
      return { msg: r.id + ' 已下发 ' + wh + ' · 出库单 ' + outId };
    },
    split: function (r) {
      var half = Math.ceil(r.pieces / 2);
      var newId = r.id + '-B';
      WMS.DB.order.unshift({
        id: newId, ch: r.ch, tenant: r.tenant, pieces: r.pieces - half, skus: 1,
        country: r.country, city: r.city, wh: 'BHX-03', score: '拆单子单', status: 'assign',
        carrier: r.carrier, note: '由 ' + r.id + ' 跨仓拆单产生，待重新分仓。',
        items: (r.items || []).slice(-1),
        timeline: [
          { t: WMS.now(), title: '拆单生成', meta: '来源 ' + r.id, state: 'done' },
          { t: WMS.now(), title: '待分仓', meta: '子单待重新分仓', state: 'active' }
        ]
      });
      r.pieces = half;
      r.wh = String(r.wh).split(' + ')[0];
      r.score = '拆单主单';
      r.note = '已拆分为 2 单，运费差 $1.84，子单 ' + newId + ' 待重新分仓。';
      WMS.push(r, '确认拆单', '拆出子单 ' + newId, 'done');
      return { msg: r.id + ' 已拆分为 2 单 · 子单 ' + newId + ' · 运费差 $1.84' };
    },
    nostock: function (r) {
      window.wmsConfirm({
        title: '处理缺货', danger: true, ok: '通知货主',
        desc: '4 个仓库可用库存均为 0，将通知货主 ' + r.tenant + ' 补货并向渠道端建议下架该 SKU。',
        onOk: function () {
          r.note = '已通知 ' + r.tenant + ' 补货 · 已向渠道端建议下架 ' + (r.items[0] || {}).sku;
          WMS.push(r, '缺货已通知货主', r.tenant + ' · 建议渠道下架', 'done');
          WMS.save(); WMS.renderAll();
          WMS.toast('已通知 ' + r.tenant + ' 补货 · 建议渠道端下架', 'success');
        }
      });
      return { msg: null };
    },
    back: function (r) {
      window.wmsConfirm({
        title: '退回订单', danger: true, ok: '退回',
        desc: '该邮编无尾程承运商覆盖，将退回渠道端并推送通知给货主客服。',
        onOk: function () {
          r.status = 'returned';
          r.note = '已退回 ' + r.ch + ' · 已通知 ' + r.tenant + ' 客服。';
          WMS.push(r, '已退回渠道端', r.ch + ' · 已通知货主客服', 'done');
          WMS.save(); WMS.renderAll();
          WMS.toast(r.id + ' 已退回 ' + r.ch + ' · 已通知货主客服', 'success');
        }
      });
      return { msg: null };
    },
    track: function (r) { WMS.openDrawer('order:' + r.id); return { msg: null }; }
  };

  /* ---- 退件单 ---- */
  WMS.ACTIONS.ret = {
    book: function (r) {
      r.status = 'qc';
      WMS.push(r, '退件已到仓', '月台收货完成 · 转质检', 'done');
      return { msg: r.id + ' 已到仓收货 · 转入质检队列' };
    },
    qc: function (r) {
      if (r.qcDone != null && r.qcDone < r.qty) {
        r.qcDone = Math.min(r.qty, r.qcDone + 12);
        var last = r.timeline[r.timeline.length - 1];
        if (last && last.state === 'active') last.meta = r.qcDone + ' / ' + r.qty + ' 件';
        if (r.qcDone >= r.qty) return WMS.ACTIONS.ret._qcdone(r);
        return { msg: '质检进度 ' + r.qcDone + ' / ' + r.qty + ' 件' };
      }
      return WMS.ACTIONS.ret._qcdone(r);
    },
    _qcdone: function (r) {
      if (r.grade === '可售') {
        r.status = 'done';
        var s = WMS.find('sku', r.sku);
        if (s) {
          WMS.stockMove({
            sku: s, qty: r.qty, kind: 'ret-in',
            tenant: r.tenant, lot: r.lot, loc: s.loc, wh: r.wh,
            doc: r.id, docType: 'RETURN', op: '质检组', device: 'WEB',
            note: '退件 ' + r.id + ' 质检可售 · 重新上架 ' + r.qty + ' 件'
          });
        }
        r.note = '质检判定可售，' + r.qty + ' 件已重新上架，计入可用库存。';
        WMS.push(r, '质检完成', '可售 ' + r.qty + ' · 已重新上架', 'done');
        return { msg: r.id + ' 质检完成 · 可售 ' + r.qty + ' 件已上架' };
      }
      r.status = 'refurb';
      WMS.push(r, '质检完成', '判定：' + r.grade + ' · 转处置队列', 'done');
      return { msg: r.id + ' 质检完成 · 判定「' + r.grade + '」转处置队列' };
    },
    refurb: function (r) {
      var id = WMS.nextId('RL-20261011-', 'retn');
      WMS.DB.retn.unshift({
        id: id, src: r.id, tenant: r.tenant, sku: r.sku, qty: r.qty, act: '翻新',
        tag: '原标保留', owner: '王运营', status: 'waitfix', wh: r.wh,
        note: '由 ' + r.id + ' 生成，需翻新后重新上架。'
      });
      r.status = 'refurb';
      r.note = '已进入翻新队列 ' + id + ' · 预计 2 小时完成。';
      WMS.push(r, '进入翻新队列', id, 'done');
      return { msg: r.id + ' 已进入翻新队列 · 队列单 ' + id };
    },
    relabel: function (r) {
      var id = WMS.nextId('RL-20261011-', 'retn');
      var tag = 'X00' + Math.random().toString(36).slice(2, 6).toUpperCase();
      WMS.DB.retn.unshift({
        id: id, src: r.id, tenant: r.tenant, sku: r.sku, qty: r.qty, act: '换标',
        tag: tag, owner: '陈工', status: 'printing', wh: r.wh,
        note: '新 FNSKU ' + tag + ' 已生成，' + r.qty + ' 张标签待打印。'
      });
      r.status = 'refurb';
      r.note = '已生成新 FNSKU ' + tag + ' · 队列单 ' + id;
      WMS.push(r, '已生成换标任务', id + ' · 新标 ' + tag, 'done');
      return { msg: r.id + ' 已生成新 FNSKU ' + tag + ' · ' + r.qty + ' 张标签入打印队列' };
    },
    scrap: function (r) {
      window.wmsConfirm({
        title: '申请报废', danger: true, ok: '提交申请',
        desc: '该批 ' + r.qty + ' 件判定「' + r.grade + '」不可售，报废前需货主确认。',
        onOk: function () {
          r.status = 'scrapped';
          r.note = '报废申请已提交 · 等待 ' + r.tenant + ' 确认。';
          WMS.push(r, '报废申请已提交', r.qty + ' 件 · 待货主确认', 'done');
          WMS.save(); WMS.renderAll();
          WMS.toast(r.id + ' 报废申请已提交 · 等待货主确认', 'success');
        }
      });
      return { msg: null };
    }
  };

  /* ---- 换标与处置队列 ---- */
  WMS.ACTIONS.retn = {
    print: function (r) {
      r.status = 'waitput';
      r.note = '标签已打印 ' + r.qty + ' 张 · 待上架。';
      return { msg: r.id + ' ' + r.qty + ' 张标签已打印 · 转待上架' };
    },
    startfix: function (r) {
      r.status = 'doing';
      r.note = '翻新进行中 · 负责人 ' + r.owner;
      return { msg: r.id + ' 已进入翻新工位 · 预计 2 小时完成' };
    },
    finishfix: function (r) {
      r.status = 'waitput';
      r.note = '翻新完成 · 待分配库位上架。';
      return { msg: r.id + ' 翻新完成 · 待上架' };
    },
    put: function (r) {
      r.status = 'done';
      r.note = '已上架完成，' + r.qty + ' 件计入可用库存。';
      var s = WMS.find('sku', r.sku);
      if (s) { s.avail += r.qty; WMS.skuStatus(s); }
      WMS.linkRet(r.src, 'done', r.qty + ' 件已完成「' + r.act + '」并重新上架');
      return { msg: r.id + ' 上架完成 · ' + r.qty + ' 件计入可用库存' };
    },
    destroy: function (r) {
      window.wmsConfirm({
        title: '确认销毁', danger: true, ok: '执行销毁',
        desc: '销毁将拍照留档并生成销毁报告，随本月账单发送至 ' + r.tenant + '。',
        onOk: function () {
          r.status = 'done';
          r.note = '已销毁 ' + r.qty + ' 件 · 影像与报告已归档。';
          WMS.linkRet(r.src, 'done', r.qty + ' 件已销毁 · 报告已归档');
          WMS.save(); WMS.renderAll();
          WMS.toast(r.id + ' 已销毁 ' + r.qty + ' 件 · 影像与报告已归档', 'success');
        }
      });
      return { msg: null };
    }
  };

  /* ---- 货主 ---- */
  WMS.ACTIONS.tenant = {
    view: function (r) { WMS.openDrawer('tenant:' + r.id); return { msg: null }; },
    renew: function (r) {
      window.wmsConfirm({
        title: '发起续约', ok: '发起',
        desc: '协议将于 10-31 到期，将向 ' + r.name + ' 发送续约协议，有效期 72 小时。',
        onOk: function () {
          r.status = 'co';
          r.note = '已于 ' + WMS.now() + ' 发送续约协议 · 有效期 72 小时。';
          WMS.save(); WMS.renderAll();
          WMS.toast('已向 ' + r.name + ' 发送续约协议 · 有效期 72 小时', 'success');
        }
      });
      return { msg: null };
    },
    dun: function (r) {
      r.note = '已生成对账单并推送至财务 · 逾期账款 ' + r.ar + '。';
      return { msg: '已生成对账单并推送 ' + r.name + ' 财务 · ' + r.ar };
    }
  };

  /* ---- 账单 ---- */
  WMS.ACTIONS.bill = {
    push: function (r) {
      r.note = '已于 ' + WMS.now() + ' 推送货主确认 · 附 ' + r.lines + ' 笔作业明细。';
      return { msg: r.id + ' 已推送 ' + r.tenant + ' 确认 · 附 ' + r.lines + ' 笔明细' };
    },
    recon: function (r) {
      window.wmsConfirm({
        title: '发起对账', ok: '发起',
        desc: '货主确认金额与系统金额差异 ' + r.diff + '，将创建对账工单并通知货主核对。',
        onOk: function () {
          r.status = 'recon';
          r.note = '已发起对账工单 · 差异 ' + r.diff + '，待 ' + r.tenant + ' 核对。';
          WMS.save(); WMS.renderAll();
          WMS.toast('已发起对账工单 · 待 ' + r.tenant + ' 核对', 'success');
        }
      });
      return { msg: null };
    },
    remind: function (r) {
      r.note = '已发送付款提醒 · 账单 ' + r.sys + ' 将于 ' + r.due + ' 到期。';
      return { msg: r.id + ' 付款提醒已发送 ' + r.tenant };
    },
    pay: function (r) {
      WMS.formModal({
        title: '登记回款 · ' + r.id,
        desc: r.tenant + ' · 应收 ' + r.sys + '（' + r.cur + '）',
        ok: '确认入账',
        fields: [
          { k: 'amount', label: '回款金额', value: r.sys.replace(/[^0-9.,]/g, ''), required: true },
          { k: 'date', label: '到账日期', type: 'date', value: '2026-10-11', required: true },
          { k: 'ref', label: '银行流水号', placeholder: '选填', help: '入账后账单状态变为已结清' }
        ],
        onSubmit: function (v) {
          r.status = 'paid';
          r.conf = r.sys; r.diff = '$0'; r.diffCls = '';
          r.note = '已登记回款 $' + v.amount + '（' + v.date + '）· 账单关闭' + (v.ref ? ' · 流水 ' + v.ref : '');
          var t = WMS.find('tenant', r.tenantId);
          if (t) t.note = '账单 ' + r.id + ' 已回款，账面应收已更新。';
          return { msg: r.id + ' 已登记回款 · 账单关闭' };
        }
      });
      return { msg: null };
    },
    suspend: function (r) {
      window.wmsConfirm({
        title: '停用货主服务', danger: true, ok: '停用',
        desc: '该账单逾期 45 天，停用后 ' + r.tenant + ' 将暂停收货与出库权限，并记录审计日志。',
        onOk: function () {
          var t = WMS.find('tenant', r.tenantId);
          if (t) {
            t.status = 'paused';
            t.note = '因账单 ' + r.id + ' 逾期，服务已暂停。';
          }
          r.note = r.tenant + ' 服务已暂停 · 已记录审计日志。';
          WMS.save(); WMS.renderAll();
          WMS.toast(r.tenant + ' 服务已暂停 · 已记录审计日志', 'success');
        }
      });
      return { msg: null };
    }
  };

  /* ---- PDA 任务 ---- */
  WMS.ACTIONS.pda = {
    open: function (r) { WMS.openDrawer('pda:' + r.id); return { msg: null }; },
    claim: function (r) {
      r.status = 'doing';
      r.device = 'PDA-03';
      r.owner = '陈工';
      r.note = '已由 PDA-03 领取 · ' + WMS.now();
      return { msg: r.id + ' 已领取 · 下发至 PDA-03' };
    },
    finish: function (r) {
      r.status = 'done';
      r.note = '已于 ' + WMS.now() + ' 完成作业。';
      return { msg: r.id + ' 作业已完成 · 绩效已采集' };
    }
  };

  /* ---- 波次（id 传 * 时为批量） ---- */
  WMS.ACTIONS.wave = {
    close: function (r) {
      var id = r ? r.id : '波次';
      var i = WMS.DB.wave.indexOf(r);
      if (i > -1) WMS.DB.wave.splice(i, 1);
      return { msg: id + ' 已关闭 · 剩余订单已退回待拣货池' };
    }
  };

  /* ---- 仓库（新建走表单弹窗，其余为状态流转） ---- */
  WMS.ACTIONS.wh = {
    view: function (r) { WMS.openDrawer('wh:' + r.id); return { msg: null }; },
    enable: function (r) {
      r.status = 'active';
      r.note = WMS.now() + ' 由管理员启用 · 已完成库区模板、货主授权与承运商交接配置';
      WMS.push(r, '仓库启用', '投运前检查通过', 'done');
      return { msg: r.id + ' 已启用 · 开始接收 ASN 与出库单' };
    },
    pause: function (r) {
      r.status = 'hold';
      r.note = WMS.now() + ' 已停用 · 在库库存冻结，未完成作业继续执行';
      WMS.push(r, '仓库停用', '在库库存冻结', 'error');
      return { msg: r.id + ' 已停用 · 在库库存已冻结' };
    },
    zone: function (r) { WMS.openDrawer('wh:' + r.id); return { msg: null }; },
    /* id === '*' 表示工具栏的「新建仓库」 */
    create: function (r, ctx) {
      var steps = ['基础信息', '库区模板', '货主授权', '承运商交接'];
      WMS.formModal({
        title: '新建仓库 · 向导',
        width: 620,
        fields: [
          { k: 'code',   label: '仓库编码',   type: 'text',   required: true, help: 'IATA 风格三字母，如 YYZ' },
          { k: 'name',   label: '仓库名称',   type: 'text',   required: true },
          { k: 'country',label: '国家/地区',  type: 'select', required: true,
            options: ['美国', '英国', '德国', '加拿大', '澳大利亚', '其他'] },
          { k: 'tz',     label: '时区',       type: 'select', required: true, span: 2,
            options: ['UTC-8 美西（PST/PDT）', 'UTC-5 美东（EST/EDT）', 'UTC-5 东部（EST/EDT）',
                      'UTC+0 英国（GMT/BST）', 'UTC+1 德国（CET/CEST）', 'UTC+10 悉尼（AEST/AEDT）', 'UTC+8 中国（CST）'] },
          { k: 'cur',    label: '结算币种',   type: 'select',
            options: ['USD', 'GBP', 'EUR', 'CAD', 'AUD'] },
          { k: 'zones',  label: '库区模板',   type: 'select', required: true,
            options: ['A–C 共 3 区', 'A–D 共 4 区', 'A–F 共 6 区', '暂不生成'] },
          { k: 'locs',   label: '库位数量',   type: 'text',
            help: '按模板估算，可后续批量导入 Excel' },
          { k: 'docks',  label: '月台数量',   type: 'text' },
          { k: 'addr',   label: '详细地址',   type: 'text',   required: true, span: 2 },
          { k: 'note',   label: '备注',       type: 'textarea', span: 2 }
        ],
        submitText: '创建并进入待启用',
        onSubmit: function (v) {
          var id = (v.code || '').toUpperCase();
          if (!id) { WMS.toast('请填写仓库编码', 'warn'); return; }
          if (WMS.find('wh', id)) { WMS.toast('仓库编码 ' + id + ' 已存在', 'error'); return; }
          WMS.DB.wh.unshift({
            id: id,
            name: v.name || id,
            country: v.country || '—',
            tz: v.tz || '—',
            cur: v.cur || 'USD',
            addr: v.addr || '—',
            locs: parseInt(v.locs, 10) || 0,
            docks: parseInt(v.docks, 10) || 1,
            fill: 0,
            tenants: 0,
            zones: v.zones || '待规划',
            status: 'setup',
            since: WMS.now().slice(0, 7),
            area: '—',
            cap: '规划中',
            cutoff: '待定',
            hrs: '待定',
            holiday: '待定',
            note: v.note || '新建仓库，需完成货主授权与承运商交接配置后启用。',
            timeline: [
              { t: WMS.now(), title: '仓库创建', meta: '管理员 · 未开通货主', state: 'active' },
              { t: '—',      title: '开通货主', meta: '待完成', state: 'pending' },
              { t: '—',      title: '承运商交接配置', meta: '待完成', state: 'pending' },
              { t: '—',      title: '投运启用', meta: '待完成', state: 'pending' }
            ]
          });
          WMS.save();
          WMS.renderAll();
          WMS.toast('已创建仓库 ' + id + ' · 当前为「待启用」，需完成 ' + steps.slice(1).join(' / ') + ' 后启用', 'success');
        }
      });
      return { msg: null };
    }
  };

  /* ---- 订单池（OMS，批量操作 id=*） ---- */
  WMS.ACTIONS.oms = {
    pull: function () {
      var chans = ['Amazon', 'Shopify', 'eBay', 'Temu'];
      var tenants = (WMS.DB.tenant || []).map(function (t) { return t.name; });
      var made = 0, i;
      for (i = 0; i < 2; i++) {
        var id = WMS.nextId('ORD-20261011-', 'order');
        WMS.DB.order.unshift({
          id: id, ch: chans[i], tenant: tenants[i % (tenants.length || 1)] || '安克创新科技',
          pieces: 1 + Math.round(Math.random() * 3), skus: 1, country: 'US', city: '洛杉矶 90012',
          wh: '待分配', score: '待分仓', status: 'assign', carrier: 'UPS',
          note: '由自动拉单任务 ' + WMS.now() + ' 拉入，等待分仓规则执行。',
          items: [{ sku: 'SKU-88231', name: '便携式榨汁杯 450ml', qty: 2 }],
          timeline: [
            { t: WMS.now(), title: '订单拉入', meta: chans[i] + ' · 自动拉单', state: 'done' },
            { t: WMS.now(), title: '待分仓', meta: '等待分仓规则执行', state: 'active' }
          ]
        });
        made++;
      }
      return { msg: '已触发全渠道拉单 · 新增 ' + made + ' 单待分仓' };
    },
    assign: function () {
      var pool = (WMS.DB.order || []).filter(function (o) { return o.status === 'assign'; });
      var whOf = { US: 'EWR-02', DE: 'FRA-04', GB: 'BHX-03' };
      var pieces = 0;
      pool.forEach(function (o) {
        o.wh = whOf[o.country] || 'EWR-02';
        o.score = '批量分仓 · 规则命中 R12';
        o.status = 'held';
        o.note = '批量分仓完成，库存已预占。';
        WMS.push(o, '批量分仓完成', o.wh + ' · ' + o.pieces + ' 件已预占', 'done');
        pieces += o.pieces;
      });
      if (!pool.length) return { msg: '没有待分仓的订单', type: 'warn' };
      return { msg: '已分仓 ' + pool.length + ' 单 · 预占 ' + pieces + ' 件 · 命中规则 12 条' };
    }
  };

  /* ---- 系统（设置页） ---- */
  WMS.ACTIONS.sys = {
    save: function () {
      var n = 0;
      WMS.$$('#main form').forEach(function (f) {
        n += WMS.$$('input, select', f).length;
      });
      return { msg: '基础信息已保存 · ' + n + ' 项配置已写入' };
    },
    reset: function () {
      setTimeout(WMS.resetDemo, 500);
      return { msg: '缓存已清空 · 演示数据已重置' };
    }
  };

  /* ---- 报表订阅（无单据上下文） ---- */
  WMS.ACTIONS.rpt.sub = function () {
    return { msg: '已加入订阅 · 每周一 09:00 邮件发送至 ops@company.com' };
  };

  /* ---- 退件批量处置（id=*） ---- */
  WMS.ACTIONS.ret.batch = function () {
    var pool = (WMS.DB.ret || []).filter(function (r) {
      return r.status === 'relabel' || r.status === 'refurb' || r.status === 'scrapped';
    });
    var put = 0;
    pool.forEach(function (r) {
      var s = WMS.find('sku', r.sku);
      if (s) {
        WMS.stockMove({
          sku: s, qty: r.qty, kind: 'ret-in',
          tenant: r.tenant, lot: r.lot, loc: s.loc, wh: r.wh,
          doc: r.id, docType: 'RETURN', op: '仓库主管', device: 'WEB',
          note: '退件 ' + r.id + ' 重新上架 ' + r.qty + ' 件计入可用'
        });
        put += r.qty;
      }
      r.status = 'done';
      r.note = '批量处置完成 · ' + r.qty + ' 件已重新上架计入可用库存。';
      WMS.push(r, '批量处置完成', r.qty + ' 件重新上架', 'done');
    });
    if (!pool.length) return { msg: '没有待处置的退件单', type: 'warn' };
    return { msg: '已处置 ' + pool.length + ' 单 · 重新上架 ' + put + ' 件' };
  };

  /* ---- 账单（id=*） ---- */
  WMS.ACTIONS.bill.trial = function () {
    var bills = WMS.DB.bill || [];
    var total = 0;
    bills.forEach(function (b) {
      var m = String(b.sys || '').replace(/[^0-9.]/g, '');
      total += Number(m) || 0;
    });
    WMS.listModal('本月费用试算', ['账单号', '货主', '账期', '系统金额', '状态'],
      bills.map(function (b) {
        return [b.id, b.tenant, b.period, b.sys, WMS.statusTextOf('bill', b.status)];
      }),
      '按当前作业量试算合计 $' + WMS.num(Math.round(total)) + ' · 18 家货主 · 试算不产生正式账单。');
    return { msg: null };
  };
  WMS.ACTIONS.bill.gen = function () {
    return { msg: '已生成 14 张账单 · 合计 $184,620 · 待推送货主' };
  };

  /* 库位热力图格子点击 → 打开该库位详情 */
  WMS.cellLoc = function (cell) {
    var t = cell.getAttribute('title') || '';
    var m = t.match(/([A-F]-\d{2}-\d{2})/);
    if (!m) return false;
    if (!WMS.find('loc', m[1])) return false;
    WMS.openDrawer('loc:' + m[1]);
    return true;
  };

  /* ================= 新建表单 ================= */
  var WHS = ['LAX-01', 'EWR-02', 'BHX-03', 'FRA-04'];

  WMS.openForm = function (kind, btn) {
    if (kind === 'asn') {
      WMS.formModal({
        title: '新建 ASN 预约单',
        desc: '创建后进入「待到货」，到仓时登记到货即可开始收货。',
        ok: '创建 ASN',
        fields: [
          { k: 'supplier', label: '供应商', required: true, placeholder: '如 深圳致远电子' },
          { k: 'tenant', label: '货主', type: 'select', options: (WMS.DB.tenant || []).map(function (t) { return t.name; }), required: true, value: '深圳致远电子' },
          { k: 'contact', label: '联系人', placeholder: '选填' },
          { k: 'phone', label: '联系电话', placeholder: '选填' },
          { k: 'wh', label: '目的仓', type: 'select', options: WHS, required: true },
          { k: 'mode', label: '运输方式', type: 'select', options: ['海运', '空运', '快递', '铁运'], required: true },
          { k: 'box', label: '箱数', type: 'number', required: true, value: 100 },
          { k: 'eta', label: '预计到货', value: '10-12 09:00', required: true },
          { k: 'dock', label: '卸货月台', type: 'select', options: ['月台 D1', '月台 D2', '月台 D3', '月台 D4', '月台 D5'], value: '月台 D2' },
          { k: 'po', label: '采购单号', placeholder: '如 PO-2026-90500' },
          { k: 'container', label: '柜号 / 板号', placeholder: '选填' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('ASN-20261011-', 'asn');
          WMS.DB.asn.unshift({
            id: id, tenant: v.tenant, supplier: v.supplier, contact: v.contact || '—', phone: v.phone || '—',
            wh: v.wh, mode: v.mode, box: v.box, got: 0, eta: v.eta, status: 'booked',
            dock: v.dock, created: WMS.now(), creator: '陈工',
            container: v.container || '—', weight: '—', po: v.po || '—', note: '',
            items: [], timeline: [
              { t: WMS.now(), title: 'ASN 已创建', meta: '陈工 · ' + (v.po || '无采购单号'), state: 'done' },
              { t: '—', title: '预约到仓', meta: v.eta + ' · ' + v.dock, state: 'active' }
            ]
          });
          return { msg: '已创建 ASN ' + id, modal: { title: 'ASN 已创建', desc: '可在列表中登记到货并开始收货', id: id } };
        }
      });
    } else if (kind === 'loc') {
      WMS.formModal({
        title: '新建库位',
        ok: '创建库位',
        fields: [
          { k: 'id', label: '库位编码', required: true, placeholder: '如 A-04-15', help: '格式：库区-通道-层位' },
          { k: 'wh', label: '仓库', type: 'select', options: WHS, required: true },
          { k: 'zone', label: '库区', type: 'select', options: ['A 区', 'B 区', 'C 区', 'D 区', 'E 区', 'F 区'], value: 'A 区' },
          { k: 'type', label: '类型', type: 'select', options: ['存储位', '拣货位', '暂存位', '退货位'], value: '存储位' },
          { k: 'cap', label: '最大容量（件）', type: 'number', required: true, value: 500 }
        ],
        onSubmit: function (v) {
          if (WMS.find('loc', v.id)) return { msg: '库位 ' + v.id + ' 已存在', type: 'error' };
          WMS.DB.loc.unshift({
            id: v.id, wh: v.wh, zone: v.zone, type: v.type, sku: '—', name: '空闲',
            fill: 0, status: 'free', cap: '0 件 / ' + WMS.num(v.cap), batch: '—',
            lastCount: '—', picker: '—', note: '新建库位，可用于上架分配。'
          });
          return { msg: '已创建库位 ' + v.id, modal: { title: '库位已创建', id: v.id } };
        }
      });
    } else if (kind === 'tenant') {
      WMS.formModal({
        title: '新建货主',
        desc: '新货主默认状态「合作中」，需再配置计费模板与 API 授权后才能接收 ASN。',
        ok: '创建货主',
        fields: [
          { k: 'name', label: '货主名称', required: true, placeholder: '如 深圳致远电子' },
          { k: 'contact', label: '联系人', required: true },
          { k: 'phone', label: '联系电话', required: true },
          { k: 'cur', label: '结算币种', type: 'select', options: ['USD', 'EUR', 'GBP'], value: 'USD' },
          { k: 'tpl', label: '计费模板', type: 'select', options: ['B2C 代发', 'B2B 大货', '退货换标', '混合'], value: 'B2C 代发' },
          { k: 'policy', label: '库位策略', type: 'select', options: ['混放', '独占'], value: '混放' },
          { k: 'whs', label: '开通仓库', type: 'select', options: ['LAX-01', 'EWR-02', 'BHX-03', 'FRA-04', 'LAX-01 · EWR-02'], value: 'LAX-01' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('TN-00', 'tenant');
          WMS.DB.tenant.unshift({
            id: id, name: v.name, ch: '待授权', cur: v.cur, tpl: v.tpl, policy: v.policy,
            ar: '$0', status: 'co', contact: v.contact, phone: v.phone, since: '2026-10',
            whs: v.whs, outM: '0', term: '月结 30 天', note: '新建货主，待配置渠道授权与计费模板。'
          });
          return { msg: '已创建货主 ' + v.name, modal: { title: '货主已创建', desc: '下一步：配置渠道授权与计费模板', id: id } };
        }
      });
    } else if (kind === 'usr') {
      WMS.formModal({
        title: '邀请新成员',
        desc: '邀请链接 24 小时内有效，对方绑定手机号后账号生效。',
        ok: '发送邀请',
        fields: [
          { k: 'name', label: '姓名', required: true },
          { k: 'role', label: '角色', type: 'select', options: ['主管', '操作员', '只读'], value: '操作员', required: true },
          { k: 'phone', label: '手机号', required: true, placeholder: '138****0000' },
          { k: 'email', label: '邮箱', type: 'email', required: true },
          { k: 'whs', label: '管辖仓库', type: 'select', options: ['LAX-01', 'EWR-02', 'BHX-03', 'FRA-04'], value: 'LAX-01' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('U0', 'usr');
          var perms = { '仓储作业': 1, '库存管理': v.role !== '只读' ? 1 : 0, '出库发货': v.role !== '只读' ? 1 : 0,
            '库位管理': 0, '数据报表': v.role === '主管' ? 1 : 0, '系统设置': 0 };
          WMS.DB.usr.push({
            id: id, name: v.name, role: v.role, whs: v.whs, phone: v.phone,
            last: '—', status: 'on', email: v.email, perms: perms
          });
          return { msg: '邀请已发送 · ' + v.name + '（' + v.role + '）', modal: { title: '邀请已发送', desc: '链接 24 小时内有效', id: id } };
        }
      });
    } else if (kind === 'ret') {
      WMS.formModal({
        title: '新建退件预报',
        desc: '创建后进入「待到货」，到仓时执行预约收货进入质检。',
        ok: '创建退件单',
        fields: [
          { k: 'type', label: '退货类型', type: 'select', options: ['FBA 移除', '买家 RMA', '派送失败'], value: 'FBA 移除', required: true },
          { k: 'tenant', label: '货主', type: 'select', options: (WMS.DB.tenant || []).map(function (t) { return t.name; }), required: true },
          { k: 'wh', label: '收货仓', type: 'select', options: WHS, required: true },
          { k: 'qty', label: '件数', type: 'number', required: true, value: 10 },
          { k: 'sku', label: 'SKU', required: true, placeholder: '如 SKU-88231' },
          { k: 'name', label: '商品名称', required: true },
          { k: 'reason', label: '退货原因', type: 'textarea', span: true, placeholder: '如 FBA 库存移除 / 买家拒收' }
        ],
        onSubmit: function (v) {
          var id = WMS.nextId('RTN-20261011-', 'ret');
          WMS.DB.ret.unshift({
            id: id, type: v.type, tenant: v.tenant, wh: v.wh, qty: v.qty, sku: v.sku,
            name: v.name, grade: '待质检', status: 'arrive', loc: '月台',
            reason: v.reason || '—', note: '退件预报已创建，等待货物到仓。',
            timeline: [
              { t: WMS.now(), title: '退件预报已创建', meta: v.type + ' · ' + v.qty + ' 件', state: 'done' },
              { t: '—', title: '预约收货', meta: '待到仓', state: 'active' }
            ]
          });
          return { msg: '已创建退件预报 ' + id, modal: { title: '退件预报已创建', desc: '等待货物到仓', id: id } };
        }
      });
    } else if (kind === 'adjust') {
      WMS.formModal({
        title: '调整库存',
        desc: '库存调整将写入流水并不可撤销，请确认调整数量与原因。',
        ok: '提交调整',
        fields: [
          { k: 'sku', label: 'SKU', type: 'select', options: (WMS.DB.sku || []).map(function (s) { return s.id + ' · ' + s.name; }), required: true },
          { k: 'delta', label: '调整数量（可为负）', type: 'number', required: true, value: 0 },
          { k: 'reason', label: '调整原因', type: 'select', options: ['盘点差异', '破损报废', '样品领用', '系统纠错', '其他'], value: '盘点差异' },
          { k: 'memo', label: '备注', type: 'textarea', span: true, placeholder: '选填，将记入审计日志' }
        ],
        onSubmit: function (v) {
          var s = WMS.find('sku', String(v.sku).split(' · ')[0]);
          if (!s) return { msg: 'SKU 不存在', type: 'error' };
          var before = s.avail;
          s.avail = Math.max(0, s.avail + v.delta);
          s.note = '库存调整：' + v.reason + ' ' + (v.delta > 0 ? '+' : '') + v.delta + ' 件（' +
            WMS.num(before) + ' → ' + WMS.num(s.avail) + '）' + (v.memo ? ' · ' + v.memo : '');
          WMS.skuStatus(s);
          return { msg: s.id + ' 调整完成 · ' + WMS.num(before) + ' → ' + WMS.num(s.avail) + ' 件' };
        }
      });
    } else if (kind === 'wave') {
      WMS.formModal({
        title: '生成拣货波次',
        desc: '将按「仓库 + 渠道 + 承运商」合并生成波次，生成后不可拆分。',
        ok: '生成波次',
        fields: [
          { k: 'wh', label: '仓库', type: 'select', options: WHS, required: true, value: 'LAX-01' },
          { k: 'ch', label: '渠道', type: 'select', options: ['全部渠道', 'Amazon FBA', 'Shopify 独立站', 'eBay', 'Temu 半托管', 'Amazon FBM'], value: '全部渠道' },
          { k: 'carrier', label: '承运商', type: 'select', options: ['全部承运商', 'UPS', 'FedEx', 'DHL', 'Royal Mail', 'Colissimo'], value: '全部承运商' },
          { k: 'cut', label: '截单时间', type: 'select', options: ['15:00 截单', '17:00 截单', '19:30 截单'], value: '17:00 截单' }
        ],
        onSubmit: function (v) {
          var pool = (WMS.DB.out || []).filter(function (o) {
            return o.status === 'waiting' && o.wh === v.wh &&
              (v.ch === '全部渠道' || o.ch === v.ch) &&
              (v.carrier === '全部承运商' || o.carrier === v.carrier);
          });
          var id = WMS.nextId('W-20261011-', 'wave');
          WMS.DB.wave.unshift({ id: id, wh: v.wh, orders: pool.length, done: 0, pickers: '待分配', sla: v.cut });
          pool.forEach(function (o) {
            WMS.push(o, '已入波次 ' + id, v.wh + ' · ' + v.cut, 'active');
          });
          return { msg: '已生成波次 ' + id + ' · ' + pool.length + ' 单', modal: { title: '波次已生成', id: id, desc: pool.length + ' 张订单 · ' + v.cut } };
        }
      });
    } else if (kind === 'batchlabel') {
      var ready = (WMS.DB.out || []).filter(function (o) { return o.status === 'ready'; });
      window.wmsConfirm({
        title: '批量打印面单', ok: '开始打印',
        desc: '将为 ' + ready.length + ' 张待发运订单打印面单并转入已交接。',
        onOk: function () {
          ready.forEach(function (o) { WMS.ACTIONS.out.label(o); });
          WMS.save(); WMS.renderAll();
          WMS.toast('已发送 ' + ready.length + ' 张面单至打印队列', 'success');
        }
      });
    } else if (kind === 'count') {
      WMS.listModal('盘点任务',
        ['任务号', '仓库', '库区', '模式', '负责人', '状态', '截止'],
        (WMS.DB.countTask || []).map(function (c) {
          return [c.id, c.wh, c.zone, c.mode, c.owner, c.status, c.due];
        }),
        '在库位管理页对具体库位执行「盘点」，即可生成新的循环盘点任务。');
    } else if (kind === 'notify') {
      WMS.toggleNotify();
    } else {
      WMS.toast('该表单暂未开放（' + kind + '）', 'warn');
    }
  };

  /* ---- 列表弹窗入口 ---- */
  WMS.openList = function (key) {
    if (key === 'wave') {
      WMS.listModal('波次看板', ['波次号', '仓库', '订单数', '进度', '拣货员', '截单'],
        (WMS.DB.wave || []).map(function (w) {
          return [w.id, w.wh, w.orders, w.done + '%', w.pickers, w.sla];
        }), '生成波次请使用工具栏「生成波次」，将自动合并同仓待拣订单。');
    } else if (key === 'count') {
      WMS.openForm('count');
    } else if (key === 'notify') {
      WMS.toggleNotify();
    } else {
      WMS.toast('列表暂未开放（' + key + '）', 'warn');
    }
  };

  /* ================= 事件委托 ================= */
  document.addEventListener('click', function (e) {
    var t = e.target;

    /* 面板内部点击单独处理 */
    if (panel && panel.contains(t)) {
      var ra = t.closest('[data-notify-readall]');
      if (ra) {
        (WMS.DB.notify || []).forEach(function (n) { n.read = true; });
        WMS.save(); closePanel(); WMS.renderNotify();
        WMS.toast('全部通知已标记为已读', 'success');
        return;
      }
      var ni = t.closest('[data-notify-i]');
      if (ni) {
        var idx = parseInt(ni.getAttribute('data-notify-i'), 10);
        var item = (WMS.DB.notify || [])[idx];
        closePanel();
        if (item) {
          item.read = true; WMS.save(); WMS.renderNotify();
          if (item.go) location.href = item.go + '.html';
          else WMS.toast(item.title, 'success');
        }
        return;
      }
      var ma = t.closest('[data-menu-a]');
      if (ma) {
        var a = ma.getAttribute('data-menu-a');
        closePanel();
        if (a === 'reset') {
          window.wmsConfirm({
            title: '重置演示数据', danger: true, ok: '重置',
            desc: '将清除本地保存的所有操作记录（状态流转、新建单据等），恢复为初始演示数据。',
            onOk: function () { WMS.resetDemo(); }
          });
        } else if (a === 'logout') {
          window.wmsConfirm({
            title: '退出登录', ok: '退出',
            desc: '退出后未提交的作业草稿会被保留，下次登录自动恢复。',
            onOk: function () { WMS.toast('已退出登录（演示环境不会真正跳转）', 'success'); }
          });
        } else if (a === 'profile') {
          WMS.formModal({
            title: '个人资料', ok: '保存',
            fields: [
              { k: 'name', label: '姓名', value: '陈工', required: true },
              { k: 'phone', label: '手机号', value: '138****2041' },
              { k: 'email', label: '邮箱', value: 'chen@company.com' },
              { k: 'whs', label: '默认登录仓', type: 'select', options: ['LAX-01 · EWR-02', 'LAX-01', 'EWR-02', 'BHX-03', 'FRA-04'], value: 'LAX-01 · EWR-02' },
              { k: 'note', label: '签名', type: 'textarea', span: true, placeholder: '展示在操作日志与审批意见中' }
            ],
            onSubmit: function () { return { msg: '个人资料已保存' }; }
          });
        } else if (a === 'audit') {
          var rows = (WMS.DB.out || []).slice(0, 5).map(function (r) {
            return [r.id, WMS.statusTextOf('out', r.status), r.wh, r.carrier];
          });
          WMS.listModal('我的操作日志（近 5 条）', ['单据', '状态', '仓库', '承运商'], rows,
            '真实系统中这里会展示不可篡改的审计流水：操作人 / 设备 / 变更前后值。');
        }
        return;
      }
    }

    /* 抽屉 */
    var close = t.closest('[data-close-drawer]');
    if (close) { WMS.closeDrawer(); return; }
    var pr = t.closest('[data-print]');
    if (pr) { WMS.toast('已调起打印预览…', 'success'); setTimeout(function () { window.print(); }, 120); return; }
    var dr = t.closest('[data-drawer]');
    if (dr) { WMS.openDrawer(dr.getAttribute('data-drawer')); return; }

    /* 导出 */
    var ex = t.closest('[data-export]');
    if (ex) {
      var scope = ex.closest('section') || ex.closest('.card') || document;
      var tb = scope.querySelector('[data-render]');
      if (!tb) {
        var wrap = ex.closest('.toolbar');
        var host = wrap ? wrap.nextElementSibling : null;
        tb = host ? host.querySelector('[data-render]') : null;
      }
      if (!tb) tb = document.querySelector('[data-render]');
      if (tb) WMS.exportTable(tb.closest('table'), ex.getAttribute('data-export') || '导出数据');
      else WMS.toast('未找到可导出的表格', 'warn');
      return;
    }

    /* 表单 */
    var fm = t.closest('[data-form]');
    if (fm) { WMS.openForm(fm.getAttribute('data-form'), fm); return; }

    /* 列表弹窗 */
    var lm = t.closest('[data-list]');
    if (lm) { WMS.openList(lm.getAttribute('data-list')); return; }

    /* 状态流转动作
       注意：若按钮同时带 data-confirm，必须跳过——
       确认权归 ui.js（它会在用户点"确认"后通过 onOk 调用 actSpec），
       否则会出现"点击即执行一次 + 确认后再执行一次"的双重执行。 */
    var ac = t.closest('[data-action]');
    if (ac) {
      if (ac.hasAttribute('data-confirm') && window.wmsConfirm) return;
      WMS.actSpec(ac.getAttribute('data-action'));
      return;
    }

    /* 顶栏 */
    var nt = t.closest('[data-notify-toggle]');
    if (nt) { WMS.toggleNotify(); return; }
    var mt = t.closest('[data-menu-toggle]');
    if (mt) { WMS.toggleMenu(); return; }
    if (panel) closePanel();
  });

  /* ESC 关闭抽屉 / 面板 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel) { closePanel(); return; }
    if (WMS.drawer && WMS.drawer.classList.contains('open')) WMS.closeDrawer();
  });

  /* 顶栏搜索 */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.target && e.target.id === 'q') {
      e.preventDefault();
      WMS.q = e.target.value.trim();
      WMS.renderAll();
      WMS.applyViewFilter();
      var n = WMS.$$('[data-render] tbody tr').filter(function (r) {
        return !r.classList.contains('no-result') && r.style.display !== 'none';
      }).length;
      WMS.toast(WMS.q ? '搜索「' + WMS.q + '」· 命中 ' + n + ' 条' : '已清空搜索', WMS.q && !n ? 'warn' : 'success');
    }
  });

  /* 仓库切换 → 过滤主表 */
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'wh') {
      var m = String(e.target.value).match(/([A-Z]{3}-\d{2})/);
      WMS.whCode = m ? m[1] : '';
      WMS.renderAll();
      WMS.applyViewFilter();
      WMS.toast(WMS.whCode ? '已切换仓库：' + WMS.whCode + ' · 数据已过滤' : '已切回全部仓库', 'success');
    }
  });

  /* ================= 启动 ================= */
  WMS.boot = function () {
    WMS.loadState();
    WMS.renderAll();
    WMS.syncKpis();
    if (window.wmsApplyFilters) window.wmsApplyFilters();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', WMS.boot);
  } else {
    WMS.boot();
  }
})();
