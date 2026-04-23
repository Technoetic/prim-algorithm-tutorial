import { describe, expect, it } from 'vitest';
import { EdgeState, Graph, GraphValidationError, NodeState } from '../src/graph.js';

describe('Graph', () => {
  it('정점과 간선을 담는다', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
      ],
      [{ id: 'AB', u: 'A', v: 'B', weight: 2 }],
    );
    expect(g.nodes.length).toBe(2);
    expect(g.edges.length).toBe(1);
    expect(g.getNode('A')).toBeDefined();
    expect(g.getEdge('AB').weight).toBe(2);
  });

  it('getNeighbors는 양방향 인접을 반환한다', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
      ],
      [{ id: 'AB', u: 'A', v: 'B', weight: 5 }],
    );
    const nb = g.getNeighbors('A');
    expect(nb.length).toBe(1);
    expect(nb[0].to).toBe('B');
    expect(nb[0].weight).toBe(5);
    expect(g.getNeighbors('B')[0].to).toBe('A');
  });

  it('중복 정점 id는 addNode에서 거절', () => {
    const g = new Graph([{ id: 'A', x: 0, y: 0 }]);
    expect(() => g.addNode({ id: 'A', x: 1, y: 1 })).toThrow(GraphValidationError);
  });

  it('존재하지 않는 정점 참조는 addEdge에서 거절', () => {
    const g = new Graph([{ id: 'A', x: 0, y: 0 }]);
    expect(() => g.addEdge({ id: 'AB', u: 'A', v: 'Z', weight: 1 })).toThrow(GraphValidationError);
  });

  it('fromPreset은 유효한 JSON을 인스턴스로 변환', () => {
    const preset = {
      nodes: [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 0 },
      ],
      edges: [{ id: 'AB', u: 'A', v: 'B', weight: 3 }],
      startNodeId: 'A',
    };
    const g = Graph.fromPreset(preset);
    expect(g.nodes.length).toBe(2);
  });

  it('validate는 weight가 숫자가 아니면 에러', () => {
    expect(() =>
      Graph.validate({
        nodes: [
          { id: 'A', x: 0, y: 0 },
          { id: 'B', x: 0, y: 0 },
        ],
        edges: [{ id: 'AB', u: 'A', v: 'B', weight: 'abc' }],
      }),
    ).toThrow(GraphValidationError);
  });

  it('validate는 startNodeId가 존재하지 않으면 에러', () => {
    expect(() =>
      Graph.validate({
        nodes: [{ id: 'A', x: 0, y: 0 }],
        edges: [],
        startNodeId: 'ZZ',
      }),
    ).toThrow(GraphValidationError);
  });

  it('enum들은 동결되어 있다', () => {
    expect(Object.isFrozen(NodeState)).toBe(true);
    expect(Object.isFrozen(EdgeState)).toBe(true);
    expect(NodeState.IN_TREE).toBe('in-tree');
    expect(EdgeState.SELECTED).toBe('selected');
  });

  it('clone은 독립 인스턴스를 반환한다', () => {
    const g = new Graph([{ id: 'A', x: 0, y: 0 }], []);
    const c = g.clone();
    c.addNode({ id: 'B', x: 1, y: 1 });
    expect(g.nodes.length).toBe(1);
    expect(c.nodes.length).toBe(2);
  });

  it('addEdge로 새 간선 추가 + 중복 간선 거절', () => {
    const g = new Graph(
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 1, y: 1 },
      ],
      [],
    );
    g.addEdge({ id: 'AB', u: 'A', v: 'B', weight: 2 });
    expect(g.edges.length).toBe(1);
    expect(() => g.addEdge({ id: 'AB', u: 'A', v: 'B', weight: 3 })).toThrow();
  });

  it('validate: 정점 id가 문자열이 아니면 에러', () => {
    expect(() => Graph.validate({ nodes: [{ id: 1, x: 0, y: 0 }], edges: [] })).toThrow(
      GraphValidationError,
    );
  });

  it('validate: 간선 id 중복 거절', () => {
    expect(() =>
      Graph.validate({
        nodes: [
          { id: 'A', x: 0, y: 0 },
          { id: 'B', x: 0, y: 0 },
        ],
        edges: [
          { id: 'E', u: 'A', v: 'B', weight: 1 },
          { id: 'E', u: 'A', v: 'B', weight: 2 },
        ],
      }),
    ).toThrow(GraphValidationError);
  });

  it('validate: 프리셋이 객체가 아니면 에러', () => {
    expect(() => Graph.validate(null)).toThrow(GraphValidationError);
    expect(() => Graph.validate(undefined)).toThrow(GraphValidationError);
  });

  it('validate: nodes 배열이 비어 있으면 에러', () => {
    expect(() => Graph.validate({ nodes: [], edges: [] })).toThrow(GraphValidationError);
  });

  it('validate: edges가 배열이 아니면 에러', () => {
    expect(() => Graph.validate({ nodes: [{ id: 'A', x: 0, y: 0 }], edges: 'no' })).toThrow(
      GraphValidationError,
    );
  });

  it('validate: 중복 정점 id는 validate에서 에러', () => {
    expect(() =>
      Graph.validate({
        nodes: [
          { id: 'A', x: 0, y: 0 },
          { id: 'A', x: 1, y: 0 },
        ],
        edges: [],
      }),
    ).toThrow(GraphValidationError);
  });

  it('validate: 존재하지 않는 정점 참조는 edge에서 에러', () => {
    expect(() =>
      Graph.validate({
        nodes: [{ id: 'A', x: 0, y: 0 }],
        edges: [{ id: 'X', u: 'A', v: 'B', weight: 1 }],
      }),
    ).toThrow(GraphValidationError);
  });
});
