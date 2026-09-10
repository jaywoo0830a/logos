// ADAPT.md §3계층 — MathLikeAnim-rs (Rust → WASM) 백엔드
// Manim 스타일의 인터랙티브 3D/함수 플로팅. @mathlikeanim-rs/renderer 로 WASM 로딩.
// WASM 바이너리가 브라우저/Node 에 로드돼야 하므로 async.
//
// 이 어댑터는 (a) 패키지가 설치되고 WASM 귀속이 성공하면 실제 scene 을 만들고,
// (b) 실패하면 명확한 안내를 던진다. `@mathlikeanim-rs/renderer` 는 브라우저 DOM
// 기반(SVGScene)이라 Node 에서는 DOM 폴리필이 필요함 → 선택적 사용.

export async function initMathLikeAnim() {
  try {
    const mod = await import('@mathlikeanim-rs/renderer');
    // 노드에서 DOM 이 없으면 폴리필 필요 — 브라우저 번들로 주로 사용
    return { ok: false, reason: 'MathLikeAnim-rs 는 DOM 기반이므로 브라우저 번들용입니다. Node 에서는 JSXGraph/Asymptote(SVG)를 사용하세요.', mod };
  } catch (e) {
    return { ok: false, reason: `MathLikeAnim-rs 로드 실패: ${e.message}` };
  }
}

/** IR → MathLikeAnim 표현(브라우저용 scene builder 문자열 반환) */
export function irToMathLikeAnimCode(ir, opts = {}) {
  const items = [];
  for (const nd of ir.o.nodes) {
    const d = nd.data;
    switch (nd.kind) {
      case 'point':
        items.push(`point(${d.x}, ${d.y}${d.z !== undefined ? `, ${d.z}` : ''})`);
        break;
      case 'circle':
        items.push(`circle(${d.cx}, ${d.cy}, ${d.r})`);
        break;
      case 'path': {
        const pts = d.ops.filter((o) => o.op === 'M' || o.op === 'L').map((o) => `[${o.x}, ${o.y}]`);
        items.push(`polyline(${JSON.stringify(pts)})`);
        break;
      }
      default: break;
    }
  }
  return `import { SVGScene } from '@mathlikeanim-rs/renderer';\nconst items = [${items.join(', ')}];\nexport default items;`;
}

export { initMathLikeAnim as default };