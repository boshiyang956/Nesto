(function () {
  'use strict';

  const ICON_PATHS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    tags: '<path d="M12 2H2v10l9.3 9.3a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7" cy="7" r="1"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    chartPie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    transfer: '<path d="M7 7h12"/><path d="m17 3 4 4-4 4"/><path d="M17 17H5"/><path d="m7 13-4 4 4 4"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    calendarPlus: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M9 16h6"/><path d="M12 13v6"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    trendUp: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    trendDown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
    gift: '<path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    airplane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.5c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
    sparkle: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>',
    piggy: '<path d="M19 5c-1.5 0-2.8 1-3.6 2.4A8 8 0 0 0 3 11a8 8 0 0 0 .6 3H2v3h3.2A8 8 0 0 0 11 18a7 7 0 0 0 3.4.9L15 21h3v-2.4A8 8 0 0 0 21 11a6.9 6.9 0 0 0-2-6z"/><circle cx="15.5" cy="9" r="1.2"/>'
  };

  function icon(name, size, cls) {
    const path = ICON_PATHS[name] || ICON_PATHS.info;
    const sz = size || 18;
    const clsAttr = cls ? ' class="' + cls + '"' : '';
    return '<svg' + clsAttr + ' viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function fmtDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseDate(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }

  function todayStr() { return fmtDate(new Date()); }

  function nowTimeStr() {
    const d = new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function dateAdd(dateStr, days) {
    const d = parseDate(dateStr) || new Date();
    d.setDate(d.getDate() + days);
    return fmtDate(d);
  }

  function monthAdd(dateStr, months) {
    const d = parseDate(dateStr) || new Date();
    d.setMonth(d.getMonth() + months);
    return fmtDate(d);
  }

  function yearAdd(dateStr, years) {
    const d = parseDate(dateStr) || new Date();
    d.setFullYear(d.getFullYear() + years);
    return fmtDate(d);
  }

  function startOfWeek(dateStr) {
    const d = parseDate(dateStr) || new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return fmtDate(d);
  }

  function startOfMonth(dateStr) {
    const d = parseDate(dateStr) || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-01';
  }

  function endOfMonth(dateStr) {
    const d = parseDate(dateStr) || new Date();
    return fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }

  function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

  function weekdayCN(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  }

  function formatCN(dateStr, withYear) {
    const d = parseDate(dateStr);
    if (!d) return '';
    const base = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekdayCN(dateStr);
    return withYear ? d.getFullYear() + '年' + base : base;
  }

  function monthLabel(dateStr) {
    const d = parseDate(dateStr) || new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
  }

  function monthGrid(year, month) {
    const first = new Date(year, month - 1, 1);
    const lead = (first.getDay() || 7) - 1;
    const total = daysInMonth(year, month);
    const cells = [];
    for (let i = 0; i < lead; i++) {
      const d = new Date(year, month - 1, i - lead + 1);
      cells.push({ date: fmtDate(d), inMonth: false, isToday: false });
    }
    const today = todayStr();
    for (let i = 1; i <= total; i++) {
      const date = fmtDate(new Date(year, month - 1, i));
      cells.push({ date: date, inMonth: true, isToday: date === today });
    }
    while (cells.length % 7 !== 0) {
      const last = parseDate(cells[cells.length - 1].date);
      last.setDate(last.getDate() + 1);
      cells.push({ date: fmtDate(last), inMonth: false, isToday: false });
    }
    return cells;
  }

  function sameMonth(a, b) {
    const da = parseDate(a), db = parseDate(b);
    return da && db && da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
  }

  function diffDays(a, b) {
    const da = parseDate(a), db = parseDate(b);
    if (!da || !db) return 0;
    return Math.round((db - da) / 86400000);
  }

  // 节假日：固定公历 + 2026 农历 + 计算型（母亲节/父亲节等）
  function holidaysForYear(year) {
    const list = [
      { date: year + '-01-01', name: '元旦' },
      { date: year + '-02-14', name: '情人节' },
      { date: year + '-03-08', name: '妇女节' },
      { date: year + '-03-12', name: '植树节' },
      { date: year + '-04-01', name: '愚人节' },
      { date: year + '-05-01', name: '劳动节' },
      { date: year + '-05-04', name: '青年节' },
      { date: year + '-06-01', name: '儿童节' },
      { date: year + '-08-01', name: '建军节' },
      { date: year + '-09-10', name: '教师节' },
      { date: year + '-10-01', name: '国庆节' },
      { date: year + '-12-24', name: '平安夜' },
      { date: year + '-12-25', name: '圣诞节' },
      { date: year + '-12-31', name: '跨年夜' }
    ];
    // 2026 农历
    if (year === 2026) {
      list.push({ date: '2026-02-17', name: '春节' });
      list.push({ date: '2026-02-18', name: '春节假期' });
      list.push({ date: '2026-03-05', name: '元宵节' });
      list.push({ date: '2026-04-05', name: '清明节' });
      list.push({ date: '2026-06-19', name: '端午节' });
      list.push({ date: '2026-08-22', name: '七夕' });
      list.push({ date: '2026-09-25', name: '中秋节' });
      list.push({ date: '2026-10-24', name: '重阳节' });
    }
    // 计算型节日
    const nthSunday = (month, nth) => {
      const first = new Date(year, month - 1, 1);
      const offset = (7 - first.getDay()) % 7;
      return fmtDate(new Date(year, month - 1, 1 + offset + (nth - 1) * 7));
    };
    list.push({ date: nthSunday(5, 2), name: '母亲节' });
    list.push({ date: nthSunday(6, 3), name: '父亲节' });
    list.push({ date: nthSunday(11, 4), name: '感恩节' });
    return list;
  }

  function holidayFor(dateStr) {
    const year = parseDate(dateStr) && parseDate(dateStr).getFullYear();
    if (!year) return null;
    return holidaysForYear(year).find(function (h) { return h.date === dateStr; }) || null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(n, symbol) {
    const num = Number(n) || 0;
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    const fixed = abs.toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + (symbol || '¥') + parts.join('.');
  }

  function moneyPlain(n) {
    return (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function fileToDataURL(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImage(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }

  function readTextFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    });
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments;
      const self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  // ---------- 日程重复与提醒 ----------
  function parseRepeat(repeat) {
    const s = String(repeat || 'none');
    if (s === 'none' || s === 'yearly' || s === 'monthly' || s === 'weekly' || s === 'workday') {
      return { type: s };
    }
    const m = s.match(/^every:(\d+):(day|week|month)$/);
    if (m) return { type: 'every', every: parseInt(m[1], 10), unit: m[2] };
    return { type: 'none' };
  }

  function repeatLabel(repeat) {
    const p = parseRepeat(repeat);
    if (p.type === 'none') return '';
    if (p.type === 'yearly') return '每年';
    if (p.type === 'monthly') return '每月';
    if (p.type === 'weekly') return '每周';
    if (p.type === 'workday') return '工作日';
    if (p.type === 'every') return '每 ' + p.every + ' ' + { day: '天', week: '周', month: '月' }[p.unit];
    return '';
  }

  function remindOffsetMinutes(remind) {
    const m = String(remind || '').match(/^(\d+)(min|hour|day)$/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return m[2] === 'min' ? n : m[2] === 'hour' ? n * 60 : n * 1440;
  }

  function remindLabel(remind) {
    const m = String(remind || '').match(/^(\d+)(min|hour|day)$/);
    if (!m) return '';
    const n = m[1];
    const u = { min: '分钟', hour: '小时', day: '天' }[m[2]];
    return '提前 ' + n + ' ' + u;
  }

  function scheduleOccursOn(sch, dateStr) {
    const d2 = parseDate(dateStr);
    if (!d2) return false;
    const p = parseRepeat(sch.repeat);
    const d1 = parseDate(sch.date);
    if (!d1) return false;
    if (p.type === 'none') return sch.date === dateStr;
    if (p.type === 'yearly') return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    if (p.type === 'monthly') {
      const last = daysInMonth(d2.getFullYear(), d2.getMonth() + 1);
      if (d1.getDate() > 28) return d2.getDate() === last;
      return d1.getDate() === d2.getDate();
    }
    if (p.type === 'weekly') return d1.getDay() === d2.getDay();
    if (p.type === 'workday') { const w = d2.getDay(); return w >= 1 && w <= 5; }
    if (p.type === 'every') {
      if (p.unit === 'day') { const diff = Math.round((d2 - d1) / 86400000); return diff >= 0 && diff % p.every === 0; }
      if (p.unit === 'week') { const diff = Math.round((d2 - d1) / 604800000); return diff >= 0 && diff % p.every === 0; }
      if (p.unit === 'month') {
        const mdiff = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
        return mdiff >= 0 && mdiff % p.every === 0;
      }
    }
    return false;
  }

  function nextOccurrence(sch, fromStr) {
    const from = parseDate(fromStr);
    if (!from) return null;
    const d1 = parseDate(sch.date);
    if (!d1) return null;
    const p = parseRepeat(sch.repeat);
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    if (p.type === 'none') return fmtDate(d1);
    if (p.type === 'yearly') {
      let c = new Date(from.getFullYear(), d1.getMonth(), d1.getDate());
      if (c < fromDay) c = new Date(from.getFullYear() + 1, d1.getMonth(), d1.getDate());
      return fmtDate(c);
    }
    if (p.type === 'monthly') {
      for (let i = 0; i < 25; i++) {
        const base = new Date(fromDay.getFullYear(), fromDay.getMonth() + i, 1);
        const last = daysInMonth(base.getFullYear(), base.getMonth() + 1);
        const cand = new Date(base.getFullYear(), base.getMonth(), Math.min(d1.getDate(), last));
        if (cand >= fromDay) return fmtDate(cand);
      }
      return null;
    }
    if (p.type === 'weekly') {
      const diff = (d1.getDay() - fromDay.getDay() + 7) % 7;
      const c = new Date(fromDay);
      c.setDate(c.getDate() + diff);
      if (c < fromDay) c.setDate(c.getDate() + 7);
      return fmtDate(c);
    }
    if (p.type === 'workday') {
      const c = new Date(fromDay);
      while (c.getDay() === 0 || c.getDay() === 6) c.setDate(c.getDate() + 1);
      return fmtDate(c);
    }
    if (p.type === 'every') {
      const unitDays = p.unit === 'day' ? 1 : p.unit === 'week' ? 7 : 30.44;
      let diff = Math.round((fromDay - d1) / 86400000);
      if (p.unit === 'month') {
        let mdiff = (fromDay.getFullYear() - d1.getFullYear()) * 12 + (fromDay.getMonth() - d1.getMonth());
        if (mdiff < 0) mdiff = 0;
        const steps = mdiff % p.every === 0 ? mdiff / p.every : Math.ceil(mdiff / p.every);
        const c = new Date(d1.getFullYear(), d1.getMonth() + steps * p.every, d1.getDate());
        if (c < fromDay) c.setMonth(c.getMonth() + p.every);
        return fmtDate(c);
      }
      if (diff < 0) diff = 0;
      const steps = diff % p.every === 0 ? diff / p.every : Math.ceil(diff / p.every);
      const c = new Date(d1);
      c.setDate(c.getDate() + steps * p.every * unitDays);
      if (c < fromDay) c.setDate(c.getDate() + p.every * unitDays);
      return fmtDate(c);
    }
    return null;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  window.Utils = {
    icon: icon,
    pad2: pad2,
    fmtDate: fmtDate,
    parseDate: parseDate,
    todayStr: todayStr,
    nowTimeStr: nowTimeStr,
    dateAdd: dateAdd,
    monthAdd: monthAdd,
    yearAdd: yearAdd,
    startOfWeek: startOfWeek,
    startOfMonth: startOfMonth,
    endOfMonth: endOfMonth,
    daysInMonth: daysInMonth,
    weekdayCN: weekdayCN,
    formatCN: formatCN,
    monthLabel: monthLabel,
    monthGrid: monthGrid,
    sameMonth: sameMonth,
    diffDays: diffDays,
    holidaysForYear: holidaysForYear,
    holidayFor: holidayFor,
    escapeHtml: escapeHtml,
    money: money,
    moneyPlain: moneyPlain,
    round2: round2,
    uid: uid,
    fileToDataURL: fileToDataURL,
    compressImage: compressImage,
    readTextFile: readTextFile,
    download: download,
    debounce: debounce,
    parseRepeat: parseRepeat,
    repeatLabel: repeatLabel,
    remindOffsetMinutes: remindOffsetMinutes,
    remindLabel: remindLabel,
    scheduleOccursOn: scheduleOccursOn,
    nextOccurrence: nextOccurrence,
    qs: qs,
    qsa: qsa
  };
})();
