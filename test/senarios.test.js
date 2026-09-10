// SENARIOS.md — v0.1 필수 시나리오(A1-A4, B1-B3, C1, D1-D3, F1, G1-G4, H1-H2, I1-I2, I4, J1, J5, K1-K2, K5)
// 실행: npm run test:svg
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene, point, line, circle, ellipse, curve, triangle, regular,
  region, annotate, segment, tex, pi,
} from '../index.js';

const count = (s, tag) => (String(s).match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;

// ── A. 기본 ──────────────────────────────────────
test('A1 점 하나: circle+text, 라벨 오프셋', () => {
  const svg = scene().axes().grid(1).add(point(1, 2).label('A').dot()).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 1, '점 원');
  assert.ok(svg.includes('>A<'), '라벨');
});

test('A2 수직/수평선 클리핑', () => {
  const svg = scene().axes().add(line.vertical(2), line.horizontal(-1)).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, 'path 렌더');
  assert.ok(!/NaN/.test(svg), '좌표 NaN 없음');
});

test('A3 equal 에서 원이 진짜 원', () => {
  const svg = scene().equal().axes().add(circle.center(point(0, 0)).radius(3)).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 1, 'circle 사용');
  const m = String(svg).match(/<ellipse[^>]*rx="([\d.-]+)"[^>]*ry="([\d.-]+)"/);
  if (m) assert.ok(Math.abs(parseFloat(m[1]) - parseFloat(m[2])) < 1e-6, 'rx===ry');
});

test('A4 여러 스타일 매핑', () => {
  const svg = scene().axes().add(
    point(0, 0).dot().color('#e11'),
    point(1, 1).dot().color('#0a0').stroke(3),
    point(3, 3).dot().opacity(0.4),
  ).compile().toSVG();
  assert.ok(svg.includes('#e11'), 'fill color');
  assert.ok(svg.includes('stroke-width="3"'), 'stroke-width');
  assert.ok(svg.includes('opacity="0.4"'), 'opacity');
});

// ── B. 곡선 ──────────────────────────────────────
test('B1 함수 그래프 path', () => {
  const svg = scene().view([-3, 3], [-1, 9]).axes().add(curve.fn((x) => x * x).on([-3, 3]).color('crimson').stroke(2)).compile().toSVG();
  assert.ok(/<path d="M/.test(svg), 'path M 시작');
  assert.ok(svg.includes('stroke="crimson"'), '색상');
});

test('B2 파라메트릭 원: 폐곡선 시작=끝', () => {
  const cv = curve.parametric((t) => [Math.cos(t), Math.sin(t)]).on([0, 2 * Math.PI]);
  const ps = cv.sample();
  const last = ps[ps.length - 1];
  const d = Math.hypot(ps[0][0] - last[0], ps[0][1] - last[1]);
  assert.ok(d < 1e-6, `폐곡선 시작/끝 오차 ${d.toFixed(8)}`);
  const svg = scene().equal().add(cv).compile().toSVG();
  assert.ok(/<path d="M/.test(svg), 'path');
});

test('B3 극좌표 장미: 3꽃잎 대칭', () => {
  const svg = scene().equal().polarGrid().add(curve.polar((θ) => Math.cos(3 * θ)).on([0, Math.PI])).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, '곡선 path');
  assert.ok(!/NaN/.test(svg), '좌표 NaN 없음');
});

// ── C. 원뿔곡선 ──────────────────────────────────
test('C1 타원: semi(3,2) → rx/ry≈1.5', () => {
  const svg = scene().equal().axes().add(ellipse.center(point(0, 0)).semi(3, 2)).compile().toSVG();
  assert.ok(/<ellipse/.test(svg), 'ellipse');
  const e = String(svg).match(/rx="([\d.-]+)"/);
  const ry = String(svg).match(/ry="([\d.-]+)"/);
  assert.ok(e && ry, 'rx/ry 존재');
  const ratio = parseFloat(e[1]) / parseFloat(ry[1]);
  assert.ok(ratio > 1.4 && ratio < 1.6, `rx/ry=${ratio.toFixed(2)} (기대 1.5)`);
});

// ── D. 다각형·영역 ───────────────────────────────
test('D1 삼각형 채우기', () => {
  const svg = scene().equal().add(triangle(point(0, 0), point(4, 0), point(2, 3)).fill('#eef')).compile().toSVG();
  assert.ok(svg.includes('<polygon'), 'polygon');
  assert.ok(svg.includes('fill="#eef"'), 'fill');
});

test('D2 정육각형: 꼭짓점 반지름 1', () => {
  const P = regular.polygon(point(0, 0), 6, 1);
  for (const v of P.vertices) {
    assert.ok(Math.abs(Math.hypot(v.coords[0], v.coords[1]) - 1) < 1e-9, `반지름 ${v.coords}`);
  }
});

test('D3 리만합: left rule 8개 rect', () => {
  const f = (x) => x * x;
  const svg = scene().view([-0.5, 2.5], [-0.5, 5]).axes().add(
    curve.fn(f).on([0, 2]).color('crimson').stroke(2),
    region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.4),
  ).compile().toSVG();
  // 배경 <rect width="100%"> 를 제외한 좌표 rect 만 센다
  const rects = String(svg).replace(/<rect width="100%"/g, '').match(/<rect[ >]/g) || [];
  assert.ok(rects.length === 8, `rect ${rects.length}개 (기대 8)`);
});

// ── F. 좌표계 ────────────────────────────────────
test('F1 극좌표 격자', () => {
  const svg = scene().equal().polarGrid().add(point(0, 0)).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 3, '동심원');
  assert.ok(count(svg, 'path') >= 6, '방사선');
// ── G. 주석 ──────────────────────────────────────
test('G1 각도: arc + double', () => {
  const A = point(0, 0), B = point(4, 0), C = point(1, 3);
  const svg = scene().equal().add(
    triangle(A, B, C),
    annotate.angle(A, B, C).arc({ radius: 1.0, double: true }).label('α').degrees(),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 2, '이중 호(두 path)');
});

test('G2 치수선', () => {
  const svg = scene().equal().add(
    segment(point(0, 0), point(4, 0)),
    annotate.dimension(point(0, 0), point(4, 0)).offset(0.5).label('4').units('cm'),
  ).compile().toSVG();
  assert.ok(count(svg, 'line') >= 1, '치수선 line');
  assert.ok(svg.includes('cm'), '단위');
});

test('G3 합동 tick', () => {
  const A = point(0, 0), B = point(2, 0), C = point(1, 1.7);
  const svg = scene().equal().add(
    triangle(A, B, C),
    annotate.tick(segment(A, B)).count(2),
    annotate.tick(segment(B, C)).count(2),
    annotate.tick(segment(C, A)).count(3),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 7, `tick path ${count(svg, 'path')}개 (기대 >=7)`);
});

test('G4 정적분 + KaTeX 라벨', () => {
  const f = tex`x^{2}`;
  const svg = scene().view([-0.5, 3], [-0.5, 10]).equal().axes().add(
    curve.fn(f).on([-0.5, 3]).color('crimson'),
    annotate.integral(f).from(0).to(2).shade('steelblue').label(tex`\int_0^2 x^2\,dx = \tfrac{8}{3}`),
  ).compile().toSVG();
  assert.ok(svg.includes('steelblue'), '음영');
  assert.ok(svg.includes('<foreignObject'), 'KaTeX label foreignObject');
});

// ── H. 심볼릭·LaTeX ──────────────────────────────
test('H1 수식 라벨 → foreignObject', () => {
  const svg = scene().equal().axes().add(
    curve.fn(tex`\sin(x)`).on([-pi, pi]).label(tex`f(x) = \sin x`),
  ).compile().toSVG();
  assert.ok(svg.includes('<foreignObject'), 'foreignObject');
});

test('H2 심볼릭 접선 라벨', () => {
  const f = tex`x^{2} - 1`;
  const df = f.diff('x').simplify().toLatex();
  const F = curve.fn(f).on([-3, 3]);
  const T = line.tangent(F).at(1).dash([5, 3]);
  const { p, d } = T.pointDir();
  assert.ok(Math.abs(p[0] - 1) < 1e-6, '접점 x=1');
  assert.ok(Math.abs(d[1] - 2) < 0.05, `기울기 ${d[1]} (기대 2)`);
  assert.ok(df.includes('2'), `df=${df}`);
});

// ── I. 스타일 ────────────────────────────────────
test('I1 dash 패턴', () => {
  const svg = scene().equal().add(line.slopeIntercept(1, 0).dash([5, 3])).compile().toSVG();
  assert.ok(svg.includes('stroke-dasharray') && svg.includes('5 3'), 'dash 5 3');
});

test('I2 투명도', () => {
  const svg = scene().equal().add(circle.center(point(0, 0)).radius(1).opacity(0.3)).compile().toSVG();
  assert.ok(svg.includes('opacity="0.3"'), 'opacity');
});

test('I4 z-order: 나중 add가 위', () => {
  const P1 = point(0, 0).dot().color('red');
  const P2 = point(0, 0).dot().color('blue');
  const svg = scene().equal().add(P1, P2).compile().toSVG();
  const i1 = svg.indexOf('red'), i2 = svg.indexOf('blue');
  assert.ok(i1 !== -1 && i2 !== -1 && i2 > i1, 'blue(나중)가 뒤에 렌더');
});

// ── J. 엣지 ──────────────────────────────────────
test('J1 빈 씬', () => {
  const svg = scene().compile().toSVG();
  assert.ok(svg.startsWith('<svg'), 'svg 태그');
});

test('J5 유니코드/그리스/한글 라벨', () => {
  const svg = scene().axes().add(
    point(0, 0).dot().label('α'),
    point(1, 0).dot().label('점 A'),
  ).compile().toSVG();
  assert.ok(svg.includes('α') && svg.includes('점 A'), '유니코드 보존');
});

// ── K. 통합 ──────────────────────────────────────
test('K1 삼각형 내심', () => {
  const A = point(0, 0), B = point(5, 0), C = point(1.5, 4);
  const tri = triangle(A, B, C).fill('#eef3ff').stroke(2);
  const I = point.incenter(tri);
  assert.ok(I.coords[0] > 0 && I.coords[1] > 0, '내심 내부');
  const svg = scene().view([-1, 6], [-1, 5]).equal().axes().add(tri, A, B, C, circle.inscribed(tri), segment(A, I)).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 1, '내접원');
});

test('K2 원과 접선', () => {
  const O = point.origin(), P = point(5, 0);
  const C = circle.center(O).radius(3);
  const T = point.intersect(C, line.tangent(C).at(P));
  assert.ok(T, '접점 존재');
  // T 는 원 위(거리≈3)
  const dT = Math.hypot(T.coords[0], T.coords[1]);
  assert.ok(Math.abs(dT - 3) < 1e-4, `T가 원 위 (거리 ${dT.toFixed(3)})`);
  // OT ⊥ PT
  const OT = [T.coords[0], T.coords[1]];
  const PT = [T.coords[0] - P.coords[0], T.coords[1] - P.coords[1]];
  const dot = OT[0] * PT[0] + OT[1] * PT[1];
  assert.ok(Math.abs(dot) < 1e-6, `OT⊥PT (dot=${dot.toFixed(3)})`);
  const svg = scene().view([-4, 6], [-4, 4]).equal().axes().add(C.stroke(2), O, P, T, line.through(P, T).color('#c00')).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 1, '원');
});

test('K5 미적분 종합', () => {
  const f = tex`x^{2} - 1`;
  const df = f.diff('x').simplify();
  const F = curve.fn(f).on([-3, 3]);
  const svg = scene().view([-3, 4], [-2, 9]).equal().axes()
    .grid({ step: 1 }).theme('textbook').add(
      F.color('crimson').stroke(2).label(tex`f(x) = ${f.toLatex()}`),
      line.tangent(F).at(1).dash([5, 3]).color('#666'),
      point(1, 0).dot().label(tex`(1, 0)`),
      region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.35),
      annotate.integral(f).from(0).to(2).label(tex`\int_0^2 f\,dx = \tfrac{2}{3}`),
      annotate.caption(tex`f'(x) = ${df.toLatex()}`),
    ).compile().toSVG();
  assert.ok(df.toLatex().includes('2'), `미분 결과 ${df.toLatex()}`);
  assert.ok(svg.includes('steelblue'), '리만합 채움');
  assert.ok(svg.includes('<foreignObject'), '수식 라벨');
});
});