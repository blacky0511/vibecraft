# RPDCA 개편 구현 계획 (v2 — 리뷰 반영)

**목표**: PDCA 워크플로우를 RPDCA(Research-Plan-Do-Check-Act)로 전면 개편하고, 계획서 자동 리뷰 시스템(plan-critic)과 스마트 아카이브를 추가한다.
**작성일**: 2026-03-18
**리서치 문서**: docs/plans/2026-03-18-rpdca-research.md
**버전**: 1.7.1 → 1.8.0 (마이너 범프)
**리뷰 상태**: v1 리뷰 완료 → 6건 반영하여 v2 작성

---

## 리뷰 반영 내역

| # | 피드백 | 판단 | 변경 내용 |
|---|--------|------|----------|
| 1 | plan.md vs plan-final.md 정본 모호 | **수용** | plan-final.md 삭제. plan.md 1개가 정본. 리뷰 반영 시 plan.md 직접 업데이트 |
| 2 | research 라우팅 충돌 위험 | **부분 수용** | 독립 스킬 유지 + 트리거 좁게 + auto-detect에 research 모드 추가 |
| 3 | M 상태머신 충돌 | **수용** | 구현 순서 변경: smart-pdca(기준 계약) → auto-detect → writing-plans → executing-plans |
| 4 | /pdca 명령 4단계 고정 | **부분 수용** | 파일명 유지, 인자를 [research\|plan\|do\|check\|act] 5단계로 확장 |
| 5 | 아카이브를 finishing-branch에 넣으면 책임 혼합 | **수용** | finishing-branch에서 분리 → smart-pdca에서 문서 수명 관리 |
| 6 | Codex MCP 실패 모드 약함 | **수용** | 실패 시 서브에이전트 2회 폴백, 워크플로우 멈추지 않음 |

---

## 변경 요약

| # | 항목 | 유형 | 핵심 변경 | 상태 |
|---|------|------|----------|------|
| 1 | `skills/research/SKILL.md` | 신규 | 독립 리서치 스킬 (Part 1 비즈니스 + Part 2 기술) | ✅ 완료 |
| 2 | `agents/plan-critic.md` | 신규 | 계획서 악마의 변호인 (서브에이전트 + Codex MCP, 폴백 포함) | ✅ 완료 |
| 3 | `skills/smart-pdca/SKILL.md` | 수정 | RPDCA 상태머신 재정의 + 문서 수명 관리 포함 | ✅ 완료 |
| 4 | `skills/auto-detect/SKILL.md` | 수정 | research 모드 추가 + 트리거 배타 규칙 | ✅ 완료 |
| 5 | `skills/writing-plans/SKILL.md` | 수정 | plan-critic 연동 + plan.md 정본 규칙 | ✅ 완료 |
| 6 | `skills/brainstorming/SKILL.md` | 수정 | 리서치 부분 제거 (research 스킬로 이관) | ✅ 완료 |
| 7 | `skills/executing-plans/SKILL.md` | 수정 | plan.md + plan-review.md 존재 검증 | ✅ 완료 |
| 8 | `skills/iron-law/SKILL.md` | 수정 | 조건부 파일 재확인 규칙 | ✅ 완료 |
| 9 | `skills/session-context/SKILL.md` | 수정 | 수정 파일 목록 추적 | ✅ 완료 |
| 10 | `skills/systematic-debugging/SKILL.md` | 수정 | RPDCA 디버깅 연동 | ✅ 완료 |
| 11 | `commands/pdca.md` | 수정 | 인자 5단계 확장 [research\|plan\|do\|check\|act] | ✅ 완료 |
| 12 | PDCA 언급 파일 26개 | 수정 | 용어 치환 | ✅ 완료 |
| 13 | `CLAUDE.md` + `plugin.json` | 수정 | RPDCA 반영 + 폴더 구조 + 버전 | ✅ 완료 |
| 14 | Codex MCP 설정 | 신규 | settings에 Codex MCP 서버 설정 | ✅ 완료 |

---

## Part 1: 핵심 변경 (비개발자용 요약)

### 뭐가 바뀌나요?

**지금**: 작업 요청 → (큰 작업만) 계획 → 바로 코드 작성
**개선 후**: 작업 요청 → **조사** → 계획 → **AI가 계획 검토** → 코드 작성

### 왜 바꾸나요?

1. 중간 크기 작업(M)에서 계획 없이 바로 코드를 써서 나중에 꼬이는 문제
2. 비개발자가 계획서에 직접 주석 달기가 어려운 문제
3. AI가 과거 코드 상태를 착각하는 문제

### 바뀌면 어떻게 되나요?

- **모든 M/L 작업**에서 리서치 → 계획 → AI 리뷰가 자동으로 돌아감
- 사용자는 리서치 요약(비즈니스 관점)과 리뷰 변경 요약만 읽고 판단
- 완료된 문서는 자동 아카이브, 취소한 건 삭제

---

## Part 2: 상세 구현 계획

---

### 핵심 계약 1: 정본 파일 규칙

> **정본은 항상 plan.md 1개.** plan-final.md는 만들지 않는다.

```
plan.md (초안 작성)
    ↓
plan-critic 리뷰 → plan-review.md 생성 (리뷰 기록)
    ↓
사용자 승인 → plan.md를 리뷰 반영본으로 직접 업데이트
    ↓
executing-plans는 plan.md만 읽는다
```

- plan-review.md는 "왜 바꿨는지" 기록용. 실행기가 읽는 파일이 아님
- 사용자가 직접 메모를 달고 싶으면 plan.md에 직접 작성 (기존 방식도 가능)
- plan.md가 없으면 실행 불가 (hard gate)

---

### 핵심 계약 2: 폴더 구조

```
docs/
└── plans/
    ├── {feature}/                 ← 현재 진행 중 (feature별 폴더)
    │   ├── research.md            ← R 단계
    │   ├── plan.md                ← P 단계 (정본, 리뷰 반영 시 직접 업데이트)
    │   └── plan-review.md         ← plan-critic 리뷰 기록 (3회분 통합)
    │
    └── archive/                   ← 완료된 작업
        └── YYYY-MM/
            └── {feature}/         ← 파일 그대로 이동
```

**규칙**:
- feature 폴더명: kebab-case (예: `login-api`, `keyword-search`)
- 파일명: 역할만 (날짜, feature명 반복 안 함)
- 실행 완료 → `archive/YYYY-MM/{feature}/`로 이동
- 실행 안 함(폐기) → 폴더 삭제 (사용자 확인 후)
- 진행 중 → `plans/{feature}/`에 유지

---

### 핵심 계약 3: RPDCA 상태머신 (모든 스킬이 따르는 기준)

```
S: 바로 실행 → verification

M: research → writing-plans → plan-critic(2회) → 사용자 확인 → executing-plans → verification
   (research.md)  (plan.md)    (plan-review.md)                  (plan.md 읽음)

L: research → brainstorming → writing-plans → plan-critic(3회) → 사용자 확인 → executing-plans → 리뷰 파이프라인 → verification
```

**사용자 확인 시점**:

| 크기 | 확인 횟수 | 확인 시점 |
|------|----------|----------|
| S | 0회 | 확인 없이 진행, 결과만 보고 |
| M | 1회 | plan-review.md 변경 요약 확인 후 → 실행 |
| L | 2회 | research Part 1 확인 1회 + plan-review.md 확인 1회 |

**디버깅에서의 RPDCA**:

| 크기 | 디버깅 워크플로우 |
|------|----------------|
| S | 바로 수정 → 확인 (R, P 스킵) |
| M | R(research.md) → P(plan.md) → D → C |
| L | R(research.md) → P(plan.md) → plan-critic → D → C → A |

**문서 수명 관리** (smart-pdca가 담당):
- 작업 완료 시: `docs/plans/{feature}/` → `archive/YYYY-MM/{feature}/`로 이동
- 작업 폐기 시: "삭제할까요?" 확인 → `docs/plans/{feature}/` 폴더 삭제

---

### Step 1: smart-pdca 전면 재설계 (기준 계약)

**파일**: `skills/smart-pdca/SKILL.md`

**최우선 구현. 다른 모든 스킬이 이 계약을 기준으로 맞춰야 한다.**

변경 내용:
1. PDCA → RPDCA 전면 변경
2. M 크기 워크플로우: `간략 계획(채팅)` → `research(MD) → plan(MD) → plan-critic → 실행`
3. 상태: [research | plan | do | check | act] 5단계
4. 문서 수명 관리 규칙 포함 (아카이브/폐기) — finishing-branch에서 분리
5. 연동 스킬 흐름도 전면 업데이트

---

### Step 2: auto-detect에 research 모드 추가

**파일**: `skills/auto-detect/SKILL.md`

변경 내용:
1. 모드 테이블에 "리서치 모드" 추가
2. 트리거 배타 규칙 명시

**트리거 배타 규칙**:

| 입력 | 라우팅 대상 | 이유 |
|------|-----------|------|
| "리서치해줘", "코드 조사해줘" | research | 명시적 리서치 요청 |
| "분석해줘", "데이터 분석" | analysis-delegation | 데이터/DB 분석 |
| "버그 원인 찾아줘" | systematic-debugging | 디버깅 |
| "이 코드 봐줘", "검토해줘" | code-review-request | 리뷰 |
| "기능 만들어줘" | new-feature (내부에서 research 호출) | 새 기능 |

**핵심**: research는 직접 호출도 가능하고, new-feature/systematic-debugging 내부에서도 호출됨 (dual-use)

---

### Step 3: research 스킬 (신규)

**파일**: `skills/research/SKILL.md`

**역할**: 코드베이스를 깊이 읽고 `docs/plans/{feature}/research.md`를 생성한다.

**research.md 구조**:

```markdown
# {feature} 코드베이스 리서치

## Part 1: 비즈니스 관점 (사용자용)

### 이 기능이 하는 일
(한 문단, 쉬운 말로)

### 데이터 흐름 (쉬운 버전)
1. 사용자가 ___한다
2. 시스템이 ___한다
3. 결과로 ___가 된다

### 이미 있는 것 / 새로 필요한 것
- 있음: ...
- 필요: ...

### 결정이 필요한 것
- 질문 1?
- 질문 2?

---

## Part 2: 기술 관점 (AI·개발자용)

### 관련 파일
| 파일 경로 | 역할 | 비고 |

### 기존 패턴
(에러 처리, DB 접근, API 구조, 네이밍)

### 영향 범위
(변경 시 영향받는 파일)

### 열린 질문
([사실] / [가설] / [결정 대기])

### 계획 입력값
(다음 단계에 넘길 핵심 정보)
```

**스마트 아카이브 참조**:
- 리서치 시작 시 `docs/plans/archive/`에서 같은 파일을 다룬 과거 리서치가 있는지 **파일명만 검색**
- 관련 과거 문서가 있으면 → 그때만 읽어서 참고
- 없으면 → 스킵 (토큰 절약)

**크기별**:
| 크기 | research.md |
|------|------------|
| S | 생성 안 함 |
| M | 생성 (Part 1 간소, Part 2 표준) |
| L | 생성 (Part 1 상세, Part 2 상세) |

**트리거**: 리서치, 조사, research, 코드 조사 (좁게 설정)

---

### Step 4: plan-critic 에이전트 (신규)

**파일**: `agents/plan-critic.md`

**역할**: plan.md를 리뷰하여 plan-review.md를 생성하고, plan.md를 직접 업데이트한다.

**리뷰 구조 (폴백 포함)**:

```
Round 1: Claude 서브에이전트 — 누락 검토
    ↓
Round 2: Claude 서브에이전트 — 최악 시나리오
    ↓
Round 3: Codex MCP (GPT) — 외부 관점
    ↓ (Codex 실패 시 → 스킵, Round 1-2 결과만으로 plan-review.md 생성)
    ↓
plan-review.md 생성 + plan.md 직접 업데이트
```

**폴백 규칙**:
- Codex MCP 정상 → 3회 리뷰
- Codex MCP 실패 (미설치, 인증 만료, 서버 미기동) → 서브에이전트 2회만으로 완료
- **plan-review.md는 항상 생성된다** (외부 도구 장애로 워크플로우가 멈추지 않음)

**크기별**:
| 크기 | 리뷰 |
|------|------|
| S | 없음 |
| M | 서브에이전트 1회 + Codex 1회 (폴백: 서브에이전트 1회만) |
| L | 서브에이전트 2회 + Codex 1회 (폴백: 서브에이전트 2회만) |

**plan-review.md 구조**:

```markdown
# Plan Review — {feature}

## Round 1: 누락 검토 (Claude 서브에이전트)
| Step | 변경 유형 | 이유 |
|------|----------|------|

## Round 2: 최악 시나리오 (Claude 서브에이전트)
| Step | 변경 유형 | 이유 |
|------|----------|------|

## Round 3: 외부 관점 (Codex MCP)
| Step | 변경 유형 | 이유 |
|------|----------|------|
(Codex 실패 시: "Codex MCP 연결 실패 — 이 라운드는 스킵됨" 표시)

---

## 변경 요약 ← 사용자는 여기만 읽으면 됨
| Step | 최종 판정 | 이유 (한 줄) |
|------|----------|-------------|
```

---

### Step 5: writing-plans 수정

**파일**: `skills/writing-plans/SKILL.md`

변경 내용:
1. plan-critic 연동: 초안 작성 후 자동으로 plan-critic 에이전트 호출
2. M 크기에도 MD 계획 적용: 채팅 3~5줄 → `docs/plans/{feature}/plan.md` 파일 생성
3. 정본 규칙 적용: plan.md 1개가 정본, plan-final.md 제거
4. 기존 주석 리뷰 사이클도 유지 (plan-critic은 추가 레이어, 대체 아님)

**흐름**:
```
초안 작성 → docs/plans/{feature}/plan.md 저장
    ↓
plan-critic 에이전트 호출 → plan-review.md 생성 + plan.md 업데이트
    ↓
사용자에게 변경 요약만 제시
    ↓
승인 → executing-plans (plan.md를 읽음)
거절 → plan.md 추가 수정 → plan-critic 재실행 가능
```

---

### Step 6: brainstorming 수정

**파일**: `skills/brainstorming/SKILL.md`

변경 내용:
- 1단계 "코드베이스 리서치" 섹션 전체 제거
- "research 스킬이 선행 완료되었음을 전제"로 시작
- research.md의 Part 2 > 열린 질문을 브레인스토밍 입력값으로 활용

---

### Step 7: executing-plans 수정

**파일**: `skills/executing-plans/SKILL.md`

변경 내용:
- 실행 전 체크 변경:
  ```
  - [ ] docs/plans/{feature}/plan.md가 존재하는가? (정본)
  - [ ] docs/plans/{feature}/plan-review.md가 존재하는가? (리뷰 완료 증거)
  - [ ] 사용자가 변경 요약을 확인했는가?
  ```
- 계획서 경로 형식 변경: `docs/plans/YYYY-MM-DD-<기능명>.md` → `docs/plans/{feature}/plan.md`

---

### Step 8: iron-law 수정

**파일**: `skills/iron-law/SKILL.md`

추가 규칙 — 조건부 파일 재확인:

```
코드 수정 전 파일을 다시 읽어야 하는 조건:
1. 이 세션에서 같은 파일을 이미 수정한 적 있을 때
2. auto-compact가 발생한 후
3. 사용자가 "이미 바꿨는데", "아까 수정했잖아" 등 과거 수정을 언급할 때

위 조건에 해당하지 않으면 → 기억 기반으로 바로 수정 (기존과 동일)
```

---

### Step 9: session-context 수정

**파일**: `skills/session-context/SKILL.md`

변경 내용:
1. 세션 파일에 수정된 파일 목록 기록
2. 상태 표현 5단계: [research | plan | do | check | act]

```markdown
## 수정된 파일
- src/auth/service.ts (2회 수정)
- src/routes/login.ts (1회 수정)

## 현재 상태
- 단계: Research
- 진행: research.md 작성 중
```

---

### Step 10: systematic-debugging RPDCA 연동

**파일**: `skills/systematic-debugging/SKILL.md`

변경 내용: M/L 버그에서 RPDCA 흐름 호출

| 크기 | 워크플로우 |
|------|----------|
| S | 바로 수정 → 확인 |
| M | research(내부 호출) → plan.md → 수정 → 확인 |
| L | research(내부 호출) → plan.md → plan-critic → 수정 → 확인 → 회귀 테스트 |

---

### Step 11: commands/pdca.md 수정

**파일**: `commands/pdca.md` (파일명 유지)

변경 내용:
- 인자 확장: `[plan|do|check|act]` → `[research|plan|do|check|act]`
- description 문구에서 PDCA → RPDCA
- 트리거는 "pdca" 유지 (하위 호환)

---

### Step 12: PDCA → RPDCA 용어 치환 (26개 파일)

**스킬 (10개)**:
- `skills/auto-detect/SKILL.md` (Step 2에서 모드 추가와 함께 처리)
- `skills/new-feature/SKILL.md`
- `skills/iron-law/SKILL.md` (Step 8과 함께 처리)
- `skills/error-simulation/SKILL.md`
- `skills/reference-design/SKILL.md`
- `skills/verification/SKILL.md`
- `skills/cto-mindset/SKILL.md`
- `skills/welcome-guide/SKILL.md`
- `skills/git-workflow/SKILL.md`
- `skills/doc-autopilot/SKILL.md`

**명령어 (2개)**:
- `commands/pdca.md` (Step 11과 함께 처리)
- `commands/vibecraft.md`

**에이전트 (2개)**:
- `agents/gap-detector.md`
- `agents/doc-writer.md`

**템플릿 (3개)**:
- `templates/plan.md`
- `templates/design.md`
- `templates/check-report.md`

**출력 스타일 (1개)**:
- `output-styles/learning.md`

**프로젝트 문서 (4개)**:
- `CLAUDE.md` (Step 13과 함께 처리)
- `README.md`
- `marketplace.json`
- `.claude-plugin/marketplace.json`

**기타**:
- `.claude-plugin/plugin.json` (Step 13과 함께 처리)

---

### Step 13: CLAUDE.md + plugin.json 업데이트

**plugin.json**:
- version: "1.7.1" → "1.8.0"
- description: RPDCA + plan-critic 언급
- keywords: "rpdca", "plan-critic" 추가

**CLAUDE.md**:
- 핵심 철학에 RPDCA 설명
- 디렉토리 구조에 `skills/research/`, `agents/plan-critic.md` 추가
- `docs/plans/` 폴더 구조 규칙 추가
- 구현 상태에 Phase 6 추가

**버전 동기화**:
```bash
node scripts/sync-version.js
```

---

### Step 14: Codex MCP 설정

settings에 추가:

```json
{
  "mcpServers": {
    "codex": {
      "command": "codex",
      "args": ["mcp-server"]
    }
  }
}
```

사전 준비:
```bash
npm install -g @openai/codex
codex login
```

---

## 실행 순서 (리뷰 반영: smart-pdca 먼저)

```
Phase A: 기준 계약 확립 (Step 1, 2)
  1. smart-pdca 전면 재설계 (모든 스킬의 기준)
  2. auto-detect에 research 모드 추가
  → 이 시점에서 M/L 상태머신이 확정됨

Phase B: 핵심 신규 (Step 3, 4)
  3. research 스킬 생성
  4. plan-critic 에이전트 생성
  → 이 시점에서 R과 plan-review 기능이 사용 가능

Phase C: 기존 스킬 맞춤 (Step 5, 6, 7)
  5. writing-plans를 새 상태머신에 맞춤
  6. brainstorming에서 리서치 분리
  7. executing-plans 검증 로직 맞춤
  → 이 시점에서 M/L 전체 흐름이 동작

Phase D: 보조 규칙 (Step 8, 9, 10, 11)
  8. iron-law 조건부 재확인
  9. session-context 수정 파일 추적
  10. systematic-debugging RPDCA 연동
  11. /pdca 명령어 5단계 확장
  → 품질 규칙과 인터페이스 정비

Phase E: 마무리 (Step 12, 13, 14)
  12. 26개 파일 용어 치환
  13. CLAUDE.md + plugin.json + 버전
  14. Codex MCP 설정
  → 최종 정합성 확인 + 버전 릴리즈
```

---

## 위험 요소

| 위험 | 가능성 | 영향 | 대응 |
|------|--------|------|------|
| Codex MCP 연결 실패 | 중간 | **낮음** (폴백 있음) | 서브에이전트 2회만으로 plan-review.md 생성 |
| M 상태머신 불일치 | 중간 | 높음 | Phase A에서 기준 계약 먼저 확정 후 나머지 맞춤 |
| research 트리거 충돌 | 낮음 | 중간 | 트리거를 좁게 잡고 배타 규칙 명시 |
| 26개 파일 용어 치환 누락 | 낮음 | 낮음 | grep으로 전수 검사 |
| plan-critic 리뷰 품질 | 중간 | 중간 | 프롬프트 튜닝으로 개선 |

---

## 검증 방법

1. **상태머신 정합성**: smart-pdca, auto-detect, writing-plans, executing-plans가 M을 동일하게 처리하는지 확인
2. **research 스킬**: 테스트 프로젝트에서 리서치 → research.md 생성 → Part 1/2 구분 확인
3. **plan-critic 정상 경로**: plan.md → 3회 리뷰 → plan-review.md + plan.md 업데이트 확인
4. **plan-critic 폴백**: Codex 없이 → 서브에이전트 2회만으로 plan-review.md 생성 확인
5. **정본 규칙**: executing-plans가 plan.md만 읽는지, plan-final.md를 찾지 않는지 확인
6. **아카이브**: 완료 → archive 이동, 폐기 → 삭제 확인
7. **iron-law 재확인**: 같은 파일 2회 수정 시 자동 재읽기 동작 확인
8. **트리거 배타**: "리서치해줘" → research, "분석해줘" → analysis-delegation 확인
9. **용어 치환**: `grep -r "PDCA"` 시 RPDCA만 나오는지 확인 (단독 PDCA 0건)
