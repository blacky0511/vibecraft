# harness-engineering plan.md 리뷰 기록

## 개요
- 리뷰 날짜: 2026-04-13
- 리뷰어: plan-critic (opus, 1M context)
- 원본 Step 수: 32
- 최종 Step 수: 32 (Step 수 변경 없음 — 내용만 수정)
- 라운드: 완료 (3/3 + Guard Pass)

---

## 라운드 1: 치명적 검증 (누락 + 실현 가능성)

### 확인한 위험 요소 (E2/E1 근거 기반)

| # | 위험 | 실제 확인 결과 | 등급 | 조치 |
|---|------|--------------|------|------|
| 1 | `tools` vs `allowedTools` 키 이름 | 공식 문서(Create custom subagents) 표에서 `tools`가 표준 키로 확정. `allowedTools`는 존재하지 않음. plan-critic이 `tools: - Read ...` YAML 리스트 형식으로 실제 동작 중(본 리뷰 자체가 그 증거) | 무시 | 플랜 현 상태 유지. Step 14~16 그대로 진행. |
| 2 | Stop 훅 transcript JSONL 포맷 | 공식 Stop input 스키마에서 `transcript_path`가 `.jsonl`로 명시. 실제 vibecraft 세션 JSONL 레코드도 `{type:"assistant", message:{content:[{type:"tool_use", name:"Edit"}, ...]}}` 구조 확인 | 필수 | Step 9의 파싱을 `content.some(...)`로 교체 + `last_assistant_message` 필드 우선 사용 + 파일디스크립터 0 stdin 호환 수정 반영 |
| 3 | ui-evaluator Playwright MCP 의존성 | 플러그인 서브에이전트의 `mcpServers` 필드는 보안상 무시(Issue #13605). 사용자 프로젝트 `.mcp.json`에 Playwright MCP가 있어야 `mcp__playwright__*` 도구 상속 가능 | 필수 | Step 27에 "Playwright MCP 사전 감지 fallback" 절차 추가. 미설치 시 ui-evaluator 호출 스킵 + 사용자 안내 + verification 리포트에 스킵 기록 |
| 4 | PostToolUse matcher 범위 + 실패 감지 | **치명적 발견**: 공식 문서상 `PostToolUse`는 "runs immediately after a tool completes **successfully**"이므로 실패 시 발동하지 않음. 대신 `PostToolUseFailure`가 정식 이벤트로 존재(공식 예시 포함). 초안은 "별도 이벤트 없음"으로 잘못 가정하여 원천 동작 불가 상태였음. | 필수 | Step 18~19를 `PostToolUseFailure` 기반으로 전면 재작성: 최상위 `error` 필드 사용, `hookSpecificOutput.additionalContext` 반환, matcher 범위는 `Bash\|Edit\|Write`로 축소(성공 호출에 붙지 않으므로 부담 자동 해소). hooks.json은 새 이벤트 블록으로 등록 |
| 5 | CLAUDE.md 분리 대상 | 프로젝트 `C:\Users\앤기브마케팅\workspace\vibecraft\CLAUDE.md` 전체 Read 결과: 프론트엔드 UI 워크플로, Git 브랜치 전략, 커밋 메시지 가이드 섹션은 **없음**. 해당 섹션들은 전역 `~/.claude/CLAUDE.md`에만 존재. 분리 가능한 섹션은 "코드 품질 체크리스트" 단 하나 | 필수 | Step 1~2를 "전역 규칙의 프로젝트 로컬 참조본 생성"으로 재프레이밍. Step 3를 "코드 품질 체크리스트 → 포인터"로 한정. 토큰 절감 기대치를 현실화(500~700자 감소) |
| 6 | Stop 훅 증거 키워드 | 튜닝 대상이지만 첫 배포에는 허용. 설정 외부화는 YAGNI | 참고 | Step 변경 없음. "위험 요소 및 확인 결과" 섹션에 튜닝 항목으로 이동 |
| 7 (추가 발견) | SubagentStop 입력 필드 이름 | 공식 스키마에서 에이전트 이름 필드는 **`agent_type`** 하나뿐. `subagent_name` / `agent_name`은 존재하지 않으므로 Step 24 스크립트가 항상 빈 문자열을 읽어 전체 미동작 상태였음 | 필수 | Step 24 스크립트를 `input.agent_type` 우선 + 구버전 호환 폴백 형태로 수정. stop_hook_active 무한 루프 방지 추가. 동작 확인 echo 입력도 `{"agent_type":"frontend-builder"}`로 정정 |
| 8 (추가 발견) | Stop 훅 다중 훅 실행 순서 | 공식 문서: "All matching hooks run in parallel" — 배열 순서는 실행 순서를 보장하지 않음. 두 훅의 stdout은 각각 독립 처리 | 필수 | Step 10 설명에서 "unified-stop 앞에 배치" 순서 의존 표현 제거. 병렬 실행을 명시 |
| 9 (추가 발견) | unified-stop.js의 RPDCA 추정 로직 일관성 | Step 22가 user-prompt-handler / context-compaction만 rpdca-state.js로 전환하고 unified-stop.js는 폴더 스캔을 유지. 일관성 떨어지지만 동작에는 문제 없음 | 참고 | 본 L 작업 범위를 넘는다고 판단. "남아 있는 튜닝 항목"으로 기록 |

### plan.md 직접 반영 내역

| Step | 변경 유형 | 내용 요약 |
|------|----------|-----------|
| Step 1 | 제목/전제 수정 | "프론트엔드 워크플로 분리" → "전역 규칙의 프로젝트 로컬 참조본 생성". E2 확인 결과(프로젝트 CLAUDE.md에 해당 섹션 없음) 명시 |
| Step 2 | 제목/목적 수정 | "분리" → "참조본 생성". code-quality-checklist.md만 Step 3에서 실제 분리 |
| Step 3 | 전제/목표치 수정 | 실제 분리 대상은 "코드 품질 체크리스트" 하나뿐 / 현실 목표치는 500~700자 감소. 토큰 절감이 Tier 1 주효과가 아님을 명시 |
| Step 9 | 스크립트 전면 개선 | `content.some(...)` 순회로 정확도 향상, `last_assistant_message` 필드 우선 사용, `fs.readFileSync(0)` 기반 Windows 호환 stdin, 공식 스키마 주석 추가 |
| Step 10 | 설명 정정 | "unified-stop 앞에 배치" 순서 의존 표현 제거. 병렬 실행 명시 + 공식 출처 인용 |
| Step 18 | 스크립트 전면 교체 | PostToolUseFailure 전용 스크립트로 재작성. 공식 입력 스키마(`error`, `is_interrupt`) 사용, `hookSpecificOutput.additionalContext` 반환 |
| Step 19 | hooks.json 구조 변경 | PostToolUse에 matcher 추가가 아니라 **새 `PostToolUseFailure` 이벤트 블록**을 등록. matcher는 `Bash\|Edit\|Write`로 축소. 커밋 메시지도 PostToolUseFailure 기반으로 수정 |
| Step 24 | 스크립트 수정 | `input.agent_type` 필드로 에이전트 이름 읽기. stop_hook_active 무한 루프 방지 추가. 공식 입력 스키마 주석. echo 동작 확인 입력 정정 |
| Step 27 | 절차 확장 | "Playwright MCP 사전 감지 (필수 Fallback)" 섹션 추가. 미설치 시 조용히 스킵 + 사용자 안내. 호출 절차에 감지 스텝을 2번으로 삽입 |
| 위험 요소 섹션 | 전면 재작성 | Round 1으로 해소된 6개 항목 + 추가 발견 3개 정리. 튜닝 항목과 분리 |

### 유지된 초안 (의도적 보존)
- 32 Step 구조, TDD 순서(Step 5→6, 8→9, 20→21), 커밋 분할 원칙
- Step 13~16 에이전트 frontmatter 매핑표 전체(Round 1 검증 결과 유효)
- 영향 파일 목록 전체
- Tier 1/Tier 2/마무리 3단 구조

---

## 라운드 2: Inversion — 실패 시뮬레이션 (SRE 관점)

### 찾아낸 실패 경로

| # | 실패 경로 | 시나리오 | 등급 | 조치 |
|---|----------|---------|------|------|
| A | evidence-stop-guard가 설명만 요청한 턴도 차단 | transcript 최근 100줄에 이전 턴 Edit이 남아있으면 "설명만 해줘" 응답도 block 발동 → 심각한 UX 회귀 | 필수 | Step 9 스크립트: 역순으로 마지막 user 메시지를 찾아 그 이후 레코드만 검사하도록 교체. afterUser 배열 + 200줄 상한 |
| B | transcript_path의 `~` 경로 expand 누락 | 공식 예시가 `~/.claude/projects/...`이고 Node의 fs.existsSync는 `~`를 확장하지 않음 → 항상 false로 빠져 증거 검증 자체가 한 번도 동작하지 않음 | 필수 | Step 9 스크립트: `expandHome` 헬퍼 추가 + `os`, `path` require |
| C | rpdca-state.js의 `path.resolve('docs/plans/...')`가 cwd 의존 | 훅 실행 시 cwd가 프로젝트 루트가 아닐 수 있음 | 참고 | Step 21~22 유지. 훅 입력 `cwd`를 활용하는 개선은 후속 마이너 작업으로 분리(현재 Plan 규모 밖) |
| D | rpdca-state.json이 영원히 비어있음 — 쓰기 주체 부재 | 초안은 읽기 경로만 전환, upsertFeature/setActive를 아무도 호출하지 않음. 결과적으로 JSON 도입 목적(Gap E) 미달성 | 필수 | Step 22에 rpdca-task-completed.js 수정을 "작업 1-추가"로 포함. Step 23 커밋 메시지도 갱신 |
| E | 에이전트 tools 화이트리스트가 기존 암묵 사용 도구를 차단 | tools 필드 미설정 시 모든 도구 상속이 기본값. 화이트리스트 추가는 기존 관행을 깨뜨림 | 필수 | Step 13 사전 확인에 "각 에이전트 본문을 Read하여 실제 필요 도구 추출 → 매핑표 대조" 절차 명시. Step 29에 "대표 에이전트 2개 수동 호출로 회귀 검증" 작업 추가 |
| F | vibecraft.md 외 다른 파일의 구버전 숫자 | welcome-guide 등에 스킬 41개 같은 숫자가 남아 있을 수 있음 | 참고 | Step 12 범위 유지. 후속 문서 정리 작업으로 분리 |
| G | sync-version.js 자체 실패 | 기존 스크립트로 새 위험 아님 | 무시 | 조치 없음 |
| H | Step 5~7의 TDD Red 전제가 틀림 | english 중복은 실제로는 stackTrace 정규식이 가려주어 동작상 문제가 없음. "ENOENT/EACCES는 매칭 안 된다"는 전제가 실증 반례로 무너짐 → TDD Red가 나올 수 없음 | 필수 | Step 5~7을 "TDD 필수"에서 "코드 품질 정리 + 회귀 방지 테스트"로 재포지셔닝. 목적/사전 확인/통과 확인/커밋 메시지 모두 갱신. 효과를 과장하지 않음 |

### 유지된 초안 (과잉 수정 방지)
- Step 30~32 마무리 구조 (sync-version.js 동작은 기존 검증됨)
- 전체 체크리스트(Step 32 이후) — Step 이름 정정만 필요하면 라운드 3에서 확인
- research.md의 Gap 분류와 Tier 1/Tier 2 경계 (전체 구조는 Round 2에서 흔들지 않음)

### plan.md 직접 반영 내역 (라운드 2)

| Step | 변경 유형 | 내용 요약 |
|------|----------|-----------|
| Step 5 | 전제/목적 재프레이밍 | "TDD 필수"→"TDD 면제 회귀 방지 테스트". 사전 확인에 stackTrace로 인한 우회 사실 명시. "실패 확인" 섹션을 "기대 결과: 처음부터 5/5 통과"로 교체 |
| Step 6 | 전제/목적 재프레이밍 | "버그 수정"→"코드 품질 정리". 현재 동작은 정상이며 stackTrace 덕분에 기능 회귀 없음을 명시 |
| Step 7 | 커밋 메시지 갱신 | "수정"→"개선". 이유 본문을 "버그 수정"에서 "중복 제거 + 회귀 방지 보장"으로 교체 |
| Step 8 | 테스트 케이스 + 수동 검증 의무 추가 | transcript 빈값 케이스 추가. "추가 테스트 의무(배포 전 수동)" 섹션으로 설명만/Edit 후 증거 없음/Edit 후 증거 있음 3 시나리오 명시 |
| Step 9 | 스크립트 강화 | `os`, `path` require 추가. `expandHome` 헬퍼. 마지막 user 메시지 역순 검색 후 afterUser 배열만 검사. 200줄 상한. 공식 스키마 주석 보강 |
| Step 13 | 사전 확인 절차 확장 | 매핑표 확정 전 "각 에이전트 본문 Read → 실제 필요 도구 추출 → 대조" 절차 강제. "축소 리스크" 경고 박스 추가 |
| Step 22 | 작업 1-추가 신설 | rpdca-task-completed.js 본문 수정(upsertFeature + setActive 호출) 지시 추가. 목적 섹션도 "읽기 전환만으로는 JSON이 비어있다" 경고 포함 |
| Step 23 | 커밋 메시지 갱신 | `rpdca-task-completed.js` git add에 포함. 메시지 본문에 쓰기 주체 연결 이유 추가 |
| Step 29 | 작업 단위 확장 | 작업 1(테스트 재실행), 작업 2(hooks events: **10** + PostToolUseFailure 등록 확인), 작업 3(에이전트 도구 제한 회귀 검증: 샘플 호출 2건 + grep 14건) |


---

## 라운드 3: 외부 CTO 관점 + 실현 가능성 재검증

### 검토 관점별 결과

**1. YAGNI 체크 — 과도하게 도입된 것**
- **subagent-output-check.js (Step 24~25)**: 시크릿 감지/TODO 남발/console.log 감지가 이미 code-reviewer 에이전트와 pre-write-guard, commit-guard에 부분적으로 존재. 하나 더 추가하는 것은 하네스 확장 가치 대비 유지보수 부담이 큼. **의견: YAGNI 후보.** 단 초안이 research.md Gap D("미사용 훅 이벤트 활용 — SubagentStop")를 근거로 명시했고, 기존 훅들이 `subagent_type` 단위로 동작하지 않아 정확히 같은 기능은 없음 → **Guard Pass에서 유지 결정**.
- **cto-lead의 `Agent` tools**: 서브에이전트 정의 내부에서는 `Agent(agent_type)` 문법이 무효(공식 문서 명시). 다만 해롭지는 않음 → 유지.
- **evidence-stop-guard EVIDENCE_KEYWORDS**: 허술한 키워드 세트. "튜닝 대상"으로 이미 명시되어 있으므로 현 상태 허용.

**2. 실행자 혼란 가능성**
- Step 4 커밋 메시지가 "CLAUDE.md 점진적 공개 — 규칙을 docs/rules/로 분리"였으나 Round 1의 Step 1~2 재프레이밍과 불일치 → 커밋 메시지 수정
- 전체 체크리스트(Step 1~29)의 Step 이름이 초안 그대로라 Round 1/2의 수정과 불일치 → 체크리스트 Step 이름 업데이트

**3. 경로 E2 재검증 (실제 파일 존재 확인)**
- `skills/verification/SKILL.md` — 존재 확인
- `hooks/hooks.json` — 존재 + 스니펫 확인. Stop/PostToolUse/SubagentStop 구조가 plan의 "변경 전" 설명과 완전 일치
- `.claude-plugin/plugin.json` / `marketplace.json` — 존재 확인
- `commands/vibecraft.md` — 존재 확인
- `agents/*.md` — 14개 확인 (naver-logic-analyzer 포함)
- `scripts/rpdca-task-completed.js` — 존재 확인 + phase 감지 구조 재확인

**4. 의존성 순서 Dry Run**
- Step 5(테스트) → Step 6(정리) → Step 7(커밋): 순서 OK (TDD Red 전제는 제거됨)
- Step 20(테스트) → Step 21(구현) → Step 22(연결) → Step 23(커밋): 순서 OK. Step 22의 rpdca-task-completed 수정이 Step 21의 upsertFeature 함수 존재에 의존 — 순서 보장됨
- Step 13(매핑표 + 실제 필요 도구 검증) → Step 14~16(적용): 순서 OK
- Step 18(스크립트) → Step 19(hooks.json 등록): 순서 OK
- Step 26(ui-evaluator 파일) → Step 27(verification 스킬 호출 절차): 순서 OK

### plan.md 직접 반영 내역 (라운드 3)

| Step | 변경 유형 | 내용 요약 |
|------|----------|-----------|
| Step 4 | 커밋 메시지 재작성 | 본문에서 "분리"→"외부화", "프론트엔드 로컬 참조본 생성"을 정확히 반영. 이유 섹션에 코드 품질 체크리스트만 실제 분리 대상임을 명시 |
| 전체 체크리스트 | Step 이름 정정 | Tier 1/Tier 2 항목 이름을 Round 1~2의 수정 내용과 정확히 일치하도록 갱신 (12개 Step 이름 수정) |

---

## Guard Pass: 과잉 수정 점검

### 검토 범위
- critic 라운드에서 새로 추가된 Step: **0개** (Step 수 32 유지)
- 기존 Step 삭제: **0개**
- Step 내부 텍스트/코드 수정만 수행
- 초안 핵심 구조(Tier 1/Tier 2/마무리 3단, 32 Step, TDD 순서, 커밋 분할) 모두 보존

### 복원 검토 (초안→수정본에서 삭제된 내용)

| 항목 | 삭제 근거 | 판정 |
|------|----------|------|
| Step 5~7 "TDD 필수" 문구 | 라운드 2에서 "stackTrace가 english 덮어쓰기를 가려준다"는 실증 반례로 Red 전제 무너짐 | **유지** (실증 근거로 삭제가 정당) |
| 초안 Step 1 "분리" 표현 | 라운드 1에서 "프로젝트 CLAUDE.md에 해당 섹션 없음" E2 확인 | **유지** (현실과 일치) |
| 초안 Step 19 "PostToolUse matcher Bash\|Edit\|...\|Glob" 설계 | 라운드 1에서 "PostToolUse는 성공 시에만 발동"이라는 공식 문서 확인 | **유지** (삭제하지 않으면 원천 미동작) |
| 초안 Step 24 `subagent_name`/`agent_name` 필드 | 라운드 1에서 공식 필드는 `agent_type` 하나뿐임 확인 | **유지** (폴백으로는 남겨둠 — 안전) |

### YAGNI 재검증 (critic이 새로 추가한 내용)

| Step | 추가 항목 | YAGNI 판정 |
|------|----------|-----------|
| Step 9 | `expandHome` 헬퍼 / `afterUser` 배열 검색 / 200줄 상한 | **필수 유지** — 없으면 훅이 원천적으로 동작 안 하거나 오탐 심각 |
| Step 13 | "각 에이전트 본문 Read 후 실제 필요 도구 검증" 절차 | **필수 유지** — 없으면 화이트리스트가 기존 암묵적 사용 도구를 차단해 회귀 유발 |
| Step 22 | rpdca-task-completed.js 쓰기 주체 연결 | **필수 유지** — 없으면 JSON이 영원히 비어있어 Gap E 해결 목적 미달성 |
| Step 27 | Playwright MCP 사전 감지 fallback 섹션 | **필수 유지** — 없으면 MCP 미설치 환경에서 verification 전체가 멈춤 |
| Step 29 | hooks events: **10** 기대 + 에이전트 도구 제한 샘플 검증 | **필수 유지** — Step 19/Step 13 변경과 정합성 유지 |

### Guard Pass 결론
critic 수정은 **모두 요구사항 충족 또는 실행 가능성 확보에 필수**로 판정. 과잉 수정 없음. 새 Step 추가 없음. 초안 핵심 구조 완전 보존.

---

## 최종 변경 요약 (사용자 확인용)

### 라운드 1 — 치명적 검증 (공식 문서 E2 기반)
- **PostToolUseFailure 정식 이벤트 발견** → Step 18~19 전면 재작성 (초안은 원천 미동작 설계였음)
- **SubagentStop 입력 필드는 `agent_type`** → Step 24 수정
- **Stop 훅 입력에 `last_assistant_message` 공식 필드** → Step 9 스크립트 단순화 + 정확도 향상
- **프로젝트 CLAUDE.md에 프론트엔드/Git/커밋 섹션 없음 E2 확인** → Step 1~3 재프레이밍
- **ui-evaluator Playwright MCP 의존성** → Step 27 fallback 절차 추가
- **Stop 훅 병렬 실행** → Step 10 순서 의존 문구 제거

### 라운드 2 — 실패 시뮬레이션 (SRE 관점)
- **설명만 하는 턴 오차단 위험** → Step 9에 "마지막 user 메시지 이후만 검사" 로직
- **`~` 경로 expand 누락** → Step 9에 `expandHome` 헬퍼
- **rpdca-state.json 쓰기 주체 부재** → Step 22에 rpdca-task-completed 연결
- **tools 화이트리스트가 암묵적 사용 도구 차단 위험** → Step 13 사전 검증 + Step 29 회귀 샘플
- **Step 5~7 TDD Red 전제 붕괴** → 회귀 방지 테스트로 재포지셔닝

### 라운드 3 — 외부 CTO + 실행자 혼란 점검
- **Step 4 커밋 메시지 정정** (라운드 1 재프레이밍과 정합)
- **전체 체크리스트 Step 이름 갱신** (12개 항목)

### Step별 최종 판정

| Step | 원본 | 최종 판정 | 주요 변경 사유 |
|------|------|----------|---------------|
| 1 | docs/rules + frontend-workflow.md 분리 | **재프레이밍** | 프로젝트 CLAUDE.md에 해당 섹션 없음 |
| 2 | Git/코드품질/커밋 분리 | **재프레이밍** | 위와 같은 이유 |
| 3 | CLAUDE.md 분리 + 포인터 | **현실화** | 실제 분리 대상은 코드 품질 체크리스트 하나 |
| 4 | Tier 1 커밋 | **메시지 정정** | 재프레이밍 반영 |
| 5 | TDD 테스트 작성 | **TDD 면제 회귀 방지 테스트로 재포지셔닝** | stackTrace가 english 덮어쓰기를 가려줌 |
| 6 | english 중복 수정 | **코드 품질 정리로 재프레이밍** | 버그 아님 |
| 7 | 커밋 | **메시지 정정** | 수정→개선 |
| 8 | evidence-guard 테스트 | **테스트 케이스 확장 + 수동 검증 의무 추가** | 3 시나리오 |
| 9 | evidence-stop-guard.js | **스크립트 대폭 강화** | os/path require, expandHome, user 턴 이후 검색, last_assistant_message 우선 |
| 10 | hooks.json Stop 등록 | **순서 의존 표현 제거** | 병렬 실행 |
| 11 | Stop 훅 커밋 | 유지 | — |
| 12 | vibecraft.md 갱신 | 유지 | — |
| 13 | 에이전트 매핑표 확정 | **사전 검증 절차 강화** | 각 에이전트 본문 읽고 실제 필요 도구 대조 |
| 14~17 | 에이전트 frontmatter 수정/커밋 | 유지 | — |
| 18 | tool-failure-handler.js | **PostToolUseFailure 전용으로 재작성** | 공식 이벤트 사용 |
| 19 | hooks.json 확장 | **PostToolUseFailure 신규 이벤트 등록** | matcher는 Bash\|Edit\|Write로 축소 |
| 20 | rpdca-state 테스트 | 유지 | — |
| 21 | rpdca-state.js | 유지 | — |
| 22 | user-prompt-handler/context-compaction 전환 | **쓰기 주체 연결 추가** | rpdca-task-completed.js에 upsertFeature 호출 |
| 23 | RPDCA JSON 커밋 | **메시지 갱신** | task-completed 포함 |
| 24 | subagent-output-check.js | **`agent_type` 필드 사용으로 수정** | 공식 스키마 |
| 25 | SubagentStop 확장 커밋 | 유지 | — |
| 26 | ui-evaluator.md 신설 | 유지 | — |
| 27 | verification 스킬 업데이트 | **Playwright MCP 사전 감지 fallback 추가** | 미설치 환경 방어 |
| 28 | ui-evaluator 커밋 | 유지 | — |
| 29 | 전체 테스트 회귀 | **작업 3개로 확장** | hooks events: 10 + 에이전트 샘플 검증 |
| 30 | plugin.json 버전 | 유지 | — |
| 31 | sync-version + 커밋 | 유지 | — |
| 32 | 최종 동작 확인 | 유지 | — |

### 보존한 초안 구조 (Guard Pass 결과)
- 32 Step 구조 및 순서
- Tier 1 / Tier 2 / 마무리 3단 분리
- TDD 적용 대상/면제 대상 판정 (다만 Step 5~7는 재포지셔닝)
- 커밋 분할 원칙(논리 단위별 1커밋)
- 영향 파일 목록 (신규 11개, 수정 22개)
- Step 13 에이전트 매핑표 기본값
- research.md Gap A~I → Tier 1/Tier 2 매핑

### 남은 사용자 확인 포인트 (plan 실행 전 최종 점검)
1. **Step 3 효과 재설정**: 토큰 절감 500~700자는 초안의 "14,000자→6,500자" 기대치와 많이 다르다. 이 현실적 범위에 동의하는지 확인
2. **Step 5~7 재포지셔닝**: "버그 수정"이 아닌 "코드 품질 정리"로 바뀐 것에 동의하는지
3. **Step 13 사전 검증**: 14개 에이전트 본문을 일일이 Read하는 작업 부담이 크다. 일괄 처리 방식(grep + 매핑표 재작성)을 허용할지
4. **Step 24 subagent-output-check**: YAGNI 후보로 지적됐으나 유지됨. 배포 후 노이즈가 많으면 stdout 출력을 줄이거나 비활성화할 수 있는 설정 플래그를 후속 작업으로 추가할지

