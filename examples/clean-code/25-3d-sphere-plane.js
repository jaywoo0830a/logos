// examples/clean-code/25-3d-sphere-plane.js — 구 · 평면 · 이차곡면
//
//   무엇을 보여주나 : 구(위선/경선), 좌표평면, 구와 평면의 교선, 공간벡터장.
//   사용 API       : sphere.center(O).radius(r).rings(n).meridians(n) · plane.coordinate('xy')
//                    · circle3(r, z, C) · quadrics.ball(r) · vectorField3? → kit.plot3d + axes3
//   실행           : node examples/clean-code/25-3d-sphere-plane.js
import { join } from 'node:path';
import { point, sphere, plane, circle3, quadrics, axes3, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '25-3d-sphere-plane');
const { palette, plot3d, subplots, saveFigures } = kit;

/** 구 + 좌표평면 */
const spherePlane = () =>
  plot3d({ elev: 22, azim: -50 })
    .title('sphere ∩ plane')
    .add(
      sphere
        .center(point(0, 0, 0))
        .radius(1.6)
        .rings(4)
        .meridians(6)
        .opacity(0.22),
      plane.coordinate('xy').opacity(0.3),
      circle3(1.6, 0, point(0, 0, 0))
        .color(palette.red)
        .stroke(2),
      point(0, 0, 0).dot().label('O'),
      annotate
        .text(point(0, 0, -1.9))
        .label('z=0 평면과의 교선 = 대원')
        .font(11)
        .anchor('middle'),
    );

/** 위선/경선 제어 */
const sphereStyles = () =>
  subplots(
    [
      plot3d({ elev: 20, azim: -50 })
        .title('rings(3) only')
        .add(
          axes3({ xlim: [-1, 1], ylim: [-1, 1], zlim: [-1, 1] }),
          sphere
            .center(point(0, 0, 0))
            .radius(1)
            .rings(3)
            .meridians(0),
        ),
      plot3d({ elev: 20, azim: -50 })
        .title('meridians(8) only')
        .add(
          axes3({ xlim: [-1, 1], ylim: [-1, 1], zlim: [-1, 1] }),
          sphere
            .center(point(0, 0, 0))
            .radius(1)
            .rings(false)
            .meridians(8),
        ),
      plot3d({ elev: 20, azim: -50 })
        .title('filled + opacity')
        .add(
          sphere
            .center(point(0, 0, 0))
            .radius(1)
            .rings(2)
            .opacity(0.35)
            .color(palette.blue),
        ),
      plot3d({ elev: 20, azim: -50 })
        .title('quadrics.ball(1)')
        .add(axes3({ xlim: [-1.5, 1.5], ylim: [-1.5, 1.5], zlim: [-1.5, 1.5] }), quadrics.ball(1).wire(8, 8)),
    ],
    { cols: 2, title: 'Sphere Styles', tight: true },
  );

await saveFigures(
  [
    ['25-sphere-plane', spherePlane, '구 ∩ 평면'],
    ['25-sphere-styles', sphereStyles, '위선 · 경선 · 이차곡면'],
  ],
  { dir: OUT, index: true, title: 'logos · 25 3D 구 · 평면' },
);
