// attendanceModal.js
// 출근/퇴근 관련 모달 관리 (2025년 8월 14일 23:58 생성됨)
// 출근/퇴근 모달, 퇴근 확인 모달 등

/**
 * 출근/퇴근 모달 표시 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} message - 표시할 메시지
 * @param {boolean} isDismissable - 닫기 가능 여부
 */
function showAttendanceModal(message, isDismissable) {
  const modal = document.getElementById("attendance-modal");

  if (!modal) {
    console.error("attendance-modal 요소를 찾을 수 없습니다.");
    alert(message);
    return;
  }

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
    closeButton.addEventListener("click", closeAttendanceModal);
  }
}

/**
 * 퇴근 확인 모달 (2025년 8월 14일 23:58 생성됨)
 * @param {string} message - 확인 메시지
 * @param {Function} onConfirm - 확인 시 실행할 콜백 함수
 */
function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById("attendance-modal");

  if (!modal) {
    console.error("attendance-modal 요소를 찾을 수 없습니다.");
    if (confirm(message)) {
      onConfirm();
    }
    return;
  }

  modal.innerHTML = `
    <div class="modal-content">
      <h3>${message}</h3>
      <div class="endModalBtn">
        <button id="confirm-btn">확인</button>
        <button id="cancel-btn">취소</button>
      </div>
    </div>
  `;
  modal.style.display = "block";

  const confirmBtn = document.getElementById("confirm-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      modal.style.display = "none";
      await onConfirm(); // 퇴근 처리 실행

      // 오늘 날짜 가져오기
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayDate = kstDate.toISOString().split("T")[0];

      console.log("🔄 퇴근 후 업데이트할 날짜:", todayDate);

      // 퇴근 후 오늘 날짜의 historyList 업데이트
      if (typeof updateHistoryList === "function") {
        updateHistoryList(todayDate);
      } else if (
        window.WorkHistoryModule &&
        typeof window.WorkHistoryModule.updateHistoryList === "function"
      ) {
        window.WorkHistoryModule.updateHistoryList(todayDate);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
}

/**
 * 출근/퇴근 모달 닫기 (2025년 8월 14일 23:58 생성됨)
 */
function closeAttendanceModal() {
  const modal = document.getElementById("attendance-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.AttendanceModule = {
  showAttendanceModal,
  showConfirmModal,
  closeAttendanceModal,
};