// examples/clean-code/10-region-riemann.js — 리만합 · 도넛 · 부채꼴 · 막대
//
//   무엇을 보여주나 : 정적분 근사(리만합)와 자주 쓰는 특수 영역.
//   사용 API       : region.riemann(f).on([a,b]).n(k).left()/.midpoint() · region.annulus(O,r1,r2)
//                    · region.wedge(O,r,a0,a1) · region.bar(x0,y0,x1,y1) · region.barH(y0,y1,x0,x1)
//   실행           : node examples/clean-code/10-region-riemann.js
import { join } from 'node:path';
import { point, curve, region, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '10-region-riemann');
const { palette, plot2d, subplots, saveFigures } = kit;
const f = (x) => 0.2 * (x - 2) * (x - 2) + 1;

/** 왼쪽/중점/오른쪽 리만합 */
const riemann = () =>
  subplots(
    [
      plot2d([0, 4], [0, 3])
        .title('left (n=8)')
        .add(
          region.riemann(f).on([0, 4]).n(8).left().fill(palette.skyblue).opacity(0.6),
          curve.fn(f).on([0, 4]).color(palette.blue).stroke(2.5),
        ),
      plot2d([0, 4], [0, 3])
        .title('midpoint (n=8)')
        .add(
          region.riemann(f).on([0, 4]).n(8).midpoint().fill(palette.green).opacity(0.6),
          curve.fn(f).on([0, 4]).color(palette.blue).stroke(2.5),
        ),
      plot2d([0, 4], [0, 3])
        .title('right (n=8)')
        .add(
          region.riemann(f).on([0, 4]).n(8).right().fill(palette.orange).opacity(0.6),
          curve.fn(f).on([0, 4]).color(palette.blue).stroke(2.5),
        ),
    ],
    { cols: 3, title: 'Riemann Sums', tight: true },
  );

/** 도넛 · 부채꼴 */
const annulusWedge = () =>
  subplots(
    [
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('region.annulus')
        .add(region.annulus(point(0, 0), 1, 2).fill(palette.purple).opacity(0.45)),
      plot2d([-1.5, 2.5], [-1.5, 2.5])
        .equal()
        .title('region.wedge  60°')
        .add(
          region
            .wedge(point(0, 0), 2, 0, Math.PI / 3)
            .fill(palette.red)
            .opacity(0.45),
        ),
    ],
    { cols: 2, title: 'Annulus & Wedge', tight: true },
  );

/** 막대 영역 (히스토그램) */
const bars = () => {
  const data = [1.2, 2.4, 1.8, 3.1, 2.0, 1.4];
  const cs = [palette.blue, palette.red, palette.green, palette.purple, palette.orange, palette.cyan];
  return plot2d([-0.5, 6.5], [0, 3.6])
    .title('region.bar  (histogram)')
    .add(
      ...data.map((h, i) =>
        region
          .bar(i, 0, i + 0.8, h)
          .fill(cs[i])
          .opacity(0.8),
      ),
    );
};

await saveFigures(
  [
    ['10-riemann', riemann, '리만합 3종'],
    ['10-annulus-wedge', annulusWedge, '도넛 · 부채꼴'],
    ['10-bars', bars, '막대 영역'],
  ],
  { dir: OUT, index: true, title: 'logos · 10 리만합 · 특수 영역' },
);
