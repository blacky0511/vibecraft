#!/usr/bin/env node

/**
 * vibecraft 프리셋 로더 v2
 * 기술 스택을 감지하고 핵심 규칙을 직접 stdout으로 주입한다.
 * (기존: 프리셋명만 출력 → 개선: 규칙 본문까지 출력)
 */

const fs = require('fs');
const path = require('path');

// ── 프리셋별 핵심 규칙 (각 20줄 이내) ──────────────────────

const PRESET_RULES = {
  'preset-nextjs': `[프리셋: Next.js]
- App Router 사용: app/ 디렉토리 기반, page.tsx/layout.tsx/loading.tsx 구조
- 서버 컴포넌트 기본, 클라이언트는 'use client' 명시
- shadcn/ui 컴포넌트 우선 사용, Tailwind CSS로 스타일링
- API 라우트: app/api/ 디렉토리, Route Handlers 사용
- 이미지: next/image, 링크: next/link, 폰트: next/font 사용
- 환경변수: NEXT_PUBLIC_ 접두사만 클라이언트에 노출`,

  'preset-react': `[프리셋: React]
- 컴포넌트: 함수형 + hooks 기반, PascalCase 네이밍
- 상태 관리: useState/useReducer 우선, 필요 시 zustand/jotai
- 스타일링: Tailwind CSS 또는 CSS Modules
- 디렉토리: components/, hooks/, utils/, pages/ 구조
- props 타입 정의 필수 (TypeScript interface/type)`,

  'preset-spring': `[프리셋: Spring Boot]
- 계층 구조: Controller → Service → Repository
- 패키지: com.{company}.{project}.{layer} 형식
- 어노테이션: @RestController, @Service, @Repository 사용
- 예외 처리: @ControllerAdvice + @ExceptionHandler
- 설정: application.yml, 환경별 프로파일(dev/prod) 분리
- JPA 엔티티: @Entity, 연관관계 설정 시 지연 로딩(LAZY) 기본`,

  'preset-python': `[프리셋: Python]
- 네이밍: snake_case (변수/함수), PascalCase (클래스)
- 가상환경: venv 또는 conda 사용, requirements.txt/pyproject.toml 관리
- 타입 힌트: 함수 시그니처에 타입 힌트 권장
- 린트: ruff 또는 flake8, 포매터: black 또는 ruff format
- 테스트: pytest 사용, tests/ 디렉토리 구조`,

  'preset-general': `[프리셋: 범용]
- CLAUDE.md와 README.md의 규칙을 우선 적용
- 기존 코드 스타일을 따름 (새 패턴을 도입하지 않음)
- 프레임워크가 없으면 표준 라이브러리 우선 사용`,
};

// ── 기술 스택 감지 ──────────────────────────────────────────

function detectPreset() {
  const cwd = process.cwd();
  const results = [];

  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps && deps['next']) {
        results.push('preset-nextjs');
      } else if (deps && deps['react']) {
        results.push('preset-react');
      } else {
        results.push('preset-general');
      }
    } catch {
      results.push('preset-general');
    }
  }

  if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
      fs.existsSync(path.join(cwd, 'build.gradle.kts')) ||
      fs.existsSync(path.join(cwd, 'pom.xml'))) {
    results.push('preset-spring');
  }

  if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
      fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
      fs.existsSync(path.join(cwd, 'setup.py'))) {
    results.push('preset-python');
  }

  if (results.length === 0) {
    results.push('preset-general');
  }

  return [...new Set(results)];
}

// ── 메인 ────────────────────────────────────────────────────

try {
  const presets = detectPreset();
  const lines = [`감지된 기술 스택 프리셋: ${presets.join(', ')}`];

  for (const preset of presets) {
    if (PRESET_RULES[preset]) {
      lines.push(PRESET_RULES[preset]);
    }
  }

  console.log(lines.join('\n'));
} catch {
  console.log('감지된 기술 스택 프리셋: preset-general');
  console.log(PRESET_RULES['preset-general']);
}
