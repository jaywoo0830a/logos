// test/plugin-guard.test.js — 조용한 덮어쓰기 방지(0.5.0) 검증
//
// 확인하는 것: 플러그인이 코어 기본 구현(ray·arc.circular·point.byDeg …)이나 코어 메서드·
// 다른 플러그인의 확장을 같은 이름으로 덮으면 **조용히 통과하지 않는다** —
// `plugins.info(name).warnings` 에 기록되고 콘솔로 경고가 나간다.
// throw 는 하지 않는다(non-breaking) — 의도적 덮어쓰기는 { overwrite: true } 로 표시한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ray, point, use, plugins, PluginError } from '../index.js';

/** console.warn 을 가로채고 원상복구하는 헬퍼 — 잡은 경고 문자열 배열을 돌려준다 */
function captureWarn(fn) {
  const seen = [];
  const orig = console.warn;
  console.warn = (...a) => seen.push(a.join(' '));
  try {
    fn();
  } finally {
    console.warn = orig;
  }
  return seen;
}

test('define(): 코어 기본 구현 덮어쓰기는 경고를 남긴다 (throw 하지 않음)', () => {
  const myRay = (A, B) => ({ __myRay: true, A, B });
  captureWarn(() =>
    use({
      name: 'guard-ray',
      install(api) {
        api.define('ray', myRay);
      },
    }),
  );
  try {
    const info = plugins.info('guard-ray');
    assert.equal(
      info.warnings.filter((w) => w.includes("define('ray')") && w.includes('코어 기본 구현')).length,
      1,
      `warnings 에 기록: ${JSON.stringify(info.warnings)}`,
    );
    assert.match(info.warnings[0], /overwrite: true/, '탈출구 안내 포함');
    // 동작은 여전히 플러그인 우선(non-breaking)
    assert.equal(ray(point(0, 0), point(1, 0)).__myRay, true, '등록한 팩토리가 우선');
  } finally {
    plugins.uninstall('guard-ray');
  }
});

test('define(): 의도를 밝히면({ overwrite: true }) 경고에 명시로 기록된다', () => {
  captureWarn(() =>
    use({
      name: 'guard-ray-explicit',
      install(api) {
        api.define('ray', (A, B) => ({ __myRay: true, A, B }), { overwrite: true });
      },
    }),
  );
  try {
    const w = plugins.info('guard-ray-explicit').warnings;
    assert.equal(w.filter((m) => m.includes("define('ray')") && m.includes('명시된 덮어쓰기')).length, 1);
  } finally {
    plugins.uninstall('guard-ray-explicit');
  }
});

test('define(): 코어에 없는 새 이름은 경고가 없다', () => {
  use({
    name: 'guard-new',
    install(api) {
      api.define('myThing', () => ({}));
    },
  });
  try {
    assert.deepEqual(plugins.info('guard-new').warnings, []);
  } finally {
    plugins.uninstall('guard-new');
  }
});

test('define(): 다른 플러그인이 점유한 이름은 여전히 PluginError (기존 동작 유지)', () => {
  captureWarn(() =>
    use({
      name: 'guard-a',
      install(api) {
        api.define('guardName', () => ({}));
      },
    }),
  );
  try {
    assert.throws(
      () =>
        use({
          name: 'guard-b',
          install(api) {
            api.define('guardName', () => ({}));
          },
        }),
      PluginError,
    );
  } finally {
    plugins.uninstall('guard-a');
    plugins.uninstall('guard-b');
  }
});

test('chain()/extend(): 코어 메서드를 같은 이름으로 실루엣하면 경고를 남긴다', () => {
  captureWarn(() =>
    use({
      name: 'guard-method',
      install(api) {
        api.chain('drawable', { color: (c, v) => ({ color: v }) }); // 코어 .color() 를 가린다
      },
    }),
  );
  try {
    const w = plugins.info('guard-method').warnings;
    assert.equal(w.filter((m) => m.includes("chain('color')") && m.includes('코어 기본 구현')).length, 1);
    // 새 이름(코어에 없음)은 경고 없음
    captureWarn(() =>
      use({
        name: 'guard-method2',
        install(api) {
          api.extend('drawable', { myMark() {} });
        },
      }),
    );
    assert.deepEqual(plugins.info('guard-method2').warnings, []);
  } finally {
    plugins.uninstall('guard-method');
    plugins.uninstall('guard-method2');
  }
});

test('static(): 코어 정적(point.byDeg)을 덮으면 경고를 남긴다', () => {
  captureWarn(() =>
    use({
      name: 'guard-static',
      install(api) {
        api.static('point', 'byDeg', (r, deg) => point(r, deg)); // 코어 point.byDeg 를 가린다
      },
    }),
  );
  try {
    const w = plugins.info('guard-static').warnings;
    assert.equal(w.filter((m) => m.includes("static('point.byDeg')") && m.includes('코어 기본 구현')).length, 1);
  } finally {
    plugins.uninstall('guard-static');
  }
});

test('console 로도 경고가 나간다 (조용한 통과 방지)', () => {
  const seen = captureWarn(() =>
    use({
      name: 'guard-console',
      install(api) {
        api.define('ray', (A, B) => ({ __myRay: true, A, B }));
      },
    }),
  );
  plugins.uninstall('guard-console');
  assert.ok(
    seen.some((l) => l.includes('[logos plugin:guard-console]') && l.includes("define('ray')")),
    `콘솔 경고: ${JSON.stringify(seen)}`,
  );
});

test('uninstall(): 덮어썼던 플러그인을 거두면 코어 기본 구현으로 돌아간다', () => {
  const myRay = (A, B) => ({ __myRay: true, A, B });
  captureWarn(() =>
    use({
      name: 'guard-restore',
      install(api) {
        api.define('ray', myRay, { overwrite: true });
      },
    }),
  );
  assert.equal(ray(point(0, 0), point(1, 0)).__myRay, true);
  plugins.uninstall('guard-restore');
  const restored = ray(point(0, 0), point(1, 0));
  assert.equal(restored.__myRay, undefined, '플러그인 팩토리 제거');
  assert.equal(typeof restored.toIR, 'function', '코어 기본 구현(RayShape)으로 폴백');
});
