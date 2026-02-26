#!/usr/bin/env node

/**
 * vibecraft 세션 시작 훅
 * 세션이 시작될 때 vibecraft가 활성화되었음을 알린다.
 */

const message = [
  'vibecraft가 활성화되었습니다.',
  '작업을 요청하면 자동으로 상황을 감지하고 적절한 워크플로우를 안내합니다.',
  '',
  '지원 모드: 새 기능 | 디버깅 | 프로젝트 시작 | 코드 리뷰 | 배포',
  '도움말: /vibecraft'
].join('\n');

console.log(message);
