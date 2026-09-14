// docs/spec/DSL.md §7 심볼릭 — 태그드 템플릿 `tex`가 LaTeX를 입구로 삼는다.
import { Sym } from './sym.js';

export function tex(strings, ...values) {
  // 태그드 템플릿: JS permits invalid escapes → cooked는 \t(탭) 등으로 백슬래시가
  // 소실된다. LaTeX 백슬래시 보존을 위해 반드시 strings.raw 를 사용한다.
  const raw = strings.raw || strings;
  const latex = raw.reduce((acc, s, i) => {
    const v = values[i];
    const val = v == null ? '' : typeof v.toLatex === 'function' ? v.toLatex() : String(v);
    return acc + s + val;
  }, '');
  return new Sym(latex);
}

/** 숫자·문자열·Sym을 LaTeX 로 표현 (렌더링/검증 헬퍼) */
export function toLatex(v) {
  if (v == null) return '';
  if (typeof v.toLatex === 'function') return v.toLatex();
  return String(v);
}
