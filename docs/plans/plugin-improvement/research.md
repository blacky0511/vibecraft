# vibecraft 플러그인 전체 진단 리서치

> 작성일: 2026-04-03
> 목적: 플러그인이 의도대로 자동 트리거되지 않는 근본 원인 분석 및 개선 방향 도출

---

## Part 1. 핵심 요약 (사용자용)

### 현재 문제

"커맨드를 입력해야만 작동하고, 자동으로 구동되지 않는다"

### 근본 원인 3가지

1. **"항상 활성화" 스킬에 실제 활성화 메커니즘이 없음**
   - iron-law, cto-mindset, evidence-first 등이 "모든 대화에서 자동 활성화"라고 description에 적혀 있지만, Claude Code 플러그인 시스템에서 스킬을 **강제로** 컨텍스트에 로드하는 기술적 방법이 없음
   - Claude가 스킬 목록에서 description을 보고 **자발적으로** Skill 도구를 호출해야만 로드됨
   - 결과: "항상 활성화"는 희망사항일 뿐, 실제로는 거의 트리거되지 않음

2. **auto-detect 스킬 자체가 트리거되지 않음**
   - auto-detect가 모든 대화의 시작점이 되어야 하지만, 이것도 Claude가 자발적으로 호출해야 작동
   - UserPromptSubmit 훅이 `[SYSTEM]` 메시지로 스킬을 지정해도, 이것은 **권고**일 뿐 Claude가 무시할 수 있음
   - Claude는 "사용자 질문에 직접 답변하는 것"을 기본 행동으로 하므로, 중간에 스킬을 호출하는 단계를 건너뛸 가능성이 높음

3. **43개 스킬의 과부하**
   - 43개 스킬의 name + description이 모두 `available_skills` 목록에 표시됨
   - Claude가 매번 43개를 읽고 판단해야 하므로, "판단 피로"로 스킬 호출을 건너뛰는 경향 발생
   - 특히 "항상 활성화" 스킬 6개 + 워크플로우 스킬 + 프리셋 스킬이 뒤섞여 우선순위 판단이 어려움

### 체감 증상 정리

| 증상 | 원인 |
|------|------|
| 기능 요청했는데 바로 코드 작성 | auto-detect → new-feature → smart-pdca 체인이 트리거 안 됨 |
| TDD 없이 코드 작성 | iron-law가 로드되지 않음 |
| 추측으로 수정 | evidence-first가 로드되지 않음 |
| /feature 명령어를 쳐야만 워크플로우 시작 | auto-detect가 자동 호출되지 않아 수동 트리거만 작동 |
| 검증 없이 "완료"라고 답변 | verification이 자동 호출되지 않음 |

---

## Part 2. 상세 기술 분석 (개선용)

### 2.1 Claude Code 플러그인 스킬 트리거 메커니즘 이해

```
[사용자 입력]
    ↓
[available_skills 목록에서 description 스캔]
    ↓
[Claude가 "이 스킬을 호출할 가치가 있나?" 판단]
    ↓
├── 판단 YES → Skill 도구 호출 → SKILL.md 본문 로드 → 지시 따름
└── 판단 NO  → 직접 답변 (스킬 무시)
```

**핵심 포인트:**
- Claude는 "간단한 작업"이라고 판단하면 스킬을 호출하지 않고 직접 처리함
- description이 "모든 대화에서 활성화"라고 써도, Claude가 "지금 필요 없다"고 판단하면 무시
- 훅(UserPromptSubmit)의 stdout 메시지는 system-reminder로 표시되지만, Claude가 반드시 따라야 하는 강제력이 없음

### 2.2 카테고리별 스킬 분석

#### A. "항상 활성화" 스킬 (6개) — 가장 심각한 문제

| 스킬 | 주장 | 현실 |
|------|------|------|
| auto-detect | 모든 대화 시작 시 자동 | Claude가 자발적 호출해야 작동 |
| iron-law | 모든 코드 변경 시 적용 | 코드 작성 시 거의 호출 안 됨 |
| cto-mindset | 모든 대화에서 활성화 | 거의 호출 안 됨 |
| evidence-first | 모든 대화에서 활성화 | 거의 호출 안 됨 |
| session-context | 모든 개발 작업에서 활성화 | compact 시에만 간접 작동 (훅) |
| verification | 작업 마지막 단계에서 자동 | 수동 /verify만 작동 |

**문제의 본질:** Claude Code 플러그인 시스템에는 "항상 로드" 개념이 없음. 스킬은 **요청 시 로드(on-demand)** 방식만 지원.

#### B. 워크플로우 오케스트레이션 스킬 (체이닝 문제)

의도된 흐름:
```
auto-detect → new-feature → smart-pdca → research → writing-plans → executing-plans → verification
```

실제 흐름:
```
[사용자: "로그인 만들어줘"]
    ↓
Claude: (auto-detect 호출? → 안 함) → 바로 코드 작성 시작
```

**체이닝 실패 원인:**
1. 1단계(auto-detect)가 트리거 안 되면 전체 체인이 시작 안 됨
2. 각 단계 전환마다 Claude가 Skill 도구를 다시 호출해야 함
3. skill-post.js가 "다음 스킬 호출하라"고 안내하지만 강제력 없음

#### C. 보조 스킬 (15개) — 과잉 설계

| 분류 | 스킬들 | 트리거 빈도 |
|------|--------|-----------|
| 코드 품질 | impact-analysis, pre-flight-check, naming-consultant, consistency-enforcer, refactoring-radar, error-message-designer | 거의 안 됨 |
| 안전장치 | security-baseline, dependency-auditor, rollback-strategy | 거의 안 됨 |
| 문서 | doc-autopilot, test-strategy-advisor | 거의 안 됨 |
| 기타 | simple-tweak, error-simulation | 드물게 |

**문제:** 이 스킬들은 "자동으로 활성화"를 주장하지만, Claude가 코드를 작성하면서 중간에 별도 스킬을 호출할 동기가 없음. "코드 작성 중에 naming-consultant를 호출해야지"라고 판단하는 것은 비현실적.

#### D. 프리셋 스킬 (5개) — 간접적 문제

| 프리셋 | 트리거 조건 |
|--------|-----------|
| preset-nextjs | Next.js 감지 시 |
| preset-react | React 감지 시 |
| preset-spring | Spring Boot 감지 시 |
| preset-python | Python 감지 시 |
| preset-general | 기본 |

**문제:** preset-loader.js가 세션 시작 시 프리셋을 감지하지만, stdout으로 "감지됨"만 출력. 실제로 프리셋 스킬을 Claude가 Skill 도구로 호출하지 않으면 내용이 로드되지 않음.

### 2.3 훅 시스템 분석

#### 훅 실행 흐름과 실효성

```
SessionStart (1회)
├─ session-start.js    → "vibecraft 활성화됨" 표시  [정보 전달 ✓]
├─ preset-loader.js    → "preset-general 감지됨"    [정보 전달 ✓, 스킬 로드 ✗]
└─ team-session-restore.js → 팀 복구              [조건부 ✓]

UserPromptSubmit (매 입력)
└─ user-prompt-handler.js → [SYSTEM] 스킬 지정    [권고만, 강제 ✗]

PreToolUse (도구 사용 전)
├─ commit-guard.js     → 커밋 전 TDD 리마인더     [소프트 가드 ✓]
├─ git-safety-guard.js → 위험 명령 차단           [하드 가드 ✓, 유일하게 실효성 있음]
└─ pre-write-guard.js  → 50줄+ 코드 경고          [소프트 가드 ✓]

PostToolUse (Skill 실행 후)
└─ skill-post.js       → 다음 스킬 추천           [권고만, 강제 ✗]

PreCompact (컨텍스트 압축 전)
└─ context-compaction.js → RPDCA 상태 저장        [실효성 ✓]

Stop (응답 완료)
└─ unified-stop.js     → 명령어 리마인더           [정보 전달 ✓]

TaskCompleted (서브태스크 완료)
└─ rpdca-task-completed.js → 다음 단계 안내       [권고만, 강제 ✗]
```

#### 훅별 실효성 평가

| 훅 | 실효성 | 이유 |
|----|--------|------|
| git-safety-guard.js | **높음** | `decision: "block"` JSON 출력으로 실제 차단 |
| context-compaction.js | **중간** | 파일 기반 상태 저장은 작동하지만, 복구는 스킬 의존 |
| user-prompt-handler.js | **낮음** | [SYSTEM] 메시지를 Claude가 무시 가능 |
| skill-post.js | **낮음** | 다음 스킬 추천은 Claude가 무시 가능 |
| unified-stop.js | **낮음** | 리마인더 표시만, 행동 변화 없음 |
| commit-guard.js | **낮음** | 경고만, 커밋 차단하지 않음 |
| pre-write-guard.js | **낮음** | 경고만, 코드 작성 차단하지 않음 |

**핵심 발견:** 실제로 Claude의 행동을 바꿀 수 있는 훅은 `git-safety-guard.js`뿐. 나머지는 모두 "권고"나 "정보 전달"에 그침.

### 2.4 Description 품질 분석

#### 트리거 효과성 기준

Claude가 스킬을 호출하려면 description이:
1. **구체적인 사용 맥락**을 명시해야 함 (언제 쓰는지)
2. **적극적인 트리거 어조**를 가져야 함 ("반드시 사용하라" 수준)
3. **짧고 명확**해야 함 (Claude가 43개를 스캔하므로)

#### 현재 description 문제 유형

**Type 1: 수동적/모호한 description**
```
# iron-law (현재)
"vibecraft의 철칙. 모든 코드 변경에 적용되는 품질 규칙."
→ Claude 해석: "규칙이구나" → 호출 안 함 (자기가 알아서 하면 됨)

# 개선 방향
"코드를 작성하거나 수정할 때 반드시 이 스킬을 먼저 호출하라.
TDD 순서와 검증 증거를 확인하지 않으면 코드 품질이 보장되지 않는다."
```

**Type 2: 내부 용어 과다**
```
# smart-pdca (현재)
"작업 크기를 자동 판단하여 RPDCA 방법론의 강도를 조절하는 스킬."
→ Claude 해석: "RPDCA? 내가 이미 계획을 세울 수 있는데?" → 호출 안 함
```

**Type 3: "자동 활성화" 주장만 있고 실행 지시 없음**
```
# cto-mindset (현재)
"모든 대화에서 자동으로 활성화됨. 대기업 CTO처럼..."
→ "자동으로 활성화됨"은 Claude에게 "내가 호출 안 해도 된다"로 읽힘
```

**Type 4: 트리거 조건이 너무 넓음**
```
# auto-detect (현재)
"모든 대화에서 자동으로 활성화됨. 사용자 입력을 분석해서..."
→ "모든 대화"는 너무 광범위 → Claude가 "지금은 아닌 것 같다"고 판단
```

### 2.5 구조적 문제 정리

#### 문제 1: 스킬 수 과다 (43개)

- Claude의 available_skills 목록에 43개의 name + description이 모두 표시
- 각 description이 2~5줄 → 총 100~200줄의 메타데이터가 매 대화마다 컨텍스트 점유
- Claude의 "스킬 호출 결정"에 부담을 줌
- **비교:** 잘 작동하는 플러그인은 보통 5~15개 스킬

#### 문제 2: 스킬 간 역할 중복

| 중복 쌍 | 문제 |
|---------|------|
| auto-detect ↔ UserPromptSubmit 훅 | 같은 패턴 매칭을 스킬과 훅에서 이중으로 수행 |
| verification ↔ iron-law | "증거 없이 완료 없다"를 두 스킬이 모두 주장 |
| smart-pdca ↔ new-feature | 작업 크기 판단을 두 곳에서 수행 |
| session-context ↔ context-compaction.js | 세션 보존을 스킬과 훅이 이중 처리 |

#### 문제 3: 오케스트레이션 의존 체인이 너무 긺

```
auto-detect → new-feature → smart-pdca → research → brainstorming 
→ writing-plans → plan-critic → executing-plans → verification → gap-detector
```

- 10단계 체인에서 각 단계마다 Claude가 Skill 도구를 호출해야 함
- 1단계라도 빠지면 전체 워크플로우 붕괴
- 실제 동작: 대부분 1~2단계에서 체인 끊김

#### 문제 4: 훅과 스킬의 역할 혼선

| 역할 | 현재 구현 | 문제 |
|------|----------|------|
| 의도 감지 | 훅(user-prompt-handler.js) + 스킬(auto-detect) | 이중 구현 |
| 다음 단계 안내 | 훅(skill-post.js, unified-stop.js) + 스킬(smart-pdca) | 이중 구현 |
| 세션 보존 | 훅(context-compaction.js) + 스킬(session-context) | 이중 구현 |
| 코드 품질 | 훅(pre-write-guard.js, commit-guard.js) + 스킬(iron-law) | 이중 구현 |

---

## Part 3. 개선 방향 제안

### 전략 1: "항상 활성화" 스킬을 CLAUDE.md로 이관

**원리:** CLAUDE.md의 내용은 **항상** Claude의 컨텍스트에 로드됨. 스킬과 달리 Claude가 "호출"할 필요 없이 자동 적용됨.

**이관 대상:**
| 현재 스킬 | → CLAUDE.md 섹션 |
|----------|-----------------|
| iron-law | `## 코드 품질 철칙` |
| cto-mindset | `## 소통 원칙` |
| evidence-first | `## 추론 원칙` |
| session-context | `## 세션 맥락 보존 규칙` |
| security-baseline | `## 보안 원칙` |

**장점:**
- 100% 로드 보장 (스킬 호출 불필요)
- 매 대화에서 자동 적용
- 스킬 수 5개 감소 → 나머지 스킬의 트리거 정확도 향상

**단점:**
- CLAUDE.md가 길어짐 (현재 ~200줄 → +150줄 예상)
- 프로젝트별 CLAUDE.md에 넣어야 하므로 범용성 감소

**대안:** 플러그인의 CLAUDE.md에 넣으면 플러그인 설치만으로 자동 적용 가능. `.claude-plugin/` 아래에 `CLAUDE.md`를 배치하는 방법 확인 필요.

### 전략 2: 스킬 수 대폭 축소 (43개 → 15개 이내)

**원칙:** "Claude가 스스로 호출할 동기가 있는" 스킬만 남기고, 나머지는 병합하거나 CLAUDE.md/참조 문서로 이관

**유지 (독립 가치가 있는 스킬):**
1. new-feature — 새 기능 오케스트레이션
2. systematic-debugging — 디버깅
3. research — 코드베이스 리서치
4. writing-plans — 구현 계획
5. executing-plans — 계획 실행
6. verification — 검증 게이트
7. code-review-request — 코드 리뷰
8. deploy-guide — 배포
9. project-kickoff — 프로젝트 시작
10. reference-design — UI 디자인
11. welcome-guide — 인사/안내
12. analysis-delegation — 데이터 분석
13. team-orchestration — 팀 구성

**병합 후보:**
| 현재 | → 병합 대상 |
|------|-----------|
| smart-pdca | new-feature 내부 로직으로 통합 |
| brainstorming | writing-plans의 선행 단계로 통합 |
| auto-detect | 훅(user-prompt-handler.js)으로 완전 이관 |
| simple-tweak | CLAUDE.md 규칙으로 이관 |
| finishing-branch, git-workflow | 하나로 병합 |
| error-simulation | verification 내부로 통합 |

**제거/CLAUDE.md 이관 후보:**
| 스킬 | 이유 |
|------|------|
| naming-consultant | CLAUDE.md 규칙으로 충분 |
| consistency-enforcer | CLAUDE.md 규칙으로 충분 |
| refactoring-radar | 자동 트리거 비현실적 |
| doc-autopilot | CLAUDE.md 규칙으로 충분 |
| error-message-designer | CLAUDE.md 규칙으로 충분 |
| pre-flight-check | new-feature 내부 단계로 통합 |
| dependency-auditor | CLAUDE.md 규칙으로 충분 |
| rollback-strategy | CLAUDE.md 규칙으로 충분 |
| test-strategy-advisor | iron-law와 통합 |
| code-review-receive | code-review-request와 병합 |
| 5개 프리셋 | CLAUDE.md + 훅으로 이관 |

### 전략 3: Description 적극적 리라이팅

**현재 패턴 (수동적):**
```
"~하는 스킬. ~를 한다."
```

**개선 패턴 (적극적):**
```
"사용자가 ~할 때 반드시 이 스킬을 호출하라. ~하지 않으면 ~가 발생한다.
Triggers: [구체적 키워드 나열]"
```

**예시:**

```yaml
# new-feature (개선)
description: |
  사용자가 기능 추가, 구현, 개발을 요청할 때 반드시 이 스킬을 호출하라.
  "만들어줘", "추가해줘", "구현해줘", "개발해줘" 등의 요청이 있으면
  코드를 바로 작성하지 말고 이 스킬을 먼저 호출하여 작업 크기를 판단하라.
  이 스킬 없이 코드를 작성하면 계획 없는 구현으로 품질이 저하된다.
```

```yaml
# systematic-debugging (개선)
description: |
  에러, 버그, 오류, 실패 등 문제 해결 요청 시 반드시 이 스킬을 호출하라.
  추측으로 코드를 수정하지 말고, 이 스킬의 6단계 분석을 반드시 따르라.
  스킬 없이 수정하면 근본 원인을 놓치고 새로운 버그를 만들 위험이 있다.
```

### 전략 4: 훅 시스템 강화

**현재:** 훅의 stdout 메시지는 "권고"에 불과
**개선:** PreToolUse 훅의 `decision` 필드를 활용하여 실제 행동 제어

```javascript
// 예: Write/Edit 도구 사용 전, new-feature 스킬 미호출 시 경고 강화
// pre-write-guard.js 개선
if (lineCount > 50 && !skillInvoked('new-feature')) {
  // 차단은 하지 않되, 매우 강한 경고
  console.log(JSON.stringify({
    decision: "warn",  // 또는 실험적으로 "block"
    reason: "[vibecraft] 50줄 이상 코드를 작성하기 전에 /feature 명령으로 계획을 세우세요."
  }));
}
```

### 전략 5: 오케스트레이션 단순화

**현재 (10단계 체인):**
```
auto-detect → new-feature → smart-pdca → research → brainstorming 
→ writing-plans → plan-critic → executing-plans → verification → gap-detector
```

**개선 (3~5단계):**
```
[S 크기] 바로 코드 작성 → verification
[M 크기] new-feature(계획 포함) → 실행 → verification  
[L 크기] new-feature(리서치+계획) → team-orchestration → verification
```

- smart-pdca 로직을 new-feature 스킬 본문에 인라인
- brainstorming을 writing-plans의 선택적 단계로 통합
- plan-critic을 writing-plans 내부 프로세스로 통합

---

## Part 4. 우선순위 로드맵

### Phase 1: 즉시 개선 (높은 효과, 낮은 노력)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 1 | "항상 활성화" 5개 스킬 내용을 프로젝트 CLAUDE.md로 이관 | 100% 로드 보장 |
| 2 | auto-detect 스킬 제거, user-prompt-handler.js로 완전 이관 | 이중 구현 해소 |
| 3 | 핵심 스킬 10개의 description 적극적 리라이팅 | 트리거 빈도 대폭 향상 |
| 4 | 보조 스킬 15개를 CLAUDE.md 규칙으로 이관 | 스킬 수 감소 → 판단 피로 해소 |

### Phase 2: 구조 개선 (중간 효과, 중간 노력)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 5 | smart-pdca를 new-feature 내부로 통합 | 체인 1단계 축소 |
| 6 | brainstorming + writing-plans 병합 | 체인 1단계 축소 |
| 7 | 프리셋 스킬 5개를 훅 기반 CLAUDE.md 주입으로 전환 | 스킬 수 5개 감소 |
| 8 | pre-write-guard.js를 실제 차단(block)으로 전환 실험 | 무계획 코드 방지 |

### Phase 3: 고급 최적화 (장기)

| # | 작업 | 예상 효과 |
|---|------|----------|
| 9 | 스킬 description 자동 최적화 (skill-creator 활용) | 트리거 정확도 측정 가능 |
| 10 | 훅 기반 스킬 자동 호출 메커니즘 실험 | 강제 트리거 가능성 탐색 |
| 11 | 플러그인 레벨 CLAUDE.md 활용 방법 조사 | 프로젝트 무관 자동 적용 |

---

## Part 5. 검증 방법

### 개선 전/후 비교 테스트 케이스

| # | 사용자 입력 | 기대 동작 | 현재 동작 |
|---|-----------|----------|----------|
| 1 | "로그인 기능 만들어줘" | new-feature 스킬 호출 → 크기 판단 → 계획 | 바로 코드 작성 |
| 2 | "에러 나는데 고쳐줘" | systematic-debugging 호출 → 분석 | 추측으로 수정 |
| 3 | "이 코드 봐줘" | code-review-request 호출 | 직접 리뷰 |
| 4 | "커밋해줘" | iron-law 체크리스트 확인 | 바로 커밋 |
| 5 | "안녕" | welcome-guide 호출 | 일반 인사 |

### 성공 기준

- **Phase 1 완료 후:** 위 5개 테스트 중 4개 이상 기대 동작 달성
- **Phase 2 완료 후:** 체인 완주율 80% 이상 (new-feature → verification까지)
- **최종 목표:** 사용자가 슬래시 명령어 없이도 80% 이상의 상황에서 적절한 워크플로우 자동 실행

---

## 부록: 현재 스킬 전체 목록 (43개)

### 핵심 엔진 (6개)
auto-detect, smart-pdca, iron-law, cto-mindset, evidence-first, session-context

### 워크플로우 (12개)
new-feature, research, brainstorming, writing-plans, executing-plans, systematic-debugging, project-kickoff, reference-design, simple-tweak, welcome-guide, finishing-branch, git-workflow

### 검증/리뷰 (5개)
verification, code-review-request, code-review-receive, external-reviewer, error-simulation

### 보조 (CTO 스마트 스킬, 10개)
impact-analysis, pre-flight-check, dependency-auditor, rollback-strategy, naming-consultant, error-message-designer, consistency-enforcer, refactoring-radar, test-strategy-advisor, doc-autopilot

### 배포/분석 (3개)
deploy-guide, analysis-delegation, team-orchestration

### 특수 (2개)
naver-diagnosis, security-baseline

### 프리셋 (5개)
preset-nextjs, preset-react, preset-spring, preset-python, preset-general
