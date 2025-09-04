// vacation-firestore.js
// 휴가 관련 Firestore 데이터 처리 (하이브리드 구조) (2025년 8월 14일 생성됨)

// 휴가 데이터를 Firestore에 저장 - 하이브리드 구조 및 로그 기록 (2025년 8월 14일 생성됨)
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
            let currentDurationMinutes = window.VacationUtils.parseDurationStringToMinutes(String(lastEndRecord.duration));
            
            const updatedDurationMinutes = currentDurationMinutes - overlapMinutes;
            const updatedDurationString = window.VacationUtils.formatMinutesToDurationString(updatedDurationMinutes);

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
    if (typeof window.LeaveBalanceModule?.recordLeaveHistory === "function") {
      await window.LeaveBalanceModule.recordLeaveHistory(userEmail, logData);
    }
    
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

// 연차 저장 - 하이브리드 구조 및 로그 기록 (2025년 8월 14일 생성됨)
async function saveAnnualVacationToFirestore(vacationRecords, userEmail, leaveDaysToDeduct) {
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
      if (typeof window.LeaveBalanceModule?.recordLeaveHistory === "function") {
        await window.LeaveBalanceModule.recordLeaveHistory(userEmail, logData);
      }
      
      console.log("✅ 연차 데이터 하이브리드 구조로 저장 성공");
      
    } else {
      console.warn("User document not found for annual leave deduction.");
      if (typeof showNoticeModal === 'function') {
        showNoticeModal("사용자 연차 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      } else {
        alert("사용자 연차 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      }
      return;
    }
  } catch (error) {
    console.error("Error saving annual vacation:", error);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("연차 저장 중 오류가 발생했습니다.");
    } else {
      alert("연차 저장 중 오류가 발생했습니다.");
    }
    throw error;
  }
}

// 모든 휴가 기록 조회 함수 (하이브리드 구조 활용) (2025년 8월 14일 생성됨)
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

// 전역 모듈로 내보내기 (2025년 8월 14일 생성됨)
window.VacationFirestore = {
  saveVacationToFirestoreHybrid,
  saveAnnualVacationToFirestore,
  getAllVacations,
};