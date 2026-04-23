// src/prim.js — PrimEngine: 프림 알고리즘 스텝 제너레이터
// 의존성: graph.js

import { Graph } from './graph.js';

/**
 * @typedef {Object} StepState
 * @property {number} idx
 * @property {'init'|'pick'|'relax'|'reject'|'done'} phase
 * @property {string|null} currentNodeId
 * @property {Set<string>} mstNodeIds
 * @property {Set<string>} mstEdgeIds
 * @property {Map<string, {cost:number, viaEdgeId:string}>} frontier
 * @property {string|null} consideredEdgeId
 * @property {'cycle'|'higher-weight'|null} rejectedReason
 * @property {number} totalCost
 * @property {string} explainKo
 * @property {number} codeLine
 */

export class PrimEngine {
  constructor(graph, startNodeId) {
    if (!(graph instanceof Graph)) {
      throw new TypeError('graph는 Graph 인스턴스여야 합니다.');
    }
    if (graph.nodes.length === 0) {
      this.graph = graph;
      this.startNodeId = null;
      this.steps = [
        this._buildStep({
          idx: 0,
          phase: 'done',
          currentNodeId: null,
          mstNodeIds: new Set(),
          mstEdgeIds: new Set(),
          frontier: new Map(),
          consideredEdgeId: null,
          rejectedReason: null,
          totalCost: 0,
          explainKo: '그래프가 비어 있어요.',
          codeLine: 0,
        }),
      ];
      this.totalSteps = 1;
      return;
    }
    if (!graph.getNode(startNodeId)) {
      throw new Error(`시작 정점이 존재하지 않습니다: ${startNodeId}`);
    }
    this.graph = graph;
    this.startNodeId = startNodeId;
    this.steps = [];
    this.#computeAllSteps();
    this.totalSteps = this.steps.length;
  }

  getStep(idx) {
    if (idx < 0) idx = 0;
    if (idx >= this.totalSteps) idx = this.totalSteps - 1;
    return this.steps[idx];
  }

  _buildStep(s) {
    return Object.freeze({
      idx: s.idx,
      phase: s.phase,
      currentNodeId: s.currentNodeId,
      mstNodeIds: s.mstNodeIds,
      mstEdgeIds: s.mstEdgeIds,
      frontier: s.frontier,
      consideredEdgeId: s.consideredEdgeId,
      rejectedReason: s.rejectedReason,
      totalCost: s.totalCost,
      explainKo: s.explainKo,
      codeLine: s.codeLine ?? 0,
    });
  }

  #computeAllSteps() {
    const g = this.graph;
    const mstNodes = new Set();
    const mstEdges = new Set();
    // frontier: nodeId -> { cost, viaEdgeId }
    const frontier = new Map();
    let totalCost = 0;
    let stepIdx = 0;

    // Step 0: init
    frontier.set(this.startNodeId, { cost: 0, viaEdgeId: null });
    this.steps.push(
      this._buildStep({
        idx: stepIdx++,
        phase: 'init',
        currentNodeId: null,
        mstNodeIds: new Set(mstNodes),
        mstEdgeIds: new Set(mstEdges),
        frontier: new Map(frontier),
        consideredEdgeId: null,
        rejectedReason: null,
        totalCost,
        explainKo: `시작 정점 "${this.startNodeId}"에서 트리를 시작합니다.`,
        codeLine: 1,
      }),
    );

    const pushRelaxStep = (phase, pickId, edgeId, rejectedReason, explainKo, codeLine) => {
      this.steps.push(
        this._buildStep({
          idx: stepIdx++,
          phase,
          currentNodeId: pickId,
          mstNodeIds: new Set(mstNodes),
          mstEdgeIds: new Set(mstEdges),
          frontier: new Map(frontier),
          consideredEdgeId: edgeId,
          rejectedReason,
          totalCost,
          explainKo,
          codeLine,
        }),
      );
    };

    while (mstNodes.size < g.nodes.length && frontier.size > 0) {
      // pick: frontier에서 비용 최소 + id 오름차순 tie-break
      const picked = this._pickMin(frontier);
      if (!picked) break;
      const [pickId, pickEntry] = picked;
      frontier.delete(pickId);
      mstNodes.add(pickId);
      if (pickEntry.viaEdgeId) {
        mstEdges.add(pickEntry.viaEdgeId);
        totalCost += pickEntry.cost;
      }
      this.steps.push(
        this._buildStep({
          idx: stepIdx++,
          phase: 'pick',
          currentNodeId: pickId,
          mstNodeIds: new Set(mstNodes),
          mstEdgeIds: new Set(mstEdges),
          frontier: new Map(frontier),
          consideredEdgeId: pickEntry.viaEdgeId,
          rejectedReason: null,
          totalCost,
          explainKo: pickEntry.viaEdgeId
            ? `정점 "${pickId}"를 비용 ${pickEntry.cost}로 트리에 추가합니다.`
            : `시작 정점 "${pickId}"를 트리에 포함합니다.`,
          codeLine: 6,
        }),
      );

      // relax: 이웃 탐색
      const neighbors = g.getNeighbors(pickId);
      for (const { to, weight, edgeId } of neighbors) {
        if (mstNodes.has(to)) {
          if (mstEdges.has(edgeId)) continue;
          pushRelaxStep(
            'reject',
            pickId,
            edgeId,
            'cycle',
            `간선 ${edgeId}는 이미 트리에 있는 두 정점을 다시 연결하므로 거절합니다. (사이클 방지)`,
            10,
          );
          continue;
        }
        const existing = frontier.get(to);
        if (
          !existing ||
          weight < existing.cost ||
          (weight === existing.cost && edgeId < existing.viaEdgeId)
        ) {
          frontier.set(to, { cost: weight, viaEdgeId: edgeId });
          pushRelaxStep(
            'relax',
            pickId,
            edgeId,
            null,
            `정점 "${to}"로 가는 비용을 ${weight}로 갱신합니다. (간선 ${edgeId})`,
            11,
          );
        } else {
          pushRelaxStep(
            'reject',
            pickId,
            edgeId,
            'higher-weight',
            `간선 ${edgeId}(비용 ${weight})는 현재 "${to}"의 더 싼 경로보다 비싸서 건너뜁니다.`,
            11,
          );
        }
      }
    }

    // done
    const isDisconnected = mstNodes.size < g.nodes.length;
    this.steps.push(
      this._buildStep({
        idx: stepIdx++,
        phase: 'done',
        currentNodeId: null,
        mstNodeIds: new Set(mstNodes),
        mstEdgeIds: new Set(mstEdges),
        frontier: new Map(),
        consideredEdgeId: null,
        rejectedReason: null,
        totalCost,
        explainKo: isDisconnected
          ? `완료. 단, 연결되지 않은 정점이 ${g.nodes.length - mstNodes.size}개 있어요.`
          : `완료! 모든 정점이 연결되었고 총 비용은 ${totalCost}입니다.`,
        codeLine: 14,
      }),
    );
  }

  _pickMin(frontier) {
    let bestId = null;
    let bestEntry = null;
    for (const [id, entry] of frontier) {
      if (
        bestEntry === null ||
        entry.cost < bestEntry.cost ||
        (entry.cost === bestEntry.cost && id < bestId)
      ) {
        bestId = id;
        bestEntry = entry;
      }
    }
    return bestId === null ? null : [bestId, bestEntry];
  }
}
