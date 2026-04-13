#!/usr/bin/env node

/**
 * vibecraft RPDCA 상태 JSON 유틸리티
 *
 * docs/plans/rpdca-state.json을 읽고 쓰는 공통 모듈.
 * 다중 feature 동시 진행을 지원한다.
 *
 * 스키마:
 * {
 *   activeFeature: string | null,
 *   features: [
 *     { name, phase, startedAt, lastUpdated }
 *   ],
 *   lastUpdated: ISO 문자열
 * }
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.resolve('docs/plans/rpdca-state.json');

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
  } catch {
    return emptyState();
  }
}

function write(state) {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function upsertFeature(name, phase) {
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
  write(state);
}

function setActive(name) {
  const state = read();
  state.activeFeature = name;
  write(state);
}

function getActive() {
  const state = read();
  if (!state.activeFeature) return null;
  return state.features.find(f => f.name === state.activeFeature) || null;
}

module.exports = {
  read,
  write,
  upsertFeature,
  setActive,
  getActive,
  STATE_PATH,
};
