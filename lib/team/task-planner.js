#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 의존성 그래프 + Wave 기반 태스크 플래너
 * bkit의 의존성 체크 없는 할당을 대체한다.
 * 암시적 의존성 추론 + 순환 감지 + Wave 계산을 수행한다.
 *
 * 의존 모듈: ./constants, ./agent-matcher (같은 lib/team/ 내부)
 * 이 파일을 사용하는 곳: ./index.js (lib/team 통합 export)
 */

const { MESSAGES } = require('./constants');
const { buildTeamAssignment } = require('./agent-matcher');

// 태스크 유형 자동 분류 패턴
const TYPE_PATTERNS = [
  { type: 'database', patterns: [/db/i, /database/i, /migration/i, /schema/i, /테이블/i, /스키마/i, /마이그레이션/i, /쿼리/i] },
  { type: 'backend', patterns: [/api/i, /server/i, /endpoint/i, /controller/i, /service/i, /서버/i, /백엔드/i, /인증/i, /auth/i] },
  { type: 'frontend', patterns: [/ui/i, /component/i, /page/i, /css/i, /style/i, /프론트/i, /컴포넌트/i, /페이지/i, /화면/i] },
  { type: 'test', patterns: [/test/i, /테스트/i, /tdd/i, /검증/i, /spec/i] },
  { type: 'review', patterns: [/review/i, /리뷰/i, /검토/i, /코드\s*리뷰/i] },
  { type: 'documentation', patterns: [/doc/i, /문서/i, /readme/i, /주석/i] },
  { type: 'deploy', patterns: [/deploy/i, /배포/i, /릴리즈/i, /ci/i, /cd/i] },
  { type: 'debug', patterns: [/debug/i, /디버그/i, /버그/i, /에러/i, /오류/i] },
  { type: 'refactoring', patterns: [/refactor/i, /리팩토/i, /정리/i, /개선/i, /simplif/i] },
  { type: 'analysis', patterns: [/analy/i, /분석/i, /조사/i, /탐색/i] },
  { type: 'architecture', patterns: [/architect/i, /설계/i, /구조/i, /설정/i, /config/i, /공통/i, /유틸/i] }
];

/**
 * Step 설명에서 태스크 유형을 자동 분류한다.
 * @param {string} description - Step 설명
 * @returns {string} 태스크 유형
 */
function classifyTaskType(description) {
  for (const { type, patterns } of TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(description)) {
        return type;
      }
    }
  }
  return 'architecture';
}

/**
 * 의존성 그래프를 구성한다.
 * 명시적 의존성(step.dependsOn) + 암시적 의존성(config.implicitDependencies)을 결합.
 *
 * @param {object[]} steps - 각 step: { id, description, taskType, dependsOn?: string[] }
 * @param {object} config
 * @returns {Map<string, Set<string>>} stepId -> 의존하는 stepId들
 */
function buildDependencyGraph(steps, config) {
  const graph = new Map();
  const typeToSteps = new Map();

  for (const step of steps) {
    graph.set(step.id, new Set(step.dependsOn || []));
    if (!typeToSteps.has(step.taskType)) {
      typeToSteps.set(step.taskType, []);
    }
    typeToSteps.get(step.taskType).push(step.id);
  }

  const implicitDeps = config.implicitDependencies || {};
  for (const [dependentType, requiredTypes] of Object.entries(implicitDeps)) {
    const dependentSteps = typeToSteps.get(dependentType) || [];
    for (const reqType of requiredTypes) {
      const reqSteps = typeToSteps.get(reqType) || [];
      for (const depStepId of dependentSteps) {
        for (const reqStepId of reqSteps) {
          if (depStepId !== reqStepId) {
            graph.get(depStepId).add(reqStepId);
          }
        }
      }
    }
  }

  return graph;
}

/**
 * 순환 의존성을 감지한다. (DFS 기반)
 * @param {Map<string, Set<string>>} graph
 * @returns {string[] | null} 순환 경로 또는 null
 */
function detectCycle(graph) {
  const visited = new Set();
  const inStack = new Set();

  for (const node of graph.keys()) {
    if (visited.has(node)) continue;

    const stack = [{ node, iter: null }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];

      if (!frame.iter) {
        if (visited.has(frame.node)) {
          stack.pop();
          continue;
        }
        visited.add(frame.node);
        inStack.add(frame.node);
        frame.iter = (graph.get(frame.node) || new Set()).values();
      }

      const next = frame.iter.next();
      if (next.done) {
        inStack.delete(frame.node);
        stack.pop();
        continue;
      }

      const neighbor = next.value;
      if (inStack.has(neighbor)) {
        const cycle = [neighbor];
        for (let i = stack.length - 1; i >= 0; i--) {
          cycle.push(stack[i].node);
          if (stack[i].node === neighbor) break;
        }
        return cycle.reverse();
      }

      if (!visited.has(neighbor)) {
        stack.push({ node: neighbor, iter: null });
      }
    }
  }

  return null;
}

/**
 * Wave를 계산한다. 같은 Wave = 병렬 실행, Wave 간 = 순차.
 * @param {Map<string, Set<string>>} graph
 * @returns {Map<string, number>} stepId -> wave 번호 (0부터)
 */
function calculateWaves(graph) {
  const waveMap = new Map();

  function getWave(nodeId, visiting) {
    if (waveMap.has(nodeId)) return waveMap.get(nodeId);
    if (visiting.has(nodeId)) return 0;

    visiting.add(nodeId);
    const deps = graph.get(nodeId) || new Set();

    let maxDepWave = -1;
    for (const dep of deps) {
      maxDepWave = Math.max(maxDepWave, getWave(dep, visiting));
    }

    const wave = maxDepWave + 1;
    waveMap.set(nodeId, wave);
    visiting.delete(nodeId);
    return wave;
  }

  for (const nodeId of graph.keys()) {
    getWave(nodeId, new Set());
  }

  return waveMap;
}

/**
 * 실행 계획을 생성한다.
 *
 * @param {object[]} steps - 각 step: { id, description, dependsOn?: string[] }
 *   taskType이 없으면 description에서 자동 분류
 * @param {object} config - loadConfig()의 결과
 * @returns {{ totalSteps, totalWaves, waves, assignments }}
 */
function createExecutionPlan(steps, config) {
  const enrichedSteps = steps.map(step => ({
    ...step,
    taskType: step.taskType || classifyTaskType(step.description)
  }));

  const graph = buildDependencyGraph(enrichedSteps, config);

  const cycle = detectCycle(graph);
  if (cycle) {
    throw new Error(MESSAGES.circularDependency(cycle));
  }

  const waveMap = calculateWaves(graph);
  const assignments = buildTeamAssignment(enrichedSteps, config);

  const waveGroups = new Map();
  for (const step of enrichedSteps) {
    const wave = waveMap.get(step.id) || 0;
    if (!waveGroups.has(wave)) {
      waveGroups.set(wave, []);
    }
    const assignment = assignments.find(a => a.stepId === step.id);
    waveGroups.get(wave).push({
      ...step,
      wave,
      agent: assignment.agent,
      subagentType: assignment.subagentType,
      model: assignment.model,
      dependencies: Array.from(graph.get(step.id) || [])
    });
  }

  const sortedWaves = Array.from(waveGroups.entries())
    .sort(([a], [b]) => a - b)
    .map(([waveNum, tasks]) => ({ wave: waveNum, tasks }));

  return {
    totalSteps: enrichedSteps.length,
    totalWaves: sortedWaves.length,
    waves: sortedWaves,
    assignments
  };
}

module.exports = {
  classifyTaskType,
  buildDependencyGraph,
  detectCycle,
  calculateWaves,
  createExecutionPlan
};
