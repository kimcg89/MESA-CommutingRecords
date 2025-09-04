// vacation-core.js  
// 핵심 휴가 신청 로직 (2025년 8월 14일 생성됨)

// 전역 변수 (window 객체 사용으로 중복 방지)
// selectedDate와 currentTargetTime은 window 객체를 통해 접근

// Firebase 준비 완료 후 휴가 관리 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeVacationCore();
});

// 휴가 관리 시스템 초기화 (2025년 8월 14일 생성됨)
function initializeVacationCore() {
  // 초기 로드 시 오늘 날짜로 표시
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  if (!window.selectedDate) {
    window.selectedDate = todayFormatted;
    console.log("📅 초기 selectedDate 설정:", window.selectedDate);
  }

  // 보상휴가 저장 버튼 이벤트
  const saveVacationBtn = document.getElementById("save-vacation");
  if (saveVacationBtn) {
    saveVacationBtn.addEventListener("click", saveVacation);
  }

  // 연차 저장 버튼 이벤트
  const saveAnnualVacationBtn = document.getElementById("save-annual-vacation");
  if (saveAnnualVacationBtn) {
    saveAnnualVacationBtn.addEventListener("click", saveAnnualVacation);
  }

  console.log('휴가 관리 시스템 초기화 완료');
}

// 보상휴가 저장 (2025년 8월 14일 생성됨)
async function saveVacation() {
  const vacationStart = window.VacationUtils.combineTime(
    document.getElementById("vacation-start-ampm").value,
    document.getElementById("vacation-start-hour").value,
    document.getElementById("vacation-start-minute").value
  );
  const vacationEnd = window.VacationUtils.combineTime(
    document.getElementById("vacation-end-ampm").value,
    document.getElementById("vacation-end-hour").value,
    document.getElementById("vacation-end-minute").value
  );

  // 현재 시간 기준 오늘 날짜 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  // 저장할 날짜 결정
  let formattedDate;
  if (
    window.selectedDate &&
    typeof window.selectedDate === "string" &&
    window.selectedDate.trim() !== "" &&
    window.selectedDate !== "undefined" &&
    window.selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    formattedDate = window.selectedDate;
  } else {
    formattedDate = todayFormatted;
  }

  console.log("💾 보상휴가 저장 - 대상 날짜:", formattedDate);

  // 시간 유효성 검사
  if (!vacationStart || !vacationEnd) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("시작 시간과 종료 시간을 모두 선택해주세요.");
    } else {
      alert("시작 시간과 종료 시간을 모두 선택해주세요.");
    }
    return;
  }

  // 시작 시간이 종료 시간보다 늦은지 검사
  const startTime = new Date(`2000-01-01 ${vacationStart}`);
  const endTime = new Date(`2000-01-01 ${vacationEnd}`);

  if (startTime >= endTime) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("종료 시간이 시작 시간보다 늦어야 합니다.");
    } else {
      alert("종료 시간이 시작 시간보다 늦어야 합니다.");
    }
    return;
  }

  const vacationData = {
    date: formattedDate,
    start: vacationStart,
    end: vacationEnd,
    type: "보상휴가",
  };

  // 현재 로그인된 사용자 정보 가져오기
  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("로그인이 필요합니다.");
    } else {
      alert("로그인이 필요합니다.");
    }
    return;
  }
  const userEmail = user.email;

  try {
    // Firestore에 보상휴가 데이터 저장 (하이브리드 구조)
    await window.VacationFirestore.saveVacationToFirestoreHybrid(vacationData, userEmail);

    // historyList에 보상 휴가 데이터 추가
    const currentViewingDate = window.selectedDate || todayFormatted;
    if (formattedDate === currentViewingDate) {
      const historyContainer = document.getElementById("historyList");
      if (typeof appendHistoryItem === 'function') {
        appendHistoryItem(
          historyContainer,
          "보상휴가",
          `${vacationData.start} ~ ${vacationData.end}`
        );
      }
    }

    if (typeof showNoticeModal === 'function') {
      showNoticeModal(`보상휴가 신청이 완료되었습니다.\n신청일: ${formattedDate}`);
    } else {
      alert(`보상휴가 신청이 완료되었습니다.\n신청일: ${formattedDate}`);
    }

    // 모달 닫기
    window.VacationUI.closeModal();

    // UI 업데이트
    if (typeof updateWeekDates === 'function') updateWeekDates();
    if (typeof loadWeeklyData === 'function') loadWeeklyData();

    // 보상휴가를 신청한 날짜의 historyList 업데이트
    if (typeof updateHistoryList === 'function') {
      await updateHistoryList(formattedDate);
    }
  } catch (error) {
    console.error("보상휴가 신청 중 오류 발생:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("보상휴가 신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } else {
      alert("보상휴가 신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }
}

// 연차 저장 - 하이브리드 구조 및 로그 기록 적용 (2025년 8월 14일 생성됨)
async function saveAnnualVacation() {
  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("로그인이 필요합니다.");
    } else {
      alert("로그인이 필요합니다.");
    }
    return;
  }

  const userEmail = user.email;
  const today = new Date();
  const currentYear = today.getFullYear();

  // 선택된 날짜 및 유형 가져오기
  const startMonth = parseInt(document.getElementById("start-month").value, 10);
  const startDay = parseInt(document.getElementById("start-day").value, 10);
  const startType = document.getElementById("start-type").value;

  const endMonth = parseInt(document.getElementById("end-month").value, 10);
  const endDay = parseInt(document.getElementById("end-day").value, 10);
  const endType = document.getElementById("end-type").value;

  const startDate = new Date(currentYear, startMonth - 1, startDay);
  const endDate = new Date(currentYear, endMonth - 1, endDay);

  if (isNaN(startMonth) || isNaN(startDay) || isNaN(endMonth) || isNaN(endDay)) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("올바른 날짜를 입력하세요.");
    } else {
      alert("올바른 날짜를 입력하세요.");
    }
    return;
  }

  if (startDate > endDate) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("시작일이 종료일보다 늦을 수 없습니다.");
    } else {
      alert("시작일이 종료일보다 늦을 수 없습니다.");
    }
    return;
  }

  const vacationRecords = [];
  let currentDate = new Date(startDate);
  let leaveDaysToDeduct = 0;

  // 공휴일 확인 함수 (isHoliday는 전역 함수라고 가정)
  const checkHoliday = typeof isHoliday === 'function' ? isHoliday : () => false;

  while (currentDate <= endDate) {
    const dateString = `${currentYear}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    // 공휴일 및 주말 제외
    if (![0, 6].includes(currentDate.getDay()) && !checkHoliday(dateString)) {
      let vacationStart, vacationEnd, vacationType;
      let deductionAmount = 0;

      if (currentDate.getTime() === startDate.getTime()) {
        vacationStart = window.VacationUtils.getVacationStartTime(startType);
        vacationEnd = window.VacationUtils.getVacationEndTime(startType);
        vacationType = window.VacationUtils.getVacationType(startType);
        deductionAmount = startType === "full" ? 1 : 0.5;
      } else if (currentDate.getTime() === endDate.getTime()) {
        vacationStart = window.VacationUtils.getVacationStartTime(endType);
        vacationEnd = window.VacationUtils.getVacationEndTime(endType);
        vacationType = window.VacationUtils.getVacationType(endType);
        deductionAmount = endType === "full" ? 1 : 0.5;
      } else {
        vacationStart = "09:30";
        vacationEnd = "18:00";
        vacationType = "종일연차";
        deductionAmount = 1;
      }
      leaveDaysToDeduct += deductionAmount;

      vacationRecords.push({
        date: dateString,
        start: vacationStart,
        end: vacationEnd,
        type: vacationType,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  try {
    // Firestore에 저장 (하이브리드 구조)
    await window.VacationFirestore.saveAnnualVacationToFirestore(vacationRecords, userEmail, leaveDaysToDeduct);

    if (typeof showNoticeModal === 'function') {
      showNoticeModal("연차 신청이 완료되었습니다.");
    } else {
      alert("연차 신청이 완료되었습니다.");
    }

    // UI 업데이트
    if (typeof updateLeaveBalances === 'function') {
      await updateLeaveBalances(userEmail);
    }
    if (typeof updateWeekDates === 'function') updateWeekDates();
    if (typeof loadWeeklyData === 'function') loadWeeklyData();

    // historyList 갱신 
    const startDateFormat = `${currentYear}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
    if (typeof updateHistoryList === 'function') {
      await updateHistoryList(startDateFormat);
    }

    // 모달 닫기
    window.VacationUI.closeAnnualModal();

  } catch (error) {
    console.error("연차 신청 중 오류 발생:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("연차 신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } else {
      alert("연차 신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }
}

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.VacationCore = {
  saveVacation,
  saveAnnualVacation,
  initializeVacationCore,
};