---
name: team-orchestration
description: |
  대규모 병렬 작업이나 팀 구성을 요청할 때 반드시 이 스킬을 호출하라.
  CTO 팀을 자동 구성하고 에이전트를 병렬로 실행한다.
  Triggers: 팀, 병렬, team, parallel, 에이전트팀
---

# CTO 팀 자동 구성 스킬 (lib/team/ 엔진 연동)

## 역할

`executing-plans` 스킬이 M/L 사이즈 작업으로 판단한 경우, 또는 ralph-loop 팀 모드가 선택된 경우 호출된다.
`lib/team/` 엔진이 계획서를 분석하여 의존성 그래프, Wave, 에이전트 매칭을 자동 수행한다.
Claude Code 네이티브 API를 직접 호출하여 팀을 생성하고 태스크를 관리한다.

---

## 모드별 동작

| 모드 | 발동 조건 | CTO 역할 | 팀 규모 |
|------|----------|---------|--------|
| light (경량) | M 사이즈 작업 | 메인 에이전트가 수행 | 최대 3명 |
| full (정규) | L 사이즈 작업 | 별도 cto-lead 스폰 | 최대 6명 |
| ralph-loop (반복) | 팀 ralph-loop 선택 | 메인 에이전트가 수행 | 반복당 최대 3명 |

---

## light 모드 실행 절차 (M 사이즈)

메인 에이전트가 CTO 역할을 겸하며, 코드를 직접 읽거나 쓰지 않는다.
판단과 결과 취합만 수행한다.

1. 계획서 Step에서 에이전트 2~3명 매칭 (config.mTeam 사용)
2. TeamCreate("vibecraft-m-{기능명}")
3. TaskCreate + 프롬프트 정제 + 에이전트 스폰 (worktree, background)
4. 결과 수신 → code-simplifier → verification (오류 시뮬레이션 포함)
5. 실패 복구: retry 1회 → 에스컬레이션 (reassign 생략)

**light 모드 제약:**
- `config.mTeam.maxTeammates` (기본 3명) 이하로 제한
- `config.mTeam.retryLimit` (기본 1회)만 재시도
- CTO 에이전트를 별도 스폰하지 않음 (`skipCtoAgent: true`)
- 리뷰 파이프라인: code-simplifier만 실행 (external-reviewer, gap-detector 생략)

---

## ralph-loop 모드 실행 절차 (반복 팀)

완료 기준이 명확한 반복 작업을 서브에이전트 팀으로 병렬 처리한다.
메인은 iteration 관리만 담당하고, 코드 수정은 서브에이전트가 수행한다.

ralph-loop은 독립 모드가 아니라, 기존 모드(새 기능/디버깅 등)와
크기(S/M/L) 위에 얹히는 반복 실행 방식이다.

### 입력 (호출자가 전달)

| 항목 | 설명 | 예시 |
|------|------|------|
| 검증 명령어 | 실패 여부를 판정하는 명령어 | `npm test`, `npx tsc --noEmit` |
| 성공 조건 | 검증 명령어의 성공 판정 기준 | "exit code 0", "실패 0개" |
| 실패 파서 | 검증 명령어 출력에서 실패 항목을 추출하는 방법 | 아래 참조 |

### 실패 항목 파싱 방법

검증 명령어의 출력을 파싱하여 구조화된 실패 항목 목록을 만든다.

**자동 감지되는 형식:**

| 도구 | 출력 형식 | 파싱 방법 |
|------|----------|----------|
| Jest/Vitest | `FAIL src/foo.test.ts` | 파일명 + 테스트명 추출 |
| pytest | `FAILED tests/test_foo.py::test_bar` | 파일명::테스트명 추출 |
| TypeScript (tsc) | `src/foo.ts(10,5): error TS2345` | 파일명(행,열): 에러코드 추출 |
| ESLint | `src/foo.ts:10:5: error ...` | 파일명:행:열: 규칙 추출 |
| Gradle/Maven | 스택트레이스에서 테스트 클래스명 | 테스트 클래스.메서드 추출 |

**파싱 불가 시**: AI가 출력을 읽고 수동으로 실패 항목을 구조화한다.

### 실패 항목 구조

```json
{
  "file": "src/auth/login.service.ts",
  "line": 45,
  "type": "test-failure | type-error | lint-error | build-error",
  "message": "Expected 200 but received 401",
  "testName": "should return JWT token"
}
```

### Iteration 루프

1. **초기 측정**: 검증 명령어 실행 → 실패 항목 파싱 → 실패 N개

2. **그룹핑**: 실패 항목을 서브에이전트에 분배하기 위해 그룹화

   | 그룹핑 기준 | 적용 상황 |
   |-----------|----------|
   | 파일별 | 실패가 여러 파일에 분산 (가장 일반적) |
   | 에러 유형별 | 같은 유형의 에러가 여러 파일에 반복 |
   | 의존성별 | 에러 간 수정 순서가 있는 경우 |

3. **서브에이전트 분배** (최대 `config.ralphLoop.maxTeammates`명):
   - 각 서브에이전트에 담당 그룹의 실패 항목 + 검증 명령어 전달
   - **프롬프트 정제 필수**: templates/subagent-prompt.md 형식으로 정제
   - worktree 격리 실행
   - 서브에이전트는 담당 파일만 수정, 범위 밖 수정 금지

4. **서브에이전트 프롬프트 예시**:

   ```
   ## 작업 지시서

   ### 목표
   아래 실패 항목을 수정하여 검증 명령어를 통과시킨다.

   ### 검증 명령어
   npm test -- --testPathPattern="auth"

   ### 담당 실패 항목
   1. src/auth/login.service.ts:45 — Expected 200 but received 401
   2. src/auth/login.service.ts:67 — Cannot read property 'email' of undefined

   ### 맥락
   - 프로젝트: selfpost (Next.js 14, TypeScript)
   - 최근 수정: AuthController에 JWT 검증 로직 추가
   - 기존 패턴: src/auth/auth.service.ts 참고

   ### 성공 기준
   - [ ] npm test -- --testPathPattern="auth" 전체 통과
   - [ ] 다른 파일 수정 금지

   ### 하지 말 것
   - 테스트 코드 자체를 수정하지 않는다 (테스트가 맞고 구현이 틀린 것)
   - 새 패키지 설치하지 않는다
   ```

5. **결과 병합 + 재측정**:
   - 모든 서브에이전트 완료 대기
   - 검증 명령어 재실행 → 실패 항목 재파싱
   - `buildIterationReport()` 호출 → iteration 보고서 출력

6. **진전 판단**:

   | 상황 | 판정 | 행동 |
   |------|------|------|
   | 실패 0개 | 완료 | 루프 종료, 성공 보고 |
   | 실패 감소 | 진전 있음 | 다음 iteration |
   | 실패 동일 | 진전 없음 | 즉시 중단 |
   | 실패 증가 | 회귀 발생 | 즉시 중단 + git 변경사항 리뷰 |

### ralph-loop 완료 후 리뷰 파이프라인

ralph-loop은 "에러 0개"를 만드는 보조 루프이며, 계획 대비 누락 검사와는 역할이 다르다.

| 시나리오 | ralph-loop 완료 후 | 이유 |
|---------|-------------------|------|
| A. 디버깅 후 | verification만 재실행 | 기존 기능 수정이라 누락 검사 불필요 |
| B. 새 기능 후 | verification + gap-detector 재실행 | 계획한 기능이 빠졌는지 확인 필요 |
| C. 일괄 수정 | verification만 재실행 | 계획서 자체가 간소하므로 gap-detector 불필요 |
| L 크기 작업 | 기존 리뷰 파이프라인 전체 유지 | 대형 작업은 품질 회귀 위험이 높음 |

### 안전장치

- 최대 반복: `config.ralphLoop.maxIterations` (기본 5회)
- 최대 팀원: `config.ralphLoop.maxTeammates` (기본 3명)
- 진전 임계: `config.ralphLoop.progressThreshold` (기본 0 = 1개라도 줄어야 진전)
- 타임아웃: `config.ralphLoop.taskTimeoutMs` (기본 300초)
- **회귀 즉시 중단**: 실패 수가 이전보다 증가하면 즉시 중단하고 변경 사항을 보고

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

### [5단계] 프롬프트 정제 + 에이전트 스폰

각 에이전트를 스폰하기 전에, **반드시 `templates/subagent-prompt.md` 형식으로 프롬프트를 정제**한다.
메인 맥락에서 프로젝트 정보, 기술 스택, 파일 경로, 코딩 패턴을 추출하여 구조화된 지시서로 변환한다.

**정제 절차 (에이전트당 1회):**
1. 해당 에이전트의 담당 태스크 확인
2. 대상 파일 경로를 절대/상대 경로로 명시
3. 수정 대상 파일의 코딩 패턴 2~3줄로 요약
4. 성공 기준을 검증 가능한 조건으로 변환
5. 범위 밖 수정 금지 + 판단 필요 시 "메인에 보고" 지시

```
plan.assignments.forEach(assignment => {
  // 1. 프롬프트 정제
  const refinedPrompt = buildRefinedPrompt({
    task: assignment.task,
    projectContext: currentContext,  // 프로젝트명, 스택, 브랜치
    filePatterns: extractPatterns(assignment.task.files),  // 코딩 패턴
    successCriteria: assignment.task.criteria,  // 성공 기준
    constraints: assignment.task.constraints  // 제약 조건
  });

  // 2. 정제된 프롬프트로 스폰
  Task({
    subagent_type: assignment.subagentType,
    team_name: "vibecraft-{기능명}",
    name: assignment.agent,
    model: assignment.model,
    prompt: refinedPrompt,  // ← 정제된 지시서
    isolation: "worktree",
    run_in_background: true  // 메인 컨텍스트 절약
  })
})
```

> **절대 하지 말 것**: 사용자 원문이나 계획서 경로만 달랑 넘기지 않는다.
> 서브에이전트는 메인의 대화 맥락이 없으므로, 모든 필요 정보를 지시서에 포함해야 한다.

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
