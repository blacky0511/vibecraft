# vibecraft Phase 1: 기반 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** vibecraft 플러그인의 핵심 4개 스킬 + 3개 훅 + plugin.json을 구현하여, 설치만 하면 자동으로 상황을 감지하고 적절한 워크플로우를 안내하는 기본 동작을 완성한다.

**Architecture:** Claude Code 플러그인 규약에 따라 skills/{이름}/SKILL.md, hooks/hooks.json, scripts/*.js 구조로 구현. 훅은 Node.js 스크립트로 작성하여 Windows/macOS 모두 호환. 스킬의 description에 트리거 키워드를 포함시켜 자동 감지를 구현.

**Tech Stack:** Markdown (스킬), Node.js (훅 스크립트), JSON (훅 설정)

---

### Task 1: plugin.json 완성

**Files:**
- Modify: `.claude-plugin/plugin.json`

**Step 1: plugin.json에 outputStyles 경로 추가**

```json
{
  "name": "vibecraft",
  "version": "0.1.0",
  "description": "바이브코딩 키트 - AI가 상황을 자동 감지하고 적절한 워크플로우를 안내하는 한국어 전용 플러그인. PDCA 방법론 + 서브에이전트 병렬 실행 + 체계적 디버깅 + 다단계 리뷰 파이프라인.",
  "author": {
    "name": "앤기브마케팅"
  },
  "license": "MIT",
  "keywords": [
    "vibecoding",
    "pdca",
    "korean",
    "workflow",
    "agent-teams",
    "debugging",
    "tdd",
    "auto-detect",
    "review-pipeline"
  ],
  "outputStyles": "./output-styles/"
}
```

**Step 2: 커밋**

```bash
git add .claude-plugin/plugin.json
git commit -m "[설정] plugin.json 설명 및 outputStyles 경로 추가"
```

---

### Task 2: auto-detect 스킬

> vibecraft의 핵심. 사용자 입력을 분석해서 적절한 모드를 자동 선택하는 스킬.

**Files:**
- Create: `skills/auto-detect/SKILL.md`

**Step 1: 스킬 파일 작성**

```markdown
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
사용자의 입력을 분석하여 아래 5가지 모드 중 적절한 것을 자동 선택하고, 해당 모드의 스킬을 호출한다.

## 모드 판별 규칙

### 1. 새 기능 모드
**키워드**: "만들어줘", "추가해줘", "구현해줘", "넣어줘", "기능", "feature"
**동작**: vibecraft:new-feature 스킬 호출

### 2. 디버깅 모드
**키워드**: "안 돼", "에러", "버그", "오류", "안됨", "실패", "크래시", "fix", "bug", "error"
**동작**: vibecraft:systematic-debugging 스킬 호출

### 3. 프로젝트 시작 모드
**키워드**: "만들자", "시작하자", "앱", "사이트", "프로젝트", "init", "새 프로젝트"
**동작**: vibecraft:project-kickoff 스킬 호출

### 4. 코드 리뷰 모드
**키워드**: "리뷰", "봐줘", "검토", "review", "코드 봐"
**동작**: vibecraft:code-review-request 스킬 호출

### 5. 배포 모드
**키워드**: "배포", "릴리즈", "deploy", "release", "서버에 올려"
**동작**: vibecraft:deploy-guide 스킬 호출

## 감지 후 행동

1. 모드를 판별한다
2. 사용자에게 감지된 모드를 알린다:
   > "새 기능 추가 요청으로 감지했습니다. vibecraft 워크플로우를 시작합니다."
3. vibecraft:smart-pdca 스킬을 호출하여 작업 크기를 판단한다
4. 크기에 따라 적절한 워크플로우를 실행한다

## 모드 판별이 애매한 경우

사용자에게 물어본다:
- "어떤 작업인지 좀 더 알려주세요"
- 선택지: (1) 새 기능 추가 (2) 버그 수정 (3) 새 프로젝트 (4) 코드 리뷰 (5) 배포

## 중요 규칙

- 모드 판별은 **한국어 키워드 우선**으로 한다
- 영어 키워드도 보조적으로 지원한다
- 판별 결과를 사용자에게 항상 알려서, 잘못된 판별이면 수정할 수 있게 한다
- 단순한 질문이나 대화에는 모드를 강제하지 않는다
```

**Step 2: 커밋**

```bash
git add skills/auto-detect/SKILL.md
git commit -m "[기능] auto-detect 스킬 추가 - 사용자 입력 자동 모드 감지"
```

---

### Task 3: smart-pdca 스킬

> 작업 크기를 자동 판단하고 PDCA 강도를 조절하는 스킬.

**Files:**
- Create: `skills/smart-pdca/SKILL.md`

**Step 1: 스킬 파일 작성**

```markdown
---
name: smart-pdca
description: |
  작업 크기를 자동 판단하여 PDCA 방법론의 강도를 조절하는 스킬.
  S/M/L 3단계로 분류하고, 각 크기에 맞는 워크플로우를 실행한다.

  Triggers: 작업 시작, 기능 구현, 프로젝트 생성, PDCA, 계획

  auto-detect 스킬이 모드를 판별한 후, 이 스킬이 호출된다.
---

# 스마트 PDCA

## 역할
작업 크기를 자동 판단하고, 크기에 따라 PDCA 강도를 조절한다.

## 크기 판별 기준

### S (소) - 간단한 작업
- 파일 1~2개 수정 예상
- 단순 버그 수정, 텍스트 변경, 설정 변경
- 예: "버튼 색상 바꿔줘", "오타 수정해줘", "환경변수 추가해줘"

**워크플로우**: 바로 실행 → verification(검증)만
```
실행 → 검증 → 완료
```

### M (중) - 중간 작업
- 파일 3~5개 수정 예상
- 기존 기능 확장, 중간 규모 버그, 리팩토링
- 예: "검색 기능 개선해줘", "로그인 폼 검증 추가해줘"

**워크플로우**: 간소 PDCA
```
계획(간략) → 실행 → 검증 → 완료
```

### L (대) - 큰 작업
- 파일 6개 이상 수정 또는 새 프로젝트
- 새 기능 전체 구현, 프로젝트 시작, 대규모 리팩토링
- 예: "결제 기능 만들어줘", "Todo 앱 만들자", "인증 시스템 전체 교체"

**워크플로우**: 전체 PDCA + 팀 구성
```
brainstorming → 계획 → 설계 → 팀 구성 → 서브에이전트 병렬 실행 → 리뷰 파이프라인 → 검증 → 완료
```

## 크기 판별 방법

1. 사용자의 요청 내용을 분석한다
2. 현재 프로젝트 코드베이스를 확인한다 (영향 범위 추정)
3. S/M/L 중 하나로 분류한다
4. 사용자에게 알린다:

> **작업 크기 판단**: M (중간)
> - 예상 수정 파일: 3~4개
> - 적용 워크플로우: 간소 PDCA (계획 → 실행 → 검증)

## PDCA 각 단계 설명

### Plan (계획)
- 무엇을 만들지 정리
- templates/plan.md 템플릿 사용
- S: 스킵 / M: 간략 / L: 상세

### Design (설계)
- 어떻게 만들지 구조 설계
- templates/design.md 템플릿 사용
- S: 스킵 / M: 스킵 / L: 상세

### Do (실행)
- 실제 코드 작성
- S: 메인 에이전트 직접 / M: 서브에이전트 1~2개 / L: CTO 팀 구성

### Check (검증)
- 설계 대비 달성률 확인
- templates/check-report.md 템플릿 사용
- S: 테스트만 / M: 테스트+간략 검증 / L: 전체 리뷰 파이프라인

### Act (개선)
- 미달 사항 수정
- 90% 미만이면 재작업
- S: 즉시 수정 / M,L: 재계획 후 수정

## 사용자 확인 시점

- **S**: 확인 없이 바로 진행, 완료 시 결과만 보여줌
- **M**: 계획 확인 1번 → 쭉 진행 → 완료 보고
- **L**: 계획 확인 → 설계 확인 → 쭉 진행 → 리뷰 결과 → 완료 보고
```

**Step 2: 커밋**

```bash
git add skills/smart-pdca/SKILL.md
git commit -m "[기능] smart-pdca 스킬 추가 - S/M/L 작업 크기별 PDCA 자동 조절"
```

---

### Task 4: iron-law 스킬

> superpowers의 핵심 규칙을 한국어로 재설계. 테스트 먼저 + 검증 필수.

**Files:**
- Create: `skills/iron-law/SKILL.md`

**Step 1: 스킬 파일 작성**

```markdown
---
name: iron-law
description: |
  vibecraft의 철칙. 모든 코드 변경에 적용되는 품질 규칙.
  테스트 먼저 작성(TDD) + 완료 전 반드시 검증 증거 제시.

  이 스킬은 다른 스킬과 함께 항상 활성화된다.
  코드를 작성하거나 수정할 때 반드시 이 규칙을 따라야 한다.

  Triggers: 코드 작성, 구현, 테스트, TDD, 검증, verification
---

# Iron Law (철칙)

## 두 가지 철칙

### 철칙 1: 테스트 먼저 (TDD)
> 코드를 작성하기 전에 반드시 테스트를 먼저 작성한다.

**순서:**
1. 실패하는 테스트 작성
2. 테스트 실행 → 실패 확인
3. 최소한의 코드로 테스트 통과
4. 테스트 실행 → 통과 확인
5. 리팩토링 (필요한 경우)

**예외 (테스트를 먼저 쓰지 않아도 되는 경우):**
- UI/CSS 변경 (시각적 확인으로 대체)
- 설정 파일 변경
- 문서 수정
- 프로토타입/실험 코드 (사용자가 명시한 경우)

### 철칙 2: 증거 없이 완료 없다
> "고쳤다", "완료했다"를 말하기 전에 반드시 증거를 제시한다.

**필수 증거:**
- 테스트 실행 결과 (통과/실패 캡처)
- 변경 전후 비교 (에러 → 정상)
- 실제 동작 확인 (스크린샷, 로그 등)

**금지:**
- "아마 될 겁니다" ← 금지
- "테스트는 나중에 추가하겠습니다" ← 금지
- 증거 없이 "완료했습니다" ← 금지

## 적용 강도 (smart-pdca 연동)

| 작업 크기 | TDD | 검증 증거 |
|----------|-----|----------|
| S (소) | 선택 (단순 수정은 면제) | 필수 (최소 테스트 1개) |
| M (중) | 필수 | 필수 (테스트 + 동작 확인) |
| L (대) | 필수 | 필수 (전체 리뷰 파이프라인) |

## 위반 시 행동

AI가 iron-law를 위반하려 할 때:
1. 스스로 감지하고 멈춘다
2. "iron-law 위반: 테스트 없이 코드를 작성하려 했습니다. 먼저 테스트를 작성합니다." 라고 알린다
3. 올바른 순서로 다시 진행한다
```

**Step 2: 커밋**

```bash
git add skills/iron-law/SKILL.md
git commit -m "[기능] iron-law 스킬 추가 - TDD + 검증 필수 철칙"
```

---

### Task 5: verification 스킬

> 완료 선언 전 반드시 증거를 확인하는 게이트 스킬.

**Files:**
- Create: `skills/verification/SKILL.md`

**Step 1: 스킬 파일 작성**

```markdown
---
name: verification
description: |
  작업 완료 전 반드시 실행되는 검증 게이트.
  증거 없이는 절대 "완료"를 선언할 수 없다.

  이 스킬은 모든 작업의 마지막 단계에서 자동으로 호출된다.
  iron-law의 "증거 없이 완료 없다" 원칙을 강제하는 실행 스킬.

  Triggers: 완료, 끝, done, finish, 마무리, 검증, verify
---

# 완료 전 검증

## 역할
모든 작업이 끝나기 전에 아래 체크리스트를 강제 실행한다.

## 검증 체크리스트

### 1. 테스트 확인
- [ ] 관련 테스트가 모두 통과하는가?
- [ ] 새로 추가한 코드에 대한 테스트가 있는가?
- [ ] 테스트 실행 결과를 캡처했는가?

### 2. 동작 확인
- [ ] 변경 사항이 의도대로 동작하는가?
- [ ] 기존 기능이 깨지지 않았는가?
- [ ] 에러/경고가 없는가?

### 3. 코드 품질
- [ ] 불필요한 console.log/print가 남아있지 않은가?
- [ ] 하드코딩된 값이 없는가?
- [ ] 보안 취약점(API 키 노출, SQL 인젝션 등)이 없는가?

### 4. 설계 대비 달성률 (M, L 작업만)
- [ ] 계획한 기능이 모두 구현되었는가?
- [ ] 달성률이 90% 이상인가?
- [ ] 미구현 항목이 있다면 이유가 문서화되었는가?

## 검증 결과 보고 형식

```
## 검증 결과

### 테스트
- 실행: `npm test` (또는 해당 명령어)
- 결과: 15/15 통과 ✓

### 동작 확인
- [변경 전]: 로그인 버튼 클릭 시 에러
- [변경 후]: 정상 로그인 + 대시보드 이동

### 달성률
- 계획 항목: 5개
- 완료 항목: 5개
- 달성률: 100%

### 결론: 완료 ✓
```

## 검증 실패 시

달성률 90% 미만이거나 테스트 실패가 있으면:
1. "검증 실패: [이유]" 알림
2. 미달 항목 목록 제시
3. 수정 후 재검증
4. 재검증 통과 시 완료 선언
```

**Step 2: 커밋**

```bash
git add skills/verification/SKILL.md
git commit -m "[기능] verification 스킬 추가 - 완료 전 필수 검증 게이트"
```

---

### Task 6: hooks.json + auto-detect 훅 스크립트

> 세션 시작 시 자동으로 상황 감지를 활성화하는 훅.

**Files:**
- Create: `hooks/hooks.json`
- Create: `scripts/session-start.js`

**Step 1: hooks.json 작성**

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "vibecraft 자동 감지 훅 - 세션 시작 시 자동 모드 감지 활성화",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "once": true,
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-start.js\"",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**Step 2: session-start.js 작성**

```javascript
#!/usr/bin/env node

/**
 * vibecraft 세션 시작 훅
 * 세션이 시작될 때 vibecraft가 활성화되었음을 알리고,
 * auto-detect 스킬을 안내하는 메시지를 출력한다.
 */

const message = `vibecraft가 활성화되었습니다. 작업을 요청하면 자동으로 상황을 감지하고 적절한 워크플로우를 안내합니다.`;

// stdout으로 출력하면 Claude에게 전달됨
console.log(message);
```

**Step 3: 커밋**

```bash
git add hooks/hooks.json scripts/session-start.js
git commit -m "[기능] 세션 시작 훅 추가 - vibecraft 자동 활성화"
```

---

### Task 7: preset-loader 훅 스크립트

> 프로젝트의 기술 스택을 자동 감지하여 적절한 프리셋을 안내하는 훅.

**Files:**
- Modify: `hooks/hooks.json`
- Create: `scripts/preset-loader.js`

**Step 1: hooks.json에 preset-loader 추가**

SessionStart 배열에 preset-loader를 추가한다:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "vibecraft 훅 설정",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "once": true,
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-start.js\"",
            "timeout": 5000
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/preset-loader.js\"",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**Step 2: preset-loader.js 작성**

```javascript
#!/usr/bin/env node

/**
 * vibecraft 프리셋 로더
 * 현재 프로젝트의 기술 스택을 감지하여 적절한 프리셋을 안내한다.
 *
 * 감지 방법:
 * - package.json → Next.js / React / Node.js
 * - build.gradle / pom.xml → Spring Boot / Java
 * - requirements.txt / pyproject.toml → Python
 * - 그 외 → General
 */

const fs = require('fs');
const path = require('path');

function detectPreset() {
  const cwd = process.cwd();
  const results = [];

  // Next.js / React 감지
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) {
        results.push('preset-nextjs');
      } else if (deps['react']) {
        results.push('preset-nextjs');
      } else {
        results.push('preset-general');
      }
    } catch {
      results.push('preset-general');
    }
  }

  // Spring Boot / Java 감지
  if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
      fs.existsSync(path.join(cwd, 'build.gradle.kts')) ||
      fs.existsSync(path.join(cwd, 'pom.xml'))) {
    results.push('preset-spring');
  }

  // Python 감지
  if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
      fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
      fs.existsSync(path.join(cwd, 'setup.py'))) {
    results.push('preset-python');
  }

  if (results.length === 0) {
    results.push('preset-general');
  }

  return results;
}

const presets = detectPreset();
const presetNames = presets.join(', ');
console.log(`감지된 기술 스택 프리셋: ${presetNames}`);
```

**Step 3: 커밋**

```bash
git add hooks/hooks.json scripts/preset-loader.js
git commit -m "[기능] preset-loader 훅 추가 - 기술 스택 자동 감지"
```

---

### Task 8: vibecraft 슬래시 명령어

> /vibecraft 명령어로 플러그인 상태를 확인하고 도움말을 보는 명령어.

**Files:**
- Create: `commands/vibecraft.md`

**Step 1: 명령어 파일 작성**

```markdown
---
description: |
  vibecraft 플러그인 도움말 및 상태 확인.
  사용 가능한 모드, 스킬, 에이전트 목록을 보여준다.
user-invocable: true
allowed-tools:
  - Read
  - Glob
---

# vibecraft 도움말

다음 내용을 사용자에게 보여주세요:

## vibecraft - 바이브코딩 네비게이션

### 자동 감지 모드
작업을 요청하면 자동으로 감지됩니다:
- **새 기능**: "~만들어줘", "~추가해줘"
- **디버깅**: "~에러", "~안 돼", "~버그"
- **프로젝트 시작**: "~만들자", "~앱/사이트"
- **코드 리뷰**: "~리뷰해줘", "~봐줘"
- **배포**: "~배포", "~릴리즈"

### 작업 크기별 워크플로우
- **S (소)**: 바로 실행 → 검증
- **M (중)**: 계획 → 실행 → 검증
- **L (대)**: brainstorming → 계획 → 설계 → 팀 구성 → 병렬 실행 → 리뷰 → 검증

### 철칙 (Iron Law)
1. 테스트 먼저 작성 (TDD)
2. 증거 없이 완료 없다

### 버전
vibecraft v0.1.0
```

**Step 2: 커밋**

```bash
git add commands/vibecraft.md
git commit -m "[기능] /vibecraft 슬래시 명령어 추가 - 도움말 및 상태 확인"
```

---

### Task 9: learning Output Style

> 현재 사용 중인 bkit-learning 스타일을 vibecraft 버전으로 재설계.

**Files:**
- Create: `output-styles/learning.md`

**Step 1: output-style 파일 작성**

```markdown
---
name: vibecraft-learning
description: |
  학습 모드 - 각 단계마다 "왜 이렇게 하는지" 설명을 포함.
  바이브코딩 초보자가 개발 방법론을 자연스럽게 배울 수 있도록 안내.

  Triggers: 학습, 배우기, 초보, 튜토리얼, learning, beginner, 공부
keep-coding-instructions: true
---

# vibecraft Learning Style

## 응답 규칙

1. 모든 작업 완료 후 **Learning Point** 섹션을 포함한다:
   > **Learning Point**: 이번 작업에서 배운 것
   > 왜 이 순서로 했는지, 어떤 원칙이 적용되었는지 설명.

2. 현재 진행 중인 워크플로우의 위치를 표시한다:
   > **현재 위치**: 새 기능 모드 > PDCA > Plan 단계

3. 사용된 vibecraft 규칙을 설명한다:
   - smart-pdca: 왜 이 크기(S/M/L)로 판단했는지
   - iron-law: 왜 테스트를 먼저 쓰는지
   - verification: 왜 증거가 필요한지

4. 초보자가 이해할 수 있는 수준으로 설명한다:
   - 전문 용어 사용 시 반드시 풀어서 설명
   - 비유를 적극 활용
   - 코드 변경의 이유를 항상 설명
```

**Step 2: 커밋**

```bash
git add output-styles/learning.md
git commit -m "[기능] learning output-style 추가 - 학습 모드 응답 포맷"
```

---

### Task 10: standard Output Style

**Files:**
- Create: `output-styles/standard.md`

**Step 1: output-style 파일 작성**

```markdown
---
name: vibecraft-standard
description: |
  기본 응답 모드 - 간결하고 실용적인 결과 위주.
  불필요한 설명 없이 핵심만 전달.

  Triggers: 기본, 간결, standard, 빠르게
keep-coding-instructions: true
---

# vibecraft Standard Style

## 응답 규칙

1. 결과 위주로 간결하게 응답한다
2. 코드 변경 시 변경 사항만 요약한다
3. 워크플로우 진행 상황은 한 줄로 표시한다:
   > 새 기능 > M > 실행 중 (3/5 완료)
4. Learning Point는 포함하지 않는다
5. 사용자가 물어보지 않은 것은 설명하지 않는다
```

**Step 2: 커밋**

```bash
git add output-styles/standard.md
git commit -m "[기능] standard output-style 추가 - 기본 간결 응답 포맷"
```

---

### Task 11: CLAUDE.md 업데이트

> 프로젝트 CLAUDE.md를 Phase 1 구현 내용에 맞게 업데이트.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 구현된 내용 반영**

스킬 목록, 폴더 구조, 사용법을 현재 구현 상태에 맞게 업데이트한다.

**Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "[문서] CLAUDE.md 업데이트 - Phase 1 구현 내용 반영"
```

---

### Task 12: 전체 통합 테스트

> 모든 파일이 올바른 위치에 있고, 플러그인 구조가 맞는지 확인.

**Step 1: 파일 구조 확인**

```bash
find . -name "*.md" -o -name "*.json" -o -name "*.js" | head -30
```

예상 결과:
```
./.claude-plugin/plugin.json
./skills/auto-detect/SKILL.md
./skills/smart-pdca/SKILL.md
./skills/iron-law/SKILL.md
./skills/verification/SKILL.md
./hooks/hooks.json
./scripts/session-start.js
./scripts/preset-loader.js
./commands/vibecraft.md
./output-styles/learning.md
./output-styles/standard.md
./CLAUDE.md
```

**Step 2: hooks.json 문법 검증**

```bash
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json', 'utf-8')); console.log('hooks.json: 유효함')"
```

**Step 3: 스크립트 문법 검증**

```bash
node -c scripts/session-start.js && echo "session-start.js: 유효함"
node -c scripts/preset-loader.js && echo "preset-loader.js: 유효함"
```

**Step 4: 최종 커밋**

```bash
git add -A
git commit -m "[설정] Phase 1 완료 - 핵심 스킬 4개 + 훅 3개 + 명령어 + Output Styles"
```
