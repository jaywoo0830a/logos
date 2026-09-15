/** LaTeX → KaTeX 마크업
 *  기본 output: 'mathml' — 브라우저가 CSS 없이 네이티브 렌더링하므로
 *  자기완결적 SVG의 <foreignObject>에 안전하다. (HTML+CSS 의존 제거)
 */
export function katexRender(latex: any, opts?: {}): any;
/** 라벨/수식 문자열 내의 $...$ 를 KaTeX 로 변환 */
export function katexify(text: any): any;
/** LaTeX → 폰트 비의존 유니코드 텍스트 (foreignObject 없는 <text> 백엔드용) */
export function latexToText(latex: any): string;
export function escapeHtml(s: any): string;
/** 자식 노드(text)들을 전부 KaTeX 처리한 최종 <figure> 조립용 헬퍼 (STIX Two Math 포함) */
export function buildFigureHTML(items: any): string;
export default katexRender;
