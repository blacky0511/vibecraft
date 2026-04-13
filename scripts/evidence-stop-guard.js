#!/usr/bin/env node

/**
 * vibecraft Stop 훅 — "증거 없이 완료 없다" 결정론적 강제
 *
 * 최근 응답에서 **코드 파일** 수정이 있었는지 확인하고,
 * 증거(실제 Bash 실행 or 키워드)가 없으면 block 반환한다.
 *
 * v2.2.0 변경점 (CTO 리뷰 반영):
 *  - 코드 확장자 필터: .md/.json/.css/.html/.yml 등 비코드는 증거 검사 면제
 *  - Bash tool_use 실존 검증: 단순 키워드 매칭 → 실제 실행 레코드 확인
 *  - 워드 바운더리: "PASSWORD"가 "PASS"로 오판되지 않도록
 *  - 대용량 transcript 크기 가드: 5MB 초과 시 조기 종료
 *  - 평문 메시지: "[Iron Law 위반]" → "[완료 전 확인 필요]"
 *
 * 공식 스키마 참고:
 * - input: { stop_hook_active, transcript_path, last_assistant_message, ... }
 * - JSONL 레코드: { type:"assistant", message:{ content:[ {type:"tool_use", name:"Edit", input:{file_path}}, ... ] } }
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// 코드 파일로 간주하는 확장자 (이것들이 수정되었을 때만 증거 요구)
// .md/.json/.yml/.css/.html/.svg/.env/.gitignore 등은 TDD 면제 (CLAUDE.md Iron Law 예외 준수)
const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.java', '.kt', '.kts', '.scala',
  '.go', '.rs',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
  '.rb', '.php', '.cs', '.swift', '.m', '.mm',
  '.sh', '.bash', '.zsh',
  '.sql',
  '.vue', '.svelte', // 논란의 여지 있지만 <script> 포함 가능
]);

// 증거 키워드 (워드 바운더리 기반 정규식)
// "PASSWORD"가 "PASS"로 오판되지 않도록 \b 경계 사용
const EVIDENCE_REGEX = [
  /\bPASS(?:ED)?\b/,           // PASS, PASSED — PASSWORD 제외
  /통과/,                        // 한국어
  /성공/,                        // 한국어
  /\bnpm\s+(?:test|run\s+test)\b/,
  /\bpytest\b/,
  /\bjest\b/,
  /\bvitest\b/,
  /\bmocha\b/,
  /\bexit\s+code?\s+0\b/,
  /종료\s*코드\s*0/,
  /테스트\s*(?:결과|완료)/,
  /실행\s*(?:결과|완료)/,
  /\bPlaywright\b/,
  /\bsnapshot/,
  /로그\s*(?:확인|출력)/,
];

// 코드 수정 도구
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

// 대용량 transcript 가드
const MAX_TRANSCRIPT_BYTES = 5 * 1024 * 1024; // 5MB

// Windows/POSIX 호환 stdin 읽기
function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
  }
}

// ~ 경로 확장
function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

// 파일 경로에서 확장자 추출 (소문자)
function getExt(filePath) {
  if (typeof filePath !== 'string') return '';
  return path.extname(filePath).toLowerCase();
}

// 코드 파일 수정 여부 판정
function isCodeEdit(toolUse) {
  if (!toolUse || toolUse.type !== 'tool_use') return false;
  if (!EDIT_TOOLS.has(toolUse.name)) return false;
  const filePath = toolUse.input?.file_path || toolUse.input?.filePath || '';
  const ext = getExt(filePath);
  // 확장자를 못 구하면 보수적으로 코드로 간주하지 않음 (거짓 양성 방지)
  if (!ext) return false;
  return CODE_EXTENSIONS.has(ext);
}

// 어시스턴트 메시지의 content 배열에서 tool_use 추출
function extractToolUses(entry) {
  const content = entry?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter(c => c?.type === 'tool_use');
}

// 증거 키워드 매칭 (정규식 기반)
function hasEvidenceKeyword(text) {
  if (typeof text !== 'string' || !text) return false;
  return EVIDENCE_REGEX.some(re => re.test(text));
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};

  // 무한 루프 방지
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  const transcriptPath = expandHome(input.transcript_path);
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // 대용량 transcript 크기 가드
  let fileSize = 0;
  try {
    fileSize = fs.statSync(transcriptPath).size;
  } catch {
    process.exit(0);
  }
  if (fileSize > MAX_TRANSCRIPT_BYTES) {
    // 너무 크면 마지막 500KB만 읽기 (head 자르기)
    // 여기서는 간단히 스킵 — 정확도 포기하고 안정성 우선
    process.exit(0);
  }

  const transcriptRaw = fs.readFileSync(transcriptPath, 'utf8');
  const allLines = transcriptRaw.split('\n').filter(Boolean);

  // 가장 최근 "진짜" user 메시지 찾기 (tool_result 용도의 user 턴 제외)
  let lastUserIdx = -1;
  for (let i = allLines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(allLines[i]);
      const isUser = e?.type === 'user' || e?.message?.role === 'user';
      if (!isUser) continue;

      // tool_result만 담긴 user 턴은 건너뜀
      const content = e?.message?.content;
      if (Array.isArray(content) && content.every(c => c?.type === 'tool_result')) {
        continue;
      }
      lastUserIdx = i;
      break;
    } catch {}
  }

  // user 턴 이후 라인만 검사
  const afterUser = lastUserIdx >= 0
    ? allLines.slice(lastUserIdx + 1)
    : allLines.slice(-100);
  const recent = afterUser.length > 200 ? afterUser.slice(-200) : afterUser;

  // 코드 수정 + Bash 실행 여부 확인 (전체 content 순회)
  let hasCodeEdit = false;
  let hasBashExec = false;
  for (const line of recent) {
    try {
      const entry = JSON.parse(line);
      const toolUses = extractToolUses(entry);
      for (const tu of toolUses) {
        if (isCodeEdit(tu)) hasCodeEdit = true;
        if (tu.name === 'Bash') hasBashExec = true;
      }
    } catch {}
  }

  // 코드 수정이 없으면 통과 (문서/설정/UI/CSS 수정은 TDD 면제)
  if (!hasCodeEdit) {
    process.exit(0);
  }

  // 증거 수집: (1) last_assistant_message 키워드, (2) Bash 실제 실행
  const lastMsg = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : '';
  const keywordEvidence = hasEvidenceKeyword(lastMsg);
  const bashEvidence = hasBashExec;

  // 둘 중 하나라도 있으면 통과
  if (keywordEvidence || bashEvidence) {
    process.exit(0);
  }

  // 차단
  const response = {
    decision: 'block',
    reason:
      '[완료 전 확인 필요] 코드 파일(.js/.ts/.py 등)을 수정했는데 검증 증거가 확인되지 않습니다.\n' +
      '테스트 실행 결과(예: `npm test`, `pytest`) 또는 동작 확인 로그를 응답에 포함한 뒤 마무리해주세요.\n' +
      '문서/설정/UI 파일만 수정했다면 이 메시지는 잘못 발동한 것이니 사용자에게 상황을 설명하고 한 번 더 시도하세요.',
  };

  console.log(JSON.stringify(response));
  process.exit(0);
} catch (error) {
  // 오류 시 조용히 통과 (Stop 훅이 플러그인을 깨뜨리면 안 됨)
  process.exit(0);
}
