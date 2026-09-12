// examples/clean-code/18-symbolic-calculus.js — 심볼릭 계산
//
//   무엇을 보여주나 : tex 로 쓴 식을 미분·적분·인수분해·치환하고, 결과를 그림 라벨로 확인한다.
//   사용 API       : tex`…`.diff(x)/.integrate(x)/.simplify()/.substitute({…})/.solve(x)/.toLatex()
//                    · curve.fn(tex…) · annotate.text
//   실행           : node examples/clean-code/18-symbolic-calculus.js
import { join } from 'node:path';
import { point, curve, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '18-symbolic-calculus');
const { palette, plot2d, saveFigures } = kit;

const f = tex`x^3 - 3x`;
const d = f.diff('x');
const I = f.integrate('x');

/** 함수와 도함수 */
const derivative = () =>
  plot2d([-2.5, 2.5], [-4, 4])
    .title('f(x) = x³ − 3x   ·   f′(x)')
    .add(
      curve.fn(f).on([-2.2, 2.2]).color(palette.blue).stroke(2.5),
      curve.fn(d).on([-2.2, 2.2]).color(palette.red).stroke(2.5),
      annotate
        .text(point(-2.3, 3))
        .label(tex`f(x) = x^3-3x`)
        .font(13)
        .color(palette.blue),
      annotate
        .text(point(0.4, -3.2))
        .label(tex`f'(x) = 3x^2-3`)
        .font(13)
        .color(palette.red),
    );

/** 부정적분 · 정적분 */
const integral = () => {
  const F = I; // x⁴/4 − 3x²/2
  return plot2d([-2.5, 2.5], [-4, 4])
    .title('integral of f')
    .add(
      curve.fn(f).on([-2.2, 2.2]).color(palette.blue).stroke(2.5),
      curve
        .fn(F.toFunction ? F.toFunction('x') : (x) => x ** 4 / 4 - (3 * x * x) / 2)
        .on([-2.2, 2.2])
        .color(palette.green)
        .stroke(2.5),
      annotate
        .text(point(-2.3, 3.2))
        .label(tex`\int f\,dx = \tfrac{x^4}{4}-\tfrac{3x^2}{2}+C`)
        .font(12),
    );
};

/** 방정식 풀이 · 치환 · 라벨 요약 */
const algebra = () => {
  const roots = f.solve('x');
  const simple = tex`\sin^2(x) + \cos^2(x)`.simplify();
  const at2 = tex`x^2 + 1`.substitute({ x: 2 });
  return plot2d([-1, 1], [-1, 1])
    .axes(false)
    .title('solve · simplify · substitute')
    .add(
      annotate
        .text(point(0, 3))
        .label(tex`x^3-3x=0`)
        .font(18)
        .anchor('middle'),
      annotate
        .text(point(0, 1.6))
        .label(tex`\Rightarrow\; x = ${roots.map((r) => (r && r.toLatex ? r.toLatex() : r)).join(',\\; ')}`)
        .font(16)
        .anchor('middle'),
      annotate
        .text(point(0, 0.2))
        .label(tex`\sin^2 x+\cos^2 x \Rightarrow ${String(simple)}`)
        .font(15)
        .anchor('middle'),
      annotate
        .text(point(0, -1.2))
        .label(tex`x^2+1\big|_{x=2} = ${String(at2)}`)
        .font(15)
        .anchor('middle'),
      annotate
        .text(point(0, -2.6))
        .label(tex`f'(x) = ${String(d)}`)
        .font(15)
        .anchor('middle'),
    );
};

await saveFigures(
  [
    ['18-derivative', derivative, '함수와 도함수'],
    ['18-integral', integral, '부정적분'],
    ['18-algebra', algebra, '풀이 · 치환'],
  ],
  { dir: OUT, index: true, title: 'logos · 18 심볼릭' },
);
