---
description: |
  현재 PDCA 상태를 확인하거나, 특정 단계로 진입한다.
  인자 없이 호출하면 현재 진행 중인 작업의 PDCA 상태를 보여준다.
  Triggers: pdca, 상태, 진행상황
user-invocable: true
argument-hint: "[plan|do|check|act] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
---

# PDCA 상태 확인

## 인자가 없을 때

현재 진행 중인 작업의 PDCA 상태를 확인하여 보여준다.

1. `docs/session.md` 파일이 있으면 읽어서 현재 단계를 파악한다
2. `docs/plans/` 디렉토리에서 최근 계획서를 확인한다
3. 아래 형식으로 보고한다:

```
## PDCA 현재 상태

**작업**: (작업 목표)
**크기**: S / M / L
**단계**: Plan → **Do** → Check → Act
**진행**: (어디까지 했는지)
**남은 작업**: (아직 안 한 것)
```

진행 중인 작업이 없으면:
```
현재 진행 중인 PDCA 작업이 없습니다.
새 작업을 요청하면 자동으로 시작됩니다.
```

## 인자가 있을 때

- `plan`: 현재 작업의 Plan 단계로 이동 (brainstorming/writing-plans 스킬 호출)
- `do`: Do 단계로 이동 (executing-plans 스킬 호출)
- `check`: Check 단계로 이동 (verification 스킬 호출)
- `act`: Act 단계로 이동 (finishing-branch 스킬 호출)
