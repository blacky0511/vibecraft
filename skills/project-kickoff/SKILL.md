---
name: project-kickoff
description: |
  새 프로젝트를 처음부터 시작할 때의 가이드 스킬.
  brainstorming → 기술 스택 선택 → 초기 설정 → 계획 수립 → 구현 시작의 흐름으로 진행한다.
  auto-detect가 "프로젝트 시작 모드"로 감지하면 자동 호출된다.

  Triggers: 만들자, 시작하자, 앱, 사이트, 프로젝트, 새 프로젝트, init
---

# 새 프로젝트 시작 워크플로우

## 역할

사용자가 새 프로젝트를 처음 시작할 때, 아이디어 구체화부터 초기 설정까지
단계별로 안내하는 스킬이다.

---

## 1단계: 브레인스토밍 (brainstorming)

아래 질문을 순서대로 물어보며 프로젝트 아이디어를 구체화한다.
한꺼번에 묻지 말고, 답변을 받으면서 자연스러운 대화처럼 진행한다.

### 필수 질문 목록

1. **어떤 앱/사이트를 만들 건가요?**
   - 한두 줄로 설명해 달라고 요청한다
   - 예시: "할 일 관리 앱", "동네 중고거래 사이트"

2. **주요 기능은 무엇인가요?**
   - 핵심 기능 3~5개를 함께 정리한다
   - 사용자가 막막해하면 예시를 먼저 제시한다

3. **누가 사용하는 서비스인가요?**
   - 개인용, 팀용, 불특정 다수 등 대상 사용자를 파악한다

4. **디자인 참고 사이트가 있나요?**
   - 있으면 URL을 받아서 Playwright MCP로 테마 데이터를 추출한다
   - 없으면 "비슷한 느낌의 앱이 있나요?" 등으로 분위기를 파악한다

5. **언제까지 만들고 싶으신가요?**
   - 일정에 따라 기능 범위를 조정하는 데 활용한다

---

## 2단계: 기술 스택 선택

브레인스토밍 결과를 바탕으로 기술 스택을 제안한다.
아래 선택지를 사용자에게 보여주고 선택하게 한다.

### 기술 스택 선택지

| 번호 | 용도 | 스택 | 특징 |
|------|------|------|------|
| 1 | 웹 풀스택 | Next.js + TypeScript + Tailwind CSS + shadcn/ui | 현대적, 빠른 개발 |
| 2 | 백엔드 API | Spring Boot 3 + Java 21 + MyBatis/JPA | 안정적, 기업용 |
| 3 | 간단한 웹사이트 | HTML + Tailwind CSS + Vanilla JS | 가볍고 단순함 |
| 4 | 자동화 스크립트 | Python + 필요한 라이브러리 | 데이터 처리, 자동화 |
| 5 | 직접 입력 | 사용자가 원하는 스택 | - |

선택 후 선택한 스택에 맞는 preset-loader를 호출하여 상세 설정을 불러온다.

---

## 3단계: preset-loader 호출

선택한 기술 스택의 프리셋을 자동으로 로드한다.

- **Next.js 선택 시**: vibecraft:preset-loader nextjs 호출
- **Spring Boot 선택 시**: vibecraft:preset-loader springboot 호출
- **Python 선택 시**: vibecraft:preset-loader python 호출
- **기타**: 사용자에게 필요한 설정을 직접 물어본다

---

## 4단계: 프로젝트 초기 설정

아래 항목을 순서대로 실행한다.
각 명령어 실행 전에 무엇을 하는지 한국어로 설명한다.

### 공통 설정 (모든 프로젝트)

```
1. 폴더 생성 및 이동
2. Git 저장소 초기화 (git init)
3. .gitignore 파일 생성
4. CLAUDE.md 생성 (프로젝트별 규칙 문서)
5. README.md 초안 생성
```

### 기술 스택별 추가 설정

#### Next.js 프로젝트

```bash
# 1. Next.js 앱 생성 (TypeScript + Tailwind 포함)
npx create-next-app@latest 프로젝트명 --typescript --tailwind --eslint --app --src-dir

# 2. shadcn/ui 초기화
npx shadcn@latest init

# 3. 자주 쓰는 컴포넌트 설치
npx shadcn@latest add button card input label
```

#### Spring Boot 프로젝트

```
- https://start.spring.io 에서 프로젝트 생성 방법 안내
- 의존성: Spring Web, Spring Data JPA, MariaDB Driver, Lombok, Spring Security
- 멀티모듈 구조가 필요한지 물어본다
```

#### Python 프로젝트

```bash
# 1. 가상환경 생성
python -m venv venv

# 2. 가상환경 활성화 (OS별로 안내)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# 3. 기본 파일 생성
# requirements.txt, main.py, .env.example
```

### CLAUDE.md 내용 템플릿

초기 CLAUDE.md는 아래 항목을 포함하여 자동 생성한다:

```markdown
# [프로젝트명] 프로젝트 규칙

## 프로젝트 개요
[브레인스토밍에서 정리된 설명]

## 기술 스택
[선택된 스택 목록]

## 주요 기능
[기능 목록]

## 디렉토리 구조
[초기 구조]

## 코딩 규칙
- 들여쓰기: 2칸 (Space)
- 변수/함수명: camelCase (영어)
- 파일명: kebab-case
- 모든 주석 및 문서: 한국어
```

---

## 5단계: 기능별 구현 계획 수립 (writing-plans)

초기 설정이 완료되면 vibecraft:writing-plans 스킬을 호출하여
기능별 구현 계획서를 작성한다.

계획서 위치: `docs/plans/기능명-구현계획.md`

---

## 6단계: 구현 시작 (executing-plans)

계획서가 확정되면 vibecraft:executing-plans 스킬을 호출하여
첫 번째 기능부터 순서대로 구현을 시작한다.

---

## 중요 규칙

- **한 번에 다 설명하지 않는다**: 단계별로 완료를 확인하며 진행한다
- **사용자 확인 필수**: Git 저장소 생성, 폴더 생성 등 되돌리기 어려운 작업 전에는 반드시 확인한다
- **에러 발생 시**: 원인과 해결책을 한국어로 단계별로 설명한다
- **UI가 있는 프로젝트**: 전역 CLAUDE.md의 "5. 프론트엔드 UI 개발 워크플로"를 반드시 따른다
- **디자인 참고 사이트가 있으면**: Playwright MCP로 테마 데이터를 추출하고 테마 JSON을 먼저 확정한다
