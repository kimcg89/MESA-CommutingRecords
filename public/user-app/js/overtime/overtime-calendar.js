/*
 * 연장근무신청 달력 전용 모듈 (overtime-calendar.js)
 * 생성일: 2025년 8월 25일 16:15
 * 용도: 연장근무신청 모달의 달력 기능 전담
 */

/**
 * 연장근무 달력 유틸리티 클래스 (2025년 8월 25일 16:15 생성됨)
 */
class OvertimeCalendar {
    constructor() {
        this.selectedDate = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
        this.dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    }
    
    /**
     * 달력 초기화 (2025년 8월 25일 16:15 생성됨)
     */
    initialize() {
        this.render();
        this.setupNavigation();
        console.log("🔹 연장근무 달력 초기화 완료");
    }
    
    /**
     * 달력 렌더링 (2025년 8월 25일 16:15 생성됨)
     */
    render() {
        this.updateTitle();
        this.renderDays();
    }
    
    /**
     * 달력 제목 업데이트 (2025년 8월 25일 16:15 생성됨)
     */
    updateTitle() {
        const titleElement = document.getElementById("overtime-calendar-title");
        if (titleElement) {
            titleElement.textContent = `${this.currentYear}년 ${this.monthNames[this.currentMonth]}`;
        }
    }
    
    /**
     * 달력 날짜들 렌더링 (2025년 8월 25일 16:50 수정됨)
     */
    renderDays() {
        const daysContainer = document.getElementById("overtime-calendar-days");
        if (!daysContainer) return;
        
        // 컨테이너 초기화
        daysContainer.innerHTML = "";
        
        // 달력 계산
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        // 이전 달 날짜들
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, "prev-month");
            daysContainer.appendChild(dayElement);
        }
        
        // 현재 달 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, "current-month");
            daysContainer.appendChild(dayElement);
        }
        
        // 다음 달 날짜들 (42개 셀 채우기)
        const totalCells = 42;
        const filledCells = firstDay + daysInMonth;
        const remainingCells = totalCells - filledCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, "next-month");
            daysContainer.appendChild(dayElement);
        }
        
        // 오늘 날짜 강조 표시
        this.highlightToday();
    }
    
    /**
     * 날짜 요소 생성 (2025년 8월 25일 17:25 수정됨)
     * @param {number} day - 날짜
     * @param {string} monthType - "current-month", "prev-month", "next-month"
     * @returns {HTMLElement} 날짜 요소
     */
    createDayElement(day, monthType) {
        const dayElement = document.createElement("div");
        dayElement.className = "overtime-day";
        dayElement.textContent = day;
        
        if (monthType !== "current-month") {
            dayElement.classList.add("other-month");
            return dayElement;
        }
        
        // 현재 달의 날짜 처리
        const date = new Date(this.currentYear, this.currentMonth, day);
        const dayOfWeek = date.getDay();
        
        // 요일별 클래스 추가
        if (dayOfWeek === 0) dayElement.classList.add("sunday");
        if (dayOfWeek === 6) dayElement.classList.add("saturday");
        
        // 공휴일 체크 및 이름 설정 (2025년 8월 25일 17:25 수정됨)
        if (this.isHoliday(date)) {
            dayElement.classList.add("holiday");
            const holidayName = this.getHolidayName(date);
            if (holidayName) {
                // CSS ::after에서 사용할 data 속성 설정
                dayElement.setAttribute('data-holiday-name', holidayName);
            }
        }
        
        // 과거 날짜는 선택 불가능하게 설정
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
            dayElement.classList.add("past-date");
        } else {
            // 클릭 이벤트 추가 (미래 날짜와 오늘만)
            dayElement.addEventListener("click", () => this.selectDate(day, dayElement));
        }
        
        return dayElement;
    }
    
    /**
     * 공휴일 체크 함수 (2025년 8월 25일 17:15 수정됨)
     * @param {Date} date - 체크할 날짜
     * @returns {boolean} 공휴일 여부
     */
    isHoliday(date) {
        // constants/holidays.js의 window.holidays 배열 사용
        if (!window.holidays || !Array.isArray(window.holidays)) {
            console.warn("🔸 공휴일 데이터가 로드되지 않았습니다.");
            return false;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based에서 1-based로 변환하고 패딩
        const day = String(date.getDate()).padStart(2, '0');
        
        const dateString = `${year}-${month}-${day}`;
        
        // window.holidays 배열에서 해당 날짜 찾기
        return window.holidays.some(holiday => holiday.date === dateString);
    }
    
    /**
     * 공휴일 이름 반환 함수 (2025년 8월 25일 17:15 추가됨)
     * @param {Date} date - 조회할 날짜
     * @returns {string|null} 공휴일 이름
     */
    getHolidayName(date) {
        if (!window.holidays || !Array.isArray(window.holidays)) {
            return null;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const dateString = `${year}-${month}-${day}`;
        
        const holiday = window.holidays.find(holiday => holiday.date === dateString);
        return holiday ? holiday.name : null;
    }
    
    /**
     * 선택된 날짜 표시 업데이트 (2025년 8월 25일 17:10 수정됨)
     */
    updateSelectedDateDisplay() {
        const displayElement = document.getElementById("overtime-selected-date");
        
        if (!displayElement || !this.selectedDate) return;
        
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;
        const day = this.selectedDate.getDate();
        const dayName = this.dayNames[this.selectedDate.getDay()];
        
        // 공휴일 여부 체크
        let dateText = `선택된 날짜: ${year}년 ${month}월 ${day}일 (${dayName})`;
        
        if (this.isHoliday(this.selectedDate)) {
            dateText += " 🔴 공휴일";
        }
        
        displayElement.textContent = dateText;
        displayElement.style.display = "block";
    }
    
    /**
     * 오늘 날짜 강조 표시 (2025년 8월 25일 17:25 수정됨)
     */
    highlightToday() {
        const today = new Date();
        
        if (today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth) {
            const todayDay = today.getDate();
            const allDays = document.querySelectorAll(".overtime-day:not(.other-month)");
            
            allDays.forEach(dayElement => {
                if (parseInt(dayElement.textContent) === todayDay) {
                    dayElement.classList.add("today");
                    
                    // 오늘이 공휴일인지 체크하여 특별 스타일 적용
                    if (this.isHoliday(today)) {
                        dayElement.classList.add("holiday");
                        const holidayName = this.getHolidayName(today);
                        if (holidayName) {
                            dayElement.setAttribute('data-holiday-name', holidayName);
                        }
                        console.log("🔴 오늘은 공휴일입니다:", holidayName);
                    }
                }
            });
        }
    }
    
    /**
     * 공휴일 정보 디버그 출력 (개발용) (2025년 8월 25일 17:12 추가됨)
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     */
    debugHolidays(year, month) {
        if (!window.HOLIDAYS) {
            console.log("🔸 공휴일 데이터가 없습니다.");
            return;
        }
        
        const yearHolidays = window.HOLIDAYS[year];
        if (!yearHolidays) {
            console.log(`🔸 ${year}년 공휴일 데이터가 없습니다.`);
            return;
        }
        
        const monthHolidays = yearHolidays[month];
        if (!monthHolidays || monthHolidays.length === 0) {
            console.log(`🔸 ${year}년 ${month}월 공휴일이 없습니다.`);
            return;
        }
        
        console.log(`🔴 ${year}년 ${month}월 공휴일:`, monthHolidays);
    }
    
    /**
     * 날짜 선택 (2025년 8월 25일 16:15 생성됨)
     * @param {number} day - 선택된 날짜
     * @param {HTMLElement} element - 클릭된 요소
     */
    selectDate(day, element) {
        // 과거 날짜 선택 방지
        // After (수정된 코드)  
        const selectedDate = new Date(this.currentYear, this.currentMonth, day, 12, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            if (window.ModalModule && typeof window.ModalModule.showNoticeModal === 'function') {
                window.ModalModule.showNoticeModal("과거 날짜는 선택할 수 없습니다.");
            } else {
                alert("과거 날짜는 선택할 수 없습니다.");
            }
            return;
        }
        
        // 기존 선택 제거
        document.querySelectorAll(".overtime-day.selected").forEach(el => {
            el.classList.remove("selected");
        });
        
        // 새로운 선택 추가
        element.classList.add("selected");
        
        // 선택된 날짜 저장
        this.selectedDate = selectedDate;
        
        // 선택된 날짜 표시 업데이트
        this.updateSelectedDateDisplay();
        
        console.log("🔹 연장근무 날짜 선택:", this.selectedDate.toISOString().split('T')[0]);
    }
    
    /**
     * 선택된 날짜 표시 업데이트 (2025년 8월 25일 16:15 생성됨)
     */
    updateSelectedDateDisplay() {
        const displayElement = document.getElementById("overtime-selected-date");
        
        if (!displayElement || !this.selectedDate) return;
        
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;
        const day = this.selectedDate.getDate();
        const dayName = this.dayNames[this.selectedDate.getDay()];
        
        displayElement.textContent = `선택된 날짜: ${year}년 ${month}월 ${day}일 (${dayName})`;
        displayElement.style.display = "block";
    }
    
    /**
     * 달력 네비게이션 설정 (2025년 8월 25일 16:15 생성됨)
     */
    setupNavigation() {
      const prevBtn = document.getElementById("overtime-prev-month");
      const nextBtn = document.getElementById("overtime-next-month");

      if (prevBtn) prevBtn.onclick = () => this.navigateToPrevMonth();
      if (nextBtn) nextBtn.onclick = () => this.navigateToNextMonth();
    }

    
    /**
     * 이전 달로 이동 (2025년 8월 25일 16:15 생성됨)
     */
    navigateToPrevMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        
        this.render();
        console.log(`🔹 달력 이동: ${this.currentYear}년 ${this.monthNames[this.currentMonth]}`);
    }
    
    /**
     * 다음 달로 이동 (2025년 8월 25일 16:15 생성됨)
     */
    navigateToNextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        
        this.render();
        console.log(`🔹 달력 이동: ${this.currentYear}년 ${this.monthNames[this.currentMonth]}`);
    }
    
    /**
     * 선택된 날짜 반환 (2025년 8월 25일 16:15 생성됨)
     * @returns {Date|null} 선택된 날짜
     */
    getSelectedDate() {
        return this.selectedDate;
    }
    
    /**
     * 달력 초기화 (선택된 날짜 리셋) (2025년 8월 25일 16:15 생성됨)
     */
    reset() {
        this.selectedDate = null;
        
        // 선택된 날짜 표시 숨기기
        const displayElement = document.getElementById("overtime-selected-date");
        if (displayElement) {
            displayElement.style.display = "none";
        }
        
        // 모든 선택 상태 제거
        document.querySelectorAll(".overtime-day.selected").forEach(el => {
            el.classList.remove("selected");
        });
        
        // 현재 날짜로 달력 리셋
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        
        this.render();
        
        console.log("🔹 연장근무 달력 리셋 완료");
    }
    
    /**
     * 특정 날짜로 달력 이동 (2025년 8월 25일 16:15 생성됨)
     * @param {Date} date - 이동할 날짜
     */
    navigateToDate(date) {
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
        this.render();
    }
    
    /**
     * 오늘 날짜 강조 표시 (2025년 8월 25일 16:15 생성됨)
     */
    highlightToday() {
        const today = new Date();
        
        if (today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth) {
            const todayDay = today.getDate();
            const todayElement = [...document.querySelectorAll(".overtime-day:not(.other-month)")]
                .find(el => parseInt(el.textContent) === todayDay);
                
            if (todayElement) {
                todayElement.classList.add("today");
            }
        }
    }
}

// 전역 인스턴스 생성 (2025년 8월 25일 16:15 생성됨)
window.overtimeCalendar = new OvertimeCalendar();

// 전역 모듈로 내보내기 (2025년 8월 25일 16:15 생성됨)
window.OvertimeCalendar = {
    initialize: () => window.overtimeCalendar.initialize(),
    render: () => window.overtimeCalendar.render(),
    reset: () => window.overtimeCalendar.reset(),
    getSelectedDate: () => window.overtimeCalendar.getSelectedDate(),
    navigateToDate: (date) => window.overtimeCalendar.navigateToDate(date),
    highlightToday: () => window.overtimeCalendar.highlightToday()
};