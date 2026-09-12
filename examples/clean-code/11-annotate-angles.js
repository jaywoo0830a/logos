// examples/clean-code/11-annotate-angles.js — 각도 표시
//
//   무엇을 보여주나 : 호·직각 표식·도/라디안 라벨.
//   사용 API       : annotate.angle(A, B, C) ※ B 가 꼭짓점 · .arc({radius, double}) · .rightAngle()
//                    · .degrees()/.radians() · .label(…)
//   실행           : node examples/clean-code/11-annotate-angles.js
import { join } from 'node:path';
import { point, line, segment, polygon, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '11-annotate-angles');
const { palette, plot2d, saveFigures } = kit;

/** 기본 호 + 도 단위 */
const basic = () => {
  const O = point(0, 0);
  const A = point(3, 0);
  const B = point(2, 2);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('Angle (degrees)')
    .add(
      segment(O, A).color(palette.gray).stroke(2),
      segment(O, B).color(palette.gray).stroke(2),
      annotate.angle(A, O, B).arc({ radius: 34 }).degrees().label('θ'),
      O.dot().label('O'),
      A.dot().label('A'),
      B.dot().label('B'),
    );
};

/** 직각 표식 (두 선이 그려져 있어야 제자리) */
const rightAngle = () => {
  const P = point(2, 1);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('Right Angle')
    .add(
      line.horizontal(1).color(palette.gray).stroke(2),
      line.vertical(2).color(palette.gray).stroke(2),
      annotate.angle(point(1, 1), P, point(2, 2)).arc({ radius: 16 }).rightAngle(),
      P.dot().label('P'),
    );
};

/** 이중 호 · 라디안 */
const doubleArc = () => {
  const O = point(0, 0);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('double arc · radians')
    .add(
      segment(O, point(3, 0)).color(palette.gray).stroke(2),
      segment(O, point(1, 2.4)).color(palette.gray).stroke(2),
      annotate.angle(point(3, 0), O, point(1, 2.4)).arc({ radius: 40, double: true }).radians().label('φ'),
      O.dot().label('O'),
    );
};

/** 정사각형의 직각 표식 */
const squareRightAngles = () =>
  plot2d([-1.5, 1.5], [-0.5, 2.5])
    .equal()
    .title('right angles in a square')
    .add(
      polygon(point(-1, 0), point(1, 0), point(1, 2), point(-1, 2)).color(palette.blue).stroke(2),
      annotate.angle(point(0, 0), point(-1, 0), point(-1, 1)).arc({ radius: 14 }).rightAngle(),
      annotate.angle(point(0, 0), point(1, 0), point(1, 1)).arc({ radius: 14 }).rightAngle(),
      annotate
        .text(point(0, 1))
        .label(tex`\square`)
        .font(18)
        .anchor('middle'),
    );

await saveFigures(
  [
    ['11-basic', basic, '각도 (도)'],
    ['11-right-angle', rightAngle, '직각 표식'],
    ['11-double-arc', doubleArc, '이중 호 · 라디안'],
    ['11-square-right-angles', squareRightAngles, '정사각형의 직각'],
  ],
  { dir: OUT, index: true, title: 'logos · 11 각도' },
);
