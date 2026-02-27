---
name: preset-react
description: |
  React 프로젝트가 감지되었을 때 자동으로 활성화되는 프리셋 스킬.
  Next.js 없이 React만 사용하는 프로젝트 (Vite+React, CRA 등)에 적용된다.
  컴포넌트 규칙, 스타일링, 상태 관리, 테스트, 프로젝트 구조를 안내한다.

  Triggers: React, Vite, CRA, TypeScript, Tailwind, jsx, tsx, react-dom
---

# React 프리셋 (preset-react)

## 역할

`package.json`에 `react` 의존성은 있지만 `next`가 없는 프로젝트에서 활성화된다.
Vite + React, Create React App, 커스텀 React 프로젝트 등에 적용되는 개발 표준을 제공한다.

---

## 자동 감지 조건

| 감지 항목 | 조건 |
|----------|------|
| 의존성 | `package.json`에 `react` 있음 + `next` 없음 |
| 설정 파일 | `vite.config.ts`, `vite.config.js`, `craco.config.js` 등 |
| 디렉토리 | `src/` 디렉토리 + `.tsx` 또는 `.jsx` 파일 |

---

## 1. 디렉토리 구조 규칙

```
{프로젝트 루트}/
├── src/
│   ├── main.tsx               ← 앱 진입점
│   ├── App.tsx                ← 루트 컴포넌트
│   ├── components/            ← 재사용 가능한 UI 컴포넌트
│   │   ├── ui/                ← 공통 기본 컴포넌트 (Button, Input 등)
│   │   └── {도메인}/          ← 도메인 전용 컴포넌트
│   ├── pages/                 ← 페이지 컴포넌트 (라우터 연동)
│   ├── hooks/                 ← 커스텀 React Hook
│   ├── lib/                   ← 유틸리티 함수, 헬퍼
│   ├── types/                 ← TypeScript 타입 정의
│   ├── constants/             ← 상수 값 모음
│   ├── services/              ← API 호출 함수
│   └── assets/                ← 이미지, 폰트 등 정적 자원
├── public/                    ← 정적 파일
├── index.html                 ← HTML 엔트리 (Vite)
└── vite.config.ts             ← 빌드 설정
```

---

## 2. 컴포넌트 규칙

### 파일명과 컴포넌트명
- 파일명: **PascalCase** (예: `UserCard.tsx`, `ProductList.tsx`)
- 컴포넌트명: 파일명과 동일
- 한 파일에 하나의 컴포넌트만 export

### 컴포넌트 작성 원칙
- **기존 컴포넌트 먼저 확인**: 새 컴포넌트 전에 `components/` 디렉토리 확인
- **Props 타입 명시**: 모든 Props는 TypeScript 인터페이스로 정의

```tsx
// 컴포넌트 표준 패턴
interface UserCardProps {
  name: string
  email: string
  avatarUrl?: string
  onClick?: () => void
}

export default function UserCard({ name, email, avatarUrl, onClick }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4" onClick={onClick}>
      {avatarUrl && <img src={avatarUrl} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}
```

---

## 3. 스타일링 규칙

### Tailwind CSS 사용 시
- 인라인 스타일(`style={{ }}`) 대신 Tailwind 클래스 사용
- 반복되는 클래스 조합은 컴포넌트로 추출
- 반응형: `sm:`, `md:`, `lg:` 접두사 (모바일 퍼스트)

### CSS Modules 사용 시
- 파일명: `{컴포넌트명}.module.css`
- 전역 스타일은 `src/index.css` 또는 `src/globals.css`에만 작성

---

## 4. 라우팅 규칙

### React Router 사용 시
```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- 페이지 컴포넌트는 `src/pages/`에 배치
- 중첩 라우트는 `<Outlet />`으로 처리

---

## 5. 상태 관리 규칙

| 규모 | 사용 도구 | 설명 |
|------|---------|------|
| 컴포넌트 내부 상태 | `useState`, `useReducer` | 단일 컴포넌트에서만 쓰는 상태 |
| 전역 UI 상태 | `zustand` 또는 `Context API` | 모달, 테마, 사이드바 등 |
| 서버 데이터 캐시 | `TanStack Query` 또는 `SWR` | API 응답 캐싱 |
| URL 상태 | `useSearchParams` (React Router) | 필터, 페이지네이션 |

---

## 6. API 호출 규칙

- API 호출 함수는 `src/services/`에 모아둔다
- `fetch` 또는 `axios` 사용
- 에러 처리를 반드시 포함한다

```typescript
// src/services/userService.ts
const API_BASE = import.meta.env.VITE_API_URL

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users`)
  if (!response.ok) {
    throw new Error('사용자 목록을 불러오지 못했습니다.')
  }
  return response.json()
}
```

---

## 7. TypeScript 규칙

- `any` 타입 사용 금지 → `unknown` + 타입 가드 사용
- API 응답 타입은 `types/` 디렉토리에 인터페이스로 정의
- `interface`는 객체 타입, `type`은 유니온/교차 타입에 사용

---

## 8. 테스트 규칙

- **Vitest + React Testing Library** (Vite 프로젝트)
- **Jest + React Testing Library** (CRA 프로젝트)
- 사용자 행동 관점으로 테스트 (`getByRole`, `getByText` 우선)
- 테스트 파일: `{컴포넌트명}.test.tsx`

---

## 9. 환경변수 규칙

| 빌드 도구 | 접두사 | 접근 방법 |
|----------|--------|----------|
| Vite | `VITE_` | `import.meta.env.VITE_변수명` |
| CRA | `REACT_APP_` | `process.env.REACT_APP_변수명` |

- `.env.local`에 저장, `.gitignore`에 추가
- API 키 등 민감 정보는 절대 클라이언트에 노출하지 않는다

---

## 10. Next.js와의 차이점

이 프리셋은 Next.js 없이 순수 React를 사용하므로:
- 서버 컴포넌트 없음 → 모든 컴포넌트가 클라이언트 컴포넌트
- API Route 없음 → 별도 백엔드 서버 또는 외부 API 사용
- 파일 기반 라우팅 없음 → React Router 등 수동 라우팅
- SSR/SSG 없음 → CSR(Client Side Rendering) 기본
