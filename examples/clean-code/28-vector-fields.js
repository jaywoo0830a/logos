// examples/clean-code/28-vector-fields.js — 벡터장
//
//   무엇을 보여주나 : 평면 벡터장(회전장·발산장·포텐셜 기울기)과 곡선 위의 흐름.
//   사용 API       : vectorField((x,y) ⇒ [u,v]).on(xr, yr) · curve.fn · annotate.arrow
//   실행           : node examples/clean-code/28-vector-fields.js
import { join } from 'node:path';
import { point, curve, vectorField, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '28-vector-fields');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 회전장 F = (−y, x) */
const rotationField = () =>
  plot2d([-3, 3], [-3, 3])
    .equal()
    .title('F = (−y, x)   회전장')
    .add(
      vectorField((x, y) => [-y, x])
        .on([-2.5, 2.5], [-2.5, 2.5])
        .color(palette.blue)
        .opacity(0.85),
      point(0, 0).dot().label('O'),
    );

/** 발산장 F = (x, y) · 포텐셜 기울기 */
const radialField = () =>
  subplots(
    [
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('F = (x, y)  발산장')
        .add(
          vectorField((x, y) => [x, y])
            .on([-2.5, 2.5], [-2.5, 2.5])
            .color(palette.red),
        ),
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('∇(x²+y²)  기울기장')
        .add(
          vectorField((x, y) => [2 * x, 2 * y])
            .on([-2, 2], [-2, 2])
            .color(palette.green)
            .opacity(0.8),
          curve
            .fn((x) => Math.sqrt(Math.max(0, 4 - x * x)))
            .on([-2, 2])
            .color(palette.gray)
            .dash([4, 3]),
        ),
    ],
    { cols: 2, title: 'Radial & Gradient', tight: true },
  );

/** 흐름 따라가기 — 벡터장 + 궤적 */
const flow = () =>
  plot2d([-2, 4], [-2.5, 2.5])
    .title('field + trajectory')
    .add(
      vectorField((x, y) => [1, -0.4 * y])
        .on([-1.5, 3.5], [-2, 2])
        .color(palette.skyblue)
        .opacity(0.9),
      curve
        .fn((x) => 2 * Math.exp(-0.4 * x))
        .on([-1.5, 3.5])
        .color(palette.crimson)
        .stroke(3),
      annotate.text(point(1.4, 1.8)).label('y = 2e^{−0.4x} 는 장을 따라간다').font(11),
    );

await saveFigures(
  [
    ['28-rotation-field', rotationField, '회전장'],
    ['28-radial-gradient', radialField, '발산 · 기울기'],
    ['28-flow', flow, '궤적'],
  ],
  { dir: OUT, index: true, title: 'logos · 28 벡터장' },
);
