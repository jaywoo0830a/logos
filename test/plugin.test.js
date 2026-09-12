// test/plugin.test.js — 체이너블 플러그인 아키텍처 (core/plugin.js) 검증
//
// 확인하는 것: "코어를 고치지 않고" 사용자가 붙일 수 있는 8가지 확장이 실제로 동작하고,
// 되돌리기(uninstall/reset)로 원상복구되는지. 미등록 이름은 **등록 방법을 알려주는**
// PluginError 로 실패하는지.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene,
  point,
  circle,
  segment,
  curve,
  use,
  plugins,
  plugin,
  PluginError,
  Drawable,
  ray as rayStub,
  arc as arcStub,
} from '../index.js';
import geometryExtras, { Ray, Hatched } from '../plugins/geometry-extras.js';
// ── 테스트용 미니 플러그인 ────────────────────────────────
const mini = {
  name: 'mini-test',
  version: '1.2.3',
  install(api, opts = {}) {
    api.chain('drawable', { wave: (c, k = 1) => ({ waveK: k }) }); // ④-a 선언형
    api.extend('drawable', {
      mark(name) {
        return this.set({ tag: name });
      },
    }); // ④-b 명령형
    api.static('point', 'diag', (t) => point(t, t)); // ⑤
    api.theme('mini-theme', { bg: '#010203', axisColor: '#aabbcc' }); // ⑥
    api.hook('svg', (svg) => (opts.inject ? svg.replace('</svg>', '<!--mini--></svg>') : svg)); // ⑦
    api.around('scene', 'title', (orig, t) => orig(`«${t}»`)); // ⑧
  },
};

const svgOf = (sc) => sc.compile().toSVG();

test('use(): 설치·멱등·조회(list/has/info)', () => {
  try {
    const a = use(mini);
    const b = use(mini); // 두 번째 호출은 재설치하지 않는다
    assert.equal(a.name, 'mini-test');
    assert.equal(a, b, '멱등');
    assert.ok(plugin.list().includes('mini-test'));
    assert.ok(plugin.has('mini-test'));
    const info = plugin.info('mini-test');
    assert.equal(info.version, '1.2.3');
    assert.deepEqual(info.methods.sort(), ['mark', 'wave']);
    assert.deepEqual(info.themes, ['mini-theme']);
  } finally {
    plugin.uninstall('mini-test');
  }
  assert.ok(!plugin.has('mini-test'));
});

test('chain(): 패치 객체 반환 → 자동 this.set (불변 체이닝 유지)', () => {
  try {
    use(mini);
    const p0 = point(1, 1);
    const p1 = p0.wave(3);
    assert.notEqual(p1, p0, '새 인스턴스(불변)');
    assert.equal(p1.conf.waveK, 3);
    assert.equal(p0.conf.waveK, undefined, '원본 불변');
    // 코어 메서드와 섞여도 체이닝이 유지된다
    const chained = p0.wave(2).color('#123456').wave(4).dot();
    assert.equal(chained.conf.waveK, 4);
    assert.equal(chained.conf.color, '#123456');
    assert.ok(chained instanceof Drawable);
  } finally {
    plugin.uninstall('mini-test');
  }
});

test('extend(): 명령형 메서드도 체이닝 유지 + patch 자동 set', () => {
  try {
    use(mini);
    const p = point(0, 0).mark('A').color('#ff0000');
    assert.equal(p.conf.tag, 'A');
    assert.equal(p.conf.color, '#ff0000');
    assert.ok(p instanceof Drawable);
  } finally {
    plugin.uninstall('mini-test');
  }
});

test('plugin(): 이름으로 호출하는 escape hatch (+ 미등록은 PluginError)', () => {
  try {
    use(mini);
    const p = point(0, 0).plugin('wave', 5).plugin('mark', 'X');
    assert.equal(p.conf.waveK, 5);
    assert.equal(p.conf.tag, 'X');
    assert.throws(() => point(0, 0).plugin('no-such-method'), PluginError);
  } finally {
    plugin.uninstall('mini-test');
  }
});

test('define(): 새 빌더가 즉시 살아난다 — index.js 스텁(ray)까지', () => {
  use(geometryExtras, { watermark: false });
  try {
    assert.ok(plugin.has('geometry-extras'));
    // index.js 가 export 한 `ray` 스텁이 플러그인 등록만으로 동작한다
    const r = rayStub(point(0, 0), point(1, 1));
    assert.equal(r.O.coords[0], 0);
    assert.equal(r.P.coords[1], 1);
    // `plugins.<name>` Proxy 로도 같은 팩토리
    assert.equal(typeof plugins.ray, 'function');
    assert.ok(plugins.ray(point(0, 0), point(1, 0)) instanceof Ray);
    // 네임스페이스 스텁 `arc.circular` 도 등록 즉시 살아난다
    const arc = plugins['arc.circular'](point(0, 0), 1, 0, 90);
    const svg = svgOf(scene().view([-2, 2], [-2, 2]).equal().add(arc.color('#00ff00')));
    assert.ok(!/NaN/.test(svg));
    assert.ok(svgOf(scene().view([-2, 2], [-2, 2]).add(arc)).includes('<path'));
    assert.ok(scene().view([-2, 2], [-2, 2]).add(arc).compile().toTikZ().includes('\\draw'));
  } finally {
    plugin.uninstall('geometry-extras');
  }
});

test('static(): 기존 팩토리에 정적을 붙인다 (point.diag)', () => {
  try {
    use(mini);
    assert.equal(typeof point.diag, 'function');
    assert.deepEqual(point.diag(3).coords, [3, 3]);
  } finally {
    plugin.uninstall('mini-test');
  }
  assert.equal(point.diag, undefined, 'uninstall 로 원복');
});

test('node(): 새 IR 노드가 두 백엔드로 나간다 (SVG pattern + TikZ pattern)', () => {
  use(geometryExtras, { watermark: false });
  try {
    const fig = scene()
      .view([-3, 3], [-3, 3])
      .equal()
      .add(new Hatched(-1, -1, 2, 1.4).hatch({ gap: 6 }).text('A').color('#8b0000'));
    const svg = svgOf(fig);
    assert.ok(svg.includes('<pattern'), 'SVG <pattern> def');
    assert.ok(svg.includes('fill="url(#lgHatch'), '패턴 채움');
    assert.ok(svg.includes('>A<'), 'emitter 가 직접 텍스트도 그린다');
    assert.ok(!/NaN/.test(svg));
    assert.ok(fig.compile().toTikZ().includes('north east lines'), 'TikZ 패턴');
    assert.ok(plugin.nodeKinds().includes('hatch'));
  } finally {
    plugin.uninstall('geometry-extras');
  }
});

test('theme(): 등록한 테마가 .theme() 으로 적용된다', () => {
  try {
    use(mini);
    const svg = svgOf(scene().view([0, 1], [0, 1]).axes().theme('mini-theme').add(point(0.5, 0.5)));
    assert.ok(svg.includes('#010203'), '플러그인 테마 bg');
    assert.ok(svg.includes('#aabbcc'), '플러그인 테마 축 색');
  } finally {
    plugin.uninstall('mini-test');
  }
});

test("hook('svg') / hook('ir'): 파이프라인 후처리", () => {
  try {
    use(mini, { inject: true });
    const svg = svgOf(scene().view([0, 1], [0, 1]).add(point(0.5, 0.5)));
    assert.ok(svg.includes('<!--mini-->'), 'svg 훅');
  } finally {
    plugin.uninstall('mini-test');
  }

  const irHook = {
    name: 'ir-hook',
    install(api) {
      api.hook('ir', (nodes) =>
        nodes.concat([
          {
            kind: 'point',
            data: { x: 0, y: 0, marker: 'dot', size: 6, style: {} },
            children: [],
          },
        ]),
      );
    },
  };
  try {
    use(irHook);
    const svg = svgOf(scene().view([-1, 1], [-1, 1]).add(point(1, 1).dot()));
    assert.ok((svg.match(/<circle/g) || []).length >= 2, 'IR 훅이 노드를 덧붙였다');
  } finally {
    plugin.uninstall('ir-hook');
  }
});

test('around(): 기존 메서드 보강 (scene.title)', () => {
  try {
    use(mini);
    const svg = svgOf(scene().view([0, 1], [0, 1]).title('wave').add(point(0.5, 0.5)));
    assert.ok(svg.includes('«wave»'), '래핑된 title');

    test('around(): 데이터 반환 메서드는 값을 훼손하지 않는다 (체이닝 강제 없음)', () => {
      const raw = {
        name: 'raw-around',
        install(api) {
          api.around('point', 'dim', (orig) => orig() * 100); // 데이터 반환
          api.around('point', 'size', function (orig, n) {
            return this.set({ size: n * 2 });
          }); // 체이닝
          api.around('curve', 'eval', (orig, t) => orig(t)); // 값 그대로
        },
      };
      try {
        use(raw);
        assert.equal(point(1, 2).dim(), 200, 'around 가 값을 그대로 통과시킨다');
        assert.equal(point(1, 2).size(3).conf.size, 6, 'this.set 으로 체이닝 유지');
        assert.deepEqual(
          curve
            .fn((x) => x * x)
            .on([0, 1])
            .eval(0.5).cart,
          [0.5, 0.25],
          'eval 반환값 유지',
        );
      } finally {
        plugin.uninstall('raw-around');
      }
      assert.equal(point(1, 2).dim(), 2, 'uninstall 로 원복');
    });

    test('코어 기본값: ray/arc 는 등록 없이도 동작, 미등록 이름은 안내', () => {
      // 코어가 문서 API(ray/arc/sector/cube/prism/pyramid/torus)의 기본 구현을 제공한다.
      const r = rayStub(point(0, 0), point(1, 1));
      assert.ok(r && typeof r.toIR === 'function', 'ray 코어 기본값');
      assert.ok(arcStub.circular(point(0, 0), 1, 0, Math.PI)?.toIR, 'arc 코어 기본값');
      // 정말 없는 이름은 여전히 PluginError + 등록 안내
      let err = null;
      try {
        arcStub.semicircle();
      } catch (e) {
        err = e;
      }
      assert.ok(err instanceof PluginError, 'PluginError');
      assert.match(err.hint, /api\.define/, '등록 방법 안내');
      assert.match(err.hint, /use\(\{ name:/, 'use() 사용 예시');
      assert.throws(() => arcStub(), PluginError, '이름 자체 호출은 여전히 미등록 안내');
    });

    test('plugins Proxy: 등록 이름 조회 + `in` 연산', () => {
      use(geometryExtras, { watermark: false });
      try {
        assert.ok('ray' in plugins);
        assert.equal(typeof plugins.ray, 'function');
        assert.ok(plugins.factoryNames().includes('ray'));
        assert.equal(plugins.unknownThing, undefined, '미등록은 undefined');
      } finally {
        plugin.uninstall('geometry-extras');
      }
      assert.ok(!('ray' in plugins), 'uninstall 후 사라진다');
    });

    test('uninstall/reset: 설치 전 상태로 완전 원복(테스트 격리)', () => {
      const before = scene().title('t').compile().toSVG();
      use(mini);
      assert.ok(scene().title('t').compile().toSVG().includes('«t»'));
      plugin.uninstall('mini-test');
      assert.equal(scene().title('t').compile().toSVG(), before, '원상복구');

      // reset() 은 한 번에 전부 되돌린다
      use(mini);
      use(geometryExtras, { watermark: false });
      plugin.reset();
      assert.deepEqual(plugin.list(), []);
      assert.equal(point.diag, undefined);
      assert.equal(plugin.themes().length, 0);
      assert.equal(plugin.nodeKinds().length, 0);
      assert.equal(scene().title('t').compile().toSVG(), before);
    });

    test('형식 오류·이름 충돌은 PluginError + 부분 설치 롤백', () => {
      use(geometryExtras, { watermark: false });
      try {
        // 같은 이름의 다른 플러그인이 이미 점유한 빌더 이름 → 실패
        assert.throws(
          () =>
            use({
              name: 'dup',
              install(api) {
                api.define('ray', () => {});
              },
            }),
          PluginError,
        );
        assert.throws(() => use({ name: 'bad' }), PluginError, 'install 없음');
        assert.throws(
          () =>
            use({
              name: 'bad2',
              install(api) {
                api.extend('nope', { x() {} });
              },
            }),
          PluginError,
          '알 수 없는 대상',
        );
        assert.ok(!plugin.has('bad2'), '실패한 설치는 목록에 남지 않는다');
        assert.equal(typeof plugins.ray, 'function', '기존 설치는 그대로');
      } finally {
        plugin.uninstall('dup');
        plugin.uninstall('geometry-extras');
        plugin.reset();
      }
    });

    test('실제 플러그인: 체이닝 메서드 3종이 렌더에 반영된다', () => {
      use(geometryExtras, { watermark: false, stampTitle: true });
      try {
        // .dashed / .arrowTip — SVG 속성으로 확인
        const svg = svgOf(
          scene()
            .view([-3, 3], [-3, 3])
            .equal()
            .add(segment(point(0, 0), point(2, 0)).dashed([6, 2]).arrowTip())
            .title('mix'),
        );
        assert.ok(svg.includes('stroke-dasharray'), '.dashed → dasharray');
        assert.ok(svg.includes('marker-end'), '.arrowTip → 화살촉 (IR 을 감싼다)');
        assert.ok(svg.includes('[draft] mix'), '.around 옵션');

        // .tilt — transform 이 IR 에 실리고, emitter 가 좌표에 굽는다
        const figOf = (deg) =>
          scene()
            .view([-3, 3], [-3, 3])
            .equal()
            .add(segment(point(1, 0), point(2, 0)).tilt(deg));
        const node0 = figOf(0)
          .compile()
          .o.nodes.find((n) => n.kind === 'path');
        const node90 = figOf(90)
          .compile()
          .o.nodes.find((n) => n.kind === 'path');
        assert.deepEqual(node0.data.transforms[0].meta.kind, 'rotate', '회전 변환 부착');
        assert.notEqual(svgOf(figOf(0)), svgOf(figOf(90)), '좌표가 실제로 회전');
      } finally {
        plugin.uninstall('geometry-extras');
      }
    });

    test('플러그인 정의 클래스는 코어 프로토콜을 따른다 (Drawable 상속 · bounds)', () => {
      assert.ok(Ray.prototype instanceof Drawable);
      assert.ok(Hatched.prototype instanceof Drawable);
      const r = new Ray(point(0, 0), point(1, 0), { over: 3 });
      assert.equal(r.at(3).coords[0], 3, 'at(t)');
      assert.equal(Math.round(r.length() * 100) / 100, 3.15, 'tail 0.15 + over 3');
      const h = new Hatched(-1, -2, 3, 4);
      assert.deepEqual(h.bounds(), { xmin: -1, xmax: 2, ymin: -2, ymax: 2 });
      // bounds 를 제공하면 씬이 알아서 view 를 잡는다(코어 자동 스케일과 협력)
      const svg = svgOf(scene().add(new Hatched(0, 0, 2, 1)));
      assert.ok(!/NaN/.test(svg));
    });
  } finally {
    plugin.uninstall('mini-test');
  }
});
