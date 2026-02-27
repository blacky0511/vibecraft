#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 진행률 추적기
 * 네이티브 TaskList 결과를 입력으로 받아 진행률을 계산한다.
 * 디스크에 마크다운 보고서를 기록하여 세션 복구를 지원한다.
 */

const fs = require('fs');
const path = require('path');
const { TASK_STATUS, MESSAGES } = require('./constants');

/**
 * 네이티브 TaskList 결과에서 진행률을 계산한다.
 *
 * @param {object[]} tasks - TaskList 결과 배열
 * @param {object} plan - createExecutionPlan()의 결과
 * @returns {object} 진행률 정보
 */
function calculateProgress(tasks, plan) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  const inProgress = tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length;
  const pending = tasks.filter(t => t.status === TASK_STATUS.PENDING).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Wave별 진행률
  const waveProgress = [];
  if (plan && plan.waves) {
    for (const wave of plan.waves) {
      const waveTaskIds = wave.tasks.map(t => t.id);
      const waveTasks = tasks.filter(t => waveTaskIds.includes(t.subject));
      const waveCompleted = waveTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
      const waveTotal = wave.tasks.length;

      waveProgress.push({
        wave: wave.wave,
        total: waveTotal,
        completed: waveCompleted,
        percent: waveTotal > 0 ? Math.round((waveCompleted / waveTotal) * 100) : 0,
        isComplete: waveCompleted === waveTotal
      });
    }
  }

  // 에이전트별 진행률
  const agentProgress = {};
  for (const task of tasks) {
    if (!task.owner) continue;
    if (!agentProgress[task.owner]) {
      agentProgress[task.owner] = { total: 0, completed: 0, inProgress: 0 };
    }
    agentProgress[task.owner].total++;
    if (task.status === TASK_STATUS.COMPLETED) {
      agentProgress[task.owner].completed++;
    } else if (task.status === TASK_STATUS.IN_PROGRESS) {
      agentProgress[task.owner].inProgress++;
    }
  }

  // 현재 Wave (첫 번째 미완료 Wave)
  const currentWave = waveProgress.find(w => !w.isComplete) || null;

  return {
    total,
    completed,
    inProgress,
    pending,
    percent,
    waveProgress,
    agentProgress,
    currentWave,
    isAllComplete: completed === total && total > 0
  };
}

/**
 * 진행률 보고서를 마크다운으로 생성한다.
 *
 * @param {object} progress - calculateProgress()의 결과
 * @param {object} plan - createExecutionPlan()의 결과
 * @param {string} teamName - 팀 이름
 * @returns {string} 마크다운 보고서
 */
function buildProgressReport(progress, plan, teamName) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lines = [];

  lines.push(`# 팀 진행 상황 보고서`);
  lines.push('');
  lines.push(`**팀**: ${teamName}`);
  lines.push(`**최종 갱신**: ${now}`);
  lines.push(`**전체 진행률**: ${progress.percent}% (${progress.completed}/${progress.total})`);
  lines.push('');

  // 상태 요약
  lines.push('## 상태 요약');
  lines.push('');
  lines.push(`| 상태 | 수 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 완료 | ${progress.completed} |`);
  lines.push(`| 진행중 | ${progress.inProgress} |`);
  lines.push(`| 대기 | ${progress.pending} |`);
  lines.push('');

  // Wave별 진행률
  if (progress.waveProgress.length > 0) {
    lines.push('## Wave별 진행률');
    lines.push('');
    lines.push('| Wave | 진행률 | 상태 |');
    lines.push('|------|--------|------|');
    for (const w of progress.waveProgress) {
      const status = w.isComplete ? 'v 완료' : (w.completed > 0 ? '... 진행중' : '대기');
      lines.push(`| Wave ${w.wave} | ${w.percent}% (${w.completed}/${w.total}) | ${status} |`);
    }
    lines.push('');
  }

  // 에이전트별 진행률
  const agentEntries = Object.entries(progress.agentProgress);
  if (agentEntries.length > 0) {
    lines.push('## 에이전트별 진행률');
    lines.push('');
    lines.push('| 에이전트 | 완료 | 진행중 | 합계 |');
    lines.push('|---------|------|--------|------|');
    for (const [agent, data] of agentEntries) {
      lines.push(`| ${agent} | ${data.completed} | ${data.inProgress} | ${data.total} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 진행률 보고서를 디스크에 저장한다. (원자적 쓰기)
 *
 * @param {string} reportContent - 마크다운 보고서 내용
 * @param {string} reportPath - 저장 경로
 */
function saveProgressReport(reportContent, reportPath) {
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 원자적 쓰기: 임시 파일에 쓴 후 rename
  const tmpPath = reportPath + '.tmp';
  fs.writeFileSync(tmpPath, reportContent, 'utf-8');
  fs.renameSync(tmpPath, reportPath);
}

/**
 * 디스크에서 이전 진행률 보고서를 읽는다.
 *
 * @param {string} reportPath - 보고서 경로
 * @returns {string | null} 보고서 내용 또는 null
 */
function loadProgressReport(reportPath) {
  if (!fs.existsSync(reportPath)) return null;
  try {
    return fs.readFileSync(reportPath, 'utf-8');
  } catch {
    return null;
  }
}

module.exports = {
  calculateProgress,
  buildProgressReport,
  saveProgressReport,
  loadProgressReport
};
