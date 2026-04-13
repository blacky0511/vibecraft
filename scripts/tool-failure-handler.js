#!/usr/bin/env node

/**
 * vibecraft PostToolUseFailure 핸들러
 *
 * 도구 실행이 실패했을 때 에러 패턴을 진단해 Claude에 additionalContext로 힌트를 주입한다.
 * 같은 실수를 반복하지 않도록 다음 시도 전에 맥락을 제공한다.
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "PostToolUseFailure",
 *   tool_name: "Bash" | "Edit" | ...,
 *   tool_input: { ... },
 *   tool_use_id: "toolu_...",
 *   error: "Command exited with non-zero status code 1",
 *   is_interrupt?: false
 * }
 */

const fs = require('fs');

const DIAGNOSTICS = [
  {
    pattern: /ENOENT/,
    hint: '파일 경로에 오타가 있거나 해당 파일이 아직 존재하지 않을 수 있습니다. Glob/ls로 경로를 먼저 확인하세요.',
  },
  {
    pattern: /EACCES/,
    hint: '권한 부족입니다. 파일 권한 확인, 또는 상위 디렉토리 쓰기 권한을 확인하세요.',
  },
  {
    pattern: /ECONNREFUSED/,
    hint: '대상 서버가 떠 있지 않습니다. 로컬 서버면 먼저 `npm run dev` 같은 명령으로 구동했는지 확인하세요.',
  },
  {
    pattern: /EADDRINUSE/,
    hint: '포트가 이미 사용 중입니다. 기존 프로세스를 종료하거나 다른 포트로 변경하세요.',
  },
  {
    pattern: /ERR_MODULE_NOT_FOUND|Cannot find module/,
    hint: '모듈을 찾지 못했습니다. package.json의 의존성 + node_modules 설치 상태를 확인하세요.',
  },
  {
    pattern: /TypeError:\s+Cannot\s+read/,
    hint: 'null/undefined 객체에 접근했습니다. 방어 코드(optional chaining 등) 추가를 검토하세요.',
  },
  {
    pattern: /command not found|is not recognized/i,
    hint: 'CLI 명령어를 찾을 수 없습니다. 설치 여부와 PATH를 확인하세요.',
  },
];

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};

  // 사용자 인터럽트로 인한 실패는 힌트 불필요
  if (input.is_interrupt === true) {
    process.exit(0);
  }

  // error 필드가 핵심 신호. 빈 값이면 조용히 종료.
  const errorText = typeof input.error === 'string' ? input.error : '';
  if (!errorText) {
    process.exit(0);
  }

  const matched = DIAGNOSTICS.filter(d => d.pattern.test(errorText));
  if (matched.length === 0) {
    process.exit(0);
  }

  const hintLines = ['[도구 실패 진단]'];
  matched.forEach((d, i) => {
    hintLines.push(`  ${i + 1}. ${d.hint}`);
  });
  hintLines.push('다음 시도 전에 위 힌트를 참고하세요.');

  // 공식 반환 형식: hookSpecificOutput.additionalContext
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUseFailure',
      additionalContext: hintLines.join('\n'),
    },
  };

  console.log(JSON.stringify(response));
  process.exit(0);
} catch {
  process.exit(0);
}
