/* 시뮬레이션 네 개의 설정. 숫자(기본 인구, α 등)는 각 블록 맨 위에서 고친다.
   왼쪽 글은 content/slides.js에 있다. */
(() => {
  const { nStar, deltaZ, runMany, mean, group, people, percent } = Model;
  const fixed1 = (x) => x.toFixed(1);
  const fromLog10 = (v) => Math.round(Math.pow(10, v)); // 인구 슬라이더는 로그 눈금
  const peopleExact = (n) => group(n) + "명";

  /* Δz 값에 따른 상태 표시 */
  const trend = (ui, dz) => {
    if (dz > 0.05) ui.status("발전");
    else if (dz < -0.05) ui.status("퇴보 → 소실", true);
    else ui.status("겨우 유지");
  };

  /* A, C, D가 함께 쓰는 '세대별 숙련도' 그래프 */
  const levelChart = ({ gens, xTicks, runs, main, floor, ...rest }) => {
    const yMax = Chart.niceMax(Math.max(floor, ...runs.flat()));
    return {
      xMax: gens,
      yMax,
      xTicks,
      yTicks: [0, yMax / 2, yMax].map((v) => +v.toFixed(0)),
      xLabel: "세대",
      yLabel: "최고 숙련도",
      faint: runs,
      main,
      ...rest,
    };
  };

  /* ---------- 인구와 복잡도 ---------- */
  {
    const GENS = 40,
      START = 10,
      RUNS = 8;
    Sims.define("population", {
      controls: [
        {
          key: "n",
          label: "배우는 사람 수 N",
          min: 1,
          max: 5,
          step: 0.01,
          value: 2.5,
          read: fromLog10,
          show: peopleExact,
        },
        {
          key: "alpha",
          label: "기술 복잡도 α",
          min: 2,
          max: 14,
          step: 0.1,
          value: 7,
          show: fixed1,
        },
      ],
      readouts: [{ key: "nstar", label: "임계 인구 N*" }],
      status: true,
      render({ n, alpha }, ui) {
        const dz = deltaZ(alpha, n);
        ui.set("nstar", people(nStar(alpha)));
        trend(ui, dz);
        const runs = runMany(RUNS, 11, {
          gens: GENS,
          pop: () => n,
          alpha,
          start: START,
        });
        const expected = Array.from({ length: GENS + 1 }, (_, t) => [
          t,
          Math.max(0, START + dz * t),
        ]);
        ui.chart(
          levelChart({
            gens: GENS,
            xTicks: [0, 10, 20, 30, 40],
            runs,
            main: expected,
            floor: 20,
          })
        );
      },
    });
  }

  /* ---------- 복잡도 대 임계 인구 (질문 1) ---------- */
  {
    const BOOK = [
      // 기술 기준 추정치만 싣는다. 유전 기준(98명 등)은 다른 질문의 답이라 이 곡선에 올리지 않는다.
      { n: 1e5, name: "낮은 쪽 10만 명", page: 513 },
      { n: 1e6, name: "핸드머 100만 명", page: 512 },
      { n: 1e8, name: "스트로스 1억 명", page: 512 },
      { n: 1e9, name: "스트로스 10억 명", page: 512, align: "left" }, // 오른쪽에 두면 곡선과 겹친다
    ];
    const A_MIN = 2,
      A_MAX = 24;
    const TICKS = [
      [1, "1"],
      [1e2, "100"],
      [1e4, "1만"],
      [1e6, "100만"],
      [1e8, "1억"],
      [1e10, "100억"],
    ];
    const curve = [];
    for (let a = A_MIN; a <= A_MAX + 0.001; a += 0.2) curve.push([a, nStar(a)]);

    Sims.define("complexity", {
      controls: [
        {
          key: "alpha",
          label: "기술 복잡도 α",
          min: A_MIN,
          max: A_MAX,
          step: 0.1,
          value: 14,
          show: fixed1,
        },
      ],
      readouts: [{ key: "nstar", label: "필요한 인구 N*" }],
      note: "음영: 헨릭 Figure 2가 그린 범위(α/β 4~9). 그 오른쪽은 내가 늘려 본 구간.",
      render({ alpha }, ui) {
        const ns = nStar(alpha);
        ui.set("nstar", people(ns));
        ui.chart({
          xMin: A_MIN,
          xMax: A_MAX,
          yMin: 1,
          yMax: 3e10,
          log: true,
          xTicks: [4, 8, 12, 16, 20, 24],
          yTicks: TICKS.map(([v]) => v),
          yFmt: (v) => TICKS.find(([x]) => x === v)[1],
          xLabel: "기술 복잡도 α",
          yLabel: "임계 인구 (로그 눈금)",
          bands: [{ from: 4, to: 9 }],
          hlines: BOOK.map((b) => ({
            y: b.n,
            label: `${b.name} (${b.page})`,
            align: b.align,
          })),
          main: curve,
          dot: { x: alpha, y: ns },
        });
      },
    });
  }

  /* ---------- 참사와 골든타임 (질문 2) ---------- */
  {
    const BASE = 6000,
      ALPHA = 9,
      GENS = 60,
      HIT = 10,
      TRIALS = 40,
      SHOWN = 14;
    const critical = Math.round(nStar(ALPHA) / 50) * 50;
    Sims.define("catastrophe", {
      controls: [
        {
          key: "cut",
          label: "참사 규모",
          min: 0,
          max: 80,
          step: 5,
          value: 60,
          read: (v) => v / 100,
          show: percent,
        },
        {
          key: "rec",
          label: "인구 회복까지",
          min: 1,
          max: 40,
          step: 1,
          value: 16,
          show: (v) => v + "세대",
        },
      ],
      readouts: [
        { key: "after", label: "참사 뒤 인구" },
        { key: "lost", label: `영구 소실 (${TRIALS}회 중)` },
      ],
      status: true,
      note: `평소 인구 ${group(BASE)}명, α = ${ALPHA}, 임계 인구 약 ${group(
        critical
      )}명`,
      render({ cut, rec }, ui) {
        const after = Math.max(2, Math.round(BASE * (1 - cut)));
        const pop = (t) => (t >= HIT && t < HIT + rec ? after : BASE);
        const all = runMany(TRIALS, 101, { gens: GENS, pop, alpha: ALPHA });
        const frac = all.filter((r) => r[GENS] === 0).length / TRIALS;
        const runs = all.slice(0, SHOWN); // 그래프에는 일부만 그린다
        ui.set("after", people(after));
        ui.set("lost", percent(frac));
        if (frac < 0.1) ui.status("회복");
        else if (frac < 0.6) ui.status("운에 달림");
        else ui.status("영구 소실", true);
        ui.chart(
          levelChart({
            gens: GENS,
            xTicks: [0, 10, 20, 30, 40, 50, 60],
            runs,
            main: mean(runs),
            floor: 20,
            bands: [
              { from: HIT, to: Math.min(GENS, HIT + rec), label: "인구 감소" },
            ],
          })
        );
      },
    });
  }

  /* ---------- 지구와 단절, AI 몫 (질문 3) ---------- */
  {
    const ALPHA = 9,
      GENS = 60,
      CUT_AT = 20,
      EARTH = 30,
      RUNS = 8;
    Sims.define("ai", {
      controls: [
        {
          key: "ai",
          label: "AI가 보존하는 몫",
          min: 0,
          max: 80,
          step: 5,
          value: 0,
          read: (v) => v / 100,
          show: percent,
        },
        {
          key: "n",
          label: "정착지 인구",
          min: 2.3,
          max: 4.5,
          step: 0.01,
          value: 3,
          read: fromLog10,
          show: peopleExact,
        },
      ],
      readouts: [{ key: "nstar", label: "임계 인구 N*" }],
      status: true,
      note: `α = ${ALPHA}. ${CUT_AT}세대 뒤 지구와 단절. AI 몫은 이 발표의 가정.`,
      render({ ai, n }, ui) {
        const effective = ALPHA * (1 - ai);
        ui.set("nstar", people(nStar(effective)));
        trend(ui, deltaZ(effective, n));
        const runs = runMany(RUNS, 201, {
          gens: GENS,
          pop: () => n,
          alpha: ALPHA,
          ai,
          start: EARTH,
          link: (t) => t < CUT_AT,
          earth: EARTH,
        });
        ui.chart(
          levelChart({
            gens: GENS,
            xTicks: [0, 10, 20, 30, 40, 50, 60],
            runs,
            main: mean(runs),
            floor: 60,
            bands: [{ from: 0, to: CUT_AT, label: "지구와 연결" }],
            hlines: [{ y: EARTH, label: "지구 수준", align: "right" }],
          })
        );
      },
    });
  }
})();
