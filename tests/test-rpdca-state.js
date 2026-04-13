#!/usr/bin/env node
// rpdca-state.js 순수 함수 테스트 (v2.2.0 CTO #2 B1 반영)

const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpdca-'));
process.chdir(tmpDir);
fs.mkdirSync('docs/plans', { recursive: true });

// rpdca-state를 여러 번 require하면 캐시될 수 있으므로 매 테스트마다 재로딩 안 함 (이 유틸은 stateless)
const state = require(path.resolve(__dirname, '../scripts/rpdca-state.js'));

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); passed++; }
  else { console.log(`FAIL: ${name}`); failed++; }
}

// 1. 초기 상태
{
  const s = state.read();
  assert('초기 read는 features 빈 배열', Array.isArray(s.features) && s.features.length === 0);
}

// 2. upsertFeature — 신규
{
  state.upsertFeature('my-feature', 'research');
  const s = state.read();
  assert('upsert 후 feature 1개', s.features.length === 1);
  assert('upsert 후 phase=research', s.features[0].phase === 'research');
}

// 3. upsertFeature — phase 갱신
{
  state.upsertFeature('my-feature', 'plan');
  const s = state.read();
  assert('phase 갱신 반영', s.features[0].phase === 'plan');
  assert('feature 개수 유지 (중복 생성 안 함)', s.features.length === 1);
}

// 4. setActive
{
  state.setActive('my-feature');
  const s = state.read();
  assert('activeFeature 설정', s.activeFeature === 'my-feature');
}

// 5. 두 번째 feature 추가
{
  state.upsertFeature('another', 'research');
  const s = state.read();
  assert('feature 2개 공존', s.features.length === 2);
  assert('activeFeature 유지 (설정 안 함)', s.activeFeature === 'my-feature');
}

// 6. getActive
{
  const active = state.getActive();
  assert('getActive 반환', active !== null && active.name === 'my-feature');
}

// 7. 손상된 JSON 복구 — rpdca-state.json에 잘못된 내용 쓰고 read() 확인
{
  fs.writeFileSync(state.STATE_PATH, '{invalid json', 'utf8');
  const recovered = state.read();
  assert('손상된 JSON → emptyState 복구', recovered.features.length === 0 && recovered.activeFeature === null);
  assert('손상 시 .bak 백업 생성', fs.existsSync(state.BAK_PATH));
  // 원복: 다시 쓰기
  state.upsertFeature('my-feature', 'plan');
  state.upsertFeature('another', 'research');
  state.setActive('my-feature');
}

// 8. 원자적 쓰기 — 임시 파일이 남지 않음
{
  state.upsertFeature('x', 'do');
  const dirContents = fs.readdirSync(path.dirname(state.STATE_PATH));
  const tmpFiles = dirContents.filter(f => f.startsWith('.rpdca-state.') && f.endsWith('.tmp'));
  assert('쓰기 후 임시 파일 잔존 없음', tmpFiles.length === 0);
}

// 9. 다중 write 시퀀스 (경합 시뮬레이션) — 모든 feature 유지
{
  state.upsertFeature('f1', 'research');
  state.upsertFeature('f2', 'plan');
  state.upsertFeature('f3', 'do');
  const s = state.read();
  const names = s.features.map(f => f.name);
  assert('3개 feature 추가 후 모두 유지', names.includes('f1') && names.includes('f2') && names.includes('f3'));
}

// 10. JSON 재파싱 가능 (valid JSON 보장)
{
  const raw = fs.readFileSync(state.STATE_PATH, 'utf8');
  let ok = false;
  try { JSON.parse(raw); ok = true; } catch {}
  assert('저장된 파일이 valid JSON', ok);
}

// 11. write 반환값 — true
{
  const ok = state.upsertFeature('r1', 'research');
  assert('upsertFeature가 true 반환', ok === true);
}

// 12. 빈 state일 때 setActive — 존재하지 않는 feature도 허용 (소프트 모드)
{
  state.setActive('nonexistent');
  const active = state.getActive();
  // features 배열에 없으니 getActive는 null 반환이 정확
  assert('존재하지 않는 feature setActive → getActive=null', active === null);
  // 원복
  state.setActive('my-feature');
}

console.log(`\n결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);
