# vibecraft 최종 설계서

> 버전: 1.0 | 작성일: 2026-02-26
> 접근 방식: 접근 3 (새 설계) + 접근 1, 2의 장점 통합

---

## 1. 프로젝트 개요

### 한 줄 정의
> **vibecraft** = 바이브코딩 전용 네비게이션 플러그인. AI가 상황을 자동 감지하고, 사용자는 아이디어만 제공하면 된다.

### 핵심 철학
- **AI가 리드, 사용자는 방향만 결정**: 바이브코딩에 최적화
- **자동 감지**: 명령어 없이 사용자 입력만으로 적절한 워크플로우 자동 선택
- **스마트 PDCA**: 작업 크기에 따라 방법론 강도 자동 조절
- **서브에이전트 병렬 실행**: 큰 작업은 팀을 구성해 동시 진행
- **다단계 리뷰 파이프라인**: 구현 → 코드 정리 → 외부 검증 → 설계 갭 분석
- **범용 + 프리셋**: 어떤 프로젝트에서든 사용 가능하되, 기술 스택별 맞춤 지원

### 장점 통합 출처

| 가져온 것 | 출처 | vibecraft에서 어떻게 |
|----------|------|---------------------|
| PDCA 순환 | bkit | 작업 크기에 따라 자동 조절 (스마트 PDCA) |
| CTO 팀 운영 | bkit | 서브에이전트 기반 병렬 실행으로 진화 |
| 9-Phase 파이프라인 | bkit | 6-Phase로 간소화 |
| 템플릿 시스템 | bkit | 한국어 맞춤 8개 핵심 템플릿 |
| Iron Law (TDD+검증) | superpowers | 모든 코드 변경에 자동 적용 |
| 체계적 디버깅 | superpowers | 버그 감지 시 자동 진입 |
| brainstorming 흐름 | superpowers | 새 기능/프로젝트에서 자동 진입 |
| 서브에이전트 실행 | superpowers | executing-plans + worktree 격리 |
| 코드 리뷰 분리 | superpowers | 요청/수신 각각 전문화 |
| verification | superpowers | 완료 선언 전 반드시 증거 |

### vibecraft만의 새로운 것

| 신규 기능 | 설명 |
|----------|------|
| 자동 상황 감지 | 사용자 입력을 분석해서 적절한 워크플로우 자동 선택 |
| 스마트 PDCA | 작업 크기(S/M/L)에 따라 전체/간소화/스킵 자동 결정 |
| 바이브코딩 모드 | AI가 리드하고, 큰 단위에서만 사용자 확인 |
| 프로젝트 프리셋 | 기술 스택별 맞춤 가이드 자동 로드 |
| 다단계 리뷰 파이프라인 | code-simplifier → 외부 도구 → gap-detector 3단계 |
| 외부 도구 연동 | Codex, ESLint, SonarQube 등 외부 검증 도구 파이프라인 연결 |
| 한국어 네이티브 | 번역이 아닌 처음부터 한국어 설계 |

---

## 2. 전체 아키텍처

### 동작 흐름

```
사용자 입력
    │
    ▼
[auto-detect] 상황 자동 감지
    │
    ├── "~만들어줘", "~추가해줘" ──→ 새 기능 모드
    ├── "~안 돼", "~에러", "~버그" ─→ 디버깅 모드
    ├── "~만들자", "~앱/사이트"  ──→ 프로젝트 시작 모드
    ├── "~리뷰해줘", "~봐줘"    ──→ 코드 리뷰 모드
    └── "~배포", "~릴리즈"      ──→ 배포 모드
    │
    ▼
[smart-pdca] 작업 크기 판단
    │
    ├── S (소): 파일 1~2개 → 바로 실행 + 검증
    ├── M (중): 파일 3~5개 → 간소 PDCA (계획→실행→검증)
    └── L (대): 파일 6개+  → 전체 PDCA + 팀 구성
    │
    ▼
[brainstorming] 아이디어 구체화 (M, L만)
    │
    ▼
[writing-plans] 구현 계획 생성
    │
    ▼
[executing-plans] 서브에이전트 디스패치
    │
    ├── S: 메인 에이전트가 직접 실행
    ├── M: 서브에이전트 1~2개 병렬
    └── L: CTO 팀 구성 → 다수 병렬
    │
    ▼
[review-pipeline] 다단계 리뷰
    │
    ├── 1차: code-simplifier (코드 정리 + 품질)
    ├── 2차: external-reviewer (외부 도구, 선택)
    └── 3차: gap-detector (설계 대비 달성률)
    │
    ▼
[verification] 최종 검증 + 완료
```

### 모드별 동작 상세

#### 새 기능 모드
```
brainstorming → writing-plans → executing-plans → review-pipeline → verification
```

#### 디버깅 모드
```
systematic-debugging (4단계) → 수정 구현 → verification
```

#### 프로젝트 시작 모드
```
brainstorming → project-kickoff → writing-plans → executing-plans → verification
```

#### 코드 리뷰 모드
```
code-review-request 또는 code-review-receive → review-pipeline
```

#### 배포 모드
```
deploy-guide → 체크리스트 실행 → verification
```

---

## 3. 스킬 구성 (총 21개)

### 핵심 스킬 (6개) - 모든 모드에서 사용

| # | 스킬명 | 역할 | 출처 |
|---|--------|------|------|
| 1 | `auto-detect` | 사용자 입력 분석 → 적절한 모드 자동 선택 | 신규 |
| 2 | `smart-pdca` | 작업 크기 판단 → PDCA 강도 자동 조절 | bkit 개선 |
| 3 | `iron-law` | 테스트 먼저 + 완료 전 반드시 검증 증거 | superpowers |
| 4 | `brainstorming` | 아이디어 → 질문 → 설계 확정 | superpowers |
| 5 | `writing-plans` | 확정된 설계 → 단계별 구현 계획 | superpowers |
| 6 | `verification` | 완료 선언 전 테스트/증거 필수 확인 | superpowers |

### 모드별 스킬 (11개)

| # | 스킬명 | 모드 | 역할 |
|---|--------|------|------|
| 7 | `new-feature` | 새 기능 | 기능 추가 전체 흐름 가이드 |
| 8 | `systematic-debugging` | 디버깅 | 4단계 체계적 디버깅 |
| 9 | `project-kickoff` | 시작 | 새 프로젝트 초기 설정 가이드 |
| 10 | `code-review-request` | 리뷰 | 코드 리뷰 요청 (리뷰 받을 때) |
| 11 | `code-review-receive` | 리뷰 | 코드 리뷰 수신 (피드백 반영) |
| 12 | `deploy-guide` | 배포 | 배포 프로세스 가이드 |
| 13 | `team-orchestration` | 새 기능/시작 | CTO 팀 자동 구성 + 서브에이전트 병렬 실행 |
| 14 | `executing-plans` | 모두 | 서브에이전트 디스패치 (worktree 격리) |
| 15 | `finishing-branch` | 모두 | 작업 완료 → PR/머지 가이드 |
| 16 | `git-workflow` | 모두 | 브랜치/커밋/PR 자동 관리 |
| 17 | `external-reviewer` | 모두 | 외부 도구(Codex, ESLint 등) 연동 리뷰 |

### 프리셋 스킬 (4개) - 기술 스택별 맞춤

| # | 스킬명 | 역할 |
|---|--------|------|
| 18 | `preset-spring` | Spring Boot 프로젝트 규칙 |
| 19 | `preset-nextjs` | Next.js/React 프로젝트 규칙 |
| 20 | `preset-python` | Python 프로젝트 규칙 |
| 21 | `preset-general` | 기타 프로젝트 기본 규칙 |

---

## 4. 에이전트 구성 (총 11개)

| # | 에이전트 | 역할 | 호출 시점 |
|---|---------|------|----------|
| 1 | `cto-lead` | 팀 리더. 태스크 분배 + 결과 취합 | L 작업에서 자동 |
| 2 | `code-analyzer` | 기존 코드 분석, 영향 범위 파악 | 모든 작업 시작 시 |
| 3 | `frontend-builder` | UI/페이지 구현 | 프론트엔드 작업 시 |
| 4 | `backend-builder` | API/서비스/DB 구현 | 백엔드 작업 시 |
| 5 | `test-writer` | 테스트 코드 작성 | iron-law에 의해 항상 |
| 6 | `debugger` | 버그 원인 추적 + 수정 | 디버깅 모드 시 |
| 7 | `code-reviewer` | 코드 품질/보안 리뷰 | 리뷰 모드, 완료 전 |
| 8 | `code-simplifier` | 코드 정리/간소화 (리뷰 1차) | 리뷰 파이프라인 1단계 |
| 9 | `deploy-manager` | 배포 절차 관리 | 배포 모드 시 |
| 10 | `doc-writer` | 문서/계획서/보고서 작성 | PDCA 각 단계 |
| 11 | `gap-detector` | 설계 vs 구현 차이 분석 (리뷰 3차) | 리뷰 파이프라인 3단계 |

### 서브에이전트 실행 방식

```
L (대규모) 작업 예시: "결제 기능 추가해줘"

cto-lead (메인)
    ├── impl-a (backend-builder) → worktree: feature/payment-api
    │     └── Task #1: PaymentService 구현
    │     └── Task #2: PaymentController 구현
    ├── impl-b (frontend-builder) → worktree: feature/payment-ui
    │     └── Task #3: 결제 페이지 UI
    │     └── Task #4: 결제 폼 컴포넌트
    └── impl-c (test-writer) → worktree: feature/payment-test
          └── Task #5: 결제 API 테스트
          └── Task #6: 결제 UI 테스트

모든 impl 완료 후:
    ├── [1차] code-simplifier → 코드 정리 + 품질 검사
    ├── [2차] external-reviewer → Codex/ESLint 등 외부 검증 (선택)
    └── [3차] gap-detector → 설계 대비 달성률 확인

최종 → verification → 완료
```

---

## 5. 훅 구성 (총 9개)

| # | 훅명 | 시점 | 동작 |
|---|------|------|------|
| 1 | `auto-detect-hook` | 대화 시작 시 | 사용자 입력 분석 → 모드 자동 선택 |
| 2 | `size-estimate-hook` | 작업 시작 시 | 작업 크기 S/M/L 자동 판단 |
| 3 | `preset-loader` | 프로젝트 진입 시 | package.json/build.gradle 등 감지 → 프리셋 자동 로드 |
| 4 | `branch-auto-create` | 새 작업 시작 시 (M, L) | feature/fix 브랜치 자동 생성 제안 |
| 5 | `pre-commit-verify` | 커밋 전 | 테스트 통과 확인, 린트 검사 |
| 6 | `post-implement-check` | 구현 완료 후 | 설계 대비 달성률 자동 계산 |
| 7 | `review-pipeline` | 구현 완료 후 | code-simplifier → external → gap-detector 순차 실행 |
| 8 | `pdca-state-tracker` | PDCA 각 단계 | 현재 단계 + 진행률 추적 |
| 9 | `completion-guard` | 완료 선언 시 | 검증 증거 없으면 완료 차단 |

---

## 6. 템플릿 구성 (8개)

| # | 템플릿명 | 용도 | 사용 시점 |
|---|---------|------|----------|
| 1 | `plan.md` | 계획서 | PDCA Plan 단계 |
| 2 | `design.md` | 설계서 | PDCA Design 단계 |
| 3 | `check-report.md` | 검증 보고서 | PDCA Check 단계 |
| 4 | `debug-report.md` | 디버깅 보고서 | 디버깅 모드 |
| 5 | `review-checklist.md` | 코드 리뷰 체크리스트 | 리뷰 모드 |
| 6 | `deploy-checklist.md` | 배포 체크리스트 | 배포 모드 |
| 7 | `project-init.md` | 프로젝트 초기 설정 | 프로젝트 시작 모드 |
| 8 | `sprint-summary.md` | 작업 완료 요약 | 모든 작업 종료 시 |

---

## 7. Output Styles (3개)

| 스타일 | 대상 | 특징 |
|--------|------|------|
| `standard` | 기본 | 간결한 결과 위주 |
| `learning` | 학습 | 각 단계마다 "왜 이렇게 하는지" Learning Point 포함 |
| `detailed` | 상세 | 모든 결정 과정, 대안, 트레이드오프까지 보여줌 |

---

## 8. 디렉토리 구조

```
vibecraft/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── core/                    # 핵심 6개
│   │   ├── auto-detect.md
│   │   ├── smart-pdca.md
│   │   ├── iron-law.md
│   │   ├── brainstorming.md
│   │   ├── writing-plans.md
│   │   └── verification.md
│   ├── modes/                   # 모드별 11개
│   │   ├── new-feature.md
│   │   ├── systematic-debugging.md
│   │   ├── project-kickoff.md
│   │   ├── code-review-request.md
│   │   ├── code-review-receive.md
│   │   ├── deploy-guide.md
│   │   ├── team-orchestration.md
│   │   ├── executing-plans.md
│   │   ├── finishing-branch.md
│   │   ├── git-workflow.md
│   │   └── external-reviewer.md
│   └── presets/                 # 프리셋 4개
│       ├── preset-spring.md
│       ├── preset-nextjs.md
│       ├── preset-python.md
│       └── preset-general.md
├── agents/                      # 에이전트 11개
│   ├── cto-lead.md
│   ├── code-analyzer.md
│   ├── frontend-builder.md
│   ├── backend-builder.md
│   ├── test-writer.md
│   ├── debugger.md
│   ├── code-reviewer.md
│   ├── code-simplifier.md
│   ├── deploy-manager.md
│   ├── doc-writer.md
│   └── gap-detector.md
├── hooks/
│   └── hooks.json               # 훅 9개
├── scripts/                     # 훅 실행 스크립트
│   ├── auto-detect.js
│   ├── size-estimate.js
│   ├── preset-loader.js
│   ├── branch-auto-create.js
│   ├── pre-commit-verify.js
│   ├── post-implement-check.js
│   ├── review-pipeline.js
│   ├── pdca-state-tracker.js
│   └── completion-guard.js
├── templates/                   # 템플릿 8개
│   ├── plan.md
│   ├── design.md
│   ├── check-report.md
│   ├── debug-report.md
│   ├── review-checklist.md
│   ├── deploy-checklist.md
│   ├── project-init.md
│   └── sprint-summary.md
├── output-styles/               # Output Style 3개
│   ├── standard.md
│   ├── learning.md
│   └── detailed.md
├── commands/
│   └── vibecraft.md
├── lib/
│   ├── mode-detector.js
│   ├── size-calculator.js
│   └── pdca-state.js
├── docs/plans/
└── CLAUDE.md
```

---

## 9. 사용 예시

### 예시 1: 새 기능 (L 사이즈)
```
나: "결제 기능 만들어줘"

vibecraft:
1. [auto-detect] → 새 기능 모드
2. [smart-pdca] → L 사이즈 → 전체 PDCA
3. [brainstorming] "결제 방식은? (1) 카드 (2) 가상계좌 (3) 둘 다"
4. [writing-plans] 계획서 생성 → "이렇게 진행할게요, 괜찮아요?"
5. [team-orchestration] CTO 팀 구성
   - backend-builder: PaymentService, Controller
   - frontend-builder: 결제 페이지 UI
   - test-writer: 테스트 코드
6. [executing-plans] 서브에이전트 병렬 실행 (각각 worktree)
7. [review-pipeline]
   - 1차: code-simplifier → 코드 정리
   - 2차: external-reviewer → ESLint 검증
   - 3차: gap-detector → 설계 대비 95% 달성
8. [verification] 모든 테스트 통과 확인
9. [finishing-branch] "main에 PR 만들까요?"
```

### 예시 2: 버그 수정 (S 사이즈)
```
나: "로그인 버튼 누르면 에러 나"

vibecraft:
1. [auto-detect] → 디버깅 모드
2. [smart-pdca] → S 사이즈 → PDCA 스킵
3. [systematic-debugging]
   - 에러 로그 확인
   - 원인 추적: onClick 핸들러에서 null 참조
   - 수정: null 체크 추가
4. [verification] 테스트 통과 + 에러 재현 안 됨 확인
5. 완료
```

### 예시 3: 프로젝트 시작 (L 사이즈)
```
나: "Todo 앱 만들자"

vibecraft:
1. [auto-detect] → 프로젝트 시작 모드
2. [smart-pdca] → L 사이즈 → 전체 PDCA
3. [brainstorming] "기술 스택은? (1) Next.js (2) Spring Boot (3) 다른 거"
4. [preset-loader] → preset-nextjs 자동 로드
5. [project-kickoff] 프로젝트 초기 설정
6. [writing-plans] 기능 목록 → 구현 계획
7. [executing-plans] 서브에이전트 병렬 실행
8. [review-pipeline] → [verification] → 완료
```

---

## 10. 구현 우선순위

### Phase 1: 기반 (핵심 스킬 + 자동 감지)
- `auto-detect`, `smart-pdca`, `iron-law`, `verification` 스킬
- `auto-detect-hook`, `size-estimate-hook`, `preset-loader` 훅
- `plugin.json` 완성

### Phase 2: 워크플로우 (모드별 스킬)
- `brainstorming`, `writing-plans`, `new-feature` 스킬
- `systematic-debugging`, `project-kickoff`, `git-workflow` 스킬

### Phase 3: 서브에이전트 + 리뷰
- `executing-plans`, `team-orchestration`, `external-reviewer` 스킬
- 에이전트 11개 전체
- `review-pipeline` 훅

### Phase 4: 완성도
- 나머지 스킬 (code-review, deploy, finishing-branch)
- 템플릿 8개, Output Styles 3개, 프리셋 스킬 4개
- 나머지 훅
