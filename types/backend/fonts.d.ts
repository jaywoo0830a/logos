/** SVG 자기완결용 폰트 스타일 — @import + 텍스트/MathML 전역 적용 + 행간·자간 기본값. */
export function svgFontStyle(): string;
/** resvg 래스터용 로컬 폰트 파일(있으면). */
export function stixFontFile(): any;
/** resvg 옵션의 font 구성 — STIX(수식) + 시스템 폰트(폴백: 한글 등). */
export function resvgFontOptions(): {
    font: {
        defaultFontFamily: string;
        sansSerifFamily: string;
        serifFamily: string;
        fontDirs?: any[];
        fontFiles?: any[];
    };
};
export const STIX_FAMILY: "STIX Two Math";
export const STIX_STACK: "'STIX Two Math', 'STIX Two Text', Georgia, 'Times New Roman', serif";
export const STIX_IMPORT_URL: "https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap";
export namespace TYPE {
    let lineHeight: number;
    let letterSpacing: number;
}
/** HTML 문서용 폰트 <link> (preconnect + stylesheet). */
export const STIX_LINK: string;
/**
 * resvg 래스터용 **시스템 폰트 폴더** 후보.
 *
 * 왜 필요한가 — resvg 의 `loadSystemFonts`(기본 true) 만으로는 리눅스 컨테이너에서
 * 시스템 폰트가 로드되지 않는 경우가 있다(fontconfig 미설치 환경). 그 상태에서는 CJK 라벨이
 * □(tofu)로 깨진다. `fontDirs` 를 주면 resvg 가 그 폴더를 직접 스캔해 **글리프 폴백**이 살아난다.
 *  · 컨테이너 이미지(Dockerfile.render)는 `fonts-nanum`(한글) + DejaVu/Liberation 을 넣어 둔다.
 */
export const SYSTEM_FONT_DIRS: any[];
declare namespace _default {
    export { STIX_FAMILY };
    export { STIX_STACK };
    export { STIX_LINK };
    export { TYPE };
    export { svgFontStyle };
    export { stixFontFile };
    export { resvgFontOptions };
    export { SYSTEM_FONT_DIRS };
}
export default _default;
