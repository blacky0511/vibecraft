# 네이버 스마트스토어 API 참조 지식

> **최종 확인일: 2026-03-30**
> 이 문서는 naver-logic-analyzer 에이전트가 스마트스토어 관련 문제를 진단할 때 참조하는 지식 베이스이다.
>
> **주의: 이 문서의 API 경로는 추정치이며, 구현 시 반드시 실제 네이버 커머스 API 문서(https://commerce.naver.com/seller)를 기반으로 검증해야 한다.**

---

## 1. 스마트스토어 API 체계 (commerce.naver.com)

### 개요

네이버 스마트스토어는 네이버 커머스 플랫폼의 판매자용 서비스이다. API는 크게 두 가지로 나뉜다:

```
[공식 API]
- 네이버 커머스 API (commerce.naver.com)
- 파트너 센터에서 애플리케이션 등록 후 사용
- OAuth 2.0 기반 인증
- 문서: https://commerce.naver.com/seller (판매자 센터)

[비공식 API]
- 스마트스토어 센터 웹 인터페이스의 내부 API
- 브라우저 세션(NID 인증) 기반
- 공식 문서 없음 — 브라우저 개발자 도구에서 역공학
- 변경 시 사전 공지 없음
```

### API 베이스 URL (추정)

```
공식 API: https://commerce.naver.com/api/
판매자 센터: https://sell.smartstore.naver.com/
파트너 API: https://api.commerce.naver.com/external/
```

---

## 2. 상품 등록/수정/삭제 API

### 상품 등록

```
POST /api/products

필수 필드:
- productName: 상품명 (최대 100자)
- salePrice: 판매가
- categoryId: 카테고리 코드
- stockQuantity: 재고 수량
- images: 상품 이미지 (최소 1장, 최대 10장)
- detailContent: 상품 상세 설명 (HTML)

선택 필드:
- originAreaInfo: 원산지 정보
- deliveryInfo: 배송 정보 (배송비, 무료배송 조건 등)
- optionInfo: 옵션 정보 (색상, 사이즈 등)
- tags: 검색 태그
- seoInfo: SEO 정보 (메타 태그)

주의사항:
- 대량 등록 시 봇 감지 엄격 (분당 등록 건수 제한)
- 이미지 업로드는 별도 API 경유 (CDN 서버로 업로드 후 URL 참조)
- 카테고리 코드는 주기적으로 변경됨 → 최신 카테고리 목록 조회 API 활용
```

### 상품 수정

```
PUT /api/products/{productId}

수정 가능 필드:
- 상품명, 가격, 재고, 설명, 이미지, 옵션 등 거의 모든 필드
- 가격 변경 빈도 제한 존재 (단시간 내 반복 변경 시 제한)

주의사항:
- 상품 상태 변경: 판매중 / 품절 / 숨김 / 판매종료
- 가격 변경 시 네이버 쇼핑 최저가 갱신에 시간 소요 (수 시간~1일)
```

### 상품 삭제

```
DELETE /api/products/{productId}

주의사항:
- 주문이 진행 중인 상품은 삭제 불가
- 삭제 대신 "숨김" 처리 권장 (데이터 보존)
```

### 상품 목록/상세 조회

```
GET /api/products?page={page}&size={size}
GET /api/products/{productId}

응답 구조 (추정):
{
  "products": [
    {
      "productId": "상품ID",
      "productName": "상품명",
      "salePrice": 가격,
      "stockQuantity": 재고,
      "status": "판매중/품절/숨김",
      "categoryId": "카테고리코드",
      "images": ["이미지URL1", "이미지URL2"],
      "createdAt": "등록일시",
      "updatedAt": "수정일시"
    }
  ],
  "totalCount": 전체수,
  "page": 현재페이지,
  "size": 페이지크기
}
```

### 이미지 업로드

```
POST /api/products/images/upload
Content-Type: multipart/form-data

- 이미지 파일을 CDN에 업로드
- 응답으로 이미지 URL 반환
- 상품 등록/수정 시 이 URL을 참조
- 지원 형식: JPG, PNG, GIF
- 최대 크기: 10MB (추정)
- 권장 크기: 1000x1000px 이상 (정사각형)
```

---

## 3. 주문 관리

### 주문 목록 조회

```
GET /api/orders?status={status}&startDate={날짜}&endDate={날짜}

주문 상태(status) 값:
- PAY_WAITING: 결제 대기
- PAYED: 결제 완료
- DELIVERING: 배송 중
- DELIVERED: 배송 완료
- PURCHASE_DECIDED: 구매 확정
- EXCHANGED: 교환
- RETURNED: 반품
- CANCELED: 취소
```

### 주문 상세 조회

```
GET /api/orders/{orderId}

응답 포함 정보:
- 주문자 정보 (이름, 연락처, 주소)
- 주문 상품 목록
- 결제 정보 (결제 수단, 금액)
- 배송 정보 (택배사, 운송장 번호)
- 주문 상태 이력
```

### 발송 처리

```
PUT /api/orders/{orderId}/ship

필수 필드:
- deliveryCompany: 택배사 코드
- trackingNumber: 운송장 번호

주의사항:
- 결제 완료 상태의 주문만 발송 처리 가능
- 발송 처리 후 구매자에게 자동 알림
```

### 반품/교환 처리

```
POST /api/orders/{orderId}/return
POST /api/orders/{orderId}/exchange

반품 사유:
- 단순 변심
- 상품 불량
- 배송 오류
- 기타
```

---

## 4. 리뷰 수집

### 리뷰 목록 조회

```
GET /api/products/{productId}/reviews?page={page}&size={size}

응답 구조 (추정):
{
  "reviews": [
    {
      "reviewId": "리뷰ID",
      "rating": 별점(1~5),
      "content": "리뷰 내용",
      "writerName": "작성자 (마스킹)",
      "writtenAt": "작성일시",
      "hasPhoto": true/false,
      "photos": ["사진URL1"],
      "reply": {
        "content": "판매자 답변",
        "repliedAt": "답변일시"
      }
    }
  ],
  "totalCount": 전체리뷰수,
  "averageRating": 평균별점
}
```

### 리뷰 답변

```
POST /api/products/{productId}/reviews/{reviewId}/reply

필수 필드:
- content: 답변 내용

주의사항:
- 판매자 계정으로만 답변 가능
- 답변 수정/삭제 가능
- 답변 후 구매자에게 알림
```

### 리뷰 통계

```
GET /api/products/{productId}/reviews/statistics

응답 포함 정보:
- 별점 분포 (1점~5점 각 비율)
- 포토 리뷰 비율
- 텍스트 리뷰 비율
- 총 리뷰 수
- 평균 별점
```

### 리뷰 관련 법적 경고

```
리뷰 자동 생성/조작은 불법이다.

- 공정거래법 위반: 허위/과장 광고
- 표시광고법 위반: 기만적 표시/광고
- 제재: 과태료 최대 2억원, 시정 명령, 네이버 계정 영구 정지
- 실제 사례: 가짜 리뷰 작성 대행업체 공정거래위원회 제재 다수

허용되는 것:
- 리뷰 목록 조회 (읽기)
- 리뷰 답변 작성 (판매자 본인)
- 리뷰 통계 수집/분석
- 리뷰 내용 기반 상품 개선 분석

금지되는 것:
- 가짜 구매 후 리뷰 작성
- 타인에게 리뷰 대가 지급 (공식 포인트 리뷰 제외)
- 경쟁사 상품에 악성 리뷰 작성
- 봇을 이용한 리뷰 자동 생성
```

---

## 5. 커머스 API 인증 (OAuth 2.0 기반)

### 인증 흐름

```
[공식 파트너 API — OAuth 2.0]

1단계: 애플리케이션 등록
  - 네이버 커머스 파트너 센터에서 앱 등록
  - client_id + client_secret 발급

2단계: 인증 코드 요청
  GET https://commerce.naver.com/oauth2/authorize
    ?response_type=code
    &client_id={client_id}
    &redirect_uri={redirect_uri}
    &state={csrf_state}

3단계: 액세스 토큰 발급
  POST https://commerce.naver.com/oauth2/token
  Content-Type: application/x-www-form-urlencoded
  Body:
    grant_type=authorization_code
    &code={authorization_code}
    &client_id={client_id}
    &client_secret={client_secret}

4단계: API 호출
  GET /api/products
  Authorization: Bearer {access_token}

5단계: 토큰 갱신
  POST https://commerce.naver.com/oauth2/token
  Body:
    grant_type=refresh_token
    &refresh_token={refresh_token}
    &client_id={client_id}
    &client_secret={client_secret}
```

### 토큰 수명

| 항목 | 값 (추정) |
|------|----------|
| Access Token 유효 기간 | 1시간 |
| Refresh Token 유효 기간 | 30일 |
| 토큰 갱신 | Refresh Token으로 새 Access Token 발급 |

### 비공식 인증 (스마트스토어 센터 웹)

```
[NID 인증 기반 세션]
1. nid.naver.com 로그인 (bvsd + encData 필요)
2. 판매자 계정 확인 (판매자 권한 필요)
3. 스마트스토어 센터 세션 쿠키 발급
4. 세션 만료 시간: 약 1시간 (비활동 기준)

주의:
- 비공식 인증은 네이버 로그인 자동화에 해당
- bvsd/encData 처리 필요 → bot-detection.md 참조
- 세션 만료 시 자동 재로그인 로직 필요
- 2차 인증(Naver Guard) 대응 필요
```

### 인증 관련 공통 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| 401 Unauthorized | 토큰 만료/무효 | 토큰 갱신 또는 재발급 |
| 403 Forbidden | 권한 없음 (판매자 권한 미보유) | 판매자 계정 확인 |
| 429 Too Many Requests | API 호출 한도 초과 | 호출 빈도 줄이기, 재시도 대기 |
| invalid_grant | 인증 코드 만료/재사용 | 인증 코드 재요청 |
| invalid_client | client_id/secret 불일치 | 앱 설정 확인 |

---

## 6. 스마트스토어 진단 트리

에이전트가 스마트스토어 관련 문제를 진단할 때 아래 트리를 순서대로 따른다.

### 6-1. 인증 단계

```
[인증 방식 확인]
├── 공식 파트너 API (OAuth 2.0)?
│   ├── YES → OAuth 진단 경로
│   │   ├── client_id/client_secret 유효?
│   │   │   ├── NO → 파트너 센터에서 앱 설정 확인
│   │   │   └── YES ↓
│   │   ├── Access Token 유효?
│   │   │   ├── NO → 만료 여부 확인
│   │   │   │   ├── 만료 → Refresh Token으로 갱신
│   │   │   │   └── Refresh Token도 만료 → 재인증 필요
│   │   │   └── YES ↓
│   │   ├── 권한 스코프 충분?
│   │   │   ├── NO → 앱에 필요한 권한 추가
│   │   │   └── YES ↓
│   │   └── API 호출 성공? → 다음 단계로
│   │
│   └── NO → 비공식(NID 세션) 진단 경로
│       ├── NID 로그인 성공?
│       │   ├── NO → auth.md + bot-detection.md 참조
│       │   └── YES ↓
│       ├── 판매자 권한 확인?
│       │   ├── NO → 판매자 계정이 아닌 일반 계정
│       │   └── YES ↓
│       ├── 스마트스토어 센터 세션 발급?
│       │   ├── NO → 추가 인증 또는 세션 쿠키 문제
│       │   └── YES ↓
│       └── 세션 만료 주기 확인 (약 1시간)
│           └── 자동 갱신 로직 구현 여부
```

### 6-2. 상품 관리 단계

```
[상품 등록 문제]
├── 필수 필드 누락?
│   ├── YES → 상품명/가격/카테고리/재고/이미지 확인
│   └── NO ↓
├── 카테고리 코드 유효?
│   ├── NO → 최신 카테고리 목록 조회 → 코드 업데이트
│   └── YES ↓
├── 이미지 업로드 성공?
│   ├── NO → 이미지 형식/크기 확인, 업로드 API 변경 여부
│   └── YES ↓
├── 대량 등록 시 봇 감지?
│   ├── YES → 등록 간격 조절 (건당 최소 수 초 대기)
│   │   ├── 한 번에 등록하는 상품 수 제한
│   │   └── 시간대 분산 (야간 대량 등록 지양)
│   └── NO ↓
├── 상품 등록 API 응답 오류?
│   ├── 400 → 파라미터 검증 실패 (에러 메시지 확인)
│   ├── 403 → 권한 문제 또는 차단
│   ├── 429 → 요청 한도 초과
│   └── 500 → 서버 오류 (재시도)
│
[상품 수정 문제]
├── 가격 변경 빈도 제한?
│   ├── YES → 변경 간격 확인 (최소 수 시간 권장)
│   └── NO ↓
├── 상품 상태 전환 오류?
│   ├── 판매중 → 품절: 재고 0으로 변경
│   ├── 품절 → 판매중: 재고 추가 필요
│   └── 삭제 불가: 진행 중인 주문 있음
│
[가격 모니터링]
├── 경쟁사 가격 조회 방식?
│   ├── 공식 API → 쇼핑 검색 API (openapi.naver.com/v1/search/shop.json)
│   ├── 비공식 → smartstore.naver.com 크롤링
│   │   └── ⚠️ 대량 크롤링 시 업무방해 가능
│   └── 네이버 쇼핑 가격비교 페이지 파싱
```

### 6-3. 주문 관리 단계

```
[주문 조회 문제]
├── 주문 목록 API 응답 정상?
│   ├── NO → 인증 토큰 확인, API 엔드포인트 변경 여부
│   └── YES ↓
├── 주문 상태 필터 정상 작동?
│   ├── NO → status 파라미터 값 확인 (대소문자, 신규 상태 추가 여부)
│   └── YES ↓
├── 날짜 범위 조회 정상?
│   └── 날짜 형식 확인 (YYYY-MM-DD 또는 timestamp)

[발송 처리 문제]
├── 택배사 코드 유효?
│   ├── NO → 최신 택배사 목록 조회
│   └── YES ↓
├── 운송장 번호 형식 정상?
│   ├── NO → 택배사별 운송장 번호 형식 확인
│   └── YES ↓
├── 발송 처리 API 응답 오류?
│   ├── 400 → 이미 발송 처리된 주문 / 상태 불일치
│   └── 403 → 권한 문제
│
[반품/교환 처리]
├── 반품 요청 API 정상?
├── 반품 사유 코드 유효?
└── 반품 상태 변경 확인
```

### 6-4. 리뷰 관리 단계

```
[리뷰 조회 문제]
├── 리뷰 목록 API 응답 정상?
│   ├── NO → 인증 확인, API 변경 여부
│   └── YES ↓
├── 리뷰 데이터 파싱 정상?
│   ├── NO → 응답 JSON 구조 변경 확인
│   └── YES ↓
├── 리뷰 통계 집계 정상?
│   └── 별점 분포, 포토 리뷰 비율 계산 로직 확인

[리뷰 답변 문제]
├── 답변 작성 API 정상?
│   ├── 403 → 판매자 계정 확인
│   ├── 400 → 답변 내용 검증 실패 (길이 제한 등)
│   └── 200 → 성공
│
[리뷰 관련 법적 체크 — 필수]
├── ⚠️ 리뷰 자동 생성 시도?
│   ├── YES → 즉시 경고 출력
│   │   ├── 공정거래법 위반: 과태료 최대 2억원
│   │   ├── 표시광고법 위반: 시정 명령
│   │   ├── 네이버 계정 영구 정지
│   │   └── 대안 제시: 합법적 리뷰 유도 방법
│   └── NO → 조회/답변만 → 합법
```

---

## 7. 가격 모니터링 상세

### 모니터링 방법

```
[방법 1: 공식 쇼핑 검색 API]
- GET openapi.naver.com/v1/search/shop.json?query={상품명}
- 장점: 합법, 안정적
- 단점: 검색 결과 기반이므로 정확한 가격 비교 어려울 수 있음
- Rate Limit: 일 25,000건

[방법 2: 네이버 쇼핑 가격비교 페이지]
- https://search.shopping.naver.com/search/all?query={상품명}
- 비공식 크롤링 — 봇 감지 주의
- 최저가, 가격 추이 정보 포함

[방법 3: 개별 스마트스토어 페이지]
- smartstore.naver.com/{스토어명}/products/{productId}
- 개별 상품 가격 직접 확인
- 대량 접근 시 봇 감지 트리거
```

### 모니터링 주의사항

```
- 가격 수집 자체는 공개 정보 수집이므로 원칙적으로 합법
- 다만, 과도한 빈도로 서버에 부하를 주면 업무방해 가능
- 권장: 공식 쇼핑 API 우선, 부족한 경우 비공식 크롤링 보조
- 크롤링 간격: 최소 수 초 이상, 일 수천 건 이하 권장
```

---

## 8. 정산 관리

### 정산 조회

```
GET /api/settlements?startDate={날짜}&endDate={날짜}

응답 포함 정보:
- 정산 금액 (판매금액 - 수수료 - 반품)
- 수수료 내역 (네이버 수수료, 결제 수수료)
- 정산 예정일
- 정산 완료 여부

CSV 추출:
- 정산 내역을 CSV로 다운로드하는 API 또는 웹 기능
- 회계/세무 용도로 활용
```

---

## 참고

- 네이버 커머스 API 공식 문서: https://commerce.naver.com/seller (판매자 센터 내 API 문서)
- 네이버 쇼핑 검색 API: https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md
- 스마트스토어 센터: https://sell.smartstore.naver.com
- 이 문서의 API 경로와 파라미터는 추정치이므로, 실제 구현 전 반드시 공식 문서에서 최신 스펙을 확인할 것
