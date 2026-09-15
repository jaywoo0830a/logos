/**
 * 불변 IR 노드를 만든다.
 * @param {string} kind  노드 종류: 'path' | 'circle' | 'point' | 'text' | 'fill'
 * @param {Object} data  종류별 데이터 (좌표·스타일 포함)
 * @param {Array}  children 서브 노드
 * @returns {Readonly<Object>} freeze 된 노드
 */
export function node(kind: string, data?: any, children?: any[]): Readonly<any>;
/** 노드가 유효한 IR 노드인지 */
export function isIR(n: any): boolean;
