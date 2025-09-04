/**
 * js/work-report/work-report-adapter.js
 *
 * (2025-09-02 13:40 KST) 캐시 도입 + 집계 규칙 확정
 * - 휴가 원천: records/{email}/dates/{YYYY-MM-DD}/vacation[]  (항목: {start,end,type})
 * - 근무 원천: records/{email}/dates/{YYYY-MM-DD}/end[]       (마지막 요소의 duration 사용)
 * - 타입 제한: "종일연차" | "오전반휴" | "오후반휴" | "보상휴가"
 * - 계산 원칙:
 *    · 휴가: 기본 end-start(자정 보정). 실패 시에만 안전망(종일420/오전120/오후300)
 *    · 보상휴가: 고정치 금지, 반드시 end-start
 *    · 근무시간: 날짜 문서의 end[] 마지막 요소의 duration(분)을 일 근무시간으로 간주, 월 합산
 * - 성능: userEmail 단위 캐시(메모리 + localStorage) 우선
 *
 * ⚠️ 보류
 * - 총 누적 보상(적립) 규칙은 별도 조건 확정 후 구현
 */

(function (global) {
  "use strict";

  const NS = "[WorkReportAdapter]";

  // ============================================================
  // 0) 공용 유틸
  // ============================================================

  // (2025-09-02 13:40 KST) "HH:MM[:SS]" → 분, 실패 시 null
  function toMinutesHHMMSS(str) {
    if (!str && str !== 0) return null;
    const s = String(str).trim();
    const m = s.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
    if (!m) return null;
    const h = +m[1], mm = +m[2], ss = m[3] ? +m[3] : 0;
    return h * 60 + mm + Math.floor(ss / 60);
  }

  // (2025-09-02 13:40 KST) 시작~종료 분 (자정 보정)
  function diffMinutesByRange(start, end) {
    const a = toMinutesHHMMSS(start);
    const b = toMinutesHHMMSS(end);
    if (a == null || b == null) return null;
    let d = b - a;
    if (d < 0) d += 24 * 60;
    return d;
  }

  // ============================================================
  // 1) 캐시 매니저 (메모리 + localStorage)
  // ============================================================

  /**
   * (2025-09-02 13:40 KST) CacheManager
   * 구조 예:
   * {
   *   months: {
   *     "2025-08": {
   *       "2025-08-26": {
   *          vacation: [ {start,end,type}, ... ],
   *          end: [ { duration: 367분, ... }, ... ]
   *       },
   *       ...
   *     }
   *   },
   *   meta: { email, lastSynced: epoch_ms, ttlHours }
   * }
   */
  const WR_CACHE_MEM = {}; // { [email]: CacheObject }

  const CacheManager = {
    VERSION: "v1",
    TTL_HOURS: 24,

    _key(email) {
      return `wr_vac_cache::${email}::${this.VERSION}`;
    },

    _ensure(email) {
      if (!WR_CACHE_MEM[email]) {
        WR_CACHE_MEM[email] = {
          months: {},
          meta: { email, lastSynced: 0, ttlHours: this.TTL_HOURS },
        };
      }
      return WR_CACHE_MEM[email];
    },

    _isExpired(lastSynced, ttlHours) {
      if (!lastSynced) return true;
      const ttl = (ttlHours ?? this.TTL_HOURS) * 60 * 60 * 1000;
      return Date.now() - lastSynced > ttl;
    },

    ensureLoaded(email) {
      if (!WR_CACHE_MEM[email]) this.loadFromStorage(email);
      return WR_CACHE_MEM[email];
    },

    loadFromStorage(email) {
      try {
        const raw = localStorage.getItem(this._key(email));
        if (!raw) return this._ensure(email);
        const parsed = JSON.parse(raw);
        WR_CACHE_MEM[email] = parsed || this._ensure(email);
        return WR_CACHE_MEM[email];
      } catch (e) {
        console.warn(`${NS} Cache load error:`, e);
        return this._ensure(email);
      }
    },

    saveToStorage(email) {
      try {
        const cache = this._ensure(email);
        localStorage.setItem(this._key(email), JSON.stringify(cache));
      } catch (e) {
        console.warn(`${NS} Cache save error:`, e);
      }
    },

    isExpired(email) {
      const c = this._ensure(email);
      return this._isExpired(c.meta.lastSynced, c.meta.ttlHours);
    },

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

    invalidate(email) {
      try {
        delete WR_CACHE_MEM[email];
        localStorage.removeItem(this._key(email));
      } catch (e) {}
    },
  };

  // ============================================================
  // 2) 휴가 사용(연차/보상) 분리 — 타입 4종 확정
  // ============================================================

  /**
   * (2025-09-02 13:55 KST) records → (annualUsedMin, compUsedMin)
   * records: { 'YYYY-MM-DD': { vacation: [ {start,end,type}, ... ] }, ... }
   * 타입: "종일연차" | "오전반휴" | "오후반휴" | "보상휴가"
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

        if (isComp) {
          // 보상휴가: 반드시 end-start. 실패 시 0
          if (minutes == null || minutes <= 0) minutes = 0;
          comp += minutes;
          continue;
        }

        // 연차 계열: end-start 우선, 실패 시 안전망
        if (minutes == null || minutes <= 0) {
          if (isFull) minutes = SAFE_FULL;
          else if (isAM) minutes = SAFE_AM;
          else if (isPM) minutes = SAFE_PM;
          else minutes = 0;
        }

        annual += minutes;
      }
    }

    return { annualUsedMin: annual, compUsedMin: comp };
  }

  // ============================================================
  // 3) Firestore 로더 — dates 문서에서 휴가/근무 원천 적재
  // ============================================================

  /**
   * (2025-09-02 13:40 KST) 휴가 원본 월 적재
   * 반환: { 'YYYY-MM-DD': { vacation: VacItem[] }, ... }
   */
  async function loadMonthlyVacationFromDates(year, monthIndex, email) {
    const result = {};
    if (!window.firebase?.firestore) return result;

    const db = window.firebase.firestore();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      try {
        const snap = await db
          .collection("records").doc(email)
          .collection("dates").doc(dateKey).get();

        if (snap.exists) {
          const data = snap.data();
          const vac = Array.isArray(data?.vacation)
            ? data.vacation
            : (data?.vacation && typeof data.vacation === "object" ? Object.values(data.vacation) : []);
          if (vac.length > 0) {
            if (!result[dateKey]) result[dateKey] = {};
            result[dateKey].vacation = vac;
          }
        }
      } catch (e) {
        console.warn(`${NS} vacation load error:`, dateKey, e);
      }
    }
    return result;
  }

  /**
   * (2025-09-02 13:45 KST) 근무 원본 월 적재
   * - 날짜 문서의 end[] 마지막 요소의 duration(분)만 사용
   * 반환: { 'YYYY-MM-DD': { end: EndItem[] }, ... }
   */
  async function loadMonthlyWorkFromDates(year, monthIndex, email) {
    const result = {};
    if (!window.firebase?.firestore) return result;

    const db = window.firebase.firestore();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      try {
        const snap = await db
          .collection("records").doc(email)
          .collection("dates").doc(dateKey).get();

        if (snap.exists) {
          const data = snap.data();
          const ends = Array.isArray(data?.end) ? data.end : [];
          if (ends.length > 0) {
            result[dateKey] = { end: ends };
          }
        }
      } catch (e) {
        console.warn(`${NS} work load error:`, dateKey, e);
      }
    }
    return result;
  }

  // (2025-09-02 13:45 KST) 일 근무분(분) 계산: end[] 마지막 요소의 duration
  function extractDayWorkMinutesFromEndArray(endArr) {
    if (!Array.isArray(endArr) || endArr.length === 0) return 0;
    const last = endArr[endArr.length - 1];
    const dur = Number(last?.duration || 0);
    return Number.isFinite(dur) && dur > 0 ? Math.floor(dur) : 0;
  }

  // (2025-09-02 13:45 KST) 월 근무분(분) 계산: 날짜별 합산
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

  // ============================================================
  // 4) 보상 적립(연장근무) — 스텁
  // ============================================================

  /**
   * (2025-09-02 13:40 KST) 승인 연장근무 합(분) 조회 스텁
   * - 규칙 확정 전까지 0 반환
   */
  async function getApprovedOvertimeMinutes(year, monthIndex, email) {
    try { return 0; } catch { return 0; }
  }

  // ============================================================
  // 5) 연간 집계 (캐시 우선)
  // ============================================================

  async function collectYearFromFirestore(year, userEmail) {
    const email =
      userEmail ||
      global?.MonthlyReportFirestore?.currentUserEmail ||
      global?.USER_DATA?.email ||
      global?.currentUser?.email ||
      null;

    if (!email) {
      console.warn(`${NS} 사용자 이메일 누락`);
      return null;
    }

    CacheManager.ensureLoaded(email);

    const kpi = {
      totalWorkMinutes: 0,
      avgWorkMinutesPerMonth: 0,
      totalCompMinutes: 0, // 적립(보류: 0 또는 스텁)
      usedAnnualMinutes: 0,
      usedCompMinutes: 0,
    };

    const months = [];
    let valid = 0;
    let compCumMinutes = 0;

    for (let m = 0; m < 12; m++) {
      // ==== 캐시에서 월 데이터 확보 ====
      let monthCache = CacheManager.getMonth(email, year, m);
      const needRefresh = !monthCache || CacheManager.isExpired(email);

      if (!monthCache || needRefresh) {
        // 휴가/근무 원본 모두 프리패치
        const [vacMonth, workMonth] = await Promise.all([
          loadMonthlyVacationFromDates(year, m, email),
          loadMonthlyWorkFromDates(year, m, email),
        ]);

        // 병합하여 캐시에 저장
        const merged = {};
        const keys = new Set([...Object.keys(vacMonth), ...Object.keys(workMonth)]);
        for (const k of keys) {
          merged[k] = {
            ...(vacMonth[k] || {}),
            ...(workMonth[k] || {}),
          };
        }
        CacheManager.setMonth(email, year, m, merged);
        monthCache = merged;
      }

      // ==== 월별 계산 ====
      // 1) 휴가 사용 분리
      const { annualUsedMin, compUsedMin } = splitVacationUsedMinutesFromRecords(monthCache);

      // 2) 근무시간 합산
      const workMinutes = sumMonthlyWorkMinutesFromRecords(monthCache);

      // 3) 보상 적립(누계) — 스텁/0 또는 추후 규칙 반영
      let monthlyOvertimeMin = await getApprovedOvertimeMinutes(year, m, email);
      compCumMinutes += monthlyOvertimeMin;

      // 4) 월 구조
      const DAY_MIN = 7 * 60;
      const toHalf = (min) => Math.round((min / DAY_MIN) * 2) / 2;

      months.push({
        month: m + 1,
        workMinutes: workMinutes,
        vacationMinutes: annualUsedMin + compUsedMin,
        annualUsedMinutes: annualUsedMin,
        compUsedMinutes: compUsedMin,
        compMinutesCumulative: compCumMinutes,

        // 하위호환
        compDaysCumulative: toHalf(compCumMinutes),
        annualUsedDays: toHalf(annualUsedMin),
      });

      // KPI 누적
      kpi.totalWorkMinutes  += workMinutes;
      kpi.totalCompMinutes  += monthlyOvertimeMin; // 적립(보류)
      kpi.usedAnnualMinutes += annualUsedMin;
      kpi.usedCompMinutes   += compUsedMin;

      if (workMinutes > 0) valid++;
    }

    kpi.avgWorkMinutesPerMonth = valid ? Math.round(kpi.totalWorkMinutes / valid) : 0;

    // 디버그 요약
    try {
      console.table(
        months.map((x) => ({
          month: x.month,
          workMin: x.workMinutes,
          annualUseMin: x.annualUsedMinutes,
          compUseMin: x.compUsedMinutes,
          compCumMin: x.compMinutesCumulative,
        }))
      );
    } catch {}

    console.log(`${NS} ${year}년 KPI:`, kpi);
    return { kpi, months };
  }

  // ============================================================
  // 6) 퍼사드
  // ============================================================

  const WorkReportAdapter = {
    provider: "MonthlyReportFirestore", // (2025-09-02 13:40 KST) 고정

    detect() {
      if (global.MonthlyReportFirestore?.loadMonthlyData) {
        console.info(`${NS} provider = MonthlyReportFirestore`);
        return "MonthlyReportFirestore";
      }
      console.warn(`${NS} provider not found; cache-only path`);
      return null;
    },

    async fetchYearSummary(year, userEmail) {
      return collectYearFromFirestore(year, userEmail);
    },

    // 캐시 제어 헬퍼
    cache: {
      invalidate(email) {
        CacheManager.invalidate(email);
      },
      getMonth(email, year, monthIndex) {
        return CacheManager.getMonth(email, year, monthIndex);
      },
      async primeMonth(email, year, monthIndex) {
        const [vac, work] = await Promise.all([
          loadMonthlyVacationFromDates(year, monthIndex, email),
          loadMonthlyWorkFromDates(year, monthIndex, email),
        ]);
        const merged = {};
        const keys = new Set([...Object.keys(vac), ...Object.keys(work)]);
        for (const k of keys) merged[k] = { ...(vac[k] || {}), ...(work[k] || {}) };
        CacheManager.setMonth(email, year, monthIndex, merged);
        return merged;
      },
    },
  };

  // ============================================================
  // 7) 디버그 도우미
  // ============================================================

  const WorkReportDebug = {
    verbose: false,

    async demo(year) {
      return WorkReportAdapter.fetchYearSummary(year || new Date().getFullYear());
    },

    async analyzeMonth(year, monthIndex) {
      const email =
        global?.MonthlyReportFirestore?.currentUserEmail ||
        global?.USER_DATA?.email ||
        global?.currentUser?.email ||
        null;

      if (!email) {
        console.warn("[WorkReportDebug] 사용자 이메일 없음");
        return;
      }

      CacheManager.ensureLoaded(email);
      let month = CacheManager.getMonth(email, year, monthIndex);
      if (!month || CacheManager.isExpired(email)) {
        month = await WorkReportAdapter.cache.primeMonth(email, year, monthIndex);
      }

      const vac = splitVacationUsedMinutesFromRecords(month);
      const work = sumMonthlyWorkMinutesFromRecords(month);

      console.group(`[WorkReportDebug] ${year}-${String(monthIndex + 1).padStart(2, "0")}`);
      console.log("vacation split:", vac);
      console.log("workMinutes:", work);
      console.groupEnd();
    },

    scan(year) {
      console.group("[WorkReportDebug.scan]");
      const mods = [
        "MonthlyReportIntegration",
        "MonthlyReportFirestore",
        "MonthlyReportUI",
        "MonthlyReportCore",
        "MonthlyReportCalendar",
      ].filter((n) => !!global[n]);
      console.log("providers:", mods);
      WorkReportAdapter.detect();
      console.groupEnd();
    },
  };

  // 전역 등록
  global.WorkReportAdapter = WorkReportAdapter;
  global.WorkReportDebug = WorkReportDebug;

})(window);
