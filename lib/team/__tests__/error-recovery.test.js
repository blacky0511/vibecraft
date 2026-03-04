const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeFailure, isRetryable } = require('../error-recovery');
const { FAILURE_TYPES, RECOVERY_STRATEGIES } = require('../constants');
const { DEFAULT_CONFIG } = require('../config');

// 테스트용 축소 config
function makeConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  };
}

// 테스트용 태스크 생성
function makeTask(overrides = {}) {
  return {
    id: 'task-1',
    subject: '테스트 태스크',
    owner: 'frontend-builder',
    metadata: {
      retryCount: 0,
      taskType: 'frontend'
    },
    ...overrides
  };
}

describe('isRetryable', () => {
  it('TIMEOUT은 재시도 가능하다', () => {
    assert.equal(isRetryable(FAILURE_TYPES.TIMEOUT), true);
  });

  it('ERROR는 재시도 가능하다', () => {
    assert.equal(isRetryable(FAILURE_TYPES.ERROR), true);
  });

  it('IDLE_TOO_LONG은 재시도 가능하다', () => {
    assert.equal(isRetryable(FAILURE_TYPES.IDLE_TOO_LONG), true);
  });

  it('QUALITY_FAIL은 재시도 불가능하다', () => {
    assert.equal(isRetryable(FAILURE_TYPES.QUALITY_FAIL), false);
  });
});

describe('analyzeFailure', () => {
  it('TIMEOUT + retryCount < limit이면 retry_same을 반환한다', () => {
    const task = makeTask({ metadata: { retryCount: 0, taskType: 'frontend' } });
    const config = makeConfig({ retryLimit: 2 });
    const result = analyzeFailure(task, FAILURE_TYPES.TIMEOUT, 'frontend-builder', [], config);
    assert.equal(result.strategy, RECOVERY_STRATEGIES.RETRY_SAME);
    assert.equal(result.action, 'retry');
    assert.equal(result.retryCount, 1);
  });

  it('QUALITY_FAIL은 재시도 불가 → 바로 2단계(재할당)로 진행한다', () => {
    const task = makeTask({ metadata: { retryCount: 0, taskType: 'frontend' } });
    const config = makeConfig({ retryLimit: 2 });
    const result = analyzeFailure(task, FAILURE_TYPES.QUALITY_FAIL, 'frontend-builder', [], config);
    // QUALITY_FAIL은 isRetryable=false이므로 재시도 건너뜀
    assert.notEqual(result.strategy, RECOVERY_STRATEGIES.RETRY_SAME);
  });

  it('retryCount >= limit이면 2단계(재할당)로 진행한다', () => {
    const task = makeTask({ metadata: { retryCount: 2, taskType: 'frontend' } });
    const config = makeConfig({ retryLimit: 2 });
    const result = analyzeFailure(task, FAILURE_TYPES.TIMEOUT, 'frontend-builder', [], config);
    // retryCount(2) >= retryLimit(2)이므로 재시도 불가 → 재할당 또는 에스컬레이션
    assert.notEqual(result.strategy, RECOVERY_STRATEGIES.RETRY_SAME);
  });

  it('대안 에이전트가 없으면 3단계(에스컬레이션)로 진행한다', () => {
    const task = makeTask({ metadata: { retryCount: 2, taskType: 'frontend' } });
    // 에이전트를 frontend-builder만 남기면, 제외 후 대안 없음
    const config = makeConfig({
      agents: {
        'frontend-builder': {
          capabilities: ['ui', 'css', 'component', 'page', 'accessibility'],
          model: 'sonnet',
          costTier: 'medium'
        }
      }
    });
    const result = analyzeFailure(task, FAILURE_TYPES.TIMEOUT, 'frontend-builder', [], config);
    assert.equal(result.strategy, RECOVERY_STRATEGIES.ESCALATE);
    assert.equal(result.action, 'escalate');
    assert.equal(result.newAgent, 'cto-lead');
  });

  it('metadata가 없으면 기본값을 사용한다', () => {
    const task = {
      id: 'task-1',
      subject: '테스트 태스크',
      owner: 'frontend-builder'
      // metadata 없음
    };
    const config = makeConfig({ retryLimit: 2 });
    // retryCount=0 (기본값), taskType='architecture' (기본값)
    const result = analyzeFailure(task, FAILURE_TYPES.TIMEOUT, 'frontend-builder', [], config);
    assert.ok(result);
    assert.equal(result.strategy, RECOVERY_STRATEGIES.RETRY_SAME);
    assert.equal(result.retryCount, 1);
  });
});
