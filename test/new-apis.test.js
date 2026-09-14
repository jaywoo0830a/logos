// docs/spec/DSL.md 에 문서화됐지만 비어 있던 API 들의 회귀 테스트.
//   (curve 유틸 / 원뿔곡선 / 직선 / 영역 / 주석 / 3D 입체·곡면 / 원호·반직선 / 벡터·점)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  point,
  vector,
  line,
  segment,
  circle,
  ellipse,
  parabola,
  hyperbola,
  polygon,
  triangle,
  curve,
  curve3,
  region,
  annotate,
  tex,
  plane,
  sphere,
  cylinder,
  surface,
  polyhedron,
  cube,
  prism,
  pyramid,
  torus,
  arc,
  sector,
  ray,
  regular,
  mat,
  cplx,
  kit,
} from '../index.js';
import { contains } from '../shapes/region.js';

const O = point(0, 0);
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const { plot2d, plot3d } = kit;

/** SVG 문자열 (NaN 이 새면 실패) */
const svg = (fig) => {
  const f = typeof fig.compile === 'function' ? fig.compile() : fig;
  const s = f.toSVG({ math: 'text' });
  assert.ok(!/NaN/.test(s), 'SVG 에 NaN 이 없어야 함');
  return s;
};

// ── curve 유틸 ─────────────────────────────────────────
test('curve.piecewise: 구간별 함수 (구간 밖은 그리지 않음)', () => {
  const f = curve.piecewise([
    [0, 1, (x) => x],
    [1, 2, (x) => 2 - x],
  ]);
  assert.equal(f.eval(0.5).cart[1], 0.5);
  assert.equal(f.eval(1.5).cart[1], 0.5);
  assert.ok(Number.isNaN(f.eval(3).cart[1]), '구간 밖은 NaN(불연속 처리)');
  assert.ok(svg(plot2d([-0.5, 2.5], [-0.5, 1.5]).add(f)).includes('<path'));
});

test('curve.spline: 주어진 점을 지나는 Catmull–Rom + tension', () => {
  const sp = curve.spline([point(0, 0), point(1, 1), point(2, 0), point(3, 1)]);
  assert.ok(near(sp.eval(1).cart[1], 1), 'P1 을 지난다');
  assert.ok(near(sp.eval(2).cart[1], 0), 'P2 를 지난다');
  const tight = sp.tension(0.2);
  assert.ok(Number.isFinite(tight.eval(1.5).cart[1]));
  assert.ok(Number.isFinite(tight.eval(1.5).cart[1]));
});

test('curve.ode: RK4 적분 (y′=y, y(0)=1 → e^x)', () => {
  const od = curve.ode({ dy: (x, y) => y, y0: 1 }).on([0, 2]);
  assert.ok(near(od.eval(2).cart[1], Math.exp(2), 1e-2), `y(2)≈e² (${od.eval(2).cart[1]})`);
});

test('curve.ode: 심볼릭 dy 도 동작 (tex)', () => {
  const od = curve.ode({ dy: tex`y`, y0: 1 }).on([0, 1]);
  assert.ok(near(od.eval(1).cart[1], Math.E, 1e-2), `y(1)≈e (${od.eval(1).cart[1]})`);
});

test('curve.taylor: 심볼릭/수치 테일러 계수', () => {
  const t1 = curve.taylor(tex`\sin(x)`, { at: 0, order: 5 });
  assert.ok(near(t1.eval(0.5).cart[1], Math.sin(0.5), 1e-3), 'sin 의 5차 근사');
  const t2 = curve.taylor((x) => Math.exp(x), { at: 0, order: 4 });
  assert.ok(near(t2.eval(0.3).cart[1], Math.exp(0.3), 5e-3), 'exp 의 4차 근사');
});

test('curve: arcLength / curvature / tangentAt / normalAt', () => {
  const par = curve.fn((x) => x * x).on([-1, 1]);
  assert.ok(near(par.arcLength(), 2.95789, 1e-3), `호 길이 (${par.arcLength()})`);
  assert.ok(near(par.curvature(0), 2, 1e-2), `꼭짓점 곡률 2 (${par.curvature(0)})`);
  const t0 = par.tangentAt(0);
  assert.ok(near(t0.pointDir().d[1], 0, 1e-6), 'x=0 접선은 수평');
  const n0 = par.normalAt(0);
  assert.ok(near(n0.pointDir().d[0], 0, 1e-6), 'x=0 법선은 수직');
  assert.ok(svg(plot2d([-1.5, 1.5], [-0.5, 1.5]).add(par, par.tangentAt(0.7), par.normalAt(0.7))).includes('<path'));
});

test('curve.cylindrical / curve.spherical: 3D 좌표계 곡선', () => {
  const hel = curve.cylindrical((t) => [1, t, t]).on([0, 6]);
  const p0 = hel.vertices[0].coords;
  assert.ok(near(p0[0], 1, 1e-9) && near(p0[1], 0, 1e-9) && near(p0[2], 0, 1e-9), `helix 시작 (${p0})`);
  const sph = curve.spherical((t) => [2, t, t / 2]).on([0, Math.PI]);
  assert.ok(near(sph.vertices[0].coords[2], 2, 1e-9), '구면 시작 z=ρ');
  assert.ok(svg(plot3d({ elev: 20, azim: -50 }).add(curve.cylindrical((t) => [1, t, t]).on([0, 6]))).includes('<path'));
});

// ── 원뿔곡선 · 직선 ────────────────────────────────────
test('ellipse.semiMajor/eccentricity · foci().major() · directrix().eccentricity()', () => {
  const e1 = ellipse.center(O).semiMajor(5).eccentricity(0.6);
  assert.ok(near(e1.semi[0], 5) && near(e1.semi[1], 4), `a,b = ${e1.semi}`);
  const e2 = ellipse.foci(point(-3, 0), point(3, 0)).major(10);
  assert.ok(near(e2.semi[0], 5) && near(e2.semi[1], 4), `foci.major a,b = ${e2.semi}`);
  // 준선 y=-3, 초점 (0,0), e=0.5 → a=2, b=√3, 중심 (0,1)
  const e3 = ellipse.directrix(line.horizontal(-3)).eccentricity(0.5);
  assert.ok(near(e3.semi[0], 2) && near(e3.semi[1], Math.sqrt(3)), `directrix a,b = ${e3.semi}`);
  assert.ok(near(e3.center.coords[1], 1, 1e-9), `중심 y = ${e3.center.coords[1]}`);
});

test('parabola.vertex().focus() · parabola.polynomial()', () => {
  const p1 = parabola.vertex(point(0, 0)).focus(point(0, 1));
  assert.ok(near(p1.params().p, 1) && near(p1.params().vy, 0), `VF p=${p1.params().p}`);
  const p2 = parabola.vertex(point(1, 2)).focus(point(3, 2)); // 수평축
  assert.equal(p2.params().horizontal, false);
  const p3 = parabola.polynomial(1, 0, 0); // y = x²
  assert.ok(near(p3.params().p, 0.25) && near(p3.params().vy, 0), 'y = x² → p=1/4');
  const p4 = parabola.polynomial(2, -4, 1); // y = 2x²-4x+1 → 꼭짓점 (1,-1)
  assert.ok(near(p4.params().vx, 1) && near(p4.params().vy, -1), `꼭짓점 (${p4.params().vx},${p4.params().vy})`);
});

test('hyperbola.foci(F1,F2).distance(2a)', () => {
  const h = hyperbola.foci(point(-5, 0), point(5, 0)).distance(6); // a=3, c=5 → b=4
  assert.ok(near(h._conf.semi[0], 3) && near(h._conf.semi[1], 4), `a,b = ${h._conf.semi}`);
});

test('circle.excircle(tri, key)', () => {
  const t = triangle(point(0, 0), point(4, 0), point(0, 3)); // 3-4-5
  const ex = circle.excircle(t, 'a');
  assert.ok(near(ex.center()[0], 6) && near(ex.center()[1], 6), `외심 (${ex.center()})`);
  assert.ok(near(ex.radius(), 6), `r_a = ${ex.radius()}`);
  const inc = circle.inscribed(t);
  assert.ok(near(inc.radius(), 1), '내접원 r=1 (회귀)');
});

test('line.polar(circle, P) · line.commonTangent(c1, c2)', () => {
  const c = circle.center(O).radius(2);
  const pol = line.polar(c, point(4, 0)); // r²/d = 1 → x = 1
  assert.ok(near(pol.pointDir().p[0], 1, 1e-9), `극선 x = ${pol.pointDir().p[0]}`);
  const t = line.commonTangent(circle.center(O).radius(1), circle.center(point(6, 0)).radius(2));
  assert.ok(t && t.all.length === 4, `공통 접선 ${t?.all?.length}개`);
  const { p: Q, d } = t.pointDir();
  const distTo = (Px, Py) => Math.abs((d[0] * (Py - Q[1]) - d[1] * (Px - Q[0])) / Math.hypot(d[0], d[1]));
  assert.ok(near(distTo(0, 0), 1, 1e-6) && near(distTo(6, 0), 2, 1e-6), '접선 거리 = 반지름');
});

// ── 영역: 부등식 · 합집합 · 차집합 ─────────────────────
test('region.inequality: (x,y) 술어 영역을 채운다', () => {
  const r = region.inequality((x, y) => y <= x * x);
  assert.ok(svg(plot2d([-2, 2], [-2, 2]).add(r)).includes('<rect'));
});

test('region.union / difference: 포함 판정이 맞는다', () => {
  const a = region.inside(circle.center(point(-0.5, 0)).radius(1));
  const b = region.inside(circle.center(point(0.5, 0)).radius(1));
  const u = region.union(a, b);
  const d = region.difference(a, b);
  assert.ok(svg(plot2d([-3, 3], [-3, 3]).add(u)).includes('<rect'), '합집합 렌더');
  assert.ok(svg(plot2d([-3, 3], [-3, 3]).add(d)).includes('<rect'), '차집합 렌더');
  assert.ok(contains(u, -0.5, 0) && contains(u, 0.5, 0), '합집합: 두 원 모두 포함');
  assert.ok(contains(d, -1.2, 0) && !contains(d, 0.5, 0), '차집합: b 영역 제외');
});

// ── 주석: shade · brace · limit · legend ──────────────
test('annotate.shade(region): 색/투명도만 바꿔 채운다', () => {
  const s = svg(
    plot2d([-2, 2], [-2, 2]).add(
      annotate
        .shade(region.below((x) => x * x))
        .color('steelblue')
        .opacity(0.3),
    ),
  );
  assert.ok(s.includes('steelblue'), '지정한 색으로 채움');
});

test('annotate.brace: 선분·곡선에 중괄호', () => {
  const s1 = svg(plot2d([-1, 3], [-1, 2]).add(annotate.brace(segment(point(0, 0), point(2, 0))).label('2')));
  assert.ok(s1.includes('<path') && s1.includes('>2<'), '선분 브레이스 + 라벨');
  const s2 = svg(plot2d([-3, 3], [-1, 3]).add(annotate.brace(curve.fn((x) => x * x).on([0, 1.6])).label('arc')));
  assert.ok(s2.includes('>arc<'), '곡선 브레이스 + 라벨');
});

test('annotate.limit: 점선 가이드 + 라벨', () => {
  const f = (x) => (x ? Math.sin(x) / x : 1);
  const s = svg(plot2d([-6, 6], [-0.5, 1.5]).add(curve.fn(f).on([-6, 6]), annotate.limit(f, 0).label('L')));
  assert.ok(s.includes('>L<'), '라벨');
  assert.ok(s.includes('stroke-dasharray="5 4"'), '점선 가이드');
});

test('annotate.legend(): 라벨 있는 도형을 모아 범례 상자', () => {
  const s = svg(
    plot2d([-3, 3], [-3, 3]).add(
      curve
        .fn((x) => x * x)
        .on([-1.5, 1.5])
        .color('#2563eb')
        .label('x²'),
      curve
        .fn((x) => 2 * Math.sin(x))
        .on([-3, 3])
        .color('#dc2626')
        .label('2sin'),
      annotate.legend(),
    ),
  );
  assert.ok(s.includes('>x²<') && s.includes('>2sin<'), '두 항목');
  assert.ok(s.includes('#2563eb') && s.includes('#dc2626'), '색 견본');
});

// ── 3D 입체 · 곡면 · 평면 · 구 ─────────────────────────
test('cube.prism.pyramid.torus 기본 입체가 렌더된다', () => {
  assert.ok(svg(plot3d({ elev: 20, azim: -50 }).add(cube.center(O).edge(2))).includes('<polygon'), 'cube 면');
  assert.ok(
    svg(plot3d({ elev: 20, azim: -50 }).add(prism.base(triangle(O, point(2, 0), point(1, 1.5))).height(2))).includes(
      '<polygon',
    ),
    'prism 면',
  );
  assert.ok(
    svg(
      plot3d({ elev: 20, azim: -50 }).add(
        pyramid.base(polygon(point(-1, -1), point(1, -1), point(1, 1), point(-1, 1))).apex(point(0, 0, 2)),
      ),
    ).includes('<polygon'),
    'pyramid 면',
  );
  assert.ok(svg(plot3d({ elev: 25, azim: -45 }).add(torus.center(O).radii(1, 0.3).solid(12, 8))).length > 300, 'torus');
});

test('polyhedron.vertices(...).faces([...])', () => {
  const poly = polyhedron.vertices(point(0, 0, 0), point(2, 0, 0), point(0, 2, 0), point(0, 0, 2)).faces([
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ]);
  assert.equal(poly.vertices.length, 4);
  assert.ok(svg(plot3d({ elev: 20, azim: -50 }).add(poly)).includes('<polygon'), '4개 면');
});

test('surface.of / surface.ruled / surface.implicit', () => {
  const of = svg(
    plot3d({ elev: 22, azim: -55 }).add(
      surface
        .of((u, v) => [u, v, u * u - v * v])
        .on([-1, 1], [-1, 1])
        .solid(10, 10),
    ),
  );
  assert.ok(of.length > 300, 'surface.of');
  const c1 = curve3.parametric((t) => [Math.cos(t), Math.sin(t), 0]).on([0, Math.PI * 2]);
  const c2 = curve3.parametric((t) => [Math.cos(t), Math.sin(t), 1.5]).on([0, Math.PI * 2]);
  assert.ok(svg(plot3d({ elev: 22, azim: -55 }).add(surface.ruled(c1, c2).solid(12, 4))).length > 300, 'surface.ruled');
  const imp = svg(
    plot3d({ elev: 20, azim: -50 }).add(
      surface
        .implicit((x, y, z) => x * x + y * y + z * z - 1)
        .on([-1.4, 1.4], [-1.4, 1.4], [-1.4, 1.4])
        .res(9),
    ),
  );
  assert.ok(imp.split('<polygon').length - 1 > 10, `구 면 개수 (${imp.split('<polygon').length - 1})`);
});

test('plane.through / pointNormal / standard / offset', () => {
  const p1 = plane.through(point(0, 0, 0), point(1, 0, 0), point(0, 1, 1));
  const n = p1.normal();
  assert.ok(Math.abs(n[0]) < 1e-9, `법선 (${n})`);
  // 법선은 AB, AC 에 수직이어야 한다
  assert.ok(Math.abs(n[0] * 1 + n[1] * 0 + n[2] * 0) < 1e-9, '법선 ⟂ AB');
  assert.ok(Math.abs(n[0] * 0 + n[1] * 1 + n[2] * 1) < 1e-9, '법선 ⟂ AC');
  const p2 = plane.pointNormal(point(0, 0, 1), [0, 0, 1]).offset(1);
  assert.ok(near(p2.anchor()[2], 2, 1e-9), `offset 후 높이 (${p2.anchor()[2]})`);
  const p3 = plane.standard(0, 0, 1, 3);
  assert.ok(near(p3.anchor()[2], 3, 1e-9), `ax+by+cz=d → (${p3.anchor()})`);
  assert.ok(svg(plot3d({ elev: 20, azim: -50 }).add(p1, p2, p3)).includes('<polygon'));
});

test('sphere.through(A,B,C,D) / unit() / center().through()', () => {
  const s1 = sphere.through(point(1, 0, 0), point(-1, 0, 0), point(0, 1, 0), point(0, 0, 1));
  assert.ok(near(s1.radius(), 1, 1e-9), `r = ${s1.radius()}`);
  assert.ok(Math.hypot(...s1.center()) < 1e-9, '중심 원점');
  assert.ok(near(sphere.unit().radius(), 1));

  // ── 2D 원호 · 부채꼴 · 반직선 · 정별 · 타일 ───────────
  test('arc.ofCircle / arc.through / arc.circle.cw / arc.circular', () => {
    const c = circle.center(O).radius(1.5);
    assert.ok(
      svg(
        plot2d([-2, 2], [-2, 2])
          .equal()
          .add(c, arc.ofCircle(c).from(point(1.5, 0)).to(point(0, 1.5))),
      ).includes('<path'),
    );
    assert.ok(
      svg(
        plot2d([-2, 2], [-2, 2])
          .equal()
          .add(arc.through(point(-1, 0), point(0, 1), point(1, 0))),
      ).includes('<path'),
    );
    const s = svg(
      plot2d([-3, 3], [-3, 3])
        .equal()
        .add(
          arc
            .circle(O, 2)
            .from(0)
            .to(Math.PI / 2)
            .cw(),
        ),
    );
    assert.ok(s.includes('<path'), '시계방향 호');
    assert.ok(
      svg(
        plot2d([-2, 2], [-2, 2])
          .equal()
          .add(arc.circular(O, 1, 0, Math.PI)),
      ).includes('<path'),
    );
  });

  test('sector.ofCircle(c).angle(θ)', () => {
    const s = svg(
      plot2d([-2, 2], [-2, 2])
        .equal()
        .add(sector.ofCircle(circle.center(O).radius(1.5)).angle(Math.PI / 3)),
    );
    assert.ok(s.includes('<path') || s.includes('fillpath'), '부채꼴');
  });

  test('ray.from(A).through(B) / ray(A, B)', () => {
    assert.ok(svg(plot2d([-2, 4], [-2, 3]).add(ray.from(point(0, 0)).through(point(1, 1)))).includes('<path'));
    assert.ok(svg(plot2d([-2, 4], [-2, 3]).add(ray(point(0, 0), point(0, 2)))).includes('<path'));
  });

  test('regular.star(5, 1, 0.4)', () => {
    const st = regular.star(5, 1, 0.4);
    assert.equal(st.vertices.length, 10, '꼭짓점 10개');
    assert.ok(svg(plot2d([-2, 2], [-2, 2]).equal().add(st)).includes('<polygon'));
  });

  test('regular.tessellation(hex).on(box)', () => {
    const tiles = regular.tessellation('hex').on({ xmin: 0, xmax: 2, ymin: 0, ymax: 2 });
    assert.ok(Array.isArray(tiles) && tiles.length > 3, `타일 ${tiles.length}개`);
    assert.ok(svg(plot2d([-1, 3], [-1, 3]).add(...tiles)).includes('<polygon'));
  });

  // ── 벡터 · 점 · curve3 · 심볼릭 ───────────────────────
  test('vector.gradient / div / curl (수치 미분)', () => {
    const g = vector.gradient((x, y) => x * x + y * y).at(point(1, 2));
    assert.ok(near(g.v[0], 2, 1e-6) && near(g.v[1], 4, 1e-6), `∇f = ${g.v}`);
    assert.ok(near(vector.div((x, y) => [x, y]).at(point(1, 2)), 2, 1e-6), '∇·F = 2');
    assert.ok(near(vector.curl((x, y) => [-y, x]).at(point(1, 2)), 2, 1e-6), '∂v/∂x−∂u/∂y = 2');
  });

  test('point.reflect(P).over(line|plane) · point.byDeg', () => {
    const r1 = point.reflect(point(1, 2)).over(line.horizontal(0));
    assert.ok(near(r1.coords[1], -2, 1e-9), `선 대칭 (${r1.coords})`);
    const r2 = point.reflect(point(1, 1, 3)).over(plane.coordinate('xy'));
    assert.ok(near(r2.coords[2], -3, 1e-9), `평면 대칭 (${r2.coords})`);
    const p = point.byDeg(1, 30);
    assert.ok(near(p.coords[0], Math.cos(Math.PI / 6), 1e-9) && near(p.coords[1], 0.5, 1e-9), '30도');
  });

  test('curve3.intersect(c1, c2) — 수치 교차점', () => {
    const a = curve3.parametric((t) => [Math.cos(t), Math.sin(t), 0]).on([0, Math.PI * 2]);
    const b = curve3.parametric((t) => [Math.cos(t), 0, Math.sin(t)]).on([0, Math.PI * 2]);
    const pts = curve3.intersect(a, b, { tol: 0.1 });
    assert.ok(pts.length > 0, `교차점 ${pts.length}개`);
  });

  test('tex.substitute: 값이 조용히 틀리지 않는다 (compute-engine 규칙 수정 회귀)', () => {
    assert.equal(tex`x^2+1`.substitute({ x: 2 }).toLatex(), '5');
    assert.equal(tex`y`.substitute({ y: 1.00125 }).toFunction('x')(0), 1.00125);
  });

  assert.ok(
    near(
      sphere
        .center(point(1, 1, 1))
        .through(point(1, 1, 4))
        .radius(),
      3,
      1e-9,
    ),
  );
});

test('cylinder.axis(v).radius().height()', () => {
  assert.ok(
    svg(
      plot3d({ elev: 20, azim: -50 }).add(
        cylinder
          .axis(vector(0, 0, 1))
          .radius(1)
          .height(2),
      ),
    ).includes('<path'),
  );
});
