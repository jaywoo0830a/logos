// 0911-PLAN §7 — 라벨 자동 배치(충돌 회피).
// IR 텍스트/점라벨 노드의 화면 바운딩박스를 근사 계산해, 겹치면 px 오프셋(dyPx)으로 밀어낸다.
// world 좌표는 그대로 두고 화면 오프셋만 조정하므로 좌표 정확성에 영향이 없다.

const rankOf = (n) => (n.data.z || 0) * 1000;
// 자동 배치 대상: 라벨/주석(제목·범례·점라벨·캡션)만. 축 눈금(z<0)은 **움직이지 않는 장애물**로만 쓴다.
const isText = (n) => (n.kind === 'text' || (n.kind === 'point' && (n.data.label || n.data.labelMath)))
  && ((n.data.z ?? 0) >= 0);
/** 축 눈금·축 라벨(z<0) — 제자리에 두되, 어노테이션이 피해야 하는 장애물. */
const isObstacle = (n) => n.kind === 'text' && ((n.data.z ?? 0) < 0) && String(n.data.text ?? '').length > 0;

function measure(d, kind) {
  const font = d.font || (kind === 'point' ? 13 : 13.5);
  const text = String(d.text ?? d.label ?? '');
  const lines = text.split('\n');
  const wchars = Math.max(...lines.map((l) => l.length), 1);
  return {
    w: Math.max(8, wchars * font * 0.6),
    h: Math.max(font * 1.2, lines.length * font * 1.2),
  };
}

function boxAt(sx, sy, w, h, anchor) {
  const left = anchor === 'middle' ? sx - w / 2 : anchor === 'end' ? sx - w : sx;
  return { x0: left, y0: sy - h, x1: left + w, y1: sy };  // baseline 기준(위쪽 박스)
}

function overlap(a, b, pad) {
  return !(a.x1 + pad < b.x0 || b.x1 + pad < a.x0 || a.y1 + pad < b.y0 || b.y1 + pad < a.y0);
}

/**
 * @param {Array} nodes IR 노드
 * @param {Function} map world→screen
 * @param {number} W @param {number} H
 * @param {Object} [opts] { pad, iterations }
 * @returns {Array} 오프셋이 조정된 노드 배열
 */
export function relayout(nodes, map, W, H, opts = {}) {
  const pad = opts.pad ?? 2;
  const items = [];
  const fixed = [];   // 눈금/축 라벨 — 옮기지 않지만 피해야 하는 박스
  nodes.forEach((n, i) => {
    const d = n.data;
    if (isObstacle(n)) {
      const [mx, my] = map(d.x, d.y);
      const { w, h } = measure(d, n.kind);
      fixed.push(boxAt(mx + (d.dxPx || 0), my + (d.dyPx || 0), w, h, d.anchor || 'start'));
      return;
    }
    if (!isText(n)) return;
    const [mx, my] = map(d.x, d.y);
    const { w, h } = measure(d, n.kind);
    items.push({
      i, node: n, d, mx, my, w, h,
      sx: mx + (d.dxPx || 0), sy: my + (d.dyPx || 0),
      anchor: d.anchor || 'start', rank: rankOf(n),
    });
  });
  // 우선순위: z(위) 큰 것부터, 같으면 위쪽(y 작은) 먼저 — toSorted 로 원본 배열을 건드리지 않는다(A3).
  const placed = [];
  const out = nodes.slice();
  const hitOf = (bb) => placed.find((p) => overlap(bb, p, pad)) || fixed.find((p) => overlap(bb, p, pad));
  for (const it of items.toSorted((a, b) => (b.rank - a.rank) || (a.sy - b.sy))) {
    let bx = boxAt(it.sx, it.sy, it.w, it.h, it.anchor);
    let guard = 0;
    let hit = hitOf(bx);
    while (hit && guard++ < 40) {
      it.sy = hit.y1 + pad + it.h;          // 충돌 상대 아래로 이동
      bx = boxAt(it.sx, it.sy, it.w, it.h, it.anchor);
      hit = hitOf(bx);
    }
    // 캔버스 안으로 클램프
    it.sy = Math.max(it.h + 2, Math.min(H - 2, it.sy));
    bx = boxAt(it.sx, it.sy, it.w, it.h, it.anchor);
    placed.push(bx);
    const ndx = bx.x0 + (it.anchor === 'end' ? it.w : it.anchor === 'middle' ? it.w / 2 : 0) - it.mx;
    const ndy = it.sy - it.my;
    if (Math.abs(ndx - (it.d.dxPx || 0)) > 0.5 || Math.abs(ndy - (it.d.dyPx || 0)) > 0.5) {
      out[it.i] = { ...it.node, data: { ...it.d, dxPx: ndx, dyPx: ndy } };
    }
  }
  return out;
}

export default relayout;
