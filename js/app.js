(function () {
  'use strict';
  const U = window.Utils;
  const S = window.Store;
  const V = window.Views;
  const M = window.Modals;
  const THEMES = window.ViewsConfig.THEMES;

  // ---------- 颜色工具 ----------
  function hexToRgb(hex) {
    const m = String(hex || '').replace('#', '');
    const full = m.length === 3 ? m.split('').map(function (c) { return c + c; }).join('') : m;
    const n = parseInt(full, 16);
    if (isNaN(n)) return { r: 242, g: 107, b: 29 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbStr(c) { return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')'; }
  function mix(hex, other, ratio) {
    const a = hexToRgb(hex), b = hexToRgb(other);
    return rgbStr({
      r: Math.round(a.r * ratio + b.r * (1 - ratio)),
      g: Math.round(a.g * ratio + b.g * (1 - ratio)),
      b: Math.round(a.b * ratio + b.b * (1 - ratio))
    });
  }
  function darken(hex, amt) {
    const c = hexToRgb(hex);
    amt = amt || 0.18;
    return rgbStr({ r: Math.round(c.r * (1 - amt)), g: Math.round(c.g * (1 - amt)), b: Math.round(c.b * (1 - amt)) });
  }

  // ---------- 主题与背景 ----------
  function applySettings() {
    const st = S.settings;
    const root = document.documentElement;
    root.style.setProperty('--primary', st.primary);
    root.style.setProperty('--primary-strong', darken(st.primary));
    root.style.setProperty('--primary-soft', mix(st.primary, '#ffffff', 0.86));
    root.style.setProperty('--accent', st.accent);
    root.style.setProperty('--accent-soft', mix(st.accent, '#ffffff', 0.86));
    if (st.theme === 'midnight') document.body.setAttribute('data-theme', 'midnight');
    else document.body.removeAttribute('data-theme');
    const body = document.body;
    body.classList.remove('bg-image');
    body.style.background = '';
    if (st.backgroundMode === 'image' && st.backgroundValue) {
      body.classList.add('bg-image');
      body.style.background = 'linear-gradient(rgba(255,252,248,.78), rgba(255,252,248,.78)), url("' + st.backgroundValue + '") center / cover fixed no-repeat';
    } else if (st.backgroundMode === 'gradient' && st.backgroundValue) {
      body.style.background = st.backgroundValue;
    } else if (st.backgroundMode === 'color' && st.backgroundValue) {
      body.style.background = st.backgroundValue;
    }
  }

  // ---------- 提醒 ----------
  function checkGoalAlerts() {
    S.goals.forEach(function (g) {
      if (!g.active) return;
      S.crossedThresholds(g).forEach(function (th) {
        if (S.hasAlerted(g.id, th.percent)) return;
        const msg = S.settings.playfulReminders !== false && th.message ? th.message : '已用 ' + g.name + ' 的 ' + th.percent + '%，注意控制花销。';
        V.toast('预算提醒：' + g.name, msg, 'warn');
        S.markAlert(g.id, th.percent);
      });
    });
  }

  function checkScheduleReminders() {
    const today = U.todayStr();
    if (S.settings.holidayReminders !== false) {
      const hol = U.holidayFor(today);
      if (hol) V.toast('节日提醒', '今天是' + hol.name + '，记得给重要的人一份心意，也别忘了记账。', 'accent');
    }
    S.schedules.forEach(function (s) {
      const occurs = U.scheduleOccursOn(s, today);
      if (occurs && !s.done) {
        V.toast('今日日程', s.title + (s.time && s.time !== '00:00' ? ' · ' + s.time : '') + (s.note ? ' · ' + s.note : ''), 'accent');
      }
      const off = U.remindOffsetMinutes(s.remind);
      if (off > 0 && !s.done) {
        const occDate = U.nextOccurrence(s, today);
        if (occDate) {
          const d = U.parseDate(occDate);
          const hm = (s.time || '09:00').split(':');
          d.setHours(+hm[0] || 0, +hm[1] || 0, 0, 0);
          const now = Date.now();
          if (now >= d.getTime() - off * 60000 && now <= d.getTime() + 3600000) {
            V.toast('日程提醒', s.title + ' ' + U.remindLabel(s.remind) + '提醒，别忘了准备。', 'warn');
          }
        }
      }
    });
  }

  // ---------- 登录 ----------
  let loginMode = 'login';

  function updateLoginTabs() {
    U.qsa('[data-login-tab]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-login-tab') === loginMode);
    });
    U.qs('#loginSubmitBtn').textContent = loginMode === 'login' ? '进入账本' : '创建账号';
    U.qs('#loginPassword').setAttribute('placeholder', loginMode === 'login' ? '输入密码' : '至少 4 位');
  }

  function showLogin() {
    U.qs('#app').classList.add('hidden');
    U.qs('#loginScreen').classList.remove('hidden');
    U.qs('#loginError').textContent = '';
  }

  function enterApp() {
    U.qs('#loginScreen').classList.add('hidden');
    U.qs('#app').classList.remove('hidden');
    updateUserChip();
    applySettings();
    // 每次进入都从干净状态开始，避免上个账号的视图状态残留
    V.periodType = 'month';
    V.periodAnchor = U.todayStr();
    V.chartType = 'expense';
    V.drill = null;
    V.drillSub = null;
    V.drillDetail = null;
    V.calMode = 'month';
    V.calAnchor = U.todayStr();
    V.calSelected = U.todayStr();
    V.calDetail = null;
    V.cardsSelected = null;
    V.goalsAnchor = U.todayStr();
    V.categoriesTab = 'expense';
    V.billsFilter = { type: 'all', payment: '', categoryId: '', cardId: '', from: '', to: '', q: '' };
    V.go('calendar');
    checkGoalAlerts();
    checkScheduleReminders();
  }

  function updateUserChip() {
    const name = S.currentUserName();
    U.qs('#sidebarUserName').textContent = name;
    U.qs('#sidebarAvatar').textContent = (name || '暖').charAt(0);
  }

  // ---------- 弹窗确认 ----------
  function confirmAction(title, msg, fn, yesLabel) {
    M.openConfirm(title, msg, function () { fn(); }, yesLabel);
  }

  // ---------- 保存处理 ----------
  function saveTx() {
    const f = V._txForm;
    if (!f) return;
    const amount = parseFloat(U.qs('#txAmount').value);
    if (!amount || amount <= 0) { V.toast('金额不对', '请输入大于 0 的金额', 'danger'); return; }
    const kind = f.type === 'income' ? 'income' : 'expense';
    let catId = f.catId;
    let subId = f.subId;
    const cats = S.categoriesByType(f.type);
    if (!catId || !cats.some(function (c) { return c.id === catId; })) catId = cats.length ? cats[0].id : null;
    const cat = S.categoryById(catId);
    if (cat && !(cat.subs || []).some(function (s) { return s.id === subId; })) subId = cat.subs.length ? cat.subs[0].id : null;
    if (!catId) { V.toast('缺分类', '请先创建对应的分类', 'danger'); return; }
    const sub = S.subById(catId, subId);
    const detailId = sub && (sub.children || []).some(function (d) { return d.id === f.detailId; }) ? f.detailId : null;
    const payload = {
      id: f.editing || U.uid('tx'),
      kind: kind,
      amount: U.round2(amount),
      categoryId: catId,
      subcategoryId: subId,
      detailId: detailId,
      cardId: U.qs('#txCard').value || null,
      paymentType: U.qs('#txPayment').value,
      date: U.qs('#txDate').value || U.todayStr(),
      time: U.qs('#txTime').value || '12:00',
      note: U.qs('#txNote').value.trim(),
      mood: f.mood,
      photo: f.photo,
      createdAt: f.editing ? (S.transactions.find(function (t) { return t.id === f.editing; }) || {}).createdAt || new Date().toISOString() : new Date().toISOString()
    };
    if (f.editing) {
      S.updateTransaction(payload);
      V.toast('改好了', '账单已更新', 'success');
    } else {
      S.addTransaction(payload);
      V.toast('记好了', (kind === 'income' ? '收入 ' : '支出 ') + U.moneyPlain(amount) + ' 已入账', 'success');
    }
    M.close();
    V.refresh();
  }

  function saveCardOp() {
    const f = V._cardOp;
    if (!f) return;
    const amount = parseFloat(U.qs('#opAmount').value);
    if (!amount || amount <= 0) { V.toast('金额不对', '请输入大于 0 的金额', 'danger'); return; }
    const card = S.cardById(f.cardId);
    if (!card) return;
    let catId = null, subId = null;
    if (f.op === 'expense' || f.op === 'income') {
      catId = f.catId;
      const cats = S.categoriesByType(f.op === 'income' ? 'income' : 'expense');
      if (!catId || !cats.some(function (c) { return c.id === catId; })) catId = cats.length ? cats[0].id : null;
      const cat = S.categoryById(catId);
      subId = cat && cat.subs.some(function (s) { return s.id === f.subId; }) ? f.subId : (cat && cat.subs.length ? cat.subs[0].id : null);
      const sub = S.subById(catId, subId);
      f.detailId = sub && (sub.children || []).some(function (d) { return d.id === f.detailId; }) ? f.detailId : null;
    }
    S.addTransaction({
      id: U.uid('tx'),
      kind: f.op,
      amount: U.round2(amount),
      categoryId: catId,
      subcategoryId: subId,
      detailId: f.detailId || null,
      cardId: f.cardId,
      paymentType: card.type === '现金' ? '现金' : '电子',
      date: U.qs('#opDate').value || U.todayStr(),
      time: U.qs('#opTime').value || '12:00',
      note: U.qs('#opNote').value.trim(),
      mood: null,
      photo: null,
      createdAt: new Date().toISOString()
    });
    const label = { recharge: '充值', withdraw: '提现', expense: '支出', income: '收入' }[f.op] || '操作';
    M.close();
    V.toast(card.name, label + ' ' + U.moneyPlain(amount) + ' 已记录', 'success');
    V.refresh();
  }

  function saveTransfer() {
    const from = U.qs('#trFrom').value;
    const to = U.qs('#trTo').value;
    const amount = parseFloat(U.qs('#trAmount').value);
    if (!from || !to || from === to) { V.toast('卡片选择不对', '转出和转入需要是不同卡片', 'danger'); return; }
    if (!amount || amount <= 0) { V.toast('金额不对', '请输入大于 0 的金额', 'danger'); return; }
    S.addTransfer({
      id: U.uid('tr'),
      fromCardId: from,
      toCardId: to,
      amount: U.round2(amount),
      date: U.qs('#trDate').value || U.todayStr(),
      time: U.qs('#trTime').value || '12:00',
      note: U.qs('#trNote').value.trim()
    });
    M.close();
    V.toast('转账成功', U.moneyPlain(amount) + ' 已从 ' + ((S.cardById(from) || {}).name || '') + ' 转到 ' + ((S.cardById(to) || {}).name || ''), 'success');
    V.refresh();
  }

  function saveSchedule() {
    const id = V._editScheduleId;
    const type = U.qs('#schType').value;
    const title = U.qs('#schTitle').value.trim();
    const date = U.qs('#schDate').value;
    if (!title) { V.toast('缺标题', '给日程起个名字吧', 'danger'); return; }
    if (!date) { V.toast('缺日期', '请选择日期', 'danger'); return; }
    const payload = {
      id: id || U.uid('sch'),
      title: title,
      type: type,
      date: date,
      time: U.qs('#schTime').value || '09:00',
      repeat: (function () {
        const v = U.qs('#schRepeat').value;
        if (v === 'custom') {
          const n = parseInt(U.qs('#schRepeatEvery').value, 10);
          const u = U.qs('#schRepeatUnit').value;
          return n > 0 ? 'every:' + n + ':' + u : 'none';
        }
        return v;
      })(),
      remind: (function () {
        const v = U.qs('#schRemind').value;
        if (v === 'custom') {
          const n = parseInt(U.qs('#schRemindValue').value, 10);
          const u = U.qs('#schRemindUnit').value;
          return n > 0 ? n + u : 'none';
        }
        return v;
      })(),
      note: U.qs('#schNote').value.trim(),
      amount: type === 'bill' ? (parseFloat(U.qs('#schAmount').value) || null) : null,
      categoryId: type === 'bill' ? (U.qs('#schCategory').value || null) : null,
      cardId: type === 'bill' ? (U.qs('#schCard').value || null) : null,
      done: id ? U.qs('#schDone').checked : false,
      createdAt: id ? ((S.schedules.find(function (s) { return s.id === id; }) || {}).createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (id) S.updateSchedule(payload);
    else S.addSchedule(payload);
    M.close();
    V.toast(id ? '日程已更新' : '日程已创建', title + ' · ' + U.formatCN(date), 'success');
    V.refresh();
  }

  function saveGoal() {
    const id = V._editGoalId;
    const name = U.qs('#goalName').value.trim();
    const amount = parseFloat(U.qs('#goalAmount').value);
    if (!name) { V.toast('缺名称', '给目标起个名字', 'danger'); return; }
    if (!amount || amount <= 0) { V.toast('金额不对', '请输入大于 0 的目标金额', 'danger'); return; }
    const thresholds = (V._goalThresholds || []).map(function (t) {
      return { percent: Math.max(1, Math.min(100, Number(t.percent) || 0)), message: String(t.message || ''), enabled: t.enabled !== false };
    }).filter(function (t) { return t.percent >= 1; });
    const payload = {
      id: id || U.uid('goal'),
      name: name,
      period: U.qs('#goalPeriod').value,
      amount: U.round2(amount),
      categoryId: U.qs('#goalCategory').value || null,
      thresholds: thresholds,
      active: true,
      createdAt: id ? ((S.goals.find(function (g) { return g.id === id; }) || {}).createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (id) S.updateGoal(payload);
    else S.addGoal(payload);
    M.close();
    V.toast('目标已' + (id ? '更新' : '创建'), name + ' · ' + U.moneyPlain(amount), 'success');
    V.refresh();
  }

  function saveCategory() {
    const catId = V._editCategoryId;
    const type = U.qs('#catType').value;
    const name = U.qs('#catName').value.trim();
    if (!name) { V.toast('缺名称', '请输入分类名称', 'danger'); return; }
    const color = U.qs('#catColor').value;
    const icon = U.qs('#catIcon').value.trim() || '📦';
    if (catId) {
      const cat = S.categoryById(catId);
      if (cat) {
        cat.name = name; cat.color = color; cat.icon = icon; cat.type = type;
        S.updateCategory(cat);
      }
    } else {
      S.addCategory({
        id: U.uid('c'), name: name, type: type, color: color, icon: icon, system: false,
        subs: [{ id: U.uid('sub'), name: '其他', color: mix(color, '#ffffff', 0.5) }]
      });
    }
    M.close();
    V.toast('分类已' + (catId ? '更新' : '创建'), name, 'success');
    V.refresh();
  }

  function saveSub() {
    const target = V._subTarget;
    if (!target) return;
    const name = U.qs('#subName').value.trim();
    if (!name) { V.toast('缺名称', '请输入小类名称', 'danger'); return; }
    const color = U.qs('#subColor').value;
    const cat = S.categoryById(target.catId);
    if (!cat) return;
    if (target.subId) {
      const sub = cat.subs.find(function (s) { return s.id === target.subId; });
      if (sub) { sub.name = name; sub.color = color; S.updateCategory(cat); }
    } else {
      cat.subs.push({ id: U.uid('sub'), name: name, color: color });
      S.updateCategory(cat);
    }
    M.close();
    V.toast('小类已' + (target.subId ? '更新' : '添加'), name, 'success');
    V.refresh();
  }

  function saveCard() {
    const id = V._editCardId;
    const name = U.qs('#cardName').value.trim();
    if (!name) { V.toast('缺名称', '请输入卡片名称', 'danger'); return; }
    const payload = {
      id: id || U.uid('card'),
      name: name,
      type: U.qs('#cardType').value,
      color: U.qs('#cardColor').value,
      initialBalance: parseFloat(U.qs('#cardInitial').value) || 0,
      note: U.qs('#cardNote').value.trim()
    };
    if (id) S.updateCard(payload);
    else S.addCard(payload);
    M.close();
    V.toast('卡片已' + (id ? '更新' : '添加'), name, 'success');
    V.refresh();
  }

  // ---------- 日历搜索 ----------
  function renderCalSearch(query) {
    const box = U.qs('#calSearchResults');
    if (!box) return;
    const q = String(query || '').trim().toLowerCase();
    if (!q) { box.innerHTML = ''; return; }
    const scheds = S.schedules.filter(function (s) {
      return (s.title + ' ' + (s.note || '')).toLowerCase().indexOf(q) !== -1;
    });
    const txs = S.transactions.filter(function (t) {
      const card = t.cardId ? (S.cardById(t.cardId) || {}).name || '' : '';
      return ((t.note || '') + S.catName(t.categoryId) + S.subName(t.categoryId, t.subcategoryId) + card).toLowerCase().indexOf(q) !== -1;
    });
    let html = '<div class="view-row grid-2" style="margin-top:10px">';
    html += '<div><h4 class="small" style="margin:6px 0">日程（' + scheds.length + '）</h4>' +
      (scheds.slice(0, 5).map(function (s) { return scheduleSearchRow(s); }).join('') || '<div class="muted small">无匹配日程</div>') + '</div>';
    html += '<div><h4 class="small" style="margin:6px 0">账单（' + txs.length + '）</h4>' +
      (txs.slice(0, 5).map(function (t) { return txSearchRow(t); }).join('') || '<div class="muted small">无匹配账单</div>') + '</div>';
    html += '</div>';
    box.innerHTML = html;
  }

  function scheduleSearchRow(s) {
    return '<button class="tx-row" type="button" style="width:100%;text-align:left" data-action="cal-day" data-date="' + s.date + '">' +
      '<div class="tx-emoji">' + U.icon('calendarPlus', 18) + '</div><div class="tx-info"><strong>' + U.escapeHtml(s.title) + '</strong><span>' + U.escapeHtml(U.formatCN(s.date, true)) + '</span></div>' +
      '<span class="pill accent">' + U.escapeHtml(({ reminder: '提醒', bill: '账单', birthday: '生日', anniversary: '纪念日' }[s.type] || '日程')) + '</span></button>';
  }
  function txSearchRow(t) {
    return '<button class="tx-row" type="button" style="width:100%;text-align:left" data-action="cal-day" data-date="' + t.date + '">' +
      '<div class="tx-emoji">' + U.escapeHtml(S.catIcon(t.categoryId)) + '</div><div class="tx-info"><strong>' + U.escapeHtml(t.note || S.subName(t.categoryId, t.subcategoryId)) + '</strong><span>' + U.escapeHtml(U.formatCN(t.date, true) + ' · ' + S.catName(t.categoryId)) + '</span></div>' +
      '<span class="tx-amount ' + (t.kind === 'expense' ? 'expense' : 'income') + '">' + (t.kind === 'expense' ? '-' : '+') + U.moneyPlain(t.amount) + '</span></button>';
  }

  // ---------- 全局点击委托 ----------
  document.addEventListener('click', function (e) {
    const nav = e.target.closest('[data-view]');
    if (nav) {
      const view = nav.getAttribute('data-view');
      if (view && V.currentView !== view) {
        V.go(view);
        const sidebar = U.qs('#sidebar');
        if (sidebar) sidebar.classList.remove('is-open');
      }
      return;
    }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    const val = function (key) { return el.getAttribute(key); };

    switch (action) {
      case 'close-modal': M.close(); break;

      case 'tx-type':
        V._txForm.type = val('data-type');
        V._txForm.catId = null; V._txForm.subId = null;
        V._txForm.subEdit = null; V._txForm.detailId = null; V._txForm.detailEdit = null;
        M.updateTxUi();
        break;
      case 'tx-cat':
        V._txForm.catId = val('data-cat-id');
        V._txForm.subId = null;
        V._txForm.subEdit = null; V._txForm.detailId = null; V._txForm.detailEdit = null;
        M.updateTxUi();
        break;
      case 'tx-sub':
        V._txForm.subId = val('data-sub-id');
        V._txForm.detailId = null; V._txForm.detailEdit = null;
        M.updateTxUi();
        break;
      case 'tx-detail':
        V._txForm.detailId = val('data-detail-id');
        M.updateTxUi();
        break;
      case 'tx-detail-add':
        V._txForm.detailEdit = { mode: 'add', detailId: null };
        M.renderDetailEditor();
        break;
      case 'tx-detail-edit': {
        const sub = S.subById(V._txForm.catId, V._txForm.subId);
        const cur = sub && (sub.children || []).find(function (d) { return d.id === V._txForm.detailId; });
        V._txForm.detailEdit = { mode: 'edit', detailId: cur ? cur.id : null };
        M.renderDetailEditor();
        break;
      }
      case 'tx-detail-save': {
        const f = V._txForm;
        const sub = S.subById(f.catId, f.subId);
        if (!sub || !f.detailEdit) break;
        const name = U.qs('#detailEditName').value.trim();
        if (!name) { V.toast('缺名称', '请输入细分类名称', 'danger'); break; }
        const color = U.qs('#detailEditColor').value;
        if (!Array.isArray(sub.children)) sub.children = [];
        if (f.detailEdit.mode === 'edit' && f.detailEdit.detailId) {
          const d = sub.children.find(function (x) { return x.id === f.detailEdit.detailId; });
          if (d) { d.name = name; d.color = color; }
        } else {
          const nd = { id: U.uid('detail'), name: name, color: color };
          sub.children.push(nd);
          f.detailId = nd.id;
        }
        const cat = S.categoryById(f.catId);
        if (cat) S.updateCategory(cat);
        f.detailEdit = null;
        M.updateTxUi();
        V.toast('细分类已保存', name, 'success');
        break;
      }
      case 'tx-detail-cancel':
        V._txForm.detailEdit = null;
        M.updateTxUi();
        break;
      case 'tx-detail-delete':
        confirmAction('删除细分类', '删除后不影响已有账单，确定删除这个细分类吗？', function () {
          const f = V._txForm;
          const sub = S.subById(f.catId, f.subId);
          const cat = S.categoryById(f.catId);
          if (sub && cat) {
            sub.children = (sub.children || []).filter(function (d) { return d.id !== f.detailEdit.detailId; });
            S.updateCategory(cat);
            f.detailId = null;
            f.detailEdit = null;
            M.updateTxUi();
            V.toast('已删除', '细分类已移除', 'success');
          }
        });
        break;
      case 'tx-sub-add':
        V._txForm.subEdit = { mode: 'add', subId: null };
        M.renderSubEditor();
        break;
      case 'tx-sub-edit': {
        const cat = S.categoryById(V._txForm.catId);
        const cur = cat && cat.subs.find(function (s) { return s.id === V._txForm.subId; });
        V._txForm.subEdit = { mode: 'edit', subId: cur ? cur.id : null };
        M.renderSubEditor();
        break;
      }
      case 'tx-sub-save': {
        const f = V._txForm;
        const cat = S.categoryById(f.catId);
        if (!cat || !f.subEdit) break;
        const name = U.qs('#subEditName').value.trim();
        if (!name) { V.toast('缺名称', '请输入小类名称', 'danger'); break; }
        const color = U.qs('#subEditColor').value;
        if (f.subEdit.mode === 'edit' && f.subEdit.subId) {
          const sub = cat.subs.find(function (s) { return s.id === f.subEdit.subId; });
          if (sub) { sub.name = name; sub.color = color; }
        } else {
          const ns = { id: U.uid('sub'), name: name, color: color };
          cat.subs.push(ns);
          f.subId = ns.id;
        }
        S.updateCategory(cat);
        f.subEdit = null;
        M.updateTxUi();
        V.toast('小类已保存', name, 'success');
        break;
      }
      case 'tx-sub-cancel':
        V._txForm.subEdit = null;
        M.updateTxUi();
        break;
      case 'tx-sub-delete':
        confirmAction('删除小类', '删除后不影响已有账单，确定删除这个小类吗？', function () {
          const f = V._txForm;
          const cat = S.categoryById(f.catId);
          if (cat) {
            cat.subs = cat.subs.filter(function (s) { return s.id !== f.subEdit.subId; });
            Store.state.transactions = Store.state.transactions.map(function (t) {
              if (t.subcategoryId === f.subEdit.subId) t.detailId = null;
              return t;
            });
            S.updateCategory(cat);
            f.subId = null;
            f.subEdit = null;
            f.detailId = null;
            M.updateTxUi();
            V.toast('已删除', '小类已移除', 'success');
          }
        });
        break;
      case 'tx-mood':
        V._txForm.mood = V._txForm.mood === val('data-mood') ? null : val('data-mood');
        U.qsa('#txMoods .mood-btn').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-mood') === V._txForm.mood); });
        break;
      case 'tx-remove-photo':
        V._txForm.photo = null;
        M.updatePhotoPreview();
        break;
      case 'save-tx': saveTx(); break;
      case 'edit-tx': {
        const tx = S.transactions.find(function (t) { return t.id === val('data-id'); });
        if (tx) M.openAddTx(tx);
        break;
      }
      case 'delete-tx':
        confirmAction('删除账单', '确定删除这笔账单吗？卡片余额会随之变化。', function () {
          S.deleteTransaction(val('data-id'));
          V.toast('已删除', '账单已经移除', 'success');
          V.refresh();
        });
        break;

      case 'cardop-cat':
        V._cardOp.catId = val('data-cat-id');
        V._cardOp.subId = null;
        V._cardOp.detailId = null;
        M.updateCardOpUi();
        break;
      case 'cardop-sub':
        V._cardOp.subId = val('data-sub-id');
        V._cardOp.detailId = null;
        M.updateCardOpUi();
        break;
      case 'cardop-detail':
        V._cardOp.detailId = val('data-detail-id');
        M.updateCardOpUi();
        break;
      case 'save-card-op': saveCardOp(); break;

      case 'save-transfer': saveTransfer(); break;

      case 'add-schedule':
        V._editScheduleId = null;
        M.openSchedule(null, val('data-date') || U.todayStr());
        break;
      case 'edit-schedule': {
        const sch = S.schedules.find(function (s) { return s.id === val('data-id'); });
        if (sch) { V._editScheduleId = sch.id; M.openSchedule(sch); }
        break;
      }
      case 'delete-schedule':
        confirmAction('删除日程', '确定删除这个日程吗？', function () {
          S.deleteSchedule(val('data-id'));
          V.toast('已删除', '日程已经移除', 'success');
          V.refresh();
        });
        break;
      case 'save-schedule': saveSchedule(); break;

      case 'add-goal':
        V._editGoalId = null;
        M.openGoal(null);
        break;
      case 'edit-goal': {
        const g = S.goals.find(function (x) { return x.id === val('data-id'); });
        if (g) { V._editGoalId = g.id; M.openGoal(g); }
        break;
      }
      case 'delete-goal':
        confirmAction('删除目标', '确定删除这个支出目标吗？', function () {
          S.deleteGoal(val('data-id'));
          V.toast('已删除', '目标已经移除', 'success');
          V.refresh();
        });
        break;
      case 'save-goal': saveGoal(); break;
      case 'goal-add-threshold':
        V._goalThresholds.push({ percent: 90, message: '90% 警报！该收手啦。', enabled: true });
        M.updateGoalThresholds();
        break;
      case 'goal-remove-threshold': {
        const idx = parseInt(val('data-idx'), 10);
        if (!isNaN(idx)) { V._goalThresholds.splice(idx, 1); M.updateGoalThresholds(); }
        break;
      }
      case 'goal-th-example': {
        const idx = parseInt(val('data-idx'), 10);
        if (V._goalThresholds && !isNaN(idx) && V._goalThresholds[idx]) {
          V._goalThresholds[idx].message = val('data-msg');
          M.updateGoalThresholds();
        }
        break;
      }

      case 'add-category':
        V._editCategoryId = null;
        M.openCategory(null, val('data-type') || 'expense');
        break;
      case 'edit-category': {
        const c = S.categoryById(val('data-id'));
        if (c) { V._editCategoryId = c.id; M.openCategory(c); }
        break;
      }
      case 'delete-category':
        confirmAction('删除大类', '该大类下的账单会移到其他分类，确定删除吗？', function () {
          S.deleteCategory(val('data-id'));
          V.toast('已删除', '分类已经移除', 'success');
          V.refresh();
        });
        break;
      case 'save-category': saveCategory(); break;

      case 'add-sub':
        V._subTarget = null;
        M.openSub(val('data-cat-id'), null);
        break;
      case 'edit-sub': {
        const cat = S.categoryById(val('data-cat-id'));
        const sub = cat && cat.subs.find(function (s) { return s.id === val('data-sub-id'); });
        if (sub) M.openSub(cat.id, sub);
        break;
      }
      case 'delete-sub':
        confirmAction('删除小类', '删除后不会影响已有账单，确定删除这个小类吗？', function () {
          const catId = val('data-cat-id');
          const subId = val('data-sub-id');
          const cat = S.categoryById(catId);
          if (cat) {
            cat.subs = cat.subs.filter(function (s) { return s.id !== subId; });
            Store.state.transactions = Store.state.transactions.map(function (t) {
              if (t.subcategoryId === subId) t.detailId = null;
              return t;
            });
            S.updateCategory(cat);
            V.toast('已删除', '小类已经移除', 'success');
            V.refresh();
          }
        });
        break;
      case 'save-sub': saveSub(); break;

      case 'add-detail':
        V._detailTarget = null;
        M.openDetail(val('data-cat-id'), val('data-sub-id'), null);
        break;
      case 'edit-detail': {
        const cat = S.categoryById(val('data-cat-id'));
        const sub = cat && cat.subs.find(function (s) { return s.id === val('data-sub-id'); });
        const detail = sub && (sub.children || []).find(function (d) { return d.id === val('data-detail-id'); });
        if (detail) M.openDetail(cat.id, sub.id, detail);
        break;
      }
      case 'delete-detail':
        confirmAction('删除细分类', '删除后不会影响已有账单，确定删除这个细分类吗？', function () {
          const catId = val('data-cat-id');
          const subId = val('data-sub-id');
          const detailId = val('data-detail-id');
          const cat = S.categoryById(catId);
          const sub = cat && cat.subs.find(function (s) { return s.id === subId; });
          if (cat && sub) {
            sub.children = (sub.children || []).filter(function (d) { return d.id !== detailId; });
            Store.state.transactions = Store.state.transactions.map(function (t) {
              if (t.detailId === detailId) t.detailId = null;
              return t;
            });
            S.updateCategory(cat);
            V.toast('已删除', '细分类已经移除', 'success');
            V.refresh();
          }
        });
        break;
      case 'save-detail': {
        const target = V._detailTarget;
        if (!target) break;
        const name = U.qs('#detailName').value.trim();
        if (!name) { V.toast('缺名称', '请输入细分类名称', 'danger'); break; }
        const color = U.qs('#detailColor').value;
        const cat = S.categoryById(target.catId);
        const sub = cat && cat.subs.find(function (s) { return s.id === target.subId; });
        if (!cat || !sub) break;
        if (!Array.isArray(sub.children)) sub.children = [];
        if (target.detailId) {
          const d = sub.children.find(function (x) { return x.id === target.detailId; });
          if (d) { d.name = name; d.color = color; }
        } else {
          sub.children.push({ id: U.uid('detail'), name: name, color: color });
        }
        S.updateCategory(cat);
        M.close();
        V.toast('细分类已' + (target.detailId ? '更新' : '添加'), name, 'success');
        V.refresh();
        break;
      }

      case 'add-card':
        V._editCardId = null;
        M.openCard(null);
        break;
      case 'edit-card': {
        const card = S.cardById(val('data-card-id'));
        if (card) { V._editCardId = card.id; M.openCard(card); }
        break;
      }
      case 'save-card': saveCard(); break;
      case 'delete-card':
        confirmAction('删除卡片', '卡片的流水仍会保留，但不再关联这张卡。确定删除吗？', function () {
          S.deleteCard(val('data-id'));
          V.cardsSelected = null;
          V.toast('已删除', '卡片已经移除', 'success');
          V.refresh();
        });
        break;
      case 'card-select':
        V.cardsSelected = val('data-card-id');
        V.renderCards();
        break;
      case 'card-op':
        M.openCardOp(val('data-card-id'), val('data-op'));
        break;
      case 'open-transfer':
        M.openTransfer(val('data-card-id'));
        break;
      case 'ledger-delete':
        confirmAction('删除流水', '确定删除这条流水吗？卡片余额会随之变化。', function () {
          if (val('data-kind') === 'transfer') S.deleteTransfer(val('data-id'));
          else S.deleteTransaction(val('data-id'));
          V.toast('已删除', '流水已经移除', 'success');
          V.refresh();
        });
        break;

      case 'save-profile': {
        S.updateProfileName(U.qs('#profileName').value).then(function (res) {
          if (!res.ok) { V.toast('保存失败', res.msg, 'danger'); return; }
          updateUserChip();
          V.toast('已保存', '显示名称已更新', 'success');
          V.renderSettings();
        });
        break;
      }
      case 'save-password': {
        S.changePassword(U.qs('#oldPass').value, U.qs('#newPass').value).then(function (res) {
          V.toast(res.ok ? '密码已修改' : '修改失败', res.msg, res.ok ? 'success' : 'danger');
          if (res.ok) { U.qs('#oldPass').value = ''; U.qs('#newPass').value = ''; }
        });
        break;
      }

      case 'export-data':
        U.download('暖账本备份-' + U.todayStr() + '.json', S.exportData());
        V.toast('已导出', '备份文件已下载', 'success');
        break;
      case 'import-data': {
        const input = U.qs('#importFileInput');
        if (input) input.click();
        break;
      }
      case 'reset-data':
        confirmAction('重置数据', '当前账号的账单、卡片流水和日程会被清空，从 0 开始记账。确定继续吗？', function () {
          S.resetData();
          applySettings();
          V.toast('已重置', '账本已清空，从 0 开始', 'success');
          V.refresh();
        });
        break;
      case 'load-demo':
        confirmAction('载入演示数据', '会覆盖当前账号的账单数据并填充示例内容，确定继续吗？', function () {
          S.loadDemoData();
          applySettings();
          V.toast('已载入', '演示数据已填充', 'success');
          V.refresh();
        });
        break;
      case 'delete-account':
        confirmAction('删除账号', '这个操作无法撤销，账号和全部数据都会被删除。确定继续吗？', function () {
          S.deleteAccount();
          showLogin();
        }, '删除账号');
        break;
      case 'logout':
        S.logout();
        showLogin();
        break;

      case 'set-theme': {
        const key = val('data-theme');
        const t = THEMES[key];
        if (!t) break;
        S.updateSettings({ theme: key, primary: t.primary, accent: t.accent });
        applySettings();
        V.renderSettings();
        V.toast('主题已切换', t.name, 'success');
        break;
      }
      case 'custom-color': {
        S.updateSettings({ theme: 'custom', [val('data-key')]: el.value });
        applySettings();
        break;
      }
      case 'bg-mode':
        S.updateSettings({ backgroundMode: val('data-mode') });
        applySettings();
        V.renderSettings();
        break;
      case 'bg-color':
        S.updateSettings({ backgroundMode: 'color', backgroundValue: el.value });
        applySettings();
        break;
      case 'bg-gradient':
        S.updateSettings({ backgroundMode: 'gradient', backgroundValue: val('data-value') });
        applySettings();
        V.renderSettings();
        break;
      case 'bg-image': {
        const input = U.qs('#bgImageInput');
        if (input) input.click();
        break;
      }
      case 'bg-remove':
        S.updateSettings({ backgroundMode: 'color', backgroundValue: '' });
        applySettings();
        V.renderSettings();
        break;
      case 'bg-default':
        S.updateSettings({ backgroundMode: 'color', backgroundValue: '', theme: 'orange', primary: THEMES.orange.primary, accent: THEMES.orange.accent });
        applySettings();
        V.renderSettings();
        break;

      case 'bills-filter': {
        const dv = val('data-value');
        // 下拉框和日期输入框只走 change 事件，避免点开原生菜单时页面被重绘
        if (dv === null || dv === undefined) break;
        V.billsFilter[val('data-key')] = dv;
        V.renderBills();
        break;
      }

      case 'overview-period':
        V.periodType = val('data-type');
        V.drill = null;
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'overview-prev':
        V.periodAnchor = V.periodType === 'month' ? U.monthAdd(V.periodAnchor, -1) : U.dateAdd(V.periodAnchor, V.periodType === 'week' ? -7 : -1);
        V.drill = null;
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'overview-next':
        V.periodAnchor = V.periodType === 'month' ? U.monthAdd(V.periodAnchor, 1) : U.dateAdd(V.periodAnchor, V.periodType === 'week' ? 7 : 1);
        V.drill = null;
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'overview-today':
        V.periodAnchor = U.todayStr();
        V.drill = null;
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'chart-toggle':
        V.chartType = val('data-type');
        V.drill = null;
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'drill-select':
        V.drill = val('data-key') || val('data-cat-id');
        V.drillSub = null;
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'drill-sub':
        V.drillSub = val('data-key');
        V.drillDetail = null;
        V.renderOverview();
        break;
      case 'drill-detail':
        V.drillDetail = val('data-key');
        V.renderOverview();
        break;
      case 'drill-back':
        if (V.drillDetail) V.drillDetail = null;
        else if (V.drillSub) V.drillSub = null;
        else V.drill = null;
        V.renderOverview();
        break;
      case 'period-jump': {
        const idx = parseInt(val('data-index'), 10);
        const anchors = V._barAnchors;
        if (anchors && !isNaN(idx) && anchors[idx]) {
          V.periodAnchor = anchors[idx];
          let lbl;
          if (V.periodType === 'month') lbl = U.monthLabel(anchors[idx]);
          else if (V.periodType === 'week') lbl = U.formatCN(U.startOfWeek(anchors[idx])) + ' 起';
          else lbl = U.formatCN(anchors[idx], true);
          V.toast('已切换周期', lbl, 'accent');
          V.renderOverview();
        }
        break;
      }

      case 'cal-mode':
        V.calMode = val('data-mode');
        V.calDetail = null;
        V.renderCalendar();
        break;
      case 'cal-prev':
        if (V.calMode === 'month') V.calAnchor = U.monthAdd(V.calAnchor, -1);
        else if (V.calMode === 'year') V.calAnchor = U.yearAdd(V.calAnchor, -1);
        else if (V.calMode === 'week') V.calAnchor = U.dateAdd(V.calAnchor, -7);
        else V.calAnchor = U.dateAdd(V.calAnchor, -1);
        V.calDetail = null;
        V.renderCalendar();
        break;
      case 'cal-next':
        if (V.calMode === 'month') V.calAnchor = U.monthAdd(V.calAnchor, 1);
        else if (V.calMode === 'year') V.calAnchor = U.yearAdd(V.calAnchor, 1);
        else if (V.calMode === 'week') V.calAnchor = U.dateAdd(V.calAnchor, 7);
        else V.calAnchor = U.dateAdd(V.calAnchor, 1);
        V.calDetail = null;
        V.renderCalendar();
        break;
      case 'cal-today':
        V.calAnchor = U.todayStr();
        V.calSelected = U.todayStr();
        V.calDetail = null;
        V.renderCalendar();
        break;
      case 'cal-day': {
        const date = val('data-date');
        if (!date) break;
        V.calSelected = date;
        V.calDetail = null;
        if (V.calMode === 'month' && !U.sameMonth(date, V.calAnchor)) {
          V.calAnchor = U.startOfMonth(date);
        }
        if (V.calMode === 'week' && (date < U.startOfWeek(V.calAnchor) || date > U.dateAdd(U.startOfWeek(V.calAnchor), 6))) {
          V.calAnchor = date;
        }
        if (V.calMode === 'day' || V.calMode === 'year') {
          V.calMode = 'month';
          V.calAnchor = U.startOfMonth(date);
        }
        V.renderCalendar();
        break;
      }
      case 'cal-detail':
        V.calDetail = { kind: val('data-kind'), id: val('data-id') };
        V.renderCalendar();
        break;

      case 'goal-prev':
        V.goalsAnchor = U.dateAdd(V.goalsAnchor, -1);
        V.renderGoals();
        break;
      case 'goal-next':
        V.goalsAnchor = U.dateAdd(V.goalsAnchor, 1);
        V.renderGoals();
        break;
      case 'goal-today':
        V.goalsAnchor = U.todayStr();
        V.renderGoals();
        break;

      case 'categories-tab':
        V.categoriesTab = val('data-type');
        V.renderCategories();
        break;

      case 'confirm-yes': {
        const cb = V._confirmCb;
        V._confirmCb = null;
        M.close();
        if (typeof cb === 'function') cb();
        break;
      }
    }
  });

  // ---------- 输入/变更委托 ----------
  document.addEventListener('input', function (e) {
    const target = e.target;
    if (target.id === 'billsSearch') {
      V.billsFilter.q = target.value;
      V.renderBillsList();
      return;
    }
    if (target.id === 'calSearch') {
      renderCalSearch(target.value);
      return;
    }
    if (target.id === 'profileName') {
      const hint = U.qs('#profileNameHint');
      if (hint) {
        const v = target.value.trim();
        const taken = v && S.users.some(function (u) { return u.id !== S.currentUserId && u.name.toLowerCase() === v.toLowerCase(); });
        hint.textContent = !v ? '名称不能为空' : taken ? '该名称已被使用，请换一个' : '名称可用，保存后生效';
        hint.style.color = (!v || taken) ? 'var(--danger)' : 'var(--success)';
      }
      return;
    }
    if (target.getAttribute('data-action') === 'custom-color') {
      S.updateSettings({ theme: 'custom', [target.getAttribute('data-key')]: target.value });
      applySettings();
      return;
    }
    if (target.getAttribute('data-action') === 'bg-color') {
      S.updateSettings({ backgroundMode: 'color', backgroundValue: target.value });
      applySettings();
      return;
    }
    const th = target.closest('[data-th-idx]');
    if (th && V._goalThresholds) {
      const idx = parseInt(th.getAttribute('data-th-idx'), 10);
      const t = V._goalThresholds[idx];
      if (!t) return;
      if (th.type === 'checkbox') t.enabled = th.checked;
      else if (th.type === 'number') t.percent = parseFloat(th.value) || 0;
      else t.message = th.value;
    }
  });

  document.addEventListener('change', function (e) {
    const target = e.target;
    if (target.id === 'bgImageInput') {
      const file = target.files && target.files[0];
      if (!file) return;
      U.compressImage(file, 1600, 0.8).then(function (dataUrl) {
        S.updateSettings({ backgroundMode: 'image', backgroundValue: dataUrl });
        applySettings();
        V.renderSettings();
        V.toast('背景已更换', '新的背景图已经应用', 'success');
      }).catch(function () { V.toast('图片读取失败', '换一张试试', 'danger'); });
      return;
    }
    if (target.id === 'importFileInput') {
      const file = target.files && target.files[0];
      if (!file) return;
      U.readTextFile(file).then(function (text) {
        const res = S.importData(text);
        if (res.ok) {
          applySettings();
          V.toast('导入成功', '账本数据已恢复', 'success');
          V.refresh();
        } else {
          V.toast('导入失败', res.msg, 'danger');
        }
      });
      return;
    }
    const filterEl = target.closest('[data-action="bills-filter"]');
    if (filterEl) {
      V.billsFilter[filterEl.getAttribute('data-key')] = target.value;
      V.renderBillsList();
      return;
    }
    const toggle = target.closest('[data-action="toggle-setting"]');
    if (toggle) {
      S.updateSettings({ [toggle.getAttribute('data-key')]: target.checked });
      return;
    }
  });

  // ---------- 登录与入口 ----------
  U.qsa('[data-login-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      loginMode = b.getAttribute('data-login-tab');
      updateLoginTabs();
      U.qs('#loginError').textContent = '';
    });
  });

  U.qs('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = U.qs('#loginName').value.trim();
    const pass = U.qs('#loginPassword').value;
    U.qs('#loginSubmitBtn').disabled = true;
    U.qs('#loginSubmitBtn').textContent = '请稍候…';
    (loginMode === 'login' ? S.login(name, pass) : S.register(name, pass)).then(function (res) {
      U.qs('#loginSubmitBtn').disabled = false;
      updateLoginTabs();
      if (res.ok) {
        U.qs('#loginError').textContent = '';
        U.qs('#loginName').value = '';
        U.qs('#loginPassword').value = '';
        enterApp();
      } else {
        U.qs('#loginError').textContent = res.msg;
      }
    });
  });

  U.qs('#guestBtn').addEventListener('click', function () {
    const res = S.loginGuest();
    if (res.ok) enterApp();
  });

  U.qs('#quickAddBtn').addEventListener('click', function () {
    M.openAddTx(null);
  });

  U.qs('#mobileMenuBtn').addEventListener('click', function () {
    U.qs('#sidebar').classList.add('is-open');
  });
  U.qs('#sidebarCloseBtn').addEventListener('click', function () {
    U.qs('#sidebar').classList.remove('is-open');
  });
  U.qs('#logoutBtn').addEventListener('click', function () {
    S.logout();
    showLogin();
  });

  // ---------- 启动 ----------
  async function boot() {
    S.init();
    V.init();
    updateLoginTabs();
    if (S.currentUserId) {
      enterApp();
    } else if (window.location.hash === '#demo') {
      S.loginGuest();
      enterApp();
    }
    else showLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
