let isClockedIn = false;
let clockInTime = null;
const records = [
  // {
  //   type: "출근",
  //   time: "2024. 11. 20. 오전 08:30:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  // },
  // {
  //   type: "퇴근",
  //   time: "2024. 11. 20. 오후 06:00:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  //   duration: "9.5",
  // },
  // {
  //   type: "출근",
  //   time: "2024. 11. 21. 오전 08:30:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  // },
  // {
  //   type: "퇴근",
  //   time: "2024. 11. 21. 오후 06:00:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  //   duration: "9.5",
  // },
  // {
  //   type: "출근",
  //   time: "2024. 11. 22. 오전 08:30:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  // },
  // {
  //   type: "휴가",
  //   time: "2024. 11. 22. 오전 08:30:00",
  // },
  // {
  //   type: "퇴근",
  //   time: "2024. 11. 22. 오후 06:00:00",
  //   gps: "위도: 37.123456, 경도: 127.123456",
  //   duration: "9.5",
  // },
  {
    date: "2024-11-22",
    start: [
      {
        time: "오전 09:30:00",
        gps: "위도: 37.123456, 경도: 127.123456",
      },
    ],
    vacation: [
      {
        time: "2", // 휴가 시간 (단위: 시간)
      },
    ],
    end: [
      {
        time: "오후 06:00:00",
        gps: "위도: 37.123456, 경도: 127.123456",
        duration: "9.5", // 근무 시간
      },
    ],
  },
];

const vacationTimes = [];

// 현재 날짜와 시간 표시
function updateDateTime() {
  const currentDate = new Date();
  document.getElementById(
    "current-date"
  ).innerText = `현재 시간: ${currentDate.toLocaleString()}`;
}

setInterval(updateDateTime, 1000);

// 출근/퇴근 버튼 이벤트
document.getElementById("attendance-button").addEventListener("click", () => {
  const now = new Date();

  // GPS 위치 가져오기
  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      if (!isClockedIn) {
        // 출근 처리
        clockInTime = now;
        isClockedIn = true;
        document.getElementById("attendance-button").innerText = "퇴근";
        const record = {
          type: "출근",
          time: now.toLocaleString(),
          gps: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`,
        };
        records.push(record);
        updateRecords();
      } else {
        // 퇴근 처리
        const clockOutTime = now;
        const workDuration = calculateWorkTime(clockInTime, clockOutTime);
        isClockedIn = false;
        document.getElementById("attendance-button").innerText = "출근";
        const record = {
          type: "퇴근",
          time: now.toLocaleString(),
          gps: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`,
          duration: `${workDuration.hours}시간 ${workDuration.minutes}분`,
        };
        records.push(record);
        updateRecords();
        clockInTime = null;
      }
    },
    (error) => {
      alert("위치 정보를 가져올 수 없습니다.");
      console.error(error);
    }
  );
});

// 시간 옵션 동적 생성
document.addEventListener("DOMContentLoaded", () => {
  updateDateTime();
  generateCalendar();

  const startHourSelect = document.getElementById("vacation-start-hour");
  const endHourSelect = document.getElementById("vacation-end-hour");

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
});

// 휴가신청 버튼 이벤트
document.getElementById("vacation-button").addEventListener("click", () => {
  document.getElementById("modal-overlay").style.display = "block";
  document.getElementById("vacation-modal").style.display = "block";
});

// 모달 저장 버튼 이벤트
document.getElementById("save-vacation").addEventListener("click", () => {
  const startAmpm = document.getElementById("vacation-start-ampm").value;
  const startHour = document.getElementById("vacation-start-hour").value;
  const startMinute = document.getElementById("vacation-start-minute").value;

  const endAmpm = document.getElementById("vacation-end-ampm").value;
  const endHour = document.getElementById("vacation-end-hour").value;
  const endMinute = document.getElementById("vacation-end-minute").value;

  const startTime = combineTime(startAmpm, startHour, startMinute);
  const endTime = combineTime(endAmpm, endHour, endMinute);

  if (startTime < endTime) {
    vacationTimes.push({ start: startTime, end: endTime });
    const record = { type: "휴가", time: `${startTime} ~ ${endTime}` };
    records.push(record);
    updateRecords();
    closeModal();
  } else {
    alert("종료 시간이 시작 시간보다 이후여야 합니다.");
  }
});

// 시간 조합 함수: 선택된 값을 "HH:mm" 형식으로 반환
function combineTime(ampm, hour, minute) {
  let adjustedHour = parseInt(hour, 10);
  if (ampm === "PM" && adjustedHour !== 12) adjustedHour += 12; // 오후일 경우 시간 조정
  if (ampm === "AM" && adjustedHour === 12) adjustedHour = 0; // 오전 12시는 0시로 변환
  return `${String(adjustedHour).padStart(2, "0")}:${minute}`;
}

///////////////// 여기 해야함 이거 안됐음!!!!!!!!!!!!!!!!!!!!

// 기록 갱신
function updateRecords() {
  const recordList = document.getElementById("record-list");
  recordList.innerHTML = records
    .map((record) => {
      const startTimes =
        record.start
          ?.map(
            (start) => `출근: ${start.time} (${start.gps || "위치 정보 없음"})`
          )
          .join("<br>") || "";

      const endTimes =
        record.end
          ?.map(
            (end) =>
              `퇴근: ${end.time} (근무 시간: ${end.duration || "N/A"}시간, ${
                end.gps || "위치 정보 없음"
              })`
          )
          .join("<br>") || "";

      const vacationTimes =
        record.vacation?.map((vac) => `휴가: ${vac.time}시간`).join("<br>") ||
        "";

      return `
        <li>
          <strong>${record.date}</strong><br>
          ${startTimes ? `${startTimes}<br>` : ""}
          ${endTimes ? `${endTimes}<br>` : ""}
          ${vacationTimes ? `${vacationTimes}` : ""}
        </li>
      `;
    })
    .join("");
}

// 근무 시간 계산
function calculateWorkTime(startTime, endTime) {
  let workTime = endTime - startTime;
  vacationTimes.forEach(({ start, end }) => {
    const vacationStart = parseTime(start);
    const vacationEnd = parseTime(end);
    if (vacationStart >= startTime && vacationEnd <= endTime) {
      workTime -= vacationEnd - vacationStart;
    }
  });
  const hours = Math.floor(workTime / (1000 * 60 * 60));
  const minutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

// 현재 날짜 상태
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// 공휴일 데이터
const holidays = [
  // 2024년 공휴일
  { date: "2024-01-01", name: "새해" },
  { date: "2024-02-09", name: "연휴" },
  { date: "2024-02-10", name: "설날" },
  { date: "2024-02-11", name: "연휴" },
  { date: "2024-03-01", name: "삼일절" },
  { date: "2024-05-01", name: "근로자의날" },
  { date: "2024-05-05", name: "어린이날" },
  { date: "2024-06-06", name: "현충일" },
  { date: "2024-08-15", name: "광복절" },
  { date: "2024-09-16", name: "연휴" },
  { date: "2024-09-17", name: "추석" },
  { date: "2024-09-18", name: "연휴" },
  { date: "2024-10-01", name: "국군의날" },
  { date: "2024-10-03", name: "개천절" },
  { date: "2024-10-09", name: "한글날" },
  { date: "2024-12-25", name: "성탄절" },

  // 2025년 공휴일
  { date: "2025-01-01", name: "새해" },
  { date: "2025-01-28", name: "연휴" },
  { date: "2025-01-29", name: "설날" },
  { date: "2025-01-30", name: "연휴" },
  { date: "2025-03-01", name: "삼일절" },
  { date: "2025-05-01", name: "근로자의날" },
  { date: "2025-05-05", name: "어린이날" },
  { date: "2025-05-15", name: "스승의날" }, // 임시 기념일
  { date: "2025-06-06", name: "현충일" },
  { date: "2025-08-15", name: "광복절" },
  { date: "2025-10-01", name: "국군의날" },
  { date: "2025-10-03", name: "개천절" },
  { date: "2025-10-06", name: "연휴" },
  { date: "2025-10-07", name: "추석" },
  { date: "2025-10-08", name: "연휴" },
  { date: "2025-10-09", name: "한글날" },
  { date: "2025-12-25", name: "성탄절" },

  // 임시 공휴일 (예상)
  { date: "2024-05-06", name: "대체공휴일" },
];

const mesadays = [
  { date: "2024-12-20", name: "연말행사" },
  { date: "2024-01-14", name: "창립기념일" },
  { date: "2025-01-14", name: "창립기념일" },
  // 추가
];

// Calendar
function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate(); // 전달의 마지막 날짜
  const calendarContainer = document.getElementById("calendar-container");
  calendarContainer.innerHTML = "";

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

  // 날짜 셀 생성
  for (let date = 1; date <= lastDate; date++) {
    const cell = document.createElement("td");
    const currentDate = new Date(year, month, date);
    const formattedDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

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

    // 기록 확인 및 표시
    const dayRecord = records.find((record) => record.date === formattedDate);
    if (dayRecord) {
      // 출근 마커
      dayRecord.start.forEach((start) => {
        const markerStart = document.createElement("div");
        markerStart.classList.add("marker", "marker-in");
        markerStart.innerText = "출";
        cell.appendChild(markerStart);
      });

      // 퇴근 표시
      dayRecord.end.forEach((end) => {
        const markerEnd = document.createElement("div");
        markerEnd.classList.add("marker", "marker-out");
        markerEnd.innerText = "퇴";
        cell.appendChild(markerEnd);

        // 근무 시간 표시
        const durationBox = document.createElement("div");
        durationBox.classList.add("duration-box");
        durationBox.innerText = `${end.duration}`;
        cell.appendChild(durationBox);
      });

      // 휴가 표시
      dayRecord.vacation.forEach((vac) => {
        const vacationBox = document.createElement("div");
        vacationBox.classList.add("vacation-box");
        vacationBox.innerText = `${vac.time}`;
        cell.appendChild(vacationBox);
      });
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
  document.getElementById("current-month").innerText = `${year}년 ${
    month + 1
  }월`;
}

// 이전/다음 버튼 이벤트 핸들러
document.getElementById("prev-month").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentYear, currentMonth);
});

document.getElementById("next-month").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentYear, currentMonth);
});

// 초기 달력 생성
document.addEventListener("DOMContentLoaded", () => {
  generateCalendar(currentYear, currentMonth);
});

// 알람 시간 설정 (초단위)
const alarmTimes = ["09:10:00", "09:20:00", "09:30:00"];
const disabledAlarms = {}; // 비활성화된 알람을 저장
const checkAlarmInterval = 1000; // 1초 간격으로 알람 확인

// 알람 확인 함수
function checkAlarms() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // 현재 시간 "HH:mm:ss" 형식
  const recordList = document.getElementById("record-list");

  // 1. 알람 시간에 모달 표시 (비활성화된 알람 제외)
  if (alarmTimes.includes(currentTime) && !disabledAlarms[currentTime]) {
    showModal(`오전 ${currentTime}입니다`, true);
  }

  // 2. 09:45:00일 때 기록이 없는 경우
  if (currentTime === "09:45:00" && recordList.children.length === 0) {
    showModal("출근 시간 입력 X", false);
  }
}

// "On"/"Off" 버튼 토글 함수
function toggleAlarm(button, alarmTime) {
  if (disabledAlarms[alarmTime]) {
    // 알람 활성화
    delete disabledAlarms[alarmTime];
    button.innerText = "On";
    button.style.backgroundColor = "red"; // 활성화 상태 배경색
  } else {
    // 알람 비활성화
    disabledAlarms[alarmTime] = true;
    button.innerText = "Off";
    button.style.backgroundColor = "gray"; // 비활성화 상태 배경색
  }
}

// 알람 버튼 초기화
function initializeAlarmButtons() {
  alarmTimes.forEach((time) => {
    const button = document.querySelector(
      `.alarmTime[data-time="${time}"] button`
    );
    if (button) {
      button.addEventListener("click", () => toggleAlarm(button, time));
      // 초기 상태 설정
      button.innerText = "On";
      button.style.backgroundColor = "red"; // 기본 배경색
    }
  });
}
// 모달 표시 함수
function showModal(message, isAlarmDismissable) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("vacation-modal");

  modal.innerHTML = `
    <h3>${message}</h3>
    ${
      isAlarmDismissable
        ? `<button id="dismiss-alarm">알람끄기</button>`
        : `<button id="close-modal">닫기</button>`
    }
  `;

  modalOverlay.style.display = "block";
  modal.style.display = "block";

  if (isAlarmDismissable) {
    document
      .getElementById("dismiss-alarm")
      .addEventListener("click", closeModal);
  } else {
    document
      .getElementById("close-modal")
      .addEventListener("click", closeModal);
  }
}

// 모달 닫기
document
  .getElementById("cancel-vacation")
  .addEventListener("click", closeModal);

// 모달 닫기 함수
function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("vacation-modal");
  modalOverlay.style.display = "none";
  modal.style.display = "none";
}

// 주기적으로 알람 확인
setInterval(checkAlarms, checkAlarmInterval);

// DOMContentLoaded 이벤트에서 버튼 초기화
document.addEventListener("DOMContentLoaded", initializeAlarmButtons);
