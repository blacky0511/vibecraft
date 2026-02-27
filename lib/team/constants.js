#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 상수 및 한국어 메시지 템플릿
 * 모든 하드코딩된 값을 중앙 관리한다.
 */

// 팀 이름 접두사
const TEAM_PREFIX = 'vibecraft';

// 태스크 메타데이터 키
const META_KEYS = {
  WAVE: 'wave',
  TASK_TYPE: 'taskType',
  RETRY_COUNT: 'retryCount',
  ASSIGNED_AGENT: 'assignedAgent',
  STARTED_AT: 'startedAt',
  FAILED_REASON: 'failedReason'
};

// 실패 유형
const FAILURE_TYPES = {
  TIMEOUT: 'TIMEOUT',
  ERROR: 'ERROR',
  IDLE_TOO_LONG: 'IDLE_TOO_LONG',
  QUALITY_FAIL: 'QUALITY_FAIL'
};

// 복구 전략
const RECOVERY_STRATEGIES = {
  RETRY_SAME: 'retry_same',
  REASSIGN: 'reassign',
  ESCALATE: 'escalate'
};

// 태스크 상태
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// 한국어 메시지 템플릿
const MESSAGES = {
  // 팀 구성
  teamCreated: (name, count) =>
    `## CTO 팀 구성 완료\n\n**팀 이름**: ${name}\n**투입 에이전트**: ${count}명`,
  teamReady: '팀 구성이 완료되었습니다. 실행을 시작할까요?',

  // 진행 상황
  progressUpdate: (percent, completed, total) =>
    `진행률: ${percent}% (${completed}/${total} 태스크 완료)`,
  waveStarted: (wave, total) =>
    `Wave ${wave}/${total} 실행을 시작합니다.`,
  waveCompleted: (wave, total) =>
    `Wave ${wave}/${total} 완료.`,
  allWavesCompleted: '모든 Wave가 완료되었습니다.',

  // 에이전트
  agentAssigned: (agent, task) =>
    `${agent}에게 "${task}" 태스크를 할당했습니다.`,
  agentCompleted: (agent, task) =>
    `${agent}가 "${task}" 태스크를 완료했습니다.`,
  noSuitableAgent: (taskType) =>
    `"${taskType}" 유형에 적합한 에이전트를 찾을 수 없습니다.`,

  // 에러 복구
  retrying: (task, attempt, max) =>
    `"${task}" 재시도 중 (${attempt}/${max})`,
  reassigning: (task, from, to) =>
    `"${task}"를 ${from}에서 ${to}로 재할당합니다.`,
  escalating: (task) =>
    `"${task}" 복구 불가 - CTO에게 에스컬레이션합니다.`,

  // 세션 복구
  previousSessionFound: '이전 팀 세션이 감지되었습니다.',
  sessionRestored: '이전 세션의 진행 상황을 복구했습니다.',

  // 의존성
  circularDependency: (cycle) =>
    `순환 의존성이 감지되었습니다: ${cycle.join(' → ')}`,
  dependencyBlocked: (task, blockers) =>
    `"${task}"는 다음 태스크 완료를 기다리고 있습니다: ${blockers.join(', ')}`
};

module.exports = {
  TEAM_PREFIX,
  META_KEYS,
  FAILURE_TYPES,
  RECOVERY_STRATEGIES,
  TASK_STATUS,
  MESSAGES
};
