---
description: |
  새 기능 추가를 시작한다.
  auto-detect + smart-pdca로 작업 크기를 판단하고 RPDCA 워크플로우를 실행한다.
  Triggers: feature, 기능, 새 기능
user-invocable: true
argument-hint: "[기능 설명] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# 새 기능 추가

vibecraft:new-feature 스킬을 호출하여 새 기능 추가 워크플로우를 시작한다.

## 인자가 없을 때

사용자에게 어떤 기능을 만들고 싶은지 물어본다.

## 인자가 있을 때

바로 smart-pdca로 크기를 판단하고 RPDCA 워크플로우를 실행한다:
- **S**: 바로 구현 → 검증
- **M**: research → plan → 실행 → 검증
- **L**: research → brainstorming → plan → 팀 구성 → 실행 → 검증
