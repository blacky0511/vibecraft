---
description: |
  구현 결과를 검증한다.
  gap-detector로 plan.md 대비 달성률을 측정하고
  90% 미만이면 자동 수정 루프를 실행한다.
  Triggers: verify, 검증, 확인
user-invocable: true
argument-hint: "[기능명] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# 검증 게이트

vibecraft:verification 스킬을 호출하여 구현 결과를 검증한다.

## 동작

1. gap-detector (opus)로 plan.md vs 구현 코드 비교
2. Match Rate 계산
3. 90% 이상 → 통과, 완료 보고
4. 90% 미만 → Gap 목록 기반 자동 수정 루프 (Check-Act)
   - M: 최대 2회 반복
   - L: 최대 3회 반복

## iron-law 적용

- 테스트 실행 결과를 증거로 제시해야 함
- 증거 없이 "완료"를 선언할 수 없음
