// noticeModal.js
// 알림 모달 관리 (2025년 8월 14일 23:58 생성됨)
// 일반 알림, 확인 모달 등 알림 관련 모달 기능

/**
 * 알림 모달 표시 함수 (2025년 8월 14일 23:58 생성됨)
 * 배경 블러 효과 포함
 * @param {string} message - 표시할 메시지
 */
function showNoticeModal(message) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("notice-modal");

  // 모달과 오버레이 존재 여부 체크
  if (!modalOverlay || !modal) {
    console.error("모달 또는 오버레이 요소를 찾을 수 없습니다.");
    // 백업으로 alert 사용
    alert(message);
    return;
  }

  // 오버레이에 블러 효과 추가
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 999;
    display: block;
  `;

  // innerHTML 재구성 대신 기존 DOM 사용 (안전한 방식)
  modal.innerHTML = `
    <div class="modal-content">
      <p id="notice-message">${message}</p>
      <button id="close-notice">확인</button>
    </div>
  `;

  modal.style.display = "block";

  // 이벤트 리스너를 모달 생성 후에 바인딩
  const closeNoticeBtn = document.getElementById("close-notice");
  if (closeNoticeBtn) {
    closeNoticeBtn.addEventListener("click", () => {
      modalOverlay.style.display = "none";
      modal.style.display = "none";
    });
  }
}

/**
 * 알림 모달 닫기 전용 함수 (2025년 8월 14일 23:58 생성됨)
 */
function closeNoticeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("notice-modal");

  if (modalOverlay && modal) {
    modalOverlay.style.display = "none";
    modal.style.display = "none";
  }
}

/**
 * 일반 모달 표시 함수 (2025년 8월 14일 23:58 생성됨)
 * 배경 블러 효과 포함
 * @param {string} message - 표시할 메시지
 * @param {boolean} isDismissable - 닫기 가능 여부
 */
function showModal(message, isDismissable) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("notice-modal");

  if (!modalOverlay || !modal) {
    console.error("모달 요소를 찾을 수 없습니다.");
    alert(message);
    return;
  }

  // 오버레이에 블러 효과 추가
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 999;
    display: block;
  `;

  modal.innerHTML = `
    <div class="modal-content">
      <h3>${message}</h3>
      ${
        isDismissable
          ? `<button id="dismiss-modal">닫기</button>`
          : `<button id="close-modal">닫기</button>`
      }
    </div>
  `;

  modal.style.display = "block";

  const closeButton = document.getElementById(
    isDismissable ? "dismiss-modal" : "close-modal"
  );

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      if (typeof window.ModalCore?.closeModal === "function") {
        window.ModalCore.closeModal();
      }
    });
  }
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.NoticeModule = {
  showNoticeModal,
  closeNoticeModal,
  showModal,
};