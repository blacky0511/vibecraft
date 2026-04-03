---
description: |
  CTO 에이전트팀을 구성하여 대규모 작업을 병렬로 실행한다.
  작업 설명을 인자로 전달하면 바로 팀 구성을 시작한다.
  Triggers: team, 팀, 병렬, 에이전트팀
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TeamCreate
  - SendMessage
  - Write
  - Edit
---

# CTO 에이전트팀 구성

vibecraft:team-orchestration 스킬을 호출하여 CTO 에이전트팀을 구성합니다.

## 실행 절차

1. 사용자의 작업 요청을 분석한다
2. new-feature로 작업 크기를 판단한다 (M 이상이면 팀 구성 적합)
3. team-orchestration 스킬에 따라:
   - 계획서가 있으면 → 바로 팀 구성
   - 계획서가 없으면 → writing-plans → 팀 구성
4. lib/team/ 엔진으로 의존성 분석, Wave 계산, 에이전트 매칭 수행
5. 사용자에게 팀 구성 보고 후 승인받아 실행

## 인자가 있을 때

```
/team 로그인 + 회원가입 + 마이페이지 구현해줘
```

→ 작업 내용을 바로 분석하여 팀 구성을 시작한다.

## 인자가 없을 때

```
/team
```

→ 현재 진행 중인 팀이 있으면 상태를 보여주고,
   없으면 어떤 작업을 팀으로 처리할지 물어본다.
