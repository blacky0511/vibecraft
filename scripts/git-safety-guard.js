#!/usr/bin/env node

/**
 * vibecraft Git 안전 가드
 * 위험한 Git 명령어를 감지하여 경고 또는 차단한다.
 *
 * 차단 대상 (block: true → PreToolUse 훅이 실제 차단):
 * - rm -rf (재귀적 강제 삭제)
 * - git push --force origin main/master (메인 브랜치 강제 푸시)
 *
 * 경고 대상 (사용자 확인 유도):
 * - git push --force / -f (일반 강제 푸시)
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
  // 주의: block: true 패턴이 일반 패턴보다 먼저 매칭되도록 순서 배치
  const dangerousPatterns = [
    {
      pattern: /git\s+push\s+.*(-f|--force).*\b(main|master)\b/,
      warning: 'main/master 브랜치에 강제 푸시는 팀 전체의 히스토리를 파괴합니다. 절대 허용되지 않습니다.',
      block: true
    },
    {
      pattern: /git\s+push\s+.*\b(main|master)\b.*(-f|--force)/,
      warning: 'main/master 브랜치에 강제 푸시는 팀 전체의 히스토리를 파괴합니다. 절대 허용되지 않습니다.',
      block: true
    },
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
      warning: '재귀적 강제 삭제는 되돌릴 수 없습니다.',
      block: true
    },
    // 범용 파괴 명령어 (git 외)
    {
      pattern: /DROP\s+(TABLE|DATABASE)/i,
      warning: 'DROP TABLE/DATABASE는 데이터를 영구적으로 삭제합니다.',
      block: true
    },
    {
      pattern: /TRUNCATE\s+TABLE/i,
      warning: 'TRUNCATE TABLE은 테이블의 모든 데이터를 삭제합니다.',
      block: true
    },
    {
      pattern: /terraform\s+destroy/,
      warning: 'terraform destroy는 인프라를 전부 삭제합니다.',
      block: true
    },
    {
      pattern: /kubectl\s+delete\s+namespace/,
      warning: 'namespace 삭제는 해당 네임스페이스의 모든 리소스를 삭제합니다.',
      block: true
    },
    {
      pattern: /dd\s+if=/,
      warning: 'dd 명령은 디스크를 직접 덮어씁니다. 데이터 유실 위험이 있습니다.',
      block: true
    }
  ];

  for (const { pattern, warning, block } of dangerousPatterns) {
    if (pattern.test(command)) {
      if (block) {
        // stdout으로 JSON 출력 → PreToolUse 훅이 실제 차단
        console.log(JSON.stringify({ decision: "block", reason: `[vibecraft] ${warning}` }));
      } else {
        // 경고만 출력
        console.log(
          `[vibecraft] 위험한 명령어 감지!\n` +
          `경고: ${warning}\n` +
          `사용자에게 반드시 확인을 받은 후 실행하세요.`
        );
      }
      break;
    }
  }

} catch (error) {
  console.error(`[vibecraft] git-safety-guard 오류: ${error.message}`);
  process.exit(0);
}
