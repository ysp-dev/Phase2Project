'use strict';
/* Gantt chart renderer — 2026 redesign, single style */

(function () {
  const P = () => window.PROJECT_DATA;
  const pct = v => (v / P().TOTAL_MONTHS) * 100 + '%';

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function div(cls) { return el('div', cls); }
  function span(cls) { return el('span', cls); }

  // 과제 하위 뱃지 색상 — 과제 좌측 컬러바와 동일한 KB 액센트 6색
  const BADGE_COLORS = ['#FFBC00', '#F46600', '#4D9FFF', '#00C896', '#FF5C8D', '#A78BFA'];
  // '#RRGGBB' + alpha → rgba()
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }

  // 월 내 균등 주간 눈금 위치(0~1) 목록.
  // 위치는 균등 분할하되 개수만 일수에 따라 차등 →
  //  · 28일(2월) = 4주 → 눈금 3개 (1/4,2/4,3/4)
  //  · 30·31일    = 5주 → 눈금 4개 (1/5…4/5)
  function weekTickFractions(days) {
    const segments = Math.ceil(days / 7); // 주(週) 개수
    const out = [];
    for (let k = 1; k < segments; k++) out.push(k / segments);
    return out;
  }

  // ── Grid lines ───────────────────────────────────────────────────────────────
  function buildGrid() {
    const wrap = div('g-grid');
    P().MONTHS.forEach((mo, i) => {
      const line = div(mo.year ? 'g-gridline g-gridline--year' : 'g-gridline');
      line.style.left = pct(i);
      wrap.appendChild(line);
      // week sub-gridlines — 균등 주간 눈금(일수에 따라 개수만 차등)
      weekTickFractions(mo.days).forEach(frac => {
        const wl = div('g-gridline g-gridline--week');
        wl.style.left = pct(i + frac);
        wrap.appendChild(wl);
      });
    });
    return wrap;
  }

  // ── Today line ───────────────────────────────────────────────────────────────
  function buildTodayLine(showBadge) {
    const d = div('g-today');
    d.style.left = pct(P().TODAY_INDEX);
    if (showBadge) {
      const badge = div('g-today-badge');
      // "2026.06.09" → "6/9"
      const parts = P().META.todayLabel.split('.');
      badge.textContent = parts[1].replace(/^0/, '') + '/' + parts[2].replace(/^0/, '');
      d.appendChild(badge);
    }
    return d;
  }

  // ── 요약(전체 단계) 행 전용 옐로우톤 팔레트 ───────────────────────────────────
  // 단계가 진행될수록 밝은 노랑 → 짙은 골드/앰버로 짙어지는 단색 그라데이션
  const SUMMARY_COLORS = {
    '사전준비': { color: '#FFF1B8', text: '#5A4A00' }, // 연노랑
    '분석':     { color: '#FFDD33', text: '#3A2E00' }, // 노랑
    '설계':     { color: '#FFC107', text: '#3A2A00' }, // 진노랑
    '개발':     { color: '#F5A300', text: '#3A2600' }, // 앰버
    '테스트':   { color: '#E08700', text: '#FFFFFF' }, // 골드
    '이행':     { color: '#C77400', text: '#FFFFFF' }, // 진골드
    '안정화':   { color: '#9E5E00', text: '#FFE6B0' }, // 다크앰버
  };

  function buildSummaryBar(phase) {
    const pt = SUMMARY_COLORS[phase.type] || P().PHASE_TYPES[phase.type];
    const bar = div('g-bar');
    bar.style.left       = pct(phase.start);
    bar.style.width      = pct(phase.dur);
    bar.style.background = pt.color;
    bar.style.color      = pt.text;
    bar.setAttribute('title', phase.label);
    if (phase.dur >= 1) {
      const label = span('g-bar-label');
      label.textContent = phase.label;
      bar.appendChild(label);
    }
    return bar;
  }

  // ── Phase bar ────────────────────────────────────────────────────────────────
  function buildBar(phase) {
    const pt = P().PHASE_TYPES[phase.type];
    const bar = div('g-bar' + (phase.type === '사전준비' ? ' g-bar--prep' : ''));
    bar.style.left       = pct(phase.start);
    bar.style.width      = pct(phase.dur);
    bar.style.background = pt.color;
    bar.style.color      = pt.text;
    bar.setAttribute('title', phase.label);
    if (phase.dur >= 1) {
      const label = span('g-bar-label');
      label.textContent = phase.label;
      bar.appendChild(label);
    }
    return bar;
  }

  // ── Milestone marker ─────────────────────────────────────────────────────────
  function buildMilestone(ms) {
    const isStar  = ms.kind === 'star';
    const nearEnd = ms.index > 17.5;
    const wrap = div('g-ms');
    wrap.style.left = pct(ms.index);

    const lbl = div('g-ms-label' + (isStar ? ' g-ms-label--star' : ''));
    lbl.textContent = ms.label;
    if (nearEnd) lbl.classList.add('g-ms-label--end');
    wrap.appendChild(lbl);

    const diamond = div('g-ms-diamond' + (isStar ? ' g-ms-diamond--star' : ''));
    wrap.appendChild(diamond);
    return wrap;
  }

  // ── Month header ─────────────────────────────────────────────────────────────
  function buildMonthHeader() {
    const header = div('g-header');
    header.appendChild(div('g-label-col'));

    const todayMon = Math.floor(P().TODAY_INDEX);
    const tl = div('g-header-tl');
    P().MONTHS.forEach((mo, i) => {
      const cell = div('g-header-cell' + (i === todayMon ? ' g-header-cell--today' : ''));
      const mLabel = span('g-header-m');
      mLabel.textContent = mo.m;
      const numLabel = span(mo.year ? 'g-header-num g-header-num--year' : 'g-header-num');
      numLabel.textContent = mo.year ? mo.year : mo.label;
      cell.appendChild(mLabel);
      cell.appendChild(numLabel);

      // week tick marks — 균등 주간 눈금(일수에 따라 개수만 차등)
      const weekWrap = div('g-week-ticks');
      weekTickFractions(mo.days).forEach(frac => {
        const tick = div('g-week-tick');
        tick.style.left = (frac * 100) + '%';
        weekWrap.appendChild(tick);
      });
      cell.appendChild(weekWrap);

      tl.appendChild(cell);
    });
    header.appendChild(tl);
    return header;
  }

  // ── Timeline cell (phases + grid + today) ────────────────────────────────────
  function buildTimeline(phases, showTodayBadge, milestones) {
    const cell = div('g-timeline');
    cell.appendChild(buildGrid());
    phases.forEach(ph => cell.appendChild(buildBar(ph)));
    cell.appendChild(buildTodayLine(showTodayBadge));
    if (milestones) milestones.forEach(ms => cell.appendChild(buildMilestone(ms)));
    return cell;
  }

  // ── Summary row ───────────────────────────────────────────────────────────────
  function buildSummaryRow() {
    const row = div('g-row g-row--summary');
    const lc = div('g-label-col');
    const lbl = div('g-label g-label--full');
    lbl.textContent = '전체 단계';
    lc.appendChild(lbl);
    row.appendChild(lc);

    const cell = div('g-timeline');
    cell.appendChild(buildGrid());
    P().OVERALL_PHASES.forEach(ph => cell.appendChild(buildSummaryBar(ph)));
    cell.appendChild(buildTodayLine(false));
    row.appendChild(cell);
    return row;
  }

  // ── Milestone row ─────────────────────────────────────────────────────────────
  function buildMilestoneRow() {
    const row = div('g-row g-row--milestone');
    const lc = div('g-label-col');
    const lbl = div('g-label g-label--full g-label--muted');
    lbl.textContent = '주요 마일스톤';
    lc.appendChild(lbl);
    row.appendChild(lc);
    row.appendChild(buildTimeline([], true, P().MILESTONES));
    return row;
  }

  // ── Task row ──────────────────────────────────────────────────────────────────
  function buildTaskRow(taskGroup, rowData, isFirst, rowIndex) {
    const row = div('g-row g-row--task' + (rowIndex % 2 === 1 ? ' g-row--alt' : ''));
    if (isFirst) row.dataset.taskId = taskGroup.id;

    const lc = div('g-label-col');
    if (taskGroup.rows.length === 1) {
      const lbl = div('g-label g-label--full');
      const name = span('g-label-name');
      name.textContent = taskGroup.group;
      lbl.appendChild(name);
      if (taskGroup.badges && taskGroup.badges.length) {
        const badges = div('g-label-badges');
        taskGroup.badges.forEach((t, bi) => {
          const c = BADGE_COLORS[bi % BADGE_COLORS.length];
          const badge = span('g-label-badge');
          badge.textContent = t;
          badge.style.color       = c;
          badge.style.background   = hexA(c, 0.14);
          badge.style.borderColor  = hexA(c, 0.42);
          badges.appendChild(badge);
        });
        lbl.appendChild(badges);
      }
      lc.appendChild(lbl);
    } else {
      const grp = div('g-label g-label--group');
      if (isFirst) grp.textContent = taskGroup.group;
      lc.appendChild(grp);
      const sub = div('g-label g-label--sub');
      sub.textContent = rowData.name;
      lc.appendChild(sub);
    }
    row.appendChild(lc);
    row.appendChild(buildTimeline(rowData.phases, false, null));
    return row;
  }

  // ── Legend ────────────────────────────────────────────────────────────────────
  function buildLegend() {
    const wrap = div('g-legend');
    const phases = div('g-legend-phases');
    P().PHASE_ORDER.forEach(key => {
      const pt = P().PHASE_TYPES[key];
      const item = div('g-legend-item');
      const dot = span('g-legend-dot');
      dot.style.background = pt.color;
      if (key === '사전준비') dot.style.border = '1.5px solid #C8C3B4';
      const lbl = span('g-legend-label');
      lbl.textContent = key;
      item.appendChild(dot);
      item.appendChild(lbl);
      phases.appendChild(item);
    });
    wrap.appendChild(phases);

    const todayItem = div('g-legend-today');
    const line = span('g-legend-today-line');
    const lbl = span('g-legend-label');
    lbl.textContent = '기준일 ' + P().META.todayLabel;
    todayItem.appendChild(line);
    todayItem.appendChild(lbl);
    wrap.appendChild(todayItem);
    return wrap;
  }

  // ── 막대 라벨 자동 축소 ────────────────────────────────────────────────────────
  // 막대 폭보다 단계명이 길면 잘림(…) 대신 폰트를 줄여 한 줄로 맞춤
  const LABEL_BASE = 14, LABEL_MIN = 8;
  function fitBarLabels(container) {
    // 컨테이너가 아직 화면에 없으면(폭 0) 측정 불가 → 다음 기회에
    if (!container || container.clientWidth === 0) return;
    container.querySelectorAll('.g-bar-label').forEach(lbl => {
      let fs = LABEL_BASE;
      lbl.style.fontSize = fs + 'px';
      // 내용(scrollWidth)이 막대 안쪽(clientWidth)보다 넓으면 폰트 축소
      while (lbl.scrollWidth > lbl.clientWidth + 0.5 && fs > LABEL_MIN) {
        fs -= 0.5;
        lbl.style.fontSize = fs + 'px';
      }
    });
  }

  // 컨테이너 크기가 잡히거나 바뀔 때마다(숨김→표시, 창 리사이즈 포함) 재맞춤
  let _ro = null;
  function observeFit(container) {
    if (typeof ResizeObserver === 'undefined') {
      requestAnimationFrame(() => fitBarLabels(container));
      return;
    }
    if (_ro) _ro.disconnect();
    _ro = new ResizeObserver(() => fitBarLabels(container));
    _ro.observe(container);
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  function renderGantt(container) {
    container.innerHTML = '';
    container.appendChild(buildLegend());

    const chart = div('g-chart');
    chart.appendChild(buildMonthHeader());
    chart.appendChild(buildMilestoneRow());
    chart.appendChild(buildSummaryRow());

    let rowIndex = 0;
    P().TASKS.forEach(group => {
      group.rows.forEach((row, ri) => {
        chart.appendChild(buildTaskRow(group, row, ri === 0, rowIndex));
        rowIndex++;
      });
    });
    container.appendChild(chart);

    const note = div('g-note');
    note.textContent = '주) 전체 일정·주요 마일스톤 시기는 추후 협의하에 변경될 수 있음';
    container.appendChild(note);

    // 막대 라벨 폭 맞춤: 즉시 + 컨테이너 크기 변화(표시/리사이즈) 감시
    requestAnimationFrame(() => fitBarLabels(container));
    observeFit(container);
  }

  window.renderGantt = renderGantt;
})();
