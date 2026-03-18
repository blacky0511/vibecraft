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
1. research 스킬 호출 → docs/plans/{feature}/research.md 생성
2. writing-plans 스킬 호출 → docs/plans/{feature}/plan.md 생성
3. plan-critic 에이전트 2회 리뷰 → docs/plans/{feature}/plan-review.md 생성 + plan.md 업데이트
4. 사용자 확인 1회 (plan-review.md 변경 요약)
5. executing-plans → 실행
6. error-simulation 1~2회
7. verification
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
5. plan-critic 3회 리뷰 → plan-review.md + plan.md 업데이트
6. 사용자 확인 1회 (plan-review.md 변경 요약)
7. executing-plans → team-orchestration → 병렬 실행
8. error-simulation 최대 3회
9. 리뷰 파이프라인 (code-simplifier → external-reviewer → gap-detector)
10. verification
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
| M | writing-plans → plan.md 생성 → plan-critic 2회 리뷰 |
| L | brainstorming → writing-plans → plan.md → plan-critic 3회 리뷰 |

**정본 규칙**: plan.md 1개가 정본이다. 리뷰 반영 시 plan.md를 직접 업데이트한다. plan-final.md는 만들지 않는다.

---

### Do (실행) — 코드 작성

| 크기 | 행동 |
|------|------|
| S | 메인 에이전트 직접 실행 |
| M | team-orchestration 경량 → 서브에이전트 2~3개 병렬 |
| L | team-orchestration 정규 → CTO 팀 구성 후 다수 서브에이전트 병렬 실행 |

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

### Check (검증) — 설계 대비 달성률 확인

| 크기 | 행동 |
|------|------|
| S | verification 스킬 호출 |
| M | code-simplifier + verification 스킬 호출 |
| L | 리뷰 파이프라인 전체 실행 (code-simplifier → external-reviewer → gap-detector) |

---

### Act (개선) — 미달 사항 수정

달성률 90% 미만이면 완료를 선언하지 않고 Act 단계로 재진입한다.

| 크기 | 행동 |
|------|------|
| S | 즉시 수정 후 재검증 |
| M | 미달 항목 목록화 → 수정 → 재검증 |
| L | 재계획 후 수정 → 리뷰 파이프라인 재실행 → 재검증 |

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

```
auto-detect
    │
    ▼
smart-pdca (크기 판별 + RPDCA 제어)
    │
    ├── S → 바로 실행 → verification
    │
    ├── M → research → writing-plans → plan-critic(2회)
    │       → 사용자 확인 → executing-plans
    │       → error-simulation(1~2회) → verification
    │
    └── L → research → brainstorming → writing-plans
            → plan-critic(3회) → 사용자 확인
            → team-orchestration → executing-plans
            → error-simulation(최대 3회) → review-pipeline → verification
```

### 각 연동 스킬 역할

| 스킬 | 호출 조건 | 역할 |
|------|----------|------|
| `research` | M, L | 코드베이스 깊이 읽기 → research.md 생성 |
| `brainstorming` | L만 | 요구사항 구체화 (research.md 기반) |
| `writing-plans` | M, L | plan.md 생성 |
| `plan-critic` (에이전트) | M, L | plan.md 리뷰 → plan-review.md 생성 + plan.md 업데이트 |
| `executing-plans` | M, L | 서브에이전트 디스패치 및 병렬 실행 관리 |
| `team-orchestration` | M(경량), L(정규) | 팀 구성 — M은 메인이 CTO, L은 전용 에이전트 |
| `error-simulation` | M, L | 실행 후 잠재 오류 시뮬레이션 |
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
