// vacation-ui.js
// 휴가 관련 UI 관리 (모달, 시간 옵션 등) (2025년 8월 14일 생성됨)

// Firebase 준비 완료 후 휴가 UI 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeVacationUI();
});

// 휴가 UI 시스템 초기화 (2025년 8월 14일 생성됨)
function initializeVacationUI() {
  // 시간 옵션 동적 생성
  const startHourSelect = document.getElementById("vacation-start-hour");
  const endHourSelect = document.getElementById("vacation-end-hour");

  if (startHourSelect && endHourSelect) {
    for (let i = 1; i <= 12; i++) {
      const optionStart = document.createElement("option");
      const optionEnd = document.createElement("option");

      optionStart.value = i;
      optionStart.textContent = `${i}시`;

      optionEnd.value = i;
      optionEnd.textContent = `${i}시`;

      startHourSelect.appendChild(optionStart);
      endHourSelect.appendChild(optionEnd);
    }
  }

  // 보상휴가 신청 버튼 이벤트
  const vacationBtn = document.getElementById("vacationBtn");
  if (vacationBtn) {
    vacationBtn.addEventListener("click", openVacationModal);
  }

  // 연차 신청 버튼 이벤트
  const applyVacationBtn = document.getElementById("applyVacation");
  if (applyVacationBtn) {
    applyVacationBtn.addEventListener("click", openAnnualVacationModal);
  }

  // 모달 취소 버튼들
  const cancelVacationBtn = document.getElementById("cancel-vacation");
  if (cancelVacationBtn) {
    cancelVacationBtn.addEventListener("click", closeModal);
  }

  const cancelAnnualVacationBtn = document.getElementById("cancel-annual-vacation");
  if (cancelAnnualVacationBtn) {
    cancelAnnualVacationBtn.addEventListener("click", closeAnnualModal);
  }

  // 시간 옵션 업데이트
  updateTimeOptions();
  initializeAnnualVacationOptions();
}

// 보상휴가 모달 열기 (2025년 8월 14일 생성됨)
function openVacationModal() {
  document.getElementById("modal-overlay").style.display = "block";
  document.getElementById("vacation-modal").style.display = "block";

  // 현재 선택된 날짜 또는 오늘 날짜 결정
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  let targetDate;
  if (
    window.selectedDate &&
    typeof window.selectedDate === "string" &&
    window.selectedDate.trim() !== "" &&
    window.selectedDate !== "undefined" &&
    window.selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    targetDate = window.selectedDate;
  } else {
    targetDate = todayFormatted;
    window.selectedDate = todayFormatted;
  }

  console.log("🔹 보상휴가 모달 열기 - 대상 날짜:", targetDate);

  // 모달에 날짜 표시 업데이트
  const dateDisplay = document.getElementById("selected-date-display");
  if (dateDisplay) {
    if (targetDate === todayFormatted) {
      dateDisplay.innerText = `신청일: ${targetDate} (오늘)`;
    } else {
      const targetDateObj = new Date(targetDate + "T00:00:00");
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[targetDateObj.getDay()];
      dateDisplay.innerText = `신청일: ${targetDate} (${dayName})`;
    }
  }
}

// 연차 신청 모달 열기 (2025년 8월 14일 생성됨)
function openAnnualVacationModal() {
  document.getElementById("modal-overlay-annual").style.display = "block";
  document.getElementById("annual-vacation-modal").style.display = "block";
}

// 연차 신청 옵션 초기화 (2025년 8월 14일 생성됨)
function initializeAnnualVacationOptions() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // 월 선택 옵션 생성
  function populateMonths(selectId, defaultMonth) {
    const monthSelect = document.getElementById(selectId);
    if (!monthSelect) return;
    
    monthSelect.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.textContent = `${i}월`;
      if (i === defaultMonth) option.selected = true;
      monthSelect.appendChild(option);
    }
  }

  // 일 선택 옵션 생성
  function populateDays(selectId, month, defaultDay) {
    const daySelect = document.getElementById(selectId);
    if (!daySelect) return;
    
    daySelect.innerHTML = "";
    const daysInMonth = new Date(currentYear, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.textContent = `${i}일`;
      if (i === defaultDay) option.selected = true;
      daySelect.appendChild(option);
    }
  }

  // 시작일 & 종료일 기본값 설정
  populateMonths("start-month", currentMonth);
  populateDays("start-day", currentMonth, currentDay);
  populateMonths("end-month", currentMonth);
  populateDays("end-day", currentMonth, currentDay);

  // 월 변경 시 해당 월의 일 옵션 업데이트
  const startMonthSelect = document.getElementById("start-month");
  const endMonthSelect = document.getElementById("end-month");
  
  if (startMonthSelect) {
    startMonthSelect.addEventListener("change", (e) => {
      populateDays("start-day", parseInt(e.target.value, 10), 1);
    });
  }
  
  if (endMonthSelect) {
    endMonthSelect.addEventListener("change", (e) => {
      populateDays("end-day", parseInt(e.target.value, 10), 1);
    });
  }
}

// 시작 및 종료 시간 옵션 설정 함수 (2025년 8월 14일 생성됨)
function updateTimeOptions() {
  const startHourSelect = document.getElementById("vacation-start-hour");
  const endHourSelect = document.getElementById("vacation-end-hour");
  const startMinuteSelect = document.getElementById("vacation-start-minute");
  const endMinuteSelect = document.getElementById("vacation-end-minute");

  if (!startHourSelect || !endHourSelect || !startMinuteSelect || !endMinuteSelect) {
    return; // 요소가 없으면 종료
  }

  startHourSelect.innerHTML = "";
  endHourSelect.innerHTML = "";
  startMinuteSelect.innerHTML = "";
  endMinuteSelect.innerHTML = "";

  // 오전 (9~12시), 오후 (1~6시)만 선택 가능하도록 제한
  const validHours = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

  validHours.forEach((hour) => {
    let optionStart = document.createElement("option");
    optionStart.value = hour;
    optionStart.textContent = `${hour}시`;
    startHourSelect.appendChild(optionStart);

    let optionEnd = document.createElement("option");
    optionEnd.value = hour;
    optionEnd.textContent = `${hour}시`;
    endHourSelect.appendChild(optionEnd);
  });

  // 분 단위: 10분 간격 (00, 10, 20, ..., 50)
  for (let i = 0; i < 60; i += 10) {
    let optionStart = document.createElement("option");
    optionStart.value = i < 10 ? `0${i}` : i;
    optionStart.textContent = `${optionStart.value}분`;
    startMinuteSelect.appendChild(optionStart);

    let optionEnd = document.createElement("option");
    optionEnd.value = i < 10 ? `0${i}` : i;
    optionEnd.textContent = `${optionEnd.value}분`;
    endMinuteSelect.appendChild(optionEnd);
  }
}

// 모달 닫기 함수들 (2025년 8월 14일 생성됨)
function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  const vacationModal = document.getElementById("vacation-modal");
  const noticeModal = document.getElementById("notice-modal");
  
  if (modalOverlay) modalOverlay.style.display = "none";
  if (vacationModal) vacationModal.style.display = "none";
  if (noticeModal) noticeModal.style.display = "none";
}

function closeAnnualModal() {
  const modalOverlayAnnual = document.getElementById("modal-overlay-annual");
  const annualVacationModal = document.getElementById("annual-vacation-modal");
  
  if (modalOverlayAnnual) modalOverlayAnnual.style.display = "none";
  if (annualVacationModal) annualVacationModal.style.display = "none";
}

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.VacationUI = {
  openVacationModal,
  openAnnualVacationModal,
  initializeAnnualVacationOptions,
  updateTimeOptions,
  closeModal,
  closeAnnualModal,
  initializeVacationUI,
};