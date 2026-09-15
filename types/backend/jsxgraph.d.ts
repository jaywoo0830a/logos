/**
 * IR 노드 → JSXGraph 호출 행(문자열 배열)을 만든다.
 * @param {Array} nodes
 * @param {object} opts { boardId, variants }
 */
export function irToJSXGraph(nodes: any[], opts?: object): string;
/** 전체 <div>+script HTML 문서(오프라인 반복형) */
export function buildJSXGraphHTML(nodes: any, opts?: {}): string;
export default irToJSXGraph;
