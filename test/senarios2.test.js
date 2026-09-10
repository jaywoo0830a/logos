// SENARIOS.md — v0.2 시나리오(B4–B6, C2–C3, D4, E1–E4, F2–F3, G5, H3, I3, I5, J2–J4, J6, K3–K4)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene, point, vector, line, curve, circle, ellipse, parabola, hyperbola,
  polygon, triangle, regular, region, annotate, segment, sphere, plane,
  cylinder, cone, surface, polyhedron, tex,
} from '../index.js';

const count = (s, tag) => (String(s).match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;

test('B4 불연속 함수: 1/x 가 x=0 에서 path 끊김', () => {
  const svg = scene().view([-5, 5], [-2, 2]).axes().add(curve.fn((x) => 1 / x).on([-5, 5])).compile().toSVG();
  const Mops = [...String(svg).matchAll(/\bM -?[\d.]+/g)];
  assert.ok(Mops.length >= 2, `M 명령 ${Mops.length}개 (불연속 2개 이상 세그먼트)`);
});

test('B5 음함수 곡선: x²+y²-1 → contour', () => {
  const svg = scene().equal().add(curve.implicit((x, y) => x * x + y * y - 1)).compile().toSVG();
  assert.ok(count(svg, 'path') > 0, 'contour path');
  assert.ok(!/NaN/.test(svg), 'NaN 없음');
});

test('B6 여러 곡선: z-order (나중 add 위에)', () => {
  const svg = scene().view([-6.3, 6.3], [-1.5, 1.5]).axes().add(
    curve.fn(Math.sin).on([-2 * Math.PI, 2 * Math.PI]).color('crimson'),
    curve.fn(Math.cos).on([-2 * Math.PI, 2 * Math.PI]).color('steelblue'),
  ).compile().toSVG();
  const ic = svg.indexOf('crimson'), is = svg.indexOf('steelblue');
  assert.ok(ic !== -1 && is !== -1 && is > ic, 'cos(나중)가 뒤에 렌더');
});

test('C2 포물선: 초점-준선 거리 등식', () => {
  const F = point(0, 1);
  const d = line.horizontal(-1);
  const P = parabola.focus(F).directrix(d);
  const { p, vx, vy } = P.params();
  const x0 = 2, y0 = vy + (x0 - vx) ** 2 / (4 * p);
  const dF = Math.hypot(x0 - F.coords[0], y0 - F.coords[1]);
  const dD = Math.abs(y0 - (-1));
  assert.ok(Math.abs(dF - dD) < 1e-6, `focus ${dF.toFixed(4)} vs directrix ${dD.toFixed(4)}`);
  const svg = scene().equal().axes().add(P.color('crimson').stroke(2), F, d, point(0, 0).dot().label('V')).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, '포물선 path');
});

test('C3 쌍곡선: 좌우 두 branch', () => {
  const svg = scene().equal().axes().add(
    hyperbola.center(point(0, 0)).semi(3, 2),
    line.slopeIntercept(2 / 3, 0).dash([4, 3]), line.slopeIntercept(-2 / 3, 0).dash([4, 3]),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 4, `branch path ${count(svg, 'path')}개`);
});

test('D4 영역 교집합: 렌즈(clipPath)', () => {
  const c1 = circle.center(point(-0.5, 0)).radius(1);
  const c2 = circle.center(point(0.5, 0)).radius(1);
  const svg = scene().equal().add(
    region.intersect(region.inside(c1), region.inside(c2)).fill('steelblue').opacity(0.4),
    c1.stroke(1.5), c2.stroke(1.5),
  ).compile().toSVG();
  assert.ok(svg.includes('<clipPath'), 'clipPath 렌즈');
  assert.ok(svg.includes('steelblue'), '렌즈 채움');
});

test('E1 구 + 평면 (정사영)', () => {
  const S = sphere.center(point(0, 0, 0)).radius(1).opacity(0.25);
  const P = plane.coordinate('xy').opacity(0.4);
  const svg = scene().dim(3).camera({ position: [3, 3, 2], projection: 'orthographic' }).add(S, P).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, '구 위선');
  assert.ok(count(svg, 'polygon') >= 1, '평면');
});

test('E2 원기둥 + 원뿔', () => {
  const svg = scene().dim(3).camera({ position: [5, -5, 3] }).add(
    cylinder.center(point(0, 0, 0)).axis(vector(0, 0, 1)).radius(1).height(2),
    cone.vertex(point(2, 0, 1)).axis(vector(0, 0, -1)).radius(0.5).height(2),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 4, '원기둥+원뿔 path');
  assert.ok(!/NaN/.test(svg), 'NaN 없음');
});

test('E3 회전체', () => {
  const svg = scene().dim(3).camera({ position: [6, -6, 4] }).add(
    surface.revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4])).about(line.horizontal(0)).opacity(0.8).color('#93c5fd'),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 2, '회전면 path');
});

test('E4 다면체: 정십이면체 오일러 V-E+F=2', () => {
  const D = polyhedron.platonic('dodeca').circumradius(1);
  const { V, E, F } = D.conf.counts;
  assert.equal(V, 20);
  assert.equal(E, 30);
  assert.equal(F, 12);
  assert.equal(V - E + F, 2, '오일러');
  const svg = scene().dim(3).camera({ position: [3, 3, 3] }).add(D).compile().toSVG();
  assert.ok(count(svg, 'path') >= 20, '모서리 렌더');
test('F2 구면격자', () => {
  const svg = scene().dim(3).sphericalGrid().camera({ position: [5, 5, 5] }).compile().toSVG();
  assert.ok(count(svg, 'path') >= 12, '위선+경선');
});

test('F3 복소평면', () => {
  const svg = scene().equal().axes({ label: 'Re, Im' }).add(
    point.complex(3, -4).dot().label('$3-4i$'),
    line.through(point.origin(), point.complex(3, -4)).color('#888'),
  ).compile().toSVG();
  assert.ok(count(svg, 'circle') >= 1, '점');
});

test('G5 화살표 + 라벨', () => {
  const svg = scene().equal().add(
    annotate.arrow(point(0, 0), point(2, 1)).label('v'),
    annotate.arrow(point(0, 0), point(1, 2)).label('w').color('crimson'),
  ).compile().toSVG();
  assert.ok(svg.includes('<marker'), '화살촉 marker');
  assert.ok(svg.includes('>v<') && svg.includes('>w<'), '라벨');
});

test('H3 복잡한 수식 캡션', () => {
  const svg = scene().equal().add(
    annotate.caption(tex`\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}`),
  ).compile().toSVG();
  assert.ok(svg.includes('<math') || svg.includes('<foreignObject'), '수식 조판');
});

test('I3 그라디언트 (radial)', () => {
  const svg = scene().equal().add(
    circle.center(point(0, 0)).radius(1).gradient({ type: 'radial', stops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#3b82f6' }] }),
  ).compile().toSVG();
  assert.ok(svg.includes('<radialGradient'), 'radialGradient');
  assert.ok(svg.includes('url(#'), 'fill url');
});

test('I5 클리핑: tan 곡선 y ∈ [-2,2]', () => {
  const svg = scene().equal().add(
    curve.fn((x) => Math.tan(x)).on([-5, 5]).clip(region.between(line.horizontal(-2), line.horizontal(2))),
  ).compile().toSVG();
  assert.ok(svg.includes('<clipPath'), 'clipPath');
  assert.ok(svg.includes('clip-path='), '곡선에 클립 적용');
});

test('J2 극단 좁은 view', () => {
  const svg = scene().view([0, 1e-6], [0, 1e-6]).add(point(5e-7, 5e-7)).compile().toSVG();
  assert.ok(!/NaN/.test(svg) && /<circle/.test(svg), '점 렌더');
});

test('J3 극단 넓은 view', () => {
  const svg = scene().view([-1e6, 1e6], [-1e6, 1e6]).add(circle.center(point(0, 0)).radius(1e5)).compile().toSVG();
  const m = String(svg).match(/r="([\d.]+)"/);
  assert.ok(m && parseFloat(m[1]) > 20, `반지름 ${m ? m[1] : '?'}px`);
});

test('J4 축퇴 도형 (크래시 없음)', () => {
  const svg = scene().axes().add(
    segment(point(0, 0), point(0, 0)),
    circle.center(point(0, 0)).radius(0),
    triangle(point(0, 0), point(1, 0), point(2, 0)),
  ).compile().toSVG();
  assert.ok(svg.startsWith('<svg'), 'SVG 렌더');
});

test('J6 많은 요소 (1000 점)', () => {
  const pts = Array.from({ length: 1000 }, (_, i) => point(Math.cos(i * 0.1) * i * 0.01, Math.sin(i * 0.1) * i * 0.01).dot());
  const t0 = Date.now();
  const svg = scene().equal().addAll(pts).compile().toSVG();
  const dt = Date.now() - t0;
  assert.ok(dt < 5000, `생성 ${dt}ms`);
  assert.ok(svg.length < 500000, `크기 ${svg.length}B`);
});

test('K3 회전체 + 2D 곡선', () => {
  const svg = scene().dim(3).camera({ position: [6, -6, 4] }).theme('textbook').add(
    surface.revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4])).about(line.horizontal(0)).opacity(0.85).color('#93c5fd'),
    curve.fn((x) => Math.sqrt(x)).on([0, 4]).color('crimson').stroke(2),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 3, '회전면+곡선');
  assert.ok(!/NaN/.test(svg), 'NaN 없음');
});

test('K4 극좌표 장미 + 수식 라벨', () => {
  const svg = scene().equal().polarGrid().theme('textbook').add(
    curve.polar((θ) => Math.cos(3 * θ)).on([0, Math.PI]).stroke(1.8).color('#3b82f6').label(tex`r = \cos 3\theta`),
  ).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, '장미 곡선');
  assert.ok(svg.includes('<foreignObject') || svg.includes('<math'), '수식 라벨');
});
});