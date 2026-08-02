(function () {
  'use strict';
  const U = window.Utils;
  const S = window.Store;

  function parseRepeatForEdit(repeat) {
    const p = U.parseRepeat(repeat);
    if (p.type === 'every') return { sel: 'custom', every: p.every, unit: p.unit };
    return { sel: p.type, every: 2, unit: 'day' };
  }

  function parseRemindForEdit(remind) {
    if (!remind || remind === 'none') return { sel: 'none', val: 30, unit: 'min' };
    if (remind === '1hour') return { sel: '1hour', val: 1, unit: 'hour' };
    if (remind === '1day') return { sel: '1day', val: 1, unit: 'day' };
    if (remind === '7day') return { sel: '7day', val: 7, unit: 'day' };
    const m = String(remind).match(/^(\d+)(min|hour|day)$/);
    if (m) return { sel: 'custom', val: parseInt(m[1], 10), unit: m[2] };
    return { sel: 'none', val: 30, unit: 'min' };
  }

  const Modals = {
    open: function (html, opts) {
      opts = opts || {};
      const root = U.qs('#modalRoot');
      root.innerHTML = '<div class="modal-backdrop" data-action="close-modal"></div><div class="modal' + (opts.wide ? ' wide' : '') + '">' + html + '</div>';
      root.classList.add('is-open');
      if (opts.onMount) opts.onMount(root);
    },

    close: function () {
      const root = U.qs('#modalRoot');
      root.classList.remove('is-open');
      root.innerHTML = '';
      window.Views._photo = null;
      window.Views._cardOp = null;
    },

    openConfirm: function (title, msg, onYes, yesLabel) {
      window.Views._confirmCb = onYes;
      this.open(
        '<div class="modal-head"><h3>' + U.escapeHtml(title) + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body"><p style="margin:0">' + U.escapeHtml(msg) + '</p></div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="danger-btn" type="button" data-action="confirm-yes">' + U.escapeHtml(yesLabel || '确定') + '</button></div>'
      );
    },

    // ---------- 记一笔 ----------
    openAddTx: function (tx, presetDate) {
      const V = window.Views;
      V._txForm = {
        type: tx ? (tx.kind === 'income' ? 'income' : 'expense') : 'expense',
        catId: tx ? tx.categoryId : null,
        subId: tx ? tx.subcategoryId : null,
        detailId: tx ? tx.detailId : null,
        detailChildId: tx ? tx.detailChildId : null,
        mood: tx ? tx.mood : null,
        photo: tx ? tx.photo : null,
        editing: tx ? tx.id : null,
        multi: false,
        selections: [],
        detailEdit: null,
        detailChildEdit: null,
        subEdit: null,
        catEdit: null
      };
      const defaultCardId = tx ? tx.cardId : (S.settings.defaultCardId === null ? '' : (S.settings.defaultCardId || (S.cards.length ? S.cards[0].id : '')));
      const cardsOpts = S.cards.map(function (c) {
        return '<option value="' + c.id + '"' + (defaultCardId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const html =
        '<div class="modal-head"><h3>' + (tx ? '编辑账单' : '记一笔') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="seg" style="justify-content:center">' +
        '<button type="button" data-action="tx-type" data-type="expense"' + (V._txForm.type === 'expense' ? ' class="is-active"' : '') + '>支出</button>' +
        '<button type="button" data-action="tx-type" data-type="income"' + (V._txForm.type === 'income' ? ' class="is-active"' : '') + '>收入</button></div>' +
        '<div class="amount-input"><span class="cur">' + U.escapeHtml(S.settings.currencySymbol || '¥') + '</span><input id="txAmount" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="0.00" value="' + (tx ? tx.amount : '') + '"></div>' +
        '<div class="toolbar" style="margin-top:2px"><button class="ghost-btn compact" type="button" data-action="tx-multi">' + U.icon('tags', 15) + ' 多分类</button><span class="muted small" id="txMultiHint"></span></div>' +
        '<div id="txSplitBox"></div>' +
        '<div class="field"><span>分类（点击可钻取小类）</span><div class="chip-grid" id="txCats"></div></div>' +
        '<div class="toolbar" style="margin-top:-4px">' +
        '<button class="ghost-btn compact" type="button" data-action="tx-cat-add">' + U.icon('plus', 14) + ' 新增大类</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-cat-edit">' + U.icon('edit', 14) + ' 编辑当前</button></div>' +
        '<div id="txCatEditor"></div>' +
        '<div class="field"><span>小类</span><div class="chip-grid" id="txSubs"></div></div>' +
        '<div class="toolbar" style="margin-top:-6px">' +
        '<button class="ghost-btn compact" type="button" data-action="tx-sub-add">' + U.icon('plus', 14) + ' 新增小类</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-sub-edit">' + U.icon('edit', 14) + ' 编辑当前</button></div>' +
        '<div id="txSubEditor"></div>' +
        '<div class="field" id="txDetailField"><span>细分类（可再分一级）</span><div class="chip-grid" id="txDetails"></div>' +
        '<div class="toolbar" style="margin-top:6px"><button class="ghost-btn compact" type="button" data-action="tx-detail-add">' + U.icon('plus', 14) + ' 新增细类</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-detail-edit">' + U.icon('edit', 14) + ' 编辑当前</button></div>' +
        '<div id="txDetailEditor"></div>' +
        '<div class="field" id="txDetailChildField"><span>小类（细分类下）</span><div class="chip-grid" id="txDetailChilds"></div>' +
        '<div class="toolbar" style="margin-top:6px"><button class="ghost-btn compact" type="button" data-action="tx-detailchild-add">' + U.icon('plus', 14) + ' 新增小类</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-detailchild-edit">' + U.icon('edit', 14) + ' 编辑当前</button></div>' +
        '<div id="txDetailChildEditor"></div></div></div>' +
        '<div class="form-grid">' +
        '<div class="field"><span>收支方式</span><select id="txPayment"><option value="现金"' + (tx && tx.paymentType === '现金' ? ' selected' : '') + '>现金</option><option value="电子"' + (!tx || tx.paymentType === '电子' ? ' selected' : '') + '>电子</option></select></div>' +
        '<div class="field"><span>关联卡片（可选）</span><select id="txCard"><option value="">不使用卡片</option>' + cardsOpts + '</select></div>' +
        '<div class="field"><span>日期</span><input id="txDate" type="date" value="' + (tx ? tx.date : presetDate || U.todayStr()) + '"></div>' +
        '<div class="field"><span>时间</span><input id="txTime" type="time" value="' + (tx ? tx.time : U.nowTimeStr()) + '"></div>' +
        '</div>' +
        '<div class="field"><span>心情</span><div class="mood-row" id="txMoods">' +
        ['😊', '😐', '😌', '😢', '😡'].map(function (m) {
          return '<button class="mood-btn' + (V._txForm.mood === m ? ' is-active' : '') + '" type="button" data-action="tx-mood" data-mood="' + m + '">' + m + '</button>';
        }).join('') + '</div></div>' +
        '<div class="field"><span>备注</span><textarea id="txNote" rows="2" placeholder="这笔钱花去哪了？">' + (tx && tx.note ? U.escapeHtml(tx.note) : '') + '</textarea></div>' +
        '<div class="field"><span>照片</span><input id="txPhotoInput" type="file" accept="image/*" hidden><div id="txPhotoArea"></div></div>' +
        '</div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-tx">' + (tx ? '保存修改' : '记下这笔') + '</button></div>';
      this.open(html, {
        onMount: function () {
          Modals.updateTxUi();
          Modals.applyDefaultCard();
          const input = U.qs('#txPhotoInput');
          if (input) {
            input.addEventListener('change', function () {
              const file = input.files && input.files[0];
              if (!file) return;
              U.compressImage(file, 900, 0.78).then(function (dataUrl) {
                window.Views._txForm.photo = dataUrl;
                Modals.updatePhotoPreview();
              }).catch(function () { window.Views.toast('照片读取失败', '换一张试试', 'danger'); });
            });
          }
        }
      });
    },

    updateTxUi: function () {
      const V = window.Views;
      const f = V._txForm;
      const cats = S.categoriesByType(f.type);
      if (!f.multi) {
        if (!f.catId || !cats.some(function (c) { return c.id === f.catId; })) {
          f.catId = cats.length ? cats[0].id : null;
          f.subId = cats.length && cats[0].subs.length ? cats[0].subs[0].id : null;
        }
      } else if (!f.selections.length && cats.length) {
        f.selections.push({ catId: cats[0].id, subId: cats[0].subs.length ? cats[0].subs[0].id : null, detailId: null, amount: 0 });
      }
      const catBox = U.qs('#txCats');
      if (catBox) {
        catBox.innerHTML = cats.map(function (c) {
          const active = f.multi ? f.selections.some(function (s) { return s.catId === c.id; }) : f.catId === c.id;
          return '<button class="cat-chip' + (active ? ' is-active' : '') + '" type="button" data-action="tx-cat" data-cat-id="' + c.id + '"><span class="dot" style="background:' + c.color + '"></span>' + U.escapeHtml(c.icon + ' ' + c.name) + '</button>';
        }).join('');
      }
      const cat = S.categoryById(f.catId);
      const subs = f.multi ? [] : (cat ? cat.subs : []);
      if (!f.multi && !subs.some(function (s) { return s.id === f.subId; })) f.subId = subs.length ? subs[0].id : null;
      const subBox = U.qs('#txSubs');
      if (subBox) {
        if (f.multi) {
          const selCats = cats.filter(function (c) { return f.selections.some(function (s) { return s.catId === c.id; }); });
          let html = '';
          selCats.forEach(function (c) {
            (c.subs || []).forEach(function (s) {
              const active = f.selections.some(function (x) { return x.catId === c.id && x.subId === s.id; });
              html += '<button class="cat-chip small' + (active ? ' is-active' : '') + '" type="button" data-action="tx-sub" data-cat-id="' + c.id + '" data-sub-id="' + s.id + '" title="双击取消小类并编辑大类">' +
                '<span class="dot" style="background:' + s.color + '"></span>' + (selCats.length > 1 ? U.escapeHtml(c.name + ' · ') : '') + U.escapeHtml(s.name) + '</button>';
            });
          });
          subBox.innerHTML = html || '<span class="muted small">先选择分类</span>';
        } else {
          subBox.innerHTML = subs.map(function (s) {
            return '<button class="cat-chip small' + (f.subId === s.id ? ' is-active' : '') + '" type="button" data-action="tx-sub" data-sub-id="' + s.id + '"><span class="dot" style="background:' + s.color + '"></span>' + U.escapeHtml(s.name) + '</button>';
          }).join('') || '<span class="muted small">该分类暂无小类</span>';
        }
      }
      U.qsa('#txSubs .cat-chip').forEach(function (b) {
        b.addEventListener('dblclick', function () {
          const catId = b.getAttribute('data-cat-id') || V._txForm.catId;
          const subId = b.getAttribute('data-sub-id');
          if (V._txForm.multi && subId) {
            V._txForm.selections = V._txForm.selections.filter(function (s) { return !(s.catId === catId && s.subId === subId); });
          }
          V._txForm.subId = null;
          V._txForm.detailId = null;
          V._txForm.detailChildId = null;
          V._txForm.subEdit = null;
          V._txForm.detailEdit = null;
          V._txForm.catEdit = { mode: 'edit', catId: catId };
          M.updateTxUi();
        });
      });
      const sub = f.multi ? null : S.subById(f.catId, f.subId);
      const details = f.multi ? [] : (sub ? (sub.children || []) : []);
      if (!f.multi && !details.some(function (d) { return d.id === f.detailId; })) f.detailId = details.length ? details[0].id : null;
      const detailField = U.qs('#txDetailField');
      const detailBox = U.qs('#txDetails');
      if (detailBox) {
        if (f.multi) {
          const selSubs = [];
          f.selections.forEach(function (s) {
            if (!s.subId) return;
            const ss = S.subById(s.catId, s.subId);
            if (ss) selSubs.push({ catId: s.catId, sub: ss });
          });
          let html = '';
          selSubs.forEach(function (x) {
            (x.sub.children || []).forEach(function (d) {
              const active = f.selections.some(function (sel) { return sel.catId === x.catId && sel.subId === x.sub.id && sel.detailId === d.id; });
              html += '<button class="cat-chip small' + (active ? ' is-active' : '') + '" type="button" data-action="tx-detail" data-cat-id="' + x.catId + '" data-sub-id="' + x.sub.id + '" data-detail-id="' + d.id + '">' +
                '<span class="dot" style="background:' + d.color + '"></span>' + U.escapeHtml(d.name) + '</button>';
            });
          });
          detailBox.innerHTML = html || '<span class="muted small">先选择小类</span>';
          if (detailField) detailField.classList.toggle('hidden', !html);
        } else {
          detailBox.innerHTML = details.map(function (d) {
            return '<button class="cat-chip small' + (f.detailId === d.id ? ' is-active' : '') + '" type="button" data-action="tx-detail" data-detail-id="' + d.id + '"><span class="dot" style="background:' + d.color + '"></span>' + U.escapeHtml(d.name) + '</button>';
          }).join('');
          if (detailField) detailField.classList.toggle('hidden', !sub || !details.length);
        }
      }
      const childField = U.qs('#txDetailChildField');
      const childBox = U.qs('#txDetailChilds');
      if (childBox) {
        const detail = !f.multi && sub ? S.detailById(f.catId, f.subId, f.detailId) : null;
        if (detail) {
          const children = detail.children || [];
          if (!children.some(function (x) { return x.id === f.detailChildId; })) f.detailChildId = children.length ? children[0].id : null;
          childBox.innerHTML = children.map(function (x) {
            return '<button class="cat-chip small' + (f.detailChildId === x.id ? ' is-active' : '') + '" type="button" data-action="tx-detailchild" data-detail-child-id="' + x.id + '"><span class="dot" style="background:' + x.color + '"></span>' + U.escapeHtml(x.name) + '</button>';
          }).join('') || '<span class="muted small">该细分类暂无小类</span>';
          if (childField) childField.classList.toggle('hidden', !children.length);
        } else {
          childBox.innerHTML = '';
          if (childField) childField.classList.add('hidden');
        }
      }
      const hint = U.qs('#txMultiHint');
      if (hint) hint.textContent = f.multi ? '可同时选择多个分类和小类' : '';
      Modals.renderSplitList();
      Modals.renderDetailEditor();
      Modals.renderDetailChildEditor();
      Modals.renderCatEditor();
      Modals.renderSubEditor();
      U.qsa('.modal [data-action="tx-type"]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-type') === f.type);
      });
      U.qsa('.modal [data-action="tx-multi"]').forEach(function (b) {
        b.classList.toggle('is-active', !!f.multi);
      });
      Modals.updatePhotoPreview();
    },

    renderSplitList: function () {
      const V = window.Views;
      const f = V._txForm;
      const box = U.qs('#txSplitBox');
      if (!box) return;
      if (!f.multi || f.selections.length < 2) {
        box.classList.add('hidden');
        box.innerHTML = '';
        return;
      }
      box.classList.remove('hidden');
      box.innerHTML = '<div class="split-box">' + f.selections.map(function (s, i) {
        let label = S.catName(s.catId);
        if (s.subId) label += ' · ' + S.subName(s.catId, s.subId);
        if (s.detailId) label += ' · ' + S.detailName(s.catId, s.subId, s.detailId);
        return '<div class="split-row"><span class="split-name">' + U.escapeHtml(label) + '</span><input class="split-amount" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="0.00" value="' + (s.amount > 0 ? s.amount : '') + '" data-index="' + i + '"></div>';
      }).join('') + '</div>';
      U.qsa('#txSplitBox .split-amount').forEach(function (inp) {
        inp.addEventListener('input', function () {
          const idx = +inp.getAttribute('data-index');
          if (f.selections[idx]) f.selections[idx].amount = parseFloat(inp.value) || 0;
        });
      });
    },

    renderCatEditor: function () {
      const V = window.Views;
      const f = V._txForm;
      const box = U.qs('#txCatEditor');
      if (!box) return;
      const edit = f.catEdit;
      if (!edit) { box.innerHTML = ''; return; }
      const cat = edit.catId ? S.categoryById(edit.catId) : null;
      box.innerHTML = '<div class="bg-option"><div class="small bold">' + (edit.mode === 'edit' ? '编辑大类' : '新增大类') + '</div>' +
        '<div class="form-grid" style="margin-top:6px">' +
        '<input id="catEditName" type="text" placeholder="大类名称" value="' + (cat ? U.escapeHtml(cat.name) : '') + '">' +
        '<input id="catEditIcon" type="text" maxlength="4" placeholder="图标" value="' + (cat ? U.escapeHtml(cat.icon || '') : '') + '">' +
        '<input id="catEditColor" type="color" value="' + (cat ? cat.color : '#f59e0b') + '" style="height:38px">' +
        '</div>' +
        '<div class="toolbar" style="margin-top:6px">' +
        '<button class="primary-btn compact" type="button" data-action="tx-cat-save">保存</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-cat-cancel">取消</button>' +
        (edit.mode === 'edit' ? '<button class="icon-btn" type="button" data-action="tx-cat-delete" title="删除大类">' + U.icon('trash', 16) + '</button>' : '') +
        '</div></div>';
    },

    renderDetailChildEditor: function () {
      const V = window.Views;
      const f = V._txForm;
      const box = U.qs('#txDetailChildEditor');
      if (!box) return;
      const edit = f.detailChildEdit;
      if (!edit) { box.innerHTML = ''; return; }
      const sub = S.subById(f.catId, f.subId);
      const detail = sub ? S.detailById(f.catId, f.subId, f.detailId) : null;
      if (!detail) { box.innerHTML = ''; return; }
      const current = edit.childId ? (detail.children || []).find(function (x) { return x.id === edit.childId; }) : null;
      box.innerHTML = '<div class="bg-option"><div class="small bold">' + (edit.mode === 'edit' ? '编辑小类' : '新增小类') + '</div>' +
        '<div class="form-grid" style="margin-top:6px">' +
        '<input id="detailChildEditName" type="text" placeholder="小类名称" value="' + (current ? U.escapeHtml(current.name) : '') + '">' +
        '<input id="detailChildEditColor" type="color" value="' + (current ? current.color : '#a78bfa') + '" style="height:38px">' +
        '</div>' +
        '<div class="toolbar" style="margin-top:6px">' +
        '<button class="primary-btn compact" type="button" data-action="tx-detailchild-save">保存</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-detailchild-cancel">取消</button>' +
        (edit.mode === 'edit' ? '<button class="icon-btn" type="button" data-action="tx-detailchild-delete" title="删除小类">' + U.icon('trash', 16) + '</button>' : '') +
        '</div></div>';
    },

    renderSubEditor: function () {
      const V = window.Views;
      const box = U.qs('#txSubEditor');
      if (!box) return;
      const edit = V._txForm.subEdit;
      if (!edit) { box.innerHTML = ''; return; }
      const cat = S.categoryById(V._txForm.catId);
      if (!cat) { box.innerHTML = ''; return; }
      const current = edit.subId ? cat.subs.find(function (s) { return s.id === edit.subId; }) : null;
      box.innerHTML = '<div class="bg-option"><div class="small bold">' + (edit.mode === 'edit' ? '编辑小类' : '新增小类') + '</div>' +
        '<div class="form-grid" style="margin-top:6px">' +
        '<input id="subEditName" type="text" placeholder="小类名称" value="' + (current ? U.escapeHtml(current.name) : '') + '">' +
        '<input id="subEditColor" type="color" value="' + (current ? current.color : '#38bdf8') + '" style="height:38px">' +
        '</div>' +
        '<div class="toolbar" style="margin-top:6px">' +
        '<button class="primary-btn compact" type="button" data-action="tx-sub-save">保存</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-sub-cancel">取消</button>' +
        (edit.mode === 'edit' ? '<button class="icon-btn" type="button" data-action="tx-sub-delete" title="删除小类">' + U.icon('trash', 16) + '</button>' : '') +
        '</div></div>';
    },

    renderDetailEditor: function () {
      const V = window.Views;
      const box = U.qs('#txDetailEditor');
      if (!box) return;
      const edit = V._txForm.detailEdit;
      if (!edit) { box.innerHTML = ''; return; }
      const sub = S.subById(V._txForm.catId, V._txForm.subId);
      if (!sub) { box.innerHTML = ''; return; }
      const current = edit.detailId ? (sub.children || []).find(function (d) { return d.id === edit.detailId; }) : null;
      box.innerHTML = '<div class="bg-option"><div class="small bold">' + (edit.mode === 'edit' ? '编辑细分类' : '新增细分类') + '</div>' +
        '<div class="form-grid" style="margin-top:6px">' +
        '<input id="detailEditName" type="text" placeholder="细分类名称" value="' + (current ? U.escapeHtml(current.name) : '') + '">' +
        '<input id="detailEditColor" type="color" value="' + (current ? current.color : '#22c55e') + '" style="height:38px">' +
        '</div>' +
        '<div class="toolbar" style="margin-top:6px">' +
        '<button class="primary-btn compact" type="button" data-action="tx-detail-save">保存</button>' +
        '<button class="ghost-btn compact" type="button" data-action="tx-detail-cancel">取消</button>' +
        (edit.mode === 'edit' ? '<button class="icon-btn" type="button" data-action="tx-detail-delete" title="删除细分类">' + U.icon('trash', 16) + '</button>' : '') +
        '</div></div>';
    },

    updatePhotoPreview: function () {
      const area = U.qs('#txPhotoArea');
      if (!area) return;
      const photo = window.Views._txForm.photo;
      if (photo) {
        area.innerHTML = '<div class="photo-preview"><img src="' + photo + '" alt="账单照片"><button class="icon-btn remove" type="button" data-action="tx-remove-photo" title="移除照片">' + U.icon('x', 16) + '</button></div>';
      } else {
        area.innerHTML = '<label class="photo-upload" for="txPhotoInput">' + U.icon('camera', 18) + ' 拍照或从相册选择</label>';
      }
    },

    applyDefaultCard: function () {
      const f = window.Views._txForm;
      const sel = U.qs('#txCard');
      if (!sel || !f || f.editing) return;
      const cat = S.categoryById(f.catId);
      const def = cat && Object.prototype.hasOwnProperty.call(cat, 'defaultCardId')
        ? (cat.defaultCardId || '')
        : (S.settings.defaultCardId === null ? '' : (S.settings.defaultCardId || (S.cards.length ? S.cards[0].id : '')));
      sel.value = def;
    },

    // ---------- 卡片 ----------
    openCard: function (card) {
      const html =
        '<div class="modal-head"><h3>' + (card ? '编辑卡片' : '添加卡片') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="field"><span>卡片名称</span><input id="cardName" type="text" placeholder="如：建设银行储蓄卡" value="' + (card ? U.escapeHtml(card.name) : '') + '"></div>' +
        '<div class="form-grid">' +
        '<div class="field"><span>类型</span><select id="cardType"><option value="电子"' + (!card || card.type === '电子' ? ' selected' : '') + '>电子</option><option value="现金"' + (card && card.type === '现金' ? ' selected' : '') + '>现金</option></select></div>' +
        '<div class="field"><span>颜色</span><input id="cardColor" type="color" value="' + (card ? card.color : '#2563eb') + '" style="height:40px"></div>' +
        '<div class="field"><span>初始余额</span><input id="cardInitial" type="number" step="0.01" min="0" value="' + (card ? card.initialBalance : 0) + '"></div>' +
        '<div class="field"><span>备注</span><input id="cardNote" type="text" placeholder="如：生活主卡" value="' + (card ? U.escapeHtml(card.note || '') : '') + '"></div>' +
        '</div></div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-card">' + (card ? '保存' : '添加') + '</button></div>';
      this.open(html);
    },

    openCardOp: function (cardId, op) {
      const card = S.cardById(cardId);
      if (!card) return;
      window.Views._cardOp = { cardId: cardId, op: op };
      const opLabel = { recharge: '充值', withdraw: '提现', expense: '记支出', income: '记收入' }[op] || '操作';
      const needCat = op === 'expense' || op === 'income';
      let catUi = '';
      if (needCat) {
        catUi = '<div class="field"><span>分类</span><div class="chip-grid" id="cardOpCats"></div></div>' +
          '<div class="field"><span>小类</span><div class="chip-grid" id="cardOpSubs"></div></div>' +
          '<div class="field" id="cardOpDetailField"><span>细分类</span><div class="chip-grid" id="cardOpDetails"></div></div>';
      }
      const html =
        '<div class="modal-head"><h3>' + U.escapeHtml(card.name + ' · ' + opLabel) + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="amount-input"><span class="cur">' + U.escapeHtml(S.settings.currencySymbol || '¥') + '</span><input id="opAmount" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="0.00"></div>' +
        catUi +
        '<div class="form-grid">' +
        '<div class="field"><span>日期</span><input id="opDate" type="date" value="' + U.todayStr() + '"></div>' +
        '<div class="field"><span>时间</span><input id="opTime" type="time" value="' + U.nowTimeStr() + '"></div>' +
        '</div>' +
        '<div class="field"><span>备注</span><textarea id="opNote" rows="2" placeholder="可选"></textarea></div>' +
        '</div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-card-op">确认' + opLabel + '</button></div>';
      this.open(html, {
        onMount: function () {
          if (!needCat) return;
          const V = window.Views;
          V._cardOp.catId = null;
          V._cardOp.subId = null;
          V._cardOp.detailId = null;
          Modals.updateCardOpUi();
        }
      });
    },

    updateCardOpUi: function () {
      const V = window.Views;
      const f = V._cardOp;
      if (!f) return;
      const type = f.op === 'income' ? 'income' : 'expense';
      const cats = S.categoriesByType(type);
      if (!f.catId || !cats.some(function (c) { return c.id === f.catId; })) {
        f.catId = cats.length ? cats[0].id : null;
        f.subId = cats.length && cats[0].subs.length ? cats[0].subs[0].id : null;
      }
      const catBox = U.qs('#cardOpCats');
      if (catBox) {
        catBox.innerHTML = cats.map(function (c) {
          return '<button class="cat-chip' + (f.catId === c.id ? ' is-active' : '') + '" type="button" data-action="cardop-cat" data-cat-id="' + c.id + '"><span class="dot" style="background:' + c.color + '"></span>' + U.escapeHtml(c.icon + ' ' + c.name) + '</button>';
        }).join('');
      }
      const cat = S.categoryById(f.catId);
      const subs = cat ? cat.subs : [];
      if (!subs.some(function (s) { return s.id === f.subId; })) f.subId = subs.length ? subs[0].id : null;
      const subBox = U.qs('#cardOpSubs');
      if (subBox) {
        subBox.innerHTML = subs.map(function (s) {
          return '<button class="cat-chip small' + (f.subId === s.id ? ' is-active' : '') + '" type="button" data-action="cardop-sub" data-sub-id="' + s.id + '"><span class="dot" style="background:' + s.color + '"></span>' + U.escapeHtml(s.name) + '</button>';
        }).join('') || '<span class="muted small">该分类暂无小类</span>';
      }
      const sub = S.subById(f.catId, f.subId);
      const details = sub ? (sub.children || []) : [];
      if (!details.some(function (d) { return d.id === f.detailId; })) f.detailId = details.length ? details[0].id : null;
      const df = U.qs('#cardOpDetailField');
      if (df) df.classList.toggle('hidden', !sub || !details.length);
      const db = U.qs('#cardOpDetails');
      if (db) {
        db.innerHTML = details.map(function (d) {
          return '<button class="cat-chip small' + (f.detailId === d.id ? ' is-active' : '') + '" type="button" data-action="cardop-detail" data-detail-id="' + d.id + '"><span class="dot" style="background:' + d.color + '"></span>' + U.escapeHtml(d.name) + '</button>';
        }).join('');
      }
    },

    openTransfer: function (fromId) {
      const cards = S.cards;
      if (cards.length < 2) {
        window.Views.toast('卡片还不够', '至少需要两张卡片才能转账', 'warn');
        return;
      }
      const options = cards.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === fromId ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const toOptions = cards.map(function (c) {
        return '<option value="' + c.id + '"' + (fromId && c.id !== fromId ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const html =
        '<div class="modal-head"><h3>卡间转账</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>转出卡片</span><select id="trFrom">' + options + '</select></div>' +
        '<div class="field"><span>转入卡片</span><select id="trTo">' + toOptions + '</select></div>' +
        '</div>' +
        '<div class="amount-input"><span class="cur">' + U.escapeHtml(S.settings.currencySymbol || '¥') + '</span><input id="trAmount" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="0.00"></div>' +
        '<div class="form-grid">' +
        '<div class="field"><span>日期</span><input id="trDate" type="date" value="' + U.todayStr() + '"></div>' +
        '<div class="field"><span>时间</span><input id="trTime" type="time" value="' + U.nowTimeStr() + '"></div>' +
        '</div>' +
        '<div class="field"><span>备注</span><input id="trNote" type="text" placeholder="可选"></div>' +
        '</div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-transfer">确认转账</button></div>';
      this.open(html);
    },

    // ---------- 日程 ----------
    openSchedule: function (sch, defaultDate) {
      const catsOpts = '<option value="">不关联分类</option>' + S.categories.map(function (c) {
        return '<option value="' + c.id + '"' + (sch && sch.categoryId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const cardsOpts = '<option value="">不关联卡片</option>' + S.cards.map(function (c) {
        return '<option value="' + c.id + '"' + (sch && sch.cardId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const type = sch ? sch.type : 'reminder';
      const titlePh = { reminder: '请输入提醒事项', bill: '请输入账单名称', birthday: '请输入寿星的名字', anniversary: '请输入纪念日名称' }[type] || '请输入日程标题';
      const repeatInit = parseRepeatForEdit(sch ? sch.repeat : 'none');
      const remindInit = parseRemindForEdit(sch ? sch.remind : 'none');
      const repeatOpts = [['none', '不重复'], ['yearly', '每年'], ['monthly', '每月'], ['weekly', '每周'], ['workday', '工作日'], ['custom', '自定义']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (repeatInit.sel === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
      const remindOpts = [['none', '不提醒'], ['1hour', '提前 1 小时'], ['1day', '提前 1 天'], ['7day', '提前 1 周'], ['custom', '自定义']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (remindInit.sel === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
      const html =
        '<div class="modal-head"><h3>' + (sch ? '编辑日程' : '新建日程') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>类型</span><select id="schType">' +
        ['reminder', 'bill', 'birthday', 'anniversary'].map(function (k) {
          const meta = { reminder: '提醒', bill: '账单', birthday: '生日', anniversary: '纪念日' };
          return '<option value="' + k + '"' + (sch && sch.type === k ? ' selected' : '') + '>' + meta[k] + '</option>';
        }).join('') + '</select></div>' +
        '<div class="field"><span>标题</span><input id="schTitle" type="text" placeholder="' + titlePh + '" value="' + (sch ? U.escapeHtml(sch.title) : '') + '"></div>' +
        '<div class="field"><span>日期</span><input id="schDate" type="date" value="' + (sch ? sch.date : (defaultDate || U.todayStr())) + '"></div>' +
        '<div class="field"><span>时间</span><input id="schTime" type="time" value="' + (sch ? sch.time : '09:00') + '"></div>' +
        '<div class="field"><span>重复</span><select id="schRepeat">' + repeatOpts + '</select></div>' +
        '<div class="field"><span>提前提醒</span><select id="schRemind">' + remindOpts + '</select></div>' +
        '</div>' +
        '<div class="field" id="schRepeatCustom"' + (repeatInit.sel === 'custom' ? '' : ' hidden') + '><span>自定义重复：每</span><div style="display:flex;gap:8px;align-items:center"><input id="schRepeatEvery" type="number" min="1" value="' + repeatInit.every + '" style="width:90px"><select id="schRepeatUnit" style="width:auto"><option value="day"' + (repeatInit.unit === 'day' ? ' selected' : '') + '>天</option><option value="week"' + (repeatInit.unit === 'week' ? ' selected' : '') + '>周</option><option value="month"' + (repeatInit.unit === 'month' ? ' selected' : '') + '>月</option></select></div></div>' +
        '<div class="field" id="schRemindCustom"' + (remindInit.sel === 'custom' ? '' : ' hidden') + '><span>自定义提醒：提前</span><div style="display:flex;gap:8px;align-items:center"><input id="schRemindValue" type="number" min="1" value="' + remindInit.val + '" style="width:90px"><select id="schRemindUnit" style="width:auto"><option value="min"' + (remindInit.unit === 'min' ? ' selected' : '') + '>分钟</option><option value="hour"' + (remindInit.unit === 'hour' ? ' selected' : '') + '>小时</option><option value="day"' + (remindInit.unit === 'day' ? ' selected' : '') + '>天</option></select></div></div>' +
        '<div id="schBillFields" class="form-grid' + (sch && sch.type === 'bill' ? '' : ' hidden') + '">' +
        '<div class="field"><span>金额</span><input id="schAmount" type="number" step="0.01" min="0" value="' + (sch && sch.amount ? sch.amount : '') + '"></div>' +
        '<div class="field"><span>分类</span><select id="schCategory">' + catsOpts + '</select></div>' +
        '<div class="field full"><span>卡片</span><select id="schCard">' + cardsOpts + '</select></div>' +
        '</div>' +
        '<div class="field"><span>备注</span><textarea id="schNote" rows="2">' + (sch && sch.note ? U.escapeHtml(sch.note) : '') + '</textarea></div>' +
        (sch ? '<label class="setting-row" style="cursor:pointer"><span class="info"><strong>已完成</strong></span><span class="switch"><input type="checkbox" id="schDone"' + (sch.done ? ' checked' : '') + '><span class="track"></span></span></label>' : '') +
        '</div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-schedule">' + (sch ? '保存' : '创建') + '</button></div>';
      this.open(html, {
        onMount: function () {
          const typeSel = U.qs('#schType');
          if (typeSel) {
            typeSel.addEventListener('change', function () {
              const box = U.qs('#schBillFields');
              if (box) box.classList.toggle('hidden', typeSel.value !== 'bill');
              const ph = { reminder: '请输入提醒事项', bill: '请输入账单名称', birthday: '请输入寿星的名字', anniversary: '请输入纪念日名称' }[typeSel.value] || '请输入日程标题';
              U.qs('#schTitle').placeholder = ph;
              if (typeSel.value === 'birthday') {
                const rp = U.qs('#schRepeat');
                if (!rp.dataset.touched) {
                  rp.value = 'yearly';
                  U.qs('#schRepeatCustom').classList.add('hidden');
                }
              }
            });
          }
          const rp = U.qs('#schRepeat');
          if (rp) {
            rp.addEventListener('change', function () {
              rp.dataset.touched = '1';
              const box = U.qs('#schRepeatCustom');
              if (box) box.classList.toggle('hidden', rp.value !== 'custom');
            });
          }
          const rm = U.qs('#schRemind');
          if (rm) {
            rm.addEventListener('change', function () {
              const box = U.qs('#schRemindCustom');
              if (box) box.classList.toggle('hidden', rm.value !== 'custom');
            });
          }
        }
      });
    },

    // ---------- 目标 ----------
    openGoal: function (goal) {
      window.Views._goalThresholds = (goal && goal.thresholds ? goal.thresholds.map(function (t) { return Object.assign({}, t); }) : [
        { percent: 75, message: '钱包君已经瘦了 75%！剩下的日子要捏着花咯。', enabled: true },
        { percent: 80, message: '已到 80%，再这样下去月底就要吃土了…快刹车！', enabled: true },
        { percent: 90, message: '90% 警报！建议接下来只买必需品，奶茶先欠着。', enabled: true }
      ]);
      const catOpts = '<option value="">全部支出</option>' + S.categoriesByType('expense').map(function (c) {
        return '<option value="' + c.id + '"' + (goal && goal.categoryId === c.id ? ' selected' : '') + '>' + U.escapeHtml(c.name) + '</option>';
      }).join('');
      const html =
        '<div class="modal-head"><h3>' + (goal ? '编辑目标' : '新建目标') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>名称</span><input id="goalName" type="text" placeholder="如：本月总支出" value="' + (goal ? U.escapeHtml(goal.name) : '') + '"></div>' +
        '<div class="field"><span>周期</span><select id="goalPeriod"><option value="month"' + (!goal || goal.period === 'month' ? ' selected' : '') + '>月度</option><option value="week"' + (goal && goal.period === 'week' ? ' selected' : '') + '>周度</option><option value="day"' + (goal && goal.period === 'day' ? ' selected' : '') + '>每日</option></select></div>' +
        '<div class="field"><span>目标金额（步进 100）</span><input id="goalAmount" type="number" step="100" min="1" value="' + (goal ? goal.amount : '') + '"></div>' +
        '<div class="field"><span>适用范围</span><select id="goalCategory">' + catOpts + '</select></div>' +
        '</div>' +
        '<div class="field"><span>阈值提醒（可设置多个）</span><div class="chip-grid" id="goalThresholdRows"></div></div>' +
        '<button class="ghost-btn compact" type="button" data-action="goal-add-threshold">' + U.icon('plus', 15) + ' 添加阈值</button>' +
        '</div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-goal">' + (goal ? '保存' : '创建') + '</button></div>';
      this.open(html, { onMount: function () { Modals.updateGoalThresholds(); } });
    },

    updateGoalThresholds: function () {
      const box = U.qs('#goalThresholdRows');
      if (!box) return;
      const EXAMPLES = [
        { label: '俏皮', msg: '钱包君已经瘦了 X%！剩下的日子要捏着花咯。' },
        { label: '温柔', msg: '已经用了 X%，记得给月底的自己留点余粮。' },
        { label: '严肃', msg: 'X% 警报！建议只买必需品，奶茶先欠着。' },
        { label: '奖励式', msg: '用到 X% 啦，接下来每省一笔都是月底的小惊喜。' }
      ];
      box.innerHTML = window.Views._goalThresholds.map(function (t, i) {
        const chips = EXAMPLES.map(function (ex) {
          const filled = ex.msg.replace('X%', t.percent + '%');
          return '<button class="example-chip" type="button" data-action="goal-th-example" data-idx="' + i + '" data-msg="' + U.escapeHtml(filled) + '">' + U.escapeHtml(ex.label) + '</button>';
        }).join('');
        return '<div class="threshold-block">' +
          '<div class="threshold-row"><input type="number" min="1" max="100" value="' + t.percent + '" data-th-idx="' + i + '" title="百分比">' +
          '<input type="text" value="' + U.escapeHtml(t.message) + '" data-th-idx="' + i + '" placeholder="提醒文案" title="提醒文案">' +
          '<label class="switch" title="启用"><input type="checkbox" data-th-idx="' + i + '"' + (t.enabled !== false ? ' checked' : '') + '><span class="track"></span></label>' +
          '<button class="icon-btn" type="button" data-action="goal-remove-threshold" data-idx="' + i + '" title="删除阈值">' + U.icon('trash', 16) + '</button></div>' +
          '<div class="threshold-examples"><span class="muted small">示例：</span>' + chips + '</div>' +
          '</div>';
      }).join('');
    },

    // ---------- 分类 ----------
    openCategory: function (cat, type) {
      const html =
        '<div class="modal-head"><h3>' + (cat ? '编辑大类' : '新建大类') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>类型</span><select id="catType"><option value="expense"' + ((!cat && type === 'expense') || (cat && cat.type === 'expense') ? ' selected' : '') + '>支出</option><option value="income"' + ((cat && cat.type === 'income') || (!cat && type === 'income') ? ' selected' : '') + '>收入</option></select></div>' +
        '<div class="field"><span>名称</span><input id="catName" type="text" placeholder="如：宠物" value="' + (cat ? U.escapeHtml(cat.name) : '') + '"></div>' +
        '<div class="field"><span>图标（emoji）</span><input id="catIcon" type="text" maxlength="4" value="' + (cat ? U.escapeHtml(cat.icon) : '🐾') + '" placeholder="🐾"></div>' +
        '<div class="field"><span>颜色</span><input id="catColor" type="color" value="' + (cat ? cat.color : '#8b5cf6') + '" style="height:40px"></div>' +
        '</div></div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-category">' + (cat ? '保存' : '创建') + '</button></div>';
      this.open(html);
    },

    openSub: function (catId, sub) {
      const html =
        '<div class="modal-head"><h3>' + (sub ? '编辑小类' : '添加小类') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>名称</span><input id="subName" type="text" placeholder="如：学费" value="' + (sub ? U.escapeHtml(sub.name) : '') + '"></div>' +
        '<div class="field"><span>颜色</span><input id="subColor" type="color" value="' + (sub ? sub.color : '#38bdf8') + '" style="height:40px"></div>' +
        '</div></div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-sub">' + (sub ? '保存' : '添加') + '</button></div>';
      this.open(html);
      window.Views._subTarget = { catId: catId, subId: sub ? sub.id : null };
    },

    openDetail: function (catId, subId, detail) {
      const html =
        '<div class="modal-head"><h3>' + (detail ? '编辑细分类' : '添加细分类') + '</h3><button class="icon-btn" type="button" data-action="close-modal">' + U.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-grid">' +
        '<div class="field"><span>名称</span><input id="detailName" type="text" placeholder="如：门诊挂号" value="' + (detail ? U.escapeHtml(detail.name) : '') + '"></div>' +
        '<div class="field"><span>颜色</span><input id="detailColor" type="color" value="' + (detail ? detail.color : '#22c55e') + '" style="height:40px"></div>' +
        '</div></div>' +
        '<div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">取消</button><button class="primary-btn" type="button" data-action="save-detail">' + (detail ? '保存' : '添加') + '</button></div>';
      this.open(html);
      window.Views._detailTarget = { catId: catId, subId: subId, detailId: detail ? detail.id : null };
    }
  };

  window.Modals = Modals;
})();
