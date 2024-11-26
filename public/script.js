let isClockedIn = false;
let clockInTime = null;

// Firebase 초기화
const db = firebase.firestore();

// 데이터 추가
const records = [
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
        time: "2", // 휴가 시간
      },
    ],
    end: [
      {
        time: "오후 06:00:00",
        gps: "위도: 37.123456, 경도: 127.123456",
        duration: "9.5",
      },
    ],
  },
];

// 기본 데이터 (Firestore 데이터를 가져오지 못할 경우 사용)
const defaultRecords = [
  {
    date: "2024-11-22",
    start: [
      { time: "오전 09:30:00", gps: "위도: 37.123456, 경도: 127.123456" },
    ],
    vacation: [{ time: "2" }],
    end: [
      {
        time: "오후 06:00:00",
        gps: "위도: 37.123456, 경도: 127.123456",
        duration: "9.5",
      },
    ],
  },
];

// Firestore에서 데이터 가져오기
async function fetchRecordsFromFirestore() {
  try {
    const querySnapshot = await db.collection("records").get();
    records.length = 0; // 기존 데이터 초기화

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        records.push(doc.data());
      });
      // console.log("Records fetched from Firestore:", records);
    } else {
      throw new Error("Firestore 데이터가 비어 있습니다.");
    }
  } catch (error) {
    console.error("Error fetching records from Firestore:", error);
    // 기본 데이터 사용
    records.length = 0; // 기존 데이터 초기화
    defaultRecords.forEach((record) => records.push(record));
    console.log("기본 데이터를 사용합니다.");
  }

  // 캘린더 및 기록 내역 갱신
  updateRecords();
  generateCalendar(currentYear, currentMonth);
}

// 초기 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
  fetchRecordsFromFirestore();
});

const vacationTimes = [];

// 현재 날짜와 시간 표시
function updateDateTime() {
  const currentDate = new Date();
  document.getElementById(
    "current-date"
  ).innerText = `현재 시간: ${currentDate.toLocaleString()}`;
}

setInterval(updateDateTime, 1000);

// Firestore에 데이터 저장 또는 업데이트
async function saveRecordToFirestore(record, date) {
  try {
    // 날짜 검증 및 기본값 설정
    if (!date) {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      console.warn(`날짜(date)가 정의되지 않아 기본값(${date})을 사용합니다.`);
    }

    console.log("저장할 날짜:", date);
    console.log("저장할 기록 데이터:", record);

    const querySnapshot = await db.collection("records").where("date", "==", date).get();

    // 근무 시간 계산
    const startTime = record.start?.[0]?.time || null;
    const endTime = record.end?.[0]?.time || null;

    let durationString = "0시간 0분";
    if (startTime && endTime) {
      const workTime = await calculateWorkTime(date); // { hours, minutes } 객체 반환
      durationString = `${workTime.hours || 0}시간 ${workTime.minutes || 0}분`;
    }

    const cleanedRecord = {
      ...record,
      duration: undefined, // 외부 duration 필드 제거
      end: record.end?.map((end) => ({
        ...end,
        duration: durationString || "0시간 0분", // 올바른 duration 값 저장
      })),
    };

    // undefined 값 제거
    Object.keys(cleanedRecord).forEach((key) => {
      if (cleanedRecord[key] === undefined) {
        delete cleanedRecord[key];
      }
    });

    if (querySnapshot.empty) {
      // 새로운 문서 생성
      await db.collection("records").add(cleanedRecord);
      console.log("새 기록이 Firestore에 저장되었습니다:", cleanedRecord);
    } else {
      // 기존 문서 업데이트
      const docId = querySnapshot.docs[0].id;
      await db.collection("records").doc(docId).update(cleanedRecord);
      console.log("기존 기록이 업데이트되었습니다:", cleanedRecord);
    }
  } catch (error) {
    console.error("Firestore에 데이터를 저장하는 중 오류 발생:", error);
  }
}

// Firestore 컬렉션 참조
const recordsRef = firebase.firestore().collection("records");

// 페이지 로드 시 Firestore 데이터 확인 및 버튼 상태 설정
document.addEventListener("DOMContentLoaded", async () => {
  const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식
  const button = document.getElementById("attendance-button");

  try {
    const snapshot = await recordsRef.where("date", "==", todayDate).get();

    if (!snapshot.empty) {
      const record = snapshot.docs[0].data();

      if (record.start && record.start.length > 0) {
        // 출근 기록이 있으면 버튼을 "퇴근"으로 설정
        button.innerText = "퇴근";

        if (record.end && record.end.length > 0) {
          // 퇴근 기록도 있으면 버튼 비활성화
          button.innerText = "퇴근 완료";
          button.disabled = true;
        }
      }
    }
  } catch (error) {
    console.error("Firestore 데이터 확인 중 오류 발생:", error);
  }
});

// 출근/퇴근 버튼 이벤트
document.getElementById("attendance-button").addEventListener("click", async () => {
  const now = new Date();
  const todayDate = now.toISOString().split("T")[0]; // YYYY-MM-DD 형식
  const button = document.getElementById("attendance-button");

  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      const snapshot = await recordsRef.where("date", "==", todayDate).get();

      if (snapshot.empty) {
        // 출근 처리
        const record = {
          date: todayDate,
          start: [
            {
              time: now.toLocaleTimeString(),
              gps: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`,
            },
          ],
        };

        await recordsRef.add(record);
        button.innerText = "퇴근";
        console.log("출근 기록 저장 완료:", record);
      } else {
        const docId = snapshot.docs[0].id;
        const record = snapshot.docs[0].data();

        if (record.start && record.start.length > 0 && (!record.end || record.end.length === 0)) {
          // 퇴근 처리
          const startTimeStr = record.start[0].time;
          const endTimeStr = now.toLocaleTimeString();

          console.log("시작 시간:", startTimeStr);
          console.log("종료 시간:", endTimeStr);

          const startTime = parseTime(startTimeStr);
          const endTime = parseTime(endTimeStr);

          if (isNaN(startTime) || isNaN(endTime)) {
            console.error("시간 변환 중 오류 발생:", { startTimeStr, endTimeStr });
            return;
          }

          const workDuration = calculateWorkTime(startTime, endTime);

          const endRecord = {
            time: endTimeStr,
            gps: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`,
            duration: `${workDuration.hours}시간 ${workDuration.minutes}분`,
          };

          await recordsRef.doc(docId).update({
            end: [endRecord],
          });

          button.innerText = "퇴근 완료";
          button.disabled = true;
          console.log("퇴근 기록 저장 완료:", endRecord);
        }
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
document.getElementById("save-vacation").addEventListener("click", async () => {
  const startAmpm = document.getElementById("vacation-start-ampm").value;
  const startHour = document.getElementById("vacation-start-hour").value;
  const startMinute = document.getElementById("vacation-start-minute").value;

  const endAmpm = document.getElementById("vacation-end-ampm").value;
  const endHour = document.getElementById("vacation-end-hour").value;
  const endMinute = document.getElementById("vacation-end-minute").value;

  // 시간 조합
  const startTime = combineTime(startAmpm, startHour, startMinute);
  const endTime = combineTime(endAmpm, endHour, endMinute);

  if (startTime >= endTime) {
    alert("종료 시간이 시작 시간보다 이후여야 합니다.");
    return;
  }

  // 휴가 데이터 생성
  const vacationData = {
    start: startTime,
    end: endTime,
    time: calculateVacationHours(startTime, endTime), // 시간 계산
  };

  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const record = {
    date: formattedDate,
    vacation: [vacationData],
  };

  try {
    // Firestore에 저장
    await saveRecordToFirestore(record);
    console.log("휴가 데이터가 저장되었습니다:", record);

    // 기록 갱신 및 캘린더 업데이트
    updateRecords();
    generateCalendar(currentYear, currentMonth);

    // 모달 닫기
    closeModal();
  } catch (error) {
    console.error("휴가 데이터를 저장하는 중 오류가 발생했습니다:", error);
    alert("휴가 데이터를 저장하지 못했습니다.");
  }
});

// 휴가 시간 계산 함수
function calculateVacationHours(start, end) {
  const startParts = start.split(":").map(Number);
  const endParts = end.split(":").map(Number);

  const startMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];

  return ((endMinutes - startMinutes) / 60).toFixed(1); // 소수 첫째 자리
}

// 시간 조합 함수: 선택된 값을 "HH:mm" 형식으로 반환
function combineTime(ampm, hour, minute) {
  let adjustedHour = parseInt(hour, 10);
  if (ampm === "PM" && adjustedHour !== 12) adjustedHour += 12; // 오후일 경우 시간 조정
  if (ampm === "AM" && adjustedHour === 12) adjustedHour = 0; // 오전 12시는 0시로 변환
  return `${String(adjustedHour).padStart(2, "0")}:${minute}`;
}

// 기록 갱신
function updateRecords(selectedDate = null) {
  const recordList = document.getElementById("record-list");

  // 오늘 날짜 포맷 (YYYY-MM-DD)
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 표시할 날짜 설정: 선택된 날짜가 없으면 오늘 날짜로 설정
  const displayDate = selectedDate || formattedToday;

  // 선택된 날짜와 일치하는 기록 필터링
  const filteredRecords = records.filter(
    (record) => record.date === displayDate
  );

  if (filteredRecords.length === 0) {
    // 기록이 없으면 빈 상태로 표시
    recordList.innerHTML = `<li><strong>${displayDate}</strong><br>기록이 없습니다.</li>`;
    return;
  }

  // 기록이 있는 경우 표시
  recordList.innerHTML = filteredRecords
    .map((record) => {
      const startTimes =
        record.start
          ?.map(
            (start) => `출근: ${start.time}`
            // (start) => `출근: ${start.time} (${start.gps || "위치 정보 없음"})`
          )
          .join("<br>") || "";

      const endTimes =
        record.end
          ?.map(
            (end) => `퇴근: ${end.time} (근무 시간: ${end.duration || "N/A"})`
            // `퇴근: ${end.time} (근무 시간: ${end.duration || "N/A"}시간, ${
            //   end.gps || "위치 정보 없음"
            // })`
          )
          .join("<br>") || "";

      const vacationTimes =
        record.vacation?.map((vac) => `휴가: ${vac.time}시간 (${vac.start} ~ ${vac.end})`).join("<br>") ||
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

// 달력 날짜 클릭 이벤트
function setupCalendarClickHandler() {
  const calendarContainer = document.getElementById("calendar-container");

  calendarContainer.addEventListener("click", (event) => {
    const clickedCell = event.target.closest("td");
    if (!clickedCell) return;

    const dateElement = clickedCell.querySelector(".date");
    if (!dateElement) return;

    const clickedDate = dateElement.textContent;
    const currentMonthYear = document.getElementById("current-month").innerText;

    // 클릭한 날짜를 포맷팅 (YYYY-MM-DD)
    const [year, month] = currentMonthYear.split("년 ");
    const formattedClickedDate = `${year}-${String(
      month.replace("월", "").trim()
    ).padStart(2, "0")}-${String(clickedDate).padStart(2, "0")}`;

    // 선택한 날짜의 기록 갱신
    updateRecords(formattedClickedDate);
  });
}

// 초기화: 오늘 날짜로 기록 표시
updateRecords();

// 달력 클릭 이벤트 설정
setupCalendarClickHandler();

// 근무 시간 계산 함수
function calculateWorkTime(startTime, endTime) {
  if (startTime === null || endTime === null) {
    console.error("시작 또는 종료 시간이 null입니다.");
    return { hours: 0, minutes: 0 };
  }

  const lunchStart = parseTime("11:30");
  const lunchEnd = parseTime("13:00");

  let workTime = calculateTotalMinutes(startTime, endTime);

  // 점심시간 제외
  if (startTime < lunchEnd && endTime > lunchStart) {
    const overlapStart = Math.max(startTime, lunchStart);
    const overlapEnd = Math.min(endTime, lunchEnd);
    workTime -= calculateTotalMinutes(overlapStart, overlapEnd);
  }

  const hours = Math.floor(workTime / 60);
  const minutes = workTime % 60;
  return { hours, minutes };
}

// 시간 문자열을 분 단위로 변환
function parseTime(timeString) {
  if (!timeString || typeof timeString !== "string") {
    console.error("유효하지 않은 시간 문자열:", timeString);
    return NaN;
  }

  // "오전" 또는 "오후"가 포함된 경우 처리
  const periodMatch = timeString.match(/(오전|오후)/);
  if (periodMatch) {
    const period = periodMatch[1];
    const [hour, minute, second] = timeString.replace(/오전|오후/, "").trim().split(":").map(Number);

    if (isNaN(hour) || isNaN(minute)) {
      console.error("시간 파싱 실패:", timeString);
      return NaN;
    }

    let adjustedHour = hour;
    if (period === "오후" && hour < 12) {
      adjustedHour += 12; // 오후: 12시간 추가
    } else if (period === "오전" && hour === 12) {
      adjustedHour = 0; // 오전 12시는 0시로 변환
    }

    return adjustedHour * 60 + minute; // 분 단위로 변환
  }

  // 24시간 형식 처리
  const [hour, minute] = timeString.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) {
    console.error("시간 파싱 실패:", timeString);
    return NaN;
  }

  return hour * 60 + minute; // 분 단위로 변환
}


// 분 단위 시간 계산
function calculateTotalMinutes(startTime, endTime) {
  return endTime - startTime;
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
      if (dayRecord.start?.length) {
        dayRecord.start.forEach((start) => {
          const markerStart = document.createElement("div");
          markerStart.classList.add("marker", "marker-in");
          markerStart.innerText = "출";
          cell.appendChild(markerStart);
        });
      }

      // 퇴근 마커 및 근무 시간 표시
      if (dayRecord.end?.length) {
        dayRecord.end.forEach((end) => {
          const markerEnd = document.createElement("div");
          markerEnd.classList.add("marker", "marker-out");
          markerEnd.innerText = "퇴";
          cell.appendChild(markerEnd);

          const durationBox = document.createElement("div");
          durationBox.classList.add("duration-box");

          const durationMatch = end.duration?.match(/(\d+)시간\s*(\d+)?분?/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1], 10) || 0; // 시간 부분
            const minutes = parseInt(durationMatch[2], 10) || 0; // 분 부분
            const totalHours = hours + minutes / 60;
            durationBox.innerText = totalHours.toFixed(1); // 소수점 첫째 자리까지 표시
          } else {
            durationBox.innerText = "0";
          }

          cell.appendChild(durationBox);
        });
      }

      // 휴가 표시
      if (dayRecord.vacation?.length) {
        dayRecord.vacation.forEach((vac) => {
          const vacationBox = document.createElement("div");
          vacationBox.classList.add("vacation-box");
          const vacationTime = parseFloat(vac.time); // 숫자로 변환
          vacationBox.innerText = vacationTime.toFixed(1); // 소수점 첫째 자리까지 표시
          cell.appendChild(vacationBox);
        });
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

//로그인 참고
// 회원가입 함수
// document.getElementById("signup-btn").addEventListener("click", async () => {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     console.log("회원가입 성공:", userCredential.user);
//     alert("회원가입이 완료되었습니다!");
//   } catch (error) {
//     console.error("회원가입 실패:", error.message);
//     alert(`회원가입 실패: ${error.message}`);
//   }
// });

// // 로그인 함수
// document.getElementById("login-btn").addEventListener("click", async () => {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;

//   try {
//     const userCredential = await signInWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     console.log("로그인 성공:", userCredential.user);
//     alert("로그인 성공!");
//     document.getElementById("logout-btn").style.display = "block"; // 로그아웃 버튼 표시
//   } catch (error) {
//     console.error("로그인 실패:", error.message);
//     alert(`로그인 실패: ${error.message}`);
//   }
// });

// // 로그아웃 함수
// document.getElementById("logout-btn").addEventListener("click", async () => {
//   try {
//     await signOut(auth);
//     console.log("로그아웃 성공");
//     alert("로그아웃 되었습니다.");
//     document.getElementById("logout-btn").style.display = "none"; // 로그아웃 버튼 숨기기
//   } catch (error) {
//     console.error("로그아웃 실패:", error.message);
//     alert(`로그아웃 실패: ${error.message}`);
//   }
// });
