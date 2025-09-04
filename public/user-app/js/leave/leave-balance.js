// leave-balance.js
// 연차 및 보상휴가 잔량 관리 - 변경 로그 기능 추가 (2025년 8월 12일 수정됨)
// 새로운 근무시간 계산 및 15분 단위 보상휴가 로직 적용 (2025년 8월 14일 수정됨)

// Firebase 준비 완료 후 잔량 관리 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeLeaveBalance();
});

// 잔량 관리 시스템 초기화
function initializeLeaveBalance() {
  console.log('잔량 관리 시스템 초기화 완료');
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

// 근무시간에서 제외할 시간 구간 설정 (2025년 8월 14일 추가됨)
const EXCLUDED_TIME_PERIODS_LEAVE = [
  { start: "09:15", end: "09:30" }, // 출근 준비시간
  { start: "11:30", end: "13:00" }, // 점심시간
  { start: "18:00", end: "18:15" }  // 퇴근 정리시간
];

// 근무시간 계산 함수 - 제외 시간 구간 적용 (2025년 8월 14일 추가됨)
function calculateWorkTimeForLeave(startTimeInSeconds, endTimeInSeconds, vacationTimes = []) {
  if (isNaN(startTimeInSeconds) || isNaN(endTimeInSeconds) || endTimeInSeconds <= startTimeInSeconds) {
    console.error("유효하지 않은 시작 시간 또는 종료 시간입니다.");
    return null;
  }

  let totalWorkSeconds = endTimeInSeconds - startTimeInSeconds;

  // 제외할 시간 구간들을 근무시간에서 차감 (2025년 8월 14일 추가됨)
  EXCLUDED_TIME_PERIODS_LEAVE.forEach(period => {
    const excludeStartSeconds = parseTime(period.start);
    const excludeEndSeconds = parseTime(period.end);
    
    if (!isNaN(excludeStartSeconds) && !isNaN(excludeEndSeconds)) {
      // 근무시간과 제외시간의 겹치는 구간 계산
      const overlapStart = Math.max(startTimeInSeconds, excludeStartSeconds);
      const overlapEnd = Math.min(endTimeInSeconds, excludeEndSeconds);
      
      if (overlapStart < overlapEnd) {
        const excludedSeconds = overlapEnd - overlapStart;
        totalWorkSeconds -= excludedSeconds;
        console.log(`⏰ 제외 시간 적용: ${period.start}~${period.end} (${(excludedSeconds/60).toFixed(0)}분 차감)`);
      }
    }
  });

  // 휴가 시간 차감 (기존 로직 유지)
  if (Array.isArray(vacationTimes)) {
    vacationTimes.forEach(vacation => {
      const vacationStartSeconds = parseTime(vacation.start);
      const vacationEndSeconds = parseTime(vacation.end);
      
      if (!isNaN(vacationStartSeconds) && !isNaN(vacationEndSeconds)) {
        const overlapStart = Math.max(startTimeInSeconds, vacationStartSeconds);
        const overlapEnd = Math.min(endTimeInSeconds, vacationEndSeconds);
        
        if (overlapStart < overlapEnd) {
          totalWorkSeconds -= (overlapEnd - overlapStart);
        }
      }
    });
  }

  const hours = Math.floor(totalWorkSeconds / 3600);
  const minutes = Math.floor((totalWorkSeconds % 3600) / 60);

  return { hours, minutes, totalSeconds: totalWorkSeconds };
}

// 보상휴가 자동 계산 및 증가 함수 - 새로운 로직 적용 (2025년 8월 14일 수정됨)
async function calculateAndAddCompensatoryLeave(
  userEmail,
  startTimeStr,
  endTimeDate,
  vacationTimes
) {
  try {
    if (!startTimeStr) {
      console.warn("출근 시간이 없어 보상휴가를 계산할 수 없습니다.");
      return;
    }

    // 시간을 초 단위로 변환
    const startTimeInSeconds = parseTime(startTimeStr);
    const endTimeInSeconds = parseTime(endTimeDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit", 
      second: "2-digit",
    }));

    if (isNaN(startTimeInSeconds) || isNaN(endTimeInSeconds)) {
      console.error("보상휴가 계산: 유효하지 않은 시간 형식");
      return;
    }

    // 새로운 근무시간 계산 (제외 시간 구간 적용) (2025년 8월 14일 수정됨)
    const workDuration = calculateWorkTimeForLeave(startTimeInSeconds, endTimeInSeconds, vacationTimes);
    
    if (!workDuration) {
      console.error("근무시간 계산 실패");
      return;
    }

    const workTimeSeconds = workDuration.totalSeconds;
    const standardWorkSeconds = 7 * 3600; // 7시간 = 25200초 (2025년 8월 14일 수정됨)

    // 7시간 초과 근무시간만 보상휴가로 적립 (2025년 8월 14일 수정됨)
    const overtimeSeconds = Math.max(0, workTimeSeconds - standardWorkSeconds);
    
    if (overtimeSeconds <= 0) {
      console.log("📊 보상휴가 적립 없음: 7시간 이하 근무");
      return;
    }

    // 15분 단위로 반올림 (2025년 8월 14일 수정됨)
    // 900초 = 15분, Math.floor로 15분 미만 버림
    const compensatoryMinutes = Math.floor(overtimeSeconds / 900) * 15;
    
    if (compensatoryMinutes <= 0) {
      console.log("📊 보상휴가 적립 없음: 15분 미만 초과근무");
      return;
    }

    const compensatoryHours = compensatoryMinutes / 60;
    const totalWorkHours = workTimeSeconds / 3600;

    console.log(`⏱️ 총 근무시간: ${totalWorkHours.toFixed(1)}시간, 초과근무: ${(overtimeSeconds/60).toFixed(1)}분 → 보상휴가: ${compensatoryMinutes}분`);

    // Firestore에서 현재 보상휴가 조회 및 업데이트
    const userDocRef = db.collection("records").doc(userEmail);
    const recordDate = endTimeDate.toISOString().split("T")[0];
    const dailyRecordRef = db
      .collection("records")
      .doc(userEmail)
      .collection("dates")
      .doc(recordDate);

    const userDoc = await userDocRef.get();
    const dailyDoc = await dailyRecordRef.get();

    // 현재 총 보상휴가 시간 가져오기
    const currentTotalCompensatoryLeaveStr =
      userDoc.exists &&
      userDoc.data().compensatoryLeave !== undefined &&
      userDoc.data().compensatoryLeave !== null
        ? String(userDoc.data().compensatoryLeave)
        : "0시간";

    let currentTotalCompensatoryHours = 0;
    const totalHoursMatch =
      currentTotalCompensatoryLeaveStr.match(/(\d+\.?\d*)\s*시간/);
    if (totalHoursMatch) {
      currentTotalCompensatoryHours = parseFloat(totalHoursMatch[1]);
    }

    // 오늘 이전에 기록된 일일 보상휴가 시간 가져오기
    let previousDailyCompensatoryHours = 0;
    let isUpdatingExistingRecord = false;
    
    if (
      dailyDoc.exists &&
      dailyDoc.data().dailyCompensatoryLeave !== undefined &&
      dailyDoc.data().dailyCompensatoryLeave !== null
    ) {
      const prevDailyHoursMatch = String(
        dailyDoc.data().dailyCompensatoryLeave
      ).match(/(\d+\.?\d*)\s*시간/);
      if (prevDailyHoursMatch) {
        previousDailyCompensatoryHours = parseFloat(prevDailyHoursMatch[1]);
        // 이미 오늘 보상휴가가 기록되어 있다면 업데이트 상황
        isUpdatingExistingRecord = previousDailyCompensatoryHours > 0;
      }
    }

    // 새로운 총 보상휴가 시간 계산
    const newTotalCompensatoryHours = (
      currentTotalCompensatoryHours -
      previousDailyCompensatoryHours +
      compensatoryHours
    ).toFixed(1);

    // 오늘 날짜의 일일 보상휴가를 새로 계산된 시간으로 업데이트
    const newDailyCompensatoryHoursStr = `${compensatoryHours.toFixed(1)}시간`;

    // 보상휴가 증가 로그 기록 - batch.commit() 전에 먼저 기록
    const logData = {
      type: "compensatory",
      before: `${currentTotalCompensatoryHours.toFixed(1)}시간`,
      after: `${newTotalCompensatoryHours}시간`,
      // 기존 기록 업데이트인 경우 실제 변경분 계산
      change: isUpdatingExistingRecord 
        ? `+${(compensatoryHours - previousDailyCompensatoryHours).toFixed(1)}시간`
        : `+${compensatoryHours.toFixed(1)}시간`,
      reason: isUpdatingExistingRecord ? "초과근무 (기록 수정)" : "초과근무 (15분 단위)",
      details: {
        workDate: recordDate,
        checkIn: startTimeStr,
        checkOut: endTimeDate.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        totalWorkHours: `${totalWorkHours.toFixed(1)}시간`,
        standardHours: "7시간",
        overtimeMinutes: `${(overtimeSeconds/60).toFixed(1)}분`,
        compensatoryMinutes: `${compensatoryMinutes}분`,
        workType: "평일 초과근무",
        calculationMethod: "15분 단위 반올림",
        excludedPeriods: "09:15-09:30, 11:30-13:00, 18:00-18:15",
        // 기존 기록이 있었다면 추가 정보
        ...(isUpdatingExistingRecord && {
          previousDailyHours: `${previousDailyCompensatoryHours.toFixed(1)}시간`,
          actualChange: `${(compensatoryHours - previousDailyCompensatoryHours).toFixed(1)}시간`,
          isUpdate: true
        })
      }
    };
    
    // 로그 먼저 기록
    await recordLeaveHistory(userEmail, logData);

    // 그 다음 batch 실행
    const batch = firebase.firestore().batch();

    // 일일 기록에 dailyCompensatoryLeave 필드 업데이트
    batch.set(
      dailyRecordRef,
      {
        dailyCompensatoryLeave: newDailyCompensatoryHoursStr,
      },
      { merge: true }
    );

    // 메인 사용자 문서의 총 보상휴가 업데이트
    batch.update(userDocRef, {
      compensatoryLeave: `${newTotalCompensatoryHours}시간`,
    });

    await batch.commit();
    
    console.log(`✅ 보상휴가 적립: ${compensatoryHours.toFixed(1)}시간 (총 ${newTotalCompensatoryHours}시간)`);
    
    await updateLeaveBalances(userEmail); // UI 업데이트

  } catch (error) {
    console.error("보상휴가 계산 중 오류:", error);
  }
}

// 보상휴가 차감 함수 - 로그 기록 추가
async function deductCompensatoryLeave(userEmail, deductionHours) {
  try {
    const userDocRef = db.collection("records").doc(userEmail);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn("사용자 문서가 존재하지 않습니다. 보상휴가 차감 불가.");
      return;
    }

    // 현재 보상휴가 시간 가져오기
    const currentCompensatoryLeaveStr =
      userDoc.data().compensatoryLeave !== undefined &&
      userDoc.data().compensatoryLeave !== null
        ? String(userDoc.data().compensatoryLeave)
        : "0시간";

    let currentCompensatoryHours = 0;
    const hoursMatch =
      currentCompensatoryLeaveStr.match(/(\d+(\.\d+)?)\s*시간/);
    if (hoursMatch && hoursMatch[1]) {
      currentCompensatoryHours = parseFloat(hoursMatch[1]);
    }

    // 새로운 보상휴가 시간 계산 (차감)
    const newCompensatoryHours = Math.max(
      0,
      currentCompensatoryHours - deductionHours
    );

    // Firestore 업데이트
    await userDocRef.update({
      compensatoryLeave: `${newCompensatoryHours.toFixed(1)}시간`,
    });

    console.log(
      `🔄 재택 근무로 인한 보상휴가 차감: ${currentCompensatoryHours.toFixed(
        1
      )}시간 → ${newCompensatoryHours.toFixed(
        1
      )}시간 (차감: ${deductionHours.toFixed(1)}시간, 기준: 7시간 초과분)`
    );
    
    // 보상휴가 차감 로그 기록
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const recordDate = kstDate.toISOString().split("T")[0];
    
    const logData = {
      type: "compensatory",
      before: `${currentCompensatoryHours.toFixed(1)}시간`,
      after: `${newCompensatoryHours.toFixed(1)}시간`,
      change: `-${deductionHours.toFixed(1)}시간`,
      reason: "재택근무 보상휴가 차감",
      details: {
        workDate: recordDate,
        deductionReason: "재택근무 7시간 초과분 차감",
        deductedHours: `${deductionHours.toFixed(1)}시간`
      }
    };
    
    await recordLeaveHistory(userEmail, logData);

    // UI 업데이트
    await updateLeaveBalances(userEmail);
  } catch (error) {
    console.error("🚨 보상휴가 차감 중 오류 발생:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("보상휴가 차감 중 오류가 발생했습니다.");
    } else {
      console.error("보상휴가 차감 중 오류가 발생했습니다.");
    }
  }
}

// 사용자 연차 및 보상휴가 잔량 업데이트 함수
async function updateLeaveBalances(userEmail) {
  try {
    const userDocRef = db.collection("records").doc(userEmail);
    const doc = await userDocRef.get();

    if (doc.exists) {
      const data = doc.data();

      // 'annualLeave'는 기존과 동일하게 처리
      const annualLeaveStr =
        data.annualLeave !== undefined && data.annualLeave !== null
          ? String(data.annualLeave)
          : "0일";
      const annualLeave = parseFloat(annualLeaveStr.replace("일", "")) || 0;

      // 'compensatoryLeave'를 문자열에서 숫자로 정확히 파싱
      const compensatoryLeaveStr =
        data.compensatoryLeave !== undefined && data.compensatoryLeave !== null
          ? String(data.compensatoryLeave)
          : "0시간";

      let totalCompensatoryHours = 0;
      // 정규식을 사용하여 숫자 부분만 추출하고 parseFloat로 변환
      const hoursMatch = compensatoryLeaveStr.match(/(\d+(\.\d+)?)\s*시간/);
      if (hoursMatch && hoursMatch[1]) {
        totalCompensatoryHours = parseFloat(hoursMatch[1]); // 소수점까지 정확히 파싱
      }

      // 1일 = 7시간 기준으로 일과 시간 계산
      const hoursPerDay = 7;
      const compensatoryDays = Math.floor(totalCompensatoryHours / hoursPerDay);
      const remainingCompensatoryHours = totalCompensatoryHours % hoursPerDay;

      let compensatoryDisplay = "";
      if (compensatoryDays > 0 && remainingCompensatoryHours > 0) {
        compensatoryDisplay = `${compensatoryDays}일 ${remainingCompensatoryHours.toFixed(
          1
        )}H (${totalCompensatoryHours.toFixed(1)}H)`;
      } else if (compensatoryDays > 0) {
        compensatoryDisplay = `${compensatoryDays}일 (${totalCompensatoryHours.toFixed(
          1
        )}H)`;
      } else if (totalCompensatoryHours > 0) {
        compensatoryDisplay = `${totalCompensatoryHours.toFixed(1)}H`;
      } else {
        compensatoryDisplay = "0H";
      }

      // UI 업데이트
      const annualLeaveElement = document.querySelector("#annualLeave p:last-child");
      const compensatoryLeaveElement = document.querySelector("#compensatoryLeave p:last-child");
      
      if (annualLeaveElement) {
        annualLeaveElement.textContent = `${annualLeave}일`;
      }
      
      if (compensatoryLeaveElement) {
        compensatoryLeaveElement.textContent = compensatoryDisplay;
      }
    } else {
      console.warn("사용자 문서가 존재하지 않습니다:", userEmail);
      
      const annualLeaveElement = document.querySelector("#annualLeave p:last-child");
      const compensatoryLeaveElement = document.querySelector("#compensatoryLeave p:last-child");
      
      if (annualLeaveElement) {
        annualLeaveElement.textContent = "0일";
      }
      
      if (compensatoryLeaveElement) {
        compensatoryLeaveElement.textContent = "0시간";
      }
    }
  } catch (error) {
    console.error("연차 및 보상휴가 잔량 업데이트 중 오류 발생:", error);
    
    const annualLeaveElement = document.querySelector("#annualLeave p:last-child");
    const compensatoryLeaveElement = document.querySelector("#compensatoryLeave p:last-child");
    
    if (annualLeaveElement) {
      annualLeaveElement.textContent = "오류";
    }
    
    if (compensatoryLeaveElement) {
      compensatoryLeaveElement.textContent = "오류";
    }
  }
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 수정됨)
window.LeaveBalanceModule = {
  calculateAndAddCompensatoryLeave,
  deductCompensatoryLeave,
  updateLeaveBalances,
  recordLeaveHistory,
  calculateWorkTimeForLeave,
  EXCLUDED_TIME_PERIODS_LEAVE
};