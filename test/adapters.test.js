import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, circle, curve, tex, adapt } from '../index.js';
import { katexRender, katexify } from '../backend/katex.js';
import irToAsymptote from '../backend/asymptote.js';
import { irToJSXGraph, buildJSXGraphHTML } from '../backend/jsxgraph.js';

test('Asymptote: IR → .asy 소스 (2D)', () => {
  const asy = scene()
    .view([-3, 3], [-2, 2])
    .add(point(1, 1).label(tex`A`), circle.center(point(0, 0)).radius(2))
    .compile()
    .toAsymptote({ width: 400, height: 400 });
  assert.ok(asy.includes('import graph;'), 'graph import');
  assert.ok(asy.includes('dot(('), '점 마커');
  assert.ok(asy.includes('circle(('), '원');
  assert.ok(asy.includes('label("$A$"'), '라벨(문자열 $..$)');
});

test('Asymptote: compileAsymptote — CLI 미설치 시 명확한 에러', async () => {
  const { compileAsymptote } = await import('../backend/asymptote.js');
  try {
    await compileAsymptote('dot((0,0));', { format: 'svg' });
    // CLI 가 설치된 환경이라면 아래 assert 는 건너뜀
  } catch (e) {
    assert.ok(/asy|dot|미설치/i.test(e.message), `에러 안내: ${e.message.slice(0, 60)}`);
  }
});

test('KaTeX: 수식 조판 (ADAPT §4)', () => {
  const html = katexRender('x^2-1');
  assert.ok(html.includes('katex'), 'KaTeX span');
  // inline $...$ 처리
  const mixed = katexify('근은 $x=2$ 입니다.');
  assert.ok(mixed.includes('katex'), '인라인 수식 변환');
});

test('JSXGraph: 인터랙티브 HTML 생성 (ADAPT §2)', () => {
  const fig = scene()
    .view([-3, 3], [-2, 2])
    .add(point(0, 0).label('O'), circle.center(point(0, 0)).radius(1))
    .compile();
  const html = fig.toJSXGraphHTML({ boardId: 'b1', width: 300, height: 300, axes: true });
  assert.ok(html.includes('JSXGraph.initBoard'), 'initBoard');
  assert.ok(html.includes("board.create('circle'"), 'circle 생성');
  assert.ok(html.includes("board.create('point'"), '점 생성');
});

test('adapt API 노출 (index)', () => {
  assert.ok(adapt.asymptote, 'asymptote');
  assert.ok(adapt.tikzjax, 'tikzjax');
  assert.ok(adapt.jsxgraph, 'jsxgraph');
  assert.ok(adapt.katex, 'katex');
  assert.ok(adapt.asymmetric.createSymbolicAdapter, 'symbolic 팩토리');
});

test('toHTML: KaTeX <figure> 조판', () => {
  const html = scene()
    .view([0, 5], [0, 5])
    .add(point(2, 3).label('P'), point(0, 0).label(tex`x^2`))
    .compile()
    .toHTML();
  assert.ok(html.includes('<figure'), 'figure');
  assert.ok(html.includes('katex'), 'katex 마크업');
});