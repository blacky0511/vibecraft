#!/usr/bin/env node

/**
 * vibecraft Stop 훅 — "증거 없이 완료 없다" 결정론적 강제
 *
 * 최근 응답에서 코드 수정이 있었는지 확인하고,
 * 증거(테스트 실행/동작 확인/로그 출력)가 없으면 block 반환한다.
 *
 * 참고한 공식 스키마:
 * - input: { stop_hook_active, transcript_path, last_assistant_message, ... }
 * - JSONL 레코드: { type:"assistant", message:{ content:[ {type:"tool_use", name:"Edit"}, ... ] } }
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// 증거 키워드 (이 중 하나라도 있으면 통과)
const EVIDENCE_KEYWORDS = [
  'PASS', '통과', '성공',
  'npm test', 'pytest', 'jest', 'vitest',
  'exit 0', 'exit code 0', '종료 코드 0',
  '테스트 결과', '실행 결과',
  'Playwright', 'snapshot',
  '로그 확인', '로그 출력',
];

// 코드 수정 도구 이름
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];

// Windows/POSIX 호환 stdin 읽기 (파일디스크립터 0)
function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    // fallback: /dev/stdin (POSIX)
    try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
  }
}

// 홈 디렉토리 경로(~)를 확장
function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};

  // 무한 루프 방지: 이미 한 번 block했으면 통과
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  const transcriptPath = expandHome(input.transcript_path);
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // transcript 전체 읽고, 마지막 user 턴 이후 레코드만 사용.
  // (이전 턴의 Edit까지 포함하면 현재 턴이 설명만이어도 block이 발동할 수 있음)
  const transcriptRaw = fs.readFileSync(transcriptPath, 'utf8');
  const allLines = transcriptRaw.split('\n').filter(Boolean);

  // 역순으로 가장 최근 user 메시지 인덱스 찾기
  let lastUserIdx = -1;
  for (let i = allLines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(allLines[i]);
      // user 메시지: type==='user' 또는 message.role==='user'
      if (e?.type === 'user' || e?.message?.role === 'user') {
        lastUserIdx = i;
        break;
      }
    } catch {}
  }

  // user 턴 이후 라인만 검사 (없으면 최근 100줄로 fallback)
  const afterUser = lastUserIdx >= 0
    ? allLines.slice(lastUserIdx + 1)
    : allLines.slice(-100);
  // 대용량 방어: 너무 길면 마지막 200줄까지만
  const recent = afterUser.length > 200 ? afterUser.slice(-200) : afterUser;

  // 코드 수정이 있었는지 확인 — content 배열 전체 순회
  let hasEdit = false;
  for (const line of recent) {
    try {
      const entry = JSON.parse(line);
      const content = entry?.message?.content;
      if (Array.isArray(content)) {
        const found = content.some(
          c => c?.type === 'tool_use' && EDIT_TOOLS.includes(c.name)
        );
        if (found) {
          hasEdit = true;
          break;
        }
      }
    } catch {}
  }

  if (!hasEdit) {
    // 코드 수정 없음 — 통과
    process.exit(0);
  }

  // 증거 키워드 검사: last_assistant_message 우선, 없으면 user 턴 이후 레코드에서 검색
  const lastMsg = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : '';
  const searchText = lastMsg || recent.join('\n');
  const hasEvidence = EVIDENCE_KEYWORDS.some(k => searchText.includes(k));

  if (hasEvidence) {
    process.exit(0);
  }

  // 차단
  const response = {
    decision: 'block',
    reason:
      '[Iron Law 위반] 코드를 수정했지만 검증 증거가 없습니다. ' +
      '테스트 실행 결과, 동작 확인 로그, Playwright 스냅샷 중 하나 이상을 제시한 뒤 응답을 마무리하세요. ' +
      '수정 내역을 검증할 수 없는 상태로 완료하면 버그가 그대로 배포됩니다.',
  };

  console.log(JSON.stringify(response));
  process.exit(0);
} catch (error) {
  // 오류 시 조용히 통과 (Stop 훅이 플러그인을 깨뜨리면 안 됨)
  process.exit(0);
}
