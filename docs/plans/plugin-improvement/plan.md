# vibecraft 플러그인 트리거링 전면 개선 계획

> 목표: 슬래시 명령어 없이도 80% 이상의 상황에서 적절한 워크플로우가 자동 실행되도록 개선
> 근거: research.md 진단 결과 — 핵심 원인 3가지 (항상 활성화 미작동, auto-detect 미트리거, 스킬 과다)

---

## 사전 준비: Git 안전장치

### 배경
27개 스킬 폴더 삭제 + 다수 파일 수정은 되돌리기 어려운 대규모 변경이다.
실패 시 복구 경로를 확보해야 한다.

### 작업 내용

1. **작업 브랜치 생성**
   - `git checkout -b feature/plugin-improvement`
   - main 브랜치는 항상 안전한 상태로 유지

2. **Step별 커밋**
   - 각 Step 완료 시 개별 커밋 (Step 1~9 각각)
   - 문제 발생 시 해당 Step만 revert 가능

### 검증
- `git branch`로 작업 브랜치 확인
- main 브랜치에 변경 사항 없음 확인

---

## Step 1: "항상 활성화" 스킬 5개를 CLAUDE.md로 이관

### 배경
iron-law, cto-mindset, evidence-first, session-context, security-baseline은 "모든 대화에서 활성화"를 주장하지만, Claude Code 스킬 시스템은 on-demand 로드만 지원하여 실제로는 거의 로드되지 않음. CLAUDE.md는 항상 컨텍스트에 로드되므로 100% 적용 보장.

### 작업 내용

1. **각 스킬의 SKILL.md에서 핵심 규칙만 추출** (전체 복사 X)
   - iron-law → TDD 3단계 + "증거 없이 완료 없다" 규칙 (10줄 이내)
   - cto-mindset → DO/DON'T 리스트 (10줄 이내)
   - evidence-first → E등급 체계 핵심 + "추측 금지" 규칙 (10줄 이내)
   - session-context → session.md 생성/복구 규칙 (5줄 이내)
   - security-baseline → 핵심 보안 체크리스트 (5줄 이내)

2. **프로젝트 CLAUDE.md에 `## AI 행동 규칙` 섹션 추가**
   - 위 규칙들을 간결하게 통합
   - 예상 추가 분량: 40~50줄

3. **이관된 5개 스킬 폴더 삭제**
   - skills/iron-law/, skills/cto-mindset/, skills/evidence-first/, skills/session-context/, skills/security-baseline/

4. **연관 참조 업데이트**
   - auto-detect SKILL.md에서 "항상 활성화" 참조 제거
   - smart-pdca SKILL.md에서 iron-law 스킬 호출 지시 → CLAUDE.md 참조로 변경
   - **agents/test-writer.md**: iron-law 스킬 참조(4곳) → "CLAUDE.md AI 행동 규칙 참고"로 변경
   - **agents/debugger.md**: iron-law 참조(1곳) → "CLAUDE.md AI 행동 규칙 참고"로 변경
   - **agents/cto-lead.md**: iron-law 참조(2곳) → "CLAUDE.md AI 행동 규칙 참고"로 변경
   - **commands/verify.md**: iron-law 참조 → "CLAUDE.md AI 행동 규칙"으로 변경
   - **scripts/commit-guard.js**: iron-law 문자열(3곳) → 메시지 텍스트만 수정 (기능 유지)

### 검증
- CLAUDE.md에 규칙이 존재하는지 확인
- `grep -r "iron-law\|cto-mindset\|evidence-first\|session-context\|security-baseline" skills/ agents/ commands/ scripts/` 로 잔존 참조 확인
- 테스트: "로그인 만들어줘" 입력 시 TDD 없이 코드 작성하는지 관찰
- 테스트: 추측 기반 답변이 나오는지 관찰

---

## Step 2: 보조 스킬 12개를 CLAUDE.md 규칙으로 전환

### 배경
naming-consultant, consistency-enforcer 등 보조 스킬은 "코드 작성 중 자동 트리거"를 주장하지만, Claude가 코드를 작성하면서 별도 스킬을 호출할 동기가 없음. 이 스킬들의 핵심 규칙을 CLAUDE.md에 1~2줄씩 추가하면 충분.

### 작업 내용

1. **각 스킬에서 1~2줄 핵심 규칙 추출**

   | 스킬 | CLAUDE.md 규칙 (1~2줄) |
   |------|----------------------|
   | naming-consultant | "변수/함수명이 모호하면 더 명확한 이름을 사용한다" |
   | consistency-enforcer | "프로젝트 내 기존 패턴과 일관성을 유지한다" |
   | refactoring-radar | "함수 30줄+, 중첩 3단계+ 발견 시 리팩토링 제안" |
   | doc-autopilot | "코드 변경 시 관련 README/주석이 오래됐으면 업데이트 제안" |
   | error-message-designer | "에러 메시지는 사용자용과 개발자용을 분리" |
   | pre-flight-check | "구현 전 기존 코드에 유사 기능이 있는지 확인" |
   | dependency-auditor | "새 패키지 설치 전 기존 대체재 확인" |
   | rollback-strategy | "대규모 수정 전 git stash 또는 브랜치 생성" |
   | test-strategy-advisor | "깨지면 위험한 것만 집중 테스트" |
   | impact-analysis | "코드 수정 전 해당 파일을 import하는 곳 확인" |
   | simple-tweak | "수치/스타일 1~3줄 변경은 위치를 알려주고 사용자에게 직접 수정 기회 제공" |
   | error-simulation | "M/L 수정 후 관련 시나리오에서 오류 가능성 확인" |

2. **CLAUDE.md `## 코드 품질 체크리스트` 섹션에 추가**
   - 예상 추가 분량: 15~20줄
   - **현재 CLAUDE.md: 208줄 + Step 1(~45줄) + Step 2(~18줄) = ~271줄. Step 9 디렉토리 구조 업데이트(줄 수 감소)를 감안하면 350줄 이내 달성 가능.**

3. **12개 스킬 폴더 삭제**

4. **연관 참조 업데이트**
   - auto-detect, smart-pdca에서 보조 스킬 참조 제거 (이 스킬들도 이후 Step에서 삭제되지만, Step 2 시점에서는 아직 존재하므로 참조만 제거)
   - **executing-plans SKILL.md**: code-simplifier 에이전트 호출은 유지 (에이전트는 삭제 대상 아님), error-simulation 스킬 참조를 verification 내부 단계 참조로 변경
   - **systematic-debugging SKILL.md**: code-simplifier 에이전트 참조는 유지
   - **user-prompt-handler.js**: simple-tweak 패턴의 skill을 다른 처리로 변경 (아래 Step 4에서 상세)
   - **scripts/test-trigger.js**: simple-tweak 참조(1곳)를 업데이트된 패턴으로 변경 (테스트 스크립트가 삭제된 스킬을 검증하면 테스트 실패)

### 검증
- 삭제된 스킬명이 코드베이스에 남아있지 않은지 grep 확인
- CLAUDE.md 총 줄 수가 350줄 이내인지 확인 (과도하면 압축)
- **test-trigger.js 테스트가 통과하는지 `node scripts/test-trigger.js` 실행하여 확인**

---

## Step 3: 프리셋 스킬 5개를 훅 기반 자동 주입으로 전환

### 배경
preset-loader.js가 기술 스택을 감지하지만, stdout으로 "감지됨"만 출력하고 실제 프리셋 스킬은 로드하지 않음. 프리셋 내용을 훅에서 직접 주입하면 100% 적용 가능.

### 전제 확인 필요 (E0 — 미확인)
SessionStart 훅의 stdout이 정말 system-reminder로 Claude에게 전달되는지 확인해야 한다. Claude Code 플러그인 문서에서 확인하거나, 간단한 테스트로 검증한다.

**검증 방법**: preset-loader.js에서 `console.log("[TEST] 이 메시지가 보이면 system-reminder 작동 확인됨")`을 추가하고 새 세션에서 확인.

만약 stdout이 system-reminder로 전달되지 않으면, 대안으로 CLAUDE.md에 "프로젝트 기술 스택에 따라 아래 규칙 적용" 섹션을 추가하는 방식으로 전환한다.

### 작업 내용

1. **각 프리셋 SKILL.md에서 핵심 규칙 추출 (20줄 이내)**
   - preset-nextjs: App Router 규칙, shadcn/ui 사용법
   - preset-react: 컴포넌트 규칙, 상태 관리
   - preset-spring: 계층 구조, 어노테이션 규칙
   - preset-python: 네이밍, venv, 타입 힌트
   - preset-general: 기존 코드 스타일 따르기

2. **preset-loader.js 개선**
   - 기존: `console.log("감지된 기술 스택 프리셋: preset-nextjs")`
   - 개선: 감지된 프리셋의 핵심 규칙을 직접 stdout으로 출력
   - SessionStart 훅의 stdout은 system-reminder로 표시되므로, 규칙이 컨텍스트에 주입됨

3. **5개 프리셋 스킬 폴더 삭제**

### 검증
- 새 세션 시작 시 system-reminder에 프리셋 규칙이 표시되는지 확인
- Next.js 프로젝트에서 App Router 규칙이 적용되는지 테스트
- **대안 검증**: system-reminder 미작동 시, CLAUDE.md 방식으로 전환했는지 확인

---

## Step 4: auto-detect 스킬 제거 + user-prompt-handler.js 강화

### 배경
auto-detect 스킬(237줄)과 user-prompt-handler.js(339줄)가 동일한 패턴 매칭을 이중으로 수행. auto-detect 스킬 자체가 트리거되지 않는 것이 핵심 문제이므로, 훅으로 완전 이관.

### 작업 내용

1. **auto-detect SKILL.md의 고유 로직을 user-prompt-handler.js에 통합**
   - 신뢰도 기반 분기 (높음 → 바로 실행, 낮음 → 선택지)는 이미 훅에 있음
   - 복수 매칭 판별 규칙은 훅에 이미 있음
   - 에이전트 암묵적 트리거는 훅에 이미 있음
   - **실질적으로 auto-detect 스킬 고유 로직이 없음** → 즉시 삭제 가능

2. **user-prompt-handler.js의 [SYSTEM] 메시지 강화**
   - 현재: `"반드시 Skill 도구로 ${skill} 스킬을 호출하세요."`
   - 강화: 더 구체적인 이유와 결과를 추가
   ```
   "[SYSTEM] 사용자가 새 기능을 요청했습니다.
   반드시 Skill 도구로 vibecraft:new-feature를 호출하세요.
   이 스킬을 호출하지 않고 코드를 바로 작성하면 계획 없는 구현이 됩니다.
   스킬을 먼저 호출한 후에만 코드 작성을 시작하세요."
   ```

3. **user-prompt-handler.js의 simple-tweak 패턴 처리 변경**
   - simple-tweak 스킬이 삭제되었으므로 (Step 2), 패턴 매칭 시:
   - 스킬 호출 대신 직접 가이드 메시지를 stdout으로 출력
   - "[SYSTEM] 단순 수정 요청입니다. 수정 위치를 알려주고 사용자에게 직접 수정 기회를 제공하세요."

4. **skills/auto-detect/ 폴더 삭제**

5. **scripts/context-compaction.js 업데이트**
   - `'Plan (brainstorming 완료, writing-plans 대기)'` → `'Plan (설계 완료, writing-plans 대기)'` (brainstorming 스킬이 Step 6에서 삭제되므로, 문자열만 선제 변경)

### 검증
- "로그인 만들어줘" 입력 시 new-feature 스킬이 호출되는지 확인
- "에러 나는데" 입력 시 systematic-debugging이 호출되는지 확인
- "색상 바꿔줘" 입력 시 가이드 메시지가 출력되는지 확인

---

## Step 5: 핵심 스킬 description 적극적 리라이팅

### 배경
현재 description은 "~하는 스킬" 형태로 수동적. Claude가 "내가 이미 할 수 있는데 스킬을 호출할 필요 있나?"로 판단함. "반드시 호출하라 + 호출 안 하면 X가 발생한다" 어조로 변경.

### 작업 내용

Step 1~4 이후 남는 핵심 스킬들의 description 리라이팅:

```yaml
# new-feature
description: |
  사용자가 기능 추가/구현/개발을 요청할 때 반드시 이 스킬을 먼저 호출하라.
  "만들어줘", "추가해줘", "구현해줘", "개발해줘", "넣어줘", "해줘" 등의
  요청이 있으면 코드를 바로 작성하지 말고 이 스킬을 호출하여 작업 크기(S/M/L)를
  판단한 뒤 적절한 워크플로우를 실행하라. 이 스킬 없이 바로 코드를 작성하면
  계획 없는 구현으로 품질이 저하되고 재작업이 발생한다.
  Triggers: 만들어줘, 추가해줘, 구현해줘, 개발해줘, 넣어줘, 기능, feature, implement, create, build
```

```yaml
# systematic-debugging
description: |
  에러, 버그, 오류, 실패, 크래시 등 문제 해결 요청 시 반드시 이 스킬을 호출하라.
  "안 돼", "에러 나", "왜 이래", "고쳐줘" 등의 표현이 있으면 추측으로 코드를
  수정하지 말고 이 스킬의 체계적 분석 절차를 반드시 따르라.
  이 스킬 없이 수정하면 근본 원인을 놓치고 새로운 버그를 만들 위험이 있다.
  Triggers: 에러, 버그, 오류, 안 돼, 실패, 크래시, fix, bug, error, crash
```

```yaml
# verification
description: |
  코드 작성/수정 작업이 완료된 후 반드시 이 스킬을 호출하라.
  "완료", "다 됐다", "끝" 등의 표현 전에 이 스킬로 검증 증거를 확인해야 한다.
  이 스킬 없이 완료를 선언하면 검증되지 않은 코드가 배포될 위험이 있다.
  Triggers: 검증, 완료, 끝, verify, done, 확인해줘, 체크해줘
```

나머지 스킬도 동일한 패턴으로 리라이팅:
- research, writing-plans, executing-plans, code-review-request, deploy-guide
- project-kickoff, reference-design, welcome-guide, analysis-delegation, team-orchestration
- **naver-diagnosis** (누락 보완 — 현재 user-prompt-handler.js에 트리거 패턴 없음, 네이버 관련 키워드 패턴 추가 필요)
- **packet-capture** (신규 — user-prompt-handler.js에 패킷/API추출/네트워크캡처 트리거 패턴 추가)

### 검증
- 각 스킬의 trigger 키워드가 description에 명시되어 있는지 확인
- description이 "호출하라" + "안 하면 X 발생" 패턴을 따르는지 확인
- **naver-diagnosis의 트리거 패턴이 user-prompt-handler.js에도 추가되었는지 확인**

---

## Step 6: 오케스트레이션 체인 단순화

### 배경
현재 10단계 체인 (auto-detect → new-feature → smart-pdca → research → brainstorming → writing-plans → plan-critic → executing-plans → verification → gap-detector)에서 각 단계마다 Claude가 Skill 도구를 별도 호출해야 함. 체인이 길수록 중간 이탈 확률이 높음.

### 작업 내용

1. **smart-pdca 로직을 new-feature 내부로 인라인**
   - new-feature SKILL.md 안에 크기 판단 기준 직접 포함
   - smart-pdca 스킬은 별도 호출 불필요
   - skills/smart-pdca/ 폴더 삭제
   - **연관 참조 업데이트**:
     - skill-post.js: smart-pdca 체이닝 항목 제거
     - commands/feature.md: "auto-detect + smart-pdca로" → "new-feature가 자동으로" (2곳)
     - commands/ralph.md: "smart-pdca에 ralphLoop: true를 전달" → new-feature 내부 로직으로 변경
     - commands/team.md: "smart-pdca로 작업 크기를 판단" → "new-feature 내부에서 크기 판단"
     - user-prompt-handler.js: smart-pdca 참조(1곳) 제거

2. **brainstorming을 writing-plans의 선택적 선행 단계로 통합**
   - writing-plans SKILL.md 상단에 "설계가 없으면 먼저 설계 질문" 섹션 추가
   - **주의**: writing-plans가 너무 커지지 않도록 brainstorming 핵심만 추출 (질문 목록 + 설계 확정 절차)
   - skills/brainstorming/ 폴더 삭제
   - **연관 참조 업데이트**:
     - skill-post.js: brainstorming 체이닝 항목 → writing-plans로 통합
     - commands/brainstorm.md: writing-plans 스킬로 리다이렉트하도록 변경
     - commands/feature.md: "brainstorming → plan" → "writing-plans (설계 포함)" (1곳)
     - commands/vibecraft.md: "brainstorming → 계획" → "writing-plans (설계 포함)" (1곳)
     - commands/team.md: "brainstorming → writing-plans" → "writing-plans (설계 포함)" (1곳)
     - commands/kickoff.md: "아이디어 정리 (brainstorming)" → "아이디어 정리 (writing-plans)" (1곳)
     - scripts/context-compaction.js: 이미 Step 4에서 처리됨

3. **systematic-debugging에 크기 분기 로직 인라인**
   - RPDCA 파이프라인을 타지 않고, 스킬 내부에서 즉시 크기 판단 후 적절한 절차 실행
   - 크기 판단 기준:
     - S: 에러 메시지가 명확 + 원인이 1곳 → 바로 수정
     - M: 원인 불확실 + 2~3파일 관련 → 렌즈 1~2로 분석 후 수정
     - L: 재현 어려움 + 5파일+ 연쇄 → 3렌즈 전체 + 영향 분석 + 수정 계획
   - CLAUDE.md의 evidence-first("추측 금지") + iron-law("증거 없이 완료 없다")가 모든 크기에서 자동 적용
   - 기존 6단계 2-Phase는 M/L에서만 전체 실행, S는 빠른 수정 경로

4. **error-simulation을 verification 내부로 통합**
   - verification SKILL.md에 "M/L 작업 시 오류 시뮬레이션" 단계 추가
   - skills/error-simulation/ 폴더 삭제

5. **code-review-receive를 code-review-request에 병합**
   - skills/code-review-receive/ 폴더 삭제

6. **finishing-branch를 git-workflow에 병합**
   - skills/finishing-branch/ 폴더 삭제

### 검증
- 남은 스킬 총 수 확인: 목표 13~15개
- new-feature 스킬 호출 시 크기 판단이 내부에서 이루어지는지 확인
- writing-plans 호출 시 설계 질문이 포함되는지 확인
- **skill-post.js, commands/*.md에서 삭제된 스킬 참조가 없는지 grep 확인**

---

## Step 7: external-reviewer 스킬 처리 결정

### 배경
external-reviewer는 L 크기 RPDCA 워크플로우의 리뷰 파이프라인에서 사용된다 (executing-plans → code-simplifier → **external-reviewer** → error-simulation → verification). 단독 트리거는 드물지만, ESLint 등 외부 도구 연동은 L 크기 작업에서 가치가 있다.

### 작업 내용

**방안 A (권장): 유지하되 description 리라이팅**
- executing-plans 내부에서 L 크기일 때 자동 호출되므로, 독립 스킬로 남김
- description을 Step 5 패턴으로 리라이팅
- **lib/team/report-builder.js**: external-reviewer 참조(1곳) 유지 (스킬이 남으므로)
- **team-orchestration SKILL.md**: external-reviewer 참조(2곳) 유지

**방안 B: verification에 통합**
- external-reviewer 로직을 verification 내부로 통합 (error-simulation과 함께)
- 스킬 수 1개 추가 감소
- **방안 B 채택 시 추가 업데이트 필요**:
  - lib/team/report-builder.js: "external-reviewer" → "verification (외부 도구 검사 포함)"
  - team-orchestration SKILL.md: external-reviewer 참조(2곳) → verification 참조로 변경
  - executing-plans SKILL.md: external-reviewer 참조(4곳) → verification 참조로 변경

### 검증
- L 크기 워크플로우에서 외부 도구 검사가 정상 작동하는지 확인
- **방안 결정 후, 해당 방안의 참조 업데이트가 모두 완료되었는지 grep 확인**

---

## Step 8: 훅 정리 및 강화

### 배경
현재 훅 중 실효성 있는 것은 git-safety-guard.js뿐. 나머지는 "권고" 수준이므로 실효성 강화 또는 제거 필요.

### 작업 내용

1. **unified-stop.js 간소화**
   - 현재: 매 응답 끝에 명령어 리마인더 표시
   - 개선: RPDCA 진행 중일 때만 다음 단계 안내 (불필요한 반복 제거)
   - **주의**: RPDCA 비진행 상태에서도 최소한 `/feature, /debug, /review` 리마인더는 유지 (신규 사용자 온보딩)

2. **skill-post.js 수정 (제거 대신)**
   - 삭제된 스킬(smart-pdca, brainstorming 등) 항목 제거
   - 남은 스킬 체이닝만 유지
   - **이유**: 스킬 체이닝 자체는 유용 — "writing-plans 완료 후 executing-plans 호출하라"는 지시가 SKILL.md 본문에만 있으면 Claude가 놓칠 수 있음. 훅 + SKILL.md 이중 안내가 체인 완주율을 높임.

3. **commit-guard.js 강화**
   - 현재: 소프트 경고
   - 개선: CLAUDE.md의 iron-law 규칙과 연동하여 일관된 메시지

4. **rpdca-task-completed.js 유지**
   - 서브에이전트 완료 시 다음 단계 안내는 유용

### hooks.json 변경 여부
- **hooks.json 자체는 수정 불필요**. 훅 스크립트(skill-post.js 등)의 내부 로직만 변경하므로, hooks.json의 PostToolUse 설정은 그대로 유지.
- 만약 훅 스크립트 파일 자체를 삭제하는 경우에만 hooks.json에서 해당 항목 제거 필요 → 이 Plan에서는 스크립트 삭제 없음.

### 검증
- hooks.json이 수정되지 않았는지 `git diff hooks/hooks.json` 확인 (의도하지 않은 변경 방지)
- 남은 훅들이 정상 실행되는지 테스트
- **skill-post.js의 체이닝 맵이 남은 스킬 목록과 일치하는지 확인**

---

## Step 9: CLAUDE.md 및 plugin.json 최종 정리

### 작업 내용

1. **CLAUDE.md 업데이트**
   - `## AI 행동 규칙` 섹션 추가 (Step 1에서 이관한 규칙, ~45줄)
   - `## 코드 품질 체크리스트` 섹션 추가 (Step 2에서 이관한 규칙, ~18줄)
   - `## 디렉토리 구조` 업데이트 (삭제된 스킬 반영 → **줄 수 감소**: 43개 → 15~16개로 약 27줄 감소)
   - `## 구현 상태` 업데이트 (Phase 9 추가)
   - `## RPDCA 워크플로우` 업데이트 (체인 단순화 반영)
   - `## 핵심 철학` 업데이트 ("Iron Law: iron-law 스킬" → "Iron Law: CLAUDE.md AI 행동 규칙")
   - **줄 수 예측: 208(현재) + 63(추가) - 27(스킬 목록 감소) = ~244줄. 350줄 이내 충분.**
   - 단, 실제 작업 후 `wc -l CLAUDE.md`로 반드시 확인

2. **plugin.json 업데이트**
   - version 올리기 (1.9.9 → 2.0.0, 대규모 구조 변경이므로 메이저 버전)
   - description 업데이트
   - `node scripts/sync-version.js` 실행

3. **삭제 대상 최종 확인**
   - 삭제 예정 스킬: 총 27~28개 폴더 (external-reviewer 처리 방안에 따라)
   - 삭제 전 git status로 untracked 파일 확인
   - **전체 grep으로 삭제된 스킬명이 남은 파일에서 참조되지 않는지 최종 확인**

### 검증
- CLAUDE.md가 정상 파싱되는지 확인
- plugin.json 버전이 marketplace.json과 동기화되는지 확인
- 남은 스킬 목록:
  1. new-feature (smart-pdca 통합)
  2. systematic-debugging
  3. research
  4. writing-plans (brainstorming 통합)
  5. executing-plans
  6. verification (error-simulation 통합)
  7. code-review-request (code-review-receive 통합)
  8. deploy-guide
  9. project-kickoff
  10. reference-design
  11. welcome-guide
  12. analysis-delegation
  13. team-orchestration
  14. git-workflow (finishing-branch 통합)
  15. naver-diagnosis
  16. packet-capture (신규 — Playwright MCP 기반 네트워크 패킷 캡처/API 추출)
  17. external-reviewer (방안 A 채택 시)

---

## Step 10: 통합 테스트

### 테스트 시나리오

| # | 입력 | 기대 동작 |
|---|------|----------|
| 1 | "로그인 기능 만들어줘" | new-feature 스킬 자동 호출 |
| 2 | "에러 나는데 고쳐줘" | systematic-debugging 자동 호출 |
| 3 | "이 코드 봐줘" | code-review-request 자동 호출 |
| 4 | "안녕" | welcome-guide 자동 호출 |
| 5 | "배포하자" | deploy-guide 자동 호출 |
| 6 | "테스트 없이 코드만 짜줘" | Claude가 테스트 작성을 거부하거나 "CLAUDE.md 규칙에 따라 테스트를 먼저 작성합니다"라고 응답 (iron-law 적용 확인) |
| 7 | "이 에러 원인이 뭔지 모르겠는데 일단 고쳐줘" | Claude가 추측 수정을 거부하고 "근거를 먼저 확인합니다"라고 분석 절차를 시작 (evidence-first 적용 확인) |
| 8 | 50줄+ 코드 작성 시 | pre-write-guard 경고 |
| 9 | 새 세션에서 Next.js 프로젝트 | 프리셋 규칙 system-reminder 표시 |
| 10 | "데이터 분석해줘" | analysis-delegation 자동 호출 |
| 11 | "색상 바꿔줘" | 직접 가이드 메시지 (스킬 호출 없이) |
| 12 | "네이버 플레이스 진단해줘" | naver-diagnosis 자동 호출 |

### 성공 기준
- 12개 중 9개 이상 기대 동작 달성
- 스킬 총 수: 15~16개 이하
- CLAUDE.md 총 줄 수: 350줄 이하
- **RPDCA 체인 완주율**: new-feature → (research →) writing-plans → executing-plans → verification 체인이 수동 개입 없이 끝까지 완주되는지 1회 이상 확인

---

## Step 간 실행 순서 의존성

```
Step 1 (항상 활성화 스킬 이관) ─ 독립
Step 2 (보조 스킬 이관) ─ 독립 (Step 1과 병렬 가능하지만, 순차 실행 권장)
Step 3 (프리셋 전환) ─ 독립
Step 4 (auto-detect 제거) ─ Step 2 이후 (simple-tweak 패턴 처리가 Step 2의 삭제를 전제)
Step 5 (description 리라이팅) ─ Step 1~4 이후 (남는 스킬 확정 필요)
Step 6 (체인 단순화) ─ Step 4 이후 (auto-detect 삭제 확인 필요)
Step 7 (external-reviewer) ─ Step 6 이후 (체인 구조 확정 필요)
Step 8 (훅 정리) ─ Step 6 이후 (삭제된 스킬 목록 확정 필요)
Step 9 (최종 정리) ─ Step 1~8 모두 이후
Step 10 (통합 테스트) ─ Step 9 이후
```

**주의**: Step 2에서 simple-tweak을 삭제하고, Step 4에서 user-prompt-handler.js의 simple-tweak 패턴을 수정한다. 이 순서가 바뀌면 Step 4에서 삭제되지 않은 스킬을 참조 변경하게 되어 혼란이 발생할 수 있다. 반드시 Step 2 → Step 4 순서를 지킨다.

---

## 변경 요약

| 항목 | Before | After |
|------|--------|-------|
| 스킬 수 | 43개 | 16~17개 (packet-capture 신규 포함) |
| "항상 활성화" 보장 | 0% | 100% (CLAUDE.md) |
| 오케스트레이션 체인 | 10단계 | 3~5단계 |
| 훅 스크립트 수 | 13개 | 11~12개 |
| 플러그인 버전 | 1.9.9 | 2.0.0 |

---

## 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| CLAUDE.md 규칙이 너무 길어서 Claude가 무시 | 이관한 규칙이 적용 안 됨 | 350줄 제한 엄수, 핵심만 추출 |
| SessionStart stdout이 system-reminder로 안 보임 | 프리셋 규칙 미적용 | CLAUDE.md 조건부 규칙으로 대안 전환 (Step 3) |
| user-prompt-handler.js 강화해도 Claude가 무시 | 스킬 미호출 지속 | description 리라이팅(Step 5)과 이중 보완 |
| 27개 스킬 삭제 후 예상 못한 참조 깨짐 | 런타임 에러 | Step별 커밋 + grep 검증 + 브랜치 복구 |
| skill-post.js 제거 시 체인 완주율 하락 | RPDCA 중간 이탈 | skill-post.js를 수정만 하고 유지 (Step 8 변경) |
