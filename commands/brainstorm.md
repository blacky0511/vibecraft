---
description: |
  아이디어를 구체적인 설계로 발전시킨다.
  질문을 통해 요구사항을 하나씩 구체화하고 최적의 설계를 도출한다.
  Triggers: brainstorm, 브레인스토밍, 아이디어, 설계
user-invocable: true
argument-hint: "[아이디어 또는 요구사항] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# 브레인스토밍

vibecraft:brainstorming 스킬을 호출하여 아이디어를 구체적인 설계로 발전시킨다.

## 동작

1. 질문을 통해 요구사항을 하나씩 구체화
2. 여러 접근 방식을 비교
3. 최적의 설계를 도출
4. `docs/plans/{feature}/design.md`에 설계 문서 저장

## 다음 단계

설계 완료 후 → `/plan`으로 구현 계획을 작성한다.
