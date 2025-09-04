// memo.js
// 메모 작성 및 관리 기능 (2025년 1월 31일 16:50 생성됨)

// 메모 관련 전역 변수 (window 객체 사용으로 중복 방지) (2025년 1월 31일 17:25 수정됨)
// currentTargetTime은 window.currentTargetTime으로 접근

// Firebase 준비 완료 후 메모 관리 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeMemo();
});

// 메모 관리 시스템 초기화 (2025년 1월 31일 16:50 생성됨)
function initializeMemo() {
  // Memo 버튼 클릭 이벤트 (이벤트 위임 사용)
  document.addEventListener("click", handleMemoButtonClick);

  // Memo 저장 버튼 이벤트
  const saveUpdateBtn = document.querySelector(".save-update");
  if (saveUpdateBtn) {
    saveUpdateBtn.addEventListener("click", handleMemoSave);
  }

  // Memo 모달 닫기 버튼 이벤트
  const memoCloseBtn = document.querySelector(".worksMemoContainer .delete");
  if (memoCloseBtn) {
    memoCloseBtn.addEventListener("click", closeMemoModal);
  }

  console.log('메모 관리 시스템 초기화 완료');
}

// Memo 버튼 클릭 이벤트 처리 (2025년 8월 14일 수정됨)
async function handleMemoButtonClick(event) {
  const target = event.target;

  if (target.classList.contains("memoBtn")) {
    console.log("🟢 Memo 버튼 클릭됨 - 현재 selectedDate:", window.selectedDate);

    // 기본값: 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    let recordDate;

    if (
      typeof window.selectedDate === "string" &&
      window.selectedDate.trim() !== "" &&
      window.selectedDate !== "undefined"
    ) {
      recordDate = window.selectedDate;
    } else {
      recordDate = kstDate.toISOString().split("T")[0];
      window.selectedDate = recordDate;
      console.warn("⚠️ 선택한 날짜가 없으므로 오늘 날짜 사용:", recordDate);
    }

    console.log("📅 최종 선택된 날짜:", recordDate);

    window.currentTargetTime = target
      .closest(".historyRecord")
      .querySelector(".historyTime").innerText;
    console.log("🕒 선택된 시간:", window.currentTargetTime);

    const user = firebase.auth().currentUser;
    if (!user) {
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("로그인이 필요합니다.");
      } else {
        alert("로그인이 필요합니다.");
      }
      return;
    }

    console.log("🔍 Memo 열기 - 현재 recordDate:", recordDate);

    const recordRef = db
      .collection("records")
      .doc(user.email)
      .collection("dates")
      .doc(recordDate);

    try {
      const doc = await recordRef.get();

      if (doc.exists) {
        const recordData = doc.data();
        const targetArray = ["start", "gps", "end"].find((key) => {
          return (
            Array.isArray(recordData[key]) &&
            recordData[key].some((item) => item.time === window.currentTargetTime)
          );
        });

        if (targetArray) {
          const targetItem = recordData[targetArray].find(
            (item) => item.time === window.currentTargetTime
          );
          const memoData = targetItem.memo || {};
          const workType = memoData.work || "";

          console.log("🔍 발견된 memo 데이터:", memoData);
          console.log("🎯 workType:", workType);

          // workType에 따라 해당 상세모달 표시 (편집 모드) (2025년 8월 14일 추가됨)
          if (workType === "내근" && typeof showOfficeWorkDetailModal === "function") {
            showOfficeWorkDetailModal(window.currentTargetTime, targetArray, recordDate, true);
          } else if (workType === "외근" && typeof showFieldWorkDetailModal === "function") {
            showFieldWorkDetailModal(window.currentTargetTime, targetArray, recordDate, true);
          } else if (workType === "재택" && typeof showRemoteWorkDetailModal === "function") {
            showRemoteWorkDetailModal(window.currentTargetTime, targetArray, recordDate, true);
          } else {
            console.warn("❌ workType을 찾을 수 없거나 해당 모달 함수가 없습니다:", workType);
            // fallback: 기존 memo 모달 표시
            showExistingMemoModal(recordDate, memoData);
          }
        } else {
          console.warn("❌ 해당 time 값에 맞는 데이터 없음.");
          if (typeof showNoticeModal === 'function') {
            showNoticeModal("해당 시간의 기록을 찾을 수 없습니다.");
          }
        }
      } else {
        console.warn("❌ 해당 날짜의 기록이 Firestore에 없음.");
        if (typeof showNoticeModal === 'function') {
          showNoticeModal("해당 날짜의 기록이 없습니다.");
        }
      }
    } catch (error) {
      console.error("🚨 Firestore에서 Memo 데이터를 가져오는 중 오류 발생:", error);
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("데이터를 불러오는 중 오류가 발생했습니다.");
      }
    }
  }
}

// 기존 memo 모달 표시 (fallback용) (2025년 8월 14일 추가됨)
function showExistingMemoModal(recordDate, memoData) {
  const modal = document.querySelector(".worksMemoContainer");
  if (modal) {
    modal.style.display = "block";
  }

  // 기존 로직으로 memo 모달 표시
  setupMemoOptions();
  loadExistingMemo(recordDate);
}

// 메모 옵션 설정 (2025년 1월 31일 16:50 생성됨)
function setupMemoOptions() {
  const projectSelectBox = document.getElementById("projectSelectBox");
  const workSelectBox = document.getElementById("workSelectBox");
  const workDateBox = document.getElementById("workDateBox");

  if (!projectSelectBox || !workSelectBox || !workDateBox) {
    console.error("❌ selectBox 요소 중 하나가 존재하지 않습니다.");
    return;
  }

  // 옵션 초기화
  projectSelectBox.innerHTML = '<option value="" disabled selected>사업명(PJT)</option>';
  workSelectBox.innerHTML = '<option value="" disabled selected>업무구분</option>';

  // 옵션 데이터
  const memoOptionData = {
    projectSelectBox: ["프로젝트 1", "프로젝트 2", "프로젝트 3", "프로젝트 4"],
    workSelectBox: ["재택", "내근", "외근"],
  };

  // 옵션 채우기
  memoOptionData.projectSelectBox.forEach((project) => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectSelectBox.appendChild(option);
  });

  memoOptionData.workSelectBox.forEach((work) => {
    const option = document.createElement("option");
    option.value = work;
    option.textContent = work;
    workSelectBox.appendChild(option);
  });

  // 날짜 설정
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);

  let recordDate =
    typeof window.selectedDate === "string" &&
    window.selectedDate.trim() !== "" &&
    window.selectedDate !== "undefined"
      ? window.selectedDate
      : kstDate.toISOString().split("T")[0];

  workDateBox.innerHTML = "";
  const dateOption = document.createElement("option");
  dateOption.value = recordDate;
  dateOption.textContent = recordDate;
  dateOption.selected = true;
  workDateBox.appendChild(dateOption);
  console.log("📅 workDateBox 날짜 설정:", recordDate);

  // Firestore에서 해당 시간의 memo 불러오기
  loadExistingMemo(recordDate);
}

// 기존 메모 불러오기 (2025년 1월 31일 16:50 생성됨)
async function loadExistingMemo(recordDate) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  try {
    const doc = await recordRef.get();
    if (doc.exists) {
      const data = doc.data();
      const targetArray = ["start", "gps", "end"].find(
        (key) =>
          Array.isArray(data[key]) &&
          data[key].some((item) => item.time === window.currentTargetTime)
      );

      if (targetArray) {
        const item = data[targetArray].find(
          (i) => i.time === window.currentTargetTime
        );
        const memo = item.memo || {};
        
        const projectSelectBox = document.getElementById("projectSelectBox");
        const workSelectBox = document.getElementById("workSelectBox");
        const detailsTextarea = document.getElementById("details");
        
        if (projectSelectBox) projectSelectBox.value = memo.project || "";

        // 저장된 텍스트 값(memo.work)과 일치하는 <option>을 찾습니다.
        const savedWorkText = memo.work || "";
        if (workSelectBox) {
          const workOptionToSelect = Array.from(workSelectBox.options).find(
            (opt) => opt.textContent === savedWorkText
          );

          if (workOptionToSelect) {
            workSelectBox.value = workOptionToSelect.value;
          } else {
            workSelectBox.value = "";
          }
        }

        if (detailsTextarea) detailsTextarea.value = memo.details || "";
      } else {
        console.warn("❌ 해당 time 값에 맞는 Memo 없음 → 빈 값 초기화");
      }
    }
  } catch (e) {
    console.error("🚨 Memo 조회 중 오류:", e);
  }
}

// MEMO 저장 버튼 이벤트 처리 (2025년 8월 14일 재택근무 제한 로직 통합됨)
// UI 즉시 갱신 기능 추가 (2025년 8월 12일 수정됨)
async function handleMemoSave() {
  const projectSelectBox = document.getElementById("projectSelectBox");
  const workSelectBox = document.getElementById("workSelectBox");
  const detailsTextarea = document.getElementById("details");
  const workDateBox = document.getElementById("workDateBox");

  if (!projectSelectBox || !workSelectBox || !detailsTextarea || !workDateBox) {
    console.error("메모 저장: 필수 요소를 찾을 수 없습니다.");
    return;
  }

  const projectSelectValue = projectSelectBox.value;
  const selectedWorkOption = workSelectBox.options[workSelectBox.selectedIndex];
  const workSelectValue = selectedWorkOption ? selectedWorkOption.textContent : "";
  const details = detailsTextarea.value;

  // 저장할 Memo 데이터
  const memoData = {
    project: projectSelectValue,
    work: workSelectValue,
    date: workDateBox.value,
    details: details,
  };

  console.log("💾 저장할 Memo 데이터:", memoData);
  console.log("💾 [MemoSave] 저장할 날짜 (memoData.date):", memoData.date);

  if (!window.currentTargetTime) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("유효한 타겟 시간이 없습니다. 다시 시도해주세요.");
    } else {
      alert("유효한 타겟 시간이 없습니다. 다시 시도해주세요.");
    }
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("로그인이 필요합니다.");
    } else {
      alert("로그인이 필요합니다.");
    }
    return;
  }

  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(memoData.date);

  try {
    const doc = await recordRef.get();
    if (doc.exists) {
      const recordData = doc.data();
      const updates = {};
      let foundAndUpdated = false; // 업데이트 성공 여부 추적

      ["start", "gps", "end"].forEach((key) => {
        if (Array.isArray(recordData[key]) && recordData[key].length > 0) {
          updates[key] = recordData[key].map((item) => {
            if (item.time === window.currentTargetTime) {
              foundAndUpdated = true;
              let updatedItem = { ...item, memo: memoData };

              // 재택 근무이고 end 배열이며 duration이 있는 경우 처리 (2025년 8월 14일 통합 함수 사용으로 수정됨)
              if (
                workSelectValue === "재택" &&
                key === "end" &&
                item.duration
              ) {
                console.log("🏠 기존 memo.js에서 재택근무 5시간 제한 로직 실행");
                
                // attendance-core.js의 통합 함수 사용 (2025년 8월 14일 추가됨)
                if (typeof window.AttendanceCore?.applyRemoteWorkTimeLimit === "function") {
                  // Promise를 동기적으로 처리하기 위해 별도 처리 필요
                  // 여기서는 기존 로직을 유지하되 통합 함수의 로직과 동일하게 처리
                  const durationInMinutes = window.AttendanceCore.parseDurationStringToMinutes(item.duration);
                  const durationInHours = durationInMinutes / 60;

                  console.log(`⏱️ 기존 근무시간: ${durationInHours.toFixed(1)}시간 (${durationInMinutes}분)`);

                  // 5시간 이상인 경우에만 5시간으로 덮어쓰기 (2025년 8월 14일 수정됨)
                  if (durationInHours >= 5) {
                    const newDurationStr = "5시간";

                    // 7시간을 초과한 경우에만 보상휴가 차감 계산
                    if (durationInHours > 7) {
                      const deductionHours = durationInHours - 7; // 7시간 초과한 부분만 차감
                      console.log(`📉 보상휴가 차감 예정: ${deductionHours.toFixed(1)}시간 (기준: 7시간 초과분)`);
                      
                      // 보상휴가 차감 로직 실행 (비동기 처리) (2025년 8월 14일 수정됨)
                      if (typeof deductCompensatoryLeave === 'function') {
                        deductCompensatoryLeave(user.email, deductionHours).catch(error => {
                          console.error("보상휴가 차감 중 오류:", error);
                        });
                      } else {
                        console.warn("deductCompensatoryLeave 함수를 찾을 수 없습니다.");
                      }
                    } else {
                      console.log(`✅ 7시간 이하이므로 보상휴가 차감 없음 (${durationInHours.toFixed(1)}시간)`);
                    }

                    updatedItem.duration = newDurationStr;
                    console.log(`🔄 재택 근무 시간 제한: ${item.duration} → ${newDurationStr}`);
                  } else {
                    console.log(`✅ 5시간 미만이므로 기존 시간 유지: ${item.duration}`);
                  }
                } else {
                  console.warn("⚠️ AttendanceCore.applyRemoteWorkTimeLimit 함수를 찾을 수 없습니다. 기존 로직을 사용합니다.");
                  // 기존 로직 fallback (안전장치)
                  const durationInMinutes = parseDurationStringToMinutes(item.duration);
                  const durationInHours = durationInMinutes / 60;
                  
                  if (durationInHours >= 5) {
                    updatedItem.duration = "5시간";
                    console.log(`🔄 재택 근무 시간 제한 (fallback): ${item.duration} → 5시간`);
                  }
                }
              }

              return updatedItem;
            }
            return item;
          });
        }
      });

      // Firestore 업데이트 실행
      if (foundAndUpdated) {
        await recordRef.update(updates);

        // 성공 메시지 표시 후 1초 뒤 자동 닫기
        if (typeof showNoticeModal === 'function') {
          const message = workSelectValue === "재택" 
            ? "📝 Memo가 저장되었습니다. (재택근무 5시간 제한 적용)" 
            : "📝 Memo가 저장되었습니다.";
          showNoticeModal(message);
          setTimeout(() => {
            if (typeof closeModal === 'function') {
              closeModal();
            } else if (typeof closeNoticeModal === 'function') {
              closeNoticeModal();
            }
          }, 1000);
        } else {
          alert("📝 Memo가 저장되었습니다.");
        }

        // UI 즉시 갱신 - work-history 리스트 업데이트 (2025년 8월 12일 추가됨)
        if (typeof updateHistoryList === 'function') {
          console.log("🔄 히스토리 리스트 갱신 중...");
          await updateHistoryList(memoData.date);
        } else if (typeof window.updateHistoryList === 'function') {
          console.log("🔄 히스토리 리스트 갱신 중 (window)...");
          await window.updateHistoryList(memoData.date);
        } else {
          console.warn("⚠️ updateHistoryList 함수를 찾을 수 없습니다.");
          // 대체 방법: 페이지 리로드 대신 Firestore에서 데이터 다시 가져오기
          const historyContainer = document.getElementById("historyList");
          if (historyContainer) {
            const updatedDoc = await recordRef.get();
            if (updatedDoc.exists && typeof updateDOM === 'function') {
              updateDOM(updatedDoc.data());
            } else if (updatedDoc.exists && typeof window.WorkHistoryModule?.updateDOM === 'function') {
              window.WorkHistoryModule.updateDOM(updatedDoc.data());
            }
          }
        }

        // 주간 캘린더도 업데이트 (2025년 8월 12일 추가됨)
        if (typeof updateWeekDates === 'function') {
          updateWeekDates();
        }
        if (typeof loadWeeklyData === 'function') {
          loadWeeklyData();
        }
        
        closeMemoModal();
        window.currentTargetTime = null; // 저장 후 초기화
      } else {
        console.warn("⚠️ 해당 시간의 기록을 찾을 수 없습니다.");
        if (typeof showNoticeModal === 'function') {
          showNoticeModal("해당 시간의 기록을 찾을 수 없습니다.");
        }
      }
    } else {
      console.warn("🚨 해당 날짜의 기록이 없습니다.");
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("해당 날짜의 기록이 없습니다.");
      }
    }
  } catch (error) {
    console.error("🔥 Memo 저장 중 오류 발생:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("Memo 저장 중 오류가 발생했습니다.");
    }
  }
}

// MEMO 모달 자동 열기 함수 (퇴근 후 자동 실행 가능) (2025년 1월 31일 16:50 수정됨)
function openMemoModal(targetTime, forceToday = false) {
  const modal = document.querySelector(".worksMemoContainer");
  if (modal) {
    modal.style.display = "block";
  }

  // 현재 타겟 시간을 설정
  window.currentTargetTime = targetTime;
  console.log("🔹 Memo Modal Opened - Target Time:", window.currentTargetTime);

  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("로그인이 필요합니다.");
    } else {
      alert("로그인이 필요합니다.");
    }
    return;
  }

  // 선택한 날짜 유지, 하지만 퇴근 버튼 클릭 시에는 오늘 날짜로 변경
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  let recordDate = forceToday
    ? kstDate.toISOString().split("T")[0]
    : window.selectedDate;

  if (!recordDate || recordDate.trim() === "" || recordDate === "undefined") {
    console.warn("⚠️ 선택한 날짜가 없으므로 오늘 날짜 사용");
    recordDate = kstDate.toISOString().split("T")[0];
  }

  console.log("📅 Memo를 불러올 날짜:", recordDate);
  console.log("📅 [MemoModal] 선택된 날짜(recordDate):", recordDate);

  // Firestore에서 해당 시간의 MEMO 불러오기
  const recordRef = db
    .collection("records")
    .doc(user.email)
    .collection("dates")
    .doc(recordDate);

  recordRef.get().then((doc) => {
    const projectSelectBox = document.getElementById("projectSelectBox");
    const workSelectBox = document.getElementById("workSelectBox");
    const detailsTextarea = document.getElementById("details");
    const workDateBox = document.getElementById("workDateBox");

    if (doc.exists) {
      const recordData = doc.data();
      const targetArray = ["start", "gps", "end"].find((key) => {
        return (
          Array.isArray(recordData[key]) &&
          recordData[key].some((item) => item.time === currentTargetTime)
        );
      });

      if (targetArray) {
        const targetItem = recordData[targetArray].find(
          (item) => item.time === currentTargetTime
        );
        const memoData = targetItem.memo || {};

        console.log("불러온 Memo 데이터:", memoData);

        // 프로젝트 옵션 설정
        if (projectSelectBox) {
          const projectOption = Array.from(projectSelectBox.options).find(
            (option) => option.textContent === memoData.project
          );
          if (projectOption) {
            projectOption.selected = true;
          } else {
            projectSelectBox.selectedIndex = 0;
          }
        }

        // 업무구분 옵션 설정
        if (workSelectBox) {
          const workOption = Array.from(workSelectBox.options).find(
            (option) => option.textContent === memoData.work
          );
          if (workOption) {
            workOption.selected = true;
          } else {
            workSelectBox.selectedIndex = 0;
          }
        }

        if (detailsTextarea) {
          detailsTextarea.value = memoData.details || "";
        }
      } else {
        console.warn("❌ 해당 time 값에 맞는 Memo 데이터 없음. → 빈 값 초기화");
        if (projectSelectBox) projectSelectBox.value = "";
        if (workSelectBox) workSelectBox.value = "";
        if (detailsTextarea) detailsTextarea.value = "";
      }
    } else {
      console.warn("❌ 해당 날짜의 기록이 Firestore에 없음.");
    }

    // workDateBox에 선택한 날짜 또는 오늘 날짜 강제 설정
    if (workDateBox) {
      workDateBox.innerHTML = "";

      const newOption = document.createElement("option");
      newOption.value = recordDate;
      newOption.textContent = recordDate;
      newOption.selected = true;
      workDateBox.appendChild(newOption);

      console.log("📅 workDateBox 최종 설정 날짜:", workDateBox.value);
    }
  });

  // UI 업데이트
  if (typeof updateWeekDates === 'function') updateWeekDates();
  if (typeof loadWeeklyData === 'function') loadWeeklyData();
}

// Modal 닫기 (2025년 1월 31일 16:50 수정됨)
function closeMemoModal() {
  const modal = document.querySelector(".worksMemoContainer");
  if (modal) {
    modal.style.display = "none";
  }
}

// 유틸리티 함수: duration 문자열을 분(minutes) 단위로 변환 (2025년 8월 14일 attendance-core.js로 이전됨)
// 기존 함수 호출을 위한 래퍼 함수로 변경 (2025년 8월 14일 수정됨)
function parseDurationStringToMinutes(durationString) {
  if (typeof window.AttendanceCore?.parseDurationStringToMinutes === "function") {
    return window.AttendanceCore.parseDurationStringToMinutes(durationString);
  } else {
    // fallback: 기존 로직 유지 (안전장치)
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
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 16:50 생성됨)
window.MemoModule = {
  openMemoModal,
  closeMemoModal,
  handleMemoSave,
  setupMemoOptions
};