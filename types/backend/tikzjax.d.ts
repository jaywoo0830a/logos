/** TikZ 소스(또는 tex문서) 를 SVG 문자열로 변환. 싱글턴 큐. */
export function tikzToSVG(tikzSource: any, opts?: {}): Promise<any>;
/** IR 노드 → TikZ → SVG (장황한 단계를 한 번에) */
export function irToTikZSVG(ir: any, opts: any): Promise<{
    tex: string;
    svg: any;
}>;
export default tikzToSVG;
