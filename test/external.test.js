import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adapt } from '../index.js';

test(
  'node-tikzjax: TikZ → SVG (WASM, 단일 인스턴스)',
  async () => {
    const { tikzToSVG } = await import('../backend/tikzjax.js');
    const svg = await tikzToSVG(
      '\\begin{tikzpicture}\\draw (0,0) circle (1);\\draw[->] (-2,0)--(2,0);\\end{tikzpicture}',
      { showConsole: false },
    );
    assert.ok(String(svg).includes('<svg'), 'SVG 생성');
  },
  { timeout: 30000 },
);

test('MathLikeAnim: WASM 어댑터 상태 보고 (ADAPT §3)', async () => {
  const { initMathLikeAnim } = await import('../backend/mathlikeanim.js');
  const r = await initMathLikeAnim();
  // Node 에서는 DOM 기반이라 ok:false + 안내가 정상 동작
  assert.equal(typeof r.ok, 'boolean');
  assert.ok('reason' in r);
});
