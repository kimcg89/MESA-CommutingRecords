// datetime.js
// 날짜 및 시간 표시 UI 관리 (2025년 1월 31일 17:05 생성됨)

// 시간 업데이트 인터벌 ID
let dateTimeUpdateInterval = null;

// Firebase 준비 완료 후 날짜/시간 UI 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeDateTime();
});

// DOM 로드 후에도 초기화 (Firebase보다 먼저 실행될 수 있음)
document.addEventListener('DOMContentLoaded', () => {
  initializeDateTime();
});

// 날짜/시간 UI 시스템 초기화 (2025년 1월 31일 17:05 생성됨)
function initializeDateTime() {
  // 중복 실행 방지
  if (dateTimeUpdateInterval) {
    clearInterval(dateTimeUpdateInterval);
  }

  // 즉시 시간 표시
  updateDateTime();
  
  // 매초 업데이트 시작
  dateTimeUpdateInterval = setInterval(updateDateTime, 1000);
  
  console.log('날짜/시간 UI 시스템 초기화 완료');
}

// 현재 날짜와 시간 표시 (2025년 1월 31일 17:05 수정됨)
function updateDateTime() {
  const currentDate = new Date();

  // 날짜 형식: 25년 1월 15일 수요일
  const dateOptions = {
    year: "2-digit", // 연도를 2자리로 표시
    month: "long", // 월을 긴 이름으로 표시 (예: "1월")
    day: "numeric", // 일을 숫자로 표시
    weekday: "long", // 요일을 긴 이름으로 표시 (예: "수요일")
  };
  const formattedDate = currentDate.toLocaleDateString("ko-KR", dateOptions);

  // 시간 형식: 오후 HH:MM:SS
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // 12시간제로 표시 (오전/오후)
  };
  const formattedTime = currentDate.toLocaleTimeString("ko-KR", timeOptions);

  // DOM 업데이트
  const currentDateElement = document.getElementById("current-date");
  const currentTimeElement = document.getElementById("current-time");
  
  if (currentDateElement) {
    currentDateElement.innerText = formattedDate;
  }
  
  if (currentTimeElement) {
    currentTimeElement.innerText = formattedTime;
  }
}

// 날짜/시간 업데이트 중지 (2025년 1월 31일 17:05 생성됨)
function stopDateTimeUpdate() {
  if (dateTimeUpdateInterval) {
    clearInterval(dateTimeUpdateInterval);
    dateTimeUpdateInterval = null;
    console.log('날짜/시간 업데이트가 중지되었습니다.');
  }
}

// 날짜/시간 업데이트 재시작 (2025년 1월 31일 17:05 생성됨)
function startDateTimeUpdate() {
  if (!dateTimeUpdateInterval) {
    updateDateTime(); // 즉시 업데이트
    dateTimeUpdateInterval = setInterval(updateDateTime, 1000);
    console.log('날짜/시간 업데이트가 재시작되었습니다.');
  }
}

// 현재 시간을 한국 시간(KST)으로 반환 (2025년 1월 31일 17:05 생성됨)
function getCurrentKSTTime() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 시간대 오프셋
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate;
}

// 현재 날짜를 YYYY-MM-DD 형식으로 반환 (2025년 1월 31일 17:05 생성됨)
function getCurrentDateString() {
  const kstDate = getCurrentKSTTime();
  return kstDate.toISOString().split("T")[0];
}

// 현재 시간을 HH:MM:SS 형식으로 반환 (2025년 1월 31일 17:05 생성됨)
function getCurrentTimeString() {
  const kstDate = getCurrentKSTTime();
  return kstDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 날짜를 한국어 형식으로 포맷 (2025년 1월 31일 17:05 생성됨)
function formatDateToKorean(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  
  return date.toLocaleDateString("ko-KR", options);
}

// 시간을 한국어 형식으로 포맷 (2025년 1월 31일 17:05 생성됨)
function formatTimeToKorean(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  
  return date.toLocaleTimeString("ko-KR", options);
}

// 두 날짜가 같은 날인지 확인 (2025년 1월 31일 17:05 생성됨)
function isSameDate(date1, date2) {
  if (!(date1 instanceof Date)) date1 = new Date(date1);
  if (!(date2 instanceof Date)) date2 = new Date(date2);
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 오늘 날짜인지 확인 (2025년 1월 31일 17:05 생성됨)
function isToday(date) {
  return isSameDate(date, new Date());
}

// 날짜를 YYYY-MM-DD 형식으로 변환 (2025년 1월 31일 17:05 생성됨)
function formatDateToString(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

// 문자열 날짜를 Date 객체로 변환 (2025년 1월 31일 17:05 생성됨)
function parseStringToDate(dateString) {
  // YYYY-MM-DD 형식 처리
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + 'T00:00:00');
  }
  
  return new Date(dateString);
}

// 상대적 시간 표시 (예: "2시간 전", "방금 전") (2025년 1월 31일 17:05 생성됨)
function getRelativeTimeString(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return "방금 전";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return formatDateToKorean(date);
  }
}

// 시간대 변환 유틸리티 (2025년 1월 31일 17:05 생성됨)
function convertToKST(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  return new Date(date.getTime() + kstOffset);
}

// 주의 시작일(일요일) 계산 (2025년 1월 31일 17:05 생성됨)
function getWeekStart(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const day = date.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const diff = date.getDate() - day; // 일요일까지의 차이 계산
  return new Date(date.setDate(diff));
}

// 월의 시작일과 마지막일 계산 (2025년 1월 31일 17:05 생성됨)
function getMonthRange(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // 다음 달 0일 = 현재 달 마지막 날
  
  return {
    start: startDate,
    end: endDate,
    startString: formatDateToString(startDate),
    endString: formatDateToString(endDate)
  };
}

// 페이지 언로드 시 인터벌 정리 (2025년 1월 31일 17:05 생성됨)
window.addEventListener('beforeunload', () => {
  stopDateTimeUpdate();
});

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 17:05 생성됨)
window.DateTimeModule = {
  updateDateTime,
  stopDateTimeUpdate,
  startDateTimeUpdate,
  getCurrentKSTTime,
  getCurrentDateString,
  getCurrentTimeString,
  formatDateToKorean,
  formatTimeToKorean,
  isSameDate,
  isToday,
  formatDateToString,
  parseStringToDate,
  getRelativeTimeString,
  convertToKST,
  getWeekStart,
  getMonthRange
};