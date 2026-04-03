---
description: |
  ralph-loop(반복 자동 수정)을 시작한다.
  테스트 실패, 타입 에러, 린트 에러 등을 자동으로 반복 수정한다.
  검증 명령어를 실행하고 실패 항목을 파싱하여 하나씩 고치는 루프를 실행한다.
  Triggers: ralph, ralph-loop, 반복 수정, 일괄 수정
user-invocable: true
argument-hint: "[검증 명령어] (선택, 예: npm test, npx tsc --noEmit)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
  - Write
  - Edit
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TeamCreate
  - SendMessage
---

# ralph-loop 반복 자동 수정

executing-plans에 `ralphLoop: true`를 전달하고 team-orchestration ralph-loop 모드를 실행한다.

## ralph-loop이란?

여러 개의 실패(테스트, 타입 에러, 린트 에러 등)를 **자동으로 반복 수정**하는 실행 방식이다.
한 번에 다 고치지 않고, 수정 → 재검증 → 수정 → 재검증... 루프를 돌면서 하나씩 잡아간다.

## 적합한 상황

- 테스트 실패가 여러 개 있을 때
- 타입 에러 (tsc) 가 여러 개 있을 때
- 린트 에러 (eslint, prettier) 가 여러 개 있을 때
- 빌드 에러가 여러 개 있을 때
- **공통점**: 검증 명령어가 있고, 실패 항목이 독립적으로 수정 가능

## 실행 절차

### 1. 검증 명령어 확정

인자로 전달되었으면 그것을 사용, 없으면 프로젝트에서 자동 감지:
- `package.json`의 test 스크립트 → `npm test`
- TypeScript → `npx tsc --noEmit`
- Python → `pytest`
- Java → `./gradlew test`

### 2. 초기 측정

```bash
# 검증 명령어를 실행하여 현재 실패 항목 수집
npm test 2>&1
```

실패 항목을 파싱하여 목록 작성:
```json
[
  {"file": "src/auth.ts", "line": 45, "type": "test-failure", "message": "Expected 200 got 401"},
  {"file": "src/user.ts", "line": 12, "type": "type-error", "message": "Property does not exist"}
]
```

### 3. Iteration 루프 (team-orchestration ralph-loop 모드)

```
Iteration 1: 실패 8개 → 서브에이전트 3개 병렬 수정 → 재검증 → 실패 3개
Iteration 2: 실패 3개 → 서브에이전트 2개 병렬 수정 → 재검증 → 실패 0개
→ 완료!
```

### 4. 안전장치

- **최대 반복**: 5회
- **진전 없으면 중단**: 실패 수가 줄지 않으면 즉시 중단
- **회귀 감지**: 실패 수가 증가하면 즉시 중단 + 롤백

### 5. 완료 후

- 실패 0개 → 성공 보고
- 중단 → 남은 실패 항목 목록 보고 + 수동 수정 안내

## 사용 예시

```
/ralph npm test              ← 테스트 전부 통과시키기
/ralph npx tsc --noEmit      ← 타입 에러 전부 잡기
/ralph npx eslint .          ← 린트 에러 전부 정리
/ralph                       ← 검증 명령어 자동 감지
```

## 자연어로도 가능

- "에러 다 고쳐줘"
- "테스트 전부 통과시켜줘"
- "타입 에러 싹 잡아줘"
- "빌드 에러 하나도 남기지 마"
- "린트 에러 전부 정리해줘"
