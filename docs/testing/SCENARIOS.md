# `logos` SVG 출력 테스트 시나리오

> 목표: SVG 백엔드가 **모든 도형 · 좌표계 · 주석 · 심볼릭 · 스타일 · 엣지 케이스**를 커버하는지 검증한다.
> 각 시나리오는 ① 클라이언트 코드, ② 검증 대상, ③ 통과 기준으로 구성된다.

---

## A. 기본 프리미티브

### A1. 점 하나

```js
scene().axes().grid(1).add(point(1, 2).label('A').dot()).compile().toSVG();
```

**검증**: `<circle>` + `<text>` 생성, 좌표 변환 정확성.
**통과 기준**: 점 중심 픽셀이 view 행렬과 일치. 라벨이 점 오른쪽 위로 오프셋.

### A2. 수직선 · 수평선

```js
scene().axes().add(line.vertical(2), line.horizontal(-1)).compile().toSVG();
```

**검증**: 뷰 경계 클리핑.
**통과 기준**: 선이 viewBox 밖으로 나가지 않음. `<line>`의 양 끝점이 경계와 교차하는 지점.

### A3. 원 하나

```js
scene()
  .equal()
  .axes()
  .add(circle.center(point(0, 0)).radius(3))
  .compile()
  .toSVG();
```

**검증**: `equal()` 하에서 원이 **진짜 원**인지.
**통과 기준**: SVG의 `<circle>`이 사용되거나, `<ellipse>`라면 rx === ry.

### A4. 여러 스타일

```js
scene()
  .axes()
  .add(
    point(0, 0).dot().color('#e11'),
    point(1, 1).dot().color('#0a0').stroke(3),
    point(2, 2).dot().color('#00f').dash([2, 2]), // 점에는 dash 무시
    point(3, 3).dot().opacity(0.4),
  )
  .compile()
  .toSVG();
```

**검증**: 스타일이 SVG 속성으로 정확히 매핑되는지.
**통과 기준**: `fill`, `stroke`, `stroke-width`, `opacity` 각각 매핑.

---

## B. 곡선

### B1. 함수 그래프

```js
const f = curve.fn((x) => x * x).on([-3, 3]);
scene().view([-3, 3], [-1, 9]).axes().add(f.color('crimson').stroke(2)).compile().toSVG();
```

**검증**: adaptive sampling, path 부드러움.
**통과 기준**: `<path d="M... L... L...">` 생성. 샘플 간격이 곡률에 반비례.

### B2. 파라메트릭 (원)

```js
scene()
  .equal()
  .add(curve.parametric((t) => [Math.cos(t), Math.sin(t)]).on([0, 2 * Math.PI]))
  .compile()
  .toSVG();
```

**검증**: 폐곡선이 이어지는지.
**통과 기준**: 시작점과 끝점이 같은 픽셀 (오차 ≤ 0.5px).

### B3. 극좌표 장미

```js
scene()
  .equal()
  .polarGrid()
  .add(curve.polar((θ) => Math.cos(3 * θ)).on([0, Math.PI]))
  .compile()
  .toSVG();
```

**검증**: 극좌표 → 데카르트 변환 정확성.
**통과 기준**: 3개의 꽃잎이 대칭. 각 꽃잎의 최대 반지름 = 1.

### B4. 불연속 함수

```js
scene()
  .view([-5, 5], [-2, 2])
  .axes()
  .add(curve.fn((x) => 1 / x).on([-5, 5]))
  .compile()
  .toSVG();
```

**검증**: 불연속점에서 path가 끊기는지.
**통과 기준**: x=0 근처에서 `<path>`에 `M` 명령이 새로 시작 (선이 점프하지 않음).

### B5. 음함수 곡선

```js
scene()
  .equal()
  .add(curve.implicit((x, y) => x * x + y * y - 1))
  .compile()
  .toSVG();
```

**검증**: 마칭 스퀘어(marching squares) 또는 contour 추출.
**통과 기준**: 닫힌 곡선이 생성됨. 반지름 ≈ 1.

### B6. 여러 곡선 겹치기

```js
scene()
  .view([-2 * Math.PI, 2 * Math.PI], [-1.5, 1.5])
  .axes()
  .add(
    curve
      .fn(Math.sin)
      .on([-2 * Math.PI, 2 * Math.PI])
      .color('crimson'),
    curve
      .fn(Math.cos)
      .on([-2 * Math.PI, 2 * Math.PI])
      .color('steelblue'),
  )
  .compile()
  .toSVG();
```

**검증**: z-order, 색상 구분.
**통과 기준**: 나중에 add한 것이 위에 렌더.

---

## C. 원뿔곡선

### C1. 타원

```js
scene()
  .equal()
  .axes()
  .add(ellipse.center(point(0, 0)).semi(3, 2))
  .compile()
  .toSVG();
```

**검증**: `<ellipse>` 또는 `<path>` 정확성.
**통과 기준**: 장축 3, 단축 2, 중심 (0,0).

### C2. 포물선 + 초점 + 준선

```js
const F = point(0, 1).dot().label('F');
const d = line.horizontal(-1).color('#888');
const P = parabola.focus(F).directrix(d);

scene().equal().axes().add(P.color('crimson').stroke(2), F, d, point(0, 0).dot().label('V')).compile().toSVG();
```

**검증**: 초점·준선이 도형과 정확히 일치.
**통과 기준**: 포물선 위 임의의 점에서 초점까지 거리 == 준선까지 거리.

### C3. 쌍곡선 + 점근선

```js
scene()
  .equal()
  .axes()
  .add(
    hyperbola.center(point(0, 0)).semi(3, 2).color('steelblue').stroke(2),
    line
      .slopeIntercept(2 / 3, 0)
      .dash([4, 3])
      .color('#aaa'),
    line
      .slopeIntercept(-2 / 3, 0)
      .dash([4, 3])
      .color('#aaa'),
  )
  .compile()
  .toSVG();
```

**검증**: 두 branch가 모두 그려지는지.
**통과 기준**: 좌우 두 개의 곡선. 점근선과의 거리 → 0.

---

## D. 다각형 · 영역

### D1. 삼각형 + 채우기

```js
const A = point(0, 0),
  B = point(4, 0),
  C = point(1, 3);
scene()
  .equal()
  .axes()
  .add(triangle(A, B, C).fill('#eef3ff').stroke(2).color('#334'), A, B, C)
  .compile()
  .toSVG();
```

**검증**: 닫힌 path, fill-rule.
**통과 기준**: `<path d="M... L... L... Z">`, `fill` 속성 적용.

### D2. 정육각형

```js
scene()
  .equal()
  .add(regular.polygon(point(0, 0), 6, 1))
  .compile()
  .toSVG();
```

**검증**: 6개 꼭짓점이 정확히 원 위에 있는지.
**통과 기준**: 각 꼭짓점의 원점까지 거리 = 1.

### D3. 리만합

```js
const f = (x) => x * x;
scene()
  .view([-0.5, 2.5], [-0.5, 5])
  .axes()
  .add(
    curve.fn(f).on([0, 2]).color('crimson').stroke(2),
    region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.4),
  )
  .compile()
  .toSVG();
```

**검증**: 8개의 사각형, left rule (왼쪽 끝값).
**통과 기준**: 각 사각형의 높이가 f(x_i)와 일치. 8개 path.

### D4. 영역 교집합

```js
const c1 = circle.center(point(-0.5, 0)).radius(1);
const c2 = circle.center(point(0.5, 0)).radius(1);
scene()
  .equal()
  .add(
    region.intersect(region.inside(c1), region.inside(c2)).fill('steelblue').opacity(0.4),
    c1.stroke(1.5),
    c2.stroke(1.5),
  )
  .compile()
  .toSVG();
```

**검증**: 두 원의 교집합(렌즈 모양).
**통과 기준**: 채워진 영역이 렌즈 모양, 경계가 두 원호.

---

## E. 3D → 2D 투영

### E1. 구 + 평면

```js
const S = sphere
  .center(point(0, 0, 0))
  .radius(1)
  .opacity(0.25);
const P = plane.coordinate('xy').opacity(0.4);
scene()
  .dim(3)
  .camera({ position: [3, 3, 2], projection: 'orthographic' })
  .add(S, P)
  .compile()
  .toSVG();
```

**검증**: 정사영, hidden-line removal.
**통과 기준**: 구 뒤쪽의 위도선이 안 보임. 평면이 구를 가로지름.

### E2. 원기둥 + 원뿔

```js
scene()
  .dim(3)
  .camera({ position: [5, -5, 3] })
  .add(
    cylinder
      .center(point(0, 0, 0))
      .axis(vector(0, 0, 1))
      .radius(1)
      .height(2),
    cone
      .vertex(point(2, 0, 1))
      .axis(vector(0, 0, -1))
      .radius(0.5)
      .height(2),
  )
  .compile()
  .toSVG();
```

**검증**: 실루엣 라인 강조, 음영.
**통과 기준**: 각 도형의 윤곽선이 부드러운 곡선. 뒤쪽 모서리 가려짐.

### E3. 회전체

```js
scene()
  .dim(3)
  .camera({ position: [6, -6, 4] })
  .add(
    surface
      .revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4]))
      .about(line.horizontal(0))
      .opacity(0.8)
      .color('#93c5fd'),
  )
  .compile()
  .toSVG();
```

**검증**: 회전면의 와이어프레임 + 채우기.
**통과 기준**: 측면 실루엣이 매끄러움. 앞뒤 구분되는 음영.

### E4. 다면체

```js
scene()
  .dim(3)
  .camera({ position: [3, 3, 3] })
  .add(polyhedron.platonic('dodeca').circumradius(1))
  .compile()
  .toSVG();
```

**검증**: 12개 오각형 면, 20개 꼭짓점.
**통과 기준**: 오일러 공식 V - E + F = 2 (V=20, E=30, F=12).

---

## F. 좌표계

### F1. 극좌표 격자

```js
scene()
  .equal()
  .polarGrid()
  .add(curve.polar((θ) => 1 + Math.cos(θ)).on([0, 2 * Math.PI]))
  .compile()
  .toSVG();
```

**검증**: 극좌표 격자 (동심원 + 방사선).
**통과 기준**: 반지름 1, 2, 3... 원. 30° 또는 45° 방사선.

### F2. 구면 격자

```js
scene()
  .dim(3)
  .sphericalGrid()
  .camera({ position: [5, 5, 5] })
  .compile()
  .toSVG();
```

**검증**: 위선 + 경선.
**통과 기준**: 적도, 회귀선, 극점 표시.

### F3. 복소평면

```js
scene()
  .equal()
  .axes({ label: 'Re, Im' })
  .add(point.complex(3, -4).dot().label('$3-4i$'), line.through(point.origin(), point.complex(3, -4)).color('#888'))
  .compile()
  .toSVG();
```

**검증**: 복소수를 데카르트로 매핑.
**통과 기준**: (3, -4)에 점. 라벨이 `$3-4i$`로 조판.

---

## G. 주석

### G1. 각도 (일반 + 직각 + 다중 호)

```js
const A = point(0, 0),
  B = point(4, 0),
  C = point(1, 3);
scene()
  .equal()
  .add(
    triangle(A, B, C),
    annotate.angle(A, B, C).arc({ radius: 30 }).label('α').degrees(),
    annotate.angle(B, C, A).arc({ radius: 30, double: true }).label('β'),
    annotate.angle(C, A, B).rightAngle(), // 실제로 직각이 아니면 경고
  )
  .compile()
  .toSVG();
```

**검증**: 호, 이중 호, 직각 표시.
**통과 기준**: 세 각의 호가 서로 겹치지 않음.

### G2. 치수선

```js
scene()
  .equal()
  .add(
    segment(point(0, 0), point(4, 0)),
    annotate.dimension(point(0, 0), point(4, 0)).offset(0.6).label('4').units('cm'), // world 단위
  )
  .compile()
  .toSVG();
```

**검증**: 치수선, 화살촉, 텍스트 배치.
**통과 기준**: 치수선이 선분과 평행. 화살촉이 양 끝에.

### G3. 합동 tick

```js
const A = point(0, 0),
  B = point(2, 0),
  C = point(1, 1.7);
scene()
  .equal()
  .add(
    triangle(A, B, C),
    annotate.tick(segment(A, B)).count(2),
    annotate.tick(segment(B, C)).count(2),
    annotate.tick(segment(C, A)).count(3),
  )
  .compile()
  .toSVG();
```

**검증**: tick 개수, 변에 수직.
**통과 기준**: AB와 BC에 2개씩, CA에 3개.

### G4. 정적분

```js
const f = tex`x^{2}`;
scene()
  .view([-0.5, 3], [-0.5, 10])
  .equal()
  .axes()
  .add(
    curve.fn(f).on([-0.5, 3]).color('crimson'),
    annotate
      .integral(f)
      .from(0)
      .to(2)
      .shade('steelblue')
      .label(tex`\int_0^2 x^2\,dx = \tfrac{8}{3}`),
  )
  .compile()
  .toSVG();
```

**검증**: 음영 영역 + KaTeX 조판.
**통과 기준**: 영역이 곡선 아래, x축 위. 라벨이 수식으로 렌더.

### G5. 화살표 + 라벨

```js
scene()
  .equal()
  .add(
    annotate.arrow(point(0, 0), point(2, 1)).label('v'),
    annotate.arrow(point(0, 0), point(1, 2)).label('w').color('crimson'),
  )
  .compile()
  .toSVG();
```

**검증**: 화살촉 스타일 (Stealth).
**통과 기준**: 화살촉이 삼각형이 아닌 Stealth 모양. 라벨이 화살표 중앙 위.

---

## H. 심볼릭 · LaTeX

### H1. 수식 라벨

```js
scene()
  .equal()
  .axes()
  .add(
    curve
      .fn(tex`\sin(x)`)
      .on([-Math.PI, Math.PI])
      .label(tex`f(x) = \sin x`),
  )
  .compile()
  .toSVG();
```

**검증**: KaTeX 조판, baseline 정렬.
**통과 기준**: 라벨이 `<foreignObject>` 안에 KaTeX HTML로 삽입.

### H2. 심볼릭 접선

```js
const f = tex`x^{2} - 1`;
const df = f.diff('x').simplify();
const F = curve.fn(f).on([-3, 3]);
const T = line.tangent(F).at(1).dash([5, 3]);

scene()
  .view([-3, 4], [-2, 9])
  .equal()
  .axes()
  .add(
    F.label(tex`f(x) = x^2 - 1`),
    T.label(tex`f'(x) = ${df.toLatex()}`),
    point(1, 0)
      .dot()
      .label(tex`(1, 0)`),
  )
  .compile()
  .toSVG();
```

**검증**: 심볼릭 미분 결과가 라벨에 반영.
**통과 기준**: 라벨에 `2x` 표시.

### H3. 복잡한 수식

```js
scene()
  .equal()
  .add(annotate.caption(tex`\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}`))
  .compile()
  .toSVG();
```

**검증**: 급수, 분수, 그리스 문자.
**통과 기준**: KaTeX가 오류 없이 렌더. `<mfrac>` 등 MathML 대응.

---

## I. 스타일 · 렌더링

### I1. Dash 패턴

```js
scene()
  .axes()
  .add(
    line.horizontal(0).dash([5, 3]),
    line.horizontal(1).dash([2, 2]),
    line.horizontal(2).dash([10, 5, 2, 5]),
    line.horizontal(3).dash(1), // 점선
  )
  .compile()
  .toSVG();
```

**검증**: `stroke-dasharray` 매핑.
**통과 기준**: 각 선의 dash 패턴이 정확.

### I2. 투명도

```js
scene()
  .equal()
  .add(
    circle.center(point(0, 0)).radius(1).fill('red').opacity(0.5),
    circle.center(point(1, 0)).radius(1).fill('blue').opacity(0.5),
  )
  .compile()
  .toSVG();
```

**검증**: 겹친 영역의 색상.
**통과 기준**: 겹친 부분이 보라색 (red + blue, alpha 0.5).

### I3. 그라디언트

```js
scene()
  .equal()
  .add(
    circle
      .center(point(0, 0))
      .radius(1)
      .gradient({
        type: 'radial',
        stops: [
          { offset: 0, color: '#fff' },
          { offset: 1, color: '#3b82f6' },
        ],
      }),
  )
  .compile()
  .toSVG();
```

**검증**: `<radialGradient>` 생성.
**통과 기준**: 중심 흰색 → 가장자리 파랑.

### I4. z-order

```js
scene()
  .equal()
  .add(
    circle.center(point(0, 0)).radius(1).fill('red').z(1),
    circle.center(point(0.5, 0)).radius(1).fill('blue').z(3),
    circle.center(point(1, 0)).radius(1).fill('green').z(2),
  )
  .compile()
  .toSVG();
```

**검증**: z 값 순서대로 렌더.
**통과 기준**: DOM 순서가 z=1, z=2, z=3.

### I5. 클리핑

```js
scene()
  .equal()
  .add(
    curve
      .fn((x) => Math.tan(x))
      .on([-5, 5])
      .clip(region.between(line.horizontal(-2), line.horizontal(2))),
  )
  .compile()
  .toSVG();
```

**검증**: `<clipPath>` 생성.
**통과 기준**: tan 곡선이 y ∈ [-2, 2] 밖으로 나가지 않음.

---

## J. 엣지 케이스

### J1. 빈 씬

```js
scene().compile().toSVG();
```

**검증**: 크래시 없이 빈 SVG.
**통과 기준**: `<svg>` 태그만 있는 문자열.

### J2. 극단적으로 좁은 view

```js
scene().view([0, 1e-6], [0, 1e-6]).add(point(5e-7, 5e-7)).compile().toSVG();
```

**검증**: 부동소수점 정밀도.
**통과 기준**: 점이 중앙에.

### J3. 극단적으로 넓은 view

```js
scene()
  .view([-1e6, 1e6], [-1e6, 1e6])
  .add(circle.center(point(0, 0)).radius(1e5))
  .compile()
  .toSVG();
```

**검증**: 큰 좌표에서도 path 정확.
**통과 기준**: 원이 화면의 1/10 크기.

### J4. 축퇴 도형

```js
scene()
  .axes()
  .add(
    segment(point(0, 0), point(0, 0)), // 길이 0
    circle.center(point(0, 0)).radius(0), // 반지름 0
    triangle(point(0, 0), point(1, 0), point(2, 0)), // 일직선
  )
  .compile()
  .toSVG();
```

**검증**: 크래시 없이 처리.
**통과 기준**: 빈 path 또는 점. 경고 로그.

### J5. 유니코드 라벨

```js
scene()
  .axes()
  .add(point(0, 0).dot().label('α'), point(1, 0).dot().label('점 A'), point(2, 0).dot().label('$\\alpha\\beta\\gamma$'))
  .compile()
  .toSVG();
```

**검증**: 한글, 그리스 문자, LaTeX.
**통과 기준**: 폰트 폴백 체인이 작동.

### J6. 매우 많은 요소

```js
const pts = Array.from({ length: 1000 }, (_, i) =>
  point(Math.cos(i * 0.1) * i * 0.01, Math.sin(i * 0.1) * i * 0.01).dot(),
);
scene().equal().addAll(pts).compile().toSVG();
```

**검증**: 성능, 문자열 크기.
**통과 기준**: 1초 내 생성, SVG 크기 < 500KB.

---

## K. 통합 (교과서 실전)

### K1. 삼각형 내심 (중학교)

```js
const A = point(0, 0),
  B = point(5, 0),
  C = point(1.5, 4);
const tri = triangle(A, B, C).fill('#eef3ff').stroke(2);
scene()
  .equal()
  .axes()
  .theme('textbook')
  .add(
    tri,
    A,
    B,
    C,
    circle.inscribed(tri).color('#e11').dash([4, 3]),
    segment(A, point.incenter(tri)).dash([2, 2]).color('#888'),
    annotate.angle(A, B, C).arc().degrees().label('α'),
    annotate.tick(segment(A, B)).count(2),
    annotate.tick(segment(B, C)).count(2),
  )
  .compile()
  .toSVG();
```

**검증**: 모든 요소가 겹치지 않고 배치.
**통과 기준**: 각도, tick, 내접원이 서로 간섭 없음.

### K2. 원과 접선 (고등학교)

```js
const O = point.origin(),
  P = point(5, 0);
const C = circle.center(O).radius(3);
const T = point.intersect(C, line.tangent(C).at(P));

scene()
  .view([-4, 6], [-4, 4])
  .equal()
  .axes()
  .theme('textbook')
  .add(
    C.stroke(2),
    O,
    P,
    T,
    line.through(P, T).color('#c00'),
    segment(O, T).dash([3, 3]).color('#888'),
    annotate.angle(O, T, P).rightAngle(),
    annotate
      .dimension(O, P)
      .label(tex`5`)
      .units('cm'),
    annotate.caption(tex`OT \perp PT`),
  )
  .compile()
  .toSVG();
```

**검증**: 교점 T의 정확성, 직각 표시.
**통과 기준**: OT ⊥ PT. 직각 표시가 T에.

### K3. 회전체 (3D 미적분)

```js
scene()
  .dim(3)
  .camera({ position: [6, -6, 4] })
  .theme('textbook')
  .add(
    surface
      .revolution(curve.fn(tex`\sqrt{x}`).on([0, 4]))
      .about(line.horizontal(0))
      .opacity(0.85)
      .color('#93c5fd'),
    curve
      .fn(tex`\sqrt{x}`)
      .on([0, 4])
      .color('crimson')
      .stroke(2),
    annotate.caption(tex`V = \pi \int_0^4 x\,dx = 8\pi`),
  )
  .compile()
  .toSVG();
```

**검증**: 3D 곡면 + 2D 곡선 혼합.
**통과 기준**: 회전면 뒤에 곡선이 가려짐. 라벨은 항상 앞.

### K4. 극좌표 장미 + 심볼릭

```js
scene()
  .equal()
  .polarGrid()
  .theme('textbook')
  .add(
    curve
      .polar((θ) => Math.cos(3 * θ))
      .on([0, Math.PI])
      .stroke(1.8)
      .color('#3b82f6')
      .label(tex`r = \cos 3\theta`),
  )
  .compile()
  .toSVG();
```

**검증**: 극좌표 곡선 + LaTeX 라벨.
**통과 기준**: 3개 꽃잎, 라벨이 오른쪽 위.

### K5. 미적분 종합

```js
const f = tex`x^{2} - 1`;
const df = f.diff('x').simplify();
const F = curve.fn(f).on([-3, 3]);

scene()
  .view([-3, 4], [-2, 9])
  .equal()
  .axes()
  .grid({ step: 1, minor: 0.5 })
  .theme('textbook')
  .add(
    F.color('crimson')
      .stroke(2)
      .label(tex`f(x) = ${f.toLatex()}`),
    line.tangent(F).at(1).dash([5, 3]).color('#666'),
    point(1, 0)
      .dot()
      .label(tex`(1, 0)`),
    region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.35),
    annotate
      .integral(f)
      .from(0)
      .to(2)
      .label(tex`\int_0^2 f\,dx = \tfrac{2}{3}`),
    annotate.caption(tex`f'(x) = ${df.toLatex()}`),
  )
  .compile()
  .toSVG();
```

**검증**: 심볼릭 · 도형 · 주석 · KaTeX 모두 통합.
**통과 기준**: 라벨에 `2x` (미분 결과) 반영.

---

## L. 회귀 테스트 (골든 파일)

각 시나리오는 `test/fixtures/`에 다음 3개 파일로 저장한다.

```
test/fixtures/
  K2-circle-tangent.logos.js     # 입력
  K2-circle-tangent.svg          # 기대 출력 (스냅샷)
  K2-circle-tangent.json         # IR 덤프 (디버깅용)
```

CI는 `toSVG()` 결과를 `K2-circle-tangent.svg`와 문자열 비교. 의도적 변경이면 `npm run snap:update`.

**시각 회귀**는 별도로 `test/visual/`에서 PNG로 렌더 후 사람이 눈으로 확인. v0.1은 자동 diff 없이 스크린샷만 저장.

---

## M. 통과 기준 요약

| 카테고리       | 시나리오 수 | 핵심 검증                    |
| -------------- | ----------- | ---------------------------- |
| A. 기본        | 4           | 좌표 변환, 스타일 매핑       |
| B. 곡선        | 6           | 샘플링, 불연속, 폐곡선       |
| C. 원뿔곡선    | 3           | 초점·준선·점근선             |
| D. 다각형·영역 | 4           | path, fill-rule, 교집합      |
| E. 3D          | 4           | 투영, hidden-line, 다면체    |
| F. 좌표계      | 3           | 극·구면·복소                 |
| G. 주석        | 5           | 각도·치수·tick·적분          |
| H. 심볼릭      | 3           | KaTeX, 미분 반영             |
| I. 스타일      | 5           | dash·opacity·gradient·z·clip |
| J. 엣지        | 6           | 빈 씬, 극단 view, 유니코드   |
| K. 통합        | 5           | 실제 교과서 그림             |
| **합계**       | **48**      |                              |

---

## N. 우선순위

**v0.1 필수**: A1–A4, B1–B3, C1, D1–D3, F1, G1–G4, H1–H2, I1–I2, I4, J1, J5, K1–K2, K5 (약 25개)

**v0.2 이후**: B4–B6, C2–C3, D4, E1–E4, F2–F3, G5, H3, I3, I5, J2–J4, J6, K3–K4 (약 23개)

---

## O. 실행 스크립트

```bash
npm run test:svg            # 48개 시나리오 모두 실행
npm run test:svg -- K2      # K2만
npm run snap:update         # 스냅샷 갱신
npm run test:visual         # PNG 생성 후 브라우저 열기
```

`test/visual/index.html`은 48개 SVG를 한 페이지에 나열한다. 이 페이지가 **품질 체크리스트**이자 **마케팅 자료**가 된다.

---

이 48개 시나리오가 모두 통과하면, `logos`의 SVG 백엔드는 **교과서에 바로 쓸 수 있는 수준**이라고 말할 수 있다. 각 시나리오는 독립적이므로, 하나씩 구현하면서 진행 상황을 눈으로 확인할 수 있다.
