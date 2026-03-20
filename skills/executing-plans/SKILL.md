---
name: executing-plans
description: |
  writing-plans에서 생성된 구현 계획을 받아 서브에이전트를 디스패치하여 실행하는 스킬.
  태스크 규모에 따라 직접 실행(S), 소규모 병렬(M), CTO 팀 구성(L)으로 자동 분기한다.
  각 태스크는 독립 worktree에서 격리 실행되며, 완료 후 리뷰 파이프라인이 자동으로 실행된다.

  Triggers: 실행, 구현 시작, execute, 계획 실행, executing-plans
---

# 구현 계획 실행 스킬

## 역할

`writing-plans` 스킬이 생성한 구현 계획서를 입력으로 받아,
태스크 규모를 판단하고 적절한 방식으로 서브에이전트를 디스패치하여 실제 구현을 수행한다.

---

## 실행 전 준비

### 1. 계획서 확인 및 승인 검증

실행 시작 전, 아래 항목을 반드시 확인한다.

- 계획서 경로: `docs/plans/{feature}/plan.md`
- 계획서가 없으면 → `writing-plans` 스킬을 먼저 실행할 것을 안내한다.
- 계획서가 있으면 → 태스크 목록을 파싱하고 규모를 판단한다.

**RPDCA 검증**: 아래 파일이 모두 존재하는지 확인한다.
- `docs/plans/{feature}/plan.md` — 정본 계획서 (필수)
- `docs/plans/{feature}/plan-review.md` — plan-critic 리뷰 완료 증거 (M/L 필수)
- `docs/plans/{feature}/research.md` — 리서치 완료 증거 (M/L 필수)

S 크기는 위 파일 없이도 실행 가능.
M/L에서 plan-review.md가 없으면 → "plan-critic 리뷰를 먼저 실행하시겠습니까?"로 안내.

### 2. 규모 판단 기준

| 규모 | 기준 | 실행 방식 |
|------|------|-----------|
| S (소형) | Step 1~3개, 단일 파일 또는 단순 수정 | 메인 에이전트 직접 실행 |
| M (중형) | Step 4~8개, 2개 이상 파일 연관 | `team-orchestration` 경량 모드 → 메인이 CTO, 서브에이전트 2~3개 병렬 |
| L (대형) | Step 9개 이상, 다중 레이어 변경 | `team-orchestration` 스킬 호출 → CTO 팀 구성 |

---

## 프롬프트 정제 (서브에이전트 위임 시 필수)

M/L 사이즈에서 서브에이전트에 작업을 위임할 때,
**반드시 `templates/subagent-prompt.md` 형식으로 프롬프트를 정제**한 후 전달한다.

### 정제 절차

서브에이전트에 Task 도구를 호출하기 **직전에** 아래를 수행한다:

1. **맥락 수집**: 현재 대화에서 프로젝트명, 기술 스택, 경로, 브랜치 정보를 추출
2. **파일 경로 명시**: 계획서의 Step에 대상 파일 경로를 절대/상대 경로로 포함
3. **코딩 패턴 요약**: 수정 대상 파일의 네이밍, 에러 처리, 구조 패턴을 2~3줄로 정리
4. **성공 기준 구체화**: "테스트 통과", "HTTP 200" 등 검증 가능한 조건으로 변환
5. **범위 한정**: 건드리면 안 되는 파일, 판단 필요 시 "메인에 보고" 지시 포함

### 왜 필요한가

- 메인 에이전트는 대화 맥락이 있어서 "배포해줘"만으로 동작 가능
- 서브에이전트는 맥락이 없으므로, **메인이 아는 정보를 구조화해서 전달**해야 함
- 이 단계를 생략하면 서브에이전트가 헤매거나 품질이 떨어짐

### 정제 예시

```
// 사용자 원문: "로그인 API 만들어줘"
// 메인이 아는 맥락: Spring Boot, JWT, UserController 패턴

// ❌ 정제 안 한 프롬프트
prompt: "로그인 API를 만들어줘. 계획서: docs/plans/2026-02-27-login.md"

// ✅ 정제한 프롬프트
prompt: `
## 작업 지시서

### 목표
JWT 기반 로그인 API 엔드포인트를 구현한다.

### 맥락
- 프로젝트: selfpost (Spring Boot 3.x, Java 17)
- 기술 스택: Spring Security + JWT, MyBatis, MariaDB
- 계획서: docs/plans/2026-02-27-login.md

### 작업 범위
1. src/main/java/.../controller/AuthController.java — POST /api/auth/login 엔드포인트
2. src/main/java/.../service/AuthService.java — 인증 로직
3. src/main/java/.../dto/LoginRequest.java — 요청 DTO

### 기존 코드 참고
- 네이밍: camelCase (Java 표준)
- 기존 컨트롤러 패턴: src/.../controller/UserController.java 참고
- 응답 형식: ResponseEntity<ApiResponse<T>> 사용

### 성공 기준
- [ ] POST /api/auth/login 정상 동작
- [ ] 잘못된 비밀번호 시 401 응답
- [ ] JWT 토큰 반환 확인
- [ ] 기존 테스트 깨지지 않음

### 하지 말 것
- Spring Security 설정(SecurityConfig) 수정 금지
- 새 라이브러리 추가 금지
`
```

---

## 실행 방식별 동작

### S 사이즈: 메인 에이전트 직접 실행

```
규모가 작으므로 이 세션에서 직접 구현합니다.
계획서의 Step 순서를 그대로 따라 실행합니다.
```

- 계획서의 각 Step을 순서대로 실행한다.
- TDD 순서(테스트 작성 → 실패 확인 → 구현 → 통과 확인 → 커밋)를 준수한다.
- 모든 Step 완료 후 → 리뷰 파이프라인을 실행한다.

### M 사이즈: 경량 CTO 팀 실행 (team-orchestration light 모드)

```
경량 CTO 팀을 구성하여 서브에이전트 2~3개로 병렬 실행합니다.
메인 에이전트가 CTO 역할을 겸합니다.
```

**핵심 원칙**: 메인은 코드를 직접 읽거나 쓰지 않는다. 판단과 결과 취합만.

1. `team-orchestration` 스킬을 **light 모드**로 호출한다.
2. 계획서의 Step을 분석하여 에이전트 2~3명을 매칭한다.
3. TeamCreate → TaskCreate → 프롬프트 정제 → 에이전트 스폰 (worktree, background)
4. 모든 에이전트 완료 후 → code-simplifier → error-simulation → verification(gap-detector + Check-Act 루프)
5. 실패 시 retry 1회 → 에스컬레이션 (reassign 생략)

**서브에이전트 프롬프트 생성:**

각 서브에이전트에 대해 **프롬프트 정제 절차**를 실행하여 구조화된 지시서를 생성한다.
`templates/subagent-prompt.md` 형식을 따르되, 해당 서브에이전트의 담당 Step에 맞게 작성한다.

> **중요**: prompt에 사용자 원문을 그대로 넣지 않는다.
> 반드시 맥락 추출 → 경로 명시 → 패턴 요약 → 성공 기준 구체화를 거친다.

### L 사이즈: CTO 팀 구성 후 병렬 실행

```
대형 작업입니다. team-orchestration 스킬로 CTO 팀을 구성합니다.
```

- `team-orchestration` 스킬을 호출하여 필요한 전문가 에이전트를 선별한다.
- 팀 구성 후, 각 에이전트에 독립 태스크를 할당하고 병렬 실행한다.
- 자세한 절차는 `team-orchestration` 스킬을 참고한다.

### ralph-loop 모드: 반복 수정 루프

smart-pdca에서 ralphLoop 플래그가 전달되었을 때 실행된다.
기존 S/M/L 실행이 완료된 후에도, verification 실패 시 ralph-loop으로 전환 가능하다.

ralph-loop은 독립 모드가 아니라, 기존 모드와 크기 위에 얹히는 반복 실행 방식이다.

**실행 절차:**

1. 검증 명령어와 성공 조건을 확인한다
2. team-orchestration 스킬을 **ralph-loop 모드**로 호출한다
3. iteration 루프가 완료되면 verification을 재실행한다

**기존 실행과의 관계:**

- S/M/L 실행 후 → verification 실패 → ralph-loop 전환 가능
- 처음부터 ralph-loop으로 시작 가능 (시나리오 C: 일괄 수정, 간소 plan.md 자동 생성)

**ralph-loop 완료 후 리뷰 파이프라인:**

ralph-loop은 "에러 0개"를 만드는 보조 루프이며, 계획 대비 누락 검사와는 역할이 다르다.

| 시나리오 | ralph-loop 완료 후 | 이유 |
|---------|-------------------|------|
| A. 디버깅 후 | verification만 재실행 | 기존 기능 수정이라 누락 검사 불필요 |
| B. 새 기능 후 | verification + gap-detector 재실행 | 계획한 기능이 빠졌는지 확인 필요 |
| C. 일괄 수정 | verification만 재실행 | 계획서 자체가 간소하므로 gap-detector 불필요 |
| L 크기 작업 | 기존 리뷰 파이프라인 전체 유지 | 대형 작업은 품질 회귀 위험이 높음 |

---

## worktree 격리 실행

각 서브에이전트 태스크는 독립 worktree에서 실행하여 충돌을 방지한다.

```bash
# worktree 생성 (태스크별)
git worktree add .claude/worktrees/{브랜치명} -b feature/{브랜치명}

# 작업 완료 후 정리 (사용자 확인 후)
git worktree remove .claude/worktrees/{브랜치명}
```

- worktree 폴더 네이밍: `.claude/worktrees/{기능명}-{태스크번호}`
- 메인 브랜치는 항상 안전한 상태를 유지한다.
- 병렬 worktree 간 파일 충돌이 발생하면 메인 에이전트가 중재한다.

---

## 리뷰 파이프라인

### 크기별 적용

| 크기 | 파이프라인 |
|------|----------|
| S | 리뷰 파이프라인 없음 — 바로 verification |
| M | code-simplifier → error-simulation → **verification (내부에서 gap-detector 호출)** |
| L | code-simplifier → external-reviewer → error-simulation → **verification (내부에서 gap-detector 호출)** |

> **gap-detector는 verification 내부에서 호출된다.** 리뷰 파이프라인에서 별도로 호출하지 않는다. verification이 gap-detector를 호출하여 Match Rate를 계산하고, 90% 미만 시 자동 수정 루프를 실행한다.

### L 크기 전체 파이프라인

```
code-simplifier → external-reviewer → error-simulation → verification(gap-detector + Check-Act 루프)
```

| 단계 | 담당 | 역할 |
|------|------|------|
| 1단계 | `code-simplifier` | 구현 코드 단순화 · 가독성 개선 |
| 2단계 (L만) | `external-reviewer` | 외부 도구(ESLint 등)로 코드 검사 |
| 3단계 | `error-simulation` | 잠재 오류 시뮬레이션 (M: 1~2회, L: 최대 3회) |
| 4단계 | `verification` | gap-detector(Match Rate) + Check-Act 자동 루프 |

리뷰 결과에 지적 사항이 있으면 → 해당 Step을 수정하고 재실행한다.

---

## 실행 완료 보고 형식

모든 Step과 리뷰 파이프라인이 완료되면 아래 형식으로 결과를 보고한다.

```
## 구현 완료 보고

**계획서**: docs/plans/{feature}/plan.md
**실행 방식**: S / M / L
**완료된 Step**: N개 / 전체 N개

### 결과 요약
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 파이프라인 통과
- [ ] 계획서 대비 누락 없음

### 생성된 파일
- `경로/파일명.ts` — 역할 요약

### 다음 단계
- PR 생성 → main 병합 제안
```

---

## 방향 재설정: 잘못된 구현 감지 시

구현 도중 방향이 잘못되었다고 판단되면, **그 위에서 패치하지 않는다.**
잘못된 토대 위에 벽돌을 쌓아 올리는 것보다 되돌리고 범위를 좁히는 편이 항상 낫다.

### 방향 재설정 패턴

```
1. 사용자: "전부 되돌려" 또는 "방향이 잘못됐어"
   ↓
2. rollback-strategy의 체크포인트로 복원 (사용자 확인 필수)
   ↓
3. 범위를 축소하여 재계획
   - "이제 [좁은 범위]만 하자. 그 외엔 아무것도 하지 마."
   ↓
4. writing-plans로 돌아가 축소된 범위로 계획 재작성
   ↓
5. 주석 리뷰 사이클을 다시 거친 후 재실행
```

### 범위 축소 원칙

- 잘못된 부분만 빼는 게 아니라, **올바른 부분만 남긴다**
- "A, B, C 중에서 B만 빼줘" (X) → "A만 해. 나머지는 나중에" (O)
- 축소 후 계획서를 새로 쓰는 것을 두려워하지 않는다

---

## 연동 흐름

```
research (코드베이스 파악)
    │
    ▼
writing-plans (계획서 생성) + plan-critic (리뷰)
    │
    ▼
executing-plans (현재 스킬: 계획 실행)
    │
    ├── S → 메인 에이전트 직접 실행
    ├── M → team-orchestration (경량 모드) → 서브에이전트 2~3개
    ├── L → team-orchestration (정규 모드) → CTO + 다수 에이전트
    │         │
    │         ▼
    │    리뷰 파이프라인
    │    (code-simplifier → external-reviewer → error-simulation → verification(gap-detector))
    │
    └── ralph-loop → team-orchestration (ralph-loop 모드) → iteration 루프
              │
              ▼
         verification 재실행 (시나리오 B/L은 gap-detector도)
              │
              ▼
         구현 완료 보고

    ※ S/M/L 실행 후 verification 실패 시:
    executing-plans → verification 실패 → ralph-loop 제안 → team-orchestration (ralph-loop 모드)

    ※ 방향 재설정 시:
    executing-plans → rollback → writing-plans (범위 축소) → executing-plans
```
