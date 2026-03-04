#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 한국어 팀 보고서 생성기
 */

/**
 * 팀 구성 완료 보고서를 생성한다.
 *
 * @param {object} plan - createExecutionPlan()의 결과
 * @param {object} config - loadConfig()의 결과
 * @returns {string} 마크다운 보고서
 */
function buildTeamReport(plan, config) {
  const lines = [];

  // 투입 에이전트 집계
  const agentSet = new Set();
  for (const assignment of plan.assignments) {
    agentSet.add(assignment.agent);
  }

  lines.push(`## CTO 팀 구성 완료`);
  lines.push('');
  const sizeLabel = plan.mode === 'light' ? 'M (경량 CTO)' : plan.mode === 'ralph-loop' ? 'ralph-loop' : 'L (정규 CTO)';
  lines.push(`**작업 규모**: ${sizeLabel} (Step ${plan.totalSteps}개)`);
  lines.push(`**투입 에이전트**: ${agentSet.size}명`);
  lines.push(`**실행 Wave**: ${plan.totalWaves}개`);
  lines.push('');

  // 에이전트별 담당 테이블
  lines.push('| 에이전트 | 담당 Step | 실행 Wave | 모델 |');
  lines.push('|---------|---------|---------|------|');

  for (const wave of plan.waves) {
    for (const task of wave.tasks) {
      const assignment = plan.assignments.find(a => a.stepId === task.id);
      const model = assignment ? assignment.model : '-';
      lines.push(`| ${task.agent} | ${task.id} | Wave ${wave.wave} | ${model} |`);
    }
  }
  lines.push('');

  // Wave별 실행 순서
  lines.push('### 실행 순서');
  lines.push('');
  for (const wave of plan.waves) {
    const agents = [...new Set(wave.tasks.map(t => t.agent))];
    const parallel = wave.tasks.length > 1 ? ' (병렬)' : '';
    lines.push(`- **Wave ${wave.wave}**${parallel}: ${agents.join(', ')}`);

    for (const task of wave.tasks) {
      const deps = task.dependencies.length > 0
        ? ` (선행: ${task.dependencies.join(', ')})`
        : '';
      lines.push(`  - ${task.id}: ${task.description}${deps}`);
    }
  }
  lines.push('');

  // 비용 효율 요약
  const modelCounts = {};
  for (const assignment of plan.assignments) {
    modelCounts[assignment.model] = (modelCounts[assignment.model] || 0) + 1;
  }
  lines.push('### 비용 효율');
  lines.push('');
  for (const [model, count] of Object.entries(modelCounts)) {
    lines.push(`- ${model}: ${count}개 태스크`);
  }
  lines.push('');

  lines.push('---');
  lines.push('지금 바로 실행할까요?');

  return lines.join('\n');
}

/**
 * 실행 완료 보고서를 생성한다.
 *
 * @param {object} progress - calculateProgress()의 결과
 * @param {object} plan - createExecutionPlan()의 결과
 * @returns {string} 마크다운 보고서
 */
function buildCompletionReport(progress, plan) {
  const lines = [];

  lines.push(`## 팀 실행 완료 보고서`);
  lines.push('');

  if (progress.isAllComplete) {
    lines.push(`모든 태스크가 성공적으로 완료되었습니다.`);
  } else {
    lines.push(`**주의**: 일부 태스크가 미완료 상태입니다.`);
  }
  lines.push('');

  lines.push(`**전체**: ${progress.completed}/${progress.total} 완료 (${progress.percent}%)`);
  lines.push('');

  // 에이전트별 결과
  const agentEntries = Object.entries(progress.agentProgress);
  if (agentEntries.length > 0) {
    lines.push('### 에이전트별 실행 결과');
    lines.push('');
    lines.push('| 에이전트 | 완료 | 합계 | 상태 |');
    lines.push('|---------|------|------|------|');
    for (const [agent, data] of agentEntries) {
      const status = data.completed === data.total ? 'v' : `${data.inProgress}개 진행중`;
      lines.push(`| ${agent} | ${data.completed} | ${data.total} | ${status} |`);
    }
    lines.push('');
  }

  // Wave별 결과
  if (progress.waveProgress.length > 0) {
    lines.push('### Wave별 실행 결과');
    lines.push('');
    for (const w of progress.waveProgress) {
      const icon = w.isComplete ? 'v' : 'x';
      lines.push(`- Wave ${w.wave}: ${icon} ${w.percent}%`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('다음 단계: 리뷰 파이프라인 (code-simplifier → external-reviewer → gap-detector)');

  return lines.join('\n');
}

/**
 * ralph-loop iteration 보고서를 생성한다.
 *
 * @param {number} iteration - 현재 반복 회차
 * @param {number} maxIterations - 최대 반복 횟수
 * @param {number} prevFailures - 이전 실패 수
 * @param {number} currentFailures - 현재 실패 수
 * @returns {string} 마크다운 보고서
 */
function buildIterationReport(iteration, maxIterations, prevFailures, currentFailures) {
  const lines = [];
  const progress = prevFailures - currentFailures;
  lines.push(`## ralph-loop Iteration ${iteration}/${maxIterations}`);
  lines.push('');
  lines.push(`- 이전 실패: ${prevFailures}개`);
  lines.push(`- 현재 실패: ${currentFailures}개`);
  lines.push(`- 해결: ${progress}개`);
  lines.push('');
  if (currentFailures === 0) {
    lines.push('모든 항목이 통과되었습니다!');
  } else if (progress > 0) {
    lines.push(`남은 ${currentFailures}개를 다음 iteration에서 처리합니다.`);
  } else {
    lines.push('진전이 없습니다. 반복을 중단하고 사용자에게 보고합니다.');
  }
  return lines.join('\n');
}

module.exports = { buildTeamReport, buildCompletionReport, buildIterationReport };
