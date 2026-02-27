#!/usr/bin/env node

/**
 * vibecraft 팀 모니터 훅 핸들러
 * TeammateIdle / SubagentStop 이벤트를 처리한다.
 *
 * TeammateIdle: 정상적인 idle 상태 로깅
 * SubagentStop: 비정상 종료 감지 + 재할당 안내 메시지 출력
 */

const hookEvent = process.env.CLAUDE_HOOK_EVENT || '';
const hookData = process.env.CLAUDE_HOOK_DATA || '{}';

let data = {};
try {
  data = JSON.parse(hookData);
} catch {
  // 파싱 실패 시 빈 객체
}

if (hookEvent === 'TeammateIdle') {
  // 정상 idle - 로깅만
  const agentName = data.agent_name || data.name || '알 수 없는 에이전트';
  console.log(`[vibecraft 팀] ${agentName} idle 상태`);

} else if (hookEvent === 'SubagentStop') {
  // 비정상 종료 감지
  const agentName = data.agent_name || data.name || '알 수 없는 에이전트';
  const exitCode = data.exit_code || data.exitCode;
  const reason = data.reason || '';

  if (exitCode !== 0 && exitCode !== undefined) {
    console.log(`[vibecraft 팀] 경고: ${agentName}가 비정상 종료되었습니다.`);
    console.log(`  종료 코드: ${exitCode}`);
    if (reason) console.log(`  사유: ${reason}`);
    console.log('');
    console.log('복구 방법:');
    console.log('  1. TaskList로 미완료 태스크를 확인하세요.');
    console.log('  2. error-recovery 모듈로 재할당을 시도하세요.');
    console.log('     const team = require("./lib/team");');
    console.log('     const recovery = team.analyzeFailure(task, "ERROR", agent, tasks, config);');
  } else {
    console.log(`[vibecraft 팀] ${agentName} 정상 종료`);
  }
} else {
  // 알 수 없는 이벤트는 무시
  process.exit(0);
}
