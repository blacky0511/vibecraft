---
description: |
  구현 계획을 작성한다.
  설계를 단계별 구현 계획(plan.md)으로 변환하고 plan-critic이 자동 리뷰한다.
  Triggers: plan, 계획, 구현 계획
user-invocable: true
argument-hint: "[기능명] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
  - Write
  - Edit
---

# 구현 계획 작성

vibecraft:writing-plans 스킬을 호출하여 단계별 구현 계획을 작성한다.

## 동작

1. research.md / design.md를 참고하여 plan.md 초안 작성 (opus)
2. plan-critic 에이전트가 자동 리뷰 (opus, M:2라운드/L:3라운드)
3. 리뷰 반영하여 plan.md 수정
4. 사용자에게 최종 확인 요청

## 산출물

- `docs/plans/{feature}/plan.md` (정본)
- `docs/plans/{feature}/plan-review.md` (리뷰 기록)

## 다음 단계

계획 확인 후 → `/execute`로 실행을 시작한다.
