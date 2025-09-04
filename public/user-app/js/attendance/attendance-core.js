// attendance-core.js (개선된 버전)
// 핵심 출근/퇴근 로직 - 데이터 저장 순서 개선 및 재택근무 5시간 제한 통합 (2025년 8월 14일 수정됨)

// 출근/퇴근 상태 관리 변수
let isClockedIn = false;
let clockInTime = null;

// 임시 데이터 저장용 변수 (모달 선택 대기용) (2025년 8월 14일 추가됨)
let pendingAttendanceData = null;

// 재시도 함수 저장용 변수 (2025년 8월 14일 추가됨)
let retryFunction = null;

// Firebase 준비 완료 후 출근/퇴근 기능 초기화
document.addEventListener("firebaseReady", (event) => {
  initializeAttendanceCore();
});

// 출근/퇴근 시스템 초기화 (2025년 8월 14일 생성됨)
function initializeAttendanceCore() {
  // 출근 버튼 이벤트 리스너
  const startButton = document.getElementById("startBtn");
  if (startButton) {
    startButton.addEventListener("click", handleStartAttendance);
  }

  // 퇴근 버튼 이벤트 리스너
  const endButton = document.getElementById("endBtn");
  if (endButton) {
    endButton.addEventListener("click", handleEndAttendanceClick);
  }
}

// 유틸리티 함수: duration 문자열을 분(minutes) 단위로 변환 (2025년 8월 14일 memo.js에서 이전됨)
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

// 재택근무 5시간 제한 및 보상휴가 차감 처리 함수 (2025년 8월 14일 memo.js에서 이전 및 개선됨)
async function applyRemoteWorkTimeLimit(attendanceRecord, userEmail) {
  if (!attendanceRecord.duration) {
    console.log("📝 duration 정보가 없어 재택근무 시간 제한을 적용하지 않습니다.");
    return { updatedRecord: attendanceRecord, compensatoryDeduction: 0 };
  }

  const durationInMinutes = parseDurationStringToMinutes(attendanceRecord.duration);
  const durationInHours = durationInMinutes / 60;

  console.log(`⏱️ 재택근무 시간 체크: ${durationInHours.toFixed(1)}시간 (${durationInMinutes}분)`);

  let totalCompensatoryDeduction = 0;
  let updatedRecord = { ...attendanceRecord };

  // 5시간 이상인 경우에만 5시간으로 덮어쓰기 및 보상휴가 차감 (2025년 8월 14일 수정됨)
  if (durationInHours >= 5) {
    const newDurationStr = "5시간";

    // 7시간을 초과한 경우에만 보상휴가 차감 계산
    if (durationInHours > 7) {
      const deductionHours = durationInHours - 7; // 7시간 초과한 부분만 차감
      totalCompensatoryDeduction = deductionHours;
      console.log(`📉 보상휴가 차감 예정: ${deductionHours.toFixed(1)}시간 (기준: 7시간 초과분)`);
    } else {
      console.log(`✅ 7시간 이하이므로 보상휴가 차감 없음 (${durationInHours.toFixed(1)}시간)`);
    }

    updatedRecord.duration = newDurationStr;
    console.log(`🔄 재택 근무 시간 제한: ${attendanceRecord.duration} → ${newDurationStr}`);
  } else {
    console.log(`✅ 5시간 미만이므로 기존 시간 유지: ${attendanceRecord.duration}`);
  }

  // 보상휴가 차감 로직 실행 (2025년 8월 14일 추가됨)
  if (totalCompensatoryDeduction > 0) {
    if (typeof deductCompensatoryLeave === 'function') {
      await deductCompensatoryLeave(userEmail, totalCompensatoryDeduction);
      console.log(`✅ 보상휴가 ${totalCompensatoryDeduction.toFixed(1)}시간 차감 완료`);
    } else {
      console.warn("⚠️ deductCompensatoryLeave 함수를 찾을 수 없습니다.");
    }
  }

  return { updatedRecord, compensatoryDeduction: totalCompensatoryDeduction };
}

// 위치 정보 없음 알림 모달 표시 함수 (2025년 8월 14일 새로 추가됨)
function showLocationErrorModal(retryCallback) {
  // 재시도 함수 저장
  retryFunction = retryCallback;
  
  // 로딩 블러 숨기기
  if (typeof hideLoadingBlur === "function") {
    hideLoadingBlur();
  }
  
  // 위치 정보 에러 모달 표시
  if (typeof showLocationRetryModal === "function") {
    showLocationRetryModal();
  } else if (typeof showNoticeModal === "function") {
    // fallback: 일반 알림 모달 사용
    showNoticeModal("위치 정보를 가져올 수 없습니다.\n\n위치 서비스를 활성화한 후 다시 시도해주세요.");
  }
}

// 재시도 버튼 클릭 시 호출되는 함수 (2025년 8월 14일 새로 추가됨)
function onLocationRetry() {
  console.log("🔄 위치 정보 재시도 실행");
  
  if (retryFunction && typeof retryFunction === "function") {
    // 모달 닫기
    if (typeof closeModal === "function") {
      closeModal();
    }
    
    // 재시도 함수 실행
    setTimeout(() => {
      retryFunction();
    }, 300);
  } else {
    console.error("재시도 함수가 설정되지 않았습니다.");
  }
}

// 취소 버튼 클릭 시 호출되는 함수 (2025년 8월 14일 새로 추가됨)
function onLocationCancel() {
  console.log("❌ 위치 정보 취소 처리");
  
  // 임시 데이터 초기화
  clearPendingData();
  
  // 재시도 함수 초기화
  retryFunction = null;
  
  // 모든 버튼 활성화 복원
  const startButton = document.getElementById("startBtn");
  const endButton = document.getElementById("endBtn");
  const workRecordButton = document.getElementById("workRecordBtn");
  
  if (startButton) startButton.disabled = false;
  if (endButton) endButton.disabled = false;
  if (workRecordButton) workRecordButton.disabled = false;
  
  // 모달 닫기
  if (typeof closeModal === "function") {
    closeModal();
  }
}

// 출근 버튼 클릭 이벤트 처리 (2025년 8월 14일 개선됨)
async function handleStartAttendance() {
  const button = document.getElementById("startBtn");
  button.disabled = true;

  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === "function") {
      showNoticeModal("로그인이 필요합니다.");
    }
    button.disabled = false;
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

  // 로딩 블러 효과 표시
  if (typeof showLoadingBlur === "function") {
    showLoadingBlur("출근 처리 중...");
  }

  try {
    const doc = await recordRef.get();

    if (!doc.exists || !doc.data().start || doc.data().start.length === 0) {
      // 위치 정보를 가져오는 중 메시지 업데이트
      if (typeof updateLoadingMessage === "function") {
        updateLoadingMessage("위치 정보를 가져오는 중...");
      }
      
      await processStartAttendanceWithModal(recordRef, now);
      
    } else {
      // 로딩 블러 숨기기
      if (typeof hideLoadingBlur === "function") {
        hideLoadingBlur();
      }
      
      if (typeof showNoticeModal === "function") {
        showNoticeModal("이미 출근 처리가 완료되었습니다.");
        setTimeout(() => {
          if (typeof closeModal === "function") {
            closeModal();
          }
        }, 1500);
      }
    }
  } catch (error) {
    console.error("Firestore 데이터 처리 중 오류 발생:", error);
    
    // 로딩 블러 숨기기
    if (typeof hideLoadingBlur === "function") {
      hideLoadingBlur();
    }
    
    if (typeof showNoticeModal === "function") {
      showNoticeModal("오류가 발생했습니다. 다시 시도해주세요.");
    }
  } finally {
    button.disabled = false;
  }
}

// 출근 처리 함수 - 모달 우선 처리 방식 (2025년 8월 14일 수정됨)
async function processStartAttendanceWithModal(recordRef, now) {
  const { latitude, longitude } = await window.LocationUtils.getCurrentLocation();

  // 위치 정보가 없는 경우 처리 (2025년 8월 14일 추가됨)
  if (latitude === "위치 정보 사용 불가") {
    showLocationErrorModal(() => {
      // 재시도 함수: 출근 버튼 처리 다시 실행
      handleStartAttendance();
    });
    return;
  }

  // GPS 좌표를 주소로 변환
  let address = "주소 정보 사용 불가";
  if (latitude !== "위치 정보 사용 불가") {
    address = await window.LocationUtils.getAddressFromCoordinates(latitude, longitude);
  }

  // 위치 기반 근무 구분 자동 설정
  const autoWorkType = window.LocationUtils.determineWorkType(latitude, longitude);

  // 임시 데이터 준비 (아직 저장하지 않음)
  pendingAttendanceData = {
    recordRef: recordRef,
    attendanceRecord: {
      time: now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      gps: latitude !== "위치 정보 사용 불가"
        ? `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`
        : "위치 정보 사용 불가",
      address: address,
      timestamp: now // 원본 시간 객체도 보관
    },
    type: "start"
  };

  // 로딩 블러 숨기기
  if (typeof hideLoadingBlur === "function") {
    hideLoadingBlur();
  }

  // 위치별 처리 분기
  if (autoWorkType === "내근") {
    // 사무실 근처 → 바로 데이터 저장 후 상세내용 모달
    await saveAttendanceDataDirectly("내근");
    
    setTimeout(() => {
      if (typeof showOfficeWorkDetailModal === "function") {
        showOfficeWorkDetailModal(pendingAttendanceData?.attendanceRecord?.time || "", "start", recordRef.id);
      }
    }, 1000);
    
  } else if (autoWorkType === null && latitude !== "위치 정보 사용 불가") {
    // 사무실 멀리 → 근무구분 선택 모달 먼저 표시
    setTimeout(() => {
      if (typeof showWorkTypeSelectionModal === "function") {
        showWorkTypeSelectionModal(pendingAttendanceData?.attendanceRecord?.time || "", "start", recordRef.id);
      }
    }, 500);
  }
}

// 퇴근 처리 함수 - 모달 우선 처리 방식 (2025년 8월 14일 수정됨)
async function processEndAttendanceWithModal(recordRef, now, latitude, longitude) {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("No user logged in for processEndAttendance.");
    return null;
  }
  const userEmail = user.email;

  // 위치 정보가 없는 경우 처리 (2025년 8월 14일 추가됨)
  if (latitude === "위치 정보 사용 불가") {
    console.warn("⚠️ 위치 정보 없이 퇴근 처리 진행");
    showLocationErrorModal(() => {
      // 재시도 함수: 퇴근 버튼 처리 다시 실행
      processEndAttendanceRequest();
    });
    return null;
  }

  // 주소 변환 중 메시지 업데이트
  if (latitude !== "위치 정보 사용 불가") {
    if (typeof updateLoadingMessage === "function") {
      updateLoadingMessage("주소 정보를 변환하는 중...");
    }
  }

  // GPS 좌표를 주소로 변환
  let address = "주소 정보 사용 불가";
  if (latitude !== "위치 정보 사용 불가") {
    address = await window.LocationUtils.getAddressFromCoordinates(latitude, longitude);
  }

  // 위치 기반 근무 구분 자동 설정
  const autoWorkType = window.LocationUtils.determineWorkType(latitude, longitude);

  // 기존 기록 조회
  const doc = await recordRef.get();
  let existingRecord;

  if (!doc.exists) {
    existingRecord = { start: [], end: [], vacation: [] };
    await recordRef.set(existingRecord);
  } else {
    existingRecord = doc.data();
  }

  // 근무 시간 계산
  const workDuration = await window.WorkTimeCalculator.updateWorkDuration(
    recordRef,
    existingRecord,
    now
  );

  // 임시 데이터 준비 (아직 저장하지 않음)
  pendingAttendanceData = {
    recordRef: recordRef,
    existingRecord: existingRecord,
    attendanceRecord: {
      time: now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      gps: latitude !== "위치 정보 사용 불가"
        ? `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`
        : "위치 정보 사용 불가",
      address: address,
      ...(workDuration && {
        duration: `${workDuration.hours}시간 ${workDuration.minutes}분`
      }),
      timestamp: now // 원본 시간 객체도 보관
    },
    workDuration: workDuration,
    userEmail: userEmail,
    type: "end"
  };

  // duration 필드가 없으면 빈 문자열로 설정
  if (!pendingAttendanceData.attendanceRecord.duration) {
    pendingAttendanceData.attendanceRecord.duration = "";
  }

  // 로딩 블러 숨기기
  if (typeof hideLoadingBlur === "function") {
    hideLoadingBlur();
  }

  // 위치별 처리 분기
  if (autoWorkType === "내근") {
    // 사무실 근처 → 바로 데이터 저장 후 상세내용 모달
    await saveAttendanceDataDirectly("내근");
    
    setTimeout(() => {
      if (typeof showOfficeWorkDetailModal === "function") {
        showOfficeWorkDetailModal(pendingAttendanceData?.attendanceRecord?.time || "", "end", recordRef.id);
      }
    }, 1000);
    
  } else if (autoWorkType === null && latitude !== "위치 정보 사용 불가") {
    // 사무실 멀리 → 근무구분 선택 모달 먼저 표시
    setTimeout(() => {
      if (typeof showWorkTypeSelectionModal === "function") {
        showWorkTypeSelectionModal(pendingAttendanceData?.attendanceRecord?.time || "", "end", recordRef.id);
      }
    }, 500);
  }

  // 안전한 시간 반환 (2025년 8월 14일 수정됨)
  return pendingAttendanceData?.attendanceRecord?.time || now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit", 
    second: "2-digit",
  });
}

// 데이터 직접 저장 함수 (내근 또는 기본 저장) (2025년 8월 14일 재택근무 제한 로직 추가됨)
async function saveAttendanceDataDirectly(workType) {
  if (!pendingAttendanceData) {
    console.error("저장할 출근/퇴근 데이터가 없습니다.");
    return;
  }

  const { recordRef, attendanceRecord, type, existingRecord, workDuration, userEmail } = pendingAttendanceData;
  let finalAttendanceRecord = { ...attendanceRecord };

  // workType이 설정된 경우 memo 추가 (2025년 8월 14일 수정됨)
  if (workType) {
    finalAttendanceRecord.memo = {
      project: "",
      work: workType,  // "내근", "외근", "재택" 모두 저장
      details: "",
    };
  }

  // 재택근무이고 퇴근 기록이며 duration이 있는 경우 5시간 제한 적용 (2025년 8월 14일 추가됨)
  if (workType === "재택" && type === "end" && finalAttendanceRecord.duration) {
    console.log("🏠 재택근무 5시간 제한 로직 실행");
    const { updatedRecord, compensatoryDeduction } = await applyRemoteWorkTimeLimit(
      finalAttendanceRecord, 
      userEmail
    );
    finalAttendanceRecord = updatedRecord;
    
    if (compensatoryDeduction > 0) {
      console.log(`📉 재택근무로 인한 보상휴가 차감: ${compensatoryDeduction.toFixed(1)}시간`);
    }
  }

  try {
    if (type === "start") {
      // 출근 데이터 저장
      await recordRef.set({ start: [finalAttendanceRecord] }, { merge: true });

      console.log("출근 기록 완료:", finalAttendanceRecord);
      
      // UI 업데이트
      if (typeof window.AttendanceUI?.updateStartButtonStatus === "function") {
        window.AttendanceUI.updateStartButtonStatus(finalAttendanceRecord.time);
      }

      // 성공 메시지
      if (typeof showNoticeModal === "function" && typeof closeModal === "function") {
        showNoticeModal("출근 처리 완료!");
        setTimeout(() => closeModal(), 1000);
      }

    } else if (type === "end") {
      // 퇴근 데이터 저장
      await recordRef.update({
        end: firebase.firestore.FieldValue.arrayUnion(finalAttendanceRecord),
      });

      // 보상휴가 계산 (재택근무가 아닌 경우에만 실행) (2025년 8월 14일 수정됨)
      if (workDuration && existingRecord.start?.[0]?.time && workType !== "재택") {
        if (typeof window.LeaveBalanceModule?.calculateAndAddCompensatoryLeave === "function") {
          await window.LeaveBalanceModule.calculateAndAddCompensatoryLeave(
            userEmail,
            existingRecord.start[0].time,
            finalAttendanceRecord.timestamp,
            existingRecord.vacation || []
          );
        }
      }

      console.log("퇴근 기록 완료:", finalAttendanceRecord);
      
      // UI 업데이트
      if (typeof window.AttendanceUI?.updateEndButtonStatus === "function") {
        window.AttendanceUI.updateEndButtonStatus(finalAttendanceRecord.time);
      }

      // 성공 메시지
      if (typeof showNoticeModal === "function" && typeof closeModal === "function") {
        const message = workType === "재택" && finalAttendanceRecord.duration === "5시간" 
          ? "퇴근 처리 완료!"
          : "퇴근 처리 완료!";
        showNoticeModal(message);
        setTimeout(() => closeModal(), 1000);
      }

      // 추가 UI 업데이트
      if (typeof updateLeaveBalances === "function") {
        await updateLeaveBalances(userEmail);
      }
    }

    // 히스토리 업데이트
    const historyContainer = document.getElementById("historyList");
    if (historyContainer && typeof appendHistoryItem === "function") {
      appendHistoryItem(
        historyContainer,
        finalAttendanceRecord.time,
        finalAttendanceRecord.gps,
        finalAttendanceRecord.address,
        workType
      );
    }

    // 주간 캘린더 업데이트
    if (typeof updateWeekDates === "function") updateWeekDates();
    if (typeof loadWeeklyData === "function") loadWeeklyData();

  } catch (error) {
    console.error("Firestore 업데이트 중 오류 발생:", error);
    if (typeof showNoticeModal === "function") {
      showNoticeModal("출근/퇴근 처리 중 오류가 발생했습니다.");
    }
  }

  // 임시 데이터 초기화
  pendingAttendanceData = null;
}

// 임시 데이터 초기화 함수 (2025년 8월 14일 새로 추가됨)
function clearPendingData() {
  console.log("🗑️ 임시 출근/퇴근 데이터 초기화");
  pendingAttendanceData = null;
}

// 근무구분 선택 완료 후 호출되는 함수 (2025년 8월 14일 수정됨)
async function onWorkTypeSelected(selectedWorkType) {
  console.log("🎯 근무구분 선택 완료:", selectedWorkType);
  
  if (!pendingAttendanceData) {
    console.error("저장할 출근/퇴근 데이터가 없습니다.");
    return;
  }

  // 데이터 저장 전에 필요한 정보 미리 추출 (2025년 8월 14일 수정됨)
  const timeInfo = pendingAttendanceData?.attendanceRecord?.time || "";
  const typeInfo = pendingAttendanceData?.type || "";
  const recordId = pendingAttendanceData?.recordRef?.id || "";

  // 선택된 근무구분으로 데이터 저장 (빈 문자열 details로 우선 저장)
  await saveAttendanceDataDirectly(selectedWorkType);

  // 저장 후 해당 근무구분에 맞는 상세내용 모달 표시 (2025년 8월 14일 수정됨)
  setTimeout(() => {
    if (selectedWorkType === "내근" && typeof showOfficeWorkDetailModal === "function") {
      showOfficeWorkDetailModal(timeInfo, typeInfo, recordId);
    } else if (selectedWorkType === "외근" && typeof showFieldWorkDetailModal === "function") {
      showFieldWorkDetailModal(timeInfo, typeInfo, recordId);
    } else if (selectedWorkType === "재택" && typeof showRemoteWorkDetailModal === "function") {
      showRemoteWorkDetailModal(timeInfo, typeInfo, recordId);
    } else {
      console.warn(`⚠️ ${selectedWorkType}에 대한 상세모달 함수를 찾을 수 없습니다.`);
    }
  }, 500);
}

// 퇴근 버튼 클릭 이벤트 처리 (2025년 8월 14일 생성됨)
function handleEndAttendanceClick() {
  processEndAttendanceRequest();
}

// 퇴근 처리 요청 함수 (2025년 8월 14일 수정됨)
async function processEndAttendanceRequest() {
  const button = document.getElementById("endBtn");
  button.disabled = true;

  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === "function") {
      showNoticeModal("로그인이 필요합니다.");
    }
    button.disabled = false;
    return;
  }

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

  // 로딩 블러 효과 표시
  if (typeof showLoadingBlur === "function") {
    showLoadingBlur("위치 정보를 가져오는 중...");
  }

  try {
    const { latitude, longitude } = await window.LocationUtils.getCurrentLocation();
    
    // 메시지 업데이트
    if (typeof updateLoadingMessage === "function") {
      if (latitude === "위치 정보 사용 불가") {
        updateLoadingMessage("위치 정보 없이 퇴근 처리 중...");
      } else {
        updateLoadingMessage("퇴근 처리 중...");
      }
    }

    const endTime = await processEndAttendanceWithModal(
      recordRef,
      now,
      latitude,
      longitude
    );

  } catch (error) {
    console.error("퇴근 처리 중 오류 발생:", error);
    
    // 로딩 블러 숨기기
    if (typeof hideLoadingBlur === "function") {
      hideLoadingBlur();
    }
    
    if (typeof showNoticeModal === "function") {
      showNoticeModal("퇴근 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  } finally {
    button.disabled = false;
  }
}

// 전역 모듈로 내보내기 (2025년 8월 14일 수정됨)
window.AttendanceCore = {
  handleStartAttendance,
  processStartAttendanceWithModal,
  handleEndAttendanceClick,
  processEndAttendanceRequest,
  processEndAttendanceWithModal,
  saveAttendanceDataDirectly,
  onWorkTypeSelected,
  initializeAttendanceCore,
  onLocationRetry, // 새로 추가
  onLocationCancel, // 새로 추가
  showLocationErrorModal, // 새로 추가
  applyRemoteWorkTimeLimit, // 새로 추가 (2025년 8월 14일)
  parseDurationStringToMinutes, // memo.js에서 이전 (2025년 8월 14일)
};