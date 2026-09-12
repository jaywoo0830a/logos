import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tex, tau, pi } from '../index.js';

const approx = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('tex: 태그드 템플릿 → LaTeX 보존', () => {
  const f = tex`x^{2} - 1`;
  assert.ok(f.toLatex().includes('x'));

  const num = tex`5`;
  approx(num.valueOf(), 5);
});

test('Sym: diff / simplify', () => {
  const f = tex`x^{2} - 1`;
  const df = f.diff('x');
  assert.ok(df.toLatex().replace(/\s/g, '') === '2x' || df.toLatex().includes('2'), `df = ${df.toLatex()}`);
});

test('Sym: solve', () => {
  const eq = tex`x^{2} - 5x + 6 = 0`;
  const roots = eq.solve('x');
  assert.equal(roots.length, 2);
  const vs = roots.map((r) => Number(r)).sort((a, b) => a - b);
  approx(vs[0], 2);
  approx(vs[1], 3);
});

test('Sym: toFunction', () => {
  const f = tex`x^2 - 1`;
  const fn = f.toFunction('x');
  approx(fn(0), -1);
  approx(fn(2), 3);
});

test('Sym: integrate (부정적분)', () => {
  const f = tex`x^{2}`;
  const F = f.integrate({ var: 'x' });
  assert.ok(F.toLatex().includes('x'), F.toLatex());
});

test('Sym: 상수 export', () => {
  approx(pi, Math.PI);
  approx(tau, Math.PI * 2);
});
