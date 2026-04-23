// src/controller.js — PlaybackController + TutorialApp
// 의존성: graph.js, prim.js, renderer.js

import { Graph } from './graph.js';
import { PrimEngine } from './prim.js';
import { GraphRenderer } from './renderer.js';

const PSEUDOCODE_LINES = [
  '1  for each vertex in vertices do',
  '2    cheapestCost[vertex] ← ∞',
  '3    cheapestEdge[vertex] ← null',
  '4  startVertex의 cost를 0으로',
  '5  while unexplored is not empty do',
  '6    u ← argmin cheapestCost[v]',
  '7    unexplored.remove(u)',
  '8    explored.add(u)',
  '9    for each edge (u,neighbor) do',
  '10     if neighbor ∈ explored then continue  // 사이클',
  '11     if weight(u,neighbor) < cost[neighbor] then',
  '12       cost[neighbor] ← weight',
  '13       edge[neighbor] ← (u,neighbor)',
  '14 return edges',
];

export class PlaybackController extends EventTarget {
  constructor(engine, renderer, options = {}) {
    super();
    this.engine = engine;
    this.renderer = renderer;
    this.currentStep = 0;
    this.speed = options.speed ?? 1;
    this.isPlaying = false;
    this._timer = null;
    this._reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this._renderCurrent(false);
  }

  _renderCurrent(animate = true) {
    const step = this.engine.getStep(this.currentStep);
    this.renderer.applyStepState(step, { animate: animate && !this._reducedMotion });
    this.dispatchEvent(
      new CustomEvent('stepChange', {
        detail: {
          idx: this.currentStep,
          total: this.engine.totalSteps,
          phase: step.phase,
          totalCost: step.totalCost,
          explainKo: step.explainKo,
          codeLine: step.codeLine,
          frontier: step.frontier,
          mstNodeIds: step.mstNodeIds,
        },
      }),
    );
  }

  play() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.engine.totalSteps - 1) {
      this.currentStep = 0;
      this._renderCurrent(false);
    }
    this.isPlaying = true;
    this.dispatchEvent(new CustomEvent('playStateChange', { detail: { playing: true } }));
    const tick = () => {
      if (!this.isPlaying) return;
      if (this.currentStep >= this.engine.totalSteps - 1) {
        this.isPlaying = false;
        this.dispatchEvent(new CustomEvent('complete'));
        this.dispatchEvent(new CustomEvent('playStateChange', { detail: { playing: false } }));
        return;
      }
      this.currentStep += 1;
      this._renderCurrent(true);
      this._timer = setTimeout(tick, 700 / this.speed);
    };
    this._timer = setTimeout(tick, 400 / this.speed);
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this.dispatchEvent(new CustomEvent('playStateChange', { detail: { playing: false } }));
  }

  step(dir) {
    this.pause();
    const next = this.currentStep + (dir > 0 ? 1 : -1);
    this.setStep(next);
  }

  reset() {
    this.pause();
    this.setStep(0);
  }

  setSpeed(mult) {
    this.speed = mult;
    this.dispatchEvent(new CustomEvent('speedChange', { detail: { speed: mult } }));
  }

  setStep(idx) {
    const clamped = Math.max(0, Math.min(this.engine.totalSteps - 1, idx));
    this.currentStep = clamped;
    this._renderCurrent(true);
  }

  destroy() {
    this.pause();
  }
}

export class TutorialApp {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.currentPreset = 'cable';
    this.startNodeId = 'A';
    this.graph = null;
    this.engine = null;
    this.renderer = null;
    this.controller = null;
    this._chapter = 1;
  }

  async loadPreset(name) {
    try {
      const res = await fetch(`./presets/${name}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      this.graph = Graph.fromPreset(json);
      this.currentPreset = name;
      this.startNodeId = json.startNodeId ?? this.graph.nodes[0].id;
      this._presetMeta = json;
      return json;
    } catch (err) {
      console.error('프리셋 로드 실패', err);
      throw err;
    }
  }

  bindVisualization({ svgEl }) {
    if (!this.graph) throw new Error('loadPreset() 먼저 호출');
    if (this.renderer) this.renderer.destroy();
    if (this.controller) this.controller.destroy();
    this.engine = new PrimEngine(this.graph, this.startNodeId);
    this.renderer = new GraphRenderer(svgEl, this.graph);
    this.renderer.mount();
    this.controller = new PlaybackController(this.engine, this.renderer, { speed: 1 });

    this.renderer.addEventListener('nodeClick', (evt) => {
      this.setStartNode(evt.detail.id);
    });

    return { engine: this.engine, renderer: this.renderer, controller: this.controller };
  }

  setStartNode(nodeId) {
    if (!this.graph?.getNode(nodeId)) return;
    this.startNodeId = nodeId;
    this.engine = new PrimEngine(this.graph, this.startNodeId);
    if (this.controller) {
      this.controller.engine = this.engine;
      this.controller.setStep(0);
    }
    this.rootEl.dispatchEvent(
      new CustomEvent('prim:startNodeChange', { detail: { id: nodeId }, bubbles: true }),
    );
  }

  async setPreset(name) {
    await this.loadPreset(name);
    const svgEl = this.rootEl.querySelector('[data-role="main-svg"]');
    if (svgEl) this.bindVisualization({ svgEl });
    this.rootEl.dispatchEvent(
      new CustomEvent('prim:presetLoaded', { detail: { name, graph: this.graph }, bubbles: true }),
    );
  }

  setChapter(n) {
    this._chapter = n;
    this.rootEl.querySelectorAll('[data-chapter]').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.chapter) === n);
    });
    this.rootEl.dispatchEvent(
      new CustomEvent('prim:chapterChange', { detail: { to: n }, bubbles: true }),
    );
  }

  saveProgress() {
    try {
      const data = {
        v: 1,
        lastPreset: this.currentPreset,
        speed: this.controller?.speed ?? 1,
        chapter: this._chapter,
      };
      localStorage.setItem('prim-tutorial:settings', JSON.stringify(data));
    } catch {
      /* storage blocked, ignore */
    }
  }

  restoreProgress() {
    try {
      const raw = localStorage.getItem('prim-tutorial:settings');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  attachKeyboardShortcuts() {
    document.addEventListener('keydown', (evt) => {
      if (evt.target.matches('input, textarea')) return;
      if (!this.controller) return;
      switch (evt.key) {
        case ' ':
          evt.preventDefault();
          if (this.controller.isPlaying) this.controller.pause();
          else this.controller.play();
          break;
        case 'ArrowRight':
          this.controller.step(+1);
          break;
        case 'ArrowLeft':
          this.controller.step(-1);
          break;
        case 'r':
        case 'R':
          this.controller.reset();
          break;
        case '1':
          this.controller.setSpeed(0.5);
          break;
        case '2':
          this.controller.setSpeed(1);
          break;
        case '3':
          this.controller.setSpeed(1.5);
          break;
      }
    });
  }
}

export { PSEUDOCODE_LINES };
