// monthly-report-ui.js
// 월간 근무 내역 모달 UI 관리 (2025년 8월 27일 생성됨)

// UI 상태 관리
let monthlyReportUI = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  isInitialized: false,
  elements: {}
};

// Firebase 준비 완료 후 UI 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeMonthlyReportUI();
});

/**
 * UI 요소들 캐싱 (2025년 8월 27일 생성됨)
 */
function cacheUIElements() {
  monthlyReportUI.elements = {
    // 모달 관련
    modal: document.getElementById('monthly-report-modal'),
    overlay: document.getElementById('modal-overlay-monthly-report'),
    closeBtn: document.getElementById('close-monthly-report'),
    
    // 통계 카드
    totalWorkCard: document.getElementById('monthly-total-work'),
    standardWorkCard: document.getElementById('monthly-standard-work'),
    overtimeWorkCard: document.getElementById('monthly-overtime-work'),
    
    // 프로그레스 바
    progressCompleted: document.getElementById('monthly-progress-completed'),
    progressRemaining: document.getElementById('monthly-progress-remaining'),
    progressStandard: document.getElementById('monthly-progress-standard'),
    progressCurrent: document.getElementById('monthly-progress-current'),
    progressStandardText: document.getElementById('monthly-progress-standard-text'),
    progressMax: document.getElementById('monthly-progress-max'),
    
    // 네비게이션
    prevMonthBtn: document.getElementById('monthly-report-prev-month'),
    nextMonthBtn: document.getElementById('monthly-report-next-month'),
    currentMonthLabel: document.getElementById('monthly-report-current-month'),
    
    // 달력
    calendarBody: document.getElementById('monthly-report-calendar-body'),
    
    // 히스토리
    selectedDateLabel: document.getElementById('monthly-report-selected-date'),
    historyList: document.getElementById('monthly-report-history-list')
  };
  
  console.log("UI 요소 캐싱 완료");
}

/**
 * Memo 버튼 이벤트 등록 (2025년 8월 29일 21:40 새로 생성됨)
 */
function registerMemoButtonEvents() {
  const { historyList } = monthlyReportUI.elements;
  
  if (!historyList) {
    console.warn("히스토리 리스트 요소를 찾을 수 없어 Memo 버튼 이벤트 등록 실패");
    return;
  }
  
  // 이벤트 위임 방식으로 Memo 버튼 클릭 처리
  historyList.addEventListener('click', (event) => {
    const memoBtn = event.target.closest('.monthly-report-memo-btn');
    if (!memoBtn) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const targetTime = memoBtn.getAttribute('data-time');
    const targetType = memoBtn.getAttribute('data-type');
    
    console.log("Memo 버튼 클릭됨:", { targetTime, targetType });
    
    // memo.js의 기존 로직 활용
    handleMonthlyReportMemoClick(targetTime, targetType);
  });
  
  console.log("Memo 버튼 이벤트 등록 완료");
}

/**
 * 월간 근무 내역에서 Memo 클릭 처리 (2025년 8월 29일 21:40 새로 생성됨)
 */
async function handleMonthlyReportMemoClick(targetTime, targetType) {
  console.log("월간 근무 내역 Memo 처리 시작:", { targetTime, targetType });
  
  // 현재 선택된 날짜 확인
  const selectedDate = window.MonthlyReportIntegration?.selectedDate;
  if (!selectedDate) {
    console.error("선택된 날짜가 없습니다.");
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('날짜를 먼저 선택해주세요.');
    }
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("로그인된 사용자가 없습니다.");
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('로그인이 필요합니다.');
    }
    return;
  }
  
  // 전역 변수 설정 (memo.js 시스템과 호환)
  window.selectedDate = selectedDate;
  window.currentTargetTime = targetTime;
  
  console.log("전역 변수 설정:", {
    selectedDate: window.selectedDate,
    currentTargetTime: window.currentTargetTime
  });
  
  try {
    const recordRef = firebase.firestore()
      .collection('records')
      .doc(user.email)
      .collection('dates')
      .doc(selectedDate);
    
    const doc = await recordRef.get();
    
    if (doc.exists) {
      const recordData = doc.data();
      const targetArray = ['start', 'gps', 'end'].find((key) => {
        return (
          Array.isArray(recordData[key]) &&
          recordData[key].some((item) => item.time === targetTime)
        );
      });
      
      if (targetArray) {
        const targetItem = recordData[targetArray].find(
          (item) => item.time === targetTime
        );
        const memoData = targetItem.memo || {};
        const workType = memoData.work || '';
        
        console.log("발견된 memo 데이터:", memoData);
        console.log("workType:", workType);
        
        // workType에 따라 해당 상세모달 표시 (memo.js 로직 재사용)
        if (workType === '내근' && typeof showOfficeWorkDetailModal === 'function') {
          showOfficeWorkDetailModal(targetTime, targetArray, selectedDate, true);
        } else if (workType === '외근' && typeof showFieldWorkDetailModal === 'function') {
          showFieldWorkDetailModal(targetTime, targetArray, selectedDate, true);
        } else if (workType === '재택' && typeof showRemoteWorkDetailModal === 'function') {
          showRemoteWorkDetailModal(targetTime, targetArray, selectedDate, true);
        } else {
          console.warn("workType을 찾을 수 없거나 해당 모달 함수가 없습니다:", workType);
          // fallback: memo.js의 기존 함수 호출
          if (typeof window.MemoModule?.openMemoModal === 'function') {
            window.MemoModule.openMemoModal(targetTime, false);
          } else if (typeof openMemoModal === 'function') {
            openMemoModal(targetTime, false);
          } else {
            console.error("memo 모달 함수를 찾을 수 없습니다.");
            if (typeof showNoticeModal === 'function') {
              showNoticeModal('메모 기능을 사용할 수 없습니다.');
            }
          }
        }
      } else {
        console.warn("해당 시간의 데이터를 찾을 수 없습니다.");
        if (typeof showNoticeModal === 'function') {
          showNoticeModal('해당 시간의 기록을 찾을 수 없습니다.');
        }
      }
    } else {
      console.warn("해당 날짜의 기록이 없습니다.");
      if (typeof showNoticeModal === 'function') {
        showNoticeModal('해당 날짜의 기록이 없습니다.');
      }
    }
    
  } catch (error) {
    console.error("Memo 데이터를 가져오는 중 오류:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }
}

/**
 * 네비게이션 버튼 이벤트 등록 (2025년 8월 27일 생성됨)
 */
function registerNavigationEvents() {
  const { prevMonthBtn, nextMonthBtn } = monthlyReportUI.elements;

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToPreviousMonth();
    });
    console.log("이전 달 버튼 이벤트 등록");
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToNextMonth();
    });
    console.log("다음 달 버튼 이벤트 등록");
  }
}

/**
 * 월간 근무 내역 UI 시스템 초기화 (2025년 8월 29일 21:30 수정됨)
 */
function initializeMonthlyReportUI() {
  console.log("UI 시스템 초기화 시작...");
  
  try {
    // DOM 요소들 캐싱
    cacheUIElements();
    
    // 네비게이션 버튼 이벤트 등록
    registerNavigationEvents();
    
    // Memo 버튼 이벤트 등록 (2025년 8월 29일 21:30 추가됨)
    registerMemoButtonEvents();
    
    // 현재 날짜 기준으로 초기화
    const now = new Date();
    monthlyReportUI.currentYear = now.getFullYear();
    monthlyReportUI.currentMonth = now.getMonth();
    
    monthlyReportUI.isInitialized = true;
    console.log("UI 시스템 초기화 완료");
    
  } catch (error) {
    console.error("UI 시스템 초기화 중 오류:", error);
  }
}

/**
 * 이전 달로 이동 (2025년 8월 27일 생성됨)
 */
function navigateToPreviousMonth() {
  console.log("이전 달로 이동");
  
  monthlyReportUI.currentMonth--;
  if (monthlyReportUI.currentMonth < 0) {
    monthlyReportUI.currentMonth = 11;
    monthlyReportUI.currentYear--;
  }
  
  updateCurrentMonthDisplay();
  reloadMonthlyData();
}

/**
 * 다음 달로 이동 (2025년 8월 27일 생성됨)
 */
function navigateToNextMonth() {
  console.log("다음 달로 이동");
  
  monthlyReportUI.currentMonth++;
  if (monthlyReportUI.currentMonth > 11) {
    monthlyReportUI.currentMonth = 0;
    monthlyReportUI.currentYear++;
  }
  
  updateCurrentMonthDisplay();
  reloadMonthlyData();
}

/**
 * 현재 월 표시 업데이트 (2025년 8월 27일 생성됨)
 */
function updateCurrentMonthDisplay() {
  const { currentMonthLabel } = monthlyReportUI.elements;
  if (currentMonthLabel) {
    currentMonthLabel.textContent = `${monthlyReportUI.currentYear}년 ${monthlyReportUI.currentMonth + 1}월`;
  }
  
  // Integration 모듈에 현재 날짜 업데이트
  if (typeof window.MonthlyReportIntegration?.updateCurrentDate === 'function') {
    window.MonthlyReportIntegration.updateCurrentDate(monthlyReportUI.currentYear, monthlyReportUI.currentMonth);
  }
}

/**
 * 월간 데이터 다시 로드 (2025년 8월 27일 생성됨)
 */
function reloadMonthlyData() {
  // 선택된 날짜 초기화
  clearSelectedDate();
  
  // 달력 다시 렌더링
  if (typeof window.MonthlyReportCalendar?.renderCalendar === 'function') {
    window.MonthlyReportCalendar.renderCalendar(monthlyReportUI.currentYear, monthlyReportUI.currentMonth);
  }
  
  // 데이터 다시 로드
  const user = firebase.auth().currentUser;
  if (user && typeof window.MonthlyReportFirestore?.loadMonthlyData === 'function') {
    window.MonthlyReportFirestore.loadMonthlyData(monthlyReportUI.currentYear, monthlyReportUI.currentMonth, user.email);
  }
}

/**
 * 통계 카드 업데이트 (2025년 8월 27일 생성됨)
 */
function updateStatsCards(stats) {
  const { totalWorkCard, standardWorkCard, overtimeWorkCard } = monthlyReportUI.elements;
  
  try {
    if (totalWorkCard) {
      const totalHours = Math.floor(stats.totalMinutes / 60);
      const totalMins = stats.totalMinutes % 60;
      totalWorkCard.innerHTML = `${totalHours}<span class="stat-unit">시간</span><br> ${totalMins > 0 ? `${totalMins}분` : ''}`;
    }
    
    if (standardWorkCard) {
      const standardHours = Math.floor(stats.standardMinutes / 60);
      standardWorkCard.innerHTML = `${standardHours}<span class="stat-unit">시간</span>`;
    }
    
    if (overtimeWorkCard) {
      const overtimeMinutes = Math.max(0, stats.totalMinutes - stats.standardMinutes);
      const overtimeHours = Math.floor(overtimeMinutes / 60);
      const overtimeMins = overtimeMinutes % 60;
      
      if (overtimeMinutes > 0) {
        overtimeWorkCard.innerHTML = `${overtimeHours}<span class="stat-unit">시간</span><br> ${overtimeMins > 0 ? `${overtimeMins}분` : ''}`;
      } else {
        overtimeWorkCard.innerHTML = `0<span class="stat-unit">시간</span>`;
      }
    }
    
    console.log("통계 카드 업데이트 완료");
    
  } catch (error) {
    console.error("통계 카드 업데이트 중 오류:", error);
  }
}

/**
 * 프로그레스 바 업데이트 (2025년 8월 29일 21:15 수정됨)
 */
function updateProgressBar(stats) {
  const { 
    progressCompleted, 
    progressRemaining, 
    progressStandard, 
    progressCurrent, 
    progressStandardText, 
    progressMax 
  } = monthlyReportUI.elements;
  
  try {
    // 최대 근무시간을 기준으로 계산 (기준시간의 1.5배)
    const maxMinutes = Math.floor(stats.standardMinutes * 1.5);
    const progressPercentage = Math.min((stats.totalMinutes / maxMinutes) * 100, 100);
    const standardPercentage = (stats.standardMinutes / maxMinutes) * 100;
    
    // 프로그레스 바 업데이트 (근무시간만으로 계산, 휴가시간 제외)
    if (progressCompleted && progressRemaining) {
      progressCompleted.style.width = `${progressPercentage}%`;
      progressRemaining.style.width = `${100 - progressPercentage}%`;
      
      // 색상 변경
      if (progressPercentage < standardPercentage) {
        progressCompleted.style.backgroundColor = '#5B7CD1'; // 기본 색상
      } else if (progressPercentage <= 100) {
        progressCompleted.style.backgroundColor = '#4CAF50'; // 기준 달성
      } else {
        progressCompleted.style.backgroundColor = '#E53935'; // 초과
      }
    }
    
    // 기준선 위치 업데이트
    if (progressStandard) {
      progressStandard.style.left = `${standardPercentage}%`;
      progressStandard.style.display = 'block'; // 항상 표시되도록 보장 (2025년 8월 29일 21:10 추가됨)
    }
    
    // 월간 근무일수 기반 눈금 생성 (2025년 8월 29일 21:10 추가됨)
    generateMonthlyProgressTicks(stats, standardPercentage);
    
    // 현재 근무시간 + 휴가시간 표시 (2025년 8월 29일 21:15 수정됨)
    if (progressCurrent) {
      const currentHours = Math.floor(stats.totalMinutes / 60);
      const currentMins = stats.totalMinutes % 60;
      const vacationHours = Math.floor((stats.vacationMinutes || 0) / 60);
      
      // 근무시간 표시 (검은색 계열)
      let currentWorkText = currentMins > 0 ? `${currentHours}시간 ${currentMins}분` : `${currentHours}시간`;
      
      // 휴가시간이 있으면 추가 표시 (블루 색상)
      if (stats.vacationMinutes > 0) {
        progressCurrent.innerHTML = `<span style="color:#333">${currentWorkText}</span> + <span style="color:#5b7cd1">${vacationHours}시간</span>`;
      } else {
        // 휴가시간이 없으면 근무시간만 표시 (검은색 계열)
        progressCurrent.innerHTML = `<span style="color:#333">${currentWorkText}</span>`;
      }
    }
    
    // 기준시간 텍스트 (2025년 8월 29일 21:15 수정됨)
    if (progressStandardText) {
      const standardHours = Math.floor(stats.standardMinutes / 60);
      progressStandardText.textContent = `${standardHours}시간`;
      
      // 기준선 아래 위치로 이동 (CSS 기본 설정 유지하면서 미세 조정)
      progressStandardText.style.left = `${standardPercentage}%`;
      progressStandardText.style.bottom = '0px';
    }
    
    if (progressMax) {
      const maxHours = Math.floor(maxMinutes / 60);
      progressMax.textContent = `${maxHours}시간`;
    }
    
    console.log("프로그레스 바 업데이트 완료");
    
  } catch (error) {
    console.error("프로그레스 바 업데이트 중 오류:", error);
  }
}

/**
 * 월간 근무일수 기반 프로그레스 바 눈금 생성 (2025년 8월 29일 21:00 새로 생성됨)
 */
function generateMonthlyProgressTicks(stats, standardPercentage) {
  console.log("월간 근무일수 눈금 생성 시작...");
  
  const progressBarContainer = monthlyReportUI.elements.progressCompleted?.parentElement;
  if (!progressBarContainer) {
    console.warn("프로그레스 바 컨테이너를 찾을 수 없습니다.");
    return;
  }
  
  try {
    // 기존 월간 눈금 제거
    const existingTicks = progressBarContainer.querySelectorAll('.monthly-progress-tick');
    existingTicks.forEach(tick => tick.remove());
    
    // 월간 근무일수 계산
    const workDaysCount = calculateWorkDaysCount(stats.year, stats.month);
    
    if (workDaysCount <= 1) {
      console.log("근무일수가 1일 이하라 눈금 생성 건너뜀");
      return;
    }
    
    // 기준선 좌측 구간을 근무일수만큼 균등 분할
    // 기준선이 standardPercentage% 위치에 있으므로, 0% ~ standardPercentage% 구간을 분할
    const tickInterval = standardPercentage / workDaysCount;
    
    console.log(`눈금 생성: ${workDaysCount}개 근무일, 간격 ${tickInterval.toFixed(2)}%`);
    
    // 컨테이너를 relative position으로 설정
    if (progressBarContainer.style.position !== 'relative') {
      progressBarContainer.style.position = 'relative';
    }
    
    // 눈금 생성 (첫 번째와 마지막 위치는 제외)
    for (let i = 1; i < workDaysCount; i++) {
      const tickPosition = tickInterval * i;
      
      const tick = document.createElement('div');
      tick.className = 'monthly-progress-tick';
      tick.style.cssText = `
        position: absolute;
        left: ${tickPosition}%;
        top: 0;
        bottom: 0;
        width: 1px;
        background-color: rgba(255, 255, 255, 0.3);
        z-index: 2;
        pointer-events: none;
      `;
      
      progressBarContainer.appendChild(tick);
    }
    
    console.log(`${workDaysCount - 1}개 눈금 생성 완료`);
    
  } catch (error) {
    console.error("눈금 생성 중 오류:", error);
  }
}

/**
 * 월간 근무일수 계산 (평일 - 공휴일) (2025년 8월 29일 21:00 새로 생성됨)
 */
function calculateWorkDaysCount(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 주말이 아니고 공휴일이 아닌 경우만 근무일로 계산
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHolidayForUI(dateStr)) {
      workDays++;
    }
  }
  
  return workDays;
}

/**
 * 공휴일 체크 (UI용) (2025년 8월 29일 21:00 새로 생성됨)
 */
function isHolidayForUI(dateStr) {
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
 * 선택된 날짜 표시 업데이트 (2025년 8월 27일 생성됨)
 */
function updateSelectedDate(dateStr) {
  const { selectedDateLabel } = monthlyReportUI.elements;
  
  if (selectedDateLabel && dateStr) {
    const [year, month, day] = dateStr.split('-');
    selectedDateLabel.textContent = `${month}.${day}`;
    selectedDateLabel.style.display = 'block';
    
    // Integration 모듈에 선택된 날짜 업데이트
    if (typeof window.MonthlyReportIntegration?.setSelectedDate === 'function') {
      window.MonthlyReportIntegration.setSelectedDate(dateStr);
    }
  }
}

/**
 * 선택된 날짜 초기화 (2025년 8월 27일 생성됨)
 */
function clearSelectedDate() {
  const { selectedDateLabel, historyList } = monthlyReportUI.elements;
  
  if (selectedDateLabel) {
    selectedDateLabel.style.display = 'none';
  }
  
  if (historyList) {
    historyList.innerHTML = `
      <div class="monthly-report-empty-history">
        달력에서 날짜를 선택하면 해당일의 근무 내역을 볼 수 있습니다.
      </div>
    `;
  }
  
  // Integration 모듈의 선택된 날짜도 초기화
  if (typeof window.MonthlyReportIntegration?.setSelectedDate === 'function') {
    window.MonthlyReportIntegration.setSelectedDate(null);
  }
}

/**
 * 히스토리 리스트 업데이트 (2025년 9월 1일 17:45 수정됨)
 */
function updateHistoryList(dateStr, dayData) {
  const { historyList } = monthlyReportUI.elements;
  
  if (!historyList || !dayData) return;
  
  try {
    let historyHTML = '';
    
    // 히스토리 아이템이 있는지 확인
    const hasStart = dayData.start && dayData.start.length > 0;
    const hasEnd = dayData.end && dayData.end.length > 0;
    const hasGps = dayData.gps && dayData.gps.length > 0;
    const hasVacation = dayData.vacation && dayData.vacation.length > 0;
    
    if (!hasStart && !hasEnd && !hasGps && !hasVacation) {
      historyHTML = `
        <div class="monthly-report-empty-history">
          해당 날짜에 근무 기록이 없습니다.
        </div>
      `;
    } else {
      // 출근 기록
      if (hasStart) {
        dayData.start.forEach(item => {
          historyHTML += createHistoryItemHTML(item.time, '출근', item.address || item.gps, item.memo?.work);
        });
      }
      
      // GPS 중간 기록
      if (hasGps) {
        dayData.gps.forEach(item => {
          historyHTML += createHistoryItemHTML(item.time, 'GPS', item.address || item.gps, item.memo?.work);
        });
      }
      
      // 퇴근 기록 (최신 것만) - 수정된 부분 (2025년 9월 1일 17:45)
      if (hasEnd) {
        try {
          console.log("퇴근 기록 처리 시작, 원본 데이터:", dayData.end);
          
          // parseTimeString 함수를 사용하여 안전하게 정렬
          const latestEnd = dayData.end
            .filter(endItem => endItem && endItem.time) // 유효한 데이터만 필터링
            .sort((a, b) => {
              const timeA = window.MonthlyReportCore?.parseTimeString(a.time) || 0;
              const timeB = window.MonthlyReportCore?.parseTimeString(b.time) || 0;
              console.log(`시간 비교: ${a.time}(${timeA}) vs ${b.time}(${timeB})`);
              return timeA - timeB; // 오름차순 정렬
            })
            .pop(); // 가장 늦은 시간 선택
          
          if (latestEnd) {
            console.log("선택된 최신 퇴근 기록:", latestEnd);
            historyHTML += createHistoryItemHTML(latestEnd.time, '퇴근', latestEnd.address || latestEnd.gps, latestEnd.memo?.work);
          } else {
            console.warn("유효한 퇴근 기록을 찾을 수 없습니다.");
          }
          
        } catch (endError) {
          console.error("퇴근 기록 처리 중 오류:", endError);
          // 오류 발생 시 첫 번째 퇴근 기록 사용
          if (dayData.end[0]) {
            historyHTML += createHistoryItemHTML(dayData.end[0].time, '퇴근', dayData.end[0].address || dayData.end[0].gps, dayData.end[0].memo?.work);
          }
        }
      }
      
      // 휴가 기록
      if (hasVacation) {
        dayData.vacation.forEach(item => {
          historyHTML += createHistoryItemHTML(`${item.start}~${item.end}`, '휴가', item.type, null);
        });
      }
    }
    
    historyList.innerHTML = historyHTML;
    console.log("히스토리 리스트 업데이트 완료");
    
  } catch (error) {
    console.error("히스토리 리스트 업데이트 중 오류:", error);
    historyList.innerHTML = `
      <div class="monthly-report-empty-history">
        데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    `;
  }
}

/**
 * 히스토리 아이템 HTML 생성 (2025년 8월 29일 21:35 수정됨)
 */
function createHistoryItemHTML(time, type, location, workType) {
  let workTypeHTML = '';
  if (workType) {
    let typeClass = '';
    if (workType === '내근') typeClass = 'office';
    else if (workType === '외근') typeClass = 'field';
    else if (workType === '재택') typeClass = 'remote';
    
    workTypeHTML = `<span class="monthly-report-history-work-type ${typeClass}">${workType}</span>`;
  }
  
  // 휴가 기록에는 Memo 버튼을 표시하지 않음 (2025년 9월 1일 17:45 추가됨)
  const showMemoButton = type !== '휴가';
  const memoButtonHTML = showMemoButton ? 
    `<div class="monthly-report-memo-btn" data-time="${time}" data-type="${type}">Memo</div>` : '';
  
  return `
    <div class="monthly-report-history-item">
      <div class="monthly-report-history-content">
        <div class="monthly-report-history-time">${time}</div>
        <div class="monthly-report-history-detail">
          <strong>${type}</strong><br>
          ${location || ''}
          ${workTypeHTML}
        </div>
      </div>
      ${memoButtonHTML}
    </div>
  `;
}

/**
 * 모달 초기화 (다른 모듈에서 호출) (2025년 8월 27일 생성됨)
 */
function initializeModal() {
  if (!monthlyReportUI.isInitialized) {
    console.warn("UI 시스템이 초기화되지 않았습니다.");
    return;
  }
  
  // 현재 월 표시 업데이트
  updateCurrentMonthDisplay();
  
  // 선택된 날짜 초기화
  clearSelectedDate();
  
  console.log("모달 초기화 완료");
}

// 다른 모듈에서 사용할 수 있도록 전역 객체로 내보내기
window.MonthlyReportUI = {
  // 공개 함수들
  initializeModal,
  updateStatsCards,
  updateProgressBar,
  updateSelectedDate,
  clearSelectedDate,
  updateHistoryList,
  
  // UI 상태 접근자
  get currentYear() { return monthlyReportUI.currentYear; },
  get currentMonth() { return monthlyReportUI.currentMonth; },
  get isInitialized() { return monthlyReportUI.isInitialized; },
  get elements() { return monthlyReportUI.elements; }
};

console.log("모듈 로드 완료");