import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, vector, line, segment, curve, circle, triangle, tex, tau, pi, sphere } from '../index.js';

const approx = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('point: 기본 생성 / 좌표계 / 체이닝', () => {
  const A = point(1, 2).label('A').dot();
  assert.deepEqual(A.coords, [1, 2]);
  assert.equal(A.system, 'cartesian');
  assert.equal(A.conf.label, 'A');
  assert.equal(A.conf.marker, 'dot');
});

test('point: polar / cylindrical / spherical 변환', () => {
  const P = point.polar(2, Math.PI / 3);
  approx(P.coords[0], 1.0);
  approx(P.coords[1], Math.sqrt(3));

  const C = point.cylindrical(2, Math.PI / 2, 3);
  approx(C.coords[0], 0);
  approx(C.coords[1], 2);
  approx(C.coords[2], 3);

  const S = point.spherical(1, 0, Math.PI / 2); // xy 평면
  approx(S.coords[2], 0, 1e-6);

  const deg = point.polar(1, '90°');
  approx(deg.coords[1], 1);
});

test('point: midpoint / centroid / intersect / incenter', () => {
  const A = point(0, 0), B = point(4, 0), C = point(2, 3);
  const mid = point.midpoint(A, B);
  approx(mid.coords[0], 2);
  approx(mid.coords[1], 0);

  const l1 = line.through(point(0, 0), point(2, 2));
  const l2 = line.through(point(0, 4), point(4, 0));
  const X = point.intersect(l1, l2);
  approx(X.coords[0], 2);
  approx(X.coords[1], 2);

  const tri = triangle(A, B, C);
  const I = point.incenter(tri);
  assert.ok(I.coords[0] > 0 && I.coords[0] < 4, 'incenter inside');
});

test('vector: between / normal', () => {
  const v = vector.between(point(1, 1), point(3, 4));
  approx(v.v[0], 2);
  approx(v.v[1], 3);
  const n = vector.normal(point(0, 0, 0), point(1, 0, 0), point(0, 1, 0));
  approx(n.v[2], 1, 1e-6);
});

test('line: slope / tangent / tangent-at-point', () => {
  const h = line.horizontal(3);
  approx(h.pointDir().d[1], 0);
  const v = line.vertical(2);
  approx(v.pointDir().d[0], 0);

  const c = circle.center(point.origin()).radius(2);
  const tan = line.tangent(c).at(point(2, 0));
  const { p, d } = tan.pointDir();
  approx(d[0], 0, 1e-6); // 접선은 수직
  const d0 = [p[0] - 0, p[1] - 0]; // 반지름 벡터
  approx(d[0] * d0[0] + d[1] * d0[1], 0, 1e-6); // 접선 ⊥ 반지름
});

test('segment: length / bisector', () => {
  const s = segment(point(0, 0), point(3, 4));
  approx(s.length(), 5);
});

test('curve: fn / polar / sample', () => {
  const f = curve.fn((x) => x * x).on([0, 2]);
  const pts = f.sample();
  assert.ok(pts.length >= 2);
  approx(pts[0][1], 0);
  approx(pts[pts.length - 1][1], 4);

  const rose = curve.polar((t) => Math.cos(3 * t)).on([0, tau]);
  const rp = rose.sample();
  assert.ok(rp.length > 10);
});

test('curve: 심볼릭 함숫값', () => {
  const f = curve.fn(tex`x^2 - 1`).on([-2, 2]);
  const v = f.eval(1);
  approx(v.cart[1], 0, 1e-6);
});

test('circle: through / inscribed', () => {
  const c = circle.center(point(0, 0)).radius(3);
  approx(c.radius(), 3);
  const tri = triangle(point(0, 0), point(4, 0), point(2, 3));
  const inc = circle.inscribed(tri);
  assert.ok(inc.radius() > 0 && inc.radius() < 2);
});

test('sphere.rings()/meridians(): 위선·경선 개수를 제어한다 (기본은 위선 7개)', () => {
  // sphere 가 내는 IR 조각(path 노드)만 센다 — 위선/경선이 각각 path 하나.
  const paths = (s) => s.compile().o.nodes.filter((n) => n.kind === 'path').length;
  const S = () => sphere.center(point(0, 0, 0)).radius(2);
  assert.equal(paths(scene().add(S().rings(false))), 0, 'rings(false) → 위선 없음(실루엣만)');
  assert.equal(paths(scene().add(S().rings(3))), 3, 'rings(3) → 위선 3개');
  assert.equal(paths(scene().add(S())), 7, '기본 위선 7개(기존 출력 보존)');
  assert.equal(paths(scene().add(S().rings(2).meridians(4))), 6, 'rings(2)+meridians(4) → 6개');
});