#!/usr/bin/env node

/**
 * vibecraft 팀 엔진 - 설정 로더
 * 기본 설정 + vibecraft.team.json 오버라이드를 deepMerge한다.
 */

const fs = require('fs');
const path = require('path');

// 기본 설정
const DEFAULT_CONFIG = {
  // 팀 운영
  maxTeammates: 6,
  taskTimeoutMs: 600000,
  retryLimit: 2,
  idleThresholdMs: 120000,

  // 에이전트 정의
  agents: {
    'cto-lead': {
      capabilities: ['architecture', 'coordination', 'config', 'shared-code'],
      model: 'sonnet',
      costTier: 'medium',
      subagentType: 'vibecraft:cto-lead'
    },
    'frontend-builder': {
      capabilities: ['ui', 'css', 'component', 'page', 'accessibility'],
      model: 'sonnet',
      costTier: 'medium',
      subagentType: 'vibecraft:frontend-builder'
    },
    'backend-builder': {
      capabilities: ['api', 'database', 'server', 'migration', 'auth'],
      model: 'sonnet',
      costTier: 'medium',
      subagentType: 'vibecraft:backend-builder'
    },
    'test-writer': {
      capabilities: ['unit-test', 'integration-test', 'e2e-test', 'tdd'],
      model: 'sonnet',
      costTier: 'medium',
      subagentType: 'vibecraft:test-writer'
    },
    'debugger': {
      capabilities: ['debugging', 'profiling', 'error-analysis'],
      model: 'sonnet',
      costTier: 'medium',
      subagentType: 'vibecraft:debugger'
    },
    'code-reviewer': {
      capabilities: ['review', 'quality', 'security'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:code-reviewer'
    },
    'code-simplifier': {
      capabilities: ['refactoring', 'simplification', 'cleanup'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:code-simplifier'
    },
    'doc-writer': {
      capabilities: ['documentation', 'readme', 'api-docs'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:doc-writer'
    },
    'deploy-manager': {
      capabilities: ['deploy', 'ci-cd', 'infrastructure'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:deploy-manager'
    },
    'gap-detector': {
      capabilities: ['gap-analysis', 'coverage', 'completeness'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:gap-detector'
    },
    'code-analyzer': {
      capabilities: ['analysis', 'dependency-check', 'impact-analysis'],
      model: 'haiku',
      costTier: 'low',
      subagentType: 'vibecraft:code-analyzer'
    }
  },

  // 태스크 유형별 필수/선호 능력 매핑
  taskTypes: {
    'frontend': {
      required: ['ui'],
      preferred: ['css', 'component', 'page', 'accessibility'],
      defaultAgent: 'frontend-builder'
    },
    'backend': {
      required: ['api'],
      preferred: ['database', 'server', 'auth'],
      defaultAgent: 'backend-builder'
    },
    'database': {
      required: ['database'],
      preferred: ['migration', 'server'],
      defaultAgent: 'backend-builder'
    },
    'test': {
      required: ['unit-test'],
      preferred: ['integration-test', 'e2e-test', 'tdd'],
      defaultAgent: 'test-writer'
    },
    'review': {
      required: ['review'],
      preferred: ['quality', 'security'],
      defaultAgent: 'code-reviewer'
    },
    'documentation': {
      required: ['documentation'],
      preferred: ['readme', 'api-docs'],
      defaultAgent: 'doc-writer'
    },
    'deploy': {
      required: ['deploy'],
      preferred: ['ci-cd', 'infrastructure'],
      defaultAgent: 'deploy-manager'
    },
    'debug': {
      required: ['debugging'],
      preferred: ['profiling', 'error-analysis'],
      defaultAgent: 'debugger'
    },
    'refactoring': {
      required: ['refactoring'],
      preferred: ['simplification', 'cleanup'],
      defaultAgent: 'code-simplifier'
    },
    'analysis': {
      required: ['analysis'],
      preferred: ['dependency-check', 'impact-analysis'],
      defaultAgent: 'code-analyzer'
    },
    'architecture': {
      required: ['architecture'],
      preferred: ['coordination', 'config'],
      defaultAgent: 'cto-lead'
    }
  },

  // 점수 가중치
  scoring: {
    requiredCapabilityBonus: 0,    // 필수는 필터 역할 (없으면 탈락)
    preferredCapabilityBonus: 10,  // 선호 능력 1개당 +10
    loadPenalty: -15,              // 진행중 태스크 1개당 -15
    costBonus: { low: 5, medium: 0, high: -5 } // 비용 효율 보너스
  },

  // 암시적 의존성 규칙
  implicitDependencies: {
    'database': ['backend'],     // DB → 백엔드
    'backend': ['frontend'],     // 백엔드 → 프론트엔드 (API 소비)
    'analysis': ['frontend', 'backend', 'database'], // 분석 → 구현
    'test': ['frontend', 'backend', 'database'],     // 테스트 → 구현
    'review': ['test'],          // 리뷰 → 테스트
    'deploy': ['review']         // 배포 → 리뷰
  },

  // 진행률 보고서 경로
  progressReportPath: 'docs/team-progress.md'
};

/**
 * 두 객체를 깊은 병합한다.
 * 배열은 덮어쓴다 (병합하지 않음).
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * 설정을 로드한다.
 * 프로젝트 루트의 vibecraft.team.json이 있으면 기본 설정에 deepMerge한다.
 * @param {string} [projectRoot] - 프로젝트 루트 경로 (기본: process.cwd())
 * @returns {object} 최종 설정
 */
function loadConfig(projectRoot) {
  const root = projectRoot || process.cwd();
  const overridePath = path.join(root, 'vibecraft.team.json');

  let override = {};
  if (fs.existsSync(overridePath)) {
    try {
      const raw = fs.readFileSync(overridePath, 'utf-8');
      override = JSON.parse(raw);
    } catch (err) {
      console.error(`[vibecraft] vibecraft.team.json 파싱 실패: ${err.message}`);
    }
  }

  return deepMerge(DEFAULT_CONFIG, override);
}

module.exports = { loadConfig, deepMerge, DEFAULT_CONFIG };
