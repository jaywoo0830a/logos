// examples/clean-code/run-all.js — clean-code 예제 30개를 순서대로 실행하고 요약한다.
//
//   node examples/clean-code/run-all.js
//   · 각 예제는 **별도 프로세스**로 돈다(한 예제가 죽어도 나머지는 계속).
//   · 산출물: output/clean-code/<예제이름>/{*.svg, *.png, index.html}
//   · 도커에서는:  bash scripts/test.sh 처럼 이미지 안에서 같은 명령을 실행하면 됩니다.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = import.meta.dirname;
const files = readdirSync(here)
  .filter((f) => /^\d\d-[a-z0-9-]+\.js$/.test(f))
  .sort();

console.log(`logos · clean-code 예제 ${files.length}개\n`);

const failed = [];
for (const f of files) {
  console.log(`── ${f}`);
  const r = spawnSync(process.execPath, [join(here, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed.push(f);
}

console.log(`\n=== ${files.length - failed.length}/${files.length} 성공 ===`);
if (failed.length) {
  console.error('실패:', failed.join(', '));
  process.exit(1);
}
