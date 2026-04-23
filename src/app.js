// src/app.js — 진입점
// 의존성: controller.js

import { PSEUDOCODE_LINES, TutorialApp } from './controller.js';

function formatFrontier(frontier) {
  if (frontier.size === 0) return '{ }';
  const parts = [];
  for (const [id, { cost }] of frontier) {
    parts.push(`${id}:${cost}`);
  }
  return `{ ${parts.sort().join(', ')} }`;
}

function renderCodePanel(codeEl) {
  codeEl.innerHTML = '';
  PSEUDOCODE_LINES.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'code-line';
    div.dataset.line = String(i + 1);
    div.textContent = line;
    codeEl.appendChild(div);
  });
}

function highlightCodeLine(codeEl, lineNo) {
  codeEl.querySelectorAll('.code-line').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.line) === lineNo);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new TutorialApp(document.querySelector('main'));
  const restored = app.restoreProgress();
  if (restored?.lastPreset) app.currentPreset = restored.lastPreset;

  try {
    await app.loadPreset(app.currentPreset);
  } catch {
    await app.loadPreset('cable');
  }

  const svgEl = document.querySelector('[data-role="main-svg"]');
  const heroSvg = document.querySelector('[data-role="hero-svg"]');
  const codeEl = document.querySelector('[data-role="code-panel"]');
  const toastEl = document.querySelector('[data-role="toast"]');
  const progressEl = document.querySelector('[data-role="progress"]');
  const totalCostEl = document.querySelector('[data-role="total-cost"]');
  const frontierEl = document.querySelector('[data-role="frontier"]');
  const playBtn = document.querySelector('[data-action="play"]');
  const prevBtn = document.querySelector('[data-action="prev"]');
  const nextBtn = document.querySelector('[data-action="next"]');
  const resetBtn = document.querySelector('[data-action="reset"]');
  const speedBtns = document.querySelectorAll('[data-action="speed"]');
  const presetBtns = document.querySelectorAll('[data-action="preset"]');
  const storyEl = document.querySelector('[data-role="story"]');

  renderCodePanel(codeEl);

  app.bindVisualization({ svgEl });

  // Hero 프리뷰 (Chapter 1) — 동일 그래프, 자동 재생
  if (heroSvg) {
    const { HeroMiniDemo } = await import('./hero-demo.js').catch(() => ({}));
    if (HeroMiniDemo) {
      const demo = new HeroMiniDemo(heroSvg, app.graph, app.startNodeId);
      demo.start();
    }
  }

  const updateUI = (detail) => {
    if (toastEl) toastEl.textContent = detail.explainKo;
    if (progressEl) progressEl.textContent = `${detail.idx + 1} / ${detail.total}`;
    if (totalCostEl) {
      totalCostEl.textContent = String(detail.totalCost);
    }
    if (frontierEl) frontierEl.textContent = formatFrontier(detail.frontier);
    if (codeEl) highlightCodeLine(codeEl, detail.codeLine);
  };

  const attachControllerListeners = () => {
    const c = app.controller;
    c.addEventListener('stepChange', (evt) => updateUI(evt.detail));
    c.addEventListener('playStateChange', (evt) => {
      if (playBtn) {
        playBtn.textContent = evt.detail.playing ? '⏸ 일시정지' : '▶ 재생';
        playBtn.setAttribute('aria-pressed', String(evt.detail.playing));
      }
    });
    c.addEventListener('complete', () => {
      if (toastEl) toastEl.classList.add('complete');
    });
  };
  attachControllerListeners();

  playBtn?.addEventListener('click', () => {
    const c = app.controller;
    if (c.isPlaying) c.pause();
    else c.play();
  });
  prevBtn?.addEventListener('click', () => app.controller.step(-1));
  nextBtn?.addEventListener('click', () => app.controller.step(+1));
  resetBtn?.addEventListener('click', () => app.controller.reset());
  for (const btn of speedBtns) {
    btn.addEventListener('click', () => {
      const v = Number(btn.dataset.speed);
      app.controller.setSpeed(v);
      for (const b of speedBtns) b.classList.toggle('active', b === btn);
    });
  }
  for (const btn of presetBtns) {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.preset;
      const activeSpeedBtn = [...speedBtns].find((b) => b.classList.contains('active'));
      const prevSpeed = activeSpeedBtn ? Number(activeSpeedBtn.dataset.speed) : 1;
      await app.setPreset(name);
      // 새 controller가 생성되었으므로 리스너 재부착 + 속도 이어받기
      attachControllerListeners();
      app.controller.setSpeed(prevSpeed);
      for (const b of presetBtns) b.classList.toggle('active', b === btn);
      if (storyEl && app._presetMeta?.story) {
        storyEl.textContent = app._presetMeta.story;
      }
      // 새 그래프 바인딩 후 초기 스텝 표시
      updateUI({
        idx: 0,
        total: app.engine.totalSteps,
        totalCost: 0,
        explainKo: `"${name}" 프리셋을 불러왔어요. ▶ 재생을 눌러보세요.`,
        codeLine: 1,
        frontier: new Map(),
      });
    });
  }

  if (storyEl && app._presetMeta?.story) {
    storyEl.textContent = app._presetMeta.story;
  }

  app.attachKeyboardShortcuts();
  app.saveProgress();

  // 초기 1스텝 보여주기
  updateUI({
    idx: 0,
    total: app.engine.totalSteps,
    totalCost: 0,
    explainKo: `▶ 재생을 눌러 프림 알고리즘을 실행해보세요.`,
    codeLine: 1,
    frontier: new Map([[app.startNodeId, { cost: 0, viaEdgeId: null }]]),
  });
});
