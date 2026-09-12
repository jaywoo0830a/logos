// examples/clean-code/03-segment-vector-arrow.js — 선분 · 벡터 · 화살표
//
//   무엇을 보여주나 : 선분 만들기, 벡터의 크기/방향/수직, 곡선 화살표.
//   사용 API       : segment(A, B) · segment.ofLength(…).from(…).angle(…) · segment.bisector(…)
//                    vector(…) · vector.between/unit/normal · annotate.arrow(…).bend(…)
//   실행           : node examples/clean-code/03-segment-vector-arrow.js
import { join } from 'node:path';
import { point, segment, vector, vec, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '03-segment-vector-arrow');
const { palette, saveFigures } = kit;

/** 선분: 두 점 / 길이+각도 / 수직이등분선 */
const segments = () => {
  const A = point(-2, -1);
  const B = point(2, 2);
  const C = segment
    .ofLength(2.5)
    .from(point(-2, 2))
    .angle(Math.PI / 6);
  return kit
    .plot2d([-3, 3], [-2, 3])
    .equal()
    .title('Segments')
    .add(
      segment(A, B).color(palette.blue).stroke(2.5).label('AB'),
      C.color(palette.purple).stroke(2.5).label('length 2.5'),
      segment.bisector(A, B).color(palette.gray).dash([5, 4]),
      A.dot().label('A'),
      B.dot().label('B'),
    );
};

/** 벡터: 합 · 단위벡터 · 수직 */
const vectors = () => {
  const u = vector(3, 1);
  const v = vector(1, 2);
  return kit
    .plot2d([-1, 5], [-1, 4])
    .equal()
    .title('Vectors')
    .add(
      annotate.arrow(point(0, 0), point(u.v[0], u.v[1])).label('u').color(palette.blue),
      annotate.arrow(point(0, 0), point(v.v[0], v.v[1])).label('v').color(palette.red),
      annotate
        .arrow(point(0, 0), point(u.v[0] + v.v[0], u.v[1] + v.v[1]))
        .label('u+v')
        .color(palette.green),
      annotate
        .text(point(1, 2.6))
        .label(`|u| = ${vec.norm([3, 1]).toFixed(2)}`)
        .font(12),
    );
};

/** 곡선 화살표 (bend) — 순환/회전 표시 */
const curved = () =>
  kit
    .plot2d([-2, 2], [-2, 2])
    .equal()
    .title('Curved Arrows')
    .add(
      annotate.arrow(point(1, 1), point(-1, 1)).bend(0.45).color(palette.blue),
      annotate.arrow(point(-1, -1), point(1, -1)).bend(0.45).color(palette.red),
      annotate.text(point(0, 1.6)).label('rotation').font(13),
    );

await saveFigures(
  [
    ['03-segments', segments, '선분'],
    ['03-vectors', vectors, '벡터'],
    ['03-curved-arrows', curved, '곡선 화살표'],
  ],
  { dir: OUT, index: true, title: 'logos · 03 선분·벡터·화살표' },
);
