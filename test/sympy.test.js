import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adapt } from '../index.js';
import { SymPyAdapter, createSymbolicAdapter } from '../symbolic/adapter.js';

const hasSympy = await SymPyAdapter.detect().catch(() => false);

test('SymPyAdapter: detect — sympy 설치 여부 감지', async () => {
  // 반환은 bool; 실패 시 false 여야 함
  const ok = await SymPyAdapter.detect().catch(() => false);
  assert.equal(typeof ok, 'boolean');
});

test('SymPyAdapter: 미분/방정식/적분 (subprocess)', async () => {
  if (!hasSympy) {
    console.log('SKIP: python3-sympy 미설치 (docker 에서 실행 시 활성)');
    return;
  }
  const a = new SymPyAdapter();

  const d = await a.diff('x**2 - 1', 'x');
  assert.ok(d.length > 0, `diff=${d}`);

  // solve: LaTeX 를 줄바꿈으로 구분한 단일 문자열을 반환
  const sol = await a.solve('x**2 - 5*x + 6', 'x');
  const roots = sol.split('\n');
  assert.ok(roots.length === 2, `solve=${JSON.stringify(roots)}`);

  const i = await a.integrate('x**2', { var: 'x' });
  assert.ok(i.includes('3') || i.includes('x'), i);
});

test('createSymbolicAdapter: 팩토리 동작', async () => {
  const inst = await createSymbolicAdapter({ force: 'sympy' });
  assert.ok(inst instanceof SymPyAdapter);
});

test('adapt.asymmetric 노출', () => {
  assert.ok(adapt.asymmetric.SymPyAdapter);
  assert.ok(adapt.asymmetric.SageAdapter);
  assert.ok(adapt.asymmetric.defaultAdapter);
});
