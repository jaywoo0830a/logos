// ADAPT.md §4계층 — KaTeX 수식 조판 (빠르고 가벼운 기본 수식 엔진)
// tex`...` LaTeX 문자열을 HTML(<span>…) 로 조판한다.
import katex from 'katex';

/** LaTeX → KaTeX HTML 마크업 */
export function katexRender(latex, opts = {}) {
  return katex.renderToString(latex, {
    throwOnError: false,
    displayMode: opts.displayMode ?? false,
    output: 'html',
  });
}

/** 라벨/수식 문자열 내의 $...$ 를 KaTeX 로 변환 */
export function katexify(text) {
  if (text == null) return '';
  const raw = String(text);
  // $...$ 블록 우선 처리
  if (/\$[^$]+\$/.test(raw)) {
    return raw
      .split(/(\$[^$]+\$)/g)
      .map((p) =>
        (p.startsWith('$') && p.endsWith('$') && p.length > 1)
          ? katexRender(p.slice(1, -1))
          : escapeHtml(p))
      .join('');
  }
  // $ 없이 수식 문자 포함 시 → KaTeX 조판
  if (/[^A-Za-z0-9 ,.'"\-()]/.test(raw)) return katexRender(raw);
  return escapeHtml(raw);
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 자식 노드(text)들을 전부 KaTeX 처리한 최종 <figure> 조립용 헬퍼 */
export function buildFigureHTML(items) {
  return `<figure class="logos">${items.join('\n')}</figure>`;
}

export default katexRender;