외부 언어를 적극적으로 활용하는 관점에서 다시 정리했습니다. `logos` DSL의 전체 스펙을 커버하려면 **단일 언어로는 불가능**하고, 각 영역에 최적화된 외부 엔진을 **어댑터로 감싸는 3계층 아키텍처**가 가장 현실적입니다.

---

## 🏗️ 3계층 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│  logos DSL (JS)                                          │
│  scene().add(circle.center(O).radius(3))...compile()     │
└───────────────┬──────────────────────────────────────────┘
                │ IR (JSON)
    ┌───────────┼───────────┬────────────┐
    ▼           ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Symbolic│ │  2D    │ │   3D     │ │  Output  │
│ Layer  │ │ Layer  │ │  Layer   │ │  Layer   │
└────────┘ └────────┘ └──────────┘ └──────────┘
    │           │           │            │
    ▼           ▼           ▼            ▼
 SageMath    JSXGraph    MathBox      TikZJax
 SymPy       (or 자체)   (or Three)   (WASM)
 Maxima                               Asymptote
```

각 계층은 **외부 언어로 작성된 엔진**을 Node.js 어댑터로 감싸서 호출한다. 사용자는 여전히 `logos` JS 코드만 쓴다.

---

## 🔬 1계층: 심볼릭 (Symbolic Layer)

### 후보 비교

| 엔진 | 언어 | LaTeX 입출력 | 강점 | Node.js 연동 |
|---|---|---|---|---|
| **SageMath** | Python | ✅ 양방향 | 100+ 패키지, 대수·정수론·군론 | MCP 서버 / REST API |
| **SymPy** | Python | ✅ 출력 | 순수 Python, 260K LOC, 검증됨 | subprocess / Pyodide |
| **Maxima** | Lisp | ✅ 출력 | 1968년부터, CAS의 원조 | subprocess / tex2max |
| **Symbolics.jl** | Julia | ⚠️ 제한적 | SciML 연동, ODE 특화 | subprocess |
| **GAP** | Lisp | ❌ | 군론·조합론 특화 | Sage를 통해 |

### 권장: **SageMath** (1순위) + **SymPy** (폴백)

SageMath는 **100개 이상의 패키지를 하나의 우산 아래** 통합한 종합 CAS입니다. 미분, 적분, 극한, 급수 전개, 방정식 풀이, 선형대수, 미분방정식, 정수론, 조합론, 그래프 이론, 군론, 타원곡선, 부호 이론, 그뢰브너 기저까지 **37개의 MCP 도구**로 노출되어 있습니다. 특히 **LaTeX 출력을 기본 지원**하므로 `logos` DSL의 `.toLatex()`와 직접 연결됩니다.

SageMath는 Node.js에서 **MCP 서버**(`XBP-Europe/sagemath-mcp`) 또는 **REST API**(`imperialqore/line-sage-rest`)로 접근할 수 있습니다. MCP 서버는 **세션별로 Sage 프로세스를 유지**하므로 변수와 함수가 호출 간에 지속됩니다.

SymPy는 SageMath의 내부 엔진 중 하나이므로, Sage가 실패할 경우 **SymPy로 직접 폴백**하는 전략이 자연스럽습니다. SymPy는 순수 Python으로 작성되어 **의존성이 적고**, LaTeX 출력을 지원합니다.

```js
// logos/symbolic/adapter.js (개념)
class SageAdapter {
  async diff(latex, v = 'x') {
    const result = await this.mcp.call('differentiate_expression', {
      expression: latex, variable: v
    });
    return result.latex;  // Sage가 LaTeX로 직접 출력
  }
  async integrate(latex, opts) { /* ... */ }
  async solve(latex, v) { /* ... */ }
  async limit(latex, v, to) { /* ... */ }
  async series(latex, v, at, order) { /* ... */ }
}

class SymPyAdapter extends SageAdapter { /* 폴백 */ }
```

---

## 📐 2계층: 2D 기하 (2D Layer)

### 후보 비교

| 엔진 | 언어 | SVG 출력 | 교과서 품질 | 3D |
|---|---|---|---|---|
| **JSXGraph** | JS | ✅ | ✅ 20년 검증 | 제한적 |
| **Asymptote** | C++ | ✅ PDF/SVG | ✅ LaTeX 조판 | ✅ 3D PRC |
| **GeoGebra** | Java/JS | ✅ | ✅ | ✅ |

### 권장: **Asymptote** (출판 품질) + **JSXGraph** (인터랙티브)

**Asymptote**는 "TeX/LaTeX가 방정식을 조판하듯이, 수학 도형을 조판하는 언어"를 표방합니다. **LaTeX로 라벨과 방정식을 조판**하고, **PostScript, PDF, SVG, 3D PRC** 출력을 지원합니다. MetaPost에서 영감을 받았지만 **C++ 같은 문법**을 가지며, **3차원으로 TeX를 확장한 최초의 소프트웨어**입니다. 출판사 원고 수준의 품질을 원한다면 Asymptote가 최고입니다.

Asymptote는 `.asy` 소스를 생성하고 **CLI로 컴파일**하는 방식으로 Node.js에서 호출합니다. `logos`가 IR에서 `.asy` 코드를 생성하면 됩니다.

**JSXGraph**는 인터랙티브 웹 출력이 필요할 때 병행합니다. 순수 JS로 외부 의존성이 없고, SVG·Canvas를 모두 지원하며, KaTeX/MathJax 통합이 내장되어 있습니다.

```js
// logos/backend/asymptote.js (개념)
export function irToAsymptote(ir) {
  const lines = [];
  lines.push('import graph; import geometry;');
  lines.push('size(400, 400);');
  for (const item of ir.items) {
    switch (item.kind) {
      case 'point':
        lines.push(`dot((${item.params.x}, ${item.params.y}), red);`);
        lines.push(`label("$${item.label?.text}$", (${item.params.x}, ${item.params.y}), NE);`);
        break;
      case 'circle':
        lines.push(`draw(circle((${item.params.cx}, ${item.params.cy}), ${item.params.r}));`);
        break;
      case 'curve':
        lines.push(`draw(graph(${item.samplerName}, ${item.domain[0]}, ${item.domain[1]}));`);
        break;
    }
  }
  return lines.join('\n');
}
```

---

## 🧊 3계층: 3D (3D Layer)

### 후보 비교

| 엔진 | 언어 | 출력 | 품질 | WASM |
|---|---|---|---|---|
| **Asymptote** | C++ | PRC/SVG | ✅ 최고 | ❌ |
| **MathBox** | JS | WebGL | ✅ 프레젠테이션 | ❌ |
| **MathLikeAnim-rs** | Rust | Canvas/SVG | ✅ Manim 스타일 | ✅ |
| **Three.js** | JS | WebGL | ✅ 범용 | ❌ |

### 권장: **Asymptote** (정적 출판) + **MathLikeAnim-rs** (웹/WASM)

**Asymptote**는 3D에서도 최고 품질입니다. **3D PRC 출력**을 지원하며, TeX를 3차원으로 확장한 최초의 소프트웨어입니다. 교과서 PDF에 삽입할 3D 도형은 Asymptote가 정답입니다.

**MathLikeAnim-rs**는 Rust로 작성되어 **WebAssembly로 컴파일**된 라이브러리로, Manim에서 영감을 받았지만 **인터랙티브**를 지원합니다. **3D 렌더링, 수식 렌더링, 함수 플로팅**을 모두 지원하며, `@mathlikeanim-rs/renderer` 패키지로 Node.js/브라우저에서 사용할 수 있습니다.

```js
// logos/backend/mathlikeanim.js (개념)
import initWasm from '@mathlikeanim-rs/mathlikeanim-rs';
import { SVGScene } from '@mathlikeanim-rs/renderer';

export async function compileToMathLikeAnim(ir) {
  await initWasm();
  const scene = new SVGScene(ir.width, ir.height);
  for (const item of ir.items) {
    scene.add(convertToMathLikeAnim(item));
  }
  return scene.render();
}
```

---

## 📄 4계층: 출력 (Output Layer)

### TikZ (LaTeX 원고용)

**node-tikzjax**는 **순수 Node.js와 WebAssembly**로 TikZ 코드를 SVG로 렌더링합니다. LaTeX 툴체인 설치 없이 **pgfplots, tikz-cd, circuitikz, chemfig** 등 주요 패키지를 사용할 수 있습니다.

```js
import tex2svg from 'node-tikzjax';
const svg = await tex2svg(`
\\begin{document}
\\begin{tikzpicture}
\\draw (0,0) circle (1in);
\\end{tikzpicture}
\\end{document}
`);
```

**주의**: 한 번에 하나의 인스턴스만 실행해야 합니다.

### PDF (출판용)

Asymptote의 **PDF 출력**을 사용하거나, TikZ 코드를 `pdflatex`로 컴파일합니다. `logos`가 TikZ/Asymptote 소스를 생성하고, 사용자가 선택적으로 컴파일하는 방식입니다.

---

## 🎯 최종 추천 스택

| 계층 | 1순위 | 2순위 | 이유 |
|---|---|---|---|
| **심볼릭** | **SageMath** (MCP) | SymPy | 37개 도구, LaTeX 양방향, 100+ 패키지 |
| **2D 기하** | **Asymptote** | JSXGraph | 출판 품질 LaTeX 조판, 3D까지 확장 |
| **3D** | **Asymptote** | MathLikeAnim-rs | 3D PRC, TeX의 3차원 확장 |
| **LaTeX/TikZ** | **node-tikzjax** | — | WASM, 툴체인 불필요 |
| **수식 조판** | **KaTeX** | MathJax | 빠르고 가벼움 |

### 왜 이 조합인가

1. **SageMath**가 심볼릭의 90%를 담당한다. 미분·적분·극한·급수·방정식·정수론·군론·그래프 이론까지 모두 커버하며, LaTeX 출력이 기본이다.
2. **Asymptote**가 2D와 3D를 모두 담당한다. LaTeX로 라벨을 조판하므로 **출판사 원고에 바로 삽입**할 수 있다.
3. **node-tikzjax**가 LaTeX 원고용 TikZ 출력을 담당한다. 사용자가 LaTeX 원고를 쓴다면 TikZ 코드를 그대로 삽입할 수 있다.
4. **JSXGraph**는 인터랙티브 웹 출력이 필요할 때만 추가한다.

---

## 🔌 Node.js 연동 요약

| 엔진 | 연동 방식 | 지연 | 비고 |
|---|---|---|---|
| SageMath | MCP / REST / subprocess | 중 | 세션 유지 가능 |
| SymPy | subprocess / Pyodide | 낮음 | Pyodide는 WASM |
| Asymptote | CLI (`asy -f svg`) | 중 | CLI 설치 필요 |
| node-tikzjax | npm import | 낮음 | WASM, 설치 불필요 |
| MathLikeAnim-rs | npm import | 낮음 | WASM |
| JSXGraph | npm import | 낮음 | 순수 JS |

---

## 💎 결론

**"외부 언어를 써도 좋다"** 는 조건이 주어졌으므로, 가장 폭넓은 커버리지를 원한다면:

- **심볼릭**: **SageMath** (Python) — 37개 도구, LaTeX 양방향
- **2D/3D 도형**: **Asymptote** (C++) — 출판 품질, LaTeX 조판
- **LaTeX 원고 출력**: **node-tikzjax** (WASM) — 툴체인 불필요
- **인터랙티브 웹**: **JSXGraph** (JS) — 선택적

이 4개를 `logos`의 IR 뒤에 어댑터로 배치하면, 사용자는 여전히 `circle.center(O).radius(3)` 같은 JS 코드만 쓰면서도 **SageMath의 심볼릭 연산, Asymptote의 출판 품질, TikZ의 LaTeX 호환**을 모두 누릴 수 있습니다.