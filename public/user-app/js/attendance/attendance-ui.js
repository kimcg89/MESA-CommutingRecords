// attendance-ui.js
// UI 업데이트 및 GPS 기록 관련 함수들 (2025년 8월 14일 생성됨)

// Firebase 준비 완료 후 UI 관리 기능 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeAttendanceUI();
});

// UI 관리 시스템 초기화 (2025년 8월 14일 생성됨)
function initializeAttendanceUI() {
  // 근무 기록 버튼 이벤트 리스너
  const workRecordButton = document.getElementById("workRecordBtn");
  if (workRecordButton) {
    workRecordButton.addEventListener("click", handleGpsInput);
  }
}

// 출근 버튼 상태 업데이트 (2025년 8월 14일 생성됨)
function updateStartButtonStatus(time = null) {
  const startButton = document.getElementById("startBtn");
  if (!startButton) return;

  if (time) {
    startButton.textContent = time;
    startButton.style.backgroundColor = "#0048B2";
    startButton.disabled = true;
  } else {
    startButton.textContent = "출근";
    startButton.style.backgroundColor = "";
    startButton.disabled = false;
  }
}

// 퇴근 버튼 상태 업데이트 (2025년 8월 14일 생성됨)
function updateEndButtonStatus(time = null) {
  const endButton = document.getElementById("endBtn");
  if (!endButton) return;

  if (time) {
    endButton.textContent = time;
    endButton.style.backgroundColor = "#EBEDEF";
    endButton.disabled = true;
  } else {
    endButton.textContent = "퇴근";
    endButton.style.backgroundColor = "";
    endButton.disabled = false;
  }
}

// Firestore 데이터 로드 및 출근 버튼 상태 업데이트 (2025년 8월 14일 생성됨)
async function updateStartButton() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userEmail = user.email;
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const recordDate = kstDate.toISOString().split("T")[0];
  const recordRef = db
    .collection("records")
    .doc(userEmail)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data.start && data.start.length > 0) {
        const startTime = data.start[0].time;
        updateStartButtonStatus(startTime);
      } else {
        updateStartButtonStatus();
      }
    } else {
      updateStartButtonStatus();
    }
  } catch (error) {
    console.error("Firestore 데이터 로드 중 오류 발생:", error);
  }
}

// Firestore 데이터 로드 및 퇴근 버튼 상태 업데이트 (2025년 8월 14일 생성됨)
async function updateEndButton() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userEmail = user.email;
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const recordDate = kstDate.toISOString().split("T")[0];
  const recordRef = db
    .collection("records")
    .doc(userEmail)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data.end && data.end.length > 0) {
        const endTime = data.end[data.end.length - 1].time;
        updateEndButtonStatus(endTime);
      } else {
        updateEndButtonStatus();
      }
    } else {
      updateEndButtonStatus();
    }
  } catch (error) {
    console.error("Firestore 데이터 로드 중 오류 발생:", error);
  }
}

// GPS 기록 입력 및 Firestore 업데이트 함수 (2025년 8월 14일 수정됨)
async function handleGpsInput() {
  const button = document.getElementById("workRecordBtn");
  button.disabled = true;

  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === "function") {
      showNoticeModal("로그인이 필요합니다.");
    }
    button.disabled = false;
    return;
  }

  const userId = user.email;
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const currentDate = kstDate.toISOString().split("T")[0];

  // 현재 선택된 날짜가 오늘이 아닌 경우, 오늘 날짜로 변경
  if (window.selectedDate !== currentDate) {
    console.log(`📅 날짜 변경: ${window.selectedDate} → ${currentDate}`);
    
    // 오늘 날짜로 히스토리 업데이트
    if (typeof updateHistoryList === 'function') {
      await updateHistoryList(currentDate);
    } else if (typeof window.updateHistoryList === 'function') {
      await window.updateHistoryList(currentDate);
    }
    
    // 선택된 날짜 표시 업데이트
    if (typeof updateSelectedDateDisplay === 'function') {
      updateSelectedDateDisplay(currentDate);
    }
    
    // 주간 캘린더에서 오늘 날짜 강조
    const weeklyTable = document.querySelector('.weeklyTable');
    if (weeklyTable) {
      const allDays = weeklyTable.querySelectorAll('.day');
      allDays.forEach(day => day.classList.remove('selected'));
      
      // 오늘 날짜 찾아서 선택 표시
      const today = new Date();
      allDays.forEach(day => {
        const dateSpan = day.querySelector('.date');
        if (dateSpan && parseInt(dateSpan.textContent) === today.getDate()) {
          day.classList.add('selected');
        }
      });
    }
    
    // 전역 selectedDate 업데이트
    window.selectedDate = currentDate;
  }

  // 로딩 블러 효과 표시
  if (typeof showLoadingBlur === "function") {
    showLoadingBlur("위치 정보를 가져오는 중...");
  }

  try {
    const { latitude, longitude } = await window.LocationUtils.getCurrentLocation(3, 3000);

    // 위치 정보가 없는 경우 처리 (2025년 8월 14일 추가됨)
    if (latitude === "위치 정보 사용 불가") {
      // 위치 정보 에러 모달 표시
      if (typeof window.AttendanceCore?.showLocationErrorModal === "function") {
        window.AttendanceCore.showLocationErrorModal(() => {
          // 재시도 함수: 근무이력남기기 버튼 처리 다시 실행
          handleGpsInput();
        });
      } else {
        // fallback: 일반 에러 처리
        if (typeof hideLoadingBlur === "function") {
          hideLoadingBlur();
        }
        setTimeout(() => {
          if (typeof showNoticeModal === "function") {
            showNoticeModal("위치 정보를 가져올 수 없습니다.\n\n위치 서비스를 활성화한 후 다시 시도해주세요.");
          }
        }, 100);
      }
      button.disabled = false;
      return;
    }

    // 주소 변환 중 메시지 업데이트
    if (typeof updateLoadingMessage === "function") {
      updateLoadingMessage("주소 정보를 변환하는 중...");
    }

    const gpsData = `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`;
    const timestamp = now.toLocaleTimeString();

    // GPS 좌표를 주소로 변환
    const address = await window.LocationUtils.getAddressFromCoordinates(latitude, longitude);

    // 위치 기반 근무 구분 자동 설정
    const autoWorkType = window.LocationUtils.determineWorkType(latitude, longitude);

    const gpsRecord = {
      time: timestamp,
      gps: gpsData,
      address: address,
      // 내근인 경우 memo 추가 (2025년 8월 14일 수정됨)
      ...(autoWorkType === "내근" && {
        memo: {
          project: "",
          work: "내근",
          details: "",
        },
      }),
    };

    // 데이터 저장 중 메시지 업데이트
    if (typeof updateLoadingMessage === "function") {
      updateLoadingMessage("근무 기록을 저장하는 중...");
    }

    const docRef = firebase
      .firestore()
      .collection("records")
      .doc(userId)
      .collection("dates")
      .doc(currentDate);

    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({
        gps: firebase.firestore.FieldValue.arrayUnion(gpsRecord),
      });
    } else {
      await docRef.set({
        gps: [gpsRecord],
      });
    }

    // historyList 컨테이너 가져오기 (현재 표시된 히스토리 리스트)
    const historyContainer = document.getElementById("historyList");
    
    // appendHistoryItem 호출 - 오늘 날짜의 히스토리에 추가
    if (historyContainer && typeof appendHistoryItem === "function") {
      const workType = autoWorkType === "내근" ? "내근" : null;
      appendHistoryItem(
        historyContainer,  // 오늘 날짜로 업데이트된 컨테이너 사용
        timestamp, 
        gpsData, 
        address,
        workType
      );
    }

    // 로딩 블러 숨기기
    if (typeof hideLoadingBlur === "function") {
      hideLoadingBlur();
    }

    // 성공 메시지 표시 (짧은 딜레이 후)
    setTimeout(() => {
      if (typeof showNoticeModal === "function") {
        showNoticeModal("근무 기록이 성공적으로 추가되었습니다.");
        setTimeout(() => {
          if (typeof closeNoticeModal === "function") {
            closeNoticeModal();
          } else if (typeof closeModal === "function") {
            closeModal();
          }
        }, 500);
      }
    }, 100);

    // 300미터 이내인 경우 내근 상세내용 입력 모달 표시
    if (autoWorkType === "내근") {
      setTimeout(() => {
        if (typeof showOfficeWorkDetailModal === "function") {
          showOfficeWorkDetailModal(timestamp, "gps", currentDate);
        }
      }, 800);
    }
    // 300미터 밖인 경우 근무구분 선택 모달 표시
    else if (autoWorkType === null) {
      setTimeout(() => {
        if (typeof showWorkTypeSelectionModal === "function") {
          showWorkTypeSelectionModal(timestamp, "gps", currentDate);
        }
      }, 800);
    }

    // 주간 캘린더 업데이트
    if (typeof updateWeekDates === "function") {
      updateWeekDates();
    }
    if (typeof loadWeeklyData === "function") {
      loadWeeklyData();
    }

  } catch (error) {
    console.error("오류 발생:", error);

    // 로딩 블러 숨기기
    if (typeof hideLoadingBlur === "function") {
      hideLoadingBlur();
    }

    setTimeout(() => {
      if (typeof showNoticeModal === "function") {
        showNoticeModal(error.message);
      }
    }, 100);
  } finally {
    button.disabled = false;
  }
}

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.AttendanceUI = {
  updateStartButton,
  updateEndButton,
  updateStartButtonStatus,
  updateEndButtonStatus,
  handleGpsInput,
  initializeAttendanceUI,
};