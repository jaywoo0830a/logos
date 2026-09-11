// examples/mpl_parity_9c.js — example2.py (Session 9C · 3D 기하) 재현 — logos 만 사용
//
// ── 무엇을 하는가 ────────────────────────────────────────────────
//   matplotlib(mplot3d) 로 그린 3D 기하 교재 그림 35개를 logos DSL **만으로**
//   같은 구성으로 다시 그린다. 좌표계/평면/구/이차곡면/교선/단계별 작도까지
//   9C 세션의 전 그림을 커버하는 **대표 예제 2** 다.
//
// ── 실행 ────────────────────────────────────────────────────────
//   node examples/mpl_parity_9c.js   →  output/parity9c/*.svg + *.png + index.html
//   npm run parity9c                 (동일)
//
// ── mplot3d 대응 규칙 (이 예제가 지키는 관례) ───────────────────
//   · 시점        `plot3d({ elev, azim })`   ← ax.view_init(elev, azim)
//   · 상자 비율    plot3d 의 aspect [1,1,0.75] ← ax.set_box_aspect([4,4,3])
//   · 축          `.axes(false)` 로 자동 축을 끄고 `axes3()` 로 직접 그린다
//                 (matplotlib 의 ax.set_axis_off() + 화살표 3개 관용구)
//   · 프레이밍     `frame3(xlim, ylim, zlim)` ← set_xlim/ylim/zlim
//   · 곡면        `quadrics.*` (= surfaceParam) 의 `.wire(nu,nv)`/`.solid(nu,nv)`/
//                 `.cmap(name)` ← plot_wireframe / plot_surface / cmap
//   · 화살표       `arrow3(from, to)` ← quiver (머리 길이는 길이 비율 0.12)
//
// ── 공용 헬퍼 (logos/kit.js) ────────────────────────────────────
//   plot3d(o)            3D 씬 프리셋(dim 3 + camera + axes off)
//   subplots(figs, opts) 씬들을 패널로 합성 (셀 크기 자동)
//   saveFigures(figs,o)  SVG/PNG 저장 + index.html 갤러리
//   poly3(points, opts)  꺾은선(curve3.through) 단축 — 3D 보조선
//   palette              matplotlib 색 코드를 hex 로 고정
//
// ── figure 목록 ─────────────────────────────────────────────────
//    1 coordinate-system-3d     3D 좌표계(점의 좌표)
//    2 step-3d-coords           좌표 읽기 3단계
//    3 vector-dot-cross         내적(2D) / 외적(3D)
//    4 step-vectors             벡터 3단계(합·외적)
//    5 plane-intercept          평면의 절편 + 법선
//    6 plane-normal             법선벡터 ⊥ 평면
//    7 step-plane               3점 → 평면 3단계
//    8 point-plane-distance     점-평면 거리
//    9 angle-planes             두 평면의 각
//   10 distance-parallel-planes 평행한 두 평면의 거리
//   11 sphere-details           구의 특징(중심·반지름)
//   12 point-sphere-distance    점-구 거리 (2D 단면)
//   13 surface-height-map       높이맵 z=x²+y²
//   14 step-surface-build       곡면 3단계
//   15 domain-regions           정의역 (2×2, 2D)
//   16 level-curves-method      등위곡선 4종
//   17 level-curves-to-surface  등위곡선 → 곡면
//   18 contour-steepness        등고선 간격과 가파름
//   19 step-level-curves        등위곡선 작도 (2×3)
//   20 quadric-identification   이차곡면 판별 (2×3)
//   21 ellipsoid-details        타원체의 특징
//   22 paraboloid-details       타원 포물면
//   23 hyperbolic-paraboloid-details  쌍곡 포물면(안장)
//   24 cylinder-types           원기둥 4종 (2×2)
//   25 hyperboloid-one-sheet    한 겹 쌍곡면
//   26 hyperboloid-two-sheets   두 겹 쌍곡면
//   27 cone-details             이중 원뿔
//   28 quadric-comparison       이차곡면 총람 (2×3)
//   29 degenerate-cases         퇴화 이차곡면
//   30 sphere-plane-intersection  구 ∩ 평면
//   31 cylinders-intersection   두 원기둥의 교선
//   32 line-surface-intersection  직선-구 교점
//   33 symmetry-3d              3D 대칭
//   34 step-intersection        교선 작도 3단계
//   35 step-quadrics            이차곡면 작도 3×3
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scene, point, line, segment, circle, curve, region, annotate, tau,
  arrow3, curve3, surfaceParam, axes3, quadrics, circle3, frame3, kit,
} from '../index.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output', 'parity9c');

// 색 팔레트 — matplotlib 한 글자 이름만 벗겨 온다(값은 hex 로 고정).
const {
  blue: B, red: R, green: G, magenta: M, orange: OR, purple: PUR, gray: GRAY,
  skyblue: SKY, coral: CORAL, darkred: DRED, wheat: WHEAT,
} = kit.palette;
const { plot2d, plot3d, subplots, saveFigures, poly3 } = kit;

// ── 이차곡면/단축 별칭: 전부 라이브러리 API 위의 얇은 별칭 ──
const {
  plane: planeZ, ellipsoid: ellipS, ball: ballS,
  hyperboloid1: hyper1S, hyperboloid2: hyper2S, cone: coneS, cylinder: cylS,
} = quadrics;
/** 파라메트릭 곡면 단축 — `srf((u,v)=>[x,y,z], ur, vr)` */
const srf = (fn, ur, vr) => surfaceParam(fn).on(ur, vr);
/** 원점 */
const O3 = [0, 0, 0];
/** 3D 서브패널 셀 크기 — plot3d() 기본값과 같아야 같은 그리드에서 겹치지 않는다 */
const PCELL3 = [480, 440];
/** 2D 서브패널 프리셋 — equal + axes + grid. 3D 와 섞이는 그리드가 있으므로 셀 크기를 맞춘다. */
const s2 = (xr, yr) => plot2d(xr, yr, { size: PCELL3, equal: true });

// ── 1. 3D Coordinate System ──
function coordSys3d() {
  return plot3d({ elev: 25, azim: -50 }).title('3D Coordinate System').add(
    arrow3([0, 0, 0], [5, 0, 0]).color(R).stroke(2).label('x'),
    arrow3([0, 0, 0], [0, 5, 0]).color(G).stroke(2).label('y'),
    arrow3([0, 0, 0], [0, 0, 5]).color(B).stroke(2).label('z'),
    planeZ(() => 0, [0, 4], [0, 4]).solid(6, 6).color(GRAY).opacity(0.1),
    srf((u, v) => [u, 0, v], [0, 4], [0, 4]).solid(6, 6).color(GRAY).opacity(0.1),
    srf((u, v) => [0, u, v], [0, 4], [0, 4]).solid(6, 6).color(GRAY).opacity(0.1),
    poly3([[3, 2, 0], [3, 2, 4]], { color: '#000', stroke: 0.8, dash: [4, 3] }).opacity(0.5),
    poly3([[3, 0, 0], [3, 2, 0]], { color: '#000', stroke: 0.8, dash: [4, 3] }).opacity(0.5),
    poly3([[0, 0, 0], [3, 0, 0]], { color: '#000', stroke: 0.8, dash: [4, 3] }).opacity(0.5),
    point(3, 2, 4).marker('circle').color(R).size(7),
    annotate.text(point(3, 2, 4)).label('(3,2,4)').offset(8, -4).bold().font(12),
    annotate.text(point(2, 2, 2)).label('Octant I\n(+,+,+)').anchor('middle').color(GRAY).font(9),
  ).compile();
}

// ── 2. 3D Coordinates — Step by Step (1×3) ──
function step3dCoords() {
  const pts = [[[3, 0, 0]], [[3, 0, 0], [3, 2, 0]], [[3, 0, 0], [3, 2, 0], [3, 2, 4]]];
  const titles = ['Step 1: Move along x to (3,0,0)', 'Step 2: Move along y to (3,2,0)', 'Step 3: Rise along z to (3,2,4)'];
  const paths = [[[0, 0, 0]], [[0, 0, 0], [3, 0, 0]], [[0, 0, 0], [3, 0, 0], [3, 2, 0]]];
  return subplots(pts.map((p, i) => {
    const last = p[p.length - 1];
    const shapes = [
      ...axes3({ length: 5, color: GRAY, width: 1.2 }),
      poly3([...paths[i], last], { color: '#000', stroke: 2 }),
      point(...last).marker('circle').color(R).size(7),
    ];
    if (i >= 1) shapes.push(poly3([[3, 2, 0], [3, 2, 4]], { color: '#000', stroke: 0.8, dash: [4, 3] }).opacity(0.4));
    return plot3d().title(titles[i]).add(...shapes);
  }), { cols: 3, title: '3D Coordinates — Step by Step', tight: true });
}

// ── 3. Dot Product & Cross Product (1×2: 2D + 3D) ──
function vectorDotCross() {
  const arc = curve.parametric((t) => [0.8 * Math.cos(t), 0.8 * Math.sin(t)]).on([Math.atan2(1, 3), Math.atan2(3, 1)]).color(PUR).stroke(2);
  const left = plot2d([-0.5, 4.5], [-0.5, 4.5], { size: PCELL3, grid: { alpha: 0.3 }, equal: true })
    .title('Dot Product: Alignment').legend('upper right')
    .add(
      annotate.arrow(point(0, 0), point(3, 1)).color(B).stroke(2).label('u=(3,1)'),
      annotate.arrow(point(0, 0), point(1, 3)).color(R).stroke(2).label('v=(1,3)'),
      arc,
      annotate.text(point(1.05, 1.0)).label('θ').color(PUR).font(14),
      annotate.text(point(2, 2.8)).label('u·v = |u||v|cosθ\nmeasures alignment').anchor('middle').bold().font(11).box({ facecolor: WHEAT, alpha: 0.8 }),
    );
  const right = plot3d({ elev: 20, azim: -60 }).title('Cross Product: Perpendicular')
    .add(
      ...axes3({ length: 3, color: GRAY, width: 0.8 }),
      arrow3([0, 0, 0], [2, 0, 0]).color(B).stroke(2).label('u (1,0,0)'),
      arrow3([0, 0, 0], [0, 2, 0]).color(R).stroke(2).label('v (0,1,0)'),
      arrow3([0, 0, 0], [0, 0, 2]).color(PUR).stroke(3).label('u×v (0,0,1)'),
      annotate.text(point(1, 1, 0.6)).label('⊥ to both\nArea = |u||v|sinθ').anchor('middle').font(10).box({ facecolor: WHEAT, alpha: 0.7 }),
    );
  return subplots([left, right], { cols: 2, title: 'Dot Product and Cross Product', tight: true });
}

// ── 4. Vectors in 3D — Step by Step (1×3) ──
function stepVectors() {
  const titles = ['Step 1: A vector u', 'Step 2: Add vectors u+v', 'Step 3: Cross product u×v'];
  const mk = (i) => {
    const shapes = [...axes3({ length: 5, color: GRAY, width: 0.8 }), arrow3([0, 0, 0], [3, 1, 2]).color(B).stroke(2).label('u=(3,1,2)')];
    if (i === 1) {
      shapes.push(arrow3([3, 1, 2], [4, 3, 3]).color(R).stroke(2), arrow3([0, 0, 0], [4, 3, 3]).color(PUR).stroke(2.5).label('u+v'));
    } else if (i === 2) {
      shapes.push(arrow3([0, 0, 0], [2, 0, 0]).color(B).stroke(2), arrow3([0, 0, 0], [0, 1, 0]).color(R).stroke(2),
        arrow3([0, 0, 0], [0, 0, 2]).color(PUR).stroke(3).label('u×v'),
        planeZ(() => 0, [0, 2], [0, 1]).solid(4, 4).color(GRAY).opacity(0.15));
    }
    return plot3d().title(titles[i]).add(...shapes);
  };
  return subplots([mk(0), mk(1), mk(2)], { cols: 3, title: 'Vectors in 3D — Step by Step', tight: true });
}

// ── 5. Plane 2x+3y−z=6 — Intercepts + Normal ──
function planeIntercept() {
  return plot3d({ elev: 22, azim: -55 }).title('Plane: 2x+3y−z=6 — Intercepts + Normal Vector').add(
    ...axes3({ length: 5, color: GRAY, width: 0.8 }),
    planeZ((x, y) => 2 * x + 3 * y - 6, [0, 5], [0, 4]).solid(30, 30).color(SKY).opacity(0.5),
    point(3, 0, 0).marker('circle').color(R).size(8), point(0, 2, 0).marker('circle').color(G).size(8), point(0, 0, -6).marker('circle').color(M).size(8),
    annotate.text(point(3, 0, 0)).label('(3,0,0)').offset(6, 6).color(R).bold().font(11),
    annotate.text(point(0, 2, 0)).label('(0,2,0)').offset(-52, 6).color(G).bold().font(11),
    annotate.text(point(0, 0, -6)).label('(0,0,−6)').offset(6, 10).color(M).bold().font(11),
    arrow3([1, 1, -1], [3, 4, -2]).color(DRED).stroke(3).label('n=(2,3,−1)'),
  ).compile();
}

// ── 6. Normal Vector ⊥ to Plane ──
function planeNormal() {
  const inPlane1 = [0, 1, 2, 3].map((t) => poly3([[t, 0, -6 + 2 * t], [t + 1.5, 0, -6 + 2 * (t + 1.5)]], { color: '#000', stroke: 1.5 }).opacity(0.4));
  const inPlane2 = [0, 1, 2].map((t) => poly3([[t, 0, -6 + 2 * t], [t, 1.5, -6 + 2 * t - 4.5]], { color: '#000', stroke: 1.5 }).opacity(0.4));
  const normals = [[1, 1, -1], [3, 0, 0], [0, 2, 0]].map((p) => arrow3(p, [p[0] + 2, p[1] + 3, p[2] - 1]).color(DRED).stroke(2.2).opacity(0.8));
  return plot3d({ elev: 18, azim: -50 }).title('Normal Vector ⊥ to Plane').add(
    ...axes3({ length: 5, color: GRAY, width: 0.8 }),
    planeZ((x, y) => 2 * x + 3 * y - 6, [-1, 5], [-1, 5]).solid(30, 30).color(SKY).opacity(0.35),
    ...inPlane1, ...inPlane2, ...normals,
    annotate.text(point(2, 3.5, -1)).label('n=(2,3,−1)\n⊥ to every direction in the plane').anchor('middle').font(11).box({ facecolor: '#FFE4B5', alpha: 0.85 }),
  ).compile();
}

// ── 7. Building a Plane from 3 Points (1×3) ──
function stepPlane() {
  const titles = ['Step 1: Points A(1,0,0), B(0,2,0), C(0,0,3)', 'Step 2: AB×AC = normal n=(6,3,2)', 'Step 3: Plane 6x+3y+2z=6'];
  const pts = [point(1, 0, 0).marker('circle').color(R).size(8), point(0, 2, 0).marker('circle').color(G).size(8), point(0, 0, 3).marker('circle').color(M).size(8)];
  return subplots([0, 1, 2].map((i) => {
    const shapes = [...axes3({ length: 5, color: GRAY, width: 0.8 }), ...pts,
      annotate.text(point(1, 0, 0.3)).label('A').color(R).bold().font(11),
      annotate.text(point(0, 2, 0.3)).label('B').color(G).bold().font(11),
      annotate.text(point(0, 0, 3.3)).label('C').color(M).bold().font(11)];
    if (i >= 1) {
      shapes.push(arrow3([1, 0, 0], [0, 2, 0]).color(OR).stroke(2.5), arrow3([1, 0, 0], [0, 0, 3]).color(OR).stroke(2.5),
        arrow3([1, 0, 0], [7, 3, 2]).color(DRED).stroke(3.5).label('n=(6,3,2)'));
    }
    if (i === 2) shapes.push(planeZ((x, y) => (6 - 6 * x - 3 * y) / 2, [0, 1.5], [0, 2.5]).solid(20, 20).color(SKY).opacity(0.45));
    return plot3d().title(titles[i]).add(...shapes);
  }), { cols: 3, title: 'Building a Plane from 3 Points', tight: true });
}

// ── 8. Point-to-Plane Distance ──
function pointPlaneDistance() {
  const n = [2, 3, 1], P = [1, 2, 3];
  const t = (6 - (n[0] * P[0] + n[1] * P[1] + n[2] * P[2])) / (n[0] ** 2 + n[1] ** 2 + n[2] ** 2);
  const foot = P.map((v, i) => v + t * n[i]);
  const mid = P.map((v, i) => (v + foot[i]) / 2);
  return plot3d({ elev: 22, azim: -55 }).title('Point-to-Plane Distance: D = |2x₀+3y₀+z₀−6|/√14').add(
    ...axes3({ length: 5, color: GRAY, width: 0.8 }),
    planeZ((x, y) => 6 - 2 * x - 3 * y, [-0.5, 4], [-0.5, 4]).solid(30, 30).color(SKY).opacity(0.35),
    point(...P).marker('circle').color(R).size(8),
    poly3([P, foot], { color: R, stroke: 3, dash: [6, 4] }),
    point(...foot).marker('circle').color(G).size(8),
    arrow3(foot, foot.map((v, i) => v + n[i])).color(PUR).stroke(2.5).label('n=(2,3,1)'),
    annotate.text(point(...P)).label('P(1,2,3)').offset(8, -6).color(R).bold().font(12),
    annotate.text(point(...mid)).label('d = 5/√14 ≈ 1.336').offset(8, -6).color(R).bold().font(11).box({ facecolor: '#ffffff', alpha: 0.7 }),
  ).compile();
}

// ── 9. Angle Between Planes (1×2) ──
function anglePlanes() {
  const s3 = Math.sqrt(3);
  const p1 = plot3d({ elev: 25, azim: -50 }).title('Planes at 60°').add(
    ...axes3({ length: 3, color: GRAY, width: 0.7 }),
    planeZ(() => 0, [-2, 2], [-2, 2]).solid(14, 14).color('#ADD8E6').opacity(0.4),
    planeZ((x) => s3 * x, [-2, 2], [-2, 2]).solid(14, 14).color(CORAL).opacity(0.4),
    arrow3([0, 0, 0], [0, 0, 1]).color(B).stroke(2.5).label('n₁'),
    arrow3([0, 0, 0], [-s3, 0, 1]).color(R).stroke(2.5).label('n₂'),
    annotate.text(point(0, 0.3, 0.5)).label('60°').color(PUR).bold().font(13),
  );
  const p2 = plot3d({ elev: 25, azim: -50 }).title('Perpendicular Planes').add(
    ...axes3({ length: 3, color: GRAY, width: 0.7 }),
    planeZ(() => 0, [-2, 2], [-2, 2]).solid(14, 14).color('#ADD8E6').opacity(0.4),
    srf((u, v) => [0, u, v], [-2, 2], [-2, 2]).solid(14, 14).color(CORAL).opacity(0.4),
    arrow3([1, 0, 0], [1, 0, 1.5]).color(B).stroke(2.5).label('n₁'),
    arrow3([0, 1, 0], [1.5, 1, 0]).color(R).stroke(2.5).label('n₂'),
    annotate.text(point(1, 1, 1)).label('90°\nn₁·n₂=0').anchor('middle').color(PUR).bold().font(12),
  );
  return subplots([p1, p2], { cols: 2, title: 'Angle Between Planes = Angle Between Normals', tight: true });
}

// ── 10. Distance Between Parallel Planes ──
function distanceParallelPlanes() {
  const pt1 = [0.5, 0.5, (5 - 2 * 0.5 + 0.5) / 2], pt2 = [0.5, 0.5, (-7 - 2 * 0.5 + 0.5) / 2];
  const mid = pt1.map((v, i) => (v + pt2[i]) / 2);
  return plot3d({ elev: 15, azim: -55 }).title('Distance Between Parallel Planes  2x−y+2z=5 and 2x−y+2z=−7').add(
    ...axes3({ length: 4, color: GRAY, width: 0.7 }),
    planeZ((x, y) => (5 - 2 * x + y) / 2, [-3, 3], [-3, 3]).solid(18, 18).color('#ADD8E6').opacity(0.3),
    planeZ((x, y) => (-7 - 2 * x + y) / 2, [-3, 3], [-3, 3]).solid(18, 18).color(CORAL).opacity(0.3),
    poly3([pt1, pt2], { color: R, stroke: 3 }),
    arrow3([0, 0, 0], [2, -1, 2]).color(PUR).stroke(2).label('n=(2,−1,2)'),
    annotate.text(point(...mid)).label('D = 4').offset(8, -4).color(R).bold().font(13),
  ).compile();
}

// ── 11. Sphere Details ──
function sphereDetails() {
  const C = [2, -3, 1], Rr = 5;
  const gc = [0, Math.PI / 2].map((ang) => curve3.parametric((t) => [C[0] + Rr * Math.cos(t), C[1] + Rr * Math.sin(t) * Math.cos(ang), C[2] + Rr * Math.sin(t) * Math.sin(ang)]).on([0, tau]).color('#000').stroke(0.6).opacity(0.5));
  return plot3d().title('Sphere: (x−2)²+(y+3)²+(z−1)²=25').add(
    ...axes3({ length: 3, color: GRAY, width: 0.8 }),
    ballS(Rr, C).wire(40, 16).color(B).opacity(0.3),
    ...gc,
    point(...C).marker('circle').color(R).size(7),
    poly3([C, [C[0] + Rr, C[1], C[2]]], { color: R, stroke: 2, dash: [6, 4] }),
    annotate.text(point(C[0], C[1], C[2] + 1)).label('C(2,−3,1)').offset(-76, -6).color(R).bold().font(11),
    annotate.text(point(C[0] + Rr / 2, C[1] + 0.3, C[2] + 0.3)).label('R=5').offset(6, -8).color(R).font(11),
  ).compile();
}

// ── 12. Point-to-Sphere Distance (1×2, 2D) ──
function pointSphereDistance() {
  const mk = (Px, plabel, dlabel, inside) => scene().size(420, 380).view([-2, 12], [-7, 7]).equal().axes().grid({ alpha: 0.3 })
    .title(inside ? 'Point Inside   d = R − |PC|' : 'Point Outside   d = |PC| − R')
    .add(
      circle.center(point(0, 0)).radius(5).color(B).stroke(2.5),
      point(0, 0).marker('circle').color('#000').size(4),
      point(Px, 0).marker('circle').color(R).size(6),
      segment(point(Px, 0), point(5, 0)).color(R).dash([6, 4]).stroke(2),
      point(5, 0).marker('circle').color(G).size(5),
      annotate.text(point(Px + 0.3, 0.6)).label(plabel).font(11),
      annotate.text(point(6, 1.2)).label(dlabel).color(R).bold().font(13),
    );
  return subplots([mk(10, 'P(10,0,0)', 'd=10−5=5', false), mk(2, 'P(2,0,0)', 'd=5−2=3', true)],
    { cols: 2, title: 'Point-to-Sphere Distance' });
}

// ── 13. Surface Height Map ──
function surfaceHeightMap() {
  return plot3d({ elev: 25, azim: -50 }).title('z = x² + y² — Height Map').add(
    ...axes3({ length: 4, color: GRAY, width: 0.8 }),
    planeZ((x, y) => x * x + y * y, [-2, 2], [-2, 2]).solid(28, 28).cmap('viridis').opacity(0.85),
    poly3([[1, 1, 0], [1, 1, 2]], { color: R, stroke: 1.5, dash: [6, 4] }),
    poly3([[0, 0, 0], [1, 1, 0]], { color: '#000', stroke: 0.8, dash: [4, 3] }).opacity(0.5),
    point(1, 1, 2).marker('circle').color(R).size(8),
    annotate.text(point(1.3, 1.3, 2.5)).label('(1,1,f(1,1)=2)').color(R).bold().font(10),
  ).compile();
}

// ── 14. Building a 3D Surface (1×3) ──
function stepSurfaceBuild() {
  const f = (x, y) => x * x + y * y;
  const titles = ['Step 1: Wireframe Skeleton', 'Step 2: Solid Surface', 'Step 3: Level Curves Added'];
  return subplots([0, 1, 2].map((i) => {
    const shapes = [...axes3({ length: 4, color: GRAY, width: 0.8 }), point(0, 0, 0).marker('circle').color(R).size(5)];
    shapes.push(i === 0 ? planeZ(f, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.4)
      : planeZ(f, [-2, 2], [-2, 2]).solid(28, 28).cmap('viridis').opacity(0.75));
    if (i === 2) for (const cz of [1, 2, 3, 4]) shapes.push(circle3(Math.sqrt(cz), cz).color('#ffffff').stroke(1.5));
    return plot3d({ elev: 25, azim: -50 }).title(titles[i]).add(...shapes);
  }), { cols: 3, title: 'Building a 3D Surface — z=x²+y²', tight: true });
}

// ── 15. Domain Regions in the xy-Plane (2×2, 2D) ──
function domainRegions() {
  const a = s2([-3, 3], [-3, 3]).title('z=√(4−x²−y²)  Disk x²+y²≤4')
    .add(region.inside(circle.center(point(0, 0)).radius(2)).fill(B).opacity(0.2),
      circle.center(point(0, 0)).radius(2).color(B).stroke(2.5),
      line.horizontal(0).color(GRAY).stroke(0.5), line.vertical(0).color(GRAY).stroke(0.5));
  const b = s2([-3, 3], [-3, 4]).title('z=ln(x+y)  Half-plane x+y>0')
    .add(region.between(curve.fn(() => 4), curve.fn((x) => -x), [-3, 3]).fill(G).opacity(0.2),
      curve.fn((x) => -x).on([-3, 3]).color(G).dash([6, 4]).stroke(2.5),
      line.horizontal(0).color(GRAY).stroke(0.5), line.vertical(0).color(GRAY).stroke(0.5));
  const c = s2([-3, 3], [-3, 3]).title('z=1/(x²+y²−1)  Plane minus unit circle')
    .add(region.bar(-3, 3, -3, 3).fill(OR).opacity(0.08),
      circle.center(point(0, 0)).radius(1).fill('#ffffff').stroke(0),
      circle.center(point(0, 0)).radius(1).color(OR).stroke(2.5).dash([6, 4]),
      line.horizontal(0).color(GRAY).stroke(0.5), line.vertical(0).color(GRAY).stroke(0.5));
  const d = s2([-1, 4], [-2, 3]).title('z=√x/(y−1)  x≥0, y≠1')
    .add(region.bar(0, 4, -2, 2).fill(PUR).opacity(0.15),
      line.horizontal(1).color(PUR).dash([6, 4]).stroke(2),
      line.vertical(0).color(PUR).opacity(0.5).stroke(3),
      line.horizontal(0).color(GRAY).stroke(0.5), line.vertical(0).color(GRAY).stroke(0.5));
  return subplots([a, b, c, d], { cols: 2, title: 'Domain Regions in the xy-Plane' });
}

// ── 16. Level Curves of Four Key Surfaces (2×2, 2D) ──
function saddleCurves(cs, colors) {
  const out = [], xr = [-3, 3];
  cs.forEach((c, ci) => {
    const col = colors[ci];
    if (c === 0) {
      out.push(curve.fn((x) => x).on(xr).color(col).stroke(2), curve.fn((x) => -x).on(xr).color(col).stroke(2));
    } else if (c > 0) {
      out.push(curve.parametric((t) => [t, Math.sqrt(Math.max(t * t - c, 0))]).on(xr).color(col).stroke(1.5));
      out.push(curve.parametric((t) => [t, -Math.sqrt(Math.max(t * t - c, 0))]).on(xr).color(col).stroke(1.5));
    } else {
      out.push(curve.parametric((t) => [Math.sqrt(t * t + Math.abs(c)), t]).on(xr).color(col).stroke(1.5));
      out.push(curve.parametric((t) => [-Math.sqrt(t * t + Math.abs(c)), t]).on(xr).color(col).stroke(1.5));
    }
  });
  return out;
}
function levelCurvesMethod() {
  const cs = [-2, -1, 0, 1, 2], colors = ['darkblue', 'blue', '#000000', 'red', 'darkred'];
  const bowl = cs.flatMap((c, ci) => (c < 0 ? [] : [c === 0 ? point(0, 0).marker('circle').color('#000').size(5) : circ2(Math.sqrt(c)).color(colors[ci]).stroke(1.8)]));
  const cone = cs.flatMap((c, ci) => (c < 0 ? [] : [c === 0 ? point(0, 0).marker('circle').color('#000').size(5) : circ2(c).color(colors[ci]).stroke(1.8)]));
  const pcyl = cs.map((c, ci) => curve.fn((x) => x * x + c).on([-3, 3]).color(colors[ci]).stroke(1.8));
  const mk = (title, shapes) => s2([-3, 3], [-3, 3]).title(title)
    .add(line.horizontal(0).color(GRAY).stroke(0.5), line.vertical(0).color(GRAY).stroke(0.5), ...shapes);
  return subplots([
    mk('z=x²+y² (Bowl)  Concentric circles', bowl),
    mk('z=x²−y² (Saddle)  Hyperbolas', saddleCurves(cs, colors)),
    mk('z=√(x²+y²) (Cone)  Evenly spaced circles', cone),
    mk('z=y−x² (Parabolic cylinder)  Shifted parabolas', pcyl),
  ], { cols: 2, title: 'Level Curves of Four Key Surfaces' });
}
const circ2 = (r) => curve.parametric((t) => [r * Math.cos(t), r * Math.sin(t)]).on([0, tau]);

// ── 17. From Level Curves to 3D Surface (2×2) ──
function levelCurvesToSurface() {
  const bowl2d = s2([-2, 2], [-2, 2]).title('Level Curves: z=x²+y²  Concentric circles')
    .add(...[0.5, 1, 1.5, 2, 2.5].map((c) => circ2(Math.sqrt(c)).color(B).stroke(1.2).opacity(0.7)));
  const bowl3d = plot3d({ elev: 25, azim: -50 }).title('3D: z=x²+y² (Bowl)')
    .add(planeZ((x, y) => x * x + y * y, [-2, 2], [-2, 2]).solid(30, 30).cmap('viridis').opacity(0.85),
      ...[1, 2, 3, 4].map((c) => circle3(Math.sqrt(c), c).color('#ffffff').stroke(1.2)));
  const sad2d = s2([-3, 3], [-2, 2]).title('Level Curves: z=x²−y²  Hyperbolas')
    .add(...saddleCurves([-2, -1, 0, 1, 2], ['#3b4cc0', '#7396ea', '#000000', '#f6a582', '#b40426']));
  const sad3d = plot3d({ elev: 25, azim: -50 }).title('3D: z=x²−y² (Saddle)')
    .add(planeZ((x, y) => x * x - y * y, [-2, 2], [-2, 2]).solid(30, 30).cmap('coolwarm').opacity(0.85),
      ...[-3, -1.5, 0, 1.5, 3].map((cz) => {
        const r = Math.sqrt(Math.max(Math.abs(cz), 0.1));
        return curve3.parametric((t) => [r * Math.cosh(t), r * Math.sinh(t), cz]).on([-2, 2]).color('#ffffff').stroke(1).opacity(0.6);
      }));
  return subplots([bowl2d, bowl3d, sad2d, sad3d], { cols: 2, title: 'From Level Curves to 3D Surface' });
}

// ── 18. Contour Spacing Reveals Steepness (1×2, 2D) ──
function contourSteepness() {
  const steep = s2([-2, 2], [-2, 2]).title('Tight Contours → Steep Slope  Like a cliff')
    .add(...[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((c) => circ2(Math.sqrt(c)).color(B).stroke(0.8)));
  const flat = s2([-3, 3], [-3, 3]).title('Wide Contours → Gentle Slope  Like a plain')
    .add(...[0.5, 1.5, 2.5, 3.5, 4.5].map((c) => circ2(Math.sqrt(c)).color(B).stroke(1.5)));
  return subplots([steep, flat], { cols: 2, title: 'Contour Spacing Reveals Steepness' });
}

// ── 19. Level Curve Analysis — Saddle (1×2 2D + 3D) ──
function stepLevelCurves() {
  const cs = [-2, -1, 0, 1, 2], colors = ['darkblue', 'blue', '#000000', 'red', 'darkred'];
  const a = s2([-3, 3], [-2.5, 2.5]).title('Step 1: Draw f(x,y)=c for c=−2…2').add(...saddleCurves(cs, colors));
  const b = s2([-3, 3], [-2.5, 2.5]).title('Step 2: Color-code  Blue=low, Red=high').add(...saddleCurves(cs, colors));
  const c = plot3d({ elev: 25, azim: -50 }).title('Step 3: Stack into 3D  Saddle emerges')
    .add(planeZ((x, y) => x * x - y * y, [-2, 2], [-2, 2]).solid(30, 30).cmap('coolwarm').opacity(0.8));
  return subplots([a, b, c], { cols: 3, title: 'Level Curve Analysis — z=x²−y² (Saddle)', tight: true });
}

// ── 20. Quadric Identification (2×3) ──
function quadricIdentification() {
  const specs = [
    ['Ellipsoid  x²/a²+y²/b²+z²/c²=1', [ellipS(2, 1.5, 1).wire(24, 14)]],
    ['Hyperboloid 1 Sheet  x²+y²−z²/4=1', [hyper1S(1, 1, 2).wire(24, 14)]],
    ['Hyperboloid 2 Sheets  −x²−y²+z²/2.25=1', [hyper2S(1, 1, 1.5, O3, [0.7, 2]).wire(24, 14), hyper2S(1, 1, 1.5, O3, [-2, -0.7]).wire(24, 14)]],
    ['Elliptic Paraboloid  z=x²/a²+y²/b²', [planeZ((x, y) => x * x + y * y, [-1.5, 1.5], [-1.5, 1.5]).wire(18, 18)]],
    ['Hyperbolic Paraboloid  z=x²/a²−y²/b²', [planeZ((x, y) => x * x - y * y, [-1.5, 1.5], [-1.5, 1.5]).wire(18, 18)]],
    ['Cone  x²+y²−z²=0', [coneS(1).wire(24, 14)]],
  ];
  return subplots(specs.map(([t, list]) => plot3d().title(t).add(...list.map((o) => o.color(B).opacity(0.5)))), { cols: 3, title: 'Quadric Surface Identification', tight: true });
}

// ── 21. Ellipsoid Details (1×2) ──
function ellipsoidDetails() {
  const a = 2, b = 3, c = 1;
  const left = plot3d().title('Ellipsoid  x²/4+y²/9+z²=1')
    .add(...axes3({ length: 3.5, color: GRAY, width: 0.7 }), ellipS(a, b, c).wire(30, 20).color(B).opacity(0.4),
      point(a, 0, 0).marker('circle').color(R).size(5), point(-a, 0, 0).marker('circle').color(R).size(5),
      point(0, b, 0).marker('circle').color(G).size(5), point(0, -b, 0).marker('circle').color(G).size(5),
      point(0, 0, c).marker('circle').color(M).size(5), point(0, 0, -c).marker('circle').color(M).size(5),
      annotate.text(point(a + 0.3, 0, 0)).label('a=2').color(R).font(10),
      annotate.text(point(0, b + 0.3, 0)).label('b=3').color(G).font(10),
      annotate.text(point(0, 0, c + 0.3)).label('c=1').color(M).font(10));
  const right = plot3d().title('Three Orthogonal Cross-Sections').legend('upper right')
    .add(ellipS(a, b, c).wire(30, 20).color(B).opacity(0.4),
      curve3.parametric((t) => [a * Math.cos(t), b * Math.sin(t), 0]).on([0, tau]).color(R).stroke(2.5).label('z=0: ellipse'),
      curve3.parametric((t) => [0, b * Math.cos(t), c * Math.sin(t)]).on([0, tau]).color(G).stroke(2.5).label('x=0: ellipse'),
      curve3.parametric((t) => [a * Math.cos(t), 0, c * Math.sin(t)]).on([0, tau]).color(M).stroke(2.5).label('y=0: ellipse'));
  return subplots([left, right], { cols: 2, title: 'Ellipsoid — The 3D Ellipse', tight: true });
}

// ── 22. Elliptic Paraboloid Details (1×2) ──
function paraboloidDetails() {
  const f = (x, y) => x * x + 2 * y * y;
  const left = plot3d().title('Elliptic Paraboloid  z=x²+2y²')
    .add(...axes3({ length: 3, color: GRAY, width: 0.7 }), planeZ(f, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.4),
      point(0, 0, 0).marker('circle').color(R).size(6),
      annotate.text(point(0, 0, 0.5)).label('Vertex (0,0,0)').color(R).font(10));
  const right = plot3d().title('Cross-Sections: Parabolas  Level Curves: Ellipses').legend('upper left')
    .add(planeZ(f, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.3),
      curve3.parametric((t) => [t, 0, t * t]).on([-2, 2]).color(R).stroke(2.5).label('y=0: z=x²'),
      curve3.parametric((t) => [0, t, 2 * t * t]).on([-2, 2]).color(G).stroke(2.5).label('x=0: z=2y²'),
      ...[1, 2, 3, 4].map((cz) => curve3.parametric((t) => [Math.sqrt(cz) * Math.cos(t), Math.sqrt(cz / 2) * Math.sin(t), cz]).on([0, tau]).color('#ffffff').stroke(1)));
  return subplots([left, right], { cols: 2, title: 'Elliptic Paraboloid — The 3D Bowl', tight: true });
}

// ── 23. Hyperbolic Paraboloid Details (1×2) ──
function hyperbolicParaboloidDetails() {
  const f = (x, y) => x * x - y * y;
  const left = plot3d().title('Hyperbolic Paraboloid  z=x²−y²')
    .add(...axes3({ length: 3, color: GRAY, width: 0.7 }), planeZ(f, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.4),
      curve3.parametric((t) => [t, 0, t * t]).on([-2, 2]).color(R).stroke(2.5),
      curve3.parametric((t) => [0, t, -t * t]).on([-2, 2]).color(B).stroke(2.5),
      point(0, 0, 0).marker('circle').color('#000').size(6),
      annotate.text(point(0, 0, 0.8)).label('Saddle Point').anchor('middle').color('#000').font(9));
  const right = plot3d().title('Level Curves: Hyperbolas  Crossing lines at z=0')
    .add(planeZ(f, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.2),
      ...[-3, -1.5, 0, 1.5, 3].map((cz) => {
        if (cz === 0) return curve3.through([[-2, -2, 0], [2, 2, 0]]).color('#000').stroke(2);
        const r = Math.sqrt(Math.abs(cz));
        const col = cz > 0 ? 'red' : 'blue';
        const g = cz > 0 ? [(t) => Math.sqrt(t * t + r * r), (t) => t] : [(t) => t, (t) => Math.sqrt(t * t + r * r)];
        return [curve3.parametric((t) => [g[0](t), g[1](t), cz]).on([-2, 2]).color(col).stroke(1.5),
          curve3.parametric((t) => [-g[0](t), -g[1](t), cz]).on([-2, 2]).color(col).stroke(1.5)];
      }).flat());
  return subplots([left, right], { cols: 2, title: 'Hyperbolic Paraboloid — The Saddle', tight: true });
}

// ── 24. Four Types of Cylinders (2×2) ──
function cylinderTypes() {
  const circ = plot3d().title('Circular Cylinder  x²+y²=1')
    .add(...axes3({ length: 3.5, color: GRAY, width: 0.7 }), cylS(1, O3, [-3, 3]).wire(30, 15).color(B).opacity(0.4));
  const sinu = plot3d().title('Sinusoidal Cylinder  z=sin x')
    .add(...axes3({ length: 3.5, color: GRAY, width: 0.7 }), planeZ(Math.sin, [-4, 4], [-3, 3]).wire(30, 12).color(B).opacity(0.4));
  const ell = plot3d().title('Elliptic Cylinder  x²/4+z²/9=1')
    .add(...axes3({ length: 3.5, color: GRAY, width: 0.7 }), srf((u, v) => [2 * Math.cos(u), v, 3 * Math.sin(u)], [0, tau], [-3, 3]).wire(30, 15).color(B).opacity(0.4));
  const par = plot3d().title('Parabolic Cylinder  y=x²')
    .add(...axes3({ length: 3.5, color: GRAY, width: 0.7 }), srf((u, v) => [u, u * u, v], [-3, 3], [-3, 3]).wire(24, 12).color(B).opacity(0.4));
  return subplots([circ, sinu, ell, par], { cols: 2, title: 'Four Types of Cylinders', tight: true });
}

// ── 25. Hyperboloid of One Sheet (1×2) ──
function hyperboloidOneSheet() {
  const left = plot3d().title('Hyperboloid of One Sheet  x²+y²−z²/4=1  Connected')
    .add(...axes3({ length: 4, color: GRAY, width: 0.7 }), hyper1S(1, 1, 2).wire(30, 20).color(B).opacity(0.4));
  const right = plot3d().title('Cross-sections: z=0 (waist), z=1, z=2  All ellipses')
    .add(...axes3({ length: 4, color: GRAY, width: 0.7 }), hyper1S(1, 1, 2).wire(30, 20).color(B).opacity(0.3),
      ...[0, 1, 2].map((zv) => circle3(Math.sqrt(1 + (zv / 2) ** 2), zv).color(R).stroke(2)));
  return subplots([left, right], { cols: 2, title: 'Hyperboloid of One Sheet (Connected)', tight: true });
}

// ── 26. Hyperboloid of Two Sheets (1×2) ──
function hyperboloidTwoSheets() {
  const sheets = () => [hyper2S(1, 1, 2, O3, [0.7, 2]).wire(30, 12).color(B).opacity(0.4), hyper2S(1, 1, 2, O3, [-2, -0.7]).wire(30, 12).color(B).opacity(0.4)];
  const left = plot3d().title('Hyperboloid of Two Sheets  −x²−y²+z²/4=1  Disconnected')
    .add(...axes3({ length: 5, color: GRAY, width: 0.7 }), ...sheets());
  const right = plot3d().title('Gap: |z|<2 has NO real points')
    .add(...axes3({ length: 5, color: GRAY, width: 0.7 }), ...sheets(),
      annotate.text(point(0, 0, 0)).label('GAP\n|z|<2\nno points').anchor('middle').color(R).bold().font(12));
  return subplots([left, right], { cols: 2, title: 'Hyperboloid of Two Sheets (Disconnected)', tight: true });
}

// ── 27. Double Cone Details (1×2) ──
function coneDetails() {
  const left = plot3d().title('Double Cone  z²=x²+y²')
    .add(...axes3({ length: 3, color: GRAY, width: 0.7 }), coneS(1, O3, [-2, 2]).wire(30, 20).color(B).opacity(0.4),
      point(0, 0, 0).marker('circle').color(R).size(6),
      annotate.text(point(0, 0, 0.5)).label('Vertex (0,0,0)').anchor('middle').color(R).font(10));
  const right = plot3d().title('Cross-sections: Circles  Radius r=|z|')
    .add(...axes3({ length: 3, color: GRAY, width: 0.7 }), coneS(1, O3, [-2, 2]).wire(30, 20).color(B).opacity(0.25),
      ...[-2, -1, 0, 1, 2].map((zv) => (zv === 0 ? point(0, 0, 0).marker('circle').color('#000').size(6) : circle3(Math.abs(zv), zv).color(R).stroke(2))));
  return subplots([left, right], { cols: 2, title: 'Double Cone — Two Nappes', tight: true });
}

// ── 28. Quadric Surfaces — Complete Gallery (2×3) ──
function quadricComparison() {
  const specs = [
    ['Ellipsoid', [ellipS(2, 1.5, 1).wire(25, 15)]],
    ['Elliptic Paraboloid', [planeZ((x, y) => x * x + y * y, [-1.5, 1.5], [-1.5, 1.5]).wire(15, 15)]],
    ['Hyperbolic Paraboloid', [planeZ((x, y) => x * x - y * y, [-1.5, 1.5], [-1.5, 1.5]).wire(15, 15)]],
    ['Cylinder', [cylS(1, O3, [-2, 2]).wire(25, 15)]],
    ['Hyperboloid 1 Sheet', [hyper1S(1, 1, 1.5).wire(25, 15)]],
    ['Cone', [coneS(1, O3, [-1.5, 1.5]).wire(25, 15)]],
  ];
  return subplots(specs.map(([t, list]) => plot3d().title(t).add(...list.map((o) => o.color(B).opacity(0.5)))), { cols: 3, title: 'Quadric Surfaces — Complete Gallery', tight: true });
}

// ── 29. Degenerate Quadric Surfaces (1×3) ──
function degenerateCases() {
  const a = plot3d().title('x²+y²+z²=0 → Single Point (0,0,0)')
    .add(...axes3({ length: 2, color: GRAY, width: 0.7 }), frame3([-2, 2], [-2, 2], [-2, 2]), point(0, 0, 0).marker('circle').color(R).size(11));
  const b = plot3d().title('x²+y²=0 → The z-axis (line)')
    .add(...axes3({ length: 2, color: GRAY, width: 0.7 }), frame3([-2, 2], [-2, 2], [-2, 2]), curve3.through([[0, 0, -3], [0, 0, 3]]).color(B).stroke(3));
  const lines = [];
  for (let k = 0; k < 8; k++) {
    const z = -2 + (4 * k) / 7;
    lines.push(curve3.through([[-2, -2, z], [2, 2, z]]).color(OR).stroke(1).opacity(0.5));
    lines.push(curve3.through([[-2, 2, z], [2, -2, z]]).color(G).stroke(1).opacity(0.5));
  }
  const c = plot3d().title('x²−y²=0 → Two planes y=±x')
    .add(...axes3({ length: 2, color: GRAY, width: 0.7 }), frame3([-2, 2], [-2, 2], [-2, 2]), ...lines);
  return subplots([a, b, c], { cols: 3, title: 'Degenerate Quadric Surfaces', tight: true });
}

// ── 30. Sphere ∩ Plane (single 3D) ──
function spherePlaneIntersection() {
  const R20 = Math.sqrt(20), r = Math.sqrt(8);
  const u = [1 / Math.SQRT2, -1 / Math.SQRT2, 0], v = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)];
  const circ = curve3.parametric((t) => [
    2 + r * (u[0] * Math.cos(t) + v[0] * Math.sin(t)),
    2 + r * (u[1] * Math.cos(t) + v[1] * Math.sin(t)),
    2 + r * (u[2] * Math.cos(t) + v[2] * Math.sin(t)),
  ]).on([0, tau]).color(R).stroke(3);
  return plot3d({ elev: 20, azim: -55 }).title('Sphere x²+y²+z²=20 ∩ Plane x+y+z=6  Circle center (2,2,2), r=2√2').add(
    frame3([-1, 5], [-1, 5], [-1, 5]),
    ...axes3({ length: 4, color: GRAY, width: 0.7 }),
    ballS(R20).wire(40, 20).color(B).opacity(0.2),
    planeZ((x, y) => 6 - x - y, [0, 4], [0, 4]).solid(24, 24).color(OR).opacity(0.4),
    circ,
    point(2, 2, 2).marker('circle').color(R).size(6),
  ).compile();
}

// ── 31. Two Cylinders Intersection ──
function cylindersIntersection() {
  return plot3d({ elev: 25, azim: -50 }).title('x²+y²=1 ∩ x²+z²=1  Intersection: Two Crossing Ellipses').add(
    frame3([-1.5, 1.5], [-1.5, 1.5], [-1.5, 1.5]),
    ...axes3({ length: 2, color: GRAY, width: 0.7 }),
    cylS(1, O3, [-2, 2]).wire(40, 18).color(B).opacity(0.25),
    srf((u, v) => [Math.cos(u), v, Math.sin(u)], [0, tau], [-2, 2]).wire(40, 18).color(OR).opacity(0.25),
    curve3.parametric((t) => [Math.cos(t), Math.sin(t), Math.sin(t)]).on([0, tau]).color(R).stroke(3),
    curve3.parametric((t) => [Math.cos(t), Math.sin(t), -Math.sin(t)]).on([0, tau]).color(R).stroke(3),
  ).compile();
}

// ── 32. Line–Sphere Intersection ──
function lineSurfaceIntersection() {
  return plot3d({ elev: 20, azim: -55 }).title('Line–Sphere Intersection  (t, t, 5−t) ∩ x²+y²+z²=25').add(
    frame3([-3, 6], [-3, 6], [-2, 7]),
    ...axes3({ length: 5, color: GRAY, width: 0.7 }),
    ballS(5).wire(36, 20).color(B).opacity(0.2),
    curve3.parametric((t) => [t, t, 5 - t]).on([-2, 6]).color(R).stroke(2.5),
    point(0, 0, 5).marker('circle').color(G).size(8),
    point(10 / 3, 10 / 3, 5 / 3).marker('circle').color(M).size(8),
    annotate.text(point(0.3, 0.3, 5.5)).label('Entry (0,0,5)\nt=0').color(G).font(10),
    annotate.text(point(10 / 3 + 0.3, 10 / 3 + 0.3, 5 / 3 + 0.5)).label('Exit (10/3,10/3,5/3)\nt=10/3').color(M).font(10),
  ).compile();
}

// ── 33. Symmetry in 3D (1×3) ──
function symmetry3d() {
  const a = plot3d().title('z=x²+y²  xz, yz symmetry + rotational about z')
    .add(...axes3({ length: 3, color: GRAY, width: 0.6 }), planeZ((x, y) => x * x + y * y, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.5));
  const b = plot3d().title('x²+y²+z²=1  All plane symmetries + origin')
    .add(...axes3({ length: 1.5, color: GRAY, width: 0.6 }), ballS(1).wire(20, 15).color(B).opacity(0.5));
  const c = plot3d().title('z=xy  Origin symmetry only (x,y)→(−x,−y)')
    .add(...axes3({ length: 3, color: GRAY, width: 0.6 }), planeZ((x, y) => x * y, [-2, 2], [-2, 2]).wire(20, 20).color(B).opacity(0.5));
  return subplots([a, b, c], { cols: 3, title: 'Symmetries of Quadric Surfaces', tight: true });
}

// ── 34. Sphere–Plane Intersection — Step by Step (1×3) ──
function stepIntersection() {
  const R20 = Math.sqrt(20), r = Math.sqrt(8);
  const u = [1 / Math.SQRT2, -1 / Math.SQRT2, 0], v = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)];
  const titles = ['Step 1: Sphere x²+y²+z²=20', 'Step 2: Slice with plane x+y+z=6', 'Step 3: Intersection circle r=√(R²−D²)=2√2'];
  return subplots([0, 1, 2].map((i) => {
    const shapes = [frame3([-3, 5], [-3, 5], [-3, 5]), ...axes3({ length: 4, color: GRAY, width: 0.6 }), ballS(R20).wire(30, 18).color(B).opacity(0.3)];
    if (i >= 1) shapes.push(planeZ((x, y) => 6 - x - y, [0, 4], [0, 4]).solid(16, 16).color(OR).opacity(0.4));
    if (i === 2) {
      shapes.push(curve3.parametric((t) => [
        2 + r * (u[0] * Math.cos(t) + v[0] * Math.sin(t)),
        2 + r * (u[1] * Math.cos(t) + v[1] * Math.sin(t)),
        2 + r * (u[2] * Math.cos(t) + v[2] * Math.sin(t)),
      ]).on([0, tau]).color(R).stroke(3), point(2, 2, 2).marker('circle').color(R).size(5));
    }
    return plot3d({ elev: 20, azim: -55 }).title(titles[i]).add(...shapes);
  }), { cols: 3, title: 'Sphere–Plane Intersection — Step by Step', tight: true });
}

// ── 35. Building Quadric Surfaces — Step by Step (3×3) ──
function stepQuadrics() {
  const names = ['Ellipsoid', 'Paraboloid', 'Hyperboloid 1-Sheet'];
  const stages = ['Wireframe Skeleton', 'Solid Surface', '+ Cross Sections'];
  const surfaceOf = (col, stage) => {
    if (col === 0) return stage === 0 ? [ellipS(2, 1.5, 1).wire(20, 12)] : [ellipS(2, 1.5, 1).solid(24, 14).color('#ADD8E6').opacity(0.6)];
    if (col === 1) return stage === 0 ? [planeZ((x, y) => x * x + y * y, [-2, 2], [-2, 2]).wire(12, 12)] : [planeZ((x, y) => x * x + y * y, [-2, 2], [-2, 2]).solid(20, 20).color('#ADD8E6').opacity(0.6)];
    return stage === 0 ? [hyper1S(1, 1, 1.5).wire(15, 10)] : [hyper1S(1, 1, 1.5).solid(20, 12).color('#ADD8E6').opacity(0.6)];
  };
  const extraOf = (col) => {
    if (col === 0) return [curve3.parametric((t) => [2 * Math.cos(t), 1.5 * Math.sin(t), 0]).on([0, tau]).color(R).stroke(2),
      curve3.parametric((t) => [0, 1.5 * Math.cos(t), Math.sin(t)]).on([0, tau]).color(G).stroke(2)];
    if (col === 1) return [1, 2, 3].map((cz) => circle3(Math.sqrt(cz), cz).color(R).stroke(1.5));
    return [0, 1.5].map((zv) => circle3(Math.sqrt(1 + (zv / 1.5) ** 2), zv).color(R).stroke(1.5));
  };
  const list = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const shapes = [...(row > 0 ? axes3({ length: 3, color: GRAY, width: 0.6 }) : []), ...surfaceOf(col, Math.min(row, 1))];
    if (row === 2) shapes.push(...extraOf(col));
    let sc = plot3d().add(...shapes);
    const t = row === 0 ? names[col] : (col === 0 ? stages[row] : '');
    if (t) sc = sc.title(t);
    list.push(sc);
  }
  return subplots(list, { cols: 3, title: 'Building Quadric Surfaces — Step by Step', tight: true });
}

// ── run ─────────────────────────────────────────────────────────
//   figure 팩토리 목록 → SVG/PNG 저장 + index.html 갤러리.
//   (한 figure 가 실패해도 나머지는 계속 진행하고, 마지막에 요약을 출력한다.)
const figs = [
  ['9c-coordinate-system-3d', coordSys3d, '3D 좌표계 — 점의 좌표 읽기'],
  ['9c-step-3d-coords', step3dCoords, '좌표 읽기 3단계'],
  ['9c-vector-dot-cross', vectorDotCross, '내적(2D) / 외적(3D)'],
  ['9c-step-vectors', stepVectors, '3D 벡터 3단계'],
  ['9c-plane-intercept', planeIntercept, '평면의 절편 + 법선'],
  ['9c-plane-normal', planeNormal, '법선벡터 ⊥ 평면'],
  ['9c-step-plane', stepPlane, '3점 → 평면 3단계'],
  ['9c-point-plane-distance', pointPlaneDistance, '점-평면 거리'],
  ['9c-angle-planes', anglePlanes, '두 평면의 각'],
  ['9c-distance-parallel-planes', distanceParallelPlanes, '평행한 두 평면의 거리'],
  ['9c-sphere-details', sphereDetails, '구의 특징 (중심·반지름)'],
  ['9c-point-sphere-distance', pointSphereDistance, '점-구 거리 (2D 단면)'],
  ['9c-surface-height-map', surfaceHeightMap, '높이맵 z = x² + y²'],
  ['9c-step-surface-build', stepSurfaceBuild, '곡면 작도 3단계'],
  ['9c-domain-regions', domainRegions, '정의역 4종 (2D)'],
  ['9c-level-curves-method', levelCurvesMethod, '등위곡선 4종'],
  ['9c-level-curves-to-surface', levelCurvesToSurface, '등위곡선 → 곡면'],
  ['9c-contour-steepness', contourSteepness, '등고선 간격과 가파름'],
  ['9c-step-level-curves', stepLevelCurves, '등위곡선 작도 (2×3)'],
  ['9c-quadric-identification', quadricIdentification, '이차곡면 판별 (2×3)'],
  ['9c-ellipsoid-details', ellipsoidDetails, '타원체의 특징'],
  ['9c-paraboloid-details', paraboloidDetails, '타원 포물면'],
  ['9c-hyperbolic-paraboloid-details', hyperbolicParaboloidDetails, '쌍곡 포물면 (안장)'],
  ['9c-cylinder-types', cylinderTypes, '원기둥 4종 (2×2)'],
  ['9c-hyperboloid-one-sheet', hyperboloidOneSheet, '한 겹 쌍곡면'],
  ['9c-hyperboloid-two-sheets', hyperboloidTwoSheets, '두 겹 쌍곡면'],
  ['9c-cone-details', coneDetails, '이중 원뿔'],
  ['9c-quadric-comparison', quadricComparison, '이차곡면 총람 (2×3)'],
  ['9c-degenerate-cases', degenerateCases, '퇴화 이차곡면'],
  ['9c-sphere-plane-intersection', spherePlaneIntersection, '구 ∩ 평면'],
  ['9c-cylinders-intersection', cylindersIntersection, '두 원기둥의 교선'],
  ['9c-line-surface-intersection', lineSurfaceIntersection, '직선-구 교점'],
  ['9c-symmetry-3d', symmetry3d, '3D 대칭'],
  ['9c-step-intersection', stepIntersection, '교선 작도 3단계'],
  ['9c-step-quadrics', stepQuadrics, '이차곡면 작도 (3×3)'],
];

await saveFigures(figs, {
  dir: OUT,
  index: true,
  title: 'logos · Session 9C — 3D 기하 (example2.py 재현)',
});
