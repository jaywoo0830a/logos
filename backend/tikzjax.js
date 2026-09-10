// ADAPT.md §4계층 — node-tikzjax (WASM) 백엔드
// 순수 WASM 으로 TikZ 를 SVG 로 렌더링. LaTeX 툴체인 불필요.
// 주의: 한 번에 하나의 인스턴스만 실행해야 한다(전역 단일 큐).
// node-tikzjax 1.x 의 실제 API: import 후 `await load()`, 그다음 `tex(input)`.

import * as tikzjax from 'node-tikzjax';

// node-tikzjax 1.x: `import tex2svg from 'node-tikzjax'` → default.default 가
// README 기준 함수 `tex2svg(input, options)` 이다. (다른 버전 대비 fallback)
const tex2svgFn = tikzjax.default?.default
  || tikzjax.default
  || tikzjax.tex
  || tikzjax['module.exports']?.tex;
const HAS_OPTIONS = tex2svgFn.name === 'tex2svg';

let busy = false;
let loaded = false;
const queue = [];
function acquire() {
  return new Promise((resolve) => {
    if (!busy) { busy = true; resolve(); return; }
    queue.push(resolve);
  });
}
function release() {
  if (queue.length) queue.shift()();
  else busy = false;
}

async function ensureLoaded() {
  if (!loaded) {
    if (tikzjax.load) { try { await tikzjax.load(); } catch { /* 일부 버전은 load() 무의미 */ } }
    loaded = true;
  }
}

/** TikZ 소스(또는 tex문서) 를 SVG 문자열로 변환. 싱글턴 큐. */
export async function tikzToSVG(tikzSource, opts = {}) {
  await acquire();
  try {
    await ensureLoaded();
    const tex = [
      '\\usepackage{pgfplots}',
      '\\pgfplotsset{compat=1.16}', // node-tikzjax(WASM) 번들 pgfplots 는 최대 1.16
      ...(opts.preamble || []),
      '\\begin{document}',
      tikzSource,
      '\\end{document}',
    ].join('\n');
    const callOpts = HAS_OPTIONS ? { ...(opts.options || {}), showConsole: opts.showConsole ?? false } : undefined;
    const svg = HAS_OPTIONS ? await tex2svgFn(tex, callOpts) : await tex2svgFn(tex);
    return svg;
  } finally {
    release();
  }
}

/** IR 노드 → TikZ → SVG (장황한 단계를 한 번에) */
export async function irToTikZSVG(ir, opts) {
  const { emitTikZ } = await import('./tikz.js');
  const tex = emitTikZ(ir.o.nodes, opts);
  const svg = await tikzToSVG(tex, opts);
  return { tex, svg };
}

export default tikzToSVG;