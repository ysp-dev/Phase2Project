'use strict';
/* Main application controller — state, tabs, events, localStorage */

(function () {
  const LS_ITEMS = 'hd2_items_v2';
  const LS_PREFS = 'hd2_prefs_v1';

  // ── State ────────────────────────────────────────────────────────────────────
  const state = {
    tab:     'dashboard',
    items:   [],
    layout:  'side',
    fTask:   '전체',
    fCat:    '전체',
    fStatus: '전체',
    query:   '',
  };

  // ── Persistence ───────────────────────────────────────────────────────────────
  function seedCopy() {
    return window.PROJECT_DATA.SEED_ITEMS.map(it => Object.assign({}, it));
  }

  // 저장된 항목이 렌더러가 가정하는 구조/enum 값을 갖췄는지 검증.
  // 예전 스키마·손상 데이터로 인한 빈 화면/예외를 막고, 실패 시 seed로 복구.
  function isValidItems(arr) {
    if (!Array.isArray(arr)) return false;
    const D = window.PROJECT_DATA;
    return arr.every(it =>
      it && typeof it === 'object' &&
      typeof it.id === 'string' &&
      typeof it.title === 'string' &&
      typeof it.updatedAt === 'string' &&
      D.CATEGORY_STYLE[it.category] &&   // buildCatTag 에서 .fg 접근 → 필수
      D.STATUS_STYLE[it.status] &&       // 상태 배지 스타일 매핑 → 필수
      D.PRIORITY_STYLE[it.priority]      // 중요도 배지 스타일 매핑 → 필수
    );
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(LS_ITEMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidItems(parsed)) return parsed;
      }
    } catch (e) {}
    return seedCopy();
  }

  function saveItems() {
    try { localStorage.setItem(LS_ITEMS, JSON.stringify(state.items)); } catch (e) {}
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(LS_PREFS);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.tab)    state.tab    = p.tab;
        if (p.layout) state.layout = p.layout;
      }
    } catch (e) {}
  }

  function savePrefs() {
    try {
      localStorage.setItem(LS_PREFS, JSON.stringify({ tab: state.tab, layout: state.layout }));
    } catch (e) {}
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  function renderHeader() {
    const M = window.PROJECT_DATA.META;
    const titleEl = document.getElementById('brand-title');
    const DEPT = '여신IT개발부';
    if (M.title.startsWith(DEPT)) {
      // '여신IT개발부'만 색상 차별화
      titleEl.innerHTML = '';
      const dept = document.createElement('span');
      dept.className = 'brand-dept';
      dept.textContent = DEPT;
      titleEl.appendChild(dept);
      titleEl.appendChild(document.createTextNode(M.title.slice(DEPT.length)));
    } else {
      titleEl.textContent = M.title;
    }
    document.getElementById('brand-sub').textContent   = M.subtitle + ' · ' + M.period;
    const badge = document.getElementById('items-count-badge');
    if (badge) badge.textContent = state.items.length;
  }

  function renderTab() {
    // 패널: active 클래스 + hidden 속성 동기화
    document.querySelectorAll('.tab-panel').forEach(p => {
      const isActive = p.id === 'panel-' + state.tab;
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });
    // 탭 버튼: active 클래스 + aria-selected + 포커스 순서(roving tabindex)
    document.querySelectorAll('.tab-btn').forEach(b => {
      const isActive = b.dataset.tab === state.tab;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.tabIndex = isActive ? 0 : -1;
    });

    if (state.tab === 'dashboard') {
      renderDashboard(document.getElementById('panel-dashboard'), state.items);
    } else if (state.tab === 'gantt') {
      const container = document.getElementById('gantt-container');
      if (container) renderGantt(container);
    } else if (state.tab === 'items') {
      renderItemsTab();
    }

    renderHeader();
    savePrefs();
  }

  function renderItemsTab() {
    const container = document.getElementById('panel-items');
    if (!container) return;
    renderItems(container, state.items, {
      layout:   state.layout,
      fTask:    state.fTask,
      fCat:     state.fCat,
      fStatus:  state.fStatus,
      query:    state.query,
      onAdd:    addItem,
      onUpdate: updateItem,
      onDelete: deleteItem,
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  function addItem(item) {
    state.items = [item, ...state.items];
    saveItems();
    renderTab();
  }

  function updateItem(item) {
    state.items = state.items.map(x => x.id === item.id ? item : x);
    saveItems();
    renderTab();
  }

  function deleteItem(id) {
    state.items = state.items.filter(x => x.id !== id);
    saveItems();
    renderTab();
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  function bindEvents() {
    document.addEventListener('click', e => {
      const tabBtn = e.target.closest('.tab-btn');
      if (tabBtn && tabBtn.dataset.tab) {
        state.tab = tabBtn.dataset.tab;
        renderTab();
      }
    });

    document.addEventListener('items:filter', e => {
      const { key, val } = e.detail;
      state[key] = val;
      renderItemsTab();
      if (key === 'layout') savePrefs(); // 레이아웃 변경 즉시 영속화
    });
    document.addEventListener('items:resort', () => renderItemsTab());
    document.addEventListener('items:reset', () => {
      state.items = seedCopy();
      localStorage.removeItem(LS_ITEMS);
      renderTab();
    });
    document.addEventListener('app:switch-tab', e => {
      state.tab = e.detail;
      renderTab();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('modal-overlay');
        if (overlay && !overlay.classList.contains('hidden')) {
          overlay.classList.add('hidden');
          overlay.innerHTML = '';
        }
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    state.items = loadItems();
    loadPrefs();
    bindEvents();
    renderTab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
