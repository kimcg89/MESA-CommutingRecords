// vacation-utils.js
// 휴가 관련 유틸리티 함수들 (2025년 8월 14일 생성됨)

// 휴가 유형별 시간/텍스트 반환 함수들 (2025년 8월 14일 생성됨)
function getVacationStartTime(type) {
  return type === "morning" ? "09:30" : type === "afternoon" ? "13:00" : "09:30";
}

function getVacationEndTime(type) {
  return type === "morning" ? "11:30" : type === "afternoon" ? "18:00" : "18:00";
}

function getVacationType(type) {
  return type === "morning" ? "오전반휴" : type === "afternoon" ? "오후반휴" : "종일연차";
}

// 총 휴가 시간을 소수점 한 자리까지 계산 (2025년 8월 14일 생성됨)
function calculateVacationHours(vacationTimes) {
  if (!Array.isArray(vacationTimes)) {
    console.warn("vacationTimes가 배열이 아닙니다. 기본값으로 빈 배열을 사용합니다:", vacationTimes);
    vacationTimes = [];
  }

  let totalSeconds = 0;

  vacationTimes.forEach(({ start, end }) => {
    const startSeconds = parseTime(start);
    const endSeconds = parseTime(end);

    if (isNaN(startSeconds) || isNaN(endSeconds)) {
      console.error("휴가 시간 변환 중 오류 발생:", { start, end });
      return;
    }

    if (endSeconds < startSeconds) {
      console.warn("종료 시간이 시작 시간보다 이전입니다. 데이터를 건너뜁니다:", { start, end });
      return;
    }

    totalSeconds += endSeconds - startSeconds;
  });

  const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
  return totalHours;
}

// 시간 조합 함수: 선택된 값을 "HH:mm:ss" 형식으로 반환 (2025년 8월 14일 생성됨)
function combineTime(ampm, hour, minute) {
  let adjustedHour = parseInt(hour, 10);
  if (ampm === "PM" && adjustedHour !== 12) adjustedHour += 12;
  if (ampm === "AM" && adjustedHour === 12) adjustedHour = 0;
  return `${String(adjustedHour).padStart(2, "0")}:${minute}:00`;
}

// 유틸리티 함수들 (2025년 8월 14일 생성됨)
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

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.VacationUtils = {
  getVacationStartTime,
  getVacationEndTime,
  getVacationType,
  calculateVacationHours,
  combineTime,
  parseDurationStringToMinutes,
  formatMinutesToDurationString,
};