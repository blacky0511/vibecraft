---
description: |
  코드베이스 리서치를 시작한다.
  코드를 깊이 읽고 research.md를 생성한다.
  Triggers: research, 리서치, 조사
user-invocable: true
argument-hint: "[조사 대상 또는 질문] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
---

# 코드베이스 리서치

vibecraft:research 스킬을 호출하여 코드베이스를 깊이 분석한다.

## 인자가 없을 때

프로젝트 전체를 대상으로 리서치를 수행한다.

## 인자가 있을 때

지정된 대상/질문에 대해 집중 리서치를 수행한다.

## 산출물

- `docs/plans/{feature}/research.md` 생성
- Part 1: 비즈니스 관점 (사용자용)
- Part 2: 기술 관점 (AI용)

## 다음 단계

리서치 완료 후 → `/plan` 또는 `/brainstorm`으로 이어간다.
