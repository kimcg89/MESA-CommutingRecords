// alarm.js
// 알림 및 진동 기능 관리 (2025년 1월 31일 16:55 생성됨)

// 알림 관련 전역 변수
const alarmTimes = ["09:15:00", "09:25:00"]; // 알람 시간 설정
const checkAlarmInterval = 1000; // 1초 간격으로 알람 확인
let alarmEnabled = true; // 알람 상태

// Firebase 준비 완료 후 알림 시스템 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeAlarm();
});

// DOM 로드 후 알림 시스템 초기화 (2025년 1월 31일 16:55 생성됨)
document.addEventListener("DOMContentLoaded", () => {
  const alarmButton = document.getElementById("alarm-button");
  if (!alarmButton) {
    console.error("알람 버튼이 존재하지 않습니다.");
    return;
  }

  // 알람 버튼 초기화
  alarmButton.innerText = "On";
  alarmButton.style.backgroundColor = "red";

  // 알람 버튼 상태 전환 이벤트
  alarmButton.addEventListener("click", () => {
    alarmEnabled = !alarmEnabled;
    alarmButton.innerText = alarmEnabled ? "On" : "Off";
    alarmButton.style.backgroundColor = alarmEnabled ? "red" : "gray";
  });

  // 알림 권한 요청
  requestNotificationPermission();

  // 주기적으로 알람 확인
  setInterval(checkAlarms, checkAlarmInterval);
});

// 알림 시스템 초기화 (2025년 1월 31일 16:55 생성됨)
function initializeAlarm() {
  console.log('알림 시스템 초기화 완료');
  
  // Firebase 인증 상태 변화 시 알람 상태 업데이트
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        await updateAlarmStatus(user);
      }
    });
  }
}

// 알림 권한 요청 (2025년 1월 31일 16:55 수정됨)
function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("알림 권한 허용됨.");
      } else {
        console.log("알림 권한 거부됨.");
      }
    });
  }
}

// 알람 확인 함수 (2025년 1월 31일 16:55 수정됨)
function checkAlarms() {
  if (!alarmEnabled) return; // 알람 비활성화 시 종료

  // 현재 로컬 시간을 가져옵니다
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // 현재 시간 (HH:mm:ss)
  const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD 형식
  const dayOfWeek = now.getDay(); // 로컬 시간 기준 요일 계산 (0: 일요일, 6: 토요일)

  // 주말 확인
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // console.log("한국 시간 기준 주말에는 알람이 울리지 않습니다.");
    return;
  }

  // 공휴일 확인 (work-history.js의 isHoliday 함수 사용)
  let isHolidayToday = false;
  if (typeof isHoliday === 'function') {
    isHolidayToday = isHoliday(currentDate);
  } else if (window.WorkHistoryModule && typeof window.WorkHistoryModule.isHoliday === 'function') {
    isHolidayToday = window.WorkHistoryModule.isHoliday(currentDate);
  }

  if (isHolidayToday) {
    // console.log("한국 시간 기준 공휴일에는 알람이 울리지 않습니다.");
    return;
  }

  // 설정된 알람 시간과 일치할 경우
  if (alarmTimes.includes(currentTime)) {
    triggerAlarmWithVibration(`현재 시각: ${currentTime}`);
  }

  // 09:30 알림 - 출근 기록 없을 경우
  if (currentTime === "09:30:00") {
    checkNoRecordAlarm();
  }
}

// 모달창과 진동 트리거 함수 (2025년 1월 31일 16:55 수정됨)
function triggerAlarmWithVibration(message) {
  // 모달 표시
  if (typeof showModal === 'function') {
    showModal(message, false);
  } else if (typeof showNoticeModal === 'function') {
    showNoticeModal(message);
  } else {
    alert(message);
  }

  // 진동 실행
  if (typeof Android !== "undefined" && Android.triggerVibration) {
    Android.triggerVibration(1000); // Android 네이티브 진동 (1초)
  } else if ("vibrate" in navigator) {
    navigator.vibrate(3000); // 브라우저 진동 API (3초)
    console.log("진동 발생 (3초)");
  } else {
    console.log("진동 기능을 지원하지 않는 환경입니다.");
  }
}

// 출근 기록 확인 함수 (2025년 1월 31일 16:55 수정됨)
async function checkNoRecordAlarm() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);

  const recordDate = kstDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    if (!doc.exists || !doc.data().start || doc.data().start.length === 0) {
      // 출근 기록이 없을 때
      triggerAlarmWithVibration("출근 기록이 없습니다!");
    }
  } catch (error) {
    console.error("출근 기록 확인 중 오류:", error);
  }
}

// 출근 데이터 확인 후 알람 Off 처리 (2025년 1월 31일 16:55 수정됨)
async function updateAlarmStatus(user) {
  if (!user || !user.email) {
    console.error("사용자 정보가 유효하지 않습니다.");
    return;
  }

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);

  const recordDate = kstDate.toISOString().split("T")[0];
  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    if (doc.exists && doc.data().start?.length > 0) {
      console.log("출근 데이터가 존재합니다. 알람을 Off로 설정합니다.");
      const alarmButton = document.getElementById("alarm-button");
      if (alarmButton) {
        alarmEnabled = false;
        alarmButton.innerText = "Off";
        alarmButton.style.backgroundColor = "gray";
      }
    }
  } catch (error) {
    console.error("출근 데이터 확인 중 오류:", error);
  }
}

// 알람 상태 수동 설정 함수 (2025년 1월 31일 16:55 생성됨)
function setAlarmEnabled(enabled) {
  alarmEnabled = enabled;
  const alarmButton = document.getElementById("alarm-button");
  if (alarmButton) {
    alarmButton.innerText = enabled ? "On" : "Off";
    alarmButton.style.backgroundColor = enabled ? "red" : "gray";
  }
}

// 알람 시간 추가 함수 (2025년 1월 31일 16:55 생성됨)
function addAlarmTime(timeString) {
  if (!alarmTimes.includes(timeString)) {
    alarmTimes.push(timeString);
    console.log(`알람 시간 추가됨: ${timeString}`);
  }
}

// 알람 시간 제거 함수 (2025년 1월 31일 16:55 생성됨)
function removeAlarmTime(timeString) {
  const index = alarmTimes.indexOf(timeString);
  if (index > -1) {
    alarmTimes.splice(index, 1);
    console.log(`알람 시간 제거됨: ${timeString}`);
  }
}

// 현재 알람 설정 조회 함수 (2025년 1월 31일 16:55 생성됨)
function getAlarmSettings() {
  return {
    enabled: alarmEnabled,
    times: [...alarmTimes],
    interval: checkAlarmInterval
  };
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 16:55 생성됨)
window.AlarmModule = {
  setAlarmEnabled,
  addAlarmTime,
  removeAlarmTime,
  getAlarmSettings,
  triggerAlarmWithVibration,
  requestNotificationPermission,
  updateAlarmStatus
};