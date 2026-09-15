/** subprocess 실행 헬퍼 — stdin/out 을 문자열(UTF-8)로 */
export function runPython(code: any, { timeout }?: {
    timeout?: number;
}): Promise<any>;
export function createSymbolicAdapter(opts?: {}): Promise<SymPyAdapter | SageAdapter>;
export function withExternalSymbolic(SymClass: any): {
    new (): {
        [x: string]: any;
        diff(v?: string): Promise</*elided*/ any>;
        integrate(o: any): Promise</*elided*/ any>;
        solve(v?: string): Promise<any>;
        simplify2(): Promise</*elided*/ any>;
    };
    [x: string]: any;
};
export class SageAdapter {
    static detect(): Promise<boolean>;
    /** @param {object} opts { cmd:'mcp'|'rest', url, session } */
    constructor(opts?: object);
    opts: any;
    _session: any;
    call(tool: any, args: any): Promise<any>;
    available(): Promise<boolean>;
    diff(latex: any, v?: string): Promise<any>;
    integrate(latex: any, o?: {}): Promise<any>;
    solve(latex: any, v?: string): Promise<any>;
    simplify(latex: any): Promise<any>;
}
export class SymPyAdapter {
    static detect(): Promise<boolean>;
    available(): Promise<boolean>;
    diff(latex: any, v?: string): Promise<any>;
    integrate(latex: any, o?: {}): Promise<any>;
    solve(latex: any, v?: string): Promise<any>;
    simplify(latex: any): Promise<any>;
    limit(latex: any, v: any, to: any): Promise<any>;
    series(latex: any, v: any, at: any, order: any): Promise<any>;
    _run(exprStatement: any, { list }?: {
        list?: boolean;
    }): Promise<any>;
}
export const defaultAdapter: SymPyAdapter;
