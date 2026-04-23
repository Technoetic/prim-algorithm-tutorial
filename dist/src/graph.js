// src/graph.js — Graph 자료구조 + 상태 enum + 검증
// 의존성: 없음

export const NodeState = Object.freeze({
  UNEXPLORED: 'unexplored',
  FRONTIER: 'frontier',
  IN_TREE: 'in-tree',
  CURRENT: 'current',
});

export const EdgeState = Object.freeze({
  UNEXAMINED: 'unexamined',
  CANDIDATE: 'candidate',
  SELECTED: 'selected',
  REJECTED: 'rejected',
});

export class GraphValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GraphValidationError';
  }
}

export class Graph {
  constructor(nodes = [], edges = []) {
    this.nodes = nodes.map((n) => ({ ...n }));
    this.edges = edges.map((e) => ({ ...e }));
    this._nodeIndex = new Map(this.nodes.map((n) => [n.id, n]));
    this._edgeIndex = new Map(this.edges.map((e) => [e.id, e]));
    this._adj = null;
  }

  addNode(node) {
    if (this._nodeIndex.has(node.id)) {
      throw new GraphValidationError(`중복 정점 id: ${node.id}`);
    }
    this.nodes.push({ ...node });
    this._nodeIndex.set(node.id, this.nodes[this.nodes.length - 1]);
    this._adj = null;
    return this;
  }

  addEdge(edge) {
    if (this._edgeIndex.has(edge.id)) {
      throw new GraphValidationError(`중복 간선 id: ${edge.id}`);
    }
    if (!this._nodeIndex.has(edge.u) || !this._nodeIndex.has(edge.v)) {
      throw new GraphValidationError(`존재하지 않는 정점 참조: ${edge.u}-${edge.v}`);
    }
    this.edges.push({ ...edge });
    this._edgeIndex.set(edge.id, this.edges[this.edges.length - 1]);
    this._adj = null;
    return this;
  }

  getNode(id) {
    return this._nodeIndex.get(id);
  }

  getEdge(id) {
    return this._edgeIndex.get(id);
  }

  getNeighbors(nodeId) {
    if (!this._adj) this._buildAdj();
    return this._adj.get(nodeId) ?? [];
  }

  _buildAdj() {
    this._adj = new Map(this.nodes.map((n) => [n.id, []]));
    for (const e of this.edges) {
      this._adj.get(e.u).push({ to: e.v, weight: e.weight, edgeId: e.id });
      this._adj.get(e.v).push({ to: e.u, weight: e.weight, edgeId: e.id });
    }
    // 재현성: neighbor를 id 오름차순으로 정렬
    for (const list of this._adj.values()) {
      list.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
    }
  }

  clone() {
    return new Graph(this.nodes, this.edges);
  }

  static validate(presetJson) {
    if (!presetJson || typeof presetJson !== 'object') {
      throw new GraphValidationError('프리셋이 객체가 아닙니다.');
    }
    const { nodes, edges, startNodeId } = presetJson;
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new GraphValidationError('정점 목록이 비어 있습니다.');
    }
    if (!Array.isArray(edges)) {
      throw new GraphValidationError('간선 목록이 배열이 아닙니다.');
    }
    const ids = new Set();
    for (const n of nodes) {
      if (!n || typeof n.id !== 'string') {
        throw new GraphValidationError('정점 id가 문자열이 아닙니다.');
      }
      if (ids.has(n.id)) {
        throw new GraphValidationError(`중복 정점 id: ${n.id}`);
      }
      ids.add(n.id);
    }
    const edgeIds = new Set();
    for (const e of edges) {
      if (!e || typeof e.id !== 'string') {
        throw new GraphValidationError('간선 id가 문자열이 아닙니다.');
      }
      if (edgeIds.has(e.id)) {
        throw new GraphValidationError(`중복 간선 id: ${e.id}`);
      }
      edgeIds.add(e.id);
      if (!ids.has(e.u) || !ids.has(e.v)) {
        throw new GraphValidationError(`존재하지 않는 정점 참조: ${e.id} (${e.u}-${e.v})`);
      }
      if (typeof e.weight !== 'number' || Number.isNaN(e.weight)) {
        throw new GraphValidationError(`가중치가 숫자가 아닙니다: ${e.id}`);
      }
    }
    if (startNodeId && !ids.has(startNodeId)) {
      throw new GraphValidationError(`시작 정점이 존재하지 않습니다: ${startNodeId}`);
    }
  }

  static fromPreset(presetJson) {
    Graph.validate(presetJson);
    return new Graph(presetJson.nodes, presetJson.edges);
  }
}
