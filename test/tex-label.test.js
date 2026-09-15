// test/tex-label.test.js — 모든 라벨 지점의 tex(Sym) 처리 검증
//
// 확인하는 것: Sym(tex`…`) 라벨을 어디에 넣어도 LaTeX 원문이 그대로 노출되지 않고
// KaTeX 로 조판된다(SVG foreignObject / math:'text' 유니코드 폴백 / HTML). 문자열 라벨은 평문.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, circle, ellipse, polygon, segment, vector, annotate, tex } from '../index.js';

const svgOf = (sc, o) => sc.compile().toSVG(o);
const hasKatex = (svg) => svg.includes('class="katex"');

test('circle: Sym 라벨은 KaTeX 로, 문자열 라벨은 평문으로', () => {
  const mathSvg = svgOf(
    scene().add(
      circle
        .center(point(0, 0))
        .radius(1)
        .label(tex`\rho^2`),
    ),
  );
  assert.ok(hasKatex(mathSvg), 'foreignObject + KaTeX 마크업');
  // KaTeX MathML 의 annotation 에는 원문이 남지만, <text> 로 노출되면 안 된다
  assert.ok(!/<text[^>]*>[^<]*\\/.test(mathSvg), 'LaTeX 원문이 <text> 로 노출되지 않는다');
  const plain = svgOf(scene().add(circle.center(point(0, 0)).radius(1).label('C')));
  assert.ok(!hasKatex(plain), '문자열 라벨은 평문');
  assert.ok(/font-style="italic"[^>]*>C</.test(plain), '문자열 라벨은 기존처럼 <text> 로');
});

test('ellipse · polygon · vector: Sym 라벨이 KaTeX 로 그려진다', () => {
  const s = scene()
    .add(
      ellipse
        .center(point(2, 0))
        .semi(1, 0.5)
        .label(tex`\alpha+\beta`),
    )
    .add(polygon(point(-2, 0), point(-1, 0), point(-1.5, 1)).label(tex`S_\triangle`))
    .add(vector([1, 1]).label(tex`\vec{v}`));
  const svg = svgOf(s);
  const katexCount = svg.split('class="katex"').length - 1;
  assert.ok(katexCount >= 3, `3개 모두 KaTeX (${katexCount})`);
  assert.ok(!/<text[^>]*>[^<]*\\/.test(svg), '원문 노출 없음');
});

test('annotate.brace · limit: 누락됐던 math 플래그가 실린다', () => {
  const braceSvg = svgOf(
    scene()
      .view([0, 4], [0, 4])
      .add(annotate.brace(segment(point(1, 1), point(3, 1))).label(tex`\ell(x)`)),
  );
  assert.ok(hasKatex(braceSvg), 'brace Sym 라벨');
  const limitSvg = svgOf(
    scene()
      .view([-2, 2], [-2, 2])
      .add(annotate.limit((x) => x * x, 1).label(tex`L_{\max}`)),
  );
  assert.ok(hasKatex(limitSvg), 'limit Sym 라벨');
});

test("math:'text' 폴백 — PNG(래스터) 경로에서도 기호가 깨지지 않는다", () => {
  const svg = svgOf(scene().add(point(0, 0).label(tex`x^2`)), { math: 'text' });
  assert.ok(!svg.includes('<foreignObject'), 'foreignObject 미사용');
  const txt = /font-style="normal"[^>]*>([^<]*)</.exec(svg)?.[1] ?? '';
  assert.ok(txt.includes('x'), `유니코드 조판: ${txt}`);
  assert.ok(!/[\\{}]/.test(txt), '역슬래시/중괄호 잔여 없음');
});

test('HTML 백엔드도 math 플래그를 존중한다', () => {
  const html = scene()
    .add(point(0, 0).label(tex`\sqrt{2}`))
    .compile()
    .toHTML();
  assert.ok(html.includes('katex'), 'HTML 에서도 KaTeX 조판');
});
