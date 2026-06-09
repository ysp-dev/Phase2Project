'use strict';
/* Items management renderer — table / card / side panel + modal form */

(function () {
  const P = () => window.PROJECT_DATA;
  let _onAdd, _onUpdate, _onDelete;
  let _currentSideId = null;
  let _sortCol = null, _sortDir = 1;

  // ── DOM helpers ──────────────────────────────────────────────────────────────
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function div(cls)      { return el('div', cls); }
  function span(cls)     { return el('span', cls); }
  function h(n, cls)     { return el('h' + n, cls); }
  function btn(cls, txt) { const b = el('button', cls); if (txt) b.textContent = txt; return b; }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function taskName(id) {
    const t = P().TASKS.find(t => t.id === id);
    return t ? t.group : '—';
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Badge ─────────────────────────────────────────────────────────────────────
  function buildBadge(text, style, small) {
    const s = span('badge' + (small ? ' sm' : ''));
    s.style.background = style.bg;
    s.style.color      = style.fg;
    if (style.dot) {
      const dot = span('badge-dot');
      dot.style.background = style.dot;
      s.appendChild(dot);
    }
    s.appendChild(document.createTextNode(text));
    return s;
  }

  function buildCatTag(cat) {
    const cs = P().CATEGORY_STYLE[cat];
    const s = span('cat-tag');
    s.style.color = cs.fg;
    const icon = span('cat-icon');
    icon.textContent = cs.icon;
    s.appendChild(icon);
    s.appendChild(document.createTextNode(cat));
    return s;
  }

  function buildTag(text) {
    const s = span('tag');
    s.textContent = text;
    return s;
  }

  function buildRowActions(item, onEdit, onDel) {
    const wrap = div('row-actions');
    const editBtn = btn('btn-action edit', '수정');
    const delBtn  = btn('btn-action delete', '삭제');
    editBtn.addEventListener('click', e => { e.stopPropagation(); onEdit(item); });
    delBtn.addEventListener('click',  e => { e.stopPropagation(); onDel(item); });
    wrap.appendChild(editBtn);
    wrap.appendChild(delBtn);
    return wrap;
  }

  function buildEmpty() {
    const d = div('empty-state');
    d.textContent = '해당 조건의 주요사항이 없습니다.';
    return d;
  }

  // ── Table layout ──────────────────────────────────────────────────────────────
  function buildTable(rows, onEdit, onDel) {
    const wrap = div('items-table-wrap');
    if (!rows.length) { wrap.appendChild(buildEmpty()); return wrap; }

    const table = el('table', 'items-table');
    const thead = el('thead');
    const hrow  = el('tr');

    const cols = [
      { key: 'category', label: '구분',      sortable: true  },
      { key: 'title',    label: '제목 / 내용', sortable: true  },
      { key: 'taskId',   label: '과제',       sortable: true  },
      { key: 'phase',    label: '단계',       sortable: true  },
      { key: 'status',   label: '상태',       sortable: true  },
      { key: 'priority', label: '중요도',     sortable: true  },
      { key: '_actions', label: '관리',       sortable: false, align: 'right' },
    ];

    cols.forEach(col => {
      const th = el('th');
      th.textContent = col.label;
      if (col.align) th.style.textAlign = col.align;
      if (col.sortable) {
        th.dataset.sort = col.key;
        if (_sortCol === col.key) th.classList.add(_sortDir === 1 ? 'sort-asc' : 'sort-desc');
        th.addEventListener('click', () => {
          if (_sortCol === col.key) _sortDir *= -1;
          else { _sortCol = col.key; _sortDir = 1; }
          document.dispatchEvent(new CustomEvent('items:resort'));
        });
      }
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = el('tbody');
    rows.forEach(item => {
      const tr = el('tr');

      const tdCat = el('td');
      tdCat.appendChild(buildCatTag(item.category));
      tr.appendChild(tdCat);

      const tdTitle = el('td');
      const titleDiv = div('cell-title');
      titleDiv.textContent = item.title;
      const contentDiv = div('cell-content');
      contentDiv.textContent = item.content;
      tdTitle.appendChild(titleDiv);
      tdTitle.appendChild(contentDiv);
      tr.appendChild(tdTitle);

      const tdTask = el('td');
      tdTask.style.cssText = 'font-size:12.5px;font-weight:600;white-space:nowrap';
      tdTask.textContent = taskName(item.taskId);
      tr.appendChild(tdTask);

      const tdPhase = el('td');
      tdPhase.style.cssText = 'font-size:12px;font-weight:600;color:#666;white-space:nowrap';
      tdPhase.textContent = item.phase;
      tr.appendChild(tdPhase);

      const tdStatus = el('td');
      tdStatus.appendChild(buildBadge(item.status, P().STATUS_STYLE[item.status], true));
      tr.appendChild(tdStatus);

      const tdPri = el('td');
      tdPri.appendChild(buildBadge(item.priority, P().PRIORITY_STYLE[item.priority], true));
      tr.appendChild(tdPri);

      const tdAct = el('td');
      tdAct.style.textAlign = 'right';
      tdAct.style.whiteSpace = 'nowrap';
      tdAct.appendChild(buildRowActions(item,
        it => openModal(it, false),
        it => handleDelete(it)
      ));
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // ── Card layout ───────────────────────────────────────────────────────────────
  function buildCards(rows, onEdit, onDel) {
    if (!rows.length) {
      const wrap = div('');
      wrap.style.cssText = 'border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface)';
      wrap.appendChild(buildEmpty());
      return wrap;
    }
    const grid = div('items-cards');
    rows.forEach(item => {
      const cs = P().CATEGORY_STYLE[item.category];
      const card = div('item-card');
      card.style.borderTop = '3px solid ' + cs.fg;

      const top = div('card-top');
      top.appendChild(buildCatTag(item.category));
      top.appendChild(buildBadge(item.status, P().STATUS_STYLE[item.status], true));
      card.appendChild(top);

      const body = div('card-body');
      const title = div('card-title');
      title.textContent = item.title;
      const text = div('card-text');
      text.textContent = item.content;
      body.appendChild(title);
      body.appendChild(text);
      card.appendChild(body);

      const tags = div('card-tags');
      tags.appendChild(buildTag(taskName(item.taskId)));
      tags.appendChild(buildTag(item.phase));
      tags.appendChild(buildBadge('중요도 ' + item.priority, P().PRIORITY_STYLE[item.priority], true));
      card.appendChild(tags);

      const footer = div('card-footer');
      const date = span('card-date');
      date.textContent = '최종수정 ' + item.updatedAt;
      footer.appendChild(date);
      footer.appendChild(buildRowActions(item,
        it => openModal(it, false),
        it => handleDelete(it)
      ));
      card.appendChild(footer);
      grid.appendChild(card);
    });
    return grid;
  }

  // ── Side panel layout ─────────────────────────────────────────────────────────
  function buildSide(rows) {
    const container = div('items-side');
    const list = div('side-list');

    const detail = div('side-detail');

    function showDetail(item) {
      if (!item) { detail.innerHTML = ''; return; }
      _currentSideId = item.id;

      // update active state in list
      list.querySelectorAll('.side-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === item.id);
        const cs = P().CATEGORY_STYLE[el.dataset.cat];
        el.style.borderLeftColor = el.dataset.id === item.id ? cs.fg : 'transparent';
      });

      detail.innerHTML = '';

      const top = div('detail-top');
      top.appendChild(buildCatTag(item.category));
      top.appendChild(buildRowActions(item,
        it => openModal(it, false),
        it => handleDelete(it)
      ));
      detail.appendChild(top);

      const title = h(2, 'detail-title');
      title.textContent = item.title;
      detail.appendChild(title);

      const tags = div('detail-tags');
      tags.appendChild(buildBadge(item.status, P().STATUS_STYLE[item.status]));
      tags.appendChild(buildBadge('중요도 ' + item.priority, P().PRIORITY_STYLE[item.priority]));
      tags.appendChild(buildTag(taskName(item.taskId)));
      tags.appendChild(buildTag(item.phase));
      detail.appendChild(tags);

      const body = div('detail-body');
      body.textContent = item.content || '—';
      detail.appendChild(body);

      const footer = div('detail-footer');
      footer.textContent = '최종수정 ' + item.updatedAt;
      detail.appendChild(footer);
    }

    if (!rows.length) {
      list.appendChild(buildEmpty());
    } else {
      rows.forEach(item => {
        const cs = P().CATEGORY_STYLE[item.category];
        const si = div('side-item');
        si.dataset.id  = item.id;
        si.dataset.cat = item.category;

        const top = div('side-item-top');
        top.appendChild(buildCatTag(item.category));
        const dot = span('side-item-dot');
        dot.style.background = P().STATUS_STYLE[item.status].dot;
        top.appendChild(dot);
        si.appendChild(top);

        const t = div('side-item-title');
        t.textContent = item.title;
        si.appendChild(t);

        const meta = div('side-item-meta');
        meta.textContent = taskName(item.taskId) + ' · ' + item.phase;
        si.appendChild(meta);

        si.addEventListener('click', () => showDetail(item));
        list.appendChild(si);
      });

      const initial = rows.find(r => r.id === _currentSideId) || rows[0];
      showDetail(initial);
    }

    container.appendChild(list);
    container.appendChild(detail);
    return container;
  }

  // ── Summary stats ─────────────────────────────────────────────────────────────
  function buildStats(items) {
    const wrap = div('items-stats');
    const counts = [
      { n: items.length, label: '전체' },
      { n: items.filter(i => i.category === '이슈/리스크').length, label: '이슈/리스크', color: '#F46600' },
      { n: items.filter(i => i.status === '지연').length, label: '지연',   color: '#FF0000' },
      { n: items.filter(i => i.priority === '높음').length, label: '중요도 높음', color: '#C20000' },
    ];
    counts.forEach(c => {
      const stat = div('mini-stat');
      const n = span('mini-stat-n');
      n.textContent = c.n;
      if (c.color) n.style.color = c.color;
      const lbl = span('mini-stat-label');
      lbl.textContent = c.label;
      stat.appendChild(n);
      stat.appendChild(lbl);
      wrap.appendChild(stat);
    });
    return wrap;
  }

  // ── Filters ───────────────────────────────────────────────────────────────────
  function buildFilter(value, options, allLabel, onChange) {
    const sel = document.createElement('select');
    sel.className = 'filter-select';
    const allOpt = document.createElement('option');
    allOpt.value = '전체';
    allOpt.textContent = allLabel;
    sel.appendChild(allOpt);
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value   = o.v  || o;
      opt.textContent = o.label || o;
      sel.appendChild(opt);
    });
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }

  // ── Export CSV ────────────────────────────────────────────────────────────────
  function exportCSV(items) {
    const cols = ['id','category','title','content','taskId','phase','status','priority','updatedAt'];
    const header = ['구분','분류','제목','내용','관련 과제','관련 단계','상태','중요도','최종수정일'];
    const rows = items.map(it => [
      it.id, it.category, it.title, it.content,
      taskName(it.taskId), it.phase, it.status, it.priority, it.updatedAt,
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    const csv = '﻿' + header.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href  = url;
    a.download = '주요사항_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Modal form ────────────────────────────────────────────────────────────────
  function openModal(initial, isNew) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    overlay.innerHTML = '';

    const form = Object.assign({}, initial, { _isNew: isNew });

    const dialog = div('modal-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // Header
    const mHeader = div('modal-header');
    const mTitle  = h(3, 'modal-title');
    mTitle.textContent = isNew ? '주요사항 등록' : '주요사항 수정';
    const mClose  = btn('modal-close');
    mClose.innerHTML = '&times;';
    mClose.setAttribute('aria-label', '닫기');
    mClose.addEventListener('click', closeModal);
    mHeader.appendChild(mTitle);
    mHeader.appendChild(mClose);
    dialog.appendChild(mHeader);

    // Body
    const mBody = div('modal-body');

    function fieldSet(labelText, required, content) {
      const f = div('form-field');
      const lbl = span('form-label');
      lbl.textContent = labelText;
      if (required) { const req = span('req'); req.textContent = ' *'; lbl.appendChild(req); }
      f.appendChild(lbl);
      f.appendChild(content);
      return f;
    }

    function chips(opts, val, key) {
      const wrap = div('form-chips');
      opts.forEach(o => {
        const c = btn('chip' + (val === o ? ' active' : ''), o);
        c.type = 'button';
        c.addEventListener('click', () => {
          form[key] = o;
          wrap.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('active', ch.textContent === o));
        });
        wrap.appendChild(c);
      });
      return wrap;
    }

    // Category chips
    mBody.appendChild(fieldSet('구분', false, chips(P().CATEGORIES, form.category, 'category')));

    // Task + Phase selects
    const grid1 = div('form-grid-2');
    const taskSel = document.createElement('select');
    taskSel.className = 'form-select';
    P().TASKS.forEach(t => {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.group;
      taskSel.appendChild(o);
    });
    taskSel.value = form.taskId;
    taskSel.addEventListener('change', () => { form.taskId = taskSel.value; });
    grid1.appendChild(fieldSet('관련 과제', false, taskSel));

    const phaseSel = document.createElement('select');
    phaseSel.className = 'form-select';
    P().PHASE_OPTIONS.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p;
      phaseSel.appendChild(o);
    });
    phaseSel.value = form.phase;
    phaseSel.addEventListener('change', () => { form.phase = phaseSel.value; });
    grid1.appendChild(fieldSet('관련 단계', false, phaseSel));
    mBody.appendChild(grid1);

    // Title
    const titleInput = document.createElement('input');
    titleInput.className = 'form-input';
    titleInput.value = form.title;
    titleInput.placeholder = '핵심 내용을 한 줄로 입력';
    titleInput.addEventListener('input', () => {
      form.title = titleInput.value;
      saveBtn.disabled = !form.title.trim();
    });
    mBody.appendChild(fieldSet('제목', true, titleInput));

    // Content
    const contentTa = document.createElement('textarea');
    contentTa.className = 'form-textarea';
    contentTa.value = form.content;
    contentTa.placeholder = '배경·영향·대응방안 등을 입력';
    contentTa.addEventListener('input', () => { form.content = contentTa.value; });
    mBody.appendChild(fieldSet('내용', false, contentTa));

    // Status + Priority
    const grid2 = div('form-grid-2');
    grid2.appendChild(fieldSet('상태', false, chips(P().STATUSES,   form.status,   'status')));
    grid2.appendChild(fieldSet('중요도', false, chips(P().PRIORITIES, form.priority, 'priority')));
    mBody.appendChild(grid2);

    dialog.appendChild(mBody);

    // Footer
    const mFooter = div('modal-footer');
    const cancelBtn = btn('btn-cancel', '취소');
    const saveBtn   = btn('btn-save', isNew ? '등록' : '저장');
    saveBtn.disabled = !form.title.trim();

    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', () => handleSave(form));
    mFooter.appendChild(cancelBtn);
    mFooter.appendChild(saveBtn);
    dialog.appendChild(mFooter);

    overlay.appendChild(dialog);

    // Close on backdrop
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) closeModal();
    });

    // Focus title
    setTimeout(() => titleInput.focus(), 50);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  function handleSave(form) {
    // 저장 시각은 한국 시간(KST) 기준 날짜 — UTC(toISOString)는 밤 시간대에 하루 어긋남
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()); // 'YYYY-MM-DD'
    if (form._isNew) {
      _onAdd({ ...form, id: 'it-' + Date.now(), updatedAt: today });
    } else {
      _onUpdate({ ...form, updatedAt: today });
    }
    closeModal();
  }

  function handleDelete(item) {
    if (confirm('『' + item.title + '』\n\n해당 주요사항을 삭제하시겠습니까?')) {
      if (_currentSideId === item.id) _currentSideId = null;
      _onDelete(item.id);
    }
  }

  // ── Dashboard panel ───────────────────────────────────────────────────────────
  function renderDashboard(container, items) {
    container.innerHTML = '';

    // Summary stat cards
    const grid = div('dashboard-grid');
    const statDefs = [
      { value: items.length,                                       label: '전체 주요사항',  detail: '등록 항목 수' },
      { value: items.filter(i => i.category === '이슈/리스크').length, label: '이슈 / 리스크',  color: '#F46600' },
      { value: items.filter(i => i.status === '지연').length,       label: '지연 항목',      color: '#C20000' },
      { value: items.filter(i => i.status === '진행중').length,     label: '진행 중',        color: '#8A6A00' },
      { value: items.filter(i => i.status === '완료').length,       label: '완료',           color: '#0047B3' },
      { value: items.filter(i => i.priority === '높음').length,     label: '중요도 높음',    color: '#C20000' },
    ];
    statDefs.forEach(s => {
      const card = div('stat-card');
      const val  = div('stat-card-value');
      val.textContent = s.value;
      if (s.color) val.style.color = s.color;
      const lbl = div('stat-card-label');
      lbl.textContent = s.detail ? s.label + ' · ' + s.detail : s.label;
      card.appendChild(val);
      card.appendChild(lbl);
      grid.appendChild(card);
    });
    container.appendChild(grid);

    // 과제별 주요사항 처리율 (완료 / 전체) — 일정 진척률이 아님에 주의
    const progress = div('dashboard-section');
    const progTitle = div('section-title');
    progTitle.textContent = '과제별 주요사항 처리율';
    progress.appendChild(progTitle);
    const progList = div('progress-list');
    P().TASKS.forEach(task => {
      const taskItems = items.filter(i => i.taskId === task.id);
      const done = taskItems.filter(i => i.status === '완료').length;
      const total = taskItems.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      const row = div('progress-row');
      const lbl = div('progress-label');
      lbl.textContent = task.group;
      const barWrap = div('progress-bar-wrap');
      const bar = div('progress-bar');
      bar.style.width = pct + '%';
      barWrap.appendChild(bar);
      const pctDiv = div('progress-pct');
      pctDiv.textContent = total ? (done + '/' + total) : '—';
      row.appendChild(lbl);
      row.appendChild(barWrap);
      row.appendChild(pctDiv);
      progList.appendChild(row);
    });
    progress.appendChild(progList);
    container.appendChild(progress);

    // Recent items (updated last 7 days or just top 5)
    const recent = div('dashboard-section');
    const recTitle = div('section-title');
    recTitle.textContent = '최근 주요사항';
    recent.appendChild(recTitle);
    const recList = div('recent-list');
    const recItems = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    if (recItems.length === 0) {
      const e = div('empty-state');
      e.textContent = '등록된 주요사항이 없습니다.';
      recList.appendChild(e);
    } else {
      recItems.forEach(item => {
        const cs = P().CATEGORY_STYLE[item.category];
        const ri = div('recent-item');
        ri.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 'items' }));
        });
        const main = div('recent-item-main');
        const title = div('recent-item-title');
        title.textContent = item.title;
        const meta = div('recent-item-meta');
        meta.textContent = item.category + ' · ' + taskName(item.taskId) + ' · ' + item.updatedAt;
        main.appendChild(title);
        main.appendChild(meta);
        ri.appendChild(main);
        ri.appendChild(buildBadge(item.status, P().STATUS_STYLE[item.status], true));
        recList.appendChild(ri);
      });
    }
    recent.appendChild(recList);
    container.appendChild(recent);
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  function renderItems(container, items, { layout, fTask, fCat, fStatus, query, onAdd, onUpdate, onDelete }) {
    _onAdd    = onAdd;
    _onUpdate = onUpdate;
    _onDelete = onDelete;

    container.innerHTML = '';

    // Apply filters
    let rows = items.filter(it => {
      if (fTask   !== '전체' && it.taskId   !== fTask)   return false;
      if (fCat    !== '전체' && it.category !== fCat)    return false;
      if (fStatus !== '전체' && it.status   !== fStatus) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!(it.title + it.content).toLowerCase().includes(q)) return false;
      }
      return true;
    });

    // Sort
    if (_sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[_sortCol] || '');
        const bv = String(b[_sortCol] || '');
        return _sortDir * av.localeCompare(bv, 'ko');
      });
    }

    // ── Toolbar ──
    const toolbar = div('items-toolbar');
    toolbar.appendChild(buildStats(items));

    const toolbarRight = div('');
    toolbarRight.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';

    // Export CSV
    const expBtn = btn('btn-export');
    expBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV 내보내기';
    expBtn.addEventListener('click', () => exportCSV(rows));
    toolbarRight.appendChild(expBtn);

    // Add btn
    const addBtn = btn('btn-add');
    addBtn.innerHTML = '<span class="btn-add-icon">+</span> 주요사항 등록';
    addBtn.addEventListener('click', () => openModal({
      _isNew: true, id: null,
      category: '이슈/리스크', taskId: P().TASKS[0].id,
      title: '', content: '', status: '진행중', priority: '보통', phase: '분석',
    }, true));
    toolbarRight.appendChild(addBtn);
    toolbar.appendChild(toolbarRight);
    container.appendChild(toolbar);

    // ── Filters ──
    const filters = div('items-filters');
    filters.appendChild(buildFilter(fTask,   P().TASKS.map(t => ({ v: t.id, label: t.group })), '전체 과제',
      v => document.dispatchEvent(new CustomEvent('items:filter', { detail: { key: 'fTask', val: v } }))));
    filters.appendChild(buildFilter(fCat,    P().CATEGORIES, '전체 구분',
      v => document.dispatchEvent(new CustomEvent('items:filter', { detail: { key: 'fCat', val: v } }))));
    filters.appendChild(buildFilter(fStatus, P().STATUSES, '전체 상태',
      v => document.dispatchEvent(new CustomEvent('items:filter', { detail: { key: 'fStatus', val: v } }))));

    const searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.type = 'search';
    searchInput.placeholder = '제목·내용 검색';
    searchInput.value = query;
    searchInput.addEventListener('input', () =>
      document.dispatchEvent(new CustomEvent('items:filter', { detail: { key: 'query', val: searchInput.value } }))
    );
    filters.appendChild(searchInput);

    const countSpan = span('filter-result-count');
    countSpan.textContent = rows.length + '건 표시';
    filters.appendChild(countSpan);

    // Layout toggle + reset
    const layoutToggle = div('layout-toggle');
    [
      { k: 'side',  svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>', label: '사이드 패널' },
      { k: 'card',  svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', label: '카드' },
      { k: 'table', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>', label: '테이블' },
    ].forEach(({ k, svg, label }) => {
      const b = btn('layout-btn' + (layout === k ? ' active' : ''));
      b.innerHTML = svg;
      b.title = label;
      b.addEventListener('click', () =>
        document.dispatchEvent(new CustomEvent('items:filter', { detail: { key: 'layout', val: k } }))
      );
      layoutToggle.appendChild(b);
    });
    filters.appendChild(layoutToggle);

    // Reset demo
    const resetBtn = btn('btn-reset-demo', '예시 데이터로 초기화');
    resetBtn.addEventListener('click', () => {
      if (confirm('등록한 주요사항을 모두 초기화하고 기본 예시로 되돌립니다.\n계속하시겠습니까?')) {
        document.dispatchEvent(new CustomEvent('items:reset'));
      }
    });
    filters.appendChild(resetBtn);

    container.appendChild(filters);

    // ── Content ──
    let content;
    if (layout === 'table') {
      content = buildTable(rows,
        it => openModal(it, false),
        it => handleDelete(it)
      );
    } else if (layout === 'card') {
      content = buildCards(rows,
        it => openModal(it, false),
        it => handleDelete(it)
      );
    } else {
      content = buildSide(rows);
    }
    container.appendChild(content);
  }

  window.renderItems     = renderItems;
  window.renderDashboard = renderDashboard;
  window.openItemModal   = (item, isNew) => openModal(item, isNew);
})();
