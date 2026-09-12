// 눈금 라벨 정밀도 + 자동 라벨 배치의 눈금 장애물
//
// 실사용 재현(mathbook `math/graph/phase2/14D1` — 미분의 해석):
//   · y ∈ [2.019, 2.031] (폭 0.012) 에서 fmtTick 이 2자리로 반올림해 눈금 12개가 전부 '2.02' 로 뭉갰다.
//   · scene.layout() 은 눈금(z<0)을 회피 대상에서 빼서, 켜도 어노테이션이 눈금 라벨 위에 겹쳤다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, annotate } from '../index.js';

/** 축 눈금 라벨(코어 축 눈금 = font-size 12)의 'text@y' 목록 */
const ticks = (svg) => [...svg.matchAll(/<text[^>]*\by="(-?[\d.]+)"[^>]*font-size="12"[^>]*>([^<]+)<\/text>/g)]
  .map((m) => `${m[2]}@${m[1]}`);

test('fmtTick: 좁은 y 범위에서 눈금 라벨이 서로 다른 값을 유지한다', () => {
  const svg = scene().axes({ y: { label: 'y' } }).view([0, 1], [2.019, 2.031]).compile().toSVG();
  const ys = ticks(svg).map((t) => t.split('@')[0]);
  assert.ok(ys.length >= 3, `눈금 라벨이 있다: ${ys.join(' ')}`);
  assert.equal(new Set(ys).size, ys.length, `라벨 중복 없음(2자리 반올림이면 모두 2.02): ${ys.join(' ')}`);
  assert.ok(ys.some((t) => /^2\.02\d$/.test(t)), `3자리 라벨: ${ys.join(' ')}`);
});

test('axes({ y: { decimals } }) 로 자릿수를, { y: { format } } 로 문자열을 재정의한다', () => {
  const d = scene().axes({ y: { decimals: 4 } }).view([0, 1], [0.5001, 0.5009]).compile().toSVG();
  assert.ok(ticks(d).some((t) => /^0\.500\d@/.test(t)), `decimals:4 → ${ticks(d).join(' ')}`);

  const f = scene().axes({ y: { format: (v) => `${Math.round(v * 100)}%` } }).view([0, 1], [0, 1]).compile().toSVG();
  assert.ok(ticks(f).some((t) => /^\d+%@/.test(t)), `format 훅 → ${ticks(f).join(' ')}`);
});

test('layout(): 어노테이션은 눈금을 피해 움직이고, 눈금 라벨은 제자리에 남는다', () => {
  const build = (on) => {
    let s = scene().axes({ y: { label: 'y' } }).view([0, 1], [0, 1])
      .add(annotate.text(point(0.06, 0.6)).label('AAA').font(11).anchor('end'));
    if (on) s = s.layout();
    return s.compile().toSVG();
  };
  const yOf = (svg, t) => {
    const m = svg.match(new RegExp(`<text[^>]*\\by="(-?[\\d.]+)"[^>]*>${t}</text>`));
    return m ? +m[1] : null;
  };
  const off = build(false), on = build(true);
  assert.notEqual(yOf(on, 'AAA'), yOf(off, 'AAA'), 'layout 이 어노테이션을 밀어낸다');
  assert.deepEqual(ticks(on), ticks(off), '눈금 라벨은 움직이지 않는다');
});
