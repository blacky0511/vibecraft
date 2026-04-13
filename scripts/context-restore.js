#!/usr/bin/env node

/**
 * vibecraft PostCompact 훅 — 컴팩션 이후 맥락 복원
 *
 * compact가 완료되면 진행 중인 RPDCA 상태, 활성 feature의 plan.md 헤더,
 * docs/session.md 요약을 자동으로 Claude 컨텍스트에 다시 주입한다.
 *
 * 이는 PreCompact(context-compaction.js)가 "스냅샷 저장"이라면
 * PostCompact는 "스냅샷 복원" 역할을 한다.
 *
 * 입력 스키마 (공식):
 * {
 *   hook_event_name: "PostCompact",
 *   session_id: "...",
 *   transcript_path: "...",
 *   cwd: "...",
 *   ...
 * }
 */

const fs = require('fs');
const path = require('path');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch {}
  try { return fs.readFileSync('/dev/stdin', 'utf8'); } catch { return ''; }
}

// plan.md의 상단 헤더(목표/아키텍처/기술 스택)만 추출 (최대 40줄)
function extractPlanHeader(planPath) {
  try {
    if (!fs.existsSync(planPath)) return null;
    const content = fs.readFileSync(planPath, 'utf8');
    const lines = content.split('\n').slice(0, 40);
    // "## " 섹션이 처음 나오는 위치에서 멈춤 (헤더만 추출)
    let stopIdx = lines.length;
    for (let i = 5; i < lines.length; i++) {
      if (lines[i].startsWith('## ') && !lines[i].includes('영향 파일')) {
        stopIdx = i;
        break;
      }
    }
    return lines.slice(0, stopIdx).join('\n').trim();
  } catch {
    return null;
  }
}

// session.md가 있으면 읽어서 반환 (30줄 이하)
function readSessionSnapshot() {
  try {
    const sessionPath = path.resolve('docs/session.md');
    if (!fs.existsSync(sessionPath)) return null;
    const content = fs.readFileSync(sessionPath, 'utf8');
    const lines = content.split('\n').slice(0, 30);
    return lines.join('\n').trim();
  } catch {
    return null;
  }
}

try {
  // 입력은 읽되 사용 안 함 (PostCompact는 정보성)
  readStdin();

  const sections = [];
  sections.push('[vibecraft — 컴팩션 후 맥락 복원]');
  sections.push('');

  // 1. RPDCA 상태 (rpdca-state.json 우선)
  let rpdcaSummary = null;
  let activeFeature = null;
  try {
    const rpdca = require('./rpdca-state.js');
    const state = rpdca.read();
    if (state.features && state.features.length > 0) {
      const lines = ['진행 중인 작업:'];
      for (const f of state.features) {
        const active = state.activeFeature === f.name ? ' ← 활성' : '';
        lines.push(`  - ${f.name}: ${f.phase}${active}`);
      }
      rpdcaSummary = lines.join('\n');
    }
    const act = rpdca.getActive();
    if (act) activeFeature = act.name;
  } catch {}

  if (rpdcaSummary) {
    sections.push(rpdcaSummary);
    sections.push('');
  }

  // 2. 활성 feature의 plan.md 헤더
  if (activeFeature) {
    const planPath = path.resolve(`docs/plans/${activeFeature}/plan.md`);
    const planHeader = extractPlanHeader(planPath);
    if (planHeader) {
      sections.push(`[활성 feature "${activeFeature}" plan.md 헤더]`);
      sections.push(planHeader);
      sections.push('');
    }
  }

  // 3. session.md 스냅샷
  const session = readSessionSnapshot();
  if (session) {
    sections.push('[docs/session.md 최근 스냅샷]');
    sections.push(session);
    sections.push('');
  }

  // 4. 하네스 규칙 리마인더
  sections.push('---');
  sections.push('주의: 이전 턴에서 사용자와 합의한 설계/금지 사항은 사라졌을 수 있습니다.');
  sections.push('이전 plan.md와 session.md를 먼저 Read한 뒤 작업을 재개하세요.');
  sections.push('Iron Law: 증거 없이 완료 없다. 코드 수정 후 테스트 실행 결과를 반드시 제시.');

  // 유의미한 내용이 하나도 없으면 출력 생략
  if (!rpdcaSummary && !activeFeature && !session) {
    process.exit(0);
  }

  console.log(sections.join('\n'));
} catch {
  // 훅 실패가 compact 이후 세션을 방해하면 안 됨
  process.exit(0);
}
