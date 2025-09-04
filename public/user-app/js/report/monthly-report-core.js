// monthly-report-core.js
// 월간 근무 내역 비즈니스 로직 및 유틸리티 (2025년 8월 27일 생성됨)

// 비즈니스 로직 상태 관리
let monthlyReportCore = {
  workTimeRules: {
    standardDailyHours: 7,
    lunchBreakStart: { hour: 11, minute: 30 },
    lunchBreakEnd: { hour: 13, minute: 0 },
    overtimeThreshold: 52 * 7 * 60 // 주 52시간을 분 단위로
  },
  isInitialized: false
};

// Firebase 준비 완료 후 비즈니스 로직 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeMonthlyReportCore();
});

/**
 * 월간 근무 내역 비즈니스 로직 시스템 초기화 (2025년 8월 27일 생성됨)
 */
function initializeMonthlyReportCore() {
  console.log("🧠 [MONTHLY-REPORT-CORE] 비즈니스 로직 시스템 초기화 시작...");
  
  try {
    monthlyReportCore.isInitialized = true;
    console.log("✅ [MONTHLY-REPORT-CORE] 비즈니스 로직 시스템 초기화 완료");
    
  } catch (error) {
    console.error("❌ [MONTHLY-REPORT-CORE] 비즈니스 로직 시스템 초기화 중 오류:", error);
  }
}

/**
 * 월간 기준근무시간 계산 (평일 수 기반) (2025년 8월 27일 생성됨)
 */
function calculateMonthlyStandardHours(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workDaysCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dateStr = formatDateString(year, month, day);
    
    // 주말이 아니고 공휴일이 아닌 경우만 근무일로 계산
    if (!isWeekend(dayOfWeek) && !isHolidayDate(dateStr)) {
      workDaysCount++;
    }
  }
  
  const standardHours = workDaysCount * monthlyReportCore.workTimeRules.standardDailyHours;
  
  console.log(`🧠 [MONTHLY-REPORT-CORE] ${year}년 ${month + 1}월 기준근무시간: ${workDaysCount}일 × ${monthlyReportCore.workTimeRules.standardDailyHours}시간 = ${standardHours}시간`);
  
  return {
    workDaysCount: workDaysCount,
    standardHours: standardHours,
    standardMinutes: standardHours * 60
  };
}

/**
 * 근무시간 통계 계산 (2025년 8월 27일 생성됨)
 */
function calculateWorkTimeStats(monthlyRecords, year, month) {
  console.log("🧠 [MONTHLY-REPORT-CORE] 근무시간 통계 계산 시작...");
  
  // 기준근무시간 계산
  const standardInfo = calculateMonthlyStandardHours(year, month);
  
  // 실제 근무시간 계산
  let totalWorkMinutes = 0;
  let totalVacationMinutes = 0;
  let actualWorkDays = 0;
  const dailyWorkTimes = {};
  
  Object.entries(monthlyRecords).forEach(([dateStr, dayData]) => {
    const dayWorkMinutes = calculateDayWorkTimeInMinutes(dayData);
    const dayVacationMinutes = calculateDayVacationTimeInMinutes(dayData);
    
    if (dayWorkMinutes > 0) {
      totalWorkMinutes += dayWorkMinutes;
      actualWorkDays++;
      dailyWorkTimes[dateStr] = dayWorkMinutes;
    }
    
    if (dayVacationMinutes > 0) {
      totalVacationMinutes += dayVacationMinutes;
    }
  });
  
  // 초과근무시간 계산
  const overtimeMinutes = Math.max(0, totalWorkMinutes - standardInfo.standardMinutes);
  
  // 평균 근무시간 계산
  const avgDailyWorkMinutes = actualWorkDays > 0 ? totalWorkMinutes / actualWorkDays : 0;
  
  const stats = {
    // 기본 정보
    year: year,
    month: month,
    daysInMonth: new Date(year, month + 1, 0).getDate(),
    
    // 근무일 정보
    standardWorkDays: standardInfo.workDaysCount,
    actualWorkDays: actualWorkDays,
    
    // 시간 정보 (분 단위)
    totalMinutes: totalWorkMinutes,
    standardMinutes: standardInfo.standardMinutes,
    overtimeMinutes: overtimeMinutes,
    vacationMinutes: totalVacationMinutes,
    avgDailyMinutes: Math.round(avgDailyWorkMinutes),
    
    // 시간 정보 (시간 단위, 소수점 1자리)
    totalHours: Math.round(totalWorkMinutes / 60 * 10) / 10,
    standardHours: standardInfo.standardHours,
    overtimeHours: Math.round(overtimeMinutes / 60 * 10) / 10,
    vacationHours: Math.round(totalVacationMinutes / 60 * 10) / 10,
    avgDailyHours: Math.round(avgDailyWorkMinutes / 60 * 10) / 10,
    
    // 퍼센트 정보
    workDaysRate: standardInfo.workDaysCount > 0 ? Math.round(actualWorkDays / standardInfo.workDaysCount * 100) : 0,
    standardAchievementRate: standardInfo.standardMinutes > 0 ? Math.round(totalWorkMinutes / standardInfo.standardMinutes * 100) : 0,
    
    // 일별 근무시간 (분석용)
    dailyWorkTimes: dailyWorkTimes
  };
  
  console.log("🧠 [MONTHLY-REPORT-CORE] 통계 계산 완료:", {
    totalHours: stats.totalHours,
    standardHours: stats.standardHours,
    overtimeHours: stats.overtimeHours,
    workDaysRate: stats.workDaysRate,
    achievementRate: stats.standardAchievementRate
  });
  
  return stats;
}

/**
 * 일일 근무시간 계산 (분 단위) (2025년 8월 27일 생성됨)
 */
function calculateDayWorkTimeInMinutes(dayData) {
  if (!dayData || !dayData.start || !dayData.end || 
      dayData.start.length === 0 || dayData.end.length === 0) {
    return 0;
  }
  
  try {
    // 가장 최근 퇴근 기록 사용
    const latestEnd = dayData.end
      .filter(end => end.duration) // duration이 있는 것만
      .sort((a, b) => {
        const timeA = parseTimeString(a.time);
        const timeB = parseTimeString(b.time);
        return timeB - timeA; // 내림차순 정렬
      })[0];
    
    if (!latestEnd || !latestEnd.duration) {
      return 0;
    }
    
    return parseDurationStringToMinutes(latestEnd.duration);
    
  } catch (error) {
    console.error("🧠 [MONTHLY-REPORT-CORE] 일일 근무시간 계산 오류:", error);
    return 0;
  }
}

/**
 * 일일 휴가시간 계산 (분 단위) (2025년 8월 27일 생성됨)
 */
function calculateDayVacationTimeInMinutes(dayData) {
  if (!dayData || !dayData.vacation || dayData.vacation.length === 0) {
    return 0;
  }
  
  let totalVacationMinutes = 0;
  
  dayData.vacation.forEach(vacation => {
    try {
      const startMinutes = parseTimeToMinutes(vacation.start);
      const endMinutes = parseTimeToMinutes(vacation.end);
      
      if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return;
      }
      
      let vacationDuration = endMinutes - startMinutes;
      
      // 점심시간과 겹치는 부분 제외
      const lunchOverlap = calculateLunchTimeOverlap(startMinutes, endMinutes);
      vacationDuration -= lunchOverlap;
      
      totalVacationMinutes += Math.max(0, vacationDuration);
      
    } catch (error) {
      console.error("🧠 [MONTHLY-REPORT-CORE] 휴가시간 계산 오류:", error);
    }
  });
  
  return totalVacationMinutes;
}

/**
 * 점심시간 겹침 계산 (2025년 8월 27일 생성됨)
 */
function calculateLunchTimeOverlap(startMinutes, endMinutes) {
  const lunchStart = monthlyReportCore.workTimeRules.lunchBreakStart.hour * 60 + 
                     monthlyReportCore.workTimeRules.lunchBreakStart.minute;
  const lunchEnd = monthlyReportCore.workTimeRules.lunchBreakEnd.hour * 60 + 
                   monthlyReportCore.workTimeRules.lunchBreakEnd.minute;
  
  const overlapStart = Math.max(startMinutes, lunchStart);
  const overlapEnd = Math.min(endMinutes, lunchEnd);
  
  return overlapStart < overlapEnd ? (overlapEnd - overlapStart) : 0;
}

/**
 * 근무 패턴 분석 (2025년 8월 27일 생성됨)
 */
function analyzeWorkPatterns(monthlyRecords, stats) {
  console.log("🧠 [MONTHLY-REPORT-CORE] 근무 패턴 분석 시작...");
  
  const patterns = {
    // 요일별 근무 패턴
    weekdayStats: analyzeWeekdayPatterns(monthlyRecords),
    
    // 근무시간 분포
    workTimeDistribution: analyzeWorkTimeDistribution(stats.dailyWorkTimes),
    
    // 휴가 사용 패턴
    vacationPatterns: analyzeVacationPatterns(monthlyRecords),
    
    // 지각/조기퇴근 분석
    attendanceIssues: analyzeAttendanceIssues(monthlyRecords)
  };
  
  console.log("🧠 [MONTHLY-REPORT-CORE] 근무 패턴 분석 완료");
  
  return patterns;
}

/**
 * 요일별 근무 패턴 분석 (2025년 8월 27일 생성됨)
 */
function analyzeWeekdayPatterns(monthlyRecords) {
  const weekdayStats = {
    0: { name: '일요일', count: 0, totalMinutes: 0 },
    1: { name: '월요일', count: 0, totalMinutes: 0 },
    2: { name: '화요일', count: 0, totalMinutes: 0 },
    3: { name: '수요일', count: 0, totalMinutes: 0 },
    4: { name: '목요일', count: 0, totalMinutes: 0 },
    5: { name: '금요일', count: 0, totalMinutes: 0 },
    6: { name: '토요일', count: 0, totalMinutes: 0 }
  };
  
  Object.entries(monthlyRecords).forEach(([dateStr, dayData]) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const workMinutes = calculateDayWorkTimeInMinutes(dayData);
    
    if (workMinutes > 0) {
      weekdayStats[dayOfWeek].count++;
      weekdayStats[dayOfWeek].totalMinutes += workMinutes;
    }
  });
  
  // 평균 계산
  Object.values(weekdayStats).forEach(stat => {
    stat.avgMinutes = stat.count > 0 ? Math.round(stat.totalMinutes / stat.count) : 0;
    stat.avgHours = Math.round(stat.avgMinutes / 60 * 10) / 10;
  });
  
  return weekdayStats;
}

/**
 * 근무시간 분포 분석 (2025년 8월 27일 생성됨)
 */
function analyzeWorkTimeDistribution(dailyWorkTimes) {
  const workTimes = Object.values(dailyWorkTimes);
  
  if (workTimes.length === 0) {
    return {
      min: 0, max: 0, avg: 0, median: 0,
      underStandard: 0, standard: 0, overStandard: 0
    };
  }
  
  workTimes.sort((a, b) => a - b);
  
  const standardMinutes = monthlyReportCore.workTimeRules.standardDailyHours * 60;
  
  return {
    min: Math.round(workTimes[0] / 60 * 10) / 10,
    max: Math.round(workTimes[workTimes.length - 1] / 60 * 10) / 10,
    avg: Math.round(workTimes.reduce((sum, time) => sum + time, 0) / workTimes.length / 60 * 10) / 10,
    median: Math.round(workTimes[Math.floor(workTimes.length / 2)] / 60 * 10) / 10,
    underStandard: workTimes.filter(time => time < standardMinutes).length,
    standard: workTimes.filter(time => time >= standardMinutes && time <= standardMinutes + 60).length,
    overStandard: workTimes.filter(time => time > standardMinutes + 60).length
  };
}

/**
 * 휴가 사용 패턴 분석 (2025년 8월 27일 생성됨)
 */
function analyzeVacationPatterns(monthlyRecords) {
  let vacationDays = 0;
  let totalVacationMinutes = 0;
  const vacationTypes = {};
  
  Object.values(monthlyRecords).forEach(dayData => {
    if (dayData.vacation && dayData.vacation.length > 0) {
      vacationDays++;
      
      dayData.vacation.forEach(vacation => {
        const vacationType = vacation.type || '기타';
        vacationTypes[vacationType] = (vacationTypes[vacationType] || 0) + 1;
        
        const vacationMinutes = calculateDayVacationTimeInMinutes({ vacation: [vacation] });
        totalVacationMinutes += vacationMinutes;
      });
    }
  });
  
  return {
    vacationDays: vacationDays,
    totalVacationHours: Math.round(totalVacationMinutes / 60 * 10) / 10,
    avgVacationHoursPerDay: vacationDays > 0 ? Math.round(totalVacationMinutes / vacationDays / 60 * 10) / 10 : 0,
    vacationTypes: vacationTypes
  };
}

/**
 * 출근 문제 분석 (지각, 조기퇴근 등) (2025년 8월 27일 생성됨)
 */
function analyzeAttendanceIssues(monthlyRecords) {
  let lateCount = 0;
  let earlyLeaveCount = 0;
  const standardStartHour = 9; // 오전 9시 기준
  const standardEndHour = 18; // 오후 6시 기준
  
  Object.values(monthlyRecords).forEach(dayData => {
    // 지각 체크
    if (dayData.start && dayData.start.length > 0) {
      const startTime = parseTimeString(dayData.start[0].time);
      const startHour = Math.floor(startTime / 3600);
      if (startHour > standardStartHour) {
        lateCount++;
      }
    }
    
    // 조기퇴근 체크 (근무시간이 6시간 미만인 경우)
    const dayWorkMinutes = calculateDayWorkTimeInMinutes(dayData);
    if (dayWorkMinutes > 0 && dayWorkMinutes < 6 * 60) {
      earlyLeaveCount++;
    }
  });
  
  return {
    lateCount: lateCount,
    earlyLeaveCount: earlyLeaveCount,
    attendanceRate: Object.keys(monthlyRecords).length > 0 ? 
                    Math.round((Object.keys(monthlyRecords).length - lateCount) / Object.keys(monthlyRecords).length * 100) : 100
  };
}

/**
 * 유틸리티: 날짜 문자열 포맷 (2025년 8월 27일 생성됨)
 */
function formatDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 유틸리티: 주말 체크 (2025년 8월 27일 생성됨)
 */
function isWeekend(dayOfWeek) {
  return dayOfWeek === 0 || dayOfWeek === 6; // 일요일(0) 또는 토요일(6)
}

/**
 * 유틸리티: 공휴일 체크 (2025년 8월 27일 생성됨)
 */
function isHolidayDate(dateStr) {
  // holidays.js의 전역 holidays 배열 사용
  if (typeof window.holidays !== 'undefined' && Array.isArray(window.holidays)) {
    return window.holidays.some(holiday => holiday.date === dateStr);
  }
  
  // 전역 isHoliday 함수 시도
  if (typeof window.isHoliday === 'function') {
    return window.isHoliday(dateStr);
  }
  
  return false;
}

/**
 * 유틸리티: duration 문자열을 분 단위로 변환 (2025년 8월 27일 생성됨)
 */
function parseDurationStringToMinutes(durationStr) {
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
 * 유틸리티: 시간 문자열을 분 단위로 변환 (2025년 8월 27일 생성됨)
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
 * 유틸리티: 시간 문자열을 초 단위로 변환 (2025년 8월 27일 생성됨)
 */
function parseTimeString(timeStr) {
  if (!timeStr) return 0;
  
  // 오전/오후 형식 처리
  let cleanTime = timeStr;
  if (timeStr.includes('오전') || timeStr.includes('오후')) {
    const match = timeStr.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
    if (match) {
      let [, period, hour, minute] = match;
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);
      
      if (period === '오후' && hour !== 12) {
        hour += 12;
      } else if (period === '오전' && hour === 12) {
        hour = 0;
      }
      
      return hour * 3600 + minute * 60;
    }
  }
  
  // 24시간 형식 처리
  const match = cleanTime.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 3600 + minutes * 60;
  }
  
  return 0;
}

/**
 * 근무시간 규칙 업데이트 (2025년 8월 27일 생성됨)
 */
function updateWorkTimeRules(newRules) {
  monthlyReportCore.workTimeRules = {
    ...monthlyReportCore.workTimeRules,
    ...newRules
  };
  
  console.log("🧠 [MONTHLY-REPORT-CORE] 근무시간 규칙 업데이트:", monthlyReportCore.workTimeRules);
}

/**
 * 시스템 상태 확인 (2025년 8월 27일 생성됨)
 */
function getCoreSystemStatus() {
  return {
    isInitialized: monthlyReportCore.isInitialized,
    workTimeRules: monthlyReportCore.workTimeRules
  };
}

// 다른 모듈에서 사용할 수 있도록 전역 객체로 내보내기
window.MonthlyReportCore = {
  // 주요 계산 함수들
  calculateMonthlyStandardHours,
  calculateWorkTimeStats,
  analyzeWorkPatterns,
  calculateDayWorkTimeInMinutes,
  calculateDayVacationTimeInMinutes,
  
  // 유틸리티 함수들
  formatDateString,
  isWeekend,
  isHolidayDate,
  parseDurationStringToMinutes,
  parseTimeToMinutes,
  parseTimeString,
  
  // 시스템 관리
  updateWorkTimeRules,
  getCoreSystemStatus,
  
  // 상태 접근자
  get workTimeRules() { return monthlyReportCore.workTimeRules; },
  get isInitialized() { return monthlyReportCore.isInitialized; }
};

console.log("🧠 [MONTHLY-REPORT-CORE] 모듈 로드 완료");