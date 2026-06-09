'use strict';

// ─── 프로젝트 메타 ───────────────────────────────────────────────────────────
const PROJECT_META = {
  title:       '여신IT개발부 코어뱅킹 현대화 2단계 프로젝트',
  subtitle:    '통합 진행 현황 대시보드',
  period:      "'26.5 ~ '27.12 (20개월)",
  todayLabel:  '2026.06.09',
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
  { m: 'M19', label: '12',                days: 31 },  // 2027-12
];
const TOTAL_MONTHS = 20;

// 오늘 기준선: 2026-06-09 → M1(6월) + 9/30
const TODAY_INDEX = 1 + 9 / 30; // ≈ 1.3

// ─── 단계 유형 ──────────────────────────────────────────────────────────────
const PHASE_TYPES = {
  '사전준비': { color: '#E7E3DA', text: '#5A5247' },
  '분석':     { color: '#FFD338', text: '#3A2E00' },
  '설계':     { color: '#FD9C26', text: '#3A2300' },
  '개발':     { color: '#F46600', text: '#FFFFFF' },
  '테스트':   { color: '#7D6C59', text: '#FFFFFF' },
  '이행':     { color: '#545860', text: '#FFFFFF' },
  '안정화':   { color: '#3F3F42', text: '#FFFFFF' },
};
const PHASE_ORDER = ['사전준비','분석','설계','개발','테스트','이행','안정화'];

// p(type, label, start, dur) — start/dur 단위: 개월
function ph(type, label, start, dur) {
  return { type, label, start, dur };
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
    rows: [
      { id: 'core-1', name: '코어뱅킹 #2 클라우드 전환', phases: [
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
      { id: 'mf-1', name: 'M/F 리팩토링', phases: [
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
    id: 'related', group: '유관시스템 대응개발', short: '유관시스템',
    rows: [
      { id: 'related-1', name: '유관시스템 대응개발', phases: [
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
    id: 'common', group: '상품정보 관리체계 구축', short: '상품정보 관리체계',
    rows: [
      { id: 'common-1', name: '상품정보 관리체계 구축', phases: [
        ph('분석','분석(2.5)',1,2.5),
        ph('설계','설계(2.5)',3.5,2.5),
        ph('개발','개발(5.5)',6,5.5),
        ph('테스트','테스트지원(5)',11.5,5),
        ph('이행','이행(1)',16.5,1),
        ph('안정화','안정화(2.5)',17.5,2.5),
      ]},
    ],
  },
  {
    id: 'channel', group: 'PPR 재구축', short: 'PPR 재구축',
    rows: [
      { id: 'channel-1', name: 'PPR 재구축', phases: [
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
    id: 'data', group: '데이터전환', short: '데이터전환',
    rows: [
      { id: 'data-1', name: '데이터전환', phases: [
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
const SEED_ITEMS = [
  {
    id: 'it-1', taskId: 'core', category: '이슈/리스크',
    title: '클라우드 전환 대상 계정계 모듈 범위 확정 지연',
    content: '여수신·외환 모듈의 전환 우선순위에 대한 현업 합의가 지연되어 분석 일정에 영향 우려. 6월 3주차 운영위 안건 상정 예정.',
    status: '진행중', priority: '높음', phase: '분석', updatedAt: '2026-06-08',
  },
  {
    id: 'it-2', taskId: 'core', category: '주요 의사결정',
    title: '코어뱅킹 #2 클라우드 IaaS 사업자 선정',
    content: '기술성·보안성 평가 결과 1순위 사업자 확정. 망분리 구성안은 보안성검토(ISMS) 통과 후 착수보고에 반영.',
    status: '완료', priority: '높음', phase: '사전준비', updatedAt: '2026-06-05',
  },
  {
    id: 'it-3', taskId: 'mf', category: '이슈/리스크',
    title: 'M/F 소스 자동변환율 목표(85%) 미달 가능성',
    content: 'PoC 결과 자동변환율 78% 수준. 잔여 수기 전환 공수 증가 예상되어 개발 단계 인력 재배치 검토 필요.',
    status: '지연', priority: '높음', phase: '분석', updatedAt: '2026-06-07',
  },
  {
    id: 'it-4', taskId: 'related', category: '진행 메모',
    title: '유관시스템 인터페이스 목록 1차 수집 완료',
    content: '총 142건 식별. 외부기관 연계 23건은 대외 협의 별도 트랙으로 관리.',
    status: '완료', priority: '보통', phase: '분석', updatedAt: '2026-06-06',
  },
  {
    id: 'it-5', taskId: 'common', category: '주요 의사결정',
    title: '상품정보 마스터 단일화 원칙 확정',
    content: '상품정보는 통합관리체계를 SSOT(단일 진실 공급원)로 하고 채널계는 참조만 허용하기로 결정.',
    status: '완료', priority: '높음', phase: '분석', updatedAt: '2026-06-04',
  },
  {
    id: 'it-6', taskId: 'channel', category: '이슈/리스크',
    title: 'PPR 선도개발 대상 화면 선정 협의 필요',
    content: '설계 단계와 병행하는 선도개발(2.5M) 대상 화면 후보 12종 중 우선 3종 선정 협의 진행 중.',
    status: '진행중', priority: '보통', phase: '설계', updatedAt: '2026-06-08',
  },
  {
    id: 'it-7', taskId: 'data', category: '진행 메모',
    title: '데이터 전환 검증 자동화 도구 도입 검토',
    content: '반복 전환검증(5.5M) 구간 효율화를 위해 정합성 검증 자동화 도구 PoC 일정 수립.',
    status: '예정', priority: '보통', phase: '분석', updatedAt: '2026-06-09',
  },
  {
    id: 'it-8', taskId: 'data', category: '이슈/리스크',
    title: '원천 데이터 품질 이슈(미사용 컬럼 다수)',
    content: '레거시 테이블 내 미정의·미사용 컬럼이 다수 발견되어 정제 기준 수립 및 현업 확인 필요.',
    status: '진행중', priority: '높음', phase: '분석', updatedAt: '2026-06-09',
  },
];

// ─── 전역 노출 ────────────────────────────────────────────────────────────────
window.PROJECT_DATA = {
  META: PROJECT_META,
  MONTHS, TOTAL_MONTHS, TODAY_INDEX,
  PHASE_TYPES, PHASE_ORDER,
  MILESTONES, TASKS, OVERALL_PHASES,
  CATEGORIES, STATUSES, PRIORITIES, PHASE_OPTIONS,
  STATUS_STYLE, PRIORITY_STYLE, CATEGORY_STYLE,
  SEED_ITEMS,
};
