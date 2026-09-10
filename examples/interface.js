// INTERFACE.md 예제를 실행해 end-to-end 파이프라인을 확인하는 데모.
// 렌더링 결과(SVG)를 output/ 에 저장한다. (실행 후 브라우저로 열어 확인)
// 실행: docker compose run --rm logos node examples/interface.js
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scene, point, line, curve, circle, segment, triangle,
  region, annotate, transform, tex, tau, pi,
} from '../index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'output');
mkdirSync(OUT, { recursive: true });

/** SVG를 output/ 에 저장하고 경로/길이를 반환 */
function save(name, svg) {
  const path = join(OUT, `${name}.svg`);
  writeFileSync(path, svg, 'utf8');
  console.log(`  ✓ ${path} (${svg.length} bytes)`);
  return path;
}

// ── §2 중학교 — 삼각형의 내심 ───────────────────
const A = point(0, 0).label('A').dot();
const B = point(5, 0).label('B').dot();
const C = point(1.5, 4).label('C').dot();
const tri = triangle(A, B, C).fill('#eef3ff').stroke(2);

const fig1 = scene()
  .view([-1, 6], [-1, 5])
  .equal().axes().theme('textbook')
  .add(tri, A, B, C,
       circle.inscribed(tri).color('#e11').dash([4, 3]),
       segment(A, point.incenter(tri)).dash([2, 2]).color('#888'),
       annotate.angle(A, B, C).arc().degrees().label('α'),
       annotate.caption(tex`\text{내심과 내접원}`))
  .compile();
console.log('fig1 (내심):');
save('01-triangle-incenter', fig1.toSVG());

// ── §3 고등학교 — 원과 접선 ─────────────────────
const O = point.origin().label('O').dot();
const P = point(5, 0).label('P').dot();
const Cc = circle.center(O).radius(3);

const fig2 = scene()
  .view([-4, 6], [-4, 4]).equal().axes().theme('textbook')
  .add(Cc.stroke(2), O, P,
       line.through(P, point(5, 4)).color('#c00'),
       segment(O, point(5, 4)).dash([3, 3]).color('#888'),
       annotate.angle(O, P, point(5, 4)).rightAngle())
  .compile();
console.log('fig2 (접선):');
save('02-circle-tangent', fig2.toSVG());

// ── §4 미적분 — 함수 + 접선 + 리만합 + 정적분 라벨 ─
const f = tex`x^{2} - 1`;
const df = f.diff('x').simplify();
const m = df.toFunction('x')(1);        // 2
const y0 = f.toFunction('x')(1);        // 0
const tangent = line.slopeIntercept(m, y0 - m * 1).dash([5, 3]).color('#888');

const fig3 = scene()
  .view([-3, 4], [-2, 9]).equal().axes().theme('textbook')
  .add(curve.fn(f).on([-3, 3]).color('crimson').stroke(2),
       tangent,
       region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.35),
       annotate.integral(f).from(0).to(2).shade('steelblue').label(tex`\int_0^2 x^2\,dx = \tfrac{2}{3}`))
  .compile();
console.log('fig3 (적분):');
save('03-calculus-riemann', fig3.toSVG());
console.log('심볼릭 미분:', f.toLatex(), '→', df.toLatex());

// ── §5 극좌표 — 장미 곡선 ───────────────────────
const fig4 = scene()
  .dim(2).view([-1.5, 1.5], [-1.5, 1.5]).equal().polarGrid().theme('textbook')
  .add(curve.polar((θ) => Math.cos(3 * θ)).on([0, tau]).stroke(2).color('#3b82f6'))
  .compile();
console.log('fig4 (극좌표 장미):');
save('04-polar-rose', fig4.toSVG());

// ── §5 부록 — TikZ 소스도 저장 ───────────────────
const tikz = fig4.toTikZ({ standalone: true });
const tikzPath = join(OUT, '04-polar-rose.tex');
writeFileSync(tikzPath, tikz, 'utf8');
console.log(`  ✓ ${tikzPath}`);

console.log('\n→ output/ 디렉토리에 SVG/TeX 파일이 저장되었습니다.');
console.log('  브라우저에서 열려면: open output/01-triangle-incenter.svg');