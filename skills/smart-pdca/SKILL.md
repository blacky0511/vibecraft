---
name: smart-pdca
description: |
  작업 크기를 자동 판단하여 RPDCA 방법론의 강도를 조절하는 스킬.
  S/M/L 3단계로 분류하고, 각 크기에 맞는 워크플로우를 실행한다.

  auto-detect 스킬이 모드를 판별한 후 이 스킬이 호출된다.
  research, brainstorming, writing-plans, executing-plans 스킬과 연동하여 전체 흐름을 제어한다.

  Triggers: 작업 시작, 기능 구현, 프로젝트 생성, RPDCA, PDCA, 계획, 크기 판단
---

# 스마트 RPDCA

## 역할

사용자의 요청 내용과 현재 코드베이스를 분석하여 작업 크기를 S/M/L 중 하나로 판별하고,
각 크기에 맞는 RPDCA(Research-Plan-Do-Check-Act) 강도로 워크플로우를 실행한다.

---

## 핵심 계약: RPDCA 상태머신

모든 스킬이 이 계약을 기준으로 동작한다.

```
상태: [research | plan | do | check | act]

S: 바로 실행 → verification

M: research → writing-plans → plan-critic(2회) → 사용자 확인 → executing-plans → verification
   (research.md)  (plan.md)    (plan-review.md)                  (plan.md 읽음)

L: research → brainstorming → writing-plans → plan-critic(3회) → 사용자 확인 → executing-plans → 리뷰 파이프라인 → verification

ralph-loop 진입 시 (크기 무관, S/M/L 위에 얹히는 실행 플래그):
  → 검증 명령어 확정 → 초기 측정 → iteration 루프 (team-orchestration ralph-loop 모드) → verification
시나리오 C (일괄 수정형, research/plan 없이 직접 진입):
  → 간소 plan.md 자동 생성 → 검증 명령어 확정 → 초기 측정 → iteration 루프 → verification
```

---

## 크기 판별 기준

### S (소) — 간단한 작업

**조건**: 파일 1~2개 수정 예상

**해당 요청 예시**:
- "버튼 색상 바꿔줘"
- "오타 수정해줘"
- "환경변수 추가해줘"
- "텍스트 문구 변경해줘"
- 단순 버그 수정 (원인이 명확한 경우)

**워크플로우**:
```
실행 → verification → 완료
```

R, P 단계 스킵

---

### M (중) — 중간 작업

**조건**: 파일 3~5개 수정 예상

**해당 요청 예시**:
- "검색 기능 개선해줘"
- "로그인 폼 유효성 검증 추가해줘"
- "API 응답 형식 변경해줘"
- 기존 기능 확장 또는 중간 규모 리팩토링

**워크플로우**:
```
1. research 스킬 호출 (sonnet) → docs/plans/{feature}/research.md 생성
2. writing-plans 스킬 호출 (opus) → docs/plans/{feature}/plan.md 생성
3. plan-critic 에이전트 2라운드 반복 수정 리뷰 (opus) → plan-review.md + plan.md 업데이트
4. 사용자 확인 1회 (plan-review.md 변경 요약)
5. executing-plans → 실행 (sonnet)
6. code-simplifier → error-simulation 1~2회
7. verification (gap-detector(opus) + Check-Act 자동 루프, 최대 2회)
```

---

### L (대) — 큰 작업

**조건**: 파일 6개 이상 수정 예상 또는 새 프로젝트

**해당 요청 예시**:
- "결제 기능 만들어줘"
- "Todo 앱 만들자"
- "인증 시스템 전체 교체해줘"
- 새 기능 전체 구현, 새 프로젝트 시작, 대규모 리팩토링

**워크플로우**:
```
1. research 스킬 호출 → docs/plans/{feature}/research.md 생성
2. 사용자 확인 1회 (research Part 1 비즈니스 관점)
3. brainstorming → 요구사항 구체화
4. writing-plans → docs/plans/{feature}/plan.md 생성
5. plan-critic 3라운드 반복 수정 리뷰 → plan-review.md + plan.md 업데이트
6. 사용자 확인 1회 (plan-review.md 변경 요약)
7. executing-plans → team-orchestration → 병렬 실행
8. code-simplifier → external-reviewer → error-simulation 최대 3회
9. verification (gap-detector(opus) + Check-Act 자동 루프, 최대 3회)
```

---

## project-kickoff 합류 규칙

project-kickoff(1~4단계) 완료 후 smart-pdca에 합류할 때:

- **크기**: 항상 L (새 프로젝트는 전체 구현)
- **Research**: 스킵 (코드가 없으므로)
- **Brainstorming**: 스킵 (project-kickoff 1단계에서 이미 수행)
- **이후 흐름**: L 워크플로우의 4번(writing-plans)부터 시작

```
project-kickoff 합류 시 L 워크플로우:
4. writing-plans(opus) → docs/plans/{feature}/plan.md 생성
5. plan-critic 3라운드 반복 수정 리뷰
6. 사용자 확인 1회
7. executing-plans → team-orchestration → 병렬 실행
8. code-simplifier → external-reviewer → error-simulation
9. verification (gap-detector(opus) + Check-Act 루프, 최대 3회)
```

---

## 크기 판별 방법

1. 사용자의 요청 내용을 분석한다
2. 현재 프로젝트 코드베이스를 확인한다 (영향 받는 파일 수 추정)
3. S/M/L 중 하나로 분류한다
4. 사용자에게 판단 결과를 알린다:

```
작업 크기 판단: M (중간)
- 예상 수정 파일: 3~4개
- 적용 워크플로우: RPDCA 표준 (research → plan → do → check)
```

---

## RPDCA 단계별 행동

### Research (리서치) — 코드베이스 깊이 파악

| 크기 | 행동 |
|------|------|
| S | 스킵 |
| M | research 스킬 호출 → research.md 생성 (Part 1 간소, Part 2 표준) |
| L | research 스킬 호출 → research.md 생성 (Part 1 상세, Part 2 상세) |

---

### Plan (계획) — 구현 계획 작성

| 크기 | 행동 |
|------|------|
| S | 스킵 |
| M | writing-plans (opus) → plan.md 생성 → plan-critic 2라운드 반복 수정 |
| L | brainstorming → writing-plans (opus) → plan.md → plan-critic 3라운드 반복 수정 |

**plan 초안은 opus로 작성한다.** 초안 품질이 높으면 리뷰 라운드에서 잡아야 할 것이 줄어든다.

**반복 수정 사이클**: 각 라운드가 이전 라운드의 수정본을 기반으로 리뷰하며, 초안 원본을 항상 참조한다.

**정본 규칙**: plan.md 1개가 정본이다. 리뷰 반영 시 plan.md를 직접 업데이트한다. plan-final.md는 만들지 않는다.

---

### Do (실행) — 코드 작성

| 크기 | 행동 |
|------|------|
| S | 메인 에이전트 직접 실행 |
| M | team-orchestration 경량 → 서브에이전트 2~3개 병렬 |
| L | team-orchestration 정규 → CTO 팀 구성 후 다수 서브에이전트 병렬 실행 |
| ralph-loop | team-orchestration ralph-loop 모드 → 반복 수정 루프 (검증 명령어 기반 iteration) |

---

### Do → Check 사이: 오류 시뮬레이션 (error-simulation)

실행 완료 후, 검증 전에 수정된 코드의 잠재 오류를 시뮬레이션한다.
발견된 문제를 수정하고, 새 문제가 없을 때까지 반복한다.

| 크기 | 시뮬레이션 |
|------|-----------|
| S | 스킵 — 단순 수정에 시뮬레이션은 낭비 |
| M | 1~2회 — 파일 간 연결 오류, 엣지 케이스 점검 |
| L | 최대 3회 — 엣지 케이스 + 호환성 + 안정성 전체 점검 |

조기 통과: 시뮬레이션에서 새로운 문제가 발견되지 않으면 즉시 통과.

---

### Check (검증) — plan 대비 달성률 확인

| 크기 | 행동 |
|------|------|
| S | verification 스킬 호출 (증거 기반 검증) |
| M | **gap-detector** (plan.md vs 코드 비교 → Match Rate 계산) |
| L | **gap-detector** (plan.md vs 코드 비교 → Match Rate 계산) |

**M/L 크기**: gap-detector가 plan.md의 각 Step을 검증 항목으로 삼아 Match Rate를 계산한다.

---

### Check-Act 자동 루프 (M/L)

Do 완료 후 gap-detector → 자동 수정 → 재검증을 **자동으로** 반복한다.
사용자가 "실행해"라고 한 뒤에는 DCA 전체가 자동으로 돌아간다.

```
Do 완료
   ↓
gap-detector: plan.md vs 실제 코드 → Match Rate 계산
   ↓
90% 이상? ──→ YES ──→ 완료 보고
   ↓ NO
Gap 목록 생성 (Missing / Changed, 우선순위별 정렬)
   ↓
서브에이전트가 Gap 목록 기반으로 코드 수정
   ↓
gap-detector 재실행 → Match Rate 재계산
   ↓
종료 조건 충족? → YES → 완료 보고
   ↓ NO
다음 반복...
```

#### 종료 조건 (3개 중 하나)

| 조건 | 설명 |
|------|------|
| Match Rate >= 90% | 목표 달성 — 통과 |
| 최대 반복 도달 | M: 2회, L: 3회 |
| 개선 없음 | 이전 회차 대비 Match Rate 향상 없음 → 사용자에게 보고 |

#### 크기별 최대 반복 횟수

| 크기 | 최대 반복 | 이유 |
|------|----------|------|
| S | 없음 | gap-detector 사용 안 함 |
| M | 2회 | 파일 3~5개 수정, 2회면 대부분 해결 |
| L | 3회 | 파일 6개+, 복잡도가 높아 3회까지 허용 |

#### 개선 없음 시 사용자 보고

```
Match Rate가 개선되지 않습니다 (현재: 78%).

남은 Gap:
- Step 3: 인증 미들웨어 — 구조적 문제로 자동 수정 불가
- Step 7: DB 마이그레이션 — 스키마 결정 필요

수동으로 확인이 필요합니다. 어떻게 할까요?
1. 남은 Gap을 직접 수정합니다
2. 현재 상태로 완료 처리합니다 (78%)
3. plan.md를 수정하고 다시 실행합니다
```

---

### Act (개선) — 미달 사항 자동 수정

달성률 90% 미만이면 gap-detector의 Gap 목록을 기반으로 자동 수정한다.

| 크기 | 행동 |
|------|------|
| S | 즉시 수정 후 verification 재실행 |
| M | Gap 목록 → 서브에이전트 수정 → gap-detector 재실행 (최대 2회) |
| L | Gap 목록 → 서브에이전트 수정 → gap-detector 재실행 (최대 3회) |

---

## ralph-loop 실행 방식

ralph-loop은 독립 모드가 아니라, 기존 모드(새 기능/디버깅 등)와
크기(S/M/L) 위에 얹히는 **반복 실행 플래그**이다.
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

### 시나리오 C: 일괄 수정형 직접 진입

"린트 에러 전부 고쳐줘", "타입 에러 다 수정해줘" 같은 요청은
research.md, plan-review.md 없이 ralph-loop에 직접 진입 가능하다.

단, 추적성을 위해 **간소 plan.md** (목표 + 검증 명령어 + 성공 조건, 10줄 이내)를 자동 생성한다.
완전 무문서 진입은 허용하지 않는다.

```
간소 plan.md 예시:
# 타입 에러 일괄 수정

**목표**: TypeScript strict 모드에서 발생하는 모든 타입 에러를 수정한다
**검증 명령어**: `npx tsc --noEmit`
**성공 조건**: 에러 0개
**실행 방식**: ralph-loop
```

---

## 사용자 확인 시점

| 크기 | 확인 횟수 | 확인 시점 |
|------|----------|----------|
| S | 0회 | 확인 없이 바로 진행, 완료 시 결과만 보고 |
| M | 1회 | plan-review.md 변경 요약 확인 후 → 실행 전 |
| L | 2회 | research Part 1 비즈니스 관점 확인 1회 + plan-review.md 변경 요약 확인 1회 |

---

## 문서 수명 관리

이 스킬이 산출물 문서의 생성, 아카이브, 폐기를 담당한다.

### 폴더 구조

```
docs/plans/{feature}/                      ← 진행 중
docs/plans/archive/YYYY-MM/{feature}/      ← 완료 (아카이브)
```

### 규칙

- feature 폴더명: kebab-case
- 생성 파일: research.md, plan.md, plan-review.md
- plan-final.md는 만들지 않는다. plan.md 1개가 정본이다.
- 리뷰 결과는 plan-review.md에 기록하고, 확정 내용은 plan.md에 반영한다.

### 작업 완료 시

```
"작업이 완료되었습니다. 산출물을 아카이브할까요?"
→ 승인 시: docs/plans/{feature}/ → docs/plans/archive/YYYY-MM/{feature}/ 로 이동
```

### 작업 폐기 시

```
"이 작업을 취소하시겠습니까?
docs/plans/{feature}/ 폴더의 파일 N개가 삭제됩니다."
→ 승인 시: 폴더 전체 삭제
```

---

## 연동 스킬 흐름

### 새 기능 / 프로젝트

```
auto-detect
    │
    ▼
smart-pdca (크기 판별 + RPDCA 제어)
    │
    ├── S → 바로 실행 → verification
    │
    ├── M → research(sonnet) → writing-plans(opus) → plan-critic(opus, 2라운드 반복 수정)
    │       → 사용자 확인 → executing-plans(sonnet)
    │       → code-simplifier → error-simulation
    │       → verification(gap-detector(opus) + Check-Act 루프, 최대 2회)
    │
    └── L → research(sonnet) → brainstorming → writing-plans(opus)
            → plan-critic(opus, 3라운드 반복 수정) → 사용자 확인
            → team-orchestration → executing-plans(sonnet)
            → code-simplifier → external-reviewer → error-simulation
            → verification(gap-detector(opus) + Check-Act 루프, 최대 3회)
```

### 디버깅

디버깅 모드에서는 systematic-debugging 스킬의 RPDCA 매핑을 따른다.
smart-pdca는 크기 판별만 수행하고, 이후 흐름은 systematic-debugging이 제어한다.

```
auto-detect → systematic-debugging
    │
    ├── S → Phase 1(1→2간소화→3→게이트) → Phase 2(4→5) → verification(체크리스트)
    │
    ├── M → research(sonnet) → Phase 1(opus, 1→2→3→게이트)
    │       → Phase 1.5(fix-plan+영향분석) → Phase 2(4→5→6 영향 대조)
    │       → verification(체크리스트+영향 대조)
    │
    └── L → research(sonnet) → Phase 1(opus, 1→2→3→게이트)
            → Phase 1.5(fix-plan+영향분석, 🔴시 사용자 확인)
            → Phase 2(4→5→6 영향 대조) → error-simulation
            → verification(체크리스트+영향 대조) + 회귀 테스트
```

### 각 연동 스킬 역할

| 스킬 | 호출 조건 | 역할 |
|------|----------|------|
| `research` | M, L | 코드베이스 깊이 읽기 → research.md 생성 |
| `brainstorming` | L만 | 요구사항 구체화 (research.md 기반) |
| `writing-plans` | M, L | plan.md 생성 |
| `plan-critic` (에이전트) | M, L | plan.md 반복 수정 리뷰 (M: 2라운드, L: 3라운드, 전 라운드 opus) |
| `executing-plans` | M, L | 서브에이전트 디스패치 및 병렬 실행 관리 |
| `team-orchestration` | M(경량), L(정규) | 팀 구성 — M은 메인이 CTO, L은 전용 에이전트 |
| `error-simulation` | M, L | 실행 후 잠재 오류 시뮬레이션 |
| `gap-detector` (에이전트) | M, L | plan.md 대비 Match Rate 계산 → 90% 미만 시 자동 수정 루프 |
| `verification` | S, M, L | 완료 전 필수 검증 게이트 |

---

## 크기 판별 예시

| 요청 | 판별 크기 | 이유 |
|------|----------|------|
| "버튼 색 파란색으로 바꿔줘" | S | CSS 1파일만 수정 |
| "로그인 에러 메시지 제대로 안 나와" | S | 원인 명확, 1~2파일 수정 |
| "검색 결과에 페이지네이션 추가해줘" | M | UI + API + 상태 관리 3~4파일 |
| "소셜 로그인 추가해줘" | L | OAuth 설정, 백엔드 API, 프론트 UI, DB 마이그레이션 등 6개+ |
| "Todo 앱 만들자" | L | 신규 프로젝트 전체 구현 |

---

## 크기 판별이 애매한 경우

1. 일단 코드베이스를 확인하여 영향 범위를 추정한다
2. 여전히 모호하면 **더 큰 크기로 판별**한다 (안전 우선 원칙)
3. 사용자에게 판별 이유를 설명하고 동의를 구한다:
   ```
   작업 크기를 M으로 판단했습니다.
   이유: 기존 검색 로직이 여러 파일에 분산되어 있어 3~5개 파일 수정이 예상됩니다.
   더 작게(S) 진행하길 원하시면 말씀해 주세요.
   ```
