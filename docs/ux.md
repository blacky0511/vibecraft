# claude.md에 넣을 UI 디자인 시스템 가이드라인

> Claude Code로 일관성 있는 UI를 만들기 위한 `claude.md` 작성 가이드

---

## 결론부터: 효과가 있는가?

**네, 확실히 효과가 있습니다.** Claude Code는 `claude.md`의 규칙을 매 작업마다 참조하기 때문에, 구체적인 수치와 규칙을 명시하면 파일마다 일관된 디자인이 나옵니다. 핵심은 **"구체적인 숫자"**를 주는 것입니다. "적당한 간격을 두세요"가 아니라 "16px 간격을 사용하세요"라고 써야 합니다.

---

## 추천 claude.md 템플릿

아래 내용을 프로젝트 성격에 맞게 수정하여 `claude.md`에 추가하세요.

```markdown
# UI Design System

## 1. Spacing System (8pt Grid)
모든 간격, 패딩, 마진은 8의 배수를 사용한다. 미세 조정이 필요한 경우에만 4px 사용.

| Token     | Value | 용도                          |
|-----------|-------|-------------------------------|
| space-2xs | 4px   | 아이콘-텍스트 간 미세 간격     |
| space-xs  | 8px   | 인라인 요소 사이, 작은 패딩    |
| space-sm  | 12px  | 폼 필드 내부 패딩              |
| space-md  | 16px  | 기본 간격 (카드 패딩, 리스트 갭) |
| space-lg  | 24px  | 섹션 내 그룹 간 간격           |
| space-xl  | 32px  | 섹션 간 간격                   |
| space-2xl | 48px  | 큰 섹션 구분                   |
| space-3xl | 64px  | 페이지 레벨 구분               |

### 핵심 원칙
- **내부 간격 ≤ 외부 간격**: 카드 내부 패딩(16px)은 카드 사이 간격(24px)보다 작아야 한다
- 관련 요소는 가깝게, 무관한 요소는 멀게 (게슈탈트 근접성 법칙)
- 컨테이너 패딩: 모바일 16px, 데스크톱 24~32px

## 2. Typography Scale (Major Third - 1.25 ratio)
Base: 16px (1rem). 모든 폰트 크기는 아래 스케일에서만 선택.

| Token        | Size   | Weight   | Line Height | 용도               |
|-------------|--------|----------|-------------|--------------------|
| display     | 48px   | 700      | 1.1         | 히어로 타이틀       |
| h1          | 40px   | 700      | 1.2         | 페이지 제목         |
| h2          | 32px   | 600      | 1.25        | 섹션 제목           |
| h3          | 24px   | 600      | 1.3         | 서브 섹션 제목      |
| h4          | 20px   | 600      | 1.4         | 카드 제목           |
| body-lg     | 18px   | 400      | 1.6         | 리드 텍스트         |
| body        | 16px   | 400      | 1.5         | 본문 (기본값)       |
| body-sm     | 14px   | 400      | 1.5         | 보조 텍스트, 라벨   |
| caption     | 12px   | 400      | 1.4         | 캡션, 힌트 텍스트   |

### 타이포그래피 규칙
- **본문 최소 크기**: 16px (모바일 포함)
- **줄 길이(measure)**: 45~75자 (최적 가독성)
- **헤딩 line-height**: 1.1~1.3 (타이트하게)
- **본문 line-height**: 1.5~1.6
- **letter-spacing**: 헤딩에 -0.02em, 대문자 텍스트에 +0.05em
- 12px 미만 텍스트 사용 금지

## 3. Color System

### 구조
```
--color-primary: #...;        /* 메인 브랜드 컬러 */
--color-primary-hover: #...;  /* 호버 시 10% 어둡게 */
--color-secondary: #...;      /* 보조 액션 */
--color-surface: #...;        /* 카드/컨테이너 배경 */
--color-background: #...;     /* 페이지 배경 */
--color-text-primary: #...;   /* 주요 텍스트 */
--color-text-secondary: #...; /* 보조 텍스트 */
--color-text-disabled: #...;  /* 비활성 텍스트 */
--color-border: #...;         /* 구분선, 테두리 */
--color-error: #DC2626;       /* 에러 */
--color-success: #16A34A;     /* 성공 */
--color-warning: #F59E0B;     /* 경고 */
```

### 접근성 규칙
- 본문 텍스트 대비율: **최소 4.5:1** (WCAG AA)
- 대형 텍스트(18px+, 14px+ bold): **최소 3:1**
- 인터랙티브 요소 테두리: 배경 대비 **최소 3:1**

## 4. Component Sizing

### Buttons
| Variant | Height | Padding (좌우) | Font Size | Border Radius |
|---------|--------|----------------|-----------|---------------|
| sm      | 32px   | 12px           | 14px      | 6px           |
| md      | 40px   | 16px           | 14px      | 8px           |
| lg      | 48px   | 24px           | 16px      | 8px           |

- 터치 대상 최소 크기: **44×44px** (모바일), **24×24px** (데스크톱 최소)
- 버튼 사이 간격: 최소 8px
- Primary 버튼은 화면당 1개만 사용
- 아이콘 버튼: 최소 44×44px 터치 영역 확보 (패딩 포함)

### Input Fields
| Variant | Height | Padding       | Font Size | Border Radius |
|---------|--------|---------------|-----------|---------------|
| sm      | 32px   | 8px 12px      | 14px      | 6px           |
| md      | 40px   | 8px 12px      | 16px      | 8px           |
| lg      | 48px   | 12px 16px     | 16px      | 8px           |

- 라벨과 인풋 간격: 6~8px
- 인풋 필드 사이 간격: 16~24px
- 에러 메시지: 인풋 아래 4px, 12~14px 크기, error 색상
- placeholder 색상: text-disabled

### Cards
- 패딩: 16~24px
- border-radius: 8~12px
- 그림자: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- 호버 그림자: `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`
- 카드 사이 간격: 16~24px

### Avatars / Icons
| Size | Dimensions | 용도                |
|------|------------|---------------------|
| xs   | 24×24px    | 인라인 아이콘        |
| sm   | 32×32px    | 리스트 아이템 아이콘  |
| md   | 40×40px    | 기본 아바타          |
| lg   | 48×48px    | 프로필 아바타        |
| xl   | 64×64px    | 프로필 상세          |

## 5. Layout & Grid

### 반응형 Breakpoints
| Name | Width    | Columns | Gutter | Margin  |
|------|----------|---------|--------|---------|
| sm   | 640px    | 4       | 16px   | 16px    |
| md   | 768px    | 8       | 24px   | 24px    |
| lg   | 1024px   | 12      | 24px   | 32px    |
| xl   | 1280px   | 12      | 24px   | 32px    |
| 2xl  | 1440px   | 12      | 24px   | 60px    |

### 레이아웃 규칙
- max-width: 1280px (콘텐츠 영역)
- 좁은 콘텐츠(블로그, 글): max-width 720px
- 12-column grid 사용
- 모바일 우선 설계 (mobile-first)

## 6. 모션 & 트랜지션

| 용도              | Duration | Easing                     |
|-------------------|----------|----------------------------|
| 호버 효과          | 150ms    | ease-in-out                |
| 모달/드롭다운 열기  | 200ms    | ease-out                   |
| 모달/드롭다운 닫기  | 150ms    | ease-in                    |
| 페이지 전환         | 300ms    | ease-in-out                |
| 복잡한 애니메이션   | 300-500ms| cubic-bezier(0.4, 0, 0.2, 1)|

- 300ms 이상 애니메이션 지양 (체감 지연)
- 사용자 동작에 대한 피드백은 100ms 이내 시작
- prefers-reduced-motion 미디어 쿼리 반드시 존재

## 7. Z-Index Scale
```
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
--z-tooltip: 600;
```

## 8. Border Radius Scale
```
--radius-sm: 4px;    /* 태그, 뱃지 */
--radius-md: 8px;    /* 버튼, 인풋, 카드 */
--radius-lg: 12px;   /* 큰 카드, 모달 */
--radius-xl: 16px;   /* 대형 컨테이너 */
--radius-full: 9999px; /* 원형, 필 */
```

## 9. Shadow Scale
```
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 8px 10px rgba(0,0,0,0.04);
```

## 10. 코딩 규칙
- CSS 변수(Custom Properties)로 모든 토큰 정의
- Tailwind 사용 시 theme.extend에서 위 토큰으로 커스텀 설정
- 하드코딩된 매직넘버 금지 — 반드시 토큰 참조
- 컴포넌트당 하나의 책임 (Single Responsibility)
- 인라인 스타일 금지

## 11. 인터랙티브 상태 (Interactive States)
모든 인터랙티브 요소(버튼, 링크, 인풋 등)는 아래 5가지 상태를 반드시 정의한다.

| 상태       | 시각적 변화                            | 적용 방법                     |
|-----------|---------------------------------------|-------------------------------|
| default   | 기본 상태                              | 기본 스타일                    |
| hover     | 배경 밝기 변화, 커서 pointer            | `:hover`                      |
| focus     | 포커스 링 (2px solid, offset 2px)      | `:focus-visible`              |
| active    | 살짝 눌린 느낌 (scale 0.98 또는 어둡게) | `:active`                     |
| disabled  | opacity 0.5, cursor not-allowed       | `:disabled`, `[aria-disabled]`|

### 포커스 링 (Focus Ring) — 접근성 필수
키보드 사용자가 현재 위치를 알 수 있어야 한다. 절대 `outline: none`만 쓰지 않는다.
```
/* 마우스 클릭 시에는 포커스 링 숨김, 키보드 탭 시에만 표시 */
:focus { outline: none; }
:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

### 상태별 색상 변화 패턴
- **hover**: 배경색 10% 어둡게 또는 밝게
- **active**: hover보다 5% 더 어둡게
- **disabled**: 원래 색상 유지 + opacity 0.5

## 12. 폼 패턴 (Form Patterns)

### 인풋 상태
| 상태      | 테두리 색상             | 배경색          | 추가 요소              |
|----------|----------------------|-----------------|----------------------|
| default  | `--color-border`     | white           | -                    |
| hover    | border 10% 진하게     | white           | -                    |
| focus    | `--color-primary`    | white           | 포커스 링 (2px)       |
| error    | `--color-error`      | error 5% tint   | 에러 아이콘 + 메시지   |
| success  | `--color-success`    | success 5% tint | 체크 아이콘            |
| disabled | `--color-border` 연하게| `#f9fafb`       | opacity 0.7          |

### 에러 메시지 표시 규칙
- 위치: 인풋 바로 아래 4px 간격
- 크기: 12~14px (caption ~ body-sm)
- 색상: `--color-error`
- 아이콘: 선택사항이지만 인풋 우측 내부에 에러 아이콘 넣으면 직관적
- 타이밍: 실시간 검증(onBlur) 권장. 타이핑 중(onChange)은 지양

### 폼 레이아웃 규칙
- 라벨 위치: 인풋 **위** (left-aligned). 인풋 옆(inline)은 모바일에서 깨짐
- 필수 표시: 라벨 뒤 `*` (color: error)
- 도움말 텍스트: 인풋 아래 4px, caption 크기, text-secondary 색상
- 폼 그룹 간격: 16~24px (space-md ~ space-lg)
- 제출 버튼: 폼 하단, 우측 정렬 또는 전체 너비

## 13. 빈 상태 (Empty State)
데이터가 없을 때 빈 화면을 보여주지 않는다. 반드시 아래 요소를 포함한다.

### 필수 구성 요소
1. **일러스트 또는 아이콘** (64~120px, 중앙 정렬, muted 색상)
2. **제목** (h3~h4 크기, text-primary)
3. **설명** (body-sm, text-secondary, 1~2줄)
4. **행동 유도 버튼** (primary 또는 secondary, 선택사항)

### 레이아웃
```
┌─────────────────────────────────┐
│                                 │
│         🔍 (아이콘/일러스트)      │
│                                 │
│     아직 프로젝트가 없어요        │  ← h4, text-primary
│  새 프로젝트를 만들어 시작해보세요  │  ← body-sm, text-secondary
│                                 │
│      [ + 프로젝트 만들기 ]        │  ← primary 버튼
│                                 │
└─────────────────────────────────┘
```
- 전체 영역 중앙 정렬 (수평 + 수직)
- 최소 높이: 200px (너무 좁으면 초라해 보임)
- 아이콘과 제목 간격: 16px, 제목과 설명 간격: 8px, 설명과 버튼 간격: 24px

## 14. 로딩 상태 (Loading States)

### 스켈레톤 스크린 (Skeleton Screen) — 권장
콘텐츠 로딩 중에 실제 레이아웃과 동일한 뼈대를 보여준다.
```
스켈레톤 색상: #e5e7eb (light gray)
애니메이션: shimmer (좌→우 광택 이동)
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)
  animation: shimmer 1.5s infinite
duration: 1.5s, ease-in-out
border-radius: 텍스트는 4px, 이미지/아바타는 원래 radius 유지
```

### 스피너 (Spinner) — 부분 로딩용
- 크기: sm(16px), md(24px), lg(32px)
- 색상: primary 또는 현재 텍스트 색상
- 사용: 버튼 내부, 인라인 로딩에 적합
- 버튼 로딩 시: 텍스트를 스피너로 교체, 버튼 너비 고정 (깜빡임 방지)

### 로딩 전략 선택
| 상황                  | 방법                  |
|----------------------|----------------------|
| 페이지 첫 로딩         | 스켈레톤 스크린         |
| 버튼 클릭 후 응답 대기  | 버튼 내 스피너          |
| 무한 스크롤 추가 로딩   | 목록 하단 스피너        |
| 이미지 로딩            | blur placeholder 또는 회색 배경 |
| 200ms 이내 응답        | 로딩 표시 안 함 (깜빡임 방지) |

## 15. 테이블 스타일 (Table)
SaaS 대시보드에서 테이블은 핵심 컴포넌트이다.

### 기본 규격
| 요소         | 값                                    |
|-------------|--------------------------------------|
| 헤더 행 높이  | 44~48px                              |
| 본문 행 높이  | 48~56px                              |
| 셀 패딩      | 12px 16px (상하 좌우)                  |
| 헤더 배경     | `#f9fafb` 또는 `--color-surface`      |
| 헤더 글꼴     | body-sm (14px), weight 600, text-secondary |
| 본문 글꼴     | body-sm (14px), weight 400, text-primary   |
| 행 구분선     | `1px solid #f3f4f6`                  |
| 호버 행 배경   | `#f9fafb`                            |
| 선택 행 배경   | primary 5% tint                      |

### 테이블 규칙
- 숫자 데이터: 우측 정렬 (tabular-nums 속성 사용)
- 텍스트 데이터: 좌측 정렬
- 액션 컬럼: 우측 정렬
- 헤더 고정(sticky): 긴 테이블에서 `position: sticky; top: 0`
- 빈 테이블: 빈 상태 컴포넌트 표시 (섹션 13 참조)
- 반응형: 모바일에서 가로 스크롤 허용 (`overflow-x: auto`)

## 16. 토스트 & 알림 (Toast / Notification)

### 토스트 (일시적 알림)
| 속성        | 값                                    |
|------------|--------------------------------------|
| 위치        | 화면 우측 상단 (top: 24px, right: 24px) |
| 너비        | 320~400px                            |
| 패딩        | 16px                                 |
| border-radius | radius-lg (12px)                  |
| 그림자       | shadow-lg                            |
| z-index     | `--z-toast` (500)                    |
| 표시 시간    | 성공: 3초, 에러: 5초 (또는 수동 닫기)    |

### 토스트 유형별 스타일
| 유형    | 좌측 아이콘 | 배경색               | 보더 좌측          |
|--------|-----------|---------------------|-------------------|
| success| ✓ 체크    | success 5% tint     | 3px solid success |
| error  | ✕ 엑스    | error 5% tint       | 3px solid error   |
| warning| ⚠ 경고    | warning 5% tint     | 3px solid warning |
| info   | ℹ 정보    | primary 5% tint     | 3px solid primary |

### 애니메이션
- 진입: 우측에서 슬라이드인 (200ms, ease-out)
- 퇴장: 우측으로 슬라이드아웃 + fade (150ms, ease-in)
- 여러 개 쌓일 때: 아래로 12px 간격으로 스택

## 17. 다크 모드 (Dark Mode)

### 색상 전환 전략
CSS 변수를 활용하여 `:root`(라이트)와 `[data-theme="dark"]`(다크)로 전환한다.
```
/* 라이트 모드 (기본) */
:root {
    --color-background: #ffffff;
    --color-surface: #f9fafb;
    --color-text-primary: #1f2937;
    --color-text-secondary: #6b7280;
    --color-border: #e5e7eb;
}

/* 다크 모드 */
[data-theme="dark"] {
    --color-background: #111827;
    --color-surface: #1f2937;
    --color-text-primary: #f9fafb;
    --color-text-secondary: #9ca3af;
    --color-border: #374151;
}
```

### 다크 모드 규칙
- 순수 검정(#000000) 사용 금지 → `#111827` 또는 `#0f172a` 권장 (눈 피로 감소)
- 순수 흰색(#ffffff) 텍스트 지양 → `#f9fafb` 또는 `#f3f4f6` 권장
- 그림자: 다크 모드에서는 그림자 대신 **밝은 테두리(border)**로 깊이 표현
- 브랜드 컬러: 명도를 10~20% 올려서 다크 배경에서도 대비 유지
- 이미지/아이콘: 밝은 배경 전제인 이미지는 다크 모드용 대체 필요
- `prefers-color-scheme` 미디어 쿼리로 OS 설정 자동 감지:
```
@media (prefers-color-scheme: dark) {
    :root { /* 다크 모드 변수 */ }
}
```

## 18. 접근성 체크리스트 (Accessibility)
WCAG 2.1 AA 기준. 모든 페이지에서 아래를 충족해야 한다.

### 필수 항목
- [ ] 모든 이미지에 `alt` 속성 (장식용은 `alt=""`)
- [ ] 모든 인터랙티브 요소에 `:focus-visible` 스타일
- [ ] 색상만으로 정보를 전달하지 않음 (아이콘/텍스트 병행)
- [ ] 폼 인풋에 연결된 `<label>` 또는 `aria-label`
- [ ] 모달 열림 시 포커스 트랩 (모달 밖으로 탭 이동 불가)
- [ ] 모달 닫힘 시 이전 포커스 위치로 복귀
- [ ] 에러 메시지가 스크린 리더에 전달됨 (`aria-live="polite"` 또는 `role="alert"`)
- [ ] 키보드만으로 모든 기능 사용 가능 (Enter, Space, Escape, Tab, Arrow)
- [ ] `prefers-reduced-motion` 미디어 쿼리로 애니메이션 비활성화 옵션
- [ ] 텍스트 200% 확대 시 레이아웃 깨지지 않음

### 시맨틱 HTML 우선
- 버튼은 `<button>`, 링크는 `<a>` — `<div onclick>` 사용 금지
- 리스트는 `<ul>/<ol>`, 표는 `<table>` — `<div>` 남발 금지
- 섹션 구분: `<header>`, `<main>`, `<nav>`, `<footer>`, `<aside>` 사용
- 헤딩 순서: h1 → h2 → h3 순차적으로 (h1 다음에 h3 금지)
```
```

---

## 카테고리별 상세 설명

### 왜 8pt Grid인가?
업계 표준입니다. Apple, Google(Material Design), Microsoft(Fluent) 모두 8pt 기반 시스템을 사용합니다.
8의 배수는 다양한 화면 밀도(1x, 1.5x, 2x, 3x)에서 깨끗하게 렌더링되며, 5pt나 7pt 같은 홀수 기반은 1.5x 스케일에서 반픽셀 블러링이 발생합니다.

### Type Scale 비율 선택 가이드
프로젝트 성격에 따라 비율을 조정하세요:

| 비율   | 이름           | 적합한 프로젝트                    |
|--------|----------------|-------------------------------------|
| 1.067  | Minor Second   | 데이터 대시보드, 밀집 UI             |
| 1.125  | Major Second   | 블로그, 문서, 모바일 앱              |
| 1.200  | Minor Third    | SaaS, 기업 웹사이트                  |
| 1.250  | Major Third    | **범용 (가장 추천)**                 |
| 1.333  | Perfect Fourth | 뉴스, 매거진, 에디토리얼             |
| 1.618  | Golden Ratio   | 랜딩페이지, 마케팅 (간격 큼 주의)    |

### 터치 타겟 사이즈 정리
각 플랫폼의 가이드라인:

| 플랫폼           | 최소 터치 타겟   |
|------------------|------------------|
| WCAG 2.2 AA      | 24×24px          |
| WCAG 2.1 AAA     | 44×44px          |
| Apple iOS (HIG)  | 44×44pt          |
| Google (Material)| 48×48dp          |
| Microsoft (Fluent)| 40×40px         |

**실무 권장**: 모든 인터랙티브 요소는 최소 44×44px 터치 영역 확보.

### 왜 포커스 링이 중요한가?
전체 인터넷 사용자의 약 15~20%가 키보드, 스크린 리더, 스위치 등 보조 기술을 사용합니다. `outline: none`으로 포커스 링을 제거하면 이 사용자들은 현재 어디에 있는지 알 수 없습니다. `:focus-visible`은 마우스 클릭 시에는 포커스 링을 숨기고, 키보드 탭 시에만 표시하므로 양쪽 모두 만족시킵니다.

### 빈 상태를 왜 따로 디자인하는가?
사용자가 서비스에 처음 가입하면 데이터가 하나도 없습니다. 이때 빈 화면(흰 배경 + 아무 것도 없음)을 보면 "이거 오류인가?" "뭘 해야 하지?"라고 느낍니다. 빈 상태에 안내 메시지 + 행동 유도 버튼을 넣으면 첫 전환율(프로젝트 등록 등)이 크게 올라갑니다. Mailchimp, Notion, Linear 등 성공적인 SaaS는 모두 빈 상태를 공들여 디자인합니다.

### 스켈레톤 vs 스피너, 언제 뭘 쓰는가?
- **스켈레톤**: 콘텐츠의 구조를 미리 보여주므로 사용자가 "곧 뭔가 나오겠구나" 기대감을 가짐. 전체 페이지 로딩에 적합.
- **스피너**: 동작의 결과를 기다리는 상황 (버튼 클릭 후 저장, 검색 결과 로딩). 구조가 아닌 "처리 중"임을 전달.
- **아무것도 안 보여주기**: 200ms 이내 응답이면 로딩 UI 자체가 오히려 깜빡여서 방해됨. 일부러 지연을 넣지 않는다.

### 다크 모드는 선택이 아니라 접근성인가?
트렌드가 아닙니다. 저시력 사용자, 눈 피로가 심한 사용자, 야간 작업자에게 다크 모드는 필수입니다. WCAG에 직접적으로 다크 모드를 요구하지는 않지만, "사용자 선호 설정 존중" 원칙에 해당합니다. `prefers-color-scheme` 미디어 쿼리는 모든 모던 브라우저가 지원합니다. 처음부터 CSS 변수로 색상을 관리하면 다크 모드 전환은 변수 값만 바꾸면 되므로 비용이 거의 없습니다.

---

## 추가 팁: claude.md 활용 극대화

### 1. 프로젝트별 커스터마이징
위 템플릿은 범용입니다. 실제 사용 시:
- 브랜드 컬러를 구체적 HEX로 채우세요
- 사용할 폰트 패밀리를 명시하세요 (예: "Pretendard, Noto Sans KR")
- 프로젝트에 안 쓰는 컴포넌트는 제거하세요

### 2. 네거티브 룰 (하지 말 것)도 명시
Claude Code는 "하지 마" 지시도 잘 따릅니다:
```markdown
## 금지 사항
- opacity로 텍스트 색상 조절 금지 (접근성 문제)
- !important 사용 금지
- 인라인 스타일 금지
- 12px 미만 폰트 사용 금지
- 토큰에 없는 임의 수치 사용 금지
- z-index 임의 값 사용 금지
- outline: none 단독 사용 금지 (반드시 :focus-visible 대체 스타일 제공)
- <div onclick> 금지 (버튼은 <button>, 링크는 <a> 사용)
- 색상만으로 상태 구분 금지 (아이콘/텍스트 병행)
- 순수 검정(#000) 배경 금지 (다크 모드 시 #111827 이상 사용)
- 로딩 중 빈 화면 방치 금지 (스켈레톤 또는 스피너 표시)
- disabled 요소에서 title/tooltip만으로 이유 설명 금지 (시각적으로 표시)
```

### 3. 컴포넌트 예시 코드 포함
특정 컴포넌트의 "정답 코드"를 하나 넣어두면 나머지도 같은 패턴으로 생성합니다:
```markdown
## Button 컴포넌트 예시
\`\`\`tsx
<Button variant="primary" size="md">확인</Button>
// → height: 40px, px: 16px, font-size: 14px, radius: 8px
\`\`\`
```

### 4. Tailwind 사용 시 커스텀 테마 명시
```markdown
## Tailwind Config
spacing은 다음만 사용: 1(4px), 2(8px), 3(12px), 4(16px), 6(24px), 8(32px), 12(48px), 16(64px)
fontSize는 다음만 사용: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(32px), 4xl(40px), 5xl(48px)
```