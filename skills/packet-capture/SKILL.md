---
name: packet-capture
description: |
  웹사이트의 네트워크 패킷(API 요청/응답)을 캡처하고 분석하는 스킬.
  Playwright MCP로 브라우저를 실제로 조작하면서 발생하는 네트워크 트래픽을
  캡처하여, DOM 파싱(Selenium 방식) 대신 실제 API 엔드포인트와 응답 구조를 추출한다.

  사용자가 "패킷", "API 추출", "네트워크 캡처", "요청 분석", "XHR", "fetch 요청",
  "API 따기", "패킷 따기", "트래픽 분석", "엔드포인트 찾기", "API 역분석",
  "packet", "network", "intercept", "request capture" 등을 언급하면 이 스킬을 호출하라.

  이 스킬 없이 웹 스크래핑을 시도하면 DOM 파싱에 의존하게 되어
  사이트 구조 변경에 취약하고, 실제 데이터 소스인 API를 놓치게 된다.
---

# 패킷 캡처 & API 추출

## 핵심 원리

웹사이트는 브라우저에 HTML을 보여주지만, 실제 데이터는 **백그라운드 API 호출**로 가져온다.
이 스킬은 Playwright MCP로 브라우저를 조작하면서 **네트워크 탭에서 보이는 요청들**을 캡처하여,
Selenium처럼 HTML을 파싱하는 대신 **API 엔드포인트 자체**를 추출한다.

```
[Selenium 방식] 페이지 로드 → HTML 파싱 → 데이터 추출 (사이트 변경에 취약)
[패킷 방식]     페이지 로드 → 네트워크 요청 캡처 → API 구조 추출 (안정적)
```

## 워크플로우

### Phase 1: 타겟 분석 + 네트워크 모니터링 시작

1. **브라우저 열기 + 네트워크 모니터링 활성화**
   ```
   browser_navigate → 타겟 URL로 이동
   ```

2. **초기 페이지 로드 패킷 캡처**
   ```
   browser_network_requests → 페이지 로드 시 발생한 모든 요청 수집
   ```

3. **API 요청 필터링**
   - XHR/Fetch 요청만 필터 (이미지, CSS, JS 등 정적 리소스 제외)
   - JSON 응답을 반환하는 요청에 집중
   - 필터 기준:
     - Content-Type: `application/json`, `text/json`, `application/x-www-form-urlencoded`
     - URL 패턴: `/api/`, `/v1/`, `/graphql`, `.json`, `/ajax/`
     - Method: GET, POST (데이터 요청)

### Phase 2: 사용자 시나리오 시뮬레이션

사용자가 지정한 동작을 Playwright MCP로 시뮬레이션하면서 추가 패킷 캡처:

1. **동작 시뮬레이션**
   ```
   browser_snapshot → 현재 페이지 구조 파악
   browser_click / browser_fill_form / browser_select_option → 사용자 동작 시뮬레이션
   browser_wait_for → 응답 대기
   ```

2. **동작별 네트워크 요청 캡처**
   ```
   browser_network_requests → 동작 후 발생한 새 요청 수집
   ```

3. **페이지네이션/무한 스크롤 처리**
   - 스크롤: `browser_evaluate` → `window.scrollTo(0, document.body.scrollHeight)`
   - 다음 페이지: `browser_click` → 페이지 버튼
   - 각 동작 후 `browser_network_requests`로 새 요청 캡처

4. **반복 패턴 감지**
   - 동일 엔드포인트에 다른 파라미터로 요청되는 패턴 식별
   - 페이지네이션 파라미터 (page, offset, cursor) 추출
   - 검색/필터 파라미터 추출

### Phase 3: 패킷 분석 + API 구조 정리

캡처된 요청들을 분석하여 구조화:

1. **각 API 엔드포인트에 대해 정리**

   ```
   ## 엔드포인트: GET /api/v1/products
   
   ### 요청
   - URL: https://example.com/api/v1/products
   - Method: GET
   - Headers:
     - Authorization: Bearer {token}
     - Accept: application/json
   - Query Parameters:
     - page: 1 (페이지네이션)
     - limit: 20 (페이지 크기)
     - category: "electronics" (필터)
   
   ### 응답
   - Status: 200
   - Content-Type: application/json
   - Body 구조:
     {
       "data": [
         {
           "id": 12345,
           "name": "상품명",
           "price": 29900,
           "category": "electronics"
         }
       ],
       "pagination": {
         "total": 1500,
         "page": 1,
         "limit": 20,
         "hasNext": true
       }
     }
   ```

2. **인증/세션 정보 식별**
   - Cookie 기반 인증: 어떤 쿠키가 필요한지
   - Token 기반 인증: Authorization 헤더 형식
   - CSRF 토큰: 어디서 발급받는지
   - 세션 유지에 필요한 최소 헤더 셋

3. **요청 의존성 맵**
   ```
   1. GET /api/auth/token (인증)
      ↓ token 획득
   2. GET /api/v1/categories (카테고리 목록)
      ↓ category_id 사용
   3. GET /api/v1/products?category={id} (상품 목록)
      ↓ product_id 사용
   4. GET /api/v1/products/{id}/detail (상품 상세)
   ```

### Phase 4: 자동화 코드 생성

분석 결과를 바탕으로 코드 생성:

1. **순수 HTTP 요청 코드** (Selenium/Playwright 불필요)
   - Python: `requests` 또는 `httpx`
   - JavaScript: `fetch` 또는 `axios`
   - 필요한 헤더, 쿠키, 인증 포함
   - 페이지네이션 자동 처리

2. **생성 코드 템플릿**

   ```python
   # 예시: Python requests 기반
   import requests
   
   session = requests.Session()
   session.headers.update({
       'User-Agent': '...',
       'Accept': 'application/json',
   })
   
   # 1. 인증 (필요한 경우)
   auth_response = session.post('https://example.com/api/auth', json={...})
   token = auth_response.json()['token']
   session.headers['Authorization'] = f'Bearer {token}'
   
   # 2. 데이터 수집
   page = 1
   all_data = []
   while True:
       response = session.get(f'https://example.com/api/v1/products?page={page}&limit=100')
       data = response.json()
       all_data.extend(data['data'])
       if not data['pagination']['hasNext']:
           break
       page += 1
   
   print(f"총 {len(all_data)}건 수집 완료")
   ```

3. **에러 핸들링 + 재시도 로직 포함**
   - Rate limiting 감지 (429 응답)
   - 재시도 간격 (exponential backoff)
   - 타임아웃 설정

## 사용자 인터페이스

### 시작 시 확인할 정보

사용자에게 다음을 물어본다:

1. **타겟 URL**: 어떤 사이트/페이지를 분석할지
2. **목표 데이터**: 어떤 데이터를 추출하고 싶은지
3. **시뮬레이션 동작**: 어떤 동작을 해야 데이터가 나오는지
   - 로그인 필요 여부
   - 검색/필터 조건
   - 스크롤/페이지네이션 여부
4. **출력 형태**: Python/JavaScript/cURL 중 선호

### 결과 보고

```markdown
## 패킷 캡처 결과

### 발견된 API 엔드포인트: N개
1. GET /api/v1/... — 상품 목록 (JSON, 페이지네이션)
2. POST /api/v1/... — 검색 (JSON)
3. ...

### 인증 방식
- Cookie 기반 / Token 기반 / 불필요

### 자동화 코드
- 생성된 코드 파일: scripts/packet_crawler.py

### 주의사항
- Rate limit: 초당 N회 제한 감지됨
- 인증 토큰 만료: N분마다 갱신 필요
```

## 주의사항

- **robots.txt 확인**: 타겟 사이트의 크롤링 정책을 먼저 확인한다
- **Rate limiting 준수**: 서버에 과부하를 주지 않도록 요청 간격을 둔다
- **개인정보 주의**: 캡처된 응답에 개인정보가 포함될 수 있으므로 주의한다
- **인증 정보 보안**: 추출된 토큰/쿠키를 코드에 하드코딩하지 않고 환경변수로 관리한다
