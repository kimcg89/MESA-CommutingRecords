// work-time-calculator.js
// 근무시간 계산 관련 함수들 (2025년 8월 14일 생성됨)

// 근무시간에서 제외할 시간 구간 설정 (2025년 8월 14일 생성됨)
const EXCLUDED_TIME_PERIODS = [
  { start: "09:15", end: "09:30" }, // 출근 준비시간
  { start: "11:30", end: "13:00" }, // 점심시간
  { start: "18:00", end: "18:15" }  // 퇴근 정리시간
];

// 근무시간 계산 함수 - 제외 시간 구간 적용 (2025년 8월 14일 생성됨)
function calculateWorkTime(startTimeInSeconds, endTimeInSeconds, vacationTimes = []) {
  if (isNaN(startTimeInSeconds) || isNaN(endTimeInSeconds) || endTimeInSeconds <= startTimeInSeconds) {
    console.error("유효하지 않은 시작 시간 또는 종료 시간입니다.");
    return null;
  }

  let totalWorkSeconds = endTimeInSeconds - startTimeInSeconds;

  // 제외할 시간 구간들을 근무시간에서 차감 (2025년 8월 14일 생성됨)
  EXCLUDED_TIME_PERIODS.forEach(period => {
    const excludeStartSeconds = parseTime(period.start);
    const excludeEndSeconds = parseTime(period.end);
    
    if (!isNaN(excludeStartSeconds) && !isNaN(excludeEndSeconds)) {
      // 근무시간과 제외시간의 겹치는 구간 계산
      const overlapStart = Math.max(startTimeInSeconds, excludeStartSeconds);
      const overlapEnd = Math.min(endTimeInSeconds, excludeEndSeconds);
      
      if (overlapStart < overlapEnd) {
        const excludedSeconds = overlapEnd - overlapStart;
        totalWorkSeconds -= excludedSeconds;
        console.log(`⏰ 제외 시간 적용: ${period.start}~${period.end} (${(excludedSeconds/60).toFixed(0)}분 차감)`);
      }
    }
  });

  // 휴가 시간 차감 (기존 로직 유지)
  if (Array.isArray(vacationTimes)) {
    vacationTimes.forEach(vacation => {
      const vacationStartSeconds = parseTime(vacation.start);
      const vacationEndSeconds = parseTime(vacation.end);
      
      if (!isNaN(vacationStartSeconds) && !isNaN(vacationEndSeconds)) {
        const overlapStart = Math.max(startTimeInSeconds, vacationStartSeconds);
        const overlapEnd = Math.min(endTimeInSeconds, vacationEndSeconds);
        
        if (overlapStart < overlapEnd) {
          totalWorkSeconds -= (overlapEnd - overlapStart);
        }
      }
    });
  }

  const hours = Math.floor(totalWorkSeconds / 3600);
  const minutes = Math.floor((totalWorkSeconds % 3600) / 60);

  return { hours, minutes, totalSeconds: totalWorkSeconds };
}

// 근무시간 업데이트 함수 (2025년 8월 14일 생성됨)
async function updateWorkDuration(recordRef, existingRecord, now) {
  const startTimeStr =
    Array.isArray(existingRecord.start) && existingRecord.start.length > 0
      ? existingRecord.start[0].time
      : null;

  if (!startTimeStr) {
    console.error("출근 시간이 없어서 근무 시간을 계산할 수 없습니다.");
    return null;
  }

  const endTimeStr = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const vacationTimes = existingRecord.vacation || [];

  const startTimeInSeconds = parseTime(startTimeStr);
  const endTimeInSeconds = parseTime(endTimeStr);

  if (isNaN(startTimeInSeconds) || isNaN(endTimeInSeconds)) {
    console.error("유효하지 않은 시작 시간 또는 종료 시간입니다.");
    return null;
  }

  // 근무시간 계산 함수 사용
  const workDuration = calculateWorkTime(
    startTimeInSeconds,
    endTimeInSeconds,
    vacationTimes
  );

  console.log("계산된 근무 시간:", workDuration);

  return workDuration;
}

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.WorkTimeCalculator = {
  calculateWorkTime,
  updateWorkDuration,
  EXCLUDED_TIME_PERIODS,
};