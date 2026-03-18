# ralph-loop 통합 + plan 작성 컨텍스트 최적화 계획서

## 기본 정보

| 항목 | 내용 |
|------|------|
| 문서 제목 | ralph-loop 전체 배선 + writing-plans 서브에이전트 위임 |
| 프로젝트 | vibecraft 플러그인 |
| 작성일 | 2026-03-18 |
| 버전 | v1.2 (feedback 반영) |

---

## 1. 목표

- **핵심 목표 1**: ralph-loop이 실제로 동작하도록 끊긴 배선을 연결하고, 사용자가 "수정 → 테스트 → 실패 → 재수정"을 수동으로 반복하지 않아도 되게 한다.
- **핵심 목표 2**: plan.md 작성을 서브에이전트에 위임하여, 메인 세션의 컨텍스트 소비를 줄인다.
- **성공 기준**:
  - 사용자가 "ralph-loop으로 해줘"라고 말하면 자동으로 반복 수정 루프가 시작된다
  - 디버깅, 새 기능 구현, 테스트 통과 등 3가지 시나리오에서 ralph-loop이 작동한다
  - 진전이 없으면 자동 중단되고 사용자에게 보고한다
  - plan.md 작성 시 메인 세션에는 지시서(짧음)와 결과 요약만 남고, 실제 문서 내용은 서브에이전트에서 처리된다

---

## 2. 배경 및 이유

### 현재 상황 / 문제점

ralph-loop의 부품은 모두 만들어져 있지만 배선이 끊겨 있다:

| 부품 | 상태 | 문제 |
|------|------|------|
| `config.js` — ralphLoop 설정 | 존재함 | - |
| `report-builder.js` — buildIterationReport() | 존재함 | - |
| `cto-lead.md` — ralph-loop 지휘 절차 | 존재함 | - |
| `team-orchestration` — ralph-loop 모드 절차 | 존재함 | - |
| `auto-detect` — ralph-loop 제안 | 존재함 | **라우팅 경로 없음** |
| `smart-pdca` — ralph-loop 경로 | **없음** | S/M/L만 정의됨 |
| `executing-plans` — ralph-loop 분기 | **없음** | S/M/L만 분기됨 |
| `systematic-debugging` — ralph-loop 연동 | **없음** | 4단계 프로세스만 있음 |

### 이 작업이 필요한 이유

**ralph-loop**: 사용자가 기능 구현이나 디버깅 후 남은 오류를 수동으로 반복 수정하고 있다. RPDCA의 P(Plan)에 명확한 목표와 검증 명령어가 이미 정의되어 있으므로, ralph-loop이 "실패 항목 수집 → 서브에이전트 분배 → 재측정"을 자동화할 수 있다.

**plan 컨텍스트 문제**: 현재 writing-plans 스킬은 메인 세션에서 plan.md를 직접 작성한다. plan.md가 수백~수천 줄이 되면 (코드 블록, TDD 절차, 검증 명령어 등) 메인 세션의 컨텍스트를 과도하게 소비한다. 리서치(파일 읽기) + plan 내용 구상 + plan.md 쓰기가 모두 메인에서 일어나기 때문이다.

### 기대 효과

- 수동 반복 사이클(수정 → 테스트 → 실패 → 다시 요청) 제거
- 세션 재시작 없이 하나의 흐름 안에서 오류 0개까지 자동 도달
- 진전 없는 루프를 자동 중단하여 토큰 낭비 방지
- plan.md 작성 시 메인 컨텍스트 소비 대폭 감소 (수천 줄 → 요약 수십 줄)

---

## 3. ralph-loop 활용 시나리오 3가지

### 시나리오 A: 디버깅 반복 (가장 핵심)

**상황**: 버그를 고쳤는데 관련 테스트가 여전히 실패하거나, 수정이 다른 테스트를 깨뜨림.

```
사용자: "로그인이 안 돼"
  ↓
systematic-debugging 4단계 → 원인 파악 → 수정
  ↓
verification → 테스트 3개 실패 발견
  ↓
⚡ ralph-loop 자동 진입 (또는 사용자에게 제안)
  ↓
Iteration 1: 실패 3개 → 서브에이전트 분배 → 재측정 → 실패 1개
Iteration 2: 실패 1개 → 서브에이전트 분배 → 재측정 → 실패 0개
  ↓
완료
```

**검증 명령어 예시**: `npm test`, `pytest`, `./gradlew test`
**성공 조건**: 테스트 실패 0개

---

### 시나리오 B: 새 기능 구현 후 오류 수정

**상황**: 새 기능을 구현했는데 빌드 에러, 타입 에러, 린트 에러가 남아있음.

```
사용자: "검색 기능 추가해줘"
  ↓
RPDCA: research → plan → executing-plans → 구현 완료
  ↓
error-simulation / verification → 빌드 에러 5개, 린트 에러 3개 발견
  ↓
⚡ ralph-loop 자동 진입
  ↓
Iteration 1: 에러 8개 → 유형별 그룹핑 → 서브에이전트 분배 → 에러 2개
Iteration 2: 에러 2개 → 서브에이전트 분배 → 에러 0개
  ↓
verification 재실행 → 통과 → 완료
```

**검증 명령어 예시**: `npm run build && npm run lint && npm test`
**성공 조건**: 에러 + 경고 0개

---

### 시나리오 C: 타입/린트 일괄 수정

**상황**: 프로젝트에 TypeScript strict 모드를 켰더니 타입 에러가 수십 개 발생.

```
사용자: "TypeScript strict 모드 켜줘" 또는 "린트 에러 전부 고쳐줘"
  ↓
auto-detect → ralph-loop 적합 판단 (완료 기준 명확 + 반복 개선형)
  ↓
간소 plan.md 자동 생성 (목표 + 검증 명령어 + 성공 조건만)
  ↓
⚡ ralph-loop 진입
  ↓
초기 측정: tsc --noEmit → 에러 47개
Iteration 1: 47개 → 파일별 그룹핑 → 서브에이전트 3명 분배 → 12개
Iteration 2: 12개 → 서브에이전트 2명 분배 → 3개
Iteration 3: 3개 → 서브에이전트 1명 분배 → 0개
  ↓
완료
```

**검증 명령어 예시**: `npx tsc --noEmit`, `npx eslint . --format json`
**성공 조건**: 에러 0개

**문서 계약 예외**: 시나리오 C는 research.md, plan-review.md 없이 진입 가능.
단, 추적성을 위해 **간소 plan.md** (목표 + 검증 명령어 + 성공 조건, 10줄 이내)를 자동 생성한다.
완전 무문서 진입은 허용하지 않는다.

---

## 4. 요구사항 목록

### 필수 요구사항

- [x] **R-1**: auto-detect에 ralph-loop 라우팅 경로 추가
- [x] **R-2**: smart-pdca에 ralph-loop 경로 추가 (S/M/L 위에 얹히는 실행 플래그)
- [x] **R-3**: executing-plans에 ralph-loop 분기 추가
- [x] **R-4**: systematic-debugging에서 ralph-loop 연동 (시나리오 A)
- [x] **R-5**: team-orchestration의 ralph-loop 절차를 구체화 (검증 명령어 정의 방법, 실패 항목 파싱 방법)
- [x] **R-6**: verification에서 ralph-loop 자동 진입 조건 추가 (시나리오 B)
- [x] **R-7**: writing-plans에서 plan.md 작성을 서브에이전트(doc-writer)에 위임하여 메인 컨텍스트 절약
- [x] **R-8**: research에서 research.md 작성을 서브에이전트(code-analyzer)에 위임하여 메인 컨텍스트 절약

### 선택 요구사항

- [ ] **O-1**: error-simulation에서 ralph-loop 연동 (시뮬레이션에서 발견된 문제를 ralph-loop으로 해결)
- [ ] **O-2**: ralph-loop 전용 세션 파일 저장 (iteration 상태를 session-context에 기록)

---

## 5. 범위

### 포함 (이번에 한다)

- 8개 스킬 파일 수정 (auto-detect, smart-pdca, executing-plans, systematic-debugging, team-orchestration, verification, writing-plans, research)
- 2개 에이전트 파일 수정 (doc-writer — plan 작성 위임, code-analyzer — research 작성 위임)
- lib/team/ 코드: 1차는 스킬 레벨에서 처리. 실패 항목 파싱/그룹핑이 스킬 문서만으로 유지 어려우면 2차로 lib/team 확장 검토
- agents/cto-lead.md 변경 없음 (이미 충분함)

### 제외 (이번에는 하지 않는다)

- 새로운 스킬/에이전트 파일 생성 (기존 파일 수정으로 충분)
- UI/프론트엔드 작업 (스킬 파일은 마크다운이므로 해당 없음)
- brainstorming의 서브에이전트 위임 (대화형이라 위임 불가)

---

## 6. 상세 구현 계획

### Step 1: auto-detect — ralph-loop 라우팅 추가

**파일**: `skills/auto-detect/SKILL.md`
**요구사항**: R-1

**수정 대상 섹션** (auto-detect 내):
- "Ralph Loop 제안" 섹션 → 구체적 라우팅 규칙으로 교체
- "모드별 활성 스킬 맵" 테이블 → ralph-loop 행 추가
- "신뢰도 기반 행동 흐름" → ralph-loop 제안 시점 추가

**수정하지 않는 것**:
- 모드 판별 우선순위 표 (ralph-loop은 모드가 아니라 실행 방식이므로 추가 안 함)
- 기존 모드별 키워드/규칙 (그대로 유지)

**핵심 원칙**: ralph-loop 자체를 새 우선순위 모드로 넣지 않는다.
기존 모드 판별 후 "실행 방식 제안" 레이어에서 처리한다.

**변경 내용**:

1. "Ralph Loop 제안" 섹션을 **구체적인 라우팅 규칙**으로 교체한다.

2. ralph-loop 적합성 판단 기준을 명시한다:

```markdown
## Ralph Loop 판단 + 라우팅

### ralph-loop 적합 조건 (3가지 모두 충족)

1. **완료 기준이 명확**: 검증 명령어가 존재하거나 정의 가능
   - 예: `npm test`, `npx tsc --noEmit`, `./gradlew test`, `pytest`
   - 예: "에러 0개", "테스트 전체 통과", "빌드 성공"
2. **반복 개선형**: 한 번에 전부 고치기 어렵고, 여러 번 수정-확인이 필요
   - 예: 테스트 실패 N개, 타입 에러 N개, 린트 에러 N개
3. **실패 항목이 독립적**: 각 실패를 개별적으로 수정 가능
   - 반례: 에러들이 하나의 근본 원인에서 파생 (이 경우 디버깅이 적합)

### ralph-loop 판단 시점

ralph-loop은 **독립 모드가 아니라 실행 방식**이다.
모드 판별(디버깅/새기능 등)은 기존대로 하되, 아래 시점에서 ralph-loop을 제안한다:

| 시점 | 조건 | 제안 문구 |
|------|------|----------|
| 모드 판별 직후 | 적합 조건 3가지 충족 | "이 작업은 ralph-loop으로 반복 수정하면 효율적입니다. ralph-loop으로 진행할까요?" |
| verification 실패 시 | 실패 항목 2개 이상 | "검증에서 N개 실패가 발견됐습니다. ralph-loop으로 자동 수정할까요?" |
| 사용자가 직접 요청 | "ralph-loop으로 해줘" | 즉시 ralph-loop 모드로 전환 |

### 라우팅

사용자가 ralph-loop을 수락하면:
1. 현재 모드의 스킬 맵에 **team-orchestration**을 추가
2. smart-pdca에 `ralphLoop: true` 플래그를 전달
3. smart-pdca가 크기(S/M/L)와 무관하게 ralph-loop 경로를 실행
```

3. 모드별 활성 스킬 맵에 ralph-loop 행을 추가한다:

```markdown
| ralph-loop (모든 모드에서 활성화 가능) | team-orchestration, verification | smart-pdca, iron-law |
```

---

### Step 2: smart-pdca — ralph-loop 경로 추가

**파일**: `skills/smart-pdca/SKILL.md`
**요구사항**: R-2

**변경 내용**:

1. "핵심 계약: RPDCA 상태머신"에 ralph-loop 경로를 추가한다:

```markdown
상태: [research | plan | do | check | act]

S: 바로 실행 → verification
M: research → writing-plans → plan-critic(2회) → 사용자 확인 → executing-plans → verification
L: research → brainstorming → writing-plans → plan-critic(3회) → 사용자 확인 → executing-plans → 리뷰 파이프라인 → verification

ralph-loop 진입 시 (크기 무관):
  → 검증 명령어 확정 → 초기 측정 → iteration 루프 (team-orchestration ralph-loop 모드) → verification
```

2. "RPDCA 단계별 행동"의 Do 섹션에 ralph-loop 행을 추가한다:

```markdown
### Do (실행)

| 크기 | 행동 |
|------|------|
| S | 메인 에이전트 직접 실행 |
| M | team-orchestration 경량 → 서브에이전트 2~3개 병렬 |
| L | team-orchestration 정규 → CTO 팀 구성 후 다수 서브에이전트 병렬 실행 |
| ralph-loop | team-orchestration ralph-loop 모드 → 반복 수정 루프 |
```

3. ralph-loop 전용 섹션을 추가한다:

```markdown
## ralph-loop 모드

ralph-loop은 S/M/L과 **직교하는 실행 방식**이다.
크기 판별은 기존대로 하되, ralph-loop 플래그가 켜지면 Do 단계에서 반복 루프를 실행한다.

### ralph-loop 진입 조건

| 진입 경로 | 설명 |
|----------|------|
| auto-detect 제안 → 사용자 수락 | 작업 시작 시점에 ralph-loop 적합 판단 |
| verification 실패 → 자동 제안 | 실행 후 검증에서 실패 항목 2개+ 발견 |
| systematic-debugging → 잔여 실패 | 디버깅 후 관련 테스트가 여전히 실패 |
| 사용자 직접 요청 | "ralph-loop으로 해줘", "반복 수정해줘" |

### ralph-loop 실행 흐름

1. **검증 명령어 확정**
   - 프로젝트 기술 스택에서 자동 감지 (package.json → npm test, build.gradle → ./gradlew test 등)
   - 사용자에게 확인: "검증 명령어: `npm test` — 맞나요?"
   - 성공 조건 정의: "실패 0개" 또는 "exit code 0"

2. **초기 측정**
   - 검증 명령어 실행 → 실패 항목 수집
   - 실패 항목을 파싱하여 구조화 (파일명, 라인, 에러 유형)

3. **team-orchestration ralph-loop 모드 호출**
   - 실패 항목 목록 + 검증 명령어 + 성공 조건 전달
   - 이후는 team-orchestration이 iteration 루프를 관리

4. **iteration 루프 완료 후**
   - 성공 → verification 재실행 → 완료 선언
   - 중단 (진전 없음) → 사용자에게 남은 실패 항목 보고 + 수동 처리 안내
```

---

### Step 3: executing-plans — ralph-loop 분기 추가

**파일**: `skills/executing-plans/SKILL.md`
**요구사항**: R-3

**변경 내용**:

1. "실행 방식별 동작" 섹션에 ralph-loop 항목을 추가한다:

```markdown
### ralph-loop 모드: 반복 수정 루프

smart-pdca에서 ralphLoop 플래그가 전달되었을 때 실행된다.
기존 S/M/L 실행이 완료된 후에도, verification 실패 시 ralph-loop으로 전환 가능하다.

**실행 절차:**

1. 검증 명령어와 성공 조건을 확인한다
2. team-orchestration 스킬을 **ralph-loop 모드**로 호출한다
3. iteration 루프가 완료되면 verification을 재실행한다

**기존 실행과의 관계:**

- S/M/L 실행 후 → verification 실패 → ralph-loop 전환 가능
- 처음부터 ralph-loop으로 시작 가능 (시나리오 C: 일괄 수정, 간소 plan.md 자동 생성)

**ralph-loop 완료 후 리뷰 파이프라인:**

ralph-loop은 "에러 0개"를 만드는 보조 루프이며, 계획 대비 누락 검사와는 역할이 다르다.
시나리오별로 후속 검증 범위가 달라진다:

| 시나리오 | ralph-loop 완료 후 | 이유 |
|---------|-------------------|------|
| A. 디버깅 후 | verification만 재실행 | 기존 기능 수정이라 누락 검사 불필요 |
| B. 새 기능 후 | verification + gap-detector 재실행 | 계획한 기능이 빠졌는지 확인 필요 |
| C. 일괄 수정 | verification만 재실행 | 계획서 자체가 간소하므로 gap-detector 불필요 |
| L 크기 작업 | 기존 리뷰 파이프라인 전체 유지 | 대형 작업은 품질 회귀 위험이 높음 |
```

2. 연동 흐름도를 업데이트한다:

```
executing-plans (현재 스킬: 계획 실행)
    │
    ├── S → 메인 에이전트 직접 실행
    ├── M → team-orchestration (경량 모드) → 서브에이전트 2~3개
    ├── L → team-orchestration (정규 모드) → CTO + 다수 에이전트
    │         │
    │         ▼
    │    리뷰 파이프라인
    │
    └── ralph-loop → team-orchestration (ralph-loop 모드) → iteration 루프
              │
              ▼
         verification 재실행

    ※ S/M/L 실행 후 verification 실패 시:
    executing-plans → verification 실패 → ralph-loop 제안 → team-orchestration (ralph-loop 모드)
```

---

### Step 4: systematic-debugging — ralph-loop 연동 (시나리오 A)

**파일**: `skills/systematic-debugging/SKILL.md`
**요구사항**: R-4

**변경 내용**:

1. 4단계(수정 + 정리 + 검증) 다음에 **ralph-loop 전환 조건**을 추가한다:

```markdown
### 4단계 이후: ralph-loop 자동 전환

verification 결과 아래 조건에 해당하면 ralph-loop 전환을 제안한다:

| 조건 | 행동 |
|------|------|
| 테스트 실패 0개 | 완료 (ralph-loop 불필요) |
| 테스트 실패 1개 | 직접 수정 후 재검증 (ralph-loop 불필요) |
| 테스트 실패 2개 이상 | ralph-loop 제안: "관련 테스트 N개가 실패합니다. ralph-loop으로 자동 수정할까요?" |
| 수정이 다른 테스트를 깨뜨림 | ralph-loop 강력 제안: "수정이 기존 테스트 N개를 깨뜨렸습니다. ralph-loop이 효율적입니다." |

**ralph-loop 전환 시:**
- 검증 명령어: 해당 테스트 스위트 명령어 (예: `npm test`, `pytest tests/`)
- 성공 조건: 실패 0개
- smart-pdca에 `ralphLoop: true` 전달 → executing-plans → team-orchestration ralph-loop 모드
```

2. RPDCA 디버깅 연동 섹션의 크기별 적용에 ralph-loop 행을 추가한다:

```markdown
| 크기 | 디버깅 워크플로우 |
|------|----------------|
| S | 바로 수정 → 확인 (기존 4단계 그대로) |
| M | research → plan → 수정 → 검증 → **실패 시 ralph-loop 제안** |
| L | research → plan → plan-critic → 수정 → 검증 → **실패 시 ralph-loop 제안** |
```

---

### Step 5: team-orchestration — ralph-loop 절차 구체화

**파일**: `skills/team-orchestration/SKILL.md`
**요구사항**: R-5

**변경 내용**:

기존 "ralph-loop 모드 실행 절차" 섹션을 아래 내용으로 교체한다:

```markdown
## ralph-loop 모드 실행 절차 (반복 팀)

완료 기준이 명확한 반복 작업을 서브에이전트 팀으로 병렬 처리한다.
메인은 iteration 관리만 담당하고, 코드 수정은 서브에이전트가 수행한다.

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
  "testName": "should return JWT token" // 테스트 실패인 경우
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

### 안전장치

- 최대 반복: `config.ralphLoop.maxIterations` (기본 5회)
- 최대 팀원: `config.ralphLoop.maxTeammates` (기본 3명)
- 진전 임계: `config.ralphLoop.progressThreshold` (기본 0 = 1개라도 줄어야 진전)
- 타임아웃: `config.ralphLoop.taskTimeoutMs` (기본 300초)
- **회귀 즉시 중단**: 실패 수가 이전보다 증가하면 즉시 중단하고 변경 사항을 보고
```

---

### Step 6: verification — ralph-loop 자동 진입 조건 추가 (시나리오 B)

**파일**: `skills/verification/SKILL.md`
**요구사항**: R-6

**변경 내용**:

"검증 실패 시" 섹션을 확장한다:

```markdown
## 검증 실패 시

달성률 90% 미만이거나 테스트 실패가 있으면:

### 기존 동작 (실패 1개 또는 즉시 수정 가능)
1. "검증 실패: [이유]" 알림
2. 미달 항목 목록 제시
3. 수정 후 재검증
4. 재검증 통과 시 완료 선언

### ralph-loop 제안 (실패 2개 이상)
실패 항목이 2개 이상이고 독립적으로 수정 가능한 경우:

1. "검증에서 N개 항목이 실패했습니다."
2. "ralph-loop으로 자동 반복 수정할까요?"
   - **수락**: smart-pdca에 `ralphLoop: true` 전달 → executing-plans → team-orchestration ralph-loop 모드
   - **거부**: 기존대로 수동 수정 → 재검증 반복

### ralph-loop 제안 조건

| 조건 | ralph-loop 제안 | 이유 |
|------|----------------|------|
| 실패 1개 | 제안 안 함 | 직접 고치는 게 빠름 |
| 실패 2~4개, 독립적 | 제안 | 병렬 수정 효율적 |
| 실패 5개 이상 | 강력 제안 | 수동 반복은 비효율적 |
| 실패들이 하나의 근본 원인 | 제안 안 함 | 근본 원인 1개만 고치면 해결됨 (디버깅이 적합) |
```

---

### Step 7: writing-plans — plan.md 작성을 서브에이전트에 위임

**파일**: `skills/writing-plans/SKILL.md`, `agents/doc-writer.md`
**요구사항**: R-7

**현재 문제**:

```
현재 흐름:
메인 세션에서:
  1. research.md 읽기 (수백 줄 → 컨텍스트 소비)
  2. plan 내용 구상 (사고 과정 → 컨텍스트 소비)
  3. plan.md를 Write 도구로 작성 (수백~수천 줄 → 컨텍스트 소비)
  4. plan-critic 결과 반영 (수정 내용 → 컨텍스트 소비)

→ plan 작성만으로 메인 컨텍스트의 상당 부분이 소진됨
→ 이후 executing-plans에서 컨텍스트가 부족해지는 문제 발생
```

**개선 흐름**:

```
개선 흐름:
메인 세션에서:
  1. 핵심 요구사항 정리 (짧게, 10~20줄)
  2. research.md 경로 + 핵심 요약만 추출 (짧게)
  3. doc-writer 서브에이전트 스폰 (background)
     → 서브에이전트가 research.md 읽기 + plan.md 작성
  4. 결과 수신: 파일 경로 + Step 목록 요약만 (짧게)

→ 메인에는 지시서 + 결과 요약만 남음 (수십 줄)
→ plan.md의 수백~수천 줄은 서브에이전트 컨텍스트에서만 존재
```

**변경 내용**:

#### A. `skills/writing-plans/SKILL.md` 수정

"역할" 섹션 바로 뒤에 **서브에이전트 위임 절차** 섹션을 추가한다:

```markdown
## 서브에이전트 위임 (컨텍스트 절약)

plan.md 작성은 메인 세션에서 직접 하지 않는다.
doc-writer 서브에이전트에 위임하여 메인 컨텍스트를 보존한다.

### 위임 절차

1. **지시서 준비** (메인에서 수행, 짧게):
   - 기능명, 목표, 기술 스택, 성공 기준
   - research.md 경로 (서브에이전트가 직접 읽음)
   - 작업 크기 (S/M/L)
   - 특수 지시 (사용자가 강조한 사항, 제외 범위 등)

2. **doc-writer 서브에이전트 스폰**:

   ```
   Agent({
     subagent_type: "vibecraft:doc-writer",
     prompt: <지시서>,      // 아래 형식 참고
     run_in_background: true,
     isolation: "worktree"
   })
   ```

3. **결과 수신** (메인에 들어오는 것):
   - plan.md 저장 경로
   - Step 목록 요약 (번호 + 제목 + 예상 시간, 1줄씩)
   - 총 Step 수, 총 예상 시간
   - 영향 파일 목록

4. **plan-critic 리뷰**:
   - 기존대로 plan-critic 에이전트를 스폰하여 plan.md를 리뷰
   - plan-critic도 서브에이전트이므로 메인 컨텍스트 소비 없음

5. **사용자 확인**:
   - 메인이 Step 목록 요약 + plan-review.md 변경 요약만 보여줌
   - 사용자가 상세 내용을 보고 싶으면 → plan.md 경로 안내 ("에디터에서 열어보세요")

### plan 작성 지시서 형식

doc-writer에 전달하는 프롬프트:

```
## plan.md 작성 지시서

### 기본 정보
- 기능명: {기능명}
- 저장 경로: docs/plans/{feature}/plan.md
- 작업 크기: {S/M/L}

### 목표
{한 문장으로 이 기능이 뭘 하는지}

### 성공 기준
{검증 가능한 조건 목록}

### 기술 스택
{프로젝트의 핵심 기술}

### 참조 문서
- research.md: docs/plans/{feature}/research.md (이 파일을 읽고 기반으로 작성할 것)
- 기존 코드 패턴: {참고할 파일 경로}

### 특수 지시
{사용자가 강조한 사항, 제외 범위, 제약 조건}

### 작성 규칙
- writing-plans 스킬의 "핵심 작성 원칙" 5가지를 따른다
- TDD 순서(테스트 → 실패 확인 → 구현 → 통과 확인 → 커밋)를 준수한다
- 각 Step은 2~5분 완료 가능한 크기로 분해한다
- 코드 블록에 생략(...) 없이 전체 코드를 작성한다
- templates/plan.md 형식을 참고하되, Step 구조는 writing-plans 스킬의 형식을 따른다
```

### 위임하지 않는 경우

| 상황 | 이유 |
|------|------|
| S 크기 | plan.md를 안 만들거나 아주 짧음 (Step 1~3개). 메인에서 직접 써도 컨텍스트 부담 없음 |
| 사용자가 "여기서 바로 써줘" 요청 | 사용자 선호 존중 |

**크기별 위임 규칙:**

| 크기 | plan 작성 방식 |
|------|--------------|
| S | 메인에서 직접 (기존과 동일) |
| M | doc-writer 서브에이전트 위임 |
| L | doc-writer 서브에이전트 위임 |
```

#### B. `agents/doc-writer.md` 수정

doc-writer의 역할에 **plan.md 작성 전문 모드**를 추가한다:

```markdown
## plan.md 작성 모드

writing-plans 스킬에서 호출될 때 활성화된다.
research.md를 직접 읽고, writing-plans 스킬의 형식과 원칙에 따라 plan.md를 작성한다.

### 입력
- 지시서 (기능명, 목표, 기술 스택, 성공 기준, research.md 경로)

### 출력
- docs/plans/{feature}/plan.md 파일 생성
- Step 목록 요약을 메인에 반환 (번호 + 제목 + 예상 시간)

### 작성 절차
1. research.md를 읽는다
2. 영향 파일 목록을 정리한다
3. Step을 2~5분 단위로 분해한다
4. 각 Step에 TDD 순서(테스트 → 구현 → 검증 → 커밋)를 적용한다
5. plan.md를 저장한다
6. Step 목록 요약을 반환한다

### 품질 체크리스트 (작성 완료 전 자체 점검)
- [ ] 모든 파일 경로가 프로젝트 루트 기준으로 표기되어 있는가?
- [ ] 각 Step의 코드 블록에 생략이 없는가?
- [ ] 각 Step이 2~5분 이내 완료 가능한 크기인가?
- [ ] TDD 순서를 따르고 있는가?
```

---

### Step 8: research — research.md 작성을 서브에이전트에 위임

**파일**: `skills/research/SKILL.md`, `agents/code-analyzer.md`
**요구사항**: R-8

**현재 문제**:

research 스킬은 코드베이스의 파일을 수십 개 읽고 research.md를 작성한다.
이 과정이 메인 컨텍스트를 가장 많이 소비하는 단계 중 하나다.

```
현재 흐름:
메인: 파일 20~50개 읽기 + 패턴 분석 + research.md 전체 작성
      ──────── 읽은 파일 내용이 전부 메인 컨텍스트에 쌓임 ────────
```

**개선 흐름**:

```
개선 흐름:
메인: 리서치 지시서 작성 (기능명 + 대상 범위 + 기술 스택, 10줄)
  ↓
code-analyzer 서브에이전트 스폰 (background)
  → 서브에이전트가 파일 읽기 + 패턴 분석 + research.md 작성
  ↓
메인: 결과 요약 수신
  - Part 1 비즈니스 관점 요약 (사용자에게 보여줄 내용)
  - 관련 파일 수 + 핵심 발견 + 결정 필요 사항
  ↓
메인이 사용자에게 Part 1 보여줌 → 확인 → 다음 단계
```

**변경 내용**:

#### A. `skills/research/SKILL.md` 수정

"역할" 섹션 뒤에 **서브에이전트 위임 절차** 섹션을 추가한다:

```markdown
## 서브에이전트 위임 (컨텍스트 절약)

M/L 크기의 research는 메인 세션에서 직접 하지 않는다.
code-analyzer 서브에이전트에 위임하여 메인 컨텍스트를 보존한다.

### 위임 절차

1. **지시서 준비** (메인에서 수행, 짧게):
   - 기능명, 작업 목표
   - 탐색 대상 범위 (디렉토리, 파일 패턴)
   - 기술 스택 (이미 알고 있는 것)
   - 특별히 확인해야 할 것 (사용자가 언급한 파일, 제약 조건)

2. **code-analyzer 서브에이전트 스폰**:

   ```
   Agent({
     subagent_type: "vibecraft:code-analyzer",
     prompt: <리서치 지시서>,
     run_in_background: true
   })
   ```

3. **결과 수신** (메인에 들어오는 것):
   - research.md 저장 경로
   - Part 1 비즈니스 관점 전문 (사용자에게 바로 보여줄 수 있게)
   - 관련 파일 수, 핵심 패턴, 결정 필요 사항 요약

4. **사용자 확인** (L 크기만):
   - Part 1을 사용자에게 보여주고 확인받음
   - 상세 기술 내용은 "research.md를 에디터에서 확인하세요" 안내

### 위임하지 않는 경우

| 상황 | 이유 |
|------|------|
| S 크기 | research 자체를 스킵 |
| 파일 5개 이하의 소규모 조사 | 메인에서 직접 읽는 게 빠름 |

### 크기별 위임 규칙

| 크기 | research 방식 |
|------|-------------|
| S | 스킵 |
| M | code-analyzer 서브에이전트 위임 |
| L | code-analyzer 서브에이전트 위임 |
```

#### B. `agents/code-analyzer.md` 수정

code-analyzer의 역할에 **research.md 작성 모드**를 추가한다:

```markdown
## research.md 작성 모드

research 스킬에서 호출될 때 활성화된다.
코드베이스를 깊이 읽고, research 스킬의 형식에 따라 research.md를 작성한다.

### 입력
- 리서치 지시서 (기능명, 대상 범위, 기술 스택, 확인 사항)

### 출력
- docs/plans/{feature}/research.md 파일 생성
- Part 1 비즈니스 관점 전문 + 핵심 발견 요약을 메인에 반환

### 작성 절차
1. 프로젝트 설정 파일 확인 (package.json, build.gradle 등)
2. 지시서의 대상 범위 내 파일을 깊이 읽는다
3. 기존 패턴(에러 처리, DB 접근, API 구조) 파악
4. 영향 범위 추적
5. research.md를 Part 1 + Part 2 구조로 작성
6. Part 1 전문 + 핵심 요약을 메인에 반환
```

---

## 7. 실행 순서

```
Wave 1: Step 5 (team-orchestration 구체화) + Step 7 (writing-plans 위임) + Step 8 (research 위임) — 전부 독립, 병렬 가능
  ↓
Wave 2: Step 2 (smart-pdca ralph-loop 경로) — Step 5에 의존
  ↓
Wave 3: Step 1 (auto-detect 라우팅) + Step 3 (executing-plans 분기) — 병렬 가능
  ↓
Wave 4: Step 4 (systematic-debugging 연동) + Step 6 (verification 자동 진입) — 병렬 가능
```

**의존성 그래프:**
- Step 5 → Step 2 (team-orchestration 절차가 확정돼야 smart-pdca가 참조 가능)
- Step 2 → Step 1, 3 (smart-pdca 경로가 확정돼야 auto-detect와 executing-plans가 참조 가능)
- Step 1, 3 → Step 4, 6 (상위 라우팅이 확정돼야 하위 연동이 의미 있음)
- Step 7, 8은 독립적 (다른 Step과 의존 관계 없음, Wave 1에서 병렬 실행 가능)

---

## 8. 위험 요소

| 위험 요소 | 발생 가능성 | 영향도 | 대응 방안 |
|----------|-----------|--------|---------|
| 검증 명령어 출력 파싱 실패 | 높음 | 중간 | AI가 수동으로 실패 항목 구조화하는 폴백 |
| 서브에이전트가 범위 밖 파일 수정 | 중간 | 높음 | 프롬프트에 "범위 밖 수정 금지" 명시 + worktree 격리 |
| 무한 루프 (진전 없이 반복) | 낮음 | 높음 | config.ralphLoop.maxIterations + 진전 없음 즉시 중단 |
| 서브에이전트 간 수정 충돌 | 중간 | 중간 | 파일별 그룹핑으로 같은 파일을 다른 에이전트가 수정하지 않도록 |
| 토큰 비용 과다 | 중간 | 중간 | iteration별 보고서에 누적 비용 표시, 사용자에게 계속 여부 확인 |
| doc-writer가 writing-plans 형식을 안 따름 | 중간 | 중간 | 지시서에 형식 규칙을 명시 + 품질 체크리스트로 자체 점검 |
| 서브에이전트가 research.md를 못 읽음 | 낮음 | 높음 | 절대 경로로 전달 + worktree에서 접근 가능한 경로 확인 |
| plan 수정 시 메인-서브 간 왕복 비효율 | 중간 | 낮음 | 소규모 수정은 메인에서 직접 Edit, 대규모 재작성만 서브에이전트 재호출 |

---

## 9. 스킬 간 연동 흐름도 (최종)

### A. ralph-loop 흐름

```
사용자 요청
    │
    ▼
auto-detect (모드 판별 + ralph-loop 적합 판단)
    │
    ├── ralph-loop 적합 → 사용자에게 제안
    │     │
    │     ├── 수락 → smart-pdca (ralphLoop: true)
    │     │           │
    │     │           ▼
    │     │     검증 명령어 확정 → 초기 측정
    │     │           │
    │     │           ▼
    │     │     executing-plans (ralph-loop 분기)
    │     │           │
    │     │           ▼
    │     │     team-orchestration (ralph-loop 모드)
    │     │           │
    │     │           ▼
    │     │     iteration 루프 (측정 → 분배 → 수정 → 재측정)
    │     │           │
    │     │           ├── 성공 (실패 0개) → verification → 완료
    │     │           └── 중단 (진전 없음) → 사용자 보고
    │     │
    │     └── 거부 → 기존 S/M/L 워크플로우
    │
    └── ralph-loop 부적합 → 기존 워크플로우
              │
              ▼
        ... 기존 RPDCA 진행 ...
              │
              ▼
        verification 실패 시 (실패 2개+)
              │
              ▼
        ralph-loop 제안 (2차 진입점)
              │
              ├── 수락 → team-orchestration ralph-loop 모드
              └── 거부 → 수동 수정 반복
```

### B. RPDCA 서브에이전트 위임 흐름 (R + P 단계)

```
기존 (컨텍스트 과다 소비):
메인: 파일 50개 읽기 ──→ research.md 작성 ──→ plan 구상 ──→ plan.md 전체 작성 ──→ plan-critic ──→ 수정
      [수천 줄]            [수백 줄]           [사고 과정]    [수백~수천 줄]
      ────────────────── 모두 메인 컨텍스트에 쌓임 ──────────────────

개선 (서브에이전트 위임):
메인: 리서치 지시서 (10줄) ──→ code-analyzer 스폰 (background)
                                    │
                              서브에이전트:
                              파일 읽기 → 패턴 분석 → research.md 작성
                                    │
메인: Part 1 요약 수신 (20줄) ──→ 사용자 확인 (L만)
                                    │
메인: plan 지시서 (20줄) ──→ doc-writer 스폰 (background)
                                    │
                              서브에이전트:
                              research.md 읽기 → plan.md 작성
                                    │
메인: Step 목록 요약 (20줄) ──→ plan-critic 스폰 (background)
                                    │
                              서브에이전트:
                              plan.md 리뷰 → plan-review.md 생성
                                    │
메인: 변경 요약 (10줄) ──→ 사용자에게 보여줌 ──→ 승인 ──→ executing-plans
      ──── 메인 컨텍스트에는 지시서 + 요약만 (총 ~80줄) ────
```

### C. RPDCA 단계별 서브에이전트 현황 (개선 후)

| 단계 | 스킬 | 실행 위치 | 비고 |
|------|------|----------|------|
| R (Research) | research | **서브에이전트** (code-analyzer) | M/L만. S는 스킵 |
| P (Brainstorm) | brainstorming | **메인** | 대화형이라 위임 불가 |
| P (Plan) | writing-plans | **서브에이전트** (doc-writer) | M/L만. S는 메인에서 직접 |
| P (Review) | plan-critic | **서브에이전트** | 기존대로 |
| D (Do) | executing-plans | **서브에이전트** (M/L) | 기존대로 |
| D (Loop) | ralph-loop | **서브에이전트** (team-orchestration) | 이번에 배선 연결 |
| C (Check) | verification | **메인** | 짧은 체크리스트, 위임 불필요 |
| A (Act) | 수정 재검증 | **메인** | 짧은 수정, 위임 불필요 |

---

## 10. 검증 방법

구현 완료 후, 아래 시나리오를 실제로 테스트한다:

### 테스트 1: 사용자가 직접 요청
```
입력: "타입 에러 전부 고쳐줘, ralph-loop으로 해줘"
기대: auto-detect → smart-pdca(ralphLoop:true) → 검증 명령어 확정 → iteration 루프 실행
```

### 테스트 2: 디버깅 후 자동 전환
```
입력: "로그인이 안 돼"
기대: systematic-debugging → 수정 → verification 실패(테스트 3개) → ralph-loop 제안
```

### 테스트 3: 새 기능 후 자동 전환
```
입력: "검색 기능 추가해줘"
기대: new-feature → RPDCA → executing-plans → verification 실패 → ralph-loop 제안
```

---

## 승인

| 항목 | 내용 |
|------|------|
| 계획 확정일 | 2026-03-18 |
| 구현 완료일 | 2026-03-18 |
| 수정 대상 스킬 | 8개 (auto-detect, smart-pdca, executing-plans, systematic-debugging, team-orchestration, verification, writing-plans, research) |
| 수정 대상 에이전트 | 2개 (doc-writer, code-analyzer) |
| 신규 파일 | 0개 |
| lib/team/ 코드 변경 | 1차 무수정, 필요 시 2차 확장 |
| 다음 단계 | 사용자 승인 후 Wave 1(Step 5 + Step 7 + Step 8)부터 실행 |
