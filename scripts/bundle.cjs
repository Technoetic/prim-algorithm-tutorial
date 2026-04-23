// scripts/bundle.cjs — src/*.js + src/css/*.css → dist/single.html 인라인 번들
// ES module export/import는 제거/치환하여 단일 스크립트로 만든다.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlIn = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// CSS 수집 순서: tokens → layout → components → viz
const cssFiles = ['tokens', 'layout', 'components', 'viz'].map((n) =>
  path.join(root, 'src/css', `${n}.css`),
);
let cssBundle = cssFiles
  .map((p) => `/* === ${path.basename(p)} === */\n` + fs.readFileSync(p, 'utf8'))
  .join('\n');

// JS 수집 순서: graph → prim → renderer → controller → hero-demo → app
const jsFiles = ['graph', 'prim', 'renderer', 'controller', 'hero-demo', 'app'].map((n) =>
  path.join(root, 'src', `${n}.js`),
);
let jsBundle = '';
for (const f of jsFiles) {
  let content = fs.readFileSync(f, 'utf8');
  // 상대 경로 import 제거 (파일들이 같은 스코프에 합쳐지므로)
  content = content.replace(/^\s*import\s+[^;]+from\s+['"][^'"]+['"]\s*;?\s*$/gm, '');
  // export 키워드만 제거(본체는 유지)
  content = content.replace(/^\s*export\s+(class|const|let|var|function)/gm, '$1');
  content = content.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  jsBundle += `\n/* === ${path.basename(f)} === */\n` + content + '\n';
}

// dynamic import 처리: app.js의 `import('./hero-demo.js')`는 이미 HeroMiniDemo가 포함되므로 직접 생성으로 치환
jsBundle = jsBundle.replace(
  /const\s+\{\s*HeroMiniDemo\s*\}\s*=\s*await\s+import\([^)]+\)\.catch\(\(\)\s*=>\s*\(\{\}\)\);?/,
  'const HeroMiniDemo = globalThis.HeroMiniDemo || null;',
);

// globalThis.HeroMiniDemo 노출
jsBundle += '\nglobalThis.HeroMiniDemo = HeroMiniDemo;\n';

// 프리셋 인라인: file:// 에서도 동작하도록
const presetMap = {};
for (const name of ['cable', 'grid', 'maze']) {
  presetMap[name] = JSON.parse(
    fs.readFileSync(path.join(root, 'presets', `${name}.json`), 'utf8'),
  );
}
jsBundle =
  `\nconst __PRESETS__ = ${JSON.stringify(presetMap)};\n` +
  `const __origFetch = globalThis.fetch;\n` +
  `globalThis.fetch = async function(url, opts) {\n` +
  `  const m = String(url).match(/presets\\/(\\w+)\\.json/);\n` +
  `  if (m && __PRESETS__[m[1]]) {\n` +
  `    return new Response(JSON.stringify(__PRESETS__[m[1]]), { status: 200, headers: { 'Content-Type': 'application/json' } });\n` +
  `  }\n` +
  `  return __origFetch.call(this, url, opts);\n` +
  `};\n` +
  jsBundle;

// HTML 조립: <link rel="stylesheet">, <link rel="preload"> 제거하고 <style>로 대체
let html = htmlIn;
html = html.replace(/<link rel="preload"[^>]*>\s*/g, '');
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, '');
html = html.replace(
  /<\/head>/,
  `  <style>\n${cssBundle}\n  </style>\n  </head>`,
);
html = html.replace(
  /<script\s+type="module"\s+src="[^"]+"[^>]*>\s*<\/script>/,
  `<script>${jsBundle}\n</script>`,
);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/single.html'), html, 'utf8');
console.log('dist/single.html', fs.statSync(path.join(root, 'dist/single.html')).size, 'bytes');
