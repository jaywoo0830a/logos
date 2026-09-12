// examples/clean-code/16-coordinate-systems.js — 좌표계
//
//   무엇을 보여주나 : 같은 점을 직교·극·원기둥·구면·복소 좌표로 다룬다.
//   사용 API       : point.polar/cylindrical/spherical/complex · scene().polarGrid()/.sphericalGrid()
//                    · cplx(…).abs() 대신 cplx.abs(z) 정적 · annotate.text
//   실행           : node examples/clean-code/16-coordinate-systems.js
import { join } from 'node:path';
import { scene, point, segment, cplx, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '16-coordinate-systems');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 극좌표 격자 위의 점들 */
const polarPoints = () => {
  const pts = [0, 1, 2, 3, 4, 5].map((k) => point.polar(2, (k * Math.PI) / 3));
  return plot2d([-3, 3], [-3, 3])
    .equal()
    .axes(false)
    .polarGrid({ rings: 3, sectors: 12 })
    .title('polarGrid + point.polar')
    .add(
      ...pts.map((p, i) =>
        p
          .dot()
          .color(palette.tab10[i % 10])
          .label(`${i * 60}°`),
      ),
      segment(point.origin(), point.polar(2, Math.PI / 3))
        .color(palette.gray)
        .stroke(1.5),
    );
};

/** 복소평면 — 실수부/허수부가 곧 x/y */
const complexPlane = () => {
  const z = cplx(2, 1);
  const w = cplx(-1, 2);
  return plot2d([-3, 3], [-2.5, 3])
    .equal()
    .title('complex plane  (Re, Im)')
    .add(
      point.complex(z.re, z.im).dot().color(palette.blue).label(`z = ${z}`),
      point.complex(w.re, w.im).dot().color(palette.red).label(`w = ${w}`),
      point
        .complex(z.add(w).re, z.add(w).im)
        .dot()
        .color(palette.green)
        .label(`z+w = ${z.add(w)}`),
      annotate
        .text(point(0, -2))
        .label('|z| = ' + cplx.abs(z).toFixed(3))
        .font(12)
        .anchor('middle'),
    );
};

/** 3D 원기둥/구면 좌표 격자 */
const grid3d = () =>
  subplots(
    [
      scene()
        .size(420, 400)
        .dim(3)
        .sphericalGrid()
        .camera({ position: [5, 5, 5] })
        .title('sphericalGrid')
        .add(
          point
            .spherical(2.4, Math.PI / 4, Math.PI / 3)
            .dot()
            .label('P'),
        ),
      kit
        .plot3d({ elev: 20, azim: -50 })
        .title('cylindrical')
        .add(
          point
            .cylindrical(1.6, Math.PI / 6, 1.2)
            .dot()
            .label('(r,θ,z)'),
          kit.poly3(
            [
              [0, 0, 0],
              [1.39, 0.8, 1.2],
            ],
            { color: palette.gray, dash: [4, 3] },
          ),
        ),
    ],
    { cols: 2, title: '3D Coordinate Grids', tight: true },
  );

await saveFigures(
  [
    ['16-polar-points', polarPoints, '극좌표 점들'],
    ['16-complex-plane', complexPlane, '복소평면'],
    ['16-3d-grids', grid3d, '3D 격자'],
  ],
  { dir: OUT, index: true, title: 'logos · 16 좌표계' },
);
