# 수학 원서에 자주 나오는 50개 시나리오

> 각 항목: ① 원서 예시, ② 클라이언트 코드, ③ 검증 포인트.
> 이 50개가 통과하면 "실제 교과서를 그릴 수 있다"고 말할 수 있다.

---

## A. 미적분 — 함수와 극한 (1–8)

**1. 함수 그래프 + 정의역 표시**
_Stewart Calculus, §1.1_

```js
curve
  .fn((x) => x * x - 1)
  .on([-3, 3])
  .label(tex`f(x) = x^2 - 1`);
```

✅ 정의역 [-3,3] 정확. 라벨이 오른쪽 끝.

**2. 수직점근선 + 극한**
_Stewart §2.2_

```js
(curve.fn((x) => 1 / (x - 1)).on([-3, 4]),
  line.vertical(1).dash([4, 3]).color('#888'),
  annotate.caption(tex`\lim_{x \to 1} \frac{1}{x-1} = \infty`));
```

✅ x=1에서 path 끊김. 점근선이 파선.

**3. ε-δ 극한**
_Spivak Calculus, Ch.5_

```js
scene()
  .view([1.5, 3.5], [3, 5])
  .equal()
  .add(
    curve.fn((x) => x * x).on([1.5, 3.5]),
    region
      .between(line.horizontal(4 - 0.5), line.horizontal(4 + 0.5))
      .on([0, 3.5])
      .fill('steelblue')
      .opacity(0.2),
    region
      .between(line.vertical(2 - 0.3), line.vertical(2 + 0.3))
      .fill('crimson')
      .opacity(0.2),
    annotate.dimension(point(1.7, 0), point(2.3, 0)).label(tex`2\delta`),
  );
```

✅ 띠 두 개 (가로 ε, 세로 δ). 중첩 정확.

**4. 좌·우극한 비교**
_Stewart §2.2, Example 7_

```js
curve.fn(x => Math.abs(x)/x).on([-2, 0]),   // y=-1
curve.fn(x => Math.abs(x)/x).on([0, 2]),    // y=+1
point(0, 1).dot({ open: true }).label(tex`1`),
point(0, -1).dot({ open: true }).label(tex`-1`),
```

✅ x=0에서 열린 점 두 개. path 두 개.

**5. 샌드위치 정리**
_Stewart §2.3_

```js
curve.fn(x => x*x).on([-1, 1]).color('#c00'),
curve.fn(x => -x*x).on([-1, 1]).color('#c00'),
curve.fn(x => x*x*Math.sin(1/x)).on([-1, 1]).color('steelblue'),
```

✅ 위·아래 곡선이 가운데 곡선을 감쌈. x→0에서 셋 다 0.

**6. 연속/불연속 분류**
_Stewart §2.5_

```js
// removable
curve.fn(x => (x*x-1)/(x-1)).on([0, 2]),
point(1, 2).dot({ open: true }),
// jump
curve.fn(x => x < 0 ? -1 : 1).on([-2, 2]),
```

✅ 첫째: 열린 점 하나. 둘째: 수직 점프.

**7. 중간값 정리**
_Stewart §2.5, Fig 12_

```js
curve.fn(x => x*x*x - x - 1).on([1, 2]).color('crimson'),
line.horizontal(0).color('#333'),
point(1, -1).dot(), point(2, 5).dot(),
region.between(line.horizontal(0), curve.fn(...)).on([1.32, 1.33]),
```

✅ 곡선이 x축과 교차. 교점이 (≈1.3247, 0).

**8. 미분계수 (할선 → 접선)**
_Stewart §2.7_

```js
const F = curve.fn((x) => x * x).on([-0.5, 3]);
(line.through(point(1, 1), point(2, 4)).dash([3, 3]).color('#888'),
  line.tangent(F).at(1).color('crimson'),
  annotate.caption(tex`f'(1) = \lim_{h \to 0} \frac{(1+h)^2 - 1}{h} = 2`));
```

✅ 할선과 접선의 기울기 차이. x=1에서 접선 기울기 2.

---

## B. 미적분 — 적분 (9–16)

**9. 리만합 (left/right/midpoint)**
_Stewart §5.2_

```js
region.riemann(x => x*x).on([0, 2]).n(8).left().fill('steelblue').opacity(0.4),
region.riemann(x => x*x).on([0, 2]).n(8).right().fill('crimson').opacity(0.3),
```

✅ 사각형 8개. left는 왼쪽 값, right는 오른쪽 값 높이.

**10. 정적분 영역**
_Stewart §5.3_

```js
curve.fn(x => Math.sin(x)).on([0, Math.PI]).color('crimson'),
region.below(curve.fn(Math.sin).on([0, Math.PI])).fill('steelblue').opacity(0.4),
annotate.integral(tex`\sin x`).from(0).to(Math.PI).label(tex`2`),
```

✅ 영역이 곡선 아래. 라벨 = 2.

**11. 두 곡선 사이 영역**
_Stewart §6.1, Example 1_

```js
const F = curve.fn((x) => x).on([0, 1]),
  G = curve.fn((x) => x * x).on([0, 1]);
(region.between(F, G).on([0, 1]).fill('steelblue').opacity(0.4),
  annotate.caption(tex`A = \int_0^1 (x - x^2)\,dx = \tfrac{1}{6}`));
```

✅ 교점 (0,0), (1,1). 영역 = 1/6.

**12. 회전체 (disk method)**
_Stewart §6.2_

```js
(surface
  .revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4]))
  .about(line.horizontal(0))
  .opacity(0.8),
  annotate.caption(tex`V = \pi \int_0^4 x\,dx = 8\pi`));
```

✅ 회전축이 x축. 곡면 실루엣 매끄러움.

**13. 회전체 (washer method)**
_Stewart §6.2, Example 4_

```js
surface.revolution(curve.fn(x => x).on([0, 1]))
  .about(line.horizontal(0)),
surface.revolution(curve.fn(x => x*x).on([0, 1]))
  .about(line.horizontal(0)),
// 두 곡면 사이가 washer
```

✅ 안쪽 곡면과 바깥쪽 곡면. 사이 공간.

**14. 호 길이**
_Stewart §8.1_

```js
(curve
  .fn((x) => x * x)
  .on([0, 1])
  .stroke(2),
  annotate.caption(tex`L = \int_0^1 \sqrt{1 + 4x^2}\,dx \approx 1.4789`));
```

✅ 곡선 길이 수치. 심볼릭 적분 결과와 비교.

**15. 이상적분**
_Stewart §7.8_

```js
(curve
  .fn((x) => 1 / (x * x))
  .on([1, 10])
  .color('crimson'),
  region
    .below(curve.fn((x) => 1 / (x * x)).on([1, 10]))
    .fill('steelblue')
    .opacity(0.4),
  annotate.caption(tex`\int_1^\infty \frac{1}{x^2}\,dx = 1`));
```

✅ 유한 영역 (무한대인데 넓이 1). x=10에서 잘림 표시.

**16. 급수의 부분합**
_Stewart §11.2_

```js
Array.from({length: 10}, (_, n) =>
  point(n+1, partialSum(1/(n*n), n)).dot()
),
line.horizontal(Math.PI**2/6).dash([4,3]).label(tex`\pi^2/6`),
```

✅ 점 10개가 위로 수렴. 점근선이 π²/6.

---

## C. 기하 — 삼각형 (17–24)

**17. 삼각형 + 내접원 + 내심**
_Serra Geometry, Ch.4_

```js
triangle(A, B, C).fill('#eef3ff').stroke(2),
circle.inscribed(tri).color('#e11').dash([4,3]),
point.incenter(tri).dot().label('I'),
```

✅ 내심이 내접원 중심. 원이 세 변에 접함.

**18. 외접원 + 외심**
_Serra Ch.4_

```js
circle.through(A, B, C).color('steelblue').dash([4,3]),
point.circumcenter(A, B, C).dot().label('O'),
segment(O, A).dash([2,2]),
```

✅ 외심에서 세 꼭짓점 거리 동일. OA = OB = OC.

**19. 무게중심 + 중선**
_Serra Ch.4_

```js
point.centroid(A, B, C).dot().label('G'),
segment(A, point.midpoint(B, C)).color('#888'),
segment(B, point.midpoint(A, C)).color('#888'),
segment(C, point.midpoint(A, B)).color('#888'),
```

✅ 세 중선이 G에서 만남. AG:GM = 2:1.

**20. 수심 + 수선**
_Serra Ch.4_

```js
point.orthocenter(A, B, C).dot().label('H'),
segment(A, point.foot(A).onto(line.through(B, C))).dash([2,2]),
```

✅ 세 수선이 H에서 만남.

**21. 오심 일직선 (Euler line)**
_Serra Ch.4, Advanced_

```js
line.through(O, H).color('crimson').dash([3,3]),
point(O).dot().label('O'),
point(G).dot().label('G'),
point(H).dot().label('H'),
```

✅ O, G, H 일직선. OG:GH = 1:2.

**22. 삼각형 합동 (SSS)**
_Serra Ch.3_

```js
// 두 삼각형
annotate.tick(segment(A,B)).count(1),
annotate.tick(segment(D,E)).count(1),
annotate.tick(segment(B,C)).count(2),
annotate.tick(segment(E,F)).count(2),
annotate.tick(segment(C,A)).count(3),
annotate.tick(segment(F,D)).count(3),
```

✅ 대응변 tick 개수 일치. 합동 표시.

**23. 삼각형 닮음 (AA)**
_Serra Ch.6_

```js
annotate.angle(A, B, C).arc().label('α'),
annotate.angle(D, E, F).arc().label('α'),
annotate.angle(B, C, A).arc({double:true}).label('β'),
annotate.angle(E, F, D).arc({double:true}).label('β'),
```

✅ 두 각 대응. 세 번째 각 자동 일치.

**24. 피타고라스 정리 증명**
_Euclid I.47 스타일_

```js
// 빗변 위 정사각형 = 두 변 위 정사각형의 합
(square.on(segment(A, B)), square.on(segment(B, C)), square.on(segment(C, A)), annotate.caption(tex`a^2 + b^2 = c^2`));
```

✅ 세 정사각형. 넓이 합 일치.

---

## D. 기하 — 원 (25–28)

**25. 원주각 = 중심각의 절반**
_Serra Ch.7_

```js
circle.center(O).radius(2),
point(0, 0).dot().label('O'),
point.polar(2, Math.PI/4).dot().label('A'),
point.polar(2, 3*Math.PI/4).dot().label('B'),
point.polar(2, Math.PI).dot().label('P'),
segment(O, A), segment(O, B),
segment(P, A), segment(P, B),
annotate.angle(A, O, B).arc().degrees().label('2θ'),
annotate.angle(A, P, B).arc().degrees().label('θ'),
```

✅ 중심각 = 2 × 원주각.

**26. 접선-현 정리**
_Serra Ch.7_

```js
circle.center(O).radius(2),
line.tangent(circle).at(point(2, 0)),
segment(point(2, 0), point.polar(2, Math.PI/3)),
annotate.angle(/* 접선 방향 */, point(2,0), /* 현 */).label('θ'),
```

✅ 접선과 현 사이 각 = 반대쪽 원주각.

**27. 방멱 정리 (intersecting chords)**
_Serra Ch.7_

```js
// 두 현이 내부에서 교차
const X = point.intersect(chord1, chord2);
(segment(A, B), segment(C, D), annotate.caption(tex`AX \cdot XB = CX \cdot XD`));
```

✅ 곱 일치. 심볼릭 검증.

**28. 톨레미 정리 (내접 사각형)**
_Serra Ch.7, Advanced_

```js
const quad = polygon(A, B, C, D),  // 원 위 네 점
segment(A, C), segment(B, D),      // 대각선
annotate.caption(tex`AC \cdot BD = AB \cdot CD + BC \cdot AD`)
```

✅ 톨레미 등식. 심볼릭 검증.

---

## E. 삼각함수 (29–33)

**29. 단위원 + sin/cos 정의**
_Stewart §5.2 / Precalculus_

```js
circle.center(O).radius(1),
point.polar(1, Math.PI/6).dot().label(tex`(\cos\theta, \sin\theta)`),
segment(O, point.polar(1, Math.PI/6)),
segment(point.polar(1, Math.PI/6), point(Math.cos(Math.PI/6), 0)).dash(),
annotate.angle(point(1,0), O, point.polar(1, Math.PI/6)).arc().label(tex`\theta`),
```

✅ 단위원 위 점. cos = x, sin = y.

**30. 사인/코사인 그래프 + 위상**
_Stewart §1.3_

```js
curve.fn(Math.sin).on([-2*Math.PI, 2*Math.PI]).color('crimson').label(tex`\sin x`),
curve.fn(x => Math.sin(x - Math.PI/4)).on([-2*Math.PI, 2*Math.PI]).color('steelblue').label(tex`\sin(x - \pi/4)`),
```

✅ 두 곡선이 π/4만큼 이동. 진폭 동일.

**31. 탄젠트 + 점근선**
_Stewart §1.3_

```js
curve.fn(Math.tan).on([-Math.PI/2 + 0.1, Math.PI/2 - 0.1]),
line.vertical(Math.PI/2).dash([3,3]).color('#888'),
line.vertical(-Math.PI/2).dash([3,3]).color('#888'),
```

✅ 주기 π. 점근선이 ±π/2.

**32. 삼각방정식 해**
_Stewart §1.5_

```js
curve.fn(Math.sin).on([0, 4*Math.PI]),
line.horizontal(0.5).color('#888'),
// 교점 표시
point(Math.PI/6, 0.5).dot(),
point(5*Math.PI/6, 0.5).dot(),
point(13*Math.PI/6, 0.5).dot(),
```

✅ 한 주기에 두 해. 무한 반복.

**33. 삼각함수 합성**
_Stewart §1.3, Advanced_

```js
(curve.fn((x) => 3 * Math.sin(x) + 4 * Math.cos(x)).color('crimson'),
  curve
    .fn((x) => 5 * Math.sin(x + Math.atan2(4, 3)))
    .dash([3, 3])
    .color('steelblue'),
  annotate.caption(tex`3\sin x + 4\cos x = 5\sin(x + \varphi)`));
```

✅ 두 곡선 일치. 진폭 = 5.

---

## F. 극좌표 & 매개변수 (34–38)

**34. 극좌표 카디오이드**
_Stewart §10.3_

```js
scene()
  .equal()
  .polarGrid()
  .add(
    curve
      .polar((θ) => 1 + Math.cos(θ))
      .on([0, 2 * Math.PI])
      .color('crimson'),
  );
```

✅ 심장 모양. 좌우 대칭. 최대 r=2, 최소 r=0.

**35. 극좌표 장미 (홀수/짝수)**
_Stewart §10.3_

```js
curve.polar(θ => Math.cos(3*θ)).on([0, Math.PI]),    // 3 petal
curve.polar(θ => Math.cos(2*θ)).on([0, 2*Math.PI]),  // 4 petal
```

✅ 홀수 n → n petal. 짝수 n → 2n petal.

**36. 리마송 (내부/외부 루프)**
_Stewart §10.3_

```js
curve.polar(θ => 1 + 2*Math.cos(θ)).on([0, 2*Math.PI]),
```

✅ 내부 루프 + 외부 루프. 자기교차.

**37. 사이클로이드**
_Stewart §10.1_

```js
curve.parametric(t => [t - Math.sin(t), 1 - Math.cos(t)]).on([0, 4*Math.PI]),
```

✅ 원이 굴러가는 자취. 뾰족한 점이 x축에 접함.

**38. 리사주 곡선**
_Stewart §10.1, Advanced_

```js
curve.parametric(t => [Math.sin(3*t), Math.sin(4*t)]).on([0, 2*Math.PI]),
```

✅ 3:4 비율. 격자무늬.

---

## G. 선형대수 (39–43)

**39. 벡터 합**
_Strang Linear Algebra, Ch.1_

```js
vector.between(O, point(2, 1)).color('crimson').label('v'),
vector.between(O, point(1, 2)).color('steelblue').label('w'),
vector.between(O, point(3, 3)).color('green').label('v + w'),
// 평행사변형
segment(point(2,1), point(3,3)).dash([2,2]),
segment(point(1,2), point(3,3)).dash([2,2]),
```

✅ 평행사변형 법칙. v + w = (3,3).

**40. 행렬 변환 (회전, 반사, shear)**
_Strang Ch.7_

```js
const unit = regular.polygon(O, 4, 1),           // 단위 정사각형
unit.apply(transform.rotate(Math.PI/6)).color('crimson'),
unit.apply(transform.reflect.over(line.horizontal(0))).color('steelblue'),
unit.apply(transform.shear(0.5)).color('green'),
```

✅ 세 변환 결과. 행렬 곱.

**41. 고유벡터 (2×2)**
_Strang Ch.6_

```js
// A = [[3,1],[0,2]] 의 고유벡터
(vector.between(O, point(1, 0)).color('crimson').label('v₁'),
  vector.between(O, point(-1, 1)).color('steelblue').label('v₂'),
  annotate.caption(tex`Av_1 = 3v_1, \quad Av_2 = 2v_2`));
```

✅ 두 고유벡터가 변환 후에도 방향 유지.

**42. 최소제곱법 (회귀선)**
_Strang Ch.4 / Statistics_

```js
// 산점도 + 회귀선
point(1, 1).dot(), point(2, 2).dot(), point(3, 2.5).dot(),
point(4, 3).dot(), point(5, 4).dot(),
line.slopeIntercept(0.7, 0.4).color('crimson'),
```

✅ 회귀선이 점들의 추세. 잔차 최소.

**43. 3D 벡터 외적**
_Strang Ch.4_

```js
scene()
  .dim(3)
  .add(
    vector.between(O, point(1, 0, 0)).color('crimson'),
    vector.between(O, point(0, 1, 0)).color('steelblue'),
    vector.between(O, point(0, 0, 1)).color('green'),
    annotate.caption(tex`i \times j = k`),
  );
```

✅ 세 벡터 직교. 오른손 법칙.

---

## H. 확률·통계 (44–47)

**44. 정규분포 + 음영**
_Ross Probability, Ch.5_

```js
curve.fn(x => Math.exp(-x*x/2) / Math.sqrt(2*Math.PI)).on([-4, 4]).color('crimson'),
region.below(curve.fn(x => Math.exp(-x*x/2)/Math.sqrt(2*Math.PI)).on([-1, 1]))
  .fill('steelblue').opacity(0.4),
annotate.caption(tex`P(-1 < Z < 1) \approx 0.6827`),
```

✅ 종 모양. [-1,1] 영역 68%.

**45. 이항분포 (n=10, p=0.5)**
_Ross Ch.4_

```js
// 막대 그래프
Array.from({length: 11}, (_, k) =>
  rectangle.on([k-0.4, k+0.4], [0, binom(10, k) * 0.5**10])
    .fill('steelblue').opacity(0.7)
),
annotate.caption(tex`P(X = k) = \binom{10}{k} 2^{-10}`),
```

✅ 대칭. 최댓값 k=5.

**46. 베이즈 정리 (조건부확률 트리)**
_Ross Ch.3_

```js
// 확률 트리
segment(point(0,0), point(2, 1)).label(tex`P(A)`),
segment(point(0,0), point(2, -1)).label(tex`P(A^c)`),
// ... 두 번째 단계
annotate.caption(tex`P(A|B) = \frac{P(B|A)P(A)}{P(B)}`),
```

✅ 트리 구조. 확률 라벨.

**47. 산점도 + 신뢰구간**
_Statistics_

```js
// 산점도
pts.map(p => point(p.x, p.y).dot()),
line.slopeIntercept(a, b).color('crimson'),
region.between(
  curve.fn(x => a*x + b + 1.96*σ),
  curve.fn(x => a*x + b - 1.96*σ)
).fill('crimson').opacity(0.15),
```

✅ 회귀선 + 95% 신뢰구간 띠.

---

## I. 미분방정식 & 벡터장 (48–50)

**48. 기울기장 (slope field)**
_Boyce & DiPrima, Ch.1_

```js
// dy/dx = x + y 의 방향장
vectorField((x, y) => [1, x + y]).on(region.between(
  line.vertical(-3), line.vertical(3)
)),
// 특수해
curve.fn(x => -x - 1 + 2*Math.exp(x)).on([-3, 1]).color('crimson'),
```

✅ 방향장 + 적분곡선. 곡선이 장을 따름.

**49. 위상 평면 (phase portrait)**
_Strogatz, Ch.5_

```js
// dx/dt = -y, dy/dt = x → 원
vectorField((x, y) => [-y, x]).on(region.inside(circle.center(O).radius(2))),
curve.parametric(t => [Math.cos(t), Math.sin(t)]).on([0, 2*Math.PI]),
```

✅ 화살표가 시계 반대. 해가 원.

**50. 3D 곡면 + 등고선**
_Stewart §15.1_

```js
scene()
  .dim(3)
  .camera({ position: [5, -5, 4] })
  .add(
    surface
      .z((x, y) => x * x - y * y)
      .on([-2, 2], [-2, 2])
      .color('#93c5fd')
      .opacity(0.85),
    surface
      .z((x, y) => x * x - y * y)
      .on([-2, 2], [-2, 2])
      .contours(10)
      .color('crimson'),
    annotate.caption(tex`z = x^2 - y^2`),
  );
```

✅ 안장점. 등고선이 쌍곡선.

---

## 카테고리 요약

| 카테고리           | 개수   | 대표 원서                 |
| ------------------ | ------ | ------------------------- |
| A. 함수·극한       | 8      | Stewart, Spivak           |
| B. 적분            | 8      | Stewart §5–8, §11         |
| C. 삼각형 기하     | 8      | Serra, Euclid             |
| D. 원 기하         | 4      | Serra Ch.7                |
| E. 삼각함수        | 5      | Stewart §1.3              |
| F. 극좌표·매개변수 | 5      | Stewart §10               |
| G. 선형대수        | 5      | Strang                    |
| H. 확률·통계       | 4      | Ross                      |
| I. 미분방정식      | 3      | Boyce & DiPrima, Strogatz |
| **합계**           | **50** |                           |

---

## 우선순위

**v0.1 필수 (30개)**: 1, 2, 4, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31, 34, 35, 36, 38, 39, 40, 44, 45, 48

**v0.2 이후 (20개)**: 3, 5, 6, 7, 13, 15, 20, 21, 27, 28, 32, 33, 37, 41, 42, 43, 46, 47, 49, 50

---

이 50개는 **로그 스케일 커버리지**를 제공한다. 각 카테고리가 독립적인 코드 경로를 타므로, 하나가 통과하면 그 카테고리의 대표 케이스가 통과하는 것이다. 50개가 모두 초록이면 "Stewart, Strang, Ross, Serra를 그릴 수 있다"고 말할 수 있다.
