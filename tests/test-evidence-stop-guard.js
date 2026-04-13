#!/usr/bin/env node
// evidence-stop-guard.js 테스트 (v2.2.0 CTO 리뷰 반영)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const guard = path.resolve(__dirname, '../scripts/evidence-stop-guard.js');

function makeTranscript(lines) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  const p = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(p, lines.map(l => JSON.stringify(l)).join('\n'));
  return p;
}

function run(payload) {
  const result = spawnSync('node', [guard], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  let parsed = null;
  try { parsed = JSON.parse(result.stdout); } catch {}
  return { decision: parsed?.decision || null };
}

const userTurn = { type: 'user', message: { role: 'user', content: 'fix the bug' } };
const editCode = { type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Edit', input: { file_path: 'src/foo.js' } }
]}};
const editMd = { type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Edit', input: { file_path: 'README.md' } }
]}};
const editJson = { type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Write', input: { file_path: 'package.json' } }
]}};
const editCss = { type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Edit', input: { file_path: 'styles/main.css' } }
]}};
const bashExec = { type: 'assistant', message: { role: 'assistant', content: [
  { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }
]}};

const tests = [
  // ── 기본 안전 경로 (기존 테스트) ──
  {
    name: 'stop_hook_active=true 통과 (무한 루프 방지)',
    payload: { stop_hook_active: true, transcript_path: '/nonexistent' },
    expect: null,
  },
  {
    name: 'transcript_path 미존재 통과',
    payload: { stop_hook_active: false, transcript_path: '/nope-xyz' },
    expect: null,
  },
  {
    name: 'transcript_path 빈 값 통과',
    payload: { stop_hook_active: false },
    expect: null,
  },

  // ── CTO #2 B2 검증: 비코드 파일 통과 ──
  {
    name: 'README.md 수정만 있음 → 통과 (거짓 양성 방지)',
    transcript: [userTurn, editMd],
    last_assistant_message: '수정했습니다',
    expect: null,
  },
  {
    name: 'package.json 수정만 있음 → 통과',
    transcript: [userTurn, editJson],
    last_assistant_message: '의존성 추가했습니다',
    expect: null,
  },
  {
    name: 'styles/main.css 수정만 있음 → 통과',
    transcript: [userTurn, editCss],
    last_assistant_message: '색상 변경 완료',
    expect: null,
  },

  // ── 코드 수정 block/pass 경로 ──
  {
    name: 'foo.js 수정 + 증거 없음 → block',
    transcript: [userTurn, editCode],
    last_assistant_message: '수정했습니다',
    expect: 'block',
  },
  {
    name: 'foo.js 수정 + "PASS" 키워드 → 통과',
    transcript: [userTurn, editCode],
    last_assistant_message: '테스트 실행: PASS 3/3',
    expect: null,
  },
  {
    name: 'foo.js 수정 + "통과" 한국어 → 통과',
    transcript: [userTurn, editCode],
    last_assistant_message: '5/5 통과',
    expect: null,
  },
  {
    name: 'foo.js 수정 + Bash 실제 실행 (키워드 없어도) → 통과',
    transcript: [userTurn, editCode, bashExec],
    last_assistant_message: '완료',
    expect: null,
  },

  // ── CTO #2 B3 검증: "PASSWORD" false positive 방지 ──
  {
    name: 'foo.js 수정 + "PASSWORD 변수만 언급" → block (PASS로 오판 안 함)',
    transcript: [userTurn, editCode],
    last_assistant_message: '이 함수는 PASSWORD 변수를 검증합니다',
    expect: 'block',
  },
  {
    name: 'foo.js 수정 + "\\bPASS\\b" 정확한 단어 → 통과',
    transcript: [userTurn, editCode],
    last_assistant_message: '테스트 실행 결과: PASS',
    expect: null,
  },

  // ── 엣지 케이스 ──
  {
    name: 'file_path 없는 Edit (구조 방어) → block 안 함 (보수적)',
    transcript: [userTurn, {
      type: 'assistant', message: { role: 'assistant', content: [
        { type: 'tool_use', name: 'Edit', input: {} }
      ]},
    }],
    last_assistant_message: '완료',
    expect: null,
  },
  {
    name: '이전 턴의 code edit은 무시, 최근 턴은 Read만 → 통과',
    transcript: [userTurn, editCode, userTurn, {
      type: 'assistant', message: { role: 'assistant', content: [
        { type: 'tool_use', name: 'Read', input: { file_path: 'a.js' } }
      ]},
    }],
    last_assistant_message: '확인했습니다',
    expect: null,
  },
  {
    name: 'tool_result만 담긴 user 턴은 "진짜 user 턴"에서 제외 → block',
    transcript: [userTurn, editCode, {
      type: 'user', message: { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'x', content: 'ok' }
      ]},
    }],
    last_assistant_message: '수정 완료',
    expect: 'block',
  },
];

let passed = 0, failed = 0;

for (const t of tests) {
  let payload = t.payload;
  if (t.transcript) {
    payload = {
      transcript_path: makeTranscript(t.transcript),
      last_assistant_message: t.last_assistant_message,
      stop_hook_active: false,
    };
  }
  const { decision } = run(payload);
  if (decision === t.expect) {
    console.log(`PASS: ${t.name}`);
    passed++;
  } else {
    console.log(`FAIL: ${t.name} (기대: ${t.expect}, 실제: ${decision})`);
    failed++;
  }
}

console.log(`\n결과: ${passed}/${tests.length} 통과`);
process.exit(failed > 0 ? 1 : 0);
