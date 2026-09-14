// test/dx.test.js — docs/process/FEEDBACK.md(A·B 항목) 적용 회귀 테스트
//   A4 중첩 설정 깊은 복사 · A7 이터레이터/요약 · B1 toPoint · B2 게터 ·
//   B3 태그드 템플릿 · B4 with() · B5 add 평탄화
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { scene, point, toPoint, segment, annotate, kit, xy, range, view } from '../index.js';

test('B1 toPoint: 배열·객체·Point 를 모두 점으로 정규화', () => {
  assert.deepEqual(point([1, 2]).coords, [1, 2], 'point([1,2]) 는 [1,2] 좌표');
  assert.deepEqual(point([1, 2, 3]).coords, [1, 2, 3], 'point([1,2,3]) 3D');
  assert.deepEqual(point({ x: 1, y: 2 }).coords, [1, 2], 'point({x,y})');
  assert.deepEqual(toPoint([3, 4]).coords, [3, 4], 'toPoint(배열)');
  assert.deepEqual(toPoint({ x: 5, y: 6 }).coords, [5, 6], 'toPoint(객체)');
  const p = point(7, 8);
  assert.equal(toPoint(p), p, '기존 Point 는 그대로');

  // annotate.text([x, y]) — 예전엔 c.P.coords 가 undefined 라 죽었다
  const svg = scene()
    .view([0, 1], [0, 1])
    .add(annotate.text([0.1, 0.5]).label('hi'))
    .compile()
    .toSVG();
  assert.ok(svg.includes('hi'), '배열 좌표 텍스트 렌더');

  // segment([x,y], [x2,y2])
  const seg = segment([0, 0], [1, 1]);
  assert.deepEqual(seg.a.coords, [0, 0]);
  assert.deepEqual(seg.b.coords, [1, 1]);

  // kit.seg 도 동일 (이미 지원 — 회귀 유지)
  const a1 = scene()
    .view([0, 2], [0, 2])
    .add(kit.seg([0, 0], [1, 1]))
    .compile()
    .toSVG();
  const p1 = scene()
    .view([0, 2], [0, 2])
    .add(kit.seg(point(0, 0), point(1, 1)))
    .compile()
    .toSVG();
  assert.equal(a1, p1);
});

test('B2 게터: Point 의 x/y, Segment 의 ends', () => {
  const { x, y } = point(3, 4);
  assert.equal(x, 3);
  assert.equal(y, 4);
  const [a, b] = segment(point(0, 0), point(3, 4)).ends;
  assert.deepEqual(a.coords, [0, 0]);
  assert.deepEqual(b.coords, [3, 4]);
});

test('B3 태그드 템플릿: xy / range / view', () => {
  assert.deepEqual(xy`3, 4`.coords, [3, 4]);
  assert.deepEqual(xy`1 2`.coords, [1, 2]);
  assert.deepEqual(range`0..10 step 2`, [0, 2, 4, 6, 8, 10]);
  assert.deepEqual(range`3..-3`, [3, 2, 1, 0, -1, -2, -3]);
  assert.deepEqual(view`x∈[-3, 3]  y∈[-1, 4]`, [
    [-3, 3],
    [-1, 4],
  ]);
  assert.deepEqual(view`[-2,2] [0,5]`, [
    [-2, 2],
    [0, 5],
  ]);
  assert.throws(() => range`nope`, /허용 예/);
});

test('B4/B5 with() 별칭 · add() 평탄화', () => {
  const p = point(1, 1);
  const q = p.with({ stroke: 2 });
  assert.equal(q.conf.stroke, 2);
  assert.equal(p.conf.stroke, undefined, '원본 불변');

  assert.equal(scene().add([point(0.1, 0.1), point(0.2, 0.2)])._conf.shapes.length, 2, 'add([a,b]) 평탄화');
  assert.equal(scene().addAll([point(0, 0), point(1, 1)])._conf.shapes.length, 2, 'addAll 평탄화');
});

test('A4 중첩 설정은 깊은 복사 — 상수 공유 오염 방지', () => {
  const BOX = { facecolor: 'white', alpha: 0.85 };
  const a = annotate.text(point(0, 0)).box(BOX);
  const b = a.box({ facecolor: 'wheat' });
  assert.equal(BOX.alpha, 0.85, '원본 상수 불변');
  assert.notEqual(a.conf.box, b.conf.box, 'box 객체는 서로 다른 사본');
  assert.equal(b.conf.box.facecolor, 'wheat');
  assert.equal(BOX.facecolor, 'white');
});

test('A7 IR 이터레이터 + Scene 요약(inspect.custom)', () => {
  const ir = scene().view([0, 1], [0, 1]).add(point(0.5, 0.5)).compile();
  const nodes = [...ir];
  assert.equal(nodes.length, ir.o.nodes.length, '[...ir] 로 노드 순회');
  assert.ok(nodes.every((n) => typeof n.kind === 'string'));

  const s = scene().view([-1, 1], [-1, 1]).add(point(0, 0));
  assert.match(inspect(s), /^Scene\(2D, shapes: 1, view: \[\[-1,1\],\[-1,1\]\]\)$/);
});
