#!/usr/bin/env node

/**
 * vibecraft 세션 시작 훅
 * 세션이 시작될 때 vibecraft 활성화 + 추천 명령어 + 꿀팁 표시
 *
 * v2.2.0: 신규 버전 최초 감지 시 1회성 업데이트 알림 블록을 표시한다.
 *         ~/.vibecraft-seen-version 파일로 "본 버전"을 추적한다.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── 꿀팁 풀 (랜덤 2개 표시) ────────────────────────────────

const TIPS = [
  // ── 기본 사용법 ──
  '명령어를 몰라도 됩니다 — 그냥 하고 싶은 걸 한국어로 말하세요',
  '자연어로 말해도 됩니다 — "로그인 좀 이상해"만 해도 디버깅이 시작됩니다',
  '큰 작업은 /feature, 간단한 수정은 그냥 말하세요 — AI가 크기를 판단합니다',
  '"안녕"이라고 입력하면 vibecraft 사용법을 단계별로 배울 수 있습니다',
  '/vibecraft를 입력하면 사용 가능한 전체 명령어 목록을 볼 수 있습니다',
  '뭘 해야 할지 모르겠으면 "뭐 할 수 있어?"라고 물어보세요',

  // ── 에러/디버깅 ──
  '에러 메시지를 통째로 붙여넣으면 AI가 더 정확하게 분석합니다',
  '에러가 나면 "이거 왜 이래?"만 해도 AI가 분석을 시작합니다',
  '"안 돼", "안 나와", "느려" 같은 말만 해도 디버깅이 시작됩니다',
  '에러가 여러 개일 때는 /ralph가 하나씩 자동으로 잡아줍니다',
  '스크린샷을 붙여넣으면 AI가 화면을 보고 문제를 파악할 수 있습니다',
  'AI가 추측으로 고치지 않습니다 — 항상 원인을 먼저 확인한 뒤에 수정합니다',

  // ── 기능 개발 ──
  '"/feature 설명"으로 입력하면 AI가 크기를 판단하고 계획부터 세워줍니다',
  '"로그인 만들어줘"처럼 말하면 AI가 자동으로 설계→계획→구현을 진행합니다',
  '작업이 크면 AI가 자동으로 계획서를 만들고, 확인 후에만 코드를 작성합니다',
  '"이거 수정해줘"라고 하면 새 기능 모드로 진입합니다',
  '테스트 코드도 AI가 자동으로 작성합니다 — 따로 요청하지 않아도 됩니다',

  // ── 패킷/크롤링 ──
  '"이 사이트 API 따줘" + URL을 입력하면 숨겨진 API를 찾습니다',
  '/packet은 Selenium 없이 순수 HTTP 요청 코드를 생성합니다',
  '패킷 캡처로 추출한 API는 사이트 구조가 바뀌어도 잘 작동합니다',
  '"크롤링해줘", "데이터 긁어줘"만 해도 패킷 캡처 모드로 진입합니다',

  // ── 리뷰/배포 ──
  '/review만 입력하면 변경사항을 자동으로 리뷰합니다',
  '"이 코드 괜찮아?"라고 물어보면 코드 리뷰가 시작됩니다',
  '/deploy로 배포 전 체크리스트를 자동으로 확인합니다',
  '/verify로 작업이 제대로 완료됐는지 최종 검증할 수 있습니다',

  // ── 프로젝트/설계 ──
  '/research로 기존 프로젝트를 먼저 분석하면 수정 시 실수가 줄어듭니다',
  '/brainstorm으로 아이디어를 구체적인 설계로 발전시킬 수 있습니다',
  '/kickoff로 새 프로젝트를 시작하면 기술 스택 선택부터 가이드합니다',
  '기존 프로젝트에 합류했으면 /research로 먼저 구조를 파악하세요',

  // ── 팀/병렬 ──
  '/team으로 프론트+백엔드를 동시에 병렬 작업할 수 있습니다',
  '/ralph로 에러를 자동 반복 수정 — "npm test 전부 통과시켜"처럼 사용합니다',
  '대규모 작업은 /team으로 여러 AI가 동시에 작업하면 빠릅니다',

  // ── 네이버 ──
  '네이버 자동화 문제는 /naver로 5렌즈 통합 분석을 받을 수 있습니다',
  '네이버 블로그/카페/플레이스 관련 문제를 말하면 자동으로 진단합니다',

  // ── Git ──
  '"커밋해줘"라고 하면 AI가 변경 내용을 보고 커밋 메시지를 자동 작성합니다',
  'Git 명령어를 몰라도 됩니다 — "브랜치 만들어줘", "푸시해줘"만 하세요',
  '위험한 Git 명령어(force push 등)는 AI가 자동으로 차단합니다',

  // ── 효율 팁 ──
  '구체적으로 말할수록 AI가 더 정확합니다 — 파일명, 에러 메시지, URL을 포함하세요',
  '! 를 앞에 붙이면 터미널 명령어를 직접 실행할 수 있습니다 (예: ! npm run dev)',
  '대화가 길어지면 /compact로 컨텍스트를 정리할 수 있습니다',
  'AI가 잘못 수정했으면 "되돌려줘"라고 하면 됩니다',
  'CLAUDE.md 파일에 프로젝트 규칙을 적으면 AI가 항상 그 규칙을 따릅니다',
  '한번에 여러 개를 시키지 말고, 하나씩 시키면 품질이 더 좋습니다',
  '"왜 이렇게 했어?"라고 물어보면 AI가 코드 선택 이유를 설명합니다',
  '/simplify [경로]로 코드를 기능 변경 없이 깔끔하게 정리할 수 있습니다',
  '"이거 맞아?"라고 물어보면 코드 리뷰가 시작됩니다',
  '코드를 복사 붙여넣기 할 필요 없습니다 — AI가 직접 파일을 읽고 수정합니다',
];

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── v2.2.0: 1회성 업데이트 알림 ──────────────────────────────
// 현재 버전을 plugin.json에서 읽고, ~/.vibecraft-seen-version과 비교
// 신규 버전이면 업데이트 블록을 표시하고 seen-version 파일을 갱신

function getCurrentVersion() {
  try {
    const pluginJson = path.resolve(__dirname, '../.claude-plugin/plugin.json');
    const data = JSON.parse(fs.readFileSync(pluginJson, 'utf8'));
    return data.version || null;
  } catch {
    return null;
  }
}

function getSeenVersion() {
  try {
    const p = path.join(os.homedir(), '.vibecraft-seen-version');
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return null;
  }
}

function markVersionSeen(version) {
  try {
    const p = path.join(os.homedir(), '.vibecraft-seen-version');
    fs.writeFileSync(p, version, 'utf8');
  } catch {
    // 실패해도 세션 시작은 계속
  }
}

// 업데이트 블록 (version별로 내용 분기)
function getUpdateBlock(version) {
  if (version === '2.2.0') {
    return [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `🆕 vibecraft v${version} — 하네스 엔지니어링 강화판`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '이번 업데이트로 AI가 "같은 모델, 더 좋은 결과"를 내도록',
      '다음 6가지 자동 가드가 추가됐습니다:',
      '',
      '  ✅ 증거 자동 확인  — 코드 수정 후 테스트 실행 여부 자동 체크',
      '  ✅ 도구 실패 진단  — ENOENT/EACCES 등 에러 시 자동 힌트',
      '  ✅ UI 브라우저 검증 — Playwright로 실제 화면 확인 (설치 시)',
      '  ✅ 백엔드 검증자  — API 동작을 코드 안 보고 curl로 검증',
      '  ✅ 다중 작업 추적 — 여러 feature 동시 진행 상태 관리',
      '  ✅ 서브에이전트 품질 — 시크릿/TODO/디버그 로그 자동 스캔',
      '',
      '📖 자세한 내용: CHANGELOG.md 또는 /vibecraft',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
    ];
  }
  // 다른 버전은 블록 없음 (조용히 skip)
  return null;
}

// ── 메인 ────────────────────────────────────────────────────

const currentVersion = getCurrentVersion();
const seenVersion = getSeenVersion();
const isNewVersion = currentVersion && currentVersion !== seenVersion;
const updateBlock = isNewVersion ? getUpdateBlock(currentVersion) : null;

if (isNewVersion && currentVersion) {
  markVersionSeen(currentVersion);
}

const tips = pickRandom(TIPS, 2);

const lines = [];

// 1회성 업데이트 블록을 최상단에 표시
if (updateBlock) {
  lines.push(...updateBlock);
}

lines.push(
  'vibecraft가 활성화되었습니다.',
  '',
  '💬 이렇게 말해보세요:',
  '  "로그인 기능 만들어줘" — AI가 계획부터 세워줍니다',
  '  "에러 나는데 고쳐줘" — 원인 분석부터 시작합니다',
  '  "이 코드 봐줘" — 코드 리뷰를 진행합니다',
  '  "이 사이트 API 따줘" — 패킷 캡처로 API 추출',
  '',
  '📋 주요 명령어:',
  '  /feature [설명]  새 기능/수정  |  /debug [증상]  에러 수정',
  '  /review  코드 리뷰           |  /packet [URL]  API 추출',
  '  /research [대상]  코드 분석   |  /deploy  배포',
  '  /ralph [명령]  반복 수정      |  /team [설명]  병렬 작업',
  '',
  `💡 ${tips[0]}`,
  `💡 ${tips[1]}`,
  '',
  '전체 명령어: /vibecraft  |  사용법 배우기: "안녕"'
);

console.log(lines.join('\n'));
