// examples/clean-code/20-transform-gallery.js — 변환
//
//   무엇을 보여주나 : 회전·확대·이동·반사·전단·닮음·행렬 변환을 도형에 적용한다.
//   사용 API       : transform.rotate(θ).about(O) · scale · translate · reflect.over(line) · shear
//                    · homothety(O,k) · matrix([[…]]) · compose(t1,t2) · 도형.apply(transform)
//   실행           : node examples/clean-code/20-transform-gallery.js
import { join } from 'node:path';
import { point, line, polygon, triangle, transform, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '20-transform-gallery');
const { palette, plot2d, subplots, saveFigures } = kit;

const TRI = () => triangle(point(0, 0), point(2, 0), point(0.6, 1.6)).fill(palette.skyblue).opacity(0.35);

/** 회전 · 확대 */
const rotateScale = () =>
  subplots(
    [
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('rotate 90° about O')
        .add(
          TRI().color(palette.gray).stroke(1.5),
          TRI()
            .apply(transform.rotate(Math.PI / 2).about(point(0, 0)))
            .color(palette.blue)
            .stroke(2),
          point(0, 0).dot().label('O'),
        ),
      plot2d([-4, 4], [-3, 3])
        .equal()
        .title('scale(1.6, 0.7)')
        .add(
          TRI().color(palette.gray).stroke(1.5),
          TRI().apply(transform.scale(1.6, 0.7)).color(palette.red).stroke(2),
        ),
    ],
    { cols: 2, title: 'Rotation & Scaling', tight: true },
  );

/** 평행이동 · 반사 · 전단 */
const moveReflectShear = () =>
  subplots(
    [
      plot2d([-1, 5], [-1, 4])
        .equal()
        .title('translate(2, 1.5)')
        .add(
          TRI().color(palette.gray).stroke(1.5),
          TRI().apply(transform.translate(2, 1.5)).color(palette.green).stroke(2),
        ),
      plot2d([-3, 3], [-1, 4])
        .equal()
        .title('reflect over x-axis')
        .add(
          line.horizontal(0).color(palette.gray).dash([5, 4]),
          TRI().color(palette.gray).stroke(1.5),
          TRI()
            .apply(transform.reflect.over(line.horizontal(0)))
            .color(palette.purple)
            .stroke(2),
        ),
      plot2d([-1, 4], [-1, 4])
        .equal()
        .title('shear(0.8)')
        .add(TRI().color(palette.gray).stroke(1.5), TRI().apply(transform.shear(0.8)).color(palette.orange).stroke(2)),
    ],
    { cols: 3, title: 'Translate / Reflect / Shear', tight: true },
  );

/** 닮음 · 행렬 · 합성 */
const homothetyMatrix = () =>
  subplots(
    [
      plot2d([-2, 6], [-2, 6])
        .equal()
        .title('homothety(O, 2)')
        .add(
          TRI().color(palette.gray).stroke(1.5),
          TRI()
            .apply(transform.homothety(point(0, 0), 2))
            .color(palette.crimson)
            .stroke(2),
          point(0, 0).dot().label('O'),
        ),
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('matrix [[1,1],[0,1]]')
        .add(
          polygon(point(-1, -1), point(1, -1), point(1, 1), point(-1, 1)).color(palette.gray).stroke(1.5),
          polygon(point(-1, -1), point(1, -1), point(1, 1), point(-1, 1))
            .apply(
              transform.matrix([
                [1, 1],
                [0, 1],
              ]),
            )
            .fill(palette.steel)
            .opacity(0.45),
        ),
      plot2d([-4, 4], [-4, 4])
        .equal()
        .title('compose(rotate, scale)')
        .add(
          TRI().color(palette.gray).stroke(1.5),
          TRI()
            .apply(transform.compose(transform.rotate(Math.PI / 6).about(point(0, 0)), transform.scale(1.8, 1.8)))
            .color(palette.navy)
            .stroke(2),
          annotate.text(point(0, -3.4)).label('먼저 scale → 그다음 rotate').font(11).anchor('middle'),
        ),
    ],
    { cols: 3, title: 'Homothety / Matrix / Compose', tight: true },
  );

await saveFigures(
  [
    ['20-rotate-scale', rotateScale, '회전 · 확대'],
    ['20-move-reflect-shear', moveReflectShear, '이동 · 반사 · 전단'],
    ['20-homothety-matrix', homothetyMatrix, '닮음 · 행렬 · 합성'],
  ],
  { dir: OUT, index: true, title: 'logos · 20 변환' },
);
