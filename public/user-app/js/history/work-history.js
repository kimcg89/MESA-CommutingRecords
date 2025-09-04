// work-history.js
// 일일 근무 기록 조회 및 히스토리 관리 (2025년 1월 31일 16:45 생성됨)

// 근무 기록 관련 전역 변수 (window 객체 사용으로 중복 방지) (2025년 1월 31일 17:25 수정됨)
// selectedDate는 window.selectedDate로 접근

// Firebase 준비 완료 후 근무 기록 관리 초기화 (2025년 8월 5일 17:30 수정됨)
document.addEventListener("firebaseReady", (event) => {
  initializeWorkHistory();
});

// 인증 상태 변경 감지 및 히스토리 새로고침 (2025년 8월 5일 17:30 추가됨)
document.addEventListener("DOMContentLoaded", () => {
  // Firebase 인증 상태 변경 시 히스토리 새로고침
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log("🔄 사용자 로그인 감지, 히스토리 새로고침");
      // 약간의 지연 후 히스토리 로드 (Firebase 완전 초기화 대기)
      setTimeout(() => {
        loadInitialHistory();
      }, 500);
    }
  });
});

// 근무 기록 관리 시스템 초기화 (2025년 1월 31일 16:45 생성됨)
function initializeWorkHistory() {
  // 초기 로드 시 오늘 날짜로 표시
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayFormatted = kstDate.toISOString().split("T")[0];

  if (!window.selectedDate) {
    window.selectedDate = todayFormatted;
    console.log("📅 초기 selectedDate 설정:", window.selectedDate);
  }

  // 주간 테이블 클릭 이벤트는 weekly-calendar.js에서 처리되므로 여기서는 초기 데이터만 로드
  loadInitialHistory();
}

// 초기 히스토리 로드 (2025년 8월 5일 17:30 수정됨)
async function loadInitialHistory() {
  const user = firebase.auth().currentUser;
  if (user) {
    const userEmail = user.email;
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const currentDate = kstDate.toISOString().split("T")[0];

    console.log("📋 초기 히스토리 로드 시작:", currentDate);

    const recordRef = firebase
      .firestore()
      .collection("records")
      .doc(userEmail)
      .collection("dates")
      .doc(currentDate);

    await loadHistory(recordRef);
    console.log("✅ 초기 히스토리 로드 완료");
  } else {
    console.warn("⚠️ 사용자가 로그인되지 않음 - 히스토리 로드 불가");
  }
}

// Firestore에서 데이터를 가져와서 기록을 추가하는 함수 (2025년 1월 31일 16:45 수정됨)
async function fetchData(recordRef) {
  const doc = await recordRef.get();

  if (!doc.exists) {
    console.warn("문서가 존재하지 않습니다.");
    return null;
  }

  return doc.data();
}

// DOM 업데이트 처리 (2025년 8월 6일 22:30 수정됨 - address 필드 지원 추가)
function updateDOM(data) {
  if (!data) return;

  const historyContainer = document.getElementById("historyList");
  if (!historyContainer) {
    console.warn("historyList 요소를 찾을 수 없습니다.");
    return;
  }

  // 기존 데이터 초기화
  historyContainer.innerHTML = "";

  // 1. start 배열의 첫 번째 데이터 추가 (2025년 8월 6일 22:30 수정됨 - address 지원)
  if (Array.isArray(data.start) && data.start.length > 0) {
    const { time, gps, address, memo } = data.start[0];
    appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
  } else {
    console.warn("start 데이터가 없습니다.");
  }

  // 2. gps 배열의 모든 데이터 추가 (2025년 8월 6일 22:30 수정됨 - address 지원)
  if (Array.isArray(data.gps) && data.gps.length > 0) {
    data.gps.forEach(({ time, gps, address, memo }) => {
      appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
    });
  } else {
    console.warn("gps 데이터가 없습니다.");
  }

  // 3. end 배열의 가장 최근 데이터 추가 (2025년 8월 6일 22:30 수정됨 - address 지원)
  if (Array.isArray(data.end) && data.end.length > 0) {
    const sortedEnd = data.end.sort(
      (a, b) =>
        new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
    );

    const { time, gps, address, memo } = sortedEnd[sortedEnd.length - 1];
    appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
  } else {
    console.warn("end 데이터가 없습니다.");
  }

  // 4. vacation 배열의 데이터 추가
  if (Array.isArray(data.vacation) && data.vacation.length > 0) {
    data.vacation.forEach(({ start, end }) => {
      const vacationPeriod = `${start} ~ ${end}`;
      appendHistoryItem(historyContainer, "휴가", vacationPeriod);
    });
  } else {
    console.warn("vacation 데이터가 없습니다.");
  }
}

// 최종적으로 호출할 함수 (2025년 1월 31일 16:45 수정됨)
async function loadHistory(recordRef) {
  try {
    const data = await fetchData(recordRef);
    updateDOM(data);
  } catch (error) {
    console.error("Firestore 데이터를 불러오는 중 오류 발생:", error);
  }
}

// history 항목을 동적으로 추가하는 함수 (2025년 8월 6일 22:30 수정됨 - address 필드 지원 추가)
// @param container: 히스토리 항목을 추가할 컨테이너 요소
// @param time: 시간 정보
// @param locationInfo: GPS 좌표 문자열 또는 주소 문자열
// @param duration: 근무 시간 (선택적)
// @param address: 주소 정보 (선택적, GPS 대신 표시)
// 근무 유형 표시 추가 (2025년 8월 8일 수정됨)

function appendHistoryItem(
  container,
  time,
  locationInfo,
  address = null,
  workType = null // 근무 유형 파라미터 추가 (2025년 8월 8일)
) {
  if (!container) {
    console.warn("appendHistoryItem: container가 null입니다.");
    return;
  }

  const historyItem = document.createElement("div");
  historyItem.classList.add("historyRecord");

  // address가 있으면 address를 표시, 없으면 GPS 좌표 표시 (2025년 8월 6일 22:30 추가됨)
  const displayLocation = address || locationInfo;

  // 근무 유형 표시 생성 (2025년 8월 8일 추가됨)
  let workTypeDisplay = "";
  if (workType) {
    // 근무 유형에 따른 색상 설정
    let typeColor = "#666"; // 기본 색상
    if (workType === "내근") {
      typeColor = "#4CAF50"; // 초록색
    } else if (workType === "외근") {
      typeColor = "#2196F3"; // 파란색
    } else if (workType === "재택") {
      typeColor = "#FF9800"; // 주황색
    }

    workTypeDisplay = ` <span style="color: ${typeColor}; font-weight: bold; margin-left: 10px;">[${workType}]</span>`;
  }

  historyItem.innerHTML = `
    <div class="time-dot"></div>
    <div class="timeGps">
      <p class="historyTime">${time}</p>
      <p class="historyGps">${displayLocation}${workTypeDisplay}</p>
    </div>
    <div class="memoBtn">Memo</div>
  `;

  container.appendChild(historyItem);
}

// 선택된 날짜의 히스토리 업데이트 함수 (2025년 1월 31일 16:45 수정됨)
async function updateHistoryList(selectedDateParam) {
  // 전역 selectedDate 업데이트
  window.selectedDate = selectedDateParam;
  window.selectedDate = selectedDateParam;

  // 선택된 날짜 표시 업데이트
  if (typeof updateSelectedDateDisplay === "function") {
    updateSelectedDateDisplay(selectedDateParam);
  }

  const user = firebase.auth().currentUser;
  if (!user) return;

  const userEmail = user.email;
  const recordRef = db
    .collection("records")
    .doc(userEmail)
    .collection("dates")
    .doc(selectedDateParam);

  try {
    const doc = await recordRef.get();
    const historyContainer = document.getElementById("historyList");

    if (!historyContainer) {
      console.warn("historyList 요소를 찾을 수 없습니다.");
      return;
    }

    historyContainer.innerHTML = ""; // 기존 목록 초기화

    if (doc.exists) {
      const data = doc.data();

      // 출근 기록 추가 (2025년 8월 6일 22:30 수정됨 - address 지원)
      if (Array.isArray(data.start) && data.start.length > 0) {
        data.start.forEach(({ time, gps, address, memo }) => {
          // memo.work 값이 있으면 전달, 없으면 null
          appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
        });
      }

      // GPS 기록 추가 (2025년 8월 6일 22:30 수정됨 - address 지원)
      if (Array.isArray(data.gps) && data.gps.length > 0) {
        data.gps.forEach(({ time, gps, address, memo }) => {
          // memo.work 값이 있으면 전달, 없으면 null
          appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
        });
      }

      // 퇴근 기록 추가 (가장 최신 데이터만 표시) (2025년 8월 6일 22:30 수정됨 - address 지원)
      if (Array.isArray(data.end) && data.end.length > 0) {
        const sortedEnd = data.end.sort(
          (a, b) =>
            new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
        );

        const { time, gps, address, memo } =
          sortedEnd[sortedEnd.length - 1];
        appendHistoryItem(
            historyContainer,
            time,
            gps,
            address,
            memo?.work || null
          );
      }

      // 휴가 기록 추가
      if (Array.isArray(data.vacation) && data.vacation.length > 0) {
        data.vacation.forEach(({ start, end }) => {
          appendHistoryItem(historyContainer, "휴가", `${start} ~ ${end}`);
        });
      }
    }
  } catch (error) {
    console.error("Firestore 데이터 조회 중 오류 발생:", error);
  }
}

// 월간 달력 관련 함수들 (추후 사용 예정) (2025년 1월 31일 16:45 추가됨)

// 전역 변수로 데이터 캐시 추가
let cachedRecords = {};

// 현재 날짜 상태
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Firestore에서 특정 달의 모든 데이터 가져오기 (2025년 1월 31일 16:45 수정됨)
async function fetchMonthlyRecords(year, month, userEmail) {
  try {
    const recordsRef = db
      .collection("records")
      .doc(userEmail)
      .collection("dates");
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      new Date(year, month + 1, 0).getDate()
    ).padStart(2, "0")}`;

    const querySnapshot = await recordsRef
      .where(firebase.firestore.FieldPath.documentId(), ">=", startDate)
      .where(firebase.firestore.FieldPath.documentId(), "<=", endDate)
      .get();

    cachedRecords = {};
    querySnapshot.forEach((doc) => {
      cachedRecords[doc.id] = doc.data();
    });

    console.log("캐시된 데이터:", cachedRecords);
  } catch (error) {
    console.error("Firestore 월간 데이터 가져오기 오류:", error);
  }
}

// 월간 달력 생성 함수 (추후 사용 예정) (2025년 1월 31일 16:45 수정됨)
async function generateCalendar(year, month) {
  const user = firebase.auth().currentUser;

  if (!user) {
    console.error("로그인된 사용자가 없습니다.");
    const calendarContainer = document.getElementById("calendar-container");
    if (calendarContainer) {
      calendarContainer.innerHTML = "<p>로그인 후 캘린더를 볼 수 있습니다.</p>";
    }
    return;
  }

  const userEmail = user.email;

  // Firestore에서 월간 데이터 가져오기
  await fetchMonthlyRecords(year, month, userEmail);

  const calendarContainer = document.getElementById("calendar-container");
  if (!calendarContainer) {
    console.warn("calendar-container 요소를 찾을 수 없습니다.");
    return;
  }

  calendarContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();
  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // 요일 헤더 생성
  days.forEach((day, index) => {
    const th = document.createElement("th");
    th.innerText = day;
    if (index === 0) th.classList.add("sunday");
    if (index === 6) th.classList.add("saturday");
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  let row = document.createElement("tr");

  // 첫 주 빈 칸에 전달 날짜 표시
  if (firstDay !== 0) {
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement("td");
      const prevDate = prevLastDate - i;
      cell.innerText = prevDate;
      cell.classList.add("prev-month");
      const dayIndex = (7 + firstDay - 1 - i) % 7;
      if (dayIndex === 0) cell.classList.add("sunday");
      if (dayIndex === 6) cell.classList.add("saturday");
      row.appendChild(cell);
    }
  }

  // 현재 달 날짜 셀 생성
  for (let date = 1; date <= lastDate; date++) {
    const cell = document.createElement("td");
    const currentDate = new Date(year, month, date);
    const formattedDate = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(date).padStart(2, "0")}`;

    // 기본 날짜 표시
    cell.innerHTML = `<div class="date">${date}</div>`;

    // 오늘 날짜 강조
    if (
      date === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
    ) {
      cell.classList.add("today");
    }

    // 공휴일 확인 및 표시
    const holiday = holidays.find((h) => h.date === formattedDate);
    if (holiday) {
      cell.classList.add("holiday");
      cell.innerHTML += `<small>${holiday.name}</small>`;
    }

    // 기념일 확인 및 표시
    const mesaday = mesadays.find((m) => m.date === formattedDate);
    if (mesaday) {
      cell.innerHTML += `<small>${mesaday.name}</small>`;
    }

    // 캐시에서 데이터 검색 및 표시
    const record = cachedRecords[formattedDate];
    if (record) {
      // 출근 마커
      if (record.start?.length) {
        const markerStart = document.createElement("div");
        markerStart.classList.add("marker", "marker-in");
        markerStart.innerText = "출";
        cell.appendChild(markerStart);
      }

      // 퇴근 마커 및 근무 시간 표시
      if (record.end?.length) {
        const markerEnd = document.createElement("div");
        markerEnd.classList.add("marker", "marker-out");
        markerEnd.innerText = "퇴";
        cell.appendChild(markerEnd);

        // 근무 시간 계산 및 표시
        const durationBox = document.createElement("div");
        durationBox.classList.add("duration-box");

        const durationMatch =
          record.end[0]?.duration?.match(/(\d+)시간\s*(\d+)?분?/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10) || 0;
          const minutes = parseInt(durationMatch[2], 10) || 0;
          const totalHours = hours + minutes / 60;
          durationBox.innerText = totalHours.toFixed(1);
        } else {
          durationBox.innerText = "0";
        }

        cell.appendChild(durationBox);
      }

      // 휴가 표시
      if (record.vacation?.length) {
        const totalVacationTime = calculateVacationHours(record.vacation);
        const vacationBox = document.createElement("div");
        vacationBox.classList.add("vacation-box");
        vacationBox.innerText = totalVacationTime;
        cell.appendChild(vacationBox);
      }
    }

    // 토요일/일요일 스타일
    if (currentDate.getDay() === 0) cell.classList.add("sunday");
    if (currentDate.getDay() === 6) cell.classList.add("saturday");

    row.appendChild(cell);
    if (currentDate.getDay() === 6) {
      table.appendChild(row);
      row = document.createElement("tr");
    }
  }

  // 마지막 주 빈 칸에 다음 달 날짜 표시
  const lastDay = new Date(year, month + 1, 0).getDay();
  if (lastDay !== 6) {
    for (let i = 1; i < 7 - lastDay; i++) {
      const cell = document.createElement("td");
      cell.innerText = i;
      cell.classList.add("next-month");
      const dayIndex = (lastDay + i) % 7;
      if (dayIndex === 0) cell.classList.add("sunday");
      if (dayIndex === 6) cell.classList.add("saturday");
      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  calendarContainer.appendChild(table);

  // 현재 월 표시
  const currentMonthElement = document.getElementById("current-month");
  if (currentMonthElement) {
    currentMonthElement.innerText = `${year}년 ${month + 1}월`;
  }
}

// 달력 이전/다음 버튼 이벤트 핸들러 (추후 사용 예정) (2025년 1월 31일 16:45 수정됨)
function initializeMonthlyCalendarEvents() {
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      generateCalendar(currentYear, currentMonth);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      generateCalendar(currentYear, currentMonth);
    });
  }
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 17:30 수정됨)
window.WorkHistoryModule = {
  updateHistoryList,
  appendHistoryItem,
  loadHistory,
  fetchData,
  updateDOM,
  isHoliday,
  generateCalendar,
  fetchMonthlyRecords,
};

// 전역 함수로도 접근 가능하게 설정
window.updateHistoryList = updateHistoryList;
window.appendHistoryItem = appendHistoryItem;
