/**
 * js/work-report/work-report-adapter.js
 *
 * (2025-09-02 14:55 KST) 캐시 강제 리프레시 조건 추가
 * - 캐시에 end 신호가 없으면 월 데이터 재조회
 *
 * (2025-09-02 14:30 KST) A안 적용 (이력 유지)
 * - dates 직접 조회 시 vacation/start/end 모두 담아 반환
 * - collectYearFromFirestore에서 calculateMonthlyStats 우선 사용
 * - duration이 "0시간 25분" 같은 문자열이어도 workMinutes 정상 계산
 * - 휴가 타입은 종일연차/오전반휴/오후반휴/보상휴가만 존재한다고 가정
 * - 누적 보상(적립)은 보류(스텁 0)
 */

(function (global) {
  "use strict";

  const NS = "[WorkReportAdapter]";

  // ============ 공용 유틸 ============
  function toMinutesHHMMSS(str) {
    if (!str && str !== 0) return null;
    const s = String(str).trim();
    const m = s.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
    if (!m) return null;
    const h = +m[1], mm = +m[2], ss = m[3] ? +m[3] : 0;
    return h * 60 + mm + Math.floor(ss / 60);
  }
  function diffMinutesByRange(start, end) {
    const a = toMinutesHHMMSS(start);
    const b = toMinutesHHMMSS(end);
    if (a == null || b == null) return null;
    let d = b - a;
    if (d < 0) d += 24 * 60;
    return d;
  }

  // ============ 캐시 ============
  const WR_CACHE_MEM = {}; // { [email]: CacheObject }
  const CacheManager = {
    VERSION: "v1",
    TTL_HOURS: 24,
    _key(email) { return `wr_vac_cache::${email}::${this.VERSION}`; },
    _ensure(email) {
      if (!WR_CACHE_MEM[email]) {
        WR_CACHE_MEM[email] = { months: {}, meta: { email, lastSynced: 0, ttlHours: this.TTL_HOURS } };
      }
      return WR_CACHE_MEM[email];
    },
    _isExpired(lastSynced, ttlHours) {
      if (!lastSynced) return true;
      const ttl = (ttlHours ?? this.TTL_HOURS) * 60 * 60 * 1000;
      return Date.now() - lastSynced > ttl;
    },
    ensureLoaded(email) { if (!WR_CACHE_MEM[email]) this.loadFromStorage(email); return WR_CACHE_MEM[email]; },
    loadFromStorage(email) {
      try {
        const raw = localStorage.getItem(this._key(email));
        if (!raw) return this._ensure(email);
        const parsed = JSON.parse(raw);
        WR_CACHE_MEM[email] = parsed || this._ensure(email);
        return WR_CACHE_MEM[email];
      } catch (e) { console.warn(`${NS} Cache load error:`, e); return this._ensure(email); }
    },
    saveToStorage(email) {
      try { const c = this._ensure(email); localStorage.setItem(this._key(email), JSON.stringify(c)); }
      catch (e) { console.warn(`${NS} Cache save error:`, e); }
    },
    isExpired(email) { const c = this._ensure(email); return this._isExpired(c.meta.lastSynced, c.meta.ttlHours); },
    getMonth(email, year, monthIndex) {
      const c = this._ensure(email);
      const ym = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      return c.months[ym] || null;
    },
    setMonth(email, year, monthIndex, monthObj) {
      const c = this._ensure(email);
      const ym = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      c.months[ym] = monthObj || {};
      c.meta.lastSynced = Date.now();
      this.saveToStorage(email);
    },
    invalidate(email) { try { delete WR_CACHE_MEM[email]; localStorage.removeItem(this._key(email)); } catch (e) {} },
  };

  // ============ 휴가 사용(연차/보상) 분리 – 타입 4종 ============
  /**
   * records: { 'YYYY-MM-DD': { vacation: [ {start,end,type}, ... ], start: [...], end: [...] }, ... }
   * 타입: 종일연차 | 오전반휴 | 오후반휴 | 보상휴가
   * - 보상휴가: 반드시 end-start
   * - 연차 계열: end-start 우선, 실패 시 안전망(종일420/오전120/오후300)
   * (2025-09-02 14:30 KST)
   */
  function splitVacationUsedMinutesFromRecords(records) {
    const dayDocs = records && typeof records === "object" ? Object.values(records) : [];
    let annual = 0, comp = 0;
    const SAFE_FULL = 7 * 60;   // 420
    const SAFE_AM   = 2 * 60;   // 120
    const SAFE_PM   = 5 * 60;   // 300

    for (const day of dayDocs) {
      const vacs = Array.isArray(day?.vacation)
        ? day.vacation
        : (day?.vacation && typeof day.vacation === "object" ? Object.values(day.vacation) : []);
      for (const v of vacs) {
        const type = String(v?.type || "").trim();
        const isComp = type === "보상휴가";
        const isFull = type === "종일연차";
        const isAM   = type === "오전반휴";
        const isPM   = type === "오후반휴";
        let minutes = diffMinutesByRange(v?.start, v?.end);
        if (isComp) { if (minutes == null || minutes <= 0) minutes = 0; comp += minutes; continue; }
        if (minutes == null || minutes <= 0) {
          if (isFull) minutes = SAFE_FULL; else if (isAM) minutes = SAFE_AM; else if (isPM) minutes = SAFE_PM; else minutes = 0;
        }
        annual += minutes;
      }
    }
    return { annualUsedMin: annual, compUsedMin: comp };
  }

  // ============ Firestore 로더 ============
  /**
   * (2025-09-02 14:30 KST) 월 원본 적재: vacation + start + end
   */
  async function loadMonthlyVacationFromDates(year, monthIndex, email) {
    const result = {};
    if (!window.firebase?.firestore) return result;
    const db = window.firebase.firestore();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      try {
        const snap = await db.collection("records").doc(email).collection("dates").doc(dateKey).get();
        if (snap.exists) {
          const data = snap.data();
          const vac = Array.isArray(data?.vacation) ? data.vacation
            : (data?.vacation && typeof data.vacation === "object" ? Object.values(data.vacation) : []);
          const starts = Array.isArray(data?.start) ? data.start
            : (data?.start && typeof data.start === "object" ? Object.values(data.start) : []);
          const ends = Array.isArray(data?.end) ? data.end
            : (data?.end && typeof data.end === "object" ? Object.values(data.end) : []);
          if (vac.length || starts.length || ends.length) {
            if (!result[dateKey]) result[dateKey] = {};
            if (vac.length)   result[dateKey].vacation = vac;
            if (starts.length)result[dateKey].start    = starts;
            if (ends.length)  result[dateKey].end      = ends;
          }
        }
      } catch (e) { console.warn(`${NS} monthly load error:`, dateKey, e); }
    }
    return result;
  }

  // (보조 폴백) end[] 마지막 duration으로 월 합산 – 실제 경로는 calculateMonthlyStats 우선
  function extractDayWorkMinutesFromEndArray(endArr) {
    if (!Array.isArray(endArr) || endArr.length === 0) return 0;
    const last = endArr[endArr.length - 1];
    const raw = last?.duration;
    const num = Number(raw);
    if (Number.isFinite(num)) return Math.max(0, Math.floor(num));
    const m = String(raw || "").match(/(\d+)\s*시간\s*(\d+)\s*분/);
    if (m) return (+m[1]) * 60 + (+m[2]);
    return 0;
  }
  function sumMonthlyWorkMinutesFromRecords(records) {
    if (!records || typeof records !== "object") return 0;
    let sum = 0;
    for (const day of Object.values(records)) {
      const endArr = Array.isArray(day?.end) ? day.end
        : (day?.end && typeof day.end === "object" ? Object.values(day.end) : []);
      sum += extractDayWorkMinutesFromEndArray(endArr);
    }
    return sum;
  }

  // ============ (신규) 캐시 불완전 데이터 감지 ============
  /**
   * (2025-09-02 14:55 KST) 월 캐시에 end 신호가 1개 이상 존재하는지 확인
   * - 없으면 불완전 데이터로 간주하여 강제 새로고침
   */
  function hasWorkSignals(monthRecords){
    if (!monthRecords || typeof monthRecords !== "object") return false;
    for (const day of Object.values(monthRecords)) {
      const endArr = Array.isArray(day?.end) ? day.end
        : (day?.end && typeof day.end === "object" ? Object.values(day.end) : []);
      if (endArr.length > 0) return true;
    }
    return false;
  }

  // ============ 적립(스텁) ============
  async function getApprovedOvertimeMinutes() { return 0; }

  // ============ 연간 집계 (캐시 우선) ============
  async function collectYearFromFirestore(year, userEmail) {
    const email =
      userEmail ||
      global?.MonthlyReportFirestore?.currentUserEmail ||
      global?.USER_DATA?.email ||
      global?.currentUser?.email ||
      null;
    if (!email) { console.warn(`${NS} 사용자 이메일 누락`); return null; }
    CacheManager.ensureLoaded(email);

    const kpi = { totalWorkMinutes: 0, avgWorkMinutesPerMonth: 0, totalCompMinutes: 0, usedAnnualMinutes: 0, usedCompMinutes: 0 };
    const months = [];
    let valid = 0;
    let compCumMinutes = 0;

    for (let m = 0; m < 12; m++) {
      // 캐시 확보 + 불완전시 강제 새로고침
      let monthCache = CacheManager.getMonth(email, year, m);
      let needRefresh = !monthCache || CacheManager.isExpired(email) || !hasWorkSignals(monthCache); // (2025-09-02 14:55 KST)
      if (needRefresh) {
        const merged = await loadMonthlyVacationFromDates(year, m, email);
        CacheManager.setMonth(email, year, m, merged);
        monthCache = merged;
      }

      // 1) calculateMonthlyStats 우선
      let stats = { totalMinutes: 0, overtimeMinutes: 0, vacationMinutes: 0 };
      if (typeof global.calculateMonthlyStats === "function") {
        try {
          const s = global.calculateMonthlyStats(year, m, monthCache);
          if (s) stats = s;
        } catch (e) { console.warn(`${NS} calculateMonthlyStats 실패(${year}-${m + 1})`, e); }
      }
      // 폴백: end[] duration 합
      if (!stats || !Number.isFinite(stats.totalMinutes) || stats.totalMinutes === 0) {
        stats = stats || {};
        stats.totalMinutes = sumMonthlyWorkMinutesFromRecords(monthCache);
      }

      const workMinutes = Number(stats.totalMinutes || 0);

      // 2) 휴가 사용 분리(타입 4종)
      const { annualUsedMin, compUsedMin } = splitVacationUsedMinutesFromRecords(monthCache);

      // 3) 보상 적립(누계) — 보류
      const monthlyOvertimeMin = await getApprovedOvertimeMinutes(year, m, email);
      compCumMinutes += monthlyOvertimeMin;

      // 4) 월 구조
      const DAY_MIN = 7 * 60;
      const toHalf = (min) => Math.round((min / DAY_MIN) * 2) / 2;
      months.push({
        month: m + 1,
        workMinutes,
        vacationMinutes: annualUsedMin + compUsedMin,
        annualUsedMinutes: annualUsedMin,
        compUsedMinutes: compUsedMin,
        compMinutesCumulative: compCumMinutes,
        // 하위호환
        compDaysCumulative: toHalf(compCumMinutes),
        annualUsedDays: toHalf(annualUsedMin),
      });

      // KPI
      kpi.totalWorkMinutes  += workMinutes;
      kpi.totalCompMinutes  += monthlyOvertimeMin;
      kpi.usedAnnualMinutes += annualUsedMin;
      kpi.usedCompMinutes   += compUsedMin;

      if (workMinutes > 0) valid++;
    }

    kpi.avgWorkMinutesPerMonth = valid ? Math.round(kpi.totalWorkMinutes / valid) : 0;

    try {
      console.table(months.map(x => ({
        month: x.month,
        workMin: x.workMinutes,
        annualUseMin: x.annualUsedMinutes,
        compUseMin: x.compUsedMinutes,
        compCumMin: x.compMinutesCumulative
      })));
    } catch {}
    console.log(`${NS} ${year} KPI:`, kpi);
    return { kpi, months };
  }

  // ============ 퍼사드/디버그 ============
  const WorkReportAdapter = {
    provider: "MonthlyReportFirestore",
    detect() {
      if (global.MonthlyReportFirestore?.loadMonthlyData) {
        console.info(`${NS} provider = MonthlyReportFirestore`);
        return "MonthlyReportFirestore";
      }
      console.warn(`${NS} provider not found; cache-only path`);
      return null;
    },
    async fetchYearSummary(year, userEmail) { return collectYearFromFirestore(year, userEmail); },
    cache: {
      invalidate(email) { CacheManager.invalidate(email); },
      getMonth(email, y, m) { return CacheManager.getMonth(email, y, m); },
      async primeMonth(email, y, m) {
        const merged = await loadMonthlyVacationFromDates(y, m, email);
        CacheManager.setMonth(email, y, m, merged);
        return merged;
      },
    },
  };

  const WorkReportDebug = {
    verbose: false,
    async demo(year) { return WorkReportAdapter.fetchYearSummary(year || new Date().getFullYear()); },
    async analyzeMonth(year, monthIndex) {
      const email =
        global?.MonthlyReportFirestore?.currentUserEmail ||
        global?.USER_DATA?.email ||
        global?.currentUser?.email || null;
      if (!email) return console.warn("[WorkReportDebug] 사용자 이메일 없음");

      CacheManager.ensureLoaded(email);
      let month = CacheManager.getMonth(email, year, monthIndex);
      if (!month || CacheManager.isExpired(email) || !hasWorkSignals(month)) { // (2025-09-02 14:55 KST)
        month = await WorkReportAdapter.cache.primeMonth(email, year, monthIndex);
      }

      const vac = splitVacationUsedMinutesFromRecords(month);
      let stats = { totalMinutes: 0 };
      if (typeof global.calculateMonthlyStats === "function") {
        stats = global.calculateMonthlyStats(year, monthIndex, month) || stats;
      }
      if (!stats.totalMinutes) stats.totalMinutes = sumMonthlyWorkMinutesFromRecords(month);

      console.group(`[WorkReportDebug] ${year}-${String(monthIndex + 1).padStart(2, "0")}`);
      console.log("vacation split:", vac);
      console.log("workMinutes(stats.totalMinutes):", stats.totalMinutes);
      console.groupEnd();
    },
  };

  global.WorkReportAdapter = WorkReportAdapter;
  global.WorkReportDebug = WorkReportDebug;

})(window);
