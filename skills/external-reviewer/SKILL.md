---
name: external-reviewer
description: |
  외부 코드 검사 도구를 리뷰 파이프라인에 연결하는 스킬.
  Codex CLI, ESLint, Prettier, SonarQube 등의 도구를 Bash로 실행하고 결과를 리뷰에 반영한다.
  도구가 설치되어 있지 않으면 해당 도구는 스킵하며, 모든 도구는 선택적으로 사용된다.

  Triggers: 외부 리뷰, external, codex, eslint, 도구 연동, external-reviewer
---

# 외부 리뷰 도구 연동 스킬

## 역할

`executing-plans`의 리뷰 파이프라인 2단계에서 호출된다.
외부 정적 분석 도구와 AI 리뷰 도구를 실행하고, 결과를 취합하여 개선 사항을 반환한다.

모든 도구는 **선택적(optional)**이다. 도구가 없거나 실행 실패 시 해당 도구를 조용히 스킵한다.

---

## 지원 도구 목록

| 도구 | 역할 | 설치 확인 명령어 |
|------|------|----------------|
| ESLint | JavaScript/TypeScript 코드 품질 검사 | `npx eslint --version` |
| Prettier | 코드 포맷 검사 | `npx prettier --version` |
| Codex CLI | OpenAI Codex 기반 2차 AI 코드 리뷰 | `codex --version` |
| SonarQube | 심층 정적 분석, 보안 취약점 탐지 | `sonar-scanner --version` |
| TypeScript | 타입 오류 검사 | `npx tsc --version` |

---

## 도구 설정 방법

외부 도구의 경로와 실행 옵션은 두 가지 방법으로 설정할 수 있다.

### 방법 1: 프로젝트 CLAUDE.md에 설정

프로젝트 루트의 `CLAUDE.md`에 아래 블록을 추가한다.

```markdown
## vibecraft 외부 리뷰 도구 설정

```yaml
external-reviewer:
  tools:
    eslint:
      enabled: true
      config: ".eslintrc.json"
    prettier:
      enabled: true
      config: ".prettierrc"
    codex:
      enabled: false
    sonarqube:
      enabled: false
      host: "http://localhost:9000"
      token: "${SONAR_TOKEN}"
    typescript:
      enabled: true
      config: "tsconfig.json"
```
```

### 방법 2: vibecraft 전역 설정

`~/.claude/vibecraft-config.yaml` 파일에 동일한 형식으로 설정한다.
프로젝트 설정이 전역 설정보다 우선 적용된다.

---

## 실행 방법

### 1. 도구 설치 확인

각 도구의 설치 여부를 먼저 확인한다. 설치되지 않은 도구는 스킵한다.

```bash
# ESLint 설치 확인
npx eslint --version 2>/dev/null && echo "설치됨" || echo "스킵"

# TypeScript 설치 확인
npx tsc --version 2>/dev/null && echo "설치됨" || echo "스킵"

# Codex CLI 설치 확인
codex --version 2>/dev/null && echo "설치됨" || echo "스킵"
```

### 2. 도구별 실행

설치가 확인된 도구를 순서대로 실행한다.

#### ESLint 실행

```bash
npx eslint {검사 대상 파일 또는 디렉토리} --format=json > .vibecraft/eslint-result.json 2>&1
```

#### Prettier 검사

```bash
npx prettier --check {검사 대상 파일 또는 디렉토리} 2>&1 | tee .vibecraft/prettier-result.txt
```

#### TypeScript 타입 검사

```bash
npx tsc --noEmit 2>&1 | tee .vibecraft/tsc-result.txt
```

#### Codex CLI 2차 리뷰

```bash
# 변경된 파일 목록을 Codex에 전달하여 AI 리뷰 실행
codex review {검사 대상 파일} 2>&1 | tee .vibecraft/codex-result.txt
```

#### SonarQube 실행

```bash
sonar-scanner \
  -Dsonar.projectKey={프로젝트명} \
  -Dsonar.sources=. \
  -Dsonar.host.url={호스트} \
  -Dsonar.login={토큰} \
  2>&1 | tee .vibecraft/sonar-result.txt
```

### 3. 결과 취합

모든 도구 실행 후, 결과를 파싱하여 아래 형식으로 취합한다.

```
## 외부 리뷰 결과

### ESLint
- 오류: N건
- 경고: N건
- 주요 지적: {구체적인 항목}

### TypeScript
- 타입 오류: N건
- 주요 지적: {구체적인 항목}

### Codex (AI 2차 리뷰)
- 제안 사항: {내용}

### 스킵된 도구
- Prettier: 설치되지 않음
- SonarQube: 설정 없음
```

---

## Codex를 2차 리뷰어로 사용하는 예시 흐름

Codex CLI를 AI 2차 리뷰어로 활용하면, 메인 에이전트와 독립적인 시각으로 코드를 검토할 수 있다.

```
[1단계] 메인 에이전트가 코드 구현 완료
    │
    ▼
[2단계] external-reviewer 스킬 호출
    │
    ├── ESLint: 문법/스타일 오류 검사
    ├── TypeScript: 타입 오류 검사
    └── Codex CLI: 독립적 AI 코드 리뷰
              │
              ▼
[3단계] 결과 취합 → gap-detector로 전달
    │
    ▼
[4단계] 지적 사항 수정 → 재검사
```

**Codex CLI 설치 방법:**

```bash
npm install -g @openai/codex
```

**Codex 리뷰 실행 예시:**

```bash
# 특정 파일을 Codex로 리뷰 요청
codex "이 코드를 리뷰하고 개선 사항을 알려줘" --file src/auth/login.ts
```

---

## 결과 반영 규칙

| 결과 심각도 | 처리 방식 |
|-----------|---------|
| 오류 (Error) | 반드시 수정 후 재검사 |
| 경고 (Warning) | 수정을 권장하되, 사용자 판단에 맡김 |
| 정보 (Info/Hint) | 참고용으로 보고서에만 포함 |
| 도구 스킵 | 결과 없음으로 처리, 전체 파이프라인 계속 진행 |

오류가 수정되면 해당 도구만 재실행하여 통과 여부를 확인한다.

---

## 연동 흐름

```
executing-plans 리뷰 파이프라인
    │
    ├── 1단계: code-simplifier (코드 단순화)
    │
    ├── 2단계: external-reviewer (현재 스킬: 외부 도구 실행)
    │         ├── ESLint
    │         ├── Prettier
    │         ├── TypeScript
    │         ├── Codex CLI
    │         └── SonarQube
    │
    └── 3단계: gap-detector (계획 대비 누락 탐지)
```
