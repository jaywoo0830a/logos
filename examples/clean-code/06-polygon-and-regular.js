// examples/clean-code/06-polygon-and-regular.js — 다각형과 정다각형
//
//   무엇을 보여주나 : 삼각형·사각형·정다각형과 삼각형의 중심들.
//   사용 API       : polygon/triangle/quad · triangle.equilateral(B,C).above() · regular.polygon(O,n,r)
//                    square.on(segment) · point.centroid/circumcenter/incenter
//   실행           : node examples/clean-code/06-polygon-and-regular.js
import { join } from 'node:path';
import { point, segment, polygon, triangle, quad, regular, square, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '06-polygon-and-regular');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 기본 다각형 */
const basics = () => {
  const A = point(0, 0);
  const B = point(3, 0);
  const C = point(1, 2);
  const D = point(-1.5, 1.2);
  return subplots(
    [
      plot2d([-2, 4], [-1, 3])
        .equal()
        .title('polygon / triangle / quad')
        .add(
          polygon(A, B, point(3, 2), point(-1.5, 1.2)).fill(palette.skyblue).opacity(0.35),
          triangle(A, B, C).color(palette.blue).stroke(2),
          quad(A, B, C, D).color(palette.red).dash([5, 4]),
          A.dot().label('A'),
          B.dot().label('B'),
          C.dot().label('C'),
          D.dot().label('D'),
        ),
      plot2d([-2, 3], [-1, 3])
        .equal()
        .title('equilateral · square')
        .add(
          triangle.equilateral(point(-1, 0), point(1, 0)).above().color(palette.green).stroke(2),
          square
            .on(segment(point(0, 0), point(1.5, 0.6)))
            .fill(palette.wheat)
            .opacity(0.5),
        ),
    ],
    { cols: 2, title: 'Polygons', tight: true },
  );
};

/** 정다각형 · 정사각형 격자 */
const regulars = () =>
  plot2d([-2.5, 2.5], [-2.5, 2.5])
    .equal()
    .title('Regular Polygons')
    .add(
      regular.polygon(point(0, 0), 3, 2).color(palette.blue).stroke(2),
      regular.polygon(point(0, 0), 5, 2).color(palette.red).stroke(2),
      regular.polygon(point(0, 0), 6, 2).color(palette.green).stroke(2),
      regular.polygon(point(0, 0), 12, 2).color(palette.gray).stroke(1),
    );

/** 삼각형의 중심들 */
const centers = () => {
  const A = point(0, 0);
  const B = point(4, 0);
  const C = point(1, 3);
  return plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Triangle Centers')
    .add(
      triangle(A, B, C).color(palette.gray).stroke(1.5),
      point.centroid(A, B, C).dot().color(palette.red).label('G'),
      point.circumcenter(A, B, C).dot().color(palette.blue).label('O'),
      point
        .incenter(triangle(A, B, C))
        .dot()
        .color(palette.green)
        .label('I'),
      annotate.text(point(2, 0.4)).label('G=centroid  O=circumcenter  I=incenter').font(10).anchor('middle'),
    );
};

await saveFigures(
  [
    ['06-basics', basics, '삼각형 · 사각형'],
    ['06-regular', regulars, '정다각형'],
    ['06-centers', centers, '삼각형의 중심'],
  ],
  { dir: OUT, index: true, title: 'logos · 06 다각형' },
);
