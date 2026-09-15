// core/help.js — 런타임 셀프 문서화
//
// 왜 필요한가
//   공개 API 가 이미 있는데도 사용자가 "없는 줄 알고" 스스로 플러그인·헬퍼를 정의하는 일이 많다.
//   문서(docs/)는 찾아 읽어야 보이지만, `help()` 는 **코드 옆에서 즉시 답을 준다** —
//   문서를 찾지 않는 사용자야말로 재발명의 주 독자다.
//
// 사용법
//   import { help, api } from '@jaywoo0830a/logos';
//   help()              → 개요: 빠른 시작 · 모듈 지도 · 지금 설치된 확장 · 재발명 대조표
//   help('circle')      → 이름별 조회: 정적 메서드 · 체이닝 · 확장 지점
//   help('kit')         → 모듈별 조회: 멤버 목록
//   help('없는이름')     → 근접 추천("혹시 …?") + 등록 안내
//   api()               → 같은 내용을 객체로 (프로그래밍 조회 — core/plugin.js help())
//
// 이 파일은 core/plugin.js 만 import 한다(순환 import 0). 나열되는 멤버는 레지스트리에서
// 동적으로 뽑는다 — 새 빌더·정적을 등록하면 help 가 따라서 정확해진다.

import {
  factoryNames,
  targets,
  nodeKinds,
  themes,
  list as installedPlugins,
  info,
  namespaceNames,
  namespaceOf,
  help as registrySnapshot,
} from './plugin.js';

// ── 정적 지식 테이블 (코어 공개면 = index.js export 목록의 요약) ──────────

/** 도형·수치 빌더 한 줄 설명 — help('<이름>') 의 첫 줄 */
const BUILDERS = {
  point: '점 (2D/3D) — .dot() .label() · point.byDeg(r, deg)',
  vector: '벡터 화살표 — vector.gradient/div/curl 도 있음',
  line: '직선 — line.through(A,B) · line.polar · line.commonTangent',
  segment: '선분 — segment(A, B)',
  curve: '곡선 — curve.of(f) · curve.piecewise · curve.ode · curve.taylor',
  circle: '원 — circle.center(O).radius(2) · circle.through(A,B,C)',
  ellipse: '타원 — ellipse.semiMajor · ellipse.foci · ellipse.directrix',
  parabola: '포물선 — parabola.vertex().focus() · parabola.polynomial()',
  hyperbola: '쌍곡선 — hyperbola.foci().distance()',
  polygon: '다각형 — polygon(...pts) · regular(n) · regular.star',
  rectangle: '직사각형',
  region: '영역 채우기 — region.between · region.inequality · region.union',
  vectorField: '벡터장 (2D)',
  sphere: '구 — sphere.through(A,B,C,D) · sphere.unit',
  plane: '평면 — plane.through/pointNormal/standard/offset',
  cylinder: '원기둥',
  cone: '원뿔',
  surface: '곡면 — surface.of/ruled/implicit (marching tetrahedra)',
  polyhedron: '다면체 — polyhedron.vertices(...pts).faces([...])',
  curve3: '3D 곡선 — curve3.through(pts) · curve3.intersect',
  arrow3: '3D 화살표',
  surfaceParam: '매개곡면 (u,v) → (x,y,z)',
  axes3: '3D 축 — axes3({ length, labels }) 를 .add(...axes3()) 로 펼친다',
  quadrics: '2차 곡면',
  circle3: '3D 원',
  frame3: '3D 좌표 프레임',
  ray: '반직선 — ray(A,B) · ray.from(A).through(B) · ray.deg(O, deg)',
  arc: '원호 — arc.ofCircle(c, r, a0, a1) · arc.circular · arc.through',
  sector: '부채꼴 — sector.ofCircle(c).angle(θ)',
  torus: '토러스 — torus.center(O).radii(R, r)',
  cube: '정육면체 — cube.center(O).edge(e)',
  prism: '각기둥 — prism.base(polygon).height(h)',
  pyramid: '각뿔 — pyramid.base(polygon).apex(P)',
  mat: '행렬 — mat([[…]]) (linalg.js 에서도)',
  vec: '벡터(수치) — vec([x, y])',
  cplx: '복소수 — cplx(re, im) (complex.js 에서도)',
  tex: '수식 → 문자열 — tex.substitute · (symbolic/tex.js 에서도)',
  Sym: '심볼릭 수식 — Sym.of("x^2").diff() · .integrate({from, to})',
};

/** Drawable/Scene 공통 체이닝 — 이름별 조회 하단에 붙인다 */
const CHAIN_DRAWABLE = '.color .stroke .fill .dash .opacity .z .label .font .bold .as';
const CHAIN_SCENE = '.size .view .dim .camera .equal .axes .grid .title .theme .add .compile → .toSVG/.toTikZ/.toPNG';

/** subpath 모듈 — help('<이름>') / 개요의 모듈 지도 */
const MODULES = {
  kit: {
    what: '작성 키트 — 팔레트 · 플롯 프리셋 · subplot 합성 · 저장/갤러리 (렌더링 규칙 없는 얇은 래퍼)',
    path: './kit.js',
  },
  linalg: { what: '행렬·벡터 수치 — mat · vec · Matrix', path: './linalg.js', members: ['mat', 'vec', 'Matrix'] },
  complex: { what: '복소수 — cplx · Complex', path: './complex.js', members: ['cplx', 'Complex'] },
  annotate: { what: '주석 — brace · angle · dimension · legend · limit · shade', path: './annotate.js' },
  transform: { what: '기하 변환 — 회전·반사·이동 등을 도형에 apply', path: './transform.js' },
  sprite: { what: '범용 벡터/직렬화 유틸 — vec · clamp · toPlain', path: './sprite.js' },
  server: { what: '렌더 갤러리 정적 서버 — node server.js [dir]', path: './server.js' },
  sym: {
    what: '심볼릭 수식( compute-engine ) — Sym.of · .diff · .integrate · .simplify',
    path: './symbolic/sym.js',
    members: ['Sym'],
  },
  adapter: {
    what: '외부엔진 어댑터 — SymPyAdapter · SageAdapter · createSymbolicAdapter (docs/extend/ADAPT.md)',
    path: './symbolic/adapter.js',
  },
  backend: { what: '백엔드 파이프라인 — svg · tikz · asymptote · jsxgraph · katex · scene-ir', path: './backend/*.js' },
  'geometry-extras': {
    what: '동봉 플러그인 — use(geometryExtras) 한 번: ray·arc 확장 · hatch IR 노드 · tilt/dashed/arrowTip 체이닝 · point.byDeg · chalk 테마 · 워터마크 훅',
    path: './plugins/geometry-extras.js',
  },
  plugin: {
    what: '확장 API — import { plugin } … · api.define/chain/extend/node/theme/hook/static/around (docs/extend/PLUGIN.md)',
    path: './core/plugin.js',
  },
};

/** "직접 만들기 전에" 재발명 대조표 — 개요에 붙는다 */
const RECIPES = [
  ['색 팔레트를 직접 정의', 'kit.palette — palette.blue · palette.tab.red · 한 글자 코드 r/b/k'],
  ['두 점을 잇는 선/선분 헬퍼', 'line.through(A, B) · segment(A, B) · kit.seg(A, B, { dash })'],
  ['subplot/갤러리 합치기', 'kit.subplots([figs], { cols }) · kit.saveFigures([[이름, fn]], { dir, index: true })'],
  ['축·그리드가 켜진 기본 씬', 'kit.plot2d([-3, 3], [-2, 2], { equal: true }) · kit.plot3d({ elev, azim })'],
  ['기본 플롯 축 프레임(3D)', '.add(...axes3({ length, labels }))'],
  ['수식 라벨/치수/각표시', 'annotate.brace · annotate.angle · annotate.dimension · tex(...)'],
  ['행렬·벡터 연산', 'mat([[…]]).det().inv().T() · vec([x, y]) (linalg.js)'],
  ['심볼릭 미적분', 'Sym.of("x^2").diff().integrate({ from: 0, to: 1 })'],
  ['없는 그림 종류/이름', "use({ name: 'my-extras', install(api) { api.define('이름', fn); } }) — 코어 수정 금지"],
];

/** 사용자가 볼 안내 대상 전체 — 근접 추천 후보 */
const CANDIDATES = () => [
  ...Object.keys(BUILDERS),
  ...Object.keys(MODULES),
  ...['scene', 'Scene', 'Drawable', 'use', 'plugins', 'help', 'api'],
  ...factoryNames(),
  ...namespaceNames(),
];

/** 편집거리(Levenshtein) — 소문자 비교 */
function lev(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length,
    n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// ── 렌더러 ─────────────────────────────────────────────────

/** 개요 — 무토픽 help() */
function renderOverview() {
  const installed = installedPlugins();
  const reg = registrySnapshot();
  const L = [];
  L.push('logos — 수학 그림 DSL (SVG · PNG · TikZ · Asymptote · JSXGraph)');
  L.push('');
  L.push('빠른 시작');
  L.push("  import { scene, point, circle, kit } from '@jaywoo0830a/logos';");
  L.push('  kit.plot2d([-3, 3], [-2, 2], { equal: true })');
  L.push("    .add(circle.center(point(0, 0)).radius(2), point(2, 0).dot().label('P'))");
  L.push('    .compile().toSVG();            // await …toPNG() — resvg 설치 시 PNG 도');
  L.push('');
  L.push('도형·수치 (최상위 import)');
  const names = (ks) => ks.join(' ');
  L.push(
    '  2D  : ' +
      names([
        'point',
        'vector',
        'line',
        'segment',
        'curve',
        'circle',
        'ellipse',
        'parabola',
        'hyperbola',
        'polygon',
        'rectangle',
        'region',
        'vectorField',
      ]),
  );
  L.push(
    '  3D  : ' +
      names([
        'sphere',
        'plane',
        'cylinder',
        'cone',
        'surface',
        'polyhedron',
        'curve3',
        'arrow3',
        'surfaceParam',
        'axes3',
        'quadrics',
        'circle3',
        'frame3',
      ]),
  );
  L.push('  확장: ' + names(['ray', 'arc', 'sector', 'torus', 'cube', 'prism', 'pyramid']));
  L.push(
    '  수치: ' +
      names([
        'mat',
        'vec',
        'Matrix',
        'cplx',
        'Complex',
        'transform',
        'annotate',
        'tex',
        'Sym',
        'tau',
        'pi',
        'e',
        'xy',
        'range',
        'view',
      ]),
  );
  L.push('  키트: kit · 확장: use · plugins · plugin · help · api');
  L.push('');
  L.push("subpath 모듈 — help('kit') · help('annotate') 처럼 개별 조회");
  for (const [k, m] of Object.entries(MODULES)) L.push(`  ${m.path.padEnd(32)} ${k} — ${m.what.split(' — ')[0]}`);
  L.push('');
  L.push('지금 설치된 확장');
  L.push(`  플러그인: ${installed.length ? installed.join(', ') : '(없음 — use(플러그인) 으로 설치)'}`);
  L.push(
    `  빌더 ${reg.factories.length} · 테마 ${reg.themes.length} · IR 노드 ${reg.nodes.length} · 훅 ${reg.hooks.length} · 체이닝 메서드 ${reg.methods.length}`,
  );
  L.push('');
  L.push("직접 만들기 전에 — 이미 있는 기능이 많습니다 (help('이름') 으로 확인)");
  for (const [want, have] of RECIPES) L.push(`  ${want.padEnd(22)} → ${have}`);
  L.push('');
  L.push('없는 이름이라면 — 코어 수정 대신 플러그인: use({ name, install(api) { api.define(이름, fn); } })');
  L.push('  → docs/extend/PLUGIN.md · 프로그래밍 조회: api()');
  L.push('');
  L.push("더 보기: help('circle') · help('kit') · help('scene') · help('plugin') · help('geometry-extras')");
  return L.join('\n');
}

/** 빌더/네임스페이스 — help('circle'), help('annotate') */
function renderName(name) {
  const L = [];
  const owner = info(name);
  const ns = namespaceOf(name);
  const desc = BUILDERS[name];
  L.push(`${name} — ${desc ? desc : owner ? `플러그인 '${owner.name}' 이(가) 등록한 빌더` : '네임스페이스'}`);
  if (owner && owner.version)
    L.push(`  제공: 플러그인 '${owner.name}' v${owner.version} — plugins.info('${owner.name}')`);
  L.push(`  import { ${name} } from '@jaywoo0830a/logos';`);
  const statics = ns ? Object.keys(ns).filter((k) => k !== 'default') : (MODULES[name]?.members ?? null);
  if (statics && statics.length) L.push(`  정적/멤버: ${name}.${statics.join(` · ${name}.`)}`);
  if (desc || BUILDERS[name] !== undefined || ns) {
    L.push(`  체이닝(Drawable 공통): ${CHAIN_DRAWABLE}`);
    L.push(`  확장: api.extend('${name}', { … }) · api.static('${name}', '이름', fn) — plugins.reset() 으로 원복`);
  } else if (MODULES[name]) {
    L.push(`  더 보기: docs/guides/KIT.md`);
  }
  return L.join('\n');
}

/** 모듈 — help('kit'), help('linalg'), help('geometry-extras') */
function renderModule(name) {
  const m = MODULES[name];
  const L = [];
  L.push(`${m.path} — ${name}`);
  L.push(`  ${m.what}`);
  const ns = namespaceOf(name);
  const members = m.members ?? (ns ? Object.keys(ns).filter((k) => k !== 'default') : null);
  if (members && members.length) L.push(`  멤버: ${members.join(' · ')}`);
  if (name === 'plugin') {
    L.push(
      '  확장 지점 8가지: api.define · api.chain · api.extend · api.node · api.theme · api.hook · api.static/ns · api.around',
    );
    L.push("  즉석 등록: plugins.define('이름', fn) · 되돌리기: plugins.uninstall(name) / plugins.reset()");
  }
  if (name === 'geometry-extras')
    L.push("  설치: import geometryExtras from '@jaywoo0830a/logos/plugins/geometry-extras.js'; use(geometryExtras);");
  return L.join('\n');
}

/** scene — 도형과 렌더 파이프라인 */
function renderScene() {
  return [
    'scene — 씬 (빌더 → 컴파일 → 렌더)',
    "  import { scene } from '@jaywoo0830a/logos';",
    `  체이닝: ${CHAIN_SCENE}`,
    '  렌더: .toSVG() 문자열 · .toTikZ() · await .toPNG() — kit.saveFigures 로 파일+갤러리 저장',
    "  확장: api.extend('scene', { … }) · api.hook('svg', fn) 으로 파이프라인 후처리",
  ].join('\n');
}

/** 모르는 이름 — 근접 추천 (D안의 "Did you mean?" 와 같은 힘) */
function renderUnknown(topic) {
  const L = [];
  L.push(`'${topic}' 은(는) 등록된 이름이 아닙니다.`);
  const cand = [...new Set(CANDIDATES())]
    .map((c) => [c, lev(topic, c)])
    .filter(([, d]) => d <= Math.max(2, topic.length >> 1))
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  if (cand.length) L.push(`혹시: ${cand.map(([c]) => `${c} — help('${c}')`).join('  ·  ')}`);
  L.push(`등록된 이름 전체: help()  (프로그래밍 조회: api())`);
  L.push(
    "정말 없는 기능이면 플러그인으로: use({ name: 'my-extras', install(api) { api.define('" + topic + "', fn); } })",
  );
  return L.join('\n');
}

/**
 * 런타임 안내 — 결과 문자열을 돌려주고(테스트·리다이렉트용), 기본으로 콘솔에도 인쇄한다.
 * @param {string} [topic] '' 이면 개요, 아니면 이름 조회(빌더·모듈·네임스페이스·scene)
 * @param {{ print?: boolean }} [o] print: false 면 문자열만 반환
 * @returns {string}
 */
export function help(topic = '', { print = true } = {}) {
  if (topic && typeof topic === 'object') (({ print = true } = topic), (topic = ''));
  const t = String(topic).trim();
  let out;
  if (!t) out = renderOverview();
  else if (t === 'scene') out = renderScene();
  else if (MODULES[t]) out = renderModule(t);
  else if (BUILDERS[t] || namespaceOf(t) || info(t)) out = renderName(t);
  else out = renderUnknown(t);
  if (print) console.log(out);
  return out;
}

/** 프로그래밍 조회 — 등록된 확장 상태를 객체로 (core/plugin.js help() 위임) */
export function api() {
  return registrySnapshot();
}

export default help;
