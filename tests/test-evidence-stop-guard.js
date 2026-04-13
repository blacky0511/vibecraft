#!/usr/bin/env node
// evidence-stop-guard.js 테스트

const { spawnSync } = require('child_process');
const path = require('path');

const guard = path.resolve(__dirname, '../scripts/evidence-stop-guard.js');

function run(payload) {
  const result = spawnSync('node', [guard], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return { stdout: result.stdout, exitCode: result.status };
}

const tests = [
  {
    name: 'stop_hook_active이면 통과 (무한 루프 방지)',
    payload: { stop_hook_active: true, transcript_path: '/nonexistent' },
    expectDecision: null,
  },
  {
    name: 'transcript_path가 존재하지 않으면 통과',
    payload: { stop_hook_active: false, transcript_path: '/nonexistent-path-xyz' },
    expectDecision: null,
  },
  {
    name: 'transcript_path 자체가 빈 값이면 통과',
    payload: { stop_hook_active: false },
    expectDecision: null,
  },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const { stdout, exitCode } = run(t.payload);
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch {}
  const decision = parsed?.decision || null;

  if (decision === t.expectDecision) {
    console.log(`PASS: ${t.name}`);
    passed++;
  } else {
    console.log(`FAIL: ${t.name} (기대: ${t.expectDecision}, 실제: ${decision})`);
    failed++;
  }
}

console.log(`\n결과: ${passed}/${tests.length} 통과`);
process.exit(failed > 0 ? 1 : 0);
