---
name: preset-spring
description: |
  Spring Boot 프로젝트가 감지되었을 때 자동으로 활성화되는 프리셋 스킬.
  계층 구조, 패키지 규칙, 어노테이션, 테스트, 보안 등 Spring Boot 개발 표준을 AI에게 제공한다.

  Triggers: Spring Boot, Java, Gradle, Maven, JPA, MyBatis, build.gradle, pom.xml, @SpringBootApplication
---

# Spring Boot 프리셋 (preset-spring)

## 역할

`build.gradle`, `pom.xml`, `@SpringBootApplication` 등이 감지되면 이 스킬이 자동 활성화된다.
Spring Boot 프로젝트에서 지켜야 할 구조, 네이밍, 테스트, 보안 규칙을 AI에게 주입한다.

---

## 자동 감지 조건

아래 파일 또는 키워드 중 하나 이상이 프로젝트에 존재하면 활성화한다.

| 감지 항목 | 예시 |
|----------|------|
| 빌드 파일 | `build.gradle`, `build.gradle.kts`, `pom.xml` |
| 메인 클래스 어노테이션 | `@SpringBootApplication` |
| 의존성 키워드 | `spring-boot-starter`, `spring-boot-starter-web` |
| 설정 파일 | `application.yml`, `application.properties` |

---

## 1. 계층 구조 규칙

Spring Boot 프로젝트는 반드시 아래 4계층 구조를 따른다.

```
Controller (요청/응답 처리)
    ↓
Service (비즈니스 로직)
    ↓
Repository (데이터 접근)
    ↓
Entity / DTO (데이터 모델)
```

- **Controller**는 Service만 호출한다. Repository를 직접 호출하지 않는다.
- **Service**는 Repository를 통해 데이터를 처리하고, 비즈니스 로직을 담는다.
- **Repository**는 데이터베이스 접근만 담당한다. 비즈니스 로직을 넣지 않는다.
- **Entity**는 DB 테이블과 1:1로 매핑한다. API 응답에 직접 사용하지 않는다.
- **DTO(Data Transfer Object)**를 사용해 요청/응답 데이터를 Entity와 분리한다.

---

## 2. 패키지 구조 규칙

```
com.example.{프로젝트명}.{도메인명}
├── controller/     ← @RestController 또는 @Controller
├── service/        ← @Service
├── repository/     ← @Repository 또는 JPA Repository 인터페이스
├── entity/         ← @Entity
├── dto/            ← 요청(Request) / 응답(Response) DTO
├── config/         ← @Configuration (보안, DB 등 설정 클래스)
└── exception/      ← 커스텀 예외, @ControllerAdvice
```

- 도메인 단위로 패키지를 묶는다. (예: `user`, `product`, `order`)
- 공통 유틸, 상수는 `common/` 또는 `global/` 패키지에 모은다.

---

## 3. 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스명 | PascalCase | `UserService`, `OrderController` |
| 메서드명 | camelCase | `findUserById`, `createOrder` |
| 변수명 | camelCase | `userId`, `orderList` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 패키지 | 소문자 | `com.example.user` |
| REST API 경로 | kebab-case | `/api/user-orders` |
| DB 컬럼 | snake_case | `user_id`, `created_at` |

---

## 4. 필수 어노테이션 가이드

### Controller 계층
```java
@RestController          // JSON 응답 컨트롤러 (= @Controller + @ResponseBody)
@RequestMapping("/api/users")
@RequiredArgsConstructor // 생성자 주입 (Lombok)
public class UserController {

    private final UserService userService; // @Autowired 대신 생성자 주입 사용

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) { ... }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody @Valid UserRequest request) { ... }
}
```

### Service 계층
```java
@Service
@Transactional(readOnly = true) // 기본은 readOnly, 변경이 필요한 메서드에만 @Transactional
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
}
```

### Repository 계층
```java
// JPA 사용 시
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}

// MyBatis 사용 시
@Mapper
public interface UserMapper {
    User selectById(Long id);
}
```

### Entity
```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 직접 생성자 호출 방지
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    // 정적 팩터리 메서드로 객체 생성
    public static User create(String email, String password) { ... }
}
```

---

## 5. 예외 처리 규칙

- `@RestControllerAdvice`로 전역 예외 핸들러를 만든다.
- 커스텀 예외 클래스를 도메인별로 정의한다. (예: `UserNotFoundException`)
- 클라이언트에게 반환하는 에러 응답 형식을 통일한다.

```java
// 공통 에러 응답 형식 예시
{
  "status": 404,
  "code": "USER_NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다.",
  "timestamp": "2026-02-27T12:00:00"
}
```

---

## 6. 테스트 규칙

| 테스트 종류 | 어노테이션 | 용도 |
|------------|-----------|------|
| 통합 테스트 | `@SpringBootTest` | 전체 컨텍스트 로딩, E2E 테스트 |
| 컨트롤러 테스트 | `@WebMvcTest` + `MockMvc` | 웹 계층만 테스트 |
| JPA Repository 테스트 | `@DataJpaTest` | DB 계층만 테스트 |
| 서비스 단위 테스트 | `@ExtendWith(MockitoExtension.class)` | Mockito로 의존성 모킹 |

```java
// 컨트롤러 테스트 예시
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void 사용자_조회_성공() throws Exception {
        given(userService.findById(1L)).willReturn(mockUserResponse());

        mockMvc.perform(get("/api/users/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.email").value("test@test.com"));
    }
}
```

- 테스트 메서드명은 한국어로 작성한다. (예: `사용자_조회_성공`)
- given-when-then 패턴을 따른다.

---

## 7. DB 마이그레이션 규칙 (Flyway)

- `src/main/resources/db/migration/` 경로에 마이그레이션 파일을 둔다.
- 파일명 형식: `V{버전}__{설명}.sql` (예: `V1__create_users_table.sql`)
- 한 번 적용된 마이그레이션 파일은 절대 수정하지 않는다.
- 수정이 필요하면 새 마이그레이션 파일을 추가한다.

---

## 8. 보안 규칙 (Spring Security + JWT)

> 기본 보안 원칙(환경변수, 입력 검증, 비밀번호 해싱, CORS, 에러 처리)은 security-baseline 스킬이 자동 적용한다.
> 이 섹션은 Spring 특화 구현만 다룬다.

- `SecurityFilterChain`에서 API 엔드포인트별 접근 권한을 명확하게 정의한다.
- JWT 시크릿 키는 환경 변수(`${JWT_SECRET}`)로 주입한다.
- `BCryptPasswordEncoder`를 사용한다.

```java
// SecurityConfig 기본 구조 예시
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 9. 흔한 실수 방지 (AI 자동 적용)

코드 작성 시 아래 패턴을 자동으로 피한다.

| 실수 | 올바른 방법 |
|------|-----------|
| `@Autowired` 필드 주입 | 생성자 주입 (`@RequiredArgsConstructor`) |
| `Optional.get()` 직접 호출 | `.orElseThrow()` 또는 `.orElse()` 사용 |
| `System.out.println` 디버깅 | SLF4J Logger (`@Slf4j`) 사용 |
| Entity를 API 응답에 직접 반환 | 반드시 DTO로 변환 후 반환 |
| Service에 `@Transactional` 누락 | 읽기는 `@Transactional(readOnly = true)`, 쓰기는 `@Transactional` |
| N+1 쿼리 방치 | `@EntityGraph` 또는 `fetch join`으로 해결 |
| CORS에 와일드카드(`*`) 사용 | 허용할 도메인을 명시적으로 지정 |
| 에러 응답에 스택 트레이스 노출 | 사용자에게는 일반 메시지, 서버에만 상세 로그 |

---

## 10. 구현 순서 (새 기능 추가 시)

```
1. Entity/DTO 정의 → DB 테이블 설계
2. Repository 작성 → 데이터 접근 계층
3. Service 작성 → 비즈니스 로직
4. Controller 작성 → API 엔드포인트
5. 예외 처리 추가 → 커스텀 예외 + @ControllerAdvice
6. 보안 설정 → SecurityFilterChain에 경로 추가
7. 테스트 작성 → 단위/통합 테스트
8. 동작 확인 → 전체 흐름 테스트
```
