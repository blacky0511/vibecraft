const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { selectAgent } = require('../agent-matcher');
const { DEFAULT_CONFIG } = require('../config');

// 테스트용 축소 config
function makeConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  };
}

describe('selectAgent', () => {
  it('taskType이 config에 없으면 null을 반환한다', () => {
    const result = selectAgent('nonexistent', [], makeConfig());
    assert.equal(result, null);
  });

  it('필수 능력이 없는 에이전트만 있으면 null을 반환한다', () => {
    const config = makeConfig({
      agents: {
        'dummy': {
          capabilities: ['nothing'],
          model: 'haiku',
          costTier: 'low'
        }
      }
    });
    const result = selectAgent('frontend', [], config);
    assert.equal(result, null);
  });

  it('선호 능력 보너스 + 비용 보너스를 계산한다', () => {
    const config = makeConfig();
    const result = selectAgent('frontend', [], config);
    assert.ok(result);
    assert.equal(result.agent, 'frontend-builder');
    // preferred: css, component, page, accessibility → 4 * 10 = 40, costTier medium → +0 = 40
    assert.equal(result.score, 40);
  });

  it('부하가 있는 에이전트에게 감점을 적용한다', () => {
    const config = makeConfig();
    const currentTasks = [
      { status: 'in_progress', owner: 'frontend-builder' },
      { status: 'in_progress', owner: 'frontend-builder' }
    ];
    const result = selectAgent('frontend', currentTasks, config);
    assert.ok(result);
    assert.equal(result.agent, 'frontend-builder');
    // 40 (선호) + (-15 * 2) (부하) = 10
    assert.equal(result.score, 10);
  });

  it('동점 시 부하가 적은 에이전트를 선택한다', () => {
    // 두 에이전트가 동일한 점수를 가지도록 설정
    const config = makeConfig({
      agents: {
        'agent-a': {
          capabilities: ['api'],
          model: 'sonnet',
          costTier: 'medium'
        },
        'agent-b': {
          capabilities: ['api'],
          model: 'sonnet',
          costTier: 'medium'
        }
      },
      taskTypes: {
        'test-type': {
          required: ['api'],
          preferred: [],
          defaultAgent: 'agent-a'
        }
      }
    });
    const currentTasks = [
      { status: 'in_progress', owner: 'agent-a' }
    ];
    // agent-a: 0 + (-15) + 0 = -15, agent-b: 0 + 0 + 0 = 0
    const result = selectAgent('test-type', currentTasks, config);
    assert.ok(result);
    assert.equal(result.agent, 'agent-b');
  });

  it('후보 1명일 때 reason에 "유일한 후보"가 포함된다', () => {
    const config = makeConfig({
      agents: {
        'only-one': {
          capabilities: ['ui'],
          model: 'sonnet',
          costTier: 'medium'
        }
      }
    });
    const result = selectAgent('frontend', [], config);
    assert.ok(result);
    assert.equal(result.reason, '유일한 후보');
  });

  it('후보 다수일 때 reason에 "명 중 최고 점수"가 포함된다', () => {
    // backend taskType은 api 능력을 가진 에이전트가 여럿 매칭될 수 있도록 설정
    const config = makeConfig({
      agents: {
        'agent-x': {
          capabilities: ['api', 'database'],
          model: 'sonnet',
          costTier: 'medium'
        },
        'agent-y': {
          capabilities: ['api'],
          model: 'haiku',
          costTier: 'low'
        }
      },
      taskTypes: {
        'multi-test': {
          required: ['api'],
          preferred: ['database'],
          defaultAgent: 'agent-x'
        }
      }
    });
    const result = selectAgent('multi-test', [], config);
    assert.ok(result);
    assert.ok(result.reason.includes('명 중 최고 점수'));
  });
});
