// workTypeModal.js
// 근무구분 선택 모달 관리 (2025년 8월 14일 23:58 생성됨)
// 내근/외근/재택 선택 모달

/**
 * 근무구분 선택 모달 표시 함수 (2025년 8월 14일 23:58 생성됨)
 * recordType에 따른 분기 처리 포함
 * @param {string} targetTime - 대상 시간
 * @param {string} recordType - 기록 유형 ('start', 'end', 'gps')
 * @param {string} recordDate - 기록 날짜
 */
function showWorkTypeSelectionModal(targetTime, recordType, recordDate) {
  console.log("🎯 근무구분 선택 모달 표시:", {
    targetTime,
    recordType,
    recordDate,
  });

  const modal = document.getElementById("attendance-modal");

  if (!modal) {
    console.error("attendance-modal 요소를 찾을 수 없습니다.");
    return;
  }

  // recordType에 따른 제목 설정
  let timeLabel = "";
  if (recordType === "start") {
    timeLabel = "출근 시간";
  } else if (recordType === "end") {
    timeLabel = "퇴근 시간";
  } else if (recordType === "gps") {
    timeLabel = "근무 시간";
  } else {
    timeLabel = "시간";
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

  modal.innerHTML = `
    <div class="modal-content">
      <h3>근무 구분을 선택해주세요</h3>
      <p style="font-size: 14px; color: #666; margin: 10px 0;">
        ${timeLabel}: ${targetTime}
      </p>
      <p style="font-size: 14px; color: #e91e63; margin: 15px 0; font-weight: bold; background: #fce4ec; padding: 10px; border-radius: 5px;">
        ⚠️ 사무실 외부에서 근무 중입니다.<br>
        근무구분을 반드시 선택해야 합니다.
      </p>
      <div class="work-type-buttons" style="display: flex; gap: 20px; margin: 25px 0; flex-direction: row; justify-content: center; padding: 0 20px;">
        <button id="select-remote" class="work-type-btn" data-work-type="재택" style="
          flex: 1;
          max-width: 180px;
          padding: 30px 20px; 
          background-color: #E8F4F8; 
          color: #333; 
          border: none; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          font-size: 16px; 
          font-weight: 600;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          text-align: center;
          line-height: 1.3;
        ">
          <span style="font-size: 32px; margin-bottom: 10px;">🏠</span>
          <span>재택</span>
        </button>
        <button id="select-outside" class="work-type-btn" data-work-type="외근" style="
          flex: 1;
          max-width: 180px;
          padding: 30px 20px; 
          background-color: #E8F4F8; 
          color: #333; 
          border: none; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          font-size: 16px; 
          font-weight: 600;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          text-align: center;
          line-height: 1.3;
        ">
          <span style="font-size: 32px; margin-bottom: 10px;">🚗</span>
          <span>외근</span>
        </button>
      </div>
      <div style="display: flex; width:100%; justify-content: center;">
        <button id="confirm-work-type" disabled style="padding: 15px 40px; background-color: #ccc; color: white; border: none; border-radius: 5px; cursor: not-allowed; font-size: 16px; font-weight: bold;">
          확인
        </button>
      </div>
      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
        근무구분을 선택한 후 확인 버튼을 눌러주세요
      </p>
    </div>
  `;
  modal.style.display = "block";
  modal.style.zIndex = "999";

  let selectedWorkType = null;

  // 버튼 선택 이벤트들 (2025년 8월 14일 23:58 생성됨 - 호버 및 활성화 효과 개선)
  const workTypeButtons = modal.querySelectorAll(".work-type-btn");
  const confirmBtn = document.getElementById("confirm-work-type");

  workTypeButtons.forEach((button) => {
    // 호버 효과 추가
    button.addEventListener("mouseenter", () => {
      if (selectedWorkType !== button.dataset.workType) {
        button.style.transform = "translateY(-3px)";
        button.style.boxShadow = "0 6px 15px rgba(0,0,0,0.15)";
      }
    });

    button.addEventListener("mouseleave", () => {
      if (selectedWorkType !== button.dataset.workType) {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 3px 10px rgba(0,0,0,0.1)";
      }
    });

    button.addEventListener("click", () => {
      selectedWorkType = button.dataset.workType;

      // 모든 버튼 비활성화 스타일
      workTypeButtons.forEach((btn) => {
        btn.style.backgroundColor = "#E8F4F8";
        btn.style.color = "#333";
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 3px 10px rgba(0,0,0,0.1)";
        btn.style.border = "none";
      });

      // 선택된 버튼 활성화 스타일
      let activeColor = "#FF9800"; // 재택
      if (selectedWorkType === "외근") activeColor = "#2196F3";

      button.style.backgroundColor = activeColor;
      button.style.color = "white";
      button.style.transform = "translateY(-5px)";
      button.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";

      // 확인 버튼 활성화
      confirmBtn.disabled = false;
      confirmBtn.style.backgroundColor = "#1a73e8";
      confirmBtn.style.cursor = "pointer";

      console.log("🎯 근무구분 선택:", selectedWorkType);
    });
  });

  // 확인 버튼 이벤트 (2025년 8월 14일 23:58 생성됨)
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (!selectedWorkType) {
        if (typeof window.NoticeModule?.showNoticeModal === "function") {
          window.NoticeModule.showNoticeModal("근무구분을 선택해주세요.");
        } else {
          alert("근무구분을 선택해주세요.");
        }
        return;
      }

      console.log("✅ 근무구분 선택 완료:", selectedWorkType);

      // recordType에 따른 분기 처리 (2025년 8월 14일 23:58 생성됨)
      if (recordType === "gps") {
        // GPS 기록은 saveWorkTypeToMemo 직접 사용
        if (typeof window.ModalUtils?.saveWorkTypeToMemo === "function") {
          window.ModalUtils.saveWorkTypeToMemo(targetTime, recordType, recordDate, selectedWorkType, "");
        }
        
        // 상세내용 모달 표시
        setTimeout(() => {
          if (selectedWorkType === "내근" && typeof window.OfficeWorkModule?.showOfficeWorkDetailModal === "function") {
            window.OfficeWorkModule.showOfficeWorkDetailModal(targetTime, recordType, recordDate);
          } else if (selectedWorkType === "외근" && typeof window.FieldWorkModule?.showFieldWorkDetailModal === "function") {
            window.FieldWorkModule.showFieldWorkDetailModal(targetTime, recordType, recordDate);
          } else if (selectedWorkType === "재택" && typeof window.RemoteWorkModule?.showRemoteWorkDetailModal === "function") {
            window.RemoteWorkModule.showRemoteWorkDetailModal(targetTime, recordType, recordDate);
          }
        }, 500);
      } else {
        // 출근/퇴근인 경우 기존 AttendanceCore 사용
        if (typeof window.AttendanceCore?.onWorkTypeSelected === "function") {
          window.AttendanceCore.onWorkTypeSelected(selectedWorkType);
        } else {
          console.error("⚠️ AttendanceCore.onWorkTypeSelected 함수를 찾을 수 없습니다.");
          
          // 폴백: 기존 방식으로 저장 (임시)
          console.log("🔄 폴백: 기존 방식으로 저장");
          if (typeof window.ModalUtils?.saveWorkTypeToMemo === "function") {
            window.ModalUtils.saveWorkTypeToMemo(targetTime, recordType, recordDate, selectedWorkType, "");
          }
          
          if (typeof window.NoticeModule?.showNoticeModal === "function") {
            window.NoticeModule.showNoticeModal(`${selectedWorkType}으로 설정되었습니다.`);
            setTimeout(() => {
              if (typeof window.ModalCore?.closeModal === "function") {
                window.ModalCore.closeModal();
              }
            }, 1000);
          }
        }
      }

      // 모달 닫기
      modal.style.display = "none";
      blurOverlay.style.display = "none";
    });
  }

  // 오버레이 클릭 방지 (취소 불가) (2025년 8월 14일 23:58 생성됨)
  blurOverlay.addEventListener("click", (e) => {
    if (e.target === blurOverlay) {
      // 클릭해도 모달이 닫히지 않음
      if (typeof window.NoticeModule?.showNoticeModal === "function") {
        window.NoticeModule.showNoticeModal("근무구분을 반드시 선택해야 합니다.");
      }
    }
  });
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.WorkTypeModule = {
  showWorkTypeSelectionModal,
};