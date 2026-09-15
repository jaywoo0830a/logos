/**
 * 런타임 안내 — 결과 문자열을 돌려주고(테스트·리다이렉트용), 기본으로 콘솔에도 인쇄한다.
 * @param {string} [topic] '' 이면 개요, 아니면 이름 조회(빌더·모듈·네임스페이스·scene)
 * @param {{ print?: boolean }} [o] print: false 면 문자열만 반환
 * @returns {string}
 */
export function help(topic?: string, { print }?: {
    print?: boolean;
}): string;
/** 프로그래밍 조회 — 등록된 확장 상태를 객체로 (core/plugin.js help() 위임) */
export function api(): {
    plugins: string[];
    targets: string[];
    factories: string[];
    nodes: string[];
    themes: string[];
    hooks: string[];
    methods: string[];
};
export default help;
