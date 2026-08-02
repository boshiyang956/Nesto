(function () {
  'use strict';
  const U = window.Utils;
  const S = window.Store;
  const C = window.Charts;

  const VIEW_TITLES = {
    overview: ['总览', '看看这段时间钱都去了哪里'],
    bills: ['账单', '搜索、筛选每一笔收支'],
    calendar: ['日历', '日程、提醒与节日'],
    cards: ['卡片', '多卡余额与资金流向'],
    goals: ['目标', '预算、阈值与俏皮提醒'],
    categories: ['分类', '管理大类与小类'],
    settings: ['设置', '主题、背景与账号数据']
  };

  const VIEW_ICONS = {
    overview: 'home', bills: 'receipt', calendar: 'calendar', cards: 'wallet',
    goals: 'target', categories: 'tags', settings: 'settings'
  };

  const THEMES = {
    orange: { name: '暖橙', primary: '#f26b1d', accent: '#0e8f8a', bg: '#fff6ef' },
    ocean: { name: '海洋蓝', primary: '#2563eb', accent: '#0e8f8a', bg: '#eff6ff' },
    forest: { name: '森林绿', primary: '#16a34a', accent: '#b45309', bg: '#f2faf4' },
    rose: { name: '樱花粉', primary: '#e11d48', accent: '#7c3aed', bg: '#fff3f5' },
    grape: { name: '葡萄紫', primary: '#7c3aed', accent: '#db2777', bg: '#f8f4ff' },
    midnight: { name: '深夜蓝', primary: '#ff9a3d', accent: '#4fd1c5', bg: '#18222d' }
  };

  const GRADIENTS = [
    'linear-gradient(135deg, #ffd8b1, #b8e6e0)',
    'linear-gradient(135deg, #c7dbff, #f5d0fe)',
    'linear-gradient(135deg, #d8f3dc, #fff3bf)',
    'linear-gradient(135deg, #ffd6e7, #c7f9cc)'
  ];

  const SCHEDULE_META = {
    reminder: { label: '提醒', icon: 'bell' },
    bill: { label: '账单', icon: 'receipt' },
    birthday: { label: '生日', icon: 'heart' },
    anniversary: { label: '纪念日', icon: 'gift' }
  };

  const Views = {
    currentView: 'calendar',
    periodType: 'month',
    periodAnchor: U.todayStr(),
    overviewRange: null,
    chartType: 'expense',
    drill: null,
    billsFilter: { type: 'all', payment: '', categoryId: '', cardId: '', from: '', to: '', q: '' },
    calMode: 'month',
    calAnchor: U.todayStr(),
    calSelected: U.todayStr(),
    calDetail: null,
    calTimeSel: null,
    calWeekExpand: null,
    cardsSelected: null,
    goalsAnchor: U.todayStr(),
    categoriesTab: 'expense',
    _photo: null,
    _pendingImport: null,
    _confirmCb: null,

    init: function () {
      const that = this;
      U.qsa('.nav-item, .mnav-item').forEach(function (el) {
        const view = el.getAttribute('data-view');
        const iconEl = el.querySelector('.nav-icon');
        if (iconEl && view && VIEW_ICONS[view]) iconEl.innerHTML = U.icon(VIEW_ICONS[view], 20);
      });
      const quick = U.qs('#quickAddBtn .btn-icon');
      if (quick) quick.innerHTML = U.icon('plus', 16);
      const mobile = U.qs('#mobileMenuBtn');
      if (mobile) mobile.innerHTML = U.icon('grid', 18);
      const close = U.qs('#sidebarCloseBtn');
      if (close) close.innerHTML = U.icon('x', 18);
      const logout = U.qs('#logoutBtn');
      if (logout) logout.innerHTML = U.icon('logout', 18);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') Views.closeModal();
      });
    },

    go: function (view) {
      this.currentView = view;
      U.qsa('.nav-item, .mnav-item').forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-view') === view);
      });
      const title = VIEW_TITLES[view] || VIEW_TITLES.overview;
      U.qs('#viewTitle').textContent = title[0];
      U.qs('#viewSubtitle').textContent = title[1];
      this.render();
      const content = U.qs('#viewContent');
      if (content) content.scrollTop = 0;
      window.scrollTo(0, 0);
    },

    render: function () {
      const fn = 'render' + this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1);
      if (typeof this[fn] === 'function') this[fn]();
    },

    refresh: function () {
      this.render();
    },

    toast: function (title, msg, type) {
      if (S.settings.showToasts === false) return;
      type = type || '';
      const ico = type === 'success' ? 'check' : type === 'danger' ? 'alert' : type === 'warn' ? 'bell' : 'sparkle';
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.innerHTML = '<span class="toast-ico">' + U.icon(ico, 18) + '</span><div class="toast-body"><strong>' + U.escapeHtml(title) + '</strong>' + (msg ? '<span>' + U.escapeHtml(msg) + '</span>' : '') + '</div><button class="toast-close" type="button" aria-label="关闭提示">' + U.icon('x', 14) + '</button>';
      U.qs('#toastRoot').appendChild(el);
      let timer = null;
      let startY = 0;
      let swiped = false;

      function dismiss(up) {
        if (el.classList.contains('is-hiding')) return;
        el.classList.add('is-hiding');
        if (up) el.classList.add('is-up');
        clearTimeout(timer);
        setTimeout(function () { el.remove(); }, 420);
      }

      el.querySelector('.toast-close').addEventListener('click', function () { dismiss(false); });
      el.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.toast-close')) return;
        startY = e.clientY;
        swiped = false;
      }, { passive: true });
      el.addEventListener('pointermove', function (e) {
        if (startY === 0) return;
        const dy = e.clientY - startY;
        if (dy < -18) {
          swiped = true;
          el.classList.add('is-swipe');
          el.style.transform = 'translateY(' + Math.max(dy, -80) + 'px)';
          el.style.opacity = String(Math.max(0, 1 + dy / 80));
        }
      }, { passive: true });
      el.addEventListener('pointerup', function () {
        if (swiped) dismiss(true);
        else {
          startY = 0;
          el.style.transform = '';
          el.style.opacity = '';
        }
      }, { passive: true });
      el.addEventListener('pointercancel', function () {
        startY = 0;
        el.style.transform = '';
        el.style.opacity = '';
      }, { passive: true });
      timer = setTimeout(function () { dismiss(false); }, 3000);
    }
  };

  // ---------- 通用小部件 ----------
  function statCard(label, value, cls, deltaHtml, iconName) {
    return '<div class="stat-card ' + (cls || '') + '"><span class="label">' + (iconName ? U.icon(iconName, 15) : '') + U.escapeHtml(label) + '</span><span class="value">' + value + '</span>' + (deltaHtml ? '<span class="delta">' + deltaHtml + '</span>' : '') + '</div>';
  }

  function periodRange(type, anchor) {
    if (type === 'day') return { from: anchor, to: anchor };
    if (type === 'week') {
      const from = U.startOfWeek(anchor);
      return { from: from, to: U.dateAdd(from, 6) };
    }
    return { from: U.startOfMonth(anchor), to: U.endOfMonth(anchor) };
  }

  function prevRange(type, anchor) {
    if (type === 'day') return { from: U.dateAdd(anchor, -1), to: U.dateAdd(anchor, -1) };
    if (type === 'week') {
      const from = U.dateAdd(U.startOfWeek(anchor), -7);
      return { from: from, to: U.dateAdd(from, 6) };
    }
    const from = U.monthAdd(U.startOfMonth(anchor), -1);
    return { from: from, to: U.endOfMonth(from) };
  }

  function periodLabel(type, anchor) {
    if (type === 'day') return U.formatCN(anchor, true);
    if (type === 'week') {
      const from = U.startOfWeek(anchor);
      const d = U.parseDate(from);
      const first = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((d - first) / 604800000) + 1;
      return d.getFullYear() + '年第' + week + '周';
    }
    return U.monthLabel(anchor);
  }

  function navArrows(action, label) {
    return '<div class="toolbar"><button class="icon-btn" type="button" data-action="' + action + '-prev" title="上一周期">' + U.icon('chevL', 18) + '</button><button class="ghost-btn compact" type="button" data-action="' + action + '-today" style="padding:7px 12px">今天</button><button class="icon-btn" type="button" data-action="' + action + '-next" title="下一周期">' + U.icon('chevR', 18) + '</button><span class="muted bold" style="min-width:110px">' + U.escapeHtml(label) + '</span></div>';
  }

  function attachLongPressReorder(containerSel, itemSel, onReorder) {
    const container = U.qs(containerSel);
    if (!container) return;
    let drag = null;
    let timer = null;

    function items() { return Array.prototype.slice.call(container.querySelectorAll(itemSel)); }
    function clearDragStyles(el, pointerId, captured) {
      if (!el) return;
      el.classList.remove('is-dragging');
      el.style.touchAction = '';
      el.style.transform = '';
      el.style.transition = '';
      if (captured && el.releasePointerCapture) {
        try { el.releasePointerCapture(pointerId); } catch (err) {}
      }
    }
    function cancel() {
      clearTimeout(timer);
      container.classList.remove('is-reordering');
      if (drag) {
        clearDragStyles(drag.el, drag.pointerId, drag.captured);
      }
      drag = null;
    }
    function moveToIndex(index) {
      if (!drag || !drag.el.parentElement) return;
      const list = items();
      if (index < 0 || index >= list.length || list[index] === drag.el) return;
      const fromId = drag.el.getAttribute('data-id');
      const toId = list[index].getAttribute('data-id');
      const current = list.indexOf(drag.el);
      const ref = index > current ? list[index].nextSibling : list[index];
      drag.el.parentElement.insertBefore(drag.el, ref);
      if (fromId && toId && onReorder) onReorder(fromId, toId);
    }

    container.addEventListener('pointerdown', function (e) {
      const el = e.target.closest(itemSel);
      if (!el) return;
      if (e.target.closest('button, a, input, select, textarea, [data-action]')) return;
      drag = { el: el, pointerId: e.pointerId, y: e.clientY, active: false, moved: false, settling: false, captured: false };
      timer = setTimeout(function () {
        if (!drag || drag.settling) return;
        drag.active = true;
        drag.moved = false;
        container.classList.add('is-reordering');
        drag.el.classList.add('is-dragging');
        drag.el.style.touchAction = 'none';
        drag.el.style.transition = 'none';
        if (drag.el.setPointerCapture) {
          try {
            drag.el.setPointerCapture(drag.pointerId);
            drag.captured = true;
          } catch (err) {}
        }
        window.Views.toast('已进入排序', '上下移动调整顺序', 'accent');
      }, 420);
    });
    container.addEventListener('pointermove', function (e) {
      if (!drag || drag.settling) return;
      if (drag.active) {
        e.preventDefault();
        const dy = e.clientY - drag.y;
        if (Math.abs(dy) > 4) drag.moved = true;
        drag.el.style.transform = 'translateY(' + dy + 'px) scale(1.03) rotate(.5deg)';
        const list = items();
        let targetIndex = -1;
        for (let i = 0; i < list.length; i++) {
          if (list[i] === drag.el) continue;
          if (e.clientY >= list[i].getBoundingClientRect().top + list[i].getBoundingClientRect().height / 2) targetIndex = i;
          else break;
        }
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex !== list.indexOf(drag.el)) moveToIndex(targetIndex);
      } else if (Math.abs(e.clientY - drag.y) > 12) {
        cancel();
      }
    });
    container.addEventListener('pointerup', function () {
      if (!drag) return;
      if (drag.active) {
        const el = drag.el;
        const wasMoved = drag.moved;
        drag.settling = true;
        el.style.transition = 'transform .2s cubic-bezier(.22,.9,.28,1), box-shadow .2s ease';
        el.style.transform = 'translateY(0) scale(1)';
        setTimeout(function () {
          if (drag && drag.el === el) {
            el.setAttribute('data-skip-click', '1');
            setTimeout(function () { el.removeAttribute('data-skip-click'); }, 500);
            if (wasMoved) window.Views.toast('顺序已更新', '', 'success');
            cancel();
          }
        }, 220);
      } else {
        cancel();
      }
    });
    container.addEventListener('pointercancel', cancel);
  }

  function txRowHtml(tx, opts) {
    const cat = S.categoryById(tx.categoryId);
    const sub = S.subName(tx.categoryId, tx.subcategoryId);
    const detail = S.detailName(tx.categoryId, tx.subcategoryId, tx.detailId);
    const child = S.detailChildName(tx.categoryId, tx.subcategoryId, tx.detailId, tx.detailChildId);
    const card = tx.cardId ? S.cardById(tx.cardId) : null;
    const isExpense = tx.kind === 'expense';
    const isIncome = tx.kind === 'income';
    const sign = isExpense ? '-' : isIncome ? '+' : '';
    const cls = isExpense ? 'expense' : isIncome ? 'income' : 'muted';
    const note = tx.note || S.txCatLabels(tx);
    let meta = tx.time + (card ? ' · ' + card.name : '') + ' · ' + tx.paymentType;
    if (tx.mood) meta += ' ' + tx.mood;
    const dateLabelHtml = opts && opts.dateLabel ? '<span class="tx-date-label">' + U.escapeHtml(U.formatCN(tx.date)) + '</span> ' : '';
    const attrs = opts && opts.detail ? ' data-action="cal-tx" data-tx-id="' + tx.id + '"' : '';
    return '<div class="tx-row"' + attrs + '><div class="tx-emoji">' + (cat ? U.escapeHtml(cat.icon) : '📦') + '</div>' +
      (tx.photo ? '<img class="tx-thumb" src="' + tx.photo + '" alt="账单照片">' : '') +
      '<div class="tx-info"><strong>' + U.escapeHtml(note) + '</strong><span>' + dateLabelHtml + U.escapeHtml(meta) + '</span></div>' +
      '<div class="tx-amount ' + cls + '">' + sign + U.moneyPlain(tx.amount) + '</div>' +
      (opts && opts.detail ? '<span class="tx-expand-ico">' + U.icon('chevD', 14) + '</span>' : '') +
      '<div class="tx-actions"><button class="icon-btn" type="button" data-action="edit-tx" data-id="' + tx.id + '" title="编辑">' + U.icon('edit', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-action="delete-tx" data-id="' + tx.id + '" title="删除">' + U.icon('trash', 16) + '</button></div></div>';
  }

  function legendHtml(items, drillable) {
    if (!items.length) return '<div class="chart-empty">这一周期还没有数据</div>';
    let html = '<div class="legend">';
    items.forEach(function (it) {
      const attrs = it.action && it.key
        ? ' data-action="' + it.action + '" data-key="' + it.key + '"'
        : (drillable && it.key ? ' data-action="drill-select" data-cat-id="' + it.key + '"' : '');
      html += '<div class="legend-row"' + attrs + '><span class="legend-dot" style="background:' + it.color + '"></span><span class="legend-name">' + U.escapeHtml(it.label) + '</span><span class="legend-val">' + U.moneyPlain(it.value) + '</span><span class="legend-pct">' + it.pct + '%</span></div>';
    });
    html += '</div>';
    return html;
  }

  function scheduleRowHtml(sch, withDate) {
    const meta = SCHEDULE_META[sch.type] || SCHEDULE_META.reminder;
    const cls = sch.type;
    const dateStr = withDate ? U.formatCN(sch.date) : '';
    const repeatLabel = U.repeatLabel(sch.repeat);
    const remindLabel = U.remindLabel(sch.remind);
    return '<div class="schedule-row"><div class="schedule-ico ' + cls + '">' + U.icon(meta.icon, 18) + '</div>' +
      '<div class="schedule-body" data-action="cal-detail" data-kind="schedule" data-id="' + sch.id + '"><strong>' + U.escapeHtml(sch.title) + '</strong><p>' + U.escapeHtml(dateStr + (sch.time && sch.time !== '00:00' ? ' ' + sch.time : '') + (repeatLabel ? ' · ' + repeatLabel : '')) + '</p>' +
      (sch.note ? '<p>' + U.escapeHtml(sch.note) + '</p>' : '') +
      '<div class="schedule-meta"><span class="pill accent">' + U.escapeHtml(meta.label) + '</span>' + (repeatLabel ? '<span class="pill primary">' + U.escapeHtml(repeatLabel) + '</span>' : '') + (remindLabel ? '<span class="pill warn">' + U.escapeHtml(remindLabel) + '</span>' : '') + (sch.done ? '<span class="pill success">已完成</span>' : '') + '</div></div>' +
      '<div class="tx-actions"><button class="icon-btn" type="button" data-action="edit-schedule" data-id="' + sch.id + '" title="编辑">' + U.icon('edit', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-action="delete-schedule" data-id="' + sch.id + '" title="删除">' + U.icon('trash', 16) + '</button></div></div>';
  }

  function scheduleCompareHtml(sch) {
    const d = U.parseDate(sch.date);
    if (!d) return '';
    const years = [];
    for (let y = d.getFullYear() - 3; y <= d.getFullYear(); y++) {
      const center = U.fmtDate(new Date(y, d.getMonth(), d.getDate()));
      const from = U.dateAdd(center, -3);
      const to = U.dateAdd(center, 3);
      const total = S.totals(S.txsBetween(from, to, { kind: 'expense' })).expense;
      years.push({ label: String(y), value: total });
    }
    return '<div class="section"><div class="section-head"><h3>' + U.escapeHtml(sch.title) + ' · 每年花费对比</h3><span class="sub">前后 3 天</span></div>' +
      '<div class="chart-wrap">' + C.bars(years.map(function (y) { return y.label; }), [{ name: '花费', color: '#ec4899', values: years.map(function (y) { return y.value; }) }], { height: 170 }) + '</div></div>';
  }

  // ---------- 总览 ----------
  Views.renderOverview = function () {
    const type = this.periodType;
    const anchor = this.periodAnchor;
    const custom = this.overviewRange && this.overviewRange.from && this.overviewRange.to ? this.overviewRange : null;
    const range = custom ? { from: custom.from, to: custom.to } : periodRange(type, anchor);
    const label = custom ? custom.from + ' ~ ' + custom.to : periodLabel(type, anchor);
    const txs = S.txsBetween(range.from, range.to);
    const totals = S.totals(txs);
    const prev = custom ? S.totals([]) : S.totals(S.txsBetween(prevRange(type, anchor).from, prevRange(type, anchor).to));
    const delta = function (cur, old) {
      if (!old) return '';
      const diff = cur - old;
      const pct = old ? Math.round(diff / old * 100) : 0;
      const cls = diff > 0 ? 'expense' : diff < 0 ? 'income' : '';
      return '<span class="' + cls + '">' + (diff > 0 ? '▲' : diff < 0 ? '▼' : '') + Math.abs(pct) + '%</span>';
    };
    const monthGoal = S.goals.find(function (g) { return g.active && g.period === 'month' && !g.categoryId; });
    let goalCard = '';
    if (monthGoal) {
      const prog = S.goalProgress(monthGoal, anchor);
      const cls = prog.percent >= 90 ? 'danger' : prog.percent >= 75 ? 'warn' : 'success';
      goalCard = statCard('预算使用', prog.target ? Math.min(999, Math.round(prog.percent)) + '%' : '--', cls, '<span>' + U.moneyPlain(prog.spent) + ' / ' + U.moneyPlain(prog.target) + '</span>', 'target');
    } else {
      goalCard = statCard('记账笔数', txs.length + ' 笔', '', '', 'receipt');
    }

    const chartTxs = txs.filter(function (t) { return t.kind === this.chartType; }, this);
    const byCat = S.byCategory(chartTxs);
    const drill = this.drill;
    const drillSub = this.drillSub;
    const drillDetail = this.drillDetail;
    let chartInner = '', backBtn = '';
    if (drillDetail) {
      const cat = S.categoryById(drill);
      const sub = S.subById(drill, drillSub);
      const detail = S.detailById(drill, drillSub, drillDetail);
      const leafTxs = chartTxs.filter(function (t) { return S.txInCategory(t, drill, drillSub, drillDetail); })
        .sort(function (a, b) { return a.date === b.date ? (a.time || '') < (b.time || '') ? 1 : -1 : a.date < b.date ? 1 : -1; });
      const leafTotal = leafTxs.reduce(function (acc, t) { return acc + (Number(t.amount) || 0); }, 0);
      chartInner = '<div class="view-row grid-2" style="align-items:start">' +
        '<div class="stat-card accent"><span class="label">' + U.escapeHtml(detail ? detail.name : '细分类') + ' 小计</span><span class="value">' + U.moneyPlain(leafTotal) + '</span><span class="delta">' + leafTxs.length + ' 笔账单</span></div>' +
        '<div class="legend">' + (leafTxs.slice(0, 8).map(txRowHtml).join('') || '<div class="chart-empty">这个细分类还没有账单</div>') + '</div>' +
        '</div>';
      backBtn = '<button class="text-btn" type="button" data-action="drill-back">' + U.icon('chevL', 14) + ' 返回小类</button>';
    } else if (drillSub) {
      const cat = S.categoryById(drill);
      const sub = S.subById(drill, drillSub);
      const byDetail = S.byDetail(chartTxs, drill, drillSub);
      const detailSegs = byDetail.items.map(function (x) {
        const d = S.detailById(drill, drillSub, x.detailId);
        return { label: d ? d.name : '其他', value: x.total, pct: x.pct, color: d ? d.color : '#94a3b8', action: 'drill-detail', key: x.detailId };
      });
      if (detailSegs.length > 1 || (sub && (sub.children || []).length)) {
        chartInner = '<div class="view-row grid-2" style="align-items:center">' +
          '<div class="chart-wrap">' + C.donut(detailSegs, { centerHtml: '<strong>' + C.compactNum(byDetail.total) + '</strong><span>' + U.escapeHtml(sub ? sub.name : '小类') + '</span>' }) + '</div>' +
          legendHtml(detailSegs, false) +
          '</div>';
      } else {
        const leafTxs = chartTxs.filter(function (t) { return S.txInCategory(t, drill, drillSub); });
        const leafTotal = leafTxs.reduce(function (acc, t) { return acc + (Number(t.amount) || 0); }, 0);
        chartInner = '<div class="view-row grid-2" style="align-items:start">' +
          '<div class="stat-card accent"><span class="label">' + U.escapeHtml(sub ? sub.name : '小类') + ' 小计</span><span class="value">' + U.moneyPlain(leafTotal) + '</span><span class="delta">' + leafTxs.length + ' 笔账单</span></div>' +
          '<div class="legend">' + (leafTxs.slice(0, 8).map(txRowHtml).join('') || '<div class="chart-empty">这个子类还没有账单</div>') + '</div>' +
          '</div>';
      }
      backBtn = '<button class="text-btn" type="button" data-action="drill-back">' + U.icon('chevL', 14) + ' 返回大类</button>';
    } else if (drill) {
      const cat = S.categoryById(drill);
      const bySub = S.bySubcategory(chartTxs, drill);
      const subSegs = bySub.items.map(function (x) {
        const sub = S.subById(drill, x.subcategoryId);
        return { label: sub ? sub.name : '其他', value: x.total, pct: x.pct, color: sub ? sub.color : '#94a3b8', action: 'drill-sub', key: x.subcategoryId };
      });
      chartInner = '<div class="view-row grid-2" style="align-items:center">' +
        '<div class="chart-wrap">' + C.donut(subSegs, { centerHtml: '<strong>' + C.compactNum(bySub.total) + '</strong><span>' + U.escapeHtml(cat ? cat.name : '') + '</span>' }) + '</div>' +
        legendHtml(subSegs.map(function (x) {
          const sub = S.subById(drill, x.key);
          return { label: sub ? sub.name : '其他', value: x.value, pct: x.pct, color: sub ? sub.color : '#94a3b8', action: 'drill-sub', key: x.key };
        }), false) +
        '</div>';
      backBtn = '<button class="text-btn" type="button" data-action="drill-back">' + U.icon('chevL', 14) + ' 返回大类</button>';
    } else {
      const catSegs = byCat.items.map(function (x) {
        const cat = S.categoryById(x.categoryId);
        return { label: cat ? cat.name : '其他', value: x.total, pct: x.pct, color: cat ? cat.color : '#94a3b8', action: 'drill-select', key: x.categoryId };
      });
      chartInner = '<div class="view-row grid-2" style="align-items:center">' +
        '<div class="chart-wrap">' + C.donut(catSegs, { centerHtml: '<strong>' + C.compactNum(byCat.total) + '</strong><span>' + (this.chartType === 'expense' ? '总支出' : '总收入') + '</span>' }) + '</div>' +
        legendHtml(catSegs.map(function (x) {
          const cat = S.categoryById(x.key);
          return { label: cat ? cat.name : '其他', value: x.value, pct: x.pct, color: cat ? cat.color : '#94a3b8', action: 'drill-select', key: x.key };
        }), false) +
        '</div>';
    }

    // 周期对比柱状图
    const barLabels = [], barIncome = [], barExpense = [], barAnchors = [];
    const count = type === 'month' ? 4 : 4;
    if (custom) {
      const fromD = U.parseDate(custom.from);
      const toD = U.parseDate(custom.to);
      const totalDays = Math.max(1, Math.round((toD - fromD) / 86400000) + 1);
      const chunk = Math.max(1, Math.ceil(totalDays / 4));
      for (let i = 0; i < 4; i++) {
        const a = U.dateAdd(custom.from, i * chunk);
        const b = U.dateAdd(a, chunk - 1);
        const r = { from: a, to: b > custom.to ? custom.to : b };
        const t = S.totals(S.txsBetween(r.from, r.to));
        barLabels.push((U.parseDate(a).getMonth() + 1) + '/' + U.parseDate(a).getDate());
        barIncome.push(t.income);
        barExpense.push(t.expense);
        barAnchors.push(a);
      }
    } else {
      for (let i = count - 1; i >= 0; i--) {
        let a, bl;
        if (type === 'month') {
          a = U.monthAdd(range.from, -i);
          bl = (U.parseDate(a).getMonth() + 1) + '月';
        } else if (type === 'week') {
          a = U.dateAdd(range.from, -i * 7);
          bl = (U.parseDate(a).getMonth() + 1) + '/' + U.parseDate(a).getDate();
        } else {
          a = U.dateAdd(anchor, -i);
          bl = (U.parseDate(a).getMonth() + 1) + '/' + U.parseDate(a).getDate();
        }
        const r = periodRange(type, a);
        const t = S.totals(S.txsBetween(r.from, r.to));
        barLabels.push(bl);
        barIncome.push(t.income);
        barExpense.push(t.expense);
        barAnchors.push(a);
      }
    }
    const barChartHtml = C.bars(barLabels, [
      { name: '支出', color: '#e5484d', values: barExpense },
      { name: '收入', color: '#2f9e44', values: barIncome }
    ], { height: 200 });
    this._barAnchors = barAnchors;

    // 趋势
    const trendPoints = [];
    if (custom) {
      let d = custom.from;
      while (d <= custom.to) {
        trendPoints.push({ label: (U.parseDate(d).getMonth() + 1) + '/' + U.parseDate(d).getDate(), value: S.totals(S.txsBetween(d, d, { kind: 'expense' })).expense });
        d = U.dateAdd(d, 1);
      }
    } else if (type === 'month') {
      const days = U.daysInMonth(U.parseDate(range.from).getFullYear(), U.parseDate(range.from).getMonth() + 1);
      const today = U.todayStr();
      for (let i = 1; i <= days; i++) {
        const d = U.fmtDate(new Date(U.parseDate(range.from).getFullYear(), U.parseDate(range.from).getMonth(), i));
        if (d > today) break;
        const dayT = S.totals(S.txsBetween(d, d, { kind: 'expense' })).expense;
        trendPoints.push({ label: i + '日', value: dayT });
      }
    } else if (type === 'week') {
      for (let i = 0; i < 7; i++) {
        const d = U.dateAdd(range.from, i);
        trendPoints.push({ label: '周' + ['一', '二', '三', '四', '五', '六', '日'][i], value: S.totals(S.txsBetween(d, d, { kind: 'expense' })).expense });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = U.dateAdd(anchor, -i);
        trendPoints.push({ label: (U.parseDate(d).getMonth() + 1) + '/' + U.parseDate(d).getDate(), value: S.totals(S.txsBetween(d, d, { kind: 'expense' })).expense });
      }
    }

    // 分类明细表
    let tableRows = '';
    const rows = this.chartType === 'expense' ? byCat.items : S.byCategory(S.incomeTxs().filter(function (t) { return t.date >= range.from && t.date <= range.to; })).items;
    if (!rows.length) tableRows = '<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">暂无数据</td></tr>';
    rows.forEach(function (x) {
      const cat = S.categoryById(x.categoryId);
      tableRows += '<tr><td><span class="legend-dot" style="background:' + (cat ? cat.color : '#94a3b8') + ';display:inline-block;margin-right:6px"></span>' + U.escapeHtml(cat ? cat.name : '其他') + '</td><td>' + x.count + ' 笔</td><td class="num">' + U.moneyPlain(x.total) + '</td><td class="num">' + x.pct + '%</td><td style="min-width:90px"><div class="progress-track" style="height:6px"><div class="progress-fill" style="width:' + Math.min(100, x.pct) + '%"></div></div></td></tr>';
    });

    // 建议
    const advice = buildOverviewAdvice(custom ? 'custom' : type, custom ? range.from : anchor, totals, prev, byCat, monthGoal);

    const sortedTxs = txs.slice().sort(function (a, b) { return a.date === b.date ? (a.time || '') < (b.time || '') ? 1 : -1 : a.date < b.date ? 1 : -1; });
    const recentGroups = {};
    sortedTxs.slice(0, 8).forEach(function (t) {
      if (!recentGroups[t.date]) recentGroups[t.date] = [];
      recentGroups[t.date].push(t);
    });
    const recent = Object.keys(recentGroups).sort(function (a, b) { return a < b ? 1 : -1; }).map(function (date) {
      const hol = U.holidayFor(date);
      return '<div class="tx-group">' +
        '<div class="tx-group-head"><span class="dot"></span>' + U.escapeHtml(U.formatCN(date, true)) + (hol ? '<span class="pill danger">' + U.escapeHtml(hol.name) + '</span>' : '') + '<span class="right">' + recentGroups[date].length + ' 笔</span></div>' +
        recentGroups[date].map(txRowHtml).join('') +
        '<button class="ghost-btn compact tx-add-btn" type="button" data-action="bills-add" data-date="' + date + '">' + U.icon('plus', 15) + ' 记账</button></div>';
    }).join('') || '<div class="chart-empty">还没有账单，点右上角记一笔吧</div>';

    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="toolbar" style="flex-wrap:wrap"><div class="seg" id="periodSeg">' +
      '<button type="button" data-action="overview-period" data-type="day"' + (type === 'day' ? ' class="is-active"' : '') + '>日</button>' +
      '<button type="button" data-action="overview-period" data-type="week"' + (type === 'week' ? ' class="is-active"' : '') + '>周</button>' +
      '<button type="button" data-action="overview-period" data-type="month"' + (type === 'month' ? ' class="is-active"' : '') + '>月</button></div>' +
      '<input type="date" data-action="overview-range" data-key="from" value="' + (custom ? custom.from : '') + '" title="开始日期">' +
      '<input type="date" data-action="overview-range" data-key="to" value="' + (custom ? custom.to : '') + '" title="结束日期">' +
      (custom ? '<button class="text-btn" type="button" data-action="overview-range-clear">清除</button>' : '') +
      '<div class="spacer"></div>' + navArrows('overview', label) + '</div></div>' +
      '<div class="grid-4">' +
      statCard('收入', U.moneyPlain(totals.income), 'success stat-pop', delta(totals.income, prev.income), 'arrowDown') +
      statCard('支出', U.moneyPlain(totals.expense), 'danger stat-pop', delta(totals.expense, prev.expense), 'arrowUp') +
      statCard('结余', U.moneyPlain(totals.balance), (totals.balance >= 0 ? 'accent' : 'danger') + ' stat-pop', '', 'wallet') +
      goalCard +
      '</div>' +
      '<div class="view-row grid-2">' +
      '<div class="section"><div class="section-head"><h3>' + (this.chartType === 'expense' ? '支出结构' : '收入结构') + '</h3>' +
      '<div class="seg"><button type="button" data-action="chart-toggle" data-type="expense"' + (this.chartType === 'expense' ? ' class="is-active"' : '') + '>支出</button>' +
      '<button type="button" data-action="chart-toggle" data-type="income"' + (this.chartType === 'income' ? ' class="is-active"' : '') + '>收入</button></div>' +
      '<div class="spacer"></div>' + backBtn + '</div>' +
      chartInner + '</div>' +
      '<div class="section"><div class="section-head"><h3>周期对比</h3><span class="sub">点击柱子可跳转到该周期</span></div><div class="chart-wrap">' + barChartHtml + '</div></div>' +
      '</div>' +
      '<div class="view-row grid-2">' +
      '<div class="section"><div class="section-head"><h3>每日趋势</h3><span class="sub">' + U.escapeHtml(label) + '</span></div><div class="chart-wrap">' + C.line(trendPoints, { color: this.chartType === 'expense' ? '#e5484d' : '#2f9e44', height: 190 }) + '</div></div>' +
      '<div class="section"><div class="section-head"><h3>' + (this.chartType === 'expense' ? '分类明细' : '收入明细') + '</h3></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>分类</th><th>笔数</th><th class="num">金额</th><th class="num">占比</th><th></th></tr></thead><tbody>' + tableRows + '</tbody></table></div></div>' +
      '</div>' +
      '<div class="view-row grid-2">' +
      '<div class="section"><div class="section-head"><h3>小暖的建议</h3></div>' + advice + '</div>' +
      '<div class="section"><div class="section-head"><h3>最近账单</h3><button class="text-btn" type="button" data-view="bills" style="margin-left:auto">全部账单 ' + U.icon('chevR', 14) + '</button></div>' + recent + '</div>' +
      '</div>' +
      '</div>';
  };

  function buildOverviewAdvice(type, anchor, totals, prev, byCat, monthGoal) {
    const lines = [];
    if (totals.expense > 0 && prev.expense > 0) {
      const diff = totals.expense - prev.expense;
      const pct = Math.round(diff / prev.expense * 100);
      lines.push({ cls: diff > 0 ? 'danger' : 'success', text: '本期支出 ' + U.moneyPlain(totals.expense) + '，较上期' + (diff > 0 ? '多花 ' : '少花 ') + U.moneyPlain(Math.abs(diff)) + '（' + Math.abs(pct) + '%）。' + (diff > 0 ? '记得看看是哪类悄悄超支了。' : '继续保持，钱包很开心！') });
    } else if (totals.expense === 0) {
      lines.push({ cls: 'accent', text: '这个周期还没有支出记录，先去记一笔吧，小暖才能给出建议。' });
    }
    if (totals.income > 0 && totals.expense > 0) {
      const ratio = Math.round(totals.expense / totals.income * 100);
      lines.push({ cls: ratio > 90 ? 'warn' : 'accent', text: '支出占收入 ' + ratio + '%。' + (ratio > 90 ? '结余太薄了，建议把非必要支出再压一压。' : '存钱比例还不错，继续保持。') });
    }
    if (byCat.items.length) {
      const top = byCat.items[0];
      const cat = S.categoryById(top.categoryId);
      lines.push({ cls: 'primary', text: (cat ? cat.name : '其他') + '是最大头，占了 ' + top.pct + '%。点左边饼图可以继续看小类明细。' });
    }
    if (monthGoal) {
      const prog = S.goalProgress(monthGoal, anchor);
      const remain = Math.max(0, prog.target - prog.spent);
      lines.push({ cls: prog.percent >= 75 ? 'danger' : 'primary', text: '本月预算还有 ' + U.moneyPlain(remain) + ' 可用（已用 ' + prog.percent + '%），按当前速度要留意月底。' });
    }
    if (type === 'month' && totals.expense > 0) {
      const days = U.daysInMonth(U.parseDate(anchor).getFullYear(), U.parseDate(anchor).getMonth() + 1);
      const elapsed = Math.max(1, U.diffDays(U.startOfMonth(anchor), anchor) + 1);
      const pace = totals.expense / elapsed;
      lines.push({ cls: 'accent', text: '本月日均支出 ' + U.moneyPlain(pace) + '，照这个速度月底预计花 ' + U.moneyPlain(pace * days) + '。' });
    }
    if (!lines.length) lines.push({ cls: 'accent', text: '数据慢慢攒起来，建议会越来越准。' });
    return lines.map(function (l) {
      return '<div class="advice-box ' + l.cls + '">' + U.escapeHtml(l.text) + '</div>';
    }).join('');
  }

  // ---------- 账单 ----------
  Views.renderBills = function () {
    const f = this.billsFilter;
    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="toolbar" style="gap:8px">' +
      '<div class="seg">' +
      '<button type="button" data-action="bills-filter" data-key="type" data-value="all"' + (f.type === 'all' ? ' class="is-active"' : '') + '>全部</button>' +
      '<button type="button" data-action="bills-filter" data-key="type" data-value="expense"' + (f.type === 'expense' ? ' class="is-active"' : '') + '>支出</button>' +
      '<button type="button" data-action="bills-filter" data-key="type" data-value="income"' + (f.type === 'income' ? ' class="is-active"' : '') + '>收入</button></div>' +
      '<select data-action="bills-filter" data-key="payment" style="width:auto"><option value="">收支方式</option><option value="现金"' + (f.payment === '现金' ? ' selected' : '') + '>现金</option><option value="电子"' + (f.payment === '电子' ? ' selected' : '') + '>电子</option></select>' +
      '<select data-action="bills-filter" data-key="categoryId" style="width:auto">' + this.billsCatOptions() + '</select>' +
      '<select data-action="bills-filter" data-key="cardId" style="width:auto">' + this.billsCardOptions() + '</select>' +
      '<input type="date" data-action="bills-filter" data-key="from" value="' + f.from + '" title="开始日期">' +
      '<input type="date" data-action="bills-filter" data-key="to" value="' + f.to + '" title="结束日期">' +
      '<div class="spacer"></div><div class="search-box">' + U.icon('search', 16) + '<input id="billsSearch" type="search" placeholder="搜索备注、分类或卡片" value="' + U.escapeHtml(f.q) + '"></div>' +
      '</div></div>' +
      '<div id="billsList">' + this.billsListHtml() + '</div>' +
      '</div>';
  };

  Views.billsCatOptions = function () {
    const f = this.billsFilter;
    const cats = f.type === 'income' ? S.categoriesByType('income') : f.type === 'expense' ? S.categoriesByType('expense') : S.categories;
    return '<option value="">全部分类</option>' + cats.map(function (c) {
      return '<option value="' + c.id + '"' + (f.categoryId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
    }).join('');
  };

  Views.billsCardOptions = function () {
    const f = this.billsFilter;
    return '<option value="">全部卡片</option>' + S.cards.map(function (c) {
      return '<option value="' + c.id + '"' + (f.cardId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
    }).join('');
  };

  Views.billsListHtml = function () {
    const f = this.billsFilter;
    let txs = S.transactions.slice();
    if (f.type !== 'all') txs = txs.filter(function (t) { return t.kind === f.type; });
    if (f.payment) txs = txs.filter(function (t) { return t.paymentType === f.payment; });
    if (f.categoryId) txs = txs.filter(function (t) { return S.txInCategory(t, f.categoryId); });
    if (f.cardId) txs = txs.filter(function (t) { return t.cardId === f.cardId; });
    if (f.from) txs = txs.filter(function (t) { return t.date >= f.from; });
    if (f.to) txs = txs.filter(function (t) { return t.date <= f.to; });
    if (f.q) {
      const q = f.q.toLowerCase();
      txs = txs.filter(function (t) {
        const card = t.cardId ? (S.cardById(t.cardId) || {}).name || '' : '';
        return ((t.note || '') + S.txCatLabels(t) + card).toLowerCase().indexOf(q) !== -1;
      });
    }
    txs.sort(function (a, b) { return a.date === b.date ? (a.time || '') < (b.time || '') ? 1 : -1 : a.date < b.date ? 1 : -1; });
    const totals = S.totals(txs);

    const groups = {};
    txs.forEach(function (t) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    let listHtml = '';
    Object.keys(groups).sort(function (a, b) { return a < b ? 1 : -1; }).forEach(function (date) {
      const dayTotals = S.totals(groups[date]);
      const hol = U.holidayFor(date);
      listHtml += '<div class="tx-group"><div class="tx-group-head"><span class="dot"></span>' + U.escapeHtml(U.formatCN(date, true)) + (hol ? '<span class="pill danger">' + U.escapeHtml(hol.name) + '</span>' : '') + '<span class="right">收 ' + U.moneyPlain(dayTotals.income) + ' · 支 ' + U.moneyPlain(dayTotals.expense) + '</span></div>' + groups[date].map(txRowHtml).join('') + '<button class="ghost-btn compact tx-add-btn" type="button" data-action="bills-add" data-date="' + date + '">' + U.icon('plus', 15) + ' 记账</button></div>';
    });
    if (!listHtml) listHtml = '<div class="chart-empty">没有符合条件的账单</div>';

    return '<div class="grid-3">' +
      statCard('筛选收入', U.moneyPlain(totals.income), 'success', '', 'arrowDown') +
      statCard('筛选支出', U.moneyPlain(totals.expense), 'danger', '', 'arrowUp') +
      statCard('筛选结余', U.moneyPlain(totals.balance), totals.balance >= 0 ? 'accent' : 'danger', '', 'wallet') +
      '</div>' +
      '<div class="section">' + listHtml + '</div>';
  };

  Views.renderBillsList = function () {
    const box = U.qs('#billsList');
    if (!box) return;
    box.innerHTML = this.billsListHtml();
  };

  // ---------- 日历 ----------
  Views.renderCalendar = function () {
    const mode = this.calMode;
    const anchor = this.calAnchor;
    const sel = this.calSelected;
    const aDate = U.parseDate(anchor);
    const label = mode === 'year' ? aDate.getFullYear() + '年' : mode === 'month' ? U.monthLabel(anchor) : mode === 'week' ? periodLabel('week', anchor) : U.formatCN(anchor, true);
    const txs = S.transactions;
    const byDate = {};
    txs.forEach(function (t) { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });
    const schByDate = {};
    S.schedules.forEach(function (s) {
      if (s.repeat === 'none') {
        if (!schByDate[s.date]) schByDate[s.date] = [];
        schByDate[s.date].push(s);
      }
    });

    let mainHtml = '';
    if (mode === 'month') {
      const cells = U.monthGrid(aDate.getFullYear(), aDate.getMonth() + 1);
      let grid = '<div class="cal-grid">' + ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
      cells.forEach(function (cell) {
        const hol = U.holidayFor(cell.date);
        const dayTxs = byDate[cell.date] || [];
        const dayScheds = schByDate[cell.date] || [];
        S.schedules.forEach(function (s) {
  if (s.repeat !== 'none' && U.scheduleOccursOn(s, cell.date) && !dayScheds.some(function (x) { return x.id === s.id; })) dayScheds.push(s);
        });
        const dots = dayTxs.slice(0, 5).map(function (t) { return '<span class="cal-event" style="background:' + (t.kind === 'expense' ? '#e5484d' : t.kind === 'income' ? '#2f9e44' : '#94a3b8') + '" title="' + U.escapeHtml((t.kind === 'expense' ? '支出 ' : '收入 ') + U.moneyPlain(t.amount)) + '"></span>'; }).join('');
        const schedLabels = dayScheds.slice(0, 2).map(function (s) { return '<span class="cal-event-label" style="color:var(--accent)">' + U.escapeHtml(s.title) + '</span>'; }).join('');
        grid += '<div class="cal-cell' + (cell.inMonth ? '' : ' out') + (cell.isToday ? ' is-today' : '') + (cell.date === sel ? ' is-selected' : '') + '" data-action="cal-day" data-date="' + cell.date + '">' +
          '<div class="cal-cell-head"><span class="cal-day-num">' + U.parseDate(cell.date).getDate() + '</span>' + (dayTxs.length ? '<span class="cal-more">' + dayTxs.length + '</span>' : '') + '</div>' +
          (hol ? '<span class="cal-holiday cal-holiday-pill" data-date="' + cell.date + '">' + U.escapeHtml(hol.name) + '</span>' : '') +
          '<div class="cal-events">' + dots + '</div>' + schedLabels +
          (dayScheds.length > 2 ? '<span class="cal-more">+' + (dayScheds.length - 2) + ' 日程</span>' : '') +
          '</div>';
      });
      grid += '</div>';
      mainHtml = '<div class="view-row cal-split">' +
        '<div class="section">' + grid + '</div>' +
        '<div class="day-panel">' + this.dayPanelHtml(sel) + '</div></div>';
    } else if (mode === 'week') {
      const weekDates = [];
      for (let i = 0; i < 7; i++) weekDates.push(U.dateAdd(U.startOfWeek(anchor), i));
      let weekHtml = '<div class="week-strip">';
      for (let i = 0; i < 7; i++) {
        const d = U.dateAdd(U.startOfWeek(anchor), i);
        const hol = U.holidayFor(d);
        const dayTxs = (byDate[d] || []).slice().sort(function (a, b) { return (a.time || '') < (b.time || '') ? 1 : -1; });
        const dayScheds = [];
  S.schedules.forEach(function (s) { if (U.scheduleOccursOn(s, d)) dayScheds.push(s); });
        weekHtml += '<div class="week-day' + (d === sel ? ' is-selected' : '') + (d === U.todayStr() ? ' is-today' : '') + '" data-action="cal-day" data-date="' + d + '">' +
          '<div class="week-day-top"><strong>' + U.parseDate(d).getDate() + '</strong><span>周' + ['一', '二', '三', '四', '五', '六', '日'][i] + '</span></div>' +
          (hol ? '<span class="week-hol cal-holiday-pill" data-date="' + d + '">' + U.escapeHtml(hol.name) + '</span>' : '') +
          (dayTxs.length ? '<span class="week-count">' + dayTxs.length + ' 笔</span>' : '') +
          dayScheds.slice(0, 1).map(function (s) { return '<span class="week-sched">' + U.escapeHtml(s.title) + '</span>'; }).join('') +
          '</div>';
      }
      weekHtml += '</div>';
      const expDate = this.calWeekExpand || sel;
      const expTxs = (byDate[expDate] || []).slice().sort(function (a, b) { return (a.time || '') < (b.time || '') ? 1 : -1; });
      const expHol = U.holidayFor(expDate);
      const expHtml = '<div class="section cal-week-detail"><div class="section-head"><h3><span class="cal-day-badge">' + U.escapeHtml(U.formatCN(expDate, true)) + ' 账单</span></h3>' + (expHol ? '<span class="pill danger cal-holiday-pill" data-date="' + expDate + '">' + U.escapeHtml(expHol.name) + '</span>' : '') + '<span class="muted small">双击账单可展开详情</span></div>' +
        (expTxs.map(function (t) { return txRowHtml(t, { detail: true, dateLabel: true }); }).join('') || '<div class="chart-empty">这一天没有账单</div>') + '</div>';
      mainHtml = weekHtml +
        '<div class="section"><div class="section-head"><h3>时间格</h3><span class="sub">单击选中时间，双击直接记账</span></div>' + this.timeGridHtml(weekDates) + '</div>' +
        expHtml +
        '<div class="day-panel" style="margin-top:14px">' + this.dayPanelHtml(sel) + '</div>';
    } else if (mode === 'day') {
      const hol = U.holidayFor(sel);
      const dayTxs = (byDate[sel] || []).slice().sort(function (a, b) { return (a.time || '') < (b.time || '') ? 1 : -1; });
      const dayScheds = [];
  S.schedules.forEach(function (s) { if (U.scheduleOccursOn(s, sel)) dayScheds.push(s); });
      const t = S.totals(dayTxs);
      mainHtml = '<div class="section"><div class="section-head"><h3>时间格</h3><span class="sub">点击小时块选时间，再次点击直接记账</span></div>' + this.timeGridHtml([sel]) + '</div>' +
        '<div class="view-row grid-2">' +
        '<div class="section"><div class="section-head"><h3>' + U.escapeHtml(U.formatCN(sel, true)) + '</h3>' + (hol ? '<span class="pill danger cal-holiday-pill" data-date="' + sel + '">' + U.escapeHtml(hol.name) + '</span>' : '') + '</div>' +
        '<div class="grid-3">' + statCard('收入', U.moneyPlain(t.income), 'success stat-pop', '', '') + statCard('支出', U.moneyPlain(t.expense), 'danger stat-pop', '', '') + statCard('结余', U.moneyPlain(t.balance), 'accent stat-pop', '', '') + '</div>' +
        '<h4 style="margin:16px 0 8px">账单</h4>' + (dayTxs.map(function (t) { return txRowHtml(t, { detail: true }); }).join('') || '<div class="chart-empty">这一天没有账单</div>') +
        '<h4 style="margin:16px 0 8px">日程与提醒</h4>' + (dayScheds.map(function (s) { return scheduleRowHtml(s, false); }).join('') || '<div class="chart-empty">这一天没有日程</div>') +
        '</div>' +
        '<div class="day-panel">' + this.dayPanelHtml(sel) + '</div></div>';
    } else {
      let yearHtml = '<div class="year-grid">';
      for (let m = 1; m <= 12; m++) {
        const first = U.fmtDate(new Date(aDate.getFullYear(), m - 1, 1));
        let mini = '<div class="mini-cal">' + ['一', '二', '三', '四', '五', '六', '日'].map(function (w) { return '<span class="w">' + w + '</span>'; }).join('');
        const lead = (new Date(aDate.getFullYear(), m - 1, 1).getDay() || 7) - 1;
        for (let i = 0; i < lead; i++) mini += '<span class="d empty"></span>';
        for (let d = 1; d <= U.daysInMonth(aDate.getFullYear(), m); d++) {
          const ds = U.fmtDate(new Date(aDate.getFullYear(), m - 1, d));
          const has = (byDate[ds] || []).length > 0;
          mini += '<span class="d' + (has ? ' has-event' : '') + (ds === U.todayStr() ? ' is-today' : '') + '" data-action="cal-day" data-date="' + ds + '">' + d + '</span>';
        }
        mini += '</div>';
        yearHtml += '<div class="year-month"><h4>' + m + '月</h4>' + mini + '</div>';
      }
      yearHtml += '</div>';
      mainHtml = '<div class="section">' + yearHtml + '</div>';
    }

    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="toolbar"><div class="seg">' +
      '<button type="button" data-action="cal-mode" data-mode="month"' + (mode === 'month' ? ' class="is-active"' : '') + '>月</button>' +
      '<button type="button" data-action="cal-mode" data-mode="week"' + (mode === 'week' ? ' class="is-active"' : '') + '>周</button>' +
      '<button type="button" data-action="cal-mode" data-mode="day"' + (mode === 'day' ? ' class="is-active"' : '') + '>日</button>' +
      '<button type="button" data-action="cal-mode" data-mode="year"' + (mode === 'year' ? ' class="is-active"' : '') + '>年</button></div>' +
      '<div class="spacer"></div>' + navArrows('cal', label) +
      '<div class="search-box" style="min-width:190px">' + U.icon('search', 16) + '<input id="calSearch" type="search" placeholder="搜索日程或账单"></div>' +
      '<button class="ghost-btn compact" type="button" data-action="add-schedule" data-date="' + sel + '">' + U.icon('calendarPlus', 16) + ' 日程</button>' +
      '</div><div id="calSearchResults"></div></div>' +
      mainHtml +
      '<div id="calDetail">' + this.calDetailHtml() + '</div>' +
      '<div class="section"><div class="cal-legend"><span><i style="background:#e5484d"></i>支出</span><span><i style="background:#2f9e44"></i>收入</span><span><i style="background:var(--primary)"></i>今日</span><span><i style="background:var(--accent-soft)"></i>日程/提醒</span><span>节日自动提醒（父亲节、母亲节等）</span></div></div>' +
      '</div>';

    U.qsa('.schedule-row').forEach(function (row) {
      row.addEventListener('dblclick', function () {
        const btn = row.querySelector('[data-action="edit-schedule"]');
        if (!btn) return;
        const sch = S.schedules.find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (sch) {
          Views._editScheduleId = sch.id;
          window.Modals.openSchedule(sch);
        }
      });
    });
    U.qsa('.cal-holiday-pill').forEach(function (pill) {
      pill.addEventListener('dblclick', function () {
        const date = pill.getAttribute('data-date');
        if (date) {
          Views._editScheduleId = null;
          window.Modals.openSchedule(null, date);
        }
      });
    });
    U.qsa('.tx-row[data-action="cal-tx"]').forEach(function (row) {
      row.addEventListener('dblclick', function (e) {
        if (e.target.closest('.tx-actions')) return;
        Views.toggleTxInline(row);
      });
    });
    Views.attachTimeGrid();
  };

  Views.timeGridHtml = function (dates) {
    const byDate = {};
    S.transactions.forEach(function (t) { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });
    const sel = this.calTimeSel;
    const dowNames = ['一', '二', '三', '四', '五', '六', '日'];
    function fmtMin(m) { return U.pad2(Math.floor(m / 60)) + ':' + U.pad2(m % 60); }
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let html = '<div class="time-axis-head"></div>';
    dates.forEach(function (date) {
      const hol = U.holidayFor(date);
      const dow = (U.parseDate(date).getDay() || 7) - 1;
      html += '<div class="time-col-head' + (date === U.todayStr() ? ' is-today' : '') + '" data-action="cal-day" data-date="' + date + '" style="cursor:pointer"><strong>' + U.parseDate(date).getDate() + '</strong><span>周' + dowNames[dow] + '</span>' +
        (hol ? '<em class="time-hol cal-holiday-pill" data-date="' + date + '">' + U.escapeHtml(hol.name) + '</em>' : '') + '</div>';
    });
    for (let h = 0; h < 24; h++) {
      const start = h * 60;
      const isNow = dates.indexOf(U.todayStr()) >= 0 && nowMin >= start && nowMin < start + 60;
      html += '<div class="time-axis' + (isNow ? ' is-now' : '') + '">' + U.pad2(h) + ':00</div>';
      dates.forEach(function (date) {
        const dayTxs = (byDate[date] || []).filter(function (t) { return t.kind === 'expense' || t.kind === 'income'; });
        const inBlock = dayTxs.filter(function (t) {
          const p = (t.time || '00:00').split(':');
          const mins = (+p[0] || 0) * 60 + (+p[1] || 0);
          return mins >= start && mins < start + 60;
        });
        const isSel = sel && sel.date === date && sel.startMin >= start && sel.startMin < start + 60;
        html += '<div class="time-block' + (isSel ? ' is-selected' : '') + (isNow && date === U.todayStr() ? ' is-now' : '') + '" data-action="cal-time" data-date="' + date + '" data-start="' + start + '">' +
          (inBlock.length ? '<span class="time-dots">' + inBlock.slice(0, 3).map(function (t) { return '<i style="background:' + (t.kind === 'expense' ? '#e5484d' : '#2f9e44') + '"></i>'; }).join('') + '</span>' : '') +
          (isSel ? '<span class="time-plus">+</span><span class="time-sel-label">' + fmtMin(sel.startMin) + '</span>' : '') +
          '</div>';
      });
    }
    return '<div class="time-grid' + (dates.length === 1 ? ' single' : '') + '">' + html + '</div>';
  };

  Views.attachTimeGrid = function () {
    const self = this;
    U.qsa('.time-block.is-selected').forEach(function (block) {
      let timer = null;
      let startY = 0;
      let baseMin = self.calTimeSel ? self.calTimeSel.startMin : 0;
      let dragging = false;
      let moved = false;
      let pointerId = 0;
      let captured = false;
      function fmtMin(m) { return U.pad2(Math.floor(m / 60)) + ':' + U.pad2(m % 60); }
      function findBlock(date, start) {
        return block.parentElement.querySelector('.time-block[data-date="' + date + '"][data-start="' + start + '"]');
      }
      function syncSelection(date, startMin) {
        U.qsa('.time-block.is-selected').forEach(function (b) {
          b.classList.remove('is-selected');
          const plus = b.querySelector('.time-plus');
          const label = b.querySelector('.time-sel-label');
          if (plus) plus.remove();
          if (label) label.remove();
        });
        const start = Math.floor(startMin / 60) * 60;
        const next = findBlock(date, start);
        if (!next) return;
        next.classList.add('is-selected');
        if (!next.querySelector('.time-plus')) {
          const plus = document.createElement('span');
          plus.className = 'time-plus';
          plus.textContent = '+';
          next.appendChild(plus);
        }
        const cur = next.querySelector('.time-sel-label');
        if (cur) cur.textContent = fmtMin(startMin);
        else {
          const label = document.createElement('span');
          label.className = 'time-sel-label';
          label.textContent = fmtMin(startMin);
          next.appendChild(label);
        }
      }
      block.addEventListener('pointerdown', function (e) {
        moved = false;
        dragging = false;
        captured = false;
        pointerId = e.pointerId;
        startY = e.clientY;
        baseMin = self.calTimeSel ? self.calTimeSel.startMin : 0;
        timer = setTimeout(function () {
          dragging = true;
          block.classList.add('is-dragging');
          block.setAttribute('data-dragging', '1');
          if (block.setPointerCapture) {
            try {
              block.setPointerCapture(pointerId);
              captured = true;
            } catch (err) {}
          }
        }, 260);
      });
      block.addEventListener('pointermove', function (e) {
        if (!dragging || !self.calTimeSel) return;
        const step = Math.round((e.clientY - startY) / 8) * 15;
        const newMin = Math.max(0, Math.min(23 * 60 + 45, baseMin + step));
        self.calTimeSel.startMin = newMin;
        syncSelection(self.calTimeSel.date, newMin);
        moved = true;
      });
      function endDrag() {
        clearTimeout(timer);
        U.qsa('.time-block.is-dragging').forEach(function (b) { b.classList.remove('is-dragging'); });
        if (captured && block.releasePointerCapture) {
          try { block.releasePointerCapture(pointerId); } catch (err) {}
        }
        if (moved) {
          U.qsa('.time-block.is-selected').forEach(function (b) {
            b.setAttribute('data-skip-click', '1');
            setTimeout(function () { b.removeAttribute('data-skip-click'); }, 500);
          });
          self.renderCalendar();
        }
        dragging = false;
      }
      block.addEventListener('pointerup', endDrag);
      block.addEventListener('pointercancel', endDrag);
    });
  };

  Views.dayPanelHtml = function (date) {
    const hol = U.holidayFor(date);
    const byDate = {};
    S.transactions.forEach(function (t) { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });
    const dayTxs = byDate[date] || [];
    const dayScheds = [];
    S.schedules.forEach(function (s) { if (U.scheduleOccursOn(s, date)) dayScheds.push(s); });
    const t = S.totals(dayTxs);
    const catTotals = S.byCategory(dayTxs.filter(function (x) { return x.kind === 'expense'; }));
    const topCats = catTotals.items.slice(0, 3).map(function (x) {
      const cat = S.categoryById(x.categoryId);
      return '<div class="legend-row"><span class="legend-dot" style="background:' + (cat ? cat.color : '#94a3b8') + '"></span><span class="legend-name">' + U.escapeHtml(cat ? cat.name : '其他') + '</span><span class="legend-val">' + U.moneyPlain(x.total) + '</span><span class="legend-pct">' + x.pct + '%</span></div>';
    }).join('') || '<div class="muted small">暂无支出</div>';
    let html = '<div class="section"><div class="section-head"><h3>' + U.escapeHtml(U.formatCN(date, true)) + '</h3>' + (hol ? '<span class="pill danger">' + U.escapeHtml(hol.name) + '</span>' : '') + '</div>' +
      '<div style="margin-top:10px"><button class="ghost-btn compact" type="button" data-action="add-schedule" data-date="' + date + '">' + U.icon('calendarPlus', 15) + ' 添加日程</button></div>' +
      '<h4 style="margin:14px 0 8px">日程与提醒</h4>' +
      (dayScheds.map(function (s) { return scheduleRowHtml(s, false); }).join('') || '<div class="muted small">暂无日程</div>') +
      '<h4 style="margin:14px 0 8px">账单</h4>' +
      (dayTxs.slice(0, 4).map(function (t) { return txRowHtml(t, { detail: true }); }).join('') || '<div class="muted small">暂无账单</div>') +
      '<h4 style="margin:14px 0 8px">当日总结</h4>' +
      '<div class="grid-3">' + statCard('收入', U.moneyPlain(t.income), 'success', '', '') + statCard('支出', U.moneyPlain(t.expense), 'danger', '', '') + statCard('结余', U.moneyPlain(t.balance), t.balance >= 0 ? 'accent' : 'danger', '', '') + '</div>' +
      '<div class="legend" style="margin-top:8px">' + topCats + '</div>' +
      '</div>';
    return html;
  };

  Views.calDetailHtml = function () {
    const d = this.calDetail;
    if (!d) return '';
    if (d.kind === 'schedule') {
      const sch = S.schedules.find(function (s) { return s.id === d.id; });
      if (!sch) return '';
      return this.scheduleDetailHtml(sch);
    }
    if (d.kind === 'tx') {
      const tx = S.transactions.find(function (t) { return t.id === d.id; });
      if (!tx) return '';
      return this.txDetailHtml(tx);
    }
    return '';
  };

  Views.scheduleDetailHtml = function (sch) {
    const meta = SCHEDULE_META[sch.type] || SCHEDULE_META.reminder;
    const cat = sch.categoryId ? S.categoryById(sch.categoryId) : null;
    const card = sch.cardId ? S.cardById(sch.cardId) : null;
    const related = S.transactions.filter(function (t) {
      if (t.date === sch.date) return true;
      if (sch.categoryId && t.categoryId === sch.categoryId) return true;
      return false;
    }).slice(0, 5).map(function (t) { return txRowHtml(t, { detail: true }); }).join('');
    let html = '<div class="section"><div class="section-head"><h3>' + U.escapeHtml(sch.title) + '</h3><span class="pill accent">' + U.escapeHtml(meta.label) + '</span>' +
      '<div class="spacer"></div><div class="tx-actions">' +
      '<button class="icon-btn" type="button" data-action="edit-schedule" data-id="' + sch.id + '" title="编辑">' + U.icon('edit', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-action="delete-schedule" data-id="' + sch.id + '" title="删除">' + U.icon('trash', 16) + '</button>' +
      '</div></div>' +
      '<div class="view-row grid-3">' +
      statCard('日期', U.formatCN(sch.date, true), '', '', 'calendar') +
      statCard('时间', sch.time && sch.time !== '00:00' ? sch.time : '全天', '', '', 'clock') +
      statCard('重复', U.repeatLabel(sch.repeat) || '不重复', '', U.remindLabel(sch.remind) ? '提醒：' + U.remindLabel(sch.remind) : '', 'refresh') +
      '</div>' +
      (sch.note ? '<div class="advice-box accent" style="margin-top:10px">' + U.escapeHtml(sch.note) + '</div>' : '') +
      (sch.type === 'bill' && sch.amount ? '<div class="advice-box warn" style="margin-top:10px">账单金额：' + U.moneyPlain(sch.amount) + (cat ? ' · ' + U.escapeHtml(cat.name) : '') + (card ? ' · ' + U.escapeHtml(card.name) : '') + '</div>' : '') +
      '<h4 style="margin:14px 0 8px">相关账单</h4>' +
      (related || '<div class="muted small">暂无相关账单</div>') +
      '</div>';
    if (sch.type === 'birthday' || sch.type === 'anniversary') {
      html += scheduleCompareHtml(sch);
    }
    return html;
  };

  Views.txDetailHtml = function (tx) {
    const cat = S.categoryById(tx.categoryId);
    const sub = S.subName(tx.categoryId, tx.subcategoryId);
    const detail = S.detailName(tx.categoryId, tx.subcategoryId, tx.detailId);
    const child = S.detailChildName(tx.categoryId, tx.subcategoryId, tx.detailId, tx.detailChildId);
    const card = tx.cardId ? S.cardById(tx.cardId) : null;
    const cls = tx.kind === 'expense' ? 'expense' : tx.kind === 'income' ? 'income' : '';
    const related = S.transactions.filter(function (t) { return t.categoryId === tx.categoryId && t.id !== tx.id; }).slice(0, 5)
      .map(function (t) { return txRowHtml(t, { detail: true }); }).join('');
    let html = '<div class="section"><div class="section-head"><h3>账单详情</h3><span class="pill ' + (tx.kind === 'expense' ? 'danger' : tx.kind === 'income' ? 'success' : 'accent') + '">' + U.escapeHtml({ expense: '支出', income: '收入', recharge: '充值', withdraw: '提现' }[tx.kind] || tx.kind) + '</span>' +
      '<div class="spacer"></div><div class="tx-actions">' +
      '<button class="icon-btn" type="button" data-action="edit-tx" data-id="' + tx.id + '" title="编辑">' + U.icon('edit', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-action="delete-tx" data-id="' + tx.id + '" title="删除">' + U.icon('trash', 16) + '</button></div></div>' +
      '<div class="grid-3">' +
      statCard('金额', U.moneyPlain(tx.amount), cls, '', 'money') +
      statCard('分类', U.escapeHtml(S.txCatLabels(tx)), '', '', 'tags') +
      statCard('日期', U.formatCN(tx.date, true) + ' ' + tx.time, '', card ? card.name + ' · ' + tx.paymentType : tx.paymentType, 'calendar') +
      '</div>' +
      (tx.note ? '<div class="advice-box accent" style="margin-top:10px">' + U.escapeHtml(tx.note) + '</div>' : '') +
      (tx.mood ? '<div class="muted small" style="margin-top:6px">心情 ' + tx.mood + '</div>' : '') +
      (tx.photo ? '<img src="' + tx.photo + '" alt="账单照片" style="margin-top:10px;border-radius:10px;max-height:220px">' : '') +
      '<h4 style="margin:14px 0 8px">同分类近期账单</h4>' +
      (related || '<div class="muted small">暂无其他账单</div>') +
      '</div>';
    return html;
  };

  Views.toggleTxInline = function (row) {
    const tx = S.transactions.find(function (t) { return t.id === row.getAttribute('data-tx-id'); });
    if (!tx) return;
    const next = row.nextElementSibling;
    if (next && next.classList.contains('tx-inline-detail')) {
      next.remove();
      row.classList.remove('is-expanded');
      return;
    }
    row.classList.add('is-expanded');
    const card = tx.cardId ? S.cardById(tx.cardId) : null;
    const labels = S.txCatLabels(tx);
    const kindLabel = { expense: '支出', income: '收入', recharge: '充值', withdraw: '提现' }[tx.kind] || tx.kind;
    const detail = document.createElement('div');
    detail.className = 'tx-inline-detail';
    detail.innerHTML =
      '<div class="tx-detail-head"><span class="pill ' + (tx.kind === 'expense' ? 'danger' : tx.kind === 'income' ? 'success' : 'accent') + '">' + U.escapeHtml(kindLabel) + '</span>' +
      '<span class="tx-detail-amount ' + (tx.kind === 'expense' ? 'expense' : 'income') + '">' + (tx.kind === 'expense' ? '-' : tx.kind === 'income' ? '+' : '') + U.moneyPlain(tx.amount) + '</span></div>' +
      '<div class="tx-detail-row"><span>分类</span><strong>' + U.escapeHtml(labels) + '</strong></div>' +
      '<div class="tx-detail-row"><span>时间</span><strong>' + U.escapeHtml(U.formatCN(tx.date, true) + ' ' + (tx.time || '')) + '</strong></div>' +
      '<div class="tx-detail-row"><span>方式</span><strong>' + U.escapeHtml((card ? card.name + ' · ' : '') + (tx.paymentType || '未选择')) + '</strong></div>' +
      (tx.note ? '<div class="tx-detail-note">' + U.escapeHtml(tx.note) + '</div>' : '') +
      (tx.mood ? '<div class="tx-detail-row"><span>心情</span><strong>' + U.escapeHtml(tx.mood) + '</strong></div>' : '') +
      (tx.photo ? '<img src="' + tx.photo + '" alt="账单照片" class="tx-detail-photo">' : '') +
      '<div class="tx-detail-actions"><button class="icon-btn" type="button" data-action="edit-tx" data-id="' + tx.id + '" title="编辑">' + U.icon('edit', 15) + '</button>' +
      '<button class="icon-btn" type="button" data-action="delete-tx" data-id="' + tx.id + '" title="删除">' + U.icon('trash', 15) + '</button></div>';
    row.after(detail);
  };

  // ---------- 卡片 ----------
  Views.renderCards = function () {
    const cards = S.cards;
    let totalBal = 0;
    cards.forEach(function (c) { totalBal += S.cardBalance(c.id); });
    totalBal = U.round2(totalBal);
    if (!this.cardsSelected && cards.length) this.cardsSelected = cards[0].id;
    const selId = cards.some(function (c) { return c.id === this.cardsSelected; }, this) ? this.cardsSelected : (cards[0] || {}).id;

    let cardHtml = '';
    cards.forEach(function (card) {
      const bal = S.cardBalance(card.id);
      cardHtml += '<div class="bank-card' + (selId === card.id ? ' is-selected' : '') + '" style="background:linear-gradient(135deg,' + card.color + ', color-mix(in srgb, ' + card.color + ' 68%, #000))" data-action="card-select" data-card-id="' + card.id + '" data-id="' + card.id + '">' +
        '<div class="card-top"><span class="card-ico">' + U.icon('wallet', 18) + '</span><div><div class="card-name">' + U.escapeHtml(card.name) + '</div><div class="card-type">' + U.escapeHtml(card.type) + ' · ' + U.escapeHtml(card.note || '') + '</div></div></div>' +
        '<div class="card-balance"><div class="lbl">当前余额</div><div class="val">' + U.moneyPlain(bal) + '</div></div>' +
        '<div class="card-foot"><span>初始 ' + U.moneyPlain(card.initialBalance) + '</span><div class="card-actions">' +
        '<button class="icon-btn" type="button" data-action="card-op" data-card-id="' + card.id + '" data-op="recharge" title="充值">' + U.icon('arrowUp', 15) + '</button>' +
        '<button class="icon-btn" type="button" data-action="card-op" data-card-id="' + card.id + '" data-op="withdraw" title="提现">' + U.icon('arrowDown', 15) + '</button>' +
        '<button class="icon-btn" type="button" data-action="open-transfer" data-card-id="' + card.id + '" title="转账">' + U.icon('transfer', 15) + '</button>' +
        '<button class="icon-btn" type="button" data-action="edit-card" data-card-id="' + card.id + '" title="编辑">' + U.icon('edit', 15) + '</button>' +
        '<button class="icon-btn" type="button" data-action="delete-card" data-card-id="' + card.id + '" title="删除">' + U.icon('trash', 15) + '</button>' +
        '</div></div>' +
        '</div>';
    });
    if (!cardHtml) cardHtml = '<div class="chart-empty">还没有卡片，点左上角添加一张吧</div>';

    // 选中卡片账本
    let ledgerHtml = '';
    if (selId) {
      const ledger = S.cardLedger(selId);
      const kindMeta = {
        expense: { label: '支出', cls: 'danger', sign: '-' },
        income: { label: '收入', cls: 'success', sign: '+' },
        recharge: { label: '充值', cls: 'accent', sign: '+' },
        withdraw: { label: '提现', cls: 'warn', sign: '-' },
        'transfer-out': { label: '转出', cls: 'warn', sign: '-' },
        'transfer-in': { label: '转入', cls: 'accent', sign: '+' }
      };
      ledgerHtml = ledger.slice(0, 40).map(function (e) {
        const m = kindMeta[e.kind] || { label: e.kind, cls: '', sign: '' };
        let name = e.note || S.catName(e.categoryId);
        if (e.kind === 'transfer-out') name = '转给 ' + ((S.cardById(e.toCardId) || {}).name || '');
        if (e.kind === 'transfer-in') name = '来自 ' + ((S.cardById(e.fromCardId) || {}).name || '');
        if (e.kind === 'expense' || e.kind === 'income') name = S.subName(e.categoryId, e.subcategoryId) + ' · ' + name;
        return '<div class="tx-row"><div class="tx-emoji">' + U.icon(e.kind === 'transfer-out' || e.kind === 'transfer-in' ? 'transfer' : e.kind === 'recharge' ? 'arrowDown' : e.kind === 'withdraw' ? 'arrowUp' : 'receipt', 18) + '</div>' +
          '<div class="tx-info"><strong>' + U.escapeHtml(name) + '</strong><span>' + U.escapeHtml(U.formatCN(e.date) + ' ' + e.time) + '</span></div>' +
          '<div class="tx-amount ' + m.cls + '">' + m.sign + U.moneyPlain(e.amount) + '</div>' +
          '<button class="icon-btn" type="button" data-action="ledger-delete" data-kind="' + (e.isTransfer ? 'transfer' : 'tx') + '" data-id="' + e.id + '" title="删除">' + U.icon('trash', 16) + '</button></div>';
      }).join('') || '<div class="chart-empty">这张卡还没有流水</div>';
    }

    // 卡间关系
    const rels = S.cardRelations();
    let relHtml = '';
    rels.forEach(function (r) {
      const outs = r.out.map(function (o) {
        return '<div class="flow-item"><span class="pill primary">' + U.escapeHtml(r.card.name) + '</span><span class="flow-arrow">' + U.icon('arrowRight', 18) + '</span><span class="pill accent">' + U.escapeHtml((S.cardById(o.toCardId) || {}).name || '') + '</span><span class="flow-amount">' + U.moneyPlain(o.amount) + '</span></div>';
      }).join('');
      const inns = r.inn.map(function (i) {
        return '<div class="flow-item"><span class="pill primary">' + U.escapeHtml((S.cardById(i.fromCardId) || {}).name || '') + '</span><span class="flow-arrow">' + U.icon('arrowRight', 18) + '</span><span class="pill accent">' + U.escapeHtml(r.card.name) + '</span><span class="flow-amount">' + U.moneyPlain(i.amount) + '</span></div>';
      }).join('');
      relHtml += '<div class="section"><div class="section-head"><h3>' + U.escapeHtml(r.card.name) + '</h3><span class="sub">初始余额 ' + U.moneyPlain(r.card.initialBalance) + ' · 当前余额 ' + U.moneyPlain(S.cardBalance(r.card.id)) + '</span></div>' +
        (outs || inns ? '<div class="flow-list">' + outs + inns + '</div>' : '<div class="muted small">暂无卡间转账关系</div>') +
        '</div>';
    });

    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="toolbar"><div class="seg">' + statCard('全部卡片余额', U.moneyPlain(totalBal), 'accent', '', '') + '</div><div class="spacer"></div>' +
      '<button class="ghost-btn compact" type="button" data-action="open-transfer">' + U.icon('transfer', 16) + ' 卡间转账</button>' +
      '<button class="primary-btn compact" type="button" data-action="add-card">' + U.icon('plus', 15) + ' 添加卡片</button></div>' +
      '<p class="muted small" style="margin-top:-6px">长按卡片可拖动排序</p>' +
      '<div class="card-grid">' + cardHtml + '</div>' +
      (selId ? '<div class="section"><div class="section-head"><h3>' + U.escapeHtml((S.cardById(selId) || {}).name || '') + ' 流水</h3>' +
      '<div class="card-op-grid" style="margin-left:auto;max-width:420px">' +
      '<button class="card-op-btn" type="button" data-action="card-op" data-card-id="' + selId + '" data-op="recharge">' + U.icon('arrowUp', 18) + '充值</button>' +
      '<button class="card-op-btn" type="button" data-action="card-op" data-card-id="' + selId + '" data-op="withdraw">' + U.icon('arrowDown', 18) + '提现</button>' +
      '<button class="card-op-btn" type="button" data-action="card-op" data-card-id="' + selId + '" data-op="expense">' + U.icon('receipt', 18) + '记支出</button>' +
      '<button class="card-op-btn" type="button" data-action="card-op" data-card-id="' + selId + '" data-op="income">' + U.icon('money', 18) + '记收入</button>' +
      '</div></div>' + ledgerHtml + '</div>' : '') +
      '<div class="section"><div class="section-head"><h3>卡间资金关系</h3><span class="sub">初始余额与转账流向</span></div><div class="view-row grid-2">' + relHtml + '</div></div>' +
      '</div>';
    attachLongPressReorder('.card-grid', '.bank-card', function (fromId, toId) {
      S.reorderCards(fromId, toId);
    });
  };

  // ---------- 目标 ----------
  Views.renderGoals = function () {
    const anchor = this.goalsAnchor;
    let goalsHtml = '';
    S.goals.forEach(function (g) {
      const prog = S.goalProgress(g, anchor);
      const cls = prog.isOver ? 'danger' : prog.percent >= 90 ? 'danger' : prog.percent >= 75 ? 'warn' : '';
      const pctLabel = prog.target ? Math.min(999, Math.round(prog.percent)) + '%' : '--';
      const fillStyle = 'width:' + Math.min(100, prog.percent) + '%';
      const range = S.goalPeriodRange(g, anchor);
      let thChips = '';
      (g.thresholds || []).forEach(function (th) {
        const hit = prog.percent >= th.percent;
        const soon = !hit && th.percent - prog.percent <= 5 && th.percent - prog.percent > 0;
        thChips += '<span class="threshold-chip' + (hit ? ' is-hit' : soon ? ' is-soon' : '') + '">' + th.percent + '%' + (hit ? ' 已触发' : '') + '</span>';
      });
      goalsHtml += '<div class="goal-card"><div class="goal-head"><div class="goal-ico">' + U.icon('target', 20) + '</div>' +
        '<div class="goal-title"><strong>' + U.escapeHtml(g.name) + '</strong><span>' + U.escapeHtml(g.period === 'month' ? '月度' : g.period === 'week' ? '周度' : '每日') + ' · ' + U.escapeHtml(g.categoryId ? S.catName(g.categoryId) : '全部支出') + ' · ' + U.escapeHtml(range.label) + '</span></div>' +
        '<div class="tx-actions"><button class="icon-btn" type="button" data-action="edit-goal" data-id="' + g.id + '" title="编辑">' + U.icon('edit', 16) + '</button>' +
        '<button class="icon-btn" type="button" data-action="delete-goal" data-id="' + g.id + '" title="删除">' + U.icon('trash', 16) + '</button></div></div>' +
        '<div class="toolbar"><div class="bold price">' + U.moneyPlain(prog.spent) + ' <span class="muted small">/ ' + U.moneyPlain(prog.target) + '</span></div><div class="spacer"></div><span class="' + (cls === 'danger' ? 'expense' : '') + ' bold">' + pctLabel + '</span></div>' +
        '<div class="progress-track"><div class="progress-fill ' + cls + '" style="' + fillStyle + '"></div></div>' +
        '<div>' + thChips + '</div>' +
        (g.message ? '<div class="advice-box accent goal-message">' + U.icon('heart', 14) + ' ' + U.escapeHtml(g.message) + '</div>' : '') +
        (prog.isOver ? '<div class="advice-box danger">已超支 ' + U.moneyPlain(prog.spent - prog.target) + '，接下来每一笔都要三思啦。</div>' : '') +
        '</div>';
    });
    if (!goalsHtml) goalsHtml = '<div class="chart-empty">还没有支出目标，创建一个开始管理预算吧</div>';

    let adviceHtml = '';
    S.goals.filter(function (g) { return g.active; }).forEach(function (g) {
      const prog = S.goalProgress(g, anchor);
      if (!prog.target) return;
      const range = S.goalPeriodRange(g, anchor);
      const totalDays = g.period === 'day' ? 1 : g.period === 'week' ? 7 : U.daysInMonth(U.parseDate(range.from).getFullYear(), U.parseDate(range.from).getMonth() + 1);
      const elapsed = Math.max(1, Math.min(totalDays, U.diffDays(range.from, U.todayStr()) + 1));
      const remainDays = Math.max(0, totalDays - elapsed);
      const remainBudget = Math.max(0, prog.target - prog.spent);
      const daily = remainDays > 0 ? remainBudget / remainDays : 0;
      const weekly = Math.round(prog.target / (g.period === 'week' ? 1 : 4));
      const scopeName = g.categoryId ? S.catName(g.categoryId) : '总支出';
      adviceHtml += '<div class="advice-box ' + (prog.percent >= 75 ? 'danger' : 'accent') + '">【' + U.escapeHtml(g.name) + '】' + U.escapeHtml(scopeName) + '目标 ' + U.moneyPlain(prog.target) + '，已用 ' + prog.percent + '%。剩余 ' + remainDays + ' 天，平均每天最多花 ' + U.moneyPlain(daily) + '；建议按周分配：每周约 ' + U.moneyPlain(weekly) + '，把大额开支放在月初计划内。</div>';
    });
    if (!adviceHtml) adviceHtml = '<div class="advice-box accent">设置目标后，小暖会根据剩余天数给出每日和每周花销建议。</div>';

    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="toolbar"><div><h3 style="margin:0">预算与提醒</h3><p class="sub muted" style="margin:2px 0 0">支持多个阈值，到点会蹦出俏皮提醒</p></div>' +
      '<div class="spacer"></div>' + navArrows('goal', U.formatCN(anchor, true)) +
      '<button class="primary-btn compact" type="button" data-action="add-goal">' + U.icon('plus', 15) + ' 新建目标</button></div></div>' +
      '<div class="view-row grid-2">' + goalsHtml + '</div>' +
      '<div class="section"><div class="section-head"><h3>花销建议</h3><span class="sub">根据剩余天数自动分配</span></div>' + adviceHtml + '</div>' +
      '<div class="section"><div class="section-head"><h3>阈值提醒文案预览</h3><span class="sub">到达对应进度时会推送这条文案</span></div><div class="legend">' +
      S.goals.flatMap(function (g) { return (g.thresholds || []).map(function (th) { return { g: g, th: th }; }); }).map(function (x) {
        return '<div class="legend-row"><span class="legend-dot" style="background:var(--primary)"></span><span class="legend-name">' + U.escapeHtml(x.g.name + ' · ' + x.th.percent + '%') + '</span><span class="muted small">' + U.escapeHtml(x.th.enabled === false ? '（未启用）' : (x.th.message || '使用默认提醒文案')) + '</span></div>';
      }).join('') + (S.goals.flatMap(function (g) { return (g.thresholds || []).filter(function (th) { return th.enabled !== false; }); }).length ? '' : '<div class="muted small">暂无可预览的启用阈值</div>') +
      '</div></div>' +
      '</div>';
  };

  // ---------- 分类 ----------
  Views.renderCategories = function () {
    const type = this.categoriesTab;
    const cats = S.categoriesByType(type);
    let grid = '';
    cats.forEach(function (cat) {
      const count = S.transactions.filter(function (t) { return S.txInCategory(t, cat.id); }).length;
      const subs = cat.subs.map(function (s) {
        const details = (s.children || []).map(function (d) {
          const childChips = (d.children || []).map(function (x) {
            return '<span class="sub-chip child"><span class="dot" style="background:' + x.color + '"></span>' + U.escapeHtml(x.name) +
              '<button class="icon-btn" style="width:17px;height:17px" type="button" data-action="edit-detailchild" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" data-detail-id="' + d.id + '" data-detail-child-id="' + x.id + '" title="编辑小类">' + U.icon('edit', 10) + '</button>' +
              '<button class="icon-btn" style="width:17px;height:17px" type="button" data-action="delete-detailchild" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" data-detail-id="' + d.id + '" data-detail-child-id="' + x.id + '" title="删除小类">' + U.icon('x', 10) + '</button></span>';
          }).join('');
          return '<div class="detail-item"><span class="sub-chip detail"><span class="dot" style="background:' + d.color + '"></span>' + U.escapeHtml(d.name) +
            '<button class="icon-btn" style="width:18px;height:18px" type="button" data-action="edit-detail" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" data-detail-id="' + d.id + '" title="编辑细分类">' + U.icon('edit', 11) + '</button>' +
            '<button class="icon-btn" style="width:18px;height:18px" type="button" data-action="delete-detail" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" data-detail-id="' + d.id + '" title="删除细分类">' + U.icon('x', 11) + '</button></span>' +
            '<div class="detailchild-row">' + childChips +
            '<button class="detail-add" type="button" data-action="add-detailchild" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" data-detail-id="' + d.id + '" title="添加小类">' + U.icon('plus', 10) + ' 小类</button>' +
            '</div></div>';
        }).join('');
        return '<div class="sub-block"><span class="sub-chip"><span class="dot" style="background:' + s.color + '"></span>' + U.escapeHtml(s.name) +
          '<button class="icon-btn" style="width:20px;height:20px" type="button" data-action="edit-sub" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" title="编辑小类">' + U.icon('edit', 12) + '</button>' +
          '<button class="icon-btn" style="width:20px;height:20px" type="button" data-action="delete-sub" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" title="删除小类">' + U.icon('x', 12) + '</button></span>' +
          '<div class="detail-chip-row">' + details +
          '<button class="detail-add" type="button" data-action="add-detail" data-cat-id="' + cat.id + '" data-sub-id="' + s.id + '" title="添加细分类">' + U.icon('plus', 11) + ' 细类</button>' +
          '</div></div>';
      }).join('');
      grid += '<div class="cat-card" data-id="' + cat.id + '"><div class="cat-card-head"><div class="cat-big-ico" style="background:' + cat.color + '">' + U.escapeHtml(cat.icon) + '</div>' +
        '<div class="cat-name"><strong>' + U.escapeHtml(cat.name) + '</strong><span>' + (cat.system ? '默认分类' : '自定义分类') + ' · ' + count + ' 笔账单</span></div>' +
        '<div class="tx-actions"><button class="icon-btn" type="button" data-action="add-sub" data-cat-id="' + cat.id + '" title="添加小类">' + U.icon('plus', 16) + '</button>' +
        '<button class="icon-btn" type="button" data-action="edit-category" data-id="' + cat.id + '" title="编辑大类">' + U.icon('edit', 16) + '</button>' +
        '<button class="icon-btn" type="button" data-action="delete-category" data-id="' + cat.id + '" title="删除大类">' + U.icon('trash', 16) + '</button></div></div>' +
        '<div class="sub-chip-row">' + subs + '</div></div>';
    });
    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="toolbar"><div class="seg">' +
      '<button type="button" data-action="categories-tab" data-type="expense"' + (type === 'expense' ? ' class="is-active"' : '') + '>支出分类</button>' +
      '<button type="button" data-action="categories-tab" data-type="income"' + (type === 'income' ? ' class="is-active"' : '') + '>收入分类</button></div>' +
      '<div class="spacer"></div>' +
      '<button class="primary-btn compact" type="button" data-action="add-category" data-type="' + type + '">' + U.icon('plus', 15) + ' 新建大类</button></div>' +
      '<p class="muted small">四个层级均可新增、改名、换色；所有层级名称全局唯一，不能重复。</p></div>' +
      '<div class="view-row grid-3">' + grid + '</div>' +
      '</div>';
    attachLongPressReorder('.view-row.grid-3', '.cat-card', function (fromId, toId) {
      S.reorderCategories(type, fromId, toId);
    });
  };

  // ---------- 设置 ----------
  Views.renderSettings = function () {
    const st = S.settings;
    const themeHtml = Object.keys(THEMES).map(function (key) {
      const t = THEMES[key];
      return '<button class="theme-option' + (st.theme === key ? ' is-active' : '') + '" type="button" data-action="set-theme" data-theme="' + key + '">' +
        '<div class="theme-swatch" style="background:linear-gradient(135deg,' + t.primary + ',' + t.accent + ')">' + t.name + '</div>' +
        '<strong>' + t.name + '</strong></button>';
    }).join('');
    const bgMode = st.backgroundMode || 'color';
    const bgPreview = st.backgroundMode === 'image' && st.backgroundValue ? '<img src="' + st.backgroundValue + '" alt="背景预览">' : '<span style="background:' + (st.backgroundValue || 'linear-gradient(135deg, var(--primary-soft), var(--accent-soft))') + ';display:block;width:100%;height:100%"></span>';
    const globalCardId = st.defaultCardId === null ? '' : (st.defaultCardId || (S.cards.length ? S.cards[0].id : ''));
    const cardSelect = function (cur) {
      return '<option value="">不使用卡片</option>' + S.cards.map(function (c) {
        return '<option value="' + c.id + '"' + (cur === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
    };
    const catCardRows = S.categories.map(function (c) {
      const cur = Object.prototype.hasOwnProperty.call(c, 'defaultCardId') ? (c.defaultCardId || '') : globalCardId;
      return '<div class="setting-row"><div class="info"><strong>' + U.escapeHtml(c.name) + '</strong><span>选择该分类时自动使用的卡片</span></div><select data-action="default-card" data-cat-id="' + c.id + '" style="width:auto">' + cardSelect(cur) + '</select></div>';
    }).join('');
    const defaultCardHtml = '<div class="section"><div class="section-head"><h3>默认卡片</h3><span class="sub">记账时按分类自动带出卡片</span></div>' +
      '<div class="setting-row"><div class="info"><strong>全局默认</strong><span>分类没有单独设置时使用</span></div><select data-action="default-card" data-cat-id="global" style="width:auto">' + cardSelect(globalCardId) + '</select></div>' +
      catCardRows + '</div>';

    U.qs('#viewContent').innerHTML =
      '<div class="view-stack">' +
      '<div class="section"><div class="section-head"><h3>主题</h3><span class="sub">默认暖橙，可自由切换</span></div><div class="theme-grid">' + themeHtml + '</div>' +
      '<div class="setting-row" style="margin-top:10px"><div class="info"><strong>自定义颜色</strong><span>选择后主题自动切换到“自定义”</span></div>' +
      '<label class="small">主色 <input type="color" data-action="custom-color" data-key="primary" value="' + st.primary + '" style="width:44px;height:30px;padding:2px;border:1px solid var(--border);border-radius:6px;background:var(--surface)"></label>' +
      '<label class="small">强调色 <input type="color" data-action="custom-color" data-key="accent" value="' + st.accent + '" style="width:44px;height:30px;padding:2px;border:1px solid var(--border);border-radius:6px;background:var(--surface)"></label></div></div>' +

      '<div class="section"><div class="section-head"><h3>背景</h3><span class="sub">纯色、渐变或相册图片</span></div>' +
      '<div class="seg">' +
      '<button type="button" data-action="bg-mode" data-mode="color"' + (bgMode === 'color' ? ' class="is-active"' : '') + '>纯色</button>' +
      '<button type="button" data-action="bg-mode" data-mode="gradient"' + (bgMode === 'gradient' ? ' class="is-active"' : '') + '>渐变</button>' +
      '<button type="button" data-action="bg-mode" data-mode="image"' + (bgMode === 'image' ? ' class="is-active"' : '') + '>图片</button></div>' +
      '<div class="view-row grid-2" style="margin-top:12px">' +
      '<div class="bg-option"><span class="small bold">预览</span><div class="bg-preview">' + bgPreview + '</div></div>' +
      '<div class="bg-option"><span class="small bold">设置</span>' +
      (bgMode === 'color' ? '<label class="field"><span>背景颜色</span><input type="color" data-action="bg-color" value="' + (st.backgroundValue || '#fff6ef') + '" style="height:40px"></label>' : '') +
      (bgMode === 'gradient' ? '<div class="theme-grid">' + GRADIENTS.map(function (g, i) {
        return '<button class="theme-option' + (st.backgroundValue === g ? ' is-active' : '') + '" type="button" data-action="bg-gradient" data-value="' + g + '"><div class="theme-swatch" style="background:' + g + '"></div><strong>渐变 ' + (i + 1) + '</strong></button>';
      }).join('') + '</div>' : '') +
      (bgMode === 'image' ? '<div><input id="bgImageInput" type="file" accept="image/*" hidden><button class="ghost-btn" type="button" data-action="bg-image">' + U.icon('image', 16) + ' 从相册选择图片</button>' +
      (st.backgroundValue ? ' <button class="text-btn" type="button" data-action="bg-remove">移除图片</button>' : '') + '</div>' : '') +
      '<button class="ghost-btn" type="button" data-action="bg-default" style="margin-top:8px">恢复默认背景</button>' +
      '</div></div></div>' +

      '<div class="section"><div class="section-head"><h3>提醒</h3></div>' +
      '<div class="setting-row"><div class="info"><strong>节日提醒</strong><span>父亲节、母亲节、生日等自动提醒记账</span></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="holidayReminders"' + (st.holidayReminders !== false ? ' checked' : '') + '><span class="track"></span></label></div>' +
      '<div class="setting-row"><div class="info"><strong>俏皮提醒</strong><span>阈值提醒使用更有趣的文案</span></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="playfulReminders"' + (st.playfulReminders !== false ? ' checked' : '') + '><span class="track"></span></label></div>' +
      '<div class="setting-row"><div class="info"><strong>提示消息</strong><span>记账成功、金额错误等轻提示，可上滑或用右上角 × 关闭；关闭后不再显示</span></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="showToasts"' + (st.showToasts !== false ? ' checked' : '') + '><span class="track"></span></label></div>' +
      '<div class="setting-row"><div class="info"><strong>回车提交</strong><span>编辑名称时按回车直接完成，长按回车换行</span></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="enterToSubmit"' + (st.enterToSubmit !== false ? ' checked' : '') + '><span class="track"></span></label></div>' +
      '<div class="setting-row"><div class="info"><strong>长按回车换行</strong><span>长按回车插入换行，普通回车仍然提交</span></div><label class="switch"><input type="checkbox" data-action="toggle-setting" data-key="enterLongPressNewline"' + (st.enterLongPressNewline !== false ? ' checked' : '') + '><span class="track"></span></label></div></div>' +
      '<div class="section"><div class="section-head"><h3>记账时间</h3><span class="sub">日历双击今天或日视图记账的默认时间</span></div>' +
      '<div class="setting-row"><div class="info"><strong>早上记账时间</strong><span>双击当天日期或日视图右上角记账时使用</span></div><input type="time" data-action="morning-time" value="' + U.escapeHtml(st.defaultMorningTime || '08:00') + '" style="width:130px"></div></div>' +
      defaultCardHtml +

      '<div class="view-row grid-2">' +
      '<div class="section"><div class="section-head"><h3>账号</h3></div>' +
      '<label class="field"><span>显示名称（需唯一）</span><input id="profileName" type="text" value="' + U.escapeHtml(S.currentUserName()) + '" maxlength="20"></label>' +
      '<p id="profileNameHint" class="muted small" style="margin:-4px 0 10px">名称用于登录，每个用户唯一</p>' +
      '<button class="primary-btn compact" type="button" data-action="save-profile" style="margin-top:10px">保存名称</button>' +
      '<div style="height:12px"></div>' +
      '<label class="field"><span>原密码</span><input id="oldPass" type="password" placeholder="不修改密码可留空"></label>' +
      '<label class="field"><span>新密码</span><input id="newPass" type="password" placeholder="至少 4 位"></label>' +
      '<button class="ghost-btn" type="button" data-action="save-password" style="margin-top:10px">修改密码</button></div>' +

      '<div class="section"><div class="section-head"><h3>数据</h3></div>' +
      '<div class="setting-row"><div class="info"><strong>导出备份</strong><span>把当前账号全部数据下载为 JSON</span></div><button class="ghost-btn compact" type="button" data-action="export-data">' + U.icon('download', 16) + ' 导出</button></div>' +
      '<div class="setting-row"><div class="info"><strong>导入恢复</strong><span>从备份文件恢复账本</span></div><input id="importFileInput" type="file" accept="application/json" hidden><button class="ghost-btn compact" type="button" data-action="import-data">' + U.icon('upload', 16) + ' 导入</button></div>' +
      '<div class="setting-row"><div class="info"><strong>重置数据</strong><span>清空当前账号，恢复演示数据</span></div><button class="ghost-btn compact" type="button" data-action="reset-data">' + U.icon('refresh', 16) + ' 重置</button></div>' +
      '<div class="setting-row"><div class="info"><strong>载入演示数据</strong><span>清空后想看看示例图表，一键填充演示账单</span></div><button class="ghost-btn compact" type="button" data-action="load-demo">' + U.icon('sparkle', 16) + ' 载入</button></div>' +
      '<div class="setting-row"><div class="info"><strong>退出登录</strong><span>切换或新建其他账号</span></div><button class="ghost-btn compact" type="button" data-action="logout">' + U.icon('logout', 16) + ' 退出</button></div>' +
      '<div class="setting-row"><div class="info"><strong>删除账号</strong><span>彻底删除当前账号与全部数据</span></div><button class="danger-btn compact" type="button" data-action="delete-account">' + U.icon('trash', 16) + ' 删除</button></div>' +
      '</div></div>' +

      '<div class="section"><div class="section-head"><h3>关于</h3></div><p class="muted small" style="margin:0">暖账本 · 本地记账应用。账号与数据保存在当前浏览器 localStorage，离线可用；换设备时请使用“导出备份”再导入。</p></div>' +
      '</div>';
  };

  window.Views = Views;
  window.ViewsConfig = { THEMES: THEMES, GRADIENTS: GRADIENTS };
})();
