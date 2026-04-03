#!/usr/bin/env node

/**
 * vibecraft 커밋 가드
 * git commit 시도 시 테스트 실행 여부를 확인한다.
 *
 * 환경변수:
 * - TOOL_INPUT: Bash 도구에 전달된 명령어 (JSON 문자열)
 *
 * 동작:
 * - git commit 명령어가 감지되면 검증 체크리스트를 출력한다
 * - 문서 수정만 포함된 커밋은 경고를 완화한다
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
    // JSON 파싱 실패 시 원본 문자열 사용
    command = toolInput;
  }

  // git commit 명령어인지 확인
  const isGitCommit = /git\s+commit/.test(command);

  if (!isGitCommit) {
    process.exit(0);
  }

  // 문서만 수정하는 커밋인지 확인 (--message에 [문서], [설정] 등 포함)
  const isDocOnly = /\[(문서|설정|스타일)\]/.test(command);

  if (isDocOnly) {
    console.log('[vibecraft] 문서/설정 커밋 감지 - TDD 면제 대상입니다.');
    process.exit(0);
  }

  // 코드 변경 커밋 → 검증 체크리스트 출력
  console.log(
    '[vibecraft] 커밋 전 검증 체크리스트:\n' +
    '\n' +
    '1. 테스트를 실행했는가? (npm test, pytest 등)\n' +
    '2. 테스트가 모두 통과했는가?\n' +
    '3. 변경 사항이 의도대로 동작하는 것을 확인했는가?\n' +
    '4. 불필요한 console.log/print가 남아있지 않은가?\n' +
    '\n' +
    '위 항목 중 하나라도 미충족이면, 커밋 전에 먼저 처리하세요.\n' +
    '면제 대상 (UI/CSS, 설정, 문서, 프로토타입)은 TDD를 건너뛰어도 됩니다.'
  );

} catch (error) {
  console.error(`[vibecraft] commit-guard 오류: ${error.message}`);
  // 오류 시에도 커밋을 막지 않는다
  process.exit(0);
}
