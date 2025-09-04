// time-utils.js
// 시간 계산 및 변환 유틸리티 함수들 (2025년 1월 31일 17:10 생성됨)

// Firebase 준비 완료 후 시간 유틸리티 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeTimeUtils();
});

// 시간 유틸리티 시스템 초기화 (2025년 1월 31일 17:10 생성됨)
function initializeTimeUtils() {
  console.log('시간 유틸리티 시스템 초기화 완료');
}

// 시간 문자열을 초 단위로 변환 (2025년 1월 31일 17:10 수정됨)
function parseTime(timeStr) {
  console.log("parseTime 호출됨, 입력 값:", timeStr);

  if (typeof timeStr !== "string") {
    console.error("시간 값이 문자열이 아닙니다:", timeStr);
    return NaN;
  }

  // 오전/오후 및 HH:mm:ss 형식 처리
  const timePattern = /^(AM|PM|오전|오후)?\s?(\d+):(\d+):?(\d+)?$/i;
  const match = timeStr.match(timePattern);

  if (!match) {
    console.error("시간 형식이 올바르지 않습니다:", timeStr);
    return NaN;
  }

  let [, ampm, hoursStr, minutesStr, secondsStr] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr || "0", 10);

  // PM 처리
  if (/PM|오후/i.test(ampm) && hours !== 12) {
    hours += 12;
  }

  // AM 처리
  if (/AM|오전/i.test(ampm) && hours === 12) {
    hours = 0;
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  console.log("변환된 시간 (초):", totalSeconds);
  return totalSeconds;
}

// 근무 시간 계산 함수 (2025년 1월 31일 17:10 수정됨)
// 시작 시간과 종료 시간의 차이를 계산하며, 점심시간과 휴가 시간을 제외
function calculateWorkTime(startTime, endTime, vacationTimes = []) {
  console.log("calculateWorkTime 호출됨");
  console.log("시작 시간 (초):", startTime, "종료 시간 (초):", endTime);
  console.log("vacationTimes 데이터:", vacationTimes);

  if (isNaN(startTime) || isNaN(endTime)) {
    console.error("유효하지 않은 시작 시간 또는 종료 시간");
    return { hours: 0, minutes: 0 };
  }

  const lunchStart = 11 * 3600 + 30 * 60; // 점심 시작 (11:30)
  const lunchEnd = 13 * 3600; // 점심 종료 (13:00)

  let totalSeconds = endTime - startTime;

  // 점심시간 제외
  if (startTime < lunchEnd && endTime > lunchStart) {
    const lunchOverlapStart = Math.max(startTime, lunchStart);
    const lunchOverlapEnd = Math.min(endTime, lunchEnd);
    const lunchDuration = lunchOverlapEnd - lunchOverlapStart;

    console.log("점심시간 제외:", lunchDuration, "초");
    totalSeconds -= lunchDuration;
  }

  // 휴가 시간을 제외
  vacationTimes.forEach(({ start, end }) => {
    const vacationStart = parseTime(start);
    const vacationEnd = parseTime(end);

    console.log(
      "휴가 시작 (초):",
      vacationStart,
      "휴가 종료 (초):",
      vacationEnd
    );

    if (
      isNaN(vacationStart) ||
      isNaN(vacationEnd) ||
      vacationStart >= vacationEnd ||
      vacationEnd <= startTime ||
      vacationStart >= endTime
    ) {
      // 유효하지 않거나, 근무 시간 외에 포함된 휴가 구간 무시
      console.warn("유효하지 않은 휴가 시간 또는 근무 시간 외의 휴가:", {
        start,
        end,
      });
      return;
    }

    const overlapStart = Math.max(startTime, vacationStart);
    const overlapEnd = Math.min(endTime, vacationEnd);

    if (overlapStart < overlapEnd) {
      const vacationDuration = overlapEnd - overlapStart;
      console.log("휴가 시간 제외:", vacationDuration, "초");
      totalSeconds -= vacationDuration;
    }
  });

  if (totalSeconds < 0) {
    console.error("총 근무 시간이 음수입니다. 데이터 확인 필요.");
    return { hours: 0, minutes: 0 };
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  console.log("계산된 근무 시간:", hours, "시간", minutes, "분");
  return { hours, minutes };
}

// duration 문자열을 분(minutes) 단위로 변환하는 헬퍼 함수 (2025년 1월 31일 17:10 수정됨)
function parseDurationStringToMinutes(durationString) {
  const hoursMatch = String(durationString).match(/(\d+)시간/);
  const minutesMatch = String(durationString).match(/(\d+)분/);
  let totalMinutes = 0;
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }
  return totalMinutes;
}

// 분을 시간 문자열로 변환하는 함수 (2025년 1월 31일 17:10 수정됨)
function formatMinutesToDurationString(totalMinutes) {
  if (totalMinutes < 0) totalMinutes = 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0 && minutes > 0) {
    result = `${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    result = `${hours}시간`;
  } else if (minutes > 0) {
    result = `${minutes}분`;
  } else {
    result = "0분";
  }
  return result;
}

// 오전/오후 시간을 24시간 형식으로 변환 (2025년 1월 31일 17:10 수정됨)
function convertTo24Hour(time) {
  const match = time.match(/(오전|오후)?\s?(\d{1,2}):(\d{2})/);
  if (!match) return "-";

  let [, period, hour, minute] = match;
  hour = parseInt(hour, 10);
  if (period === "오후" && hour !== 12) hour += 12;
  if (period === "오전" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

// duration 문자열을 "분" 단위 숫자로 변환하는 함수 (2025년 1월 31일 17:10 수정됨)
function convertDurationToMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return 0;

  const match = durationStr.match(/(\d+)시간\s*(\d+)?분?/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  return hours * 60 + minutes;
}

// 시간 계산 관련 상수들 (2025년 1월 31일 17:10 생성됨)
const TIME_CONSTANTS = {
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_HOUR: 3600,
  HOURS_IN_DAY: 24,
  LUNCH_START_SECONDS: 11 * 3600 + 30 * 60, // 11:30
  LUNCH_END_SECONDS: 13 * 3600, // 13:00
  LUNCH_DURATION_SECONDS: 1.5 * 3600, // 1.5시간
  STANDARD_WORK_HOURS: 7, // 표준 근무 시간
  FULL_WORK_HOURS: 52 * 60, // 주간 목표 근무시간 (분 단위)
};

// 시간을 다양한 형식으로 변환하는 함수들 (2025년 1월 31일 17:10 생성됨)

// 초를 시:분:초 형식으로 변환
function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_IN_HOUR);
  const minutes = Math.floor((seconds % TIME_CONSTANTS.SECONDS_IN_HOUR) / TIME_CONSTANTS.SECONDS_IN_MINUTE);
  const remainingSeconds = seconds % TIME_CONSTANTS.SECONDS_IN_MINUTE;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// 분을 시:분 형식으로 변환
function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / TIME_CONSTANTS.MINUTES_IN_HOUR);
  const remainingMinutes = minutes % TIME_CONSTANTS.MINUTES_IN_HOUR;
  
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

// 시간 범위가 겹치는지 확인하는 함수 (2025년 1월 31일 17:10 생성됨)
function isTimeRangeOverlap(start1, end1, start2, end2) {
  return Math.max(start1, start2) < Math.min(end1, end2);
}

// 두 시간 범위의 겹치는 시간 계산 (2025년 1월 31일 17:10 생성됨)
function calculateOverlapTime(start1, end1, start2, end2) {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  if (overlapStart < overlapEnd) {
    return overlapEnd - overlapStart;
  }
  
  return 0;
}

// 휴가 시간 총합 계산 (점심시간 제외) (2025년 1월 31일 17:10 수정됨)
function calculateVacationWithLunchExcluded(vacationTimes = []) {
  let totalSeconds = 0;

  const lunchStart = TIME_CONSTANTS.LUNCH_START_SECONDS;
  const lunchEnd = TIME_CONSTANTS.LUNCH_END_SECONDS;

  vacationTimes.forEach(({ start, end }) => {
    const startSec = parseTime(start);
    const endSec = parseTime(end);

    if (isNaN(startSec) || isNaN(endSec) || endSec <= startSec) return;

    let vacationDuration = endSec - startSec;

    // 점심시간과 겹치는 경우 제외
    const overlapTime = calculateOverlapTime(startSec, endSec, lunchStart, lunchEnd);
    vacationDuration -= overlapTime;

    totalSeconds += vacationDuration;
  });

  return Math.floor(totalSeconds / 60); // 분 단위 반환
}

// 근무 시간 유효성 검사 (2025년 1월 31일 17:10 생성됨)
function validateWorkTime(startTime, endTime) {
  if (typeof startTime !== 'number' || typeof endTime !== 'number') {
    return { valid: false, error: '시간 값이 숫자가 아닙니다.' };
  }
  
  if (isNaN(startTime) || isNaN(endTime)) {
    return { valid: false, error: '유효하지 않은 시간 값입니다.' };
  }
  
  if (startTime >= endTime) {
    return { valid: false, error: '시작 시간이 종료 시간보다 늦거나 같습니다.' };
  }
  
  if (startTime < 0 || endTime < 0) {
    return { valid: false, error: '음수 시간 값입니다.' };
  }
  
  if (startTime >= 24 * 3600 || endTime >= 24 * 3600) {
    return { valid: false, error: '24시간을 초과하는 시간 값입니다.' };
  }
  
  return { valid: true };
}

// 시간 형식 감지 및 정규화 (2025년 1월 31일 17:10 생성됨)
function normalizeTimeString(timeStr) {
  if (typeof timeStr !== 'string') {
    return null;
  }
  
  // 다양한 시간 형식 처리
  const patterns = [
    /^(\d{1,2}):(\d{2}):(\d{2})$/, // HH:MM:SS
    /^(\d{1,2}):(\d{2})$/, // HH:MM
    /^(오전|오후)\s*(\d{1,2}):(\d{2}):?(\d{2})?$/, // 오전/오후 HH:MM:SS
    /^(AM|PM)\s*(\d{1,2}):(\d{2}):?(\d{2})?$/i // AM/PM HH:MM:SS
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(timeStr)) {
      return timeStr.trim();
    }
  }
  
  return null;
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 17:10 생성됨)
window.TimeUtilsModule = {
  parseTime,
  calculateWorkTime,
  parseDurationStringToMinutes,
  formatMinutesToDurationString,
  convertTo24Hour,
  convertDurationToMinutes,
  secondsToTimeString,
  minutesToTimeString,
  isTimeRangeOverlap,
  calculateOverlapTime,
  calculateVacationWithLunchExcluded,
  validateWorkTime,
  normalizeTimeString,
  TIME_CONSTANTS
};