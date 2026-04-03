---
name: new-feature
description: |
  사용자가 기능 추가/구현/개발을 요청할 때 반드시 이 스킬을 먼저 호출하라.
  "만들어줘", "추가해줘", "구현해줘", "개발해줘", "넣어줘", "해줘" 등의
  요청이 있으면 코드를 바로 작성하지 말고 이 스킬을 호출하여 작업 크기(S/M/L)를
  판단한 뒤 적절한 워크플로우를 실행하라. 이 스킬 없이 바로 코드를 작성하면
  계획 없는 구현으로 품질이 저하되고 재작업이 발생한다.
  Triggers: 만들어줘, 추가해줘, 구현해줘, 개발해줘, 넣어줘, 기능, feature, implement, create, build
---

# 새 기능 추가 (new-feature)

## 역할

사용자가 새로운 기능을 요청했을 때 호출되는 오케스트레이션 스킬.
직접 코드를 작성하지 않고, 다른 스킬을 순서대로 호출하여 전체 흐름을 제어한다.

## 실행 흐름

1. 아래 **작업 크기 판단** 기준으로 S/M/L을 판별한다
2. 크기에 따라 워크플로우 자동 실행
3. **CLAUDE.md AI 행동 규칙** 적용 (크기 무관, TDD + 증거 필수)
4. **verification** 통과 후에만 완료 선언 (달성률 90% 미만 시 재작업)

---

## 작업 크기 판단 (S/M/L)

이 스킬이 호출되면 먼저 작업 크기를 판단한다:

| 크기 | 기준 | 워크플로우 |
|------|------|-----------|
| S | 1~3파일 변경, 30분 이내, 명확한 요구사항 | 바로 코드 작성 → verification |
| M | 4~10파일, 설계 필요, 테스트 포함 | research → writing-plans → executing-plans → verification |
| L | 10파일+, 아키텍처 변경, 팀 필요 | research → writing-plans → team-orchestration → verification |

### S 크기 워크플로우
바로 코드를 작성한다. CLAUDE.md의 Iron Law 규칙을 따른다.
완료 후 Skill 도구로 vibecraft:verification을 호출한다.

### M 크기 워크플로우
1. Skill 도구로 vibecraft:research를 호출한다
2. 리서치 완료 후 vibecraft:writing-plans를 호출한다
3. 계획 확인 후 vibecraft:executing-plans를 호출한다
4. 실행 완료 후 vibecraft:verification을 호출한다

### L 크기 워크플로우
M과 동일하되, executing-plans 대신 vibecraft:team-orchestration으로 병렬 실행한다.
