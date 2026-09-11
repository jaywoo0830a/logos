// examples/mpl_parity_11ab.js — example5.py (11A · 11B 삼각함수) 재현 — logos 만 사용
//
// ── 무엇을 하는가 ────────────────────────────────────────────────
//   matplotlib 로 그린 "삼각함수" 교재 그림 31개(11A 19 + 11B 12)를 logos DSL **만으로**
//   같은 구성으로 다시 그린다. 11A — 라디안 정의 · 도↔라디안 · 단위원의 sin/cos ·
//   특수각 · 기준각/ASTC · sin·cos 그래프 · tan(기울기) · csc/sec/cot · 단위원 위 6함수 ·
//   변환 5단계 · arcsin/arccos/arctan · arcsin(sin θ) · 단위원 펼치기 · 역삼각합성 삼각형.
//   11B — 합공식(기하) · 조화합성 · 맥놀이 · 주기해 · 바이어슈트라스 치환 · 부등식 ·
//   오일러 공식 · 체비쇼프 · 삼각법 3근 · 푸리에 사각파 · 항등식 계보 · 사인/코사인 법칙.
//
// ── 실행 ────────────────────────────────────────────────────────
//   node examples/mpl_parity_11ab.js  →  output/parity11a/* + output/parity11b/*
//   npm run parity11ab                (동일)
//
// ── mpl 대응 규칙 (이 예제가 지키는 관례) ────────────────────────
//   · 수식 라벨    mpl 은 `text.usetex=True` 로 `$\sin\theta$` 를 조판한다. logos 의
//                 `latexToText`(래스터/SVG <text> 폴백)는 `\sin` 같은 **남은 명령을
//                 지우므로** 이 예제는 유니코드 평문('sin θ', 'π/2', '√3/2')을 쓴다.
//   · 곡선        `curve.fn(f).on([a, b])` ← ax.plot(x, f(x))
//   · 수직 점근선  mpl 의 `|y|>8 → NaN` 은 `branchCurves()` 로 **점근선 사이 구간마다**
//                 잘라 그리고 ±8 로 클램프한다(그림 밖으로 빠져나가는 모양은 같다).
//   · 채운 부채꼴  `polygon(원점, 호의 표본 …).fill(c).opacity(0.15)` ← ax.fill(cos t, sin t)
//   · 전체 폭 선   `line.horizontal(y)` / `line.vertical(x)` ← ax.axhline / ax.axvline
//   · 여러 패널    `subplots([...], { cols })` ← plt.subplots(rows, cols)
//   · 범례        logos 에는 legend 가 없어 **같은 색 라벨**로 대신한다.
//
// ── figure 목록 ─────────────────────────────────────────────────
//   [11A]                                     ← output/parity11a
//    1 radian-definition          라디안의 정의 (r 과 같은 호)
//    2 degree-radian-circle       도 ↔ 라디안 환산 원 (16방향)
//    3 unit-circle-cos-sin        단위원의 cos·sin (투영)
//    4 special-angles-unit-circle 특수각 5개의 좌표
//    5 reference-angles-astc      기준각 + ASTC 부호 (1×2)
//    6 sin-cos-graphs             단위원 투영 → 파형 (2×2)
//    7 tan-graph                  tan = 기울기 + 그래프 (1×2)
//    8 csc-sec-cot-graphs         csc·sec·cot 그래프 (3×1, 점근선)
//    9a sin-cos-tan               단위원 위 sin·cos·tan (단일)
//    9b csc-sec-cot               단위원 위 csc·sec·cot (단일)
//   10 trig-transformations       y=2sin(3θ−π/2)+1 5단계 (5×1)
//   11 arcsin-graph               arcsin (y=x 대칭)
//   12 arccos-graph               arccos (y=x 대칭)
//   13 arctan-graph               arctan (점근선 ±π/2)
//   14 arcsin-composition         arcsin(sin θ) 톱니파 + 주치 구간
//   15 unit-circle-to-sine-unwrap 단위원 → 사인파 펼치기 (1×2)
//   16a cos-arcsin               cos(arcsin 3/5)  (3-4-5)
//   16b tan-arccos               tan(arccos −5/13) (5-12-13)
//   16c sin-arctan               sin(arctan 3/4)  (3-4-5)
//   [11B]                                     ← output/parity11b
//    1 sum-formula-geometric      e^{i(A+B)} = e^{iA}e^{iB} (기하)
//    2 harmonic-addition          a sin x + b cos x = R sin(x+φ) (1×2)
//    3 sum-product-waves          맥놀이와 포락선 (3×1)
//    4 trig-equation-solutions    주기해 (3×1)
//    5 weierstrass-substitution   t = tan(x/2) (단위원 → 수직선)
//    6 trig-inequalities          부등식의 해 = 부채꼴 (1×3)
//    7 euler-formula-complex      오일러 공식 (cos + i sin)
//    8 chebyshev-polynomials      T_n(x) = cos(n·arccos x) n=1…5
//    9 cubic-trigonometric        x³−3x−1 = 0 의 삼각법 3근 (1×2)
//   10 fourier-series             사각파 푸리에 (3×1)
//   11 identity-family-tree       항등식 계보 그래프
//   12 law-of-sines-cosines       사인법칙 / 코사인법칙 (1×2)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  point, circle, polygon, segment, line, curve, annotate, pi, kit,
} from '../index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_A = join(ROOT, 'output', 'parity11a');
const OUT_B = join(ROOT, 'output', 'parity11b');

// ── 색 — mpl 원본의 C 딕셔너리 hex 그대로 ────────────────────────
const FG = '#1a1a2e';                                     // C['fg'] (기본 도형색)
const SIN = '#e74c3c', COS = '#2980b9', TAN = '#27ae60';  // C['sin'|'cos'|'tan']
const CSC = '#e67e22', SEC = '#9b59b6', COT = '#1abc9c';  // C['csc'|'sec'|'cot']
const ASYMP = '#cccccc', HL = '#f1c40f', CIRC = '#2c3e50';
const GRAY = '#999999', FAINT = '#dddddd';
const BOX = { facecolor: 'white', alpha: 0.85 };          // mpl `bb` (흰 라운드 상자)
const { plot2d, subplots, saveFigures } = kit;


// ── 미세 헬퍼 (전부 라이브러리 API 위의 얇은 별칭) ──────────────
/** `[x, y]` → point */
const P = (v) => point(v[0], v[1]);
/** 점 마커 ← ax.plot(x, y, 'o', ms=…) — size 는 **반지름(px)** */
const dotAt = (v, color, size = 5, shape = 'circle') => P(v).marker(shape).color(color).size(size);
/** 공통 스타일 적용기 — color/stroke/dash/opacity 4종을 한 곳에서 */
const style = (d, { color, stroke = 1, dash, opacity } = {}) => {
  let s = d;
  if (color !== undefined) s = s.color(color);
  if (stroke !== undefined) s = s.stroke(stroke);
  if (dash !== undefined) s = s.dash(dash);
  if (opacity !== undefined) s = s.opacity(opacity);
  return s;
};
/** 색 있는 텍스트 ← ax.annotate / ax.text */
const labelAt = (at, text, { color, font = 12, bold = false, anchor, box, dx, dy, rotate, opacity } = {}) => {
  let t = annotate.text(P(at)).label(text).font(font);
  if (color !== undefined) t = t.color(color);
  if (bold) t = t.bold();
  if (anchor) t = t.anchor(anchor);
  if (box) t = t.box(box);
  if (dx !== undefined || dy !== undefined) t = t.offset(dx || 0, dy || 0);
  if (rotate !== undefined) t = t.rotate(rotate);
  if (opacity !== undefined) t = t.opacity(opacity);
  return t;
};
/** 화살표 ← ax.arrow / annotate(arrowprops) — bend 는 mpl `arc3,rad` */
const arrowAt = (from, to, { color, stroke = 2, dash, opacity, bend } = {}) => {
  let a = annotate.arrow(P(from), P(to));
  if (color !== undefined) a = a.color(color);
  if (stroke !== undefined) a = a.stroke(stroke);
  if (dash !== undefined) a = a.dash(dash);
  if (opacity !== undefined) a = a.opacity(opacity);
  if (bend !== undefined) a = a.bend(bend);
  return a;
};
/** 선분 ← ax.plot([x1,x2],[y1,y2])  (kit.seg 는 2D 에서 **직선**이라 segment 를 쓴다) */
const segAt = (a, b, o) => style(segment(P(a), P(b)), o);

/** 전체 폭 수직/수평선 ← ax.axvline / ax.axhline */
const vlineAt = (x, o) => style(line.vertical(x), o);
const hlineAt = (y, o) => style(line.horizontal(y), o);
/** 빈 원 ← plt.Circle((cx,cy), r, fill=False) */
const circleAt = (center, r, o) => style(circle.center(P(center)).radius(r), o);
/** 채운 다각형 ← ax.fill(x, y) (부채꼴·삼각형·띠) */
const polyAt = (pts, fill, opacity = 0.15, o = {}) => {
  let g = polygon(...pts.map(P)).fill(fill).opacity(opacity);
  if (o.color !== undefined) g = g.color(o.color).stroke(o.stroke ?? 1);
  return g;
};
/** 원점 중심 각 호 ← patches.Arc((0,0), 2r, 2r, θ₁, θ₂) */
const arcAt = (from, to, r, o) => style(
  annotate.angle({ from, vertex: [0, 0], to }).arc({ radius: r }), o);
/** 곡선 ← ax.plot(x, f(x))  (`n` = 기본 표본 수, 고주파 곡선에 쓴다) */
const curveOf = (f, dom, { n, ...o } = {}) => {
  let c = curve.fn(f).on(dom);
  if (n) c = c.n(n);
  return style(c, { stroke: 2, ...o });
};
/** 호의 표본 점들 ← np.linspace(θ₁, θ₂) 뒤 (cos, sin) */
const arcSamples = (r, d1, d2, n = 80) =>
  Array.from({ length: n + 1 }, (_, i) => onCircle(r, d1 + ((d2 - d1) * i) / n));
/** 점근선 사이 구간마다 잘라 그린 곡선들 ← mpl 의 `|y|>8 → NaN` (클램프로 대신) */
const branchCurves = (f, xr, breaks, { clip = 8, eps = 0.004, ...o } = {}) => {
  const xs = [xr[0], ...breaks.filter((b) => b > xr[0] && b < xr[1]), xr[1]];
  const out = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i] + eps, b = xs[i + 1] - eps;
    if (b > a) out.push(curveOf((t) => Math.max(-clip, Math.min(clip, f(t))), [a, b], o));
  }
  return out;
};
/** 도 → 좌표 (반지름 r) */
const rad = (deg) => (deg * pi) / 180;
const onCircle = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
/** 파이 눈금 라벨 ← ax.set_xticklabels([…])  (k = π 의 배수, 반정수는 k/2) */
const piTick = (k) => (Number.isInteger(k) ? (k === 0 ? '0' : k === 1 ? 'π' : `${k}π`)
  : (k === 0.5 ? 'π/2' : `${k * 2}π/2`));
/** 범례 자리 대체 — 색 라벨 한 줄 ← ax.legend(...) (logos 에 legend 없음) */
const legendAt = (at, text, color, { font = 11, anchor = 'start' } = {}) =>
  labelAt(at, text, { color, font, bold: true, anchor });

// ── 패널 프리셋: 한 figure 안의 패널은 **같은 size** 를 쓴다 (subplots 셀 크기) ──
const SQ = [480, 460];            // 정사각(equal) 단일 패널
const TWO = [520, 440];           // 1×2
const THREE = [430, 400];         // 1×3
const STACK = [760, 250];         // 3×1 · 5×1 가로 파형
/** 정사각 패널: equal + (기본) 축/격자 */
const s2 = (xr, yr, o = {}) => plot2d(xr, yr, { size: SQ, equal: true, ...o });
/** 1×2 / 1×3 패널 */
const s2p = (xr, yr, size = TWO, o = {}) => plot2d(xr, yr, { size, ...o });
/** 3×1 · 5×1 가로 파형 패널 */
const sw = (xr, yr, o = {}) => plot2d(xr, yr, { size: STACK, ...o });
/** 축·격자 없는 패널 ← ax.axis('off') */
const OFF = { axes: false, grid: false };
/** 축 라벨 프리셋 ← ax.set_xlabel / set_ylabel */
const AX = (x = 'x', y = 'y') => ({ x: { label: x }, y: { label: y } });
/** π 눈금 라벨 하나 — 경계에 붙으면 안쪽으로 정렬해 잘림을 막는다 ← ax.set_xticklabels */
const piTickAt = (xr, k, y, o = {}) => {
  const span = xr[1] - xr[0];
  const x = k * pi;
  const anchor = x <= xr[0] + span * 0.03 ? 'start' : (x >= xr[1] - span * 0.03 ? 'end' : 'middle');
  const at = anchor === 'start' ? xr[0] + span * 0.015 : (anchor === 'end' ? xr[1] - span * 0.015 : x);
  return labelAt([at, y], piTick(k), { color: GRAY, font: 9, anchor, ...o });
};

// ══ 11A ═════════════════════════════════════════════════════════

// ── 1. 라디안의 정의 ──
//   mpl: 반지름 r 인 원에서 **호의 길이가 r 과 같은** 중심각이 1 rad(=57.2958°).
//   logos 대응: 호는 원 위에 그대로 얹히므로 반지름 r 짜리 각 호를 쓴다.
function radianDefinition() {
  const r = 1.2, th = 1.0;                                   // 1 rad (라디안)
  const p1 = onCircle(r, 0), p2 = [r * Math.cos(th), r * Math.sin(th)];
  return s2([-1.8, 1.8], [-1.8, 1.8], OFF).title('1 Radian').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 2 }),
    segAt([0, 0], p1, { color: FG, stroke: 2 }),
    segAt([0, 0], p2, { color: FG, stroke: 2 }),
    arcAt([1, 0], p2, r, { color: SIN, stroke: 3 }),           // 호의 길이 = r
    arcAt([1, 0], p2, 0.35, { color: HL, stroke: 2 }),         // 각 표시
    labelAt([0.2, 0.1], '1 rad', { color: HL, font: 16, bold: true, box: BOX }),
    labelAt([r / 2, -0.15], 'r', { font: 18, anchor: 'middle' }),
    labelAt([r / 2 * Math.cos(th / 2), r / 2 * Math.sin(th / 2) + 0.1], 'r',
      { color: SIN, font: 18, anchor: 'middle', box: BOX }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
  ).compile();
}

// ── 2. 도 ↔ 라디안 환산 원 ──
//   mpl 은 16방향의 도(바깥, 빨강)와 라디안(안, 파랑)을 같은 방향선에 붙인다.
//   mpl 대비: 도 라벨이 r+0.4(>view) 밖이라 잘리므로 view 를 ±1.7 로 넓혔다.
function degreeRadianCircle() {
  const deg = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const lr = ['0', 'π/6', 'π/4', 'π/3', 'π/2', '2π/3', '3π/4', '5π/6',
    'π', '7π/6', '5π/4', '4π/3', '3π/2', '5π/3', '7π/4', '11π/6'];
  const r = 1.2;
  return s2([-1.7, 1.7], [-1.7, 1.7], OFF).title('Degrees ↔ Radians').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 2 }),
    ...deg.flatMap((d, i) => [
      segAt([0, 0], onCircle(r, d), { color: FAINT, stroke: 0.8 }),
      dotAt(onCircle(1.05, d), FG, 3),
      labelAt(onCircle(r + 0.4, d), `${d}°`, { color: SIN, font: 9, bold: true, anchor: 'middle' }),
      labelAt(onCircle(r - 0.4, d), lr[i], { color: COS, font: 9, bold: true, anchor: 'middle' }),
    ]),
    legendAt([-1.65, 1.62], 'Degrees', SIN, { anchor: 'start' }),   // mpl legend upper right
    legendAt([-1.65, 1.46], 'Radians', COS, { anchor: 'start' }),
  ).compile();
}

// ── 3. 단위원의 cos · sin ──
//   각 θ 의 점에서 내린 수선이 곧 cos(가로)·sin(세로) ← mpl 의 점선 두 개.
function unitCircleCosSin() {
  const p = onCircle(1, 50), x = p[0], y = p[1];
  return s2([-1.5, 1.5], [-1.2, 1.2], { axes: AX('x', 'y'), grid: { alpha: 0.3 } })
    .title('cos θ, sin θ').add(
      circleAt([0, 0], 1, { color: CIRC, stroke: 2 }),                        // 단위원
      segAt([0, 0], p, { color: FG, stroke: 1.5 }),
      dotAt(p, SIN, 6),
      segAt([0, y], p, { color: COS, stroke: 2, dash: [5, 4] }),
      segAt([x, 0], p, { color: SIN, stroke: 2, dash: [5, 4] }),
      labelAt([0.05, y / 2], 'sin θ', { color: SIN, font: 14, bold: true, box: BOX }),
      labelAt([x / 2, -0.12], 'cos θ', { color: COS, font: 14, bold: true, box: BOX }),
      arcAt([1, 0], p, 0.3, { color: HL, stroke: 2 }),
      labelAt([0.18, 0.06], 'θ', { font: 14, bold: true, box: BOX }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      legendAt([-1.4, -1.02], 'sin θ', SIN),                    // mpl legend lower left
      legendAt([-1.4, -1.15], 'cos θ', COS),
    ).compile();
}

// ── 4. 특수각 5개의 좌표 ──
//   mpl 은 각도를 4분면으로 복제하고 **1사분면에만** 좌표 라벨을 붙인다(그대로 재현).
function specialAngles() {
  const r = 1.3;
  const sp = [
    [0, '0', '(1, 0)', 0.08, 0.08], [30, 'π/6', '(√3/2, 1/2)', 0.08, 0.08],
    [45, 'π/4', '(√2/2, √2/2)', 0.18, 0.32], [60, 'π/3', '(1/2, √3/2)', 0.10, -0.04],
    [90, 'π/2', '(0, 1)', 0.0, 0.14],
  ];
  return s2([-1.6, 1.6], [-1.6, 1.6], OFF).title('Special Angles').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 2 }),
    ...sp.flatMap(([d, lr, coord, ox, oy]) => {
      const p = onCircle(1, d);
      const quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
        .map(([sx, sy]) => [sx * p[0], sy * p[1]])
        .filter((_, q) => !(d === 0 && q > 0) && !(d === 90 && q % 2 === 1));
      return [
        ...quad.flatMap((q) => [dotAt(q, FG, 4), segAt([0, 0], q, { color: FAINT, stroke: 0.5 })]),
        // mpl 대비: π/6·π/4 라벨이 붙어 45° 만 조금 밀어냈다(좌표는 그대로).
        labelAt([p[0] + ox, p[1] + oy], `${lr}\n${coord}`,
          { font: 10, bold: true, box: BOX }),
      ];
    }),
  ).compile();
}

// ── 5. 기준각 + ASTC 부호 (1×2) ──
function referenceAnglesAstc() {
  const r = 1.2, p = onCircle(r, 150);
  const left = s2p([-1.5, 1.5], [-1.5, 1.5], TWO, { equal: true, ...OFF }).title('Reference Angle').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    segAt([0, 0], p, { color: FG, stroke: 1.5 }),
    dotAt(p, SIN, 6),
    labelAt([p[0] - 0.02, p[1] + 0.1], 'θ = 150°', { color: SIN, font: 12, box: BOX }),
    arcAt(onCircle(1, 150), onCircle(1, 180), 0.4, { color: HL, stroke: 2.5 }),   // α = 30°
    labelAt([-0.65, 0.22], 'α = 30°', { color: HL, font: 12, bold: true, box: BOX }),
    segAt([p[0], 0], p, { color: HL, stroke: 1.5, dash: [5, 4] }),
  );
  const right = s2p([-1.6, 1.6], [-1.6, 1.6], TWO, { equal: true, ...OFF }).title('ASTC Signs').add(
    circleAt([0, 0], 1.2, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.8 }),
    vlineAt(0, { color: GRAY, stroke: 0.8 }),
    ...[[0.6, 0.6, 'QI\nsin + cos +', TAN], [-0.6, 0.6, 'QII\nsin + cos −', SIN],
      [-0.6, -0.6, 'QIII\nsin − cos −', CSC], [0.6, -0.6, 'QIV\nsin − cos +', COS]]
      .map(([x, y, t, c]) => labelAt([x, y], t,
        { color: c, font: 11, bold: true, anchor: 'middle', box: BOX })),
    ...[['A', 1.35, 1.35], ['S', -1.35, 1.35], ['T', -1.35, -1.35], ['C', 1.35, -1.35]]
      .map(([l, x, y]) => labelAt([x, y], l, { font: 14, bold: true, anchor: 'middle', box: BOX })),
  );
  return subplots([left, right], { cols: 2, tight: true });
}

// ── 6. 단위원 투영 → sin · cos 그래프 (2×2) ──
//   mpl 은 heights [1, 1.2] 로 위 두 칸(투영)을 낮게 잡았다 — logos 는 셀 크기가 하나라
//   [420, 380] 으로 통일한다(모양은 유지, 세로 비율만 다름 — mpl 대비).
function sinCosGraphs() {
  const CELL6 = [430, 380];
  const circlePanel = (title, marker, dashColor, vertical) =>
    s2p([-1.5, 1.5], [-1.5, 1.5], CELL6, { equal: true, ...OFF }).title(title).add(
      circleAt([0, 0], 1, { color: '#cccccc', stroke: 1.5 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...Array.from({ length: 13 }, (_, i) => i * 30).flatMap((d) => {
        const q = onCircle(1, d);
        const leg = vertical ? segAt([q[0], 0], q, { color: dashColor, stroke: 1, dash: [3, 3], opacity: 0.5 })
          : segAt([0, q[1]], q, { color: dashColor, stroke: 1, dash: [3, 3], opacity: 0.5 });
        return [segAt([0, 0], q, { color: FAINT, stroke: 0.5 }), dotAt(q, marker, 2.5), leg];
      }),
    );
  const p1 = circlePanel('sin θ = y', SIN, SIN, true);
  const p2 = circlePanel('cos θ = x', COS, COS, false);
  const p3 = s2p([-pi, 4 * pi], [-1.5, 1.5], CELL6,
    { axes: { x: { label: 'θ', ticks: false }, y: { label: 'y' } }, grid: { alpha: 0.3 } })
    .title('sin θ and cos θ').add(
      curveOf(Math.sin, [-pi, 4 * pi], { color: SIN, stroke: 2 }),
      curveOf(Math.cos, [-pi, 4 * pi], { color: COS, stroke: 2 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      hlineAt(1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      hlineAt(-1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      ...Array.from({ length: 6 }, (_, i) => i - 1).flatMap((n) => [
        vlineAt(n * pi, { color: FAINT, stroke: 0.5, dash: [4, 3] }),
        ...(n % 2 === 0 ? [piTickAt([-pi, 4 * pi], n, -1.3)] : []),
      ]),
      // mpl 대비: 범례가 곡선과 겹쳐 |y|>1 대역으로 올렸다(cos 는 x=9.5 에서 −0.91).
      legendAt([9.5, 1.3], 'sin θ', SIN, { anchor: 'end' }),
      legendAt([9.5, 1.03], 'cos θ', COS, { anchor: 'end' }),
    );
  const p4 = s2p([0, 1], [0, 1], CELL6, OFF).add(
    labelAt([0.1, 0.5], 'Period 2π\nAmplitude 1\nRange [−1, 1]',
      { font: 16, anchor: 'start', box: BOX }),
  );
  return subplots([p1, p2, p3, p4], { cols: 2, tight: true });
}

// ── 7. tan = 기울기 + 그래프 (1×2) ──
//   왼쪽: 접선(반지름 연장)이 x=1 과 만나는 높이가 곧 tan θ. 오른쪽: 주기 π, 점근선 π/2+kπ.
function tanGraph() {
  const r = 1.2, ang = 35, tv = Math.tan(rad(ang));
  const left = s2p([-1.8, 1.8], [-1.8, 1.8], TWO, { equal: true, ...OFF }).title('tan θ = Slope').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(1, { color: TAN, stroke: 1, dash: [2, 2] }),                       // x = 1
    segAt([0, 0], [1.7 * Math.cos(rad(ang)), 1.7 * Math.sin(rad(ang))], { color: TAN, stroke: 2 }),
    dotAt([1, tv], TAN, 6),
    segAt([1, 0], [1, tv], { color: TAN, stroke: 1.5, dash: [5, 4], opacity: 0.6 }),
    labelAt([1.05, tv / 2], `tan θ = ${tv.toFixed(2)}`, { color: TAN, font: 14, bold: true, box: BOX }),
    arcAt([1, 0], onCircle(1, ang), 0.3, { color: HL, stroke: 2 }),
    labelAt([0.18, 0.05], 'θ', { font: 14, box: BOX }),
    legendAt([-1.7, 1.65], 'x = 1', TAN),                                      // mpl legend upper left
  );
  const xr = [-pi / 2 - 0.3, 3 * pi / 2 + 0.3];
  const right = sw(xr, [-6, 6], { axes: AX('θ', 'y'), grid: { alpha: 0.3 } })
    .title('y = tan θ — Period π').add(
      ...branchCurves(Math.tan, xr, [pi / 2], { color: TAN, stroke: 2, clip: 6 }),
      ...[-1, 0, 1, 2].map((n) => vlineAt(n * pi + pi / 2, { color: ASYMP, stroke: 1.5, dash: [6, 4] })),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      hlineAt(1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      hlineAt(-1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      labelAt([pi, 5.5], 'Period π', { font: 14, anchor: 'middle', box: BOX }),
    );
  return subplots([left, right], { cols: 2, tight: true });
}

// ── 8. csc · sec · cot 그래프 (3×1) ──
//   mpl 의 `|y|>8 → NaN` 을 branchCurves 로 대신한다 — 극점마다 구간을 잘라 그린다.
function cscSecCotGraphs() {
  const xr = [0.01, 2 * pi - 0.01], xlim = [0, 2 * pi];
  const mk = (title, f, color, breaks, asymptotes, xLabel = false) => sw(xlim, [-6, 6], {
    axes: { x: { label: xLabel, ticks: false }, y: { label: 'y' } },
    grid: { alpha: 0.3 },
  }).title(title).add(
    ...branchCurves(f, xr, breaks, { color, stroke: 2, clip: 6 }),
    ...asymptotes.map((a) => vlineAt(a, { color: ASYMP, stroke: 1, dash: [5, 5] })),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    hlineAt(1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
    hlineAt(-1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
    ...Array.from({ length: 5 }, (_, n) => n / 2)
      .map((k) => piTickAt(xlim, k, -5.15)),
  );
  return subplots([
    mk('csc θ = 1/sin θ', (t) => 1 / Math.sin(t), CSC, [pi], [0, pi, 2 * pi]),
    mk('sec θ = 1/cos θ', (t) => 1 / Math.cos(t), SEC, [pi / 2, 3 * pi / 2], [pi / 2, 3 * pi / 2]),
    mk('cot θ = 1/tan θ', (t) => 1 / Math.tan(t), COT, [pi], [0, pi, 2 * pi]),
  ], { cols: 1, tight: true, title: 'Cosecant, Secant, Cotangent' });
}

// ── 9. 단위원 위 여섯 함수 (파일 두 개) ──
//   mpl 은 같은 코드를 `sin/cos/tan` 과 `csc/sec/cot` 로 두 번 돌려 **파일 두 개**를 만든다.
//   logos 도 두 figure 로 나눈다 — 그래서 figure 목록에 9a·9b 두 줄이다.
function unitCircleSinCosTan() {
  const r = 1.2, ang = 40, p = onCircle(1, ang), tv = Math.tan(rad(ang));
  return s2([-2, 2], [-2, 2], OFF).title('sin, cos, tan on Unit Circle').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 2 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    segAt([0, 0], [1.9 * Math.cos(rad(ang)), 1.9 * Math.sin(rad(ang))], { color: FG, stroke: 1.5 }),
    dotAt(p, FG, 6),
    segAt([p[0], 0], p, { color: SIN, stroke: 3 }),                        // sin θ
    // mpl 대비: 라벨이 tan 선(x=1)과 겹쳐 안쪽 빈 자리로 옮겼다.
    labelAt([0.25, p[1] / 2], 'sin', { color: SIN, font: 18, bold: true, box: BOX }),
    segAt([0, p[1]], p, { color: COS, stroke: 3 }),                        // cos θ
    labelAt([p[0] / 2, p[1] - 0.25], 'cos', { color: COS, font: 18, bold: true, box: BOX }),
    segAt([1, 0], [1, tv], { color: TAN, stroke: 3 }),                     // tan θ
    dotAt([1, tv], TAN, 6),
    labelAt([1.08, tv / 2], 'tan', { color: TAN, font: 18, bold: true, box: BOX }),
    arcAt([1, 0], p, 0.35, { color: HL, stroke: 2 }),
    labelAt([0.22, 0.07], 'θ', { font: 18, box: BOX }),
  ).compile();
}

function unitCircleCscSecCot() {
  const r = 1.2, ang = 40, th = rad(ang), p = onCircle(1, ang);
  const cotv = 1 / Math.tan(th), secv = 1 / Math.cos(th), cscv = 1 / Math.sin(th);
  const sPt = [secv * Math.cos(th), secv * Math.sin(th)];   // x=1 위 (sec)
  const cPt = [cscv * Math.cos(th), cscv * Math.sin(th)];   // y=1 위 (csc)
  return s2([-1.5, 1.5], [-1.5, 1.5], OFF).title('csc, sec, cot on Unit Circle').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 2 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    segAt([0, 0], [1.9 * Math.cos(th), 1.9 * Math.sin(th)], { color: FG, stroke: 1.5 }),
    dotAt(p, FG, 6),
    segAt([0, 1], [cotv, 1], { color: COT, stroke: 3 }),                   // cot: y=1 위
    dotAt([cotv, 1], COT, 6),
    labelAt([cotv / 2, 1.12], 'cot', { color: COT, font: 18, bold: true, box: BOX }),
    segAt([0, 0], sPt, { color: SEC, stroke: 3 }),                         // sec: x=1 위
    dotAt(sPt, SEC, 6),
    labelAt([sPt[0] * 0.45 + 0.1, sPt[1] * 0.45 - 0.16], 'sec',
      { color: SEC, font: 18, bold: true, box: BOX }),                     // mpl 대비: csc 라벨과 겹쳐 아래로
    segAt([0, 0], cPt, { color: CSC, stroke: 3 }),                         // csc: y=1 위
    dotAt(cPt, CSC, 6),
    labelAt([cPt[0] * 0.6 + 0.12, cPt[1] * 0.6 + 0.06], 'csc',
      { color: CSC, font: 18, bold: true, box: BOX }),                     // mpl 대비: sec 라벨과 겹쳐 위로
    vlineAt(1, { color: GRAY, stroke: 0.8, dash: [2, 3] }),                // x = 1
    labelAt([1.02, -1.32], 'x = 1', { color: GRAY, font: 13, box: BOX }),
    hlineAt(1, { color: GRAY, stroke: 0.8, dash: [2, 3] }),                // y = 1
    labelAt([-0.12, 1.02], 'y = 1', { color: GRAY, font: 13, rotate: 90, anchor: 'middle', box: BOX }),
    arcAt([1, 0], p, 0.35, { color: HL, stroke: 2 }),
    labelAt([0.22, 0.07], 'θ', { font: 18, box: BOX }),
  ).compile();
}

// ── 10. 변환 5단계 (5×1) ──
//   y = sin θ → 2sin θ(진폭) → 2sin 3θ(주기) → 2sin(3θ−π/2)(위상) → +1(중심선).
//   mpl 은 각 패널 제목을 왼쪽에 붙였지만 logos 제목은 가운데 — 그건 mpl 대비 차이다.
function trigTransformations() {
  const stages = [
    ['y = sin θ', (t) => Math.sin(t), 'Period 2π'],
    ['y = 2 sin θ', (t) => 2 * Math.sin(t), 'Amp 2'],
    ['y = 2 sin(3θ)', (t) => 2 * Math.sin(3 * t), 'Period 2π/3'],
    ['y = 2 sin(3θ − π/2)', (t) => 2 * Math.sin(3 * t - pi / 2), 'Shift +π/6'],
    ['y = 2 sin(3θ − π/2) + 1', (t) => 2 * Math.sin(3 * t - pi / 2) + 1, 'Midline y = 1'],
  ];
  return subplots(stages.map(([t, f, note], i) => sw([0, 2 * pi], [-3.5, 3.5], {
    axes: { x: { label: i === 4 ? 'θ' : false, ticks: false }, y: { label: 'y' } },
    grid: { alpha: 0.3 },
  }).title(`${i + 1}. ${t}`).add(
    curveOf(f, [0, 2 * pi], { color: SIN, stroke: 2 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    labelAt([2 * pi * 0.98, 2.8], note, { font: 13, anchor: 'end', box: BOX }),
    ...(i === 4 ? Array.from({ length: 5 }, (_, n) => n / 2)
      .map((k) => piTickAt([0, 2 * pi], k, -3.3)) : []),
  )), { cols: 1, tight: true, title: 'Building y = 2 sin(3θ − π/2) + 1' });
}

// ── 11~13. 역삼각함수 3종 ──
//   mpl 은 y=x 점선을 기준으로 **역함수 = 원함수의 대칭**임을 보여준다.
function arcsinGraph() {
  const lim = [-pi / 2 - 0.3, pi / 2 + 0.3];
  const pts = [[-pi / 2, -1], [0, 0], [pi / 2, 1]];
  return s2(lim, lim, { axes: AX('x', 'y'), grid: { alpha: 0.3 } }).title('y = arcsin x').add(
    curveOf(Math.sin, [-pi / 2, pi / 2], { color: SIN, stroke: 2, dash: [6, 4], opacity: 0.5 }),
    curveOf(Math.asin, [-1, 1], { color: SIN, stroke: 2.5 }),
    segAt(lim, lim, { color: GRAY, stroke: 1, dash: [2, 3] }),               // y = x
    ...pts.flatMap(([a, b]) => [dotAt([a, b], SIN, 4), dotAt([b, a], SIN, 4)]),   // (a,b) ↔ (b,a)
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    legendAt([lim[0] + 0.05, lim[1] - 0.15], 'sin θ (dashed)', SIN, { font: 10 }),
    legendAt([lim[0] + 0.05, lim[1] - 0.38], 'arcsin x', SIN, { font: 10, anchor: 'end' }),
    legendAt([lim[0] + 0.05, lim[1] - 0.61], 'y = x', GRAY, { font: 10 }),
  ).compile();
}

function arccosGraph() {
  const lim = [-0.3, pi + 0.3];
  const pts = [[0, 1], [pi / 2, 0], [pi, -1]];
  return s2(lim, lim, { axes: AX('x', 'y'), grid: { alpha: 0.3 } }).title('y = arccos x').add(
    curveOf(Math.cos, [0, pi], { color: COS, stroke: 2, dash: [6, 4], opacity: 0.5 }),
    curveOf(Math.acos, [-1, 1], { color: COS, stroke: 2.5 }),
    segAt(lim, lim, { color: GRAY, stroke: 1, dash: [2, 3] }),
    ...pts.flatMap(([a, b]) => [dotAt([a, b], COS, 4), dotAt([b, a], COS, 4)]),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    legendAt([lim[0] + 0.05, lim[1] - 0.15], 'cos θ (dashed)', COS, { font: 10 }),
    legendAt([lim[0] + 0.05, lim[1] - 0.38], 'arccos x', COS, { font: 10 }),
    legendAt([lim[0] + 0.05, lim[1] - 0.61], 'y = x', GRAY, { font: 10 }),
  ).compile();
}

function arctanGraph() {
  return s2p([-8, 8], [-pi / 2 - 0.3, pi / 2 + 0.3], SQ, { axes: AX('x', 'y'), grid: { alpha: 0.3 } })
    .title('y = arctan x').add(
      curveOf(Math.atan, [-8, 8], { color: TAN, stroke: 2.5 }),
      hlineAt(pi / 2, { color: ASYMP, stroke: 1.5, dash: [6, 4] }),          // π/2
      hlineAt(-pi / 2, { color: ASYMP, stroke: 1.5, dash: [6, 4] }),         // −π/2
      dotAt([1, pi / 4], TAN, 5),
      labelAt([1.1, pi / 4 + 0.1], '(1, π/4)', { color: TAN, font: 14, box: BOX }),
      dotAt([-1, -pi / 4], TAN, 5),
      labelAt([-3.5, -pi / 4 - 0.1], '(−1, −π/4)', { color: TAN, font: 14, box: BOX }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      legendAt([7.8, -1.35], 'π/2', GRAY, { anchor: 'end', font: 10 }),      // mpl legend lower right
      legendAt([7.8, -1.52], '−π/2', GRAY, { anchor: 'end', font: 10 }),
    ).compile();
}

// ── 14. arcsin(sin θ) — 주치 구간에서만 y=θ ──
//   mpl: [-π/2, π/2] 만 항등인 톱니파. 그 구간을 옅게 칠한다(axvspan).
function arcsinComposition() {
  const xr = [-2 * pi, 2 * pi], yr = [-pi / 2 - 0.3, pi / 2 + 0.3];
  return s2p(xr, yr, [700, 420], { axes: { x: { label: 'θ', ticks: false }, y: { label: 'y' } },
    grid: { alpha: 0.3 } })
    .title('arcsin(sin θ)').add(
      polyAt([[-pi / 2, yr[0]], [pi / 2, yr[0]], [pi / 2, yr[1]], [-pi / 2, yr[1]]], SIN, 0.08),
      curveOf((t) => Math.asin(Math.sin(t)), xr, { color: SIN, stroke: 2.5, n: 400 }),
      segAt([xr[0], xr[0]], [xr[1], xr[1]], { color: GRAY, stroke: 1, dash: [2, 3], opacity: 0.5 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...[-2, -1, 0, 1, 2].map((n) => vlineAt(n * pi, { color: FAINT, stroke: 0.5, dash: [4, 3] })),
      ...[-2, -1, 0, 1, 2].map((n) => piTickAt(xr, n, yr[0] + 0.25, { font: 10 })),
      legendAt([xr[0] + 0.2, yr[1] - 0.15], 'arcsin(sin θ)', SIN, { font: 11 }),
      legendAt([xr[0] + 0.2, yr[1] - 0.45], 'y = θ', GRAY, { font: 11 }),
    ).compile();
}

// ── 15. 단위원 → 사인파 펼치기 (1×2) ──
//   같은 12등분 점을 원에서 세로로 옮기면 사인파가 된다. 현재각 60° 를 크게 표시.
function unitCircleToSineUnwrap() {
  const cur = 60, th = rad(60), p = onCircle(1, cur);
  const left = s2p([-1.5, 1.5], [-1.5, 1.5], TWO, { equal: true, ...OFF }).title('Unit Circle').add(
    circleAt([0, 0], 1, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    ...Array.from({ length: 13 }, (_, i) => (i * 2 * pi) / 12).flatMap((a) => {
      const q = [Math.cos(a), Math.sin(a)];
      return [dotAt(q, SIN, 2.5), segAt([0, 0], q, { color: FAINT, stroke: 0.5 })];
    }),
    dotAt(p, SIN, 8),
    segAt([0, 0], p, { color: FG, stroke: 2 }),
    segAt([p[0], 0], p, { color: SIN, stroke: 1.5, dash: [5, 4] }),
    labelAt([p[0] + 0.08, p[1] + 0.08], 'P(θ)', { font: 14, bold: true, box: BOX }),
  );
  const right = s2p([0, 2 * pi], [-1.5, 1.5], TWO,
    { axes: { x: { label: 'θ', ticks: false }, y: { label: 'sin θ' } }, grid: { alpha: 0.3 } })
    .title('Sine Wave').add(
      curveOf(Math.sin, [0, 2 * pi], { color: SIN, stroke: 2.5 }),
      ...Array.from({ length: 13 }, (_, i) => (i * 2 * pi) / 12).flatMap((a) => [
        vlineAt(a, { color: FAINT, stroke: 0.5, dash: [4, 3] }),
        dotAt([a, Math.sin(a)], SIN, 2.5),
      ]),
      dotAt([th, Math.sin(th)], SIN, 8),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...Array.from({ length: 5 }, (_, n) => n / 2)
        .map((k) => piTickAt([0, 2 * pi], k, -1.3)),
    );
  return subplots([left, right], { cols: 2, tight: true });
}

// ── 16. 역삼각합성 직각삼각형 3컷 ──
//   cos(arcsin 3/5) · tan(arccos −5/13) · sin(arctan 3/4) — mpl 이 파일 3개를 만든다.
//   세 경우 모두 정수 변(3-4-5 / 5-12-13)이라 변 라벨은 정수로 찍는다.
function rightTriangle({ title, val, scale, mode, color }) {
  let opp, adj, h;
  if (mode === 'arcsin') { opp = val * scale; adj = Math.sqrt(1 - val ** 2) * scale; h = scale; }
  else if (mode === 'arccos') { adj = val * scale; opp = Math.sqrt(1 - val ** 2) * scale; h = scale; }
  else { opp = val * scale; adj = scale; h = Math.sqrt(1 + val ** 2) * scale; }
  const pad = 0.4, mx = Math.max(Math.abs(adj), opp, h) + pad;
  const xr = adj < 0 ? [-mx, mx] : [-pad, mx], yr = [-pad, mx];
  const rs = 0.2 * (mx / 5), sgn = adj >= 0 ? -1 : 1;                 // 직각 표시
  const nx = -opp / h, ny = adj / h;                                  // 빗변 수선 방향
  const perp = adj >= 0 ? 0.5 : 0.95;                                 // mpl 대비: 5-12-13 에서 '12' 라벨과 겹쳐 더 밀었다
  return s2p(xr, yr, SQ, { equal: true, ...OFF }).title(title).add(
    polyAt([[0, 0], [adj, 0], [adj, opp]], color, 0.06),
    segAt([0, 0], [adj, 0], { color: FG, stroke: 2.5 }),
    segAt([adj, 0], [adj, opp], { color: FG, stroke: 2.5 }),
    segAt([adj, opp], [0, 0], { color: FG, stroke: 2.5 }),
    dotAt([0, 0], FG, 5), dotAt([adj, 0], FG, 5), dotAt([adj, opp], FG, 5),
    labelAt([Math.abs(adj) * 0.12 + 0.05, 0.08], 'θ', { font: 20, bold: true, box: BOX }),
    labelAt([adj + (adj >= 0 ? 0.5 : -0.5), opp / 2], `${Math.round(Math.abs(opp))}`,
      { color, font: 18, bold: true, anchor: 'middle', box: BOX }),
    labelAt([adj / 2, -0.35], `${Math.round(Math.abs(adj))}`,
      { font: 17, anchor: 'middle', box: BOX }),
    labelAt([adj / 2 + nx * perp, opp / 2 + ny * perp], `${Math.round(h)}`,
      { font: 17, anchor: 'middle', box: BOX }),
    segAt([adj + sgn * rs, 0], [adj + sgn * rs, rs], { color: GRAY, stroke: 1.5 }),
    segAt([adj + sgn * rs, rs], [adj, rs], { color: GRAY, stroke: 1.5 }),
  ).compile();
}

// ══ 11B ═════════════════════════════════════════════════════════

// ── 1. 합공식의 기하 ──
//   단위원 위에서 각 A 를 B 만큼 더 돌린 점 = e^{i(A+B)} ← 편각의 덧셈.
function sumFormulaGeometric() {
  const r = 1.3, A = 35, B = 55;
  return s2([-1.8, 1.8], [-1.8, 1.8], OFF).title('e^(i(A+B)) = e^(iA) · e^(iB)').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    segAt([0, 0], onCircle(r, A), { color: SIN, stroke: 3 }),
    dotAt(onCircle(r, A), SIN, 6),
    segAt([0, 0], onCircle(r, A + B), { color: COS, stroke: 3 }),
    dotAt(onCircle(r, A + B), COS, 6),
    arcAt([1, 0], onCircle(1, A), 0.35, { color: SIN, stroke: 2 }),
    labelAt([0.22, 0.08], 'A', { color: SIN, font: 16, box: BOX }),
    arcAt(onCircle(1, A), onCircle(1, A + B), 0.5, { color: COS, stroke: 2 }),
    labelAt([0.28, 0.3], 'B', { color: COS, font: 16, box: BOX }),
    legendAt([-1.75, 1.7], 'e^(iA)', SIN),                        // mpl legend upper right
    legendAt([-1.75, 1.55], 'e^(i(A+B))', COS),
  ).compile();
}

// ── 2. 조화합성 (1×2) ──
//   a sin x + b cos x = R sin(x + φ),  R = √(a²+b²),  φ = atan2(b, a).
function harmonicAddition() {
  const a = 3, b = 4, R = Math.hypot(a, b), phi = Math.atan2(b, a);
  const tip = [R * Math.cos(phi), R * Math.sin(phi)];
  const left = s2p([-0.5, 5.5], [-0.5, 5.5], TWO, { equal: true, axes: AX('x', 'y'), grid: { alpha: 0.3 } })
    .title('Phasor Triangle').add(
      arrowAt([0, 0], [a, 0], { color: SIN, stroke: 2.5 }),
      arrowAt([a, 0], [a, b], { color: COS, stroke: 2.5 }),
      arrowAt([0, 0], tip, { color: TAN, stroke: 3 }),
      segAt([a - 0.2, 0], [a - 0.2, 0.2], { color: GRAY, stroke: 1 }),
      segAt([a - 0.2, 0.2], [a, 0.2], { color: GRAY, stroke: 1 }),
      arcAt([1, 0], tip, 0.5, { color: HL, stroke: 2 }),
      labelAt([0.3, 0.1], 'φ', { font: 18, bold: true, box: BOX }),
      legendAt([1.5, -0.45], 'a = 3', SIN, { anchor: 'middle' }),   // mpl 대비: 왼쪽 잘림 → 화살표 아래
      legendAt([3.6, 2.0], 'b = 4', COS),
      legendAt([1.1, 2.9], 'R = 5', TAN),
    );
  const right = s2p([0, 2 * pi], [-R - 0.5, R + 0.5], TWO, { axes: AX('x', 'y'), grid: { alpha: 0.3 } })
    .title('Combined Wave').add(
      curveOf((x) => a * Math.sin(x) + b * Math.cos(x), [0, 2 * pi], { color: SIN, stroke: 2, opacity: 0.3 }),
      curveOf((x) => R * Math.sin(x + phi), [0, 2 * pi], { color: TAN, stroke: 2.5 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      hlineAt(R, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      hlineAt(-R, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      legendAt([2 * pi, R - 0.6], '5 sin(x + φ)', TAN, { anchor: 'end' }),
      legendAt([2 * pi, R - 1.5], '3 sin x + 4 cos x', SIN, { anchor: 'end', font: 10 }),
    );
  return subplots([left, right], { cols: 2, tight: true });
}

// ── 3. 맥놀이와 포락선 (3×1) ──
//   sin(ω₁t) + sin(ω₂t) = 2 cos((ω₁−ω₂)t/2) sin(...) — 진폭이 느리게 흔들린다.
function beatPatterns() {
  const xr = [0, 4 * pi];
  const y1 = (t) => Math.sin(2.5 * t), y2 = (t) => Math.sin(3 * t);
  const mk = (title, items, yr, xLabel = false) => sw(xr, yr, {
    axes: { x: { label: xLabel, ticks: false }, y: { label: 'y' } }, grid: { alpha: 0.2 },
  }).title(title).add(...items);
  return subplots([
    mk('Two Frequencies', [
      curveOf(y1, xr, { color: SIN, stroke: 1.5 }),
      curveOf(y2, xr, { color: COS, stroke: 1.5, dash: [7, 5], opacity: 0.7 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      legendAt([4 * pi, 1.35], 'sin(ω₁t)', SIN, { anchor: 'end', font: 11 }),
      legendAt([4 * pi, 1.05], 'sin(ω₂t)', COS, { anchor: 'end', font: 11 }),
    ], [-1.5, 1.5]),
    mk('Beat Pattern', [
      curveOf((t) => y1(t) + y2(t), xr, { color: TAN, stroke: 2 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
    ], [-2.5, 2.5]),
    mk('Envelope Revealed', [
      curveOf((t) => y1(t) + y2(t), xr, { color: TAN, stroke: 2 }),
      curveOf((t) => 2 * Math.cos(0.5 * t), xr, { color: SIN, stroke: 1.5, dash: [7, 5] }),
      curveOf((t) => -2 * Math.cos(0.5 * t), xr, { color: SIN, stroke: 1.5, dash: [7, 5] }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      legendAt([pi, 2.05], 'sin ω₁t + sin ω₂t', TAN, { anchor: 'middle' }),   // mpl 대비: 포락선과 겹쳐 안쪽으로
      legendAt([pi, 1.8], 'Envelope', SIN, { anchor: 'middle' }),
    ], [-2.5, 2.5], true),
  ], { cols: 1, tight: true, title: 'Beat Patterns' });
}

// ── 4. 주기해 (3×1) ──
//   mpl 대비: 패널 제목에 색을 넣지만(`color=cl`) logos `.title()` 은 색을 받지 않아
//   대신 오른쪽 **같은 색 라벨**(y = …)로 어느 함수인지 표시한다.
function trigEquationSolutions() {
  const xr = [-pi, 5 * pi];
  const rows = [
    ['sin x = 1/2', Math.sin, 0.5, SIN, (k) => [Math.asin(k), pi - Math.asin(k)], 2 * pi],
    ['cos x = −√3/2', Math.cos, -Math.sqrt(3) / 2, COS,
      (k) => [Math.acos(k), 2 * pi - Math.acos(k)], 2 * pi],
    ['tan x = −1', Math.tan, -1, TAN, (k) => [Math.atan(k)], pi],
  ];
  return subplots(rows.map(([title, f, k, color, sols, per]) => {
    const isTan = f === Math.tan;
    const curves = isTan
      ? branchCurves(f, xr, [-pi / 2, pi / 2, 3 * pi / 2, 5 * pi / 2, 7 * pi / 2, 9 * pi / 2],
        { color, stroke: 2, clip: 5 })
      : [curveOf(f, xr, { color, stroke: 2 })];
    const dots = sols(k).flatMap((s) => [-1, 0, 1, 2]
      .map((n) => s + n * per).filter((xs) => xs >= xr[0] && xs <= xr[1])
      .map((xs) => dotAt([xs, k], color, 4)));
    return sw(xr, isTan ? [-5, 5] : [-2, 2], {
      axes: { x: { label: false, ticks: false }, y: { label: 'y' } }, grid: { alpha: 0.3 },
    }).title(title).add(
      ...curves,
      hlineAt(k, { color: HL, stroke: 1.5, dash: [6, 4] }),        // y = k
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...dots,                                                     // 주기해 = 곡선 ∩ y=k
      legendAt([5 * pi, isTan ? 4.2 : 1.78], `y = ${k.toFixed(2)}`, HL, { anchor: 'end' }),
    );
  }), { cols: 1, tight: true, title: 'Trig Equations — Periodic Solutions' });
}

// ── 5. 바이어슈트라스 치환 ──
//   단위원의 점 P 를 (−1,0) 에서 이은 직선이 x=0 과 만나는 높이가 t = tan(x/2).
function weierstrassSubstitution() {
  const ang = 50, p = onCircle(1, ang), tv = Math.tan(rad(ang) / 2);
  return s2([-1.8, 2.5], [-1.8, 1.8], OFF).title('t = tan(x/2)').add(
    circleAt([0, 0], 1, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    dotAt(p, SIN, 7),
    labelAt([p[0] + 0.05, p[1] + 0.12], 'P = (cos 50°, sin 50°)', { color: SIN, font: 10, box: BOX }),
    dotAt([-1, 0], FG, 6),
    labelAt([-1.3, -0.15], '(−1, 0)', { font: 12, box: BOX }),
    segAt([-1, 0], [0, tv], { color: TAN, stroke: 2, dash: [6, 4] }),
    dotAt([0, tv], TAN, 7),
    labelAt([0.08, tv + 0.12], `t = tan(x/2) = ${tv.toFixed(2)}`,
      { color: TAN, font: 13, bold: true, box: BOX }),
    arcAt([1, 0], p, 0.35, { color: HL, stroke: 2 }),
    labelAt([0.22, 0.08], 'x', { font: 16, box: BOX }),
  ).compile();
}

// ── 6. 부등식의 해 = 부채꼴 (1×3) ──
//   mpl 의 ax.fill(cos t, sin t) 를 polygon(원점 + 호 표본) 으로 그대로 옮긴다.
function trigInequalities() {
  const r = 1.2;
  const panel = (title, color, fills, extra) => s2p([-1.5, 1.5], [-1.5, 1.5], THREE,
    { equal: true, ...OFF }).title(title).add(
    circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 0.5 }),
    vlineAt(0, { color: GRAY, stroke: 0.5 }),
    ...fills.map((pts) => polyAt([[0, 0], ...pts], color, 0.15)),
    ...extra,
  );
  return subplots([
    panel('sin x > 1/2', SIN, [arcSamples(r, 30, 150)], [
      hlineAt(0.5, { color: SIN, stroke: 1.5, dash: [6, 4] }),
    ]),
    panel('cos x ≤ −√2/2', COS, [arcSamples(r, 135, 225)], [
      vlineAt(-Math.SQRT2 / 2, { color: COS, stroke: 1.5, dash: [6, 4] }),
    ]),
    panel('tan x > 1', TAN, [arcSamples(r, 45, 89.5), arcSamples(r, 225, 269.5)], [
      segAt([1, 0], [1, r], { color: TAN, stroke: 1.5, dash: [6, 4] }),   // x = 1 (tan=1)
    ]),
  ], { cols: 3, tight: true });
}

// ── 7. 오일러 공식 ──
//   e^{iθ} = cos θ + i sin θ — 실부/허부가 그대로 좌표.
function eulerFormulaComplex() {
  const r = 1.8, p = onCircle(r, 50);
  return s2([-2.2, 2.2], [-2.2, 2.2], OFF).title('e^(iθ) = cos θ + i sin θ').add(
    circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
    hlineAt(0, { color: GRAY, stroke: 1 }),
    vlineAt(0, { color: GRAY, stroke: 1 }),
    labelAt([2.0, 0.05], 'Re', { color: '#555555', font: 16 }),
    labelAt([0.05, 2.0], 'Im', { color: '#555555', font: 16 }),
    arrowAt([0, 0], p, { color: FG, stroke: 2.5 }),
    dotAt(p, FG, 6),
    segAt([p[0], 0], p, { color: SIN, stroke: 2, dash: [6, 4] }),      // sin θ (세로)
    segAt([0, p[1]], p, { color: COS, stroke: 2, dash: [6, 4] }),      // cos θ (가로)
    dotAt([p[0], 0], COS, 4),
    dotAt([0, p[1]], SIN, 4),
    labelAt([p[0] / 2, -0.12], 'cos θ', { color: COS, font: 16, bold: true, anchor: 'middle', box: BOX }),
    labelAt([-0.12, p[1] / 2], 'sin θ',
      { color: SIN, font: 16, bold: true, rotate: 90, anchor: 'middle', box: BOX }),
    arcAt([1, 0], p, 0.35, { color: HL, stroke: 2 }),
    labelAt([0.22, 0.07], 'θ', { font: 18, bold: true, box: BOX }),
  ).compile();
}

// ── 8. 체비쇼프 다항식 ──
//   T_n(x) = cos(n · arccos x) — n=1…5 를 한 화면에.
function chebyshevPolynomials() {
  const cs = [SIN, COS, TAN, CSC, SEC];
  return s2p([-1.05, 1.05], [-1.3, 1.3], SQ, { axes: AX('x', 'T_n(x)'), grid: { alpha: 0.3 } })
    .title('Chebyshev T_n(x)').add(
      ...cs.map((c, i) => curveOf((x) => Math.cos((i + 1) * Math.acos(x)), [-1, 1],
        { color: c, stroke: 2, n: 240 })),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      hlineAt(1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      hlineAt(-1, { color: GRAY, stroke: 0.5, dash: [2, 2] }),
      ...cs.map((c, i) => legendAt([0.78, -0.95 + i * 0.16], `T_${i + 1}(x)`, c, { font: 10 })),
    ).compile();
}

// ── 9. 삼각법으로 푼 삼차방정식 (1×2) ──
//   x³−3x−1 = 0 의 세 근 = 2cos(π/9), 2cos(7π/9), 2cos(13π/9) — 단위원 위 세 점.
function cubicTrigonometric() {
  const angles = [pi / 9, (7 * pi) / 9, (13 * pi) / 9];
  const roots = angles.map((a) => 2 * Math.cos(a));
  const cs = [SIN, COS, TAN];
  const xr = [-2.5, 2.5];
  const left = s2p(xr, [-4, 4], TWO, { axes: AX('x', 'f(x)'), grid: { alpha: 0.3 } })
    .title('x³ − 3x − 1 = 0').add(
      curveOf((x) => x ** 3 - 3 * x - 1, xr, { color: FG, stroke: 2, n: 200 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...roots.map((r) => dotAt([r, 0], SIN, 6)),
      legendAt([2.4, 3.5], 'f(x) = x³ − 3x − 1', FG, { anchor: 'end', font: 11 }),
    );
  const r = 1.2;
  const right = s2p([-1.5, 1.5], [-1.5, 1.5], TWO, { equal: true, ...OFF })
    .title('3 Roots on Unit Circle').add(
      circleAt([0, 0], r, { color: CIRC, stroke: 1.5 }),
      hlineAt(0, { color: GRAY, stroke: 0.5 }),
      vlineAt(0, { color: GRAY, stroke: 0.5 }),
      ...angles.flatMap((a, i) => {
        const q = [r * Math.cos(a), r * Math.sin(a)];
        return [
          segAt([0, 0], q, { color: cs[i], stroke: 2 }),
          dotAt(q, cs[i], 6),
          labelAt([q[0] * 1.2, q[1] * 1.25], roots[i].toFixed(2),
            { color: cs[i], font: 10, bold: true, anchor: 'middle', box: BOX }),
        ];
      }),
    );
  return subplots([left, right], { cols: 2, tight: true, title: 'Cubic via Trigonometry' });
}

// ── 10. 푸리에: 사각파 (3×1) ──
//   4/π Σ sin(nx)/n (홀수 n) — 항이 늘수록 사각파에 수렴한다.
function fourierSeries() {
  const xr = [-pi, 3 * pi];
  const partial = (x, terms) => {
    let y = 0;
    for (let n = 1; n < terms * 2; n += 2) y += ((4 / pi) * Math.sin(n * x)) / n;
    return y;
  };
  const square = (x) => ((((x % (2 * pi)) + 2 * pi) % (2 * pi)) < pi ? 1 : -1);
  return subplots([[1, '1 term'], [3, '3 terms'], [10, '10 terms']].map(([N, title], i) =>
    sw(xr, [-1.8, 1.8], {
      axes: { x: { label: i === 2 ? 'x' : false, ticks: false }, y: { label: 'f(x)' } },
      grid: { alpha: 0.3 },
    }).title(title).add(
      curveOf((x) => partial(x, N), xr, { color: SIN, stroke: 1.5, n: 600 }),
      curveOf(square, xr, { color: GRAY, stroke: 1, dash: [6, 5], opacity: 0.5, n: 600 }),
      ...(i === 2 ? [-1, 0, 1, 2, 3].map((k) => piTickAt(xr, k, -1.62, { font: 10 })) : []),
    )), { cols: 1, tight: true, title: 'Fourier: Square Wave' });
}

// ── 11. 항등식 계보 ──
//   오일러 공식에서 파생되는 항등식들의 관계도 ← annotate('', arrowprops=…arc3,rad=0.1).
function identityFamilyTree() {
  const nodes = [
    ['euler', 5, 6.2, "Euler's Formula\ne^(iθ) = cos θ + i sin θ", '#2c3e50', '#fef9e7'],
    ['sum', 3, 4.5, 'Sum/Difference\nsin(A ± B)', '#c0392b', '#fadbd8'],
    ['double', 1, 3.0, 'Double-Angle\nsin 2θ', '#e67e22', '#fdebd0'],
    ['power', 1, 1.5, 'Power-Reduction\nsin²θ', '#27ae60', '#d5f5e3'],
    ['harmonic', 8, 4.5, 'Harmonic Add\na sin x + b cos x', '#2980b9', '#d6eaf8'],
    ['prodsum', 5, 3.0, 'Product ↔ Sum\nsin A cos B', '#8e44ad', '#e8daef'],
    ['chebyshev', 8, 3.0, 'Chebyshev\nT_n(cos θ)', '#16a085', '#d1f2eb'],
    ['weierstrass', 8, 1.5, 'Weierstrass\nt = tan(x/2)', '#e74c3c', '#fadbd8'],
  ];
  const edges = [['euler', 'sum'], ['sum', 'double'], ['double', 'power'], ['euler', 'harmonic'],
    ['sum', 'prodsum'], ['double', 'chebyshev'], ['harmonic', 'weierstrass']];
  const at = (k) => nodes.find((n) => n[0] === k);
  return s2p([0, 10], [0, 7], [700, 480], OFF).title('Identity Connections').add(
    ...edges.map(([s, d]) => {
      const a = at(s), b = at(d);
      return arrowAt([a[1], a[2] - 0.2], [b[1], b[2] - 0.2],
        { color: GRAY, stroke: 1.5, bend: 0.1 });
    }),
    ...nodes.map(([, x, y, label, tc, bc]) => labelAt([x, y], label,
      { color: tc, font: 12, bold: true, anchor: 'middle', box: { facecolor: bc, alpha: 0.9 } })),
  ).compile();
}

// ── 12. 사인법칙 · 코사인법칙 (1×2) ──
function lawOfSinesCosines() {
  const tri = (pts, color) => [
    polyAt(pts, color, 0.08),
    segAt(pts[0], pts[1], { color: FG, stroke: 2 }),
    segAt(pts[1], pts[2], { color: FG, stroke: 2 }),
    segAt(pts[2], pts[0], { color: FG, stroke: 2 }),
    ...pts.map((q) => dotAt(q, FG, 5)),
  ];
  const label = (at, txt, color) => labelAt(at, txt,
    { color, font: color ? 16 : 18, bold: true, anchor: color ? 'middle' : undefined });
  const left = s2p([-0.8, 5.8], [-0.8, 4.2], TWO, { equal: true, ...OFF }).title('Law of Sines').add(
    ...tri([[0, 0], [5, 0], [2, 3.5]], SIN),
    label([-0.35, -0.3], 'A'), label([5.1, -0.3], 'B'), label([2.1, 3.8], 'C'),
    label([3.7, 1.75], 'a', SIN), label([0.7, 1.85], 'b', COS), label([2.5, -0.25], 'c', TAN),
  );
  const right = s2p([-0.8, 4.8], [-0.8, 3.6], TWO, { equal: true, ...OFF }).title('Law of Cosines').add(
    ...tri([[0, 0], [4, 0], [1.5, 2.8]], COS),
    label([-0.35, -0.3], 'A'), label([4.1, -0.3], 'B'), label([1.6, 3.2], 'C'),
    label([2.95, 1.4], 'a', SIN), label([0.45, 1.5], 'b', COS), label([2, -0.25], 'c', TAN),
    segAt([1.5, 0], [1.5, 2.8], { color: GRAY, stroke: 1, dash: [5, 4] }),        // 높이 h
    segAt([1.35, 0], [1.35, 0.15], { color: GRAY, stroke: 1 }),                  // 직각 표시
    segAt([1.35, 0.15], [1.5, 0.15], { color: GRAY, stroke: 1 }),
  );
  return subplots([left, right], { cols: 2, tight: true });
}

// ── run ─────────────────────────────────────────────────────────
//   figure 팩토리 목록 → SVG/PNG 저장 + index.html 갤러리(11A / 11B 각각).
//   (한 figure 가 실패해도 나머지는 계속 진행하고 마지막에 요약을 출력한다.)
const figsA = [
  ['11a1-radian-definition', radianDefinition, '라디안의 정의'],
  ['11a2-degree-radian-circle', degreeRadianCircle, '도 ↔ 라디안 환산 원'],
  ['11a3-unit-circle-cos-sin', unitCircleCosSin, '단위원의 cos · sin'],
  ['11a4-special-angles-unit-circle', specialAngles, '특수각 5개'],
  ['11a5-reference-angles-astc', referenceAnglesAstc, '기준각 + ASTC'],
  ['11a6-sin-cos-graphs', sinCosGraphs, '단위원 투영 → 파형 (2×2)'],
  ['11a7-tan-graph', tanGraph, 'tan = 기울기 + 그래프'],
  ['11a8-csc-sec-cot-graphs', cscSecCotGraphs, 'csc · sec · cot (3×1)'],
  ['11a9-sin-cos-tan', unitCircleSinCosTan, '단위원 위 sin · cos · tan'],
  ['11a9-csc-sec-cot', unitCircleCscSecCot, '단위원 위 csc · sec · cot'],
  ['11a10-trig-transformations', trigTransformations, '변환 5단계 (5×1)'],
  ['11a11-arcsin-graph', arcsinGraph, 'arcsin'],
  ['11a12-arccos-graph', arccosGraph, 'arccos'],
  ['11a13-arctan-graph', arctanGraph, 'arctan'],
  ['11a14-arcsin-composition', arcsinComposition, 'arcsin(sin θ)'],
  ['11a15-unit-circle-to-sine-unwrap', unitCircleToSineUnwrap, '단위원 → 사인파'],
  ['11a16-cos-arcsin', () => rightTriangle(
    { title: 'cos(arcsin 3/5)', val: 3 / 5, scale: 5, mode: 'arcsin', color: SIN }),
  'cos(arcsin 3/5)'],
  ['11a16-tan-arccos', () => rightTriangle(
    { title: 'tan(arccos −5/13)', val: -5 / 13, scale: 13, mode: 'arccos', color: COS }),
  'tan(arccos −5/13)'],
  ['11a16-sin-arctan', () => rightTriangle(
    { title: 'sin(arctan 3/4)', val: 3 / 4, scale: 4, mode: 'arctan', color: TAN }),
  'sin(arctan 3/4)'],
];

const figsB = [
  ['11b1-sum-formula-geometric', sumFormulaGeometric, '합공식의 기하'],
  ['11b2-harmonic-addition', harmonicAddition, '조화합성 a sin x + b cos x'],
  ['11b3-sum-product-waves', beatPatterns, '맥놀이와 포락선 (3×1)'],
  ['11b4-trig-equation-solutions', trigEquationSolutions, '주기해 (3×1)'],
  ['11b5-weierstrass-substitution', weierstrassSubstitution, 't = tan(x/2)'],
  ['11b6-trig-inequalities', trigInequalities, '부등식의 해 = 부채꼴 (1×3)'],
  ['11b7-euler-formula-complex', eulerFormulaComplex, '오일러 공식'],
  ['11b8-chebyshev-polynomials', chebyshevPolynomials, '체비쇼프 T_n(x)'],
  ['11b9-cubic-trigonometric', cubicTrigonometric, 'x³−3x−1 의 3근'],
  ['11b10-fourier-series', fourierSeries, '푸리에 사각파 (3×1)'],
  ['11b11-identity-family-tree', identityFamilyTree, '항등식 계보'],
  ['11b12-law-of-sines-cosines', lawOfSinesCosines, '사인법칙 / 코사인법칙'],
];

await saveFigures(figsA, {
  dir: OUT_A, index: true, title: 'logos · 11A — 삼각함수 (example5.py 재현)',
});
await saveFigures(figsB, {
  dir: OUT_B, index: true, title: 'logos · 11B — 삼각함수 심화 (example5.py 재현)',
});
