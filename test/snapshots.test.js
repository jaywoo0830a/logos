// 0911-PLAN Phase 0-3 — 골든 SVG 스냅샷 (SCENARIOS §L)
// 갱신: npm run snap:update   (test/fixtures/ 는 .gitignore 대상 → 로컬 전용)
//
// 정책: fixtures 가 없으면(=fresh clone) 조용히 통과하지 않고 skip 한다.
//       로컬에서 `npm run snap:update` 로 생성하면 그때부터 회귀를 감지한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { scenes } from './scenes.js';

const DIR = join(import.meta.dirname, 'fixtures');
const UPDATE = !!process.env.UPDATE;

test('골든 SVG 스냅샷 (test/fixtures/*.svg)', (t) => {
  mkdirSync(DIR, { recursive: true });
  const names = Object.keys(scenes);
  assert.ok(names.length > 0, '씬 목록 존재');

  const missing = names.filter((n) => !existsSync(join(DIR, `${n}.svg`)));
  if (UPDATE) {
    for (const name of names) writeFileSync(join(DIR, `${name}.svg`), scenes[name]());
    return;
  }
  if (missing.length === names.length) {
    t.skip('fixtures 미생성 — `npm run snap:update` 로 생성하세요 (로컬 전용)');
    return;
  }
  assert.equal(missing.length, 0, `fixture 누락: ${missing.join(', ')} — npm run snap:update`);
  for (const name of names) {
    assert.equal(
      scenes[name](),
      readFileSync(join(DIR, `${name}.svg`), 'utf8'),
      `${name}.svg 불일치 — 의도적 변경이면 npm run snap:update`,
    );
  }
});
