import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, triangle, circle, line, segment, curve, region, annotate, tex } from '../index.js';

function count(svg, tag) { return (svg.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length; }

test('scene: 기본 2D SVG 컴파일', () => {
  const svg = scene()
    .view([-3, 3], [-2, 2])
    .equal()
    .axes()
    .grid(1)
    .add(point(1, 1).label('A').dot())
    .compile()
    .toSVG();
  assert.ok(svg.startsWith('<svg'), 'SVG 시작 태그');
  assert.ok(count(svg, 'circle') >= 1, '점 렌더링');
  assert.ok(count(svg, 'path') >= 1, '그리드 렌더링');
  assert.ok(svg.includes('>A<'), '라벨 포함');
});

test('scene: 불변성 — 원본이 바뀌지 않는다', () => {
  const s = scene().equal().axes();
  const s2 = s.add(point(0, 0));
  assert.notEqual(s, s2);
  assert.equal(s._conf.shapes.length, 0);
  assert.equal(s2._conf.shapes.length, 1);
});

test('scene: 3D 점 프로젝션', () => {
  const svg = scene()
    .dim(3)
    .camera({ position: [3, 3, 3] })
    .add(point(1, 2, 3).dot(), point(0, 0, 0).dot())
    .compile()
    .toSVG();
  assert.ok(count(svg, 'circle') >= 2);
});

test('scene: 극좌표 장미 → SVG', () => {
  const svg = scene()
    .equal()
    .view([-1.5, 1.5], [-1.5, 1.5])
    .polarGrid()
    .add(curve.polar((t) => Math.cos(3 * t)).on([0, 6.283]))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'path') >= 1, '곡선 경로');
});

test('scene: region.riemann 채우기', () => {
  const svg = scene()
    .view([-0.5, 3], [-0.5, 3])
    .add(region.riemann((x) => x * x).on([0, 2]).n(8).left().fill('#2196f3').opacity(0.4))
    .compile()
    .toSVG();
  assert.ok(count(svg, 'rect') >= 1, '리만 직사각형');
});

test('scene: annotate.caption / angle', () => {
  const svg = scene()
    .view([-2, 2], [-1, 3])
    .equal()
    .add(
      annotate.caption(tex`\\text{그림 1}`),
      annotate.angle(point(0, 0), point(1, 0), point(1, 1)).arc().degrees().label('θ'),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('그림'));
});

test('scene: assert 실패 시 에러', () => {
  const bad = scene()
    .view([0, 1], [0, 1])
    .add(segment(point(0, 0), point(1, 0)), segment(point(0, 0), point(0, 2)))
    .assert({ kind: 'equal-length', items: [segment(point(0, 0), point(1, 0)), segment(point(0, 0), point(0, 2))] });
  assert.throws(() => bad.compile(), /equal-length/);
});

test('scene: toJSON 구조', () => {
  const j = scene().add(point(1, 2)).compile().toJSON();
  assert.equal(j.dim, 2);
  assert.ok(j.nodes.length >= 1);
});