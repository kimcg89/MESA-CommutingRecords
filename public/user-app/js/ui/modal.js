// modal.js
// 모달 시스템 통합 진입점 (2025년 8월 14일 23:58 수정됨)
// 기존 함수들을 각 모듈로 분리하고 통합 인터페이스 제공

// 모든 모달 모듈이 로드되었는지 확인하는 플래그 (2025년 8월 14일 23:58 추가됨)
let modalModulesLoaded = false;

// Firebase 준비 완료 후 모달 시스템 초기화 (2025년 8월 14일 23:58 수정됨)
document.addEventListener("firebaseReady", (event) => {
  initializeModalSystem();
});

/**
 * 통합 모달 시스템 초기화 (2025년 8월 14일 23:58 수정됨)
 * 모든 모듈의 초기화를 관리
 */
function initializeModalSystem() {
  // 핵심 모달 시스템 초기화
  if (typeof window.ModalCore?.initializeModalCore === "function") {
    window.ModalCore.initializeModalCore();
  }

  modalModulesLoaded = true;
  console.log("📦 통합 모달 시스템 초기화 완료");
}

/**
 * 모듈 로드 상태 확인 (2025년 8월 14일 23:58 추가됨)
 * @returns {boolean} 모든 모듈이 로드되었는지 여부
 */
function areModulesReady() {
  return (
    modalModulesLoaded &&
    typeof window.ModalCore === "object" &&
    typeof window.ModalUtils === "object" &&
    typeof window.NoticeModule === "object" &&
    typeof window.AttendanceModule === "object" &&
    typeof window.WorkTypeModule === "object" &&
    typeof window.OfficeWorkModule === "object" &&
    typeof window.FieldWorkModule === "object" &&
    typeof window.RemoteWorkModule === "object"
  );
}

/**
 * 안전한 함수 호출 래퍼 (2025년 8월 14일 23:58 추가됨)
 * 모듈이 로드되지 않은 경우 대체 동작 수행
 * @param {Function} primaryFunc - 주요 함수
 * @param {Function} fallbackFunc - 대체 함수
 * @param {...any} args - 함수 인자들
 */
function safeModuleCall(primaryFunc, fallbackFunc, ...args) {
  if (typeof primaryFunc === "function") {
    return primaryFunc(...args);
  } else if (typeof fallbackFunc === "function") {
    console.warn("⚠️ 주요 모듈을 찾을 수 없어 대체 함수를 사용합니다.");
    return fallbackFunc(...args);
  } else {
    console.error("❌ 사용 가능한 함수가 없습니다.");
  }
}

// ===========================================
// 하위 호환성을 위한 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
// ===========================================

/**
 * 알림 모달 표시 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showNoticeModal(message) {
  return safeModuleCall(
    window.NoticeModule?.showNoticeModal,
    (msg) => alert(msg), // 대체 함수
    message
  );
}

/**
 * 알림 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeNoticeModal() {
  return safeModuleCall(
    window.NoticeModule?.closeNoticeModal,
    () => {} // 빈 대체 함수
  );
}

/**
 * 일반 모달 표시 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showModal(message, isDismissable) {
  return safeModuleCall(
    window.NoticeModule?.showModal,
    (msg) => alert(msg), // 대체 함수
    message,
    isDismissable
  );
}

/**
 * 출근/퇴근 모달 표시 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showAttendanceModal(message, isDismissable) {
  return safeModuleCall(
    window.AttendanceModule?.showAttendanceModal,
    (msg) => alert(msg), // 대체 함수
    message,
    isDismissable
  );
}

/**
 * 퇴근 확인 모달 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showConfirmModal(message, onConfirm) {
  return safeModuleCall(
    window.AttendanceModule?.showConfirmModal,
    (msg, callback) => { // 대체 함수
      if (confirm(msg)) {
        callback();
      }
    },
    message,
    onConfirm
  );
}

/**
 * 근무구분 선택 모달 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showWorkTypeSelectionModal(targetTime, recordType, recordDate) {
  return safeModuleCall(
    window.WorkTypeModule?.showWorkTypeSelectionModal,
    () => console.error("❌ 근무구분 선택 모달을 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate
  );
}

/**
 * 내근 상세내용 모달 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showOfficeWorkDetailModal(targetTime, recordType, recordDate, isEditMode = false) {
  return safeModuleCall(
    window.OfficeWorkModule?.showOfficeWorkDetailModal,
    () => console.error("❌ 내근 상세내용 모달을 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    isEditMode
  );
}

/**
 * 외근 상세내용 모달 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showFieldWorkDetailModal(targetTime, recordType, recordDate, isEditMode = false) {
  return safeModuleCall(
    window.FieldWorkModule?.showFieldWorkDetailModal,
    () => console.error("❌ 외근 상세내용 모달을 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    isEditMode
  );
}

/**
 * 재택 상세내용 모달 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showRemoteWorkDetailModal(targetTime, recordType, recordDate, isEditMode = false) {
  return safeModuleCall(
    window.RemoteWorkModule?.showRemoteWorkDetailModal,
    () => console.error("❌ 재택 상세내용 모달을 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    isEditMode
  );
}

/**
 * 근무구분 저장 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function saveWorkTypeToMemo(targetTime, recordType, recordDate, workType, details = "") {
  return safeModuleCall(
    window.ModalUtils?.saveWorkTypeToMemo,
    () => console.error("❌ saveWorkTypeToMemo 함수를 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    workType,
    details
  );
}

/**
 * 메모 상세내용 업데이트 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function updateMemoDetails(targetTime, recordType, recordDate, details) {
  return safeModuleCall(
    window.ModalUtils?.updateMemoDetails,
    () => console.error("❌ updateMemoDetails 함수를 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    details
  );
}

/**
 * 기존 메모 상세내용 불러오기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function loadExistingMemoDetails(targetTime, recordType, recordDate, textareaElement) {
  return safeModuleCall(
    window.ModalUtils?.loadExistingMemoDetails,
    () => console.error("❌ loadExistingMemoDetails 함수를 찾을 수 없습니다."), // 대체 함수
    targetTime,
    recordType,
    recordDate,
    textareaElement
  );
}

/**
 * History 아이템 근무 유형 업데이트 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function updateHistoryItemWorkType(targetTime, workType) {
  return safeModuleCall(
    window.ModalUtils?.updateHistoryItemWorkType,
    () => {}, // 빈 대체 함수
    targetTime,
    workType
  );
}

/**
 * 로딩 블러 표시 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function showLoadingBlur(message = "처리 중...") {
  return safeModuleCall(
    window.ModalUtils?.showLoadingBlur,
    () => {}, // 빈 대체 함수
    message
  );
}

/**
 * 로딩 메시지 업데이트 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function updateLoadingMessage(message) {
  return safeModuleCall(
    window.ModalUtils?.updateLoadingMessage,
    () => {}, // 빈 대체 함수
    message
  );
}

/**
 * 로딩 블러 숨기기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function hideLoadingBlur() {
  return safeModuleCall(
    window.ModalUtils?.hideLoadingBlur,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 기존 로딩 모달 숨기기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function hideLoading() {
  return safeModuleCall(
    window.ModalUtils?.hideLoading,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 모달 상태 확인 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function isModalOpen() {
  return safeModuleCall(
    window.ModalCore?.isModalOpen,
    () => false, // 대체 함수
  );
}

/**
 * 일반 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeModal() {
  return safeModuleCall(
    window.ModalCore?.closeModal,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 출근/퇴근 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeAttendanceModal() {
  return safeModuleCall(
    window.ModalCore?.closeAttendanceModal,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 휴가 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeVacationModal() {
  return safeModuleCall(
    window.ModalCore?.closeVacationModal,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 오버레이 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeOverlayModal() {
  return safeModuleCall(
    window.ModalCore?.closeOverlayModal,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 연차 모달 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeAnnualModal() {
  return safeModuleCall(
    window.ModalCore?.closeAnnualModal,
    () => {}, // 빈 대체 함수
  );
}

/**
 * 모든 모달 강제 닫기 - 기존 인터페이스 유지 (2025년 8월 14일 23:58 수정됨)
 */
function closeAllModals() {
  return safeModuleCall(
    window.ModalCore?.closeAllModals,
    () => {}, // 빈 대체 함수
  );
}

// ===========================================
// 통합 모듈 인터페이스 (2025년 8월 14일 23:58 생성됨)
// ===========================================

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 수정됨)
// 기존 ModalModule 인터페이스 유지하되 새로운 모듈 구조 반영
window.ModalModule = {
  // 기존 함수들 (하위 호환성)
  showNoticeModal,
  closeNoticeModal,
  showModal,
  showAttendanceModal,
  showConfirmModal,
  hideLoading,
  closeModal,
  closeAttendanceModal,
  closeVacationModal,
  closeOverlayModal,
  closeAnnualModal,
  isModalOpen,
  closeAllModals,
  
  // 근무구분 관련 함수들 (기존 인터페이스 유지)
  showWorkTypeSelectionModal,
  showOfficeWorkDetailModal,
  showFieldWorkDetailModal,
  showRemoteWorkDetailModal,
  saveWorkTypeToMemo,
  updateMemoDetails,
  loadExistingMemoDetails,
  
  // 로딩 및 유틸리티 함수들 (기존 인터페이스 유지)
  showLoadingBlur,
  updateLoadingMessage,
  hideLoadingBlur,
  updateHistoryItemWorkType,
  
  // 새로운 유틸리티 함수들 (2025년 8월 14일 23:58 추가됨)
  areModulesReady,
  safeModuleCall,
  initializeModalSystem,
};