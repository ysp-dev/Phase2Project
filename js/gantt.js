'use strict';
/* Gantt chart renderer — 2026 redesign, single style */

(function () {
  const P = () => window.PROJECT_DATA;
  const pct = v => (v / P().TOTAL_MONTHS) * 100 + '%';

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function div(cls) { return el('div', cls); }
  function span(cls) { return el('span', cls); }

  // ── Grid lines ───────────────────────────────────────────────────────────────
  function buildGrid() {
    const wrap = div('g-grid');
    P().MONTHS.forEach((mo, i) => {
      const line = div(mo.year ? 'g-gridline g-gridline--year' : 'g-gridline');
      line.style.left = pct(i);
      wrap.appendChild(line);
      // week sub-gridlines at 7/14/21 days within each month (actual calendar)
      [7, 14, 21].forEach(d => {
        const wl = div('g-gridline g-gridline--week');
        wl.style.left = pct(i + d / mo.days);
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

  // ── KB 5-color palette for summary row ──────────────────────────────────────
  const SUMMARY_COLORS = {
    '사전준비': { color: '#60584D', text: '#E0D8D0' }, // Feedback (dark brown)
    '분석':     { color: '#FFD337', text: '#3A2E00' }, // Positive (yellow)
    '설계':     { color: '#0066FF', text: '#FFFFFF' }, // Success (blue)
    '개발':     { color: '#FF0000', text: '#FFFFFF' }, // Negative (red)
    '테스트':   { color: '#F46600', text: '#FFFFFF' }, // Notification (orange)
    '이행':     { color: '#60584D', text: '#E0D8D0' }, // Feedback (dark brown)
    '안정화':   { color: '#3A3840', text: '#A0A0B0' }, // muted dark
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

      // week tick marks at 7/14/21 days within each month cell (actual calendar)
      const weekWrap = div('g-week-ticks');
      [7, 14, 21].forEach(d => {
        const tick = div('g-week-tick');
        tick.style.left = (d / mo.days * 100) + '%';
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
      lbl.textContent = taskGroup.group;
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

  // ── Main render ───────────────────────────────────────────────────────────────
  function renderGantt(container) {
    container.innerHTML = '';
    container.appendChild(buildLegend());

    const chart = div('g-chart');
    chart.appendChild(buildMonthHeader());
    chart.appendChild(buildSummaryRow());
    chart.appendChild(buildMilestoneRow());

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
  }

  window.renderGantt = renderGantt;
})();
