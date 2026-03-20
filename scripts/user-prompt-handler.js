#!/usr/bin/env node

/**
 * vibecraft UserPromptSubmit 훅 — 의도 감지 + RPDCA 안내
 *
 * 사용자 입력을 분석하여 새 기능/디버깅/단순 수정 등 의도를 감지하고,
 * RPDCA 워크플로우 안내를 컨텍스트로 주입한다.
 * 절대 차단하지 않고, 힌트만 제공한다.
 */

const fs = require('fs');
const path = require('path');

try {
  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const prompt = (input.prompt || '').trim();

  if (!prompt || prompt.startsWith('/')) {
    // 빈 입력이거나 슬래시 명령어면 무시
    process.exit(0);
  }

  // 패턴 매칭
  const patterns = {
    newFeature: /만들어줘|추가해줘|구현해줘|넣어줘|만들자|시작하자/,
    debugging: /에러|버그|오류|안\s?돼|안됨|실패|크래시|error|bug|fix/,
    simpleTweak: /바꿔줘|색상|크기|폰트|패딩|마진|키워줘|줄여줘|늘려줘/,
    review: /리뷰|검토|봐줘|review/,
    deploy: /배포|릴리즈|deploy|release/
  };

  let mode = null;
  let confidence = 'low';

  // 우선순위 순으로 매칭
  if (patterns.simpleTweak.test(prompt)) {
    mode = 'simple-tweak';
    confidence = 'high';
  } else if (patterns.debugging.test(prompt)) {
    mode = 'debugging';
    confidence = 'high';
  } else if (patterns.review.test(prompt)) {
    mode = 'review';
    confidence = 'high';
  } else if (patterns.deploy.test(prompt)) {
    mode = 'deploy';
    confidence = 'high';
  } else if (patterns.newFeature.test(prompt)) {
    mode = 'new-feature';
    confidence = 'high';
  }

  if (!mode) {
    // 패턴 미매칭 — 힌트 없이 통과
    process.exit(0);
  }

  // 새 기능 감지 시 RPDCA 안내
  if (mode === 'new-feature') {
    // docs/plans/가 있는지 확인하여 기존 작업 진행 중인지 체크
    const plansDir = path.resolve('docs/plans');
    let activeFeatures = [];

    if (fs.existsSync(plansDir)) {
      const entries = fs.readdirSync(plansDir, { withFileTypes: true });
      activeFeatures = entries
        .filter(e => e.isDirectory() && e.name !== 'archive')
        .map(e => e.name);
    }

    const lines = [
      `[vibecraft] 새 기능 요청 감지. auto-detect 스킬로 모드를 판별하고 RPDCA 워크플로우를 따르세요.`
    ];

    if (activeFeatures.length > 0) {
      lines.push(`현재 진행 중인 작업: ${activeFeatures.join(', ')}`);
    }

    console.log(lines.join('\n'));
    process.exit(0);
  }

  // 디버깅 감지 시 체계적 디버깅 안내
  if (mode === 'debugging') {
    console.log('[vibecraft] 에러/버그 감지. systematic-debugging 스킬의 6단계 절차를 따르세요. 추측으로 수정하지 마세요.');
    process.exit(0);
  }

  // 나머지 모드는 힌트 없이 통과 (auto-detect 스킬이 처리)

} catch (error) {
  // stdin 파싱 실패 등 — 조용히 종료
  process.exit(0);
}
