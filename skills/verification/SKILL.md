---
name: verification
description: |
  코드 작성/수정 작업이 완료된 후 반드시 이 스킬을 호출하라.
  "완료", "다 됐다", "끝" 등의 표현 전에 이 스킬로 검증 증거를 확인해야 한다.
  이 스킬 없이 완료를 선언하면 검증되지 않은 코드가 배포될 위험이 있다.
  Triggers: 검증, 완료, 끝, verify, done, 확인해줘, 체크해줘
---

# 완료 전 검증

## 핵심 요약

1. **테스트 통과**: 관련 테스트 모두 통과 + 실행 결과 캡처
2. **동작 확인**: 변경 전후 비교, 기존 기능 깨짐 없음
3. **코드 품질**: console.log 잔류 없음, 하드코딩 없음
4. **보안 확인**: 비밀값 하드코딩 없음, 입력 검증, SQL 인젝션/XSS 없음, 에러 정보 노출 없음
5. **달성률** (M·L만): gap-detector로 plan 대비 Match Rate 90% 이상
6. **실패 시**: Check-Act 자동 루프 → 수정 → 재검증 → 통과 후 완료 선언

---

## 역할
모든 작업이 끝나기 전에 아래 체크리스트를 강제 실행한다.

## 크기별 검증 방식

### 새 기능 모드

| 크기 | 검증 방식 |
|------|---------|
| S | 아래 체크리스트 직접 확인 |
| M | **gap-detector** → Match Rate 계산 → 90% 미만 시 자동 수정 루프 |
| L | **gap-detector** → Match Rate 계산 → 90% 미만 시 자동 수정 루프 |

### 디버깅 모드

| 크기 | 검증 방식 |
|------|---------|
| S | 아래 체크리스트 직접 확인 |
| M | 체크리스트 + **영향 분석 대조** (Phase 1.5 결과와 6단계 결과 비교) |
| L | 체크리스트 + **영향 분석 대조** + 오류 시뮬레이션 |

> 디버깅에서는 gap-detector를 사용하지 않는다. 디버깅의 mini fix-plan은 항목이 적어(보통 2~5개) gap-detector보다 6단계(최종 확인)의 영향 분석 대조가 더 적합하다.

---

## M/L 작업: 오류 시뮬레이션

M/L 크기 작업의 검증 시 추가 단계:
- 수정된 코드에서 엣지 케이스 시나리오를 상상한다
- null/undefined 입력, 빈 배열, 네트워크 타임아웃 등
- M: 1~2개 시나리오 확인 / L: 최대 3개 시나리오 확인

---

## 백엔드/API 관련 작업 자동 검증 (backend-evaluator)

수정된 파일 목록에 아래 경로/확장자가 포함되면 `backend-evaluator` 서브에이전트를 자동 호출한다:

- `**/controllers/*`, `**/routes/*`, `**/api/*`, `**/handlers/*`
- `**/models/*`, `**/entities/*`, `**/schemas/*` (DB 스키마 변경)
- `*.java` (Spring Boot), `*.py` (FastAPI/Django), `*.ts`/`*.js` (Express/Fastify)

backend-evaluator는 **Read + Bash(curl/psql/mysql/redis-cli)만 사용**하고 `Write/Edit/Grep/Glob`이 없어 코드를 볼 수 없는 검증 전용 에이전트다 (Generator/Evaluator 분리의 백엔드 버전).

### 호출 절차

1. 수정 파일 목록에서 위 경로/확장자가 1개 이상이면 백엔드 검증 대상으로 분류
2. 로컬 서버 가용성 확인 (`curl` 헬스체크) — 없으면 사용자에게 서버 기동 요청
3. `Agent` 도구로 `backend-evaluator` 서브에이전트 기동
4. 프롬프트: "docs/plans/{feature}/plan.md를 기준으로 변경된 API 엔드포인트를 curl로 검증하라. 성공 경로 + 실패 경로 + DB 상태를 모두 확인하라."
5. 판정이 "재작업 필요"이면 gap-detector Match Rate와 합산해 Act 루프 진입
6. 판정이 "통과"이면 증거(curl 결과 요약 + DB 상태)를 verification 리포트에 포함

### ui-evaluator와의 순서
UI 파일과 백엔드 파일이 동시에 수정되면 **backend-evaluator를 먼저, ui-evaluator를 나중에** 호출한다 (UI가 백엔드에 의존하는 경우가 많음).

### 주의
- backend-evaluator는 **코드를 볼 수 없다**. 엔드포인트 추정은 plan.md 또는 OpenAPI 스펙에서만 가능
- 프로덕션 DB 접근 금지 — 로컬/개발 DB에서만 검증
- 파괴적 API(DELETE, UPDATE) 테스트는 테스트 데이터로만

---

## UI 관련 작업 자동 검증 (ui-evaluator)

수정된 파일 목록에 아래 확장자/경로가 포함되면 `ui-evaluator` 서브에이전트를 자동 호출한다:

- `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`
- `app/**/page.*`, `components/**/*`, `pages/**/*`

ui-evaluator는 **Playwright MCP만 사용**하고 코드에 접근할 수 없는 검증 전용 에이전트다 (Generator/Evaluator 분리).

### Playwright MCP 사전 감지 (필수 Fallback)

ui-evaluator는 Playwright MCP에 **완전히 의존**한다. 플러그인 서브에이전트는 보안상 `mcpServers` 필드가 무시되므로, ui-evaluator가 Playwright MCP를 사용하려면 **사용자 프로젝트의 `.mcp.json`에 Playwright MCP가 등록되어 있어야 한다** (research.md 섹션 9-5, Claude Code Issue #13605 참조).

따라서 verification 스킬은 ui-evaluator 호출 직전에 아래 순서로 가용성을 확인한다:

1. 프로젝트 루트에 `.mcp.json`이 존재하는지 확인
2. 존재하면 내용을 읽어 `mcpServers` 객체에 `playwright` 또는 Playwright MCP 관련 엔트리(예: `@playwright/mcp`)가 있는지 검사
3. **없으면 ui-evaluator 호출을 건너뛰고** 아래 복붙 가능한 설치 가이드를 사용자에게 제시한 뒤 verification 리포트에 "UI 자동 검증 스킵 — Playwright MCP 미설치"로 기록한다:

```
UI 파일을 수정했지만 프로젝트에 Playwright MCP가 없어 자동 브라우저 검증을 건너뜁니다.

자동 검증을 받으려면 아래 두 가지 방법 중 하나를 선택하세요:

[방법 1] Claude Code CLI로 MCP 추가 (권장, 1줄)
  claude mcp add playwright npx @playwright/mcp@latest

[방법 2] 프로젝트 루트에 .mcp.json 파일 생성
  프로젝트 폴더에 .mcp.json 파일을 만들고 아래 내용을 복사해 넣으세요:

  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp@latest"]
      }
    }
  }

설치 후 Claude Code를 재시작하면 ui-evaluator가 다음 UI 작업부터 자동 검증을 수행합니다.
지금은 수동으로 브라우저에서 화면을 확인해 주세요.
```

4. 있으면 정상적으로 ui-evaluator를 기동한다

### 호출 절차

1. 수정 파일 목록에서 위 확장자/경로가 1개 이상이면 UI 검증 대상으로 분류
2. 위의 Playwright MCP 사전 감지 수행 → 미설치면 스킵 + 안내 메시지 출력 후 다음 검증 단계로 이동
3. `Agent` 도구로 `ui-evaluator` 서브에이전트 기동
4. 프롬프트: "docs/plans/{feature}/plan.md를 기준으로 변경된 UI를 검증하라. 로컬 서버 URL은 http://localhost:3000 기본. 서버가 안 떠 있으면 사용자에게 서버 기동을 요청하라."
5. ui-evaluator 판정이 "재작업 필요"이면 gap-detector Match Rate와 합산해 Act 루프 진입
6. ui-evaluator 판정이 "통과"이면 증거(스냅샷 요약 + 콘솔 상태)를 verification 리포트에 포함

### 주의
- ui-evaluator는 **코드를 볼 수 없다**. 구현 결함을 지적하면 메인 에이전트가 코드를 읽어 수정한다
- UI가 아닌 변경(Node.js 백엔드, CLI 도구 등)에는 ui-evaluator를 호출하지 않는다
- 로컬 서버가 없으면 정적 HTML을 file:// 프로토콜로 열어 스냅샷 확보를 시도한다
- Playwright MCP 미설치 시 에러로 멈추지 않고 조용히 스킵하여 전체 verification 흐름이 중단되지 않게 한다

---

## S 크기: 체크리스트 검증

### 1. 테스트 확인
- [ ] 관련 테스트가 모두 통과하는가?
- [ ] 새로 추가한 코드에 대한 테스트가 있는가?
- [ ] 테스트 실행 결과를 캡처했는가?

### 2. 동작 확인
- [ ] 변경 사항이 의도대로 동작하는가?
- [ ] 기존 기능이 깨지지 않았는가?
- [ ] 에러/경고가 없는가?

### 3. 코드 품질
- [ ] 불필요한 console.log/print가 남아있지 않은가?
- [ ] 하드코딩된 값이 없는가?

### 4. 보안 확인
- CLAUDE.md 보안 기본 원칙이 코드 작성 시 자동 적용됨. 별도 체크 불필요.

---

## M/L 크기: gap-detector + Check-Act 자동 루프

### 실행 흐름

```
Do 완료
   ↓
gap-detector 호출: plan.md의 각 Step vs 실제 코드 비교
   ↓
Match Rate 계산
   ↓
90% 이상? ──→ 통과 → 완료 보고
   ↓ NO
Gap 목록 생성 → 서브에이전트가 자동 수정
   ↓
gap-detector 재실행 → Match Rate 재계산
   ↓
종료 조건 충족? → 완료 보고 또는 사용자 보고
```

### 종료 조건

| 조건 | 설명 |
|------|------|
| Match Rate >= 90% | 목표 달성 |
| 최대 반복 도달 | M: 2회, L: 3회 |
| 개선 없음 | 이전 회차 대비 향상 없음 → 사용자에게 보고 |

### 개선 없음 시 사용자 보고

```
Match Rate가 개선되지 않습니다 (현재: {N}%).

남은 Gap:
- Step N: {제목} — {문제 요약}
- Step N: {제목} — {문제 요약}

수동으로 확인이 필요합니다. 어떻게 할까요?
1. 남은 Gap을 직접 수정합니다
2. 현재 상태로 완료 처리합니다 ({N}%)
3. plan.md를 수정하고 다시 실행합니다
```

### 자동 수정 시 규칙

- Gap 목록의 **Critical, High 항목만** 자동 수정 대상
- Medium, Low는 완료 보고에 "권장 수정 사항"으로 포함
- 수정 서브에이전트는 plan.md의 해당 Step을 참조하여 수정

---

## 검증 결과 보고 형식

### S 크기

```
## 검증 결과

### 테스트
- 실행: `npm test` (또는 해당 명령어)
- 결과: 15/15 통과 ✓

### 동작 확인
- [변경 전]: 로그인 버튼 클릭 시 에러
- [변경 후]: 정상 로그인 + 대시보드 이동

### 결론: 완료 ✓
```

### M/L 크기

```
## 검증 결과

### Match Rate
- 1차: 78% (7/9 Step) — 미달
- Gap: Step 3 (Missing), Step 7 (Changed)
- 자동 수정 실행

- 2차: 93% (8.4/9 Step) — 통과 ✓

### Gap 요약
| Step | 1차 | 2차 |
|------|-----|-----|
| 1 | ✅ | ✅ |
| 3 | 🔴 Missing | ✅ 수정됨 |
| 7 | 🟡 Changed | ✅ 수정됨 |

### 결론: 2차에서 통과 (93%) ✓
```

---

## 검증 실패 시 (S 크기 또는 자동 루프 종료 후)

### 기존 동작 (실패 1개 또는 즉시 수정 가능)

1. "검증 실패: [이유]" 알림
2. 미달 항목 목록 제시
3. 수정 후 재검증
4. 재검증 통과 시 완료 선언

### ralph-loop 제안 (실패 2개 이상)

실패 항목이 2개 이상이고 독립적으로 수정 가능한 경우:

1. "검증에서 N개 항목이 실패했습니다."
2. "ralph-loop으로 자동 반복 수정할까요?"
   - **수락**: executing-plans에 `ralphLoop: true` 전달 → team-orchestration ralph-loop 모드
   - **거부**: 기존대로 수동 수정 → 재검증 반복

### ralph-loop 제안 조건

| 조건 | ralph-loop 제안 | 이유 |
|------|----------------|------|
| 실패 1개 | 제안 안 함 | 직접 고치는 게 빠름 |
| 실패 2~4개, 독립적 | 제안 | 병렬 수정 효율적 |
| 실패 5개 이상 | 강력 제안 | 수동 반복은 비효율적 |
| 실패들이 하나의 근본 원인 | 제안 안 함 | 근본 원인 1개만 고치면 해결됨 (디버깅이 적합) |
