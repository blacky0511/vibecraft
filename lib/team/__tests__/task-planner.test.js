const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { detectCycle, calculateWaves } = require('../task-planner');

describe('detectCycle', () => {
  it('빈 그래프면 null을 반환한다', () => {
    const graph = new Map();
    assert.equal(detectCycle(graph), null);
  });

  it('선형 의존(순환 없음)이면 null을 반환한다', () => {
    const graph = new Map();
    graph.set('A', new Set(['B']));
    graph.set('B', new Set(['C']));
    graph.set('C', new Set());
    assert.equal(detectCycle(graph), null);
  });

  it('A→B, B→A 상호 의존을 감지한다', () => {
    const graph = new Map();
    graph.set('A', new Set(['B']));
    graph.set('B', new Set(['A']));
    const cycle = detectCycle(graph);
    assert.ok(cycle, '순환이 감지되어야 합니다');
    assert.ok(cycle.length >= 2, '순환 경로에 최소 2개 노드');
    // 순환에 A와 B가 모두 포함
    assert.ok(cycle.includes('A'));
    assert.ok(cycle.includes('B'));
  });

  it('3-사이클(A→B→C→A)을 감지한다', () => {
    const graph = new Map();
    graph.set('A', new Set(['B']));
    graph.set('B', new Set(['C']));
    graph.set('C', new Set(['A']));
    const cycle = detectCycle(graph);
    assert.ok(cycle, '순환이 감지되어야 합니다');
    assert.ok(cycle.includes('A'));
    assert.ok(cycle.includes('B'));
    assert.ok(cycle.includes('C'));
  });

  it('자기 자신 의존(A→A)을 감지한다', () => {
    const graph = new Map();
    graph.set('A', new Set(['A']));
    const cycle = detectCycle(graph);
    assert.ok(cycle, '자기 참조 순환이 감지되어야 합니다');
    assert.ok(cycle.includes('A'));
  });
});

describe('calculateWaves', () => {
  it('빈 그래프면 빈 Map을 반환한다', () => {
    const graph = new Map();
    const waves = calculateWaves(graph);
    assert.equal(waves.size, 0);
  });

  it('독립 노드들은 모두 wave 0이다', () => {
    const graph = new Map();
    graph.set('A', new Set());
    graph.set('B', new Set());
    graph.set('C', new Set());
    const waves = calculateWaves(graph);
    assert.equal(waves.get('A'), 0);
    assert.equal(waves.get('B'), 0);
    assert.equal(waves.get('C'), 0);
  });

  it('선형 A→B→C이면 wave 0,1,2이다', () => {
    // C가 의존 없음(wave 0), B가 C에 의존(wave 1), A가 B에 의존(wave 2)
    const graph = new Map();
    graph.set('A', new Set(['B']));
    graph.set('B', new Set(['C']));
    graph.set('C', new Set());
    const waves = calculateWaves(graph);
    assert.equal(waves.get('C'), 0);
    assert.equal(waves.get('B'), 1);
    assert.equal(waves.get('A'), 2);
  });

  it('다이아몬드 패턴에서 올바른 wave를 계산한다', () => {
    // D(wave 0) ← B(wave 1), C(wave 1) ← A(wave 2)
    const graph = new Map();
    graph.set('A', new Set(['B', 'C']));
    graph.set('B', new Set(['D']));
    graph.set('C', new Set(['D']));
    graph.set('D', new Set());
    const waves = calculateWaves(graph);
    assert.equal(waves.get('D'), 0);
    assert.equal(waves.get('B'), 1);
    assert.equal(waves.get('C'), 1);
    assert.equal(waves.get('A'), 2);
  });

  it('다중 독립+의존 혼합에서 올바른 wave를 계산한다', () => {
    // X(독립, wave 0), Y가 X에 의존(wave 1), Z(독립, wave 0)
    const graph = new Map();
    graph.set('X', new Set());
    graph.set('Y', new Set(['X']));
    graph.set('Z', new Set());
    const waves = calculateWaves(graph);
    assert.equal(waves.get('X'), 0);
    assert.equal(waves.get('Z'), 0);
    assert.equal(waves.get('Y'), 1);
  });
});
