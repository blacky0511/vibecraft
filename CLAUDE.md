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
├── skills/                   # 스킬 정의 (워크플로우/규칙)
│   ├── core/                 # 핵심 스킬
│   │   ├── auto-detect/      # 상황 자동 감지
│   │   ├── smart-pdca/       # 작업 크기별 PDCA 조절
│   │   ├── iron-law/         # TDD + 검증 필수
│   │   └── verification/     # 완료 전 검증 게이트
│   ├── modes/                # 모드별 스킬 (Phase 2)
│   └── presets/              # 기술 스택 프리셋 (Phase 4)
├── agents/                   # 에이전트 정의 (Phase 3)
├── hooks/                    # 훅 설정
│   └── hooks.json
├── scripts/                  # 훅 실행 스크립트
│   ├── session-start.js
│   └── preset-loader.js
├── templates/                # 문서 템플릿 (Phase 4)
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
- Phase 2 (워크플로우): 미구현
- Phase 3 (서브에이전트 + 리뷰): 미구현
- Phase 4 (완성도): 미구현

## 코딩 규칙
- 모든 텍스트: 한국어
- 변수/함수명: camelCase (영어)
- 파일명: kebab-case
- 들여쓰기: 2칸 (Space)
- 훅 스크립트: Node.js (Windows/macOS 호환)
