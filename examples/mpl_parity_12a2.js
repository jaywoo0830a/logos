// examples/mpl_parity_12a2.js — example3.py (12A2 · 행렬과 벡터) 재현 — logos 만 사용
//
// ── 무엇을 하는가 ────────────────────────────────────────────────
//   matplotlib 로 그린 "행렬과 벡터" 교재 그림 20개(12A2 세션)를 logos DSL **만으로**
//   같은 구성으로 다시 그린다. 선형변환 · 행렬식 · 합성/역행렬 · 회전/반사/전단 ·
//   벡터 연산(합·크기·내적·정사영·외적) · 3D 행렬식(부피) · 연립방정식 ·
//   행렬의 거듭제곱 · 차원 축소(2D→1D, 3D→2D, nD 캐스케이드) · 격자 변형까지
//   12A2 세션 전 그림을 커버하는 **대표 예제 3** 이다.
//
// ── 실행 ────────────────────────────────────────────────────────
//   node examples/mpl_parity_12a2.js   →  output/parity12a2/*.svg + *.png + index.html
//   npm run parity12a2                 (동일)
//
// ── mpl 대응 규칙 (이 예제가 지키는 관례) ────────────────────────
//   · 행렬        `mat([[a,b],[c,d]])` (logos/linalg.js) ← np.array([[...]])
//                 `A.apply([1,0])` = A·[1,0] = **기저벡터의 상**(= A 의 1열)  ← A @ [1,0]
//                 `A.det` ← np.linalg.det, `A.inv` ← np.linalg.inv, `A.pow(k)` ← matrix_power
//   · 벡터        `vec.dot/norm/unit/project/angleDeg/cross/areaOf` ← np.dot, norm, cross …
//                 (np.append(a,0) 같은 차원 승격은 linalg.vec 가 알아서 한다)
//   · 단위정사각형  `UNIT` + `A.map(UNIT)` → `polygon(...)` ← ax.fill(...)
//   · 변화 화살표  `annotate.arrow(A, B).dash([6,4])` ← ax.arrow(..., linestyle='--')
//   · 각도 호      `annotate.angle({ from, vertex, to }).arc({ radius })` ← patches.Arc
//                 (위치 인자 형태 `annotate.angle(A, B, C)` 는 **가운데 B 가 꼭짓점** —
//                  순서를 헷갈리면 호가 엉뚱한 점에 그려지므로 이 예제는 이름 형태를 쓴다)
//   · 여러 패널    `subplots([...], { cols })` ← plt.subplots(rows, cols)
//   · 3D          `plot3d({ elev, azim })` + `axes3()` + `frame3()` ← projection='3d'+view_init
//                 3D 면은 `surfaceParam(...).solid(1,1)` ← Poly3DCollection
//   · 제목        `.title('…')` 은 **축 안쪽 상단**에 그려진다(mpl 은 축 바깥) →
//                 두 줄 제목은 y 눈금 라벨과 겹치므로 이 예제는 한 줄 제목을 쓴다.
//
// ── 공용 헬퍼 ───────────────────────────────────────────────────
//   kit.js     plot2d · plot3d · subplots · saveFigures · poly3 · palette
//   linalg.js  mat · vec   (행렬/벡터 수치 계산 — 그림이 아니라 계산 담당)
//
// ── figure 목록 ─────────────────────────────────────────────────
//    1 matrix-transformation-2d    단위정사각형 → 평행사변형 (1×2)
//    2 determinant-area-scaling    행렬식 = 넓이 배율 6종 (2×3)
//    3 matrix-multiplication       행렬곱 = 변환의 합성 (1×4)
//    4 inverse-matrix-geometry     역행렬 = 변환 되돌리기 (1×4)
//    5 rotation-matrix             회전행렬 R(θ) (단일)
//    6 reflection-matrix           반사행렬 3종 (1×3)
//    7 shear-matrix                전단행렬 (1×2)
//    8 vector-addition             벡터의 합 = 평행사변형 법칙 (단일)
//    9 vector-magnitude            벡터의 크기와 단위벡터 (단일)
//   10 dot-product-angle           내적 = |a||b|cos θ (단일)
//   11 vector-projection           정사영 (단일)
//   12 cross-product-3d            외적 ⊥ a, ⊥ b (3D 단일)
//   13 cross-product-area          |a×b| = 평행사변형 넓이 (단일)
//   14 determinant-volume-3d       행렬식 = 부피 배율 (3D 단일)
//   15 linear-system-geometric     연립방정식의 세 경우 (1×3)
//   16 matrix-powers-transform     행렬의 거듭제곱 = 반복 변환 (1×5)
//   17 2d-to-1d-projection        ℝ² → ℝ¹ 차원 축소 (1×2)
//   18 3d-to-2d-projection        ℝ³ → ℝ² 차원 축소 (1×2: 3D+2D)
//   19 dimensionality-cascade     nD → … → 2D → 1D → 스칼라 (2×2)
//   20 basis-transformation-grid  격자 변형 — 모든 점이 A(x,y) (1×2)
//
// ── 참고 ────────────────────────────────────────────────────────
//   · mpl 원본의 표기 오타/버그는 의도적으로 고쳤다(주석 `mpl 대비` 로 표시).
//   · 색은 mpl 원본이 쓴 색을 그대로 hex 로 고정 — 두 그림을 눈으로 비교할 수 있다.
//   · 난수 그림(17~19)은 np.random 과 **값이 같지는 않다**(난수 알고리즘이 다름).
//     대신 시드 고정 PRNG 로 매 실행 동일한 그림이 나온다.
import { join } from 'node:path';
import {
  point, polygon, line, segment, annotate, mat, vec, cmapColor,
  arrow3, curve3, surfaceParam, axes3, frame3, kit, transform,
} from '../index.js';

const OUT = join(import.meta.dirname, '..', 'output', 'parity12a2');


// ── 색 — mpl 원본이 쓴 hex 그대로 ────────────────────────────────
const TEAL = '#4ecdc4', TEAL_D = '#2c8c84';
const RED = '#e74c3c', RED_D = '#c0392b';
const BLUE = '#3498db', BLUE_D = '#2471a3';
const GREEN = '#27ae60', PURPLE = '#8e44ad';
const ORANGE = '#f39c12', ORANGE_D = '#d68910';
const VIOLET = '#9b59b6', VIOLET_D = '#7d3c98';
const CHOC = '#e67e22';                       // 진한 주황(수직 성분)
const GRAY_L = '#bdc3c7', GRAY = '#95a5a6';   // 원본 도형(점선), 보조선
const MIRROR = '#008000';                     // 반사 거울선
const { plot2d, plot3d, subplots, saveFigures, poly3, palette } = kit;
const { black: INK } = palette;

// ── 미세 헬퍼 (전부 라이브러리 API 위의 얇은 별칭) ──────────────
/** `[x,y]` → point */
const P = (v) => point(v[0], v[1]);
/** 꼭짓점 배열 → 하나의 다각형 */
const polyOf = (pts, { fill, color, stroke = 2, dash, opacity } = {}) => {
  let g = polygon(...pts.map(P));
  if (fill !== undefined) g = g.fill(fill);
  if (color !== undefined) g = g.color(color);
  if (stroke !== undefined) g = g.stroke(stroke);
  if (dash !== undefined) g = g.dash(dash);
  if (opacity !== undefined) g = g.opacity(opacity);
  return g;
};
/** 단위정사각형 꼭짓점 (0,0)-(1,1) */
const UNIT = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** 꼭짓점 마커들 ← ax.plot(..., 'o-') 의 o */
const dotsAt = (pts, color, size = 5) => pts.map((v) => P(v).marker('circle').color(color).size(size));
/** 화살표 단축 ← ax.arrow / ax.quiver(2D) */
const arrowAt = (from, to, { color, stroke = 2, dash, opacity, label } = {}) => {
  let a = annotate.arrow(P(from), P(to));
  if (color !== undefined) a = a.color(color);
  if (stroke !== undefined) a = a.stroke(stroke);
  if (dash !== undefined) a = a.dash(dash);
  if (opacity !== undefined) a = a.opacity(opacity);
  if (label !== undefined) a = a.label(label);
  return a;
};
/** 색 있는 텍스트 ← ax.text / ax.annotate */
const labelAt = (at, text, { color, font = 11, bold = false, anchor, box } = {}) => {
  let t = annotate.text(Array.isArray(at) ? P(at) : at).label(text).font(font);
  if (color !== undefined) t = t.color(color);
  if (bold) t = t.bold();
  if (anchor) t = t.anchor(anchor);
  if (box) t = t.box(box);
  return t;
};
/** 2D 서브패널 프리셋 — equal + axes + grid (3D 와 섞이는 그리드가 있으므로 셀 크기를 맞춘다) */
const PCELL3 = [480, 440];
const s2 = (xr, yr, o = {}) => plot2d(xr, yr, { size: PCELL3, equal: true, ...o });
/** 시드 고정 PRNG (mulberry32) — np.random.seed 대응(값은 동일하지 않음) */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** 표준정규 난수 묶음 (Box–Muller) — `np.random.randn(n, d) * scale + shift` 대응 */
function normalPts(seed, n, scale, shift) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) {
    const u = Math.max(r(), 1e-12), v = r();
    const m = Math.sqrt(-2 * Math.log(u));
    out.push(scale.map((s, k) => (k % 2 === 0 ? Math.cos(2 * Math.PI * v) : Math.sin(2 * Math.PI * v)) * m * s + shift[k]));
  }
  return out;
}

// ── 1. 행렬 = 선형변환: 단위정사각형 → 평행사변형 (1×2) ──
function matrixTransformation2d() {
  const A = mat([[2, 1], [0.5, 1.5]]);
  const left = s2([-0.5, 2.0], [-0.5, 2.0]).title('Unit Square (Before)').add(
    polyOf(UNIT, { fill: TEAL, color: TEAL_D, stroke: 2, opacity: 0.4 }),
    ...dotsAt(UNIT, TEAL_D),
    arrowAt([0, 0], [1, 0], { color: RED, stroke: 2.5 }),
    arrowAt([0, 0], [0, 1], { color: BLUE, stroke: 2.5 }),
    labelAt([0.5, -0.18], 'e₁', { color: RED, font: 12, bold: true, anchor: 'middle' }),
    labelAt([-0.22, 0.5], 'e₂', { color: BLUE, font: 12, bold: true }),
    labelAt([0, 0], '(0,0)', { color: '#555', font: 9 }).offset(-22, 14),
    labelAt([1, 0], '(1,0)', { color: '#555', font: 9 }).offset(5, 14),
    labelAt([1, 1], '(1,1)', { color: '#555', font: 9 }).offset(5, 5),
    labelAt([0, 1], '(0,1)', { color: '#555', font: 9 }).offset(-24, 5),
  );
  const e1 = A.apply([1, 0]), e2 = A.apply([0, 1]);
  const quad = A.map(UNIT);
  const right = s2([-0.5, 4.0], [-0.5, 3.5])
    .title(`Parallelogram (After A), det=${A.det.toFixed(1)}`).add(
      polyOf(quad, { fill: RED, color: RED_D, stroke: 2.5, opacity: 0.35 }),
      ...dotsAt(quad, RED_D),
      arrowAt([0, 0], e1, { color: RED, stroke: 2.5 }),
      arrowAt([0, 0], e2, { color: BLUE, stroke: 2.5 }),
      labelAt([e1[0] / 2 - 0.1, e1[1] / 2 - 0.2], 'Ae₁', { color: RED, font: 11, bold: true }),
      labelAt([e2[0] / 2 - 0.3, e2[1] / 2], 'Ae₂', { color: BLUE, font: 11, bold: true }),
      labelAt(e1, `(${e1[0].toFixed(1)},${e1[1].toFixed(1)})`, { font: 9 }).offset(6, -6),
      labelAt(e2, `(${e2[0].toFixed(1)},${e2[1].toFixed(1)})`, { font: 9 }).offset(6, -6),
    );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Matrix as Linear Transformation: Columns = Images of Basis Vectors',
  });
}

// ── 2. 행렬식 = 넓이 배율 (2×3) ──
function determinantAreaScaling() {
  const cases = [
    [mat([[1, 0], [0, 1]]), 'I: det=1', 'Identical'],
    [mat([[3, 0], [0, 2]]), 'diag(3,2): det=6', 'Stretch'],
    [mat([[0, -1], [1, 0]]), 'Rot 90°: det=1', 'Rotation'],
    [mat([[1, 0.8], [0, 1]]), 'Shear: det=1', 'Shear'],
    [mat([[1, 0], [0, -1]]), 'Reflect y: det=-1', 'Reflection'],
    [mat([[2, 3], [4, 6]]), 'Singular: det=0', 'Collapse'],
  ];
  const list = cases.map(([A, head, name]) => {
    const d = A.det, quad = A.map(UNIT);
    // mpl 대비: ① 특이행렬(|det|<0.01) 패널에서 set_title 을 건너뛰어 제목이 사라지던 버그를 고쳐 6개 모두 제목을 단다.
    //           ② 원본은 두 줄 제목인데, logos 의 제목은 축 안쪽 상단에 그려져 y 눈금과 겹치므로 한 줄로 합쳤다.
    const shapes = [
      polyOf(UNIT, { fill: GRAY_L, color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.3 }),
      polyOf(quad, { fill: RED, color: RED_D, stroke: 2, opacity: Math.abs(d) > 0.01 ? 0.5 : 0.2 }),
      ...dotsAt(quad, RED_D, 4),
    ];
    if (Math.abs(d) > 0.01) {
      shapes.push(
        arrowAt([0, 0], A.col(0), { color: RED, stroke: 1.8 }),
        arrowAt([0, 0], A.col(1), { color: BLUE, stroke: 1.8 }),
      );
    }
    return s2([-3, 5], [-3, 5]).title(`${head} — ${name} (|det|=${Math.abs(d).toFixed(0)})`).add(...shapes);
  });
  return subplots(list, {
    cols: 3, tight: true,
    title: 'Determinant = Area Scaling: 6 Types of 2×2 Transformations',
  });
}

// ── 3. 행렬곱 = 변환의 합성 (1×4) ──
function matrixMultiplication() {
  const A = mat.rotation(90);      // 회전 90°
  const B = mat.shear(1, 0);       // 가로 전단
  const steps = [
    [mat.identity(2), 'Start (Unit Square)'],
    [B, 'Step 1: Apply B (Shear)'],
    [A, 'Step 2: Apply A (Rotate)'],
    [A.mul(B), 'Result: AB (Shear then Rotate)'],
  ];
  const list = steps.map(([M, title], i) => {
    const shapes = i === 0
      ? [polyOf(UNIT, { fill: BLUE, color: BLUE_D, stroke: 2, opacity: 0.4 })]
      : [
        polyOf(UNIT, { fill: GRAY_L, color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.2 }),
        polyOf(M.map(UNIT), { fill: RED, color: RED_D, stroke: 2, opacity: 0.45 }),
      ];
    shapes.push(
      arrowAt([0, 0], M.col(0), { color: RED, stroke: 2 }),
      arrowAt([0, 0], M.col(1), { color: BLUE, stroke: 2 }),
    );
    return s2([-2, 3], [-2, 3]).title(title).add(...shapes);
  });
  // mpl 대비: 원본은 마지막 패널에 fig 제목을 덮어써 4번째 패널 제목이 사라졌다(버그). 여기선 그림(suptitle) 제목으로.
  return subplots(list, {
    cols: 4, tight: true,
    title: 'Matrix Multiplication = Composition of Transformations',
  });
}

// ── 4. 역행렬 = 변환 되돌리기 (1×4) ──
function inverseMatrixGeometry() {
  const A = mat([[2, 1], [1, 3]]);
  const steps = [
    [mat.identity(2), 'Start: Unit Square', BLUE],
    [A, 'Apply A (Stretch+Shear)', RED],
    [A.inv, 'Apply A⁻¹ (Reverse)', GREEN],
    [A.inv.mul(A), 'A⁻¹A = I (Back to Square)', PURPLE],
  ];
  const list = steps.map(([M, title, color]) => {
    const quad = M.map(UNIT);
    return s2([-1, 4], [-1, 4]).title(title).add(
      polyOf(UNIT, { fill: GRAY_L, color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.15 }),
      polyOf(quad, { fill: color, color, stroke: 2, opacity: 0.4 }),
      ...dotsAt(quad, color, 4),
      arrowAt([0, 0], M.col(0), { color: RED, stroke: 1.8 }),
      arrowAt([0, 0], M.col(1), { color: BLUE, stroke: 1.8 }),
    );
  });
  return subplots(list, {
    cols: 4, tight: true,
    title: 'Inverse Matrix: Undoing a Transformation — A⁻¹(A(□)) = □',
  });
}

// ── 5. 회전행렬 R(θ) (단일) ──
function rotationMatrix() {
  const v0 = [2, 0.5];
  const thetas = [0, 30, 60, 90, 120];
  const shapes = [];
  thetas.forEach((th, i) => {
    // mpl: plt.cm.viridis(np.linspace(0.2, 0.9, 5)) → cmapColor 로 같은 위치의 색을 뽑는다
    const c = cmapColor('viridis', 0.2 + (0.7 * i) / (thetas.length - 1));
    const vR = mat.rotation(th).apply(v0);
    shapes.push(
      // 라벨을 달면 범례 항목이 된다(선 위에는 글자를 그리지 않는다 — mpl 의 label= 와 동일).
      segment(P([0, 0]), P(vR)).color(c).stroke(i === 0 ? 3 : 2)
        .label(i === 0 ? `Original v = (${v0[0]}, ${v0[1]})` : `${th}°`),
      P(vR).marker('circle').color(c).size(i === 0 ? 8 : 6),
      // mpl: Arc((0,0), 2|v0|, 2|v0|, theta1=∠v0, theta2=∠vR) — 꼭짓점은 원점
      annotate.angle({ from: v0, vertex: [0, 0], to: vR }).arc({ radius: vec.norm(v0) })
        .color(c).stroke(1.5).dash([4, 3]),
    );
  });
  return s2([-3, 3], [-3, 3]).title('Rotation Matrix R(θ): Preserves Length, Changes Direction')
    .legend('lower left').add(...shapes).compile();
}

// ── 6. 반사행렬 3종 (1×3) ──
function reflectionMatrix() {
  const v0 = [2, 1.5];
  const cases = [
    [mat.reflection('x'), 'Reflect across x-axis', 'Rx = [[1,0],[0,-1]]', 'h'],
    [mat.reflection('y'), 'Reflect across y-axis', 'Ry = [[-1,0],[0,1]]', 'v'],
    [mat.reflection('yx'), 'Reflect across y=x', 'R(y=x) = [[0,1],[1,0]]', 'd'],
  ];
  const mirrorOf = (k) => (k === 'h' ? line.horizontal(0) : k === 'v' ? line.vertical(0) : line.slopeIntercept(1, 0));
  const list = cases.map(([A, title, formula, kind]) => {
    const quad = A.map(UNIT), vR = A.apply(v0);
    return s2([-3.5, 3.5], [-3.5, 3.5]).title(title).add(
      // 수식은 제목 대신 그림 안쪽 라벨로 — 제목은 축 안쪽 상단이라 눈금과 겹치기 쉽다.
      labelAt([-3.2, -3.25], formula, { font: 11, color: VIOLET_D, box: { facecolor: '#ffffff', alpha: 0.8 } }),
      polyOf(UNIT, { fill: GRAY_L, color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.2 }),
      polyOf(quad, { fill: VIOLET, color: VIOLET_D, stroke: 2, opacity: 0.35 }),
      mirrorOf(kind).color(MIRROR).stroke(1.5).dash([2, 3]).opacity(0.7),
      arrowAt([0, 0], v0, { color: GRAY, stroke: 2, dash: [6, 4], opacity: 0.6 }),
      arrowAt([0, 0], vR, { color: RED, stroke: 2.5 }),
    );
  });
  return subplots(list, { cols: 3, tight: true, title: 'Reflection Matrices: Mirroring Space Across Lines' });
}

// ── 7. 전단행렬 (1×2) ──
function shearMatrix() {
  const cases = [
    [mat([[1, 1.5], [0, 1]]), 'Horizontal Shear — Sx = [[1,k],[0,1]]'],
    [mat([[1, 0], [1.5, 1]]), 'Vertical Shear — Sy = [[1,0],[k,1]]'],
  ];
  const list = cases.map(([S, title]) => {
    const quad = S.map(UNIT);
    return s2([-0.5, 4], [-0.5, 4]).title(title).add(
      polyOf(UNIT, { fill: GRAY_L, color: GRAY, stroke: 1, dash: [5, 4], opacity: 0.2 }),
      polyOf(quad, { fill: ORANGE, color: ORANGE_D, stroke: 2, opacity: 0.4 }),
      ...dotsAt(quad, ORANGE_D, 4),
      arrowAt([0, 0], S.col(0), { color: RED, stroke: 2 }),
      arrowAt([0, 0], S.col(1), { color: BLUE, stroke: 2 }),
    );
  });
  return subplots(list, {
    cols: 2, tight: true,
    title: 'Shear Matrices: Tilting Space — Area Preserved (det=1)',
  });
}

// ── 8. 벡터의 합 = 평행사변형 법칙 (단일) ──
function vectorAddition() {
  const a = [3, 1], b = [1, 2.5], c = vec.add(a, b);
  return s2([-0.5, 5], [-0.5, 4.5]).title('Vector Addition: Tip-to-Tail (Parallelogram Law)').add(
    arrowAt([0, 0], a, { color: RED, stroke: 3 }),
    arrowAt([0, 0], b, { color: BLUE, stroke: 3 }),
    // 평행사변형 나머지 두 변(tip-to-tail)
    arrowAt(a, c, { color: BLUE, stroke: 2, dash: [6, 4], opacity: 0.6 }),
    arrowAt(b, c, { color: RED, stroke: 2, dash: [6, 4], opacity: 0.6 }),
    arrowAt([0, 0], c, { color: GREEN, stroke: 3.5 }),
    segment(P(a), P(c)).color(BLUE).stroke(1.5).dash([5, 4]).opacity(0.4),
    segment(P(b), P(c)).color(RED).stroke(1.5).dash([5, 4]).opacity(0.4),
    labelAt([1.3, 0.2], 'a', { color: RED, font: 13, bold: true }),
    labelAt([0.1, 1.2], 'b', { color: BLUE, font: 13, bold: true }),
    labelAt([2.1, 2.0], 'a+b', { color: GREEN, font: 13, bold: true }),
  ).compile();
}

// ── 9. 벡터의 크기와 단위벡터 (단일) ──
function vectorMagnitude() {
  const v = [3, 4], mag = vec.norm(v), u = vec.unit(v);
  return s2([-0.5, 4.5], [-0.5, 5]).title('Vector Magnitude: Pythagorean Theorem in Components').add(
    arrowAt([0, 0], v, { color: RED, stroke: 3 }),
    arrowAt([0, 0], u, { color: GREEN, stroke: 3 }),
    // 축으로 내린 수선(점선)
    segment(P([v[0], 0]), P(v)).color(GRAY).stroke(1).dash([5, 4]).opacity(0.5),
    segment(P([0, v[1]]), P(v)).color(GRAY).stroke(1).dash([5, 4]).opacity(0.5),
    // (3,0) 의 직각 표시 — mpl 의 작은 ㄱ 자 두 선
    segment(P([v[0] - 0.2, 0]), P([v[0], 0])).color(INK).stroke(1),
    segment(P([v[0] - 0.2, 0]), P([v[0] - 0.2, 0.2])).color(INK).stroke(1),
    labelAt([1.3, 2.2], `|v| = ${mag}`, { color: RED, font: 12, bold: true }),
    labelAt([u[0] / 2 + 0.15, u[1] / 2 - 0.3], 'û (unit)', { color: GREEN, font: 11, bold: true }),
    labelAt([v[0] + 0.1, v[1] / 2], `v₂=${v[1]}`, { color: GRAY, font: 10 }),
    labelAt([v[0] / 2, -0.25], `v₁=${v[0]}`, { color: GRAY, font: 10 }),
    labelAt([1.5, 3.5], `|v| = √(${v[0]}²+${v[1]}²)\n     = √${v[0] ** 2 + v[1] ** 2}\n     = ${mag}`,
      { font: 11, box: { facecolor: '#fff9c4', alpha: 0.8 } }),
  ).compile();
}

// ── 10. 내적 = |a||b|cos θ (단일) ──
function dotProductAngle() {
  const a = [3, 1], b = [1, 3];
  const dot = vec.dot(a, b), magA = vec.norm(a), magB = vec.norm(b);
  const cosT = dot / (magA * magB), theta = vec.angleDeg(a, b);
  // mpl: perp = [-a₁, a₀]/|a| · |a| · 0.5 = a 에 수직인 길이 |a|/2 벡터
  const perp = vec.scale(vec.unit([-a[1], a[0]]), magA * 0.5);
  return s2([-0.5, 4], [-0.5, 4]).title('Dot Product = |a||b|cos θ — Measures Angle').add(
    arrowAt([0, 0], a, { color: RED, stroke: 3 }),
    arrowAt([0, 0], b, { color: BLUE, stroke: 3 }),
    // 두 벡터 사이의 각 호 ← patches.Arc(diameter 1.2). 꼭짓점은 원점(이름으로 지정).
    annotate.angle({ from: a, vertex: [0, 0], to: b }).arc({ radius: 0.6 }).color(PURPLE).stroke(2.5),
    labelAt([0.55, 0.55], `θ≈${theta.toFixed(1)}°`, { color: PURPLE, font: 11, bold: true }),
    arrowAt([0, 0], perp, { color: GRAY, stroke: 1.5, dash: [3, 3], opacity: 0.5 }),
    labelAt([perp[0] / 2 - 0.3, perp[1] / 2], '⊥ to a', { color: GRAY, font: 9 }),
    labelAt([1.2, 0.1], 'a', { color: RED, font: 13, bold: true }),
    labelAt([0.6, 1.6], 'b', { color: BLUE, font: 13, bold: true }),
    labelAt([1.8, 2.9],
      `a·b = ${dot}\n|a|=${magA.toFixed(2)}, |b|=${magB.toFixed(2)}\ncos θ = ${dot}/${magA.toFixed(2)}·${magB.toFixed(2)} = ${cosT.toFixed(3)}`,
      { font: 10, box: { facecolor: '#e8daef', alpha: 0.8 } }),
  ).compile();
}

// ── 11. 정사영 (단일) ──
function vectorProjection() {
  const a = [4, 2], b = [2, 0.5];
  const proj = vec.project(a, b), perp = vec.reject(a, b);
  const beyond = vec.add(proj, vec.unit(b));       // 정사영 끝에서 b 방향으로 1 만큼 (직각 표시용)
  return s2([-0.5, 5], [-0.5, 3.5]).title('Vector Projection: Shadow of a onto b').add(
    // mpl 대비: 정사영 발(foot)이 b 화살표 끝보다 멀리 있다(|b|≈2.06 < |proj|≈4.37).
    // 그래서 b 선은 발 너머로 이어지지 않고, mpl 원본의 직각 표식은 두 선 사이가 아니라
    // **빈 공간에 떠 있는** 것처럼 보인다(교과서 그림은 이때 b 의 연장선을 함께 그린다).
    // b 의 연장선을 가장 먼저(다른 도형 아래에) 그어 발 너머 구간만 보이게 하고,
    // 발을 '두 선이 만나는 모서리'로 만든다.
    segment(P(b), P(vec.add(proj, vec.scale(vec.unit(b), 0.45)))).color(BLUE).stroke(1).dash([3, 3]).opacity(0.5),
    arrowAt([0, 0], a, { color: RED, stroke: 3 }),
    arrowAt([0, 0], b, { color: BLUE, stroke: 2.5 }),
    arrowAt([0, 0], proj, { color: GREEN, stroke: 3 }),
    segment(P(proj), P(a)).color(CHOC).stroke(2).dash([6, 4]),
    arrowAt(proj, vec.add(proj, perp), { color: CHOC, stroke: 2 }),
    // 직각 표식은 발(proj)에서 수직성분(proj→a)과 b 선(연장선) 사이 — 두 선이 모두 그려진 안쪽.
    annotate.angle({ from: a, vertex: proj, to: beyond }).arc({ radius: 0.35 }).rightAngle().color(INK).stroke(1.2),
    labelAt([2.1, 1.2], 'a', { color: RED, font: 13, bold: true }),
    labelAt([0.8, 0.55], 'b', { color: BLUE, font: 13, bold: true }),
    labelAt([proj[0] / 2 - 0.3, proj[1] / 2 - 0.3], 'proj', { color: GREEN, font: 11, bold: true }),
    labelAt([2.2, 1.75], '⊥ comp', { color: CHOC, font: 10 }),
    labelAt([2, 3], `proj_b a = (a·b/|b|²)·b\n        = (${vec.dot(a, b).toFixed(1)}/${vec.dot(b, b).toFixed(2)})·b`,
      { font: 10, box: { facecolor: '#d5f5e3', alpha: 0.8 } }),
  ).compile();
}

// ── 12. 외적 ⊥ a, ⊥ b (3D 단일) ──
function crossProduct3d() {
  const a = [1, 0, 0], b = [0, 1, 0], c = vec.cross(a, b);
  // mpl 대비: 3D 에서는 범례 대신 화살표 옆 라벨로 값을 보여준다.
  // (3D 범례는 축 라벨 x/y/z 와 섞여 읽기 어렵고, mpl 의 loc='upper left' 상자는 그림을 크게 가린다.)
  return plot3d({ elev: 25, azim: -55 }).title('Cross Product: a×b ⊥ a and ⊥ b (Right-Hand Rule)').add(
    // 평행사변형 면 ← Poly3DCollection([verts], alpha=0.3)
    surfaceParam((u, v) => [u, v, 0]).on([0, 1], [0, 1]).solid(1, 1).color(GRAY_L).opacity(0.3),
    ...axes3({ length: 1.5, color: GRAY, width: 1, labels: ['X', 'Y', 'Z'] }),
    arrow3([0, 0, 0], a).color(RED).stroke(3).label('a=(1,0,0)'),
    arrow3([0, 0, 0], b).color(BLUE).stroke(3).label('b=(0,1,0)'),
    arrow3([0, 0, 0], c).color(GREEN).stroke(3.5).label('a×b=(0,0,1)'),
    frame3([-0.2, 1.5], [-0.2, 1.5], [-0.2, 1.5]),
    // 라벨이 a×b 화살표 라벨과 겹치지 않도록 살짝 오른쪽 위로 (mpl 은 (0,0,1.2))
    annotate.text(point(0.45, 0.3, 1.25)).label('R.H. Rule:\nThumb = a×b').color(GREEN).font(10).bold(),
  ).compile();
}

// ── 13. |a×b| = 평행사변형 넓이 (단일) ──
function crossProductArea() {
  const a = [3, 1], b = [1, 2.5];
  const area = vec.areaOf(a, b);
  const base = vec.norm(b), h = area / base;       // mpl: h = |a| sin θ (= |a×b|/|b|)
  const verts = [[0, 0], a, vec.add(a, b), b];
  return s2([-0.5, 5], [-0.5, 4.5])
    .title('|a×b| = Parallelogram Area (in 2D, as scalar in z-direction)').add(
      polyOf(verts, { fill: BLUE, color: BLUE_D, stroke: 2, opacity: 0.25 }),
      arrowAt([0, 0], a, { color: RED, stroke: 2.5 }),
      arrowAt([0, 0], b, { color: BLUE, stroke: 2.5 }),
      segment(P(a), P(vec.add(a, b))).color(BLUE).stroke(1.5).dash([5, 4]).opacity(0.5),
      segment(P(b), P(vec.add(a, b))).color(RED).stroke(1.5).dash([5, 4]).opacity(0.5),
      labelAt([1.3, 0.1], 'a', { color: RED, font: 13, bold: true }),
      labelAt([0.1, 1.2], 'b', { color: BLUE, font: 13, bold: true }),
      labelAt([2, 3], `Area = |a||b|sin θ = |a×b|\n     = ${base.toFixed(2)} × ${h.toFixed(2)}\n     = ${area.toFixed(2)}`,
        { font: 11, box: { facecolor: '#d6eaf8', alpha: 0.8 } }),
    ).compile();
}

// ── 14. 행렬식 = 부피 배율 (3D 단일) ──
function determinantVolume3d() {
  const A = mat([[2, 0.5, 0.3], [0.2, 1.8, 0.3], [0.2, 0.1, 1.5]]);
  const cube = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]];
  const t = A.map(cube);
  // 평행육면체의 각 면 = v0 + s·u + t·w 인 이중선형 패치 1장 ← Poly3DCollection([face], alpha=0.3)
  const facePatch = ([i, j, k, l]) => {
    const o = t[i], u = vec.sub(t[j], t[i]), w = vec.sub(t[l], t[i]);
    return surfaceParam((s, tt) => vec.add(o, vec.add(vec.scale(u, s), vec.scale(w, tt))))
      .on([0, 1], [0, 1]).solid(1, 1).color(RED).opacity(0.3);
  };
  const cols = [RED, BLUE, GREEN];
  return plot3d({ elev: 20, azim: -50 })
    .title(`3D Determinant = Volume Scale Factor\nUnit Cube → Parallelepiped, det = ${A.det.toFixed(2)}`).add(
      // 단위정육면체(점선) ← ax.plot(..., '--')
      ...edges.map(([i, j]) => poly3([cube[i], cube[j]], { color: GRAY, stroke: 1, dash: [5, 4] }).opacity(0.4)),
      ...faces.map(facePatch),
      ...axes3({ length: 3, color: GRAY, width: 1, labels: ['X', 'Y', 'Z'] }),
      ...[0, 1, 2].map((j) => arrow3([0, 0, 0], A.col(j)).color(cols[j]).stroke(3)),
      frame3([-0.3, 3], [-0.3, 3], [-0.3, 3]),
    ).compile();
}

// ── 15. 연립방정식의 세 가지 기하학적 경우 (1×3) ──
function linearSystemGeometric() {
  const list = [
    // 범례는 제목과 겹치지 않는 좌하단에 둔다(mpl 의 loc='best' 와 같은 자리).
    s2([-1, 4], [-1, 4]).title('Unique Solution\n(Intersection)').legend('lower left').add(
      line.slopeIntercept(-2 / 3, 5 / 3).color(BLUE).stroke(2).label('2x+3y=5'),
      line.slopeIntercept(-1 / 4, 6 / 4).color(RED).stroke(2).label('x+4y=6'),
      P([0.4, 1.4]).marker('circle').color(INK).size(9),
      labelAt([0.4, 1.4], '(0.4, 1.4)', { font: 10, bold: true }).offset(10, 6),
    ),
    s2([-1, 6], [-1, 5]).title('No Solution\n(Parallel Lines)').legend('lower left').add(
      line.slopeIntercept(-2 / 3, 5 / 3).color(BLUE).stroke(2).label('2x+3y=5'),
      line.slopeIntercept(-2 / 3, 10 / 3).color(RED).stroke(2).dash([6, 4]).label('2x+3y=10'),
    ),
    s2([-1, 4], [-1, 4]).title('Infinite Solutions\n(Same Line)').legend('lower left').add(
      line.slopeIntercept(-2 / 3, 5 / 3).color(BLUE).stroke(2).label('2x+3y=5'),
      line.slopeIntercept(-4 / 6, 10 / 6).color(RED).stroke(3).dash([6, 4]).opacity(0.5).label('4x+6y=10'),
    ),
  ];
  return subplots(list, {
    cols: 3, tight: true,
    title: 'Linear System Ax = b: Three Geometric Possibilities',
  });
}

// ── 16. 행렬의 거듭제곱 = 반복 변환 (1×5) ──
function matrixPowersTransform() {
  const A = mat.rotation(90);            // 90° 회전
  const v0 = [2, 0.5];
  const list = [0, 1, 2, 3, 4].map((k) => {
    const Ak = A.pow(k);
    const quad = Ak.map(UNIT), vk = Ak.apply(v0);
    return s2([-3, 3], [-3, 3])
      .title(k === 0 ? 'A⁰ = I (Start)' : `A${k} (Rot ${k}×90°=${k * 90}°)`).add(
        polyOf(quad, { fill: RED, color: RED_D, stroke: 2, opacity: 0.35 }),
        arrowAt([0, 0], vk, { color: PURPLE, stroke: 2.5 }),
        labelAt([vk[0] / 2 - 0.1, vk[1] / 2 - 0.2], `v${k}`, { color: PURPLE, font: 10, bold: true }),
      );
  });
  // mpl 대비: 원본은 네 패널에 fig 제목을 덮어써 마지막 제목이 사라졌다(버그). 여기선 그림 제목으로.
  return subplots(list, {
    cols: 5, tight: true,
    title: 'Matrix Powers = Repeated Transformations: A = Rot 90° → A⁴ = I',
  });
}

// ── 17. ℝ² → ℝ¹ 차원 축소 (1×2) ──
function projection2dTo1d() {
  // mpl: np.random.seed(42); randn(15,2) * [2,1] + [1,1]  (값은 알고리즘이 달라 동일하지 않음)
  const pts = normalPts(42, 15, [2, 1], [1, 1]);
  const left = s2([-5, 5], [-3, 5]).title('2D Point Cloud\n(15 points in R²)').add(
    ...pts.map((p, i) => P(p).marker('circle').color(BLUE).size(6)),
    ...pts.map((p, i) => labelAt(p, `p${i + 1}`, { font: 8 }).offset(4, -10)),
    arrowAt([-5, 0], [5, 0], { color: RED, stroke: 2 }),
    labelAt([4.5, 0.3], 'projection\ndirection', { color: RED, font: 9, anchor: 'middle' }),
  );
  // 오른쪽: x 축으로 정사영한 1D 그림 — mpl 은 y 눈금을 숨긴다(`set_yticks([])`).
  // logos: `axes({ y: { ticks: false } })` 로 동일하게 끌 수 있다(y 축 선은 남는다).
  const right = plot2d([-6, 6], [-1, 1], {
    size: PCELL3,
    axes: { x: { label: 'Projected coordinate (1D)' }, y: { label: false, ticks: false } },
  }).grid({ alpha: 0.3 }).title('1D Projection (onto x-axis)\nℝ² → ℝ¹ via 1×2 matrix [1 0]').add(
      ...pts.map((p, i) => P([p[0], 0]).marker('circle').color(RED).size(6)),
      ...pts.map((p, i) => labelAt([p[0], 0], `p${i + 1}`, { font: 8 }).offset(4, 12)),
      arrowAt([-6, 0], [6, 0], { color: INK, stroke: 1.5 }),
    );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Dimensionality Reduction: 2D → 1D Projection Matrix',
  });
}

// ── 18. ℝ³ → ℝ² 차원 축소 (1×2: 3D + 2D) ──
function projection3dTo2d() {
  // mpl: np.random.seed(123); randn(12,3) * [1.5,1.5,0.8] + 0.5
  const pts = normalPts(123, 12, [1.5, 1.5, 0.8], [0.5, 0.5, 0.5]);
  const left = plot3d({ elev: 20, azim: -60 }).title('3D Point Cloud (ℝ³)').add(
    ...axes3({ length: 5, color: GRAY, width: 1, labels: ['X', 'Y', 'Z'] }),
    ...pts.map((p) => point(...p).marker('circle').color(BLUE).size(6)),
    ...pts.map((p, i) => annotate.text(point(...p)).label(`p${i + 1}`).font(8)),
  );
  const right = s2([-5, 5], [-5, 5])
    .title('2D Projection (drop z-coordinate)\nℝ³ → ℝ² via 2×3 matrix')
    .xlabel('X').ylabel('Y').add(
      ...pts.map((p) => P([p[0], p[1]]).marker('circle').color(RED).size(6)),
      ...pts.map((p, i) => labelAt([p[0], p[1]], `p${i + 1}`, { font: 8 }).offset(4, 4)),
    );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Dimensionality Reduction: 3D → 2D Projection (PCA-like)',
  });
}

// ── 19. 차원 축소 캐스케이드 nD → … → 1D → 스칼라 (2×2) ──
function dimensionalityCascade() {
  // (0,0) ℝ⁴ → ℝ³ : 4D 점 8개(시드 777)의 앞 세 좌표만 그린다
  const pts4 = normalPts(777, 8, [1.5, 1.5, 1, 0.5], [0.5, 0.5, 0, 0]);
  const cell3d = plot3d({ elev: 20, azim: -50 }).title('ℝ⁴ → ℝ³\n(Drop 4th dim)').add(
    ...axes3({ length: 5, color: GRAY, width: 1, labels: ['x₁', 'x₂', 'x₃'] }),
    ...pts4.map((p) => point(p[0], p[1], p[2]).marker('circle').color(VIOLET).size(6)),
  );
  // (0,1) ℝ³ → ℝ²
  const pts3 = normalPts(778, 10, [1.5, 1.5, 0.8], [0.3, 0.3, 0.2]);
  const cell3to2 = s2([-5, 3], [-4, 3]).title('ℝ³ → ℝ²\n(Drop z)').xlabel('x').ylabel('y').add(
    ...pts3.map((p) => P([p[0], p[1]]).marker('circle').color(BLUE).size(6)),
  );
  // (1,0) ℝ² → ℝ¹ : x 축으로 정사영
  const pts2 = normalPts(779, 10, [2, 1], [1, 0.5]);
  const proj1d = pts2.map((p) => p[0]);
  const cell2to1 = plot2d([-5, 6], [-1, 1], {
    size: PCELL3, grid: { alpha: 0.3 },
    axes: { x: { label: 'Projected coordinate' }, y: { label: false, ticks: false } },
  }).title('ℝ² → ℝ¹\n(Project onto line)')
    .add(...proj1d.map((x) => P([x, 0]).marker('circle').color(CHOC).size(6)));
  // (1,1) ℝ¹ → 스칼라 : 평균
  const mean = proj1d.reduce((s, v) => s + v, 0) / proj1d.length;
  const cell1toScalar = plot2d([-1, 1], [-3, 3], {
    size: PCELL3, grid: { alpha: 0.3 },
    axes: { x: { label: false, ticks: false }, y: { label: false, ticks: false } },
  }).title('ℝ¹ → Scalar\n(Summary statistic)').add(
    P([0, mean]).marker('circle').color(RED).size(14),
    line.horizontal(mean).color(RED).stroke(2).opacity(0.5),
    labelAt([0, mean], `Mean = ${mean.toFixed(2)}`, { color: RED, font: 11, bold: true }).offset(-60, -10),
  );
  return subplots([cell3d, cell3to2, cell2to1, cell1toScalar], {
    cols: 2, tight: true,
    // mpl 대비: 원본은 두 줄 제목 + 부제를 썼지만, logos 의 그림 제목은 한 줄 높이(34px)라 한 줄로 합쳤다.
    title: 'Dimensionality Reduction Cascade: nD → … → 2D → 1D → Scalar',
  });
}

// ── 20. 격자 변형 — 모든 점이 A(x,y) (1×2) ──
function basisTransformationGrid() {
  const A = mat([[2, 1], [0.5, 1.5]]);
  const T = transform.matrix(A);                  // A·x — 도형에 그대로 붙일 수 있는 변환 객체
  const gridLines = (i0, i1, alpha, width) => {
    const out = [];
    for (let i = i0; i <= i1; i++) {
      out.push(
        segment(P([-5, i]), P([5, i])).color(GRAY).stroke(width).opacity(alpha),
        segment(P([i, -5]), P([i, 5])).color(GRAY).stroke(width).opacity(alpha),
      );
    }
    return out;
  };
  const warpedLines = (i0, i1, alpha, width) => {
    const out = [];
    for (let i = i0; i <= i1; i++) {
      out.push(
        segment(P(A.apply([-5, i])), P(A.apply([5, i]))).color(GRAY).stroke(width).opacity(alpha),
        segment(P(A.apply([i, -5])), P(A.apply([i, 5]))).color(GRAY).stroke(width).opacity(alpha),
      );
    }
    return out;
  };
  const left = s2([-3, 5], [-3, 5], { grid: false }).title('Original Space (ℝ²)\nRegular grid + unit square').add(
    ...gridLines(-3, 3, 0.15, 0.5),
    ...gridLines(-2, 2, 0.3, 0.8),
    polyOf(UNIT, { fill: RED, color: RED_D, stroke: 2, opacity: 0.3 }),
    arrowAt([0, 0], [1, 0], { color: RED, stroke: 2.5 }),
    arrowAt([0, 0], [0, 1], { color: BLUE, stroke: 2.5 }),
  );
  const right = s2([-3, 8], [-3, 8], { grid: false })
    .title('Transformed Space (A applied)\nGrid deforms, unit square → parallelogram').add(
      ...warpedLines(-2, 3, 0.15, 0.5),
      ...warpedLines(-1, 2, 0.3, 0.8),
      // 변환된 정사각형/기저벡터 — 좌표를 손으로 계산하는 대신 변환을 그대로 붙인다(=`transform.matrix(A)`).
      polyOf(UNIT, { fill: RED, color: RED_D, stroke: 2, opacity: 0.3 }).apply(T),
      arrowAt([0, 0], [1, 0], { color: RED, stroke: 2.5 }).apply(T),
      arrowAt([0, 0], [0, 1], { color: BLUE, stroke: 2.5 }).apply(T),
    );
  return subplots([left, right], {
    cols: 2, tight: true,
    title: 'Matrix as Grid Deformation: Every Point (x,y) → A(x,y)',
  });
}

// ── run ─────────────────────────────────────────────────────────
//   figure 팩토리 목록 → SVG/PNG 저장 + index.html 갤러리.
//   (한 figure 가 실패해도 나머지는 계속 진행하고 마지막에 요약을 출력한다.)
const figs = [
  ['12a2-01-matrix-transformation-2d', matrixTransformation2d, '행렬 = 선형변환 (단위정사각형 → 평행사변형)'],
  ['12a2-02-determinant-area-scaling', determinantAreaScaling, '행렬식 = 넓이 배율 6종'],
  ['12a2-03-matrix-multiplication', matrixMultiplication, '행렬곱 = 변환의 합성'],
  ['12a2-04-inverse-matrix-geometry', inverseMatrixGeometry, '역행렬 = 변환 되돌리기'],
  ['12a2-05-rotation-matrix', rotationMatrix, '회전행렬 R(θ)'],
  ['12a2-06-reflection-matrix', reflectionMatrix, '반사행렬 3종'],
  ['12a2-07-shear-matrix', shearMatrix, '전단행렬 (가로/세로)'],
  ['12a2-08-vector-addition', vectorAddition, '벡터의 합 (평행사변형 법칙)'],
  ['12a2-09-vector-magnitude', vectorMagnitude, '벡터의 크기와 단위벡터'],
  ['12a2-10-dot-product-angle', dotProductAngle, '내적 = |a||b|cos θ'],
  ['12a2-11-vector-projection', vectorProjection, '정사영'],
  ['12a2-12-cross-product-3d', crossProduct3d, '외적 ⊥ a, ⊥ b (3D)'],
  ['12a2-13-cross-product-area', crossProductArea, '|a×b| = 평행사변형 넓이'],
  ['12a2-14-determinant-volume-3d', determinantVolume3d, '행렬식 = 부피 배율 (3D)'],
  ['12a2-15-linear-system-geometric', linearSystemGeometric, '연립방정식의 세 경우'],
  ['12a2-16-matrix-powers-transform', matrixPowersTransform, '행렬의 거듭제곱 = 반복 변환'],
  ['12a2-17-2d-to-1d-projection', projection2dTo1d, 'ℝ² → ℝ¹ 차원 축소'],
  ['12a2-18-3d-to-2d-projection', projection3dTo2d, 'ℝ³ → ℝ² 차원 축소'],
  ['12a2-19-dimensionality-cascade', dimensionalityCascade, '차원 축소 캐스케이드 (2×2)'],
  ['12a2-20-basis-transformation-grid', basisTransformationGrid, '격자 변형 — A(x,y)'],
];

await saveFigures(figs, {
  dir: OUT,
  index: true,
  title: 'logos · 12A2 — 행렬과 벡터 (example3.py 재현)',
});
