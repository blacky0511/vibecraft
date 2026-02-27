---
name: team-orchestration
description: |
  L 사이즈 대형 작업에서 lib/team/ 엔진을 사용하여 CTO 팀을 자동 구성하고
  Claude Code 네이티브 API(TeamCreate, TaskCreate, SendMessage)로 병렬 실행을 조율하는 스킬.
  점수 기반 에이전트 매칭, 의존성 Wave 계산, 실패 자동 복구를 수행한다.

  Triggers: 팀, team, 병렬, parallel, CTO, team-orchestration
---

# CTO 팀 자동 구성 스킬 (lib/team/ 엔진 연동)

## 역할

`executing-plans` 스킬이 L 사이즈 작업으로 판단한 경우 호출된다.
`lib/team/` 엔진이 계획서를 분석하여 의존성 그래프, Wave, 에이전트 매칭을 자동 수행한다.
Claude Code 네이티브 API를 직접 호출하여 팀을 생성하고 태스크를 관리한다.

---

## 핵심 철학: "네이티브 API 위의 지능 계층"

- **상태 관리**: Claude Code 네이티브 API(TeamCreate, TaskList, TaskUpdate)가 담당
- **판단 로직**: lib/team/ 모듈이 담당 (에이전트 선택, 의존성, 복구)
- **자체 상태 저장소 없음**: race condition과 세션 손실 문제를 원천 차단

---

## 실행 절차 (네이티브 API 연동)

### [1단계] 실행 계획 생성

계획서의 Step 목록을 lib/team/ 엔진에 전달하여 실행 계획을 생성한다.

```javascript
const team = require('./lib/team');
const config = team.loadConfig();

// Step 목록을 전달하면 자동으로:
// - 태스크 유형 분류 (정규식 패턴 매칭)
// - 의존성 그래프 구성 (명시적 + 암시적)
// - Wave 계산 (병렬/순차 결정)
// - 점수 기반 에이전트 매칭
const plan = team.createExecutionPlan(steps, config);
```

**steps 형식:**
```javascript
const steps = [
  { id: 'step-1', description: 'DB 테이블 생성 마이그레이션' },
  { id: 'step-2', description: 'REST API 엔드포인트 구현' },
  { id: 'step-3', description: 'UI 컴포넌트 페이지 구현' },
  { id: 'step-4', description: '통합 테스트 작성' }
];
// taskType은 description에서 자동 분류된다.
// dependsOn이 없으면 암시적 의존성이 자동 추가된다.
// (DB → 백엔드, 백엔드 → 프론트엔드, 구현 → 테스트)
```

### [2단계] 팀 구성 보고

```javascript
const report = team.buildTeamReport(plan, config);
// 사용자에게 보고 → 실행 승인 요청
```

### [3단계] 네이티브 TeamCreate 호출

```
TeamCreate({
  team_name: "vibecraft-{기능명}",
  description: "L 사이즈 작업: {기능 설명}"
})
```

### [4단계] Wave별 TaskCreate + 의존성 설정

```
// Wave 0 태스크 (의존성 없음 → 즉시 실행 가능)
plan.waves[0].tasks.forEach(task => {
  TaskCreate({ subject: task.id, description: task.description })
})

// Wave 1+ 태스크 (선행 Wave 태스크 완료 후 실행)
plan.waves[1].tasks.forEach(task => {
  TaskCreate({ subject: task.id, description: task.description })
  TaskUpdate({ taskId, addBlockedBy: task.dependencies })
})
```

### [5단계] 에이전트 스폰

```
plan.assignments.forEach(assignment => {
  Task({
    subagent_type: assignment.subagentType,
    team_name: "vibecraft-{기능명}",
    name: assignment.agent,
    model: assignment.model,
    prompt: "...",
    isolation: "worktree"
  })
})
```

### [6단계] 모니터링

- **TeammateIdle 훅**: `scripts/team-monitor.js`가 자동 로깅
- **TaskList 폴링**: 주기적으로 진행률 확인

```javascript
const progress = team.calculateProgress(taskListResult, plan);
const report = team.buildProgressReport(progress, plan, teamName);
team.saveProgressReport(report, config.progressReportPath);
```

### [7단계] 실패 복구

태스크 실패 시 자동 복구 전략을 결정한다.

```javascript
const failureType = team.detectFailureType(failedTask, config);
const recovery = team.analyzeFailure(
  failedTask, failureType, currentAgent, allTasks, config
);

// recovery.strategy: 'retry_same' | 'reassign' | 'escalate'
// recovery.action: 수행할 행동
// recovery.newAgent: 재할당 대상 (재할당인 경우)
```

복구 흐름:
1. **retry_same**: 같은 에이전트로 재시도 (최대 config.retryLimit회)
2. **reassign**: 다른 에이전트로 재할당 (점수 기반 자동 선택)
3. **escalate**: CTO에게 에스컬레이션 (수동 판단 필요)

### [8단계] 완료 보고

```javascript
const completionReport = team.buildCompletionReport(progress, plan);
// 리뷰 파이프라인으로 전달
```

---

## 에이전트 매칭 알고리즘

lib/team/agent-matcher.js가 점수 기반으로 최적 에이전트를 선택한다.

| 단계 | 기준 | 점수 |
|------|------|------|
| 1 | 필수 능력 필터 | 없으면 탈락 |
| 2 | 선호 능력 보너스 | +10점/개 |
| 3 | 현재 부하 감점 | -15점/진행중 태스크 |
| 4 | 비용 효율 보너스 | low: +5, medium: 0, high: -5 |

**에이전트별 능력:**

| 에이전트 | 핵심 능력 | 모델 | 비용 |
|---------|----------|------|------|
| cto-lead | architecture, coordination | sonnet | medium |
| frontend-builder | ui, css, component | sonnet | medium |
| backend-builder | api, database, server | sonnet | medium |
| test-writer | unit-test, integration-test | sonnet | medium |
| debugger | debugging, profiling | sonnet | medium |
| code-reviewer | review, quality, security | haiku | low |
| code-simplifier | refactoring, simplification | haiku | low |
| doc-writer | documentation, readme | haiku | low |
| deploy-manager | deploy, ci-cd | haiku | low |
| gap-detector | gap-analysis, coverage | haiku | low |
| code-analyzer | analysis, dependency-check | haiku | low |

---

## 의존성 Wave 시스템

lib/team/task-planner.js가 의존성 그래프를 구성하고 Wave를 계산한다.

### 암시적 의존성 규칙

코드 수정 없이 config.implicitDependencies로 확장 가능하다.

```
database → backend    (DB 먼저, 그 다음 API)
backend → frontend    (API 먼저, 그 다음 UI)
분석 → 구현           (분석 후 구현)
구현 → test           (구현 후 테스트)
test → review         (테스트 후 리뷰)
review → deploy       (리뷰 후 배포)
```

### Wave 예시

```
Wave 0 (병렬): DB 마이그레이션 + 공통 설정
Wave 1 (병렬): API 구현 + 백엔드 로직
Wave 2 (병렬): UI 컴포넌트 + 페이지
Wave 3 (순차): 통합 테스트
```

---

## 설정 오버라이드

프로젝트 루트에 `vibecraft.team.json`을 생성하면 기본 설정을 오버라이드할 수 있다.

```json
{
  "maxTeammates": 4,
  "retryLimit": 3,
  "taskTimeoutMs": 300000,
  "scoring": {
    "preferredCapabilityBonus": 15,
    "loadPenalty": -20
  },
  "taskTypes": {
    "custom-type": {
      "required": ["api"],
      "preferred": ["database"],
      "defaultAgent": "backend-builder"
    }
  }
}
```

---

## 세션 복구

세션이 종료/재시작되면:
1. `scripts/team-session-restore.js`가 SessionStart 훅에서 실행
2. `docs/team-progress.md` 존재 여부 확인
3. 있으면 이전 세션 정보를 안내
4. AI가 보고서를 읽고 TaskList와 대조하여 이어서 진행

---

## 연동 흐름

```
executing-plans (L 사이즈 판단)
    │
    ▼
team-orchestration (lib/team/ 엔진 연동)
    │
    ├─ [1] task-planner.createExecutionPlan() → 의존성 + Wave + 에이전트 매칭
    ├─ [2] report-builder.buildTeamReport() → 사용자에게 팀 구성 보고
    ├─ [3] TeamCreate("vibecraft-{기능명}")
    ├─ [4] Wave별 TaskCreate + TaskUpdate(blockedBy)
    ├─ [5] 각 에이전트 Task(subagent, team_name) 스폰
    ├─ [6] 모니터링 (TeammateIdle 훅 + TaskList + progress-tracker)
    ├─ [7] 실패 시 error-recovery.analyzeFailure()
    ├─ [8] 모든 Wave 완료 → buildCompletionReport()
    │
    ▼
리뷰 파이프라인 (code-simplifier → external-reviewer → gap-detector)
```
