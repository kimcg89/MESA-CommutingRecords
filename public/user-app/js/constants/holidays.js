// holidays.js
// 공휴일 및 특별일 데이터 관리 (2025년 8월 5일 18:00 생성됨)

// 공휴일 데이터 (전역 변수로 관리)
window.holidays = [
  // 2024년 공휴일
  { date: "2024-01-01", name: "새해" },
  { date: "2024-02-09", name: "연휴" },
  { date: "2024-02-10", name: "설날" },
  { date: "2024-02-11", name: "연휴" },
  { date: "2024-03-01", name: "삼일절" },
  { date: "2024-05-01", name: "근로자의날" },
  { date: "2024-05-05", name: "어린이날" },
  { date: "2024-06-06", name: "현충일" },
  { date: "2024-08-15", name: "광복절" },
  { date: "2024-09-16", name: "연휴" },
  { date: "2024-09-17", name: "추석" },
  { date: "2024-09-18", name: "연휴" },
  { date: "2024-10-01", name: "국군의날" },
  { date: "2024-10-03", name: "개천절" },
  { date: "2024-10-09", name: "한글날" },
  { date: "2024-12-25", name: "성탄절" },

  // 2025년 공휴일
  { date: "2025-01-01", name: "새해" },
  { date: "2025-01-28", name: "연휴" },
  { date: "2025-01-29", name: "설날" },
  { date: "2025-01-30", name: "연휴" },
  { date: "2025-03-01", name: "삼일절" },
  { date: "2025-03-03", name: "대체휴무" },
  { date: "2025-05-01", name: "근로자의날" },
  { date: "2025-05-05", name: "어린이날" },
  { date: "2025-05-05", name: "대체공휴일일" },
  { date: "2025-06-06", name: "현충일" },
  { date: "2025-08-15", name: "광복절" },
  { date: "2025-10-01", name: "국군의날" },
  { date: "2025-10-03", name: "개천절" },
  { date: "2025-10-05", name: "연휴휴" },
  { date: "2025-10-06", name: "추석" },
  { date: "2025-10-07", name: "연휴" },
  { date: "2025-10-08", name: "대체휴무" },
  { date: "2025-10-09", name: "한글날" },
  { date: "2025-12-25", name: "성탄절" },

  // 임시 공휴일 (예상)
  { date: "2024-01-14", name: "창립기념일" },
  { date: "2024-05-06", name: "대체공휴일" },
  { date: "2025-01-14", name: "창립기념일" },
  { date: "2025-01-27", name: "임시공휴일" },
];

// 기념일 데이터
window.mesadays = [
  { date: "2024-12-20", name: "연말행사" },
];

// 공휴일 확인 함수 (2025년 8월 5일 18:00 생성됨)
window.isHoliday = function(date) {
  return window.holidays.some((holiday) => holiday.date === date);
};

// 공휴일 정보 반환 함수 (2025년 8월 5일 18:00 생성됨)
window.getHolidayInfo = function(date) {
  return window.holidays.find((holiday) => holiday.date === date);
};

// 기념일 확인 함수 (2025년 8월 5일 18:00 생성됨)
window.isMesaday = function(date) {
  return window.mesadays.some((mesaday) => mesaday.date === date);
};

// 기념일 정보 반환 함수 (2025년 8월 5일 18:00 생성됨)
window.getMesadayInfo = function(date) {
  return window.mesadays.find((mesaday) => mesaday.date === date);
};

// 전역 모듈로 내보내기 (2025년 8월 5일 18:00 생성됨)
window.HolidaysModule = {
  holidays: window.holidays,
  mesadays: window.mesadays,
  isHoliday: window.isHoliday,
  getHolidayInfo: window.getHolidayInfo,
  isMesaday: window.isMesaday,
  getMesadayInfo: window.getMesadayInfo
};