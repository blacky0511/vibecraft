# 하네스 엔지니어링 기법 리서치 — vibecraft 적용 방안

> **목적**: Claude Code의 품질을 극대화하기 위한 하네스 엔지니어링 기법을 체계적으로 정리하고, vibecraft 플러그인에 적용할 수 있는 구체적 개선 방안을 도출한다.
> **날짜**: 2026-04-13
> **현재 버전**: vibecraft v2.0.12

---

## 1. 하네스 엔지니어링이란

### 1-1. 정의

Martin Fowler의 공식: **Agent = Model + Harness**

하네스(Harness)는 모델을 제외한 에이전트의 모든 구성요소를 의미한다. 코딩 에이전트 맥락에서는 "에이전트가 처음부터 올바른 결과를 생성하고, 실수하면 자동으로 수정되며, 사용자의 검토 부담을 줄이는 제어 시스템"이다.

Mitchell Hashimoto(HashiCorp 창업자)의 정의:
> "하네스 엔지니어링은 에이전트가 실수할 때마다 해당 실수를 다시 반복하지 않도록 솔루션을 설계하는 실천."

Hashimoto가 제시한 **하네스 엔지니어링의 2가지 형태:**
1. **규칙 추가**: AI가 실수할 때마다 그 실수를 방지하는 규칙을 문서(CLAUDE.md)에 추가 → "이것만으로도 거의 문제가 해결된다"
2. **도구 제공**: AI에게 검증 도구(테스트, 린터, 브라우저 자동화 등)를 만들어서 제공

### 1-2. $9 vs $200 — 환경이 결과를 결정한다

Anthropic이 2026년 3월 공식 블로그에서 발표한 실험 결과 (출처: gymcoding):

| 조건 | 비용 | 시간 | 결과 |
|------|------|------|------|
| 하네스 없이 | $9 | 20분 | 캐릭터는 나오지만 조작 안 됨. 겉만 그럴듯한 앱 |
| 하네스 설계 후 | $200 | 6시간 | 완성된 레트로 게임 메이커 |

**같은 모델**이다. 달라진 건 **환경뿐**이다. 하네스 설계에 포함된 것:
- 구체적인 스펙을 코드 작성 전에 세움
- 완료 기준을 사전 합의
- 결과물을 실제 브라우저에서 자동 테스트하는 구조

> **시사점**: vibecraft의 RPDCA 워크플로우(Research → Plan → Do → Check → Act)가 바로 이 "하네스 설계"에 해당한다. 계획 없이 코드를 바로 작성하면 $9 패턴이 되고, RPDCA를 따르면 $200 패턴이 된다.

### 1-3. AI의 3가지 실패 패턴 (하네스가 필요한 이유)

Anthropic이 공식 블로그에서 밝힌 AI 에이전트의 구조적 실패 패턴:

**실패 1: 세션 간 기억 소실**
- 새 대화가 시작하면 이전 대화에서 뭘 했는지 전혀 기억 못함
- 비유: "교대 근무 엔지니어가 이전 담당자가 뭘 했는지 모르는 채로 출근하는 것"
- 결과: 절반밖에 안 됐는데 "이미 다 됐네" 하고 끝내버림
- **대응**: CLAUDE.md + session.md + 메모리 시스템 (vibecraft에서 이미 구현)

**실패 2: 컨텍스트 위축(Context Atrophy)**
- 긴 작업 중 컨텍스트 윈도우가 차오르면 일관성을 잃음
- 할 일이 남았는데도 AI가 스스로 작업을 조기 종료
- **대응**: 컴팩션 대응 훅 + 세션 상태 보존 (vibecraft의 PreCompact 훅)

**실패 3: 자기 평가 편향(Self-evaluation Bias)** ← 가장 교묘한 문제
- **자기가 만든 결과물을 자기가 평가하면 무조건 잘했다고 한다**
- 사람이 보기에 품질이 명백히 떨어져도 "자신있게 칭찬"하는 경향
- 문제를 찾아놓고도 "별거 아니다"라고 넘겨버림
- **대응**: 만드는 AI와 검증하는 AI를 구조적으로 분리 (Generator/Evaluator 분리)
- vibecraft의 plan-critic(계획 비판), gap-detector(코드 검증), code-reviewer(코드 리뷰)가 이 원칙을 이미 적용 중

> **핵심 교훈**: "코드를 만드는 에이전트에게 비판적으로 봐라고 시키는 것"보다 "아예 검증 전문 에이전트를 따로 두는 것"이 훨씬 효과적이다.

### 1-4. 프롬프트 엔지니어링과의 차이

| 관점 | 프롬프트 엔지니어링 | 하네스 엔지니어링 |
|------|-------------------|-------------------|
| **범위** | 모델 입력 최적화 | 전체 에이전트 시스템 설계 |
| **대상** | 한 번의 상호작용 | 지속적인 제어 시스템 |
| **제어 방식** | 텍스트 지시만 | 텍스트 + 코드 + 도구 + 피드백 루프 |
| **신뢰도** | LLM 의존 (비결정적) | 결정론적 + 추론적 혼합 |
| **적용 시점** | 요청 시 | 항상 (매 세션, 매 도구 호출) |

### 1-3. 하네스의 구성요소

| 구성요소 | 역할 | Claude Code 대응 | vibecraft 현황 |
|---------|------|------------------|---------------|
| 에이전트 파일 | 사전 지시/규칙 | CLAUDE.md | O (14,000자+) |
| 스킬 | 재사용 워크플로우 | skills/ | O (19개) |
| 서브에이전트 | 컨텍스트 격리 위임 | agents/ | O (14개) |
| 훅 | 결정론적 자동화 | hooks.json + scripts/ | O (13개 스크립트) |
| MCP 서버 | 외부 도구 연동 | .mcp.json | O (Codex MCP) |
| Output Styles | 응답 포맷 제어 | output-styles/ | O (2개) |
| 명령어 | 사용자 인터페이스 | commands/ | O (20개) |
| 백프레셔 | 자체 검증 도구 | 테스트/린터/타입체커 | △ (프로젝트 의존) |

### 1-4. 핵심 원칙

1. **피드포워드(Feedforward)**: 실수 전에 예방 (CLAUDE.md 규칙, PreToolUse 차단)
2. **피드백(Feedback)**: 실수 후 자동 수정 (PostToolUse 검증, Stop 훅 검사)
3. **결정론적 제어 우선**: LLM 판단에 의존하기보다 코드로 강제 (훅 > 프롬프트 지시)
4. **Generator/Evaluator 분리**: 만드는 AI와 검증하는 AI를 구조적으로 분리
5. **Ashby의 법칙**: "조절기는 조절 대상 시스템만큼의 다양성을 가져야 한다"
6. **하네스 진화 원칙**: 모델이 발전하면 불필요한 규칙은 제거한다 (아래 1-5 참조)

### 1-5. "부탁 vs 강제" — 제어 수단의 스펙트럼

하네스의 각 구성요소는 **강제력의 정도**가 다르다 (출처: gymcoding):

```
부탁(맥락)                                              강제(차단)
  ←─────────────────────────────────────────────────────→
  
  CLAUDE.md 규칙    스킬 프롬프트    퍼미션 설정    훅(exit 2)
  "~해주세요"       "~하세요"       "못하게 막음"   "자동 차단"
  (안 지킬 수 있음) (대부분 따름)   (우회 불가)     (우회 불가)
```

| 수단 | 성격 | 예시 |
|------|------|------|
| CLAUDE.md | **부탁** — AI가 읽고 판단하여 따름. 안 지킬 수 있음 | "테스트 후 커밋하세요" |
| 스킬 프롬프트 | **강한 부탁** — 스킬 실행 중에는 대부분 따름 | "6단계 디버깅 절차를 따르세요" |
| 퍼미션 설정 | **강제** — AI가 우회할 수 없음 | "rm -rf 실행 자체 불가" |
| 훅 (exit 2) | **강제** — bypassPermissions에서도 차단됨 | "git push --force 자동 차단" |

> **vibecraft에 적용**: "증거 없이 완료 없다"가 CLAUDE.md에만 있으면 **부탁** 수준. Stop 훅(prompt 타입)으로 옮기면 **강제** 수준이 된다. 중요한 규칙일수록 오른쪽(강제)으로 이동시켜야 한다.

### 1-6. 하네스 진화 원칙 — 모델이 좋아지면 규칙을 줄인다

하네스에 적어둔 규칙 하나하나는 "AI 모델이 이걸 혼자 못 한다"는 가정이다. 모델은 계속 발전하므로 그 가정이 아직 유효한지 주기적으로 확인해야 한다 (출처: gymcoding).

**실제 사례**: Anthropic은 Opus 4.6 출시 후 기존 하네스에서 **sprint 구조를 통째로 제거**했다. 모델이 좋아지면서 그 제약이 더 이상 필요 없어진 것이다.

**원칙:**
- 모델이 좋아져서 규칙이 필요 없어지면 → **지운다**
- 새로운 실패 패턴이 생기면 → **바로 추가한다**
- 하네스는 고정된 설계가 아니라 **모델과 함께 진화하는 살아있는 시스템**이다

> **vibecraft에 적용**: 정기적으로 CLAUDE.md와 훅 규칙을 점검하여, 최신 모델이 자연스럽게 따르는 규칙은 제거하고 새로운 실패 패턴에 대한 규칙은 추가하는 "하네스 위생(Harness Hygiene)" 프로세스가 필요하다.

---

## 2. CLAUDE.md 최적화 기법

### 2-1. 토큰 예산의 현실

- Frontier LLM이 일관성 있게 따를 수 있는 지시문: 약 **150~200개**
- Claude Code 시스템 프롬프트가 이미 ~50개 지시문 포함
- 지시문이 늘어나면 "뒤쪽만 무시"가 아니라 **전체적으로 품질 저하**
- Gold standard: **300줄 미만**, **2,000 토큰 이하**
- HumanLayer 사례: 60줄 이하로도 충분

> **vibecraft 현황**: CLAUDE.md가 14,000자+ (약 300줄 이상). AI 행동 규칙, 코딩 규칙, UI 워크플로우, Git 전략 등이 모두 포함되어 있어 토큰 예산 초과 위험이 있다.

### 2-2. 점진적 공개(Progressive Disclosure) 패턴

CLAUDE.md에는 포인터만 두고, 상세 내용은 별도 파일로 분리하는 방식.

```
# CLAUDE.md (간결)
## AI 행동 규칙
Iron Law, Evidence First, CTO 마인드셋 → 상세: docs/rules/ai-behavior.md

## 프론트엔드 UI 개발 워크플로
5단계 순서, 컴포넌트 관리 → 상세: docs/rules/frontend-workflow.md
```

핵심: "이메일에 링크"를 넣지, "2000페이지 직원 핸드북"을 붙이지 않는다.

**포인터 참조 규칙:**
- 1단계 깊이만 유지 (CLAUDE.md → rules/file.md). 중첩 참조 금지.
- Claude가 이미 아는 것(일반 프로그래밍 원칙 등)은 설명하지 않음
- 코드 스니펫 대신 파일:라인 참조 사용

### 2-3. WHY-WHAT-HOW 구조

| 구성 | 내용 | 예시 |
|------|------|------|
| **WHAT** | 기술 스택, 프로젝트 구조 | "모노레포, Next.js + Spring Boot" |
| **WHY** | 프로젝트 목적, 설계 의도 | "입문자용 바이브코딩 최적화" |
| **HOW** | 작업 방법, 검증 방식 | "빌드/테스트 명령어, 검증 절차" |

### 2-4. Positive vs Negative Instruction

- **Positive** (이렇게 해라)가 일반적으로 더 효과적
- **Negative** (하지 마라)는 위험한 동작 차단에만 사용
- 단, negative만 있고 대안이 없으면 모델이 혼란

```markdown
# 좋은 예
- 테스트 실행 후 커밋한다 (positive + specific)
- git push --force 사용 금지. 대신 --force-with-lease 사용 (negative + alternative)

# 나쁜 예
- 테스트 없이 커밋하지 마라 (negative only, 대안 없음)
```

### 2-5. 조건부 규칙의 함정

조건부 규칙이 많으면 모든 지시문의 적용률이 떨어진다. 보편적 규칙은 CLAUDE.md에, 조건부 로직은 **훅이나 스킬로 분리**하는 것이 더 효과적이다.

> **vibecraft에 적용**: "S(선택)/M·L(필수)" 같은 조건부 규칙은 CLAUDE.md보다 `new-feature` 스킬 안에 넣는 것이 더 효과적. CLAUDE.md는 "항상 적용"되는 핵심 규칙만 유지.

---

## 3. 훅(Hooks) 엔지니어링

### 3-1. 훅 이벤트 전체 목록 (2026년 기준, 24종)

vibecraft가 현재 사용 중인 것을 ★로 표시:

| 이벤트 | 발화 시점 | 매처 대상 | vibecraft |
|--------|----------|----------|-----------|
| SessionStart | 세션 시작/재개 | startup, resume, clear, compact | ★ |
| UserPromptSubmit | 프롬프트 제출 시 | 없음 (항상) | ★ |
| PreToolUse | 도구 실행 전 (차단 가능) | 도구 이름 | ★ |
| PermissionRequest | 권한 다이얼로그 표시 시 | 도구 이름 | |
| PermissionDenied | 도구가 거부된 후 | 도구 이름 | |
| PostToolUse | 도구 성공 후 | 도구 이름 | ★ |
| PostToolUseFailure | 도구 실패 후 | 도구 이름 | |
| Notification | 알림 전송 시 | permission_prompt 등 | |
| SubagentStart | 서브에이전트 생성 시 | 에이전트 타입 | |
| SubagentStop | 서브에이전트 종료 시 | 에이전트 타입 | |
| TaskCreated | 태스크 생성 시 | 없음 | |
| TaskCompleted | 태스크 완료 시 | 없음 | ★ |
| Stop | 응답 완료 시 | 없음 | ★ |
| StopFailure | API 에러로 턴 종료 시 | 에러 타입 | |
| TeammateIdle | 팀 멤버 유휴 시 | 없음 | ★ |
| InstructionsLoaded | CLAUDE.md 로드 시 | 로드 이유 | |
| ConfigChange | 설정 파일 변경 시 | 설정 소스 | |
| CwdChanged | 작업 디렉토리 변경 시 | 없음 | |
| FileChanged | 감시 파일 변경 시 | 파일명 | |
| WorktreeCreate | worktree 생성 시 | 없음 | |
| WorktreeRemove | worktree 제거 시 | 없음 | |
| PreCompact | 컴팩션 직전 | manual, auto | ★ |
| PostCompact | 컴팩션 완료 후 | manual, auto | |
| SessionEnd | 세션 종료 시 | 종료 이유 | |

> **미사용 훅 13개**. 이 중 활용 가치가 높은 것: PermissionRequest, PostToolUseFailure, SubagentStop, FileChanged, PostCompact, SessionEnd

### 3-2. 훅 타입 4가지

| 타입 | 설명 | 사용 시점 | vibecraft |
|------|------|----------|-----------|
| `command` | 셸 명령어 실행 | 결정론적 검증 | ★ (전부) |
| `prompt` | 단일 턴 LLM 평가 | 판단 필요한 검증 | 미사용 |
| `agent` | 멀티턴 서브에이전트 | 파일 검사/테스트 실행 | 미사용 |
| `http` | HTTP 엔드포인트 POST | 외부 서비스 연동 | 미사용 |

> **핵심 발견**: vibecraft는 `command` 타입만 사용 중. `prompt`와 `agent` 타입을 활용하면 "LLM이 판단하는 검증"을 훅 레벨에서 강제할 수 있다.

### 3-3. 종료 코드의 의미

| Exit Code | 의미 | 동작 |
|-----------|------|------|
| 0 | 허용 | stdout이 컨텍스트에 주입됨 |
| 2 | 차단 | stderr가 Claude에게 피드백, 도구 실행 중단 |
| 기타 | 허용 | 에러 로그만 기록 |

중요: PreToolUse의 exit 2는 `bypassPermissions` 모드에서도 적용됨 (훅이 권한보다 강함).

### 3-4. 핵심 훅 패턴 8가지

**패턴 1: 위험 명령어 차단 (PreToolUse + command)**
```javascript
// vibecraft git-safety-guard.js 패턴 — 이미 구현됨
const DANGEROUS = /git\s+(push\s+--force|reset\s+--hard|clean\s+-f)/;
if (DANGEROUS.test(command)) {
  process.stderr.write('위험한 명령어 차단됨');
  process.exit(2);
}
```

**패턴 2: 파일 보호 (PreToolUse + command)**
```javascript
// .env, package-lock.json 등 보호 대상 파일 수정 차단
const PROTECTED = ['.env', 'package-lock.json', '.git/'];
if (PROTECTED.some(p => filePath.includes(p))) {
  process.exit(2);
}
```

**패턴 3: 자동 포매팅 (PostToolUse + command)**
```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "npx prettier --write \"$FILE_PATH\""
    }]
  }]
}
```

**패턴 4: 의도 감지 + 스킬 라우팅 (UserPromptSubmit + command)**
vibecraft의 `user-prompt-handler.js`가 대표 사례. 15가지+ 패턴으로 의도 분석 → 스킬 호출 지시 주입.

**패턴 5: 컨텍스트 복원 (SessionStart:compact + command)**
```javascript
// compact 후 RPDCA 상태 + 현재 작업 맥락 복원
// vibecraft context-compaction.js가 이미 구현
```

**패턴 6: 완료 품질 검증 (Stop + prompt 타입)** ← 신규 기법
```json
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "방금 완료된 작업을 검토하라. 테스트가 실행되었는가? 증거가 제시되었는가? 빠진 것이 있으면 {\"decision\": \"block\", \"reason\": \"이유\"} 형식으로 응답하라."
    }]
  }]
}
```
prompt 타입은 LLM이 판단하므로 "증거 없이 완료 없다" 규칙을 CLAUDE.md 지시가 아닌 **결정론적 게이트**로 강제할 수 있다.

**패턴 7: 서브에이전트 완료 시 품질 검증 (SubagentStop + agent 타입)** ← 신규 기법
```json
{
  "SubagentStop": [{
    "hooks": [{
      "type": "agent",
      "prompt": "서브에이전트가 작성한 코드를 검토하라. 린트 에러, 미사용 임포트, 하드코딩된 값이 있는지 확인하라.",
      "timeout": 60
    }]
  }]
}
```

**패턴 8: 도구 입력 재작성 (PreToolUse + updatedInput)** ← 신규 기법
v2.0.10+에서 PreToolUse 훅이 도구 입력을 수정 가능. dry-run 플래그 자동 추가, 시크릿 삭제, 경로 보정 등.

### 3-5. 훅 설계 원칙

1. **성공: 무음** — 컨텍스트 오염 방지. stdout은 최소화.
2. **실패: 에러만 표시** — 최소한의 피드백.
3. **타임아웃 주의** — 대부분 3~5초. 무거운 검증은 Stop 훅(10초+)에서.
4. **여러 훅 충돌 시** — 가장 제한적인 결과가 선택됨.

---

## 4. 스킬/에이전트 프롬프트 최적화

### 4-1. description이 가장 중요한 필드

Claude가 100개+ 스킬 중 하나를 선택해야 할 때, description이 유일한 판단 기준이다.

```yaml
# 좋은 description
description: "Extract text and tables from PDF files, fill forms, merge documents.
  Use when working with PDF files or when the user mentions PDFs."

# 나쁜 description
description: "Helps with documents"
```

**작성 규칙:**
- 3인칭으로 작성 ("Processes Excel files", "I can help" 금지)
- "무엇을 하는가" + "언제 사용하는가" 모두 포함
- 구체적 키워드 포함 (트리거 매칭용)
- 1024자 이내

### 4-2. 점진적 공개 패턴

```
skill-folder/
├── SKILL.md          # 메인 (항상 로드됨)
├── ADVANCED.md       # 필요시만 로드
├── reference.md      # 필요시만 로드
└── scripts/
    └── analyze.py    # 실행됨 (컨텍스트 미소비)
```

핵심: 참조 파일은 **1단계 깊이**만. 중첩 참조(SKILL.md → advanced.md → details.md)는 Claude가 부분 읽기를 해서 정보를 놓칠 수 있다.

### 4-3. 에이전트 frontmatter 최적화

```yaml
---
name: code-analyzer
model: sonnet              # 작업 특성에 맞는 모델
allowedTools:              # 도구를 제한하면 컨텍스트 절약 + 실수 방지
  - Read
  - Grep
  - Glob
maxTurns: 20               # 폭주 방지 (필수 권장)
permissionMode: plan       # 최소 권한
---
```

**모델 선택 전략 (비용/품질 균형):**

| 모델 | 용도 | 비용 |
|------|------|------|
| Haiku | 빠른 탐색, 단순 문서 작성 | 최저 |
| Sonnet | 일상 개발, 코드 구현, 테스트 | 중간 |
| Opus | 아키텍처 설계, 복잡한 디버깅, 보안 분석, 계획 리뷰 | 최고 |

> **vibecraft 현황**: 모델 배정은 이미 잘 되어 있음. 다만 `allowedTools`와 `maxTurns`를 명시적으로 설정하지 않는 에이전트가 대부분.

### 4-4. 서브에이전트 = 컨텍스트 방화벽

```
부모 에이전트 (Opus) — 계획/오케스트레이션
  ↓ 프롬프트 (맥락 추출, 경로 명시, 성공 기준)
  서브에이전트1 (Sonnet) — 탐색 작업
  ↓ 응축 결과만 반환
  서브에이전트2 (Haiku) — 단순 검색
  ↓
부모 스레드 유지 (깨끗한 컨텍스트)
```

핵심: 중간 도구 호출, grep 결과 등의 노이즈가 부모 컨텍스트에 축적되지 않는다. 각 MCP 서버가 10~20K 토큰의 도구 설명을 추가하므로, 서브에이전트마다 **필요한 도구만 허용**해야 한다.

---

## 5. 컨텍스트 관리 기법

### 5-1. 컨텍스트 윈도우의 현실

- 1M 컨텍스트 윈도우가 Opus 4.6/Sonnet 4.6에서 GA
- 버퍼: ~33,000 토큰 (16.5%) — 하드코딩
- 컴팩션 트리거: 사용량이 ~83.5%에 도달 시
- 1M 기준 컴팩션 전까지 약 5배의 작업 공간

### 5-2. 컨텍스트 부패(Context Rot) 문제

"모델은 컨텍스트 길이가 길수록 성능 저하" (Chroma 연구). 관련성 낮은 정보는 "디스트랙션" 효과를 배가시킨다. 더 큰 컨텍스트 윈도우는 "더 큰 건초더미"를 만들어 바늘 찾기를 어렵게 한다.

> **시사점**: vibecraft의 CLAUDE.md가 14,000자+이면 매 턴마다 무관한 규칙이 컨텍스트를 차지. 점진적 공개로 분리해야 할 핵심 이유.

### 5-3. 컴팩션 대응

**현재 vibecraft의 접근 (PreCompact 훅):**
- `context-compaction.js`가 docs/plans/ 스캔 → RPDCA 상태 요약 → additionalContext 주입
- session.md를 compact 후에 읽어 맥락 복구

**추가 가능한 기법:**
1. **PostCompact 훅 활용**: compact 완료 후 "이전 대화에서 합의된 설계 결정" 목록을 주입
2. **50% 선제적 compact**: 자동 컴팩션보다 수동 compact + 구조화된 복구가 품질 우수
3. **Session Memory (2026년 GA)**: 백그라운드 지속 요약으로 컴팩션 즉시 처리 — 별도 구현 불필요할 수 있음

### 5-4. .claudeignore 활용

.gitignore와 동일 문법. Claude가 볼 수 없으면 토큰을 사용하지 않으므로, 가장 높은 레버리지 조치 중 하나.

> **vibecraft에 적용**: 플러그인 자체에는 .claudeignore 필요 없지만, 사용자 프로젝트에 .claudeignore 생성을 안내하는 스킬/가이드가 유용할 수 있음.

---

## 6. 품질 게이트 패턴

### 6-1. 피드포워드(Feedforward) — 행동 전 예방

| 게이트 | 구현 | vibecraft 현황 |
|--------|------|---------------|
| 아키텍처 규칙 | CLAUDE.md | O |
| 계획 강제 | PreToolUse(Write) 훅 | O (pre-write-guard.js) |
| 위험 명령어 차단 | PreToolUse(Bash) 훅 | O (git-safety-guard.js) |
| 커밋 전 검증 | PreToolUse(Bash) 훅 | O (commit-guard.js) |
| 파일 보호 | PreToolUse(Write/Edit) 훅 | X (미구현) |
| 도구 입력 보정 | PreToolUse + updatedInput | X (미구현) |

### 6-2. 피드백(Feedback) — 행동 후 수정

| 게이트 | 구현 | vibecraft 현황 |
|--------|------|---------------|
| 코드 포매팅 | PostToolUse(Edit) 훅 | X (프로젝트 의존) |
| 스킬 체이닝 | PostToolUse(Skill) 훅 | O (skill-post.js) |
| 완료 증거 요구 | Stop 훅 | △ (CLAUDE.md 규칙만, 강제 아님) |
| gap-detector | 서브에이전트 | O |
| 서브에이전트 출력 검증 | SubagentStop 훅 | X (미구현) |
| 도구 실패 분석 | PostToolUseFailure 훅 | X (미구현) |

### 6-3. Evidence First → 훅으로 강화

현재 vibecraft의 "증거 없이 완료 없다"는 CLAUDE.md 규칙으로만 존재한다. LLM이 이 규칙을 무시할 수 있다.

**훅으로 강제하는 방법:**
```json
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "이 턴에서 코드 수정이 있었는가? 있었다면 테스트 실행, 동작 확인, 로그 중 하나의 증거가 제시되었는가? 증거 없으면 {\"decision\": \"block\", \"reason\": \"증거 부족\"} 반환.",
      "timeout": 10
    }]
  }]
}
```

이렇게 하면 CLAUDE.md 규칙을 무시해도 **훅이 응답 완료를 차단**한다.

---

## 7. 워크플로우 오케스트레이션

### 7-1. 멀티 에이전트 협업 패턴

Stripe 사례: 주당 1,300개 AI PR — 서브에이전트가 "컨텍스트 방화벽" 역할.

**vibecraft의 팀 엔진 (lib/team/):**
- agent-matcher.js: 점수 기반 에이전트 선택 (능력 + 부하 + 비용)
- task-planner.js: 의존성 그래프 + Wave 계산
- error-recovery.js: 재시도 → 재할당 → 에스컬레이션

### 7-2. Check-Act 자동 루프

```
Do 완료
  → gap-detector (Opus): plan.md vs 실제 코드 비교
  → Match Rate 계산
  → 90%+: 통과
  → 90%-: Gap 목록 기반 자동 수정 → 재검증 (최대 M:2, L:3회)
```

### 7-3. 무한 루프 방지

Stop 훅의 agent 타입이 계속 `{ok: false}`를 반환하면 무한 루프 위험.

```javascript
// 방지 패턴: stop_hook_active 플래그 확인
if (input.stop_hook_active) {
  process.exit(0); // 이미 한 번 실행됨 → 종료 허용
}
```

---

## 8. 커뮤니티 베스트 프랙티스 & 최신 트렌드

### 8-1. 주요 오픈소스 플러그인

| 플러그인 | 저자 | 핵심 기법 |
|---------|------|----------|
| claude-code-harness | Chachamaru127 | Plan-Work-Review 자율 사이클 |
| everything-claude-code | affaan-m | 보안/메모리/리서치 최적화 |
| harness | revfactory | 도메인별 에이전트 팀 자동 설계 메타스킬 |

### 8-2. 2026년 핵심 트렌드

1. **훅 타입 다양화**: command 외에 prompt, agent, http — 결정론적 + 추론적 검증 혼합
2. **`if` 필드 도입** (v2.1.85+): 매처보다 세밀한 도구 인자 기반 필터링
3. **PermissionRequest 훅**: 권한 다이얼로그 자동 응답으로 워크플로우 중단 최소화
4. **FileChanged/CwdChanged 훅**: 파일/디렉토리 변경 반응형 환경 관리
5. **Session Memory GA**: 백그라운드 지속 요약으로 컴팩션 즉시 처리
6. **1M 컨텍스트 GA**: 추가 비용 없이 5배 작업 공간
7. **에이전트 팀**: 서브에이전트를 넘어 병렬 세션 간 통신

### 8-3. 실전 원칙

**성공하는 접근:**
- 단순하게 시작 → 실패 시에만 설정 추가
- 반복 속도 최적화 (1회 성공보다 중요)
- 계산적(결정론적) + 추론적(LLM 판단) 검증 조합
- 품질을 왼쪽으로 이동 (일찍 발견 = 저렴하게 수정)

**실패하는 접근:**
- 실패 발생 전 사전 설계 과잉
- "혹시 모르니" 대량 스킬/MCP 설치 (컨텍스트 압박)
- 매 세션마다 전체 테스트 스위트 실행 (시간 낭비)
- 서브에이전트 도구 접근 미시 최적화 (오버엔지니어링)

---

## 9. Playwright MCP — 브라우저 기반 하네스

### 9-1. Anthropic의 3-에이전트 하네스에서 Playwright의 역할

Anthropic은 "Harness Design for Long-Running Apps" 블로그에서 **3-에이전트 하네스**(Planner + Generator + Evaluator)를 소개했다. 이 중 **Evaluator의 핵심 도구가 Playwright MCP**이다.

```
Planner (계획)
  ↓ Markdown 스펙
Generator (코드 작성) ←── 피드백 루프 ──→ Evaluator (검증)
  코드만 수정                              Playwright MCP로 브라우저 조작
  자기 코드를 봄                            완성된 결과물만 봄 (코드 못 봄)
  편향 있음                                객관적 판단 가능
```

Anthropic 원문:
> "I gave the evaluator the Playwright MCP, which let it interact with the live page directly before scoring each criterion and writing a detailed critique."

> "The evaluator would navigate the page on its own, screenshotting and carefully studying the implementation before producing its assessment."

**Evaluator가 Playwright MCP로 하는 일:**
1. 실행 중인 앱에 접속 (`browser_navigate`)
2. 실제 사용자처럼 클릭/입력 (`browser_click`, `browser_fill_form`)
3. 스크린샷 캡처 (`browser_take_screenshot`)
4. 접근성 트리 분석 (`browser_snapshot`)
5. 각 평가 기준에 대해 점수 부여
6. 구체적인 비판과 개선 제안을 Generator에게 전달

**평가 기준 4가지:**

| 기준 | 설명 |
|------|------|
| Design Quality | 디자인이 일관된 하나의 정체성을 가지는가? |
| Originality | 템플릿/기본값이 아닌 커스텀 결정이 보이는가? |
| Craft | 타이포그래피, 간격, 색상 조화, 대비율 등 기술적 완성도 |
| Functionality | 사용자가 인터페이스를 이해하고 사용할 수 있는가? |

**반복 주기:** 5~15회 Generator↔Evaluator 반복. 비용 약 $125 (Planner $0.46, Build $114, QA $7).

### 9-2. Playwright MCP 활용 패턴 6가지

**패턴 A: UI 변경 후 스크린샷 검증**
```
코드 수정 → 브라우저 접속 → 스크린샷 → AI가 시각적으로 판단
```
Accessibility Snapshot(기본 모드)으로 구조적 검증, 시각적 검증이 필요할 때만 스크린샷. 토큰 효율적.

**패턴 B: E2E 테스트 자동 실행**

Playwright의 3-에이전트 파이프라인 (2026년 출시):

| 에이전트 | 역할 |
|---------|------|
| Planner | 앱 탐색 → Markdown 테스트 계획 생성 |
| Generator | 계획 → 실제 Playwright 테스트 코드 변환 |
| Healer | 실패한 테스트 자동 수리 (셀렉터 업데이트, 대기 조정) |

**패턴 C: 시각적 회귀 테스트 (Visual Regression)**
```
기준 스크린샷 → 변경 후 스크린샷 → 차이 비교 → AI가 의미 판단
```
단순 픽셀 비교를 넘어 DOM 구조 변경 분석, 접근성 트리 의미 변화 확인 가능. 디버깅 시간 60% 감소 효과.

**패턴 D: 접근성(a11y) 자동 검증**

Playwright MCP의 기본 모드가 Accessibility Snapshot이므로 구조적으로 접근성 검증에 적합:
- aria-label 존재 여부, 키보드 탐색 가능성, 포커스 순서
- 시맨틱 HTML 사용 여부, 대비율 검증 (스크린샷 모드 병행)

**패턴 E: 블랙박스 QA 에이전트 ("Quinn" 사례)**

AI QA 에이전트에게 **브라우저 도구만 허용**하여 코드를 직접 보지 못하게 함으로써 "치팅" 방지:
- PR 설명을 읽고 테스트 시나리오를 동적으로 생성 (사전 스크립트 없음)
- 엣지 케이스 자동 탐색 (음수 입력, 극단값, 빠른 연속 클릭)
- 모바일 뷰포트(375x667) 자동 테스트
- 약 7분 만에 완전한 QA 리포트 생성

**패턴 F: 네트워크 요청 감시/API 검증**

vibecraft의 packet-capture 스킬이 이미 구현 중:
- `browser_network_requests`로 API 호출 캡처, XHR/Fetch 필터링
- 인증/세션 정보 식별, 요청 의존성 맵 생성

### 9-3. 훅과 Playwright MCP 연동

MCP 도구는 Claude의 대화 컨텍스트 안에서만 호출 가능하므로, command 타입 훅에서 직접 호출은 불가. 대신 **prompt/agent 타입 훅**을 사용해야 한다.

**Stop 훅으로 UI 검증 강제:**
```json
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "UI 관련 코드(.tsx/.jsx/.html/.css) 수정이 있었는가? 있었다면 Playwright MCP로 브라우저에서 실제 동작을 확인했는가? 확인하지 않았으면 {\"decision\": \"block\", \"reason\": \"UI 변경 후 브라우저 검증 필요\"} 반환."
    }]
  }]
}
```

**SubagentStop 훅으로 자동 QA:**
```json
{
  "SubagentStop": [{
    "matcher": "frontend-builder",
    "hooks": [{
      "type": "agent",
      "prompt": "frontend-builder가 작성한 UI를 Playwright MCP로 검증하라. localhost에 접속하여 주요 기능 동작 여부, 레이아웃 깨짐, 반응형 확인.",
      "timeout": 120
    }]
  }]
}
```

### 9-4. 검증 전문 서브에이전트 (ui-evaluator)

Generator/Evaluator 분리 원칙을 vibecraft에 적용하는 방법:

```yaml
---
name: ui-evaluator
description: |
  UI 변경 후 브라우저에서 실제 동작을 검증하는 에이전트.
  코드를 보지 않고 사용자 관점에서만 테스트한다.
  Playwright MCP로 조작하며 발견한 문제를 구체적으로 보고한다.
model: sonnet
allowedTools:
  - Read
  - mcp__playwright__*
maxTurns: 15
---
```

**핵심**: Edit/Write/Grep 도구가 **없으므로** 코드를 볼 수 없다. 오직 브라우저에서 사용자처럼 조작하여 검증한다.

```
vibecraft RPDCA 워크플로우
  ├── R(Research) → sonnet 서브에이전트
  ├── P(Plan) → opus (plan-critic)
  ├── D(Do) → sonnet (frontend-builder)
  ├── C(Check) → gap-detector + ui-evaluator (NEW)
  │                  │                │
  │                  │                └── Playwright MCP만 가진 검증 전문 에이전트
  │                  └── plan.md 대비 코드 비교
  └── A(Act) → 자동 수정 루프
```

### 9-5. 토큰 비용과 한계

| 방법 | 토큰 소비 | 속도 | 용도 |
|------|----------|------|------|
| Playwright MCP (실시간) | ~114,000 토큰/작업 | 빠름 | 개발 중 즉시 검증 |
| Playwright CLI (@playwright/cli) | ~27,000 토큰/작업 | 느림 | CI/대규모 테스트 (4배 효율적) |
| Browser DevTools MCP | MCP 대비 78% 절약 | 빠름 | 토큰 절약이 중요할 때 |

**주의사항:**
- Playwright MCP는 34개 도구를 노출 → 서브에이전트 컨텍스트 10~20K 토큰 차지
- Shadow DOM 내부 요소는 접근성 트리에서 보이지 않을 수 있음
- 인증이 필요한 페이지에서 매번 로그인 반복 시 rate limit 위험
- 플러그인 서브에이전트는 보안상 `mcpServers` 필드가 무시됨 (Claude Code Issue #13605)
  - **해결**: 프로젝트 `.mcp.json`에 Playwright MCP를 설정하면 서브에이전트도 접근 가능

### 9-6. vibecraft 확장 가능성

**reference-design 스킬 확장:**
- 현재: 레퍼런스 사이트 크롤링 → 테마 JSON 추출
- 확장: 구현 후 레퍼런스 대비 시각적 자동 비교

**verification 스킬 강화:**
- UI 작업의 Check 단계에서 ui-evaluator 자동 실행
- HARD-GATE 체크리스트 중 Playwright로 자동 검증 가능한 항목:
  - 터치 타겟 44x44px (접근성 트리에서 크기 확인)
  - 시맨틱 HTML (접근성 트리 분석)
  - 포커스 링 존재 (Tab 키 시뮬레이션)
  - 빈 상태/로딩 상태 (상태별 스크린샷)
  - 반응형 (여러 뷰포트에서 browser_resize 후 비교)

---

## 10. vibecraft 현황 분석 및 Gap 식별

### 9-1. 이미 잘하고 있는 것

| 항목 | 설명 | 수준 |
|------|------|------|
| 훅 기반 의도 감지 | user-prompt-handler.js의 15가지+ 패턴 | 우수 |
| 안전 가드 | git-safety-guard, pre-write-guard, commit-guard | 우수 |
| RPDCA 워크플로우 | 크기별 분기 + Check-Act 자동 루프 | 우수 |
| 모델 비용 최적화 | opus/sonnet/haiku 작업별 배정 | 우수 |
| Evidence First | E0~E3 등급 체계 | 양호 |
| 스킬 체이닝 | skill-post.js 다음 단계 자동 제안 | 양호 |
| 컨텍스트 보존 | PreCompact + session.md | 양호 |
| 팀 엔진 | 에이전트 매칭, 의존성 그래프, 실패 복구 | 양호 |

### 9-2. 개선 기회 (Gap)

#### Gap A: CLAUDE.md 토큰 과다 (High Impact)

**현황**: 14,000자+ (약 5,000 토큰 이상). 매 턴마다 로드됨.
**문제**: 컨텍스트 부패 위험. 무관한 규칙이 관련 규칙의 준수율을 낮춤.
**해결**: 점진적 공개 패턴 적용. 핵심 규칙만 CLAUDE.md에 남기고, 상세 규칙은 별도 파일로 분리.

분리 후보:
- 프론트엔드 UI 개발 워크플로 (섹션 5 전체) → `docs/rules/frontend-workflow.md`
- Git 브랜치 관리 (섹션 6 전체) → `docs/rules/git-strategy.md`
- 코드 품질 체크리스트 → `docs/rules/code-quality.md`
- 커밋 메시지 가이드 → `docs/rules/commit-guide.md`

CLAUDE.md에는 각각 1줄 포인터만 남김.

#### Gap B: prompt/agent 타입 훅 미사용 (High Impact)

**현황**: 13개 훅 스크립트 모두 `command` 타입만 사용.
**문제**: "증거 없이 완료 없다", "추측 금지" 등의 규칙이 LLM의 자발적 준수에만 의존.
**해결**: `prompt` 타입 Stop 훅으로 "Iron Law" 준수 여부를 결정론적으로 검증.

예시 구현:
```json
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "이 턴에서 코드 파일(.js/.ts/.py/.java 등)이 수정되었는가? 수정되었다면 테스트 실행 결과, 동작 확인 스크린샷, 또는 실행 로그 중 하나가 대화에 포함되었는가? 포함되지 않았다면 {\"decision\": \"block\", \"reason\": \"코드 수정 후 검증 증거 없음\"} 반환. 포함되었거나 코드 수정이 없었으면 {\"decision\": \"allow\"} 반환.",
      "timeout": 10
    }]
  }]
}
```

#### Gap C: 에이전트 allowedTools/maxTurns 미설정 (Medium Impact)

**현황**: 대부분의 에이전트가 `model`과 `permissionMode`만 설정. `allowedTools`, `maxTurns` 미사용.
**문제**: 서브에이전트가 불필요한 도구를 사용하거나 폭주할 위험. MCP 도구 설명이 서브에이전트 컨텍스트를 차지.
**해결**: 각 에이전트에 필요한 도구만 allowedTools로 제한, maxTurns로 폭주 방지.

예시:
```yaml
# agents/code-analyzer.md
---
name: code-analyzer
model: opus
allowedTools: [Read, Grep, Glob, Bash, Agent]
maxTurns: 30
permissionMode: plan
---
```

#### Gap D: 미사용 훅 이벤트 활용 (Medium Impact)

**활용 가치 높은 미사용 훅:**

| 이벤트 | 활용 방안 |
|--------|----------|
| PostToolUseFailure | 도구 실패 시 자동 진단 메시지 주입 ("이 에러는 보통 X가 원인") |
| SubagentStop | 서브에이전트 완료 시 출력 품질 자동 검증 |
| PostCompact | compact 완료 후 "합의된 설계 결정" 목록 주입 |
| SessionEnd | 세션 종료 시 session.md 자동 정리 |
| FileChanged | plan.md 변경 감지 → RPDCA 상태 자동 업데이트 |
| PermissionRequest | 안전한 도구에 자동 허용 → 워크플로우 중단 감소 |

#### Gap E: RPDCA 상태 관리 정확도 (Medium Impact)

**현황**: `docs/plans/` 폴더의 파일 존재 여부로 RPDCA 단계 추정. 여러 feature 동시 진행 시 혼동.
**해결**: `docs/plans/rpdca-state.json`에 구조화된 상태 관리.

```json
{
  "activeFeature": "payment",
  "phase": "Do",
  "startedAt": "2026-04-13T10:00:00",
  "lastUpdated": "2026-04-13T11:30:00",
  "history": [
    {"phase": "Research", "completedAt": "2026-04-13T10:15:00"},
    {"phase": "Plan", "completedAt": "2026-04-13T10:45:00"}
  ]
}
```

#### Gap F: 훅 스크립트 간 공통 유틸리티 부재 (Low Impact)

**현황**: 여러 스크립트에서 `docs/plans/` 스캔, JSON 파싱, RPDCA 감지 등이 중복.
**해결**: `lib/hooks-util.js`에 공통 함수 추출.

#### Gap G: user-prompt-handler.js 버그 (Low Impact, 즉시 수정 가능)

**현황**: `debugging` 패턴에 `english` 필드가 2번 정의 (51~52행). 뒤의 것이 앞의 것을 덮어쓰므로 `ENOENT|EACCES|ECONNREFUSED|ERR_` 패턴이 매칭 안 됨.
**해결**: 두 english 필드를 하나로 합치기.

#### Gap H: vibecraft.md 명령어 버전 불일치 (Low Impact, 즉시 수정 가능)

**현황**: `/vibecraft` 도움말에 "v1.9.6", "스킬 41개" 등 구버전 정보 표시.
**해결**: 현재 v2.0.12, 스킬 19개 등으로 업데이트.

#### Gap I: Playwright MCP를 검증 하네스로 미활용 (High Impact)

**현황**: Playwright MCP를 packet-capture(네트워크 캡처)와 reference-design(레퍼런스 크롤링)에만 사용. UI 검증 도구로는 미활용.
**문제**: Anthropic이 증명한 Generator/Evaluator 분리 패턴의 핵심 도구를 놓치고 있음. "자기 평가 편향" 해결의 가장 효과적인 수단.
**해결**:
1. ui-evaluator 서브에이전트 신규 생성 (Playwright MCP만 허용, 코드 접근 불가)
2. verification 스킬의 Check 단계에서 UI 작업 시 ui-evaluator 자동 실행
3. Stop 훅(prompt 타입)으로 UI 변경 후 브라우저 검증 강제

---

## 11. 개선 우선순위 제안

### Tier 1: 높은 영향도 + 낮은 난이도 (바로 적용)

| # | 개선 | 예상 효과 | 난이도 |
|---|------|----------|--------|
| 1 | CLAUDE.md 점진적 공개 분리 | 토큰 절약, 규칙 준수율 향상 | 중 |
| 2 | Stop 훅에 prompt 타입 추가 (Iron Law 강제) | "증거 없이 완료 없다" 결정론적 강제 | 낮 |
| 3 | user-prompt-handler.js english 중복 수정 | 디버깅 패턴 매칭 정확도 향상 | 매우 낮 |
| 4 | vibecraft.md 버전/수량 업데이트 | 정확한 정보 제공 | 매우 낮 |

### Tier 2: 높은 영향도 + 중간 난이도 (다음 릴리즈)

| # | 개선 | 예상 효과 | 난이도 |
|---|------|----------|--------|
| 5 | 에이전트 allowedTools/maxTurns 설정 | 컨텍스트 절약, 폭주 방지 | 중 |
| 6 | PostToolUseFailure 훅 추가 | 도구 실패 시 자동 진단 | 중 |
| 7 | RPDCA 상태 JSON 파일 도입 | 다중 feature 지원, 정확한 상태 추적 | 중 |
| 8 | SubagentStop 훅으로 출력 품질 검증 | 서브에이전트 코드 품질 자동 검증 | 중 |
| 9 | ui-evaluator 서브에이전트 생성 | Generator/Evaluator 분리, UI 자기평가 편향 해결 | 중 |

### Tier 3: 중간 영향도 + 높은 난이도 (장기)

| # | 개선 | 예상 효과 | 난이도 |
|---|------|----------|--------|
| 10 | PostCompact 훅으로 설계 결정 복원 | compact 후 맥락 손실 최소화 | 중 |
| 11 | SessionEnd 훅으로 session.md 자동 정리 | 세션 잔여 파일 관리 | 낮 |
| 12 | 훅 스크립트 공통 유틸리티 추출 | 코드 중복 제거 | 중 |
| 13 | FileChanged 훅으로 plan.md 변경 감지 | RPDCA 상태 실시간 추적 | 높 |
| 14 | Stop 훅에 UI 검증 게이트 추가 | UI 변경 후 브라우저 미검증 시 완료 차단 | 중 |
| 15 | reference-design 디자인 검증 자동화 | 구현 후 레퍼런스 대비 시각적 자동 비교 | 높 |

---

## 12. 참고 자료

| 제목 | 출처 | 핵심 내용 |
|------|------|----------|
| Skill Issue: Harness Engineering | HumanLayer | 하네스 엔지니어링 개념 정의, CLAUDE.md 최적화 |
| Harness Engineering for Coding Agent Users | Martin Fowler | 유지보수성/아키텍처/동작 하네스 프레임워크 |
| Writing a Good CLAUDE.md | HumanLayer | 토큰 예산, 점진적 공개, Gold standard |
| Effective Harnesses for Long-Running Agents | Anthropic | 세션 메모리, 컴팩션 대응, git 패턴 |
| Automate Workflows with Hooks | Claude Code Docs | 24종 훅 이벤트 상세 |
| Create Custom Subagents | Claude Code Docs | 에이전트 frontmatter, 모델 선택 |
| Skill Authoring Best Practices | Claude API Docs | description 작성법, 점진적 공개 |
| Context Buffer: 33K-45K Token Problem | claudefa.st | 컨텍스트 윈도우 메커니즘 |
| 12 Agentic Harness Patterns | Medium | 실전 훅 패턴 모음 |
| claude-code-harness (Chachamaru127) | GitHub | Plan-Work-Review 자율 사이클 |
| everything-claude-code (affaan-m) | GitHub | 보안/메모리/리서치 최적화 |
| harness (revfactory) | GitHub | 도메인별 에이전트 팀 메타스킬 |
| 하네스 엔지니어링, 9달러 vs 200달러의 비밀 | gymcoding (YouTube) | $9 vs $200 실험, 3가지 실패 패턴, "부탁 vs 강제" 프레이밍, 하네스 진화 원칙 |
| Harness Design for Long-Running Apps | Anthropic | 3-에이전트 하네스 (Planner+Generator+Evaluator), Playwright MCP를 Evaluator 도구로 활용 |
| Building an AI QA Engineer with Claude Code and Playwright MCP | alexop.dev | 블랙박스 QA 에이전트 "Quinn" — 브라우저 도구만 허용하여 치팅 방지 |
| Playwright MCP Server — Microsoft | GitHub (microsoft/playwright-mcp) | 34개 브라우저 제어 도구, 접근성 트리 기반 기본 모드 |
| Playwright MCP Burns 114K Tokens Per Test | Medium (scrolltest) | MCP vs CLI 토큰 비용 비교 (114K vs 27K), 용도별 선택 기준 |
| Custom Plugin Subagents Cannot Access MCP Tools | GitHub Issue #13605 | 플러그인 서브에이전트의 mcpServers 필드 보안 제한 |
| Write Automated Tests with Claude Code using Playwright Agents | Shipyard | Playwright의 3-에이전트 파이프라인 (Planner/Generator/Healer) |

---

## 핵심 한 줄 요약

> "에이전트가 예상대로 동작하지 않을 때, 모델을 탓하기 전에 하네스를 확인하라. CLAUDE.md, 훅, 스킬, 에이전트, MCP — 대부분의 개선점은 여기에 있다."
