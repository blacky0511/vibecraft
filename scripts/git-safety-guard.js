#!/usr/bin/env node

/**
 * vibecraft Git 안전 가드
 * 위험한 Git 명령어를 감지하여 경고한다.
 *
 * 감지 대상:
 * - git push --force / -f (강제 푸시)
 * - git reset --hard (변경 사항 삭제)
 * - git clean -f (추적되지 않는 파일 삭제)
 * - git branch -D (브랜치 강제 삭제)
 * - git checkout . / git restore . (변경 사항 버리기)
 */

try {
  const toolInput = process.env.TOOL_INPUT;

  if (!toolInput) {
    process.exit(0);
  }

  let command = '';
  try {
    const parsed = JSON.parse(toolInput);
    command = parsed.command || '';
  } catch {
    command = toolInput;
  }

  // 위험한 명령어 패턴 목록
  const dangerousPatterns = [
    {
      pattern: /git\s+push\s+.*(-f|--force)/,
      warning: '강제 푸시(force push)는 원격 저장소의 히스토리를 덮어씁니다. 팀원의 작업이 유실될 수 있습니다.'
    },
    {
      pattern: /git\s+reset\s+--hard/,
      warning: 'hard reset은 커밋되지 않은 모든 변경 사항을 영구적으로 삭제합니다.'
    },
    {
      pattern: /git\s+clean\s+-[a-zA-Z]*f/,
      warning: 'git clean -f는 추적되지 않는 파일을 영구적으로 삭제합니다.'
    },
    {
      pattern: /git\s+branch\s+-D/,
      warning: '대문자 -D는 머지되지 않은 브랜치도 강제 삭제합니다.'
    },
    {
      pattern: /git\s+(checkout|restore)\s+\./,
      warning: '작업 디렉토리의 변경 사항을 모두 되돌립니다. 저장되지 않은 작업이 사라집니다.'
    },
    {
      pattern: /rm\s+-rf\s/,
      warning: '재귀적 강제 삭제는 되돌릴 수 없습니다.'
    }
  ];

  for (const { pattern, warning } of dangerousPatterns) {
    if (pattern.test(command)) {
      console.log(
        `[vibecraft] 위험한 명령어 감지!\n` +
        `경고: ${warning}\n` +
        `사용자에게 반드시 확인을 받은 후 실행하세요.`
      );
      break;
    }
  }

} catch (error) {
  console.error(`[vibecraft] git-safety-guard 오류: ${error.message}`);
  process.exit(0);
}
