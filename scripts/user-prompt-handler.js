#!/usr/bin/env node

/**
 * vibecraft UserPromptSubmit 훅 — 강화된 의도 감지 + 스킬 지시 주입
 *
 * v2.0: 15가지+ 패턴, 퍼지 매칭, 에이전트 암묵적 트리거,
 *       "반드시 호출하라"는 강한 시스템 지시 출력
 */

const fs = require('fs');
const path = require('path');

// ── 패턴 정의 ──────────────────────────────────────────────

const PATTERNS = {
  // 우선순위 0: 인사 (작업 요청 없을 때만)
  greeting: {
    primary: /^(안녕|하이|헬로|hi|hello|처음|시작)\s*[.!?~]*$/i,
    secondary: /뭐\s?할\s?수\s?있|도움|help|도움말/i,
    skill: 'vibecraft:welcome-guide',
    label: '인사/도움말',
    priority: 0,
  },

  // 우선순위 1: 단순 수정
  simpleTweak: {
    primary: /바꿔\s?줘|색상|크기|폰트|패딩|마진|간격|높이|너비|굵기|투명도|키워\s?줘|줄여\s?줘|늘려\s?줘|줄여|굵게|얇게|밝게|어둡게|넓게|좁게/,
    secondary: /글자\s?크기|글씨\s?크기|배경\s?색|테두리|border|font.?size|padding|margin|opacity|width|height|gap|radius/i,
    skill: null,
    label: '단순 수정',
    priority: 1,
  },

  // 우선순위 1.5: 레퍼런스 디자인
  referenceDesign: {
    primary: /랜딩\s?페이지|웹\s?사이트|홈\s?페이지|레퍼런스|참고\s?사이트/,
    secondary: /UI|디자인|페이지\s?만들|화면\s?만들|사이트\s?만들|landing|website/i,
    // 두 그룹 중 하나 이상 + 페이지/사이트 키워드 동시 필요
    combo: true,
    skill: 'vibecraft:reference-design',
    label: '레퍼런스 디자인',
    priority: 1.5,
  },

  // 우선순위 2: 디버깅
  debugging: {
    primary: /에러|버그|오류|안\s?돼|안\s?되|안됨|실패|크래시|터져|터졌|깨져|깨졌|뻗어|뻗었|멈춰|멈췄|죽어|죽었|디버깅|디버그/,
    secondary: /작동.*안|동작.*안|왜\s?(?:이래|이러지|그래|그러지|안|이렇게)|뭐가\s?(?:문제|잘못|틀렸)|고장|먹통|무한\s?루프|무한\s?로딩|버그\s?수정|에러\s?수정|오류\s?수정/,
    english: /error|bug|fix|crash|exception|fail|broken|not\s?work|debug|TypeError|Cannot\s+read|undefined\s+is\s+not|null\s+pointer|stack\s?trace|Traceback/i,
    // 에러 메시지/스택트레이스 패턴
    stackTrace: /at\s+\w+\s*\(|Traceback\s*\(|line\s+\d+|:\d+:\d+\)|ENOENT|EACCES|ECONNREFUSED|ERR_|FATAL|panic:/,
    skill: 'vibecraft:systematic-debugging',
    label: '디버깅',
    priority: 2,
  },

  // 우선순위 2.5: 리서치
  research: {
    primary: /리서치|조사해?\s?줘|파악해?\s?줘|살펴\s?봐|확인해?\s?봐/,
    secondary: /코드\s?조사|구조\s?파악|어떻게\s?되어?\s?있|현재\s?상태\s?파악|코드\s?베이스|아키텍처\s?파악/,
    english: /research|investigate|explore\s+code|understand\s+code/i,
    skill: 'vibecraft:research',
    label: '리서치',
    priority: 2.5,
  },

  // 우선순위 2.7: 네이버 진단
  naverDiagnosis: {
    primary: /네이버|블로그|카페|플레이스|스마트스토어|검색\s?최적화/,
    secondary: /진단|점검|분석|자동화|트래픽|노출|순위|검색어/,
    english: /naver|blog|cafe|place|smartstore|SEO/i,
    skill: 'vibecraft:naver-diagnosis',
    label: '네이버 진단',
    priority: 2.7,
  },

  // 우선순위 2.8: 패킷 캡처
  packetCapture: {
    primary: /패킷|API\s?추출|네트워크\s?캡처|요청\s?분석|XHR|fetch\s?요청/,
    secondary: /API\s?따|패킷\s?따|트래픽\s?분석|엔드포인트\s?찾|API\s?역분석|인터셉트/,
    english: /packet|network\s?capture|intercept|request\s?capture|API\s?extract/i,
    skill: 'vibecraft:packet-capture',
    label: '패킷 캡처',
    priority: 2.8,
  },

  // 우선순위 3: 분석
  analysis: {
    primary: /분석해?\s?줘|데이터\s?뽑아|DB\s?조회|쿼리|통계|리포트|집계|현황|추출/,
    secondary: /로그\s?분석|패턴\s?분석|트렌드|비교해?\s?줘|수치|지표|대시보드|엑셀|CSV/,
    english: /analyz|report|statistic|aggregate|query|dashboard|metric/i,
    skill: 'vibecraft:analysis-delegation',
    label: '데이터 분석',
    priority: 3,
  },

  // 우선순위 4: 코드 리뷰
  review: {
    primary: /리뷰|검토|봐\s?줘|확인해?\s?줘|체크해?\s?줘/,
    secondary: /괜찮은지|문제\s?없는지|잘\s?됐는지|코드\s?품질|PR\s?확인|머지\s?전/,
    english: /review|check\s*(?:code|quality|this)|look\s+at\s+(?:this|the\s+code)|\bPR\b/i,
    skill: 'vibecraft:code-review-request',
    label: '코드 리뷰',
    priority: 4,
  },

  // 우선순위 5: 배포
  deploy: {
    primary: /배포|릴리즈|서버에?\s?올려|운영.*반영|프로덕션|deploy/i,
    secondary: /빌드\s?(?:하고|해서)\s?배포|docker|kubernetes|CI\s?\/?\s?CD/,
    english: /deploy|release|publish|production|staging/i,
    skill: 'vibecraft:deploy-guide',
    label: '배포',
    priority: 5,
  },

  // 우선순위 6: 새 기능
  newFeature: {
    primary: /만들어\s?줘|추가해\s?줘|구현해\s?줘|넣어\s?줘|개발해\s?줘|수정해\s?줘|변경해\s?줘|개선해\s?줘|기능\s?개발|기능\s?추가|기능\s?구현|기능\s?수정|기능\s?변경/,
    secondary: /해\s?줘|해\s?봐|하고\s?싶|할\s?수\s?있|필요해|있었으면|있으면\s?좋겠|바꿔\s?줘|고쳐\s?줘|개선/,
    functional: /기능.*(?:개발|작업|시작|추가|구현|만들|수정|변경)|(?:개발|작업|시작|추가|수정|변경).*기능|새로운?\s?\w+\s?(?:만들|추가|구현|개발)/,
    english: /feature|implement|create|build|modify|change|update|improve|add\s+(?:new|a)\s+/i,
    skill: 'vibecraft:new-feature',
    label: '새 기능',
    priority: 6,
  },

  // 우선순위 7: 프로젝트 시작
  projectStart: {
    primary: /만들자|시작하자|시작해\s?보자|프로젝트\s?(?:만들|시작|생성|초기화)/,
    secondary: /앱\s?만들|사이트\s?만들|새\s?프로젝트|처음부터|init|scaffold|boilerplate/i,
    skill: 'vibecraft:project-kickoff',
    label: '프로젝트 시작',
    priority: 7,
  },
};

// ── ralph-loop 감지 패턴 ────────────────────────────────────
// ralph-loop은 독립 모드가 아니라 "실행 방식"이므로 PATTERNS에 넣지 않고 별도 처리

const RALPH_LOOP_PATTERNS = {
  // 명시적 요청
  explicit: /ralph.?loop|랄프\s?루프/i,

  // 일괄 수정 패턴 (여러 개를 반복적으로 고치는 느낌)
  batchFix: /(?:전부|전체|모두|다|죄다|싹|싹다|일괄)\s*(?:고쳐|수정|잡아|해결|통과|패스|fix|정리)|하나도\s?남기지/,

  // "N개" + 수정 패턴
  countFix: /\d+\s?(?:개|건|곳)\s*(?:에러|오류|실패|버그|경고|warning)\s*(?:고쳐|수정|잡아|해결|정리|없애)/,

  // 테스트/빌드/린트 전체 통과 요청
  passAll: /(?:테스트|빌드|린트|타입\s?체크|tsc|eslint|jest|pytest|vitest|npm\s?test)\s*(?:전부|전체|모두|다|100%?|완전히?)?\s*(?:통과|패스|pass|성공|그린)/i,

  // 에러 0개 목표
  zeroError: /(?:에러|오류|실패|경고|warning)\s*(?:0개|없이|없게|제로|zero)/i,

  // 반복 수정 느낌
  iterativeFix: /(?:하나씩|하나하나|차례로|순서대로|반복.?(?:수정|고쳐|잡아))|(?:계속|반복)\s*(?:고쳐|수정|돌려)/,
};

function detectRalphLoop(prompt) {
  for (const [name, pattern] of Object.entries(RALPH_LOOP_PATTERNS)) {
    if (pattern.test(prompt)) {
      return name;
    }
  }
  return null;
}

// ── 에이전트 암묵적 트리거 ──────────────────────────────────

const AGENT_TRIGGERS = {
  'test-writer': /테스트\s?(?:작성|만들|추가|짜)|TDD|단위\s?테스트|E2E|통합\s?테스트|jest|pytest|vitest/i,
  'frontend-builder': /프론트\s?엔드|UI\s?(?:만들|구현|작성)|컴포넌트\s?(?:만들|추가)|화면\s?(?:만들|구현)|CSS|스타일링|tailwind/i,
  'backend-builder': /API\s?(?:만들|구현|추가)|백엔드|서버\s?(?:만들|구현)|엔드\s?포인트|DB\s?연동|REST|GraphQL/i,
  'debugger': /디버그|디버깅|원인\s?(?:찾|추적|파악)|스택\s?트레이스|breakpoint/i,
  'code-reviewer': /리뷰|코드\s?검토|PR\s?확인|merge\s?전/i,
  'data-analyst': /데이터\s?분석|쿼리\s?(?:작성|실행)|통계|집계|SQL|로그\s?분석/i,
};

// ── 스킬 체이닝 힌트 (현재 RPDCA 단계 기반) ─────────────────

const RPDCA_HINTS = {
  research: '현재 Research 단계입니다. 리서치 완료 후 /plan으로 구현 계획을 작성하세요.',
  plan: '현재 Plan 단계입니다. 계획 확인 후 /execute로 실행하세요.',
  do: '현재 Do 단계입니다. 구현 완료 후 /verify로 검증하세요.',
  check: '현재 Check 단계입니다. gap-detector 결과를 확인하세요.',
  act: '현재 Act 단계입니다. 개선 사항을 반영하세요.',
};

// ── 유틸리티 함수들 ─────────────────────────────────────────

function detectRpdcaPhase() {
  const plansDir = path.resolve('docs/plans');
  if (!fs.existsSync(plansDir)) return null;

  const entries = fs.readdirSync(plansDir, { withFileTypes: true });
  const features = entries.filter(e => e.isDirectory() && e.name !== 'archive');

  if (features.length === 0) return null;

  // 가장 최근 feature 기준
  const feature = features[features.length - 1].name;
  const featureDir = path.join(plansDir, feature);

  const hasResearch = fs.existsSync(path.join(featureDir, 'research.md'));
  const hasPlan = fs.existsSync(path.join(featureDir, 'plan.md'));
  const hasPlanReview = fs.existsSync(path.join(featureDir, 'plan-review.md'));

  if (hasPlan && hasPlanReview) return { feature, phase: 'do' };
  if (hasPlan) return { feature, phase: 'plan' };
  if (hasResearch) return { feature, phase: 'research' };
  return { feature, phase: 'research' };
}

function matchPatterns(prompt) {
  const matches = [];

  for (const [modeName, config] of Object.entries(PATTERNS)) {
    let score = 0;

    // combo 모드 (referenceDesign): 두 그룹 동시 매칭 필요
    if (config.combo) {
      const hasPrimary = config.primary.test(prompt);
      const hasSecondary = config.secondary.test(prompt);
      if (hasPrimary || hasSecondary) {
        // 둘 다 있으면 확실, 하나만 있으면 약한 매치
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

  // 점수 내림차순, 동점이면 우선순위 오름차순
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.config.priority - b.config.priority;
  });

  return matches;
}

function matchAgents(prompt) {
  const matched = [];
  for (const [agentName, pattern] of Object.entries(AGENT_TRIGGERS)) {
    if (pattern.test(prompt)) {
      matched.push(agentName);
    }
  }
  return matched;
}

function hasWorkRequest(prompt) {
  // 인사와 함께 작업 요청이 있는지 확인
  return /만들|추가|구현|수정|고쳐|해\s?줘|바꿔|에러|버그|리뷰|배포|분석|시작|개발/.test(prompt);
}

// ── 메인 로직 ───────────────────────────────────────────────

try {
  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const prompt = (input.prompt || '').trim();

  if (!prompt || prompt.startsWith('/')) {
    process.exit(0);
  }

  // 패턴 매칭
  const matches = matchPatterns(prompt);

  if (matches.length === 0) {
    process.exit(0);
  }

  const top = matches[0];

  // 인사 모드: 작업 요청이 함께 있으면 스킵
  if (top.mode === 'greeting' && hasWorkRequest(prompt)) {
    matches.shift();
    if (matches.length === 0) process.exit(0);
  }

  const best = matches[0];
  const isHighConfidence = best.score >= 2 && (matches.length === 1 || best.score > (matches[1]?.score || 0));

  // ralph-loop 감지 (모드와 별개로 실행 방식 제안)
  const ralphMatch = detectRalphLoop(prompt);

  // 에이전트 암묵적 트리거
  const matchedAgents = matchAgents(prompt);

  // RPDCA 상태 확인
  const rpdca = detectRpdcaPhase();

  // ── 출력 생성 ─────────────────────────────────────────────

  const lines = [];

  // ralph-loop 명시적 요청이면 최우선 처리
  if (ralphMatch === 'explicit') {
    lines.push(`[SYSTEM] ralph-loop 명시적 요청 감지.`);
    lines.push(`반드시 executing-plans에 ralphLoop: true를 전달하고 team-orchestration ralph-loop 모드로 실행하세요.`);
    lines.push(`1. 검증 명령어를 확정하세요 (npm test, npx tsc --noEmit 등)`);
    lines.push(`2. 초기 측정 → 실패 항목 파싱 → Iteration 루프 시작`);
  } else if (isHighConfidence) {
    // 높은 신뢰도: 강한 지시
    if (best.config.skill === null) {
      // simpleTweak 등 스킬 없이 직접 가이드하는 패턴
      lines.push(`[SYSTEM] 단순 수정 요청입니다. 수정 위치를 알려주고 사용자에게 직접 수정 기회를 제공하세요.`);
    } else {
      lines.push(`[SYSTEM] 사용자가 ${best.config.label} 작업을 요청했습니다.`);
      lines.push(`반드시 Skill 도구로 ${best.config.skill} 스킬을 호출하세요.`);
      lines.push(`이 스킬을 호출하지 않고 코드를 바로 작성하면 계획 없는 구현이 됩니다.`);
      lines.push(`스킬을 먼저 호출한 후에만 작업을 시작하세요.`);
    }
  } else {
    // 낮은 신뢰도: 후보 제시 + 1순위 추천
    const candidates = matches.slice(0, 3);
    lines.push(`[SYSTEM] 사용자 의도 후보 ${candidates.length}개 감지:`);
    candidates.forEach((m, i) => {
      const skillInfo = m.config.skill ? m.config.skill : '(직접 가이드)';
      lines.push(`  ${i + 1}. ${m.config.label} → ${skillInfo}`);
    });
    if (best.config.skill === null) {
      lines.push(`1순위 "${best.config.label}"은 단순 수정입니다. 수정 위치를 알려주고 사용자에게 직접 수정 기회를 제공하세요.`);
    } else {
      lines.push(`1순위인 "${best.config.label}"에 해당하면 Skill 도구로 ${best.config.skill}을 호출하세요.`);
    }
    lines.push(`확실하지 않으면 사용자에게 선택지를 제시하세요.`);
  }

  // ralph-loop 제안 (명시적이 아닌 일괄 수정 패턴 감지 시)
  if (ralphMatch && ralphMatch !== 'explicit') {
    lines.push(`[ralph-loop 제안] 이 요청은 "여러 항목을 반복 수정"하는 패턴입니다.`);
    lines.push(`ralph-loop(반복 자동 수정)으로 진행하면 효율적입니다.`);
    lines.push(`사용자에게 "ralph-loop으로 자동 반복 수정할까요?" 선택지를 반드시 제시하세요.`);
    lines.push(`수락하면: 검증 명령어 확정 → 초기 측정 → team-orchestration ralph-loop 모드`);
  }

  // 에이전트 힌트
  if (matchedAgents.length > 0) {
    lines.push(`[에이전트 힌트] 이 작업에 적합한 에이전트: ${matchedAgents.join(', ')}`);
  }

  // RPDCA 진행 상황
  if (rpdca) {
    lines.push(`[RPDCA] 진행 중: ${rpdca.feature} (${rpdca.phase} 단계)`);
    if (RPDCA_HINTS[rpdca.phase]) {
      lines.push(RPDCA_HINTS[rpdca.phase]);
    }
  }

  // 사용 가능한 명령어 힌트
  lines.push(`[명령어] /feature /research /plan /execute /verify /debug /review /deploy /brainstorm /kickoff /analyze /ralph /team /pdca`);

  console.log(lines.join('\n'));

} catch (error) {
  // stdin 파싱 실패 등 — 조용히 종료
  process.exit(0);
}
