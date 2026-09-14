// 불변 AST 노드 — 모든 도형은 결국 이 IR 노드들로 컴파일된다.
// docs/spec/DSL.md §12 「IR 하나로 다중 백엔드」 — SVG / TikZ 백엔드가 이 노드를 소비한다.

let NODE_ID = 0;

/**
 * 불변 IR 노드를 만든다.
 * @param {string} kind  노드 종류: 'path' | 'circle' | 'point' | 'text' | 'fill'
 * @param {Object} data  종류별 데이터 (좌표·스타일 포함)
 * @param {Array}  children 서브 노드
 * @returns {Readonly<Object>} freeze 된 노드
 */
export function node(kind, data = {}, children = []) {
  return Object.freeze({
    id: NODE_ID++,
    kind,
    data: Object.freeze({ ...data }),
    children: Object.freeze([...children]),
  });
}

/** 노드가 유효한 IR 노드인지 */
export function isIR(n) {
  return !!n && typeof n === 'object' && typeof n.kind === 'string' && 'data' in n;
}
