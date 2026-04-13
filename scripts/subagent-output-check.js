#!/usr/bin/env node

/**
 * vibecraft SubagentStop 훅 — 서브에이전트 출력 품질 빠른 스캔
 *
 * 코드 작성 에이전트가 완료 직전에 수정한 파일들을 빠르게 훑어
 * - 하드코딩된 시크릿 의심 패턴 (엔트로피 + placeholder 제외)
 * - console.log 남발
 * - TODO/FIXME 남발
 * 을 감지해 리마인드 메시지를 출력한다.
 *
 * v2.2.0 변경점 (CTO #2 H1, H2 반영):
 *  - git rev-parse 사전 체크로 non-repo 환경 빠르게 skip
 *  - 시크릿 엔트로피 체크 추가 — Shannon entropy ≥ 3.5 만 경고
 *  - placeholder/sample/example 패턴 제외
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "SubagentStop",
 *   agent_id: "def456",
 *   agent_type: "frontend-builder",
 *   agent_transcript_path: "...",
 *   last_assistant_message: "...",
 *   stop_hook_active: false,
 *   ...
 * }
 */

const fs = require('fs');
const { execSync } = require('child_process');

const PATTERNS = {
  secrets: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"`]([^'"`]{16,})['"`]/gi,
  debugLog: /console\.log\(/g,
  todo: /\/\/\s*(TODO|FIXME|XXX)/gi,
};

// placeholder/예시 값 화이트리스트 (매칭되면 경고 안 함)
const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /example/i,
  /sample/i,
  /your[_-]?(?:api[_-]?)?key/i,
  /xxx+/i,
  /<[^>]+>/, // <API_KEY> 같은 플레이스홀더
  /\.\.\./,
  /^test[_-]/i,
  /^mock[_-]/i,
  /^fake[_-]/i,
  /^dummy/i,
  /here_?123/i,
];

// Shannon 엔트로피 계산 (문자열 랜덤성 측정)
// 실제 시크릿은 보통 ≥ 4.0, placeholder는 보통 ≤ 3.0
function shannonEntropy(str) {
  if (!str || str.length === 0) return 0;
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function looksLikeRealSecret(value) {
  // placeholder 패턴 매칭 시 제외
  if (PLACEHOLDER_PATTERNS.some(re => re.test(value))) return false;
  // 엔트로피가 너무 낮으면 제외 (반복 문자, 흔한 단어)
  if (shannonEntropy(value) < 3.5) return false;
  return true;
}

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      encoding: 'utf8',
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
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

  // git repo가 아니면 즉시 skip (execSync 비용 낭비 방지)
  if (!isGitRepo()) {
    process.exit(0);
  }

  // 최근 git status로 수정된 파일 확인
  let changed = '';
  try {
    changed = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null', {
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    process.exit(0);
  }

  const files = changed.split('\n').filter(f =>
    f && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.py'))
  );

  const warnings = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = '';
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }

    // 시크릿 스캔: 정규식으로 후보 추출 → placeholder 제외 + 엔트로피 체크
    const secretMatches = [...content.matchAll(PATTERNS.secrets)];
    const realSecrets = secretMatches.filter(m => looksLikeRealSecret(m[2]));
    if (realSecrets.length > 0) {
      warnings.push(`${file}: 하드코딩 시크릿 의심 (엔트로피 높음) ${realSecrets.length}건. .env로 이전 검토`);
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
