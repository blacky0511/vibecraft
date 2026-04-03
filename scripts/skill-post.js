#!/usr/bin/env node

/**
 * vibecraft PostToolUse(Skill) 훅 — 스킬 완료 후 다음 단계 자동 제안
 *
 * 스킬이 실행된 후, RPDCA 체인에서 다음에 호출해야 할 스킬을 추천한다.
 */

const fs = require('fs');

// ── 스킬 체이닝 맵 ──────────────────────────────────────────

const SKILL_CHAIN = {
  // RPDCA 워크플로우 체인
  'vibecraft:research': {
    next: '/plan (구현 계획 작성)',
    hint: 'research 완료. Skill 도구로 vibecraft:writing-plans를 호출하세요.',
  },
  'vibecraft:writing-plans': {
    next: '/execute (계획 실행)',
    hint: '계획 작성 완료. 사용자 확인 후 Skill 도구로 vibecraft:executing-plans를 호출하세요.',
  },
  'vibecraft:executing-plans': {
    next: '/verify (검증)',
    hint: '실행 완료. Skill 도구로 vibecraft:verification을 호출하세요.',
  },
  'vibecraft:verification': {
    next: '검증 완료! /review (코드 리뷰) 또는 커밋',
    hint: '검증 통과. 사용자에게 결과를 보고하세요.',
  },

  // 디버깅 체인
  'vibecraft:systematic-debugging': {
    next: '/verify (수정 검증)',
    hint: '디버깅 완료. Skill 도구로 vibecraft:verification을 호출하여 수정을 검증하세요.',
  },

  // 기타
  'vibecraft:new-feature': {
    next: 'S/M/L 크기를 판단하고 워크플로우를 실행합니다',
    hint: 'new-feature가 크기를 판단하고 적절한 워크플로우를 실행합니다.',
  },
  'vibecraft:project-kickoff': {
    next: '/plan (구현 계획)',
    hint: '프로젝트 초기 설정 완료. 다음 단계로 진행하세요.',
  },
  'vibecraft:code-review-request': {
    next: '리뷰 피드백 반영',
    hint: '리뷰 완료. 피드백이 있으면 수정하세요.',
  },
  'vibecraft:deploy-guide': {
    next: '배포 체크리스트 실행',
    hint: '배포 가이드 완료.',
  },
  'vibecraft:analysis-delegation': {
    next: '분석 결과 확인',
    hint: '분석 완료.',
  },
};

// ── 메인 ────────────────────────────────────────────────────

try {
  // TOOL_INPUT에서 스킬명 추출
  const toolInput = process.env.TOOL_INPUT || '';
  let skillName = '';

  try {
    const parsed = JSON.parse(toolInput);
    skillName = parsed.skill || '';
  } catch {
    // JSON 파싱 실패 시 문자열로 시도
    skillName = toolInput.trim();
  }

  // vibecraft: 접두사가 없으면 붙이기
  if (skillName && !skillName.includes(':')) {
    skillName = `vibecraft:${skillName}`;
  }

  const chain = SKILL_CHAIN[skillName];

  if (chain) {
    const lines = [
      `[vibecraft] ${skillName.replace('vibecraft:', '')} 스킬 완료`,
      `  다음 단계: ${chain.next}`,
      `  ${chain.hint}`,
    ];
    console.log(lines.join('\n'));
  }

} catch {
  process.exit(0);
}
