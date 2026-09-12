// examples/clean-code/12-annotate-dimensions-ticks.js — 치수선과 합동 tick
//
//   무엇을 보여주나 : 길이 치수선(단위 포함)과 같은 길이 표시(tick).
//   사용 API       : annotate.dimension(A, B).offset(…).label(…).units(…)
//                    · annotate.tick(segment).count(n)
//   실행           : node examples/clean-code/12-annotate-dimensions-ticks.js
import { join } from 'node:path';
import { point, segment, triangle, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '12-annotate-dimensions-ticks');
const { palette, plot2d, saveFigures } = kit;

/** 치수선: 밑변·높이 */
const dimensions = () => {
  const A = point(0, 0);
  const B = point(4, 0);
  const C = point(1, 3);
  return plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Dimensions')
    .add(
      triangle(A, B, C).color(palette.blue).stroke(2),
      annotate.dimension(A, B).offset(26).label('4').units('cm'),
      annotate.dimension(A, point(1, 0)).offset(-22).label('1'),
      annotate.dimension(point(1, 0), C).offset(0).label('3'),
      A.dot().label('A'),
      B.dot().label('B'),
      C.dot().label('C'),
    );
};

/** 합동 표시: 같은 길이 변에 같은 개수의 tick */
const ticks = () => {
  const A = point(0, 0);
  const B = point(3, 0);
  const C = point(1.5, 2.6);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('tick count 1 vs 2')
    .add(
      triangle(A, B, C).color(palette.gray).stroke(2),
      annotate.tick(segment(A, B)).count(1),
      annotate.tick(segment(A, C)).count(2),
      annotate.tick(segment(B, C)).count(2),
      annotate.text(point(1.5, 1.1)).label('AB ≠ AC = BC').font(11).anchor('middle'),
    );
};

/** 자(ruler) — 치수선 + 눈금 */
const ruler = () =>
  plot2d([-0.5, 3.5], [-0.8, 1])
    .title('ruler')
    .add(
      segment(point(0, 0), point(3, 0)).color(palette.black).stroke(2),
      annotate.dimension(point(0, 0), point(3, 0)).offset(28).label('3').units('m'),
      annotate.tick(segment(point(0, 0), point(1.5, 0))).count(1),
      annotate.tick(segment(point(1.5, 0), point(3, 0))).count(1),
      annotate
        .text(point(1.5, 0.45))
        .label(tex`3\,\mathrm{m}`)
        .font(13)
        .anchor('middle'),
    );

await saveFigures(
  [
    ['12-dimensions', dimensions, '치수선'],
    ['12-ticks', ticks, '합동 tick'],
    ['12-ruler', ruler, '자 (치수 + 눈금)'],
  ],
  { dir: OUT, index: true, title: 'logos · 12 치수 · tick' },
);
