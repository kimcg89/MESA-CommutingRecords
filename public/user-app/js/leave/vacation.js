// vacation.js
// 휴가 신청 및 관리 기능 - 하이브리드 구조 및 변경 로그 적용 (2025년 8월 12일 수정됨)

// 전역 변수 (window 객체 사용으로 중복 방지)
// selectedDate와 currentTargetTime은 window 객체를 통해 접근

// Firebase 준비 완료 후 휴가 관리 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeVacation();
});

// 휴가 관리 시스템 초기화
function initializeVacation() {
  // 초기 로드 시 오늘 날짜로 표시
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  if (!window.selectedDate) {
    window.selectedDate = todayFormatted;
    console.log("📅 초기 selectedDate 설정:", window.selectedDate);
  }

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

  // 보상휴가 저장 버튼 이벤트
  const saveVacationBtn = document.getElementById("save-vacation");
  if (saveVacationBtn) {
    saveVacationBtn.addEventListener("click", saveVacation);
  }

  // 연차 신청 버튼 이벤트
  const applyVacationBtn = document.getElementById("applyVacation");
  if (applyVacationBtn) {
    applyVacationBtn.addEventListener("click", openAnnualVacationModal);
  }

  // 연차 저장 버튼 이벤트
  const saveAnnualVacationBtn = document.getElementById("save-annual-vacation");
  if (saveAnnualVacationBtn) {
    saveAnnualVacationBtn.addEventListener("click", saveAnnualVacation);
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

// 휴가 변경 로그 기록 함수 (신규 추가)
async function recordLeaveHistory(userEmail, logData) {
  try {
    // 날짜-시간 기반 ID 생성 (예: 2025-08-13_14-30-45-123)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // 2025-08-13
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 14-30-45
    const ms = now.getMilliseconds().toString().padStart(3, '0'); // 123
    const documentId = `${dateStr}_${timeStr}-${ms}`;
    
    const historyRef = db
      .collection("records")
      .doc(userEmail)
      .collection("leaveHistory")
      .doc(documentId);

    await historyRef.set({
      ...logData,
      timestamp: now.toISOString(), // ISO 형식 타임스탬프도 데이터에 포함
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ 휴가 변경 로그 기록 완료:", documentId, logData);
  } catch (error) {
    console.error("❌ 휴가 변경 로그 기록 실패:", error);
    // 로그 기록 실패는 메인 프로세스를 중단시키지 않음
  }
}

// 보상휴가 모달 열기
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

// 보상휴가 저장
async function saveVacation() {
  const vacationStart = combineTime(
    document.getElementById("vacation-start-ampm").value,
    document.getElementById("vacation-start-hour").value,
    document.getElementById("vacation-start-minute").value
  );
  const vacationEnd = combineTime(
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
    await saveVacationToFirestoreHybrid(vacationData, userEmail);

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
    closeModal();

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

// 휴가 데이터를 Firestore에 저장 - 하이브리드 구조 및 로그 기록
async function saveVacationToFirestoreHybrid(vacationData, userEmail) {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("로그인된 사용자가 없습니다.");
      }
      throw new Error("로그인된 사용자가 없습니다.");
    }

    // 기존 구조의 참조
    const docRef = db
      .collection("records")
      .doc(userEmail)
      .collection("dates")
      .doc(vacationData.date);

    const userDocRef = db.collection("records").doc(userEmail);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn("사용자 문서가 존재하지 않습니다. 보상휴가 차감 불가.");
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      }
      return;
    }

    // 보상휴가 사용 시간 계산
    const startSeconds = parseTime(vacationData.start);
    const endSeconds = parseTime(vacationData.end);
    let usedCompensatorySeconds = 0;

    if (
      !isNaN(startSeconds) &&
      !isNaN(endSeconds) &&
      endSeconds > startSeconds
    ) {
      usedCompensatorySeconds = endSeconds - startSeconds;
      const lunchStart = 11 * 3600 + 30 * 60;
      const lunchEnd = 13 * 3600;

      const overlapStart = Math.max(startSeconds, lunchStart);
      const overlapEnd = Math.min(endSeconds, lunchEnd);

      if (overlapStart < overlapEnd) {
        usedCompensatorySeconds -= overlapEnd - overlapStart;
      }
    }
    const usedCompensatoryHours = usedCompensatorySeconds / 3600;

    // 현재 compensatoryLeave 값 가져오기
    const currentCompensatoryLeaveStr =
      userDoc.data().compensatoryLeave || "0시간";
    let currentCompensatoryHours = 0;
    const hoursMatch = currentCompensatoryLeaveStr.match(/(\d+(\.\d+)?)\s*시간/);
    if (hoursMatch) {
      currentCompensatoryHours = parseFloat(hoursMatch[1]);
    }

    // 차감 후 새로운 값 계산
    const newCompensatoryHours =
      currentCompensatoryHours - usedCompensatoryHours;

    // 차감 후 보상휴가가 음수가 되는지 확인
    if (newCompensatoryHours < 0) {
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("보유 보상휴가가 부족합니다.");
      }
      return;
    }

    const batch = firebase.firestore().batch();

    // 1. 사용자 문서의 compensatoryLeave 필드 업데이트
    batch.update(userDocRef, {
      compensatoryLeave: `${newCompensatoryHours.toFixed(1)}시간`,
    });

    // 2. 기존 구조에 데이터 저장 (dates 컬렉션)
    const existingDailyRecordDoc = await docRef.get();
    
    if (existingDailyRecordDoc.exists) {
      const recordData = existingDailyRecordDoc.data();
      
      // duration 필드 업데이트 로직 (기존 로직 유지)
      if (recordData.end && Array.isArray(recordData.end) && recordData.end.length > 0 &&
          recordData.start && Array.isArray(recordData.start) && recordData.start.length > 0) {
        
        const currentEndArray = [...recordData.end];
        const currentStartArray = [...recordData.start];
        const lastEndRecordIndex = currentEndArray.length - 1;
        const lastEndRecord = currentEndArray[lastEndRecordIndex];
        const lastStartRecord = currentStartArray[currentStartArray.length - 1];

        if (lastEndRecord.duration !== undefined && lastStartRecord.time !== undefined && lastEndRecord.time !== undefined) {
          const workStartTimeSeconds = parseTime(lastStartRecord.time);
          const workEndTimeSeconds = parseTime(lastEndRecord.time);
          const vacationStartSeconds = parseTime(vacationData.start);
          const vacationEndSeconds = parseTime(vacationData.end);

          const overlapStart = Math.max(workStartTimeSeconds, vacationStartSeconds);
          const overlapEnd = Math.min(workEndTimeSeconds, vacationEndSeconds);

          let overlapSeconds = 0;
          if (overlapStart < overlapEnd) {
            overlapSeconds = overlapEnd - overlapStart;
          }

          if (overlapSeconds > 0) {
            const overlapMinutes = overlapSeconds / 60;
            let currentDurationMinutes = parseDurationStringToMinutes(String(lastEndRecord.duration));
            
            const updatedDurationMinutes = currentDurationMinutes - overlapMinutes;
            const updatedDurationString = formatMinutesToDurationString(updatedDurationMinutes);

            const updatedLastEndRecord = {
              ...lastEndRecord,
              duration: updatedDurationString,
            };

            currentEndArray[lastEndRecordIndex] = updatedLastEndRecord;
            batch.update(docRef, { end: currentEndArray });
          }
        }
      }
      
      // vacation 배열에 추가
      batch.update(docRef, {
        vacation: firebase.firestore.FieldValue.arrayUnion({
          start: vacationData.start,
          end: vacationData.end,
          type: vacationData.type,
        }),
      });
    } else {
      batch.set(docRef, {
        vacation: [
          {
            start: vacationData.start,
            end: vacationData.end,
            type: vacationData.type,
          },
        ],
      });
    }

    // 3. 하이브리드 구조 - vacations 서브컬렉션에 저장
    const vacationRef = db
      .collection("records")
      .doc(userEmail)
      .collection("vacations")
      .doc(vacationData.date);
    
    const existingVacationDoc = await vacationRef.get();
    
    // timestamp는 배열 밖에서 관리
    const timestamp = new Date().toISOString();
    
    if (existingVacationDoc.exists) {
      // 이미 해당 날짜의 휴가 문서가 있으면 배열에 추가
      batch.update(vacationRef, {
        vacation: firebase.firestore.FieldValue.arrayUnion({
          start: vacationData.start,
          end: vacationData.end,
          type: vacationData.type,
          hours: usedCompensatoryHours.toFixed(1),
          // 잔여 휴가량 변경 정보 추가
          leaveBalance: {
            before: `${currentCompensatoryHours.toFixed(1)}시간`,
            after: `${newCompensatoryHours.toFixed(1)}시간`,
            used: `${usedCompensatoryHours.toFixed(1)}시간`
          },
          createdAt: timestamp
        }),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 새로운 휴가 문서 생성
      batch.set(vacationRef, {
        vacation: [{
          start: vacationData.start,
          end: vacationData.end,
          type: vacationData.type,
          hours: usedCompensatoryHours.toFixed(1),
          // 잔여 휴가량 변경 정보 추가
          leaveBalance: {
            before: `${currentCompensatoryHours.toFixed(1)}시간`,
            after: `${newCompensatoryHours.toFixed(1)}시간`,
            used: `${usedCompensatoryHours.toFixed(1)}시간`
          },
          createdAt: timestamp
        }],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // 4. 보상휴가 변경 로그 기록
    const logData = {
      type: "compensatory",
      before: `${currentCompensatoryHours.toFixed(1)}시간`,
      after: `${newCompensatoryHours.toFixed(1)}시간`,
      change: `-${usedCompensatoryHours.toFixed(1)}시간`,
      reason: "보상휴가 사용",
      details: {
        vacationDate: vacationData.date,
        vacationStart: `${vacationData.date} ${vacationData.start}`,
        vacationEnd: `${vacationData.date} ${vacationData.end}`,
        usedHours: `${usedCompensatoryHours.toFixed(1)}시간`,
        requestDate: new Date().toISOString().split("T")[0]
      }
    };

    await batch.commit();
    
    // 로그 기록 (batch 외부에서 실행)
    await recordLeaveHistory(userEmail, logData);
    
    console.log("✅ 보상휴가 데이터 하이브리드 구조로 저장 성공:", vacationData);
  } catch (error) {
    console.error("보상휴가 데이터를 Firestore에 저장하거나 차감하는 중 오류 발생:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("보상휴가 신청 처리 중 오류가 발생했습니다.");
    }
    throw error;
  }

  // UI 업데이트
  if (typeof updateWeekDates === 'function') updateWeekDates();
  if (typeof loadWeeklyData === 'function') loadWeeklyData();
  if (typeof updateLeaveBalances === 'function') {
    await updateLeaveBalances(userEmail);
  }
}

// 연차 신청 모달 열기
function openAnnualVacationModal() {
  document.getElementById("modal-overlay-annual").style.display = "block";
  document.getElementById("annual-vacation-modal").style.display = "block";
}

// 연차 신청 옵션 초기화
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

// 연차 저장 - 하이브리드 구조 및 로그 기록 적용
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
        vacationStart = getVacationStartTime(startType);
        vacationEnd = getVacationEndTime(startType);
        vacationType = getVacationType(startType);
        deductionAmount = startType === "full" ? 1 : 0.5;
      } else if (currentDate.getTime() === endDate.getTime()) {
        vacationStart = getVacationStartTime(endType);
        vacationEnd = getVacationEndTime(endType);
        vacationType = getVacationType(endType);
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

  // Firestore에 저장 (하이브리드 구조)
  const batch = firebase.firestore().batch();
  const recordsRef = db.collection("records").doc(userEmail).collection("dates");

  try {
    const userDocRef = db.collection("records").doc(userEmail);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      const currentAnnualLeaveStr =
        userDoc.data().annualLeave !== undefined &&
        userDoc.data().annualLeave !== null
          ? String(userDoc.data().annualLeave)
          : "0일";
      let currentAnnualLeave =
        parseFloat(currentAnnualLeaveStr.replace("일", "")) || 0;

      const newAnnualLeave = currentAnnualLeave - leaveDaysToDeduct;

      if (newAnnualLeave < 0) {
        if (typeof showNoticeModal === 'function') {
          showNoticeModal("잔여 연차보다 많은 연차를 신청할 수 없습니다.");
        } else {
          alert("잔여 연차보다 많은 연차를 신청할 수 없습니다.");
        }
        return;
      }

      // 사용자 문서의 연차 잔량 업데이트
      batch.update(userDocRef, { annualLeave: `${newAnnualLeave}일` });

      // 연차 변경 로그 데이터 준비
      const vacationStartStr = `${vacationRecords[0].date} ${vacationRecords[0].start}`;
      const lastRecord = vacationRecords[vacationRecords.length - 1];
      const vacationEndStr = `${lastRecord.date} ${lastRecord.end}`;

      const logData = {
        type: "annual",
        before: `${currentAnnualLeave}일`,
        after: `${newAnnualLeave}일`,
        change: `-${leaveDaysToDeduct}일`,
        reason: "연차 사용",
        details: {
          vacationStart: vacationStartStr,
          vacationEnd: vacationEndStr,
          vacationType: vacationRecords.length === 1 ? vacationRecords[0].type : "연차",
          totalDays: leaveDaysToDeduct,
          requestDate: new Date().toISOString().split("T")[0],
          vacationDates: vacationRecords.map(r => r.date)
        }
      };

      // 각 휴가 기록을 저장
      for (const record of vacationRecords) {
        const { date, start, end, type } = record;
        
        // 1. 기존 구조에 저장 (dates 컬렉션)
        const docRef = recordsRef.doc(date);
        batch.set(
          docRef,
          {
            vacation: firebase.firestore.FieldValue.arrayUnion({
              start,
              end,
              type,
            }),
          },
          { merge: true }
        );
        
        // 2. 하이브리드 구조 - vacations 서브컬렉션에 저장
        const vacationRef = db
          .collection("records")
          .doc(userEmail)
          .collection("vacations")
          .doc(date);
        
        const existingVacationDoc = await vacationRef.get();
        
        // timestamp는 문자열로 저장
        const timestamp = new Date().toISOString();
        
        // 이 날짜에 사용된 연차 계산 (반차는 0.5일)
        let dayUsed = 0;
        if (type === "종일연차") dayUsed = 1;
        else if (type === "오전반휴" || type === "오후반휴") dayUsed = 0.5;
        
        if (existingVacationDoc.exists) {
          // 이미 해당 날짜의 휴가 문서가 있으면 배열에 추가
          batch.update(vacationRef, {
            vacation: firebase.firestore.FieldValue.arrayUnion({
              start: start,
              end: end,
              type: type,
              // 잔여 연차 변경 정보 추가
              leaveBalance: {
                before: `${currentAnnualLeave}일`,
                after: `${newAnnualLeave}일`,
                used: `${dayUsed}일`,
                totalUsedInRequest: `${leaveDaysToDeduct}일` // 전체 요청에서 사용된 총 일수
              },
              createdAt: timestamp
            }),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // 새로운 휴가 문서 생성
          batch.set(vacationRef, {
            vacation: [{
              start: start,
              end: end,
              type: type,
              // 잔여 연차 변경 정보 추가
              leaveBalance: {
                before: `${currentAnnualLeave}일`,
                after: `${newAnnualLeave}일`,
                used: `${dayUsed}일`,
                totalUsedInRequest: `${leaveDaysToDeduct}일` // 전체 요청에서 사용된 총 일수
              },
              createdAt: timestamp
            }],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      await batch.commit();
      
      // 로그 기록 (batch 외부에서 실행)
      await recordLeaveHistory(userEmail, logData);
      
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("연차 신청이 완료되었습니다.");
      } else {
        alert("연차 신청이 완료되었습니다.");
      }
      
    } else {
      console.warn("User document not found for annual leave deduction.");
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("사용자 연차 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      } else {
        alert("사용자 연차 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      }
      return;
    }
  } catch (deductionError) {
    console.error("Error deducting annual leave:", deductionError);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("연차 차감 중 오류가 발생했습니다.");
    } else {
      alert("연차 차감 중 오류가 발생했습니다.");
    }
    return;
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
  closeAnnualModal();
}

// 휴가 유형별 시간/텍스트 반환 함수들
function getVacationStartTime(type) {
  return type === "morning" ? "09:30" : type === "afternoon" ? "13:00" : "09:30";
}

function getVacationEndTime(type) {
  return type === "morning" ? "11:30" : type === "afternoon" ? "18:00" : "18:00";
}

function getVacationType(type) {
  return type === "morning" ? "오전반휴" : type === "afternoon" ? "오후반휴" : "종일연차";
}

// 총 휴가 시간을 소수점 한 자리까지 계산
function calculateVacationHours(vacationTimes) {
  if (!Array.isArray(vacationTimes)) {
    console.warn("vacationTimes가 배열이 아닙니다. 기본값으로 빈 배열을 사용합니다:", vacationTimes);
    vacationTimes = [];
  }

  let totalSeconds = 0;

  vacationTimes.forEach(({ start, end }) => {
    const startSeconds = parseTime(start);
    const endSeconds = parseTime(end);

    if (isNaN(startSeconds) || isNaN(endSeconds)) {
      console.error("휴가 시간 변환 중 오류 발생:", { start, end });
      return;
    }

    if (endSeconds < startSeconds) {
      console.warn("종료 시간이 시작 시간보다 이전입니다. 데이터를 건너킵니다:", { start, end });
      return;
    }

    totalSeconds += endSeconds - startSeconds;
  });

  const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
  return totalHours;
}

// 시간 조합 함수: 선택된 값을 "HH:mm:ss" 형식으로 반환
function combineTime(ampm, hour, minute) {
  let adjustedHour = parseInt(hour, 10);
  if (ampm === "PM" && adjustedHour !== 12) adjustedHour += 12;
  if (ampm === "AM" && adjustedHour === 12) adjustedHour = 0;
  return `${String(adjustedHour).padStart(2, "0")}:${minute}:00`;
}

// 시작 및 종료 시간 옵션 설정 함수
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

// 모달 닫기 함수들
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

// 유틸리티 함수들
function parseDurationStringToMinutes(durationString) {
  const hoursMatch = String(durationString).match(/(\d+)시간/);
  const minutesMatch = String(durationString).match(/(\d+)분/);
  let totalMinutes = 0;
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }
  return totalMinutes;
}

function formatMinutesToDurationString(totalMinutes) {
  if (totalMinutes < 0) totalMinutes = 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0 && minutes > 0) {
    result = `${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    result = `${hours}시간`;
  } else if (minutes > 0) {
    result = `${minutes}분`;
  } else {
    result = "0분";
  }
  return result;
}

// 모든 휴가 기록 조회 함수 (하이브리드 구조 활용)
async function getAllVacations(userEmail, startDate, endDate) {
  try {
    const vacationsRef = db
      .collection("records")
      .doc(userEmail)
      .collection("vacations");
    
    let query = vacationsRef;
    
    if (startDate) {
      query = query.where(firebase.firestore.FieldPath.documentId(), ">=", startDate);
    }
    if (endDate) {
      query = query.where(firebase.firestore.FieldPath.documentId(), "<=", endDate);
    }
    
    const snapshot = await query.get();
    const vacations = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.vacation && Array.isArray(data.vacation)) {
        data.vacation.forEach(v => {
          vacations.push({
            date: doc.id,
            ...v
          });
        });
      }
    });
    
    return vacations;
  } catch (error) {
    console.error("휴가 기록 조회 중 오류:", error);
    return [];
  }
}

// 휴가 변경 이력 조회 함수
async function getLeaveHistory(userEmail, type = null, limit = 50) {
  try {
    const historyRef = db
      .collection("records")
      .doc(userEmail)
      .collection("leaveHistory");
    
    let query = historyRef.orderBy("createdAt", "desc").limit(limit);
    
    if (type) {
      query = query.where("type", "==", type);
    }
    
    const snapshot = await query.get();
    const history = [];
    
    snapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error("휴가 변경 이력 조회 중 오류:", error);
    return [];
  }
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기
window.VacationModule = {
  calculateVacationHours,
  combineTime,
  closeModal,
  closeAnnualModal,
  getAllVacations,
  getLeaveHistory,
  recordLeaveHistory
};

      //