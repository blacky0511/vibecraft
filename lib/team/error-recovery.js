#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 실패 감지 + 자동 복구
 * bkit의 에러 처리 부족을 해결한다.
 * 실패 유형별 단계적 복구 전략: retry_same -> reassign -> escalate
 *
 * 의존 모듈: ./constants, ./agent-matcher (같은 lib/team/ 내부)
 * 이 파일을 사용하는 곳: ./index.js (lib/team 통합 export)
 */

const { FAILURE_TYPES, RECOVERY_STRATEGIES, MESSAGES } = require('./constants');
const { selectAgent } = require('./agent-matcher');

/**
 * 태스크 실패를 분석하고 복구 전략을 결정한다.
 *
 * @param {object} task - 실패한 태스크 정보 { id, subject, owner, metadata }
 * @param {string} failureType - FAILURE_TYPES 중 하나
 * @param {string} currentAgent - 현재 할당된 에이전트 이름
 * @param {object[]} allTasks - 전체 태스크 목록 (부하 계산용)
 * @param {object} config - loadConfig()의 결과
 * @returns {{ strategy, action, message, newAgent? }}
 */
function analyzeFailure(task, failureType, currentAgent, allTasks, config) {
  const retryCount = (task.metadata && task.metadata.retryCount) || 0;
  const retryLimit = config.retryLimit || 2;

  // 1단계: 재시도 가능 여부 확인
  if (retryCount < retryLimit && isRetryable(failureType)) {
    return {
      strategy: RECOVERY_STRATEGIES.RETRY_SAME,
      action: 'retry',
      message: MESSAGES.retrying(task.subject, retryCount + 1, retryLimit),
      retryCount: retryCount + 1
    };
  }

  // 2단계: 재할당 시도
  const taskType = (task.metadata && task.metadata.taskType) || 'architecture';
  const alternativeAgent = findAlternativeAgent(
    taskType,
    currentAgent,
    allTasks,
    config
  );

  if (alternativeAgent) {
    return {
      strategy: RECOVERY_STRATEGIES.REASSIGN,
      action: 'reassign',
      message: MESSAGES.reassigning(task.subject, currentAgent, alternativeAgent.agent),
      newAgent: alternativeAgent.agent,
      retryCount: 0
    };
  }

  // 3단계: CTO 에스컬레이션
  return {
    strategy: RECOVERY_STRATEGIES.ESCALATE,
    action: 'escalate',
    message: MESSAGES.escalating(task.subject),
    newAgent: 'cto-lead',
    retryCount: retryCount
  };
}

/**
 * 실패 유형이 재시도 가능한지 판단한다.
 * QUALITY_FAIL은 같은 에이전트가 다시 해도 결과가 같을 가능성이 높아 재시도 불가.
 *
 * @param {string} failureType
 * @returns {boolean}
 */
function isRetryable(failureType) {
  return [
    FAILURE_TYPES.TIMEOUT,
    FAILURE_TYPES.ERROR,
    FAILURE_TYPES.IDLE_TOO_LONG
  ].includes(failureType);
}

/**
 * 현재 에이전트를 제외한 대안 에이전트를 찾는다.
 *
 * @param {string} taskType
 * @param {string} excludeAgent - 제외할 에이전트
 * @param {object[]} allTasks
 * @param {object} config
 * @returns {{ agent, score, reason } | null}
 */
function findAlternativeAgent(taskType, excludeAgent, allTasks, config) {
  const filteredConfig = {
    ...config,
    agents: { ...config.agents }
  };
  delete filteredConfig.agents[excludeAgent];

  return selectAgent(taskType, allTasks, filteredConfig);
}

/**
 * 실패 유형을 자동 감지한다.
 * 태스크 메타데이터와 상태로부터 실패 유형을 추론한다.
 *
 * @param {object} task - 태스크 정보
 * @param {object} config
 * @returns {string} FAILURE_TYPES 중 하나
 */
function detectFailureType(task, config) {
  const now = Date.now();
  const startedAt = task.metadata && task.metadata.startedAt;
  const timeoutMs = config.taskTimeoutMs || 600000;
  const idleMs = config.idleThresholdMs || 120000;

  if (startedAt && (now - startedAt) > timeoutMs) {
    return FAILURE_TYPES.TIMEOUT;
  }

  if (startedAt && task.status === 'in_progress' && (now - startedAt) > idleMs) {
    return FAILURE_TYPES.IDLE_TOO_LONG;
  }

  if (task.metadata && task.metadata.failedReason) {
    return FAILURE_TYPES.ERROR;
  }

  return FAILURE_TYPES.ERROR;
}

module.exports = {
  analyzeFailure,
  isRetryable,
  findAlternativeAgent,
  detectFailureType
};
