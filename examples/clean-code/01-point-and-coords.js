// examples/clean-code/01-point-and-coords.js — 점과 좌표계
//
//   무엇을 보여주나 : 직교·극·원기둥·구면 좌표로 점을 만들고 라벨/마커를 붙인다.
//   사용 API       : point(…) · point.origin/polar/cylindrical/spherical/midpoint
//                    · .label()/.dot()/.marker()/.size() · kit.plot2d/plot3d/poly3
//   실행           : node examples/clean-code/01-point-and-coords.js
import { join } from 'node:path';
import { point, segment, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '01-point-and-coords');
const { palette, saveFigures } = kit;

/** 2D — 직교좌표 vs 극좌표 */
const cartesianPolar = () =>
  kit
    .plot2d([-4, 4], [-3, 3])
    .equal()
    .title('Cartesian vs Polar')
    .add(
      point(3, 2).label('P(3, 2)').dot().color(palette.blue),
      point
        .polar(3, Math.PI / 6)
        .label('Q(r=3, θ=30°)')
        .dot()
        .color(palette.red),
      segment(point.origin(), point(3, 2)).dash([4, 3]).color(palette.gray),
      segment(point.origin(), point.polar(3, Math.PI / 6))
        .dash([4, 3])
        .color(palette.gray),
    );

/** 3D — 원기둥좌표 · 구면좌표 */
const cylindricalSpherical = () =>
  kit
    .plot3d({ elev: 22, azim: -55 })
    .title('Cylindrical & Spherical')
    .add(
      point
        .cylindrical(2, Math.PI / 4, 1)
        .label('(r, θ, z)')
        .dot()
        .color(palette.blue),
      point
        .spherical(3, Math.PI / 4, Math.PI / 3)
        .label('(ρ, θ, φ)')
        .dot()
        .color(palette.red),
      kit.poly3(
        [
          [0, 0, 0],
          [1.41, 1.41, 1],
        ],
        { color: palette.gray, dash: [4, 3] },
      ),
    );

/** 파생점 — 중점 */
const derived = () =>
  kit
    .plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Derived Points')
    .add(
      point(0, 0).label('A').dot(),
      point(4, 3).label('B').dot(),
      point.midpoint(point(0, 0), point(4, 3)).marker('circle').size(6).color(palette.red),
      annotate.text(point(2, 1.5)).label('M(2, 1.5)').offset(8, 10).font(11),
    );

await saveFigures(
  [
    ['01-cartesian-polar', cartesianPolar, '직교 · 극좌표'],
    ['01-3d-coords', cylindricalSpherical, '원기둥 · 구면좌표'],
    ['01-derived', derived, '중점'],
  ],
  { dir: OUT, index: true, title: 'logos · 01 점과 좌표계' },
);
