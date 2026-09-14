#!/usr/bin/env node
// bin/logos.mjs — logos CLI (new · render · serve · list)
//
// 워크플로우(4단계)의 3번째 단계를 담당한다 — bash 스크립트(scripts/render.sh)가 이 CLI 를 부르고,
// 이 CLI 가 사용자 폴더의 스케치(*.js)를 읽어 **원하는 디렉토리에** SVG/PNG + 갤러리를 렌더한다.
//
//   ① 패키지 설치   npm install            (scripts/install.sh)
//   ② 코드 작성     sketches/hello.js      (logos new sketches 로 뼈대 생성)
//   ③ 실행          bash scripts/render.sh  → logos render sketches --out out
//   ④ 산출물        out/*.svg · out/*.png · out/index.html · out/manifest.json
//
// 설계 원칙
//   · 의존성 0 — Node 24+ 내장 모듈만 사용(컨테이너가 가벼워진다).
//   · 스케치 계약은 **작게**: 파일이 `export default`(Scene/SceneIR/함수) 하나만 내보내도 되고,
//     `export const figures = {…}` 로 한 파일에서 여러 그림을 낼 수도 있다.
//   · 렌더링은 라이브러리의 `kit.saveFigures` 를 그대로 재사용한다(CLI 는 얇은 껍데기).
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { basename, extname, join, resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const HERE = import.meta.dirname;
const PKG_ROOT = resolve(HERE, '..'); // 패키지 루트(설치본이면 node_modules/@…/logos/)
const PKG_JSON = readJson(join(PKG_ROOT, 'package.json')) || {};
const PKG_NAME = PKG_JSON.name || 'logos'; // 배포 이름 — 스코프 포함(@scope/name)
const VERSION = PKG_JSON.version || '0.0.0';

/** JSON 파일을 안전하게 읽는다(없거나 깨지면 null) */
function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// ── 로그 ────────────────────────────────────────────────────
const C = process.stdout.isTTY
  ? {
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
      bold: '\x1b[1m',
      off: '\x1b[0m',
    }
  : { dim: '', red: '', green: '', yellow: '', cyan: '', bold: '', off: '' };
const log = (...a) => console.log(...a);
const ok = (m) => log(`${C.green}✓${C.off} ${m}`);
const warn = (m) => console.error(`${C.yellow}!${C.off} ${m}`);
const fail = (m) => console.error(`${C.red}✗${C.off} ${m}`);

/** CLI 오류(사용자 입력 문제) — 스택 없이 메시지만 보여준다 */
class CliError extends Error {}

// ── 인자 파서 (의존성 0) ────────────────────────────────────
/**
 * `--key value` · `--key=value` · `-k value` · 불리언 플래그 · `--no-xxx` 를 지원한다.
 * @param {string[]} argv
 * @param {Object} spec { key: {alias, type:'string'|'number'|'bool'|'list', default, desc} }
 */
function parseArgs(argv, spec) {
  const out = {};
  for (const [k, v] of Object.entries(spec)) out[k] = v.default;
  const alias = {};
  for (const [k, v] of Object.entries(spec)) for (const a of v.alias || []) alias[a] = k;
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      rest.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('-')) {
      const neg = a.startsWith('--no-');
      const raw = neg ? a.slice(5) : a.replace(/^-+/, '');
      const [name0, inline] = raw.split('=');
      const name = alias[name0] || name0;
      if (!(name in spec)) throw new CliError(`알 수 없는 옵션: ${a}`);
      const s = spec[name];
      if (neg) {
        out[name] = false;
        continue;
      }
      if (s.type === 'bool') {
        out[name] = inline === undefined ? true : inline !== 'false';
        continue;
      }
      const val = inline !== undefined ? inline : argv[++i];
      if (val === undefined) throw new CliError(`옵션 ${a} 에 값이 필요합니다`);
      if (s.type === 'number') {
        const n = Number(val);
        if (!Number.isFinite(n)) throw new CliError(`옵션 ${a} 는 숫자여야 합니다: ${val}`);
        out[name] = n;
      } else if (s.type === 'list') {
        out[name] = String(val)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
      } else out[name] = val;
    } else rest.push(a);
  }
  return { opts: out, rest };
}

// ── 스케치 탐색 · 로딩 ──────────────────────────────────────
const SKETCH_EXT = new Set(['.js', '.mjs']);

/** 소스 폴더에서 스케치 파일을 찾는다(정렬, node_modules/`.`·`_` 접두 무시) */
function findSketches(srcDir, { recursive = false } = {}) {
  if (!existsSync(srcDir)) throw new CliError(`소스 폴더가 없습니다: ${srcDir}`);
  if (!statSync(srcDir).isDirectory()) throw new CliError(`소스 경로가 폴더가 아닙니다: ${srcDir}`);
  // A2: Node 20.1+ 의 재귀 읽기로 수동 재귀(20줄)를 대체한다.
  //     재귀 모드에서 `Dirent.name` 은 **상대 경로**이고 `Dirent.parentPath`(Node 20.12+)가 실제 폴더다.
  const ents = readdirSync(srcDir, { recursive, withFileTypes: true });
  const out = [];
  for (const ent of ents) {
    if (!ent.isFile()) continue;
    const dir = ent.parentPath || srcDir;
    const rel = relative(srcDir, dir);
    // 숨김 폴더 · node_modules 는 재귀에서도 건너뛴다(수동 재귀와 동일한 규칙).
    if (rel && rel.split(sep).some((seg) => seg === 'node_modules' || seg.startsWith('.'))) continue;
    if (!SKETCH_EXT.has(extname(ent.name))) continue;
    if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
    if (/\.(test|spec)\.(js|mjs)$/.test(ent.name)) continue;
    out.push(join(dir, ent.name));
  }
  // 상대 경로 기준 정렬 — 결과 순서를 결정적으로 유지한다(manifest/갤러리 순서).
  return out.toSorted((a, b) => relative(srcDir, a).localeCompare(relative(srcDir, b)));
}

/** 스케치 모듈에서 (name, factory, title) 항목들을 뽑는다 */
function entriesOf(mod, file) {
  const base = basename(file, extname(file));
  const defName = typeof mod.name === 'string' ? mod.name : base;
  const defTitle = typeof mod.title === 'string' ? mod.title : defName;
  const out = [];
  if (mod.figures !== undefined) {
    let f = mod.figures;
    if (typeof f === 'function') f = f();
    if (Array.isArray(f) && f.length && Array.isArray(f[0])) {
      for (const row of f) out.push([String(row[0]), row[1], row[2] || String(row[0])]);
    } else if (f && typeof f === 'object' && typeof f.compile !== 'function' && typeof f.toSVG !== 'function') {
      for (const [k, v] of Object.entries(f)) out.push([k, v, k]);
    } else if (f !== undefined && f !== null) {
      out.push([defName, f, defTitle]);
    }
  }
  if (!out.length && mod.default !== undefined) out.push([defName, mod.default, defTitle]);
  return out;
}

/** Scene | SceneIR | 팩토리 함수 → SceneIR 로 정규화 */
function toIR(fig, { label = '', layout = false } = {}) {
  let v = typeof fig === 'function' ? fig() : fig;
  if (v == null) throw new CliError(`${label}: 그림을 만들지 못했습니다(팩토리가 빈 값을 반환)`);
  // --layout: 컴파일 전에 라벨 자동 배치를 켠다. IR 로 이미 컴파일된 스케치면 옵션만 덮어쓴다.
  if (layout) {
    if (typeof v.layout === 'function') v = v.layout('auto');
    else if (v.o) v.o = { ...v.o, layout: 'auto' };
  }
  if (typeof v.compile === 'function') return v.compile();
  if (typeof v.toSVG === 'function') return v;
  throw new CliError(`${label}: Scene 또는 SceneIR 이어야 합니다(받은 값: ${v?.constructor?.name || typeof v})`);
}

/** 이전 실행이 남긴 생성물만 지운다(manifest 기준 — 사용자 파일은 건드리지 않는다) */
function removeGenerated(outDir) {
  const m = readJson(join(outDir, 'manifest.json'));
  if (!m) return;
  for (const f of m.figures || []) {
    for (const ext of ['svg', 'png']) {
      const p = join(outDir, `${f.name}.${ext}`);
      if (existsSync(p)) rmSync(p, { force: true });
    }
  }
}

/** 사람에게 보여줄 경로 — cwd 밖이면 절대경로 그대로(‘../../..’ 방지) */
function pretty(p) {
  const r = relative(process.cwd(), p);
  return r && !r.startsWith('..') ? r : p;
}

// ── render 명령 ─────────────────────────────────────────────
async function cmdRender(argv) {
  const { opts, rest } = parseArgs(argv, {
    src: { type: 'string', alias: ['s'], default: null, desc: '스케치 폴더' },
    out: { type: 'string', alias: ['o'], default: 'out', desc: '출력 폴더' },
    png: { type: 'bool', default: true, desc: 'PNG 도 생성(기본 on)' },
    scale: { type: 'number', default: 1, desc: 'PNG 배율' },
    layout: {
      type: 'bool',
      default: false,
      desc: '라벨 자동 배치(scene.layout()) — 겹치는 어노테이션을 눈금까지 피해 밀어낸다',
    },
    index: { type: 'bool', default: true, desc: 'index.html 갤러리 생성' },
    title: { type: 'string', default: null, desc: '갤러리 제목' },
    recursive: { type: 'bool', alias: ['r'], default: false, desc: '하위 폴더까지' },
    quiet: { type: 'bool', alias: ['q'], default: false, desc: '진행 로그 최소' },
    json: { type: 'bool', default: false, desc: '결과를 JSON 으로 출력' },
    'dry-run': { type: 'bool', default: false, desc: '렌더 없이 목록만' },
    clean: { type: 'bool', default: false, desc: '이전 생성물(manifest 기준)을 지우고 시작' },
  });
  // 대상은 **여러 개**일 수 있다 — 폴더 · 파일 · 셸이 펼친 glob(sketches/*.js).
  const targets = (rest.length ? rest : [opts.src || 'sketches']).map((t) => resolve(t));
  const outDir = resolve(opts.out);

  const kit = await import(pathToFileURL(join(PKG_ROOT, 'kit.js')).href);
  const found = [];
  for (const t of targets) {
    if (!existsSync(t)) throw new CliError(`대상이 없습니다: ${t}`);
    if (statSync(t).isDirectory()) found.push(...findSketches(t, { recursive: opts.recursive }));
    else if (SKETCH_EXT.has(extname(t))) found.push(t);
    else throw new CliError(`스케치(*.js/*.mjs) 또는 폴더여야 합니다: ${t}`);
  }
  const files = [...new Set(found)]; // 같은 파일을 두 번 넘겨도 한 번만
  if (!files.length) throw new CliError(`스케치를 찾지 못했습니다: ${targets.join(', ')} (*.js / *.mjs)`);
  const srcDir = targets.length === 1 ? targets[0] : resolve('.');

  // 로딩 — 한 파일이 여러 그림을 낼 수 있다
  const figures = [];
  for (const file of files) {
    const rel = relative(srcDir, file);
    let mod;
    try {
      mod = await import(pathToFileURL(file).href);
    } catch (e) {
      let msg = e.message;
      // 패키지를 못 찾는 흔한 실수 — 설치 안내를 덧붙인다
      const esc = PKG_NAME.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
      const missing = new RegExp(`Cannot find (package|module) ['"](@?${esc}|logos)['"]`).test(msg);
      if (missing || /ERR_MODULE_NOT_FOUND/.test(e.code || '')) {
        msg += `\n    → 스케치가 '${PKG_NAME}' 를 못 찾았습니다. 먼저 설치하세요:  npm install ${PKG_NAME}`;
      }
      fail(`${rel}: 불러오기 실패 — ${msg}`);
      figures.push({ name: basename(file, extname(file)), title: rel, src: rel, error: msg });
      continue;
    }
    const ents = entriesOf(mod, file);
    if (!ents.length) {
      warn(`${rel}: export default / figures 가 없어 건너뜁니다`);
      continue;
    }
    for (const [name, fig, title] of ents) figures.push({ name, title: title || name, fig, src: rel });
  }
  const failed = figures.filter((f) => f.error);
  const usable = figures.filter((f) => !f.error);
  if (!usable.length) throw new CliError(`렌더할 figure 가 없습니다: ${srcDir}`);

  if (opts['dry-run']) {
    for (const f of figures)
      log(`  ${f.error ? `${C.red}✗${C.off}` : `${C.green}✓${C.off}`} ${f.name}  ${C.dim}${f.src}${C.off}`);
    log(`\n${C.bold}${usable.length}${C.off} figure (실패 ${failed.length}) — dry-run 이라 렌더하지 않았습니다`);
    return failed.length ? 1 : 0;
  }

  mkdirSync(outDir, { recursive: true });
  if (opts.clean) removeGenerated(outDir);

  let okN = 0,
    failN = failed.length;
  const entries = [];
  for (const f of figures) {
    if (f.error) continue;
    try {
      const ir = toIR(f.fig, { label: f.name, layout: opts.layout });
      await kit.saveFigure(ir, { dir: outDir, name: f.name, png: opts.png, scale: opts.scale, log: false });
      entries.push({ name: f.name, title: f.title });
      okN++;
      // --json 은 stdout 을 **순수 JSON** 으로 유지한다(진행 로그는 생략)
      if (!opts.quiet && !opts.json) log(`  ${C.green}✓${C.off} ${f.name}`);
    } catch (e) {
      failN++;
      fail(`${f.name}: ${e.message}`);
    }
  }

  // 갤러리(index.html) + 매니페스트(기계 판독용 · --clean 의 기준)
  if (opts.index && entries.length) {
    kit.writeGallery(outDir, entries, { title: opts.title || `logos · ${basename(srcDir)} 렌더 갤러리` });
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    logos: VERSION,
    package: PKG_NAME,
    src: relative(process.cwd(), srcDir) || '.',
    out: relative(process.cwd(), outDir) || '.',
    formats: ['svg', ...(opts.png ? ['png'] : [])],
    ok: okN,
    fail: failN,
    figures: entries.map((e) => ({ name: e.name, title: e.title })),
    errors: figures.filter((f) => f.error).map((f) => ({ name: f.name, src: f.src, error: f.error })),
  };
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  if (opts.json) {
    log(JSON.stringify(manifest, null, 2));
  } else if (!opts.quiet) {
    log(`\n${C.bold}→ ${okN}개 생성, ${failN}개 실패${C.off} → ${pretty(outDir)}`);
    if (opts.index && entries.length) {
      log(`${C.dim}  갤러리: ${join(pretty(outDir), 'index.html')} · 서빙: logos serve ${pretty(outDir)}${C.off}`);
    }
  }
  return failN ? 1 : 0;
}

// ── new 명령 — 스케치 폴더 뼈대 ──────────────────────────────
const SKETCH_TEMPLATE = `// sketches/sketch.js — logos 스케치 한 장
//   렌더:  npx logos render . -o out      (또는  npm run render)
import { scene, point, circle, segment, annotate, tex } from '${PKG_NAME}';

export const title = '첫 그림';   // 갤러리에 표시될 이름(선택)

export default scene()
  .size(640, 480)
  .view([-3, 3], [-2, 2])
  .equal().axes().grid({ alpha: 0.25 })
  .title('내 첫 logos 그림')
  .add(
    circle.center(point.origin()).radius(2).color('#3b82f6').stroke(2),
    point(2, 0).label('P').dot(),
    segment(point.origin(), point(2, 0)).dash([4, 3]).color('#888'),
    annotate.angle({ from: [2, 0], vertex: [0, 0], to: [0, 2] }).arc({ radius: 0.6 }).label(tex\`\\theta\`),
  );
`;

const README_TEMPLATE = (dir) => `# ${dir} — logos 스케치

\`\`\`bash
# ① 패키지 설치 (상위 프로젝트에 이미 있으면 생략)
npm install

# ② 렌더 — 산출물은 out/ 로
npx logos render . -o out          # 또는 npm run render

# ③ 결과 보기
npx logos serve out 18080          # http://localhost:18080/
\`\`\`

도커로 렌더하면 호스트에 Node/폰트/래스터라이저가 없어도 됩니다(리눅스 전용).

\`\`\`bash
bash "$(npm root)/${PKG_NAME}/scripts/render.sh" -p . -s . -o out
\`\`\`

스케치 파일은 \`export default\` 로 그림 하나를 내보내거나,
\`export const figures = { 이름: 그림, … }\` 로 여러 장을 낼 수 있습니다.
자세한 규칙은 [\`docs/guides/WORKFLOW.md\`](https://github.com/jaywoo0830a/logos/blob/main/docs/guides/WORKFLOW.md) 와
\`npx logos --help\` 를 보세요.
`;

function cmdNew(argv) {
  const { opts, rest } = parseArgs(argv, {
    force: { type: 'bool', alias: ['f'], default: false, desc: '기존 파일 덮어쓰기' },
    name: { type: 'string', default: null, desc: 'package.json name' },
  });
  const dir = resolve(rest[0] || 'sketches');
  mkdirSync(dir, { recursive: true });

  // 설치본이면 버전 범위, 리포 안이면 로컬 경로로 의존성을 적는다(리눅스 경로 가정)
  const local = !PKG_ROOT.includes('/node_modules/');
  const dep = local ? `file:${PKG_ROOT}` : `^${VERSION}`;
  const files = {
    'sketch.js': SKETCH_TEMPLATE,
    'package.json': `${JSON.stringify(
      {
        name: opts.name || `${basename(dir)}-sketches`,
        private: true,
        type: 'module',
        scripts: { render: 'logos render . --out out', serve: `logos serve out` },
        dependencies: { [PKG_NAME]: dep },
      },
      null,
      2,
    )}\n`,
    '.gitignore': 'node_modules/\nout/\n',
    'README.md': README_TEMPLATE(basename(dir)),
  };
  const wrote = [];
  for (const [f, body] of Object.entries(files)) {
    const p = join(dir, f);
    if (existsSync(p) && !opts.force) {
      warn(`${pretty(p)} 이미 있습니다 (--force 로 덮어쓰기)`);
      continue;
    }
    writeFileSync(p, body);
    wrote.push(f);
  }
  ok(`${pretty(dir)} 뼈대 생성 (${wrote.join(', ')})`);
  log(`${C.dim}  다음: cd ${pretty(dir)} && npm install && npx logos render . -o out${C.off}`);
  log(`${C.dim}  (도커 · 리눅스) bash "$(npm root)/${PKG_NAME}/scripts/render.sh" -p . -s . -o out${C.off}`);
  return 0;
}

// ── serve 명령 — 렌더 결과를 브라우저로 ─────────────────────
async function cmdServe(argv) {
  const { opts, rest } = parseArgs(argv, {
    port: { type: 'number', alias: ['p'], default: Number(process.env.PORT || 18080), desc: '포트' },
    host: { type: 'string', default: null, desc: '바인딩 주소' },
  });
  const dir = resolve(rest[0] || process.env.LOGOS_ROOT || 'out');
  if (!existsSync(dir)) throw new CliError(`서빙할 폴더가 없습니다: ${dir} (먼저 렌더하세요)`);
  process.env.LOGOS_ROOT = dir;
  process.env.PORT = String(opts.port);
  if (opts.host) process.env.HOST = opts.host;
  await import(pathToFileURL(join(PKG_ROOT, 'server.js')).href);
  return -1; // 서버가 계속 실행됨(종료하지 않음)
}

// ── 사용법 ─────────────────────────────────────────────────
function usage() {
  log(`${C.bold}logos ${VERSION}${C.off} — 스케치 폴더를 교과서 품질 그림으로 렌더

${C.bold}사용법${C.off}
  logos render [소스폴더] [옵션]      스케치(*.js)를 렌더 → SVG/PNG/갤러리
  logos new <폴더> [--force]         스케치 폴더 뼈대 생성
  logos list [소스폴더] [옵션]        렌더 없이 figure 목록만 확인
  logos serve [출력폴더] [--port N]   렌더 결과를 HTTP 로 서빙
  logos --help | --version

${C.bold}render 옵션${C.off}
  -s, --src DIR      소스 폴더 (기본: sketches)
  -o, --out DIR      출력 폴더 (기본: out)          ← 원하는 디렉토리 지정
      --png / --no-png     PNG 생성 여부 (기본 on · resvg 필요)
      --scale N            PNG 배율 (기본 1)
      --no-index           index.html 갤러리 생략
      --title T            갤러리 제목
  -r, --recursive    하위 폴더까지 검색
      --clean          이전 생성물(manifest 기준) 삭제 후 렌더
      --dry-run        렌더 없이 목록만
      --json           결과 manifest 를 stdout 으로
  -q, --quiet        진행 로그 최소

${C.bold}스케치 계약${C.off} (파일 하나가 그림 1장 이상)
  export default scene().…            // Scene · SceneIR · 팩토리 함수
  export const name = 'figure-name';  // 파일명 대신 쓸 이름(선택)
  export const title = '보이는 제목';  // (선택)
  export const figures = { a: scene…, b: () => panels([…]) };      // 한 파일 다장
  export const figures = [['a', () => scene…, '제목'], …];          // 배열 형식도 가능

${C.bold}도커/배시 워크플로우${C.off} (리눅스 전용)
  bash scripts/install.sh                이미지 준비(렌더·서빙·테스트)
  bash scripts/render.sh -s . -o out     렌더(도커 컨테이너에서 실행)
  bash scripts/serve.sh out 18080        결과 서빙
`);
}

// ── 진입점 ─────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const [cmd, ...rest] = argv;
  // 하위 명령 뒤의 --help/-h 도 도움말로 (예: `logos render --help`)
  if (rest.includes('--help') || rest.includes('-h')) {
    usage();
    return 0;
  }
  switch (cmd) {
    case 'render':
    case 'r':
      return cmdRender(rest);
    case 'new':
    case 'init':
      return cmdNew(rest);
    case 'serve':
    case 's':
      return cmdServe(rest);
    case 'list':
    case 'ls':
      return cmdRender([...rest, '--dry-run']);
    case '--version':
    case '-v':
      log(VERSION);
      return 0;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      usage();
      return cmd ? 0 : 2;
    default:
      throw new CliError(`알 수 없는 명령: ${cmd}  (logos --help)`);
  }
}

main()
  // 종료 코드만 남기고 프로세스가 스스로 끝나게 한다 — `process.exit()` 는 파이프로 나가는
  // stdout 버퍼를 잘라먹을 수 있어(출력 유실) 성공 경로에서는 쓰지 않는다.
  .then((code) => {
    if (typeof code === 'number' && code >= 0) process.exitCode = code;
  })
  .catch((e) => {
    if (e instanceof CliError) {
      fail(e.message);
      usage();
      process.exitCode = 2;
      return;
    }
    fail(e.stack || e.message);
    process.exitCode = 1;
  });
