---
description: |
  네이버 서비스 자동화 문제를 진단한다.
  블로그/카페/플레이스/스마트스토어 등 네이버 관련 문제를 5렌즈로 분석한다.
  Triggers: naver, 네이버, 블로그, 카페, 플레이스
user-invocable: true
argument-hint: "[증상 설명] (선택)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
  - Write
  - Edit
  - Skill
---

# 네이버 진단

vibecraft:naver-diagnosis 스킬을 호출하여 네이버 서비스 문제를 진단한다.

## 동작

1. 증상 확인 (어떤 네이버 서비스에서 어떤 문제가 있는지)
2. naver-logic-analyzer 에이전트 호출
3. 5렌즈 통합 분석 (네트워크/브라우저/보안/API/자동화)
4. 진단 결과 보고 + 해결 방안 제시

## 인자가 없을 때

어떤 네이버 서비스에서 어떤 문제가 있는지 사용자에게 물어본다.

## 인자가 있을 때

증상을 바로 분석한다.
