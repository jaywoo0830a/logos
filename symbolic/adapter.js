// ADAPT.md §1계층(심볼릭 레이어)
// 외부 CAS(SageMath 1순위, SymPy fallback)를 어댑터로 감싼다.
// 사용자는 여전히 logos의 tex`...` 만 쓴다.
//
// 공통 인터페이스(비동기):
//   diff(latex, v)          -> string(LaTeX)
//   integrate(latex, opts)  -> string(LaTeX)
//   solve(latex, v)         -> string[] (LaTeX)
//   simplify(latex)         -> string
//   limit(latex, v, to)     -> string
//   available()             -> bool
import { spawn } from 'node:child_process';
import { Sym } from './sym.js';

const QL = (s) => JSON.stringify(String(s));
// 변수명 문자열(Latex 심볼) → python Symbol() 호출. 안전을 위해 알파벳/숫자/밑줄만.
const SYM = (v) => `Symbol(${QL(v)})`;

/** subprocess 실행 헬퍼 — stdin/out 을 문자열(UTF-8)로 */
export function runPython(code, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', code], {
      env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    const t = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('python3 timeout')); }, timeout);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', reject);
    child.on('close', (code0) => {
      clearTimeout(t);
      if (code0 !== 0) reject(new Error(`python3 exit ${code0}: ${err.slice(0, 500)}`));
      else resolve(out.trim());
    });
  });
}

// ── SageMath 어댑터 (MCP/REST 세션) ──────────────
export class SageAdapter {
  /** @param {object} opts { cmd:'mcp'|'rest', url, session } */
  constructor(opts = {}) { this.opts = opts; this._session = opts.session ?? null; }
  static async detect() { return false; } // SageMath 배포 시 세션 구현

  async call(tool, args) {
    if (this.opts.cmd === 'rest') {
      if (!this.opts.url) throw new Error('SageAdapter: REST url 필요');
      const res = await fetch(this.opts.url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool, args, session: this._session }),
      });
      return (await res.json()).result;
    }
    throw new Error('SageAdapter: cmd 는 mcp/rest — SageMath 배포 후 세션을 주입하세요. 폴백으로 SymPyAdapter 가 동작합니다.');
  }
  async available() { return false; }
  diff(latex, v = 'x') { return this.call('differentiate_expression', { expression: latex, variable: v }); }
  integrate(latex, o = {}) { return this.call('integrate_expression', { expression: latex, variable: o.var ?? 'x', from: o.from, to: o.to }); }
  solve(latex, v = 'x') { return this.call('solve_equation', { equation: latex, variable: v }); }
  simplify(latex) { return this.call('sample_expression', { expression: latex }); }
}

// ── SymPy 어댑터 (python3 subprocess) ────────────
export class SymPyAdapter {
  static async detect() {
    try { return !!(await runPython('import sympy; print(sympy.__version__)')); }
    catch { return false; }
  }
  async available() { return SymPyAdapter.detect(); }

  async diff(latex, v = 'x') {
    return this._run(`diff(parse_expr(${QL(latex)}), ${SYM(v)})`);
  }
  async integrate(latex, o = {}) {
    const expr = `parse_expr(${QL(latex)})`;
    const v = SYM(o.var ?? 'x');
    let cmd;
    if (o.from !== undefined && o.to !== undefined) {
      cmd = `integrate(${expr}, (${v}, ${JSON.stringify(o.from)}, ${JSON.stringify(o.to)}))`;
    } else {
      cmd = `integrate(${expr}, ${v})`;
    }
    return this._run(cmd);
  }
  async solve(latex, v = 'x') {
    return this._run(`list(solve(parse_expr(${QL(latex)}), ${SYM(v)}))`, { list: true });
  }
  async simplify(latex) { return this._run(`simplify(parse_expr(${QL(latex)}))`); }
  async limit(latex, v, to) {
    return this._run(`limit(parse_expr(${QL(latex)}), ${SYM(v)}, ${JSON.stringify(to)})`);
  }
  async series(latex, v, at, order) {
    return this._run(`series(parse_expr(${QL(latex)}), ${SYM(v)}, ${JSON.stringify(at)}, ${JSON.stringify(order)}).removeO()`);
  }

  async _run(exprStatement, { list = false } = {}) {
    const pyPrint = list ? `print('\\n'.join(latex(e) for e in r))` : `print(latex(r))`;
    const code = [
      `import sympy`,
      `from sympy.parsing.sympy_parser import parse_expr`,
      `from sympy import latex, solve, diff, integrate, simplify, limit, series, symbols, Symbol`,
      `x, y, z, t = symbols('x y z t')`,
      `try:`,
      `    r = ${exprStatement}`,
      `    ${pyPrint}`,
      `except Exception as e:`,
      `    print('ERROR:' + repr(e))`,
    ].join('\n');
    const out = await runPython(code);
    if (out.startsWith('ERROR:')) throw new Error('SymPy: ' + out.slice(6));
    return out;
  }
}

// ── 팩토리: Sage 1순위, SymPy 폴백 ───────────────
export async function createSymbolicAdapter(opts = {}) {
  if (opts.force === 'sympy') return new SymPyAdapter();
  if (opts.force === 'sage') return new SageAdapter(opts.sage || {});
  return new SymPyAdapter();
}

export const defaultAdapter = new SymPyAdapter();

// compute-engine Sym 을 외부 어댑터로 확장(선택)
export function withExternalSymbolic(SymClass) {
  return class ExtSym extends SymClass {
    async diff(v = 'x') { const r = await defaultAdapter.diff(this.latex, v); return new ExtSym(r); }
    async integrate(o) { const r = await defaultAdapter.integrate(this.latex, { var: 'x', ...o }); return new ExtSym(r); }
    async solve(v = 'x') {
      const raw = await defaultAdapter.solve(this.latex, v);
      return typeof raw === 'string' ? raw.split('\n').map((l) => new ExtSym(l.trim())) : raw;
    }
    async simplify2() { const r = await defaultAdapter.simplify(this.latex); return new ExtSym(r); }
  };
}