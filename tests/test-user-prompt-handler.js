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
  { prompt: 'ENOENT 에러 나요', expect: '디버깅' },
  { prompt: 'EACCES permission denied', expect: '디버깅' },
  { prompt: 'ECONNREFUSED 127.0.0.1', expect: '디버깅' },
  { prompt: 'ERR_MODULE_NOT_FOUND', expect: '디버깅' },
  { prompt: 'TypeError: Cannot read', expect: '디버깅' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const out = runWithPrompt(t.prompt);
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
