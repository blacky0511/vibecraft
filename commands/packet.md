---
description: |
  웹사이트의 네트워크 패킷/API를 캡처하고 분석한다.
  Playwright MCP로 브라우저를 조작하면서 API 엔드포인트를 추출한다.
  Triggers: packet, 패킷, API 추출, 네트워크 캡처
user-invocable: true
argument-hint: "[URL] (선택)"
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

# 패킷 캡처

vibecraft:packet-capture 스킬을 호출하여 네트워크 패킷 캡처를 시작한다.

## 동작

1. 타겟 URL 확인 (인자 또는 사용자에게 질문)
2. Playwright MCP로 브라우저 열기 + 네트워크 모니터링
3. 사용자 시나리오 시뮬레이션 (클릭, 스크롤, 폼 입력 등)
4. API 요청/응답 캡처 및 구조 분석
5. 순수 HTTP 요청 코드 생성 (Python/JavaScript)

## 인자가 없을 때

타겟 URL과 목표 데이터를 사용자에게 물어본다.

## 인자가 있을 때

지정된 URL로 바로 패킷 캡처를 시작한다.
