// examples/mpl_parity_12a1.js — example4.py (12A1 · 복소수) 재현 — logos 만 사용
//
// ── 무엇을 하는가 ────────────────────────────────────────────────
//   matplotlib 로 그린 "복소수" 교재 그림 12개(12A1 세션)를 logos DSL **만으로**
//   같은 구성으로 다시 그린다. 복소평면·극형식 · i 의 거듭제곱(90° 회전) ·
//   켤레(실축 반사) · 덧셈(벡터 합) · 곱셈(회전+확대) · 행렬 대응 [[a,−b],[b,a]] ·
//   드무아브르 나선 · 1 의 n제곱근(정n각형) · 1/z 반전+반사 · 이차방정식의 복소근 ·
//   편각의 덧셈 · 복소평면 요약 — 12A1 세션 전 그림을 커버하는 **대표 예제 4** 다.
//
// ── 실행 ────────────────────────────────────────────────────────
//   node examples/mpl_parity_12a1.js   →  output/parity12a1/*.svg + *.png + index.html
//   npm run parity12a1                 (동일)
//
// ── mpl 대응 규칙 (이 예제가 지키는 관례) ────────────────────────
//   · 복소수      `cplx(3, 2)` = 3+2i (logos/complex.js) ← complex(3, 2)
//                 `z.abs` ← abs(z), `z.arg`/`z.argDeg` ← np.angle(z), `z.conj` ← np.conj(z)
//                 `cplx.mul/div/pow/roots/unity/matrix` ← z1*z2, 1/z, z**n, np.roots, [[a,-b],[b,a]]
//   · 복소평면      z = a+bi ↔ 점 (a, b) — `point(a, b)` · `polygon(...)` ← ax.plot / ax.fill
//   · 원          `circle.center(point(0,0)).radius(r)` ← Circle((0,0), r, fill=False)
//   · 곡선        `curve.fn(x => x*x+1).on([-2, 2])` ← ax.plot(x, f(x))
//   · 각 호        `annotate.angle({ from, vertex, to }).arc({ radius })` ← patches.Arc
//                 (`.dash([2,3])` 점선 호 · `.opacity(0.5)` 흐린 호)
//   · 휜 화살표     `annotate.arrow(A, B).bend(0.3)` ← annotate(arrowprops=…'arc3,rad=0.3')
//                 (rad>0 = 진행 방향 오른쪽으로 휨 — 원호 화살표·순환 표시)
//   · 여러 패널     `subplots([...], { cols })` ← plt.subplots(rows, cols)
//   · 제목        `.title('…')` 은 **축 안쪽 상단**(mpl 은 축 바깥) → 두 줄 제목은
//                 눈금 라벨과 겹치므로 이 예제는 한 줄 제목을 쓴다.
//
// ── figure 목록 ─────────────────────────────────────────────────
//    1 complex-plane-polar        복소평면 · 극형식 (단일)
//    2 i-powers-cycle             i 의 거듭제곱 = 90° 회전 (단일)
//    3 conjugate-reflection       켤레 = 실축 반사 (단일)
//    4 complex-addition           복소수 덧셈 = 벡터 덧셈 (단일)
//    5 complex-multiplication     곱 = 회전 + 확대 (1×2)
//    6 matrix-correspondence      a+bi ↔ 회전·확대 행렬 (2×3)
//    7 demoivre-spiral            드무아브르: zⁿ = rⁿe^{inθ} 나선 (단일)
//    8 roots-unity-ngon           1 의 n제곱근 = 정n각형 (1×3)
//    9 reciprocal-geometry        1/z = 반전 + 반사 — 단계별 4컷 (2×2)
//   10 quadratic-complex-roots    이차방정식의 복소근 (1×2)
//   11 argument-addition          편각의 덧셈 (단일)
//   12 complex-plane-summary      복소평면 요약 (단일)
//
// ── 참고 ────────────────────────────────────────────────────────
//   · 색은 mpl 원본이 쓴 hex 그대로 고정 — 두 그림을 눈으로 비교할 수 있다.
//   · mpl 원본의 표기/수치 문제는 주석 `mpl 대비` 로 표시하고 고쳤다.
import { join } from 'node:path';
import {
  point, circle, polygon, segment, curve, annotate, cplx, cmapColor, tex, kit,
} from '../index.js';

const OUT = join(import.meta.dirname, '..', 'output', 'parity12a1');

// ── 색 — mpl 원본이 쓴 hex 그대로 ────────────────────────────────
const RED = '#e74c3c', BLUE = '#3498db', GREEN = '#27ae60', PURPLE = '#8e44ad';
const ORANGE = '#f39c12', TEAL = '#1abc9c', BLUE_D = '#2471a3', GRAY = '#95a5a6';
const { plot2d, subplots, saveFigures } = kit;

// ── 미세 헬퍼 (전부 라이브러리 API 위의 얇은 별칭) ──────────────
/** 복소수 → `[a, b]` (복소평면 좌표) */
const arr = (z) => (Array.isArray(z) ? z : z.toArray());
/** `[x, y]` → point */
const P = (v) => point(v[0], v[1]);
/** 꼭짓점 마커 ← ax.plot(x, y, 'o') — `size` 는 **반지름(px)**; mpl markersize(지름 pt)의 절반쯤 */
const dotAt = (v, color, size = 6, shape = 'circle') => P(arr(v)).marker(shape).color(color).size(size);
/** 화살표 ← ax.arrow (bend 는 mpl arc3,rad) */
const arrowAt = (from, to, { color, stroke = 2, dash, opacity, bend, label } = {}) => {
  let a = annotate.arrow(P(arr(from)), P(arr(to)));
  if (color !== undefined) a = a.color(color);
  if (stroke !== undefined) a = a.stroke(stroke);
  if (dash !== undefined) a = a.dash(dash);
  if (opacity !== undefined) a = a.opacity(opacity);
  if (bend !== undefined) a = a.bend(bend);
  if (label !== undefined) a = a.label(label);
  return a;
};
/** 색 있는 텍스트 ← ax.text / ax.annotate(textcoords='offset points') */
const labelAt = (at, text, { color, font = 11, bold = false, anchor, box, dx, dy, rotate, opacity } = {}) => {
  let t = annotate.text(P(arr(at))).label(text).font(font);
  if (color !== undefined) t = t.color(color);
  if (bold) t = t.bold();
  if (anchor) t = t.anchor(anchor);
  if (box) t = t.box(box);
  if (dx !== undefined || dy !== undefined) t = t.offset(dx || 0, dy || 0);
  if (rotate !== undefined) t = t.rotate(rotate);
  if (opacity !== undefined) t = t.opacity(opacity);
  return t;
};
/** 선분 ← ax.plot([x1,x2],[y1,y2], …) */
const segAt = (a, b, { color, stroke = 1, dash, opacity } = {}) => {
  let s = segment(P(arr(a)), P(arr(b)));
  if (color !== undefined) s = s.color(color);
  if (stroke !== undefined) s = s.stroke(stroke);
  if (dash !== undefined) s = s.dash(dash);
  if (opacity !== undefined) s = s.opacity(opacity);
  return s;
};
/** 빈 원 ← Circle((cx,cy), r, fill=False) */
const circleAt = (center, r, { color, stroke = 1.5, dash, opacity } = {}) => {
  let c = circle.center(P(center)).radius(r);
  if (color !== undefined) c = c.color(color);
  if (stroke !== undefined) c = c.stroke(stroke);
  if (dash !== undefined) c = c.dash(dash);
  if (opacity !== undefined) c = c.opacity(opacity);
  return c;
};
/** 각 호 ← patches.Arc((0,0), 2r, 2r, theta1, theta2) — 원점 중심, 반지름 r */
const arcAt = (from, to, r, { color, stroke = 2, dash, opacity } = {}) => {
  let a = annotate.angle({ from: arr(from), vertex: [0, 0], to: arr(to) }).arc({ radius: r });
  if (color !== undefined) a = a.color(color);
  if (stroke !== undefined) a = a.stroke(stroke);
  if (dash !== undefined) a = a.dash(dash);
  if (opacity !== undefined) a = a.opacity(opacity);
  return a;
};
/** 2D 서브패널 프리셋 — equal + axes + grid (패널 크기를 맞춘다) */
const CELL = [480, 440];
const s2 = (xr, yr, o = {}) => plot2d(xr, yr, { size: CELL, equal: true, ...o });


// ── 1. 복소평면 · 극형식 ──
function complexPlanePolar() {
  const z = cplx(3, 2), r = z.abs, theta = z.argDeg, half = (theta / 2) * Math.PI / 180;
  return s2([-1, 5], [-1, 4], {
    axes: { x: { label: 'Real axis' }, y: { label: 'Imaginary axis' } }, grid: { alpha: 0.25 },
  }).title('Complex Plane: z = a+bi = (a,b) = r·e^(iθ)').add(
    circleAt([0, 0], 1, { color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.4 }),      // 단위원
    circleAt([0, 0], r, { color: BLUE, stroke: 1.5, dash: [2, 3], opacity: 0.5 }),   // |z| 원
    // 좌표축으로 내린 수선(점선)
    segAt([z.re, 0], arr(z), { color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.5 }),
    segAt([0, z.im], arr(z), { color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.5 }),
    arrowAt([0, 0], z, { color: RED, stroke: 3 }),                                   // 벡터 z
    arcAt([1, 0], z, 0.75, { color: PURPLE, stroke: 2.5 }),                          // arg z 호
    labelAt(z, 'z = 3+2i', { color: RED, font: 12, bold: true, dx: 10, dy: 10 }),
    labelAt([z.re, -0.5], `Re(z)=${z.re}`, { color: GRAY, font: 9, anchor: 'middle' }),
    labelAt([-0.55, z.im], `Im(z)=${z.im}`, { color: GRAY, font: 9, anchor: 'end' }),
    labelAt([1.0, 0.35], `θ≈${theta.toFixed(0)}°`, { color: PURPLE, font: 11, bold: true }),
    labelAt([(r / 2) * Math.cos(half) - 0.15, (r / 2) * Math.sin(half)], `r=${r.toFixed(2)}`,
      { color: BLUE, font: 10 }),
  ).compile();
}

// ── 2. i 의 거듭제곱 = 90° 회전 ──
function iPowersCycle() {
  const powers = [[1, 0, '1', GREEN], [0, 1, 'i', BLUE], [-1, 0, '-1', RED], [0, -1, '-i', ORANGE]];
  const offs = [[15, 10], [-20, 15], [-25, -20], [15, -25]];    // mpl annotate 의 offset points
  return s2([-1.8, 1.8], [-1.8, 1.8], { grid: { alpha: 0.2 } })
    .title('Multiplying by i = 90° Rotation on the Unit Circle').add(
      circleAt([0, 0], 1, { color: GRAY, stroke: 1.5, dash: [5, 4], opacity: 0.4 }),
      ...powers.flatMap(([x, y, v, c], k) => [
        dotAt([x, y], c, 7.5),
        labelAt([x, y], tex`i^{${k}} = ${v}`, { color: c, font: 12, bold: true, dx: offs[k][0], dy: offs[k][1] }),
      ]),
      // 순환 화살표 ← mpl annotate(connectionstyle='arc3,rad=0.3') — 바깥으로 휜다
      ...powers.map(([x, y], k) => {
        const [nx, ny] = powers[(k + 1) % 4];
        return arrowAt([x, y], [nx, ny], { color: PURPLE, stroke: 2.5, bend: 0.3 });
      }),
      labelAt([0.25, 0.35], '× i', { color: PURPLE, font: 11, bold: true }),
    ).compile();
}

// ── 3. 켤레 = 실축 반사 ──
function conjugateReflection() {
  const z = cplx(3, 2), zbar = z.conj;
  return s2([-1, 5.5], [-3.5, 3.5], {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.2 },
  }).title('Conjugate = Reflection Across the Real Axis').add(
    // 실축 하이라이트 ← axhline(0, lw=3, alpha=0.2)
    segment(P([-1, 0]), P([4.9, 0])).color(GREEN).stroke(3).opacity(0.2),
    labelAt([4.2, 0.25], 'Real axis = mirror', { color: GREEN, font: 10, bold: true }),
    arrowAt([0, 0], z, { color: RED, stroke: 3 }),
    labelAt(z, 'z = 3+2i', { color: RED, font: 12, bold: true, dx: 10, dy: 10 }),
    arrowAt([0, 0], zbar, { color: BLUE, stroke: 3 }),
    labelAt(zbar, tex`\bar{z} = 3-2i`, { color: BLUE, font: 12, bold: true, dx: 10, dy: -18 }),
    segAt(arr(z), arr(zbar), { color: GRAY, stroke: 1.5, dash: [5, 4], opacity: 0.6 }),
    labelAt([z.re + 0.15, 0], '|b|', { color: GRAY, font: 10 }),
    labelAt([z.re + 0.15, z.im / 2], 'same x', { color: GRAY, font: 9, opacity: 0.7 }),
    labelAt([4, 1.2], '⟺ Reflection',
      { color: GREEN, font: 11, bold: true, box: { facecolor: '#d5f5e3', alpha: 0.7 } }),
  ).compile();
}


// ── 4. 복소수 덧셈 = 벡터 덧셈(평행사변형) ──
function complexAddition() {
  const z1 = cplx(2, 1), z2 = cplx(1, 3), sum = cplx.add(z1, z2);
  return s2([-0.5, 4.5], [-0.5, 5], {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.25 },
  }).title('Complex Addition = Vector Addition (Parallelogram Law)').add(
    arrowAt([0, 0], z1, { color: RED, stroke: 3 }),
    arrowAt([0, 0], z2, { color: BLUE, stroke: 3 }),
    // 평행사변형의 나머지 두 변 — mpl 은 점선 화살표
    arrowAt(arr(z1), sum, { color: BLUE, stroke: 2, dash: [5, 4], opacity: 0.6 }),
    arrowAt(arr(z2), sum, { color: RED, stroke: 2, dash: [5, 4], opacity: 0.6 }),
    arrowAt([0, 0], sum, { color: GREEN, stroke: 3.5 }),
    labelAt([z1.re / 2 - 0.2, z1.im / 2 - 0.3], tex`z_1`, { color: RED, font: 13, bold: true }),
    labelAt([z2.re / 2 - 0.3, z2.im / 2 - 0.3], tex`z_2`, { color: BLUE, font: 13, bold: true }),
    labelAt([sum.re / 2 + 0.1, sum.im / 2 + 0.1], tex`z_1+z_2`, { color: GREEN, font: 13, bold: true }),
    labelAt([2, 3.5], 'Same as vector addition!\n(Review 12A2 Example 8)',
      { font: 10, box: { facecolor: '#fff9c4', alpha: 0.8 } }),
  ).compile();
}

// ── 5. 곱 = 회전 + 확대 ──
function complexMultiplication() {
  const z1 = cplx(2, 0.5);
  const r2 = 2, th2 = 60;                      // z₂ = 2e^{iπ/3} — 2배 늘이고 60° 회전
  const z2 = cplx.polar(r2, th2);
  const M = cplx.matrix(z2);
  const prod = cplx.mul(z1, z2);
  const UNIT = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const tSq = M.map(UNIT);                     // 변환된 단위정사각형
  const style = {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.25 },
  };
  const left = s2([-1, 6], [-1, 6], style).title('Before: z₁').add(
    arrowAt([0, 0], z1, { color: RED, stroke: 3 }),
    labelAt([z1.re / 2 - 0.2, z1.im / 2 - 0.3], tex`z_1`, { color: RED, font: 13, bold: true }),
    labelAt([2.5, 1.5], `|z₁|=${z1.abs.toFixed(2)}\narg≈${z1.argDeg.toFixed(0)}°`,
      { font: 10, box: { facecolor: '#fadbd8', alpha: 0.7 } }),
  );
  const right = s2([-1, 6], [-1, 6], style).title('After: z₁·z₂ (Stretch + Rotate)').add(
    polygon(...tSq.map(P)).fill(BLUE).color(BLUE_D).stroke(1).dash([5, 4]).opacity(0.15),
    arrowAt([0, 0], prod, { color: PURPLE, stroke: 3.5 }),
    labelAt([prod.re / 2 + 0.15, prod.im / 2], tex`z_1 \cdot z_2`, { color: PURPLE, font: 12, bold: true }),
    labelAt([3.5, 1.2],
      `|z₁z₂|=${prod.abs.toFixed(2)}\narg≈${prod.argDeg.toFixed(0)}°\n\nStretch ×${r2}, Rotate +${th2}°`,
      { font: 10, box: { facecolor: '#e8daef', alpha: 0.7 } }),
  );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Complex Multiplication = Rotation + Scaling — z acts like [[r cos θ, −r sin θ], [r sin θ, r cos θ]]',
  });
}

// ── 6. a+bi ↔ 회전·확대 행렬 [[a,−b],[b,a]] ──
function matrixCorrespondence() {
  const pairs = [
    [cplx(1, 0), '1 (identity)', GREEN],
    [cplx(0, 1), 'i (90° rot)', BLUE],
    [cplx(-1, 0), '-1 (180° rot)', RED],
    [cplx(2, 0), '2 (stretch ×2)', ORANGE],
    [cplx(1, 1), '1+i (stretch+rot)', PURPLE],
    [cplx(0.6, 0.8), '0.6+0.8i (rot ~53°)', TEAL],
  ];
  const UNIT = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const figs = pairs.map(([z, label, color]) => {
    const M = cplx.matrix(z);
    const sq = M.map(UNIT);
    return s2([-3, 3], [-3, 3], { grid: { alpha: 0.2 } })
      .title(`z = ${label} — M = [[${z.re}, ${-z.im}], [${z.im}, ${z.re}]]`)
      .add(
        polygon(...sq.map(P)).fill(color).color(color).stroke(2).opacity(0.3),
        ...sq.map((p) => dotAt(p, color, 1.5)),
        arrowAt([0, 0], M.col(0), { color: RED, stroke: 1.5, opacity: 0.7 }),    // M·[1,0] = 1열
        arrowAt([0, 0], M.col(1), { color: BLUE, stroke: 1.5, opacity: 0.7 }),   // M·[0,1] = 2열
      );
  });
  return subplots(figs, {
    cols: 3, tight: true,
    title: 'Every Complex Number IS a Rotation-Scaling Matrix — a+bi ↔ [[a, −b], [b, a]]',
  });
}


// ── 7. 드무아브르: zⁿ = rⁿe^{inθ} 나선 ──
function demoivreSpiral() {
  const z0 = cplx(1.15, 0.35);                       // r ≈ 1.20, θ ≈ 16.9°
  const r = z0.abs, th = z0.argDeg;
  const cs = Array.from({ length: 8 }, (_, i) => cmapColor('plasma', (0.9 * i) / 7));
  const zs = Array.from({ length: 8 }, (_, i) => z0.pow(i + 1));
  // 각 호 — mpl 은 n = 1, 4, 8 에서 Arc((0,0), 0.6rⁿ, 0.6rⁿ) 을 쓴다. Arc 의 폭/높이는
  //   **지름**이라 실제 반지름은 0.3·rⁿ — 호가 나선팔에도 실수축에도 닿지 않아 공중에
  //   떠 있는 것처럼 보였다. mpl 대비: 호 반지름 = |zⁿ| → 호의 한 끝은 실수축 (rⁿ, 0),
  //   다른 끝은 zⁿ 에 정확히 붙는다. "실수축으로 rⁿ 만큼 나간 뒤 nθ 만큼 회전" 이라는
  //   드무아브르의 두 단계가 호 하나에 그대로 담긴다.
  const arcs = [1, 4, 8].flatMap((n) => {
    const c = cs[n - 1], rn = r ** n, mid = ((th * n) / 2) * (Math.PI / 180);
    return [
      arcAt([1, 0], zs[n - 1], rn, { color: c, stroke: 1.6, dash: [2, 3], opacity: 0.8 }),
      dotAt([rn, 0], c, 3, 'square'),                     // 호의 발 — 실수축에 붙는다
      labelAt([rn, 0], tex`r^{${n}}`, { color: c, font: 8, dx: -3, dy: -4, anchor: 'end' }),
      // 호의 가운데 = nθ. n = 1 은 z¹·r¹ 라벨과 붙어서 생략(값은 아래 상자에 있다).
      ...(n > 1 ? [labelAt([Math.cos(mid) * rn * 1.02, Math.sin(mid) * rn * 1.02], tex`${n}\theta`,
        { color: c, font: 9, anchor: 'middle' })] : []),
    ];
  });
  return s2([-5.5, 5.5], [-5.5, 5.5], { grid: { alpha: 0.2 } })
    .title('De Moivre: zⁿ = rⁿ·e^(inθ)').add(
      ...zs.map((z, i) => arrowAt(i ? zs[i - 1] : [0, 0], z, { color: cs[i], stroke: 2 })),
      ...zs.map((z, i) => dotAt(z, cs[i], 4)),
      // 점 라벨은 z¹·z⁴·z⁸ 만 — |z| ≈ 1.2 라 여덟 개를 다 붙이면 원점 근처에서 겹친다.
      //   방향도 점마다 다르게: 나선은 왼쪽 위로 감기므로 라벨은 바깥쪽(오른쪽/위)에 둔다.
      ...[
        [1, { dx: 14, dy: 2 }],
        [4, { dx: -6, dy: -12, anchor: 'end' }],
        [8, { dx: 0, dy: -14, anchor: 'middle' }],
      ].map(([n, o]) => labelAt(zs[n - 1], tex`z^{${n}}`, { color: cs[n - 1], font: 10, bold: true, ...o })),
      ...arcs,
      labelAt([0.6, -4.0], `z₀ = 1.15 + 0.35i\nr = |z₀| = ${r.toFixed(2)},  θ = arg z₀ = ${th.toFixed(1)}°\nzⁿ = rⁿ·e^(inθ)`,
        { font: 10, box: { facecolor: '#fdebd0', alpha: 0.85 } }),
    ).compile();
}

// ── 8. 1 의 n제곱근 = 정n각형 ──
function rootsOfUnityNgon() {
  const figs = [[3, 'n=3: Triangle'], [4, 'n=4: Square'], [6, 'n=6: Hexagon']].map(([n, title]) => {
    const roots = cplx.unity(n, 1.5);
    const cs = roots.map((_, k) => cmapColor('viridis', (0.9 * k) / Math.max(1, n - 1)));
    return s2([-2.2, 2.2], [-2.2, 2.2], {
      axes: { x: { label: 'Re' }, y: { label: 'Im' } }, grid: { alpha: 0.2 },
    }).title(title).add(
      circleAt([0, 0], 1.5, { color: GRAY, stroke: 1.5, dash: [5, 4], opacity: 0.4 }),
      polygon(...roots.map((z) => P(arr(z)))).fill(BLUE).color(BLUE_D).stroke(2).opacity(0.2),
      ...roots.flatMap((z, k) => [
        dotAt(z, cs[k], 6),
        labelAt(z, tex`e^{i\cdot 2\pi\cdot ${k}/${n}}`, {
          color: cs[k], font: 8, bold: true,
          dx: z.re > 0 ? 15 : -25, dy: z.im > 0 ? 15 : -25,
        }),
      ]),
      labelAt([0, 0], 'Sum = 0', { font: 10, anchor: 'middle', box: { facecolor: '#ffffff', alpha: 0.8 } }),
    );
  });
  return subplots(figs, {
    cols: 3, tight: true, title: 'Roots of Unity = Regular n-gon on the Unit Circle',
  });
}

// ── 9. 1/z = 반전 + 반사 (단계별 4컷) ──
//    mpl 원본은 한 화면에 네 점을 몰아넣고 ylim(-0.5, 3.5) 안에 1/z 가 하나도 들어오지
//    않아(네 점 모두 허수부가 음수) 규칙 `1/z = z̄/|z|²` 이 전혀 읽히지 않았다. mpl 대비:
//    대표 점 z = 2+0.5i **하나**로 두 단계를 4컷으로 나눠 차례로 보여준다.
//      ① z 를 원점에서의 벡터로            |z| = 2.06, arg z ≈ 14°
//      ② 실축 대칭 → z̄                     |z̄| = |z| 그대로, 각도만 −θ
//      ③ 반지름만 ÷|z|² 로 반전 → 1/z       z̄ 와 같은 반직선 위, 길이 2.06 → 0.49
//      ④ 결과 — 세 점에서 확인              |z|·|1/z| = 1 (밖 ↔ 안)
function reciprocalGeometry() {
  const HZ = cplx(2, 0.5);                              // 대표 점 z = 2 + 0.5i
  const r = HZ.abs, th = HZ.argDeg, r2 = r * r;
  const BAR = HZ.conj, INV = cplx.div(1, HZ);
  const plane = (t) => s2([-0.7, 3.2], [-2.2, 2.2], {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.2 },
  }).title(t);
  const unitCircle = circleAt([0, 0], 1, { color: GREEN, stroke: 2, dash: [5, 4], opacity: 0.6 });
  const unitLabel = labelAt([0.62, 0.82], '|z| = 1', { color: GREEN, font: 9, rotate: 40 });
  // 흐린 마커 = "이미 지나온 단계" (앞 단계의 결과가 남아 있어야 따라가기 쉽다)
  const ghost = (v, size, shape) => P(arr(v)).marker(shape).color(RED).size(size).opacity(0.35);
  const note = (txt, face) => labelAt([1.15, -1.3], txt,
    { font: 9, box: { facecolor: face, alpha: 0.85 } });

  // ① z — 원점에서의 벡터 (|z| 와 arg z)
  const p1 = plane('①  z = 2 + 0.5i   (a vector from 0)').add(
    segAt([0, 0], arr(HZ), { color: RED, stroke: 2.5 }),
    dotAt(HZ, RED, 6),
    labelAt(HZ, 'z', { color: RED, font: 11, bold: true, dx: 8, dy: 10 }),
    labelAt([1.3, 0.55], `|z| = ${r.toFixed(2)}`, { color: RED, font: 9 }),
    arcAt([1, 0], HZ, 0.7, { color: RED, stroke: 1.4, dash: [3, 3], opacity: 0.85 }),
    labelAt([0.98, 0.16], `θ ≈ ${th.toFixed(0)}°`, { color: RED, font: 9 }),
    note(`z = a + bi\n|z| = √(a²+b²) = ${r.toFixed(2)}\narg z = ${th.toFixed(1)}°`, '#fadbd8'),
  );

  // ② 실축 대칭 → z̄ (허수부의 부호만 바뀐다)
  const p2 = plane('②  mirror across Re axis  →  z̄').add(
    segAt([0, 0], arr(HZ), { color: RED, stroke: 2, opacity: 0.3 }),
    ghost(HZ, 6, 'circle'),
    labelAt(HZ, 'z', { color: RED, font: 11, bold: true, dx: 8, dy: 10, opacity: 0.45 }),
    segAt(arr(HZ), arr(BAR), { color: RED, stroke: 1.2, dash: [2, 2], opacity: 0.9 }),   // 대칭 이동
    segAt([0, 0], arr(BAR), { color: RED, stroke: 2.5 }),
    dotAt(BAR, RED, 5, 'triangle'),
    labelAt(BAR, 'z̄', { color: RED, font: 11, bold: true, dx: 8, dy: -13 }),
    note(`z̄ = a − bi = ${BAR.toString()}\n|z̄| = |z| = ${r.toFixed(2)}  (unchanged)\narg z̄ = −arg z = ${(-th).toFixed(1)}°`, '#fadbd8'),
  );

  // ③ 반지름만 ÷|z|² → 1/z (방향은 z̄ 그대로)
  //    화살촉이 1/z 마커를 덮지 않도록 **1/z 직전까지만** 그린다(촉과 마커가 붙어 보이게).
  const shrinkEnd = cplx.scale(BAR, 0.32);
  const p3 = plane('③  invert the radius:  |z̄| ÷ |z|²').add(
    unitCircle, unitLabel,
    segAt([0, 0], arr(BAR), { color: RED, stroke: 1.2, dash: [4, 3], opacity: 0.45 }),
    ghost(BAR, 5, 'triangle'),
    labelAt(BAR, 'z̄', { color: RED, font: 10, bold: true, dx: 8, dy: -13, opacity: 0.5 }),
    arrowAt(arr(BAR), arr(shrinkEnd), { color: RED, stroke: 2.2 }),    // 길이만 줄인다
    dotAt(INV, RED, 6, 'square'),
    labelAt(INV, '1/z', { color: RED, font: 11, bold: true, dx: 9, dy: -14 }),
    labelAt([1.35, -0.55], `÷ |z|² = ÷ ${r2.toFixed(2)}`,
      { color: RED, font: 9, anchor: 'middle' }),
    note(`same ray as z̄  (direction kept)\nlength ÷ |z|² = ÷ ${r2.toFixed(2)}\n|1/z| = 1/|z| = ${(1 / r).toFixed(2)}`, '#fdebd0'),
  );

  // ④ 결과 — 세 점에서 |z|·|1/z| = 1 (밖 → 안, 안 → 밖)
  const pts = [[2, 0.5], [0.5, 1.5], [0.3, 0.3]];
  const cs = [RED, BLUE, ORANGE];
  const invOff = [[8, -14], [8, 10], [8, 12]];          // 1/z 라벨이 서로 붙지 않게 방향 분리
  const p4 = plane('④  check: 1/z = z̄/|z|²  (product = 1)').add(
    unitCircle, unitLabel,
    ...pts.flatMap(([x, y], i) => {
      const z = cplx(x, y), inv = arr(cplx.div(1, z)), bar = arr(z.conj), c = cs[i];
      const o = invOff[i];
      return [
        segAt([0, 0], bar, { color: c, stroke: 1.2, dash: [4, 3], opacity: 0.45 }),   // z̄ 반직선
        dotAt(bar, c, 5, 'triangle'),
        dotAt(inv, c, 6, 'square'),
        dotAt([x, y], c, 6),
        labelAt([x, y], 'z', { color: c, font: 10, bold: true, dx: 8, dy: 9 }),
        labelAt(inv, '1/z', { color: c, font: 10, bold: true, dx: o[0], dy: o[1] }),
      ];
    }),
    labelAt([1.15, 1.68], '1/z = z̄ / |z|²\n|z| = 2.06  →  |1/z| = 0.49\n|z|·|1/z| = 2.06 × 0.49 = 1',
      { font: 9, box: { facecolor: '#d5f5e3', alpha: 0.85 } }),
  );

  return subplots([p1, p2, p3, p4], {
    cols: 2, tight: true,
    title: 'Reciprocal 1/z = z̄/|z|² — Step by Step (mirror, then invert the radius)',
  });
}

// ── 10. 이차방정식의 복소근 ──
function quadraticComplexRoots() {
  const left = plot2d([-2.2, 2.2], [-0.5, 4.5], {
    size: CELL, axes: { x: { label: 'x' }, y: { label: 'y' } }, grid: { alpha: 0.25 },
  }).title('Real View: No x-intercepts').add(
    curve.fn((x) => x * x + 1).on([-2, 2]).color(BLUE).stroke(2),
    dotAt([0, 1], RED, 5),
    labelAt([1, 1.2], 'y = x²+1 never\ncrosses x-axis\n→ no real roots',
      { font: 10, box: { facecolor: '#fadbd8', alpha: 0.7 } }),
  );
  const right = s2([-2, 2], [-2, 2], {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.25 },
  }).title('Complex View: z²+1 = 0 → z = ±i').add(
    circleAt([0, 0], 1, { color: GRAY, stroke: 1.5, dash: [5, 4], opacity: 0.3 }),
    dotAt([0, 1], RED, 7), dotAt([0, -1], RED, 7),
    labelAt([0, 1], tex`z=i`, { color: RED, font: 12, bold: true, dx: 15, dy: 10 }),
    labelAt([0, -1], tex`z=-i`, { color: RED, font: 12, bold: true, dx: 15, dy: -15 }),
    labelAt([-1.5, 1.5], 'Complex roots:\nconjugate pair\non imaginary axis',
      { font: 10, box: { facecolor: '#d5f5e3', alpha: 0.7 } }),
  );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Fundamental Theorem of Algebra: Degree n → Exactly n Complex Roots — x²+1 = 0 has the conjugate pair ±i',
  });
}

// ── 11. 편각의 덧셈 ──
function argumentAddition() {
  const z1 = cplx.polar(1.5, 30), z2 = cplx.polar(2, 50), prod = cplx.mul(z1, z2);
  return s2([-0.5, 4.5], [-0.5, 4.5], {
    axes: { x: { label: 'Real' }, y: { label: 'Imaginary' } }, grid: { alpha: 0.2 },
  }).title('Complex Multiplication = Multiply Moduli, Add Arguments').add(
    arrowAt([0, 0], z1, { color: RED, stroke: 3 }),
    labelAt([z1.re / 2 - 0.2, z1.im / 2 - 0.2], tex`z_1`, { color: RED, font: 12, bold: true }),
    arcAt([1, 0], z1, 0.6, { color: RED, stroke: 2 }),                        // θ₁
    labelAt([0.65, 0.2], tex`\theta_1`, { color: RED, font: 10 }),
    arrowAt([0, 0], z2, { color: BLUE, stroke: 3 }),
    labelAt([z2.re / 2 + 0.15, z2.im / 2 - 0.2], tex`z_2`, { color: BLUE, font: 12, bold: true }),
    arcAt(z1, z2, 0.85, { color: BLUE, stroke: 2 }),                          // θ₂
    labelAt([1.1, 1.1], tex`\theta_2`, { color: BLUE, font: 10 }),
    arrowAt([0, 0], prod, { color: PURPLE, stroke: 3.5 }),
    labelAt([prod.re / 2 - 0.3, prod.im / 2 + 0.2], tex`z_1 z_2`, { color: PURPLE, font: 12, bold: true }),
    arcAt([1, 0], prod, 1.15, { color: PURPLE, stroke: 2.5, dash: [5, 4] }),  // θ₁+θ₂
    labelAt([1.8, 1.6], tex`\theta_1+\theta_2`, { color: PURPLE, font: 10, bold: true }),
    labelAt([2.5, 0.5], 'Multiply moduli: r₁·r₂\nAdd arguments: θ₁+θ₂',
      { font: 11, box: { facecolor: '#e8daef', alpha: 0.8 } }),
  ).compile();
}

// ── 12. 복소평면 요약 ──
function complexPlaneSummary() {
  const z = cplx(2.5, 1.5), iz = cplx.mul(cplx(0, 1), z);      // i·z = 90° 회전
  return s2([-5, 5.5], [-5, 5], { grid: { alpha: 0.2 } })
    .title('The Complex Plane — All Geometric Operations at a Glance').add(
      circleAt([0, 0], 2, { color: GRAY, stroke: 1.5, dash: [5, 4], opacity: 0.3 }),
      arrowAt([0, 0], z, { color: RED, stroke: 2.5 }),
      labelAt(z, 'z = r·e^(iθ)\n(modulus, argument)', { color: RED, font: 9, dx: 10, dy: 10 }),
      arrowAt([0, 0], z.conj, { color: BLUE, stroke: 2, dash: [5, 4] }),
      labelAt(z.conj, tex`\bar{z}\text{ (reflection)}`, { color: BLUE, font: 9, dx: 10, dy: -15 }),
      arrowAt([0, 0], iz, { color: GREEN, stroke: 2, dash: [5, 4] }),
      labelAt(iz, 'iz (rotate 90°)', { color: GREEN, font: 9, dx: -25, dy: 10 }),
      labelAt([5, -0.3], 'ℝ (Real axis)', { font: 12, bold: true, anchor: 'middle' }),
      labelAt([-0.35, 4.5], 'iℝ\n(Imaginary\n axis)', { font: 10, bold: true, anchor: 'middle' }),
      // 사분면 이름 ← ax.text(±3, ±3, alpha=0.3)
      ...[[3, 3, 'I'], [-3, 3, 'II'], [-3, -3, 'III'], [3, -3, 'IV']]
        .map(([x, y, q]) => labelAt([x, y], q, { font: 14, bold: true, anchor: 'middle', opacity: 0.3 })),
    ).compile();
}

// ── run ─────────────────────────────────────────────────────────
//   figure 팩토리 목록 → SVG/PNG 저장 + index.html 갤러리.
//   (한 figure 가 실패해도 나머지는 계속 진행하고 마지막에 요약을 출력한다.)
const figs = [
  ['12a1-01-complex-plane-polar', complexPlanePolar, '복소평면 · 극형식'],
  ['12a1-02-i-powers-cycle', iPowersCycle, 'i 의 거듭제곱 = 90° 회전'],
  ['12a1-03-conjugate-reflection', conjugateReflection, '켤레 = 실축 반사'],
  ['12a1-04-complex-addition', complexAddition, '복소수 덧셈 = 벡터 덧셈'],
  ['12a1-05-complex-multiplication', complexMultiplication, '곱 = 회전 + 확대'],
  ['12a1-06-matrix-correspondence', matrixCorrespondence, 'a+bi ↔ 회전·확대 행렬'],
  ['12a1-07-demoivre-spiral', demoivreSpiral, '드무아브르: zⁿ 나선'],
  ['12a1-08-roots-unity-ngon', rootsOfUnityNgon, '1 의 n제곱근 = 정n각형'],
  ['12a1-09-reciprocal-geometry', reciprocalGeometry, '1/z = 반전 + 반사 (단계별 4컷)'],
  ['12a1-10-quadratic-complex-roots', quadraticComplexRoots, '이차방정식의 복소근'],
  ['12a1-11-argument-addition', argumentAddition, '편각의 덧셈'],
  ['12a1-12-complex-plane-summary', complexPlaneSummary, '복소평면 요약'],
];

await saveFigures(figs, {
  dir: OUT,
  index: true,
  title: 'logos · 12A1 — 복소수 (example4.py 재현)',
});
