#!/usr/bin/env node

/**
 * vibecraft Stop 훅 — 매 응답 끝 리마인더 + 꿀팁
 *
 * Claude가 응답을 완료할 때마다 실행되어:
 * 1. 현재 RPDCA 단계에 맞는 다음 명령어를 자동 제안
 * 2. 랜덤 꿀팁 1개를 표시하여 사용법을 상기
 */

const fs = require('fs');
const path = require('path');

// ── 꿀팁 풀 ────────────────────────────────────────────────

const TIPS = [
  '💡 명령어를 몰라도 됩니다 — 그냥 하고 싶은 걸 말하세요',
  '💡 에러 메시지를 통째로 붙여넣으면 AI가 더 정확하게 분석합니다',
  '💡 /feature [설명]으로 AI가 크기를 판단하고 계획부터 세워줍니다',
  '💡 /packet [URL]로 웹사이트의 숨겨진 API를 추출할 수 있습니다',
  '💡 /ralph [명령]으로 에러를 하나씩 자동 반복 수정합니다',
  '💡 /team [설명]으로 여러 AI가 동시에 병렬 작업합니다',
  '💡 /research [대상]으로 기존 코드를 먼저 분석하면 실수가 줄어듭니다',
  '💡 /review만 입력하면 변경사항을 자동으로 리뷰합니다',
  '💡 /brainstorm [아이디어]로 아이디어를 설계로 발전시킬 수 있습니다',
  '💡 /naver [증상]으로 네이버 자동화 문제를 진단합니다',
  '💡 자연어로 "이거 좀 이상해"만 해도 디버깅이 시작됩니다',
  '💡 /simplify [경로]로 코드를 깔끔하게 정리할 수 있습니다',
  '💡 /deploy로 배포 전 체크리스트를 자동 확인합니다',
  '💡 큰 작업은 /feature, 간단한 건 그냥 말하세요 — AI가 판단합니다',
  '💡 /verify로 작업이 제대로 됐는지 최종 검증합니다',
  '💡 "안 돼", "느려", "안 나와" 같은 말만 해도 디버깅이 시작됩니다',
  '💡 스크린샷을 붙여넣으면 AI가 화면을 보고 문제를 파악합니다',
  '💡 "커밋해줘"만 하면 AI가 커밋 메시지를 자동 작성합니다',
  '💡 Git 명령어를 몰라도 됩니다 — "브랜치 만들어줘"만 하세요',
  '💡 구체적으로 말할수록 정확합니다 — 파일명, 에러 메시지를 포함하세요',
  '💡 ! 를 앞에 붙이면 터미널 명령어를 실행합니다 (예: ! npm run dev)',
  '💡 "왜 이렇게 했어?"라고 물어보면 코드 선택 이유를 설명합니다',
  '💡 "이거 맞아?"라고 물어보면 코드 리뷰가 시작됩니다',
  '💡 코드를 복붙할 필요 없습니다 — AI가 직접 파일을 읽고 수정합니다',
  '💡 대화가 길어지면 /compact로 컨텍스트를 정리하세요',
  '💡 AI가 잘못 수정했으면 "되돌려줘"라고 하면 됩니다',
  '💡 /kickoff [이름]으로 새 프로젝트를 처음부터 시작할 수 있습니다',
  '💡 한번에 여러 개보다 하나씩 시키면 품질이 더 좋습니다',
  '💡 "크롤링해줘", "데이터 긁어줘"만 해도 패킷 캡처가 시작됩니다',
  '💡 테스트 코드도 AI가 자동 작성합니다 — 따로 요청하지 않아도 됩니다',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── RPDCA 단계별 추천 명령어 ────────────────────────────────

const PHASE_GUIDE = {
  'pre-research': {
    next: '/research 또는 /feature',
    message: '작업을 시작하세요',
    commands: '/feature [설명]  |  /debug [증상]  |  /research [대상]',
  },
  research: {
    next: '/plan',
    message: '리서치 완료. 계획을 작성하세요',
    commands: '/plan [설명]  |  /brainstorm [아이디어]',
  },
  plan: {
    next: '/execute',
    message: '계획 완료. 실행하세요',
    commands: '/execute  |  /team [설명]',
  },
  do: {
    next: '/verify',
    message: '구현 중. 완료 후 검증하세요',
    commands: '/verify  |  /review  |  /debug [증상]',
  },
  check: {
    next: '/verify',
    message: '검증 중',
    commands: '/verify  |  /execute',
  },
  act: {
    next: '커밋 또는 /deploy',
    message: '작업 완료!',
    commands: '/review  |  /deploy  |  /simplify [경로]',
  },
};

const DEFAULT_COMMANDS = '/feature [설명]  |  /debug [증상]  |  /review  |  /packet [URL]';

// ── RPDCA 상태 감지 ─────────────────────────────────────────

function detectRpdcaState() {
  const plansDir = path.resolve('docs/plans');
  if (!fs.existsSync(plansDir)) return null;

  try {
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });
    const features = entries.filter(e => e.isDirectory() && e.name !== 'archive');

    if (features.length === 0) return null;

    const feature = features[features.length - 1].name;
    const featureDir = path.join(plansDir, feature);

    const hasResearch = fs.existsSync(path.join(featureDir, 'research.md'));
    const hasPlan = fs.existsSync(path.join(featureDir, 'plan.md'));
    const hasPlanReview = fs.existsSync(path.join(featureDir, 'plan-review.md'));

    let phase;
    if (hasPlan && hasPlanReview) phase = 'do';
    else if (hasPlan) phase = 'plan';
    else if (hasResearch) phase = 'research';
    else phase = 'pre-research';

    return { feature, phase };
  } catch {
    return null;
  }
}

// ── 메인 ────────────────────────────────────────────────────

try {
  const rpdca = detectRpdcaState();
  const tip = pickRandom(TIPS);
  const lines = [];

  lines.push('');
  lines.push('---');

  if (rpdca) {
    const guide = PHASE_GUIDE[rpdca.phase] || PHASE_GUIDE['pre-research'];
    lines.push(`📍 ${rpdca.feature} — ${guide.message}`);
    lines.push(`  ${guide.commands}`);
  } else {
    lines.push(`📋 ${DEFAULT_COMMANDS}`);
  }

  lines.push(tip);
  lines.push('---');

  console.log(lines.join('\n'));
} catch {
  process.exit(0);
}
