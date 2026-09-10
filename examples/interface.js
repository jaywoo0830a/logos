// INTERFACE.md 예제를 실행해 end-to-end 파이프라인을 확인하는 데모.
// 실행: docker compose run --rm logos node examples/interface.js
import {
  scene, point, line, curve, circle, segment, triangle,
  region, annotate, transform, tex, tau, pi,
} from '../index.js';

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
       annotate.caption(tex`\\text{내심과 내접원}`))
  .compile();
console.log('fig1 (내심) SVG 길이:', fig1.toSVG().length);

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
console.log('fig2 (접선) SVG 길이:', fig2.toSVG().length);

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
       annotate.integral(f).from(0).to(2).shade('steelblue').label(tex`\\int_0^2 x^2\\,dx = \\tfrac{2}{3}`))
  .compile();
console.log('fig3 (적분) SVG 길이:', fig3.toSVG().length);
console.log('심볼릭 미분:', f.toLatex(), '→', df.toLatex());

// ── §5 극좌표 — 장미 곡선 + TikZ ────────────────
const fig4 = scene()
  .dim(2).view([-1.5, 1.5], [-1.5, 1.5]).equal().polarGrid().theme('textbook')
  .add(curve.polar((θ) => Math.cos(3 * θ)).on([0, tau]).stroke(2).color('#3b82f6'))
  .compile();
const tikz = fig4.toTikZ({ standalone: true });
console.log('fig4 (장미) SVG 길이:', fig4.toSVG().length);
console.log('fig4 TikZ standalone:', tikz.startsWith('\\documentclass[tikz'));

// ── 변환 체이닝 ─────────────────────────────────
const t0 = triangle(A, B, C).fill('#eef3ff').apply(transform.rotate(pi / 4).about(point(2, 2)));
console.log('변환 후 컴파일 정상:', typeof scene().view([-2, 7], [-2, 7]).add(t0).compile().toSVG() === 'string');

console.log('\n모든 예제 실행 성공 ✓');