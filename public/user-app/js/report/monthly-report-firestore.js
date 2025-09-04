// monthly-report-firestore.js
// 월간 근무 내역 데이터 조회 및 관리 (2025년 8월 27일 생성됨)

// 데이터 상태 관리
let monthlyDataState = {
  currentUserEmail: null,
  monthlyRecords: {},
  monthlyStats: {},
  isLoading: false,
  lastLoadedMonth: null
};

// Firebase 준비 완료 후 데이터 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeMonthlyReportFirestore();
});

/**
 * 월간 근무 내역 데이터 시스템 초기화 (2025년 8월 27일 생성됨)
 */
function initializeMonthlyReportFirestore() {
  console.log("[MONTHLY-REPORT-FIRESTORE] 데이터 시스템 초기화 시작...");
  
  try {
    // 인증 상태 변경 감지
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        monthlyDataState.currentUserEmail = user.email;
        console.log("[MONTHLY-REPORT-FIRESTORE] 사용자 로그인:", user.email);
      } else {
        monthlyDataState.currentUserEmail = null;
        monthlyDataState.monthlyRecords = {};
        monthlyDataState.monthlyStats = {};
        console.log("[MONTHLY-REPORT-FIRESTORE] 사용자 로그아웃");
      }
    });
    
    console.log("[MONTHLY-REPORT-FIRESTORE] 데이터 시스템 초기화 완료");
    
  } catch (error) {
    console.error("[MONTHLY-REPORT-FIRESTORE] 데이터 시스템 초기화 중 오류:", error);
  }
}

/**
 * 월간 데이터 로드 (2025년 8월 27일 21:20 수정됨)
 */
async function loadMonthlyData(year, month, userEmail) {
  if (monthlyDataState.isLoading) {
    console.log("[MONTHLY-REPORT-FIRESTORE] 이미 데이터 로딩 중...");
    return;
  }
  
  console.log(`[MONTHLY-REPORT-FIRESTORE] 월간 데이터 로드 시작: ${year}년 ${month + 1}월`);
  
  monthlyDataState.isLoading = true;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  try {
    // 월간 데이터 조회 (2025년 8월 27일 21:20 함수명 변경)
    const monthlyRecords = await getMonthlyRecordsFromCache(year, month, userEmail);
    
    console.log("[MONTHLY-REPORT-FIRESTORE] 데이터 조회 완료, 개수:", Object.keys(monthlyRecords).length);
    
    // 데이터 저장
    monthlyDataState.monthlyRecords = monthlyRecords;
    monthlyDataState.lastLoadedMonth = monthKey;
    
    // 통계 계산
    const monthlyStats = calculateMonthlyStats(year, month, monthlyRecords);
    monthlyDataState.monthlyStats = monthlyStats;
    
    // UI 업데이트
    updateUI(monthlyRecords, monthlyStats);
    
    console.log("[MONTHLY-REPORT-FIRESTORE] 월간 데이터 로드 완료");
    console.log("- 총 데이터 수:", Object.keys(monthlyRecords).length);
    console.log("- 통계:", monthlyStats);
    
  } catch (error) {
    console.error("[MONTHLY-REPORT-FIRESTORE] 월간 데이터 로드 중 오류:", error);
    
    // 에러 시 기본 통계로 UI 업데이트
    const emptyStats = {
      totalMinutes: 0,
      standardMinutes: calculateStandardWorkMinutes(year, month),
      overtimeMinutes: 0,
      vacationMinutes: 0,
      workDaysCount: 0,
      totalDaysInMonth: new Date(year, month + 1, 0).getDate(),
      year: year,
      month: month
    };
    
    updateUI({}, emptyStats);
    
  } finally {
    monthlyDataState.isLoading = false;
  }
}

/**
 * 캐시에서 월간 데이터 조회 (2025년 8월 27일 21:40 수정됨)
 */
async function getMonthlyRecordsFromCache(year, month, userEmail) {
  console.log(`[MONTHLY-REPORT-FIRESTORE] 캐시에서 월간 데이터 조회: ${year}년 ${month + 1}월`);
  
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // 먼저 해당 월 데이터가 캐시에 있는지 확인 (2025년 8월 27일 21:40 수정)
  const checkCacheForMonth = (cacheData) => {
    if (!cacheData) return { hasData: false, filteredData: {} };
    
    const filteredData = {};
    Object.keys(cacheData).forEach(dateStr => {
      if (dateStr.startsWith(monthKey)) {
        filteredData[dateStr] = cacheData[dateStr];
      }
    });
    
    return {
      hasData: Object.keys(filteredData).length > 0,
      filteredData: filteredData
    };
  };
  
  // WorkHistoryModule 캐시 확인
  if (window.WorkHistoryModule?.cachedRecords) {
    const cacheResult = checkCacheForMonth(window.WorkHistoryModule.cachedRecords);
    console.log(`[MONTHLY-REPORT-FIRESTORE] WorkHistoryModule 캐시: 전체 ${Object.keys(window.WorkHistoryModule.cachedRecords).length}개, 해당월 ${Object.keys(cacheResult.filteredData).length}개`);
    
    if (cacheResult.hasData) {
      return cacheResult.filteredData;
    }
  }
  
  // 전역 캐시 확인
  if (window.cachedRecords) {
    const cacheResult = checkCacheForMonth(window.cachedRecords);
    console.log(`[MONTHLY-REPORT-FIRESTORE] 전역 캐시: 전체 ${Object.keys(window.cachedRecords).length}개, 해당월 ${Object.keys(cacheResult.filteredData).length}개`);
    
    if (cacheResult.hasData) {
      return cacheResult.filteredData;
    }
  }
  
  // 캐시에 해당 월 데이터가 없으면 항상 Firestore에서 직접 조회 (2025년 8월 27일 21:40 수정)
  console.log(`[MONTHLY-REPORT-FIRESTORE] ${monthKey} 데이터가 캐시에 없음, Firestore 직접 조회`);
  return await fetchFromFirestore(year, month, userEmail);
}

/**
 * Firestore에서 직접 데이터 조회 (2025년 8월 27일 21:20 새로 생성됨)
 */
async function fetchFromFirestore(year, month, userEmail) {
  if (!userEmail || !firebase?.firestore) {
    console.warn(`[MONTHLY-REPORT-FIRESTORE] userEmail 또는 Firestore 없음`);
    return {};
  }
  
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
    
    const recordsRef = firebase.firestore()
      .collection('records')
      .doc(userEmail)
      .collection('dates');
    
    const querySnapshot = await recordsRef
      .where(firebase.firestore.FieldPath.documentId(), '>=', startDate)
      .where(firebase.firestore.FieldPath.documentId(), '<=', endDate)
      .get();
    
    const monthlyRecords = {};
    querySnapshot.forEach(doc => {
      monthlyRecords[doc.id] = doc.data();
    });
    
    console.log(`[MONTHLY-REPORT-FIRESTORE] Firestore에서 조회: ${Object.keys(monthlyRecords).length}개`);
    return monthlyRecords;
    
  } catch (error) {
    console.error(`[MONTHLY-REPORT-FIRESTORE] Firestore 조회 오류:`, error);
    return {};
  }
}

/**
 * 월간 통계 계산 (2025년 8월 27일 생성됨)
 */
function calculateMonthlyStats(year, month, monthlyRecords) {
  console.log("[MONTHLY-REPORT-FIRESTORE] 월간 통계 계산 시작...");
  
  // 기준근무시간 계산
  const standardMinutes = calculateStandardWorkMinutes(year, month);
  
  // 실제 근무시간 집계
  let totalWorkMinutes = 0;
  let totalVacationMinutes = 0;
  let workDaysCount = 0;
  
  Object.entries(monthlyRecords).forEach(([dateStr, dayData]) => {
    const dayWorkTime = calculateDayWorkTime(dayData);
    const dayVacationTime = calculateDayVacationTime(dayData);
    
    if (dayWorkTime > 0) {
      totalWorkMinutes += dayWorkTime;
      workDaysCount++;
    }
    
    totalVacationMinutes += dayVacationTime;
  });
  
  const stats = {
    totalMinutes: totalWorkMinutes,
    standardMinutes: standardMinutes,
    overtimeMinutes: Math.max(0, totalWorkMinutes - standardMinutes),
    vacationMinutes: totalVacationMinutes,
    workDaysCount: workDaysCount,
    totalDaysInMonth: new Date(year, month + 1, 0).getDate(),
    year: year,
    month: month
  };
  
  console.log("[MONTHLY-REPORT-FIRESTORE] 통계 계산 완료:", stats);
  return stats;
}

/**
 * 기준근무시간 계산 (평일 × 7시간 - 공휴일) (2025년 8월 27일 생성됨)
 */
function calculateStandardWorkMinutes(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 주말이 아니고 공휴일이 아닌 경우만 근무일로 계산
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(dateStr)) {
      workDays++;
    }
  }
  
  const standardMinutes = workDays * 7 * 60;
  console.log(`[MONTHLY-REPORT-FIRESTORE] 기준근무시간: ${workDays}일 × 7시간 = ${Math.floor(standardMinutes/60)}시간`);
  
  return standardMinutes;
}

/**
 * 공휴일 체크 (2025년 8월 27일 생성됨)
 */
function isHoliday(dateStr) {
  if (window.holidays && Array.isArray(window.holidays)) {
    return window.holidays.some(holiday => holiday.date === dateStr);
  }
  
  if (typeof window.isHoliday === 'function') {
    return window.isHoliday(dateStr);
  }
  
  return false;
}

/**
 * 일일 근무시간 계산 (2025년 8월 27일 생성됨)
 */
function calculateDayWorkTime(dayData) {
  if (!dayData?.start?.length || !dayData?.end?.length) {
    return 0;
  }
  
  // 가장 최근 퇴근 기록의 duration 사용
  const latestEnd = dayData.end
    .filter(endRecord => endRecord.duration)
    .sort((a, b) => new Date(`1970/01/01 ${convertTo24Hour(a.time)}`) - new Date(`1970/01/01 ${convertTo24Hour(b.time)}`))
    .pop();
  
  if (!latestEnd?.duration) {
    return 0;
  }
  
  return parseDurationToMinutes(latestEnd.duration);
}

/**
 * 일일 휴가시간 계산 (2025년 8월 27일 생성됨)
 */
function calculateDayVacationTime(dayData) {
  if (!dayData?.vacation?.length) {
    return 0;
  }
  
  let totalVacationMinutes = 0;
  
  dayData.vacation.forEach(vacation => {
    const startMinutes = parseTimeToMinutes(vacation.start);
    const endMinutes = parseTimeToMinutes(vacation.end);
    
    if (!isNaN(startMinutes) && !isNaN(endMinutes) && endMinutes > startMinutes) {
      let vacationDuration = endMinutes - startMinutes;
      
      // 점심시간과 겹치는 경우 제외 (11:30-13:00)
      const lunchStart = 11 * 60 + 30;
      const lunchEnd = 13 * 60;
      
      const overlapStart = Math.max(startMinutes, lunchStart);
      const overlapEnd = Math.min(endMinutes, lunchEnd);
      
      if (overlapStart < overlapEnd) {
        vacationDuration -= (overlapEnd - overlapStart);
      }
      
      totalVacationMinutes += Math.max(0, vacationDuration);
    }
  });
  
  return totalVacationMinutes;
}

/**
 * duration 문자열을 분 단위로 변환 (2025년 8월 27일 생성됨)
 */
function parseDurationToMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  
  const hoursMatch = durationStr.match(/(\d+)시간/);
  const minutesMatch = durationStr.match(/(\d+)분/);
  
  let totalMinutes = 0;
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }
  
  return totalMinutes;
}

/**
 * 시간 문자열을 분 단위로 변환 (HH:MM 형식) (2025년 8월 27일 생성됨)
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return NaN;
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return NaN;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  return hours * 60 + minutes;
}

/**
 * 오전/오후 시간을 24시간 형식으로 변환 (2025년 8월 27일 생성됨)
 */
function convertTo24Hour(time) {
  if (!time) return null;
  
  const match = time.match(/(오전|오후)?\s?(\d{1,2}):(\d{2})/);
  if (!match) return time;
  
  let [, period, hour, minute] = match;
  hour = parseInt(hour, 10);
  
  if (period === '오후' && hour !== 12) {
    hour += 12;
  } else if (period === '오전' && hour === 12) {
    hour = 0;
  }
  
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

/**
 * UI 업데이트 (2025년 8월 27일 생성됨)
 */
function updateUI(monthlyRecords, monthlyStats) {
  // 달력에 데이터 업데이트
  if (window.MonthlyReportCalendar?.updateCalendarData) {
    window.MonthlyReportCalendar.updateCalendarData(monthlyRecords);
  }
  
  // 통계 카드 업데이트
  if (window.MonthlyReportUI?.updateStatsCards) {
    window.MonthlyReportUI.updateStatsCards(monthlyStats);
  }
  
  // 프로그레스 바 업데이트
  if (window.MonthlyReportUI?.updateProgressBar) {
    window.MonthlyReportUI.updateProgressBar(monthlyStats);
  }
}

/**
 * 특정 날짜 데이터 조회 (2025년 8월 27일 생성됨)
 */
function getDayData(dateStr) {
  return monthlyDataState.monthlyRecords[dateStr] || null;
}

/**
 * 현재 로드된 통계 반환 (2025년 8월 27일 생성됨)
 */
function getCurrentStats() {
  return monthlyDataState.monthlyStats;
}

/**
 * 데이터 상태 확인 (2025년 8월 27일 생성됨)
 */
function getDataState() {
  return {
    isLoading: monthlyDataState.isLoading,
    userEmail: monthlyDataState.currentUserEmail,
    lastLoadedMonth: monthlyDataState.lastLoadedMonth,
    recordsCount: Object.keys(monthlyDataState.monthlyRecords).length,
    hasStats: Object.keys(monthlyDataState.monthlyStats).length > 0
  };
}

// 다른 모듈에서 사용할 수 있도록 전역 객체로 내보내기
window.MonthlyReportFirestore = {
  // 공개 함수들
  loadMonthlyData,
  getDayData,
  getCurrentStats,
  getDataState,
  
  // 상태 접근자
  get monthlyRecords() { return monthlyDataState.monthlyRecords; },
  get monthlyStats() { return monthlyDataState.monthlyStats; },
  get isLoading() { return monthlyDataState.isLoading; },
  get currentUserEmail() { return monthlyDataState.currentUserEmail; }
};

console.log("[MONTHLY-REPORT-FIRESTORE] 모듈 로드 완료");