/**
 * 색상명을 Asymptote 기본 색명으로 변환 (출력이 단순해짐).
 * hex 이면 rgb() 로, 알 수 없으면 rgb(깊은 회색).
 */
/** IR 노드 배열 → Asymptote 소스 (2D/3D) */
export function irToAsymptote(nodes: any, opts?: {}): string;
/**
 * @param {string} asySource .asy 소스
 * @param {{ format?: string, cwd?: string }} [o] `format`: svg/pdf/png … · `cwd`: 작업 디렉터리(기본 임시)
 */
export function compileAsymptote(asySource: string, { format, cwd }?: {
    format?: string;
    cwd?: string;
}): Promise<any>;
export function asyColor(color: any): any;
export default irToAsymptote;
