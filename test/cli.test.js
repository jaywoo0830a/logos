// test/cli.test.js — 워크플로우 CLI(bin/logos.mjs) 회귀 테스트
//
//   "패키지 설치 → 스케치 작성 → CLI 실행 → 원하는 디렉토리에 렌더" 흐름을
//   임시 프로젝트에서 실제로 돌려본다(도커 없이 CLI 만 — bash/도커 스크립트는 Linux 전용).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(REPO, 'bin', 'logos.mjs');

/** CLI 실행 — {status, stdout, stderr} */
function cli(args, opts = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...opts });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

/** 임시 스케치 프로젝트 — node_modules/logos 심링크까지(=패키지 설치 상태) */
function project(sketches = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'logos-cli-'));
  mkdirSync(join(dir, 'sketches'), { recursive: true });
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(REPO, join(dir, 'node_modules', 'logos'));
  for (const [name, body] of Object.entries(sketches)) writeFileSync(join(dir, 'sketches', name), body);
  return dir;
}

const SKETCH_ONE = `
import { scene, point } from 'logos';
export const title = '한 장';
export default scene().view([0, 2], [0, 2]).add(point(1, 1).dot());
`;

const SKETCH_MANY = `
import { scene, point } from 'logos';
export const figures = {
  'many-a': () => scene().view([0, 2], [0, 2]).add(point(0.5, 0.5).dot()),
  'many-b': scene().view([0, 2], [0, 2]).add(point(1.5, 1.5).dot()),
};
`;

const SKETCH_ARRAY = `
import { scene, point } from 'logos';
export const figures = [['arr-first', () => scene().view([0, 1], [0, 1]).add(point(0.5, 0.5)), '첫째']];
`;

const SKETCH_PLUGIN = `
import { scene, point, use, plugins } from 'logos';
import extras from 'logos/plugins/geometry-extras.js';
use(extras, { watermark: false });
export default scene().view([-2, 2], [-2, 2]).equal().add(plugins.ray(point(0, 0), point(1, 1)));
`;

test('cli: --help / --version / 알 수 없는 명령', () => {
  const help = cli(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /사용법/);
  assert.match(help.stdout, /logos render/);

  const v = cli(['--version']);
  assert.equal(v.status, 0);
  assert.match(v.stdout.trim(), /^\d+\.\d+\.\d+$/);

  const bad = cli(['nope']);
  assert.equal(bad.status, 2, '알 수 없는 명령 → 2');
  assert.match(bad.stderr, /알 수 없는 명령/);

  const badOpt = cli(['render', '--wat']);
  assert.equal(badOpt.status, 2);
  assert.match(badOpt.stderr, /알 수 없는 옵션/);
});

test('cli new: 스케치 폴더 뼈대 생성(패키지 의존성 포함)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'logos-new-'));
  try {
    const r = cli(['new', join(dir, 'sketches')]);
    assert.equal(r.status, 0, r.stderr);
    for (const f of ['sketch.js', 'package.json', '.gitignore', 'README.md']) {
      assert.ok(existsSync(join(dir, 'sketches', f)), `${f} 생성`);
    }
    const pkg = JSON.parse(readFileSync(join(dir, 'sketches', 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies.logos, 'logos 의존성');
    assert.equal(pkg.type, 'module');
    assert.match(readFileSync(join(dir, 'sketches', 'sketch.js'), 'utf8'), /from 'logos'/);
    // 두 번째 호출은 기존 파일을 덮어쓰지 않는다
    writeFileSync(join(dir, 'sketches', 'sketch.js'), '// 사용자 편집');
    const r2 = cli(['new', join(dir, 'sketches')]);
    assert.equal(r2.status, 0);
    assert.match(r2.stderr, /이미 있습니다/);
    assert.equal(readFileSync(join(dir, 'sketches', 'sketch.js'), 'utf8'), '// 사용자 편집');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli render: 원하는 디렉토리에 SVG + 갤러리 + manifest 를 만든다', () => {
  const dir = project({ 'one.js': SKETCH_ONE });
  const out = join(dir, 'build', 'figures');           // 프로젝트 안의 임의 깊이
  try {
    const r = cli(['render', 'sketches', '--out', out], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(out, 'one.svg')), 'SVG');
    assert.ok(existsSync(join(out, 'index.html')), '갤러리');
    assert.ok(existsSync(join(out, 'manifest.json')), 'manifest');
    const svg = readFileSync(join(out, 'one.svg'), 'utf8');
    assert.ok(svg.startsWith('<svg'), 'SVG 루트');
    assert.ok(!/NaN/.test(svg), 'NaN 없음');
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    assert.match(html, /<object data="one\.svg"/, '갤러리에 figure 임베드');
    const m = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
    assert.equal(m.ok, 1);
    assert.equal(m.fail, 0);
    assert.deepEqual(m.figures, [{ name: 'one', title: '한 장' }]);
    assert.deepEqual(m.formats, ['svg', 'png']);
    assert.equal(m.src, 'sketches');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli render: 한 파일 다장(figures 객체/배열) + --no-png + --json', () => {
  const dir = project({ 'a.js': SKETCH_MANY, 'b.js': SKETCH_ARRAY });
  const out = join(dir, 'out');
  try {
    const r = cli(['render', 'sketches', '--out', 'out', '--no-png', '--json'], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    const m = JSON.parse(r.stdout);
    assert.deepEqual(m.figures.map((f) => f.name), ['many-a', 'many-b', 'arr-first']);
    assert.equal(m.figures[2].title, '첫째', '배열 형식의 제목');
    assert.deepEqual(m.formats, ['svg'], '--no-png');
    assert.ok(existsSync(join(out, 'many-a.svg')) && existsSync(join(out, 'many-b.svg')));
    assert.ok(!existsSync(join(out, 'many-a.png')), 'PNG 미생성');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli render: 플러그인 subpath export(logos/plugins/*.js) 사용', () => {
  const dir = project({ 'plug.js': SKETCH_PLUGIN });
  try {
    const r = cli(['render', 'sketches', '--out', 'out', '--no-png'], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    const svg = readFileSync(join(dir, 'out', 'plug.svg'), 'utf8');
    assert.ok(svg.includes('<path'), 'ray 가 그려짐');
    assert.ok(!/NaN/.test(svg));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli: 오류 경로 — 없는 폴더 / 스케치 없음 / 그림 예외 → exit 2·1', () => {
  const dir = project({ 'bad.js': `throw new Error('스케치 폭발');` });
  try {
    const missing = cli(['render', 'sketches', '--out', 'out', '--src', 'nope'], { cwd: dir });
    assert.equal(missing.status, 2, '없는 소스 폴더 → 2');
    assert.match(missing.stderr, /없습니다/);

    const none = cli(['render', 'emptydir', '--out', 'out'], {
      cwd: dir, env: { ...process.env, X: '1' },
    });
    assert.equal(none.status, 2, '없는 폴더');
    // 빈 폴더는 "스케치를 찾지 못했습니다"
    mkdirSync(join(dir, 'emptydir'), { recursive: true });
    const empty = cli(['render', 'emptydir', '--out', 'out'], { cwd: dir });
    assert.equal(empty.status, 2);
    assert.match(empty.stderr, /스케치를 찾지 못했습니다/);

    // 파일이 예외를 던지면: 실패로 집계하고 exit 1 (다른 스케치는 계속)
    writeFileSync(join(dir, 'sketches', 'ok.js'), SKETCH_ONE);
    const r = cli(['render', 'sketches', '--out', 'out', '--no-png'], { cwd: dir });
    assert.equal(r.status, 1, '일부 실패 → 1');
    const m = JSON.parse(readFileSync(join(dir, 'out', 'manifest.json'), 'utf8'));
    assert.equal(m.fail, 1);
    assert.equal(m.ok, 1);
    assert.match(m.errors[0].error, /스케치 폭발/);
    assert.ok(existsSync(join(dir, 'out', 'ok.svg')), '정상 스케치는 렌더됨');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli render: --dry-run 은 렌더하지 않고, --clean 은 생성물만 지운다', () => {
  const dir = project({ 'one.js': SKETCH_ONE });
  const out = join(dir, 'out');
  try {
    const dry = cli(['render', 'sketches', '--out', 'out', '--dry-run'], { cwd: dir });
    assert.equal(dry.status, 0);
    assert.match(dry.stdout, /one/);
    assert.ok(!existsSync(out), 'dry-run 은 폴더를 만들지 않는다');

    cli(['render', 'sketches', '--out', 'out', '--no-png'], { cwd: dir });
    writeFileSync(join(out, '사용자메모.txt'), '지우면 안 됨');
    writeFileSync(join(out, 'old.svg'), '<svg/>');       // 이전 잔재(manifest 에 없음)
    const clean = cli(['render', 'sketches', '--out', 'out', '--no-png', '--clean'], { cwd: dir });
    assert.equal(clean.status, 0, clean.stderr);
    assert.ok(existsSync(join(out, '사용자메모.txt')), '사용자 파일은 보존');
    assert.ok(existsSync(join(out, 'one.svg')), '생성물 재생성');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cli: bash 워크플로우 스크립트가 리눅스에서 문법/도움말을 통과한다', { skip: process.platform !== 'linux' }, () => {
  for (const s of ['install.sh', 'render.sh', 'serve.sh', 'build-image.sh']) {
    const r = spawnSync('bash', [join(REPO, 'scripts', s), '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${s} --help`);
    assert.match(r.stdout, /사용법/, `${s} 도움말`);
  }
  const lib = spawnSync('bash', ['-n', join(REPO, 'scripts', 'lib', 'common.sh')], { encoding: 'utf8' });
  assert.equal(lib.status, 0, 'common.sh 문법');
});

