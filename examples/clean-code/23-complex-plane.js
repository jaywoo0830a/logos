// examples/clean-code/23-complex-plane.js — 복소수 (complex)
//
//   무엇을 보여주나 : 복소수의 곱 = 회전+확대, 켤레, 거듭제곱, n제곱근, a+bi ↔ 행렬.
//   사용 API       : cplx(a,b) 의 .add/.sub/.mul/.div/.conj/.pow/.toString · cplx.abs/arg/argDeg (정적)
//                    · cplx.unity(n) · cplx.matrix(z) · point.complex 로 그리기
//   실행           : node examples/clean-code/23-complex-plane.js
import { join } from 'node:path';
import { point, segment, polygon, transform, cplx, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '23-complex-plane');
const { palette, plot2d, subplots, saveFigures } = kit;

const P = (z) => point(z.re, z.im); // 복소수 → 평면의 점

/** 곱셈 = 회전 + 확대 */
const multiplication = () => {
  const z = cplx(2, 1);
  const w = cplx(0, 1); // 90° 회전
  const zw = z.mul(w);
  return plot2d([-2.5, 2.5], [-1, 3])
    .equal()
    .title('z · w  (w = i)')
    .add(
      segment(point(0, 0), P(z)).color(palette.blue).stroke(2),
      segment(point(0, 0), P(w)).color(palette.green).stroke(2),
      segment(point(0, 0), P(zw)).color(palette.red).stroke(2.5),
      P(z).dot().label(`z = ${z}`).color(palette.blue),
      P(w).dot().label(`w = ${w}`).color(palette.green),
      P(zw).dot().label(`zw = ${zw}`).color(palette.red),
      annotate
        .text(point(0, 2.6))
        .label(`arg z = ${cplx.argDeg(z).toFixed(1)}° → arg zw = ${cplx.argDeg(zw).toFixed(1)}°`)
        .font(12),
    );
};

/** 켤레 · 덧셈 */
const conjugateAdd = () => {
  const z = cplx(2, 1.5);
  const conj = cplx.conj(z);
  const sum = z.add(conj);
  return plot2d([-3, 3], [-2, 2])
    .equal()
    .title('z + z̄  (실수)')
    .add(
      segment(point(0, 0), P(z)).color(palette.blue).stroke(2),
      segment(point(0, 0), P(conj)).color(palette.red).stroke(2),
      segment(point(0, 0), P(sum)).color(palette.purple).stroke(3),
      P(z).dot().label(`z = ${z}`),
      P(conj).dot().label(`z̄ = ${conj}`),
      P(sum).dot().label(`z+z̄ = ${sum}`).color(palette.purple),
      annotate
        .text(point(0, -1.7))
        .label(`|z| = ${cplx.abs(z).toFixed(3)}`)
        .font(12)
        .anchor('middle'),
    );
};

/** 1의 n제곱근 */
const roots = () => {
  const n = 6;
  const zs = cplx.unity(n);
  const pts = zs.map((z) => point(z.re, z.im));
  return plot2d([-1.6, 1.6], [-1.6, 1.6])
    .equal()
    .axes(false)
    .title(`roots of unity (n=${n})`)
    .add(
      polygon(...pts)
        .fill(palette.skyblue)
        .opacity(0.25),
      ...pts.map((p) => segment(point(0, 0), p).color(palette.gray).stroke(1.2)),
      ...pts.map((p, i) =>
        p
          .dot()
          .color(palette.tab10[i % 10])
          .label(`ζ${i}`),
      ),
    );
};

/** a+bi ↔ 행렬 (회전+확대) */
const asMatrix = () => {
  const z = cplx(1, 1);
  const M = cplx.matrix(z);
  const unit = () => polygon(point(0, 0), point(1, 0), point(1, 1), point(0, 1));
  return plot2d([-0.5, 2.5], [-0.5, 2.5])
    .equal()
    .title('cplx.matrix(1+i) = 회전+확대')
    .add(
      unit().color(palette.gray).stroke(1.5),
      unit().apply(transform.matrix(M)).fill(palette.steel).opacity(0.35),
      annotate.text(point(1.4, 2.3)).label(`M = [[${M.rows[0]}], [${M.rows[1]}]]`).font(12),
      annotate
        .text(point(1.4, 1.8))
        .label(`|z| = ${cplx.abs(z).toFixed(3)},  arg = ${cplx.argDeg(z)}°`)
        .font(12),
    );
};

await saveFigures(
  [
    ['23-multiplication', multiplication, '곱 = 회전+확대'],
    ['23-conjugate', conjugateAdd, '켤레 · 덧셈'],
    ['23-roots', roots, '1의 n제곱근'],
    ['23-matrix', asMatrix, '복소수 행렬'],
  ],
  { dir: OUT, index: true, title: 'logos · 23 복소수' },
);
