# Plan Review — plugin-improvement

## Round 1: 누락 + 실현 가능성 (시니어 개발자)

| Step | 변경 유형 | 이유 |
|------|----------|------|
| 사전 준비 | **추가** | 27개 스킬 폴더 삭제는 되돌리기 어려운 대규모 변경. Git 브랜치 + Step별 커밋으로 복구 경로 확보 필요. 초안에 롤백 계획이 전혀 없었음. |
| Step 1 | **보강** | agents/test-writer.md(iron-law 4곳), agents/debugger.md(1곳), agents/cto-lead.md(2곳), commands/verify.md(1곳), scripts/commit-guard.js(3곳)에서 iron-law를 참조하지만 초안에서 이 업데이트가 누락됨. grep으로 확인한 실제 참조 위치를 명시적으로 추가. |
| Step 1 | **보강** | 검증 기준에 "삭제된 스킬명이 잔존하지 않는지 grep 확인" 추가. 눈으로 확인이 아닌 객관적 검증. |
| Step 2 | **보강** | executing-plans SKILL.md에서 error-simulation, code-simplifier를 참조하는데 (30곳+), 스킬 삭제 후 참조 업데이트가 필요함을 명시. code-simplifier는 에이전트이므로 삭제 대상이 아님을 구분. |
| Step 2 | **보강** | user-prompt-handler.js의 simple-tweak 패턴 처리를 Step 4에서 상세히 다루도록 연결. |
| Step 3 | **보강** | SessionStart stdout이 system-reminder로 전달된다는 전제가 미확인(E0). 검증 방법과 실패 시 대안(CLAUDE.md 방식)을 명시. |
| Step 4 | **추가** | simple-tweak 스킬이 Step 2에서 삭제되므로, user-prompt-handler.js의 simpleTweak 패턴이 존재하지 않는 스킬을 호출하게 됨. 직접 가이드 메시지로 변경하는 작업 추가. |
| Step 5 | **보강** | naver-diagnosis가 description 리라이팅 대상에서 누락됨. user-prompt-handler.js에도 네이버 관련 트리거 패턴이 없으므로 함께 추가 필요. |
| Step 6 | **보강** | smart-pdca 삭제 시 skill-post.js(2곳), commands/feature.md(2곳), commands/ralph.md(1곳), commands/team.md(1곳), user-prompt-handler.js(1곳)의 참조 업데이트가 필요하지만 초안에서 누락. brainstorming 삭제 시 commands/brainstorm.md 리다이렉트도 필요. |
| Step 6 | **보강** | writing-plans에 brainstorming 통합 시 SKILL.md가 과도하게 커질 위험. "핵심만 추출" 주의사항 추가. |
| Step 7 | **추가** (신규 Step) | external-reviewer 스킬이 초안의 남는 목록에도, 삭제 목록에도 없는 누락 상태. L 크기 RPDCA에서 사용되므로 처리 방안 결정 필요. |
| Step 8 (초안 Step 7) | **수정** | skill-post.js를 완전 제거하면 RPDCA 체인 완주율이 하락할 위험. 훅 + SKILL.md 이중 안내가 체인 완주에 더 효과적이므로, 삭제 대신 수정(삭제된 스킬 항목만 제거)으로 변경. |
| Step 8 | **보강** | unified-stop.js 간소화 시 신규 사용자 온보딩 문제. RPDCA 비진행 상태에서도 최소 리마인더 유지 조건 추가. |
| Step 9 (초안 Step 8) | **보강** | CLAUDE.md 업데이트 시 RPDCA 워크플로우 섹션, 핵심 철학 섹션도 변경 필요 (iron-law 스킬 → CLAUDE.md 규칙). 전체 grep 최종 검증 추가. |
| Step 10 (초안 Step 9) | **보강** | 테스트 시나리오에 simple-tweak(색상 바꿔줘), naver-diagnosis(네이버 진단) 추가. RPDCA 체인 완주율 테스트 추가. 성공 기준을 10개 중 8개 → 12개 중 9개로 조정. |
| 위험 요소 | **추가** (신규 섹션) | 초안에 위험 요소 분석이 전혀 없었음. CLAUDE.md 과대, system-reminder 미작동, Claude 무시, 참조 깨짐, skill-post.js 제거 위험 등 5가지 위험 + 대응책 추가. |

## 변경 요약

| Step | 최종 판정 | 이유 (한 줄) |
|------|----------|-------------|
| 사전 준비 | 추가 | 대규모 삭제 작업에 롤백 경로가 없으면 복구 불가 |
| Step 1 | 보강 | agents/commands/scripts의 iron-law 참조(11곳) 업데이트 누락 |
| Step 2 | 보강 | executing-plans/systematic-debugging의 참조 업데이트 + simple-tweak 패턴 처리 연결 |
| Step 3 | 보강 | system-reminder 전제가 미확인(E0) — 검증 방법과 대안 필요 |
| Step 4 | 보강 | simple-tweak 패턴의 삭제된 스킬 호출 문제 추가 |
| Step 5 | 보강 | naver-diagnosis 리라이팅 + 트리거 패턴 누락 |
| Step 6 | 보강 | 삭제 스킬의 참조 업데이트(7곳+) 누락 + brainstorm 명령어 리다이렉트 |
| Step 7 | 추가 | external-reviewer가 남는/삭제 어디에도 없는 누락 상태 |
| Step 8 | 수정 | skill-post.js 완전 제거 → 수정으로 변경 (체인 완주율 보호) |
| Step 9 | 보강 | CLAUDE.md 추가 업데이트 항목 + 최종 grep 검증 |
| Step 10 | 보강 | 테스트 시나리오 12개로 확장 + RPDCA 체인 완주 테스트 |
| 위험 요소 | 추가 | 5가지 위험 + 대응책 신규 추가 |

---

## Round 2: 외부 CTO 관점 (실행 순서 + 현실성 + 누락 보완)

| Step | 변경 유형 | 이유 |
|------|----------|------|
| Step 2 | **보강** | CLAUDE.md 줄 수 현실성 검증 추가. 현재 208줄 + Step 1(~45줄) + Step 2(~18줄) = ~271줄. 350줄 이내 달성 가능하다는 근거를 명시. Step 9에서 디렉토리 구조 축소로 줄 수가 오히려 감소하는 점도 반영. |
| Step 2 | **보강** | scripts/test-trigger.js에서 simple-tweak 참조(1곳) 업데이트 누락. 테스트 스크립트가 삭제된 스킬을 검증하면 테스트 실패하므로 반드시 수정 필요. |
| Step 4 | **보강** | scripts/context-compaction.js에서 "brainstorming 완료" 문자열(1곳)이 삭제된 스킬명을 포함. Step 6에서 brainstorming 삭제 전에 선제 변경 필요. |
| Step 6 | **보강** | commands 참조 업데이트 5곳 누락 발견: commands/feature.md의 brainstorming(1곳), commands/vibecraft.md의 brainstorming(1곳), commands/team.md의 brainstorming(1곳), commands/kickoff.md의 brainstorming(1곳). 모두 writing-plans로 변경 필요. |
| Step 7 | **보강** | external-reviewer 방안 B 채택 시 추가 업데이트 필요 대상 명시: lib/team/report-builder.js(1곳), team-orchestration SKILL.md(2곳), executing-plans SKILL.md(4곳). 방안 결정 후 grep 확인 검증 추가. |
| Step 8 | **보강** | hooks.json 변경 불필요를 명시. 스크립트 내부 로직만 변경하므로 hooks.json 설정은 그대로 유지. 의도하지 않은 hooks.json 변경 방지를 위해 `git diff` 검증 추가. |
| Step 9 | **보강** | 줄 수 예측을 구체적 수치로 명시: 208 + 63 - 27 = ~244줄. 실제 작업 후 wc -l 확인 의무 추가. |
| Step 10 | **수정** | 테스트 #6, #7의 "CLAUDE.md 규칙 적용"이 주관적 판단이라 검증 불가능. 구체적인 입력 프롬프트와 기대 응답 패턴으로 변경: #6은 "테스트 없이 코드만 짜줘" → 거부/우회 응답 확인, #7은 "일단 고쳐줘" → 분석 절차 시작 확인. |
| 신규 섹션 | **추가** | "Step 간 실행 순서 의존성" 섹션 추가. Step 2 → Step 4 순서가 필수인 이유(simple-tweak 삭제 → 패턴 변경), Step 5가 Step 1~4 이후인 이유(남는 스킬 확정 필요) 등을 도표로 명시. 순서 위반 시 발생하는 구체적 문제도 기술. |

## 변경 요약 (Round 1 + Round 2 통합)

| Step | 최종 판정 | 이유 (한 줄) |
|------|----------|-------------|
| 사전 준비 | R1 추가 | 대규모 삭제 작업에 롤백 경로가 없으면 복구 불가 |
| Step 1 | R1 보강 | agents/commands/scripts의 iron-law 참조(11곳) 업데이트 누락 |
| Step 2 | R1+R2 보강 | CLAUDE.md 줄 수 현실성 검증 + test-trigger.js simple-tweak 참조 누락 |
| Step 3 | R1 보강 | system-reminder 전제가 미확인(E0) — 검증 방법과 대안 필요 |
| Step 4 | R1+R2 보강 | simple-tweak 패턴 + context-compaction.js brainstorming 문자열 선제 변경 |
| Step 5 | R1 보강 | naver-diagnosis 리라이팅 + 트리거 패턴 누락 |
| Step 6 | R1+R2 보강 | commands 5곳 brainstorming 참조 업데이트 추가 (vibecraft/feature/team/kickoff 명령어) |
| Step 7 | R1+R2 보강 | 방안 B 시 추가 업데이트 대상(7곳) 명시 + grep 검증 |
| Step 8 | R1+R2 수정+보강 | skill-post.js 수정 유지 + hooks.json 변경 불필요 명시 |
| Step 9 | R1+R2 보강 | CLAUDE.md 줄 수 예측(~244줄) + wc -l 확인 의무 |
| Step 10 | R1+R2 보강 | 테스트 #6/#7 검증 방법 구체화 + 12개 시나리오 + 체인 완주 테스트 |
| 실행 순서 | R2 추가 | Step 간 의존성 도표 + 순서 위반 시 문제 명시 |
| 위험 요소 | R1 추가 | 5가지 위험 + 대응책 |
