#!/usr/bin/env node

/**
 * vibecraft Stop 훅 — 매 응답 끝 리마인더 + 스킬/에이전트 상태 정리
 *
 * Claude가 응답을 완료할 때마다 실행되어:
 * 1. 현재 RPDCA 단계에 맞는 다음 명령어를 자동 제안
 * 2. 진행 중인 작업이 있으면 상태를 상기
 * 3. 명령어 목록을 항상 표시하여 누락 방지
 */

const fs = require('fs');
const path = require('path');

// ── RPDCA 단계별 추천 명령어 ────────────────────────────────

const PHASE_GUIDE = {
  'pre-research': {
    next: '/research',
    message: '리서치를 시작하세요',
    commands: '/research — 코드 조사  |  /feature — 새 기능  |  /debug — 디버깅',
  },
  research: {
    next: '/plan 또는 /brainstorm',
    message: '리서치 완료. 계획 또는 설계를 시작하세요',
    commands: '/plan — 구현 계획  |  /brainstorm — 설계  |  /feature — 새 기능',
  },
  plan: {
    next: '/execute',
    message: '계획 작성 완료. 실행을 시작하세요',
    commands: '/execute — 실행  |  /plan — 계획 수정  |  /team — 팀 구성',
  },
  do: {
    next: '/verify',
    message: '구현 진행 중. 완료 후 검증하세요',
    commands: '/verify — 검증  |  /review — 코드 리뷰  |  /debug — 디버깅',
  },
  check: {
    next: '/verify (재검증)',
    message: '검증 중. Gap이 있으면 수정 후 재검증하세요',
    commands: '/verify — 재검증  |  /execute — 추가 구현  |  /review — 리뷰',
  },
  act: {
    next: '커밋 또는 /deploy',
    message: '작업 완료! 커밋하거나 배포하세요',
    commands: '/review — 최종 리뷰  |  /deploy — 배포  |  /simplify — 코드 정리',
  },
};

const DEFAULT_COMMANDS = '/feature — 새 기능  |  /debug — 디버깅  |  /kickoff — 프로젝트 시작\n/research — 조사  |  /review — 리뷰  |  /deploy — 배포  |  /analyze — 분석';

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
  const lines = [];

  lines.push('');
  lines.push('---');

  if (rpdca) {
    const guide = PHASE_GUIDE[rpdca.phase] || PHASE_GUIDE['pre-research'];
    lines.push(`[vibecraft] ${rpdca.feature} — ${guide.message}`);
    lines.push(`  다음: ${guide.next}`);
    lines.push(`  ${guide.commands}`);
  } else {
    lines.push('[vibecraft] 사용 가능한 명령어:');
    lines.push(`  ${DEFAULT_COMMANDS}`);
  }

  lines.push('  /ralph — 반복 자동 수정  |  /pdca — 진행 상태  |  /team — 에이전트팀');
  lines.push('  전체 명령어 목록: /vibecraft');
  lines.push('---');

  console.log(lines.join('\n'));
} catch {
  process.exit(0);
}
