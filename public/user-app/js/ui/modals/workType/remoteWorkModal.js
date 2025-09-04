// remoteWorkModal.js
// 재택 상세내용 모달 관리 (2025년 8월 14일 23:58 생성됨)
// 재택근무 시 상세내용 입력 모달

/**
 * 재택 상세내용 입력 모달 (2025년 8월 14일 23:58 생성됨)
 * @param {string} targetTime - 대상 시간
 * @param {string} recordType - 기록 유형 ('start', 'end', 'gps')
 * @param {string} recordDate - 기록 날짜
 * @param {boolean} isEditMode - 편집 모드 여부 (기본값: false)
 */
function showRemoteWorkDetailModal(targetTime, recordType, recordDate, isEditMode = false) {
  console.log("🏠 재택 상세내용 모달 표시:", { targetTime, recordType, recordDate, isEditMode });
  
  const modal = document.getElementById("attendance-modal");

  if (!modal) {
    console.error("attendance-modal 요소를 찾을 수 없습니다.");
    return;
  }

  // 블러 오버레이 생성 또는 재사용
  let blurOverlay = window.ModalCore?.createBlurOverlay?.() || document.getElementById("modal-blur-overlay");
  if (!blurOverlay) {
    blurOverlay = document.createElement("div");
    blurOverlay.id = "modal-blur-overlay";
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
    document.body.appendChild(blurOverlay);
  }

  // recordType에 따른 시간 라벨 설정 (2025년 8월 14일 23:58 생성됨)
  let timeLabel = "시간";
  if (recordType === "start") {
    timeLabel = "출근시간";
  } else if (recordType === "end") {
    timeLabel = "퇴근시간";
  } else if (recordType === "gps") {
    timeLabel = "근무시간";
  }

  // 버튼 텍스트 설정 (2025년 8월 14일 23:58 생성됨)
  const buttonText = isEditMode ? "수정" : "저장";
  const titleText = isEditMode ? "재택근무 상세내용 수정" : "재택근무 상세내용";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>🏠 ${titleText}</h3>
      <p style="font-size: 14px; color: #666; margin: 10px 0;">
        ${timeLabel}: ${targetTime}
      </p>
      <p style="font-size: 14px; color: #FF9800; margin: 10px 0; font-weight: bold;">
        재택근무로 설정되었습니다.
      </p>
      <div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #FF9800;">
        <p style="margin: 0; font-size: 13px; color: #e65100;">
          ℹ️ 재택근무 시 근무시간이 5시간 이상인 경우<br> 자동으로 5시간으로 제한됩니다.
        </p>
      </div>
      <div style="width: 90%; margin: 20px 0; display: block;">
        <label style="display: block; width: 100%; margin-bottom: 8px; font-size: 14px; font-weight: bold;">재택근무 내용</label>
        <textarea id="remote-work-detail" style="width: 100%; height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;" placeholder="재택근무 중 수행한 업무를 입력하세요..."></textarea>
      </div>
      <div style="display: flex; width: 100%; gap: 8px; padding: 0 5px;">
        <button id="confirm-remote-work" style="flex: 1; padding: 15px 8px; background-color: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; min-width: 0; white-space: nowrap;">
          ${buttonText}
        </button>
        <button id="skip-remote-work" style="flex: 1; padding: 15px 8px; background-color: #888; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 0; white-space: nowrap;">
          ${isEditMode ? "취소" : "건너뛰기"}
        </button>
      </div>
    </div>
  `;
  modal.style.display = "block";
  modal.style.zIndex = "999";

  const detailTextarea = document.getElementById("remote-work-detail");
  const confirmBtn = document.getElementById("confirm-remote-work");
  const skipBtn = document.getElementById("skip-remote-work");

  // 편집 모드인 경우 기존 내용 불러오기 (2025년 8월 14일 23:58 생성됨)
  if (isEditMode && typeof window.ModalUtils?.loadExistingMemoDetails === "function") {
    window.ModalUtils.loadExistingMemoDetails(targetTime, recordType, recordDate, detailTextarea);
  }

  // 저장/수정 버튼 - 상세내용 저장/수정 (2025년 8월 14일 23:58 생성됨)
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const details = detailTextarea.value.trim() || "";
      
      if (isEditMode) {
        // 편집 모드: details만 업데이트
        if (typeof window.ModalUtils?.updateMemoDetails === "function") {
          await window.ModalUtils.updateMemoDetails(targetTime, recordType, recordDate, details);
        }
      } else {
        // 저장 모드: 전체 memo 저장 또는 details만 업데이트
        if (recordType === "gps") {
          if (typeof window.ModalUtils?.saveWorkTypeToMemo === "function") {
            await window.ModalUtils.saveWorkTypeToMemo(targetTime, recordType, recordDate, "재택", details);
          }
        } else {
          if (typeof window.ModalUtils?.updateMemoDetails === "function") {
            await window.ModalUtils.updateMemoDetails(targetTime, recordType, recordDate, details);
          }
        }
      }

      modal.style.display = "none";
      blurOverlay.style.display = "none";

      if (typeof window.NoticeModule?.showNoticeModal === "function") {
        const message = isEditMode ? "재택근무 상세내용이 수정되었습니다." : "재택근무 상세내용이 저장되었습니다.";
        window.NoticeModule.showNoticeModal(message);
        setTimeout(() => {
          if (typeof window.ModalCore?.closeModal === "function") {
            window.ModalCore.closeModal();
          }
        }, 1000);
      }
    });
  }

  // 건너뛰기/취소 버튼 (2025년 8월 14일 23:58 생성됨)
  if (skipBtn) {
    skipBtn.addEventListener("click", async () => {
      if (isEditMode) {
        // 편집 모드: 그냥 모달 닫기
        modal.style.display = "none";
        blurOverlay.style.display = "none";
      } else {
        // 저장 모드: 빈 상세내용으로 저장
        if (recordType === "gps") {
          if (typeof window.ModalUtils?.saveWorkTypeToMemo === "function") {
            await window.ModalUtils.saveWorkTypeToMemo(targetTime, recordType, recordDate, "재택", "");
          }
        } else {
          if (typeof window.ModalUtils?.updateMemoDetails === "function") {
            await window.ModalUtils.updateMemoDetails(targetTime, recordType, recordDate, "");
          }
        }
        modal.style.display = "none";
        blurOverlay.style.display = "none";
      }
    });
  }
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.RemoteWorkModule = {
  showRemoteWorkDetailModal,
};