// test/raster.test.js — PNG 래스터 안정성 회귀 (resvg abort 방지)
//
// 배경 — `@resvg/resvg-js@2.6.2` 는 `resvg 0.34`(zimond/resvg@3495d870 포크)를 쓰고, 그
// `crates/resvg/src/render.rs::render_group()` 는 레이어 크기를 캔버스 4배로 자르면서
// `crate::geom::fit_to_rect()` → `IntRect::from_ltrb(...).unwrap()` 을 호출한다.
// 그룹 bbox 가 캔버스를 크게 벗어나면 이 unwrap 이 **Rust panic = 프로세스 abort** 를 낸다.
// JS 로 잡을 수 없으므로:
//   · 구현은 래스터 경로에서만 켜는 안전 패스로 막고(backend/svg.js — 화면 밖 제거 + 뷰 클리핑),
//   · 이 테스트는 **케이스마다 자식 프로세스**를 띄워 "죽지 않고 PNG 가 나왔는가"를 본다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { cases } from './raster-cases.mjs';

const HERE = import.meta.dirname;
const names = Object.keys(cases);

async function resvgAvailable() {
  try {
    await import('@resvg/resvg-js');
    return true;
  } catch {
    return false;
  }
}

test('PNG: 대표 도형 + 화면 밖 극단 좌표에서도 프로세스가 죽지 않는다', async (t) => {
  if (!(await resvgAvailable())) {
    t.skip('@resvg/resvg-js 미설치 — `npm i -D @resvg/resvg-js` 후 실행');
    return;
  }
  for (const name of names) {
    const r = spawnSync(process.execPath, [join(HERE, 'raster-png.mjs'), name], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    const line = (r.stdout || '').trim().split('\n').pop() || '';
    let info = {};
    try {
      info = JSON.parse(line);
    } catch {
      /* 출력 파싱 실패는 아래 메시지에 그대로 담는다 */
    }
    // SIGABRT(134) 로 죽으면 여기서 실패한다 — 그게 이 테스트의 핵심이다.
    assert.equal(
      r.status,
      0,
      `${name}: 종료코드 ${r.status}${r.signal ? ` (signal ${r.signal})` : ''} — ${line}${(r.stderr || '').slice(0, 200)}`,
    );
    assert.ok(info.bytes > 0, `${name}: PNG 바이트가 없습니다 (${line})`);
  }
});

test('PNG: scale 을 바꿔도 동일하게 안전하다 (fitTo zoom)', async (t) => {
  if (!(await resvgAvailable())) {
    t.skip('@resvg/resvg-js 미설치');
    return;
  }
  for (const name of ['huge-circle', 'wide-segment', 'offcanvas-angle-arc']) {
    const r = spawnSync(process.execPath, [join(HERE, 'raster-png.mjs'), name, '0.5'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    assert.equal(r.status, 0, `${name} @0.5x: 종료코드 ${r.status} — ${(r.stdout || '').trim().split('\n').pop()}`);
  }
});
