// monthly-report-integration.js
// 월간 근무 내역 시스템 통합 진입점 (2025년 8월 27일 생성됨)

// 월간 근무 내역 시스템 전역 상태
let monthlyReportSystem = {
  isInitialized: false,
  currentDate: new Date(),
  selectedDate: null,
  monthlyData: {},
  isModalOpen: false
};

// Firebase 준비 완료 후 월간 근무 내역 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeMonthlyReportSystem();
});

// DOM 로드 완료 후 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  registerMonthlyReportEvents();
});

/**
 * 월간 근무 내역 시스템 초기화 (2025년 8월 27일 생성됨)
 */
function initializeMonthlyReportSystem() {
  console.log("📊 [MONTHLY-REPORT] 시스템 초기화 시작...");
  
  try {
    // 필수 DOM 요소 확인
    const monthlyReportButton = findMonthlyReportButton();
    const monthlyReportModal = document.getElementById('monthly-report-modal');
    const modalOverlay = document.getElementById('modal-overlay-monthly-report');
    
    if (!monthlyReportButton) {
      console.error("❌ [MONTHLY-REPORT] 월간근무내역 버튼을 찾을 수 없습니다.");
      return;
    }
    
    if (!monthlyReportModal || !modalOverlay) {
      console.error("❌ [MONTHLY-REPORT] 모달 요소를 찾을 수 없습니다.");
      return;
    }
    
    // 현재 날짜를 KST 기준으로 설정
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    monthlyReportSystem.currentDate = new Date(now.getTime() + kstOffset);
    
    monthlyReportSystem.isInitialized = true;
    console.log("✅ [MONTHLY-REPORT] 시스템 초기화 완료");
    console.log("📅 [MONTHLY-REPORT] 현재 날짜:", monthlyReportSystem.currentDate.toISOString().split('T')[0]);
    
  } catch (error) {
    console.error("❌ [MONTHLY-REPORT] 시스템 초기화 중 오류:", error);
  }
}

/**
 * 월간근무내역 버튼 찾기 (2025년 8월 29일 21:25 수정됨)
 * monthlyCalendarBtn ID를 우선적으로 찾도록 변경
 */
function findMonthlyReportButton() {
  // 1순위: monthlyCalendarBtn ID로 찾기
  const monthlyCalendarBtn = document.getElementById('monthlyCalendarBtn');
  if (monthlyCalendarBtn) {
    return monthlyCalendarBtn;
  }
  
  // 2순위: monthlyCalendar 클래스로 찾기
  const monthlyCalendar = document.querySelector('.monthlyCalendar');
  if (monthlyCalendar) {
    return monthlyCalendar;
  }
  
  // 3순위: 기타 대안 방법들 (하위 호환성)
  return (
    document.getElementById('monthly-report-btn') ||
    document.querySelector('.monthly-report-btn') ||
    document.querySelector('[data-action="monthly-report"]')
  );
}

/**
 * 월간 근무 내역 이벤트 등록 (2025년 8월 27일 생성됨)
 */
function registerMonthlyReportEvents() {
  console.log("🔗 [MONTHLY-REPORT] 이벤트 등록 시작...");
  
  // 월간근무내역 버튼 클릭 이벤트
  const monthlyReportButton = findMonthlyReportButton();
  if (monthlyReportButton) {
    monthlyReportButton.addEventListener('click', (event) => {
      event.preventDefault();
      console.log("📊 [MONTHLY-REPORT] 월간근무내역 버튼 클릭됨");
      openMonthlyReportModal();
    });
    console.log("✅ [MONTHLY-REPORT] 월간근무내역 버튼 이벤트 등록 완료");
  } else {
    console.warn("⚠️ [MONTHLY-REPORT] 월간근무내역 버튼을 찾을 수 없어 이벤트 등록 실패");
  }
  
  // 모달 닫기 버튼 이벤트
  const closeButton = document.getElementById('close-monthly-report');
  if (closeButton) {
    closeButton.addEventListener('click', closeMonthlyReportModal);
    console.log("✅ [MONTHLY-REPORT] 닫기 버튼 이벤트 등록 완료");
  }
  
  // 모달 오버레이 클릭 시 닫기
  const modalOverlay = document.getElementById('modal-overlay-monthly-report');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeMonthlyReportModal);
    console.log("✅ [MONTHLY-REPORT] 오버레이 클릭 이벤트 등록 완료");
  }
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && monthlyReportSystem.isModalOpen) {
      closeMonthlyReportModal();
    }
  });
  
  console.log("🎯 [MONTHLY-REPORT] 모든 이벤트 등록 완료");
}

/**
 * 월간 근무 내역 모달 열기 (2025년 8월 27일 생성됨)
 */
function openMonthlyReportModal() {
  if (!monthlyReportSystem.isInitialized) {
    console.error("❌ [MONTHLY-REPORT] 시스템이 초기화되지 않았습니다.");
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('시스템이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("❌ [MONTHLY-REPORT] 로그인된 사용자가 없습니다.");
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('로그인이 필요합니다.');
    }
    return;
  }
  
  console.log("📊 [MONTHLY-REPORT] 모달 열기 시작...");
  
  try {
    // 모달 요소 가져오기
    const modal = document.getElementById('monthly-report-modal');
    const overlay = document.getElementById('modal-overlay-monthly-report');
    
    if (!modal || !overlay) {
      console.error("❌ [MONTHLY-REPORT] 모달 요소를 찾을 수 없습니다.");
      return;
    }
    
    // 모달 상태 업데이트
    monthlyReportSystem.isModalOpen = true;
    monthlyReportSystem.selectedDate = null;
    
    // 모달 표시
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    // 페이지 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    // 현재 월로 초기화
    initializeCurrentMonth();
    
    // 다른 모듈들이 로드되면 호출할 초기화 함수들
    setTimeout(() => {
      // UI 모듈이 있으면 초기화
      if (typeof window.MonthlyReportUI?.initializeModal === 'function') {
        window.MonthlyReportUI.initializeModal();
      }
      
      // 캘린더 모듈이 있으면 렌더링
      if (typeof window.MonthlyReportCalendar?.renderCalendar === 'function') {
        window.MonthlyReportCalendar.renderCalendar(
          monthlyReportSystem.currentDate.getFullYear(),
          monthlyReportSystem.currentDate.getMonth()
        );
      }
      
      // 데이터 로드
      if (typeof window.MonthlyReportFirestore?.loadMonthlyData === 'function') {
        window.MonthlyReportFirestore.loadMonthlyData(
          monthlyReportSystem.currentDate.getFullYear(),
          monthlyReportSystem.currentDate.getMonth(),
          user.email
        );
      }
    }, 100);
    
    console.log("✅ [MONTHLY-REPORT] 모달 열기 완료");
    
  } catch (error) {
    console.error("❌ [MONTHLY-REPORT] 모달 열기 중 오류:", error);
    monthlyReportSystem.isModalOpen = false;
    
    if (typeof showNoticeModal === 'function') {
      showNoticeModal('모달을 열 수 없습니다. 다시 시도해주세요.');
    }
  }
}

/**
 * 월간 근무 내역 모달 닫기 (2025년 8월 27일 생성됨)
 */
function closeMonthlyReportModal() {
  console.log("❌ [MONTHLY-REPORT] 모달 닫기 시작...");
  
  try {
    const modal = document.getElementById('monthly-report-modal');
    const overlay = document.getElementById('modal-overlay-monthly-report');
    
    if (modal && overlay) {
      // 모달 숨기기
      modal.style.display = 'none';
      overlay.style.display = 'none';
      
      // 페이지 스크롤 복원
      document.body.style.overflow = '';
    }
    
    // 상태 초기화
    monthlyReportSystem.isModalOpen = false;
    monthlyReportSystem.selectedDate = null;
    monthlyReportSystem.monthlyData = {};
    
    console.log("✅ [MONTHLY-REPORT] 모달 닫기 완료");
    
  } catch (error) {
    console.error("❌ [MONTHLY-REPORT] 모달 닫기 중 오류:", error);
  }
}

/**
 * 현재 월 초기화 (2025년 8월 27일 생성됨)
 */
function initializeCurrentMonth() {
  const currentMonthElement = document.getElementById('monthly-report-current-month');
  if (currentMonthElement) {
    const year = monthlyReportSystem.currentDate.getFullYear();
    const month = monthlyReportSystem.currentDate.getMonth() + 1;
    currentMonthElement.textContent = `${year}년 ${month}월`;
  }
  
  // 선택된 날짜 표시 숨기기
  const selectedDateElement = document.getElementById('monthly-report-selected-date');
  if (selectedDateElement) {
    selectedDateElement.style.display = 'none';
  }
  
  // 히스토리 초기 상태로 설정
  const historyList = document.getElementById('monthly-report-history-list');
  if (historyList) {
    historyList.innerHTML = `
      <div class="monthly-report-empty-history">
        달력에서 날짜를 선택하면 해당일의 근무 내역을 볼 수 있습니다.
      </div>
    `;
  }
}

/**
 * 시스템 상태 확인 함수 (2025년 8월 27일 생성됨)
 */
function getMonthlyReportSystemStatus() {
  return {
    isInitialized: monthlyReportSystem.isInitialized,
    isModalOpen: monthlyReportSystem.isModalOpen,
    currentDate: monthlyReportSystem.currentDate,
    selectedDate: monthlyReportSystem.selectedDate,
    hasMonthlyData: Object.keys(monthlyReportSystem.monthlyData).length > 0
  };
}

/**
 * 디버깅용 함수 (2025년 8월 27일 생성됨)
 */
function debugMonthlyReport() {
  console.log("🔍 [MONTHLY-REPORT] 시스템 상태:", getMonthlyReportSystemStatus());
  console.log("🔍 [MONTHLY-REPORT] 월간근무내역 버튼:", findMonthlyReportButton());
  console.log("🔍 [MONTHLY-REPORT] 모달 요소:", document.getElementById('monthly-report-modal'));
  console.log("🔍 [MONTHLY-REPORT] 로그인 사용자:", firebase.auth().currentUser?.email);
}

// 다른 모듈에서 사용할 수 있도록 전역 객체로 내보내기
window.MonthlyReportIntegration = {
  // 공개 함수들
  openMonthlyReportModal,
  closeMonthlyReportModal,
  getMonthlyReportSystemStatus,
  debugMonthlyReport,
  
  // 시스템 상태 접근자
  get currentDate() { return monthlyReportSystem.currentDate; },
  get selectedDate() { return monthlyReportSystem.selectedDate; },
  get isModalOpen() { return monthlyReportSystem.isModalOpen; },
  get monthlyData() { return monthlyReportSystem.monthlyData; },
  
  // 상태 업데이트 함수들 (다른 모듈에서 사용)
  setSelectedDate(date) { monthlyReportSystem.selectedDate = date; },
  setMonthlyData(data) { monthlyReportSystem.monthlyData = data; },
  updateCurrentDate(year, month) { 
    monthlyReportSystem.currentDate = new Date(year, month, 1);
  }
};

// 전역 함수로도 접근 가능하게 설정 (하위 호환성)
window.openMonthlyReportModal = openMonthlyReportModal;
window.closeMonthlyReportModal = closeMonthlyReportModal;
window.debugMonthlyReport = debugMonthlyReport;