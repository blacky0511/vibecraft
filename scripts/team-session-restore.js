#!/usr/bin/env node

/**
 * vibecraft 팀 세션 복구 스크립트
 * SessionStart 훅에서 실행되어 이전 팀 세션의 존재를 확인한다.
 *
 * docs/team-progress.md가 존재하면 이전 세션이 있다는 안내를 출력한다.
 * 실제 복구는 AI가 진행률 보고서를 읽고 판단한다.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const progressPath = path.join(projectRoot, 'docs', 'team-progress.md');

if (fs.existsSync(progressPath)) {
  try {
    const content = fs.readFileSync(progressPath, 'utf-8');
    const lines = content.split('\n');

    // 팀 이름 추출
    const teamLine = lines.find(l => l.startsWith('**팀**:'));
    const teamName = teamLine ? teamLine.replace('**팀**:', '').trim() : '알 수 없음';

    // 진행률 추출
    const progressLine = lines.find(l => l.startsWith('**전체 진행률**:'));
    const progress = progressLine ? progressLine.replace('**전체 진행률**:', '').trim() : '알 수 없음';

    console.log('[vibecraft 팀] 이전 팀 세션이 감지되었습니다.');
    console.log(`  팀: ${teamName}`);
    console.log(`  진행률: ${progress}`);
    console.log(`  보고서: ${progressPath}`);
    console.log('');
    console.log('이전 세션을 이어서 진행하려면 보고서를 확인하세요.');
  } catch {
    // 읽기 실패 시 무시
  }
}
