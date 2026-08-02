(function () {
  'use strict';
  const U = window.Utils;

  const LS_USERS = 'ledger_users_v1';
  const LS_SESSION = 'ledger_session_v1';
  const LS_PREFIX = 'ledger_data_';

  const DEFAULT_CATEGORIES = [
    { id: 'c-food', name: '饮食', type: 'expense', color: '#f97316', icon: '🍜', system: true,
      subs: [
        { id: 'c-food-1', name: '三餐', color: '#fdba74' },
        { id: 'c-food-2', name: '零食饮料', color: '#fbbf24' },
        { id: 'c-food-3', name: '聚餐', color: '#fb7185' }
      ] },
    { id: 'c-education', name: '教育', type: 'expense', color: '#0ea5e9', icon: '📚', system: true,
      subs: [
        { id: 'c-education-1', name: '学费', color: '#38bdf8' },
        { id: 'c-education-2', name: '住宿费', color: '#60a5fa' },
        { id: 'c-education-3', name: '书籍文具', color: '#a5b4fc' },
        { id: 'c-education-4', name: '课程培训', color: '#818cf8' }
      ] },
    { id: 'c-transport', name: '交通', type: 'expense', color: '#22c55e', icon: '🚌', system: true,
      subs: [
        { id: 'c-transport-1', name: '公交地铁', color: '#4ade80' },
        { id: 'c-transport-2', name: '打车', color: '#a3e635' },
        { id: 'c-transport-3', name: '加油停车', color: '#84cc16' },
        { id: 'c-transport-4', name: '飞机火车', color: '#65a30d' }
      ] },
    { id: 'c-entertainment', name: '娱乐', type: 'expense', color: '#a855f7', icon: '🎮', system: true,
      subs: [
        { id: 'c-entertainment-1', name: '电影演出', color: '#c084fc' },
        { id: 'c-entertainment-2', name: '游戏', color: '#d946ef' },
        { id: 'c-entertainment-3', name: '旅行', color: '#e879f9' },
        { id: 'c-entertainment-4', name: '运动', color: '#f0abfc' }
      ] },
    { id: 'c-shopping', name: '购物', type: 'expense', color: '#ec4899', icon: '🛍️', system: true,
      subs: [
        { id: 'c-shopping-1', name: '日用百货', color: '#f472b6' },
        { id: 'c-shopping-2', name: '服装', color: '#fb7185' },
        { id: 'c-shopping-3', name: '数码', color: '#f43f5e' },
        { id: 'c-shopping-4', name: '礼物', color: '#fda4af' }
      ] },
    { id: 'c-health', name: '医疗健康', type: 'expense', color: '#14b8a6', icon: '💊', system: true,
      subs: [
        { id: 'c-health-1', name: '药品', color: '#2dd4bf' },
        { id: 'c-health-2', name: '就诊', color: '#5eead4' },
        { id: 'c-health-3', name: '体检', color: '#99f6e4' },
        { id: 'c-health-4', name: '健身', color: '#0d9488' }
      ] },
    { id: 'c-housing', name: '居住', type: 'expense', color: '#6366f1', icon: '🏠', system: true,
      subs: [
        { id: 'c-housing-1', name: '房租', color: '#818cf8' },
        { id: 'c-housing-2', name: '水电燃气', color: '#93c5fd' },
        { id: 'c-housing-3', name: '物业', color: '#a5b4fc' },
        { id: 'c-housing-4', name: '家居', color: '#c7d2fe' }
      ] },
    { id: 'c-other', name: '其他', type: 'expense', color: '#94a3b8', icon: '📦', system: true,
      subs: [{ id: 'c-other-1', name: '其他', color: '#cbd5e1' }] }
  ];

  const DEFAULT_INCOME_CATEGORIES = [
    { id: 'ci-salary', name: '工资', type: 'income', color: '#0d9488', icon: '💰', system: true, subs: [{ id: 'ci-salary-1', name: '月薪', color: '#14b8a6' }] },
    { id: 'ci-part', name: '兼职', type: 'income', color: '#f59e0b', icon: '💼', system: true, subs: [{ id: 'ci-part-1', name: '兼职', color: '#fbbf24' }] },
    { id: 'ci-invest', name: '理财', type: 'income', color: '#10b981', icon: '📈', system: true, subs: [{ id: 'ci-invest-1', name: '利息', color: '#34d399' }] },
    { id: 'ci-redpacket', name: '红包', type: 'income', color: '#ef4444', icon: '🧧', system: true, subs: [{ id: 'ci-redpacket-1', name: '红包', color: '#f87171' }] },
    { id: 'ci-other', name: '其他收入', type: 'income', color: '#64748b', icon: '✨', system: true, subs: [{ id: 'ci-other-1', name: '其他', color: '#94a3b8' }] }
  ];

  const DEFAULT_SETTINGS = {
    theme: 'orange',
    primary: '#f26b1d',
    accent: '#0e8f8a',
    backgroundMode: 'color',
    backgroundValue: '',
    holidayReminders: true,
    playfulReminders: true,
    showToasts: true,
    enterToSubmit: true,
    defaultCardId: '',
    currencySymbol: '¥'
  };

  function hashPassword(pw) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    const s = 'warm.ledger::' + pw;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function emptyState() {
    const s = {
      version: 1,
      profile: { name: '', createdAt: new Date().toISOString() },
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES.concat(DEFAULT_INCOME_CATEGORIES))),
      cards: [],
      transactions: [],
      transfers: [],
      goals: [],
      schedules: [],
      alertLog: []
    };
    ensureChildren(s.categories);
    return s;
  }

  function ensureChildren(categories) {
    (categories || []).forEach(function (c) {
      (c.subs || []).forEach(function (sub) {
        if (!Array.isArray(sub.children)) sub.children = [];
      });
    });
    return categories;
  }

  function normalizeState(data) {
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.categories) || data.categories.length === 0) return null;
    data.version = 1;
    data.profile = data.profile || { name: '', createdAt: new Date().toISOString() };
    data.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
    if (!Array.isArray(data.cards)) data.cards = [];
    if (!Array.isArray(data.transactions)) data.transactions = [];
    if (!Array.isArray(data.transfers)) data.transfers = [];
    if (!Array.isArray(data.goals)) data.goals = [];
    if (!Array.isArray(data.schedules)) data.schedules = [];
    if (!Array.isArray(data.alertLog)) data.alertLog = [];
    ensureChildren(data.categories);
    return data;
  }

  function seedDemoData(profileName) {
    const s = emptyState();
    s.seeded = true;
    s.profile.name = profileName || '体验用户';
    const today = new Date();
    const todayStr = U.fmtDate(today);
    const rand = mulberry32(20260801);
    const pick = function (arr) { return arr[Math.floor(rand() * arr.length)]; };
    const catExp = s.categories.filter(function (c) { return c.type === 'expense'; });
    const catInc = s.categories.filter(function (c) { return c.type === 'income'; });

    // 四张演示卡片
    const cards = [
      { id: 'card-ccb', name: '建设银行储蓄卡', type: '电子', color: '#1d4ed8', initialBalance: 1700, note: '生活主卡' },
      { id: 'card-wechat', name: '微信钱包', type: '电子', color: '#16a34a', initialBalance: 0, note: '日常小额' },
      { id: 'card-alipay', name: '支付宝钱包', type: '电子', color: '#0284c7', initialBalance: 0, note: '网购常用' },
      { id: 'card-campus', name: '校园卡', type: '电子', color: '#7c3aed', initialBalance: 0, note: '食堂/校内' }
    ];
    s.cards = cards;

    const firstDay = today.getFullYear() + '-' + U.pad2(today.getMonth() + 1) + '-01';
    // 卡间关系：建行 → 微信 / 支付宝
    s.transfers = [
      { id: 'tr-1', fromCardId: 'card-ccb', toCardId: 'card-wechat', amount: 200, date: firstDay, time: '09:00', note: '零花钱' },
      { id: 'tr-2', fromCardId: 'card-ccb', toCardId: 'card-alipay', amount: 100, date: firstDay, time: '09:05', note: '网购备用' }
    ];

    const tx = [];
    // 校园卡：充值 500，教育 200，娱乐 100（演示“实际支出”）
    tx.push({
      id: 'tx-campus-1', kind: 'recharge', amount: 500, categoryId: 'c-other', subcategoryId: 'c-other-1',
      cardId: 'card-campus', paymentType: '电子', date: firstDay, time: '08:30', note: '校园卡充值',
      mood: '😊', photo: null, createdAt: new Date().toISOString()
    });
    tx.push({
      id: 'tx-campus-2', kind: 'expense', amount: 200, categoryId: 'c-education', subcategoryId: 'c-education-1',
      cardId: 'card-campus', paymentType: '电子', date: todayStr, time: '10:20', note: '教材费用',
      mood: '😊', photo: null, createdAt: new Date().toISOString()
    });
    tx.push({
      id: 'tx-campus-3', kind: 'expense', amount: 100, categoryId: 'c-entertainment', subcategoryId: 'c-entertainment-2',
      cardId: 'card-campus', paymentType: '电子', date: todayStr, time: '19:40', note: '游戏周边',
      mood: '😐', photo: null, createdAt: new Date().toISOString()
    });

    // 最近 3 个月流水
    for (let m = -2; m <= 0; m++) {
      const base = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const days = U.daysInMonth(base.getFullYear(), base.getMonth() + 1);
      const monthKey = base.getFullYear() + '-' + U.pad2(base.getMonth() + 1);
      const isCurrent = m === 0;
      for (let d = 1; d <= days; d++) {
        if (d > 28 && !isCurrent) break;
        if (isCurrent && d > today.getDate()) break;
        const date = monthKey + '-' + U.pad2(d);
        const r = rand();
        if (r < 0.62) {
          const cat = pick(catExp.slice(0, 7));
          const sub = pick(cat.subs);
          const amount = Math.round((cat.id === 'c-food' ? 8 + rand() * 42 : cat.id === 'c-housing' ? 200 + rand() * 300 : cat.id === 'c-education' ? 30 + rand() * 180 : 15 + rand() * 120) * 100) / 100;
          const cardPick = rand();
          const cardId = cardPick < 0.3 ? 'card-wechat' : cardPick < 0.55 ? 'card-alipay' : cardPick < 0.8 ? 'card-ccb' : 'card-campus';
          tx.push({
            id: U.uid('tx'), kind: 'expense', amount: amount, categoryId: cat.id, subcategoryId: sub.id,
            cardId: cardId, paymentType: cardId === 'card-ccb' ? '电子' : '电子', date: date,
            time: U.pad2(8 + Math.floor(rand() * 13)) + ':' + U.pad2(Math.floor(rand() * 60)),
            note: pick(['', '日常开销', '今天有点开心', '买了小东西', '地铁通勤']),
            mood: pick(['😊', '😐', '😌', '😢', null]), photo: null, createdAt: new Date().toISOString()
          });
        } else if (r > 0.965) {
          const cat = pick(catInc.slice(0, 3));
          const amount = cat.id === 'ci-salary' ? 6800 : cat.id === 'ci-part' ? 1200 : Math.round(60 + rand() * 400);
          tx.push({
            id: U.uid('tx'), kind: 'income', amount: amount, categoryId: cat.id, subcategoryId: cat.subs[0].id,
            cardId: 'card-ccb', paymentType: '电子', date: date, time: '10:00', note: cat.name, mood: '😊',
            photo: null, createdAt: new Date().toISOString()
          });
        }
      }
    }

    // 去年生日前后各一笔，用于“每年生日花费对比”
    const bdDate = U.dateAdd(todayStr, 12);
    const lastYdBd = U.yearAdd(bdDate, -1);
    tx.push({
      id: U.uid('tx'), kind: 'expense', amount: 268, categoryId: 'c-shopping', subcategoryId: 'c-shopping-4',
      cardId: 'card-alipay', paymentType: '电子', date: lastYdBd, time: '15:00', note: '去年生日礼物',
      mood: '😊', photo: null, createdAt: new Date().toISOString()
    });
    tx.push({
      id: U.uid('tx'), kind: 'expense', amount: 99, categoryId: 'c-food', subcategoryId: 'c-food-3',
      cardId: 'card-wechat', paymentType: '电子', date: U.dateAdd(lastYdBd, -1), time: '18:30', note: '生日蛋糕',
      mood: '😊', photo: null, createdAt: new Date().toISOString()
    });

    s.transactions = tx;

    s.goals = [
      {
        id: 'goal-month', name: '本月总支出', period: 'month', amount: 2000, categoryId: null, active: true,
        thresholds: [
          { percent: 75, message: '钱包君已经瘦了 75%！剩下的日子要捏着花咯。', enabled: true },
          { percent: 80, message: '已到 80%，再这样下去月底就要吃土了…快刹车！', enabled: true },
          { percent: 90, message: '90% 警报！建议接下来只买“必需品”，奶茶先欠着。', enabled: true }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'goal-food', name: '饮食预算', period: 'month', amount: 1000, categoryId: 'c-food', active: true,
        thresholds: [
          { percent: 70, message: '干饭额度只剩 30% 啦，食堂阿姨在召唤。', enabled: true },
          { percent: 90, message: '干饭额度快见底！少点外卖，多吃食堂。', enabled: true }
        ],
        createdAt: new Date().toISOString()
      }
    ];

    s.schedules = [
      {
        id: 'sch-1', title: '缴纳学费', type: 'bill', date: U.dateAdd(todayStr, 5), time: '15:30',
        repeat: 'none', note: '记得留足余额', amount: 500, categoryId: 'c-education', cardId: 'card-ccb',
        remind: '1day', done: false, createdAt: new Date().toISOString()
      },
      {
        id: 'sch-2', title: '妈妈生日', type: 'birthday', date: bdDate, time: '00:00',
        repeat: 'yearly', note: '记得准备礼物和蛋糕', amount: null, categoryId: 'c-shopping', cardId: null,
        remind: '1day', done: false, createdAt: new Date().toISOString()
      },
      {
        id: 'sch-3', title: '交水电费', type: 'reminder', date: firstDay, time: '09:00',
        repeat: 'monthly', note: '每月月初缴费', amount: null, categoryId: null, cardId: null,
        remind: '1day', done: false, createdAt: new Date().toISOString()
      },
      {
        id: 'sch-4', title: '纪念日', type: 'anniversary', date: todayStr, time: '00:00',
        repeat: 'yearly', note: '属于我们的日子', amount: null, categoryId: null, cardId: null,
        remind: 'none', done: false, createdAt: new Date().toISOString()
      }
    ];

    return s;
  }

  function looksLikeSeededDemo(data) {
    return !!((data.transactions || []).some(function (t) { return t.id === 'tx-campus-1'; }) ||
      (data.goals || []).some(function (g) { return g.id === 'goal-month'; }) ||
      (data.cards || []).some(function (c) { return c.id === 'card-ccb'; }));
  }

  function stripSeededContent(state) {
    state.transactions = [];
    state.transfers = [];
    state.goals = [];
    state.schedules = [];
    state.alertLog = [];
    state.seeded = false;
    return state;
  }

  const Store = {
    users: [],
    session: null,
    state: null,
    currentUserId: null,

    init: function () {
      try {
        this.users = JSON.parse(localStorage.getItem(LS_USERS)) || [];
      } catch (e) { this.users = []; }
      try {
        this.session = JSON.parse(localStorage.getItem(LS_SESSION));
      } catch (e) { this.session = null; }
      if (this.session && this.session.remote) {
        this.session = null;
        localStorage.removeItem(LS_SESSION);
      }
      if (this.session && this.users.some(function (u) { return u.id === this.session.userId; }, this)) {
        this.currentUserId = this.session.userId;
        this.state = this.loadState(this.currentUserId);
      } else {
        this.session = null;
        localStorage.removeItem(LS_SESSION);
      }
    },

    saveUsers: function () {
      localStorage.setItem(LS_USERS, JSON.stringify(this.users));
    },

    loadState: function (userId) {
      const key = LS_PREFIX + userId;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          const normalized = normalizeState(data);
          if (normalized) {
            const autoClean = normalized.seeded === true || (normalized.seeded === undefined && looksLikeSeededDemo(normalized));
            if (autoClean) stripSeededContent(normalized);
            localStorage.setItem(key, JSON.stringify(normalized));
            return normalized;
          }
        }
      } catch (e) { /* fallthrough to seed */ }
      const seeded = seedDemoData('新朋友');
      localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    },

    save: function () {
      if (!this.currentUserId || !this.state) return;
      this.state.savedAt = Date.now();
      localStorage.setItem(LS_PREFIX + this.currentUserId, JSON.stringify(this.state));
    },

    setSession: function (userId) {
      this.currentUserId = userId;
      this.session = { userId: userId, at: new Date().toISOString() };
      localStorage.setItem(LS_SESSION, JSON.stringify(this.session));
      this.state = this.loadState(userId);
    },

    register: async function (name, pass) {
      name = String(name || '').trim();
      if (name.length < 1 || name.length > 20) return { ok: false, msg: '用户名需要 1-20 个字符' };
      if (String(pass || '').length < 4) return { ok: false, msg: '密码至少 4 位' };
      if (this.users.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) {
        return { ok: false, msg: '这个用户名已经被使用啦' };
      }
      const user = { id: U.uid('user'), name: name, pass: hashPassword(pass), createdAt: new Date().toISOString(), demo: false };
      this.users.push(user);
      this.saveUsers();
      this.setSession(user.id);
      this.state = emptyState();
      this.state.profile = { name: name, createdAt: user.createdAt };
      this.save();
      return { ok: true, user: user };
    },

    login: async function (name, pass) {
      name = String(name || '').trim();
      const user = this.users.find(function (u) { return u.name.toLowerCase() === name.toLowerCase(); });
      if (!user) return { ok: false, msg: '没找到这个用户，先注册一个吧' };
      if (user.pass !== hashPassword(pass || '')) return { ok: false, msg: '密码不对哦，再想想' };
      this.setSession(user.id);
      return { ok: true, user: user };
    },

    loginGuest: function () {
      const demo = this.users.find(function (u) { return u.demo; });
      if (demo) {
        this.setSession(demo.id);
        if (this.state.seeded === true) stripSeededContent(this.state);
        this.save();
        return { ok: true, user: demo };
      }
      const user = { id: U.uid('user'), name: '体验用户', pass: hashPassword('demo'), createdAt: new Date().toISOString(), demo: true };
      this.users.push(user);
      this.saveUsers();
      this.setSession(user.id);
      this.state = emptyState();
      this.state.profile.name = '体验用户';
      this.save();
      return { ok: true, user: user };
    },

    logout: function () {
      this.currentUserId = null;
      this.session = null;
      this.state = null;
      localStorage.removeItem(LS_SESSION);
    },

    resetData: function () {
      if (!this.currentUserId) return;
      this.state = emptyState();
      this.state.profile = { name: this.currentUserName(), createdAt: new Date().toISOString() };
      this.save();
    },

    loadDemoData: function () {
      if (!this.currentUserId) return;
      this.state = seedDemoData(this.currentUserName());
      this.state.seeded = false;
      this.save();
    },

    currentUserName: function () {
      const u = this.users.find(function (x) { return x.id === this.currentUserId; }, this);
      return u ? u.name : (this.state && this.state.profile ? this.state.profile.name : '访客');
    },

    updateProfileName: async function (name) {
      name = String(name || '').trim();
      if (!name) return { ok: false, msg: '名称不能为空' };
      const u = this.users.find(function (x) { return x.id === this.currentUserId; }, this);
      if (!u) return { ok: false, msg: '用户不存在' };
      if (this.users.some(function (x) { return x.id !== u.id && x.name.toLowerCase() === name.toLowerCase(); })) {
        return { ok: false, msg: '这个用户名已经被使用啦' };
      }
      u.name = name;
      this.state.profile.name = name;
      this.saveUsers();
      this.save();
      return { ok: true };
    },

    changePassword: async function (oldPass, newPass) {
      const u = this.users.find(function (x) { return x.id === this.currentUserId; }, this);
      if (!u) return { ok: false, msg: '用户不存在' };
      if (u.pass !== hashPassword(oldPass || '')) return { ok: false, msg: '原密码不正确' };
      if (String(newPass || '').length < 4) return { ok: false, msg: '新密码至少 4 位' };
      u.pass = hashPassword(newPass);
      this.saveUsers();
      return { ok: true };
    },

    get categories() { return this.state ? this.state.categories : []; },
    get cards() { return this.state ? this.state.cards : []; },
    get transactions() { return this.state ? this.state.transactions : []; },
    get transfers() { return this.state ? this.state.transfers : []; },
    get goals() { return this.state ? this.state.goals : []; },
    get schedules() { return this.state ? this.state.schedules : []; },
    get settings() { return this.state ? this.state.settings : DEFAULT_SETTINGS; },

    categoryById: function (id) { return this.categories.find(function (c) { return c.id === id; }); },
    subById: function (catId, subId) {
      const c = this.categoryById(catId);
      return c ? c.subs.find(function (s) { return s.id === subId; }) : null;
    },
    detailById: function (catId, subId, detailId) {
      const sub = this.subById(catId, subId);
      return sub ? (sub.children || []).find(function (d) { return d.id === detailId; }) : null;
    },
    cardById: function (id) { return this.cards.find(function (c) { return c.id === id; }); },

    catName: function (catId) {
      const c = this.categoryById(catId);
      return c ? c.name : '未分类';
    },
    catColor: function (catId) {
      const c = this.categoryById(catId);
      return c ? c.color : '#94a3b8';
    },
    catIcon: function (catId) {
      const c = this.categoryById(catId);
      return c ? c.icon : '📦';
    },
    subName: function (catId, subId) {
      const s = this.subById(catId, subId);
      return s ? s.name : '未分类';
    },
    detailName: function (catId, subId, detailId) {
      const d = this.detailById(catId, subId, detailId);
      return d ? d.name : '';
    },
    detailChildById: function (catId, subId, detailId, childId) {
      const d = this.detailById(catId, subId, detailId);
      return d ? (d.children || []).find(function (x) { return x.id === childId; }) : null;
    },
    detailChildName: function (catId, subId, detailId, childId) {
      const x = this.detailChildById(catId, subId, detailId, childId);
      return x ? x.name : '';
    },

    categoriesByType: function (type) {
      return this.categories.filter(function (c) { return c.type === type; });
    },

    // 收支查询
    expenseTxs: function () { return this.transactions.filter(function (t) { return t.kind === 'expense'; }); },
    incomeTxs: function () { return this.transactions.filter(function (t) { return t.kind === 'income'; }); },

    txsBetween: function (from, to, opts) {
      opts = opts || {};
      return this.transactions.filter(function (t) {
        if (t.date < from || t.date > to) return false;
        if (opts.kind && t.kind !== opts.kind) return false;
        if (opts.categoryId && t.categoryId !== opts.categoryId) return false;
        if (opts.cardId && t.cardId !== opts.cardId) return false;
        if (opts.paymentType && t.paymentType !== opts.paymentType) return false;
        if (opts.q) {
          const q = String(opts.q).toLowerCase();
          const cat = this.catName(t.categoryId);
          const sub = this.subName(t.categoryId, t.subcategoryId);
          const card = t.cardId ? (this.cardById(t.cardId) || {}).name || '' : '';
          const hay = (t.note || '') + cat + sub + card;
          if (hay.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      }, this);
    },

    totals: function (txs) {
      let income = 0, expense = 0;
      txs.forEach(function (t) {
        if (t.kind === 'income') income += Number(t.amount) || 0;
        else if (t.kind === 'expense') expense += Number(t.amount) || 0;
      });
      return { income: U.round2(income), expense: U.round2(expense), balance: U.round2(income - expense) };
    },

    byCategory: function (txs) {
      const map = {};
      txs.forEach(function (t) {
        if (!map[t.categoryId]) map[t.categoryId] = { categoryId: t.categoryId, total: 0, count: 0 };
        map[t.categoryId].total += Number(t.amount) || 0;
        map[t.categoryId].count += 1;
      });
      const arr = Object.keys(map).map(function (k) { return map[k]; });
      arr.forEach(function (x) { x.total = U.round2(x.total); });
      arr.sort(function (a, b) { return b.total - a.total; });
      const sum = arr.reduce(function (acc, x) { return acc + x.total; }, 0);
      arr.forEach(function (x) { x.pct = sum > 0 ? Math.round(x.total / sum * 1000) / 10 : 0; });
      return { items: arr, total: U.round2(sum) };
    },

    bySubcategory: function (txs, catId) {
      const map = {};
      txs.filter(function (t) { return t.categoryId === catId; }).forEach(function (t) {
        const key = t.subcategoryId || 'none';
        if (!map[key]) map[key] = { subcategoryId: key, total: 0, count: 0 };
        map[key].total += Number(t.amount) || 0;
        map[key].count += 1;
      });
      const arr = Object.keys(map).map(function (k) { return map[k]; });
      arr.forEach(function (x) { x.total = U.round2(x.total); });
      arr.sort(function (a, b) { return b.total - a.total; });
      const sum = arr.reduce(function (acc, x) { return acc + x.total; }, 0);
      arr.forEach(function (x) { x.pct = sum > 0 ? Math.round(x.total / sum * 1000) / 10 : 0; });
      return { items: arr, total: U.round2(sum) };
    },

    byDetail: function (txs, catId, subId) {
      const map = {};
      txs.filter(function (t) { return t.categoryId === catId && t.subcategoryId === subId; }).forEach(function (t) {
        const key = t.detailId || 'none';
        if (!map[key]) map[key] = { detailId: key, total: 0, count: 0 };
        map[key].total += Number(t.amount) || 0;
        map[key].count += 1;
      });
      const arr = Object.keys(map).map(function (k) { return map[k]; });
      arr.forEach(function (x) { x.total = U.round2(x.total); });
      arr.sort(function (a, b) { return b.total - a.total; });
      const sum = arr.reduce(function (acc, x) { return acc + x.total; }, 0);
      arr.forEach(function (x) { x.pct = sum > 0 ? Math.round(x.total / sum * 1000) / 10 : 0; });
      return { items: arr, total: U.round2(sum) };
    },

    // 卡片余额与账本
    cardBalance: function (cardId) {
      const card = this.cardById(cardId);
      if (!card) return 0;
      let bal = Number(card.initialBalance) || 0;
      this.transactions.forEach(function (t) {
        if (t.cardId !== cardId) return;
        if (t.kind === 'income' || t.kind === 'recharge') bal += Number(t.amount) || 0;
        if (t.kind === 'expense' || t.kind === 'withdraw') bal -= Number(t.amount) || 0;
      });
      this.transfers.forEach(function (tr) {
        if (tr.fromCardId === cardId) bal -= Number(tr.amount) || 0;
        if (tr.toCardId === cardId) bal += Number(tr.amount) || 0;
      });
      return U.round2(bal);
    },

    cardLedger: function (cardId) {
      const entries = [];
      this.transactions.forEach(function (t) {
        if (t.cardId === cardId) entries.push({
          id: t.id, date: t.date, time: t.time, kind: t.kind, amount: Number(t.amount) || 0,
          note: t.note || '', categoryId: t.categoryId, subcategoryId: t.subcategoryId, isTransfer: false
        });
      });
      this.transfers.forEach(function (tr) {
        if (tr.fromCardId === cardId) entries.push({
          id: tr.id, date: tr.date, time: tr.time, kind: 'transfer-out', amount: Number(tr.amount) || 0,
          note: tr.note || '', categoryId: null, subcategoryId: null, isTransfer: true, toCardId: tr.toCardId
        });
        if (tr.toCardId === cardId) entries.push({
          id: tr.id, date: tr.date, time: tr.time, kind: 'transfer-in', amount: Number(tr.amount) || 0,
          note: tr.note || '', categoryId: null, subcategoryId: null, isTransfer: true, fromCardId: tr.fromCardId
        });
      });
      entries.sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        if (a.time !== b.time) return (a.time || '00:00') < (b.time || '00:00') ? 1 : -1;
        return 0;
      });
      return entries;
    },

    cardRelations: function () {
      const rel = this.cards.map(function (card) {
        const out = {};
        const inn = {};
        this.transfers.forEach(function (tr) {
          if (tr.fromCardId === card.id) out[tr.toCardId] = (out[tr.toCardId] || 0) + (Number(tr.amount) || 0);
          if (tr.toCardId === card.id) inn[tr.fromCardId] = (inn[tr.fromCardId] || 0) + (Number(tr.amount) || 0);
        }, this);
        return {
          card: card,
          out: Object.keys(out).map(function (k) { return { toCardId: k, amount: U.round2(out[k]) }; }),
          inn: Object.keys(inn).map(function (k) { return { fromCardId: k, amount: U.round2(inn[k]) }; })
        };
      }, this);
      return rel;
    },

    // 目标
    goalPeriodRange: function (goal, anchorDate) {
      anchorDate = anchorDate || U.todayStr();
      if (goal.period === 'day') return { from: anchorDate, to: anchorDate, label: U.formatCN(anchorDate, true) };
      if (goal.period === 'week') {
        const from = U.startOfWeek(anchorDate);
        return { from: from, to: U.dateAdd(from, 6), label: from.slice(5).replace('-', '/') + ' 周' };
      }
      const from = U.startOfMonth(anchorDate);
      return { from: from, to: U.endOfMonth(anchorDate), label: U.monthLabel(anchorDate) };
    },

    goalSpent: function (goal, anchorDate) {
      const range = this.goalPeriodRange(goal, anchorDate);
      let txs = this.txsBetween(range.from, range.to, { kind: 'expense' });
      if (goal.categoryId) txs = txs.filter(function (t) { return t.categoryId === goal.categoryId; });
      return this.totals(txs).expense;
    },

    goalProgress: function (goal, anchorDate) {
      const spent = this.goalSpent(goal, anchorDate);
      const target = Number(goal.amount) || 0;
      const percent = target > 0 ? Math.min(999, Math.round(spent / target * 1000) / 10) : 0;
      return { spent: spent, target: target, percent: percent, isOver: target > 0 && spent > target };
    },

    crossedThresholds: function (goal, anchorDate) {
      const prog = this.goalProgress(goal, anchorDate);
      return (goal.thresholds || []).filter(function (th) {
        return th.enabled !== false && prog.percent >= (Number(th.percent) || 0);
      });
    },

    hasAlerted: function (goalId, percent) {
      return (this.state.alertLog || []).some(function (a) { return a.goalId === goalId && a.percent === percent; });
    },

    markAlert: function (goalId, percent) {
      if (!this.state.alertLog) this.state.alertLog = [];
      this.state.alertLog.push({ goalId: goalId, percent: percent, date: U.todayStr() });
      this.save();
    },

    // 变更
    addTransaction: function (t) { this.state.transactions.push(t); this.save(); },
    updateTransaction: function (t) {
      const i = this.state.transactions.findIndex(function (x) { return x.id === t.id; });
      if (i >= 0) { this.state.transactions[i] = t; this.save(); }
    },
    deleteTransaction: function (id) {
      this.state.transactions = this.state.transactions.filter(function (t) { return t.id !== id; });
      this.save();
    },
    addCard: function (c) { this.state.cards.push(c); this.save(); },
    updateCard: function (c) {
      const i = this.state.cards.findIndex(function (x) { return x.id === c.id; });
      if (i >= 0) { this.state.cards[i] = c; this.save(); }
    },
    deleteCard: function (id) {
      this.state.cards = this.state.cards.filter(function (c) { return c.id !== id; });
      this.state.transactions = this.state.transactions.map(function (t) {
        if (t.cardId === id) t.cardId = null;
        return t;
      });
      this.state.transfers = this.state.transfers.filter(function (tr) { return tr.fromCardId !== id && tr.toCardId !== id; });
      this.save();
    },
    addTransfer: function (tr) { this.state.transfers.push(tr); this.save(); },
    deleteTransfer: function (id) {
      this.state.transfers = this.state.transfers.filter(function (tr) { return tr.id !== id; });
      this.save();
    },
    addGoal: function (g) { this.state.goals.push(g); this.save(); },
    updateGoal: function (g) {
      const i = this.state.goals.findIndex(function (x) { return x.id === g.id; });
      if (i >= 0) { this.state.goals[i] = g; this.save(); }
    },
    deleteGoal: function (id) {
      this.state.goals = this.state.goals.filter(function (g) { return g.id !== id; });
      this.save();
    },
    addSchedule: function (s) { this.state.schedules.push(s); this.save(); },
    updateSchedule: function (s) {
      const i = this.state.schedules.findIndex(function (x) { return x.id === s.id; });
      if (i >= 0) { this.state.schedules[i] = s; this.save(); }
    },
    deleteSchedule: function (id) {
      this.state.schedules = this.state.schedules.filter(function (s) { return s.id !== id; });
      this.save();
    },
    addCategory: function (c) { this.state.categories.push(c); this.save(); },
    updateCategory: function (c) {
      const i = this.state.categories.findIndex(function (x) { return x.id === c.id; });
      if (i >= 0) { this.state.categories[i] = c; this.save(); }
    },
    deleteCategory: function (id) {
      const fallback = this.categoriesByType(this.categoryById(id) ? this.categoryById(id).type : 'expense').find(function (c) { return c.id !== id; });
      this.state.categories = this.state.categories.filter(function (c) { return c.id !== id; });
      if (fallback) {
        this.state.transactions = this.state.transactions.map(function (t) {
          if (t.categoryId === id) { t.categoryId = fallback.id; t.subcategoryId = fallback.subs[0] ? fallback.subs[0].id : null; }
          return t;
        });
      }
      this.save();
    },
    updateSettings: function (patch) {
      this.state.settings = Object.assign({}, this.state.settings, patch);
      this.save();
    },
    exportData: function () {
      return JSON.stringify({
        app: 'warm-ledger',
        version: 1,
        exportedAt: new Date().toISOString(),
        data: this.state
      }, null, 2);
    },
    importData: function (json) {
      try {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        const data = parsed && parsed.data ? parsed.data : parsed;
        const normalized = normalizeState(data);
        if (!normalized) {
          return { ok: false, msg: '文件格式不对，缺少账本数据' };
        }
        this.state = normalized;
        this.save();
        return { ok: true };
      } catch (e) {
        return { ok: false, msg: '解析失败：' + e.message };
      }
    },
    deleteAccount: function () {
      if (!this.currentUserId) return;
      localStorage.removeItem(LS_PREFIX + this.currentUserId);
      this.users = this.users.filter(function (u) { return u.id !== this.currentUserId; }, this);
      this.saveUsers();
      this.logout();
    }
  };

  window.Store = Store;
})();
