#!/usr/bin/env node

/**
 * vibecraft 세션 시작 훅
 * 세션이 시작될 때 vibecraft가 활성화되었음을 알리고,
 * Codex MCP 설치 상태를 확인한다.
 */

const { execSync } = require('child_process');

const lines = [
  'vibecraft가 활성화되었습니다.',
  '',
  '💬 이렇게 말해보세요:',
  '  "로그인 기능 만들어줘" — AI가 자동으로 계획부터 세워줍니다',
  '  "에러 나는데 고쳐줘" — 원인 분석부터 시작합니다',
  '  "이 코드 봐줘" — 코드 리뷰를 진행합니다',
  '',
  '📋 명령어로도 사용 가능:',
  '  /feature [설명]  — 새 기능/수정',
  '  /debug [증상]    — 버그/에러 수정',
  '  /review          — 코드 리뷰',
  '  /packet [URL]    — API 패킷 캡처',
  '',
  '전체 명령어: /vibecraft'
];

console.log(lines.join('\n'));
