// monthly-report-calendar.js
// 월간 근무 내역 달력 렌더링 및 관리 (2025년 8월 27일 생성됨)

// 달력 상태 관리
let monthlyCalendarState = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: null,
  monthlyData: {},
  isInitialized: false
};

// Firebase 준비 완료 후 달력 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeMonthlyReportCalendar();
});

/**
 * 월간 근무 내역 달력 시스템 초기화 (2025년 8월 27일 생성됨)
 */
function initializeMonthlyReportCalendar() {
  console.log("📅 [MONTHLY-REPORT-CALENDAR] 달력 시스템 초기화 시작...");
  
  try {
    monthlyCalendarState.isInitialized = true;
    console.log("✅ [MONTHLY-REPORT-CALENDAR] 달력 시스템 초기화 완료");
    
  } catch (error) {
    console.error("❌ [MONTHLY-REPORT-CALENDAR] 달력 시스템 초기화 중 오류:", error);
  }
}

/**
 * 달력 렌더링 (2025년 8월 27일 생성됨)
 */
function renderCalendar(year, month) {
  console.log(`📅 [MONTHLY-REPORT-CALENDAR] 달력 렌더링: ${year}년 ${month + 1}월`);
  
  const calendarBody = document.getElementById('monthly-report-calendar-body');
  if (!calendarBody) {
    console.error("❌ [MONTHLY-REPORT-CALENDAR] 달력 body 요소를 찾을 수 없습니다.");
    return;
  }
  
  // 상태 업데이트
  monthlyCalendarState.currentYear = year;
  monthlyCalendarState.currentMonth = month;
  
  // 달력 HTML 생성
  const calendarHTML = generateCalendarHTML(year, month);
  calendarBody.innerHTML = calendarHTML;
  
  // 날짜 클릭 이벤트 등록
  registerDateClickEvents();
  
  console.log("✅ [MONTHLY-REPORT-CALENDAR] 달력 렌더링 완료");
}

/**
 * 달력 HTML 생성 (2025년 8월 27일 생성됨)
 */
function generateCalendarHTML(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 1일의 요일 (0: 일요일)
  const lastDate = new Date(year, month + 1, 0).getDate(); // 마지막 날짜
  const prevLastDate = new Date(year, month, 0).getDate(); // 이전 달 마지막 날짜
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  let html = '';
  let date = 1;
  let nextDate = 1;
  
  // 6주 (6행) 생성
  for (let week = 0; week < 6; week++) {
    html += '<tr>';
    
    // 7일 (7열) 생성
    for (let day = 0; day < 7; day++) {
      const cellIndex = week * 7 + day;
      
      if (week === 0 && day < firstDay) {
        // 이전 달 날짜
        const prevDate = prevLastDate - (firstDay - day - 1);
        const dateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
        html += generateDateCell(prevDate, dateStr, day, 'prev-month');
        
      } else if (date <= lastDate) {
        // 현재 달 날짜
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        let classes = [];
        
        // 오늘 날짜 체크
        if (dateStr === todayStr) {
          classes.push('today');
        }
        
        // 요일별 클래스
        if (day === 0) classes.push('sunday');
        if (day === 6) classes.push('saturday');
        
        // 공휴일 체크
        if (isHoliday(dateStr)) {
          classes.push('holiday');
        }
        
        html += generateDateCell(date, dateStr, day, classes.join(' '));
        date++;
        
      } else {
        // 다음 달 날짜
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDate).padStart(2, '0')}`;
        html += generateDateCell(nextDate, dateStr, day, 'next-month');
        nextDate++;
      }
    }
    
    html += '</tr>';
    
    // 현재 달의 모든 날짜를 표시했고, 다음 달 날짜도 한 주를 채웠다면 종료
    if (date > lastDate && nextDate > 7) break;
  }
  
  return html;
}

/**
 * 날짜 셀 HTML 생성 (2025년 8월 27일 생성됨)
 */
function generateDateCell(date, dateStr, dayOfWeek, classes) {
  const dayData = monthlyCalendarState.monthlyData[dateStr];
  let markersHTML = '';
  
  // 현재 달의 날짜인 경우에만 마커 표시
  if (!classes.includes('prev-month') && !classes.includes('next-month') && dayData) {
    markersHTML = generateWorkMarkers(dayData);
  }
  
  return `
    <td class="${classes}" data-date="${dateStr}" data-day="${dayOfWeek}">
      <span class="date-number">${date}</span>
      ${markersHTML}
    </td>
  `;
}

/**
 * 근무 마커 HTML 생성 (2025년 8월 27일 생성됨)
 */
function generateWorkMarkers(dayData) {
  let markers = [];
  
  // 출근 마커
  if (dayData.start && dayData.start.length > 0) {
    markers.push('<span class="work-marker marker-start">출</span>');
  }
  
  // 퇴근 마커
  if (dayData.end && dayData.end.length > 0) {
    markers.push('<span class="work-marker marker-end">퇴</span>');
  }
  
  // 휴가 마커
  if (dayData.vacation && dayData.vacation.length > 0) {
    markers.push('<span class="work-marker marker-vacation">휴</span>');
  }
  
  if (markers.length > 0) {
    return `<div class="work-markers">${markers.join('')}</div>`;
  }
  
  return '';
}

/**
 * 날짜 클릭 이벤트 등록 (2025년 8월 27일 생성됨)
 */
function registerDateClickEvents() {
  const calendarBody = document.getElementById('monthly-report-calendar-body');
  if (!calendarBody) return;
  
  // 이벤트 위임 방식으로 날짜 클릭 처리
  calendarBody.addEventListener('click', (event) => {
    const cell = event.target.closest('td[data-date]');
    if (!cell) return;
    
    const dateStr = cell.getAttribute('data-date');
    const classes = cell.className;
    
    // 이전/다음 달 날짜는 무시
    if (classes.includes('prev-month') || classes.includes('next-month')) {
      return;
    }
    
    console.log(`📅 [MONTHLY-REPORT-CALENDAR] 날짜 선택: ${dateStr}`);
    
    // 이전 선택 해제
    clearPreviousSelection();
    
    // 새 날짜 선택
    cell.classList.add('selected');
    monthlyCalendarState.selectedDate = dateStr;
    
    // UI 모듈에 선택된 날짜 업데이트
    if (typeof window.MonthlyReportUI?.updateSelectedDate === 'function') {
      window.MonthlyReportUI.updateSelectedDate(dateStr);
    }
    
    // 해당 날짜의 히스토리 표시
    const dayData = monthlyCalendarState.monthlyData[dateStr];
    if (typeof window.MonthlyReportUI?.updateHistoryList === 'function') {
      window.MonthlyReportUI.updateHistoryList(dateStr, dayData);
    }
  });
  
  console.log("✅ [MONTHLY-REPORT-CALENDAR] 날짜 클릭 이벤트 등록 완료");
}

/**
 * 이전 선택된 날짜 해제 (2025년 8월 27일 생성됨)
 */
function clearPreviousSelection() {
  const calendarBody = document.getElementById('monthly-report-calendar-body');
  if (!calendarBody) return;
  
  const previousSelected = calendarBody.querySelector('td.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }
}

/**
 * 공휴일 체크 함수 (2025년 8월 27일 생성됨)
 */
function isHoliday(dateStr) {
  // holidays.js의 전역 holidays 배열 사용
  if (typeof window.holidays !== 'undefined' && Array.isArray(window.holidays)) {
    return window.holidays.some(holiday => holiday.date === dateStr);
  }
  
  // holidays 전역 변수가 없으면 전역 isHoliday 함수 시도
  if (typeof window.isHoliday === 'function') {
    return window.isHoliday(dateStr);
  }
  
  // 모두 없으면 false 반환
  return false;
}

/**
 * 달력에 데이터 업데이트 (2025년 8월 27일 생성됨)
 */
function updateCalendarData(monthlyData) {
  console.log("📊 [MONTHLY-REPORT-CALENDAR] 달력 데이터 업데이트");
  
  monthlyCalendarState.monthlyData = monthlyData || {};
  
  // 현재 렌더링된 달력이 있으면 다시 렌더링
  const calendarBody = document.getElementById('monthly-report-calendar-body');
  if (calendarBody && calendarBody.children.length > 0) {
    renderCalendar(monthlyCalendarState.currentYear, monthlyCalendarState.currentMonth);
  }
}

/**
 * 특정 날짜 선택 (2025년 8월 27일 생성됨)
 */
function selectDate(dateStr) {
  const calendarBody = document.getElementById('monthly-report-calendar-body');
  if (!calendarBody) return;
  
  // 이전 선택 해제
  clearPreviousSelection();
  
  // 새 날짜 선택
  const targetCell = calendarBody.querySelector(`td[data-date="${dateStr}"]`);
  if (targetCell && !targetCell.classList.contains('prev-month') && !targetCell.classList.contains('next-month')) {
    targetCell.classList.add('selected');
    monthlyCalendarState.selectedDate = dateStr;
    
    // UI 모듈에 업데이트
    if (typeof window.MonthlyReportUI?.updateSelectedDate === 'function') {
      window.MonthlyReportUI.updateSelectedDate(dateStr);
    }
    
    // 히스토리 표시
    const dayData = monthlyCalendarState.monthlyData[dateStr];
    if (typeof window.MonthlyReportUI?.updateHistoryList === 'function') {
      window.MonthlyReportUI.updateHistoryList(dateStr, dayData);
    }
  }
}

/**
 * 선택된 날짜 초기화 (2025년 8월 27일 생성됨)
 */
function clearSelectedDate() {
  clearPreviousSelection();
  monthlyCalendarState.selectedDate = null;
}

/**
 * 오늘 날짜로 이동 (2025년 8월 27일 생성됨)
 */
function goToToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // 현재 표시된 달과 다르면 달력 다시 렌더링
  if (monthlyCalendarState.currentYear !== year || monthlyCalendarState.currentMonth !== month) {
    renderCalendar(year, month);
    
    // UI 모듈에 현재 월 업데이트
    if (typeof window.MonthlyReportUI?.updateCurrentMonthDisplay === 'function') {
      monthlyCalendarState.currentYear = year;
      monthlyCalendarState.currentMonth = month;
    }
  }
  
  // 오늘 날짜 선택
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  selectDate(todayStr);
}

/**
 * 달력 상태 정보 반환 (2025년 8월 27일 생성됨)
 */
function getCalendarState() {
  return {
    currentYear: monthlyCalendarState.currentYear,
    currentMonth: monthlyCalendarState.currentMonth,
    selectedDate: monthlyCalendarState.selectedDate,
    hasData: Object.keys(monthlyCalendarState.monthlyData).length > 0,
    isInitialized: monthlyCalendarState.isInitialized
  };
}

// 다른 모듈에서 사용할 수 있도록 전역 객체로 내보내기
window.MonthlyReportCalendar = {
  // 공개 함수들
  renderCalendar,
  updateCalendarData,
  selectDate,
  clearSelectedDate,
  goToToday,
  getCalendarState,
  
  // 상태 접근자
  get currentYear() { return monthlyCalendarState.currentYear; },
  get currentMonth() { return monthlyCalendarState.currentMonth; },
  get selectedDate() { return monthlyCalendarState.selectedDate; },
  get monthlyData() { return monthlyCalendarState.monthlyData; },
  get isInitialized() { return monthlyCalendarState.isInitialized; }
};

console.log("📅 [MONTHLY-REPORT-CALENDAR] 모듈 로드 완료");