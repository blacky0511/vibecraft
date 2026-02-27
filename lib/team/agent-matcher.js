#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 점수 기반 에이전트 선택 엔진
 * bkit의 "무조건 첫 번째" 방식을 대체한다.
 * 능력 매칭 + 현재 부하 + 비용 효율을 종합하여 최적 에이전트를 선택한다.
 */

const { MESSAGES } = require('./constants');

/**
 * 특정 태스크 유형에 가장 적합한 에이전트를 선택한다.
 *
 * 1단계: 필수 능력 필터 (없으면 제외)
 * 2단계: 선호 능력 보너스 (+10점/개)
 * 3단계: 현재 부하 감점 (-15점/진행중 태스크)
 * 4단계: 비용 효율 보너스 (저비용 모델 선호)
 *
 * @param {string} taskType - 태스크 유형 (frontend, backend, test 등)
 * @param {object[]} currentTasks - 현재 진행중인 태스크 목록 (TaskList 결과)
 * @param {object} config - loadConfig()의 결과
 * @returns {{ agent: string, score: number, reason: string } | null}
 */
function selectAgent(taskType, currentTasks, config) {
  const taskDef = config.taskTypes[taskType];
  if (!taskDef) {
    return null;
  }

  const { required, preferred } = taskDef;
  const { scoring, agents } = config;

  // 에이전트별 현재 부하 계산
  const loadMap = {};
  for (const task of currentTasks) {
    if (task.status === 'in_progress' && task.owner) {
      loadMap[task.owner] = (loadMap[task.owner] || 0) + 1;
    }
  }

  const candidates = [];

  for (const [name, agentDef] of Object.entries(agents)) {
    // 1단계: 필수 능력 필터
    const hasAllRequired = required.every(cap =>
      agentDef.capabilities.includes(cap)
    );
    if (!hasAllRequired) continue;

    // 2단계: 선호 능력 보너스
    let score = 0;
    for (const cap of preferred) {
      if (agentDef.capabilities.includes(cap)) {
        score += scoring.preferredCapabilityBonus;
      }
    }

    // 3단계: 현재 부하 감점
    const load = loadMap[name] || 0;
    score += load * scoring.loadPenalty;

    // 4단계: 비용 효율 보너스
    const costBonus = scoring.costBonus[agentDef.costTier] || 0;
    score += costBonus;

    candidates.push({ agent: name, score, load });
  }

  if (candidates.length === 0) {
    return null;
  }

  // 점수 내림차순 정렬, 동점이면 부하 적은 순
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.load - b.load;
  });

  const winner = candidates[0];
  const reason = candidates.length === 1
    ? `유일한 후보`
    : `${candidates.length}명 중 최고 점수 (${winner.score}점)`;

  return {
    agent: winner.agent,
    score: winner.score,
    reason
  };
}

/**
 * 전체 Step 목록에 에이전트를 일괄 매칭한다.
 *
 * @param {object[]} steps - 각 step: { id, description, taskType }
 * @param {object} config - loadConfig()의 결과
 * @returns {object[]} - 각 항목: { stepId, taskType, agent, score, reason }
 */
function buildTeamAssignment(steps, config) {
  // 가상 부하 추적 (할당할수록 부하 증가)
  const virtualLoad = {};

  return steps.map(step => {
    // 가상 부하를 currentTasks 형태로 변환
    const virtualTasks = [];
    for (const [owner, count] of Object.entries(virtualLoad)) {
      for (let i = 0; i < count; i++) {
        virtualTasks.push({ status: 'in_progress', owner });
      }
    }

    const result = selectAgent(step.taskType, virtualTasks, config);

    if (result) {
      // 가상 부하 증가
      virtualLoad[result.agent] = (virtualLoad[result.agent] || 0) + 1;

      return {
        stepId: step.id,
        taskType: step.taskType,
        agent: result.agent,
        subagentType: config.agents[result.agent].subagentType,
        model: config.agents[result.agent].model,
        score: result.score,
        reason: result.reason
      };
    }

    // 매칭 실패 시 defaultAgent 폴백
    const taskDef = config.taskTypes[step.taskType];
    const fallback = taskDef ? taskDef.defaultAgent : 'cto-lead';

    return {
      stepId: step.id,
      taskType: step.taskType,
      agent: fallback,
      subagentType: config.agents[fallback].subagentType,
      model: config.agents[fallback].model,
      score: 0,
      reason: '폴백: 매칭 실패로 기본 에이전트 할당'
    };
  });
}

module.exports = { selectAgent, buildTeamAssignment };
