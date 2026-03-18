# RPDCA 개편 코드베이스 리서치

**작성일**: 2026-03-18
**리서치 범위**: vibecraft 전체 — skills/, agents/, templates/, CLAUDE.md, plugin.json

---

## 1. 목표
PDCA 워크플로우를 RPDCA(Research-Plan-Do-Check-Act)로 개편하고, 계획서 자동 리뷰 시스템(plan-critic)을 추가한다.

## 2. 관련 파일

### 직접 수정 대상

| 파일 경로 | 역할 | 변경 내용 |
|----------|------|----------|
| `skills/smart-pdca/SKILL.md` | 작업 크기별 워크플로우 제어 | PDCA → RPDCA 전면 재설계, M 크기에 R+P(MD) 추가 |
| `skills/brainstorming/SKILL.md` | 아이디어 → 설계 | 1단계 리서치 부분 제거 (research 스킬로 이관) |
| `skills/writing-plans/SKILL.md` | 설계 → 구현 계획 | plan-critic 연동, M 크기에도 MD 계획 + 주석 리뷰 |
| `skills/executing-plans/SKILL.md` | 계획 실행 | "승인 검증" 부분에서 plan-critic 리뷰 완료 여부 확인 추가 |
| `CLAUDE.md` | 프로젝트 규칙 | PDCA 용어 → RPDCA, 새 스킬/에이전트 디렉토리 구조 반영 |
| `.claude-plugin/plugin.json` | 플러그인 메타데이터 | description 문구에서 PDCA → RPDCA, 버전 bump |
| `templates/plan.md` | 계획서 템플릿 | PDCA → RPDCA 용어 변경 |

### 신규 생성 대상

| 파일 경로 | 역할 |
|----------|------|
| `skills/research/SKILL.md` | 독립 리서치 스킬 (코드베이스 깊이 읽기 → research.md) |
| `agents/plan-critic.md` | 계획서 악마의 변호인 에이전트 (Codex MCP + Claude 서브에이전트) |

### PDCA 언급하는 파일 (용어 변경 필요: 26개)

주요 파일:
- `skills/auto-detect/SKILL.md` — 모드 감지 로직에서 PDCA 참조
- `skills/new-feature/SKILL.md` — 새 기능 오케스트레이션 흐름
- `skills/iron-law/SKILL.md` — 철칙에서 PDCA 단계 참조
- `skills/error-simulation/SKILL.md` — Do→Check 사이 참조
- `commands/pdca.md` — /pdca 명령어
- `commands/vibecraft.md` — 도움말
- `output-styles/learning.md` — 학습 모드
- `templates/design.md`, `templates/check-report.md` — PDCA 단계 참조
- `agents/gap-detector.md`, `agents/doc-writer.md` — PDCA 참조
- `README.md`, `marketplace.json` — 외부 노출 문구

## 3. 기존 패턴

### 워크플로우 흐름 (현재)
```
auto-detect → smart-pdca(크기 판별)
  ├── S: 바로 실행 → verification
  ├── M: 간략 계획(채팅) → 실행 → verification
  └── L: brainstorming(리서치 포함) → writing-plans → executing-plans → verification
```

### 리서치 패턴 (현재 — brainstorming 1단계)
- M/L만 해당, S는 채팅 요약
- 파일명: `docs/plans/YYYY-MM-DD-{기능명}-research.md`
- 7개 섹션: 목표, 관련 파일, 기존 패턴, 영향 범위, 열린 질문, 계획 입력값, 핵심 개념

### 계획서 패턴 (현재 — writing-plans)
- L만 MD 파일 생성, M은 채팅 3~5줄
- 파일명: `docs/plans/YYYY-MM-DD-{기능명}.md`
- Step 구조: TDD 순서 (테스트 → 실패 확인 → 구현 → 통과 → 커밋)
- 주석 리뷰 사이클 있음 (사용자가 직접 메모)

### 에이전트 패턴 (현재)
- Markdown frontmatter: name, description, tools, model 등
- 12개 에이전트가 `agents/` 폴더에 존재
- plan-critic은 기존에 없음

### MCP 패턴 (현재)
- vibecraft에 `.mcp.json` 없음
- bkit에도 MCP 없음 (확인 완료)

## 4. 영향 범위

### 직접 영향 (수정 필수)
- `smart-pdca` — 전체 재설계 (핵심)
- `brainstorming` — 리서치 부분 분리
- `writing-plans` — plan-critic 연동

### 간접 영향 (용어만 변경)
- PDCA라는 단어가 들어간 26개 파일에서 RPDCA로 치환
- 단, 스킬 로직에는 영향 없음 (문자열 교체 수준)

### 영향 없음
- `lib/team/` — 팀 엔진은 PDCA 용어를 사용하지 않음
- `hooks/`, `scripts/` — 훅 시스템은 워크플로우 독립적
- 프리셋 스킬 5개 — PDCA 미참조

## 5. 열린 질문

- [결정 완료] 리서치를 독립 스킬로 만든다 — 사용자 확정
- [결정 완료] plan-critic은 Codex MCP + Claude 서브에이전트 3회 — 사용자 확정
- [결정 대기] Codex MCP 설정을 `.mcp.json`에 넣을지, 사용자 settings에 넣을지
- [결정 대기] `commands/pdca.md`를 `commands/rpdca.md`로 이름도 바꿀지, 내용만 바꿀지
- [결정 대기] plan-critic의 revision 파일을 `docs/plans/revisions/`에 넣을지, `docs/plans/`에 flat하게 넣을지

## 6. 계획 입력값

- 기술 스택: Claude Code Plugin (Markdown 스킬, Markdown 에이전트, Node.js 스크립트)
- 재사용: brainstorming의 리서치 섹션 코드를 그대로 research 스킬로 이동
- 재사용: writing-plans의 주석 리뷰 사이클 구조를 plan-critic 연동 구조로 확장
- 제약: 기존 스킬의 트리거 키워드가 깨지면 안 됨
- 제약: 버전은 반드시 올려야 함 (1.7.1 → 1.8.0, 마이너 범프)

## 7. 핵심 개념

- **RPDCA**: Research(조사) → Plan(계획) → Do(실행) → Check(검증) → Act(개선). 기존 PDCA에 리서치 단계를 맨 앞에 추가한 것.
- **plan-critic**: 계획서를 다른 관점에서 공격하여 약점을 찾는 역할. "악마의 변호인"이라고도 함.
- **Codex MCP**: OpenAI의 Codex CLI를 MCP 서버로 띄워서, Claude Code에서 GPT 모델에게 질문을 보내고 답을 받을 수 있게 하는 연동 방식. `codex mcp-server` 명령으로 실행.
- **revision MD**: plan-critic이 계획서를 리뷰한 결과물. 원본 계획에서 뭘 바꿨고 왜 바꿨는지가 적힌 파일.

## 8. Codex MCP 기술 조사 결과

### 설치 및 실행
```bash
npm install -g @openai/codex
codex login          # ChatGPT OAuth 또는 API 키 인증
codex mcp-server     # MCP 서버로 실행 (stdio JSON-RPC)
```

### 노출 도구
| 도구 | 역할 | 주요 파라미터 |
|------|------|-------------|
| `codex()` | 새 대화 시작 | prompt(필수), model, approval-policy, sandbox |
| `codex-reply()` | 기존 대화 이어가기 | threadId, prompt |

### Claude Code에서 사용법
`.mcp.json` 또는 settings에 아래 설정 추가:
```json
{
  "mcpServers": {
    "codex": {
      "command": "codex",
      "args": ["mcp-server"]
    }
  }
}
```
인증은 `codex login`으로 사전 완료 필요 (키링에 저장됨).
