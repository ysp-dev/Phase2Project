'use strict';

// ─── 기준일(오늘) — 한국 시간(KST, Asia/Seoul) 기준으로 동적 산출 ───────────────
// 실행 환경의 시간대와 무관하게 항상 한국 날짜를 사용한다.
function kstToday(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date || new Date());
  const get = t => +parts.find(p => p.type === t).value;
  return { y: get('year'), m: get('month'), d: get('day') };
}

function kstLabel(kst) {
  return kst.y + '.' +
    String(kst.m).padStart(2, '0') + '.' +
    String(kst.d).padStart(2, '0');
}

const TODAY_KST   = kstToday();
const TODAY_LABEL = kstLabel(TODAY_KST);

// ─── 프로젝트 메타 ───────────────────────────────────────────────────────────
const PROJECT_META = {
  title:       '여신IT개발부 코어뱅킹 현대화 2단계 프로젝트',
  subtitle:    '통합 진행 현황 대시보드',
  period:      "'26.5 ~ '27.12 (20개월)",
  todayLabel:  TODAY_LABEL,
  brand:       'KB',
};

// ─── 타임라인 (M0='26.5 ~ M19='27.12, 총 20개월) ────────────────────────────
const MONTHS = [
  { m: 'M0',  label: '5',  year: "'26.5", days: 31 },  // 2026-05
  { m: 'M1',  label: '6',                 days: 30 },  // 2026-06
  { m: 'M2',  label: '7',                 days: 31 },  // 2026-07
  { m: 'M3',  label: '8',                 days: 31 },  // 2026-08
  { m: 'M4',  label: '9',                 days: 30 },  // 2026-09
  { m: 'M5',  label: '10',                days: 31 },  // 2026-10
  { m: 'M6',  label: '11',                days: 30 },  // 2026-11
  { m: 'M7',  label: '12',                days: 31 },  // 2026-12
  { m: 'M8',  label: '1',  year: "'27.1", days: 31 },  // 2027-01
  { m: 'M9',  label: '2',                 days: 28 },  // 2027-02 (평년)
  { m: 'M10', label: '3',                 days: 31 },  // 2027-03
  { m: 'M11', label: '4',                 days: 30 },  // 2027-04
  { m: 'M12', label: '5',                 days: 31 },  // 2027-05
  { m: 'M13', label: '6',  year: "'27.6", days: 30 },  // 2027-06
  { m: 'M14', label: '7',                 days: 31 },  // 2027-07
  { m: 'M15', label: '8',                 days: 31 },  // 2027-08
  { m: 'M16', label: '9',                 days: 30 },  // 2027-09
  { m: 'M17', label: '10',                days: 31 },  // 2027-10
  { m: 'M18', label: '11',                days: 30 },  // 2027-11
  { m: 'M19', label: '12', year: "'27.12", days: 31 },  // 2027-12
];
const TOTAL_MONTHS = 20;

// 오늘 기준선: KST 오늘 → 타임라인 위치(개월 분수). M0 = 2026-05 기준.
// 프로젝트 기간(0 ~ TOTAL_MONTHS) 밖이면 가장자리로 클램프.
function todayIndex(kst) {
  const monthIdx   = (kst.y - 2026) * 12 + (kst.m - 5);
  const daysInMon  = new Date(kst.y, kst.m, 0).getDate();
  const idx        = monthIdx + kst.d / daysInMon;
  return Math.max(0, Math.min(TOTAL_MONTHS, idx));
}

function computeTodayState(date) {
  const kst = kstToday(date);
  return {
    kst,
    label: kstLabel(kst),
    index: todayIndex(kst),
  };
}

function refreshProjectToday(date) {
  const today = computeTodayState(date);
  PROJECT_META.todayLabel = today.label;
  if (window.PROJECT_DATA) window.PROJECT_DATA.TODAY_INDEX = today.index;
  return today;
}

const TODAY_INDEX = todayIndex(TODAY_KST);

// ─── 단계 유형 ──────────────────────────────────────────────────────────────
const PHASE_TYPES = {
  '사전준비': { color: '#EDE3CC', text: '#5A4530' },
  '사전분석': { color: '#FFCF1F', text: '#3A2E00' },
  '분석':     { color: '#FFCF1F', text: '#3A2E00' },
  '설계':     { color: '#F59800', text: '#3A2500' },
  '개발':     { color: '#F46600', text: '#FFFFFF' },
  '테스트':   { color: '#C25000', text: '#FFFFFF' },
  '이행':     { color: '#8E3A00', text: '#FFD098' },
  '안정화':   { color: '#703200', text: '#FFB870' },
};
const PHASE_ORDER = ['사전준비','사전분석','분석','설계','개발','테스트','이행','안정화'];

// p(type, label, start, dur, progress?) — start/dur 단위: 개월, progress: 0~100
function ph(type, label, start, dur, progress) {
  const o = { type, label, start, dur };
  if (progress != null) o.progress = progress;
  return o;
}

// ─── 마일스톤 ────────────────────────────────────────────────────────────────
const MILESTONES = [
  { id: 'ms-kickoff', label: '착수보고',      kind: 'diamond', index: 2.0  },
  { id: 'ms-interim', label: '중간보고',      kind: 'diamond', index: 8.0  },
  { id: 'ms-open',    label: '오픈(10.12)',  kind: 'star',    index: 17.4 },
  { id: 'ms-close',   label: '종료보고',      kind: 'diamond', index: 19.5 },
];

// ─── 과제 목록 ───────────────────────────────────────────────────────────────
const TASKS = [
  {
    id: 'core', group: '코어뱅킹 #2 클라우드 전환', short: '코어뱅킹 #2',
    badges: ['기업여신심사', '여신담보', '사후관리', 'B2B', '기업워크아웃', '기업신용평가', '고객전략관리'],
    rows: [
      { id: 'core-1', name: '코어뱅킹 #2 클라우드 전환', own: true, phases: [
        ph('사전준비','사전준비',0,1),
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'mf', group: 'M/F 리팩토링', short: 'M/F 리팩토링',
    rows: [
      { id: 'mf-1', name: 'M/F 리팩토링', own: true, phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'mf-2', name: '유관시스템대응개발', own: true, phases: [
        ph('분석','분석(3)',1,3),
        ph('설계','설계(3)',4,3),
        ph('개발','개발(5)',7,5),
        ph('테스트','테스트(4.5)',12,4.5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'customer', group: '전행 고객식별체계 통합', short: '고객식별체계',
    rows: [
      { id: 'customer-1', name: '고객식별체계통합', phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'customer-2', name: '고객체계 대응개발', own: true, phases: [
        ph('사전분석','사전분석(4)',1,4),
        ph('분석','분석/설계(3)',5,3),
        ph('개발','개발(4)',8,4),
        ph('테스트','테스트(4.5)',12,4.5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'api', group: 'API Integration Hub 구축', short: 'API Hub',
    rows: [
      { id: 'api-1', name: 'API Integration Hub 구축', phases: [
        ph('분석','분석/설계(2)',1,2),
        ph('개발','연계구축 및 개발(3)',3,3),
        ph('테스트','테스트/이행(5.5)',6,5.5),
        ph('테스트','테스트지원(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'multicore', group: '멀티코어 기반 시스템 구축', short: '멀티코어',
    rows: [
      { id: 'multicore-1', name: '후처리 플랫폼 구축', phases: [
        ph('분석','분석/설계(4)',3,4),
        ph('개발','개발(4.5)',7,4.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'multicore-2', name: 'EDA 플랫폼 구축', phases: [
        ph('분석','분석/설계(3)',1,3),
        ph('개발','구축 및 커스터마이징(4)',4,4),
        ph('테스트','테스트(4)',8,4),
        ph('테스트','테스트 지원(4.5)',12,4.5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'multicore-3', name: 'C2J 중심 AI기반 코드전환 시스템 구축', phases: [
        ph('사전준비','사전준비',0,1),
        ph('개발','커스텀 개발(3)',1,3),
        ph('설계','코드생성(1)',4,1),
        ph('테스트','코드검증(1)',5,1),
        ph('개발','개발지원(11.5)',6,11.5),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'common', group: '공통성 시스템 구축', short: '공통성 시스템',
    rows: [
      { id: 'common-1', name: '조회분산시스템 확대 구축', phases: [
        ph('분석','분석/설계(2)',7,2),
        ph('개발','개발(3)',9,3),
        ph('테스트','통합테스트(4.5)',12,4.5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(1.5)',17.5,1.5),
      ]},
      { id: 'common-2', name: '상품정보 통합관리체계 구축', own: true, phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트지원(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'common-3', name: '빌드배포 시스템 고도화', phases: [
        ph('분석','분석/설계(2)',9,2),
        ph('개발','개발(3)',11,3),
        ph('테스트','테스트 및 이행(1.5)',14,1.5),
        ph('안정화','안정화(1.5)',15.5,1.5),
      ]},
    ],
  },
  {
    id: 'channel-web', group: '대면채널 고도화', short: '대면채널',
    rows: [
      { id: 'channel-web-1', name: '웹기반 단말 재구축', phases: [
        ph('분석','분석/설계(5)',1,5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
      { id: 'channel-web-2', name: '태블릿브랜치 재구축', phases: [
        ph('분석','분석/설계(3.5)',5.5,3.5),
        ph('개발','개발(4)',9,4),
        ph('테스트','테스트(2.5)',13,2.5),
        ph('이행','이행(1)',15.5,1),
        ph('안정화','안정화(1.5)',16.5,1.5),
      ]},
      { id: 'channel-web-3', name: 'PPR 재구축', own: true, phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계/선도개발(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'infra', group: '공통/인프라구축 정보보호', short: '공통/인프라',
    rows: [
      { id: 'infra-1', name: '공통/인프라구축 정보보호', phases: [
        ph('분석','아키텍처 정의(2)',1,2),
        ph('설계','아키텍처 설계(3)',3,3),
        ph('개발','아키텍처 구성 및 통합(5.5)',6,5.5),
        ph('테스트','통합테스트 지원 및 시스템 테스트 수행(5)',11.5,5),
        ph('이행','이행 지원(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'data', group: '데이터전환', short: '데이터전환',
    rows: [
      { id: 'data-1', name: '데이터전환', own: true, phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(3)',3.5,3),
        ph('개발','개발·전환테스트(4.5)',6.5,4.5),
        ph('테스트','반복 전환검증(5.5)',11,5.5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
];

// ─── 전체 단계 요약 바 ────────────────────────────────────────────────────────
const OVERALL_PHASES = [
  ph('사전준비','사전준비',0,1),
  ph('분석','분석(2.5)',1,2.5),
  ph('설계','설계(2.5)',3.5,2.5),
  ph('개발','개발(5.5)',6,5.5),
  ph('테스트','테스트(5.0)',11.5,5),
  ph('이행','이행(1)',16.5,1),
  ph('안정화','안정화(2.5)',17.5,2.5),
];

// ─── 주요사항 스타일 ──────────────────────────────────────────────────────────
const CATEGORIES    = ['이슈/리스크', '주요 의사결정', '진행 메모'];
const STATUSES      = ['진행중', '완료', '지연', '예정'];
const PRIORITIES    = ['높음', '보통', '낮음'];
const PHASE_OPTIONS = ['사전준비','분석','설계','개발','테스트','이행','안정화','공통'];

const STATUS_STYLE = {
  '진행중': { bg: '#2A2000', fg: '#FFBC00', dot: '#FFBC00' },
  '완료':   { bg: '#0A1A2E', fg: '#4D9FFF', dot: '#4D9FFF' },
  '지연':   { bg: '#2A0A0A', fg: '#FF7A7A', dot: '#FF5C5C' },
  '예정':   { bg: '#1E1E1E', fg: '#666666', dot: '#4A4A4A' },
};
const PRIORITY_STYLE = {
  '높음': { fg: '#FF7A7A', bg: '#2A0A0A' },
  '보통': { fg: '#FFBC00', bg: '#2A2000' },
  '낮음': { fg: '#666666', bg: '#1E1E1E' },
};
const CATEGORY_STYLE = {
  '이슈/리스크':   { fg: '#F46600', icon: '▲' },
  '주요 의사결정': { fg: '#0066FF', icon: '◆' },
  '진행 메모':     { fg: '#7D6C59', icon: '■' },
};

// ─── 초기 예시 데이터 ─────────────────────────────────────────────────────────
const SEED_ITEMS = [];

// ─── 전역 노출 ────────────────────────────────────────────────────────────────
window.PROJECT_DATA = {
  META: PROJECT_META,
  MONTHS, TOTAL_MONTHS, TODAY_INDEX,
  PHASE_TYPES, PHASE_ORDER,
  MILESTONES, TASKS, OVERALL_PHASES,
  CATEGORIES, STATUSES, PRIORITIES, PHASE_OPTIONS,
  STATUS_STYLE, PRIORITY_STYLE, CATEGORY_STYLE,
  SEED_ITEMS,
  refreshToday: refreshProjectToday,
};
