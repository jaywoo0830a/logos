// examples/clean-code/26-3d-quadrics-surface.js — 이차곡면과 곡면
//
//   무엇을 보여주나 : 표준 이차곡면(타원체·원기둥·원뿔·쌍곡면·평면)과 함수 곡면, 색상맵.
//   사용 API       : quadrics.ellipsoid/ball/cylinder/cone/plane/hyperboloid1/hyperboloid2
//                    · .wire(nu,nv)/.solid(nu,nv)/.cmap(name) · surface.z(f).on(xr,yr) · surfaceParam
//   실행           : node examples/clean-code/26-3d-quadrics-surface.js
import { join } from 'node:path';
import { point, surface, surfaceParam, quadrics, axes3, cmapColor, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '26-3d-quadrics-surface');
const { palette, plot2d, plot3d, subplots, saveFigures } = kit;

const AX = (r = 1.6) => axes3({ xlim: [-r, r], ylim: [-r, r], zlim: [-r, r] });

/** 표준 이차곡면 갤러리 */
const quadricGallery = () =>
  subplots(
    [
      plot3d({ elev: 20, azim: -50 })
        .title('ellipsoid')
        .add(AX(), quadrics.ellipsoid(1.2, 0.9, 0.7).solid(16, 16)),
      plot3d({ elev: 20, azim: -50 }).title('cylinder').add(AX(), quadrics.cylinder(1).wire(14, 3)),
      plot3d({ elev: 20, azim: -50 }).title('cone').add(AX(), quadrics.cone(1).wire(14, 4)),
      plot3d({ elev: 20, azim: -50 }).title('hyperboloid').add(AX(), quadrics.hyperboloid1(1).wire(14, 8)),
    ],
    { cols: 2, title: 'Quadric Surfaces', tight: true },
  );

/** 함수 곡면 + 색상맵 */
const functionSurfaces = () =>
  subplots(
    [
      plot3d({ elev: 24, azim: -55 })
        .title('z = x² − y²')
        .add(
          AX(1.2),
          surface
            .z((x, y) => x * x - y * y)
            .on([-1, 1], [-1, 1])
            .cmap('coolwarm')
            .mesh(16, 16),
        ),
      plot3d({ elev: 24, azim: -55 })
        .title('안장면 (parametric)')
        .add(
          AX(1.2),
          surfaceParam((u, v) => [u, v, u * v])
            .on([-1, 1], [-1, 1])
            .cmap('viridis')
            .solid(16, 16),
        ),
    ],
    { cols: 2, title: 'Surface Modes', tight: true },
  );

/** wire / solid / cmap 비교 + 색상맵 색상 띠 */
const modes = () =>
  subplots(
    [
      plot3d({ elev: 22, azim: -52 })
        .title('.wire(8, 8)')
        .add(AX(), quadrics.plane((x, y) => Math.sin(x) * Math.cos(y), [-1.5, 1.5], [-1.5, 1.5]).wire(8, 8)),
      plot3d({ elev: 22, azim: -52 })
        .title('.solid(10, 10)')
        .add(AX(), quadrics.plane((x, y) => Math.sin(x) * Math.cos(y), [-1.5, 1.5], [-1.5, 1.5]).solid(10, 10)),
      plot2d([0, 1], [0, 1])
        .axes(false)
        .title('cmapColor(name, t)')
        .add(
          ...Array.from({ length: 25 }, (_, i) =>
            point(i / 24, 0.5)
              .marker('circle')
              .size(9)
              .color(cmapColor('viridis', i / 24)),
          ),
          annotate.text(point(0.5, 0.2)).label('viridis').font(12).anchor('middle'),
        ),
    ],
    { cols: 3, title: 'Wire / Solid / Colormap', tight: true },
  );

await saveFigures(
  [
    ['26-quadrics', quadricGallery, '이차곡면 4종'],
    ['26-function-surfaces', functionSurfaces, '함수 곡면 · cmap'],
    ['26-surface-modes', modes, 'wire · solid · cmap'],
  ],
  { dir: OUT, index: true, title: 'logos · 26 이차곡면' },
);
