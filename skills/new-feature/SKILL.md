---
name: new-feature
description: |
  새 기능 추가의 전체 흐름을 가이드하는 오케스트레이션 스킬.
  auto-detect가 "새 기능 모드"로 감지하면 이 스킬이 호출된다.
  smart-pdca로 작업 크기(S/M/L)를 판단한 뒤, 크기에 맞는 워크플로우를 실행한다.

  Triggers: 만들어줘, 추가해줘, 구현해줘, 넣어줘, 기능, feature, 새 기능
---

# 새 기능 추가 (new-feature)

## 역할

사용자가 새로운 기능을 요청했을 때 호출되는 오케스트레이션 스킬.
작업 크기를 판단하고, 크기에 따라 다른 강도의 워크플로우를 실행한다.

---

## 전체 흐름 개요

```
auto-detect → new-feature (현재 스킬)
                  │
                  ▼
             smart-pdca (작업 크기 판단)
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
       S          M          L
  (소규모)   (중간규모)   (대규모)
```

---

## 크기별 워크플로우 요약

> 각 크기의 상세 기준, 예시, PDCA 단계별 행동은 **smart-pdca 스킬**을 참고한다.

| 크기 | 조건 | 확인 횟수 | 핵심 흐름 |
|------|------|:---:|------|
| S | 파일 1~2개 | 0회 | 바로 구현 → verification → 완료 |
| M | 파일 3~5개 | 1회 | 간략 계획 [확인] → executing-plans → verification → 완료 |
| L | 파일 6개+ | 2회 | brainstorming → writing-plans [확인] → 설계 [확인] → team-orchestration → executing-plans → review-pipeline → verification → 완료 |

---

## 연동 스킬 목록

| 스킬 | 호출 조건 | 역할 |
|------|----------|------|
| `smart-pdca` | 항상 (크기 판단) | S/M/L 분류 |
| `iron-law` | 구현 단계 항상 | TDD + 증거 원칙 강제 |
| `brainstorming` | M(간략), L(상세) | 요구사항 구체화 |
| `writing-plans` | L만 | 계획서/설계서 문서화 |
| `executing-plans` | M, L | 서브에이전트 병렬 실행 |
| `team-orchestration` | L만 | CTO 팀 구성 및 역할 배정 |
| `review-pipeline` | L만 | 3단계 코드 리뷰 |
| `verification` | S, M, L 항상 | 최종 검증 게이트 |

---

## 스킬 호출 흐름 다이어그램

```
auto-detect
    │ (새 기능 모드 감지)
    ▼
new-feature (현재 스킬)
    │
    ▼
smart-pdca
    │
    ├── S ──────────────────────────────────→ 직접 구현
    │                                              │
    │                                         iron-law
    │                                              │
    │                                        verification
    │                                              │
    │                                         완료 보고
    │
    ├── M ──────── brainstorming(간략) ──→ 간략 계획
    │                                         [확인 1회]
    │                                              │
    │                                    executing-plans
    │                                    (서브에이전트 1~2개)
    │                                         iron-law
    │                                              │
    │                                        verification
    │                                              │
    │                                         완료 보고
    │
    └── L ──────── brainstorming(상세) ──→ writing-plans
                                            [확인 1회]
                                         상세 설계서 작성
                                            [확인 2회]
                                        team-orchestration
                                        executing-plans
                                        (서브에이전트 다수)
                                          iron-law
                                        review-pipeline
                                        (3단계 리뷰)
                                        verification
                                              │
                                         완료 보고
```

---

## 중요 규칙

- **이 스킬은 오케스트레이터 역할**이다. 직접 코드를 작성하지 않고, 다른 스킬을 순서대로 호출하여 전체 흐름을 제어한다.
- **iron-law는 항상 적용**된다. 크기와 무관하게 구현 단계에서 반드시 iron-law 원칙을 따른다.
- **사용자 확인 횟수를 초과하지 않는다.** L이더라도 계획서/설계서 확인 2회 이후에는 사용자 승인 없이 자동으로 진행한다.
- **완료는 verification 통과 후에만 선언한다.** 달성률 90% 미만이면 완료를 선언하지 않고 수정 후 재검증한다.
