#!/usr/bin/env node
// rpdca-state.js 순수 함수 테스트

const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpdca-'));
process.chdir(tmpDir);
fs.mkdirSync('docs/plans', { recursive: true });

const state = require(path.resolve(__dirname, '../scripts/rpdca-state.js'));

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); passed++; }
  else { console.log(`FAIL: ${name}`); failed++; }
}

// 1. 처음 read하면 빈 상태 반환
const s1 = state.read();
assert('초기 read는 features 빈 배열', Array.isArray(s1.features) && s1.features.length === 0);

// 2. feature 추가
state.upsertFeature('my-feature', 'research');
const s2 = state.read();
assert('upsert 후 feature 1개', s2.features.length === 1);
assert('upsert 후 phase=research', s2.features[0].phase === 'research');

// 3. phase 갱신
state.upsertFeature('my-feature', 'plan');
const s3 = state.read();
assert('phase 갱신 반영', s3.features[0].phase === 'plan');

// 4. activeFeature 설정
state.setActive('my-feature');
const s4 = state.read();
assert('activeFeature 설정', s4.activeFeature === 'my-feature');

// 5. 두 번째 feature 추가
state.upsertFeature('another', 'research');
const s5 = state.read();
assert('feature 2개 공존', s5.features.length === 2);

console.log(`\n결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);
