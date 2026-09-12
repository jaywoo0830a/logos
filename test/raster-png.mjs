// test/raster-png.mjs — 케이스 하나를 PNG 로 래스터하고 결과를 JSON 한 줄로 출력한다.
//
// 이 파일은 **부모가 자식 프로세스로** 실행한다(test/raster.test.js).
// resvg 의 Rust panic 은 프로세스를 abort 시켜 JS try/catch 로 못 잡기 때문에,
// 프로세스를 나눠야 "죽음(abort)" 을 정확히 실패로 보고할 수 있고 테스트 러너도 살아남는다.
import { cases } from './raster-cases.mjs';

const name = process.argv[2];
const scale = Number(process.argv[3] || 1);
const build = cases[name];
if (!build) {
  console.log(JSON.stringify({ ok: false, error: `unknown case: ${name}` }));
  process.exit(2);
}
try {
  const fig = build();
  // warnOutOfView: false — 여기서는 경고 문구가 아니라 "죽지 않았는가"만 본다.
  const png = await fig.toPNG({ math: 'text', scale, warnOutOfView: false });
  const bytes = png?.length ?? png?.byteLength ?? 0;
  console.log(JSON.stringify({ ok: bytes > 0, bytes }));
  process.exit(bytes > 0 ? 0 : 1);
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e.message).slice(0, 200) }));
  process.exit(3);
}
