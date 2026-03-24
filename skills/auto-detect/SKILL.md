---
name: auto-detect
description: |
  vibecraft의 핵심 자동 감지 스킬. 모든 대화에서 자동으로 활성화됨.
  사용자 입력을 분석해서 적절한 워크플로우 모드를 자동 선택한다.

  이 스킬은 다른 스킬보다 먼저 실행되어야 함.
  모든 사용자 입력에 대해 상황을 판단하고, 적절한 스킬을 호출하도록 안내.

  Triggers: 모든 대화 시작, 새 작업 요청, 기능 추가, 버그 수정, 프로젝트 시작, 코드 리뷰, 배포
---

# 자동 상황 감지

## 역할

사용자의 입력을 분석하여 아래 모드 중 적절한 것을 자동 선택하고,
해당 모드의 스킬을 **반드시 Skill 도구로** 호출한다.

**중요**: UserPromptSubmit 훅이 `[SYSTEM]` 메시지로 스킬을 지정하면, 반드시 그 스킬을 호출하라.
훅 메시지를 무시하고 직접 답변하지 마라.

## 모드 판별 우선순위

키워드가 여러 모드에 겹칠 때, 아래 우선순위 순서대로 판별한다.
숫자가 낮을수록 먼저 판별한다.

| 우선순위 | 모드 | 판별 기준 | 키워드 (한국어 + 구어체 + 영어) | 호출 스킬 |
|:---:|------|---------|------|------|
| 0 | 환영/인사 | 인사만 단독으로 있을 때 | "안녕", "하이", "헬로", "hi", "hello", "처음", "시작", "뭐 할 수 있어", "도움", "help" | vibecraft:welcome-guide |
| 1 | 단순 수정 | 수치/스타일 1~3줄 변경 | "크기", "간격", "폰트", "색상", "패딩", "마진", "키워줘", "줄여줘", "늘려줘", "굵게", "얇게", "밝게", "어둡게", "바꿔줘", "높이", "너비", "굵기", "투명도", "글자 크기", "배경색", "테두리", "border", "padding", "margin", "font-size", "opacity", "gap", "radius" | vibecraft:simple-tweak |
| 1.5 | 레퍼런스 디자인 | UI/디자인 + 페이지/사이트 동시 | "랜딩페이지", "웹사이트", "홈페이지", "레퍼런스", "참고 사이트", "UI 만들어", "화면 만들어", "사이트 만들어", "landing", "website" | vibecraft:reference-design |
| 2 | 디버깅 | 에러/버그/실패/증상 | "에러", "버그", "오류", "안 돼", "안 되", "안됨", "실패", "크래시", "터져", "깨져", "뻗어", "멈춰", "죽어", "작동 안 해", "동작 안 해", "왜 이래", "왜 이러지", "뭐가 문제", "뭐가 잘못", "고장", "먹통", "무한 루프", "무한 로딩", "Error", "Bug", "Fix", "Crash", "Exception", "TypeError", "Cannot read", "undefined is not", "Traceback", "ENOENT", "stack trace" | vibecraft:systematic-debugging |
| 2.5 | 리서치 | 명시적 조사 요청 | "리서치", "리서치해줘", "조사", "조사해줘", "파악해줘", "살펴봐", "확인해봐", "코드 조사", "구조 파악", "어떻게 되어있", "현재 상태 파악", "아키텍처 파악", "research", "investigate" | vibecraft:research |
| 3 | 분석 | 데이터/DB/통계 분석 | "분석", "분석해줘", "데이터 뽑아", "DB 조회", "쿼리", "통계", "리포트", "집계", "현황", "추출", "로그 분석", "패턴 분석", "트렌드", "비교해줘", "수치", "지표", "대시보드", "엑셀", "CSV", "SQL", "analyze", "report", "metric" | vibecraft:analysis-delegation |
| 4 | 코드 리뷰 | 리뷰/검토/확인 | "리뷰", "검토", "봐줘", "확인해줘", "체크해줘", "괜찮은지", "문제 없는지", "잘 됐는지", "코드 품질", "PR 확인", "머지 전", "review", "check code", "PR" | vibecraft:code-review-request |
| 5 | 배포 | 배포/릴리즈 | "배포", "릴리즈", "서버에 올려", "운영 반영", "프로덕션", "빌드해서 배포", "docker", "deploy", "release", "publish", "staging", "production" | vibecraft:deploy-guide |
| 6 | 새 기능 | 기능 추가/구현 요청 | "만들어줘", "추가해줘", "구현해줘", "넣어줘", "개발해줘", "해줘", "해봐", "하고 싶어", "필요해", "있었으면", "있으면 좋겠", "기능 개발", "기능 추가", "새로운 ~ 만들", "feature", "implement", "create", "build", "add new" | vibecraft:new-feature |
| 7 | 프로젝트 시작 | 새 프로젝트 생성 | "만들자", "시작하자", "시작해보자", "프로젝트 만들", "프로젝트 시작", "새 프로젝트", "처음부터", "앱 만들", "사이트 만들", "init", "scaffold", "boilerplate" | vibecraft:project-kickoff |

## 복수 매칭 판별 규칙

1. **인사 + 작업**: 작업 모드 우선 ("안녕 로그인 만들어줘" → 새 기능)
2. **새 기능 vs 프로젝트 시작**: "~만들자/시작하자"(청유형)는 프로젝트 시작, "~추가해줘/구현해줘"(요청형)는 새 기능. 요청형이라도 프로젝트가 비어있으면(코드 파일 없음) 프로젝트 시작으로 전환. 애매하면 선택지 제시.
3. **디버깅 + 기능 요청**: 디버깅 우선 ("로그인 에러 고쳐줘" → 디버깅)
4. **판별 불가**: 사용자에게 선택지 제시 (최대 4개)

## 트리거 배타 규칙

| 입력 패턴 | 라우팅 | 이유 |
|------|--------|------|
| "리서치해줘", "코드 조사해줘" | research | 명시적 리서치 요청 |
| "분석해줘", "데이터 분석" | analysis-delegation | 데이터/DB 분석 |
| "이 함수 분석해줘" | code-review-request | 코드 이해 목적 |
| "에러 로그 분석해줘" | systematic-debugging | 버그 수정 목적 |
| "버그 원인 찾아줘" | systematic-debugging | 디버깅 |
| "이 코드 봐줘", "검토해줘" | code-review-request | 리뷰 |
| "기능 만들어줘" | new-feature | 내부에서 research 호출 |
| "테스트 작성해줘" | new-feature | test-writer 에이전트 활용 |
| "프론트 만들어줘" | new-feature | frontend-builder 에이전트 활용 |
| "API 만들어줘" | new-feature | backend-builder 에이전트 활용 |

## 감지 후 행동: 신뢰도 기반 분기

### 신뢰도 판정 기준

**높음 (바로 실행):**
- 키워드가 1개 모드에만 명확히 매칭
- 맥락과 키워드가 일치
- 우선순위 규칙으로 명확히 결정 가능
- UserPromptSubmit 훅이 `[SYSTEM]` 메시지를 출력한 경우 → **항상 높음**

**낮음 (선택지 제시):**
- 키워드가 2개 이상 모드에 걸침
- 키워드는 있지만 의도가 불명확
- 모드별 키워드에 해당하지 않는 표현

### 신뢰도별 행동 흐름

```
사용자 입력
    │
    ▼
[UserPromptSubmit 훅] — [SYSTEM] 메시지로 스킬 지정
    │
    ▼
[SYSTEM] 메시지가 있으면 → 해당 스킬을 Skill 도구로 즉시 호출
[SYSTEM] 메시지가 없으면 → 아래 자체 판별 진행
    │
    ├── 신뢰도 높음 ──→ 모드 안내 + 바로 스킬 호출
    │                    + ralph-loop/에이전트팀 적합 시 제안
    │
    └── 신뢰도 낮음 ──→ 후보 모드 + 선택지 제시 (최대 4개)
```

### 신뢰도 높음 → 바로 실행

1. 모드를 판별한다
2. **스킬 맵에서 해당 모드의 핵심 스킬을 확인한다**
3. ralph-loop / 에이전트팀 적합 여부를 판단한다
4. 사용자에게 감지된 모드를 알린다
5. vibecraft:smart-pdca 스킬을 호출하여 작업 크기를 판단한다
6. 크기에 따라 적절한 워크플로우를 실행한다

### 신뢰도 낮음 → 선택지 제시

후보 모드를 분석하여, **해당 입력에 관련 있는 모드만** 선택지로 제시한다.

**예시 1**: "이 데이터 좀 봐줘"

```
이 요청을 어떤 방식으로 처리할까요?

1. 데이터 분석 — 통계, 패턴, 원인을 찾고 싶다 → /analyze
2. 디버깅 — 데이터가 이상해서 원인을 고치고 싶다 → /debug
3. 코드 리뷰 — 데이터 처리 코드를 검토하고 싶다 → /review
```

**예시 2**: "이거 좀 고쳐줘"

```
이 요청을 어떤 방식으로 처리할까요?

1. 디버깅 — 에러/버그를 찾아서 수정 → /debug
2. 단순 수정 — 값이나 스타일만 바꾸기
3. 새 기능 — 기존 기능을 개선/확장 → /feature
```

**선택지 구성 규칙:**
- 최대 4개까지만 제시
- 각 선택지에 관련 명령어를 함께 안내
- 가장 가능성 높은 모드를 1번에 놓는다
- 사용자가 선택하면 해당 모드로 즉시 진입

## 에이전트 암묵적 트리거

특정 작업 요청 시 적합한 에이전트를 자동으로 매칭한다:

| 키워드 | 추천 에이전트 |
|--------|-------------|
| "테스트 작성/추가", "TDD", "단위 테스트", "E2E" | test-writer |
| "프론트엔드", "UI 만들어", "컴포넌트", "화면", "CSS" | frontend-builder |
| "API 만들어", "백엔드", "서버", "엔드포인트", "DB 연동" | backend-builder |
| "디버그", "디버깅", "원인 찾아", "추적" | debugger |
| "리뷰", "코드 검토", "PR 확인" | code-reviewer |
| "데이터 분석", "쿼리", "통계", "집계", "SQL" | data-analyst |

## Ralph Loop 판단 + 라우팅

ralph-loop은 독립 모드가 아니라, 기존 모드 위에 얹히는 **반복 실행 방식**이다.
명령어: `/ralph`

### ralph-loop 자연어 트리거 키워드

**UserPromptSubmit 훅이 아래 패턴을 감지하면 `[ralph-loop 제안]` 메시지를 출력한다.**
이 메시지가 보이면 **반드시** 사용자에게 ralph-loop 선택지를 제시하라.

| 패턴 유형 | 키워드 예시 |
|-----------|-----------|
| 명시적 요청 | "ralph-loop으로 해줘", "랄프 루프" |
| 일괄 수정 | "전부 고쳐줘", "다 수정해줘", "싹 잡아줘", "일괄 수정", "하나도 남기지 마" |
| N개 수정 | "에러 15개 고쳐줘", "3개 실패 잡아줘" |
| 전체 통과 | "테스트 전부 통과시켜줘", "빌드 100% 성공시켜", "tsc 에러 다 잡아" |
| 에러 0개 | "에러 0개로 만들어줘", "경고 없이 해줘" |
| 반복 수정 | "하나씩 고쳐줘", "반복 수정해줘", "계속 돌려서 고쳐줘" |

### ralph-loop 적합 조건 (3가지 모두 충족)

1. **완료 기준이 명확**: 검증 명령어가 존재하거나 정의 가능
2. **반복 개선형**: 여러 번 수정-확인이 필요
3. **실패 항목이 독립적**: 각 실패를 개별적으로 수정 가능

### ralph-loop 판단 시점

| 시점 | 조건 | 제안 문구 |
|------|------|----------|
| **UserPromptSubmit [ralph-loop 제안] 감지** | 훅이 패턴 매칭 | **반드시** "ralph-loop으로 자동 반복 수정할까요?" 선택지 제시 |
| 모드 판별 직후 | 적합 조건 3가지 충족 | "ralph-loop으로 반복 수정하면 효율적입니다. ralph-loop으로 진행할까요?" |
| verification 실패 시 | 실패 항목 2개 이상 | "N개 실패가 발견됐습니다. ralph-loop으로 자동 수정할까요?" |
| 사용자 직접 요청 | "ralph-loop으로 해줘", `/ralph` | 즉시 ralph-loop 실행 방식으로 전환 |

## 에이전트팀 제안

작업 범위가 넓고(6파일+) 병렬 처리 가능하면 에이전트팀을 제안한다.

## 모드별 활성 스킬 맵

| 모드 | 핵심 스킬 | 보조 스킬 |
|------|----------|----------|
| 환영/인사 | welcome-guide | - |
| 단순 수정 | simple-tweak | - |
| 리서치 | research, smart-pdca | session-context |
| 분석 | analysis-delegation | session-context |
| 레퍼런스 디자인 | reference-design, smart-pdca, iron-law, verification | writing-plans, team-orchestration |
| 새 기능 (S) | smart-pdca, iron-law, verification | impact-analysis |
| 새 기능 (M) | smart-pdca, iron-law, research, writing-plans, executing-plans, team-orchestration, verification | impact-analysis, pre-flight-check, git-workflow |
| 새 기능 (L) | smart-pdca, iron-law, research, brainstorming, writing-plans, team-orchestration, executing-plans, verification | impact-analysis, pre-flight-check, naming-consultant, test-strategy-advisor, git-workflow |
| 디버깅 | systematic-debugging, iron-law, verification | session-context |
| 코드 리뷰 | code-review-request, code-review-receive | external-reviewer, consistency-enforcer |
| 배포 | deploy-guide | rollback-strategy |
| ralph-loop | team-orchestration, verification | smart-pdca, iron-law |
| 프로젝트 시작 | project-kickoff, brainstorming, smart-pdca, iron-law, writing-plans, executing-plans, verification | dependency-auditor, naming-consultant, git-workflow |

**항상 활성화**: cto-mindset, session-context

**프리셋**: preset-nextjs / preset-react / preset-spring / preset-python / preset-general

## 사용 가능한 명령어 (항상 참조)

| 명령어 | 용도 |
|--------|------|
| `/feature` | 새 기능 추가 |
| `/debug` | 디버깅 |
| `/research` | 코드 리서치 |
| `/brainstorm` | 아이디어 설계 |
| `/plan` | 구현 계획 작성 |
| `/execute` | 계획 실행 |
| `/verify` | 검증 |
| `/review` | 코드 리뷰 |
| `/deploy` | 배포 |
| `/kickoff` | 프로젝트 시작 |
| `/analyze` | 데이터 분석 |
| `/simplify` | 코드 정리 |
| `/team` | 에이전트팀 |
| `/pdca` | RPDCA 상태 |

## 모델 추천

현재 모델과 추천 모델이 다를 때만 안내한다.

## 중요 규칙

- **UserPromptSubmit 훅의 [SYSTEM] 메시지를 최우선으로 따른다**
- 모드 판별은 한국어 키워드 우선, 영어도 보조 지원
- 판별 결과를 사용자에게 항상 알려서, 잘못된 판별이면 수정 가능
- 단순한 질문이나 대화에는 모드를 강제하지 않는다
- ralph-loop 제안은 강요가 아닌 선택지 제공
