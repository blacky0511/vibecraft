#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 통합 진입점
 *
 * 네이티브 API(TeamCreate, TaskCreate/Update/List, SendMessage) 위에
 * 판단 로직만 담당하는 지능 계층.
 *
 * 사용법:
 *   const team = require('./lib/team');
 *   const config = team.loadConfig();
 *   const plan = team.createExecutionPlan(steps, config);
 */

const { TEAM_PREFIX, META_KEYS, FAILURE_TYPES, RECOVERY_STRATEGIES, TASK_STATUS, MESSAGES } = require('./constants');
const { loadConfig, deepMerge, DEFAULT_CONFIG } = require('./config');
const { selectAgent, buildTeamAssignment } = require('./agent-matcher');
const { classifyTaskType, buildDependencyGraph, detectCycle, calculateWaves, createExecutionPlan } = require('./task-planner');
const { calculateProgress, buildProgressReport, saveProgressReport, loadProgressReport } = require('./progress-tracker');
const { analyzeFailure, isRetryable, findAlternativeAgent, detectFailureType } = require('./error-recovery');
const { buildTeamReport, buildCompletionReport } = require('./report-builder');

module.exports = {
  // 상수
  TEAM_PREFIX,
  META_KEYS,
  FAILURE_TYPES,
  RECOVERY_STRATEGIES,
  TASK_STATUS,
  MESSAGES,

  // 설정
  loadConfig,
  deepMerge,
  DEFAULT_CONFIG,

  // 에이전트 매칭
  selectAgent,
  buildTeamAssignment,

  // 태스크 계획
  classifyTaskType,
  buildDependencyGraph,
  detectCycle,
  calculateWaves,
  createExecutionPlan,

  // 진행률 추적
  calculateProgress,
  buildProgressReport,
  saveProgressReport,
  loadProgressReport,

  // 에러 복구
  analyzeFailure,
  isRetryable,
  findAlternativeAgent,
  detectFailureType,

  // 보고서
  buildTeamReport,
  buildCompletionReport
};
