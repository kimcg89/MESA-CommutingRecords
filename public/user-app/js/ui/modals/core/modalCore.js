// modalCore.js
// 모달 시스템 핵심 기능 관리 (2025년 8월 14일 23:58 생성됨)
// 기본 모달 시스템 초기화 및 공통 이벤트 처리

// Firebase 준비 완료 후 모달 시스템 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeModalCore();
});

/**
 * 모달 시스템 초기화 (2025년 8월 14일 23:58 생성됨)
 * 기본 이벤트 리스너 설정 및 공통 모달 요소 준비
 */
function initializeModalCore() {
  // 모달 오버레이 클릭 시 닫기 이벤트
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeModal);
  }

  // 취소 버튼들 이벤트
  const cancelVacationBtn = document.getElementById("cancel-vacation");
  if (cancelVacationBtn) {
    cancelVacationBtn.addEventListener("click", closeModal);
  }

  // ESC 키로 모달 닫기
  document.addEventListener("keydown", handleEscKey);

  console.log("모달 시스템 초기화 완료");
}

/**
 * ESC 키 처리 (2025년 8월 14일 23:58 생성됨)
 * @param {KeyboardEvent} event - 키보드 이벤트
 */
function handleEscKey(event) {
  if (event.key === "Escape" && isModalOpen()) {
    closeAllModals();
  }
}

/**
 * 블러 오버레이 생성 또는 재사용 (2025년 8월 14일 23:58 생성됨)
 * @param {string} overlayId - 오버레이 ID (기본값: 'modal-blur-overlay')
 * @returns {HTMLElement} 블러 오버레이 요소
 */
function createBlurOverlay(overlayId = 'modal-blur-overlay') {
  let blurOverlay = document.getElementById(overlayId);
  if (!blurOverlay) {
    blurOverlay = document.createElement("div");
    blurOverlay.id = overlayId;
    document.body.appendChild(blurOverlay);
  }

  blurOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 998;
    display: block;
  `;

  return blurOverlay;
}

/**
 * 기본 모달 스타일 적용 (2025년 8월 14일 23:58 생성됨)
 * @param {HTMLElement} modal - 모달 요소
 * @param {string} zIndex - z-index 값 (기본값: '999')
 */
function applyModalStyles(modal, zIndex = '999') {
  if (!modal) return;
  
  modal.style.display = "block";
  modal.style.zIndex = zIndex;
}

/**
 * 모달 상태 확인 함수 (2025년 8월 14일 23:58 생성됨)
 * @returns {boolean} 모달이 열려있는지 여부
 */
function isModalOpen() {
  const modals = [
    document.getElementById("modal-overlay"),
    document.getElementById("vacation-modal"),
    document.getElementById("notice-modal"),
    document.getElementById("attendance-modal"),
    document.getElementById("modal-overlay-annual"),
    document.getElementById("annual-vacation-modal"),
  ];

  return modals.some(
    (modal) =>
      modal && modal.style.display !== "none" && modal.style.display !== ""
  );
}

/**
 * 일반 모달 닫기 (통합 함수) (2025년 8월 14일 23:58 생성됨)
 * 블러 오버레이 포함
 */
function closeModal() {
  // 주요 모달들 닫기
  const modalOverlay = document.getElementById("modal-overlay");
  const vacationModal = document.getElementById("vacation-modal");
  const noticeModal = document.getElementById("notice-modal");
  const attendanceModal = document.getElementById("attendance-modal");
  const blurOverlay = document.getElementById("modal-blur-overlay");

  if (modalOverlay) {
    modalOverlay.style.display = "none";
    // 블러 효과 제거
    modalOverlay.style.backdropFilter = "none";
    modalOverlay.style.webkitBackdropFilter = "none";
  }
  if (vacationModal) vacationModal.style.display = "none";
  if (noticeModal) noticeModal.style.display = "none";
  if (attendanceModal) attendanceModal.style.display = "none";
  if (blurOverlay) blurOverlay.style.display = "none";
}

/**
 * 특정 모달 닫기 함수들 (2025년 8월 14일 23:58 생성됨)
 */
function closeAttendanceModal() {
  const modal = document.getElementById("attendance-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function closeVacationModal() {
  const vacationModal = document.getElementById("vacation-modal");
  if (vacationModal) {
    vacationModal.style.display = "none";
  }
}

function closeOverlayModal() {
  const overlayModal = document.getElementById("modal-overlay");
  if (overlayModal) {
    overlayModal.style.display = "none";
  }
}

function closeAnnualModal() {
  const modalOverlayAnnual = document.getElementById("modal-overlay-annual");
  const annualVacationModal = document.getElementById("annual-vacation-modal");

  if (modalOverlayAnnual) modalOverlayAnnual.style.display = "none";
  if (annualVacationModal) annualVacationModal.style.display = "none";
}

/**
 * 모든 모달 강제 닫기 (2025년 8월 14일 23:58 생성됨)
 * 블러 오버레이 포함
 */
function closeAllModals() {
  const modals = [
    "modal-overlay",
    "vacation-modal",
    "notice-modal",
    "attendance-modal",
    "modal-overlay-annual",
    "annual-vacation-modal",
    "gps-loading-overlay",
    "gps-loading-modal",
    "modal-blur-overlay",
  ];

  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
      // 블러 효과 제거
      if (modalId === "modal-overlay") {
        modal.style.backdropFilter = "none";
        modal.style.webkitBackdropFilter = "none";
      }
    }
  });
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.ModalCore = {
  initializeModalCore,
  createBlurOverlay,
  applyModalStyles,
  isModalOpen,
  closeModal,
  closeAttendanceModal,
  closeVacationModal,
  closeOverlayModal,
  closeAnnualModal,
  closeAllModals,
};