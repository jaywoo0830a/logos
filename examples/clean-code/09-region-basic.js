// examples/clean-code/09-region-basic.js — 영역 채우기
//
//   무엇을 보여주나 : 곡선·원으로 둘러싸인 영역을 조건으로 채운다.
//   사용 API       : region.below(curve) · region.inside(circle) · region.between(f,g).on([a,b])
//                    · region.betweenX(f) · region.intersect(r1,r2) · .fill()/.opacity()
//   실행           : node examples/clean-code/09-region-basic.js
import { join } from 'node:path';
import { point, curve, circle, region, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '09-region-basic');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 아래 영역 (정적분 아이디어) */
const below = () =>
  plot2d([-0.5, 3], [-0.5, 3])
    .title('region.below  y = x²')
    .add(
      region
        .below(curve.fn((x) => x * x).on([0, 2]))
        .fill(palette.skyblue)
        .opacity(0.5),
      curve
        .fn((x) => x * x)
        .on([0, 2])
        .color(palette.blue)
        .stroke(2.5),
      annotate.text(point(1.5, 0.6)).label('∫₀² x² dx').font(14),
    );

/** 원 내부 · 두 원의 교집합 */
const circles = () =>
  subplots(
    [
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('region.inside')
        .add(
          region
            .inside(circle.center(point(0, 0)).radius(2))
            .fill(palette.green)
            .opacity(0.4),
          circle.center(point(0, 0)).radius(2).color(palette.green).stroke(2),
        ),
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('region.intersect  (렌즈)')
        .add(
          region
            .intersect(
              region.inside(circle.center(point(-0.8, 0)).radius(2)),
              region.inside(circle.center(point(0.8, 0)).radius(2)),
            )
            .fill(palette.purple)
            .opacity(0.5),
          circle.center(point(-0.8, 0)).radius(2).color(palette.gray).stroke(1.5),
          circle.center(point(0.8, 0)).radius(2).color(palette.gray).stroke(1.5),
        ),
    ],
    { cols: 2, title: 'Circular Regions', tight: true },
  );

/** 두 곡선 사이 · x 의 함수 사이 */
const between = () =>
  subplots(
    [
      plot2d([-2, 2], [-1, 3])
        .title('region.between  f–g')
        .add(
          region
            .between(
              (x) => x * x,
              () => 0,
            )
            .on([-1.5, 1.5])
            .fill(palette.orange)
            .opacity(0.45),
          curve
            .fn((x) => x * x)
            .on([-1.5, 1.5])
            .color(palette.blue)
            .stroke(2),
        ),
      plot2d([-1.5, 1.5], [-1, 3])
        .title('region.betweenX  x = y²')
        .add(
          region
            .betweenX((y) => y * y)
            .fill(palette.steel)
            .opacity(0.45),
          curve
            .parametric((t) => [t * t, t])
            .on([-1.4, 1.4])
            .color(palette.blue)
            .stroke(2),
        ),
    ],
    { cols: 2, title: 'Between Curves', tight: true },
  );

await saveFigures(
  [
    ['09-below', below, '곡선 아래'],
    ['09-circles', circles, '원 내부 · 교집합'],
    ['09-between', between, '곡선 사이'],
  ],
  { dir: OUT, index: true, title: 'logos · 09 영역' },
);
