// examples/mpl_parity_9b.js — example1.py (Session 9B · 2D 기하) 재현 — logos 만 사용
//
// ── 무엇을 하는가 ────────────────────────────────────────────────
//   matplotlib 로 그린 2D 기하 교재 그림 25개(Session 9B)를 logos DSL **만으로**
//   같은 구성으로 다시 그린다. "logos 가 matplotlib 급 그림을 실제로 커버하는가" 를
//   눈과 기계(불변식 테스트/스냅샷)로 확인하는 **대표 예제 1** 이다.
//
// ── 실행 ────────────────────────────────────────────────────────
//   node examples/mpl_parity_9b.js   →  output/parity9b/*.svg + *.png + index.html
//   npm run parity9b                 (동일)
//
// ── 공용 헬퍼 (logos/kit.js) ────────────────────────────────────
//   plot2d(xr, yr)        view + grid + axes 가 켜진 2D 씬 프리셋
//   subplots(figs, opts)  씬들을 패널로 합성 (셀 크기는 첫 씬 `.size()` 에서 자동)
//   saveFigures(figs, o)  SVG/PNG 저장 + index.html 갤러리 + 진행 로그
//   seg(A, B, opts)       두 점을 지나는 선 (2D 직선 / 3D 선분 자동 분기)
//   palette               matplotlib 한 글자 색 코드('b','r',…)를 hex 로 고정
//
// ── figure 목록 ─────────────────────────────────────────────────
//    1 five-forms           ①–⑤ 직선의 다섯 가지 표현 (2×3)
//    2 step-line-forms      직선 작도 3단계
//    3 parallel-perpendicular  평행·수직 조건
//    4 angle-between-lines  두 직선 사이의 각
//    5 midpoint-division    중점 · 내분점 · 무게중심
//    6 point-line-distance  점-직선 거리 유도 3단계
//    7 step-distance-line   점-직선 거리 3단계
//    8 two-lines-distance   평행한 두 직선의 거리
//    9 point-circle-distance  점-원 거리
//   10 tangent-lines-circle 원의 접선
//   11 circle-details       원: 표준형 ↔ 일반형
//   12 step-conic-circle    원 작도 3단계
//   13 ellipse-details      타원의 특징과 정의
//   14 step-conic-ellipse   타원 작도 3단계
//   15 parabola-details     포물선: 초점 · 준선
//   16 step-conic-parabola  포물선 작도 3단계
//   17 hyperbola-details    쌍곡선의 특징과 정의
//   18 step-conic-hyperbola 쌍곡선 작도 3단계
//   19 conic-identification 원뿔곡선 판별 순서도
//   20 conic-comparison     4종 원뿔곡선 비교 (2×2)
//   21 parametric-motion    매개곡선 모음 (2×2)
//   22 step-parametric      매개곡선 작도 (2×3)
//   23 triangle-area-coordinates  삼각형 넓이 (신발끈)
//   24 area-polygon         다각형 넓이 (신발끈)
//   25 point-reflection     직선에 대한 점의 대칭
//
// ── 참고 ────────────────────────────────────────────────────────
//   · `panels()` 는 컴파일된 SceneIR 만 받으므로 `subplots()` 가 자동 컴파일한다.
//   · 색은 전부 palette 의 hex 로 고정 — 렌더러(브라우저/resvg)에 무관하게 동일.
import { join } from 'node:path';
import {
  scene,
  point,
  line,
  circle,
  ellipse,
  parabola,
  hyperbola,
  curve,
  polygon,
  triangle,
  region,
  annotate,
  tex,
  pi,
  tau,
  kit,
} from '../index.js';

const OUT = join(import.meta.dirname, '..', 'output', 'parity9b');

// 색 팔레트 (matplotlib 'b','r','g','m','orange',…) — kit.palette 에서 한 글자 이름만 벗겨 온다.
const {
  blue: B,
  red: R,
  green: G,
  magenta: M,
  orangead: OR,
  gray: GRAY,
  navy: NAVY,
  purple: PURPLE,
  darkgreen: DGREEN,
} = kit.palette;
const { plot2d, subplots, saveFigures, seg } = kit;

// 신발끈 공식 등에서 쓰는 "점 배열 → 다각형" 단축
const polygonOf = (pts) => polygon(...pts);

// ── 1. The Five Forms of a Line (2×3) ──
function lineForms() {
  const mk = (title) =>
    plot2d([-1, 7], [-1.5, 3.5])
      .title(title)
      .add(
        line
          .slopeIntercept(-2 / 3, 2)
          .color(B)
          .stroke(2.5),
        point(3, 0).marker('circle').color(R).size(5),
        point(0, 2).marker('circle').color(R).size(5),
      );
  const last = plot2d([-1, 7], [-1.5, 3.5])
    .title('All Five Forms')
    .add(annotate.text(point(3, 1)).label('2x + 3y = 6').anchor('middle').font(18).bold().color(NAVY));
  return subplots(
    [
      mk('① Slope-Intercept  y = -⅔x + 2'),
      mk('② Point-Slope  y = -⅔(x-3)'),
      mk('③ Two-Point'),
      mk('④ Intercept  x/3 + y/2 = 1'),
      mk('⑤ General  2x + 3y - 6 = 0'),
      last,
    ],
    { cols: 3, title: 'The Five Forms of a Line', tight: true },
  );
}

// ── 2. Building a Line — Step by Step (1×3) ──
function stepLineForms() {
  const l = () =>
    line
      .slopeIntercept(3 / 4, -0.5)
      .color(B)
      .stroke(2.5);
  const t = (title, extra = []) =>
    plot2d([-0.5, 7], [-1.5, 5])
      .title(title)
      .add(l(), point(2, 1).marker('circle').color(R).size(6), ...extra);
  return subplots(
    [
      t('Step 1: Plot (2,1) + slope 3/4'),
      t('Step 2: Draw the line', [
        point(6, 4).marker('circle').color(R).size(6),
        annotate.arrow(point(2, 1), point(6, 4)).color(G),
      ]),
      t('Step 3: All five forms', [
        point(6, 4).marker('circle').color(R).size(6),
        annotate.arrow(point(2, 1), point(6, 4)).color(G),
        annotate.text(point(4, 2.8)).label('y = ¾x − ½').color(NAVY).font(11),
        annotate.text(point(4, 1.6)).label('3x − 4y − 2 = 0').color(DGREEN).font(11),
      ]),
    ],
    { cols: 3, title: 'Building a Line — Step by Step', tight: true },
  );
}

// ── 3. Parallel & Perpendicular (1×2) ──
function parallelPerp() {
  const p1 = plot2d([-3, 3], [-6, 6])
    .equal()
    .title('Parallel: m₁ = m₂ = 2')
    .legend()
    .add(
      line
        .slopeIntercept(2, 1)
        .color(B)
        .stroke(2.5)
        .label(tex`y=2x+1`),
      line
        .slopeIntercept(2, -5)
        .color(R)
        .stroke(2.5)
        .dash([6, 4])
        .label(tex`y=2x-5`),
    );
  const p2 = plot2d([-3, 3], [-3, 3])
    .equal()
    .title('Perpendicular: m₁m₂ = -1')
    .legend()
    .add(
      line
        .slopeIntercept(2 / 3, 0)
        .color(B)
        .stroke(2.5)
        .label(tex`y=\tfrac{2}{3}x`),
      line
        .slopeIntercept(-3 / 2, 0)
        .color(R)
        .stroke(2.5)
        .dash([6, 4])
        .label(tex`y=-\tfrac{3}{2}x`),
      annotate.text(point(0.6, 0.4)).label('90°').color(PURPLE).font(15),
    );
  return subplots([p1, p2], { cols: 2, title: 'Parallel and Perpendicular Lines', tight: true });
}

// ── 4. Angle Between Two Lines ──
function angleBetweenLines() {
  return plot2d([-2, 3], [-1, 6])
    .title('Angle Between Two Lines')
    .grid({ alpha: 0.3 })
    .xlabel(tex`x`)
    .ylabel(tex`y`)
    .legend('lower right')
    .add(
      line
        .slopeIntercept(2, 0)
        .color(B)
        .stroke(2.5)
        .label(tex`y=2x\ (m_1=2)`),
      line
        .slopeIntercept(-1 / 3, 0)
        .color(R)
        .stroke(2.5)
        .label(tex`y=-\tfrac{1}{3}x\ (m_2=-\tfrac{1}{3})`),
      annotate.angle(point(1, 2), point(0, 0), point(3, -1)).arc({ radius: 0.8 }).color(PURPLE),
      annotate.text(point(0.9, 0.5)).label('φ ≈ 81.9°').color(PURPLE).font(14).bold(),
    )
    .compile();
}

// ── 5. Midpoint & Section Formula (1×2) ──
function midpointDivision() {
  const p1 = plot2d([0, 10], [-3, 7])
    .grid({ alpha: 0.3 })
    .title('Midpoint')
    .add(
      seg(point(2, 5), point(8, -1), { color: B }),
      point(2, 5).marker('circle').color(B).size(5),
      point(8, -1).marker('circle').color(B).size(5),
      point(5, 2).marker('square').color(R).size(6),
      annotate.text(point(2, 5)).label('(2,5)').offset(-40, 10).font(11),
      annotate.text(point(8, -1)).label('(8,−1)').offset(6, -14).font(11),
      annotate.text(point(5, 2)).label('M(5,2)').offset(8, 10).color(R).bold().font(11),
    );
  const C = point(11 / 3, 5 / 3);
  const tri = triangle(point(0, 0), point(8, 0), point(3, 5));
  const p2 = plot2d([-1, 10], [-1, 9])
    .grid({ alpha: 0.3 })
    .title('Section Formula & Centroid')
    .add(
      seg(point(1, 2), point(7, 8), { color: B }),
      point(1, 2).marker('circle').color(B).size(5),
      point(7, 8).marker('circle').color(B).size(5),
      point(5, 6).marker('square').color(R).size(6),
      tri.fill(G).opacity(0.08),
      tri.color(G).stroke(1.5).opacity(0.6),
      C.marker('star').color(G).size(8),
      annotate.text(point(1, 2)).label('(1,2)').offset(-40, 4).font(11),
      annotate.text(point(7, 8)).label('(7,8)').offset(6, 4).font(11),
      annotate.text(point(5, 6)).label('2:1 point\n(5,6)').offset(8, -14).color(R).bold().font(11),
      annotate.text(C).label('Centroid\n(11/3, 5/3)').offset(8, -14).color(G).font(10),
    );
  return subplots([p1, p2], { cols: 2, title: 'Midpoint and Section Formula', tight: true });
}

// ── 6. Deriving Point-to-Line Distance (1×3) ──
function pointLineDistance() {
  const L = () =>
    line
      .slopeIntercept(-3 / 4, 10 / 4)
      .color(B)
      .stroke(2.5);
  const P = () => point(3, 4).marker('circle').color(R).size(6);
  const t = (title, extra = []) =>
    plot2d([-1, 5], [-0.5, 5.5])
      .grid({ alpha: 0.3 })
      .title(title)
      .xlabel(tex`x`)
      .ylabel(tex`y`)
      .add(L(), P(), ...extra);
  return subplots(
    [
      t('Step 1: Perpendicular shortest path', [annotate.arrow(point(3, 4), point(2.1, 2.8)).color(R)]),
      t('Step 2: Normal vector n=(3,4)', [
        annotate.arrow(point(3, 4), point(2.1, 2.8)).color(R),
        annotate.arrow(point(1.5, 2), point(4.5, 6)).color(G),
        annotate.text(point(4.6, 4.2)).label('n=(3,4)').color(G).font(10),
      ]),
      t('Step 3: Distance = 3', [
        annotate.arrow(point(3, 4), point(1.2, 1.6)).color(R),
        annotate.text(point(2.0, 3.0)).label('d=3').color(R).bold().font(13),
      ]),
    ],
    { cols: 3, title: 'Deriving Point-to-Line Distance', tight: true },
  );
}

// ── 7. Point to Line Distance — Step by Step (1×3) ──
function stepDistanceLine() {
  const L = () =>
    line
      .slopeIntercept(-3 / 4, 10 / 4)
      .color(B)
      .stroke(2.5)
      .label(tex`3x+4y=10`);
  const P = () => point(3, 4).marker('circle').color(R).size(6);
  const t = (title, extra = []) =>
    plot2d([-1, 5], [-0.5, 5.5])
      .grid({ alpha: 0.3 })
      .title(title)
      .add(L(), P(), ...extra);
  return subplots(
    [
      t('Step 1: Point & Line'),
      t('Step 2: Perpendicular', [annotate.arrow(point(3, 4), point(1.2, 1.6)).color(R).stroke(2)]),
      t('Step 3: d=15/5=3', [
        annotate.arrow(point(3, 4), point(1.2, 1.6)).color(R).stroke(2),
        point(1.2, 1.6).marker('circle').color(G).size(5),
        annotate.text(point(2.1, 3.0)).label('d = 3').color(R).bold().font(14),
        annotate.text(point(0.4, 1.0)).label('foot (1.2, 1.6)').color(DGREEN).font(10),
      ]),
    ],
    { cols: 3, title: 'Point to Line Distance — Step by Step', tight: true },
  );
}

// ── 8. Distance Between Two Parallel Lines ──
function twoLinesDistance() {
  return plot2d([-8, 6], [-4, 5])
    .grid({ alpha: 0.3 })
    .title('Distance Between Two Parallel Lines')
    .legend('lower right')
    .add(
      line
        .slopeIntercept(-3 / 4, 5 / 4)
        .color(B)
        .stroke(2.5)
        .label(tex`3x+4y-5=0`),
      line
        .slopeIntercept(-3 / 4, -15 / 4)
        .color(R)
        .stroke(2.5)
        .label(tex`3x+4y+15=0`),
      annotate.arrow(point(0, 1.25), point(-2.4, -1.95)).color(G).stroke(2).label('d = 4'),
    )
    .compile();
}

// ── 9. Distance: Point to Circle ──
function pointCircleDistance() {
  return plot2d([-3, 8], [-4, 4])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Distance from a Point to a Circle')
    .add(
      circle.center(point(3, 0)).radius(2).color(B).stroke(2.5),
      point(7, 0).marker('circle').color(R).size(6),
      point(5, 0).marker('circle').color(G).size(5),
      annotate.text(point(7, 0)).label('P').offset(8, 8).color(R).font(12),
      annotate.text(point(2, 2.8)).label('x²+y²−6x+5=0').color(NAVY).font(11),
      annotate.text(point(5, -1.4)).label('d = 7 − (2+3) = 2').color(DGREEN).font(11).bold(),
    )
    .compile();
}

// ── 10. Tangent Lines from External Point ──
function tangentLinesCircle() {
  const m = 2 / Math.sqrt(21);
  return plot2d([-3, 7], [-5, 5])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Tangent Lines from External Point to Circle  x²+y²=4, P(5,0)')
    .add(
      circle.center(point(0, 0)).radius(2).color(B).stroke(2.5),
      line
        .slopeIntercept(m, -5 * m)
        .color(R)
        .stroke(1.8),
      line
        .slopeIntercept(-m, 5 * m)
        .color(R)
        .stroke(1.8),
      point(5, 0).marker('circle').color(R).size(6),
      annotate.text(point(5, 0)).label('P(5,0)').offset(-8, -18).anchor('end').color(R).font(11),
      annotate.text(point(2.6, 3.0)).label('tangent').rotate(23).color(R).font(10),
      annotate.text(point(2.6, -3.2)).label('tangent').rotate(-23).color(R).font(10),
    )
    .compile();
}

// ── 11. Circle — Standard & General Form (1×2) ──
function circleDetails() {
  const p1 = plot2d([-3, 9], [-8, 4])
    .equal()
    .grid({ alpha: 0.3 })
    .title('x²+y²−6x+4y−3=0')
    .add(
      circle.center(point(3, -2)).radius(4).color(B).stroke(2.5),
      point(3, -2).marker('circle').color(R).size(7),
      seg(point(3, -2), point(7, -2), { color: G, stroke: 1.5 }).dash([5, 4]),
      seg(point(3, -2), point(-1, -2), { color: G, stroke: 1.5 }).dash([5, 4]),
      annotate.text(point(3, -2)).label('C(3,−2)').offset(8, 10).color(R).bold().font(11),
      annotate.text(point(5.4, 1)).label('R=4').color(B).bold().font(12),
    );
  const txt =
    'General Form:\nx²+y²−6x+4y−3=0\n\nStep 1: Group\n(x²−6x)+(y²+4y)=3\n\nStep 2: Complete squares\n(x²−6x+9)+(y²+4y+4)=16\n\nStep 3: Standard form\n(x−3)²+(y+2)²=16';
  const p2 = scene()
    .view([0, 10], [0, 10])
    .title('Completing the Square')
    .add(annotate.text(point(0.6, 9)).label(txt).font(12).box({ facecolor: '#f0f0f0', alpha: 0.9 }));
  return subplots([p1, p2], { cols: 2, title: 'Circle — Standard Form and General Form', tight: true });
}

// ── 12. Building a Circle — Step by Step (1×3) ──
function stepConicCircle() {
  const samples = [0, 1, 2, 3, 4, 5].map((k) => point.polar(4, (k * Math.PI) / 3).label(''));
  const t = (title, extra = []) =>
    plot2d([-3, 9], [-8, 4])
      .equal()
      .grid({ alpha: 0.3 })
      .title(title)
      .add(
        point(3, -2).marker('circle').color(R).size(7),
        annotate.text(point(3, -2)).label('C(3,−2)').offset(5, 5).bold().font(10),
        ...extra,
      );
  const wrap = (p) =>
    point(p.coords[0] + 3, p.coords[1] - 2)
      .marker('point')
      .color(B)
      .size(6);
  return subplots(
    [
      t('Step 1: Center (h,k)'),
      t('Step 2: Points at distance R', [
        circle.center(point(3, -2)).radius(4).color(B).stroke(2.5),
        ...samples.map(wrap),
      ]),
      t('Step 3: Circle + Features', [
        circle.center(point(3, -2)).radius(4).color(B).stroke(2.5),
        annotate.text(point(5.4, 1)).label('R=4').color(B).bold().font(12),
        annotate.arrow(point(3, -2), point(7, -2)).color(B).stroke(2),
      ]),
    ],
    { cols: 3, title: 'Building a Circle — Step by Step', tight: true },
  );
}

// ── 13. Ellipse — Features & Definition (1×2) ──
function ellipseDetails() {
  const a = 5,
    b = 3,
    c = 4;
  const E = () => ellipse.center(point(0, 0)).semi(a, b).color(B).stroke(2.5);
  const p1 = plot2d([-6, 6], [-4, 4])
    .equal()
    .grid({ alpha: 0.3 })
    .title('x²/25 + y²/9 = 1')
    .add(
      E(),
      point(a, 0).marker('circle').color(R).size(5),
      point(-a, 0).marker('circle').color(R).size(5),
      point(0, b).marker('square').color(G).size(5),
      point(0, -b).marker('square').color(G).size(5),
      point(c, 0).marker('star').color(M).size(8),
      point(-c, 0).marker('star').color(M).size(8),
      annotate.text(point(-c, 0)).label('F₁(−4,0)').offset(-10, -18).color(M).font(10),
      annotate.text(point(c, 0)).label('F₂(4,0)').offset(5, -18).color(M).font(10),
      annotate.text(point(a, 0)).label('V(5,0)').offset(4, 4).color(R).font(10),
    );
  const px = 2,
    py = 2.75;
  const p2 = plot2d([-6, 6], [-5, 4])
    .equal()
    .grid({ alpha: 0.3 })
    .title('PF₁ + PF₂ = 2a (constant)')
    .add(
      E(),
      point(c, 0).marker('star').color(M).size(8),
      point(-c, 0).marker('star').color(M).size(8),
      point(px, py).marker('circle').color(R).size(6),
      seg(point(px, py), point(c, 0), { color: R, stroke: 1 }).dash([4, 3]),
      seg(point(px, py), point(-c, 0), { color: R, stroke: 1 }).dash([4, 3]),
      annotate.text(point(px, py)).label('P').offset(6, 8).font(11),
      annotate
        .text(point(0, -4.5))
        .label('PF₁+PF₂ = 10.1 ≈ 2a = 10')
        .anchor('middle')
        .color(R)
        .bold()
        .font(11)
        .box({ facecolor: 'wheat', alpha: 0.8 }),
    );
  return subplots([p1, p2], { cols: 2, title: 'Ellipse — Features and Geometric Definition', tight: true });
}

// ── 14. Building an Ellipse — Step by Step (1×3) ──
function stepConicEllipse() {
  const a = 5,
    b = 3,
    c = 4;
  const pts = [
    point(a, 0).marker('circle').color(R).size(5),
    point(-a, 0).marker('circle').color(R).size(5),
    point(0, b).marker('square').color(G).size(5),
    point(0, -b).marker('square').color(G).size(5),
  ];
  const foci = [point(c, 0).marker('star').color(M).size(8), point(-c, 0).marker('star').color(M).size(8)];
  const t = (title, extra = []) =>
    plot2d([-7, 7], [-5, 5])
      .equal()
      .grid({ alpha: 0.3 })
      .title(title)
      .add(...pts, ...extra);
  return subplots(
    [
      t('Step 1: Vertices (±a,0), Co-vertices (0,±b)'),
      t('Step 2: Foci (±c,0)', foci),
      t('Step 3: Trace ellipse', [...foci, ellipse.center(point(0, 0)).semi(a, b).color(B).stroke(2.5)]),
    ],
    { cols: 3, title: 'Building an Ellipse — Step by Step', tight: true },
  );
}

// ── 15. Parabola — Focus, Directrix (1×2) ──
function parabolaDetails() {
  const P1 = parabola.focus(point(2, 1.5)).directrix(line.horizontal(0.5));
  const p1 = plot2d([-0.5, 5], [-0.5, 5])
    .grid({ alpha: 0.3 })
    .title('y = ½(x−2)² + 1')
    .add(
      P1.color(B).stroke(2.5),
      point(2, 1).marker('circle').color(R).size(6),
      point(2, 1.5).marker('star').color(M).size(8),
      line.horizontal(0.5).color(G).stroke(2).dash([6, 4]),
      annotate.text(point(2, 1)).label('Vertex (2,1)').offset(10, 10).color(R).font(10),
      annotate.text(point(2, 1.5)).label('Focus (2,1.5)').offset(10, 4).color(M).font(10),
      annotate.text(point(3.4, 0.6)).label('Directrix y=0.5').color(G).font(10),
    );
  const P2 = parabola.focus(point(0, 1)).directrix(line.horizontal(-1));
  const p2 = plot2d([-3, 4], [-2, 4.5])
    .grid({ alpha: 0.3 })
    .title('PF = distance to directrix')
    .add(
      P2.color(B).stroke(2.5),
      point(0, 1).marker('star').color(M).size(8),
      line.horizontal(-1).color(G).stroke(2).dash([6, 4]),
      point(2, 1).marker('circle').color(R).size(6),
      seg(point(2, 1), point(2, -1), { color: R, stroke: 1.5 }).dash([4, 3]),
      seg(point(2, 1), point(0, 1), { color: R, stroke: 1.5 }).dash([4, 3]),
      annotate.text(point(2, 1)).label('P(2,1)').offset(6, 8).color(R).font(10),
      annotate.text(point(1.0, 2.6)).label('PF = distance\nto directrix').color(R).bold().font(10),
    );
  return subplots([p1, p2], { cols: 2, title: 'Parabola — Focus, Directrix, and Definition', tight: true });
}

// ── 16. Building a Parabola — Step by Step (1×3) ──
function stepConicParabola() {
  const P = () => parabola.focus(point(2, 1.5)).directrix(line.horizontal(0.5));
  const d = () => line.horizontal(0.5).color(G).stroke(2).dash([6, 4]);
  const v = () => point(2, 1).marker('circle').color(R).size(6);
  const f = () => point(2, 1.5).marker('star').color(M).size(8);
  const t = (title, extra = []) =>
    plot2d([-0.5, 5], [-0.5, 5])
      .grid({ alpha: 0.3 })
      .title(title)
      .add(v(), d(), ...extra);
  return subplots(
    [
      t('Step 1: Vertex + Directrix'),
      t('Step 2: Mark Focus at |p|', [f()]),
      t('Step 3: Trace Parabola', [f(), P().color(B).stroke(2.5)]),
    ],
    { cols: 3, title: 'Building a Parabola — Step by Step', tight: true },
  );
}

// ── 17. Hyperbola — Features & Definition (1×2) ──
function hyperbolaDetails() {
  const a = 3,
    b = 2,
    c = Math.sqrt(a * a + b * b);
  const H = () => hyperbola.center(point(0, 0)).semi(a, b).color(B).stroke(2.5);
  const asym = () => [
    line
      .slopeIntercept(b / a, 0)
      .color(OR)
      .stroke(1.5)
      .dash([6, 4]),
    line
      .slopeIntercept(-b / a, 0)
      .color(OR)
      .stroke(1.5)
      .dash([6, 4]),
  ];
  const p1 = plot2d([-8, 8], [-6, 6])
    .equal()
    .grid({ alpha: 0.3 })
    .title('x²/9 − y²/4 = 1')
    .add(
      H(),
      ...asym(),
      point(a, 0).marker('circle').color(R).size(5),
      point(-a, 0).marker('circle').color(R).size(5),
      point(c, 0).marker('star').color(M).size(8),
      point(-c, 0).marker('star').color(M).size(8),
      annotate.text(point(a, 0)).label('V(3,0)').offset(4, -14).color(R).font(10),
      annotate.text(point(c, 0)).label('F(√13,0)').offset(4, 8).color(M).font(10),
      annotate.text(point(5, 3.4)).label('y = ±⅔x').color(OR).font(10),
    );
  const px = 4,
    py = b * Math.sqrt((px / a) ** 2 - 1);
  const p2 = plot2d([-8, 8], [-6, 6])
    .equal()
    .grid({ alpha: 0.3 })
    .title('|PF₁ − PF₂| = 2a')
    .add(
      H(),
      point(c, 0).marker('star').color(M).size(8),
      point(-c, 0).marker('star').color(M).size(8),
      point(px, py).marker('circle').color(R).size(6),
      seg(point(px, py), point(c, 0), { color: R, stroke: 1 }).dash([4, 3]),
      seg(point(px, py), point(-c, 0), { color: R, stroke: 1 }).dash([4, 3]),
      annotate
        .text(point(0, -5))
        .label('|PF₁−PF₂| = 6 ≈ 2a = 6')
        .anchor('middle')
        .color(R)
        .bold()
        .font(11)
        .box({ facecolor: 'wheat', alpha: 0.8 }),
    );
  return subplots([p1, p2], { cols: 2, title: 'Hyperbola — Features and Geometric Definition', tight: true });
}

// ── 18. Building a Hyperbola — Step by Step (1×3) ──
function stepConicHyperbola() {
  const a = 3,
    b = 2,
    c = Math.sqrt(a * a + b * b);
  const asym = () => [
    line
      .slopeIntercept(b / a, 0)
      .color(OR)
      .stroke(1.5)
      .dash([6, 4]),
    line
      .slopeIntercept(-b / a, 0)
      .color(OR)
      .stroke(1.5)
      .dash([6, 4]),
  ];
  const rect = () => region.barH(-b, b, -a, a).fill('none').color(GRAY).stroke(1).opacity(1);
  const verts = () => [point(a, 0).marker('circle').color(R).size(5), point(-a, 0).marker('circle').color(R).size(5)];
  const foci = () => [point(c, 0).marker('star').color(M).size(8), point(-c, 0).marker('star').color(M).size(8)];
  const t = (title, extra = []) =>
    plot2d([-7, 7], [-5, 5])
      .equal()
      .grid({ alpha: 0.3 })
      .title(title)
      .add(...asym(), ...extra);
  return subplots(
    [
      t('Step 1: Rectangle (±a,±b) + Asymptotes', [rect()]),
      t('Step 2: Vertices (±a,0), Foci (±c,0)', [...verts(), ...foci()]),
      t('Step 3: Trace Hyperbola', [
        ...verts(),
        ...foci(),
        hyperbola.center(point(0, 0)).semi(a, b).color(B).stroke(2.5),
      ]),
    ],
    { cols: 3, title: 'Building a Hyperbola — Step by Step', tight: true },
  );
}

// ── 19. Conic Identification (flowchart) ──
function conicIdentification() {
  const box = (x, y, t, fc) =>
    annotate
      .text(point(x, y))
      .label(t)
      .anchor('middle')
      .font(13)
      .box({ facecolor: fc || '#e8e8e8', alpha: 0.95 });
  const arrow = (x1, y1, x2, y2) => annotate.arrow(point(x1, y1), point(x2, y2)).color('#444444').stroke(1.4);
  return scene()
    .view([0, 10], [0, 10])
    .title('Conic Identification')
    .add(
      box(5, 9, 'Ax²+Bxy+Cy²+Dx+Ey+F=0', '#dbe9ff'),
      arrow(5, 8.5, 5, 8.1),
      box(5, 7.6, 'Discriminant   B² − 4AC', '#eeeeee'),
      arrow(3.4, 7.1, 2.2, 6.2),
      arrow(6.6, 7.1, 7.8, 6.2),
      box(2, 5.8, 'B²−4AC < 0\nCircle / Ellipse', '#e6f5e6'),
      box(8, 5.8, 'B²−4AC = 0\nParabola', '#fff3d6'),
      box(5, 3.2, 'B²−4AC > 0\nHyperbola', '#ffe3e3'),
      arrow(2, 5.3, 4.0, 3.7),
      arrow(8, 5.3, 6.0, 3.7),
    )
    .compile();
}

// ── 20. Four Conic Sections Side by Side (2×2) ──
function conicComparison() {
  const circ = plot2d([-5, 5], [-5, 5])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Circle')
    .add(circle.center(point(0, 0)).radius(3).color(B).stroke(2.5));
  const ell = plot2d([-6, 6], [-4, 4])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Ellipse')
    .add(
      ellipse.center(point(0, 0)).semi(5, 3).color(B).stroke(2.5),
      point(4, 0).marker('star').color(M).size(8),
      point(-4, 0).marker('star').color(M).size(8),
      annotate.text(point(0, 3.4)).label('PF₁+PF₂=2a').anchor('middle').color(M).font(10),
    );
  const par = plot2d([-4, 4], [-2, 5])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Parabola')
    .add(
      parabola.focus(point(0, 1)).directrix(line.horizontal(-1)).color(B).stroke(2.5),
      point(0, 1).marker('star').color(M).size(8),
      line.horizontal(-1).color(G).stroke(1.5).dash([6, 4]),
      annotate.text(point(1.6, 2.6)).label('PF = distance to directrix').color(R).font(10),
    );
  const hyp = plot2d([-7, 7], [-5, 5])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Hyperbola')
    .add(
      hyperbola.center(point(0, 0)).semi(3, 2).color(B).stroke(2.5),
      line
        .slopeIntercept(2 / 3, 0)
        .color(OR)
        .stroke(1)
        .dash([5, 4]),
      line
        .slopeIntercept(-2 / 3, 0)
        .color(OR)
        .stroke(1)
        .dash([5, 4]),
      point(Math.sqrt(13), 0).marker('star').color(M).size(8),
      point(-Math.sqrt(13), 0).marker('star').color(M).size(8),
      annotate.text(point(4, 4)).label('|PF₁−PF₂|=2a').color(M).font(9),
    );
  return subplots([circ, ell, par, hyp], { cols: 2, title: 'Four Conic Sections — Side by Side', tight: true });
}

// ── 21. Parametric Curves (2×2) ──
function parametricMotion() {
  const segp = plot2d([0, 8], [1, 6])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Line Segment  (1+5t, 2+3t)')
    .add(
      curve
        .parametric((t) => [1 + 5 * t, 2 + 3 * t])
        .on([0, 1])
        .color(B)
        .stroke(2.5),
      point(1, 2).marker('circle').color(R).size(6),
      point(6, 5).marker('circle').color(G).size(6),
      ...[0.2, 0.4, 0.6, 0.8].map((t) =>
        point(1 + 5 * t, 2 + 3 * t)
          .marker('point')
          .color(B)
          .size(5),
      ),
      annotate.text(point(1, 2)).label('t=0').offset(-34, -14).font(10),
      annotate.text(point(6, 5)).label('t=1').offset(5, 5).font(10),
    );
  const circ = (() => {
    const pts = [0, 1, 2, 3, 4, 5].map((k) =>
      point(3 * Math.cos((k * Math.PI) / 4), 3 * Math.sin((k * Math.PI) / 4))
        .marker('point')
        .color(B)
        .size(5),
    );
    return plot2d([-4, 4], [-4, 4])
      .equal()
      .grid({ alpha: 0.3 })
      .title('Circle  (3cos t, 3sin t)')
      .add(
        curve
          .parametric((t) => [3 * Math.cos(t), 3 * Math.sin(t)])
          .on([0, tau])
          .color(B)
          .stroke(2.5),
        ...pts,
        annotate.arrow(point(3, 0), point(3, 0.8)).color(R),
      );
  })();
  const ell = (() => {
    const pts = [0, 1, 2, 3, 4].map((k) =>
      point(4 * Math.cos((k * Math.PI) / 4), 2 * Math.sin((k * Math.PI) / 4))
        .marker('point')
        .color(B)
        .size(5),
    );
    return plot2d([-5, 5], [-3, 3])
      .equal()
      .grid({ alpha: 0.3 })
      .title('Ellipse  (4cos t, 2sin t)')
      .add(
        curve
          .parametric((t) => [4 * Math.cos(t), 2 * Math.sin(t)])
          .on([0, tau])
          .color(B)
          .stroke(2.5),
        ...pts,
        annotate.arrow(point(4, 0), point(4, 0.6)).color(R),
      );
  })();
  const cyc = plot2d([0, 13], [-0.5, 3])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Cycloid  (t−sin t, 1−cos t)')
    .add(
      curve
        .parametric((t) => [t - Math.sin(t), 1 - Math.cos(t)])
        .on([0, 4 * pi])
        .color(B)
        .stroke(2),
      line.horizontal(0).color(GRAY).stroke(1),
    );
  return subplots([segp, circ, ell, cyc], { cols: 2, title: 'Parametric Curves', tight: true });
}

// ── 22. Building Parametric Curves (2×3) ──
function stepParametric() {
  const circlePanel = (n, title) => {
    const pts = Array.from({ length: n + 1 }, (_, k) =>
      point(3 * Math.cos((2 * pi * k) / n), 3 * Math.sin((2 * pi * k) / n))
        .marker('point')
        .color(B)
        .size(n < 50 ? 6 : 2),
    );
    const extra = [
      point(3, 0).marker('circle').color(R).size(6),
      annotate.arrow(point(2.8, 1), point(2.5, 1.3)).color(R),
    ];
    return plot2d([-4, 4], [-4, 4])
      .equal()
      .grid({ alpha: 0.3 })
      .title(title)
      .add(
        curve
          .parametric((t) => [3 * Math.cos(t), 3 * Math.sin(t)])
          .on([0, tau])
          .color(B)
          .stroke(1.5),
        ...pts,
        ...extra,
      );
  };
  const cycPanel = (n, title) => {
    const pts = Array.from({ length: n + 1 }, (_, k) => {
      const t = (2 * pi * k) / n;
      return point(t - Math.sin(t), 1 - Math.cos(t))
        .marker('point')
        .color(B)
        .size(n < 50 ? 6 : 2);
    });
    return plot2d([0, 7], [-0.5, 2.5])
      .equal()
      .grid({ alpha: 0.3 })
      .title(title)
      .add(
        curve
          .parametric((t) => [t - Math.sin(t), 1 - Math.cos(t)])
          .on([0, tau])
          .color(B)
          .stroke(1.5),
        ...pts,
        line.horizontal(0).color(GRAY).stroke(1),
      );
  };
  return subplots(
    [
      circlePanel(6, 'Step 1: t animates point'),
      circlePanel(12, 'Step 2: More snapshots'),
      circlePanel(300, 'Step 3: Complete circle'),
      cycPanel(8, 'Step 1: t animates wheel'),
      cycPanel(20, 'Step 2: More snapshots'),
      cycPanel(200, 'Step 3: Complete cycloid'),
    ],
    { cols: 3, title: 'Building Parametric Curves', tight: true },
  );
}

// ── 23. Triangle Area — Shoelace (single) ──
function triangleArea() {
  const tri = triangle(point(0, 0), point(4, 0), point(1, 3));
  return plot2d([-1, 6], [-1, 5])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Triangle Area — Shoelace Formula')
    .add(
      tri.fill(B).opacity(0.2),
      tri.color(B).stroke(2.5),
      point(0, 0).marker('circle').color(R).size(6),
      point(4, 0).marker('circle').color(R).size(6),
      point(1, 3).marker('circle').color(R).size(6),
      annotate.text(point(0, 0)).label('(0,0)').offset(-30, -14).font(11),
      annotate.text(point(4, 0)).label('(4,0)').offset(5, -14).font(11),
      annotate.text(point(1, 3)).label('(1,3)').offset(5, 4).font(11),
      annotate
        .text(point(2, 1.5))
        .label('Area = ½|12| = 6')
        .anchor('middle')
        .bold()
        .font(13)
        .box({ facecolor: 'wheat', alpha: 0.85 }),
    )
    .compile();
}

// ── 24. Polygon Area — Shoelace (1×2) ──
function areaPolygon() {
  const P = [point(0, 0), point(5, 0), point(4, 3), point(1, 4)];
  const poly = (s) => s.add(polygonOf(P).fill(B).opacity(0.15)).add(polygonOf(P).color(B).stroke(2));
  const p1 = poly(plot2d([-1, 7], [-1, 6]).equal().grid({ alpha: 0.3 }).title('Quadrilateral Vertices')).add(
    ...P.map((p, i) => point(p.coords[0], p.coords[1]).marker('circle').color(B).size(6)).map((pt, i) => pt),
    ...['(0,0)', '(5,0)', '(4,3)', '(1,4)'].map((l, i) =>
      annotate.text(point(P[i].coords[0], P[i].coords[1])).label(l).offset(5, 8).font(10),
    ),
  );
  const p2 = poly(plot2d([-1, 7], [-1, 6]).equal().grid({ alpha: 0.3 }).title('Shoelace: Diagonal Products')).add(
    seg(point(0, 0), point(4, 3), { color: R, stroke: 1 }).dash([5, 4]),
    seg(point(5, 0), point(1, 4), { color: R, stroke: 1 }).dash([5, 4]),
    seg(point(4, 3), point(0, 0), { color: R, stroke: 1 }).dash([5, 4]),
    seg(point(1, 4), point(0, 0), { color: R, stroke: 1 }).dash([5, 4]),
    ...P.map((p) => point(p.coords[0], p.coords[1]).marker('circle').color(B).size(6)),
    annotate
      .text(point(2.5, 2))
      .label('Area = ½|0+15+13+0|\n        = 14')
      .anchor('middle')
      .bold()
      .font(13)
      .box({ facecolor: 'wheat', alpha: 0.85 }),
  );
  return subplots([p1, p2], { cols: 2, title: 'Polygon Area — The Shoelace Formula', tight: true });
}

// ── 25. Point Reflection Across a Line (single) ──
function pointReflection() {
  return plot2d([-7, 7], [-7, 7])
    .equal()
    .grid({ alpha: 0.3 })
    .title('Point Reflection Across a Line  x+y=0')
    .legend('lower right')
    .add(
      line
        .slopeIntercept(-1, 0)
        .color(B)
        .stroke(2.5)
        .label(tex`x+y=0`),
      point(1, 5).marker('circle').color(R).size(7),
      point(-5, -1).marker('circle').color(G).size(7),
      point(-2, 2).marker('circle').color('#000000').size(4),
      seg(point(1, 5), point(-5, -1), { color: R, stroke: 2 }).dash([6, 4]),
      annotate.text(point(1, 5)).label('P(1,5)').offset(8, 8).color(R).bold().font(12),
      annotate.text(point(-5, -1)).label("P'(−5,−1)").offset(-20, -18).color(G).bold().font(12),
      annotate.text(point(-2, 2)).label('Midpoint\n(−2,2)').offset(-24, 12).color('#000000').font(10),
    )
    .compile();
}

// ── run ─────────────────────────────────────────────────────────
//   각 figure 는 컴파일된 Scene/panels 를 돌려준다. saveFigures 가
//   SVG + PNG(가능하면) + index.html 갤러리까지 처리한다.
const figs = [
  ['9b-line-forms', lineForms, '①–⑤ 직선의 다섯 가지 표현'],
  ['9b-step-line-forms', stepLineForms, '직선 작도 3단계'],
  ['9b-parallel-perpendicular', parallelPerp, '평행·수직 조건'],
  ['9b-angle-between-lines', angleBetweenLines, '두 직선 사이의 각'],
  ['9b-midpoint-division', midpointDivision, '중점·내분점·무게중심'],
  ['9b-point-line-distance-derivation', pointLineDistance, '점-직선 거리 유도'],
  ['9b-step-distance-line', stepDistanceLine, '점-직선 거리 3단계'],
  ['9b-two-lines-distance', twoLinesDistance, '평행한 두 직선의 거리'],
  ['9b-point-circle-distance', pointCircleDistance, '점-원 거리'],
  ['9b-tangent-lines-circle', tangentLinesCircle, '원의 접선'],
  ['9b-circle-details', circleDetails, '원: 표준형 ↔ 일반형'],
  ['9b-step-conic-circle', stepConicCircle, '원 작도 3단계'],
  ['9b-ellipse-details', ellipseDetails, '타원의 특징과 정의'],
  ['9b-step-conic-ellipse', stepConicEllipse, '타원 작도 3단계'],
  ['9b-parabola-details', parabolaDetails, '포물선: 초점·준선'],
  ['9b-step-conic-parabola', stepConicParabola, '포물선 작도 3단계'],
  ['9b-hyperbola-details', hyperbolaDetails, '쌍곡선의 특징과 정의'],
  ['9b-step-conic-hyperbola', stepConicHyperbola, '쌍곡선 작도 3단계'],
  ['9b-conic-identification', conicIdentification, '원뿔곡선 판별 순서도'],
  ['9b-conic-comparison', conicComparison, '4종 원뿔곡선 비교'],
  ['9b-parametric-motion', parametricMotion, '매개곡선 모음'],
  ['9b-step-parametric', stepParametric, '매개곡선 작도'],
  ['9b-triangle-area-coordinates', triangleArea, '삼각형 넓이 (신발끈)'],
  ['9b-area-polygon', areaPolygon, '다각형 넓이 (신발끈)'],
  ['9b-point-reflection', pointReflection, '직선에 대한 점의 대칭'],
];

await saveFigures(figs, {
  dir: OUT,
  index: true,
  title: 'logos · Session 9B — 2D 기하 (example1.py 재현)',
});
