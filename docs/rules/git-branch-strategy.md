# Git 브랜치 관리 규칙

> 프로젝트 CLAUDE.md에서 분리된 Git 전략 문서.

## 브랜치 전략

```
main (원본)
  └── feature/기능이름
  └── fix/버그이름
```

## RPDCA 단계별 Git 행동 규칙

| RPDCA 단계 | Git 행동 |
|-----------|---------|
| `/pdca plan` 시작 | 브랜치 생성 제안 |
| `/pdca design` | 설계 문서 커밋 |
| `/pdca do` 진행 중 | 의미 있는 단위로 커밋 |
| `/pdca analyze` 통과 (>=90%) | PR 생성 제안 |
| `/pdca analyze` 미달 (<90%) | 계속 작업 |

## 브랜치 네이밍
- 한글 또는 영어 케밥케이스 사용
- 예: `feature/keyword-parallel-search`, `fix/bot-connection-error`

## 사용자 확인 필수 작업
- 브랜치 생성/삭제
- main 브랜치로 합치기 (PR/merge)
- 원격 저장소에 push
- 이미 커밋된 내용 수정 (amend)

## Git Worktree (병렬 작업)
- 폴더 네이밍: `{프로젝트명}-{브랜치명}`
- 위치: 메인 프로젝트 폴더와 같은 레벨
- 작업 완료 후 `git worktree remove`로 정리
