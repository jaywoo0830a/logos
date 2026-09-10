// ADAPT.md 외부엔진 end-to-end 데모:
// 1) SymPy(subprocess) 심볼릭 2) Asymptote(.asy → SVG) 3) node-tikzjax(TikZ → SVG WASM)
// 실행: docker compose run --rm logos node examples/adapters.js
import { scene, point, circle, tex, adapt } from '../index.js';
import { SymPyAdapter } from '../symbolic/adapter.js';
import { compileAsymptote, irToAsymptote } from '../backend/asymptote.js';
import { tikzToSVG } from '../backend/tikzjax.js';
import { readFileSync } from 'node:fs';

// 1) SymPy 심볼릭
(async () => {
  const a = new SymPyAdapter();
  const ok = await SymPyAdapter.detect();
  if (ok) {
    console.log('[SymPy]  diff:', await a.diff('x**2 - 1', 'x'));
    console.log('[SymPy]  solve:', (await a.solve('x**2-5*x+6','x')).replace(/\n/g, ' | '));
    console.log('[SymPy]  int :', await a.integrate('x**2', { var: 'x' }));
  } else {
    console.log('[SymPy]  미감지 (SKIP)');
  }

  // 2) Asymptote: .asy 생성 + 컴파일
  const ir = scene()
    .view([-3, 3], [-2, 2])
    .add(point(1, 1).label('A'), circle.center(point(0, 0)).radius(1.5))
    .compile();
  const asy = ir.toAsymptote({ width: 320, height: 320 });
  console.log('[Asymptote] 소스:\n' + asy.split('\n').slice(0, 4).join('\n'));
  try {
    const { path } = await compileAsymptote(asy, { format: 'svg', cwd: '/tmp' });
    const svg = readFileSync(path, 'utf8');
    console.log('[Asymptote] SVG 컴파일 성공, 길이:', svg.length);
  } catch (e) {
    console.error('[Asymptote] 컴파일 실패:', e.message.slice(0, 120));
  }

  // 3) node-tikzjax (WASM) TikZ → SVG
  try {
    const svg = await tikzToSVG(
      '\\begin{tikzpicture}\\draw (0,0) circle (1);\\draw[->] (-2,0)--(2,0);\\end{tikzpicture}',
    );
    console.log('[TikZJax] WASM SVG 성공, 길이:', svg.length, svg.includes('<svg') ? '(svg)' : '');
  } catch (e) {
    console.error('[TikZJax] 실패:', e.message.slice(0, 200));
  }
})();