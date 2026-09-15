/**
 * 체이닝 메서드를 붙일 대상을 prototype 까지 해석한다.
 *  - 클래스 그대로 전달 가능 (예: `Point`)
 *  - 문자열: `'drawable'`(모든 도형) · `'scene'` · `define()` 으로 등록된 이름
 * @param {Function|string} target
 * @returns {{ proto?: Object, obj?: Object, key: string, ctor?: Function }}
 */
export function resolveTarget(target: Function | string): {
    proto?: any;
    obj?: any;
    key: string;
    ctor?: Function;
};
/** 코어가 자기 클래스를 플러그인 대상으로 공개한다 (core/drawable.js · core/scene.js) */
export function registerTarget(name: any, ctor: any): any;
/** 등록된 대상 이름들 */
export function targets(): string[];
/**
 * 반환값을 체이닝 가능한 값으로 정규화한다(헤더 규칙 ①②③).
 * `around` 래퍼 안에서 체이닝을 원할 때 직접 쓴다: `return api.chainable(this, patch)`.
 * @param {Object} self 인스턴스(this)
 * @param {*} out  플러그인 메서드의 반환값
 */
export function chainable(self: any, out: any): any;
/**
 * 백엔드 emitter 조회 — `backend/svg.js` · `backend/tikz.js` 가 호출한다.
 * @param {'svg'|'tikz'} backend
 * @param {string} kind IR kind
 * @returns {Function|null} `(n, ctx) => string|null`
 */
export function nodeEmitter(backend: "svg" | "tikz", kind: string): Function | null;
/** 등록된 IR kind 목록 */
export function nodeKinds(): string[];
/** 테마 토큰 조회 — core/scene.js 가 내장 THEMES 사전 다음에 호출한다 */
export function themeOf(name: any): any;
/** 등록된 플러그인 테마 이름들 */
export function themes(): string[];
/**
 * 훅 적용 — 값을 순서대로 넘겨 최종 값을 돌려준다(값을 반환하지 않은 훅은 무시).
 * @param {string} event 'ir' | 'svg' | 'tikz' | 'compile' | 사용자 정의
 * @param {*} value 첫 값
 * @param {Object} [ctx] 부가 정보
 */
export function apply(event: string, value: any, ctx?: any): any;
/** 부수효과용 훅(반환값 없음) */
export function emit(event: any, payload?: {}): void;
/** 네임스페이스 객체를 등록한다(`annotate`, `kit`, `point` …) */
export function registerNamespaceObject(name: any, obj: any): any;
/** 최상위 빌더 조회 (`logos.ray` 가 내부적으로 사용) */
export function lookupFactory(name: any): Function;
/** 등록된 빌더 이름들 */
export function factoryNames(): string[];
/** 이름으로 등록된 플러그인 메서드 조회 (`d.plugin('slope')`) */
export function lookupMethod(name: any): Function;
/**
 * 플러그인이 등록한 메서드를 이름으로 호출 — 코어 미수정 escape hatch.
 * `d.plugin('slope')` ≡ `d.slope()`
 */
export function callPlugin(instance: any, name: any, args?: any[]): any;
/** 미등록 이름 안내 — "어떻게 추가하는지"까지 알려준다 */
export function unknownFeature(name: any, hint?: string): PluginError;
/** 설치된 플러그인 이름들 */
export function list(): string[];
/** 설치 여부 */
export function has(name: any): boolean;
/** 설치된 플러그인 정보 */
export function info(name: any): {
    name: any;
    version: any;
    opts: any;
    methods: string[];
    factories: string[];
    nodes: string[];
    themes: string[];
    warnings: any;
};
/** 모든 플러그인/확장 상태를 요약(디버깅·문서용) */
export function help(): {
    plugins: string[];
    targets: string[];
    factories: string[];
    nodes: string[];
    themes: string[];
    hooks: string[];
    methods: string[];
};
/**
 * 설치를 되돌린다(설치 역순). 테스트 격리·핫리로드용.
 * @param {string} [name] 플러그인 이름. 없으면 **전부** 되돌린다.
 * @param {Object} [o] { keep: true → 플러그인을 목록에 남긴다 }
 */
export function uninstall(name?: string, { keep }?: any): boolean;
/** 전부 원상복구(테스트용) */
export function reset(): boolean;
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
export function use(plugin: Function | {
    name: string;
    version?: string;
    install: Function;
}, opts?: any): {
    name: string;
    version: string;
    warnings: string[];
};
/** 플러그인 등록 실패/미등록 이름 안내 전용 오류 */
export class PluginError extends Error {
    constructor(msg: any, hint: any);
    hint: any;
}
export function plugins(): void;
export namespace plugins {
    export { use };
    export { list };
    export { has };
    export { info };
    export { help };
    export { uninstall };
    export { reset };
    export { targets };
    export { nodeKinds };
    export { apply };
    export { emit };
    export { factoryNames };
    /** 즉석 등록(플러그인 파일 없이) — `plugins.define('ray', …)` */
    export function define(name: any, factory: any, o: any): any;
    export function extend(target: any, methods: any): string[];
    export function chain(target: any, methods: any): string[];
    export function node(kind: any, emitters: any): string;
    export function theme(name: any, tokens: any): any;
    function _static(target: any, name: any, fn: any): Function;
    export { _static as static };
}
declare namespace _default {
    export { use };
    export { plugins };
    export { PluginError };
    export { uninstall };
    export { reset };
    export { apply };
    export { emit };
    export { nodeEmitter };
    export { themeOf };
    export { registerTarget };
}
export default _default;
