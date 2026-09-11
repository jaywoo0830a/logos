// 테스트 시나리오 렌더 갤러리 → output/g_*.svg + output/index.html
// 실행: node examples/gallery.js
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scene, point, line, curve, circle, ellipse, parabola, hyperbola, triangle, segment,
  square, rectangle, regular, region, annotate, vector, sphere,
  plane, cylinder, cone, surface, polyhedron, vectorField, tex, pi, tau,
} from '../index.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output');
mkdirSync(OUT, { recursive: true });
const items = [];
function gallery(name, title, svg) {
  writeFileSync(join(OUT, `g_${name}.svg`), svg);
  items.push({ name: `g_${name}.svg`, title });
}
const svgOf = (sc) => sc.compile().toSVG();
// ── v0.1 (SENARIOS A–K) ─────────────────────────
gallery('a1_point', 'A1 · 점 하나', svgOf(scene().axes().grid(1).add(point(1, 2).label('A').dot())));
gallery('a3_circle', 'A3 · 원 (equal)', svgOf(scene().equal().axes().add(circle.center(point(0, 0)).radius(3).fill('#dfe7fb').opacity(0.35).stroke(2))));
gallery('b1_fn', 'B1 · 함수 y=x²', svgOf(scene().view([-3, 3], [-1, 9]).equal().axes().add(curve.fn((x) => x * x).on([-3, 3]).color('#e63946').stroke(2.4), region.below(curve.fn((x) => x * x).on([-2.4, 2.4])).fill('#e63946').opacity(0.12))));
gallery('b3_rose', 'B3 · 극좌표 장미', svgOf(scene().equal().polarGrid().add(curve.polar((t) => Math.cos(3 * t)).on([0, tau]).stroke(2).color('#3b82f6').label(tex`r = \cos 3\theta`))));
gallery('c1_ellipse', 'C1 · 타원', svgOf(scene().equal().axes().add(ellipse.center(point(0, 0)).semi(3, 2).stroke(2.2).color('#7c3aed'))));
gallery('d1_triangle', 'D1 · 삼각형', svgOf(scene().equal().axes().add(triangle(point(0, 0), point(4, 0), point(2, 3)).fill('#a5d8ff').opacity(0.5).stroke(2).color('#1971c2'))));
gallery('d3_riemann', 'D3 · 리만합', svgOf(scene().view([-0.5, 2.5], [-0.5, 5]).axes().add(curve.fn((x) => x * x).on([0, 2]).color('#e63946').stroke(2.2), region.riemann((x) => x * x).on([0, 2]).n(8).left().fill('#4dabf7').opacity(0.45))));
gallery('g1_angle', 'G1 · 각도', svgOf(scene().equal().add(triangle(point(0, 0), point(4, 0), point(1, 3)).stroke(2), annotate.angle(point(0, 0), point(4, 0), point(1, 3)).arc({ radius: 1, double: true }).label('α'))));
gallery('g4_integral', 'G4 · 정적분+수식', svgOf(scene().view([-0.5, Math.PI + 0.5], [-0.5, 1.5]).axes().add(curve.fn(Math.sin).on([0, Math.PI]).color('#e63946').stroke(2.2), region.below(curve.fn(Math.sin).on([0, Math.PI])).fill('#4dabf7').opacity(0.4), annotate.integral(tex`\sin x`).from(0).to(pi).label(tex`2`))));
gallery('k1_incenter', 'K1 · 내심', svgOf(scene().view([-1, 6], [-1, 5]).equal().axes().theme('textbook').add(triangle(point(0, 0), point(5, 0), point(1.5, 4)).fill('#eef3ff').stroke(2), circle.inscribed(triangle(point(0, 0), point(5, 0), point(1.5, 4))).color('#e11').dash([4, 3]))));
gallery('k2_tangent', 'K2 · 원+접선', svgOf(scene().view([-4, 6], [-4, 4]).equal().axes().theme('textbook').add(circle.center(point(0, 0)).radius(3).stroke(2).color('#1971c2'), line.through(point(5, 4), point(5, 0)).color('#e63946').stroke(2), segment(point(0, 0), point(5, 4)).dash([3, 3]).color('#868e96'), point(0, 0).dot(), point(5, 4).dot(), point(5, 0).dot(), annotate.angle(point(0, 0), point(5, 0), point(5, 4)).rightAngle())));
// ── v0.2 ────────────────────────────────────────
gallery('b4_disc', 'B4 · 불연속 1/x', svgOf(scene().view([-5, 5], [-4, 4]).axes().add(curve.fn((x) => 1 / (x - 1.1)).on([-4.5, 4.5]).color('#0f766e').stroke(2.2), line.vertical(1.1).dash([4, 3]).color('#94a3b8'))));
gallery('b5_implicit', 'B5 · 음함수 원', svgOf(scene().equal().add(curve.implicit((x, y) => x * x + y * y - 1).color('#7c3aed').stroke(2))));
gallery('c2_parabola', 'C2 · 포물선', svgOf(scene().equal().axes().add(parabola.focus(point(0, 1)).directrix(line.horizontal(-1)).color('#e63946').stroke(2.2), point(0, 1).dot().label('F'), line.horizontal(-1).dash([4, 3]).color('#94a3b8'), point(0, 0).dot().label('V'))));
gallery('c3_hyperbola', 'C3 · 쌍곡선', svgOf(scene().equal().axes().add(hyperbola.center(point(0, 0)).semi(3, 2).color('#0f766e').stroke(2), line.slopeIntercept(2 / 3, 0).dash([3, 3]).color('#94a3b8'), line.slopeIntercept(-2 / 3, 0).dash([3, 3]).color('#94a3b8'))));
gallery('d4_lens', 'D4 · 교집합(렌즈)', svgOf(scene().equal().add(region.intersect(region.inside(circle.center(point(-0.5, 0)).radius(1)), region.inside(circle.center(point(0.5, 0)).radius(1))).fill('#2f9e44').opacity(0.45), circle.center(point(-0.5, 0)).radius(1).stroke(2).color('#1971c2'), circle.center(point(0.5, 0)).radius(1).stroke(2).color('#e8590c'))));
gallery('e1_sphere', 'E1 · 구+평면', svgOf(scene().dim(3).camera({ position: [3, 3, 2] }).theme('textbook').add(sphere.center(point(0, 0, 0)).radius(1).opacity(0.3).color('#3b82f6'), plane.coordinate('xy').opacity(0.4))));
gallery('e2_cylcone', 'E2 · 원기둥+원뿔', svgOf(scene().dim(3).camera({ position: [5, -5, 3] }).add(cylinder.center(point(0, 0, 0)).axis(vector(0, 0, 1)).radius(1).height(2).color('#0f766e'), cone.vertex(point(2, 0, 1)).axis(vector(0, 0, -1)).radius(0.5).height(2).color('#e8590c'))));
gallery('e3_rev', 'E3 · 회전체', svgOf(scene().dim(3).camera({ position: [6, -6, 4] }).add(surface.revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4])).about(line.horizontal(0)).opacity(0.8).color('#93c5fd'))));
gallery('e4_dodeca', 'E4 · 정십이면체', svgOf(scene().dim(3).camera({ position: [3, 3, 3] }).add(polyhedron.platonic('dodeca').circumradius(1).color('#1971c2'))));
gallery('i3_gradient', 'I3 · 그라디언트', svgOf(scene().equal().add(circle.center(point(0, 0)).radius(1).gradient({ type: 'radial', stops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#3b82f6' }] }))));
gallery('i5_clip', 'I5 · 클리핑 tan', svgOf(scene().equal().add(curve.fn((x) => Math.tan(x)).on([-5, 5]).clip(region.between(line.horizontal(-2), line.horizontal(2))).color('#e63946').stroke(2), line.horizontal(2).dash([3, 3]).color('#94a3b8'), line.horizontal(-2).dash([3, 3]).color('#94a3b8'))));
// ── textbook (1.md) ─────────────────────────────
gallery('t10_integral', '부록① 정적분 아래 영역', svgOf(scene().view([-0.5, Math.PI + 0.5], [-0.5, 1.5]).axes().add(curve.fn(Math.sin).on([0, Math.PI]).color('#e63946').stroke(2.2), region.below(curve.fn(Math.sin).on([0, Math.PI])).fill('#4dabf7').opacity(0.5), annotate.integral(tex`\sin x`).from(0).to(pi).label(tex`2`))));
gallery('t18_circumcenter', '부록② 외접원+외심', svgOf(scene().view([-3, 7], [-3, 5]).equal().add(triangle(point(0, 0), point(4, 0), point(1.5, 3)).stroke(2), circle.through(point(0, 0), point(4, 0), point(1.5, 3)).color('#1971c2').stroke(2), point.circumcenter(point(0, 0), point(4, 0), point(1.5, 3)).dot().label('O'))));
gallery('t24_pythagorean', '부록③ 피타고라스', svgOf(scene().view([-4, 7], [-5, 5]).equal().add(segment(point(0, 0), point(3, 0)).stroke(2.4), segment(point(3, 0), point(3, 4)).stroke(2.4), segment(point(0, 0), point(3, 4)).stroke(2.4), square.on(segment(point(0, 0), point(3, 0))).fill('#4dabf7').opacity(0.4), square.on(segment(point(3, 0), point(3, 4))).fill('#ffa94d').opacity(0.4), square.on(segment(point(0, 0), point(3, 4))).fill('#8ce99a').opacity(0.4))));
gallery('t44_normal', '부록④ 정규분포', svgOf(scene().view([-4, 4], [-0.05, 0.5]).axes().add(curve.fn((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)).on([-4, 4]).color('#e63946').stroke(2.2), region.below(curve.fn((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)).on([-1, 1])).fill('#4dabf7').opacity(0.5), annotate.caption(tex`P(-1 < Z < 1) \approx 0.6827`))));

// ── 이항분포(여러 막대)를 렌더해 문자열로 반환 ──
const binomialBars = (() => {
  const bc = (k) => { let r = 1; for (let i = 0; i < k; i++) r *= (10 - i) / (i + 1); return r * (0.5 ** 10); };
  const bars = Array.from({ length: 11 }, (_, k) => rectangle.on([k - 0.4, k + 0.4], [0, bc(k)]).fill(k === 5 ? '#e63946' : '#4dabf7').opacity(0.8));
  return scene().view([-1, 11], [0, 0.28]).axes().addAll(bars).compile().toSVG();
})();
gallery('t45_binomial', '부록⑤ 이항분포', binomialBars);
gallery('t48_slopefield', '부록⑥ 기울기장', svgOf(scene().view([-3, 3], [-3, 3]).axes().theme('textbook').add(vectorField((x, y) => [1, x + y]).color('#1971c2'), curve.fn((x) => -x - 1 + 2 * Math.exp(x)).on([-3, 1]).color('#e63946').stroke(2.4))));
gallery('t29_unitcircle', '부록⑦ 단위원+sin/cos', svgOf(scene().view([-1.6, 1.6], [-1.6, 1.6]).equal().add(circle.center(point(0, 0)).radius(1).stroke(2).color('#1971c2').fill('#4dabf7').opacity(0.15), point.polar(1, Math.PI / 6).dot({ open: true }).label(tex`(\cos\theta,\sin\theta)`), segment(point(0, 0), point.polar(1, Math.PI / 6)).stroke(1.8), segment(point.polar(1, Math.PI / 6), point(Math.cos(Math.PI / 6), 0)).dash([2, 2]).color('#868e96'), annotate.angle(point(1, 0), point(0, 0), point.polar(1, Math.PI / 6)).arc().label(tex`\theta`))));
// ── index.html 갤러리 ──────────────────────────
const card = (it) => `<div class="card"><h3>${it.title}</h3><div class="svgwrap"><object data="${it.name}" type="image/svg+xml"></object></div><code>${it.name}</code></div>`;
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>logos · 렌더 갤러리</title>
<style>
body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;background:#f5f6f8;color:#1f2937}
header{padding:22px 28px;background:linear-gradient(135deg,#1f4e79,#2f6db0);color:#fff}
header h1{margin:0;font-size:22px} header p{margin:6px 0 0;opacity:.85;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px;padding:22px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card h3{margin:0;padding:12px 14px;font-size:14px;border-bottom:1px solid #f0f0f0;font-weight:600}
.svgwrap{display:flex;justify-content:center;padding:10px;background:#fff}
.svgwrap object{width:100%;height:auto;max-height:340px}
code{display:block;padding:8px 14px;font-size:11px;color:#6b7280;background:#fafafa;border-top:1px solid #f0f0f0}
</style></head><body>
<header><h1>logos · 렌더 갤러리</h1><p>테스트가 커버하는 시나리오 — ${items.length}개 · 브라우저에서 직접 확인</p></header>
<div class="grid">${items.map(card).join('')}</div>
</body></html>`;
writeFileSync(join(OUT, 'index.html'), html);
console.log('✓ 갤러리 ' + items.length + '개 저장 → output/g_*.svg + index.html');
console.log('  브라우저에서: open output/index.html');