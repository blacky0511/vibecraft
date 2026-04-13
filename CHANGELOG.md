# CHANGELOG

모든 주요 변경사항은 이 파일에 기록된다. [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따른다.

## [2.2.0] — 2026-04-13

### 하네스 엔지니어링 v2: CTO 3인 리뷰 반영

v2.1.0에서 적용한 하네스 엔지니어링을 3인 CTO(하네스 아키텍트 / 프로덕션 신뢰성 / DX) 관점으로 교차 검토한 뒤, 발견된 **Blocker 4개 + High 7개 + Medium 4개**를 모두 수정.

#### 추가 (Added)
- **`scripts/context-restore.js`** — PostCompact 훅 신규. compact 이후 진행 중인 RPDCA 상태 + 활성 feature의 plan.md 헤더 + session.md 요약을 자동 주입해 설계 결정 망각 방지
- **`agents/backend-evaluator.md`** — backend-builder 자기 평가 편향 해결을 위한 검증 전용 에이전트. Read + Bash만 허용 (curl/psql/mysql/redis-cli). Grep/Glob/Edit/Write 없어서 **코드를 볼 수 없음**. 오직 API/DB 동작만으로 검증
- **`CHANGELOG.md`** — 버전별 변경사항 공식 기록 (본 파일)
- **`scripts/session-start.js` v2.2.0 업데이트 블록** — 신규 버전 최초 감지 시 1회성 하네스 개선 사항 안내 (`~/.vibecraft-seen-version`으로 추적)

#### 수정 (Fixed)
- **🔴 Blocker: `evidence-stop-guard.js` 거짓 양성** — `.md/.json/.css/.html` 등 비코드 파일 수정에도 block이 발동하던 문제 해결. `CODE_EXTENSIONS` 화이트리스트 도입. CLAUDE.md Iron Law의 "TDD 면제 예외"(UI/CSS/설정/문서/프로토타입) 준수
- **🔴 Blocker: `evidence-stop-guard.js` LLM 위조 취약성** — 텍스트만 "PASS"라 써도 통과되던 문제. `\bPASS(?:ED)?\b` 워드 바운더리로 "PASSWORD" 오판 방지 + 실제 Bash `tool_use` 레코드 존재를 추가 증거로 검사
- **🔴 Blocker: `rpdca-state.json` 경합 조건 + 이력 유실** — 두 훅이 동시 write 시 부분 쓰기로 손상 → 빈 state 반환 → 기존 feature 전부 덮어쓰기 위험. 임시 파일 + rename 원자적 쓰기, `.bak` 자동 백업, Windows 파일 잠금 대응 재시도(3회)
- **🔴 Blocker: `user-prompt-handler.js` task-notification 오탐** — 백그라운드 에이전트 완료 알림의 `<task-notification>` 내용을 사용자 입력으로 파싱해 "디버깅" 스킬을 반복 제안하던 문제. 10가지 시스템 메시지 패턴 감지 후 조용히 스킵
- **🟡 High: `tool-failure-handler.js` 한국어 Windows 패턴** — "지정된 파일을 찾을 수 없습니다", "액세스가 거부되었습니다" 등 Windows 한국어 cmd 에러 메시지 패턴 추가
- **🟡 High: `subagent-output-check.js` 시크릿 거짓 양성** — `YOUR_API_KEY_HERE`, `EXAMPLE_TOKEN` 같은 placeholder/sample 값은 매칭 제외. Shannon 엔트로피 임계값(≥3.5)으로 실제 시크릿만 감지
- **🟡 High: `subagent-output-check.js` non-repo 디렉토리** — `git rev-parse --is-inside-work-tree` 사전 체크로 git 저장소 아닌 곳에서 execSync 비용 낭비 방지
- **🟡 High: `evidence-stop-guard.js` 대용량 transcript 메모리 폭발** — 5MB 초과 transcript는 조기 종료로 OOM 방지
- **🟡 High: ui-evaluator Playwright MCP 설치 가이드 부재** — skip 메시지에 복붙 가능한 JSON 스니펫 + `claude mcp add` 명령어 내장
- **🟡 High: `/vibecraft` 도움말이 v2.1.0+ 신규 기능 미언급** — 하네스 6가지 자동 가드 섹션 추가
- **🟡 High: session-start에 버전 업데이트 체감 0** — 1회성 `🆕 v2.2.0` 알림 블록 신설

#### 개선 (Improved)
- **evidence-stop-guard 평문 메시지** — "[Iron Law 위반]" 내부 용어 제거, "[완료 전 확인 필요]" + 구체 명령어 예시 + 거짓 양성 안내로 변경
- **tests 확장** — evidence-stop-guard(3→15), rpdca-state(6→16), user-prompt-handler(5→10), 총 41개 시나리오 커버

### 하위 호환성
기존 v2.1.0에서 작성된 `docs/plans/rpdca-state.json`은 그대로 읽힌다. 포맷 변경 없음.

---

## [2.1.0] — 2026-04-13

### 하네스 엔지니어링 v1: Tier 1+2 적용

Anthropic 블로그 "Effective Harnesses for Long-Running Agents"와 Martin Fowler의 harness engineering 프레임워크에 기반해 vibecraft를 "AI가 같은 모델로 더 좋은 결과를 내는 환경"으로 개편.

#### 추가 (Added)
- **`scripts/evidence-stop-guard.js`** — Stop 훅 신규. 코드 수정 후 검증 증거 없이 응답 종료 시 자동 차단 (Iron Law 결정론적 강제)
- **`scripts/tool-failure-handler.js`** — PostToolUseFailure 훅 신규. ENOENT/EACCES/ECONNREFUSED 등 7개 에러 패턴을 진단 힌트로 변환
- **`scripts/rpdca-state.js`** — 다중 feature 동시 진행 지원 상태 JSON 유틸리티
- **`scripts/subagent-output-check.js`** — SubagentStop 훅 신규. 코드 작성 에이전트 완료 시 시크릿/TODO/디버그 로그 스캔
- **`agents/ui-evaluator.md`** — Generator/Evaluator 분리용 UI 검증 전용 에이전트. Playwright MCP만 허용하고 `Write/Edit/Grep/Glob` 없어서 코드를 볼 수 없음
- **`docs/rules/`** — 코드 품질/프론트엔드/Git/커밋 규칙 외부화 (점진적 공개 패턴 기반)
- **`tests/test-*.js`** — user-prompt-handler, evidence-stop-guard, rpdca-state 단위 테스트

#### 수정 (Fixed)
- **user-prompt-handler.js Windows stdin 비호환** — `/dev/stdin` → `fs.readFileSync(0)`로 변경. UserPromptSubmit 훅이 Windows에서 조용히 실패하던 사전 존재 버그 수정
- **user-prompt-handler.js debugging 항목 english 필드 중복** — 동일 키가 2번 정의되어 첫 번째가 덮어쓰던 코드 품질 문제 정리

#### 개선 (Improved)
- **에이전트 14개 전체에 `tools` 화이트리스트 + `maxTurns` 명시** — 읽기 전용 에이전트가 실수로 파일 수정하는 것을 구조적으로 차단
- **CLAUDE.md 외부 규칙 참조로 슬림화** — 코드 품질 체크리스트 섹션을 `docs/rules/code-quality-checklist.md` 포인터로 대체

---

## [2.0.12] — 이전

플러그인 초기 버전. 17개 스킬, 14개 에이전트, 13개 훅 스크립트. 자세한 이력은 git log 참조.
