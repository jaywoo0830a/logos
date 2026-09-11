// STIX Two Math — 전 영역(텍스트·수식·축) 기본 폰트.
// 브라우저: Google Fonts(@import / <link>) · 래스터(resvg): 로컬 TTF(assets/).
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STIX_FAMILY = 'STIX Two Math';
export const STIX_STACK = "'STIX Two Math', 'STIX Two Text', Georgia, 'Times New Roman', serif";
export const STIX_IMPORT_URL = 'https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap';

/** HTML 문서용 폰트 <link> (preconnect + stylesheet). */
export const STIX_LINK = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  `<link href="${STIX_IMPORT_URL}" rel="stylesheet">`,
].join('');

/** SVG 자기완결용 폰트 스타일 — @import + 텍스트/MathML 전역 적용. */
export function svgFontStyle() {
  // SVG 는 XML 이므로 URL 의 '&' 를 반드시 이스케이프한다(resvg 파싱 오류 방지).
  const url = STIX_IMPORT_URL.replace(/&/g, '&amp;');
  return `<style>@import url('${url}');`
    + `text,tspan{font-family:${STIX_STACK};}`
    + `foreignObject div,.katex,.katex math,math{font-family:${STIX_STACK};}`
    + `</style>`;
}

/** resvg 래스터용 로컬 폰트 파일(있으면). */
export function stixFontFile() {
  const p = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'STIXTwoMath-Regular.ttf');
  return existsSync(p) ? p : null;
}

/** resvg 옵션의 font 구성. */
export function resvgFontOptions() {
  const f = stixFontFile();
  return {
    font: {
      ...(f ? { fontFiles: [f] } : {}),
      defaultFontFamily: STIX_FAMILY,
      sansSerifFamily: STIX_FAMILY,
      serifFamily: STIX_FAMILY,
    },
  };
}

export default { STIX_FAMILY, STIX_STACK, STIX_LINK, svgFontStyle, stixFontFile, resvgFontOptions };
