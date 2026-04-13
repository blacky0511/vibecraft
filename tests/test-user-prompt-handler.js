#!/usr/bin/env node
// user-prompt-handler.js 패턴 매칭 테스트
// 실행: node tests/test-user-prompt-handler.js

const { spawnSync } = require('child_process');
const path = require('path');

const handler = path.resolve(__dirname, '../scripts/user-prompt-handler.js');

function runWithPrompt(prompt) {
  const input = JSON.stringify({ prompt });
  const result = spawnSync('node', [handler], {
    input,
    encoding: 'utf8',
    timeout: 5000,
  });
  return result.stdout || '';
}

const tests = [
  // 디버깅 패턴 매칭 (기존)
  { prompt: 'ENOENT 에러 나요', expect: '디버깅' },
  { prompt: 'EACCES permission denied', expect: '디버깅' },
  { prompt: 'ECONNREFUSED 127.0.0.1', expect: '디버깅' },
  { prompt: 'ERR_MODULE_NOT_FOUND', expect: '디버깅' },
  { prompt: 'TypeError: Cannot read', expect: '디버깅' },
  // 시스템 메시지 오탐 방지 (v2.2.0 신규, Blocker #4)
  { prompt: '<task-notification>\n<task-id>abc</task-id>\n에러 작업 완료\n</task-notification>', expect: 'NO_OUTPUT' },
  { prompt: '<system-reminder>\n버그 수정 규칙\n</system-reminder>', expect: 'NO_OUTPUT' },
  { prompt: '[SYSTEM NOTIFICATION - NOT USER INPUT] 디버깅 작업 관련', expect: 'NO_OUTPUT' },
  { prompt: '[SYSTEM] 사용자가 디버깅 작업을 요청했습니다', expect: 'NO_OUTPUT' },
  { prompt: 'UserPromptSubmit hook success: 디버깅 감지됨', expect: 'NO_OUTPUT' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const out = runWithPrompt(t.prompt);
  // NO_OUTPUT: 시스템 메시지 케이스 — 출력이 비어야 함
  if (t.expect === 'NO_OUTPUT') {
    if (out.trim() === '') {
      console.log(`PASS: [시스템 메시지 스킵] ${t.prompt.slice(0, 50)}...`);
      passed++;
    } else {
      console.log(`FAIL: [시스템 메시지 오탐] ${t.prompt.slice(0, 50)}`);
      console.log(`  출력: ${out.slice(0, 200)}`);
      failed++;
    }
    continue;
  }
  if (out.includes(t.expect)) {
    console.log(`PASS: "${t.prompt}"`);
    passed++;
  } else {
    console.log(`FAIL: "${t.prompt}" (기대: ${t.expect})`);
    console.log(`  출력: ${out.slice(0, 200)}`);
    failed++;
  }
}

console.log(`\n결과: ${passed}/${tests.length} 통과`);
process.exit(failed > 0 ? 1 : 0);
