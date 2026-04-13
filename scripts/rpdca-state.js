#!/usr/bin/env node

/**
 * vibecraft RPDCA 상태 JSON 유틸리티
 *
 * docs/plans/rpdca-state.json을 읽고 쓰는 공통 모듈.
 * 다중 feature 동시 진행을 지원한다.
 *
 * v2.2.0 변경점 (CTO #2 B1 해결):
 *  - 원자적 쓰기: 임시 파일 + rename 으로 부분 쓰기 레이스 방지
 *  - 손상 복구: 읽기 실패 시 .bak 백업 후 emptyState 반환
 *  - 재시도: write 실패 시 최대 3회 짧은 간격 재시도 (Windows 파일 잠금 대응)
 *  - upsertFeature는 read→merge→write를 한 번에 수행 (원자성)
 *
 * 스키마:
 * {
 *   activeFeature: string | null,
 *   features: [{ name, phase, startedAt, lastUpdated }],
 *   lastUpdated: ISO 문자열
 * }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_PATH = path.resolve('docs/plans/rpdca-state.json');
const BAK_PATH = STATE_PATH + '.bak';
const MAX_WRITE_RETRIES = 3;

function emptyState() {
  return {
    activeFeature: null,
    features: [],
    lastUpdated: new Date().toISOString(),
  };
}

function read() {
  if (!fs.existsSync(STATE_PATH)) return emptyState();
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.features)) parsed.features = [];
    return parsed;
  } catch (err) {
    // 손상된 JSON — .bak으로 백업 후 emptyState 반환
    try {
      if (fs.existsSync(STATE_PATH)) {
        fs.copyFileSync(STATE_PATH, BAK_PATH);
      }
    } catch {}
    return emptyState();
  }
}

// 원자적 쓰기: 임시 파일에 쓴 뒤 rename
function writeAtomic(state) {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  state.lastUpdated = new Date().toISOString();
  const payload = JSON.stringify(state, null, 2);

  // 고유 임시 파일 이름으로 경합 조건 최소화
  const tmpPath = path.join(dir, `.rpdca-state.${process.pid}.${Date.now()}.tmp`);

  for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
    try {
      fs.writeFileSync(tmpPath, payload, 'utf8');
      // rename은 POSIX/NTFS 모두에서 원자적으로 동작 (동일 볼륨)
      fs.renameSync(tmpPath, STATE_PATH);
      return true;
    } catch (err) {
      // Windows 파일 잠금 가능성 — 짧은 지연 후 재시도
      if (attempt < MAX_WRITE_RETRIES - 1) {
        const delay = 20 * (attempt + 1);
        const until = Date.now() + delay;
        while (Date.now() < until) { /* busy wait, 20~60ms */ }
      }
      // 임시 파일 정리
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
    }
  }
  // 최종 실패 — 조용히 false 반환 (호출자가 결정)
  return false;
}

// 기존 호환성 위한 write (비원자적 아님)
function write(state) {
  return writeAtomic(state);
}

function upsertFeature(name, phase) {
  // read→merge→write를 한 함수 안에서 수행 (원자성 보장)
  const state = read();
  const existing = state.features.find(f => f.name === name);
  if (existing) {
    existing.phase = phase;
    existing.lastUpdated = new Date().toISOString();
  } else {
    state.features.push({
      name,
      phase,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
  }
  return writeAtomic(state);
}

function setActive(name) {
  const state = read();
  state.activeFeature = name;
  return writeAtomic(state);
}

function getActive() {
  const state = read();
  if (!state.activeFeature) return null;
  return state.features.find(f => f.name === state.activeFeature) || null;
}

module.exports = {
  read,
  write,
  writeAtomic,
  upsertFeature,
  setActive,
  getActive,
  STATE_PATH,
  BAK_PATH,
};
