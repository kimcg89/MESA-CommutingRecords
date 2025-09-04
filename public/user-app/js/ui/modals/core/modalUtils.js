// modalUtils.js
// 모달 유틸리티 함수들 (2025년 8월 14일 23:58 생성됨)
// 로딩 모달, 공통 UI 업데이트 등 유틸리티 기능

/**
 * 로딩 블러 효과 표시 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} message - 로딩 메시지 (기본값: '처리 중...')
 */
function showLoadingBlur(message = "처리 중...") {
  // 기존 로딩 블러가 있으면 제거
  hideLoadingBlur();

  // 블러 오버레이 생성
  const blurOverlay = document.createElement("div");
  blurOverlay.id = "loading-blur-overlay";
  blurOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  // 로딩 컨테이너 생성
  const loadingContainer = document.createElement("div");
  loadingContainer.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    text-align: center;
    min-width: 250px;
  `;

  // 로딩 스피너 생성
  const spinner = document.createElement("div");
  spinner.style.cssText = `
    width: 50px;
    height: 50px;
    margin: 0 auto 15px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #5b7cd1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  `;

  // 메시지 텍스트
  const messageText = document.createElement("p");
  messageText.id = "loading-blur-message";
  messageText.style.cssText = `
    margin: 0;
    font-size: 16px;
    color: #333;
    font-weight: 500;
  `;
  messageText.textContent = message;

  // CSS 애니메이션 추가
  if (!document.getElementById("loading-blur-styles")) {
    const style = document.createElement("style");
    style.id = "loading-blur-styles";
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  loadingContainer.appendChild(spinner);
  loadingContainer.appendChild(messageText);
  blurOverlay.appendChild(loadingContainer);
  document.body.appendChild(blurOverlay);

  // 스크롤 방지
  document.body.style.overflow = "hidden";
}

/**
 * 로딩 메시지 업데이트 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} message - 새로운 로딩 메시지
 */
function updateLoadingMessage(message) {
  const messageElement = document.getElementById("loading-blur-message");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

/**
 * 로딩 블러 효과 숨기기 함수 (2025년 8월 14일 23:58 생성됨)
 */
function hideLoadingBlur() {
  const blurOverlay = document.getElementById("loading-blur-overlay");
  if (blurOverlay) {
    blurOverlay.remove();
    document.body.style.overflow = "";
  }
}

/**
 * 기존 로딩 모달 숨기기 (2025년 8월 14일 23:58 생성됨)
 * GPS 로딩 등 기존 로딩 모달 처리
 */
function hideLoading() {
  const overlay = document.getElementById("gps-loading-overlay");
  const modal = document.getElementById("gps-loading-modal");

  if (overlay && modal) {
    overlay.style.display = "none";
    modal.style.display = "none";
  }
}

/**
 * History 아이템의 근무 유형 표시 업데이트 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} targetTime - 대상 시간
 * @param {string} workType - 근무 유형 ('내근', '외근', '재택')
 */
function updateHistoryItemWorkType(targetTime, workType) {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  const historyItems = historyList.querySelectorAll(".historyRecord");
  historyItems.forEach((item) => {
    const timeElement = item.querySelector(".historyTime");
    if (timeElement && timeElement.textContent === targetTime) {
      const gpsElement = item.querySelector(".historyGps");
      if (gpsElement) {
        // 기존 근무 유형 표시가 있으면 제거
        const existingType = gpsElement.querySelector("span");
        if (existingType) {
          existingType.remove();
        }

        // 새로운 근무 유형 표시 추가
        if (workType) {
          let typeColor = "#666";
          if (workType === "내근") {
            typeColor = "#4CAF50";
          } else if (workType === "외근") {
            typeColor = "#2196F3";
          } else if (workType === "재택") {
            typeColor = "#FF9800";
          }

          const typeSpan = document.createElement("span");
          typeSpan.style.cssText = `color: ${typeColor}; font-weight: bold; margin-left: 10px;`;
          typeSpan.textContent = `[${workType}]`;
          gpsElement.appendChild(typeSpan);
        }
      }
    }
  });
}

/**
 * 선택한 근무구분을 Firestore에 저장하는 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} targetTime - 대상 시간
 * @param {string} recordType - 기록 유형 ('start', 'end', 'gps')
 * @param {string} recordDate - 기록 날짜
 * @param {string} workType - 근무 유형
 * @param {string} details - 상세 내용 (기본값: '')
 */
async function saveWorkTypeToMemo(
  targetTime,
  recordType,
  recordDate,
  workType,
  details = ""
) {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("로그인이 필요합니다.");
    return;
  }

  // recordDate가 없으면 오늘 날짜 사용
  if (!recordDate) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    recordDate = kstDate.toISOString().split("T")[0];
  }

  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    if (doc.exists) {
      const recordData = doc.data();
      const updates = {};

      // recordType에 따라 적절한 배열 업데이트
      const arrayKey =
        recordType === "start" ? "start" : recordType === "end" ? "end" : "gps";

      if (Array.isArray(recordData[arrayKey])) {
        updates[arrayKey] = recordData[arrayKey].map((item) => {
          if (item.time === targetTime) {
            return {
              ...item,
              memo: {
                project: item.memo?.project || "",
                work: workType,
                details: details,
              },
            };
          }
          return item;
        });

        await recordRef.update(updates);
        console.log(`✅ ${workType} 근무구분 저장 완료 - 상세내용: ${details}`);

        // UI 업데이트 - historyList에서 해당 시간의 항목 찾아서 근무 유형 표시 추가
        updateHistoryItemWorkType(targetTime, workType);
      }
    }
  } catch (error) {
    console.error("근무구분 저장 중 오류:", error);
    if (typeof window.NoticeModule?.showNoticeModal === "function") {
      window.NoticeModule.showNoticeModal("근무구분 저장 중 오류가 발생했습니다.");
    }
  }
}

/**
 * memo의 details만 업데이트하는 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} targetTime - 대상 시간
 * @param {string} recordType - 기록 유형
 * @param {string} recordDate - 기록 날짜  
 * @param {string} details - 상세 내용
 */
async function updateMemoDetails(targetTime, recordType, recordDate, details) {
  console.log("📝 updateMemoDetails 시작:", { targetTime, recordType, recordDate, details });
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("로그인이 필요합니다.");
    return;
  }

  if (!recordDate) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    recordDate = kstDate.toISOString().split("T")[0];
  }

  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    
    if (doc.exists) {
      const recordData = doc.data();
      const updates = {};
      let updatedWorkType = null;
      let foundTarget = false;

      const arrayKey = recordType === "start" ? "start" : recordType === "end" ? "end" : "gps";

      if (Array.isArray(recordData[arrayKey])) {
        updates[arrayKey] = recordData[arrayKey].map((item) => {
          if (item.time === targetTime) {
            foundTarget = true;
            updatedWorkType = item.memo?.work || "";
            
            return {
              ...item,
              memo: {
                ...item.memo,
                details: details,
              },
            };
          }
          return item;
        });

        if (foundTarget) {
          await recordRef.update(updates);
          console.log(`✅ Firestore update completed`);
          
          // UI 업데이트
          if (updatedWorkType) {
            updateHistoryItemWorkType(targetTime, updatedWorkType);
          }
        } else {
          console.error("❌ Target time not found in array");
        }
      }
    }
  } catch (error) {
    console.error("🚨 Error in updateMemoDetails:", error);
    if (typeof window.NoticeModule?.showNoticeModal === "function") {
      window.NoticeModule.showNoticeModal("상세내용 저장 중 오류가 발생했습니다.");
    }
  }
}

/**
 * 기존 memo details 불러오기 함수 (2025년 8월 14일 23:58 생성됨)
 * @param {string} targetTime - 대상 시간
 * @param {string} recordType - 기록 유형
 * @param {string} recordDate - 기록 날짜
 * @param {HTMLTextAreaElement} textareaElement - 텍스트 영역 요소
 */
async function loadExistingMemoDetails(targetTime, recordType, recordDate, textareaElement) {
  const user = firebase.auth().currentUser;
  if (!user || !textareaElement) return;

  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    if (doc.exists) {
      const recordData = doc.data();
      const arrayKey = recordType === "start" ? "start" : recordType === "end" ? "end" : "gps";

      if (Array.isArray(recordData[arrayKey])) {
        const targetItem = recordData[arrayKey].find(item => item.time === targetTime);
        if (targetItem && targetItem.memo && targetItem.memo.details) {
          textareaElement.value = targetItem.memo.details;
          console.log("📄 기존 details 불러오기 완료:", targetItem.memo.details);
        }
      }
    }
  } catch (error) {
    console.error("기존 memo details 불러오기 중 오류:", error);
  }
}

// 다른 모듈에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 23:58 생성됨)
window.ModalUtils = {
  showLoadingBlur,
  updateLoadingMessage,
  hideLoadingBlur,
  hideLoading,
  updateHistoryItemWorkType,
  saveWorkTypeToMemo,
  updateMemoDetails,
  loadExistingMemoDetails,
};