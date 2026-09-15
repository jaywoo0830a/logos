/**
 * @param {Array} nodes IR 노드
 * @param {Function} map world→screen
 * @param {number} W @param {number} H
 * @param {Object} [opts] { pad, iterations }
 * @returns {Array} 오프셋이 조정된 노드 배열
 */
export function relayout(nodes: any[], map: Function, W: number, H: number, opts?: any): any[];
export default relayout;
