// ADAPT.md §4계층 — KaTeX 수식 조판 (빠르고 가벼운 기본 수식 엔진)
// tex`...` LaTeX 문자열을 HTML(<span>…) 로 조판한다.
import katex from 'katex';

/** LaTeX → KaTeX 마크업
 *  기본 output: 'mathml' — 브라우저가 CSS 없이 네이티브 렌더링하므로
 *  자기완결적 SVG의 <foreignObject>에 안전하다. (HTML+CSS 의존 제거)
 */
export function katexRender(latex, opts = {}) {
  return katex.renderToString(latex, {
    throwOnError: false,
    displayMode: opts.displayMode ?? false,
    output: opts.output ?? 'mathml',
    strict: false,
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

/** LaTeX → 폰트 비의존 유니코드 텍스트 (foreignObject 없는 <text> 백엔드용) */
export function latexToText(latex) {
  if (latex == null) return '';
  let s = String(latex);
  // 자주 쓰는 명령 → 유니코드
  const sym = {
    '\\pi': 'π', '\\theta': 'θ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ',
    '\\delta': 'δ', '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\phi': 'φ', '\\varphi': 'φ',
    '\\infty': '∞', '\\approx': '≈', '\\to': '→', '\\rightarrow': '→', '\\Rightarrow': '⇒',
    '\\le': '≤', '\\leq': '≤', '\\ge': '≥', '\\geq': '≥', '\\neq': '≠', '\\ne': '≠',
    '\\pm': '±', '\\times': '×', '\\cdot': '·', '\\perp': '⊥', '\\parallel': '∥',
    '\\int': '∫', '\\sum': '∑', '\\prod': '∏', '\\partial': '∂', '\\nabla': '∇',
    '\\sqrt': '√', '\\in': '∈', '\\subset': '⊂', '\\cup': '∪', '\\cap': '∩',
    '\\degree': '°',
  };
  for (const [k, v] of Object.entries(sym)) s = s.split(k).join(v);
  // \frac \tfrac \dfrac{a}{b} → (a)/(b)  (중첩은 반복 치환)
  let prev;
  do {
    prev = s;
    s = s.replace(/\\(?:t|d)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  } while (s !== prev);
  // \mathrm{X} / \text{X} → X
  s = s.replace(/\\(?:mathrm|text|operatorname)\s*\{([^{}]*)\}/g, '$1');
  // \left \right 제거
  s = s.replace(/\\(?:left|right)/g, '');
  // \sqrt{a} → √(a)
  s = s.replace(/√\s*\{([^{}]*)\}/g, '√($1)');
  // \lim_{...} \log_{...} 등 아래첨자 → 괄호
  s = s.replace(/\\lim\s*_\s*\{([^{}]*)\}/g, 'lim($1)');
  s = s.replace(/\\log\s*_\s*\{([^{}]*)\}/g, 'log($1)');
  // \bar{z} \overline{z} \vec{v} \hat{x} → 결합 문자 (래스터 폴백에서도 accent 가 보이게)
  const accent = { bar: '\u0304', overline: '\u0304', vec: '\u20d7', hat: '\u0302', dot: '\u0307', tilde: '\u0303' };
  s = s.replace(/\\(bar|overline|vec|hat|dot|tilde)\s*\{([^{}]*)\}/g,
    (m, name, body) => body.split('').map((ch) => ch + accent[name]).join(''));
  // 남은 명령 제거, 중괄호/달러/여분 공백 정리
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/\^\{([^{}]*)\}/g, '^$1');
  s = s.replace(/[{}]/g, '').replace(/\$/g, '');
  s = s.replace(/\\,(?=\S)/g, ' ').replace(/\\/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 자식 노드(text)들을 전부 KaTeX 처리한 최종 <figure> 조립용 헬퍼 (STIX Two Math 포함) */
export function buildFigureHTML(items) {
  const link = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap" rel="stylesheet">';
  return `${link}<figure class="logos" style="font-family:'STIX Two Math',Georgia,serif">${items.join('\n')}</figure>`;
}

export default katexRender;