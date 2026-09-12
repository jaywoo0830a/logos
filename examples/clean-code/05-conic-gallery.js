// examples/clean-code/05-conic-gallery.js — 원뿔곡선 4종
//
//   무엇을 보여주나 : 원 · 타원 · 포물선 · 쌍곡선을 정의(초점·준선·장축)로부터 그린다.
//   사용 API       : circle.center(O).radius(r) · ellipse.center(O).semi(a,b) · ellipse.foci(F1,F2,2a)
//                    parabola.focus(F).directrix(line) · hyperbola.center(O).semi(a,b) · kit.subplots
//   실행           : node examples/clean-code/05-conic-gallery.js
import { join } from 'node:path';
import { point, line, circle, ellipse, parabola, hyperbola, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '05-conic-gallery');
const { palette, plot2d, subplots, saveFigures } = kit;
const PAT = (t) => plot2d([-5, 5], [-4, 4]).equal().title(t);

/** 원 + 타원 */
const circleAndEllipse = () =>
  subplots(
    [
      PAT('Circle  x²+y²=9').add(circle.center(point(0, 0)).radius(3).color(palette.blue).stroke(2)),
      PAT('Ellipse  a=3, b=2').add(ellipse.center(point(0, 0)).semi(3, 2).color(palette.red).stroke(2)),
    ],
    { cols: 2, title: 'Circle & Ellipse', tight: true },
  );

/** 타원: 두 초점과 장축합 */
const ellipseFoci = () =>
  PAT('Ellipse by Foci  |PF₁|+|PF₂| = 2a').add(
    ellipse.foci(point(-2, 0), point(2, 0), 8).color(palette.green).stroke(2),
    point(-2, 0).dot().label('F₁'),
    point(2, 0).dot().label('F₂'),
  );

/** 포물선: 초점과 준선 */
const parabolaDirectrix = () =>
  PAT('Parabola  focus F, directrix y = −1').add(
    parabola.focus(point(0, 1)).directrix(line.horizontal(-1)).color(palette.purple).stroke(2),
    point(0, 1).dot().label('F'),
    line.horizontal(-1).color(palette.gray).dash([5, 4]).label('directrix'),
  );

/** 쌍곡선 */
const hyperbolaBranches = () =>
  PAT('Hyperbola  a=3, b=2').add(
    hyperbola.center(point(0, 0)).semi(3, 2).color(palette.orange).stroke(2),
    line
      .slopeIntercept(2 / 3, 0)
      .color(palette.gray)
      .dash([5, 4]),
    line
      .slopeIntercept(-2 / 3, 0)
      .color(palette.gray)
      .dash([5, 4]),
  );

await saveFigures(
  [
    ['05-circle-ellipse', circleAndEllipse, '원 · 타원'],
    ['05-ellipse-foci', ellipseFoci, '타원 (초점 정의)'],
    ['05-parabola', parabolaDirectrix, '포물선 (초점 · 준선)'],
    ['05-hyperbola', hyperbolaBranches, '쌍곡선'],
  ],
  { dir: OUT, index: true, title: 'logos · 05 원뿔곡선' },
);
