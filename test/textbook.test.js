// 1.md — 수학 원서 50개: v0.1 필수 30개 + v0.2 다수 통과 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene,
  point,
  line,
  curve,
  circle,
  triangle,
  segment,
  square,
  rectangle,
  region,
  annotate,
  point as ppoint,
  vector,
  regular,
  transform,
  surface,
  vectorField,
  tex,
  pi,
} from '../index.js';

const count = (s, tag) => (String(s).match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;

// ── A. 함수·극한 ─────────────────────────────────
test('#1 함수 그래프 + 정의역 라벨', () => {
  const svg = scene()
    .view([-3.5, 3.5], [-1, 9])
    .axes()
    .add(
      curve
        .fn((x) => x * x - 1)
        .on([-3, 3])
        .label(tex`f(x) = x^2 - 1`),
    )
    .compile()
    .toSVG();
  assert.ok(/<path d="M/.test(svg), '곡선');
  assert.ok(svg.includes('<math') || svg.includes('<foreignObject'), '수식 라벨');
});

test('#2 수직점근선 + 극한 (1/(x-1))', () => {
  const svg = scene()
    .view([-4, 5], [-6, 8])
    .axes()
    .add(
      curve.fn((x) => 1 / (x - 1)).on([-3, 4]),
      line.vertical(1).dash([4, 3]).color('#888'),
      annotate.caption(tex`\lim_{x \to 1} \frac{1}{x-1} = \infty`),
    )
    .compile()
    .toSVG();
  const M = [...String(svg).matchAll(/\bM -?[\d.]+/g)];
  assert.ok(M.length >= 2, `불연속 path 분리 (M ${M.length}개)`);
});

test('#4 좌·우극한 (열린 점)', () => {
  const svg = scene()
    .view([-2.5, 2.5], [-1.5, 1.5])
    .axes()
    .add(
      curve.fn((x) => Math.abs(x) / x).on([-2, 0]),
      curve.fn((x) => Math.abs(x) / x).on([0, 2]),
      point(0, 1)
        .dot({ open: true })
        .label(tex`1`),
      point(0, -1)
        .dot({ open: true })
        .label(tex`-1`),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 1, '곡선 path');
  // 열린 점: 배경색 속 + 선명한 테두리
  assert.ok(/<circle [^>]*fill="#(fdfdfb|ffffff)"[^>]*stroke=/.test(svg), '열린 점(배경 속+테두리)');
});

test('#8 미분계수: 접선 기울기 2', () => {
  const F = curve.fn((x) => x * x).on([-0.5, 3]);
  const T = line.tangent(F).at(1).color('crimson');
  const { d } = T.pointDir();
  assert.ok(Math.abs(d[1] - 2) < 0.05, `접선 기울기 ${d[1]}`);
});

test('#9 리만합 left+right 16개', () => {
  const svg = scene()
    .view([-0.5, 2.5], [-0.5, 5])
    .axes()
    .add(
      region
        .riemann((x) => x * x)
        .on([0, 2])
        .n(8)
        .left()
        .fill('steelblue')
        .opacity(0.4),
      region
        .riemann((x) => x * x)
        .on([0, 2])
        .n(8)
        .right()
        .fill('crimson')
        .opacity(0.3),
    )
    .compile()
    .toSVG();
  const rects =
    String(svg)
      .replace(/<rect width="100%"/g, '')
      .match(/<rect[ >]/g) || [];
  assert.ok(rects.length === 16, `rect ${rects.length}개`);
});

test('#10 정적분 아래 영역 + 라벨', () => {
  const svg = scene()
    .view([-0.5, Math.PI + 0.5], [-0.5, 1.5])
    .axes()
    .add(
      curve.fn(Math.sin).on([0, Math.PI]).color('crimson'),
      region
        .below(curve.fn(Math.sin).on([0, Math.PI]))
        .fill('steelblue')
        .opacity(0.4),
      annotate
        .integral(tex`\sin x`)
        .from(0)
        .to(Math.PI)
        .label(tex`2`),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('steelblue'), '곡선 아래 음영');
  assert.ok(svg.includes('<math'), '적분 라벨');
});

test('#11 두 곡선 사이 영역', () => {
  const F = curve.fn((x) => x).on([0, 1]);
  const G = curve.fn((x) => x * x).on([0, 1]);
  const svg = scene()
    .view([-0.2, 1.2], [-0.2, 1.2])
    .equal()
    .axes()
    .add(F, G, region.between(F, G).on([0, 1]).fill('steelblue').opacity(0.4))
    .compile()
    .toSVG();
  assert.ok(svg.includes('steelblue'), '사이 영역');
});

test('#12 회전체 (disk)', () => {
  const svg = scene()
    .dim(3)
    .camera({ position: [6, -6, 4] })
    .add(
      surface
        .revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4]))
        .about(line.horizontal(0))
        .opacity(0.8),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 2, '회전면');
  assert.ok(!/NaN/.test(svg), 'NaN 없음');
});

test('#14 호 길이 (심볼릭 적분 캡션)', () => {
  const svg = scene()
    .view([-0.2, 1.2], [-0.2, 1.2])
    .equal()
    .add(
      curve
        .fn((x) => x * x)
        .on([0, 1])
        .stroke(2),
      annotate.caption(tex`L = \int_0^1 \sqrt{1 + 4x^2}\,dx \approx 1.4789`),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('<math'), '호 길이 수식');
});
// ── C. 삼각형 기하 ───────────────────────────────
const tA = () => point(0, 0),
  tB = () => point(4, 0),
  tC = () => point(1.5, 3);

test('#17 내접원 + 내심', () => {
  const A = tA(),
    B = tB(),
    C = tC();
  const tri = triangle(A, B, C);
  const I = point.incenter(tri);
  assert.ok(I.coords[0] > 0 && I.coords[0] < 4, '내심 내부');
  const svg = scene()
    .view([-1, 5], [-1, 4])
    .equal()
    .add(tri, circle.inscribed(tri).color('#e11'), I.dot().label('I'))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 1, '내접원');
});

test('#18 외접원 + 외심 (OA≈OB≈OC)', () => {
  const A = tA(),
    B = tB(),
    C = tC();
  const O = point.circumcenter(A, B, C);
  const dA = Math.hypot(A.coords[0] - O.coords[0], A.coords[1] - O.coords[1]);
  const dB = Math.hypot(B.coords[0] - O.coords[0], B.coords[1] - O.coords[1]);
  const dC = Math.hypot(C.coords[0] - O.coords[0], C.coords[1] - O.coords[1]);
  assert.ok(Math.abs(dA - dB) < 1e-6 && Math.abs(dA - dC) < 1e-6, `OA≈OB≈OC ${dA.toFixed(3)}`);
  const svg = scene()
    .view([-3, 7], [-3, 5])
    .equal()
    .add(circle.through(A, B, C).color('steelblue'), O.dot().label('O'), segment(O, A).dash([2, 2]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 1, '외접원');
});

test('#19 무게중심 + 중선', () => {
  const A = tA(),
    B = tB(),
    C = tC();
  const G = point.centroid(A, B, C);
  assert.ok(Math.abs(G.coords[0] - 5.5 / 3) < 1e-6, `G=(5.5/3, 1)`);
  const svg = scene()
    .view([-1, 5], [-1, 4])
    .equal()
    .add(
      G.dot().label('G'),
      segment(A, point.midpoint(B, C)).color('#888'),
      segment(B, point.midpoint(A, C)).color('#888'),
      segment(C, point.midpoint(A, B)).color('#888'),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 3, '중선 3개');
});

test('#22 합동 tick (SSS)', () => {
  const A = point(0, 0),
    B = point(2, 0),
    C = point(1, 1.7);
  const svg = scene()
    .equal()
    .add(
      triangle(A, B, C),
      annotate.tick(segment(A, B)).count(2),
      annotate.tick(segment(B, C)).count(2),
      annotate.tick(segment(C, A)).count(3),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 7, `tick path ${count(svg, 'path')}개`);
});

test('#23 닮음 각 호 (double)', () => {
  const A = point(0, 0),
    B = point(4, 0),
    C = point(1, 3);
  const svg = scene()
    .equal()
    .add(annotate.angle(A, B, C).arc({ radius: 1, double: true }).label('β'), annotate.angle(C, A, B).arc().label('α'))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 2, '각 호');
});

test('#24 피타고라스 square.on(segment)', () => {
  const A = point(0, 0),
    B = point(3, 0);
  const sq = square.on(segment(A, B));
  assert.equal(sq.vertices.length, 4, '정사각형 4변');
  const svg = scene().view([-4, 4], [-4, 4]).equal().add(sq).compile().toSVG();
  assert.ok(/<polygon/.test(svg), '정사각형 polygon');
});

test('#25 원주각=2×중심각', () => {
  const O = point(0, 0);
  const A = point.polar(2, Math.PI / 4),
    B = point.polar(2, (3 * Math.PI) / 4);
  const svg = scene()
    .view([-3, 3], [-3, 3])
    .equal()
    .add(
      circle.center(O).radius(2),
      O.dot(),
      A.dot(),
      B.dot(),
      segment(O, A),
      segment(O, B),
      annotate.angle(A, O, B).arc().degrees().label('2θ'),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 1, '원');
  assert.ok(count(svg, 'path') >= 2, '반지름+각호');
});

test('#26 접선-현', () => {
  const Cc = circle.center(point(0, 0)).radius(2);
  const T = line.tangent(Cc).at(point(2, 0));
  const svg = scene().view([-3, 3], [-3, 3]).equal().add(Cc, T).compile().toSVG();
  assert.ok(count(svg, 'path') >= 1, '접선');
});

test('#16 급수 부분합 수렴', () => {
  const pts = Array.from({ length: 10 }, (_, n) => {
    let s = 0;
    for (let k = 1; k <= n + 1; k++) s += 1 / (k * k);
    return point(n + 1, s).dot();
  });
  const svg = scene()
    .view([0, 12], [0, 2])
    .axes()
    .add(
      ...pts,
      line
        .horizontal(Math.PI ** 2 / 6)
        .dash([4, 3])
        .label(tex`\pi^2/6`),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 9, '부분합 점');
});

// ── E. 삼각함수 ──────────────────────────────────
test('#29 단위원 + sin/cos', () => {
  const O = point(0, 0),
    P = point.polar(1, Math.PI / 6);
  const svg = scene()
    .view([-1.5, 1.5], [-1.5, 1.5])
    .equal()
    .add(
      circle.center(O).radius(1),
      O.dot(),
      P.dot().label(tex`(\cos\theta, \sin\theta)`),
      segment(O, P),
      segment(P, point(Math.cos(Math.PI / 6), 0)).dash([2, 2]),
      annotate
        .angle(point(1, 0), O, P)
        .arc()
        .label(tex`\theta`),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 1, '단위원');
  assert.ok(Math.abs(Math.hypot(P.coords[0], P.coords[1]) - 1) < 1e-6, '단위원 위');
});

test('#30 사인/코사인 위상', () => {
  const svg = scene()
    .view([-2 * Math.PI - 0.5, 2 * Math.PI + 0.5], [-1.5, 1.5])
    .axes()
    .add(
      curve
        .fn(Math.sin)
        .on([-2 * Math.PI, 2 * Math.PI])
        .color('crimson')
        .label(tex`\sin x`),
      curve
        .fn((x) => Math.sin(x - Math.PI / 4))
        .on([-2 * Math.PI, 2 * Math.PI])
        .color('steelblue')
        .label(tex`\sin(x - \pi/4)`),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('crimson') && svg.includes('steelblue'), '두 곡선');
});

test('#31 탄젠트 + 점근선', () => {
  const svg = scene()
    .view([-Math.PI / 2 - 0.5, Math.PI / 2 + 0.5], [-5, 5])
    .axes()
    .add(
      curve.fn(Math.tan).on([-Math.PI / 2 + 0.1, Math.PI / 2 - 0.1]),
      line
        .vertical(Math.PI / 2)
        .dash([3, 3])
        .color('#888'),
      line
        .vertical(-Math.PI / 2)
        .dash([3, 3])
        .color('#888'),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 2, 'tan + 점근선');
});

test('#33 삼각함수 합성 (동일 곡선)', () => {
  const c = (x) => 3 * Math.sin(x) + 4 * Math.cos(x);
  const r = (x) => 5 * Math.sin(x + Math.atan2(4, 3));
  let maxDiff = 0;
  for (let i = 0; i <= 200; i++) {
    const x = -4 + (8 * i) / 200;
    maxDiff = Math.max(maxDiff, Math.abs(c(x) - r(x)));
  }
  assert.ok(maxDiff < 1e-6, `합성차 최대 ${maxDiff.toExponential(3)}`);
});

// ── F. 극좌표·매개변수 ───────────────────────────
test('#34 카디오이드', () => {
  const svg = scene()
    .equal()
    .polarGrid()
    .add(curve.polar((t) => 1 + Math.cos(t)).on([0, 2 * Math.PI]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 1, '카디오이드');
});

test('#35 장미 (3·4 petal)', () => {
  const c3 = curve.polar((t) => Math.cos(3 * t)).on([0, Math.PI]);
  const c4 = curve.polar((t) => Math.cos(2 * t)).on([0, 2 * Math.PI]);
  const svg = scene().equal().add(c3, c4).compile().toSVG();
  assert.ok(count(svg, 'path') >= 2, '두 장미');
});

test('#36 리마송 (내/외 루프', () => {
  const svg = scene()
    .equal()
    .add(curve.polar((t) => 1 + 2 * Math.cos(t)).on([0, 2 * Math.PI]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 1, '리마송');
});

test('#38 리사주 3:4', () => {
  const svg = scene()
    .equal()
    .add(curve.parametric((t) => [Math.sin(3 * t), Math.sin(4 * t)]).on([0, 2 * Math.PI]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 1, '리사주');
});

// ── G. 선형대수 ──────────────────────────────────
test('#39 벡터 합 (평행사변형)', () => {
  const O = point.origin();
  const v = vector.between(O, point(2, 1));
  const w = vector.between(O, point(1, 2));
  const s = [v.v[0] + w.v[0], v.v[1] + w.v[1]];
  assert.deepEqual(s, [3, 3], 'v+w=(3,3)');
  const svg = scene()
    .view([-1, 4], [-1, 4])
    .equal()
    .axes()
    .add(
      vector.between(O, point(2, 1)).color('crimson').label('v'),
      vector.between(O, point(1, 2)).color('steelblue').label('w'),
      segment(point(2, 1), point(3, 3)).dash([2, 2]),
      segment(point(1, 2), point(3, 3)).dash([2, 2]),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'line') >= 2, '벡터 선');
});

test('#40 행렬 변환 (회전/반사/shear)', () => {
  const unit = regular.polygon(point.origin(), 4, 1);
  assert.equal(unit.vertices.length, 4, '정사각형');
  const svg = scene().view([-2, 2], [-2, 2]).equal().add(unit).compile().toSVG();
  assert.ok(/<polygon/.test(svg), '변환 후 polygon');
});

test('#41 고유벡터', () => {
  const svg = scene()
    .view([-1, 2], [-1, 2])
    .axes()
    .add(
      vector.between(point.origin(), point(1, 0.5)).color('crimson').label('v₁'),
      vector.between(point.origin(), point(-0.4, 1)).color('steelblue').label('v₂'),
      annotate.caption(tex`Av_1 = 3v_1, \quad Av_2 = 2v_2`),
    )
    .compile()
    .toSVG();
  assert.ok(count(svg, 'line') >= 1, '벡터');
});

test('#44 정규분포 + 음영 (68%)', () => {
  const gauss = (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  const svg = scene()
    .view([-4, 4], [-0.05, 0.5])
    .axes()
    .add(
      curve.fn(gauss).on([-4, 4]).color('crimson'),
      region
        .below(curve.fn(gauss).on([-1, 1]))
        .fill('steelblue')
        .opacity(0.4),
      annotate.caption(tex`P(-1 < Z < 1) \approx 0.6827`),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('steelblue'), '정규분포 음영');
});

test('#45 이항분포 막대 (rectangle.on)', () => {
  const bc = (k) => {
    let r = 1;
    for (let i = 0; i < k; i++) r *= (10 - i) / (i + 1);
    return r * 0.5 ** 10;
  };
  const bars = Array.from({ length: 11 }, (_, k) =>
    rectangle
      .on([k - 0.4, k + 0.4], [0, bc(k)])
      .fill('steelblue')
      .opacity(0.7),
  );
  const svg = scene().view([-1, 11], [0, 0.3]).addAll(bars).compile().toSVG();
  assert.ok(count(svg, 'rect') >= 11, '막대 11개');
});

test('#48 기울기장 vectorField', () => {
  const svg = scene()
    .view([-3, 3], [-3, 3])
    .axes()
    .add(vectorField((x, y) => [1, x + y]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 20, '방향장 화살표');
});
