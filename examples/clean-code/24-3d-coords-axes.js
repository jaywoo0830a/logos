// examples/clean-code/24-3d-coords-axes.js — 3D 좌표계와 기본 도형
//
//   무엇을 보여주나 : 3D 씬·카메라·축(axes3)·프레이밍(frame3)과 점·화살표·공간곡선.
//   사용 API       : kit.plot3d({elev,azim}) · axes3({xlim,ylim,zlim}) · frame3(xr,yr,zr)
//                    · point(x,y,z) · arrow3(A,B) · curve3.parametric(f).on([a,b])
//   실행           : node examples/clean-code/24-3d-coords-axes.js
import { join } from 'node:path';
import { point, vector, curve3, arrow3, axes3, frame3, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '24-3d-coords-axes');
const { palette, plot3d, subplots, saveFigures } = kit;

/** 좌표축 + 점의 좌표 */
const axesAndPoints = () =>
  plot3d({ elev: 20, azim: -55 })
    .title('axes3 + points')
    .add(
      axes3({ xlim: [-2, 2], ylim: [-2, 2], zlim: [-2, 2] }),
      frame3([-2, 2], [-2, 2], [-2, 2]),
      point(1, 1, 1).dot().color(palette.blue).label('(1, 1, 1)'),
      point(-1, 1, 0.5).dot().color(palette.red).label('(−1, 1, 0.5)'),
      annotate
        .text(point(0, 0, -2.2))
        .label('axes3 로 그린 좌표축')
        .font(11)
        .anchor('middle'),
    );

/** 화살표 벡터 합 */
const arrows = () =>
  plot3d({ elev: 24, azim: -60 })
    .title('arrow3  a + b')
    .add(
      axes3({ xlim: [-1, 3], ylim: [-1, 3], zlim: [-1, 3] }),
      arrow3(point(0, 0, 0), point(2, 0, 0)).color(palette.blue),
      arrow3(point(0, 0, 0), point(0, 2, 1)).color(palette.red),
      arrow3(point(0, 0, 0), point(2, 2, 1)).color(palette.green),
      annotate
        .text(point(2, 0, 0))
        .label('a')
        .font(12),
      annotate
        .text(point(0, 2, 1))
        .label('b')
        .font(12),
      annotate
        .text(point(2, 2, 1))
        .label('a+b')
        .font(12)
        .color(palette.green),
    );

/** 공간곡선 (나선 · 리사주 3D) */
const spaceCurves = () =>
  subplots(
    [
      plot3d({ elev: 18, azim: -50 })
        .title('helix')
        .add(
          axes3({ xlim: [-1, 1], ylim: [-1, 1], zlim: [0, 6] }),
          curve3
            .parametric((t) => [Math.cos(t), Math.sin(t), t])
            .on([0, 6])
            .color(palette.purple)
            .stroke(2.5),
        ),
      plot3d({ elev: 26, azim: -45 })
        .title('lissajous 3D')
        .add(
          axes3({ xlim: [-1, 1], ylim: [-1, 1], zlim: [-1, 1] }),
          curve3
            .parametric((t) => [Math.sin(3 * t), Math.sin(4 * t + 1), Math.cos(2 * t)])
            .on([0, Math.PI * 2])
            .color(palette.green)
            .stroke(2.5),
        ),
    ],
    { cols: 2, title: 'Space Curves', tight: true },
  );

await saveFigures(
  [
    ['24-axes-points', axesAndPoints, '좌표축 · 점'],
    ['24-arrows', arrows, '화살표'],
    ['24-space-curves', spaceCurves, '공간곡선'],
  ],
  { dir: OUT, index: true, title: 'logos · 24 3D 좌표계' },
);
