# vibecraft 접근 3: 처음부터 새로 설계 (Cherry-Pick)

## 한 줄 요약
> 두 플러그인에서 좋은 것만 골라, 나만의 설계로 처음부터 만드는 방식

---

## 어떤 느낌인가요?

**비유하자면:** 여러 집을 구경하고 영감을 받은 뒤, 내 취향대로 설계도를 그려서 집을 짓는 것

- bkit과 superpowers를 **참고 자료**로만 사용합니다
- 내 프로젝트(SelfPost 같은 Java/Spring Boot)에 맞는 구조를 새로 설계합니다
- 필요한 스킬/에이전트/훅을 직접 정의하고 구현합니다
- 코드를 참고하되, 복사하지 않고 새로 작성합니다

---

## 최종 결과물 구성

| 구성 요소 | 개수 | 설명 |
|----------|------|------|
| 스킬 | ~25개 | 완전히 새로운 구성 (아래 상세) |
| 에이전트 | ~12개 | Java/Spring 생태계에 최적화된 에이전트 |
| 훅 스크립트 | ~10개 | 핵심 자동화만 포함 |
| 템플릿 | ~20개 | SelfPost 프로젝트 구조에 맞춘 템플릿 |
| Output Styles | 3개 | 간결하게 3개만 (일반/학습/상세) |

### 스킬 구성 (예시)

**PDCA 워크플로우 (bkit에서 영감)**
1. `pdca` - PDCA 통합 명령어
2. `pdca-plan` - 계획 수립
3. `pdca-design` - 설계
4. `pdca-do` - 구현
5. `pdca-check` - 검증 (90% 기준)
6. `pdca-act` - 개선/반복

**품질 규칙 (superpowers에서 영감)**
7. `iron-law` - 테스트 먼저, 검증 후 완료 (TDD + verification 통합)
8. `systematic-debugging` - 4단계 체계적 디버깅
9. `code-review` - 코드 리뷰 요청 + 수신

**개발 플로우 (두 플러그인 합성)**
10. `brainstorming` - 아이디어 → 설계
11. `writing-plans` - 구현 계획 작성
12. `executing-plans` - 계획 실행 (서브에이전트)
13. `finishing-branch` - 브랜치 마무리

**팀 운영 (bkit에서 영감)**
14. `team-lead` - CTO 에이전트 팀 운영
15. `parallel-agents` - 병렬 작업 디스패치

**프로젝트 특화**
16. `java-spring` - Spring Boot 프로젝트 규칙
17. `selenium-automation` - Selenium 자동화 패턴
18. `db-migration` - DB 스키마 변경 가이드
19. `deploy-guide` - VM 배포 프로세스

**파이프라인 (bkit 9-Phase 간소화)**
20. `phase-schema` - 스키마 정의
21. `phase-convention` - 코딩 규칙
22. `phase-api` - API 설계
23. `phase-ui` - UI 구현
24. `phase-review` - 리뷰
25. `phase-deploy` - 배포

### 에이전트 구성 (예시)

| 에이전트 | 역할 |
|---------|------|
| cto-lead | CTO 팀 리더 |
| code-analyzer | 코드 품질 분석 |
| code-reviewer | 코드 리뷰 |
| security-checker | 보안 검토 |
| frontend-builder | UI 구현 |
| backend-builder | API/Service 구현 |
| db-expert | DB/JPA 전문가 |
| test-writer | 테스트 작성 |
| debugger | 디버깅 전문가 |
| deploy-manager | 배포 관리 |
| gap-detector | 설계-구현 갭 분석 |
| report-writer | 보고서 생성 |

---

## 사용 예시

### 예시 1: 새 기능 개발 (SelfPost에 최적화)
```
나: "네이버 계정 비밀번호 일괄 변경 기능 추가해줘"

vibecraft가 하는 일:
1. [brainstorming] 기능에 대해 질문 → 설계 확정
2. [pdca-plan] 계획서 생성
   → SelfPost용 템플릿 사용 (모듈: Core/Web/Admin/API 자동 구분)
3. [pdca-design] 설계서 생성
   → Java/Spring 패턴에 맞춘 클래스 구조 제안
   → Entity/Repository/Service/Controller 계층 자동 구분
4. [team-lead] CTO가 팀 구성
   - backend-builder: Service/Repository 구현
   - db-expert: Entity + 마이그레이션
   - frontend-builder: 어드민 UI (Mustache)
   - test-writer: 테스트 코드
5. [iron-law] 각 구현마다 테스트 먼저 → 검증
6. [pdca-check] 90% 달성 확인
7. [deploy-guide] VM 배포 가이드 자동 제공
```

### 예시 2: 버그 수정 (SelfPost 특화)
```
나: "VM-01에서 포스팅 실패해"

vibecraft가 하는 일:
1. [systematic-debugging]
   - VM 로그 위치 자동 안내: C:\vm-logs\vm-01\
   - Selenium/Chrome 관련 패턴 분석
   - ADB/IP 변경 관련 확인 항목 제시
2. [iron-law] 수정 후 반드시 검증 증거 제시
```

### 예시 3: 접근 3만의 장점 - 프로젝트 특화 지식
```
나: "새 VM-04 세팅해야 해"

vibecraft가 하는 일:
1. [deploy-guide] VM 세팅 체크리스트 자동 제공
   - Java 21 설치
   - Chrome 설치
   - ADB 설정
   - 폰 연결 (USB 패스스루)
   - Host-Only 네트워크 설정
   - BAT 파일 설정
   (CLAUDE.md의 체크리스트가 스킬에 내장)
```

---

## 장점

1. **완벽한 맞춤**: SelfPost의 Java/Spring/Selenium/VM 환경에 100% 최적화
2. **깔끔한 설계**: 두 플러그인의 좋은 점만 골라 불필요한 복잡도 없음
3. **프로젝트 특화 스킬**: java-spring, selenium-automation, deploy-guide 등 실무에 바로 유용
4. **유지보수 독립**: bkit이나 superpowers 업데이트에 영향 받지 않음
5. **완벽한 한국어**: 처음부터 한국어로 설계하므로 번역 필요 없음
6. **CLAUDE.md 지식 내장**: 현재 CLAUDE.md에 적은 규칙들을 스킬로 체계화

## 단점

1. **작업량 많음**: 접근 2보다는 적지만, 접근 1보다는 많음
2. **검증 시간**: 새로 만든 훅/스크립트 안정성 검증 필요
3. **팀 오케스트레이션**: 가장 복잡한 부분을 직접 구현해야 함
4. **참고 코드 분석 시간**: bkit/superpowers 코드를 이해하고 좋은 부분을 추출하는 시간

---

## 작업 난이도

| 항목 | 난이도 | 설명 |
|------|--------|------|
| 아키텍처 설계 | ⭐⭐⭐ 높음 | 플러그인 전체 구조 설계 (가장 중요) |
| PDCA 스킬 6개 | ⭐⭐⭐ 높음 | 워크플로우 + 상태 관리 |
| 품질 규칙 스킬 3개 | ⭐⭐ 보통 | superpowers 참고하여 작성 |
| 개발 플로우 스킬 4개 | ⭐⭐ 보통 | superpowers 참고하여 작성 |
| 팀 운영 2개 | ⭐⭐⭐⭐ 매우 높음 | 오케스트레이션 로직 |
| 프로젝트 특화 4개 | ⭐⭐ 보통 | CLAUDE.md 지식을 스킬화 |
| 파이프라인 6개 | ⭐⭐ 보통 | bkit 참고하여 간소화 |
| 에이전트 12개 | ⭐⭐ 보통 | 역할별 프롬프트 작성 |
| 훅 10개 | ⭐⭐⭐ 높음 | Node.js 스크립트 작성 |
| 템플릿 20개 | ⭐⭐ 보통 | 마크다운 템플릿 |

**총 예상 작업**: 중~대규모 (참고 코드 있어 접근 2보다는 적음)

---

## 접근 1, 2, 3 비교 요약표

| 비교 항목 | 접근 1 (bkit 포크) | 접근 2 (superpowers 포크) | 접근 3 (새 설계) |
|----------|-------------------|------------------------|----------------|
| 작업량 | ⭐ 가장 적음 | ⭐⭐⭐ 가장 많음 | ⭐⭐ 중간 |
| 맞춤 정도 | ⭐⭐ 보통 | ⭐⭐ 보통 | ⭐⭐⭐ 완벽 맞춤 |
| 코드 깔끔함 | ⭐ 레거시 있음 | ⭐⭐⭐ 깔끔 | ⭐⭐⭐ 깔끔 |
| 유지보수 | ⭐ bkit 의존 | ⭐⭐ superpowers 의존 | ⭐⭐⭐ 완전 독립 |
| SelfPost 특화 | ⭐ 범용 | ⭐ 범용 | ⭐⭐⭐ 특화 가능 |
| 안정성 | ⭐⭐⭐ 검증됨 | ⭐ 새로 만들어야 | ⭐⭐ 참고 코드 있음 |
| 학습 효과 | ⭐ 남의 코드 | ⭐⭐⭐ 직접 구현 | ⭐⭐⭐ 직접 설계+구현 |
