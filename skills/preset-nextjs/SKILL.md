---
name: preset-nextjs
description: |
  Next.js / React 프로젝트가 감지되었을 때 자동으로 활성화되는 프리셋 스킬.
  App Router 구조, 컴포넌트 규칙, Tailwind/shadcn 사용법, 상태 관리, API 라우트, 테스트,
  그리고 UI 개발 5단계 워크플로우를 AI에게 제공한다.

  Triggers: Next.js, React, TypeScript, Tailwind, shadcn, next.config, app router, page.tsx, layout.tsx
---

# Next.js 프리셋 (preset-nextjs)

## 역할

`next.config.js`, `next.config.ts`, `package.json`에 `next` 의존성이 있으면 이 스킬이 자동 활성화된다.
Next.js App Router 기반 프로젝트의 개발 표준을 AI에게 주입한다.

---

## 자동 감지 조건

아래 파일 또는 키워드 중 하나 이상이 프로젝트에 존재하면 활성화한다.

| 감지 항목 | 예시 |
|----------|------|
| 설정 파일 | `next.config.js`, `next.config.ts`, `next.config.mjs` |
| 의존성 | `package.json`의 `"next"` 키 |
| 디렉토리 | `app/` 디렉토리 + `page.tsx` 또는 `layout.tsx` 파일 |
| 타입 설정 | `tsconfig.json` + React/Next 타입 |

---

## 1. 디렉토리 구조 규칙 (App Router)

```
{프로젝트 루트}/
├── app/                    ← 페이지 및 레이아웃 (App Router)
│   ├── layout.tsx          ← 루트 레이아웃 (전체 공통 UI)
│   ├── page.tsx            ← 루트 페이지 (/)
│   ├── globals.css         ← 전역 스타일
│   └── {도메인}/
│       ├── page.tsx        ← /도메인 페이지
│       ├── layout.tsx      ← 도메인 전용 레이아웃 (선택)
│       └── [id]/
│           └── page.tsx    ← /도메인/[id] 동적 라우트
├── components/             ← 재사용 가능한 UI 컴포넌트
│   ├── ui/                 ← shadcn/ui 기본 컴포넌트
│   └── {도메인}/           ← 도메인 전용 컴포넌트
├── lib/                    ← 유틸리티 함수, 헬퍼
├── hooks/                  ← 커스텀 React Hook
├── types/                  ← TypeScript 타입 정의
├── constants/              ← 상수 값 모음
└── public/                 ← 정적 파일 (이미지 등)
```

---

## 2. 컴포넌트 규칙

### 파일명과 컴포넌트명
- 파일명: **PascalCase** (예: `UserCard.tsx`, `ProductList.tsx`)
- 컴포넌트명: 파일명과 동일하게 **PascalCase** (예: `export default function UserCard()`)
- 인덱스 파일로 묶기: `components/ui/index.ts`에서 한꺼번에 export

### 서버 컴포넌트 vs 클라이언트 컴포넌트 구분

| 구분 | 선언 방식 | 사용 가능 기능 |
|------|----------|--------------|
| 서버 컴포넌트 (기본) | 선언 없음 | DB 직접 접근, async/await, 서버 환경변수 |
| 클라이언트 컴포넌트 | 파일 최상단에 `"use client"` | useState, useEffect, 이벤트 핸들러, 브라우저 API |

```tsx
// 클라이언트 컴포넌트 예시
"use client"

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

- **클라이언트 컴포넌트 사용은 최소화**한다. 상호작용이 필요한 부분만 클라이언트 컴포넌트로 분리한다.
- 서버 컴포넌트 안에 클라이언트 컴포넌트를 children으로 전달하는 패턴을 활용한다.

### 컴포넌트 작성 원칙
- **기존 컴포넌트 먼저 확인**: 새 컴포넌트를 만들기 전에 `components/` 디렉토리를 반드시 확인한다.
- **shadcn/ui 우선 사용**: 버튼, 입력창, 카드, 모달 등은 shadcn/ui 컴포넌트를 먼저 사용한다.
- **Props 타입 명시**: 모든 컴포넌트의 Props는 TypeScript 인터페이스로 정의한다.

```tsx
// 컴포넌트 Props 타입 정의 예시
interface UserCardProps {
  name: string
  email: string
  avatarUrl?: string  // 선택 항목은 ? 표시
  onClick?: () => void
}

export default function UserCard({ name, email, avatarUrl, onClick }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```

---

## 3. 스타일링 규칙 (Tailwind CSS + shadcn/ui)

### Tailwind CSS 사용 원칙
- 인라인 스타일(`style={{ }}`) 대신 **Tailwind 클래스**를 사용한다.
- 반복되는 클래스 조합은 `cn()` 유틸리티 함수로 묶거나 컴포넌트로 추출한다.
- 반응형은 `sm:`, `md:`, `lg:`, `xl:` 접두사를 사용한다. 모바일 퍼스트로 작성한다.
- 다크 모드는 `dark:` 접두사로 처리한다.

```tsx
// cn() 유틸리티 활용 예시 (조건부 클래스 적용)
import { cn } from "@/lib/utils"

<button
  className={cn(
    "rounded-md px-4 py-2 font-medium",
    isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
  )}
>
  버튼
</button>
```

### shadcn/ui 컴포넌트 사용
- shadcn/ui 컴포넌트는 `components/ui/` 디렉토리에 위치한다.
- 컴포넌트 추가 명령: `npx shadcn@latest add {컴포넌트명}`
- shadcn/ui 컴포넌트를 직접 수정할 때는 `components/ui/` 내 파일을 수정한다.
- 테마(색상, 폰트 등)는 `app/globals.css`의 CSS 변수로 관리한다.

---

## 4. 데이터 패칭 규칙

### 서버 컴포넌트에서 데이터 패칭 (권장)
```tsx
// 서버 컴포넌트에서 직접 데이터 패칭
async function UserList() {
  const users = await db.user.findMany() // DB 직접 접근 가능

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

### 클라이언트에서 데이터 패칭 (상호작용 필요 시)
- `SWR` 또는 `TanStack Query`를 사용한다.
- `fetch`를 직접 쓸 때는 `useEffect` + `useState` 조합을 사용한다.

---

## 5. API Route 규칙

```
app/api/{리소스명}/route.ts           ← GET, POST
app/api/{리소스명}/[id]/route.ts      ← GET, PUT, DELETE (단일 항목)
```

```typescript
// app/api/users/route.ts 예시
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // 입력 유효성 검사 후 처리
  const newUser = await createUser(body)
  return NextResponse.json(newUser, { status: 201 })
}
```

---

## 6. 상태 관리 규칙

| 규모 | 사용 도구 | 설명 |
|------|---------|------|
| 컴포넌트 내부 상태 | `useState`, `useReducer` | 단일 컴포넌트에서만 쓰는 상태 |
| 전역 UI 상태 | `zustand` | 모달 열림/닫힘, 테마, 사이드바 등 |
| 서버 데이터 캐시 | `SWR` 또는 `TanStack Query` | API 응답 데이터 캐싱 |
| URL 상태 | `useSearchParams` | 필터, 페이지네이션 등 |

- Redux는 사용하지 않는다. 가능하면 `zustand`로 대체한다.
- Context API는 단순한 경우에만 사용하고, 복잡해지면 zustand로 전환한다.

---

## 7. 타입스크립트 규칙

- `any` 타입 사용을 금지한다. 불가피한 경우 `unknown`을 사용하고 타입 가드를 추가한다.
- API 응답 타입은 `types/` 디렉토리에 인터페이스로 정의한다.
- 함수의 반환 타입을 명시한다.
- `interface`는 객체 타입에, `type`은 유니온/교차 타입에 사용한다.

```typescript
// types/user.ts 예시
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

export type UserRole = "admin" | "user" | "guest"
```

---

## 8. 테스트 규칙

```
{컴포넌트명}.test.tsx    ← 컴포넌트 단위 테스트
{함수명}.test.ts         ← 유틸리티 함수 테스트
```

- **Jest + React Testing Library** 조합을 사용한다.
- 사용자 행동 관점으로 테스트한다. (DOM 구조가 아닌 실제 동작을 테스트)
- `getByRole`, `getByText`, `getByLabelText`를 우선 사용한다.

```tsx
// 컴포넌트 테스트 예시
import { render, screen, fireEvent } from "@testing-library/react"
import Counter from "./Counter"

test("버튼 클릭 시 카운트가 증가한다", () => {
  render(<Counter />)
  const button = screen.getByRole("button")
  fireEvent.click(button)
  expect(screen.getByText("1")).toBeInTheDocument()
})
```

---

## 9. UI 개발 5단계 워크플로우

UI가 포함된 작업은 반드시 아래 5단계 순서를 따른다.

```
[1단계] 레퍼런스 크롤링
  → Playwright로 참고 사이트의 색상, 타이포그래피, 컴포넌트 스타일을 JSON으로 추출

[2단계] 테마 JSON 확정
  → 추출한 테마를 사용자에게 보여주고 확정 → docs/theme.json에 저장

[3단계] 공통 컴포넌트 제작
  → components/ 디렉토리에 재사용 컴포넌트 먼저 제작
  → 테마 JSON 기준으로 스타일링
  → 사용자가 눈으로 확인할 수 있게 데모 제공

[4단계] 컴포넌트 규칙 문서화
  → 컴포넌트 목록, 위치, 사용법을 프로젝트 CLAUDE.md에 기록

[5단계] 페이지 구현
  → 만들어둔 컴포넌트를 조합하여 실제 페이지 제작
  → 새 UI 요소가 필요하면 컴포넌트로 먼저 만든 뒤 페이지에 적용
```

---

## 10. 흔한 실수 방지 (AI 자동 적용)

코드 작성 시 아래 패턴을 자동으로 피한다.

| 실수 | 올바른 방법 |
|------|-----------|
| 서버 컴포넌트에서 `useState`/`useEffect` 사용 | `"use client"` 선언 필요 여부 먼저 확인 |
| 최상위 `layout.tsx`에 `"use client"` 선언 | 클라이언트 부분만 별도 컴포넌트로 분리 |
| `<img>` 태그 직접 사용 | `next/image`의 `<Image>` 컴포넌트 사용 |
| `<a>` 태그 직접 사용 | `next/link`의 `<Link>` 컴포넌트 사용 |
| `console.log` 배포 코드에 잔류 | 개발 중에만 사용, 배포 전 제거 |
| URL로 해결 가능한 상태를 Context로 관리 | `useSearchParams`로 URL 상태 활용 |
| `fetch` 에러 처리 없이 `.json()` 바로 호출 | `try-catch` + `response.ok` 확인 필수 |

---

## 11. 보안 규칙

- 환경변수는 `.env.local`에 저장하고, 클라이언트에서 사용할 변수만 `NEXT_PUBLIC_` 접두사를 붙인다.
- `NEXT_PUBLIC_` 없는 환경변수는 서버에서만 접근 가능 — API 키는 절대 `NEXT_PUBLIC_`을 붙이지 않는다.
- `dangerouslySetInnerHTML`은 사용하지 않는다. 불가피한 경우 DOMPurify로 반드시 새니타이즈한다.
- Server Action에서 사용자 입력을 반드시 검증한다. 클라이언트 검증만으로 신뢰하지 않는다.
- API Route에서 인증이 필요한 엔드포인트는 세션/토큰 확인을 반드시 포함한다.
- 에러 응답에 스택 트레이스나 DB 구조를 노출하지 않는다. 사용자에게는 일반 메시지만 반환한다.
