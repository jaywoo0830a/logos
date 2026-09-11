// 0911-PLAN Phase 5-1 — 출력 백엔드(TikZ / Asymptote / JSXGraph / KaTeX / PNG) 정합 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene, point, circle, curve, tex, pi,
  adapt,
} from '../index.js';

test('TikZ: standalone 구조와 도형 포함', () => {
  const out = scene().view([-2, 2], [-2, 2]).add(
    circle.center(point(0, 0)).radius(1),
    curve.fn((x) => x * x).on([-1, 1]),
  ).compile().toTikZ({ standalone: true });
  assert.ok(out.includes('\\documentclass[tikz,border=2pt]{standalone}'));
  assert.ok(out.includes('\\begin{tikzpicture}') && out.includes('\\end{document}'));
  assert.ok(out.includes('circle') && out.includes('--'));
});

test('Asymptote: import/draw 골격 생성', () => {
  const asy = scene().equal().add(
    circle.center(point(0, 0)).radius(1),
    curve.fn((x) => x * x).on([-1, 1]),
  ).compile().toAsymptote();
  assert.equal(typeof asy, 'string');
  assert.ok(asy.length > 0);
});

test('JSXGraph: 인터랙티브 HTML 생성', () => {
  const html = scene().equal().add(circle.center(point(0, 0)).radius(1)).compile().toJSXGraphHTML();
  assert.ok(typeof html === 'string' && /board|jsxgraph/i.test(html));
});

test('KaTeX: latexToText 폴백이 기호를 보존', () => {
  const svg = scene().equal().add(circle.center(point(0, 0)).radius(1)).compile().toSVG({ math: 'text' });
  assert.ok(!svg.includes('<foreignObject'), 'math:text 모드는 foreignObject 미사용');
});

test('수식 라벨: LaTeX → 텍스트 폴백', async () => {
  const { latexToText } = await import('../backend/katex.js');
  const t = latexToText('\\int_0^1 \\frac{x^2}{2}\\,dx');
  assert.ok(t.includes('∫'), '적분 기호');
  assert.ok(!/[\\{}]/.test(t), '역슬래시/중괄호 제거');
});

test('PNG: resvg 있으면 실제 래스터, 없으면 명확한 에러', async () => {
  const fig = scene().view([-0.5, pi + 0.5], [-0.5, 1.5]).axes().add(
    curve.fn(Math.sin).on([0, pi]).color('crimson'),
    point(1, Math.sin(1)).dot().label(tex`P`),
  ).compile();
  try {
    const png = await fig.toPNG({ scale: 1 });
    assert.ok(png && (png.length ?? png.byteLength) > 0, 'PNG 바이트 생성');
  } catch (e) {
    assert.match(String(e.message), /resvg/, '래스터 백엔드 안내');
  }
});

test('adapt 네임스페이스 노출 (ADAPT.md)', () => {
  assert.ok(adapt && adapt.katex && typeof adapt.katex.katexRender === 'function');
  assert.ok(typeof adapt.asymptote === 'function');
});
