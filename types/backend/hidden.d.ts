/**
 * @param {Array} nodes IR
 * @param {Function} map world→screen
 * @param {number} W @param {number} H
 * @returns {Array} hidden-line 적용 노드
 */
export function applyHiddenLines(nodes: any[], map: Function, W: number, H: number): any[];
export default applyHiddenLines;
