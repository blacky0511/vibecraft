---
description: |
  데이터/코드 분석을 시작한다.
  분석 작업을 서브에이전트에 위임하여 메인 컨텍스트를 보존한다.
  Triggers: analyze, 분석, 데이터
user-invocable: true
argument-hint: "[분석 대상 또는 질문] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Skill
---

# 데이터/코드 분석

vibecraft:analysis-delegation 스킬을 호출하여 분석을 시작한다.

## 동작

규모별 자동 분기:
- **S**: 직접 분석
- **M**: 서브에이전트 1개에 위임
- **L**: data-analyst 에이전트 팀 구성

deep-analysis 4단계 방법론 적용:
1. 표면 분석
2. 교란 변수 탐색
3. 코호트 추적
4. 인과 검증
