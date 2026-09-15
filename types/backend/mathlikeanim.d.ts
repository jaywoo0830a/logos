export function initMathLikeAnim(): Promise<{
    ok: boolean;
    reason: string;
    mod: any;
} | {
    ok: boolean;
    reason: string;
    mod?: undefined;
}>;
/** IR → MathLikeAnim 표현(브라우저용 scene builder 문자열 반환) */
export function irToMathLikeAnimCode(ir: any, opts?: {}): string;
export { initMathLikeAnim as default };
