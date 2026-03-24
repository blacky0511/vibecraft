---
description: |
  구현 계획을 실행한다.
  plan.md를 기반으로 서브에이전트를 디스패치하여 코드를 구현한다.
  Triggers: execute, 실행, 구현 시작
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
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TeamCreate
  - SendMessage
---

# 계획 실행

vibecraft:executing-plans 스킬을 호출하여 구현을 시작한다.

## 동작

태스크 규모에 따라 자동 분기:
- **S**: 직접 실행
- **M**: 소규모 병렬 (서브에이전트 2~3개)
- **L**: CTO 팀 구성 (team-orchestration)

각 태스크는 독립 worktree에서 격리 실행되며,
완료 후 리뷰 파이프라인이 자동으로 실행된다.

## 전제 조건

- `docs/plans/{feature}/plan.md`가 존재해야 함
- 없으면 `/plan`부터 진행하라고 안내

## 다음 단계

실행 완료 후 → `/verify`로 검증한다.
