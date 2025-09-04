// weekly-calendar.js
// 주간 캘린더 관리 및 데이터 표시 (2025년 1월 31일 16:40 생성됨)

// 주간 캘린더 관련 전역 변수
let currentSunday = null;

// 캘린더 DOM 요소들 (2025년 1월 31일 17:40 수정됨)
let workDurationElement,
  weeklyTable,
  progressBar,
  remainingBar,
  workTimeElement;

// DOM 요소들을 초기화 시점에 찾기
function findDOMElements() {
  console.log("🔍 [WEEKLY-CALENDAR] DOM 요소들 검색 중...");

  // 다양한 선택자로 시도
  workDurationElement = document.querySelector(
    ".workDuration div:nth-child(2)"
  );

  // weeklyTable에 대해 여러 선택자 시도
  weeklyTable =
    document.querySelector(".weeklyTable") ||
    document.querySelector(".weekly-table") ||
    document.querySelector("#weeklyTable") ||
    document.querySelector("#weekly-table") ||
    document.querySelector("[class*='weekly']") ||
    document.querySelector("[class*='calendar']");

  progressBar = document.querySelector(".workProgressBar .completed");
  remainingBar = document.querySelector(".workProgressBar .remaining");
  workTimeElement = document.querySelector(
    ".workTimeTableContainer .hours .workTime"
  );

  // 모든 가능한 주간 관련 요소들 출력
  console.log("🔍 [WEEKLY-CALENDAR] 모든 주간 관련 요소들:");
  console.log("- .weeklyTable:", document.querySelector(".weeklyTable"));
  console.log("- .weekly-table:", document.querySelector(".weekly-table"));
  console.log("- #weeklyTable:", document.querySelector("#weeklyTable"));
  console.log("- #weekly-table:", document.querySelector("#weekly-table"));

  // 모든 클래스에 'weekly'가 포함된 요소들 찾기
  const weeklyElements = document.querySelectorAll("[class*='weekly']");
  console.log("- weekly 포함 요소들:", weeklyElements.length, "개");
  weeklyElements.forEach((el, index) => {
    console.log(`  ${index}: ${el.className}`);
  });

  // 모든 클래스에 'calendar'가 포함된 요소들 찾기
  const calendarElements = document.querySelectorAll("[class*='calendar']");
  console.log("- calendar 포함 요소들:", calendarElements.length, "개");
  calendarElements.forEach((el, index) => {
    console.log(`  ${index}: ${el.className}`);
  });

  return {
    workDurationElement,
    weeklyTable,
    progressBar,
    remainingBar,
    workTimeElement,
  };
}

// Firebase 준비 완료 후 주간 캘린더 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeWeeklyCalendar();
});

// 주간 캘린더 시스템 초기화 (2025년 1월 31일 17:40 수정됨)
function initializeWeeklyCalendar() {
  console.log("🗓️ [WEEKLY-CALENDAR] 초기화 시작...");

  // DOM 요소들 찾기
  const elements = findDOMElements();
  workDurationElement = elements.workDurationElement;
  weeklyTable = elements.weeklyTable;
  progressBar = elements.progressBar;
  remainingBar = elements.remainingBar;
  workTimeElement = elements.workTimeElement;

  // DOM 요소 확인
  console.log("🔍 [WEEKLY-CALENDAR] DOM 요소 확인:");
  console.log(
    "- workDurationElement:",
    workDurationElement ? "존재" : "❌ 없음"
  );
  console.log("- weeklyTable:", weeklyTable ? "존재" : "❌ 없음");
  console.log("- progressBar:", progressBar ? "존재" : "❌ 없음");
  console.log("- remainingBar:", remainingBar ? "존재" : "❌ 없음");
  console.log("- workTimeElement:", workTimeElement ? "존재" : "❌ 없음");

  if (!weeklyTable) {
    console.error("❌ [WEEKLY-CALENDAR] weeklyTable을 찾을 수 없습니다.");
    console.log("🔍 [WEEKLY-CALENDAR] 페이지의 모든 요소들을 확인해보세요:");

    // 페이지의 모든 div 요소들 확인
    const allDivs = document.querySelectorAll("div");
    console.log(
      `📊 [WEEKLY-CALENDAR] 총 ${allDivs.length}개의 div 요소가 있습니다.`
    );

    // 상위 10개 div의 클래스명 출력
    for (let i = 0; i < Math.min(10, allDivs.length); i++) {
      const div = allDivs[i];
      console.log(`  div[${i}]: className="${div.className}", id="${div.id}"`);
    }

    // table 요소들도 확인
    const allTables = document.querySelectorAll("table");
    console.log(
      `📊 [WEEKLY-CALENDAR] 총 ${allTables.length}개의 table 요소가 있습니다.`
    );
    allTables.forEach((table, index) => {
      console.log(
        `  table[${index}]: className="${table.className}", id="${table.id}"`
      );
    });

    console.warn("⚠️ [WEEKLY-CALENDAR] weeklyTable 없이 부분 초기화 진행...");
  }

  // 주간 달력 초기화 (일요일 시작)
  currentSunday = getSunday(new Date()); // 오늘 기준으로 이번 주 일요일 계산
  console.log("📅 [WEEKLY-CALENDAR] currentSunday 설정:", currentSunday);

  if (weeklyTable && workDurationElement) {
    updateWeekDates();
    loadWeeklyData();
  } else {
    console.warn(
      "⚠️ [WEEKLY-CALENDAR] 필수 요소가 없어 updateWeekDates/loadWeeklyData 건너뜀"
    );
  }

  // 주간 캘린더 좌우 버튼 이벤트
  const leftButton = document.querySelector(".workDuration div:first-child");
  const rightButton = document.querySelector(".workDuration div:last-child");

  console.log("🔍 [WEEKLY-CALENDAR] 버튼 요소 확인:");
  console.log("- leftButton:", leftButton ? "존재" : "❌ 없음");
  console.log("- rightButton:", rightButton ? "존재" : "❌ 없음");

  if (leftButton) {
    leftButton.addEventListener("click", () => {
      console.log("⬅️ [WEEKLY-CALENDAR] 이전 주 버튼 클릭");
      if (currentSunday && weeklyTable) {
        currentSunday.setDate(currentSunday.getDate() - 7);
        updateWeekDates();
        loadWeeklyData();
      }
    });
  }

  if (rightButton) {
    rightButton.addEventListener("click", () => {
      console.log("➡️ [WEEKLY-CALENDAR] 다음 주 버튼 클릭");
      if (currentSunday && weeklyTable) {
        currentSunday.setDate(currentSunday.getDate() + 7);
        updateWeekDates();
        loadWeeklyData();
      }
    });
  }

  // 주간 테이블 날짜 클릭 시 historyList 갱신
  if (weeklyTable) {
    weeklyTable.addEventListener("click", (event) => {
      console.log("📅 [WEEKLY-CALENDAR] 테이블 클릭 이벤트 발생");

      const dayElement = event.target.closest(".day");
      if (!dayElement) {
        console.log("🚫 [WEEKLY-CALENDAR] .day 요소가 아님");
        return;
      }

      const dayElements = Array.from(weeklyTable.querySelectorAll(".day"));
      const index = dayElements.indexOf(dayElement);

      console.log("🔢 [WEEKLY-CALENDAR] 클릭된 날짜 인덱스:", index);

      if (index === -1) return;

      const dateObj = new Date(currentSunday.getTime());
      dateObj.setDate(currentSunday.getDate() + index);

      const formattedDate = formatDate(dateObj);
      console.log("📅 [WEEKLY-CALENDAR] 선택된 날짜:", formattedDate);

      // updateHistoryList 함수 호출
      if (typeof updateHistoryList === "function") {
        console.log("✅ [WEEKLY-CALENDAR] updateHistoryList 전역 함수 호출");
        updateHistoryList(formattedDate);
      } else if (
        window.WorkHistoryModule &&
        typeof window.WorkHistoryModule.updateHistoryList === "function"
      ) {
        console.log("✅ [WEEKLY-CALENDAR] updateHistoryList 모듈 함수 호출");
        window.WorkHistoryModule.updateHistoryList(formattedDate);
      } else {
        console.error(
          "❌ [WEEKLY-CALENDAR] updateHistoryList 함수를 찾을 수 없습니다."
        );
        console.log("🔍 [WEEKLY-CALENDAR] 함수 확인:");
        console.log("- typeof updateHistoryList:", typeof updateHistoryList);
        console.log("- window.WorkHistoryModule:", window.WorkHistoryModule);
      }
    });

    console.log("✅ [WEEKLY-CALENDAR] 테이블 클릭 이벤트 등록 완료");
  } else {
    console.warn(
      "⚠️ [WEEKLY-CALENDAR] weeklyTable이 없어 클릭 이벤트 등록 불가"
    );
  }

  console.log("🎯 [WEEKLY-CALENDAR] 초기화 완료!");
}

// 일요일을 기준으로 주간 날짜 생성하는 함수 (2025년 1월 31일 16:40 수정됨)
function getSunday(date) {
  const day = date.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const diff = date.getDate() - day; // 일요일까지의 차이 계산
  return new Date(date.setDate(diff));
}

// 날짜 포맷 함수 (2025년 1월 31일 16:40 생성됨)
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 주간 날짜 업데이트 함수 (2025년 1월 31일 17:40 수정됨)
function updateWeekDates() {
  console.log("📅 [WEEKLY-CALENDAR] updateWeekDates 시작...");

  if (!workDurationElement || !weeklyTable) {
    console.warn("⚠️ [WEEKLY-CALENDAR] 필수 DOM 요소가 없습니다:");
    console.log(
      "- workDurationElement:",
      workDurationElement ? "존재" : "❌ 없음"
    );
    console.log("- weeklyTable:", weeklyTable ? "존재" : "❌ 없음");
    return;
  }

  // 일요일부터 토요일까지 계산
  const saturday = new Date(currentSunday);
  saturday.setDate(currentSunday.getDate() + 6);

  workDurationElement.textContent = `${formatDate(
    currentSunday
  )} ~ ${formatDate(saturday)}`;
  console.log(
    "📅 [WEEKLY-CALENDAR] 주간 범위:",
    `${formatDate(currentSunday)} ~ ${formatDate(saturday)}`
  );

  // 주간 테이블 업데이트 (일요일부터 토요일까지)
  const days = [...Array(7).keys()].map((offset) => {
    const date = new Date(currentSunday);
    date.setDate(currentSunday.getDate() + offset);
    return date;
  });

  // 요일 배열도 일요일 시작으로 변경
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const weeklyHTML = days
    .map((date, index) => {
      const dayName = dayNames[date.getDay()];
      const isToday = date.toDateString() === new Date().toDateString();
      const formattedDate = formatDate(date);
      
      // 일요일(index 0)과 토요일(index 6) 클래스 적용
      let dayClass = "";
      if (index === 0) dayClass = "sunday";
      else if (index === 6) dayClass = "saturday";

      // 공휴일 확인 및 클래스 추가 (2025년 8월 5일 18:00 추가됨)
      const isHolidayDate = window.isHoliday && window.isHoliday(formattedDate);
      if (isHolidayDate) {
        dayClass += " holiday";
      }

      return `
        <div class="day ${dayClass}">
          <span class="date">${date.getDate()}</span>
          <span class="weekday ${isToday ? "today" : ""}">${
        isToday ? "오늘" : dayName
      }</span>
          <span class="time">-</span>
          <span class="duration">-</span>
          <span class="status">-</span>
          <span class="vacation-Info">-</span>
        </div>
      `;
    })
    .join("");

  weeklyTable.innerHTML = weeklyHTML;
  console.log("✅ [WEEKLY-CALENDAR] 주간 테이블 HTML 업데이트 완료");
}

// duration 문자열을 분(minutes) 단위로 변환하는 헬퍼 함수 (2025년 1월 31일 16:40 수정됨)
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

// 분을 시간 문자열로 변환하는 함수 (2025년 1월 31일 16:40 수정됨)
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

// Firestore 데이터 로드 및 UI 업데이트 (2025년 1월 31일 16:40 수정됨)
async function loadWeeklyData() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userEmail = user.email;
  const recordRef = db.collection("records").doc(userEmail).collection("dates");

  // 일요일부터 토요일까지의 7일간 데이터 로드
  const days = [...Array(7).keys()].map((offset) => {
    const date = new Date(currentSunday);
    date.setDate(currentSunday.getDate() + offset);
    return date;
  });

  let totalDuration = 0;
  let totalVacation = 0;

  if (!weeklyTable) {
    console.warn("weeklyTable 요소를 찾을 수 없습니다.");
    return;
  }

  for (let i = 0; i < days.length; i++) {
    const dateStr = formatDate(days[i]);
    const dayElement = weeklyTable.children[i];

    if (!dayElement) continue;

    const timeElement = dayElement.querySelector(".time");
    const durationElement = dayElement.querySelector(".duration");
    const statusElement = dayElement.querySelector(".status");
    const vacationInfoElement = dayElement.querySelector(".vacation-Info");

    try {
      const doc = await recordRef.doc(dateStr).get();
      if (doc.exists) {
        const data = doc.data();

        // 출퇴근 시간
        const startTime = data.start?.[0]?.time
          ? convertTo24Hour(data.start[0].time)
          : "-";

        let endTime = "-";
        let latestDurationInMinutes = 0;

        if (Array.isArray(data.end) && data.end.length > 0) {
          const sortedEnd = data.end.sort(
            (a, b) =>
              new Date(`1970/01/01 ${convertTo24Hour(a.time)}`) -
              new Date(`1970/01/01 ${convertTo24Hour(b.time)}`)
          );
          const latestEnd = sortedEnd[sortedEnd.length - 1];

          endTime = latestEnd?.time ? convertTo24Hour(latestEnd.time) : "-";
          latestDurationInMinutes = latestEnd?.duration
            ? parseDurationStringToMinutes(latestEnd.duration)
            : 0;
        }

        // 휴가 시간 계산
        if (Array.isArray(data.vacation) && data.vacation.length > 0) {
          totalVacation += calculateVacationWithLunchExcluded(data.vacation);
        }

        if (timeElement) {
          timeElement.innerHTML = `${startTime}<br />${endTime}`;
        }

        if (durationElement) {
          durationElement.textContent =
            latestDurationInMinutes > 0 ? `${latestDurationInMinutes}` : "-";
        }

        // 근무 상태
        const allEntries = [
          ...(data.start || []),
          ...(data.gps || []),
          ...(data.end || []),
        ];
        const latestEntry = allEntries
          .filter((entry) => entry.memo?.work)
          .sort(
            (a, b) =>
              new Date(`1970/01/01 ${convertTo24Hour(a.time)}`) -
              new Date(`1970/01/01 ${convertTo24Hour(b.time)}`)
          )
          .pop();
        const workStatus = latestEntry?.memo?.work || "-";

        if (statusElement) {
          statusElement.textContent = workStatus;
        }

        // 연차/반휴/보휴 표시
        if (vacationInfoElement && data.vacation?.length > 0) {
          const types = data.vacation.map((v) => {
            if (v.type === "보상휴가")
              return `<span class="type-bh">보휴</span>`;
            if (v.type === "오전반휴" || v.type === "오후반휴")
              return `<span class="type-rh">반휴</span>`;
            if (v.type === "종일연차")
              return `<span class="type-yc">연차</span>`;
            return `<span>-</span>`;
          });

          vacationInfoElement.innerHTML = [...new Set(types)].join(",");
        } else if (vacationInfoElement) {
          vacationInfoElement.textContent = "-";
        }

        totalDuration += latestDurationInMinutes;
      } else {
        if (timeElement) timeElement.innerHTML = "-<br />-";
        if (durationElement) durationElement.textContent = "-";
        if (statusElement) statusElement.textContent = "-";
        if (vacationInfoElement) vacationInfoElement.textContent = "-";
      }
    } catch (error) {
      console.error(`Error fetching data for ${dateStr}:`, error);
      if (durationElement) durationElement.textContent = "-";
      if (vacationInfoElement) vacationInfoElement.textContent = "-";
    }
  }

  // 진행바 업데이트 (좌측 67% 구간 5등분 눈금 추가) - 2025년 8월 7일 수정됨
  if (progressBar && remainingBar) {
    const progressPercentage = Math.min((totalDuration / (52 * 60)) * 100, 100);
    const remainingPercentage = Math.max(
      ((52 * 60 - totalDuration) / (52 * 60)) * 100,
      0
    );
    
    // 기존 진행바 업데이트
    progressBar.style.width = `${progressPercentage}%`;
    remainingBar.style.width = `${remainingPercentage}%`;

    progressBar.style.backgroundColor =
      progressPercentage < 67.3
        ? "#5B7CD1"
        : progressPercentage < 100
        ? "#4CAF50"
        : "#E53935";

    // 좌측 67% 구간을 5등분하는 눈금 추가 (2025년 8월 7일 추가됨)
    const progressBarContainer = progressBar.parentElement;
    
    // 기존 눈금 제거
    const existingTicks = progressBarContainer.querySelectorAll('.left-progress-tick');
    existingTicks.forEach(tick => tick.remove());
    
    // 좌측 67% 구간을 5등분 (67% ÷ 5 = 13.4%씩)
    for (let i = 1; i <= 4; i++) {
      const tickPosition = (67 / 5) * i; // 13.4%, 26.8%, 40.2%, 53.6%
      const tick = document.createElement('div');
      tick.className = 'left-progress-tick';
      tick.style.cssText = `
        position: absolute;
        left: ${tickPosition}%;
        top: 0;
        bottom: 0;
        width: 1px;
        background-color: rgba(255, 255, 255, 0.4);
        z-index: 2;
        pointer-events: none;
      `;
      
      // 진행바 컨테이너에 relative position 추가
      if (progressBarContainer.style.position !== 'relative') {
        progressBarContainer.style.position = 'relative';
      }
      
      progressBarContainer.appendChild(tick);
    }
  }

  const totalVacationHours = Math.floor(totalVacation / 60);
  const totalVacationMinutes = totalVacation % 60;

  if (workTimeElement) {
    workTimeElement.innerHTML =
      `${formatMinutesToDurationString(totalDuration)}` +
      (totalVacation > 0
        ? ` <span style="color:#5B7CD1;">+${formatMinutesToDurationString(
            totalVacation
          )}</span>`
        : "");
  }
}

// 점심 시간 제외 휴가 시간 계산 (2025년 1월 31일 16:40 수정됨)
function calculateVacationWithLunchExcluded(vacationTimes = []) {
  let totalSeconds = 0;

  const lunchStart = 11 * 3600 + 30 * 60; // 11:30
  const lunchEnd = 13 * 3600; // 13:00

  vacationTimes.forEach(({ start, end }) => {
    const startSec = parseTime(start);
    const endSec = parseTime(end);

    if (isNaN(startSec) || isNaN(endSec) || endSec <= startSec) return;

    let vacationDuration = endSec - startSec;

    // 점심시간과 겹치는 경우 제외
    const overlapStart = Math.max(startSec, lunchStart);
    const overlapEnd = Math.min(endSec, lunchEnd);

    if (overlapStart < overlapEnd) {
      const overlapDuration = overlapEnd - overlapStart;
      vacationDuration -= overlapDuration;
    }

    totalSeconds += vacationDuration;
  });

  return Math.floor(totalSeconds / 60); // 분 단위 반환
}

// duration 문자열을 "분" 단위 숫자로 변환하는 함수 (2025년 1월 31일 16:40 수정됨)
function convertDurationToMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return 0;

  const match = durationStr.match(/(\d+)시간\s*(\d+)?분?/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  return hours * 60 + minutes;
}

// 오전/오후 시간을 24시간 형식으로 변환 (2025년 1월 31일 16:40 수정됨)
function convertTo24Hour(time) {
  const match = time.match(/(오전|오후)?\s?(\d{1,2}):(\d{2})/);
  if (!match) return "-";

  let [, period, hour, minute] = match;
  hour = parseInt(hour, 10);
  if (period === "오후" && hour !== 12) hour += 12;
  if (period === "오전" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

// 날짜 형식을 YYYY-MM-DD로 변환하는 함수 (2025년 1월 31일 16:40 수정됨)
function formatDateFromDay(day) {
  const currentYear = new Date().getFullYear();
  const currentMonth = currentSunday.getMonth() + 1;
  return `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

// 선택된 날짜 표시 업데이트 함수 (2025년 1월 31일 16:40 수정됨)
function updateSelectedDateDisplay(dateStr) {
  const selectedDateElement = document.getElementById("selectedDateDisplay");
  if (!selectedDateElement) return;

  const today = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(today.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split("T")[0];

  if (dateStr === todayStr) {
    selectedDateElement.textContent = "오늘";
    selectedDateElement.style.color = "#1976d2";
  } else {
    // YYYY-MM-DD 형식을 MM.DD 형식으로 변환
    const [year, month, day] = dateStr.split("-");
    selectedDateElement.textContent = `${month}.${day}`;
    selectedDateElement.style.color = "#666";
  }
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 17:30 수정됨)
window.WeeklyCalendarModule = {
  getSunday,
  formatDate,
  updateWeekDates,
  loadWeeklyData,
  updateSelectedDateDisplay,
  convertTo24Hour,
  parseDurationStringToMinutes,
  formatMinutesToDurationString,
};

// 전역 함수로도 접근 가능하게 설정
window.updateSelectedDateDisplay = updateSelectedDateDisplay;
window.updateWeekDates = updateWeekDates;
window.loadWeeklyData = loadWeeklyData;
