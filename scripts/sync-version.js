#!/usr/bin/env node
/**
 * plugin.json의 version과 description을
 * marketplace.json에 자동으로 동기화하는 스크립트
 *
 * 사용법: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');
const marketplacePaths = [
  path.join(__dirname, '..', '.claude-plugin', 'marketplace.json'),
  path.join(__dirname, '..', 'marketplace.json'),
];

const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));

for (const marketplacePath of marketplacePaths) {
  if (!fs.existsSync(marketplacePath)) continue;

  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  const oldVersion = marketplace.plugins[0].version;
  const newVersion = plugin.version;

  marketplace.plugins[0].version = newVersion;
  marketplace.plugins[0].description = plugin.description;

  fs.writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n', 'utf8');

  const label = marketplacePath.includes('.claude-plugin') ? '.claude-plugin/' : '루트';
  if (oldVersion !== newVersion) {
    console.log(`[${label}] 버전 동기화 완료: ${oldVersion} → ${newVersion}`);
  } else {
    console.log(`[${label}] 버전 동일: ${newVersion} (변경 없음)`);
  }
}
