// core/plugin.js — 체이너블 플러그인 아키텍처
//
// 왜 필요한가
//   사용자가 "있으면 좋겠다" 싶은 기능(예: `ray`·`arc`·새 마커·새 테마·새 백엔드 도형)이
//   코어에 없을 때, 지금까지는 `core/`·`shapes/`·`backend/` 를 직접 고쳐야 했다.
//   그러면 (a) 배포본을 못 쓰고 (b) 업스트림과 충돌하며 (c) 무엇을 바꿨는지 추적이 안 된다.
//   이 모듈은 그 3가지를 플러그인 등록으로 대체한다. **코어는 훅만 열고, 기능은 바깥에서 붙인다.**
//
// 무엇을 등록할 수 있나 (모두 `logos.use(plugin)` 하나로)
//   ① 체이닝 메서드   api.extend / api.chain  — `d.slope()` 처럼 Drawable·Scene 에 붙는다
//   ② 새 빌더         api.define             — `logos.ray`, `point.hex()` 같은 최상위/정적 이름
//   ③ IR 노드+emitter api.node               — 새 그림 종류를 SVG·TikZ 로 내보낸다(백엔드 무수정)
//   ④ 테마            api.theme              — `.theme('draft')` 토큰 세트
//   ⑤ 파이프라인 훅    api.hook               — 'ir' / 'svg' / 'tikz' / 'compile' 에서 후처리
//   ⑥ 기존 메서드 래핑 api.around             — 부족한 동작을 감싸서 보강
//   ⑦ 네임스페이스     api.static / api.ns    — `annotate.newThing`, `kit.newThing`, `point.hex`
//   ⑧ 되돌리기         plugins.uninstall/reset — 테스트·핫리로드에서 원상복구
//
// 체이닝을 깨지 않는 규칙 (핵심)
//   등록한 메서드가 ① 아무것도 반환하지 않으면 `this`(체인 유지),
//   ② 패치 객체를 반환하면 **자동으로 `this.set(patch)`**(불변 복제 → 체인),
//   ③ Drawable/Scene 을 반환하면 그대로 통과. 즉 `this.set` 을 몰라도 체이닝이 유지된다.
//
// 이 파일은 아무것도 import 하지 않는다(순환 import 0). 코어 쪽에서 registerTarget 으로
// 클래스를 공개하고, 백엔드는 nodeEmitter 로 emitter 를 조회한다.

/** 플러그인 등록 실패/미등록 이름 안내 전용 오류 */
export class PluginError extends Error {
  constructor(msg, hint) {
    super(msg);
    this.name = 'PluginError';
    if (hint) this.hint = hint;
  }
}

/** @type {Map<string, any>} 이름 → 클래스(또는 클래스 thunk) — 코어가 registerTarget 으로 채운다 */
const TARGETS = new Map();
/** @type {Map<string, Function>} 최상위 빌더 이름 → 팩토리 (`logos.ray`) */
const FACTORIES = new Map();
/** @type {Map<string, {obj:Object, entries:Map}>} 네임스페이스 이름 → 객체 (`annotate`, `kit`, `point`) */
const NAMESPACES = new Map();
/** @type {Map<string, Function>} 메서드 이름 → fn (escape hatch `d.plugin(name)` 용) */
const METHODS = new Map();
/** @type {Map<string, Object>} IR kind → 백엔드 emitter { svg, tikz, plugin } */
const NODES = new Map();
/** @type {Map<string, Object>} 테마 이름 → 토큰 */
const THEMES = new Map();
/** @type {Map<string, string>} 테마 이름 → 소유 플러그인 */
const THEME_OWNER = new Map();
/** @type {Map<string, Function[]>} 이벤트 → 훅 목록 */
const HOOKS = new Map();
/** @type {Array} 설치 기록(되돌리기용) */
const RECORDS = [];
/** @type {Map<string, Object>} 설치된 플러그인 이름 → 정보 */
const INSTALLED = new Map();

let SEQ = 0;

// ── 대상(target) 해석 ──────────────────────────────────────
/**
 * 체이닝 메서드를 붙일 대상을 prototype 까지 해석한다.
 *  - 클래스 그대로 전달 가능 (예: `Point`)
 *  - 문자열: `'drawable'`(모든 도형) · `'scene'` · `define()` 으로 등록된 이름
 * @param {Function|string} target
 * @returns {{ proto?: Object, obj?: Object, key: string, ctor?: Function }}
 */
export function resolveTarget(target) {
  if (typeof target === 'function') return { proto: target.prototype, key: target.name || 'anonymous', ctor: target };
  const t = TARGETS.get(target);
  const ctor = (typeof t === 'function' && t.prototype) ? t : (t && t.ctor);
  if (ctor && ctor.prototype) return { proto: ctor.prototype, key: target, ctor };
  if (NAMESPACES.has(target)) return { obj: NAMESPACES.get(target).obj, key: target };
  const f = FACTORIES.get(target);
  if (f && f.__ctor) return { proto: f.__ctor.prototype, key: target, ctor: f.__ctor };
  throw new PluginError(
    `plugin: 알 수 없는 대상 '${target}' 입니다.`,
    `사용 가능: 클래스 · 'drawable' · 'scene' · 등록된 빌더 이름 (등록된 대상: ${[...TARGETS.keys()].join(', ') || '없음'})`,
  );
}

/** 코어가 자기 클래스를 플러그인 대상으로 공개한다 (core/drawable.js · core/scene.js) */
export function registerTarget(name, ctor) {
  TARGETS.set(name, ctor);
  return ctor;
}

/** 등록된 대상 이름들 */
export function targets() { return [...TARGETS.keys()]; }

// ── ① 체이닝 메서드 ────────────────────────────────────────
/**
 * 반환값을 체이닝 가능한 값으로 정규화한다(헤더 규칙 ①②③).
 * `around` 래퍼 안에서 체이닝을 원할 때 직접 쓴다: `return api.chainable(this, patch)`.
 * @param {Object} self 인스턴스(this)
 * @param {*} out  플러그인 메서드의 반환값
 */
export function chainable(self, out) { return toChainable(self, out); }

function toChainable(self, out) {
  if (out === undefined || out === null) return self;                        // ① 체인 유지
  if (typeof out === 'object' && typeof out.set === 'function') return out;  // ③ Drawable/Scene
  if (typeof out === 'object') return self.set(out);                         // ② 패치 → 불변 복제
  return self;                                                              // 원시값(숫자 등) → 체인 유지
}

function installMethods(plugin, target, methods, { conf = false } = {}) {
  const rt = resolveTarget(target);
  const dest = rt.proto || rt.obj;
  if (!rt.proto) {
    throw new PluginError(`plugin(${plugin}): '${rt.key}' 는 네임스페이스라 체이닝 메서드를 붙일 수 없습니다.`,
      `네임스페이스에는 api.static('${rt.key}', 'name', fn) 을 쓰세요.`);
  }
  const names = [];
  for (const [name, fn] of Object.entries(methods)) {
    if (typeof fn !== 'function') continue;
    const had = Object.prototype.hasOwnProperty.call(dest, name);
    const prev = dest[name];
    // 선언형(chain): (conf, ...args) => patch — this.set 을 몰라도 체이닝 유지
    // 명령형(extend): 일반 메서드처럼 this 사용, 패치 객체를 돌려주면 자동 set
    const wrapped = conf
      ? function (...args) { return toChainable(this, fn.call(this, this._conf, ...args)); }
      : function (...args) { return toChainable(this, fn.apply(this, args)); };
    Object.defineProperty(wrapped, 'pluginOf', { value: plugin, enumerable: false });
    dest[name] = wrapped;
    METHODS.set(name, wrapped);
    RECORDS.push({ kind: 'method', dest, name, prev, had, plugin });
    names.push(name);
  }
  return names;
}

// ── ③ IR 노드 + 백엔드 emitter ──────────────────────────────
function registerNode(plugin, kind, emitters = {}) {
  if (!kind || typeof kind !== 'string') throw new PluginError(`plugin(${plugin}): node(kind, emitters) 의 kind 가 필요합니다.`);
  const prev = NODES.get(kind);
  NODES.set(kind, { svg: emitters.svg, tikz: emitters.tikz, plugin });
  if (prev) warn(plugin, `node('${kind}') 가 기존 등록을 덮어썼습니다.`);
  else RECORDS.push({ kind: 'node', kindName: kind, plugin });
  return kind;
}

/**
 * 백엔드 emitter 조회 — `backend/svg.js` · `backend/tikz.js` 가 호출한다.
 * @param {'svg'|'tikz'} backend
 * @param {string} kind IR kind
 * @returns {Function|null} `(n, ctx) => string|null`
 */
export function nodeEmitter(backend, kind) {
  const e = NODES.get(kind);
  const fn = e && e[backend];
  return typeof fn === 'function' ? fn : null;
}

/** 등록된 IR kind 목록 */
export function nodeKinds() { return [...NODES.keys()]; }

// ── ④ 테마 ────────────────────────────────────────────────
function registerTheme(plugin, name, tokens) {
  if (THEMES.has(name)) throw new PluginError(`plugin(${plugin}): 테마 '${name}' 는 이미 있습니다.`);
  THEMES.set(name, { ...tokens });
  THEME_OWNER.set(name, plugin);
  RECORDS.push({ kind: 'theme', name, plugin });
  return name;
}

/** 테마 토큰 조회 — core/scene.js 가 내장 THEMES 사전 다음에 호출한다 */
export function themeOf(name) { return THEMES.get(name) || null; }
/** 등록된 플러그인 테마 이름들 */
export function themes() { return [...THEMES.keys()]; }



// ── ⑤ 파이프라인 훅 ────────────────────────────────────────
function registerHook(plugin, event, fn) {
  if (typeof fn !== 'function') throw new PluginError(`plugin(${plugin}): hook('${event}', fn) 의 fn 이 함수여야 합니다.`);
  if (!HOOKS.has(event)) HOOKS.set(event, []);
  HOOKS.get(event).push(fn);
  RECORDS.push({ kind: 'hook', event, fn, plugin });
  return event;
}

/**
 * 훅 적용 — 값을 순서대로 넘겨 최종 값을 돌려준다(값을 반환하지 않은 훅은 무시).
 * @param {string} event 'ir' | 'svg' | 'tikz' | 'compile' | 사용자 정의
 * @param {*} value 첫 값
 * @param {Object} [ctx] 부가 정보
 */
export function apply(event, value, ctx = {}) {
  const list = HOOKS.get(event);
  if (!list || !list.length) return value;
  let v = value;
  for (const fn of list) {
    const out = fn(v, ctx);
    if (out !== undefined) v = out;
  }
  return v;
}

/** 부수효과용 훅(반환값 없음) */
export function emit(event, payload = {}) {
  const list = HOOKS.get(event);
  if (!list) return;
  for (const fn of list) fn(undefined, payload);
}

// ── ⑥ 기존 메서드 래핑 ─────────────────────────────────────
/**
 * 기존 메서드를 감싼다 — **반환값은 그대로 통과**한다(체이닝 규칙을 강제하지 않는다).
 * `eval`·`length`·`bounds` 처럼 데이터를 돌려주는 메서드를 감쌀 때 값이 훼손되면 안 되므로,
 * 래퍼가 체이닝을 원하면 `this.set(...)` 또는 `api.chainable(this, patch)` 를 쓴다.
 */
function installAround(plugin, target, method, wrapper) {
  const rt = resolveTarget(target);
  const dest = rt.proto || rt.obj;
  const prev = dest && dest[method];
  if (typeof prev !== 'function') throw new PluginError(`plugin(${plugin}): ${rt.key}.${method} 는 함수가 아닙니다.`);
  dest[method] = function (...args) { return wrapper.call(this, prev.bind(this), ...args); };
  RECORDS.push({ kind: 'method', dest, name: method, prev, had: true, plugin });
}

// ── ⑦ 새 빌더 / 네임스페이스 정적 ──────────────────────────
function defineFactory(plugin, name, factory, opts = {}) {
  if (typeof factory !== 'function') throw new PluginError(`plugin(${plugin}): define('${name}', factory) 의 factory 가 함수여야 합니다.`);
  const exists = FACTORIES.get(name);
  if (exists && exists.__plugin !== plugin) throw new PluginError(`plugin(${plugin}): 최상위 이름 '${name}' 는 이미 등록되어 있습니다.`);
  if (opts.ctor) factory.__ctor = opts.ctor;
  factory.__plugin = plugin;
  FACTORIES.set(name, factory);
  for (const a of opts.aliases || []) FACTORIES.set(a, factory);
  RECORDS.push({ kind: 'factory', name, aliases: opts.aliases || [], plugin });
  return factory;
}

/** 네임스페이스 객체를 등록한다(`annotate`, `kit`, `point` …) */
export function registerNamespaceObject(name, obj) {
  if (!NAMESPACES.has(name)) {
    NAMESPACES.set(name, { obj });
    // 코어가 import 시점에 공개하는 네임스페이스('annotate'·'kit'·'point' …)는
    // reset() 으로 지워지면 안 되므로 기록하지 않는다(영구 등록).
  }
  return NAMESPACES.get(name).obj;
}

/**
 * 팩토리/네임스페이스에 정적을 붙인다 — `point.hex(x, y)`, `annotate.newThing(P)`.
 * @param {string} plugin
 * @param {string|Object} target 네임스페이스 이름 또는 객체
 * @param {string} name
 * @param {Function} fn
 */
function installStatic(plugin, target, name, fn) {
  const obj = (target && typeof target === 'object')
    ? registerNamespaceObject(target.__nsName || `ns${++SEQ}`, target)
    : resolveNamespace(target);
  const had = Object.prototype.hasOwnProperty.call(obj, name);
  const prev = obj[name];
  obj[name] = fn;
  RECORDS.push({ kind: 'static', ns: obj, name, prev, had, plugin });
  return fn;
}

/** 팩토리 함수 자체를 네임스페이스로 취급(팩토리에 정적을 붙이는 게 자연스러운 경우) */
function resolveNamespace(target) {
  if (NAMESPACES.has(target)) return NAMESPACES.get(target).obj;
  const f = FACTORIES.get(target);
  if (f) {
    registerNamespaceObject(target, f);
    return f;
  }
  throw new PluginError(`plugin: static('${target}', …) 의 대상 '${target}' 을 찾을 수 없습니다.`,
    `팩토리 이름 · 네임스페이스 이름 · 객체 중 하나를 넘기세요. (팩토리: ${[...FACTORIES.keys()].join(', ') || '없음'})`);
}

// ── ⑧ 조회 / 되돌리기 ─────────────────────────────────────
/** 최상위 빌더 조회 (`logos.ray` 가 내부적으로 사용) */
export function lookupFactory(name) { return FACTORIES.get(name) || null; }
/** 등록된 빌더 이름들 */
export function factoryNames() { return [...new Set([...FACTORIES.keys()])]; }
/** 이름으로 등록된 플러그인 메서드 조회 (`d.plugin('slope')`) */
export function lookupMethod(name) { return METHODS.get(name) || null; }

/**
 * 플러그인이 등록한 메서드를 이름으로 호출 — 코어 미수정 escape hatch.
 * `d.plugin('slope')` ≡ `d.slope()`
 */
export function callPlugin(instance, name, args = []) {
  const fn = METHODS.get(name);
  if (fn) return fn.apply(instance, args);
  const f = FACTORIES.get(name);
  if (f) return f.call(instance, instance, ...args);
  throw unknownFeature(name);
}

/** 미등록 이름 안내 — "어떻게 추가하는지"까지 알려준다 */
export function unknownFeature(name, hint = '') {
  const e = new PluginError(
    `logos: '${name}' 은 코어에 없습니다.${hint ? ` (${hint})` : ''}`,
    `코어를 고치지 말고 플러그인으로 추가하세요:\n` +
    `  import { use } from '@jaywoo0830a/logos';\n` +
    `  use({ name: 'my-extras', install(api) {\n` +
    `    api.define('${name}', (...args) => new MyShape(...args), { ctor: MyShape });\n` +
    `    api.node('mynode', { svg: (n, ctx) => '<path .../>' });\n` +
    `  } });\n` +
    `  등록된 이름: ${factoryNames().join(', ') || '없음'}`,
  );
  return e;
}

/** 설치된 플러그인 이름들 */
export function list() { return [...INSTALLED.keys()]; }
/** 설치 여부 */
export function has(name) { return INSTALLED.has(name); }

/** 설치된 플러그인 정보 */
export function info(name) {
  const p = INSTALLED.get(name);
  if (!p) return null;
  return {
    name: p.name, version: p.version, opts: p.opts,
    methods: [...METHODS.entries()].filter(([, fn]) => fn.pluginOf === name).map(([k]) => k),
    factories: factoryNames().filter((k) => FACTORIES.get(k).__plugin === name),
    nodes: nodeKinds().filter((k) => NODES.get(k).plugin === name),
    themes: themes().filter((t) => THEME_OWNER.get(t) === name),
    warnings: p.warnings,
  };
}

/** 모든 플러그인/확장 상태를 요약(디버깅·문서용) */
export function help() {
  return {
    plugins: list(),
    targets: targets(),
    factories: factoryNames(),
    nodes: nodeKinds(),
    themes: themes(),
    hooks: [...HOOKS.entries()].map(([k, v]) => `${k}(${v.length})`),
    methods: [...METHODS.keys()],
  };
}

function warn(plugin, msg) {
  const p = INSTALLED.get(plugin);
  if (p) p.warnings.push(msg); else console.warn(`[logos plugin:${plugin}] ${msg}`);
}

/**
 * 설치를 되돌린다(설치 역순). 테스트 격리·핫리로드용.
 * @param {string} [name] 플러그인 이름. 없으면 **전부** 되돌린다.
 * @param {Object} [o] { keep: true → 플러그인을 목록에 남긴다 }
 */
export function uninstall(name, { keep = false } = {}) {
  const matches = (r) => r && (!name || r.plugin === name);
  for (let i = RECORDS.length - 1; i >= 0; i--) {
    const r = RECORDS[i];
    if (!matches(r)) continue;
    if (r.kind === 'method') { if (r.had) r.dest[r.name] = r.prev; else delete r.dest[r.name]; }
    else if (r.kind === 'static') { if (r.had) r.ns[r.name] = r.prev; else delete r.ns[r.name]; }
    else if (r.kind === 'factory') { for (const k of [r.name, ...(r.aliases || [])]) FACTORIES.delete(k); }
    else if (r.kind === 'node') NODES.delete(r.kindName);
    else if (r.kind === 'theme') THEMES.delete(r.name);
    else if (r.kind === 'hook') { const l = HOOKS.get(r.event); const j = l ? l.indexOf(r.fn) : -1; if (j >= 0) l.splice(j, 1); }
    else if (r.kind === 'namespace') NAMESPACES.delete(r.name);
    RECORDS.splice(i, 1);
    if (r.kind === 'method') METHODS.delete(r.name);
  }
  if (name && !keep) INSTALLED.delete(name);
  return true;
}

/** 전부 원상복구(테스트용) */
export function reset() {
  uninstall();
  INSTALLED.clear();
  return true;
}



// ── 설치(use) ──────────────────────────────────────────────
/**
 * 플러그인 설치 — 이 한 줄이 "코어 수정"을 대체한다.
 *
 * @param {Function|{name:string, version?:string, install:Function}} plugin
 *   `install(api, opts)` 를 가진 객체, 또는 install 함수 자체.
 * @param {Object} [opts] 플러그인에 전달할 옵션(두 번째 인자)
 * @returns {{name:string, version:string, warnings:string[]}} 설치 정보
 * @example
 *   use({ name: 'slope', install(api) {
 *     api.chain('drawable', { slope: (c, m) => ({ slopeM: m }) });
 *   }});
 *   point(0, 0).slope(2).color('red');   // 체이닝 유지
 */
export function use(plugin, opts = {}) {
  if (!plugin) throw new PluginError('plugin.use(plugin): 플러그인이 필요합니다.');
  const isFn = typeof plugin === 'function';
  const install = isFn ? plugin : plugin.install;
  const name = (isFn ? plugin.__name : plugin.name) || `plugin${++SEQ}`;
  if (typeof install !== 'function') {
    throw new PluginError(`plugin.use(${name}): install(api, opts) 함수가 없습니다.`,
      `형식: { name: '...', install(api, opts) { ... } } 또는 (api) => { ... }`);
  }
  if (INSTALLED.has(name)) return INSTALLED.get(name);   // 멱등
  const entry = { name, version: (isFn ? plugin.__version : plugin.version) || '0.0.0', opts, warnings: [] };
  INSTALLED.set(name, entry);
  try {
    install(makeApi(name, opts), opts);
  } catch (e) {
    uninstall(name);                                     // 부분 설치 롤백
    throw e;
  }
  return entry;
}

/** 플러그인에 주어지는 등록 API */
function makeApi(plugin, opts) {
  return {
    name: plugin,
    opts,
    /** 명령형 체이닝 메서드 — `this` 사용, 패치 객체 반환 시 자동 set */
    extend: (target, methods) => installMethods(plugin, target, methods, { conf: false }),
    /** 선언형 체이닝 메서드 — `(conf, ...args) => patch` */
    chain: (target, methods) => installMethods(plugin, target, methods, { conf: true }),
    /** 새 빌더 등록 — `logos.<name>` / `plugins.<name>` 으로 즉시 사용 가능 */
    define: (name, factory, o) => defineFactory(plugin, name, factory, o),
    /** 팩토리·네임스페이스 정적 — `point.hex`, `annotate.newThing`, `kit.newThing` */
    static: (target, name, fn) => installStatic(plugin, target, name, fn),
    /** 네임스페이스 객체를 등록(만든 객체를 그대로 돌려준다) */
    ns: (name, obj = {}) => registerNamespaceObject(name, obj),
    /** 새 IR 노드 + 백엔드 emitter — 백엔드 수정 없이 새 그림 종류 추가 */
    node: (kind, emitters) => registerNode(plugin, kind, emitters),
    /** 테마 토큰 등록 — `.theme('draft')` */
    theme: (name, tokens) => registerTheme(plugin, name, tokens),
    /** 파이프라인 훅 — 'ir' | 'svg' | 'tikz' | 'compile' | 사용자 정의 */
    hook: (event, fn) => registerHook(plugin, event, fn),
    /** 기존 메서드 보강 — `(orig, ...args) => ...` (반환값 그대로 통과; 체이닝은 `this.set`) */
    around: (target, method, wrapper) => installAround(plugin, target, method, wrapper),
    /** around 래퍼 안에서 체이닝을 원할 때: `return api.chainable(this, patch)` */
    chainable,
    lookupFactory,
    lookupMethod,
    targets,
  };
}

// ── plugins 네임스페이스 ───────────────────────────────────
const PLUGIN_NS = function plugins() {};
PLUGIN_NS.use = use;
PLUGIN_NS.list = list;
PLUGIN_NS.has = has;
PLUGIN_NS.info = info;
PLUGIN_NS.help = help;
PLUGIN_NS.uninstall = uninstall;
PLUGIN_NS.reset = reset;
PLUGIN_NS.targets = targets;
PLUGIN_NS.nodeKinds = nodeKinds;
PLUGIN_NS.apply = apply;
PLUGIN_NS.emit = emit;
PLUGIN_NS.factoryNames = factoryNames;
/** 즉석 등록(플러그인 파일 없이) — `plugins.define('ray', …)` */
PLUGIN_NS.define = (name, factory, o) => defineFactory('inline', name, factory, o);
PLUGIN_NS.extend = (target, methods) => installMethods('inline', target, methods, { conf: false });
PLUGIN_NS.chain = (target, methods) => installMethods('inline', target, methods, { conf: true });
PLUGIN_NS.node = (kind, emitters) => registerNode('inline', kind, emitters);
PLUGIN_NS.theme = (name, tokens) => registerTheme('inline', name, tokens);
PLUGIN_NS.static = (target, name, fn) => installStatic('inline', target, name, fn);

/**
 * `plugins.<name>` 으로 등록된 빌더를 부를 수 있게 하는 Proxy.
 * (`import { plugins } from '@jaywoo0830a/logos'; plugins.ray(O, P)` — 코어 export 목록 수정 불필요)
 */
export const plugins = new Proxy(PLUGIN_NS, {
  get(t, k) {
    if (k in t) return t[k];
    const f = FACTORIES.get(k);
    return f || undefined;
  },
  has(t, k) { return (k in t) || FACTORIES.has(k); },
  ownKeys(t) { return [...new Set([...Reflect.ownKeys(t), ...FACTORIES.keys()])]; },
  getOwnPropertyDescriptor(t, k) {
    if (k in t) return Reflect.getOwnPropertyDescriptor(t, k);
    if (FACTORIES.has(k)) return { configurable: true, enumerable: true, value: FACTORIES.get(k) };
    return undefined;
  },
});

export default { use, plugins, PluginError, uninstall, reset, apply, emit, nodeEmitter, themeOf, registerTarget };
