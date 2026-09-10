import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, triangle, circle, line, curve, annotate, tex, tau, transform } from '../index.js';

test('tikz: standalone 문서 구조', () => {
  const out = scene()
    .view([-3, 4], [-2, 3])
    .equal()
    .axes()
    .add(point(1, 2).dot().label('A'))
    .compile()
    .toTikZ({ standalone: true });
  assert.ok(out.includes('\\documentclass[tikz,border=2pt]{standalone}'));
  assert.ok(out.includes('\\begin{tikzpicture}'));
  assert.ok(out.includes('\\end{document}'));
});

test('tikz: 곡선과 원 포함', () => {
  const out = scene()
    .view([-2, 2], [-2, 2])
    .add(
      circle.center(point(0, 0)).radius(1),
      curve.fn((x) => x * x).on([-1, 1]),
    )
    .compile()
    .toTikZ();
  assert.ok(out.includes('circle'));
  assert.ok(out.includes('--'));
});

test('transform: apply 로 도형 변환', () => {
  const R = transform.rotate(Math.PI / 2).about(point(0, 0));
  const p = R.apply([1, 0], 2);
  assert.ok(Math.abs(p[0]) < 1e-6 && Math.abs(p[1] - 1) < 1e-6);

  // 삼각형에 적용해도 컴파일 정상
  const svg = scene()
    .view([-3, 3], [-3, 3])
    .add(triangle(point(0, 0), point(1, 0), point(0, 1)).apply(R).fill('#eee'))
    .compile()
    .toSVG();
  assert.ok(svg.includes('<polygon'));
});

test('integral annotate → SVG', () => {
  const svg = scene()
    .view([-0.5, 3], [-0.5, 10])
    .add(
      curve.fn((x) => x * x).on([0, 2]).color('crimson'),
      annotate.integral((x) => x * x).from(0).to(2).shade('steelblue').label(tex`\\int_0^2 x^2\\,dx`),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('steelblue'), '채우기 색');
  assert.ok(svg.includes('<foreignObject'), '적분 라벨(KaTeX 수식)');
});