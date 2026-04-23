// src/renderer.js — GraphRenderer: SVG 마운트·상태 반영·이벤트
// 의존성: graph.js

const SVG_NS = 'http://www.w3.org/2000/svg';

export class GraphRenderer extends EventTarget {
  /**
   * @param {SVGElement} svgEl
   * @param {import('./graph.js').Graph} graph
   * @param {{ interactive?: boolean }} [options]
   */
  constructor(svgEl, graph, options = {}) {
    super();
    this.svgEl = svgEl;
    this.graph = graph;
    this.interactive = options.interactive !== false;
    this.nodeEls = new Map();
    this.edgeEls = new Map();
    this.edgeLabelEls = new Map();
    this._bounds = this._computeBounds();
    this._setupViewBox();
    this._nodeClickHandler = null;
  }

  _computeBounds() {
    // 노드 실제 경계 + 정점 반지름(22) + 라벨 박스 여유(14)를 위한 padding.
    // padding을 좌우·상하 모두 동일하게 적용해야 SVG가 컨테이너 정중앙에 렌더된다.
    if (this.graph.nodes.length === 0) {
      return { minX: 0, minY: 0, width: 100, height: 100 };
    }
    const xs = this.graph.nodes.map((n) => n.x);
    const ys = this.graph.nodes.map((n) => n.y);
    const pad = 48;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }

  _setupViewBox() {
    const { minX, minY, width, height } = this._bounds;
    this.svgEl.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    this.svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    if (this.interactive) {
      this.svgEl.setAttribute('role', 'application');
      this.svgEl.setAttribute('aria-label', '프림 알고리즘 인터랙티브 그래프');
    } else {
      this.svgEl.setAttribute('role', 'img');
      this.svgEl.setAttribute('aria-label', '프림 알고리즘 데모');
      this.svgEl.setAttribute('aria-hidden', 'true');
    }
  }

  mount() {
    this.svgEl.innerHTML = '';
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <pattern id="rejected-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
        <path d="M 0 8 L 8 0" stroke="#aaa" stroke-width="1"/>
      </pattern>
    `;
    this.svgEl.appendChild(defs);

    const edgeLayer = document.createElementNS(SVG_NS, 'g');
    edgeLayer.setAttribute('class', 'edges');
    this.svgEl.appendChild(edgeLayer);

    const nodeLayer = document.createElementNS(SVG_NS, 'g');
    nodeLayer.setAttribute('class', 'nodes');
    this.svgEl.appendChild(nodeLayer);

    // 간선
    for (const e of this.graph.edges) {
      const u = this.graph.getNode(e.u);
      const v = this.graph.getNode(e.v);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'edge state-unexamined');
      line.setAttribute('data-edge-id', e.id);
      line.setAttribute('x1', u.x);
      line.setAttribute('y1', u.y);
      line.setAttribute('x2', v.x);
      line.setAttribute('y2', v.y);
      line.setAttribute('stroke-width', '3');
      edgeLayer.appendChild(line);
      this.edgeEls.set(e.id, line);

      // 가중치 라벨
      const mx = (u.x + v.x) / 2;
      const my = (u.y + v.y) / 2;
      const labelGroup = document.createElementNS(SVG_NS, 'g');
      labelGroup.setAttribute('class', 'edge-label');
      labelGroup.setAttribute('transform', `translate(${mx},${my})`);
      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', '-14');
      bg.setAttribute('y', '-11');
      bg.setAttribute('width', '28');
      bg.setAttribute('height', '20');
      bg.setAttribute('rx', '4');
      bg.setAttribute('fill', '#FFFFFF');
      bg.setAttribute('stroke', '#E2DED3');
      const txt = document.createElementNS(SVG_NS, 'text');
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('dominant-baseline', 'central');
      txt.setAttribute('font-family', 'JetBrains Mono, Courier New, monospace');
      txt.setAttribute('font-size', '13');
      txt.setAttribute('fill', '#1A1A1A');
      txt.textContent = String(e.weight);
      labelGroup.appendChild(bg);
      labelGroup.appendChild(txt);
      edgeLayer.appendChild(labelGroup);
      this.edgeLabelEls.set(e.id, labelGroup);
    }

    // 정점
    for (const n of this.graph.nodes) {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'node state-unexplored');
      g.setAttribute('data-node-id', n.id);
      g.setAttribute('transform', `translate(${n.x},${n.y})`);
      if (this.interactive) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `정점 ${n.label ?? n.id}. 클릭하면 이 정점에서 시작`);
      } else {
        g.setAttribute('aria-hidden', 'true');
      }

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', '22');
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.setAttribute('font-family', 'Helvetica Neue, Arial, sans-serif');
      label.setAttribute('font-weight', '700');
      label.setAttribute('font-size', '15');
      label.textContent = n.label ?? n.id;
      g.appendChild(label);

      if (this.interactive) {
        const onSelect = () => {
          this.dispatchEvent(new CustomEvent('nodeClick', { detail: { id: n.id } }));
        };
        g.addEventListener('click', onSelect);
        g.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            onSelect();
          }
        });
      }

      nodeLayer.appendChild(g);
      this.nodeEls.set(n.id, g);
    }
  }

  /**
   * @param {import('./prim.js').StepState} step
   */
  applyStepState(step, { animate = true } = {}) {
    if (!step) return;

    // 정점 상태 계산
    for (const n of this.graph.nodes) {
      const el = this.nodeEls.get(n.id);
      if (!el) continue;
      let state = 'unexplored';
      if (step.mstNodeIds.has(n.id)) state = 'in-tree';
      if (step.frontier.has(n.id)) state = 'frontier';
      if (step.currentNodeId === n.id) state = 'current';
      this._setNodeState(el, state);
    }

    // 간선 상태 계산
    for (const e of this.graph.edges) {
      const el = this.edgeEls.get(e.id);
      if (!el) continue;
      let state = 'unexamined';
      if (step.mstEdgeIds.has(e.id)) state = 'selected';
      if (step.consideredEdgeId === e.id) {
        state = step.rejectedReason ? 'rejected' : 'candidate';
      }
      this._setEdgeState(el, state);
    }

    // 애니메이션 억제(reduced motion 또는 animate=false)
    if (!animate) {
      this.svgEl.style.setProperty('--transition-duration', '0ms');
    } else {
      this.svgEl.style.removeProperty('--transition-duration');
    }
  }

  _setNodeState(el, state) {
    el.classList.remove('state-unexplored', 'state-frontier', 'state-in-tree', 'state-current');
    el.classList.add(`state-${state}`);
  }

  _setEdgeState(el, state) {
    el.classList.remove('state-unexamined', 'state-candidate', 'state-selected', 'state-rejected');
    el.classList.add(`state-${state}`);
  }

  destroy() {
    this.nodeEls.clear();
    this.edgeEls.clear();
    this.edgeLabelEls.clear();
    this.svgEl.innerHTML = '';
  }
}
