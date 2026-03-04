# vibecraft

**바이브코딩으로 시작해서, 개발자로 성장하는 AI CTO 플러그인**

비개발자도 아이디어만 말하면 AI가 설계부터 구현, 테스트, 배포까지 안내합니다.
무작정 코드만 짜주는 게 아니라, 왜 이렇게 하는지 설명하고, 잘못된 방향은 근거와 함께 바로잡습니다.

---

## 설치

```bash
/plugin marketplace add blacky0511/vibecraft
```

Claude Code에서 위 명령어 한 줄이면 끝입니다.

---

## 핵심 특징

### AI가 리드, 사용자는 방향만 결정

명령어를 외울 필요 없습니다. 자연스러운 한국어로 말하면 AI가 상황을 감지합니다.

```
"로그인 기능 만들어줘"     → 새 기능 워크플로우 자동 시작
"이 에러 좀 봐줘"          → 체계적 4단계 디버깅
"누락률 분석해줘"          → 심층 분석 (교란 변수 탐색 + 인과 검증)
"폰트 크기 좀 키워줘"      → 파일 위치 안내 + 직접 할지 물어봄
"안녕"                     → 사용법 가이드
```

### CTO 마인드셋

"네네" 하면서 다 받아주지 않습니다.

- 좋은 방향 → 근거와 함께 동의
- 나쁜 방향 → 이유 + 대안 제시
- 위험한 요청 → 강하게 경고 후 안전한 방법으로 전환

### 심층 분석 방법론

AI가 1차 결론에서 멈추지 않습니다.

```
1단계: 표면 분석     → 기본 통계, 첫 인상을 "가설"로 기록
2단계: 교란 변수 탐색 → "이 패턴을 만드는 숨은 변수는?" (3개 축 교차 분석)
3단계: 코호트 추적   → 동일 그룹을 시간 축으로 추적
4단계: 인과 검증     → "내 결론이 틀렸다면?" 반증 시도 후 확정
```

### CTO 팀 자동 구성

대규모 작업은 전문 에이전트 팀이 병렬로 처리합니다.

```
L 사이즈 작업 감지
  → 의존성 그래프 자동 구성
  → Wave별 병렬/순차 계산
  → 점수 기반 에이전트 매칭
  → 실패 시 자동 복구 (재시도/재할당/에스컬레이션)
```

### 개발자 성장 지원

매 응답마다 개발 용어, 패턴, 실무 관례를 자연스럽게 알려줍니다.

```
Learning Point [중급]

개념: `컴포넌트(Component)` - 레고 블록처럼 조립할 수 있는 UI 조각

왜?: 한 번 만들어두면 여러 페이지에서 재사용할 수 있어서,
수정할 때 한 곳만 고치면 전체에 반영됩니다.
```

---

## 스킬 구성 (43개)

### 핵심 엔진

| 스킬 | 역할 |
|------|------|
| auto-detect | 말투만으로 모드 자동 감지 + ralph-loop 라우팅 |
| smart-pdca | 작업 크기(S/M/L) 자동 판단 |
| iron-law | 테스트 먼저 + 증거 없이 완료 없다 |
| verification | 완료 전 검증 게이트 |
| cto-mindset | 근거 있는 기술적 의견 제시 |
| session-context | auto-compact 대비 맥락 보존 |

### 워크플로우

| 스킬 | 역할 |
|------|------|
| new-feature | 새 기능 추가 전체 흐름 |
| systematic-debugging | 증거 기반 4단계 디버깅 |
| simple-tweak | 단순 수정은 위치 안내 + DIY 선택 |
| brainstorming | 아이디어 → 설계 |
| writing-plans | 설계 → TDD 구현 계획 |
| executing-plans | 서브에이전트 병렬 실행 |
| team-orchestration | L 사이즈 CTO 팀 자동 구성 + lib/team/ 엔진 연동 |
| project-kickoff | 새 프로젝트 시작 가이드 |
| git-workflow | Git 브랜치/커밋/PR 자동 관리 |
| finishing-branch | 작업 완료 후 브랜치 정리 |

### 분석

| 스킬 | 역할 |
|------|------|
| analysis-delegation | 분석 작업 서브에이전트 위임 (S/M/L 규모별 분기) |
| deep-analysis | 4단계 심층 분석 방법론 (교란 변수 탐색 + 인과 검증) |

### 코드 품질 (CTO 스마트 스킬)

| 스킬 | 역할 |
|------|------|
| impact-analysis | 수정 전 영향 범위 자동 분석 |
| pre-flight-check | 이미 있는 코드/충돌 사전 확인 |
| dependency-auditor | 패키지 설치 전 검증 |
| rollback-strategy | 위험 작업 전 체크포인트 |
| naming-consultant | 모호한 변수명 감지 + 제안 |
| error-message-designer | 사용자 친화적 에러 메시지 |
| consistency-enforcer | 프로젝트 패턴 일관성 감시 |
| refactoring-radar | 코드 복잡도 감지 + 정리 제안 |
| test-strategy-advisor | 뭘 테스트할지 우선순위 가이드 |
| tech-debt-tracker | "나중에 고치자" 기록 + 리마인드 |
| user-empathy-lens | 사용자 시선 UX 점검 |
| doc-autopilot | 코드 변경 시 문서 자동 동기화 |
| skill-progression | 개발 실력 추적 + 설명 수준 조절 |

### 리뷰 & 배포

| 스킬 | 역할 |
|------|------|
| code-review-request | 구조화된 리뷰 요청 |
| code-review-receive | 리뷰 피드백 증거 기반 처리 |
| external-reviewer | ESLint, Prettier 등 외부 도구 연동 |
| deploy-guide | 배포 전 체크리스트 + 단계별 안내 |
| welcome-guide | 인사 시 사용법 가이드 |

### 프리셋 (기술 스택별 자동 적용)

| 스킬 | 대상 |
|------|------|
| preset-nextjs | Next.js (App Router) / TypeScript |
| preset-react | React (Vite, CRA 등 Next.js 제외) |
| preset-spring | Spring Boot / Java |
| preset-python | Python / Flask / Django / FastAPI |
| preset-general | 기타 프로젝트 (범용) |

---

## 에이전트 (12개)

대규모 작업 시 CTO 팀이 자동 구성됩니다. 점수 기반 매칭으로 최적의 에이전트가 선택됩니다.

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| cto-lead | Sonnet | 팀 조율 + 아키텍처 판단 |
| code-analyzer | Opus | 코드 분석 + 영향 범위 파악 |
| code-reviewer | Opus | 코드 리뷰 + 품질 검증 |
| frontend-builder | Sonnet | 프론트엔드 구현 |
| backend-builder | Sonnet | 백엔드 구현 |
| test-writer | Sonnet | 테스트 작성 |
| debugger | Sonnet | 디버깅 |
| data-analyst | Sonnet | 데이터 분석 (deep-analysis 4단계 내재화) |
| code-simplifier | Sonnet | 코드 간소화 |
| gap-detector | Sonnet | 설계-구현 차이 분석 |
| deploy-manager | Haiku | 배포 관리 |
| doc-writer | Haiku | 문서 작성 |

### 분석 모드 에이전트 구성

분석 작업은 규모에 따라 에이전트 구성이 달라집니다.

| 규모 | 실행 방식 |
|------|----------|
| S | data-analyst 1개 (4단계 전체 수행) |
| M | data-analyst 1개 + 중간 보고 (사용자 방향 선택) |
| L | data-analyst 3개 병렬 (시간 축 / 그룹 축 / 반증) + 결과 종합 |

---

## 팀 엔진 (lib/team/)

L 사이즈 작업에서 Claude Code 네이티브 API 위에 지능 계층을 제공합니다.

| 모듈 | 역할 |
|------|------|
| agent-matcher | 점수 기반 에이전트 선택 |
| task-planner | 의존성 그래프 + Wave 계산 |
| progress-tracker | 진행률 추적 + 보고서 |
| error-recovery | 실패 복구 (재시도/재할당/에스컬레이션) |
| report-builder | 한국어 팀 보고서 생성 |
| config | 설정 로더 (vibecraft.team.json 오버라이드) |

---

## Output Style

| 스타일 | 설명 |
|--------|------|
| **vibecraft-learning** | 개발 지식 + 워크플로우 설명 포함 (기본 추천) |
| **vibecraft-standard** | 결과 위주 간결 모드 |

변경: `/output-style` 명령어로 전환

---

## 빠른 시작

설치 후 아무 말이나 해보세요:

```
안녕              → 사용 가이드
블로그 만들자      → 프로젝트 시작
에러 났어         → 디버깅 시작
누락률 분석해줘    → 심층 데이터 분석
리뷰해줘         → 코드 리뷰
```

### 슬래시 명령어

```
/vibecraft       → 플러그인 상태 + 도움말
/vibecraft pdca  → 현재 PDCA 진행 상황
/vibecraft debug → 디버깅 모드 시작
/vibecraft review → 코드 리뷰 시작
```

---

## 요구사항

- Claude Code (CLI)
- Claude Pro / Max 구독 (서브에이전트 사용 시)

---

## 라이선스

MIT

---

**만든 사람**: 앤기브마케팅
**GitHub**: [blacky0511/vibecraft](https://github.com/blacky0511/vibecraft)
