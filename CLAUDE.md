# vibecraft 프로젝트 규칙

## 프로젝트 개요
bkit + superpowers의 장점을 합친 한국어 전용 Claude Code 플러그인.
AI가 상황을 자동 감지하고, 사용자는 아이디어만 제공하면 적절한 워크플로우를 안내한다.

## 핵심 철학
- **AI가 리드, 사용자는 방향만 결정** (바이브코딩 최적화)
- **자동 감지**: 명령어 없이 입력만으로 워크플로우 자동 선택
- **스마트 PDCA**: 작업 크기(S/M/L)에 따라 방법론 강도 자동 조절
- **Iron Law**: 테스트 먼저 + 증거 없이 완료 없다
- **범용 + 프리셋**: 어떤 프로젝트에서든 사용 가능, 기술 스택별 맞춤 지원

## 기술 스택
- 플러그인 형식: Claude Code Plugin (.claude-plugin/)
- 스킬: Markdown (skills/{이름}/SKILL.md)
- 에이전트: Markdown (agents/{이름}.md)
- 훅 설정: JSON (hooks/hooks.json)
- 훅 스크립트: Node.js (scripts/*.js)
- 템플릿: Markdown (templates/*.md)
- Output Styles: Markdown (output-styles/*.md)
- 명령어: Markdown (commands/*.md)

## 디렉토리 구조
```
vibecraft/
├── .claude-plugin/           # 플러그인 메타데이터
│   └── plugin.json
├── skills/                   # 스킬 36개
│   ├── # 핵심 엔진
│   ├── auto-detect/          # 상황 자동 감지 + ralph-loop 라우팅
│   ├── smart-pdca/           # 작업 크기별 PDCA 조절
│   ├── iron-law/             # TDD + 검증 필수
│   ├── verification/         # 완료 전 검증 게이트
│   ├── cto-mindset/          # CTO 마인드셋 (의견 제시)
│   ├── session-context/      # 세션 맥락 보존 (compact 대비)
│   ├── # 워크플로우
│   ├── brainstorming/        # 아이디어 → 설계
│   ├── writing-plans/        # 설계 → 구현 계획
│   ├── new-feature/          # 새 기능 오케스트레이션
│   ├── simple-tweak/         # 단순 수정 안내 (DIY 가이드)
│   ├── systematic-debugging/ # 체계적 디버깅
│   ├── project-kickoff/      # 프로젝트 시작 가이드
│   ├── git-workflow/         # Git 브랜치/커밋/PR 관리
│   ├── executing-plans/      # 서브에이전트 병렬 실행
│   ├── team-orchestration/   # CTO 팀 구성
│   ├── finishing-branch/     # 브랜치 정리
│   ├── # 코드 품질 (CTO 스마트 스킬)
│   ├── impact-analysis/      # 수정 전 영향 범위 분석
│   ├── pre-flight-check/     # 구현 전 중복/충돌 확인
│   ├── dependency-auditor/   # 패키지 설치 전 검증
│   ├── rollback-strategy/    # 위험 작업 전 체크포인트
│   ├── naming-consultant/    # 변수/함수명 품질 제안
│   ├── error-message-designer/ # 사용자 친화적 에러 메시지
│   ├── consistency-enforcer/ # 프로젝트 패턴 일관성 감시
│   ├── refactoring-radar/    # 코드 복잡도 감지/정리 제안
│   ├── test-strategy-advisor/ # 테스트 우선순위 가이드
│   ├── tech-debt-tracker/    # 기술 부채 기록/리마인드
│   ├── user-empathy-lens/    # 사용자 시선 UX 점검
│   ├── doc-autopilot/        # 코드-문서 동기화
│   ├── skill-progression/    # 학습 진도 추적
│   ├── # 리뷰 & 배포
│   ├── code-review-request/  # 코드 리뷰 요청
│   ├── code-review-receive/  # 리뷰 피드백 처리
│   ├── external-reviewer/    # 외부 리뷰 도구 연동
│   ├── deploy-guide/         # 배포 가이드
│   ├── # 프리셋
│   ├── preset-spring/        # Spring Boot 프리셋
│   ├── preset-nextjs/        # Next.js 프리셋
│   ├── preset-python/        # Python 프리셋
│   └── preset-general/       # 범용 프리셋
├── agents/                   # 에이전트 11개
│   ├── cto-lead.md           # 팀 리드
│   ├── code-analyzer.md      # 코드 분석
│   ├── frontend-builder.md   # 프론트엔드 구현
│   ├── backend-builder.md    # 백엔드 구현
│   ├── test-writer.md        # 테스트 작성
│   ├── debugger.md           # 디버깅 전문
│   ├── code-reviewer.md      # 코드 리뷰
│   ├── code-simplifier.md    # 코드 간소화
│   ├── deploy-manager.md     # 배포 관리
│   ├── doc-writer.md         # 문서 작성
│   └── gap-detector.md       # 누락 항목 탐지
├── hooks/                    # 훅 설정
│   └── hooks.json
├── scripts/                  # 훅 실행 스크립트
│   ├── session-start.js
│   └── preset-loader.js
├── templates/                # 문서 템플릿 8개
│   ├── plan.md               # 구현 계획서
│   ├── design.md             # 설계 문서
│   ├── check-report.md       # 점검 보고서
│   ├── debug-report.md       # 디버그 보고서
│   ├── review-checklist.md   # 리뷰 체크리스트
│   ├── deploy-checklist.md   # 배포 체크리스트
│   ├── project-init.md       # 프로젝트 초기화
│   └── sprint-summary.md     # 스프린트 요약
├── output-styles/            # 응답 포맷
│   ├── learning.md           # 학습 모드
│   └── standard.md           # 기본 모드
├── commands/                 # 슬래시 명령어
│   └── vibecraft.md          # /vibecraft 도움말
├── lib/                      # 공통 유틸리티
└── docs/plans/               # 설계 문서
```

## 구현 상태
- Phase 1 (기반): 완료 - 핵심 스킬 4개, 훅 2개, 명령어 1개, Output Style 2개
- Phase 2 (워크플로우): 완료 - 모드별 스킬 6개
- Phase 3 (서브에이전트 + 리뷰): 완료 - 실행/리뷰 스킬 3개, 에이전트 11개
- Phase 4 (완성도): 완료 - 나머지 스킬 4개, 프리셋 4개, 템플릿 8개

## 코딩 규칙
- 모든 텍스트: 한국어
- 변수/함수명: camelCase (영어)
- 파일명: kebab-case
- 들여쓰기: 2칸 (Space)
- 훅 스크립트: Node.js (Windows/macOS 호환)
