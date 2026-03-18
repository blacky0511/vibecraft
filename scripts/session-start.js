#!/usr/bin/env node

/**
 * vibecraft 세션 시작 훅
 * 세션이 시작될 때 vibecraft가 활성화되었음을 알리고,
 * Codex MCP 설치 상태를 확인한다.
 */

const { execSync } = require('child_process');

// Codex CLI 설치 여부 확인
let codexInstalled = false;
try {
  execSync('codex --version', { stdio: 'ignore' });
  codexInstalled = true;
} catch {
  codexInstalled = false;
}

const lines = [
  'vibecraft가 활성화되었습니다.',
  '작업을 요청하면 자동으로 상황을 감지하고 적절한 워크플로우를 안내합니다.',
  '',
  '지원 모드: 새 기능 | 디버깅 | 프로젝트 시작 | 코드 리뷰 | 배포',
  '도움말: /vibecraft'
];

if (!codexInstalled) {
  lines.push('');
  lines.push('[Codex MCP 미설치] plan-critic의 외부 리뷰(GPT)를 사용하려면:');
  lines.push('  npm install -g @openai/codex && codex login');
  lines.push('  (없어도 서브에이전트 폴백으로 정상 동작합니다)');
}

console.log(lines.join('\n'));
