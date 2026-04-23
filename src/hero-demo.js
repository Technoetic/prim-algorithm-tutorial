// src/hero-demo.js — Chapter 1 히어로의 자동 재생 미니 데모
// 의존성: prim.js, renderer.js

import { PrimEngine } from './prim.js';
import { GraphRenderer } from './renderer.js';

export class HeroMiniDemo {
  constructor(svgEl, graph, startNodeId) {
    this.engine = new PrimEngine(graph, startNodeId);
    this.renderer = new GraphRenderer(svgEl, graph, { interactive: false });
    this.renderer.mount();
    this.idx = 0;
    this._timer = null;
    this._observer = null;
    this.svgEl = svgEl;
    this._reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  start() {
    this.renderer.applyStepState(this.engine.getStep(0), { animate: false });
    if (this._reducedMotion) {
      // 즉시 최종 상태 표시
      this.renderer.applyStepState(this.engine.getStep(this.engine.totalSteps - 1), {
        animate: false,
      });
      return;
    }
    if ('IntersectionObserver' in window) {
      this._observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && this.idx === 0) {
              setTimeout(() => this._tick(), 1500);
              this._observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.4 },
      );
      this._observer.observe(this.svgEl);
    } else {
      setTimeout(() => this._tick(), 1500);
    }
  }

  _tick() {
    if (this.idx >= this.engine.totalSteps - 1) return;
    this.idx += 1;
    this.renderer.applyStepState(this.engine.getStep(this.idx), { animate: true });
    this._timer = setTimeout(() => this._tick(), 700);
  }

  destroy() {
    if (this._timer) clearTimeout(this._timer);
    if (this._observer) this._observer.disconnect();
    this.renderer.destroy();
  }
}
