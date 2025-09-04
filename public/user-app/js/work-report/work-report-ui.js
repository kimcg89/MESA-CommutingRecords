// js/work-report/work-report-ui.js
// Work Report UI (2025-09-01 16:35 KST 수정됨)

(function () {
  "use strict";

  const Core = window.WorkReportCore || (window.WorkReportCore = {});

  // (2025-09-01 21:55 KST) 0.5시간 단위 반올림
  Core.formatMinutesToHourHalf = function (mm) {
    mm = Number(mm || 0);
    const halfHours = Math.round((mm / 60) * 2) / 2;
    return halfHours % 1 === 0
      ? `${halfHours}시간`
      : `${halfHours.toFixed(1)}시간`;
  };

  // "123시간" 형식(분 버림)
  Core.formatMinutesToHoursOnly = function (mm) {
    mm = Number(mm || 0);
    const h = Math.floor(mm / 60);
    return `${h}시간`;
  };

  // 상태 객체로 일원화 (변수명 불일치 방지) (2025-09-01 16:35 KST)
  const WR_STATE = {
    currentYear: new Date().getFullYear(),
    cache: {},
  };

  function openModal() {
    const ov = document.getElementById("work-report-overlay");
    const md = document.getElementById("work-report-modal");
    if (ov) ov.style.display = "block";
    if (md) md.style.display = "flex";
  }
  function closeModal() {
    const ov = document.getElementById("work-report-overlay");
    const md = document.getElementById("work-report-modal");
    if (ov) ov.style.display = "none";
    if (md) md.style.display = "none";
  }

  // (2025-09-01 20:15 KST) KPI: 시간 단위 표기 + "사용 연차/보상 휴가"
  function renderKPIs(kpi) {
    const totalMin = Number(kpi.totalWorkMinutes || 0);
    const avgMin = Number(kpi.avgWorkMinutesPerMonth || 0);

    // ✅ 분 → "000시간 00분"
    document.getElementById("wr-kpi-total").textContent =
      Core.formatMinutesToWords(totalMin);
    document.getElementById("wr-kpi-avg").textContent =
      Core.formatMinutesToWords(avgMin);

    // ✅ 보상 누적(적립) 시간: 분 단위가 우선, 없으면 (일→분) 변환 폴백
    const compTotalMin =
      kpi.totalCompMinutes != null
        ? Number(kpi.totalCompMinutes)
        : Math.round(Number(kpi.totalCompDays || 0) * 7 * 60);
    document.getElementById("wr-kpi-comp").textContent =
      Core.formatMinutesToWords(compTotalMin);

    // ✅ 사용 연차/보상 휴가: "연차시간 / 보상시간"
    const usedAnnualMin =
      kpi.usedAnnualMinutes != null
        ? Number(kpi.usedAnnualMinutes)
        : Math.round(Number(kpi.usedAnnualDays || 0) * 7 * 60);
    const usedCompMin =
      kpi.usedCompMinutes != null ? Number(kpi.usedCompMinutes) : 0;

    // (2025-09-01 22:55 KST) 연차/보상: 0.5시간 단위 표기
    document.getElementById(
      "wr-kpi-annual"
    ).textContent = `${Core.formatMinutesToHourHalf(
      usedAnnualMin
    )} / ${Core.formatMinutesToHourHalf(usedCompMin)}`;

    // 디버그(원한다면 확인용): 실제 분 값을 로그로 확인
    console.debug(
      "[WR-KPI] used(annual, comp) min =",
      usedAnnualMin,
      usedCompMin
    );

    // (2025-09-01 21:55 KST) KPI 타이틀 "사용 연차/보상 휴가"로 강제
    const annualBox =
      document.querySelector('.wr-kpi[data-kpi="annual"]') ||
      document.getElementById("wr-kpi-annual-title")?.closest(".wr-kpi") ||
      document.querySelector(".wr-kpi:nth-child(4)");

    // kpi-title, k-label 등 다양한 네이밍을 모두 시도
    const titleNodes = [];
    if (annualBox) {
      titleNodes.push(
        ...annualBox.querySelectorAll(
          ".kpi-title, .k-label, #wr-kpi-annual-title"
        )
      );
    }
    if (titleNodes.length === 0) {
      const fallback =
        document.getElementById("wr-kpi-annual-title") ||
        document.querySelector('.wr-kpi[data-kpi="annual"] .kpi-title') ||
        document.querySelector(".wr-kpi:nth-child(4) .kpi-title");
      if (fallback) titleNodes.push(fallback);
    }
    titleNodes.forEach((n) => (n.textContent = "사용 연차/보상 휴가"));
  }

  function createMonthCard(year, m, item) {
    const wrap = document.createElement("div");
    wrap.className = "wr-month-card";

    const head = document.createElement("div");
    head.className = "m-head";
    head.innerHTML = `<div class="m-title">${m}월</div>`;
    wrap.appendChild(head);

    const metrics = document.createElement("div");
    metrics.className = "m-metrics";
    const m1 = document.createElement("div");
    m1.className = "m-metric";
    m1.innerHTML = `<div class="m-label">월별 근무시간</div><div class="m-value">${Core.formatMinutesToHM(
      item.workMinutes || 0
    )}</div>`;
    // (2025-09-01 20:15 KST) 월별 표시를 "시간" 단위로
    const m2 = document.createElement("div");
    m2.className = "m-metric";
    {
      // 누적 보상(적립) 분이 있으면 그걸 사용, 없으면 일→분 변환
      const compCumMin =
        item.compMinutesCumulative != null
          ? Number(item.compMinutesCumulative)
          : Math.round(Number(item.compDaysCumulative || 0) * 7 * 60);
      m2.innerHTML = `<div class="m-label">월별 누적 보상휴가</div><div class="m-value">${Core.formatMinutesToWords(
        compCumMin
      )}</div>`;
    }

    const m3 = document.createElement("div");
    m3.className = "m-metric";
    {
      // 월 사용 휴가(연차+보상), 분 단위 우선
      const vacMin =
        item.vacationMinutes != null
          ? Number(item.vacationMinutes)
          : Math.round(Number(item.annualUsedDays || 0) * 7 * 60);
      m3.innerHTML = `<div class="m-label">월별 사용 휴가</div><div class="m-value">${Core.formatMinutesToWords(
        vacMin
      )}</div>`;
    }
    metrics.append(m1, m2, m3);

    wrap.appendChild(metrics);

    // 프로그레스 바
    const std = Core.computeStandardMinutes(year, m, 7); // 표준근무: 주말/공휴일 제외 × 7시간
    const maxBound = Math.max(std, item.workMinutes || 0) * 1.25; // 여유 범위

    const prog = document.createElement("div");
    prog.className = "wr-progress";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = `${Core.ratio(item.workMinutes || 0, maxBound) * 100}%`;

    const stdLine = document.createElement("div");
    stdLine.className = "std-line";
    stdLine.style.left = `${Core.ratio(std, maxBound) * 100}%`;
    // 기준선 툴팁으로 기준 근무시간 표시(h:mm)
    stdLine.title = Core.formatMinutesToHM(std);

    // ✅ 월별 동적 눈금 생성: 근무일 수 = 표준분 / 420 (1일=7h=420분)
    let workdays = Math.round(std / (7 * 60));
    if (workdays < 1) workdays = 1; // 최소 1일 가드
    for (let t = 1; t < workdays; t++) {
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = `${(t * 100) / workdays}%`;
      prog.appendChild(tick);
    }

    prog.append(bar, stdLine);
    wrap.appendChild(prog);

    // ✅ 라벨 가운데를 실제 기준 근무시간으로 표기
    const labels = document.createElement("div");
    labels.className = "wr-progress-labels";
    {
      const workStr = Core.formatMinutesToWords(item.workMinutes || 0); // ex) "120시간 30분"
      const vacMin =
        item.vacationMinutes != null
          ? Number(item.vacationMinutes)
          : Math.round(Number(item.annualUsedDays || 0) * 7 * 60);
      // (2025-09-01 22:55 KST) 휴가 사용도 0.5시간 단위로 표기
      const vacStr = Core.formatMinutesToHourHalf(vacMin); // ex) "7.5시간"

      labels.innerHTML = `
  <div class="cur">${workStr} + ${vacStr}</div>
  <div class="std">${Core.formatMinutesToHourHalf(std)}</div>
  <div class="max">${Core.formatMinutesToHourHalf(Math.round(maxBound))}</div>
`;
    }
    wrap.appendChild(labels);

    return wrap;
  }

  // (2025-09-01 19:25 KST) 월 카드 정렬: 최신 월이 상단, 1월이 하단
  function renderMonths(year, months = []) {
    const list = document.getElementById("wr-months-list");
    list.innerHTML = "";
    const last = Core.getLastValidMonthIndex(months);
    if (last < 0) {
      const empty = document.createElement("div");
      empty.className = "wr-month-card";
      empty.innerHTML = `<div class="m-head"><div class="m-title">데이터가 없습니다</div></div>`;
      list.appendChild(empty);
      return;
    }
    // 🔽 최신 월(card)부터 추가 → 화면 상단에 최신 월이 위치
    for (let i = last; i >= 0; i--) {
      list.appendChild(createMonthCard(year, i + 1, months[i] || {}));
    }
  }

  function renderYear(year, payload) {
    WR_STATE.currentYear = year;
    document.getElementById("wr-year-label").textContent = String(year);
    renderKPIs(payload.kpi || {});
    renderMonths(year, payload.months || []);
  }

  // (로딩 표시 포함) (2025-09-01 16:35 KST)
  async function openWorkReport(year) {
    WR_STATE.currentYear = year || new Date().getFullYear();
    openModal();

    document.getElementById("wr-year-label").textContent = String(
      WR_STATE.currentYear
    );
    document.getElementById("wr-kpi-total").textContent = "로딩…";
    document.getElementById("wr-kpi-avg").textContent = "로딩…";
    document.getElementById("wr-kpi-comp").textContent = "로딩…";
    document.getElementById("wr-kpi-annual").textContent = "로딩…";
    const list = document.getElementById("wr-months-list");
    if (list)
      list.innerHTML = `<div class="wr-month-card"><div class="m-head"><div class="m-title">데이터 로딩 중…</div></div></div>`;

    if (!WR_STATE.cache[WR_STATE.currentYear]) {
      try {
        const res = await window.WorkReportAdapter.fetchYearSummary(
          WR_STATE.currentYear
        );
        WR_STATE.cache[WR_STATE.currentYear] = res || { kpi: {}, months: [] };
      } catch (e) {
        console.warn("WorkReportAdapter 실패:", e);
        WR_STATE.cache[WR_STATE.currentYear] = { kpi: {}, months: [] };
      }
    }
    renderYear(WR_STATE.currentYear, WR_STATE.cache[WR_STATE.currentYear]);
  }

  function setupUIBindings() {
    document.getElementById("wr-close")?.addEventListener("click", closeModal);
    document
      .getElementById("work-report-overlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "work-report-overlay") closeModal();
      });
    document
      .getElementById("wr-year-prev")
      ?.addEventListener("click", async () => {
        await openWorkReport(WR_STATE.currentYear - 1);
      });
    document
      .getElementById("wr-year-next")
      ?.addEventListener("click", async () => {
        await openWorkReport(WR_STATE.currentYear + 1);
      });
  }

  window.WorkReportUI = { openWorkReport, setupUIBindings };
})();
