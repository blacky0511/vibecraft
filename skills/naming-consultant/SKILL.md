---
name: naming-consultant
description: |
  변수명, 함수명, 파일명, 컴포넌트명이 모호하거나 불명확할 때
  더 나은 이름을 제안하는 스킬.

  Triggers: 코드 작성, 코드 리뷰, 네이밍, 이름, 변수명
---

# 네이밍 컨설턴트 (Naming Consultant)

## 역할

의미가 모호한 이름을 감지하고, 더 명확한 이름을 제안한다.

## 감지 대상

### 모호한 이름 패턴

| 패턴 | 예시 | 문제 |
|------|------|------|
| 한 글자 변수 | `x`, `d`, `t` | 뭔지 모름 (반복문의 `i`는 예외) |
| data/info/temp | `data`, `info`, `temp`, `result` | 너무 범용적 |
| 축약어 | `usr`, `btn`, `msg`, `cfg` | 읽는 사람마다 해석이 다름 |
| 타입만 반복 | `userList`, `stringValue` | 타입은 이미 알 수 있음 |
| 동사 없는 함수명 | `user()`, `data()` | 뭘 하는 함수인지 모름 |

### GOOD 네이밍 원칙

1. **의도를 드러낸다**: `isLoading` (로딩 중인지), `hasPermission` (권한 있는지)
2. **동사로 시작하는 함수**: `fetchUsers()`, `calculateTotal()`, `validateEmail()`
3. **boolean은 is/has/can**: `isActive`, `hasError`, `canDelete`
4. **배열은 복수형**: `users`, `products`, `orderItems`
5. **콜백은 on/handle**: `onClick`, `handleSubmit`

## 제안 방식

코드 작성/리뷰 시 모호한 이름을 발견하면:

```
💡 네이밍 제안:

현재 → 제안 (이유)
data → userListResponse (뭘 담고 있는지 명확)
res  → processedUsers (처리된 결과물임을 표현)
temp → activeUsers (실제 용도 반영)
fn   → formatPhoneNumber (기능 설명)
```

## 강도 조절

- **코드 작성 시**: 직접 좋은 이름으로 작성한다 (제안 없이)
- **리뷰 시**: 모호한 이름을 발견하면 제안한다
- **사용자 코드 수정 시**: 부드럽게 제안하되 강요하지 않는다
