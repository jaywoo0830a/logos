// examples/clean-code/21-linalg-matrix.js — 행렬 (linalg)
//
//   무엇을 보여주나 : 2×2 행렬의 기하적 의미 — 기저벡터의 상, 행렬식=넓이, 역행렬, 거듭제곱.
//   사용 API       : mat([[a,b],[c,d]]) 의 .apply/.det/.inv/.pow/.t/.col
//                    · mat.identity/rotation/reflection/scaling/shear · transform.matrix(A) 로 도형에 적용
//   실행           : node examples/clean-code/21-linalg-matrix.js
import { join } from 'node:path';
import { point, segment, polygon, annotate, mat, transform, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '21-linalg-matrix');
const { palette, plot2d, subplots, saveFigures } = kit;

const UNIT = () => polygon(point(0, 0), point(1, 0), point(1, 1), point(0, 1)).fill(palette.skyblue).opacity(0.35);

/** 기저벡터의 상 + 행렬식(넓이) */
const basisAndDet = () => {
  const A = mat([
    [2, 1],
    [0, 1.5],
  ]);
  const e1 = point(1, 0);
  const e2 = point(0, 1);
  const Ae1 = A.apply([1, 0]);
  const Ae2 = A.apply([0, 1]);
  return plot2d([-0.5, 3], [-0.5, 2.5])
    .equal()
    .title(`A = [[2,1],[0,1.5]]   det = ${A.det}`)
    .add(
      UNIT().color(palette.gray).stroke(1.5),
      UNIT().apply(transform.matrix(A)).fill(palette.steel).opacity(0.4),
      annotate.arrow(point(0, 0), point(Ae1[0], Ae1[1])).label(`Ae₁ = (${Ae1})`).color(palette.blue),
      annotate.arrow(point(0, 0), point(Ae2[0], Ae2[1])).label(`Ae₂ = (${Ae2})`).color(palette.red),
      annotate.text(point(1.6, 0.2)).label(`det = ${A.det} (= 넓이)`).font(12),
      segment(point(0, 0), e1).color(palette.gray).dash([4, 3]),
      segment(point(0, 0), e2).color(palette.gray).dash([4, 3]),
    );
};

/** 표준 변환 행렬들 */
const standardMatrices = () =>
  subplots(
    [
      plot2d([-2, 2], [-2, 2])
        .equal()
        .title('mat.rotation(45°)')
        .add(
          UNIT().color(palette.gray).stroke(1.5),
          UNIT()
            .apply(transform.matrix(mat.rotation(Math.PI / 4)))
            .fill(palette.blue)
            .opacity(0.35),
        ),
      plot2d([-2, 2], [-2, 2])
        .equal()
        .title('mat.reflection')
        .add(
          UNIT().color(palette.gray).stroke(1.5),
          UNIT()
            .apply(transform.matrix(mat.reflection(0)))
            .fill(palette.red)
            .opacity(0.35),
        ),
      plot2d([-2, 3], [-2, 3])
        .equal()
        .title('mat.shear(1)')
        .add(
          UNIT().color(palette.gray).stroke(1.5),
          UNIT()
            .apply(transform.matrix(mat.shear(1)))
            .fill(palette.green)
            .opacity(0.35),
        ),
      plot2d([-2, 3], [-2, 3])
        .equal()
        .title('mat.scaling(1.8, 0.6)')
        .add(
          UNIT().color(palette.gray).stroke(1.5),
          UNIT()
            .apply(transform.matrix(mat.scaling(1.8, 0.6)))
            .fill(palette.purple)
            .opacity(0.35),
        ),
    ],
    { cols: 2, title: 'Standard Matrices', tight: true },
  );

/** 역행렬 · 거듭제곱 · 전치 */
const inversePower = () => {
  const A = mat([
    [1, 1],
    [0, 1],
  ]);
  const inv = A.inv;
  const sq = A.pow(3);
  return plot2d([-0.5, 4], [-0.5, 3.5])
    .equal()
    .title('A, A³, A⁻¹')
    .add(
      UNIT().color(palette.gray).stroke(1.5),
      UNIT().apply(transform.matrix(A)).color(palette.blue).stroke(2),
      UNIT().apply(transform.matrix(sq)).color(palette.red).stroke(2),
      UNIT().apply(transform.matrix(inv)).color(palette.green).stroke(2),
      annotate.text(point(2.2, 3)).label(`A³ = [[${sq.rows[0]}], [${sq.rows[1]}]]`).font(11),
      annotate.text(point(2.2, 2.4)).label(`A⁻¹ = [[${inv.rows[0]}], [${inv.rows[1]}]]`).font(11),
      annotate.text(point(2.2, 1.8)).label(`Aᵀ = [[${A.t().rows[0]}], [${A.t().rows[1]}]]`).font(11),
    );
};

await saveFigures(
  [
    ['21-basis-det', basisAndDet, '기저벡터 · 행렬식'],
    ['21-standard', standardMatrices, '표준 행렬 4종'],
    ['21-inverse-power', inversePower, '역행렬 · 거듭제곱'],
  ],
  { dir: OUT, index: true, title: 'logos · 21 행렬' },
);
