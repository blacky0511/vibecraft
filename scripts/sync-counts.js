#!/usr/bin/env node
/**
 * 스킬, 에이전트, 템플릿 수를 자동 카운트하여
 * README.md, plugin.json, CLAUDE.md의 수치를 업데이트하는 스크립트
 *
 * 사용법: node scripts/sync-counts.js
 *
 * 업데이트 대상:
 * - README.md: "스킬 구성 (N개)" 헤더
 * - plugin.json: description 내 "N개 스마트 스킬"
 * - CLAUDE.md: "스킬 N개" / "에이전트 N개" / "템플릿 N개"
 *
 * 이후 sync-version.js를 실행하면 plugin.json → marketplace.json 동기화됨
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 디렉토리 내 하위 폴더/파일 수 카운트
function countEntries(dir, type) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) {
    console.error(`디렉토리 없음: ${dir}`);
    return 0;
  }

  const entries = fs.readdirSync(fullPath);

  if (type === 'dirs') {
    // skills/는 하위 디렉토리를 카운트
    return entries.filter(e => {
      const stat = fs.statSync(path.join(fullPath, e));
      return stat.isDirectory();
    }).length;
  }

  if (type === 'files') {
    // agents/, templates/는 .md 파일을 카운트
    return entries.filter(e => e.endsWith('.md')).length;
  }

  return 0;
}

const skillCount = countEntries('skills', 'dirs');
const agentCount = countEntries('agents', 'files');
const templateCount = countEntries('templates', 'files');

console.log(`카운트 결과: 스킬 ${skillCount}개, 에이전트 ${agentCount}개, 템플릿 ${templateCount}개`);

let updated = [];

// 1. README.md 업데이트
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  const oldReadme = readme;

  // "## 스킬 구성 (N개)" 패턴
  readme = readme.replace(
    /## 스킬 구성 \(\d+개\)/,
    `## 스킬 구성 (${skillCount}개)`
  );

  if (readme !== oldReadme) {
    fs.writeFileSync(readmePath, readme, 'utf8');
    updated.push('README.md');
  }
}

// 2. plugin.json 업데이트
const pluginPath = path.join(rootDir, '.claude-plugin', 'plugin.json');
if (fs.existsSync(pluginPath)) {
  const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
  const oldDesc = plugin.description;

  // "N개 스마트 스킬" 패턴
  plugin.description = plugin.description.replace(
    /\d+개 스마트 스킬/,
    `${skillCount}개 스마트 스킬`
  );

  if (plugin.description !== oldDesc) {
    fs.writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n', 'utf8');
    updated.push('plugin.json');
  }
}

// 3. CLAUDE.md 업데이트
const claudePath = path.join(rootDir, 'CLAUDE.md');
if (fs.existsSync(claudePath)) {
  let claude = fs.readFileSync(claudePath, 'utf8');
  const oldClaude = claude;

  // "스킬 N개", "에이전트 N개", "템플릿 N개" 패턴
  claude = claude.replace(/스킬 \d+개/, `스킬 ${skillCount}개`);
  claude = claude.replace(/에이전트 \d+개/, `에이전트 ${agentCount}개`);
  claude = claude.replace(/템플릿 \d+개/, `템플릿 ${templateCount}개`);

  if (claude !== oldClaude) {
    fs.writeFileSync(claudePath, claude, 'utf8');
    updated.push('CLAUDE.md');
  }
}

if (updated.length > 0) {
  console.log(`업데이트 완료: ${updated.join(', ')}`);
  console.log('marketplace.json 동기화가 필요하면 node scripts/sync-version.js를 실행하세요.');
} else {
  console.log('모든 수치가 이미 최신입니다. (변경 없음)');
}
