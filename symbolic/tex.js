// DSL.md §7 심볼릭 — 태그드 템플릿 `tex`가 LaTeX를 입구로 삼는다.
import { Sym } from './sym.js';

export function tex(strings, ...values) {
  const latex = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  return new Sym(latex);
}

/** 숫자·문자열·Sym을 LaTeX 로 표현 (렌더링/검증 헬퍼) */
export function toLatex(v) {
  if (v == null) return '';
  if (typeof v.toLatex === 'function') return v.toLatex();
  return String(v);
}