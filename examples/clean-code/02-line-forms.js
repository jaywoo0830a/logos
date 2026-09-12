// examples/clean-code/02-line-forms.js — 직선의 표현과 관계
//
//   무엇을 보여주나 : 직선을 만드는 여러 방법과 평행·수직·각의 이등분선.
//   사용 API       : line.slopeIntercept/intercepts/standard/horizontal/vertical
//                    line.through(A).slope(…) · line.parallel/perp(…).through(P) · line.angleBisector
//   실행           : node examples/clean-code/02-line-forms.js
import { join } from 'node:path';
import { point, line, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '02-line-forms');
const { palette } = kit;

/** 한 직선을 다섯 가지 방법으로 */
const fiveForms = () => {
  const draw = (l) => kit.plot2d([-1, 7], [-1, 3.5]).add(l.color(palette.blue).stroke(2.5));
  return kit.subplots(
    [
      draw(line.slopeIntercept(-2 / 3, 2)).title('slopeIntercept(-⅔, 2)'),
      draw(line.intercepts(3, 2)).title('intercepts(3, 2)'),
      draw(line.standard(2, 3, -6)).title('standard(2, 3, −6)'),
      draw(line.horizontal(2)).title('horizontal(2)'),
    ],
    { cols: 2, title: 'Five Forms of a Line', tight: true },
  );
};

/** 평행 · 수직 */
const parallelPerp = () => {
  const base = line.slopeIntercept(1 / 2, 0);
  return kit
    .plot2d([-4, 4], [-3, 3])
    .equal()
    .title('Parallel & Perpendicular')
    .add(
      base.color(palette.blue).stroke(2.5).label('base'),
      line.parallel(base).through(point(0, 2)).color(palette.green).dash([6, 4]).label('parallel'),
      line.perpendicular(base).through(point(2, 1)).color(palette.red).dash([6, 4]).label('perp'),
      point(2, 1).dot().color(palette.red),
    );
};

/** 각의 이등분선과 그 위의 점 */
const bisector = () => {
  const A = point(0, 0);
  const B = point(4, 0);
  const C = point(3, 3);
  return kit
    .plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Angle Bisector')
    .add(
      line.through(A, B).color(palette.gray).stroke(1.5),
      line.through(A, C).color(palette.gray).stroke(1.5),
      line.angleBisector(A, B, C).color(palette.purple).stroke(2.5).label('bisector'),
      annotate.angle(B, A, C).arc({ radius: 26 }).degrees().label('θ'),
    );
};

const { saveFigures } = kit;
await saveFigures(
  [
    ['02-five-forms', fiveForms, '직선의 네 표현'],
    ['02-parallel-perp', parallelPerp, '평행 · 수직'],
    ['02-bisector', bisector, '각의 이등분선'],
  ],
  { dir: OUT, index: true, title: 'logos · 02 직선' },
);
