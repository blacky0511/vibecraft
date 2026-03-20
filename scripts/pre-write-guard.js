#!/usr/bin/env node

/**
 * vibecraft PreToolUse(Write|Edit) 훅 — 설계 없이 코드 작성 방지
 *
 * 소스 코드 파일 작성 시 plan.md 존재 여부를 확인하고,
 * 계획 없이 큰 코드를 작성하려 하면 경고 메시지를 주입한다.
 * 차단하지 않고 경고만 한다.
 */

const fs = require('fs');
const path = require('path');

try {
  const toolInput = process.env.TOOL_INPUT;
  if (!toolInput) process.exit(0);

  let filePath = '';
  let content = '';
  try {
    const parsed = JSON.parse(toolInput);
    filePath = parsed.file_path || parsed.filePath || '';
    content = parsed.content || parsed.new_string || '';
  } catch {
    process.exit(0);
  }

  if (!filePath) process.exit(0);

  // 문서 파일은 항상 허용 (plan.md, research.md, CLAUDE.md 등)
  const docPatterns = [
    /docs\//i,
    /\.md$/i,
    /CLAUDE\.md$/i,
    /README/i,
    /templates\//i,
    /\.json$/i,
    /\.yaml$/i,
    /\.yml$/i,
    /\.toml$/i,
    /\.cfg$/i,
    /\.ini$/i,
    /\.gitignore$/i
  ];

  if (docPatterns.some(p => p.test(filePath))) {
    process.exit(0);
  }

  // 소스 코드 파일 판별
  const codeExtensions = /\.(ts|tsx|js|jsx|py|java|kt|go|rs|rb|php|cs|swift|vue|svelte)$/i;
  if (!codeExtensions.test(filePath)) {
    process.exit(0);
  }

  // .env 파일 경고
  if (/\.env/i.test(filePath)) {
    console.log('[vibecraft] .env 파일을 수정합니다. 비밀값이 하드코딩되지 않았는지 확인하세요. .gitignore에 포함되어 있는지 확인하세요.');
    process.exit(0);
  }

  // 코드 크기 확인 (줄 수)
  const lineCount = (content || '').split('\n').length;

  // 50줄 이하 → S 크기로 간주, 허용
  if (lineCount <= 50) {
    process.exit(0);
  }

  // 50줄 초과 → docs/plans/ 에 plan.md가 있는지 확인
  const plansDir = path.resolve('docs/plans');
  let hasPlan = false;

  if (fs.existsSync(plansDir)) {
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'archive') {
        if (fs.existsSync(path.join(plansDir, entry.name, 'plan.md'))) {
          hasPlan = true;
          break;
        }
      }
    }
  }

  if (!hasPlan) {
    console.log(
      '[vibecraft] 계획서(plan.md) 없이 큰 코드(' + lineCount + '줄)를 작성하려 합니다.\n' +
      'M/L 크기 작업이라면 먼저 RPDCA Plan 단계를 진행하세요.\n' +
      'S 크기(단순 수정)라면 그대로 진행해도 됩니다.'
    );
  }

} catch (error) {
  process.exit(0);
}
