---
name: team-orchestration
description: |
  L 사이즈 대형 작업에서 cto-lead 에이전트가 CTO 팀을 자동 구성하고 병렬 실행을 조율하는 스킬.
  작업 내용을 분석하여 필요한 전문가 에이전트를 선별하고, 각 에이전트에 독립 태스크를 할당한다.
  병렬 실행 후 결과를 취합하여 메인 에이전트에 반환한다.

  Triggers: 팀, team, 병렬, parallel, CTO, team-orchestration
---

# CTO 팀 자동 구성 스킬

## 역할

`executing-plans` 스킬이 L 사이즈 작업으로 판단한 경우 호출된다.
`cto-lead` 에이전트가 계획서를 분석하고, 필요한 전문가 에이전트를 자동 선별하여 팀을 구성한다.
각 에이전트는 독립 태스크를 병렬로 실행하며, 완료 후 결과를 `cto-lead`가 취합한다.

---

## cto-lead의 역할

`cto-lead` 에이전트는 다음 책임을 가진다.

1. **작업 분석**: 계획서 전체를 읽고 레이어별(프론트엔드, 백엔드, DB, 테스트 등) 작업을 분류한다.
2. **팀 선별**: 아래 기준에 따라 필요한 에이전트를 결정한다.
3. **태스크 분배**: 각 에이전트에게 담당 Step 목록과 필요한 컨텍스트를 전달한다.
4. **진행 모니터링**: 각 에이전트의 완료 상태를 추적한다.
5. **결과 취합**: 모든 에이전트의 결과물을 병합하고 충돌을 해결한다.

---

## 팀 구성 기준

계획서 내용을 분석하여 아래 규칙에 따라 에이전트를 자동 선별한다.

| 조건 | 투입 에이전트 | 이유 |
|------|--------------|------|
| UI 컴포넌트, 페이지, CSS 변경 포함 | `frontend-builder` | 프론트엔드 전문 구현 |
| API 엔드포인트, 서버 로직 변경 포함 | `backend-builder` | 백엔드 전문 구현 |
| DB 스키마, 마이그레이션, 쿼리 변경 포함 | `backend-builder` (DB 전담) | DB 변경은 백엔드와 함께 처리 |
| 테스트 작성이 필요한 경우 | `test-writer` (항상 포함) | 품질 보증은 항상 필수 |
| 공통 유틸, 타입, 설정 변경 포함 | `cto-lead` 직접 처리 | 전체에 영향을 미치므로 리드가 담당 |

**규칙:**
- `test-writer`는 다른 에이전트의 구현이 완료된 후 실행한다. (의존 관계 존재)
- `frontend-builder`와 `backend-builder`는 독립적이므로 병렬 실행 가능하다.
- DB 변경이 있을 경우 `backend-builder`가 먼저 완료된 후 `frontend-builder`가 API 연동을 진행한다.

---

## 팀 구성 예시

### 예시 1: 풀스택 기능 추가

```
계획서 내용: 로그인 페이지 UI + 인증 API + JWT 저장 + 테스트

투입 팀:
  - cto-lead: 타입 정의, 공통 유틸
  - frontend-builder: 로그인 페이지 UI, 폼 컴포넌트
  - backend-builder: 인증 API, JWT 발급 로직
  - test-writer: 인증 흐름 통합 테스트, 단위 테스트

실행 순서:
  1단계 (병렬): cto-lead + frontend-builder + backend-builder
  2단계 (순차): test-writer (1단계 완료 후)
```

### 예시 2: 백엔드 전용 작업

```
계획서 내용: DB 테이블 추가 + API 3개 신규 개발

투입 팀:
  - backend-builder: DB 마이그레이션 + API 구현
  - test-writer: API 테스트

실행 순서:
  1단계: backend-builder
  2단계: test-writer
```

### 예시 3: 프론트엔드 리팩토링

```
계획서 내용: 컴포넌트 10개 리팩토링 + 스타일 개선

투입 팀:
  - frontend-builder: 컴포넌트 리팩토링
  - test-writer: 스냅샷 테스트 업데이트

실행 순서:
  1단계: frontend-builder
  2단계: test-writer
```

---

## 에이전트 지시 형식

각 에이전트에게 아래 형식으로 태스크를 전달한다.

```
[{에이전트명} 태스크 지시]

담당 Step: {Step 번호 목록}
계획서 경로: docs/plans/YYYY-MM-DD-<기능명>.md
worktree 경로: .claude/worktrees/{기능명}-{에이전트명}
브랜치명: feature/{기능명}-{에이전트명}

선행 조건: {선행 에이전트명} 완료 후 실행 / 없음
완료 조건: 모든 담당 Step의 테스트 통과 + 커밋 완료

참고 컨텍스트:
- {관련 파일 경로}
- {공유해야 할 인터페이스 정의}
```

---

## 병렬 실행 및 결과 취합

### 병렬 실행 규칙

1. 의존 관계가 없는 에이전트는 동시에 실행한다.
2. 의존 관계가 있는 에이전트는 순서를 정하고 선행 에이전트 완료 후 실행한다.
3. 한 에이전트가 실패하면 → `cto-lead`가 즉시 알림을 받고 대응 방안을 결정한다.

### 결과 취합 절차

1. 모든 에이전트의 worktree 브랜치를 `cto-lead`가 순서대로 머지한다.
2. 머지 충돌 발생 시 → `cto-lead`가 직접 해결한다.
3. 취합 완료 후 → `executing-plans`의 리뷰 파이프라인으로 전달한다.

```bash
# 결과 취합 예시
git checkout feature/{기능명}-통합
git merge feature/{기능명}-frontend-builder
git merge feature/{기능명}-backend-builder
git merge feature/{기능명}-test-writer
```

---

## 팀 구성 보고 형식

팀 구성이 완료되면 사용자에게 아래 형식으로 보고한다.

```
## CTO 팀 구성 완료

**작업 규모**: L (Step N개)
**투입 에이전트**: N명

| 에이전트 | 담당 Step | 실행 순서 |
|---------|---------|---------|
| cto-lead | Step 1~2 | 1단계 |
| frontend-builder | Step 3~6 | 1단계 (병렬) |
| backend-builder | Step 7~11 | 1단계 (병렬) |
| test-writer | Step 12~14 | 2단계 |

지금 바로 실행할까요?
```

---

## 연동 흐름

```
executing-plans (L 사이즈 판단)
    │
    ▼
team-orchestration (현재 스킬: 팀 구성)
    │
    ├── cto-lead: 분석 + 조율
    ├── frontend-builder: 프론트엔드 구현 (병렬)
    ├── backend-builder: 백엔드/DB 구현 (병렬)
    └── test-writer: 테스트 작성 (후순위)
              │
              ▼
         결과 취합 (cto-lead)
              │
              ▼
         executing-plans 리뷰 파이프라인으로 반환
```
