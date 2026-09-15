export class Sym {
    constructor(latex: any);
    latex: string;
    get ast(): any;
    diff(v?: string): Sym;
    /**
     * 정적분 — 적분 구간을 주면 정적분값, 아니면 부정적분.
     * @param {{ from?: number, to?: number, var?: string }} [o] `from`/`to`: 적분 구간 · `var`: 변수(기본 'x')
     */
    integrate({ from, to, var: v }?: {
        from?: number;
        to?: number;
        var?: string;
    }): Sym;
    simplify(): Sym;
    expand(): Sym;
    factor(): Sym;
    solve(v?: string): any[];
    substitute(map: any): Sym;
    toFunction(v?: string): (x: any) => any;
    toLatex(): string;
    valueOf(): number;
    #private;
}
