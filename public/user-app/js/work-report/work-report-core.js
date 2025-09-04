/**
 * js/work-report/work-report-core.js
 * (2025-09-01 20:45 KST)
 * - 시간/분 포맷터
 * - 표준근무시간 계산(주말/공휴일 제외 × 7시간) with 폴백
 * - 월 목록 관련 보조 유틸
 */
(function (global) {
  "use strict";

  const Core = global.WorkReportCore || (global.WorkReportCore = {});

  // HH:MM (기존 호환용)
  Core.formatMinutesToHM = function (mm) {
    mm = Number(mm || 0);
    const h = Math.floor(mm / 60);
    const m = mm % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // "000시간 00분"
  Core.formatMinutesToWords = function (mm) {
    mm = Number(mm || 0);
    const h = Math.floor(mm / 60);
    const m = mm % 60;
    return `${h}시간 ${m}분`;
  };

  // "000시간" (분 버림)
  Core.formatMinutesToHoursOnly = function (mm) {
    mm = Number(mm || 0);
    const h = Math.floor(mm / 60);
    return `${h}시간`;
  };

  // 0~1 비율
  Core.ratio = function (cur, max) {
    const c = Math.max(0, Number(cur || 0));
    const M = Math.max(1, Number(max || 1));
    return Math.max(0, Math.min(1, c / M));
  };

  // 공휴일 판정(holidays.js가 제공되면 사용)
  function isHoliday(date) {
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      if (global.HOLIDAYS && (key in global.HOLIDAYS)) return true;
      if (global.HolidaysModule?.isHoliday && global.HolidaysModule.isHoliday(date)) return true;
    } catch (e) {}
    return false;
  }

  // 표준근무시간(분). 우선 monthly-report의 공식 함수를 사용하고 없으면 폴백.
  Core.computeStandardMinutes = function (year, monthIndex, dayHours = 7) {
    // 1) monthly-report에서 제공되면 그걸 사용
    if (typeof global.calculateStandardWorkMinutes === "function") {
      try {
        return Number(global.calculateStandardWorkMinutes(year, monthIndex)) || 0;
      } catch (e) {}
    }
    // 2) 폴백: 주말/공휴일 제외 × 7시간
    const days = new Date(year, monthIndex + 1, 0).getDate();
    let workdays = 0;
    for (let d = 1; d <= days; d++) {
      const dt = new Date(year, monthIndex, d);
      const dow = dt.getDay(); // 0일 6토
      const weekend = dow === 0 || dow === 6;
      if (!weekend && !isHoliday(dt)) workdays++;
    }
    return workdays * dayHours * 60;
  };

  // 마지막 유효월 index(0~11). workMinutes / vacation / comp 누계 중 하나라도 >0인 마지막 월.
  Core.getLastValidMonthIndex = function (months) {
    let last = -1;
    for (let i = 0; i < 12; i++) {
      const m = months[i] || {};
      const has =
        (m.workMinutes || 0) > 0 ||
        (m.vacationMinutes || 0) > 0 ||
        (m.compMinutesCumulative || 0) > 0 ||
        (m.annualUsedDays || 0) > 0 ||
        (m.compDaysCumulative || 0) > 0;
      if (has) last = i;
    }
    return last;
  };
})(window);
