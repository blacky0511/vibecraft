# harness-engineering 구현 계획

**목표**: vibecraft 플러그인에 하네스 엔지니어링 기법을 적용하여 같은 모델로 더 좋은 결과물을 뽑는 환경을 완성한다
**아키텍처**: 3계층 하네스(CLAUDE.md 규칙 → 훅 강제 → Generator/Evaluator 분리)로 AI의 자기 평가 편향을 구조적으로 차단
**기술 스택**: Claude Code Plugin, Node.js 훅 스크립트, Markdown 스킬/에이전트, JSON 설정
**작성일**: 2026-04-13
**작업 크기**: L (Tier 1 4개 + Tier 2 5개, 총 9개 작업 영역)
**예상 소요 시간**: 약 3시간 40분 (Step 합산)

---

## 요약

이 계획은 vibecraft 플러그인을 "부탁" 수준의 규칙에서 "강제" 수준의 하네스로 승격시키는 작업이다. 리서치(`docs/plans/harness-engineering/research.md`) 섹션 11의 우선순위를 따라 Tier 1(빠른 승리) 4개와 Tier 2(구조 개선) 5개를 순서대로 적용한다.

### 아키텍처 3계층

1. **1계층 — CLAUDE.md 규칙**: Iron Law, Evidence First, CTO 마인드셋만 남기고 나머지 섹션은 `docs/rules/`로 분리
2. **2계층 — 훅 강제**: Stop 훅 prompt 타입으로 "증거 없이 완료 없다"를 결정론적으로 차단
3. **3계층 — Generator/Evaluator 분리**: ui-evaluator 서브에이전트(코드 접근 금지, Playwright MCP만 사용)로 UI 검증

### 전체 Step 개요

| Tier | Step 범위 | 내용 |
|------|-----------|------|
| Tier 1 | 1 ~ 12 | CLAUDE.md 분리, Stop 훅 prompt, english 중복 수정, vibecraft.md 버전 갱신 |
| Tier 2 | 13 ~ 29 | 에이전트 frontmatter, PostToolUseFailure 훅, RPDCA 상태 JSON, SubagentStop 훅, ui-evaluator |
| 마무리 | 30 ~ 32 | 버전 올림, sync-version, 최종 동작 확인 |

---

## 영향 파일 목록

### 신규 생성 (11개)
- `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\frontend-workflow.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\git-branch-strategy.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\code-quality-checklist.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\commit-message-guide.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\evidence-stop-guard.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\tool-failure-handler.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\rpdca-state.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\subagent-output-check.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\ui-evaluator.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\tests\test-user-prompt-handler.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\tests\test-rpdca-state.js`

### 수정 (22개)
- `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\hooks\hooks.json`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\user-prompt-handler.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\context-compaction.js`
- `C:\Users\앤기브마케팅\workspace\vibecraft\commands\vibecraft.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\.claude-plugin\plugin.json`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\backend-builder.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\code-analyzer.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\code-reviewer.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\code-simplifier.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\cto-lead.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\data-analyst.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\debugger.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\deploy-manager.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\doc-writer.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\frontend-builder.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\gap-detector.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\naver-logic-analyzer.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\plan-critic.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\agents\test-writer.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\skills\verification\SKILL.md`
- `C:\Users\앤기브마케팅\workspace\vibecraft\.claude-plugin\marketplace.json`

---

## Tier 1 — 빠른 승리

### Step 1 — docs/rules 폴더 생성 + 프론트엔드 워크플로 참조본 생성 (TDD 면제)

**전제 (E2 확인 완료)**: 프로젝트 `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md`에는 **프론트엔드 UI 개발 워크플로 섹션이 존재하지 않는다.** 해당 섹션은 전역 `~/.claude/CLAUDE.md`에만 있다. 따라서 Step 1은 "CLAUDE.md에서 분리"가 아니라 **전역 규칙의 프로젝트 로컬 참조본을 생성**하는 것이다. Step 4 커밋까지 프로젝트 CLAUDE.md에는 아무 내용도 제거되지 않는다.

**목적**: 프로젝트 안에 UI 워크플로 규칙을 명시적으로 두어, AI가 이 프로젝트에서 UI 작업을 할 때 전역 규칙을 로컬에서도 참조할 수 있게 한다. (당장 토큰 예산 절감 효과는 Step 3에서만 발생)

**사전 확인**:
- `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md`를 Read하여 "프론트엔드", "Git", "커밋 메시지" 섹션이 **없음**을 다시 확인한다. 있으면 즉시 plan을 재수정해야 한다.
- 전역 `~/.claude/CLAUDE.md`는 수정하지 않는다.

**작업**:
1. 폴더 생성: `mkdir -p "C:/Users/앤기브마케팅/workspace/vibecraft/docs/rules"`
2. 파일 생성: `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\frontend-workflow.md`

파일 내용:

```markdown
# 프론트엔드 UI 개발 워크플로

> 이 문서는 CLAUDE.md에서 분리된 프론트엔드 UI 개발 규칙이다.
> Next.js, 정적 웹 등 UI가 있는 프로젝트에만 적용한다. Python CLI/GUI 도구에는 적용하지 않는다.

## 핵심 원칙

AI를 주니어 개발자처럼 다룬다. 절대로 페이지를 바로 만들지 않는다. 반드시 아래 단계를 순서대로 진행한다.

## UI 개발 필수 순서

1. **레퍼런스 크롤링**: Playwright MCP로 참고 사이트의 테마 데이터를 JSON으로 추출
2. **테마 JSON 확정**: 추출된 테마를 사용자에게 보여주고 수정사항 반영
3. **공통 컴포넌트 먼저 제작**: 재사용 가능한 UI 컴포넌트를 먼저 제작
4. **컴포넌트 규칙 문서화**: 컴포넌트 목록, 위치, 사용법을 프로젝트 CLAUDE.md에 기록
5. **페이지 구현**: 만들어둔 컴포넌트를 조합하여 실제 페이지를 제작
6. **웹 가이드라인 검사**: 접근성, 폼 표준, 성능 확인

## 컴포넌트 관리 규칙

- 기존 컴포넌트 필수 사용: 프로젝트에 이미 만들어진 공통 컴포넌트가 있는지 반드시 먼저 확인한다
- 임의 생성 금지: 새로운 공통 컴포넌트가 필요하면 사용자에게 먼저 물어본다
- 중앙화 원칙: 비슷한 역할의 컴포넌트가 중복 생성되지 않도록 한다
- 컴포넌트 수정 시 영향 확인: 이 컴포넌트를 사용하는 다른 페이지에 영향이 없는지 확인한다

## 디자인 품질 가이드

- AI 티 제거: 이모지 남발, 뻔한 그라데이션, 범용 폰트만 사용, 균등 그리드 금지
- 테마 일관성: CSS 변수 또는 설정 파일로 관리
- 레퍼런스 기반 작업: "어떻게 할까요?" 대신 실제 레퍼런스 사이트 기반 구체적 제안
- 타이포그래피: 제목용과 본문용 폰트를 구분하여 페어링
- 여백과 레이아웃: 충분한 여백 활용

## 레퍼런스 테마 JSON 구조

(상세 구조는 전역 CLAUDE.md 5-4 참조)
```

**동작 확인**: `ls "C:/Users/앤기브마케팅/workspace/vibecraft/docs/rules/"`로 파일 존재 확인

---

### Step 2 — Git 브랜치 전략 + 코드 품질 + 커밋 가이드 참조본 생성 (TDD 면제)

**전제 (E2 확인 완료)**: 프로젝트 CLAUDE.md에는 Git 브랜치 전략 섹션과 커밋 메시지 가이드 섹션이 **없다.** "코드 품질 체크리스트" 섹션만 있다. 따라서 이 Step에서 생성하는 git-branch-strategy.md와 commit-message-guide.md는 전역 규칙의 프로젝트 로컬 참조본이다. code-quality-checklist.md만 Step 3에서 실제 CLAUDE.md 내용을 옮긴다.

**목적**: Git/커밋/코드 품질 규칙을 프로젝트 안에 명시적 참조 문서로 둔다.

**작업**:
1. 파일 생성: `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\git-branch-strategy.md`

```markdown
# Git 브랜치 관리 규칙

> 프로젝트 CLAUDE.md에서 분리된 Git 전략 문서.

## 브랜치 전략

```
main (원본)
  └── feature/기능이름
  └── fix/버그이름
```

## RPDCA 단계별 Git 행동 규칙

| RPDCA 단계 | Git 행동 |
|-----------|---------|
| `/pdca plan` 시작 | 브랜치 생성 제안 |
| `/pdca design` | 설계 문서 커밋 |
| `/pdca do` 진행 중 | 의미 있는 단위로 커밋 |
| `/pdca analyze` 통과 (>=90%) | PR 생성 제안 |
| `/pdca analyze` 미달 (<90%) | 계속 작업 |

## 브랜치 네이밍
- 한글 또는 영어 케밥케이스 사용
- 예: `feature/keyword-parallel-search`, `fix/bot-connection-error`

## 사용자 확인 필수 작업
- 브랜치 생성/삭제
- main 브랜치로 합치기 (PR/merge)
- 원격 저장소에 push
- 이미 커밋된 내용 수정 (amend)

## Git Worktree (병렬 작업)
- 폴더 네이밍: `{프로젝트명}-{브랜치명}`
- 위치: 메인 프로젝트 폴더와 같은 레벨
- 작업 완료 후 `git worktree remove`로 정리
```

2. 파일 생성: `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\code-quality-checklist.md`

```markdown
# 코드 품질 체크리스트 (항상 적용)

> 프로젝트 CLAUDE.md에서 분리된 코드 품질 체크리스트.

- 변수/함수명이 모호하면 더 명확한 이름 사용
- 프로젝트 내 기존 패턴과 일관성 유지
- 함수 30줄+ 또는 중첩 3단계+ 발견 시 리팩토링 제안
- 코드 변경 시 관련 README/주석이 오래됐으면 업데이트 제안
- 에러 메시지는 사용자용과 개발자 로그용 분리
- 구현 전 기존 코드에 유사 기능이 있는지 확인
- 새 패키지 설치 전 기존 대체재 확인
- 대규모 수정 전 git stash 또는 브랜치 생성
- 깨지면 위험한 것만 집중 테스트
- 코드 수정 전 해당 파일을 import하는 곳 확인
- 수치/스타일 1~3줄 변경은 사용자에게 직접 수정 기회 제공
- M/L 수정 후 관련 시나리오에서 오류 가능성 확인
```

3. 파일 생성: `C:\Users\앤기브마케팅\workspace\vibecraft\docs\rules\commit-message-guide.md`

```markdown
# 커밋 메시지 가이드

> 프로젝트 CLAUDE.md에서 분리된 커밋 메시지 규칙.

## 필수 규칙
- 한국어 작성
- 제목 50자 이내
- 제목과 본문 사이 빈 줄 1개

## 제목 형식
`[타입] 변경 내용 요약`

## 타입
- `[기능]` 새 기능 / `[수정]` 버그 수정 / `[개선]` 리팩토링
- `[스타일]` UI/포맷 / `[문서]` 문서 / `[설정]` 설정/의존성
- `[테스트]` 테스트 / `[삭제]` 제거

## 본문 규칙
- 변경된 파일 목록 불릿 정리
- 왜 변경했는지 이유 포함
- 관련 이슈: `관련: #이슈번호`
```

**동작 확인**: `ls "C:/Users/앤기브마케팅/workspace/vibecraft/docs/rules/"`로 4개 파일 확인

---

### Step 3 — 프로젝트 CLAUDE.md에서 "코드 품질 체크리스트"를 포인터로 대체 (TDD 면제)

**전제 (E2 확인 완료)**: 프로젝트 CLAUDE.md에서 실제로 분리 가능한 섹션은 **"## 코드 품질 체크리스트 (항상 적용)" 하나뿐이다.** 프론트엔드/Git/커밋 섹션은 프로젝트 CLAUDE.md에 없으므로 제거할 것이 없다. 따라서 Step 3는 원안의 기대(14,000자 → 6,500자)보다 절감 폭이 훨씬 작다 (대략 500~700자 감소 예상). **사용자에게 이 부분을 반드시 설명**하고, "토큰 예산 확보"는 Tier 1의 주요 효과가 아님을 명확히 한다.

**목적**: 프로젝트 CLAUDE.md에는 코드 품질 체크리스트의 본문 대신 `docs/rules/code-quality-checklist.md` 파일을 가리키는 포인터만 남긴다. 프론트엔드/Git/커밋 포인터는 "이 프로젝트가 해당 규칙도 따른다"는 선언 의미로 추가한다.

**사전 확인**:
- `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md`를 Read하여 220행부터 232행 근처의 "## 코드 품질 체크리스트 (항상 적용)" 섹션이 그대로 있는지 확인 (변경 없으면 Edit 적용 가능)
- 섹션 전후에 "## AI 행동 규칙 (항상 적용)"(183행)과 EOF 사이에 위치함을 확인

**작업**: 프로젝트 `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md`에서 "## 코드 품질 체크리스트 (항상 적용)" 섹션(220~232행)을 아래와 같이 포인터로 대체한다.

변경 전:
```markdown
## 코드 품질 체크리스트 (항상 적용)
- 변수/함수명이 모호하면 더 명확한 이름 사용
(... 12개 항목 ...)
- M/L 수정 후 관련 시나리오에서 오류 가능성 확인
```

변경 후:
```markdown
## 외부 규칙 문서 (점진적 공개)

아래 규칙들은 별도 파일로 분리했다. 관련 작업 시에만 해당 파일을 Read하여 참조한다.

- 코드 품질 체크리스트: `docs/rules/code-quality-checklist.md`
- 커밋 메시지 가이드: `docs/rules/commit-message-guide.md`
- Git 브랜치 전략: `docs/rules/git-branch-strategy.md`
- 프론트엔드 UI 워크플로: `docs/rules/frontend-workflow.md`

이 문서에는 **항상 적용되는 AI 행동 규칙(Iron Law, Evidence First, CTO 마인드셋)만** 남겨둔다.
```

**동작 확인**:
- `wc -c "C:/Users/앤기브마케팅/workspace/vibecraft/CLAUDE.md"` 실행하여 글자 수 감소 확인
- 현실적 목표: 실제 분리되는 섹션이 "코드 품질 체크리스트" 하나뿐이므로 **500~700자 감소**에 그친다. 토큰 절감은 이번 작업의 부수 효과일 뿐, Tier 1의 주효과는 "Stop 훅 prompt 강제 + 규칙 문서 외부화 기반 마련"에 있음을 사용자에게 명시한다.
- 포인터 교체 후 CLAUDE.md의 "AI 행동 규칙" 섹션(Iron Law, Evidence First, CTO 마인드셋, 세션 맥락 보존, 보안 기본 원칙)은 그대로 남아있어야 함. 실수로 제거되지 않았는지 Read로 확인.

---

### Step 4 — Tier 1 Step 1~3 커밋 (TDD 면제)

**사전 확인**: `git status`로 변경된 파일 4개(+1 수정) 확인

**작업**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add docs/rules/frontend-workflow.md docs/rules/git-branch-strategy.md docs/rules/code-quality-checklist.md docs/rules/commit-message-guide.md CLAUDE.md
git commit -m "[개선] 프로젝트 규칙 외부화 — docs/rules/ 신설 + 코드 품질 체크리스트 분리

변경 사항:
- docs/rules/frontend-workflow.md: 전역 프론트엔드 UI 워크플로의 프로젝트 로컬 참조본 신규
- docs/rules/git-branch-strategy.md: 전역 Git 브랜치 전략의 프로젝트 로컬 참조본 신규
- docs/rules/code-quality-checklist.md: 프로젝트 CLAUDE.md에서 분리한 코드 품질 체크리스트
- docs/rules/commit-message-guide.md: 전역 커밋 메시지 가이드의 프로젝트 로컬 참조본 신규
- CLAUDE.md: 코드 품질 체크리스트 섹션을 포인터로 대체 + 외부 규칙 문서 4개 링크 추가

이유: 향후 규칙 외부화의 기반을 마련하고, 현재 CLAUDE.md에 있던 코드 품질 체크리스트를 점진적 공개 패턴으로 옮겨 참조 기반으로 전환. 프론트엔드/Git/커밋 섹션은 프로젝트 CLAUDE.md에 없고 전역에만 있으므로, 프로젝트 로컬 참조본을 먼저 만들어 두고 후속 작업에서 점진적으로 활용"
```

**동작 확인**: `git log -1 --stat`로 커밋 확인

---

### Step 5 — user-prompt-handler.js debugging 패턴 회귀 방지 테스트 작성 (TDD 면제)

**라운드 2 재검토 결과**: 초안은 "english 필드 중복이 ENOENT/EACCES/ECONNREFUSED 매칭을 망가뜨린다"고 했지만, 같은 코드들이 **같은 `debugging` 항목의 `stackTrace` 정규식(line 54)에도 모두 포함**되어 있고 score 계산(line 237: `stackTrace`는 +2점)이 손실을 완전히 메운다. 즉 english 중복은 **코드 품질 문제**이지 실제 버그가 아니다. 따라서 Step 5는 **TDD Red를 기대하는 테스트**가 아니라 **앞으로도 해당 에러 코드 감지가 깨지지 않도록 하는 회귀 방지 테스트**로 재포지셔닝한다.

**목적**: 디버깅 패턴(한글 + 영문 + 에러 코드)이 현재 동작 기준으로 모두 `systematic-debugging` 스킬로 라우팅되는지 **고정**한다. 향후 Step 6에서 english 중복 정리 후에도 결과가 동일해야 한다.

**사전 확인**:
- `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\user-prompt-handler.js` 48~58행의 debugging 항목 구조 확인
- 51~52행 english 중복, 54행 stackTrace가 ENOENT/EACCES/ECONNREFUSED/ERR_를 동일하게 포함함을 재확인

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\tests\test-user-prompt-handler.js` 신규 생성

```javascript
#!/usr/bin/env node
// user-prompt-handler.js 패턴 매칭 테스트
// 실행: node tests/test-user-prompt-handler.js

const { spawnSync } = require('child_process');
const path = require('path');

const handler = path.resolve(__dirname, '../scripts/user-prompt-handler.js');

function runWithPrompt(prompt) {
  const input = JSON.stringify({ prompt });
  const result = spawnSync('node', [handler], {
    input,
    encoding: 'utf8',
    timeout: 5000,
  });
  return result.stdout || '';
}

const tests = [
  { prompt: 'ENOENT 에러 나요', expect: '디버깅' },
  { prompt: 'EACCES permission denied', expect: '디버깅' },
  { prompt: 'ECONNREFUSED 127.0.0.1', expect: '디버깅' },
  { prompt: 'ERR_MODULE_NOT_FOUND', expect: '디버깅' },
  { prompt: 'TypeError: Cannot read', expect: '디버깅' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const out = runWithPrompt(t.prompt);
  if (out.includes(t.expect)) {
    console.log(`PASS: "${t.prompt}"`);
    passed++;
  } else {
    console.log(`FAIL: "${t.prompt}" (기대: ${t.expect})`);
    console.log(`  출력: ${out.slice(0, 200)}`);
    failed++;
  }
}

console.log(`\n결과: ${passed}/${tests.length} 통과`);
process.exit(failed > 0 ? 1 : 0);
```

**기대 결과**:
```bash
mkdir -p "C:/Users/앤기브마케팅/workspace/vibecraft/tests"
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-user-prompt-handler.js"
```

**이 테스트는 처음부터 통과해야 정상이다.** 현재 stackTrace 정규식이 english 중복 손실을 가려주기 때문에 5/5 모두 `디버깅`으로 잡힌다. 만약 실패한다면:
- 5개 테스트 중 일부가 Red → user-prompt-handler의 현재 동작이 우리가 가정한 것과 다름. Step 6 수정 전에 원인 조사 필요.
- 5/5 통과 → 회귀 방지 기준선 확보. Step 6 수정 후에도 동일하게 5/5가 나와야 한다.

---

### Step 6 — user-prompt-handler.js english 중복 필드 정리 (코드 품질)

**목적**: 51~52행의 `english` 필드가 동일 이름으로 두 번 정의되어 두 번째가 첫 번째를 덮어쓰고 있는 코드 품질 이슈를 정리한다. **현재 동작은 정상이므로(stackTrace 정규식이 가려줌) 이 수정은 버그 수정이 아닌 중복 제거이며, 기능 회귀가 없음이 Step 5 테스트로 보장된다.**

**사전 확인**: 51~52행이 현재 동일 필드명으로 두 번 정의되어 있고, 첫 번째 줄에만 ECONNREFUSED/ENOENT/EACCES/ERR_ 코드가 포함됨. 두 번째 줄이 덮어쓰기 때문에 **JavaScript 객체 관점에서는** 첫 줄이 실효성 없음. 그러나 같은 항목의 stackTrace(line 54) 정규식이 같은 에러 코드를 모두 포함하여 감지가 유지됨.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\user-prompt-handler.js` 수정

변경 전 (51~52행):
```javascript
    english: /error|bug|fix|crash|exception|fail|broken|not\s?work|debug|TypeError|Cannot\s+read|undefined\s+is\s+not|null\s+pointer|stack\s?trace|Traceback|issue|problem|wrong|stuck|hanging|timeout|CORS|404|500|502|503|ECONNREFUSED|ENOENT|EACCES|ERR_/i,
    english: /error|bug|fix|crash|exception|fail|broken|not\s?work|debug|TypeError|Cannot\s+read|undefined\s+is\s+not|null\s+pointer|stack\s?trace|Traceback|issue|problem|wrong|stuck|hanging|timeout|CORS|404|500|502|503/i,
```

변경 후 (한 줄로 통합, 모든 에러 코드 포함):
```javascript
    english: /error|bug|fix|crash|exception|fail|broken|not\s?work|debug|TypeError|Cannot\s+read|undefined\s+is\s+not|null\s+pointer|stack\s?trace|Traceback|issue|problem|wrong|stuck|hanging|timeout|CORS|404|500|502|503|ECONNREFUSED|ENOENT|EACCES|ERR_/i,
```

(즉, 두 번째 줄을 삭제하여 첫 번째 줄만 남김)

**통과 확인 (회귀 방지)**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-user-prompt-handler.js"
```

기대 결과: `결과: 5/5 통과` — Step 5에서 이미 통과하던 것이 Step 6 수정 후에도 그대로 통과해야 한다. 한 개라도 실패하면 rollback.

---

### Step 7 — english 중복 수정 커밋

**작업**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add scripts/user-prompt-handler.js tests/test-user-prompt-handler.js
git commit -m "[개선] user-prompt-handler debugging 항목 english 중복 정리

변경 사항:
- scripts/user-prompt-handler.js: debugging 항목의 중복된 english 필드를 하나로 통합 (ECONNREFUSED/ENOENT/EACCES/ERR_ 포함 정규식 유지)
- tests/test-user-prompt-handler.js: 디버깅 패턴 회귀 방지 테스트 5종 추가

이유: 51~52행에서 english 키가 중복 정의되어 두 번째가 첫 번째를 덮어쓰는 코드 품질 문제. 현재는 stackTrace 정규식이 같은 에러 코드를 포함하여 감지가 유지되지만, 중복 자체가 향후 리팩토링 시 오해의 원인이 되므로 정리. 회귀 방지 테스트로 동작 불변을 보장"
```

---

### Step 8 — Stop 훅 evidence-stop-guard.js 테스트 작성 (TDD 필수)

**목적**: Stop 훅 prompt 타입이 코드 수정 후 "증거 키워드 없이 종료"를 감지해 block 반환하는지 테스트한다.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\tests\test-evidence-stop-guard.js` 신규 생성 (tests 폴더 그대로 사용)

```javascript
#!/usr/bin/env node
// evidence-stop-guard.js 테스트

const { spawnSync } = require('child_process');
const path = require('path');

const guard = path.resolve(__dirname, '../scripts/evidence-stop-guard.js');

function run(payload) {
  const result = spawnSync('node', [guard], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return { stdout: result.stdout, exitCode: result.status };
}

const tests = [
  {
    name: 'stop_hook_active이면 통과 (무한 루프 방지)',
    payload: { stop_hook_active: true, transcript_path: '/nonexistent' },
    expectDecision: null,
  },
  {
    name: 'transcript_path가 존재하지 않으면 통과',
    payload: { stop_hook_active: false, transcript_path: '/nonexistent-path-xyz' },
    expectDecision: null,
  },
  {
    name: 'transcript_path 자체가 빈 값이면 통과',
    payload: { stop_hook_active: false },
    expectDecision: null,
  },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const { stdout, exitCode } = run(t.payload);
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch {}
  const decision = parsed?.decision || null;

  if (decision === t.expectDecision) {
    console.log(`PASS: ${t.name}`);
    passed++;
  } else {
    console.log(`FAIL: ${t.name} (기대: ${t.expectDecision}, 실제: ${decision})`);
    failed++;
  }
}

console.log(`\n결과: ${passed}/${tests.length} 통과`);
process.exit(failed > 0 ? 1 : 0);
```

**추가 테스트 의무 (라운드 2 보강)**: 위 3개 테스트만으로는 "마지막 user 턴 이후 Edit만 감지" 로직과 "증거 키워드 검출" 로직이 검증되지 않는다. 배포 전 수동으로 아래 시나리오를 최소 1회 돌려 확인한다:

1. **설명만 한 턴은 통과**: Claude Code에서 "이 파일 읽어줘"로 응답만 받은 직후 Stop 훅이 통과(block JSON 없음)하는지 확인
2. **Edit 후 증거 없으면 block**: 코드를 Edit한 뒤 "수정 완료"만 응답하면 evidence-stop-guard가 block을 반환하는지 확인
3. **Edit 후 "PASS 3/3 통과" 포함 응답이면 통과**: 증거 키워드가 last_assistant_message에 있으면 block 없이 통과하는지 확인

**실패 확인**: evidence-stop-guard.js가 아직 없으므로 실행 시 실패 확인.
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-evidence-stop-guard.js"
```

---

### Step 9 — evidence-stop-guard.js 스크립트 구현 (TDD 필수)

**목적**: Stop 훅에서 "증거 없이 완료"를 결정론적으로 차단한다.

**공식 문서 확인 완료 (E2)**: Stop 훅 입력은 `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `stop_hook_active`, 그리고 **`last_assistant_message`**(Claude의 최종 응답 텍스트) 필드를 포함한다. 증거 키워드 검사는 `last_assistant_message`만으로 충분해 transcript 파일 파싱 없이 바로 수행 가능하다. 다만 "최근에 Edit/Write가 있었는가?"는 여전히 transcript JSONL을 순회해야 한다. 실제 JSONL 레코드 구조는 `{type:"assistant", message:{role:"assistant", content:[{type:"tool_use", name:"Edit", ...}, ...]}}`이므로 `content[0]`만 확인하면 놓치고 `content.some(...)`으로 순회해야 한다.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\evidence-stop-guard.js` 신규 생성

```javascript
#!/usr/bin/env node

/**
 * vibecraft Stop 훅 — "증거 없이 완료 없다" 결정론적 강제
 *
 * 최근 응답에서 코드 수정이 있었는지 확인하고,
 * 증거(테스트 실행/동작 확인/로그 출력)가 없으면 block 반환한다.
 *
 * 참고한 공식 스키마:
 * - input: { stop_hook_active, transcript_path, last_assistant_message, ... }
 * - JSONL 레코드: { type:"assistant", message:{ content:[ {type:"tool_use", name:"Edit"}, ... ] } }
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// 증거 키워드 (이 중 하나라도 있으면 통과)
const EVIDENCE_KEYWORDS = [
  'PASS', '통과', '성공',
  'npm test', 'pytest', 'jest', 'vitest',
  'exit 0', 'exit code 0', '종료 코드 0',
  '테스트 결과', '실행 결과',
  'Playwright', 'snapshot',
  '로그 확인', '로그 출력',
];

// 코드 수정 도구 이름
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];

// Windows/POSIX 호환 stdin 읽기 (파일디스크립터 0)
function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    // fallback: /dev/stdin (POSIX)
    try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
  }
}

// 홈 디렉토리 경로(~)를 확장
function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};

  // 무한 루프 방지: 이미 한 번 block했으면 통과
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  const transcriptPath = expandHome(input.transcript_path);
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // transcript 전체 읽고, 마지막 user 턴 이후 레코드만 사용.
  // (이전 턴의 Edit까지 포함하면 현재 턴이 설명만이어도 block이 발동할 수 있음)
  const transcriptRaw = fs.readFileSync(transcriptPath, 'utf8');
  const allLines = transcriptRaw.split('\n').filter(Boolean);

  // 역순으로 가장 최근 user 메시지 인덱스 찾기
  let lastUserIdx = -1;
  for (let i = allLines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(allLines[i]);
      // user 메시지: type==='user' 또는 message.role==='user'
      if (e?.type === 'user' || e?.message?.role === 'user') {
        lastUserIdx = i;
        break;
      }
    } catch {}
  }

  // user 턴 이후 라인만 검사 (없으면 최근 100줄로 fallback)
  const afterUser = lastUserIdx >= 0
    ? allLines.slice(lastUserIdx + 1)
    : allLines.slice(-100);
  // 대용량 방어: 너무 길면 마지막 200줄까지만
  const recent = afterUser.length > 200 ? afterUser.slice(-200) : afterUser;

  // 코드 수정이 있었는지 확인 — content 배열 전체 순회
  let hasEdit = false;
  for (const line of recent) {
    try {
      const entry = JSON.parse(line);
      const content = entry?.message?.content;
      if (Array.isArray(content)) {
        const found = content.some(
          c => c?.type === 'tool_use' && EDIT_TOOLS.includes(c.name)
        );
        if (found) {
          hasEdit = true;
          break;
        }
      }
    } catch {}
  }

  if (!hasEdit) {
    // 코드 수정 없음 — 통과
    process.exit(0);
  }

  // 증거 키워드 검사: last_assistant_message 우선, 없으면 user 턴 이후 레코드에서 검색
  const lastMsg = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : '';
  const searchText = lastMsg || recent.join('\n');
  const hasEvidence = EVIDENCE_KEYWORDS.some(k => searchText.includes(k));

  if (hasEvidence) {
    process.exit(0);
  }

  // 차단
  const response = {
    decision: 'block',
    reason:
      '[Iron Law 위반] 코드를 수정했지만 검증 증거가 없습니다. ' +
      '테스트 실행 결과, 동작 확인 로그, Playwright 스냅샷 중 하나 이상을 제시한 뒤 응답을 마무리하세요. ' +
      '수정 내역을 검증할 수 없는 상태로 완료하면 버그가 그대로 배포됩니다.',
  };

  console.log(JSON.stringify(response));
  process.exit(0);
} catch (error) {
  // 오류 시 조용히 통과 (Stop 훅이 플러그인을 깨뜨리면 안 됨)
  process.exit(0);
}
```

**통과 확인**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-evidence-stop-guard.js"
```

기대: `결과: 2/2 통과`

---

### Step 10 — hooks.json에 Stop 훅 prompt 타입 추가 (TDD 면제)

**목적**: evidence-stop-guard.js를 Stop 이벤트에 등록한다. 기존 unified-stop.js와 함께 **병렬**로 실행된다.

**사전 확인**: `C:\Users\앤기브마케팅\workspace\vibecraft\hooks\hooks.json`의 Stop 이벤트 현재 구조 확인. 현재는 unified-stop.js 1개만 등록.

**공식 문서 확인 완료 (E2)**: Claude Code 훅 문서(Hooks reference)에 따르면 **동일 이벤트의 매칭 훅은 병렬 실행**이며 배열 순서는 실행 순서를 보장하지 않는다. 두 훅의 stdout은 각각 독립적으로 처리된다: evidence-stop-guard가 `{"decision":"block"}` JSON을 출력하면 Claude가 차단되고, unified-stop의 plain text는 그대로 사용자에게 표시된다. 따라서 "unified-stop 앞에 배치" 같은 순서 의존은 성립하지 않고, 단순히 두 훅을 Stop 이벤트 배열에 모두 등록하면 된다.

**작업**: hooks.json의 Stop 이벤트 부분을 아래와 같이 수정

변경 전:
```json
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js\"",
            "timeout": 10000
          }
        ]
      }
    ],
```

변경 후 (두 훅은 병렬로 실행되며 배열 순서는 실행 순서와 무관):
```json
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/evidence-stop-guard.js\"",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js\"",
            "timeout": 10000
          }
        ]
      }
    ],
```

**동작 확인**:
- `node -e "JSON.parse(require('fs').readFileSync('C:/Users/앤기브마케팅/workspace/vibecraft/hooks/hooks.json','utf8'))"` 실행하여 JSON 유효성 확인
- Claude Code 재시작 후 수동 확인 필요 (주의: 이 훅은 실제 동작 검증이 Claude Code 세션 재시작 이후에만 가능함)

---

### Step 11 — Stop 훅 prompt 타입 커밋

**작업**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add scripts/evidence-stop-guard.js tests/test-evidence-stop-guard.js hooks/hooks.json
git commit -m "[기능] Stop 훅에 evidence-stop-guard 추가 — Iron Law 결정론적 강제

변경 사항:
- scripts/evidence-stop-guard.js: 코드 수정 후 증거 키워드 없이 종료 시 block 반환
- tests/test-evidence-stop-guard.js: stop_hook_active 무한 루프 방지 + 통과 케이스 테스트
- hooks/hooks.json: Stop 이벤트에 evidence-stop-guard 추가 (unified-stop 앞에 배치)

이유: '증거 없이 완료 없다' 규칙이 CLAUDE.md에만 있으면 '부탁' 수준이라 AI가 종종 무시함. Stop 훅 prompt 타입으로 결정론적 차단 레이어를 추가해 '강제' 수준으로 승격"
```

---

### Step 12 — commands/vibecraft.md 버전/수량 업데이트 (TDD 면제)

**목적**: 구버전 정보를 v2.1.0 기준으로 갱신한다.

**사전 확인**: `C:\Users\앤기브마케팅\workspace\vibecraft\commands\vibecraft.md` 75~78행에 구버전 정보 있음 (v1.9.6, 스킬 41개)

**작업**: 파일 수정

변경 전 (75행):
```markdown
- 스킬 41개 | 에이전트 13개 | 프리셋 5개 | 템플릿 9개 | 명령어 16개
```

변경 후:
```markdown
- 스킬 17개 | 에이전트 14개 | 프리셋 5개 | 템플릿 9개 | 명령어 15개
```

변경 전 (78행):
```markdown
vibecraft v1.9.6
```

변경 후:
```markdown
vibecraft v2.1.0
```

**동작 확인**: Read로 수정 확인

**커밋**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add commands/vibecraft.md
git commit -m "[문서] vibecraft.md 버전/수량 정보 갱신

변경 사항:
- commands/vibecraft.md: 스킬 41→17개, 에이전트 13→14개, 명령어 16→15개, 버전 v1.9.6→v2.1.0

이유: v2.0 구조 개편 이후 구버전 수치가 그대로 남아 있어 사용자가 실제 구성과 다른 정보를 보게 됨"
```

---

## Tier 2 — 구조 개선

### Step 13 — 에이전트 frontmatter 현재 상태 점검 (TDD 면제)

**목적**: 14개 에이전트에 추가할 `tools`/`maxTurns`를 일괄 계획한다.

**라운드 2 주의 — 축소 리스크**: 현재 에이전트 파일에 `tools` 필드가 없는 것들은 **모든 도구를 상속**한다(공식 문서: "Subagents inherit all tools from the main conversation by default"). 여기서 `tools: [Read, Grep, ...]` 같은 화이트리스트를 추가하면 **기존에 암묵적으로 쓰던 도구가 일제히 차단**된다. 따라서 아래 작업을 순서대로 선행한다:

1. 각 에이전트 파일의 본문(markdown 내용)을 Read하여 **실제로 언급하는 도구/작업 동사**를 추출한다. 예:
   - "git 명령 실행" → Bash 필요
   - "파일 수정" → Edit / Write
   - "서브에이전트 위임" → Agent
2. 아래 매핑표의 tools 목록이 위 실제 필요 도구를 **모두 포함**하는지 대조한다.
3. 하나라도 누락되면 매핑표를 수정하거나 `disallowedTools` 방식(기본 상속 + 위험 도구만 빼기)으로 전환한다.

**작업**: 14개 에이전트 파일을 Read하여 현재 frontmatter 상태 정리. 아래 매핑표는 **초안 제안값**이며 위 절차로 검증 후 확정한다:

| 에이전트 | 역할 | allowedTools | maxTurns |
|----------|------|-------------|----------|
| code-analyzer | 읽기 전용 분석 | Read, Grep, Glob | 15 |
| plan-critic | 계획 비평 + 수정 | Read, Write, Edit, Glob, Grep, Bash, Agent | 25 |
| gap-detector | plan vs 코드 비교 | Read, Grep, Glob, Bash | 15 |
| code-reviewer | 코드 리뷰 (읽기 전용) | Read, Grep, Glob, Bash | 20 |
| code-simplifier | 코드 간소화 | Read, Edit, Grep, Glob, Bash | 20 |
| frontend-builder | 프론트엔드 구현 | Read, Write, Edit, Grep, Glob, Bash | 30 |
| backend-builder | 백엔드 구현 | Read, Write, Edit, Grep, Glob, Bash | 30 |
| test-writer | 테스트 작성 | Read, Write, Edit, Grep, Glob, Bash | 20 |
| debugger | 디버깅 전문 | Read, Edit, Grep, Glob, Bash | 25 |
| deploy-manager | 배포 관리 | Read, Edit, Grep, Glob, Bash | 20 |
| doc-writer | 문서 작성 | Read, Write, Edit, Grep, Glob | 15 |
| data-analyst | 데이터 분석 | Read, Grep, Glob, Bash | 20 |
| cto-lead | 팀 리드 (위임) | Read, Grep, Glob, Agent, Bash | 25 |
| naver-logic-analyzer | 네이버 로직 분석 | Read, Grep, Glob, Bash | 15 |

**메모**: plan-critic은 이미 `tools:` 필드를 사용 중이므로 `allowedTools`로 키 이름을 통일할지 결정. (Claude Code 문서 기준 `tools`가 에이전트 frontmatter 표준 키임을 확인 후 진행)

---

### Step 14 — 읽기 전용 에이전트 4개 frontmatter 수정 (TDD 면제)

**대상**: code-analyzer, gap-detector, code-reviewer, naver-logic-analyzer

**작업**: 각 파일의 frontmatter에 `tools:`와 `maxTurns:` 추가 (이미 있으면 갱신)

예시 — `C:\Users\앤기브마케팅\workspace\vibecraft\agents\code-analyzer.md`:

변경 전:
```yaml
---
name: code-analyzer
description: 기존 코드를 분석하고 영향 범위를 파악하며 의존성을 확인한다. 코드 변경 전에 항상 먼저 실행되어 안전한 수정을 위한 정보를 제공한다.
model: opus
permissionMode: plan
---
```

변경 후:
```yaml
---
name: code-analyzer
description: 기존 코드를 분석하고 영향 범위를 파악하며 의존성을 확인한다. 코드 변경 전에 항상 먼저 실행되어 안전한 수정을 위한 정보를 제공한다.
model: opus
permissionMode: plan
tools:
  - Read
  - Grep
  - Glob
maxTurns: 15
---
```

동일 패턴으로 gap-detector(Read/Grep/Glob/Bash, 15), code-reviewer(Read/Grep/Glob/Bash, 20), naver-logic-analyzer(Read/Grep/Glob/Bash, 15) 적용.

**동작 확인**: 각 파일 Read로 확인

---

### Step 15 — 코드 작성 에이전트 4개 frontmatter 수정 (TDD 면제)

**대상**: frontend-builder, backend-builder, test-writer, code-simplifier

**작업**: 각 파일에 `tools:`와 `maxTurns:` 추가

- frontend-builder: Read, Write, Edit, Grep, Glob, Bash / maxTurns 30
- backend-builder: Read, Write, Edit, Grep, Glob, Bash / maxTurns 30
- test-writer: Read, Write, Edit, Grep, Glob, Bash / maxTurns 20
- code-simplifier: Read, Edit, Grep, Glob, Bash / maxTurns 20

---

### Step 16 — 기타 에이전트 6개 frontmatter 수정 (TDD 면제)

**대상**: plan-critic, debugger, deploy-manager, doc-writer, data-analyst, cto-lead

**작업**: 각 파일에 `tools:`와 `maxTurns:` 추가

- plan-critic: 이미 tools 있음. maxTurns 25 추가만
- debugger: Read, Edit, Grep, Glob, Bash / maxTurns 25
- deploy-manager: Read, Edit, Grep, Glob, Bash / maxTurns 20
- doc-writer: Read, Write, Edit, Grep, Glob / maxTurns 15
- data-analyst: Read, Grep, Glob, Bash / maxTurns 20
- cto-lead: Read, Grep, Glob, Agent, Bash / maxTurns 25

**동작 확인**: `grep -l "maxTurns" agents/*.md`로 14개 파일 모두에 maxTurns가 있는지 확인

---

### Step 17 — 에이전트 frontmatter 커밋

```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add agents/
git commit -m "[개선] 에이전트 14개에 tools/maxTurns 명시

변경 사항:
- agents/*.md: 각 에이전트 frontmatter에 tools 화이트리스트와 maxTurns 추가
- 읽기 전용 에이전트(code-analyzer, gap-detector 등)는 Write/Edit 제외
- 코드 작성 에이전트(frontend-builder 등)만 Write/Edit 허용

이유: 지금까지 에이전트가 모든 도구에 접근 가능해 읽기 전용이어야 할 에이전트도 실수로 파일을 수정할 수 있었음. 역할에 따라 도구를 제한해 Generator/Evaluator 분리 원칙을 강화"
```

---

### Step 18 — tool-failure-handler.js 구현 (TDD 면제 — PostToolUseFailure 전용)

**목적**: 도구 실패 시 에러 코드를 사람이 읽기 쉬운 진단 메시지로 변환해 Claude에 `additionalContext`로 주입한다.

**공식 문서 확인 완료 (E2)**: Claude Code 훅 문서(Hooks reference)에 따르면:
- `PostToolUse`는 **성공한 도구 호출 뒤에만** 실행된다 ("Runs immediately after a tool completes successfully"). 실패 감지에 사용할 수 없다.
- `PostToolUseFailure`는 **정식 이벤트**이며 도구 실패 시 발동한다. 입력은 `tool_name`, `tool_input`, `tool_use_id`, 최상위 `error`(실패 설명 문자열), 선택적 `is_interrupt`를 포함한다. matcher는 tool name 기반으로 PreToolUse와 동일하게 동작한다.
- 응답은 `{"hookSpecificOutput": {"hookEventName": "PostToolUseFailure", "additionalContext": "..."}}` 형태로 반환하면 Claude가 다음 턴에 해당 맥락을 받는다.

**중요**: 원래 초안은 "PostToolUseFailure가 지원되지 않으므로 PostToolUse에 matcher를 붙인다"고 잘못 가정했지만, 공식 이벤트가 존재하므로 `PostToolUseFailure`를 사용한다. 이로써 성공 호출마다 스크립트가 실행되는 성능 부담도 원천적으로 사라진다.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\tool-failure-handler.js` 신규 생성

```javascript
#!/usr/bin/env node

/**
 * vibecraft PostToolUseFailure 핸들러
 *
 * 도구 실행이 실패했을 때 에러 패턴을 진단해 Claude에 additionalContext로 힌트를 주입한다.
 * 같은 실수를 반복하지 않도록 다음 시도 전에 맥락을 제공한다.
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "PostToolUseFailure",
 *   tool_name: "Bash" | "Edit" | ...,
 *   tool_input: { ... },
 *   tool_use_id: "toolu_...",
 *   error: "Command exited with non-zero status code 1",
 *   is_interrupt?: false
 * }
 */

const fs = require('fs');

const DIAGNOSTICS = [
  {
    pattern: /ENOENT/,
    hint: '파일 경로에 오타가 있거나 해당 파일이 아직 존재하지 않을 수 있습니다. Glob/ls로 경로를 먼저 확인하세요.',
  },
  {
    pattern: /EACCES/,
    hint: '권한 부족입니다. 파일 권한 확인, 또는 상위 디렉토리 쓰기 권한을 확인하세요.',
  },
  {
    pattern: /ECONNREFUSED/,
    hint: '대상 서버가 떠 있지 않습니다. 로컬 서버면 먼저 `npm run dev` 같은 명령으로 구동했는지 확인하세요.',
  },
  {
    pattern: /EADDRINUSE/,
    hint: '포트가 이미 사용 중입니다. 기존 프로세스를 종료하거나 다른 포트로 변경하세요.',
  },
  {
    pattern: /ERR_MODULE_NOT_FOUND|Cannot find module/,
    hint: '모듈을 찾지 못했습니다. package.json의 의존성 + node_modules 설치 상태를 확인하세요.',
  },
  {
    pattern: /TypeError:\s+Cannot\s+read/,
    hint: 'null/undefined 객체에 접근했습니다. 방어 코드(optional chaining 등) 추가를 검토하세요.',
  },
  {
    pattern: /command not found|is not recognized/i,
    hint: 'CLI 명령어를 찾을 수 없습니다. 설치 여부와 PATH를 확인하세요.',
  },
];

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};

  // 사용자 인터럽트로 인한 실패는 힌트 불필요
  if (input.is_interrupt === true) {
    process.exit(0);
  }

  // error 필드가 핵심 신호. 빈 값이면 조용히 종료.
  const errorText = typeof input.error === 'string' ? input.error : '';
  if (!errorText) {
    process.exit(0);
  }

  const matched = DIAGNOSTICS.filter(d => d.pattern.test(errorText));
  if (matched.length === 0) {
    process.exit(0);
  }

  const hintLines = ['[도구 실패 진단]'];
  matched.forEach((d, i) => {
    hintLines.push(`  ${i + 1}. ${d.hint}`);
  });
  hintLines.push('다음 시도 전에 위 힌트를 참고하세요.');

  // 공식 반환 형식: hookSpecificOutput.additionalContext
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUseFailure',
      additionalContext: hintLines.join('\n'),
    },
  };

  console.log(JSON.stringify(response));
  process.exit(0);
} catch {
  process.exit(0);
}
```

**동작 확인**:
```bash
echo '{"hook_event_name":"PostToolUseFailure","tool_name":"Bash","error":"ENOENT: no such file"}' | node "C:/Users/앤기브마케팅/workspace/vibecraft/scripts/tool-failure-handler.js"
```

기대: `{"hookSpecificOutput":{"hookEventName":"PostToolUseFailure","additionalContext":"[도구 실패 진단]\n  1. 파일 경로에 오타가 ..."}}` JSON 출력

---

### Step 19 — hooks.json에 PostToolUseFailure 훅 등록 + 커밋 (TDD 면제)

**사전 확인**: 현재 hooks.json의 PostToolUse 섹션은 Skill만 matcher로 등록되어 있고, PostToolUseFailure 이벤트는 아직 등록되지 않음.

**공식 문서 확인 완료**: `PostToolUseFailure`는 Claude Code가 정식으로 지원하는 이벤트이며 matcher는 tool name 기반. 실패 시에만 발동하므로 matcher를 `Bash|Edit|Write` 등 실제로 실패해도 진단 가치가 있는 도구로 좁혀 성능 부담을 최소화한다. (Read/Grep/Glob은 파일 없음 정도의 실패가 주이고, AI가 대안 탐색으로 바로 복구하므로 제외해도 무방)

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\hooks\hooks.json`에 최상위 `hooks` 객체 내부로 **새로운 `PostToolUseFailure` 이벤트**를 추가한다. (PostToolUse 섹션은 건드리지 않음)

변경 전 — PostToolUse 섹션:
```json
    "PostToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/skill-post.js\"",
            "timeout": 5000
          }
        ]
      }
    ],
```

변경 후 — PostToolUse는 그대로 두고, **별도로 PostToolUseFailure 이벤트 블록을 추가**:
```json
    "PostToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/skill-post.js\"",
            "timeout": 5000
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tool-failure-handler.js\"",
            "timeout": 3000
          }
        ]
      }
    ],
```

주의: 추가 위치는 hooks.json의 `hooks` 객체 내부에 기존 이벤트들과 같은 레벨이다. 어느 이벤트 옆에 붙여도 JSON 구조상 동일하므로 PostToolUse 바로 다음에 두어 가독성을 높인다.

**동작 확인**:
```bash
node -e "const h=JSON.parse(require('fs').readFileSync('C:/Users/앤기브마케팅/workspace/vibecraft/hooks/hooks.json','utf8')); console.log('PostToolUseFailure 등록:', Array.isArray(h.hooks.PostToolUseFailure)); console.log('전체 이벤트 수:', Object.keys(h.hooks).length);"
```

기대: `PostToolUseFailure 등록: true` 및 이벤트 수가 기존 대비 1 증가.

**커밋**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add scripts/tool-failure-handler.js hooks/hooks.json
git commit -m "[기능] PostToolUseFailure 훅 추가 — 도구 실패 시 자동 진단 힌트

변경 사항:
- scripts/tool-failure-handler.js: ENOENT/EACCES/ECONNREFUSED 등 7개 에러 패턴 진단 메시지를 hookSpecificOutput.additionalContext로 반환
- hooks/hooks.json: PostToolUseFailure 이벤트에 Bash/Edit/Write matcher로 등록 (성공 호출에는 실행되지 않음)

이유: 도구가 실패했을 때 AI가 같은 실수를 반복하지 않도록 Claude Code 공식 이벤트를 통해 다음 시도 전에 진단 힌트를 주입. PostToolUse는 성공 시에만 발동하므로 실패 감지에는 사용할 수 없음."
```

---

### Step 20 — rpdca-state.js 유틸리티 테스트 작성 (TDD 필수)

**목적**: RPDCA 상태 JSON을 읽고 쓰는 순수 함수 모듈을 먼저 테스트로 정의한다.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\tests\test-rpdca-state.js` 신규 생성

```javascript
#!/usr/bin/env node
// rpdca-state.js 순수 함수 테스트

const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpdca-'));
process.chdir(tmpDir);
fs.mkdirSync('docs/plans', { recursive: true });

const state = require(path.resolve(__dirname, '../scripts/rpdca-state.js'));

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); passed++; }
  else { console.log(`FAIL: ${name}`); failed++; }
}

// 1. 처음 read하면 빈 상태 반환
const s1 = state.read();
assert('초기 read는 features 빈 배열', Array.isArray(s1.features) && s1.features.length === 0);

// 2. feature 추가
state.upsertFeature('my-feature', 'research');
const s2 = state.read();
assert('upsert 후 feature 1개', s2.features.length === 1);
assert('upsert 후 phase=research', s2.features[0].phase === 'research');

// 3. phase 갱신
state.upsertFeature('my-feature', 'plan');
const s3 = state.read();
assert('phase 갱신 반영', s3.features[0].phase === 'plan');

// 4. activeFeature 설정
state.setActive('my-feature');
const s4 = state.read();
assert('activeFeature 설정', s4.activeFeature === 'my-feature');

// 5. 두 번째 feature 추가
state.upsertFeature('another', 'research');
const s5 = state.read();
assert('feature 2개 공존', s5.features.length === 2);

console.log(`\n결과: ${passed}/${passed + failed} 통과`);
process.exit(failed > 0 ? 1 : 0);
```

**실패 확인**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-rpdca-state.js"
```

(스크립트가 아직 없으므로 실패)

---

### Step 21 — rpdca-state.js 유틸리티 구현 (TDD 필수)

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\rpdca-state.js` 신규 생성

```javascript
#!/usr/bin/env node

/**
 * vibecraft RPDCA 상태 JSON 유틸리티
 *
 * docs/plans/rpdca-state.json을 읽고 쓰는 공통 모듈.
 * 다중 feature 동시 진행을 지원한다.
 *
 * 스키마:
 * {
 *   activeFeature: string | null,
 *   features: [
 *     { name, phase, startedAt, lastUpdated }
 *   ],
 *   lastUpdated: ISO 문자열
 * }
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.resolve('docs/plans/rpdca-state.json');

function emptyState() {
  return {
    activeFeature: null,
    features: [],
    lastUpdated: new Date().toISOString(),
  };
}

function read() {
  if (!fs.existsSync(STATE_PATH)) return emptyState();
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.features)) parsed.features = [];
    return parsed;
  } catch {
    return emptyState();
  }
}

function write(state) {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function upsertFeature(name, phase) {
  const state = read();
  const existing = state.features.find(f => f.name === name);
  if (existing) {
    existing.phase = phase;
    existing.lastUpdated = new Date().toISOString();
  } else {
    state.features.push({
      name,
      phase,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
  }
  write(state);
}

function setActive(name) {
  const state = read();
  state.activeFeature = name;
  write(state);
}

function getActive() {
  const state = read();
  if (!state.activeFeature) return null;
  return state.features.find(f => f.name === state.activeFeature) || null;
}

module.exports = {
  read,
  write,
  upsertFeature,
  setActive,
  getActive,
  STATE_PATH,
};
```

**통과 확인**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-rpdca-state.js"
```

기대: `결과: 5/5 통과`

---

### Step 22 — user-prompt-handler.js + context-compaction.js + rpdca-task-completed.js가 rpdca-state.js 사용하도록 전환 (TDD 면제)

**목적**: 파일 존재 여부 기반 추정 로직을 JSON 읽기/쓰기로 전환한다. **읽기만 전환하면 JSON이 영원히 비어있어 fallback에만 의존하게 되므로, 쓰기(upsertFeature + setActive) 주체도 반드시 같은 Step에서 연결한다.**

**라운드 2 보강**: 초안은 읽기 경로만 전환했지만, `rpdca-task-completed.js`가 Task subject에서 단계를 감지한 뒤 **rpdca-state.json에 upsertFeature/setActive를 호출해야** JSON이 실제로 채워진다. 이 연결 고리가 없으면 Step 21~23의 기능은 완전히 무의미해진다.

**사전 확인**: 세 파일의 현재 RPDCA 관련 로직 위치를 Read로 재확인
- `user-prompt-handler.js` 196~217행: `detectRpdcaPhase()` (읽기)
- `context-compaction.js` 14~60행: 유사 로직 (읽기)
- `rpdca-task-completed.js` 26~44행: Task subject에서 phase/feature 감지 후 콘솔 출력만 (여기에 쓰기를 추가)

**작업 1**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\user-prompt-handler.js`의 `detectRpdcaPhase()` 함수 교체

변경 전:
```javascript
function detectRpdcaPhase() {
  const plansDir = path.resolve('docs/plans');
  if (!fs.existsSync(plansDir)) return null;

  const entries = fs.readdirSync(plansDir, { withFileTypes: true });
  const features = entries.filter(e => e.isDirectory() && e.name !== 'archive');

  if (features.length === 0) return null;

  // 가장 최근 feature 기준
  const feature = features[features.length - 1].name;
  const featureDir = path.join(plansDir, feature);

  const hasResearch = fs.existsSync(path.join(featureDir, 'research.md'));
  const hasPlan = fs.existsSync(path.join(featureDir, 'plan.md'));
  const hasPlanReview = fs.existsSync(path.join(featureDir, 'plan-review.md'));

  if (hasPlan && hasPlanReview) return { feature, phase: 'do' };
  if (hasPlan) return { feature, phase: 'plan' };
  if (hasResearch) return { feature, phase: 'research' };
  return { feature, phase: 'research' };
}
```

변경 후:
```javascript
function detectRpdcaPhase() {
  try {
    const rpdca = require('./rpdca-state.js');
    const active = rpdca.getActive();
    if (active) return { feature: active.name, phase: active.phase };

    // fallback: 상태 파일 없으면 기존 추정 로직
    const plansDir = path.resolve('docs/plans');
    if (!fs.existsSync(plansDir)) return null;
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });
    const features = entries.filter(e => e.isDirectory() && e.name !== 'archive');
    if (features.length === 0) return null;

    const feature = features[features.length - 1].name;
    const featureDir = path.join(plansDir, feature);
    const hasResearch = fs.existsSync(path.join(featureDir, 'research.md'));
    const hasPlan = fs.existsSync(path.join(featureDir, 'plan.md'));
    const hasPlanReview = fs.existsSync(path.join(featureDir, 'plan-review.md'));
    if (hasPlan && hasPlanReview) return { feature, phase: 'do' };
    if (hasPlan) return { feature, phase: 'plan' };
    if (hasResearch) return { feature, phase: 'research' };
    return { feature, phase: 'research' };
  } catch {
    return null;
  }
}
```

**작업 1-추가 — rpdca-task-completed.js에 쓰기 연결** (라운드 2 보강):

`C:\Users\앤기브마케팅\workspace\vibecraft\scripts\rpdca-task-completed.js`에 phase 감지 직후 rpdca-state.json 업데이트를 추가한다. 감지 실패 시에는 기존 동작 유지.

변경 전 (41~44행 근처):
```javascript
  const message = nextSteps[phase];
  if (message) {
    console.log(message);
  }
```

변경 후:
```javascript
  // rpdca-state.json 업데이트 (실패해도 콘솔 출력은 진행)
  try {
    const rpdca = require('./rpdca-state.js');
    rpdca.upsertFeature(feature, phase);
    rpdca.setActive(feature);
  } catch {
    // 상태 파일 업데이트 실패는 조용히 무시 (알림 기능이 주목적)
  }

  const message = nextSteps[phase];
  if (message) {
    console.log(message);
  }
```

**작업 2**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\context-compaction.js`도 동일 패턴 적용. 상단에 `const rpdca = require('./rpdca-state.js');`를 추가하고, features를 먼저 rpdca-state.json에서 읽고 없으면 기존 폴더 스캔으로 fallback.

context-compaction.js 수정 가이드:
```javascript
// 상단 require 추가
let rpdcaState = null;
try { rpdcaState = require('./rpdca-state.js'); } catch {}

// features 수집 부분에서 rpdca-state.json 우선 참조
const stateFeatures = rpdcaState ? rpdcaState.read().features : [];
if (stateFeatures.length > 0) {
  for (const f of stateFeatures) {
    features.push({
      name: f.name,
      stage: f.phase,
      files: { hasResearch: true, hasPlan: f.phase !== 'research', hasPlanReview: false, hasDesign: false },
    });
  }
} else {
  // 기존 폴더 스캔 로직 유지
  if (fs.existsSync(plansDir)) {
    // ... 기존 로직 ...
  }
}
```

**동작 확인**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-rpdca-state.js"
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-user-prompt-handler.js"
```

기대: 기존 테스트 통과 유지

---

### Step 23 — RPDCA 상태 JSON 도입 커밋

```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add scripts/rpdca-state.js scripts/user-prompt-handler.js scripts/context-compaction.js scripts/rpdca-task-completed.js tests/test-rpdca-state.js
git commit -m "[기능] RPDCA 상태 JSON 도입 — 다중 feature 동시 진행 지원

변경 사항:
- scripts/rpdca-state.js: docs/plans/rpdca-state.json 읽기/쓰기 유틸리티 신규
- scripts/rpdca-task-completed.js: 단계 감지 시 upsertFeature + setActive 호출 (JSON 쓰기 주체)
- scripts/user-prompt-handler.js: detectRpdcaPhase가 JSON 우선 참조, fallback은 폴더 스캔
- scripts/context-compaction.js: RPDCA 요약을 JSON에서 먼저 읽음
- tests/test-rpdca-state.js: upsert/setActive/getActive 단위 테스트

이유: 기존 '파일 존재 여부' 기반 추정은 다중 feature 동시 진행 시 어느 쪽이 현재인지 헷갈리는 문제가 있었음. 명시적 상태 파일로 activeFeature를 추적해 모호성 제거. 쓰기 경로 없이 읽기만 전환하면 JSON이 영원히 비어있으므로 TaskCompleted 훅을 쓰기 주체로 연결"
```

---

### Step 24 — subagent-output-check.js 구현 (TDD 면제 — 간단 스캔)

**목적**: 서브에이전트 완료 시 자주 실수하는 패턴(하드코딩 시크릿, TODO 남발, console.log 남발)을 빠르게 스캔.

**공식 문서 확인 완료 (E2)**: SubagentStop 훅 입력 필드는 `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `stop_hook_active`, **`agent_id`**, **`agent_type`**(에이전트 이름), **`agent_transcript_path`**, `last_assistant_message`이다. 에이전트 이름을 받는 필드는 **`agent_type`** 하나뿐이다. 초안의 `subagent_name` / `agent_name` 필드는 공식 스키마에 존재하지 않으므로 스크립트가 항상 빈 문자열을 읽고 전체가 무반응으로 끝난다 — 이것을 이번 라운드에서 수정한다.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\scripts\subagent-output-check.js` 신규 생성

```javascript
#!/usr/bin/env node

/**
 * vibecraft SubagentStop 훅 — 서브에이전트 출력 품질 빠른 스캔
 *
 * 코드 작성 에이전트가 완료 직전에 수정한 파일들을 빠르게 훑어
 * - 하드코딩된 시크릿 의심 패턴
 * - console.log 남발
 * - TODO/FIXME 남발
 * 을 감지해 리마인드 메시지를 출력한다.
 *
 * 실제 차단은 하지 않고 stdout으로 안내만 한다.
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "SubagentStop",
 *   agent_id: "def456",
 *   agent_type: "frontend-builder",   // ← 에이전트 이름은 여기
 *   agent_transcript_path: "...",
 *   last_assistant_message: "...",
 *   stop_hook_active: false,
 *   ...
 * }
 */

const fs = require('fs');
const { execSync } = require('child_process');

const PATTERNS = {
  secrets: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{16,}/i,
  debugLog: /console\.log\(/g,
  todo: /\/\/\s*(TODO|FIXME|XXX)/gi,
};

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};
  // 공식 필드는 agent_type. 이전 버전 호환용으로 subagent_name/agent_name도 폴백.
  const agentName = input.agent_type || input.subagent_name || input.agent_name || '';

  // 무한 루프 방지
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  // 코드 작성 에이전트만 검사
  const targetAgents = ['frontend-builder', 'backend-builder', 'test-writer', 'code-simplifier', 'debugger'];
  if (!targetAgents.includes(agentName)) {
    process.exit(0);
  }

  // 최근 git status로 수정된 파일 확인 (staged + unstaged)
  let changed = '';
  try {
    changed = execSync('git diff --name-only HEAD', { encoding: 'utf8', timeout: 3000 });
  } catch {
    process.exit(0);
  }

  const files = changed.split('\n').filter(f =>
    f && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.py'))
  );

  const warnings = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (PATTERNS.secrets.test(content)) {
      warnings.push(`${file}: 하드코딩 시크릿 의심 패턴 발견. .env로 이전 검토`);
    }
    const logCount = (content.match(PATTERNS.debugLog) || []).length;
    if (logCount > 5) {
      warnings.push(`${file}: console.log ${logCount}개 — 디버그 코드 남아있는지 확인`);
    }
    const todoCount = (content.match(PATTERNS.todo) || []).length;
    if (todoCount > 3) {
      warnings.push(`${file}: TODO/FIXME ${todoCount}개 — 작업 완료 여부 확인`);
    }
  }

  if (warnings.length === 0) {
    process.exit(0);
  }

  console.log(`[서브에이전트 출력 점검 — ${agentName}]`);
  warnings.forEach(w => console.log(`  - ${w}`));
  process.exit(0);
} catch {
  process.exit(0);
}
```

**동작 확인**:
```bash
echo '{"hook_event_name":"SubagentStop","agent_type":"frontend-builder","stop_hook_active":false}' | node "C:/Users/앤기브마케팅/workspace/vibecraft/scripts/subagent-output-check.js"
```

(git diff가 비어 있으면 출력 없음 — 정상. 실제 동작은 frontend-builder 서브에이전트가 .js 파일을 수정한 뒤 세션 재시작 없이 검증 가능)

---

### Step 25 — hooks.json에 SubagentStop 훅 추가 + 커밋 (TDD 면제)

**사전 확인**: 현재 SubagentStop 훅은 team-monitor.js 하나만 등록되어 있음. 추가로 subagent-output-check.js를 붙인다.

**작업**: hooks.json의 SubagentStop 섹션 수정

변경 전:
```json
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/team-monitor.js\"",
            "timeout": 5000
          }
        ]
      }
    ]
```

변경 후:
```json
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/team-monitor.js\"",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/subagent-output-check.js\"",
            "timeout": 5000
          }
        ]
      }
    ]
```

**동작 확인**:
```bash
node -e "JSON.parse(require('fs').readFileSync('C:/Users/앤기브마케팅/workspace/vibecraft/hooks/hooks.json','utf8'))"
```

**커밋**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add scripts/subagent-output-check.js hooks/hooks.json
git commit -m "[기능] SubagentStop 훅에 출력 품질 스캔 추가

변경 사항:
- scripts/subagent-output-check.js: 시크릿/디버그로그/TODO 남발 감지
- hooks/hooks.json: SubagentStop에 subagent-output-check 추가

이유: 코드 작성 에이전트가 완료 직전에 실수로 남긴 하드코딩 시크릿, 디버그 로그, 미완 TODO를 빠르게 리마인드해 다음 단계 검증 부담을 줄임"
```

---

### Step 26 — ui-evaluator 에이전트 신설 (TDD 면제)

**목적**: Generator/Evaluator 분리 원칙을 UI 검증에 적용. 코드에 접근하지 못하는 검증 전용 에이전트.

**작업**: `C:\Users\앤기브마케팅\workspace\vibecraft\agents\ui-evaluator.md` 신규 생성

```markdown
---
name: ui-evaluator
description: 프론트엔드 변경을 실제 브라우저에서 검증하는 전용 에이전트. 코드를 직접 읽거나 수정할 수 없고, 오직 Playwright MCP로 실행된 결과만 평가한다. UI 관련 파일이 수정된 후 verification 단계에서 호출된다.
model: sonnet
maxTurns: 15
tools:
  - Read
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_hover
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_tabs
  - mcp__playwright__browser_navigate_back
  - mcp__playwright__browser_close
---

# UI Evaluator — 코드를 볼 수 없는 검증자

## 역할

프론트엔드 변경을 실제 브라우저에서 사용자 관점으로 검증한다.
코드를 보지 않고 **결과물만** 평가하기 때문에 Generator(프론트엔드 빌더)의 자기 평가 편향에서 자유롭다.

> 이 에이전트는 `Write`, `Edit`, `Grep`, `Glob` 도구를 사용할 수 없다. 코드를 수정하거나 소스를 탐색할 수 없다.
> 오직 `Read`(plan.md, 요구사항 문서 확인용)와 Playwright MCP 도구만 사용한다.

## 검증 6단계

### 1단계: 컨텍스트 수집
- `docs/plans/{feature}/plan.md`를 Read로 읽어 성공 기준 확인
- 요구된 사용자 플로우와 체크리스트 파악

### 2단계: 페이지 진입
- `mcp__playwright__browser_navigate`로 대상 URL 방문 (기본: http://localhost:3000)
- 로컬 서버가 떠 있는지 확인. 없으면 사용자에게 서버 기동 요청

### 3단계: 초기 스냅샷
- `mcp__playwright__browser_snapshot`으로 접근성 트리 캡처
- `mcp__playwright__browser_console_messages`로 콘솔 에러 확인
- 첫 인상 기준점 확보

### 4단계: 사용자 플로우 시뮬레이션
- plan.md에 명시된 사용자 시나리오를 단계별로 실행
- 버튼 클릭, 폼 입력, 네비게이션 등을 실제로 조작
- 각 단계마다 스냅샷 또는 스크린샷 저장

### 5단계: 엣지 케이스 + 반응형
- 빈 입력, 너무 긴 입력, 잘못된 형식 등 비정상 입력 테스트
- `mcp__playwright__browser_resize`로 모바일(375px), 태블릿(768px), 데스크톱(1280px) 확인
- 각 크기에서 레이아웃 깨짐 여부 체크

### 6단계: 판정 리포트
다음 형식으로 결과 출력:

```
## UI 검증 결과

### 성공 기준 대조
| 기준 | 결과 | 증거 |
|------|------|------|
| 기준 1 | PASS/FAIL | 스냅샷 요약 |

### 발견된 문제
1. [심각도: 높음/중간/낮음] 문제 설명 — 재현 방법 포함

### 콘솔/네트워크 이상
- 콘솔 에러 N건 / 실패한 네트워크 요청 M건

### 최종 판정
- **통과**: 모든 기준 충족
- **재작업 필요**: 구체적 수정 요청 목록
```

## 핵심 원칙

1. **코드를 보지 않는다** — tools에 Grep/Glob/Edit/Write가 없으므로 코드 기반 추측 자체가 불가능
2. **실측만 보고한다** — 스냅샷, 스크린샷, 콘솔 로그, 네트워크 응답만 근거로 제시
3. **사용자 관점** — "개발자 입장에서는 맞지만 사용자는 이해 못 한다" 같은 지적이 가능해야 함
4. **E1 근거 유지** — "잘 됐을 것 같다"는 금지. 실행 결과만 기록
```

**동작 확인**: 파일 Read로 확인

---

### Step 27 — verification 스킬에 ui-evaluator 자동 호출 절차 추가 (TDD 면제)

**사전 확인**: `C:\Users\앤기브마케팅\workspace\vibecraft\skills\verification\SKILL.md`를 Read로 현재 구조 파악

**작업**: verification 스킬 문서에 아래 섹션을 검증 절차 중간에 삽입

```markdown
## UI 관련 작업 자동 검증

수정된 파일 목록에 아래 확장자가 포함되면 `ui-evaluator` 서브에이전트를 자동 호출한다:

- `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`
- `app/**/page.*`, `components/**/*`, `pages/**/*`

### Playwright MCP 사전 감지 (필수 Fallback)

ui-evaluator는 Playwright MCP에 **완전히 의존**한다. 플러그인 서브에이전트는 보안상 `mcpServers` 필드가 무시되므로, ui-evaluator가 Playwright MCP를 사용하려면 **사용자 프로젝트의 `.mcp.json`에 Playwright MCP가 등록되어 있어야 한다**(research.md 섹션 9-5, Issue #13605 참조).

따라서 verification 스킬은 ui-evaluator 호출 직전에 아래 순서로 가용성을 확인한다:

1. 프로젝트 루트에 `.mcp.json`이 존재하는지 확인
2. 존재하면 내용을 읽어 `mcpServers` 객체에 `playwright` 또는 Playwright MCP 관련 엔트리(예: `@playwright/mcp`)가 있는지 검사
3. **없으면 ui-evaluator 호출을 건너뛰고** 다음 메시지를 사용자에게 제시하고 verification 리포트에 "UI 자동 검증 스킵 — Playwright MCP 미설치"로 기록한다:
   > "UI 파일이 수정됐지만 프로젝트에 Playwright MCP가 없어 자동 브라우저 검증을 건너뜁니다. 수동으로 화면을 확인하거나, 필요하면 `.mcp.json`에 Playwright MCP를 추가해 주세요."
4. 있으면 정상적으로 ui-evaluator를 기동한다

### 호출 절차

1. 수정 파일 목록에서 위 확장자/경로가 1개 이상이면 UI 검증 대상으로 분류
2. 위의 Playwright MCP 사전 감지 수행 → 미설치면 스킵 + 안내 메시지 출력 후 종료
3. `Agent` 도구로 `ui-evaluator` 서브에이전트 기동
4. 프롬프트: "docs/plans/{feature}/plan.md를 기준으로 변경된 UI를 검증하라. 로컬 서버 URL은 http://localhost:3000 기본. 서버가 안 떠 있으면 사용자에게 서버 기동을 요청하라."
5. ui-evaluator 판정이 "재작업 필요"이면 gap-detector Match Rate와 합산해 Act 루프 진입
6. ui-evaluator 판정이 "통과"이면 증거(스냅샷 요약 + 콘솔 상태)를 verification 리포트에 포함

### 주의
- ui-evaluator는 **코드를 볼 수 없다**. 구현 결함을 지적하면 메인 에이전트가 코드를 읽어 수정한다
- UI가 아닌 변경(Node.js 백엔드, CLI 도구 등)에는 ui-evaluator를 호출하지 않는다
- 로컬 서버가 없으면 정적 HTML을 file:// 프로토콜로 열어 스냅샷 확보를 시도한다
- Playwright MCP 미설치 시 에러로 멈추지 않고 조용히 스킵하여 전체 verification 흐름이 중단되지 않게 한다
```

**동작 확인**: Read로 섹션이 추가되었는지 확인

---

### Step 28 — ui-evaluator + verification 스킬 업데이트 커밋

```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
git add agents/ui-evaluator.md skills/verification/SKILL.md
git commit -m "[기능] ui-evaluator 에이전트 신설 — Generator/Evaluator 분리

변경 사항:
- agents/ui-evaluator.md: Playwright MCP만 사용하는 코드 접근 불가 검증자 신규
- skills/verification/SKILL.md: UI 파일 수정 감지 시 ui-evaluator 자동 호출 절차 추가

이유: 프론트엔드 빌더가 자기 코드를 검증하면 자기 평가 편향으로 문제를 놓치는 경우가 많음. 코드에 접근할 수 없는 검증 전용 에이전트가 실제 브라우저에서만 평가하도록 구조적으로 분리"
```

---

### Step 29 — 전체 테스트 재실행 + 에이전트 도구 제한 회귀 검증 (TDD 면제)

**작업 1 — 기존 테스트 스크립트 재실행**:
```bash
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-user-prompt-handler.js"
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-rpdca-state.js"
node "C:/Users/앤기브마케팅/workspace/vibecraft/tests/test-evidence-stop-guard.js"
```

**기대**: 모두 통과.

**작업 2 — hooks.json JSON 유효성 + PostToolUseFailure 확인**:
```bash
node -e "const h = JSON.parse(require('fs').readFileSync('C:/Users/앤기브마케팅/workspace/vibecraft/hooks/hooks.json','utf8')); console.log('hooks events:', Object.keys(h.hooks).length); console.log('PostToolUseFailure 등록:', Array.isArray(h.hooks.PostToolUseFailure));"
```

**기대**: `hooks events: 10` (SessionStart, PreCompact, UserPromptSubmit, PreToolUse, PostToolUse, **PostToolUseFailure**, Stop, TaskCompleted, TeammateIdle, SubagentStop), `PostToolUseFailure 등록: true`.

**작업 3 — 에이전트 도구 제한 회귀 검증**: Step 14~17에서 `tools` 화이트리스트를 추가했으므로, 기존에 암묵적으로 쓰던 도구가 차단되지 않는지 확인한다:

1. 대표 에이전트 2개를 **수동으로** 호출해보고 평소 작업이 끝까지 진행되는지 확인:
   - `frontend-builder`: 샘플로 간단한 컴포넌트 수정 지시 → Read/Edit/Write/Bash가 모두 허용되는지
   - `code-analyzer`: 코드 탐색 지시 → Read/Grep/Glob만으로 보고서 생성 가능한지
2. `grep -rE "^tools:" agents/*.md`로 14개 전부에 tools 필드가 선언됐는지 일괄 확인
3. `grep -rE "^maxTurns:" agents/*.md`로 14개 전부에 maxTurns가 있는지 확인

**기대**: 두 샘플 호출이 tool 제한 오류 없이 완료되고, grep 결과 14건씩 나와야 함. 샘플 호출에서 권한 차단이 발생하면 해당 에이전트의 tools 목록에 누락 도구를 추가하고 재커밋.

---

## 마무리

### Step 30 — plugin.json 버전 v2.0.12 → v2.1.0 (TDD 면제)

**사전 확인**: `C:\Users\앤기브마케팅\workspace\vibecraft\.claude-plugin\plugin.json`의 현재 `version: "2.0.12"`

**작업**: plugin.json 수정

변경 전:
```json
  "version": "2.0.12",
  "description": "바이브코딩 키트 v2 - 17개 핵심 스킬 + CLAUDE.md 자동 적용 규칙. 훅 기반 자동 감지 + 적극적 스킬 트리거링 + 크기별 워크플로우(S/M/L) + 패킷 캡처.",
```

변경 후:
```json
  "version": "2.1.0",
  "description": "바이브코딩 키트 v2.1 - 17개 스킬 + 14개 에이전트 + 하네스 엔지니어링 적용. Iron Law 결정론적 강제(Stop 훅) + Generator/Evaluator 분리(ui-evaluator) + RPDCA 상태 JSON + 도구 실패 진단.",
```

---

### Step 31 — sync-version 실행 + 최종 커밋

**작업**:
```bash
cd "C:/Users/앤기브마케팅/workspace/vibecraft"
node scripts/sync-version.js
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "[설정] v2.1.0 — 하네스 엔지니어링 적용

변경 사항:
- .claude-plugin/plugin.json: 2.0.12 → 2.1.0, description 갱신
- .claude-plugin/marketplace.json: sync-version으로 자동 동기화

이유: Tier 1 + Tier 2 하네스 엔지니어링 작업 완료에 따른 마이너 버전 업. Iron Law 결정론적 강제, Generator/Evaluator 분리, RPDCA 상태 JSON, 도구 실패 진단 등 주요 구조 개선 반영"
```

---

### Step 32 — 최종 동작 확인

**사용자에게 보고할 확인 목록**:

1. CLAUDE.md 글자 수 감소 확인:
   ```bash
   wc -c "C:/Users/앤기브마케팅/workspace/vibecraft/CLAUDE.md"
   ```

2. docs/rules/ 4개 파일 존재:
   ```bash
   ls "C:/Users/앤기브마케팅/workspace/vibecraft/docs/rules/"
   ```

3. 새 스크립트 4개 존재:
   ```bash
   ls "C:/Users/앤기브마케팅/workspace/vibecraft/scripts/" | grep -E "evidence-stop|tool-failure|rpdca-state|subagent-output"
   ```

4. ui-evaluator 존재:
   ```bash
   ls "C:/Users/앤기브마케팅/workspace/vibecraft/agents/ui-evaluator.md"
   ```

5. plugin.json 버전:
   ```bash
   node -e "console.log(require('C:/Users/앤기브마케팅/workspace/vibecraft/.claude-plugin/plugin.json').version)"
   ```

6. 모든 테스트 통과 재확인 (Step 29와 동일)

**주의**: Stop 훅의 실제 차단 동작은 **Claude Code 세션 재시작 후** 실제 코드 수정 + 증거 없이 응답 종료를 시도해야 검증 가능하다. 이 계획 안에서는 유닛 레벨(stop_hook_active=true 통과, 증거 없을 때 block JSON 반환)까지만 자동 검증한다.

---

## 전체 체크리스트

### Tier 1 — 빠른 승리
- [ ] Step 1: docs/rules 폴더 + frontend-workflow.md (전역 규칙 프로젝트 로컬 참조본)
- [ ] Step 2: git-branch-strategy.md + code-quality-checklist.md + commit-message-guide.md
- [ ] Step 3: 프로젝트 CLAUDE.md에서 "코드 품질 체크리스트"를 포인터로 대체
- [ ] Step 4: Tier 1 Step 1~3 커밋
- [ ] Step 5: user-prompt-handler 회귀 방지 테스트 작성 (5/5 통과 기대)
- [ ] Step 6: english 중복 필드 정리 (코드 품질, 동작 불변)
- [ ] Step 7: english 정리 커밋
- [ ] Step 8: evidence-stop-guard 테스트 작성
- [ ] Step 9: evidence-stop-guard.js 구현 (last_assistant_message 우선 + user 턴 이후 감지 + ~ expand)
- [ ] Step 10: hooks.json Stop 훅 등록 (unified-stop과 병렬)
- [ ] Step 11: Stop 훅 evidence-guard 커밋
- [ ] Step 12: vibecraft.md 버전/수량 갱신 + 커밋

### Tier 2 — 구조 개선
- [ ] Step 13: 에이전트 frontmatter 매핑표 확정 (각 에이전트 본문 Read 후 실제 필요 도구 검증)
- [ ] Step 14: 읽기 전용 에이전트 4개 수정
- [ ] Step 15: 코드 작성 에이전트 4개 수정
- [ ] Step 16: 기타 에이전트 6개 수정
- [ ] Step 17: 에이전트 frontmatter 커밋
- [ ] Step 18: tool-failure-handler.js 구현 (PostToolUseFailure 전용)
- [ ] Step 19: hooks.json에 PostToolUseFailure 이벤트 신규 등록 + 커밋
- [ ] Step 20: rpdca-state 테스트 작성
- [ ] Step 21: rpdca-state.js 구현
- [ ] Step 22: user-prompt-handler + context-compaction + rpdca-task-completed 전환 (읽기 + 쓰기 주체 연결)
- [ ] Step 23: RPDCA 상태 JSON 커밋
- [ ] Step 24: subagent-output-check.js 구현 (agent_type 필드 사용)
- [ ] Step 25: hooks.json SubagentStop 확장 + 커밋
- [ ] Step 26: ui-evaluator.md 신설
- [ ] Step 27: verification 스킬에 ui-evaluator 자동 호출 + Playwright MCP 사전 감지 fallback 추가
- [ ] Step 28: ui-evaluator 커밋
- [ ] Step 29: 전체 테스트 회귀 검증 + 에이전트 도구 제한 샘플 검증 (hooks events: 10)

### 마무리
- [ ] Step 30: plugin.json 버전 v2.1.0
- [ ] Step 31: sync-version + 최종 커밋
- [ ] Step 32: 최종 동작 확인

---

## 위험 요소 및 확인 결과

### Round 1 검증으로 해소된 항목 (공식 문서 + 실제 코드 E2 확인)

1. **에이전트 frontmatter 키 이름** — **해소**. Claude Code 공식 문서(Create custom subagents)에서 표준 키는 `tools`로 확정. `allowedTools`는 존재하지 않음. plan-critic이 이미 `tools: - Read ...` YAML 리스트 형식으로 동작 중이므로 이 형식이 실제로 파싱됨이 E1 수준으로 증명됨. Step 14~16 그대로 진행 가능.

2. **Stop 훅 transcript_path 형식** — **해소**. 공식 스키마상 `.jsonl` 파일이며 각 라인은 `{type:"assistant", message:{content:[{type:"tool_use", name:"Edit"}, ...]}}` 구조. 실제 vibecraft 세션 파일로도 확인됨. Step 9의 파싱 로직을 `content.some(c => c?.type === 'tool_use' && EDIT_TOOLS.includes(c.name))`로 갱신하여 여러 content 블록을 모두 순회하도록 수정 완료. 또한 `input.last_assistant_message` 필드를 공식 지원하므로 증거 키워드 검사는 이 필드를 우선 사용하도록 변경.

3. **ui-evaluator Playwright 의존성** — **해소**. Step 27에 Playwright MCP 사전 감지 fallback을 명시적으로 추가. 플러그인 서브에이전트의 `mcpServers` 필드는 무시되므로(Issue #13605) 사용자 프로젝트 `.mcp.json`에 등록돼 있어야 `mcp__playwright__*` 도구가 상속됨. 미설치 시 조용히 스킵 + 사용자 안내.

4. **PostToolUseFailure 이벤트** — **해소**. 공식 문서에 `PostToolUseFailure`가 정식 이벤트로 존재하며 `error` 최상위 필드와 `hookSpecificOutput.additionalContext` 반환 경로 제공. Step 18~19를 PostToolUseFailure 기반으로 수정 완료. PostToolUse는 "runs immediately after a tool completes successfully"이므로 실패 감지에 사용 불가. 이로써 matcher 범위(Bash|Edit|Write|Read|Grep|Glob) 성능 부담 문제도 원천적으로 해소됨.

5. **CLAUDE.md 분리 대상** — **정정**. 프로젝트 CLAUDE.md에 프론트엔드/Git/커밋 섹션이 없음을 확인. Step 1~3을 "전역 규칙의 프로젝트 로컬 참조본 생성 + 코드 품질 체크리스트 실제 분리" 구조로 수정하고 토큰 절감 기대치를 현실화(500~700자 감소).

6. **SubagentStop 입력 필드** — **해소**. 공식 필드는 `agent_type`이며 `subagent_name`/`agent_name`은 존재하지 않음. Step 24 스크립트를 `input.agent_type` 우선 사용으로 수정 완료.

7. **Stop 훅 병렬 실행** — **정정**. 공식 문서상 동일 이벤트의 매칭 훅은 병렬 실행이며 배열 순서는 실행 순서를 보장하지 않음. Step 10의 "unified-stop 앞에 배치" 서술을 병렬 실행으로 정정.

### 남아 있는 튜닝 항목 (배포 후 조정)

- **Stop 훅 증거 키워드**: EVIDENCE_KEYWORDS가 너무 허술하면 실제 증거 없이도 통과, 너무 엄격하면 정당한 종료를 차단한다. 첫 배포 후 실사용 피드백에 따라 튜닝 필요. 설정 파일(`vibecraft.evidence.json` 같은 외부화)은 추후 요구사항이 누적되면 추가하고, 지금은 스크립트 내 상수로 시작한다.
- **unified-stop.js의 RPDCA 추정 로직**: Step 22가 user-prompt-handler / context-compaction만 rpdca-state.js 기반으로 전환한다. unified-stop.js는 동일한 폴더 스캔 추정을 그대로 쓰고 있어 일관성이 떨어지지만, 이번 L 작업 범위를 넘는다고 판단해 유지. 후속 마이너 작업으로 분리.
