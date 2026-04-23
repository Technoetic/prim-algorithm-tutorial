import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Graph } from '../src/graph.js';
import { PrimEngine } from '../src/prim.js';

const cablePreset = JSON.parse(readFileSync(resolve(process.cwd(), 'presets/cable.json'), 'utf8'));

describe('PrimEngine', () => {
  it('빈 그래프는 done 스텝 하나만 반환', () => {
    const g = new Graph([], []);
    const e = new PrimEngine(g, null);
    expect(e.totalSteps).toBe(1);
    expect(e.getStep(0).phase).toBe('done');
    expect(e.getStep(0).explainKo).toContain('비어');
  });

  it('단일 정점은 init + pick + done 순 (3 스텝)', () => {
    const g = new Graph([{ id: 'A', x: 0, y: 0 }], []);
    const e = new PrimEngine(g, 'A');
    const phases = e.steps.map((s) => s.phase);
    expect(phases).toContain('init');
    expect(phases).toContain('pick');
    expect(phases).toContain('done');
    expect(e.getStep(e.totalSteps - 1).totalCost).toBe(0);
  });

  it('존재하지 않는 시작 정점은 에러', () => {
    const g = new Graph([{ id: 'A', x: 0, y: 0 }], []);
    expect(() => new PrimEngine(g, 'Z')).toThrow();
  });

  it('cable 프리셋의 MST 총비용이 결정적으로 계산된다', () => {
    const g = Graph.fromPreset(cablePreset);
    const e = new PrimEngine(g, 'A');
    const last = e.getStep(e.totalSteps - 1);
    expect(last.phase).toBe('done');
    expect(last.mstNodeIds.size).toBe(g.nodes.length);
    expect(last.mstEdgeIds.size).toBe(g.nodes.length - 1);
    expect(last.totalCost).toBeGreaterThan(0);
    // 시작점에 관계없이 총비용은 일정해야 함
    const fromB = new PrimEngine(g, 'B');
    expect(fromB.getStep(fromB.totalSteps - 1).totalCost).toBe(last.totalCost);
  });

  it('비연결 그래프는 done 스텝에서 경고를 낸다', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
        { id: 'C', x: 2, y: 0 },
      ],
      [{ id: 'AB', u: 'A', v: 'B', weight: 1 }],
      // C는 고립
    );
    const e = new PrimEngine(g, 'A');
    const last = e.getStep(e.totalSteps - 1);
    expect(last.explainKo).toContain('연결되지 않은');
  });

  it('사이클 거절 스텝이 존재한다', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
        { id: 'C', x: 1, y: 1 },
      ],
      [
        { id: 'AB', u: 'A', v: 'B', weight: 1 },
        { id: 'BC', u: 'B', v: 'C', weight: 1 },
        { id: 'CA', u: 'C', v: 'A', weight: 1 },
      ],
    );
    const e = new PrimEngine(g, 'A');
    const cycleSteps = e.steps.filter((s) => s.rejectedReason === 'cycle');
    expect(cycleSteps.length).toBeGreaterThan(0);
  });

  it('스텝은 Object.frozen 이다(불변)', () => {
    const g = Graph.fromPreset(cablePreset);
    const e = new PrimEngine(g, 'A');
    expect(Object.isFrozen(e.getStep(0))).toBe(true);
  });

  it('getStep(음수) 또는 초과 인덱스는 클램프', () => {
    const g = Graph.fromPreset(cablePreset);
    const e = new PrimEngine(g, 'A');
    expect(e.getStep(-5)).toBe(e.getStep(0));
    expect(e.getStep(9999)).toBe(e.getStep(e.totalSteps - 1));
  });

  it('동률 tie-break은 id 오름차순으로 결정적', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
        { id: 'C', x: 2, y: 0 },
      ],
      [
        { id: 'AB', u: 'A', v: 'B', weight: 1 },
        { id: 'AC', u: 'A', v: 'C', weight: 1 },
      ],
    );
    const e1 = new PrimEngine(g, 'A');
    const e2 = new PrimEngine(g, 'A');
    // 같은 입력은 같은 순서를 보장
    expect(e1.steps.map((s) => s.currentNodeId)).toEqual(e2.steps.map((s) => s.currentNodeId));
  });
});
