---
name: preset-python
description: |
  Python 프로젝트가 감지되었을 때 자동으로 활성화되는 프리셋 스킬.
  네이밍, 디렉토리 구조, 의존성 관리, 가상환경, 테스트, 린트, 타입 힌트 규칙을 AI에게 제공한다.
  Flask, Django, FastAPI 등 주요 프레임워크별 추가 가이드도 포함한다.

  Triggers: Python, Flask, Django, FastAPI, pip, requirements.txt, pyproject.toml, .py, venv, conda
---

# Python 프리셋 (preset-python)

## 역할

`requirements.txt`, `pyproject.toml`, `setup.py`, `.py` 파일, 또는 `import` 키워드가 감지되면 이 스킬이 자동 활성화된다.
Python 프로젝트의 개발 표준을 AI에게 주입한다.

---

## 자동 감지 조건

아래 파일 또는 키워드 중 하나 이상이 프로젝트에 존재하면 활성화한다.

| 감지 항목 | 예시 |
|----------|------|
| 의존성 파일 | `requirements.txt`, `requirements-dev.txt`, `pyproject.toml`, `setup.py` |
| Python 파일 | `*.py` |
| 가상환경 폴더 | `venv/`, `.venv/`, `env/` |
| 프레임워크 파일 | `manage.py` (Django), `app.py` (Flask), `main.py` (FastAPI) |
| 설정 파일 | `.python-version`, `Pipfile` |

---

## 1. 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수명 | snake_case | `user_id`, `order_list` |
| 함수명 | snake_case | `get_user_by_id`, `create_order` |
| 클래스명 | PascalCase | `UserService`, `OrderRepository` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| 모듈(파일)명 | snake_case | `user_service.py`, `data_utils.py` |
| 패키지(폴더)명 | snake_case (소문자) | `user_management/`, `api_handlers/` |
| 비공개 속성/메서드 | 앞에 _ 접두사 | `_internal_method`, `_config` |

---

## 2. 디렉토리 구조 규칙

### 일반 Python 프로젝트
```
{프로젝트 루트}/
├── src/                    ← 소스 코드 (또는 패키지명 폴더)
│   └── {패키지명}/
│       ├── __init__.py
│       ├── main.py
│       └── {모듈명}.py
├── tests/                  ← 테스트 파일
│   ├── __init__.py
│   └── test_{모듈명}.py
├── docs/                   ← 문서
├── requirements.txt        ← 프로덕션 의존성
├── requirements-dev.txt    ← 개발 의존성 (pytest, ruff 등)
├── pyproject.toml          ← 프로젝트 메타데이터 및 설정
└── README.md
```

### Django 프로젝트
```
{프로젝트 루트}/
├── config/                 ← 프로젝트 설정 (settings.py, urls.py)
├── {앱 이름}/              ← Django 앱 (도메인별)
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── serializers.py      ← DRF 사용 시
│   └── tests.py
├── manage.py
└── requirements.txt
```

### FastAPI 프로젝트
```
{프로젝트 루트}/
├── app/
│   ├── main.py             ← FastAPI 앱 초기화
│   ├── routers/            ← 라우터 (도메인별)
│   ├── models/             ← Pydantic 모델 / SQLAlchemy ORM
│   ├── services/           ← 비즈니스 로직
│   └── dependencies.py     ← 의존성 주입
├── tests/
└── requirements.txt
```

---

## 3. 의존성 관리 규칙

### requirements.txt 방식 (소규모/스크립트 프로젝트)
```
# 버전을 명시하여 재현 가능한 환경을 만든다
requests==2.31.0
python-dotenv==1.0.0
```

- 프로덕션 의존성과 개발 의존성을 파일로 분리한다.
  - `requirements.txt` ← 실제 실행에 필요한 것
  - `requirements-dev.txt` ← 개발/테스트에만 필요한 것 (`-r requirements.txt` 포함)

### pyproject.toml 방식 (패키지/모던 프로젝트)
```toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "sqlalchemy>=2.0.0",
]

[project.optional-dependencies]
dev = ["pytest", "ruff", "mypy"]
```

- 새 의존성을 추가하기 전에 **반드시 사용자에게 확인**한다.

---

## 4. 가상환경 규칙

- **항상 가상환경을 사용한다.** 시스템 Python에 직접 패키지를 설치하지 않는다.

```bash
# 가상환경 생성 (Python 3.x)
python -m venv venv

# 가상환경 활성화
source venv/bin/activate      # macOS / Linux
venv\Scripts\activate         # Windows

# 의존성 설치
pip install -r requirements.txt

# 가상환경 비활성화
deactivate
```

- 가상환경 폴더(`venv/`, `.venv/`)는 `.gitignore`에 반드시 추가한다.

---

## 5. 타입 힌트 규칙

타입 힌트는 선택이 아닌 **권장 사항**이다. 새로 작성하는 코드에는 타입 힌트를 추가한다.

```python
# 기본 타입 힌트
def greet(name: str) -> str:
    return f"안녕하세요, {name}님!"

# 복잡한 타입 (Python 3.10+ 문법)
def process_users(user_ids: list[int]) -> dict[int, str]:
    ...

# Optional (값이 없을 수 있는 경우)
def find_user(user_id: int) -> User | None:
    ...

# 클래스 내 타입 힌트
class UserService:
    def __init__(self, db: Database) -> None:
        self.db = db

    def get_all_users(self) -> list[User]:
        ...
```

- Python 3.10 미만이면 `from typing import Optional, List, Dict`를 임포트해서 사용한다.
- `mypy` 또는 `pyright`로 타입 검사를 수행하는 것을 권장한다.

---

## 6. 테스트 규칙 (pytest)

```
tests/
├── __init__.py
├── conftest.py             ← 공통 픽스처 정의
├── test_{모듈명}.py        ← 테스트 파일 (test_ 접두사 필수)
└── {도메인}/
    └── test_{기능명}.py
```

```python
# 테스트 파일 예시 (tests/test_user_service.py)
import pytest
from app.services.user_service import UserService

# 픽스처: 테스트에서 반복 사용하는 객체를 미리 준비
@pytest.fixture
def user_service():
    return UserService(db=MockDatabase())

# 테스트 함수명은 한국어 또는 영어로 의도를 명확히 설명
def test_사용자_이메일로_조회_성공(user_service):
    # given (준비)
    email = "test@test.com"

    # when (실행)
    result = user_service.find_by_email(email)

    # then (검증)
    assert result is not None
    assert result.email == email

# 예외 테스트
def test_존재하지_않는_사용자_조회_시_예외_발생(user_service):
    with pytest.raises(UserNotFoundException):
        user_service.find_by_email("notexist@test.com")
```

- 테스트 실행: `pytest` 또는 `python -m pytest`
- 커버리지 확인: `pytest --cov=src`

---

## 7. 린트 및 코드 포맷 규칙

### ruff (권장 - 빠른 린터/포맷터)
```bash
# 코드 검사
ruff check .

# 자동 수정
ruff check --fix .

# 코드 포맷팅
ruff format .
```

`pyproject.toml` 설정 예시:
```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I"]  # E: pycodestyle, F: pyflakes, I: isort
```

### flake8 (대안)
```bash
flake8 src/ tests/
```

---

## 8. 환경변수 관리 규칙

- 비밀 키, DB 접속 정보 등은 코드에 직접 넣지 않는다.
- `python-dotenv` 라이브러리를 사용하여 `.env` 파일에서 환경변수를 로딩한다.

```python
# 환경변수 로딩 예시
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY 환경변수가 설정되지 않았습니다.")
```

- `.env` 파일은 `.gitignore`에 추가한다.
- `.env.example` 파일을 만들어 필요한 환경변수 목록을 문서화한다.

---

## 9. 흔한 실수 방지 (AI 자동 적용)

코드 작성 시 아래 패턴을 자동으로 피한다.

| 실수 | 올바른 방법 |
|------|-----------|
| `except:` 또는 `except Exception: pass` | 구체적 예외 타입 명시 + 로그 기록 |
| `print()` 디버깅 | `logging` 모듈 사용 |
| 가변 기본값 `def f(items=[])` | `def f(items=None)` → `items = items or []` |
| 파일/DB 연결 직접 열고 닫기 | `with` 문으로 자동 해제 |
| `import *` 사용 | 명시적으로 필요한 것만 import |
| 순환 임포트 발생 | 모듈 구조 재설계 또는 지연 임포트 |
| 비밀번호를 평문으로 저장 | bcrypt 또는 passlib으로 해싱 |

```python
# 좋은 예
try:
    result = process_data(data)
except ValueError as e:
    logger.error(f"데이터 처리 오류: {e}")
    raise

# 나쁜 예
try:
    result = process_data(data)
except:  # 모든 예외를 잡는 것은 위험하다
    pass  # 예외를 무시하는 것은 더 위험하다
```

---

## 10. 보안 규칙

- 비밀 키, DB 접속 정보, API 키는 코드에 직접 넣지 않는다. `.env` + `python-dotenv`로 관리한다.
- `.env` 파일은 `.gitignore`에 반드시 추가한다.
- SQL 쿼리는 파라미터 바인딩을 사용한다. f-string으로 쿼리를 조합하지 않는다.
- 사용자 입력값은 서버에서 반드시 검증한다. (Pydantic 모델, Django Form 등 활용)
- 비밀번호는 평문 저장 금지. `bcrypt` 또는 `passlib`으로 해싱한다.
- 에러 응답에 스택 트레이스나 내부 경로를 노출하지 않는다. 프로덕션에서는 `DEBUG=False`.
- `__init__.py`에서 필요한 것만 공개(export)하고, 내부 구현은 숨긴다.
