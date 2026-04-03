---
description: |
  코드를 정리하고 간소화한다.
  기능 변경 없이 코드 품질을 개선한다.
  Triggers: simplify, 정리, 간소화, 리팩토링
user-invocable: true
argument-hint: "[파일경로] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Write
  - Edit
---

# 코드 간소화

code-simplifier 에이전트를 호출하여 코드를 정리한다.

## 동작

1. 대상 파일/범위 확인
2. code-simplifier 에이전트 호출:
   - 중복 제거
   - 불필요한 복잡도 제거
   - 네이밍 개선
   - 가독성 향상
3. 변경 전후 비교 제시

## 인자가 없을 때

최근 변경된 파일을 대상으로 정리한다.

## 인자가 있을 때

지정된 파일만 대상으로 정리한다.
