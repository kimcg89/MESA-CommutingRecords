// script.js
// Firebase 설정 완료 대기
let db, auth;

document.addEventListener("firebaseReady", (event) => {
  db = event.detail.db;
  auth = event.detail.auth;
});

// 페이지 로드 시 초기화 (2025년 8월 5일 17:30 수정됨)
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: DOM이 초기화되었습니다.");

  // 초기 로드 시 오늘 날짜로 표시
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  // 전역 selectedDate 초기화 (다른 파일에서 사용)
  if (!window.selectedDate) {
    window.selectedDate = todayFormatted;
    console.log("📅 초기 selectedDate 설정:", window.selectedDate);
  }

  // 페이지 로드 시 히스토리 강제 새로고침 보장 (2025년 8월 5일 17:30 추가됨)
  window.addEventListener("load", () => {
    console.log("🔄 페이지 완전 로드 완료 - 히스토리 새로고침 시도");
    // Firebase 준비 상태 확인 후 히스토리 로드
    if (
      typeof firebase !== "undefined" &&
      firebase.auth &&
      firebase.auth().currentUser
    ) {
      if (
        window.WorkHistoryModule &&
        typeof window.WorkHistoryModule.loadInitialHistory === "function"
      ) {
        window.WorkHistoryModule.loadInitialHistory();
      } else {
        // work-history.js가 아직 로드되지 않은 경우 재시도
        setTimeout(() => {
          if (
            window.WorkHistoryModule &&
            typeof window.WorkHistoryModule.loadInitialHistory === "function"
          ) {
            window.WorkHistoryModule.loadInitialHistory();
          }
        }, 1000);
      }
    }
  });

  // 모달 오버레이 클릭 시 닫기 이벤트 (modal.js의 함수 사용)
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay && typeof closeModal === "function") {
    modalOverlay.addEventListener("click", closeModal);
  } else if (
    modalOverlay &&
    window.ModalModule &&
    typeof window.ModalModule.closeModal === "function"
  ) {
    modalOverlay.addEventListener("click", window.ModalModule.closeModal);
  }

  // 휴가 취소 버튼 이벤트 (modal.js의 함수 사용)
  const cancelVacationBtn = document.getElementById("cancel-vacation");
  if (cancelVacationBtn && typeof closeModal === "function") {
    cancelVacationBtn.addEventListener("click", closeModal);
  } else if (
    cancelVacationBtn &&
    window.ModalModule &&
    typeof window.ModalModule.closeModal === "function"
  ) {
    cancelVacationBtn.addEventListener("click", window.ModalModule.closeModal);
  }
});

// 로그아웃 버튼 이벤트 (선택 사항 - 필요시 주석 해제)
// document.getElementById("logout-button").addEventListener("click", async () => {
//   try {
//     await auth.signOut();
//     console.log("로그아웃 성공");
//     // UI 업데이트는 auth.onAuthStateChanged에서 처리됨
//   } catch (error) {
//     console.error("로그아웃 실패:", error.message);
//   }
// });

// 전역 함수들 (다른 파일에서 참조할 수 있도록)
window.ScriptModule = {
  // 필요한 경우 여기에 전역 함수들 추가
};

// 개발 관련 주석들
// TODO: 배포 시 console.log() 주석 처리 하기
// TODO: 작업 List
//   - 주간 캘린더 오류 수정
//   - 보상 휴가 날짜 선택 기능 추가
// TODO: 미작업 List
//   - GPS에 위치 기능 적용
