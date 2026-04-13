#!/usr/bin/env node

/**
 * vibecraft SubagentStop 훅 — 서브에이전트 출력 품질 빠른 스캔
 *
 * 코드 작성 에이전트가 완료 직전에 수정한 파일들을 빠르게 훑어
 * - 하드코딩된 시크릿 의심 패턴
 * - console.log 남발
 * - TODO/FIXME 남발
 * 을 감지해 리마인드 메시지를 출력한다.
 *
 * 실제 차단은 하지 않고 stdout으로 안내만 한다.
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "SubagentStop",
 *   agent_id: "def456",
 *   agent_type: "frontend-builder",   // ← 에이전트 이름은 여기
 *   agent_transcript_path: "...",
 *   last_assistant_message: "...",
 *   stop_hook_active: false,
 *   ...
 * }
 */

const fs = require('fs');
const { execSync } = require('child_process');

const PATTERNS = {
  secrets: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{16,}/i,
  debugLog: /console\.log\(/g,
  todo: /\/\/\s*(TODO|FIXME|XXX)/gi,
};

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

try {
  const raw = readStdin();
  const input = raw ? JSON.parse(raw) : {};
  // 공식 필드는 agent_type. 이전 버전 호환용으로 subagent_name/agent_name도 폴백.
  const agentName = input.agent_type || input.subagent_name || input.agent_name || '';

  // 무한 루프 방지
  if (input.stop_hook_active === true) {
    process.exit(0);
  }

  // 코드 작성 에이전트만 검사
  const targetAgents = ['frontend-builder', 'backend-builder', 'test-writer', 'code-simplifier', 'debugger'];
  if (!targetAgents.includes(agentName)) {
    process.exit(0);
  }

  // 최근 git status로 수정된 파일 확인 (staged + unstaged)
  let changed = '';
  try {
    changed = execSync('git diff --name-only HEAD', { encoding: 'utf8', timeout: 3000 });
  } catch {
    process.exit(0);
  }

  const files = changed.split('\n').filter(f =>
    f && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.py'))
  );

  const warnings = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (PATTERNS.secrets.test(content)) {
      warnings.push(`${file}: 하드코딩 시크릿 의심 패턴 발견. .env로 이전 검토`);
    }
    const logCount = (content.match(PATTERNS.debugLog) || []).length;
    if (logCount > 5) {
      warnings.push(`${file}: console.log ${logCount}개 — 디버그 코드 남아있는지 확인`);
    }
    const todoCount = (content.match(PATTERNS.todo) || []).length;
    if (todoCount > 3) {
      warnings.push(`${file}: TODO/FIXME ${todoCount}개 — 작업 완료 여부 확인`);
    }
  }

  if (warnings.length === 0) {
    process.exit(0);
  }

  console.log(`[서브에이전트 출력 점검 — ${agentName}]`);
  warnings.forEach(w => console.log(`  - ${w}`));
  process.exit(0);
} catch {
  process.exit(0);
}
