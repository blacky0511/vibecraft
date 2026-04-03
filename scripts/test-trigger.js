#!/usr/bin/env node

/**
 * user-prompt-handler.js 트리거 정확도 테스트
 *
 * 테스트 케이스를 실행하여 올바른 스킬이 매칭되는지 검증한다.
 * 목표: 95% 이상 정확도
 */

// user-prompt-handler.js의 패턴을 직접 가져와서 테스트
const PATTERNS = {
  greeting: {
    primary: /^(안녕|하이|헬로|hi|hello|처음|시작)\s*[.!?~]*$/i,
    secondary: /뭐\s?할\s?수\s?있|도움|help|도움말/i,
    skill: 'vibecraft:welcome-guide',
    label: '인사/도움말',
    priority: 0,
  },
  simpleTweak: {
    primary: /바꿔\s?줘|색상|크기|폰트|패딩|마진|간격|높이|너비|굵기|투명도|키워\s?줘|줄여\s?줘|늘려\s?줘|줄여|굵게|얇게|밝게|어둡게|넓게|좁게/,
    secondary: /글자\s?크기|글씨\s?크기|배경\s?색|테두리|border|font.?size|padding|margin|opacity|width|height|gap|radius/i,
    skill: null,
    label: '단순 수정',
    priority: 1,
  },
  referenceDesign: {
    primary: /랜딩\s?페이지|웹\s?사이트|홈\s?페이지|레퍼런스|참고\s?사이트/,
    secondary: /UI|디자인|페이지\s?만들|화면\s?만들|사이트\s?만들|landing|website/i,
    combo: true,
    skill: 'vibecraft:reference-design',
    label: '레퍼런스 디자인',
    priority: 1.5,
  },
  debugging: {
    primary: /에러|버그|오류|안\s?돼|안\s?되|안됨|실패|크래시|터져|터졌|깨져|깨졌|뻗어|뻗었|멈춰|멈췄|죽어|죽었/,
    secondary: /작동.*안|동작.*안|왜\s?(?:이래|이러지|그래|그러지|안|이렇게)|뭐가\s?(?:문제|잘못|틀렸)|고장|먹통|무한\s?루프|무한\s?로딩/,
    english: /error|bug|fix|crash|exception|fail|broken|not\s?work|TypeError|Cannot\s+read|undefined\s+is\s+not|null\s+pointer|stack\s?trace|Traceback/i,
    stackTrace: /at\s+\w+\s*\(|Traceback\s*\(|line\s+\d+|:\d+:\d+\)|ENOENT|EACCES|ECONNREFUSED|ERR_|FATAL|panic:/,
    skill: 'vibecraft:systematic-debugging',
    label: '디버깅',
    priority: 2,
  },
  research: {
    primary: /리서치|조사해?\s?줘|파악해?\s?줘|살펴\s?봐|확인해?\s?봐/,
    secondary: /코드\s?조사|구조\s?파악|어떻게\s?되어?\s?있|현재\s?상태\s?파악|코드\s?베이스|아키텍처\s?파악/,
    english: /research|investigate|explore\s+code|understand\s+code/i,
    skill: 'vibecraft:research',
    label: '리서치',
    priority: 2.5,
  },
  analysis: {
    primary: /분석해?\s?줘|데이터\s?뽑아|DB\s?조회|쿼리|통계|리포트|집계|현황|추출/,
    secondary: /로그\s?분석|패턴\s?분석|트렌드|비교해?\s?줘|수치|지표|대시보드|엑셀|CSV/,
    english: /analyz|report|statistic|aggregate|query|dashboard|metric/i,
    skill: 'vibecraft:analysis-delegation',
    label: '데이터 분석',
    priority: 3,
  },
  review: {
    primary: /리뷰|검토|봐\s?줘|확인해?\s?줘|체크해?\s?줘/,
    secondary: /괜찮은지|문제\s?없는지|잘\s?됐는지|코드\s?품질|PR\s?확인|머지\s?전/,
    english: /review|check\s*(?:code|quality|this)|look\s+at\s+(?:this|the\s+code)|\bPR\b/i,
    skill: 'vibecraft:code-review-request',
    label: '코드 리뷰',
    priority: 4,
  },
  deploy: {
    primary: /배포|릴리즈|서버에?\s?올려|운영.*반영|프로덕션|deploy/i,
    secondary: /빌드\s?(?:하고|해서)\s?배포|docker|kubernetes|CI\s?\/?\s?CD/,
    english: /deploy|release|publish|production|staging/i,
    skill: 'vibecraft:deploy-guide',
    label: '배포',
    priority: 5,
  },
  newFeature: {
    primary: /만들어\s?줘|추가해\s?줘|구현해\s?줘|넣어\s?줘|개발해\s?줘|기능\s?개발|기능\s?추가|기능\s?구현/,
    secondary: /해\s?줘|해\s?봐|하고\s?싶|할\s?수\s?있|필요해|있었으면|있으면\s?좋겠/,
    functional: /기능.*(?:개발|작업|시작|추가|구현|만들)|(?:개발|작업|시작|추가).*기능|새로운?\s?\w+\s?(?:만들|추가|구현|개발)/,
    english: /feature|implement|create|build|add\s+(?:new|a)\s+/i,
    skill: 'vibecraft:new-feature',
    label: '새 기능',
    priority: 6,
  },
  projectStart: {
    primary: /만들자|시작하자|시작해\s?보자|프로젝트\s?(?:만들|시작|생성|초기화)/,
    secondary: /앱\s?만들|사이트\s?만들|새\s?프로젝트|처음부터|init|scaffold|boilerplate/i,
    skill: 'vibecraft:project-kickoff',
    label: '프로젝트 시작',
    priority: 7,
  },
};

function matchPatterns(prompt) {
  const matches = [];
  for (const [modeName, config] of Object.entries(PATTERNS)) {
    let score = 0;
    if (config.combo) {
      const hasPrimary = config.primary.test(prompt);
      const hasSecondary = config.secondary.test(prompt);
      if (hasPrimary || hasSecondary) {
        score = (hasPrimary && hasSecondary) ? 3 : 1;
      }
    } else {
      if (config.primary && config.primary.test(prompt)) score += 2;
      if (config.secondary && config.secondary.test(prompt)) score += 1;
      if (config.english && config.english.test(prompt)) score += 1;
      if (config.stackTrace && config.stackTrace.test(prompt)) score += 2;
      if (config.functional && config.functional.test(prompt)) score += 1;
    }
    if (score > 0) {
      matches.push({ mode: modeName, score, config });
    }
  }
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.config.priority - b.config.priority;
  });
  return matches;
}

function hasWorkRequest(prompt) {
  return /만들|추가|구현|수정|고쳐|해\s?줘|바꿔|에러|버그|리뷰|배포|분석|시작|개발/.test(prompt);
}

function getTopMode(prompt) {
  const matches = matchPatterns(prompt);
  if (matches.length === 0) return null;

  // 인사 + 작업이면 인사 스킵
  if (matches[0].mode === 'greeting' && hasWorkRequest(prompt)) {
    matches.shift();
    if (matches.length === 0) return null;
  }

  return matches[0].mode;
}

// ── 테스트 케이스 ───────────────────────────────────────────

const TEST_CASES = [
  // ── 새 기능 (newFeature) ──
  { input: '로그인 기능 만들어줘', expected: 'newFeature' },
  { input: '회원가입 추가해줘', expected: 'newFeature' },
  { input: '결제 기능 구현해줘', expected: 'newFeature' },
  { input: '다크모드 넣어줘', expected: 'newFeature' },
  { input: '소셜 로그인 개발해줘', expected: 'newFeature' },
  { input: '검색 기능이 필요해', expected: 'newFeature' },
  { input: '알림 기능 하고 싶어', expected: 'newFeature' },
  { input: '댓글 기능 있었으면 좋겠어', expected: 'newFeature' },
  { input: 'implement user authentication', expected: 'newFeature' },
  { input: 'create a new API endpoint', expected: 'newFeature' },

  // ── 디버깅 (debugging) ──
  { input: '로그인이 안 돼', expected: 'debugging' },
  { input: '에러 났어', expected: 'debugging' },
  { input: '이 버그 좀 고쳐줘', expected: 'debugging' },
  { input: '서버가 터졌어', expected: 'debugging' },
  { input: '왜 이러지? 페이지가 안 뜨네', expected: 'debugging' },
  { input: '뭐가 문제야 자꾸 실패해', expected: 'debugging' },
  { input: 'TypeError: Cannot read properties of undefined', expected: 'debugging' },
  { input: '빌드가 깨졌어', expected: 'debugging' },
  { input: '무한 로딩이야', expected: 'debugging' },
  { input: '앱이 죽어', expected: 'debugging' },
  { input: 'ECONNREFUSED 에러가 나요', expected: 'debugging' },

  // ── 단순 수정 (simpleTweak) ──
  { input: '폰트 크기 키워줘', expected: 'simpleTweak' },
  { input: '배경색 바꿔줘', expected: 'simpleTweak' },
  { input: '마진 좀 줄여줘', expected: 'simpleTweak' },
  { input: '버튼 굵게 만들어줘', expected: 'simpleTweak' },
  { input: '패딩을 20px로 바꿔줘', expected: 'simpleTweak' },
  { input: '투명도 조절해줘', expected: 'simpleTweak' },

  // ── 리서치 (research) ──
  { input: '이 코드 좀 조사해줘', expected: 'research' },
  { input: '리서치해줘', expected: 'research' },
  { input: '프로젝트 구조 파악해줘', expected: 'research' },
  { input: '현재 코드베이스 어떻게 되어있어?', expected: 'research' },

  // ── 분석 (analysis) ──
  { input: '매출 데이터 분석해줘', expected: 'analysis' },
  { input: 'DB에서 데이터 뽑아줘', expected: 'analysis' },
  { input: '이번 달 통계 내줘', expected: 'analysis' },
  { input: '로그 패턴 분석해줘', expected: 'analysis' },

  // ── 코드 리뷰 (review) ──
  { input: '코드 리뷰해줘', expected: 'review' },
  { input: '이 코드 괜찮은지 봐줘', expected: 'review' },
  { input: 'PR 확인해줘', expected: 'review' },
  { input: '머지 전에 검토해줘', expected: 'review' },

  // ── 배포 (deploy) ──
  { input: '배포해줘', expected: 'deploy' },
  { input: '서버에 올려줘', expected: 'deploy' },
  { input: '릴리즈 하자', expected: 'deploy' },
  { input: 'deploy to production', expected: 'deploy' },

  // ── 프로젝트 시작 (projectStart) ──
  { input: '블로그 만들자', expected: 'projectStart' },
  { input: '새 프로젝트 시작하자', expected: 'projectStart' },
  { input: '쇼핑몰 앱 시작해보자', expected: 'projectStart' },

  // ── 인사 (greeting) ──
  { input: '안녕', expected: 'greeting' },
  { input: 'hello', expected: 'greeting' },
  { input: '도움말', expected: 'greeting' },

  // ── 인사 + 작업 → 작업 우선 ──
  { input: '안녕 로그인 만들어줘', expected: 'newFeature' },

  // ── 디버깅 + 기능 → 디버깅 우선 ──
  { input: '로그인 에러 고쳐줘', expected: 'debugging' },

  // ── 영어 패턴 ──
  { input: 'fix this bug please', expected: 'debugging' },
  { input: 'add a new feature for search', expected: 'newFeature' },
  { input: 'review this code', expected: 'review' },

  // ── 레퍼런스 디자인 ──
  { input: '랜딩페이지 디자인 만들어줘', expected: 'referenceDesign' },
  { input: '이 사이트 참고해서 웹사이트 만들어줘', expected: 'referenceDesign' },

  // ── 엣지 케이스: 구어체/오타/줄임말 ──
  { input: '이거 왜 안돼?', expected: 'debugging' },
  { input: '작동을 안해', expected: 'debugging' },
  { input: '뭐가 잘못된거야', expected: 'debugging' },
  { input: '페이지가 멈췄어', expected: 'debugging' },
  { input: '서버가 뻗었어', expected: 'debugging' },
  { input: '로그인 기능 해줘', expected: 'newFeature' },
  { input: '좋아요 버튼 해봐', expected: 'newFeature' },
  { input: '검색 기능 할 수 있어?', expected: 'newFeature' },
  { input: '글자 크기 좀 크게 해줘', expected: 'simpleTweak' },
  { input: 'border-radius 바꿔줘', expected: 'simpleTweak' },
  { input: '이 프로젝트 구조 좀 살펴봐', expected: 'research' },
  { input: '아키텍처 파악해줘', expected: 'research' },
  { input: '이번 주 매출 집계해줘', expected: 'analysis' },
  { input: 'CSV로 추출해줘', expected: 'analysis' },
  { input: '머지 전에 PR 확인해줘', expected: 'review' },
  { input: '운영에 반영해줘', expected: 'deploy' },
  { input: '쇼핑몰 프로젝트 시작하자', expected: 'projectStart' },
  { input: 'hi', expected: 'greeting' },
  { input: '안녕 에러 좀 봐줘', expected: 'debugging' },
  { input: 'build failed at line 42', expected: 'debugging' },
  { input: 'Traceback (most recent call last):', expected: 'debugging' },
  { input: 'ENOENT: no such file or directory', expected: 'debugging' },
  { input: '새로운 차트 기능 추가해줘', expected: 'newFeature' },
  { input: '기능 개발 시작하자', expected: 'newFeature' },
  { input: '코드 품질 좀 봐줘', expected: 'review' },
  { input: '이 코드 잘 됐는지 봐줘', expected: 'review' },
  { input: 'staging에 배포해줘', expected: 'deploy' },
  { input: '대시보드 데이터 뽑아줘', expected: 'analysis' },
  { input: 'SQL 쿼리 짜줘', expected: 'analysis' },
  { input: '현재 상태 파악해줘', expected: 'research' },
];

// ── 테스트 실행 ─────────────────────────────────────────────

let pass = 0;
let fail = 0;
const failures = [];

for (const tc of TEST_CASES) {
  const result = getTopMode(tc.input);
  if (result === tc.expected) {
    pass++;
  } else {
    fail++;
    failures.push({
      input: tc.input,
      expected: tc.expected,
      got: result || 'null (매칭 없음)',
    });
  }
}

const total = TEST_CASES.length;
const rate = ((pass / total) * 100).toFixed(1);

console.log(`\n========== 트리거 테스트 결과 ==========`);
console.log(`총: ${total}개  |  통과: ${pass}개  |  실패: ${fail}개`);
console.log(`정확도: ${rate}%  |  목표: 95%`);
console.log(`========================================\n`);

if (failures.length > 0) {
  console.log('실패 케이스:');
  for (const f of failures) {
    console.log(`  "${f.input}"`);
    console.log(`    기대: ${f.expected}  |  실제: ${f.got}`);
  }
  console.log('');
}

if (parseFloat(rate) >= 95) {
  console.log('✅ 모드 매칭 목표 달성! (95% 이상)');
} else {
  console.log('❌ 모드 매칭 목표 미달. 패턴 수정 필요.');
}

// ── ralph-loop 감지 테스트 ────────────────────────────────────

const RALPH_LOOP_PATTERNS = {
  explicit: /ralph.?loop|랄프\s?루프/i,
  batchFix: /(?:전부|전체|모두|다|죄다|싹|싹다|일괄)\s*(?:고쳐|수정|잡아|해결|통과|패스|fix|정리)|하나도\s?남기지/,
  countFix: /\d+\s?(?:개|건|곳)\s*(?:에러|오류|실패|버그|경고|warning)\s*(?:고쳐|수정|잡아|해결|정리|없애)/,
  passAll: /(?:테스트|빌드|린트|타입\s?체크|tsc|eslint|jest|pytest|vitest|npm\s?test)\s*(?:전부|전체|모두|다|100%?|완전히?)?\s*(?:통과|패스|pass|성공|그린)/i,
  zeroError: /(?:에러|오류|실패|경고|warning)\s*(?:0개|없이|없게|제로|zero)/i,
  iterativeFix: /(?:하나씩|하나하나|차례로|순서대로|반복.?(?:수정|고쳐|잡아))|(?:계속|반복)\s*(?:고쳐|수정|돌려)/,
};

function detectRalphLoopTest(prompt) {
  for (const [name, pattern] of Object.entries(RALPH_LOOP_PATTERNS)) {
    if (pattern.test(prompt)) return name;
  }
  return null;
}

const RALPH_CASES = [
  // ralph-loop으로 감지되어야 하는 것들
  { input: 'ralph-loop으로 해줘', expected: true, type: 'explicit' },
  { input: '랄프 루프 실행해', expected: true, type: 'explicit' },
  { input: '에러 전부 고쳐줘', expected: true, type: 'batchFix' },
  { input: '타입 에러 다 잡아줘', expected: true, type: 'batchFix' },
  { input: '테스트 싹 통과시켜', expected: true, type: 'batchFix' },
  { input: '린트 에러 일괄 수정해줘', expected: true, type: 'batchFix' },
  { input: '에러 하나도 남기지 마', expected: true, type: 'batchFix' },
  { input: '15개 에러 고쳐줘', expected: true, type: 'countFix' },
  { input: '3개 실패 잡아줘', expected: true, type: 'countFix' },
  { input: '테스트 전부 통과시켜줘', expected: true, type: 'passAll' },
  { input: 'tsc 에러 다 통과시켜', expected: true, type: 'passAll' },
  { input: 'eslint 전체 패스시켜', expected: true, type: 'passAll' },
  { input: 'npm test 100% 통과', expected: true, type: 'passAll' },
  { input: '에러 0개로 만들어줘', expected: true, type: 'zeroError' },
  { input: '경고 없이 빌드해줘', expected: true, type: 'zeroError' },
  { input: '하나씩 고쳐줘', expected: true, type: 'iterativeFix' },
  { input: '반복 수정해줘', expected: true, type: 'iterativeFix' },
  { input: '빌드 에러 전부 정리해줘', expected: true, type: 'batchFix' },

  // ralph-loop이 아닌 것들 (false negative 방지)
  { input: '로그인 기능 만들어줘', expected: false },
  { input: '에러 났어', expected: false },
  { input: '이 버그 고쳐줘', expected: false },
  { input: '폰트 크기 키워줘', expected: false },
  { input: '리뷰해줘', expected: false },
];

let rPass = 0;
let rFail = 0;
const rFailures = [];

for (const tc of RALPH_CASES) {
  const result = detectRalphLoopTest(tc.input);
  const detected = result !== null;
  if (detected === tc.expected) {
    rPass++;
  } else {
    rFail++;
    rFailures.push({
      input: tc.input,
      expected: tc.expected ? `ralph (${tc.type})` : 'null',
      got: result || 'null',
    });
  }
}

const rTotal = RALPH_CASES.length;
const rRate = ((rPass / rTotal) * 100).toFixed(1);

console.log(`\n========== ralph-loop 감지 테스트 ==========`);
console.log(`총: ${rTotal}개  |  통과: ${rPass}개  |  실패: ${rFail}개`);
console.log(`정확도: ${rRate}%  |  목표: 95%`);
console.log(`============================================\n`);

if (rFailures.length > 0) {
  console.log('실패 케이스:');
  for (const f of rFailures) {
    console.log(`  "${f.input}"`);
    console.log(`    기대: ${f.expected}  |  실제: ${f.got}`);
  }
  console.log('');
}

if (parseFloat(rRate) >= 95) {
  console.log('✅ ralph-loop 감지 목표 달성!');
} else {
  console.log('❌ ralph-loop 감지 목표 미달.');
}

// 종합
const totalAll = total + rTotal;
const passAll = pass + rPass;
const rateAll = ((passAll / totalAll) * 100).toFixed(1);
console.log(`\n========== 종합 결과 ==========`);
console.log(`총: ${totalAll}개  |  통과: ${passAll}개  |  정확도: ${rateAll}%`);
console.log(`================================\n`);

process.exit(parseFloat(rate) >= 95 ? 0 : 1);
