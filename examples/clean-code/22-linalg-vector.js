// examples/clean-code/22-linalg-vector.js — 벡터 연산 (linalg)
//
//   무엇을 보여주나 : 내적·정사영·외적·각도·넓이를 수치로 구해 그림으로 확인한다.
//   사용 API       : vec.dot/norm/unit/project/reject/dist/angleDeg/det2/areaOf/cross
//                    · vector(…) 도형 · annotate.arrow · segment
//   실행           : node examples/clean-code/22-linalg-vector.js
import { join } from 'node:path';
import { point, segment, arrow3, annotate, vec, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '22-linalg-vector');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 내적 · 정사영 */
const projection = () => {
  const u = [3, 1];
  const v = [1, 2];
  const p = vec.project(v, u); // v 를 u 위로 정사영
  const r = vec.reject(v, u);
  return plot2d([-0.5, 4], [-0.5, 3.5])
    .equal()
    .title('project / reject')
    .add(
      annotate.arrow(point(0, 0), point(u[0], u[1])).label('u').color(palette.blue),
      annotate.arrow(point(0, 0), point(v[0], v[1])).label('v').color(palette.red),
      annotate.arrow(point(0, 0), point(p[0], p[1])).label('proj').color(palette.green),
      segment(point(p[0], p[1]), point(v[0], v[1])).color(palette.gray).dash([4, 3]),
      annotate
        .text(point(0.2, 3))
        .label(`u·v = ${vec.dot(u, v)}   angle = ${vec.angleDeg(u, v).toFixed(2)}°`)
        .font(12),
      annotate
        .text(point(0.2, 2.5))
        .label(`reject = (${r.map((x) => x.toFixed(2))})`)
        .font(11)
        .color(palette.gray),
    );
};

/** 내적 = 0 (수직) · 단위벡터 */
const orthogonal = () => {
  const u = [2, 1];
  const w = [-1, 2];
  const e = vec.unit([3, 4]);
  return plot2d([-2, 3], [-1, 3])
    .equal()
    .title('u ⟂ w  ·  unit vector')
    .add(
      annotate.arrow(point(0, 0), point(u[0], u[1])).label('u').color(palette.blue),
      annotate.arrow(point(0, 0), point(w[0], w[1])).label('w').color(palette.red),
      annotate
        .arrow(point(0, 0), point(e[0] * 2, e[1] * 2))
        .label('2·û')
        .color(palette.purple),
      annotate
        .text(point(-1.8, 2.6))
        .label(`u·w = ${vec.dot(u, w)} (수직)`)
        .font(12),
      annotate
        .text(point(-1.8, 2.1))
        .label(`|(3,4)| = ${vec.norm([3, 4])}`)
        .font(12),
    );
};

/** 2D 넓이(det2) · 3D 외적 */
const areaCross = () =>
  subplots(
    [
      plot2d([-0.5, 3], [-0.5, 3])
        .equal()
        .title('det2 → 평행사변형 넓이')
        .add(
          point(0, 0).dot(),
          point(2, 0).dot().label('a'),
          point(1, 2).dot().label('b'),
          point(3, 2).dot(),
          segment(point(0, 0), point(2, 0)).color(palette.blue).stroke(2),
          segment(point(0, 0), point(1, 2)).color(palette.red).stroke(2),
          segment(point(2, 0), point(3, 2)).color(palette.gray).dash([4, 3]),
          segment(point(1, 2), point(3, 2)).color(palette.gray).dash([4, 3]),
          annotate
            .text(point(0.4, 2.5))
            .label(`|det2| = ${Math.abs(vec.det2([2, 0], [1, 2]))}`)
            .font(12),
        ),
      kit
        .plot3d({ elev: 24, azim: -55 })
        .title('cross product (3D)')
        .add(
          arrow3(point(0, 0, 0), point(2, 0, 0)).color(palette.blue),
          arrow3(point(0, 0, 0), point(0, 2, 0)).color(palette.red),
          arrow3(point(0, 0, 0), point(...vec.cross([2, 0, 0], [0, 2, 0]))).color(palette.green),
          annotate
            .text(point(2, 0, 0))
            .label('a')
            .font(12),
          annotate
            .text(point(0, 2, 0))
            .label('b')
            .font(12),
          annotate
            .text(point(0, 0, 4))
            .label(`a×b = (${vec.cross([2, 0, 0], [0, 2, 0])})`)
            .font(11),
        ),
    ],
    { cols: 2, title: 'Area & Cross', tight: true },
  );

await saveFigures(
  [
    ['22-projection', projection, '내적 · 정사영'],
    ['22-orthogonal', orthogonal, '수직 · 단위벡터'],
    ['22-area-cross', areaCross, '넓이 · 외적'],
  ],
  { dir: OUT, index: true, title: 'logos · 22 벡터' },
);
