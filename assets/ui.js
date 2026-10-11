/* ============================================================
   海外仓 WMS · 交互层
   覆盖: toast 反馈 / 确认弹窗 / Tab 筛选 / 工具栏过滤 /
        表头排序 / 分页 / 开关 / 库位点选 / 顶栏全局操作
   约定:
     [data-toast="文案"]        → 点击弹出指定 toast
     [data-confirm="说明"]      → 先弹确认框，确认后执行
     [data-title="标题"]        → 确认框标题（配合 data-confirm）
     [data-ok="按钮文案"]       → 确认框确认按钮文案
     [data-danger]             → 确认框使用危险色
     .toolbar .ctl[data-filter-col="0,1"] → 按列索引过滤表格（逗号分隔=或）
     th.sortable               → 点击按该列排序
     .tab                      → 状态筛选（按行内 .badge 文本匹配）
     .page-btn                 → 分页切换
     .switch[role=switch]      → 开关切换
     .cell                     → 库位点选（title 作为反馈文案）
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= toast ================= */
  var wrap = document.createElement('div');
  wrap.className = 'toast-wrap';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  document.body.appendChild(wrap);

  function toast(msg, type) {
    if (!msg) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
    }, 2800);
  }
  window.wmsToast = toast;

  /* ================= modal ================= */
  var lastFocus = null;

  function closeModal(bd) {
    if (!bd) return;
    bd.classList.remove('open');
    setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 160);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openModal(opts) {
    lastFocus = document.activeElement;
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="wms-md-t" aria-describedby="wms-md-d">'
      +   '<h2 id="wms-md-t">' + (opts.title || '请确认') + '</h2>'
      +   '<p id="wms-md-d">' + (opts.desc || '') + '</p>'
      +   '<div class="modal-actions">'
      +     '<button class="btn" type="button" data-x="cancel">取消</button>'
      +     '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-dark') + '" type="button" data-x="ok">'
      +       (opts.ok || '确认')
      +     '</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(bd);

    requestAnimationFrame(function () { bd.classList.add('open'); });

    var okBtn = $('[data-x="ok"]', bd);
    if (okBtn) okBtn.focus();

    bd.addEventListener('click', function (e) {
      if (e.target === bd) { closeModal(bd); return; }
      var x = e.target.getAttribute && e.target.getAttribute('data-x');
      if (x === 'cancel') { closeModal(bd); if (opts.onCancel) opts.onCancel(); }
      if (x === 'ok') { closeModal(bd); if (opts.onOk) opts.onOk(); }
    });

    bd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeModal(bd); if (opts.onCancel) opts.onCancel(); }
      if (e.key === 'Tab') {
        var f = $$('button', bd);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  window.wmsConfirm = openModal;

  /* ================= 上下文文案 ================= */
  function cleanText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function contextOf(btn) {
    var row = btn.closest ? btn.closest('tr') : null;
    if (row) {
      var link = row.querySelector('.td-link');
      if (link) return cleanText(link);
    }
    var cell = btn.closest ? btn.closest('.cell') : null;
    if (cell && cell.title) return cell.title.split('·')[0].trim();
    var card = btn.closest ? btn.closest('.card, section') : null;
    if (card) {
      var h = card.querySelector('.section-head h2');
      if (h) return cleanText(h);
    }
    return '';
  }

  function labelOf(btn) {
    var t = cleanText(btn);
    if (t) return t;
    return btn.getAttribute('aria-label') || btn.getAttribute('title') || '操作';
  }

  function defaultFeedback(btn) {
    var ctx = contextOf(btn);
    var label = labelOf(btn);
    toast(ctx ? label + ' · ' + ctx : '已执行「' + label + '」');
  }

  /* ================= 表格过滤 ================= */
  function colRules() {
    var rules = [];
    $$('.toolbar .ctl[data-filter-col]').forEach(function (c) {
      var v = (c.value || '').trim();
      if (!v || /^全部/.test(v)) return;
      if (c.type === 'date') v = v.slice(5);          /* 2026-10-11 → 10-11 */
      var cols = String(c.getAttribute('data-filter-col')).split(',').map(function (n) {
        return parseInt(n, 10);
      });
      rules.push({ cols: cols, val: v.toLowerCase() });
    });
    return rules;
  }

  function activeTabLabel() {
    var tab = $('.tab[aria-selected="true"]');
    if (!tab) return '';
    var txt = cleanText(tab).replace(/[\d,.\s]+$/, '').trim();
    if (!txt || txt === '全部') return '';
    return txt;
  }

  function ensureNoResult(table) {
    var old = table.querySelector('tr.no-result');
    if (old) old.parentNode.removeChild(old);
    var visible = $$('tbody tr', table).filter(function (r) {
      return !r.classList.contains('no-result') && r.style.display !== 'none';
    });
    if (visible.length === 0) {
      var n = table.tHead ? table.tHead.rows[0].cells.length : 1;
      var tr = document.createElement('tr');
      tr.className = 'no-result';
      tr.innerHTML = '<td colspan="' + n + '"><div class="empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>' +
        '<p>没有符合条件的记录，试试放宽筛选条件</p></div></td>';
      table.tBodies[0].appendChild(tr);
    }
    return visible.length;
  }

  /* ---- 全局仓库范围：顶栏 #wh 选中的仓库作为一条强制过滤规则。
    页面需在 <body data-wh-col="N"> 声明仓库所在的表格列号。 */
  function whRule() {
    if (!window.WMS || !WMS.whValue || !WMS.whCol) return null;
    var v = WMS.whValue();
    var col = WMS.whCol();
    if (!v || col < 0) return null;
    return { cols: [col], val: v.toLowerCase() };
  }

  function applyFilters() {
    var rules = colRules();
    var wh = whRule();
    if (wh) rules.push(wh);
    var tabTxt = activeTabLabel();
    var total = 0;

    $$('table').forEach(function (table) {
      var rows = $$('tbody tr', table).filter(function (r) { return !r.classList.contains('no-result'); });
      if (!rows.length) return;

      rows.forEach(function (row) {
        var ok = true;

        for (var i = 0; i < rules.length; i++) {
          var r = rules[i], hit = false;
          for (var j = 0; j < r.cols.length; j++) {
            var cell = row.children[r.cols[j]];
            if (cell && cleanText(cell).toLowerCase().indexOf(r.val) !== -1) { hit = true; break; }
          }
          if (!hit) { ok = false; break; }
        }

        if (ok && tabTxt) {
          var marks = $$('.badge, .role-tag', row);
          ok = marks.some(function (b) { return cleanText(b).indexOf(tabTxt) !== -1; });
        }

        row.style.display = ok ? '' : 'none';
      });

      total += ensureNoResult(table);
    });

    /* 范围徽标：让用户看到当前是全局范围而非本页筛选 */
    var chip = document.getElementById('scope-chip');
    if (chip) {
      var v2 = WMS.whValue();
      if (v2) { chip.hidden = false; chip.textContent = v2; chip.setAttribute('title', '当前数据范围：' + v2 + '，本页表格已按该仓库过滤'); }
      else { chip.hidden = true; }
    }

    var counter = $('[data-result-count]');
    if (counter && !wh) counter.textContent = '筛选命中 ' + total + ' 条';
    return total;
  }

  /* ================= 表头排序 ================= */
  function sortBy(th) {
    var table = th.closest('table');
    if (!table) return;
    var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
    var asc = th.getAttribute('aria-sort') !== 'ascending';
    var body = table.tBodies[0];

    var nr = body.querySelector('tr.no-result');
    if (nr) nr.parentNode.removeChild(nr);

    var rows = Array.prototype.slice.call(body.rows);
    rows.sort(function (a, b) {
      var x = cleanText(a.cells[idx] || {}).replace(/[^\d.\-]/g, '');
      var y = cleanText(b.cells[idx] || {}).replace(/[^\d.\-]/g, '');
      var nx = parseFloat(x), ny = parseFloat(y);
      var r;
      if (!isNaN(nx) && !isNaN(ny)) r = nx - ny;
      else r = cleanText(a.cells[idx] || {}).localeCompare(cleanText(b.cells[idx] || {}), 'zh');
      return asc ? r : -r;
    });

    rows.forEach(function (r) { body.appendChild(r); });
    $$('th', table).forEach(function (h) { h.removeAttribute('aria-sort'); });
    th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
    toast('已按「' + cleanText(th) + '」' + (asc ? '升序' : '降序') + '排列');
    applyFilters();
  }

  /* ================= 事件委托 ================= */
  document.addEventListener('click', function (e) {
    var t = e.target;

    /* --- 外部空链接：阻止跳转 --- */
    var a = t.closest ? t.closest('a[href="#"]') : null;
    if (a) { e.preventDefault(); toast('演示环境：' + cleanText(a) + ' 暂未接入数据源'); return; }

    /* --- 状态 Tab --- */
    var tab = t.closest ? t.closest('.tab') : null;
    if (tab) {
      var list = tab.parentNode;
      $$('.tab', list).forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      tab.setAttribute('aria-selected', 'true');
      var n = applyFilters();
      toast('筛选「' + cleanText(tab).replace(/[\d,.\s]+$/, '').trim() + '」· ' + n + ' 条结果');
      return;
    }

    /* --- 分页 --- */
    var pg = t.closest ? t.closest('.page-btn') : null;
    if (pg && !pg.disabled) {
      var pager = pg.parentNode;
      if (/^\d+$/.test(cleanText(pg))) {
        $$('.page-btn', pager).forEach(function (x) { x.removeAttribute('aria-current'); });
        pg.setAttribute('aria-current', 'page');
        toast('已切换到第 ' + cleanText(pg) + ' 页');
      } else {
        var cur = $('.page-btn[aria-current="page"]', pager);
        var nums = $$('.page-btn', pager).filter(function (x) { return /^\d+$/.test(cleanText(x)); });
        var i = cur ? nums.indexOf(cur) : 0;
        var next = cleanText(pg) === '‹' ? nums[i - 1] : nums[i + 1];
        if (next) { $$('.page-btn', pager).forEach(function (x) { x.removeAttribute('aria-current'); }); next.setAttribute('aria-current', 'page'); toast('已切换到第 ' + cleanText(next) + ' 页'); }
        else toast('已在当前页边界', 'warn');
      }
      return;
    }

    /* --- 排序表头 --- */
    var sortable = t.closest ? t.closest('th.sortable') : null;
    if (sortable) { sortBy(sortable); return; }

    /* --- 开关 --- */
    var sw = t.closest ? t.closest('.switch') : null;
    if (sw) {
      var on = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', on ? 'false' : 'true');
      toast(cleanText(sw) || sw.getAttribute('aria-label') || '设置' + (on ? ' 已关闭' : ' 已开启'), on ? 'warn' : 'success');
      return;
    }

    /* --- 库位格子（引擎托管：存在库位记录时打开抽屉） --- */
    var cell = t.closest ? t.closest('.cell') : null;
    if (cell) {
      if (window.WMS && WMS.cellLoc && WMS.cellLoc(cell)) return;
      toast(cell.title || '库位已选中');
      return;
    }

    /* --- 带确认的按钮 --- */
    var confirmBtn = t.closest ? t.closest('[data-confirm]') : null;
    if (confirmBtn) {
      var ctx = contextOf(confirmBtn);
      var desc = confirmBtn.getAttribute('data-confirm');
      openModal({
        title: confirmBtn.getAttribute('data-title') || '请确认操作',
        desc: (ctx ? '<b>' + ctx + '</b> — ' : '') + desc,
        ok: confirmBtn.getAttribute('data-ok') || '确认执行',
        danger: confirmBtn.hasAttribute('data-danger'),
        onOk: function () {
          if (confirmBtn.hasAttribute('data-action') && window.WMS && WMS.actSpec) {
            WMS.actSpec(confirmBtn.getAttribute('data-action'));
            return;
          }
          toast(confirmBtn.getAttribute('data-toast') || ('已完成「' + labelOf(confirmBtn) + '」'), 'success');
        }
      });
      return;
    }

    /* --- 指定 toast 的按钮 --- */
    var toastBtn = t.closest ? t.closest('[data-toast]') : null;
    if (toastBtn) { toast(toastBtn.getAttribute('data-toast'), toastBtn.getAttribute('data-toast-type') || ''); return; }

    /* --- 兜底：普通按钮（跳过交互引擎托管的按钮） ---
       data-manual            = 页面脚本自行接管反馈（如 pda.html 的模拟扫码）
       data-x                 = 弹窗内的取消/确认/增删行按钮（ui.js / actions.js 各弹窗自管）
       data-theme-btn         = 主题切换（shell.js 已 toast）
       data-notify-* / data-menu-a = 通知面板与用户菜单项（actions.js 已 toast） */
    var ENGINE_ATTRS = ['data-action', 'data-drawer', 'data-print', 'data-close-drawer',
                        'data-export', 'data-form', 'data-list', 'data-notify-toggle', 'data-menu-toggle',
                        'data-manual', 'data-x', 'data-theme-btn',
                        'data-notify-readall', 'data-notify-i', 'data-menu-a'];
    var btn = t.closest ? t.closest('button, [role="button"]') : null;
    /* 弹窗 / 下拉面板内部的按钮一律不补兜底 toast，避免与弹窗自身反馈叠加 */
    var inOverlay = btn && (btn.closest('.modal-backdrop') || btn.closest('.menu'));
    if (btn && !inOverlay && !btn.disabled && !btn.classList.contains('tab') && !btn.hasAttribute('data-reset')) {
      var isEngine = false;
      for (var ei = 0; ei < ENGINE_ATTRS.length; ei++) {
        if (btn.hasAttribute(ENGINE_ATTRS[ei])) { isEngine = true; break; }
      }
      if (!isEngine) defaultFeedback(btn);
    }
  });

  /* --- 排序表头键盘可达 --- */
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('sortable')) {
      e.preventDefault();
      sortBy(e.target);
    }
    /* Tab 列表左右键切换 */
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.classList && e.target.classList.contains('tab')) {
      e.preventDefault();
      var tabs = $$('.tab', e.target.parentNode);
      var i = tabs.indexOf(e.target);
      var n = e.key === 'ArrowRight' ? i + 1 : i - 1;
      if (n < 0) n = tabs.length - 1;
      if (n >= tabs.length) n = 0;
      tabs[n].focus();
      tabs[n].click();
    }
  });

  /* --- 表头排序按钮化（键盘可达） --- */
  $$('th.sortable').forEach(function (th) {
    th.setAttribute('tabindex', '0');
    th.setAttribute('role', 'columnheader');
  });

  /* ================= 工具栏过滤 ================= */
  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('ctl') && e.target.hasAttribute('data-filter-col')) {
      clearTimeout(e.target._t);
      e.target._t = setTimeout(applyFilters, 160);
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.id) return;
    if (el.id === 'wh') {
      var v = el.value;
      var scoped = window.WMS && WMS.whCol && WMS.whCol() >= 0;
      if (!v) {
        toast('已切换为全部仓库 · 数据已刷新', 'success');
      } else if (scoped) {
        toast('已切换仓库：' + v + ' · 本页表格已按该仓库过滤', 'success');
      } else {
        toast('已切换仓库：' + v + ' · 本页为跨仓视角，暂不按仓过滤', 'warn');
      }
      applyFilters();
      return;
    }

    /* 复选框策略项 */
    if (el.type === 'checkbox') {
      var lab = document.querySelector('label[for="' + el.id + '"]');
      var name = lab ? cleanText(lab) : (el.name || '选项');
      toast(name + (el.checked ? ' 已开启' : ' 已关闭'), el.checked ? 'success' : 'warn');
      return;
    }

    /* 带过滤列 → 实际过滤 */
    if (el.classList && el.classList.contains('ctl') && el.hasAttribute('data-filter-col')) {
      var n = applyFilters();
      toast('筛选结果 ' + n + ' 条');
      return;
    }

    /* 其余下拉 / 日期控件 → 明确反馈 */
    if (el.classList && el.classList.contains('ctl')) {
      var lab2 = document.querySelector('label[for="' + el.id + '"]');
      toast((lab2 ? cleanText(lab2) + '：' : '') + el.value);
    }
  });

  /* ================= 顶栏搜索 ================= */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var q = e.target;
    if (q && q.id === 'q') {
      e.preventDefault();
      /* 交互引擎接管时（数据驱动页面）由 actions.js 统一过滤并反馈 */
      if (window.WMS && WMS.applyViewFilter) return;
      var v = q.value.trim();
      if (!v) { toast('请输入 SKU、单号或运单号', 'warn'); return; }
      var n = applyFilters();
      toast('搜索「' + v + '」· 找到 ' + n + ' 条记录');
    }
  });

  /* ================= 重置按钮 ================= */
  document.addEventListener('click', function (e) {
    var r = e.target.closest ? e.target.closest('[data-reset]') : null;
    if (!r) return;
    var scope = r.closest('.toolbar') || r.closest('form') || document;
    $$('.ctl', scope).forEach(function (c) {
      if (c.type === 'date') c.value = '';
      else if (c.tagName === 'SELECT') c.selectedIndex = 0;
      else c.value = '';
    });
    $$('.tab').forEach(function (t, i) { t.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); });
    var n = applyFilters();
    toast('已重置筛选 · ' + n + ' 条', 'success');
  });

  /* ================= 初始化 ================= */
  window.wmsApplyFilters = applyFilters;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFilters);
  } else {
    applyFilters();
  }
})();
