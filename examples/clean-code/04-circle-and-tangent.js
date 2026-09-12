// examples/clean-code/04-circle-and-tangent.js — 원과 접선
//
//   무엇을 보여주나 : 원을 만드는 방법, 접선, 교점, 내접원.
//   사용 API       : circle.center(O).radius(r) · circle.through(A,B,C) · circle.inscribed(tri)
//                    line.tangent(c).at(P) / .slope(k) · point.intersect(…) · annotate.angle(…).rightAngle()
//   실행           : node examples/clean-code/04-circle-and-tangent.js
import { join } from 'node:path';
import { point, line, circle, triangle, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '04-circle-and-tangent');
const { palette, saveFigures } = kit;

/** 접선과 반지름은 수직 */
const tangent = () => {
  const O = point(0, 0);
  const c = circle.center(O).radius(2).color(palette.blue).stroke(2);
  const P = point(2, 0);
  const t = line.tangent(c).at(P).color(palette.red).stroke(2);
  return kit
    .plot2d([-3, 3], [-3, 3])
    .equal()
    .title('Tangent ⊥ Radius')
    .add(
      c,
      t.label('tangent'),
      O.dot().label('O'),
      P.dot().label('P'),
      annotate.angle(point(1, 0), P, point(2, 1)).arc({ radius: 0.35 }).rightAngle(),
    );
};

/** 세 점을 지나는 원 */
const throughPoints = () => {
  const A = point(-2, 0);
  const B = point(1, 2.5);
  const C = point(2.5, -1);
  return kit
    .plot2d([-4, 4], [-3, 3])
    .equal()
    .title('Circle through 3 Points')
    .add(
      circle.through(A, B, C).color(palette.purple).stroke(2),
      A.dot().label('A'),
      B.dot().label('B'),
      C.dot().label('C'),
    );
};

/** 내접원과 직선 교점 */
const inscribedAndIntersect = () => {
  const A = point(0, 0);
  const B = point(4, 0);
  const C = point(1, 3);
  const tri = triangle(A, B, C);
  const P = point.intersect(line.through(A, B), line.vertical(2));
  return kit
    .plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Inscribed Circle & Intersection')
    .add(
      tri.color(palette.gray).stroke(1.5),
      circle.inscribed(tri).color(palette.green).stroke(2),
      line.vertical(2).color(palette.red).dash([5, 4]),
      P.dot().color(palette.red).label('intersection'),
    );
};

await saveFigures(
  [
    ['04-tangent', tangent, '접선과 반지름'],
    ['04-through-3-points', throughPoints, '세 점을 지나는 원'],
    ['04-inscribed', inscribedAndIntersect, '내접원 · 교점'],
  ],
  { dir: OUT, index: true, title: 'logos · 04 원과 접선' },
);
