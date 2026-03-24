---
description: |
  배포 프로세스를 안내한다.
  배포 전 체크리스트, 환경별 설정 확인, 롤백 방법을 단계별로 안내한다.
  Triggers: deploy, 배포, 릴리즈
user-invocable: true
argument-hint: "[환경: staging|production] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# 배포 가이드

vibecraft:deploy-guide 스킬을 호출하여 배포를 안내한다.

## 동작

1. 배포 전 체크리스트 확인
2. 환경별 설정 검증
3. 배포 명령어 가이드
4. 롤백 방법 안내

## deploy-manager 에이전트와 연동

복잡한 배포는 deploy-manager 에이전트가 체크리스트를 단계별로 실행한다.
