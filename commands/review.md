---
description: |
  코드 리뷰를 시작한다. 현재 브랜치의 변경 사항을 분석하여
  구조화된 리뷰를 수행한다.
  Triggers: review, 리뷰, 검토
user-invocable: true
argument-hint: "[파일경로] (선택, 특정 파일만 리뷰)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# 코드 리뷰 시작

vibecraft:code-review-request 스킬을 호출하여 코드 리뷰를 진행한다.

## 인자가 없을 때

1. `git diff` 또는 `git diff --staged`로 현재 변경 사항을 확인한다
2. 변경된 파일 목록을 요약한다
3. code-reviewer 에이전트를 호출하여 리뷰를 수행한다
4. 리뷰 결과를 templates/review-checklist.md 형식으로 보고한다

## 인자가 있을 때 (파일 경로)

지정된 파일만 대상으로 리뷰를 수행한다.

## 리뷰 관점

- 가독성: 코드를 처음 보는 사람이 이해할 수 있는가
- 네이밍: 변수/함수명이 명확한가
- 중복: 같은 로직이 반복되지 않는가
- 에러 처리: 예외 상황을 적절히 처리하는가
- 보안: 취약점이 없는가
- 성능: 명백한 성능 문제가 없는가
- 테스트: 테스트가 충분한가
