// docs/extend/ADAPT.md §2계층 — JSXGraph 인터랙티브 백엔드
// IR을 인터랙티브 HTML(<div>+JSXGraph JS)로 변환. CDN 기반, 외부 의존 최소.
// 각 도형이 JSXGraph 생성자 호출로 매핑된다.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * IR 노드 → JSXGraph 호출 행(문자열 배열)을 만든다.
 * @param {Array} nodes
 * @param {object} opts { boardId, variants }
 */
export function irToJSXGraph(nodes, opts = {}) {
  const id = opts.boardId ?? 'board';
  const code = [];
  code.push(
    `const board = JXG.JSXGraph.initBoard('${id}', {${bboxStr(opts)}, axis:false, grid:false, boundingbox:${json(opts.bbox)}});`,
  );
  if (opts.axes) {
    code.push(
      "board.create('axis', [[0,0],[1,0]], {name:'x', withLabel:true});".replace(
        /name:'x'/,
        `name:'${opts.axesLabel?.x ?? 'x'}'`,
      ),
    );
    code.push(
      "board.create('axis', [[0,0],[0,1]], {name:'y', withLabel:true});".replace(
        /name:'y'/,
        `name:'${opts.axesLabel?.y ?? 'y'}'`,
      ),
    );
  }
  for (const nd of nodes) {
    const d = nd.data;
    switch (nd.kind) {
      case 'path': {
        const pts = d.ops.filter((o) => o.op === 'M' || o.op === 'L').map((o) => [o.x, o.y]);
        if (pts.length >= 2) {
          code.push(`board.create('polyline', [${json(pts)}]);`);
        }
        break;
      }
      case 'circle':
        code.push(`board.create('circle', [[${d.cx}, ${d.cy}], [${d.cx + d.r}, ${d.cy}]]);`);
        break;
      case 'point':
        code.push(`board.create('point', [${d.x}, ${d.y}], {name:'${esc(d.label ?? '')}', size:2});`);
        break;
      default:
        break;
    }
  }
  return code.join('\n');
}

function bboxStr(opts) {
  // JSXGraph boundingbox: [xmin, ymax, xmax, ymin]
  const b = opts.bbox || [-6, 6, 6, -6];
  return `boundingbox:[${json(b)}]`;
}
const json = (v) => JSON.stringify(v);

/** 전체 <div>+script HTML 문서(오프라인 반복형) */
export function buildJSXGraphHTML(nodes, opts = {}) {
  const id = opts.boardId ?? 'board';
  const w = opts.width ?? 500,
    h = opts.height ?? 500;
  const script = irToJSXGraph(nodes, { ...opts, boardId: id });
  return [
    `<!doctype html><html><head><meta charset="utf-8">`,
    `<title>logos · JSXGraph</title>`,
    `<script src="${opts.cdn || 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js'}"></script>`,
    `<link rel="stylesheet" href="${opts.cdnCss || 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraph.css'}">`,
    `</head><body>`,
    `<div id="${id}" class="jxgbox" style="width:${w}px;height:${h}px;"></div>`,
    `<script>\n${script}\n</script>`,
    `</body></html>`,
  ].join('\n');
}

export default irToJSXGraph;
