// core/help.js — 런타임 셀프 문서화
// 검증: help() 개요 · 이름별 조회(빌더/모듈/scene) · 근접 추천 · api() 프로그래밍 조회 ·
//       kit 네임스페이스 등록으로 생긴 api.static('kit', …) 확장 · unknownFeature 힌트 연결
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { help, api, use, plugins, arc, kit, PluginError } from '../index.js';
import { unknownFeature } from '../core/plugin.js';

const silent = { print: false };

test('help() 개요 — 빠른 시작 · 모듈 지도 · 재발명 대조표를 문자열로 돌려준다', () => {
  const s = help(silent);
  assert.ok(s.includes('빠른 시작'), '빠른 시작');
  assert.ok(s.includes('kit.plot2d'), 'kit 프리셋 예시');
  assert.ok(s.includes('./kit.js'), 'subpath 모듈 지도');
  assert.ok(s.includes('./plugins/geometry-extras.js'), '동봉 플러그인 안내');
  assert.ok(s.includes('kit.palette'), '재발명 대조표: 팔레트');
  assert.ok(s.includes('더 보기'), '다음 토픽 안내');
});

test('help() 는 기본으로 콘솔에도 인쇄하고, print:false 면 하지 않는다', (t) => {
  const mock = t.mock.method(console, 'log', () => {});
  help();
  help();
  help({ print: false });
  assert.equal(mock.mock.calls.length, 2, '기본 동작 2회 인쇄 · print:false 는 인쇄하지 않음');
});

test("help('circle') — 설명 · 정적(레지스트리에서 동적 나열) · 체이닝 · 확장 지점", () => {
  const s = help('circle', silent);
  assert.ok(s.includes('circle.center(O).radius(2)'), '한 줄 설명');
  assert.ok(s.includes('circle.center · circle.through'), '정적 메서드(동적)');
  assert.ok(s.includes('.color .stroke'), 'Drawable 공통 체이닝');
  assert.ok(s.includes("api.extend('circle'"), '확장 지점 안내');
});

test("help('kit') — kit 이 네임스페이스로 등록돼 멤버가 동적으로 나온다", () => {
  const s = help('kit', silent);
  assert.ok(s.includes('작성 키트'), '모듈 설명');
  assert.ok(s.includes('plot2d') && s.includes('saveFigures') && s.includes('palette'), 'kit 멤버');
  assert.ok(!s.includes('kit.default'), 'default 는 제외');
});

test("help('scene') / help('plugin') / help('geometry-extras') — 각각의 안내", () => {
  assert.ok(help('scene', silent).includes('.compile'));
  const p = help('plugin', silent);
  assert.ok(p.includes('api.define') && p.includes('api.hook'), '8 확장 지점');
  assert.ok(p.includes('plugins.reset()'), '되돌리기');
  const g = help('geometry-extras', silent);
  assert.ok(g.includes('geometry-extras.js'), '경로');
  assert.ok(g.includes('use(geometryExtras)'), '설치법');
});

test("help('cricle') 같은 오타 — 근접 추천으로 circle 을 가리킨다", () => {
  const s = help('cricle', silent);
  assert.ok(s.includes('등록된 이름이 아닙니다'), '미등록 안내');
  assert.ok(s.includes("help('circle')"), 'Did you mean circle');
});

test('api() — 등록 상태를 객체로 돌려주고, 플러그인 등록이 즉시 반영된다', () => {
  const before = api();
  assert.ok(Array.isArray(before.factories) && Array.isArray(before.themes), '스냅샷 형태');
  plugins.define('help-demo', (...a) => a[0], { ctor: class HelpDemo {} });
  const after = api();
  assert.ok(after.factories.includes('help-demo'), '등록 반영');
  plugins.uninstall('inline'); // plugins.define 은 'inline' 소속 — 이 파일에서 깐 것만 원복
  assert.ok(!api().factories.includes('help-demo'), '제거 반영');
});

test("kit 은 네임스페이스로 등록됐다 — api.static('kit', …) 이 동작한다", () => {
  use({
    name: 'kit-static-demo',
    install(api) {
      api.static('kit', 'double', (x) => x * 2);
    },
  });
  assert.equal(kit.double(21), 42, 'kit.double 이 붙는다');
  plugins.uninstall('kit-static-demo');
});

test('unknownFeature 힌트가 help() 로 연결된다', () => {
  const e = unknownFeature('no-such-name');
  assert.ok(e instanceof PluginError);
  assert.ok(e.hint.includes('help()'), 'help 안내 포함');
});

test('미등록 스텁 호출 안내(arc.circular 가 아닌 정말 없는 이름)도 PluginError 유지', () => {
  assert.throws(() => arc.definitelyNotHere(), PluginError);
});
