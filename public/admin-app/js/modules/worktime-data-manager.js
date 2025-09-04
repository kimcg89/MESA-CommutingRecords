// 출퇴근 데이터 관리 모듈 - 2025.01.21 13:30 생성
// 기존 script.js의 데이터 로직을 admin-app 구조에 맞게 모듈화

/**
 * 출퇴근 데이터 관리 클래스
 * Firestore에서 출퇴근, GPS, 휴가 데이터를 로드하고 관리
 */
class WorktimeDataManager {
  constructor() {
    this.cachedRecordMap = {}; // { userEmail: { ...dates } }
    this.isInitialized = false;

    // GPS 설정 (기존 script.js와 동일)
    this.OFFICE_LAT = 37.53626;
    this.OFFICE_LNG = 126.895005;
    this.OFFICE_RADIUS_METERS = 500;

    console.log("📊 WorktimeDataManager 생성 - 2025.01.21 13:30");
  }

  /**
   * 초기화 함수 - 2025.01.21 13:30 생성
   * Firebase 연결 확인 및 초기 데이터 로드
   */
  async init() {
    try {
      console.log("🚀 출퇴근 데이터 매니저 초기화 시작...");

      // Firebase 준비 대기
      await this.waitForFirebase();

      // 오늘 날짜 레코드 사전 로드
      await this.preloadTodayRecords();

      // 🆕 2025.08.19 16:10 추가: 필터 이벤트 리스너 설정
      this.setupFilterEventListeners();

      this.isInitialized = true;
      console.log("✅ 출퇴근 데이터 매니저 초기화 완료");
    } catch (error) {
      console.error("❌ 출퇴근 데이터 매니저 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 필터 이벤트 리스너 설정 - 2025.08.19 16:10 신규 생성
   * 조직도 및 Worktime 필터 변경 시 통계 카드 자동 업데이트
   */
  setupFilterEventListeners() {
    // 조직도 필터 변경 이벤트
    document.addEventListener("orgFilterChanged", (e) => {
      console.log("📊 [출퇴근 데이터 매니저] 조직도 필터 변경 감지:", e.detail);
      this.handleFilterChange("org", e.detail);
    });

    // 조직도 필터 해제 이벤트
    document.addEventListener("orgFilterCleared", () => {
      console.log("🔄 [출퇴근 데이터 매니저] 조직도 필터 해제 감지");
      this.handleFilterChange("clear", null);
    });

    // Worktime 필터 변경 이벤트
    document.addEventListener("worktimeFilterChanged", (e) => {
      console.log(
        "📊 [출퇴근 데이터 매니저] Worktime 필터 변경 감지:",
        e.detail
      );
      this.handleFilterChange("worktime", e.detail);
    });

    console.log("🎧 필터 이벤트 리스너 설정 완료");
  }

  // ✅ 신규 추가: handleFilterChange() 함수
  /**
   * 필터 변경 처리 - 2025.08.19 16:10 신규 생성
   * 필터 변경 시 통계 카드를 자동으로 업데이트 (디바운싱 적용)
   */
  handleFilterChange(source, detail) {
    // 디바운싱으로 중복 호출 방지
    if (this.filterUpdateTimeout) {
      clearTimeout(this.filterUpdateTimeout);
    }

    this.filterUpdateTimeout = setTimeout(async () => {
      try {
        console.log(
          `🔄 필터 변경에 따른 통계 카드 업데이트 시작 (출처: ${source})`
        );

        // 통계 카드 업데이트
        await this.updateAllStatsCards();

        // GPS 매니저에도 알림 (GPS 마커 업데이트)
        if (window.worktimeGpsManager && window.worktimeGpsManager.isReady()) {
          await window.worktimeGpsManager.refreshGpsData();
        }

        console.log("✅ 필터 변경에 따른 업데이트 완료");
      } catch (error) {
        console.error("❌ 필터 변경 처리 실패:", error);
      }
    }, 300); // 300ms 디바운싱
  }

  /**
   * Firebase 초기화 대기 - 2025.01.21 13:30 생성
   */
  async waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.firebaseFirestore) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  /**
   * 오늘 날짜 레코드 사전 로드 - 2025.01.21 13:30 생성
   * 기존 preloadAllRecords() 함수 참고
   */
  async preloadTodayRecords() {
    if (!window.firebaseFirestore) {
      console.error("❌ Firestore가 초기화되지 않았습니다.");
      return;
    }

    const today = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(today.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split("T")[0];

    this.cachedRecordMap = {};

    try {
      const recordsSnap = await window.firebaseFirestore
        .collection("records")
        .get();

      for (const userDoc of recordsSnap.docs) {
        const userEmail = userDoc.id;

        // 사용자 메타데이터가 있는지 확인
        const userData = userDoc.data();
        if (!userData.name || !userData.department0) continue;

        const dateDoc = await window.firebaseFirestore
          .collection("records")
          .doc(userEmail)
          .collection("dates")
          .doc(todayStr)
          .get();

        if (dateDoc.exists) {
          this.cachedRecordMap[userEmail] = dateDoc.data();
        }
      }

      console.log(
        "📦 오늘 출퇴근 기록 캐시 완료:",
        Object.keys(this.cachedRecordMap).length
      );
    } catch (error) {
      console.error("❌ 출퇴근 기록 사전 로드 실패:", error);
    }
  }

  /**
   * 거리 계산 함수 - 2025.01.21 13:30 생성
   * 기존 calculateDistance() 함수와 동일
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름 (미터)
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 위치 유형 판별 함수 - 2025.08.19 14:20 완전 재작성
   * GPS 객체 구조를 정확히 파악하여 memo.work 필드에서 내근/외근 정보 추출
   */
  determineLocationType(gpsEntry) {
    console.log("🔍 위치 유형 판별 시작:", gpsEntry);

    // gpsEntry가 문자열인 경우 (좌표만 있는 경우)
    if (typeof gpsEntry === "string") {
      console.warn(
        "⚠️ 문자열 GPS 데이터는 work 정보를 알 수 없습니다:",
        gpsEntry
      );
      return "unknown";
    }

    // gpsEntry가 객체인 경우
    if (typeof gpsEntry === "object" && gpsEntry !== null) {
      // 1차: gpsEntry 자체에 memo가 있는 경우
      let workType = gpsEntry.memo?.work;

      // 2차: gpsEntry.gps가 객체이고 그 안에 memo가 있는 경우
      if (
        !workType &&
        typeof gpsEntry.gps === "object" &&
        gpsEntry.gps?.memo?.work
      ) {
        workType = gpsEntry.gps.memo.work;
        console.log("📍 gps.memo.work에서 발견:", workType);
      }

      // 3차: Firebase 구조 분석 - gpsEntry가 전체 GPS 항목인 경우
      if (!workType && gpsEntry.memo && typeof gpsEntry.memo === "object") {
        workType = gpsEntry.memo.work;
        console.log("📍 memo.work에서 발견:", workType);
      }

      if (!workType) {
        console.log(
          "📍 work 정보 없음. 전체 구조:",
          JSON.stringify(gpsEntry, null, 2)
        );
        return "unknown";
      }

      console.log(`📍 work 정보 발견: "${workType}"`);

      // 내근 판별 (다양한 표현 지원)
      if (
        workType.includes("내근") ||
        workType.includes("사무실") ||
        workType.includes("오피스") ||
        workType.includes("office") ||
        workType === "내근" // 정확히 일치하는 경우도 추가
      ) {
        console.log("✅ 내근으로 판별됨");
        return "office";
      }

      // 외근/재택 판별 (다양한 표현 지원)
      if (
        workType.includes("외근") ||
        workType.includes("재택") ||
        workType.includes("원격") ||
        workType.includes("remote") ||
        workType.includes("홈오피스") ||
        workType === "외근" || // 정확히 일치하는 경우도 추가
        workType === "재택" // 정확히 일치하는 경우도 추가
      ) {
        console.log("✅ 외근/재택으로 판별됨");
        return "remote";
      }

      // 기타 경우
      console.log(`❓ 알 수 없는 work 유형: "${workType}"`);
      return "unknown";
    }

    console.warn("⚠️ 잘못된 GPS 엔트리 형식:", typeof gpsEntry, gpsEntry);
    return "unknown";
  }

  /**
 * 선택된 사용자 이메일 목록 가져오기 - 2025.08.19 16:30 수정: 필터 없을 때 빈 배열 반환
 * 통합 필터 매니저 우선 사용, 조직도 필터 보조 사용
 * 🆕 필터가 없으면 빈 배열 반환하여 명시적 선택만 데이터 표시
 */
getSelectedUserEmails() {
  // 1. 통합 필터 매니저 우선 사용 (양방향 연동 지원)
  if (
    window.worktimeFilterManager &&
    window.worktimeFilterManager.isReady()
  ) {
    const filteredEmails =
      window.worktimeFilterManager.getFilteredUserEmails();
    if (filteredEmails.length > 0) {
      console.log(
        "📊 통합 필터 매니저에서 사용자 목록 가져옴:",
        filteredEmails.length,
        "명"
      );
      return filteredEmails;
    }
  }

  // 2. 조직도 필터링된 멤버들 가져오기 (fallback)
  if (
    window.organizationManager &&
    window.organizationManager.getFilteredMembers
  ) {
    const filteredMembers = window.organizationManager.getFilteredMembers();
    if (filteredMembers.length > 0) {
      console.log(
        "📊 조직도 매니저에서 사용자 목록 가져옴:",
        filteredMembers.length,
        "명"
      );
      return filteredMembers;
    }
  }

  // 🆕 2025.08.19 16:30 수정: 필터가 없으면 빈 배열 반환
  // 사용자가 명시적으로 선택했을 때만 데이터 표시
  console.log("📭 선택된 사용자가 없음 - 빈 배열 반환 (필터 미적용)");
  return [];
}

  /**
   * 내외근 현황 데이터 계산 - 2025.01.21 14:00 완전 재작성
   * memo.work 필드 기반으로 내외근 판정
   */
  /**
 * 내외근 현황 데이터 계산 - 2025.08.19 16:30 수정: 빈 데이터 처리 개선
 * memo.work 필드 기반으로 내외근 판정, 선택된 사용자가 없으면 0 반환
 */
getAttendanceStatus() {
  const selectedEmails = this.getSelectedUserEmails();
  
  // 🆕 2025.08.19 16:30 추가: 선택된 사용자가 없으면 0 반환
  if (selectedEmails.length === 0) {
    console.log("📭 선택된 사용자가 없어 내외근 현황을 0으로 반환");
    return {
      office: 0,
      remote: 0,
      unknown: 0,
      total: 0,
      officeRatio: 0,
      remoteRatio: 0
    };
  }

  let officeCount = 0;
  let remoteCount = 0;
  let unknownCount = 0;

  console.log(
    `📊 내외근 현황 계산 시작: 선택된 사용자 ${selectedEmails.length}명`
  );

  for (const email of selectedEmails) {
    const record = this.cachedRecordMap[email];

    if (!record) {
      console.log(`⚠️ ${email}: 캐시된 레코드 없음`);
      unknownCount++;
      continue;
    }

    // start 배열에서 가장 최근 데이터 확인 (출근 시 설정한 근무형태)
    let workType = "unknown";

    if (Array.isArray(record.start) && record.start.length > 0) {
      const latestStart = record.start[record.start.length - 1];
      workType = this.determineLocationType(latestStart);
      console.log(
        `📱 ${email}: start 데이터에서 work="${latestStart.memo?.work}" → ${workType}`
      );
    }

    // start에 없으면 gps 배열에서 확인
    if (
      workType === "unknown" &&
      Array.isArray(record.gps) &&
      record.gps.length > 0
    ) {
      const latestGps = record.gps[record.gps.length - 1];
      workType = this.determineLocationType(latestGps);
      console.log(
        `📱 ${email}: gps 데이터에서 work="${latestGps.memo?.work}" → ${workType}`
      );
    }

    // 집계
    if (workType === "office") {
      officeCount++;
      console.log(`🏢 ${email}: 내근 판정`);
    } else if (workType === "remote") {
      remoteCount++;
      console.log(`🏠 ${email}: 외근/재택 판정`);
    } else {
      unknownCount++;
      console.log(`❓ ${email}: 근무형태 미확인`);
    }
  }

  const total = officeCount + remoteCount;
  const result = {
    office: officeCount,
    remote: remoteCount,
    unknown: unknownCount,
    total: total,
    officeRatio: total > 0 ? Math.round((officeCount / total) * 100) : 0,
    remoteRatio:
      total > 0 ? 100 - Math.round((officeCount / total) * 100) : 0,
  };

  console.log("📊 내외근 현황 계산 완료:", result);
  return result;
}

  /**
 * 휴가자 수 데이터 계산 - 2025.08.19 16:30 수정: 빈 데이터 처리 개선
 * 기존 updateVacationCard() 함수 참고하여 구현, 선택된 사용자가 없으면 0 반환
 */
async getVacationData(period = "today") {
  const selectedEmails = this.getSelectedUserEmails();

  // 🆕 2025.08.19 16:30 추가: 선택된 사용자가 없으면 0 반환
  if (selectedEmails.length === 0) {
    console.log("📭 선택된 사용자가 없어 휴가자 수를 0으로 반환");
    return {
      total: 0,
      annualLeave: 0,
      compLeave: 0,
    };
  }

  const kstOffset = 9 * 60 * 60 * 1000;
  const now = new Date(Date.now() + kstOffset);

  const start = new Date(now);
  const end = new Date(now);

  // 기간 설정
  if (period === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    end.setDate(start.getDate() + 6);
  } else if (period === "month") {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  }

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  console.log(`📊 휴가자 수 계산 시작: 선택된 사용자 ${selectedEmails.length}명, 기간: ${period}`);

  try {
    const vacationUsers = new Set();
    const annualLeaveUsers = new Set();
    const compLeaveUsers = new Set();

    for (const email of selectedEmails) {
      const datesSnap = await window.firebaseFirestore
        .collection("records")
        .doc(email)
        .collection("dates")
        .where(firebase.firestore.FieldPath.documentId(), ">=", startStr)
        .where(firebase.firestore.FieldPath.documentId(), "<=", endStr)
        .get();

      let userHasVacation = false;
      let userHasAnnualLeave = false;
      let userHasCompLeave = false;

      datesSnap.forEach((doc) => {
        if (Array.isArray(doc.data().vacation)) {
          doc.data().vacation.forEach((v) => {
            userHasVacation = true;
            if (v.type?.includes("연차") || v.type?.includes("반휴")) {
              userHasAnnualLeave = true;
            } else if (v.type?.includes("보상")) {
              userHasCompLeave = true;
            }
          });
        }
      });

      if (userHasVacation) vacationUsers.add(email);
      if (userHasAnnualLeave) annualLeaveUsers.add(email);
      if (userHasCompLeave) compLeaveUsers.add(email);
    }

    const result = {
      total: vacationUsers.size,
      annualLeave: annualLeaveUsers.size,
      compLeave: compLeaveUsers.size,
    };

    console.log("📊 휴가자 수 계산 완료:", result);
    return result;

  } catch (error) {
    console.error("❌ 휴가자 수 조회 실패:", error);
    return {
      total: 0,
      annualLeave: 0,
      compLeave: 0,
    };
  }
}

  /**
   * 상세 출퇴근 테이블 데이터 가져오기 - 2025.01.21 13:30 생성
   * 기존 updateDetailTable() 함수 참고
   */
  async getDetailTableData(startDate, endDate) {
    const selectedEmails = this.getSelectedUserEmails();

    if (selectedEmails.length === 0) {
      return [];
    }

    try {
      const promises = [];

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];

        for (const email of selectedEmails) {
          promises.push(
            window.firebaseFirestore
              .collection("records")
              .doc(email)
              .collection("dates")
              .doc(dateStr)
              .get()
              .then((doc) => ({ doc, email, dateStr }))
          );
        }
      }

      const results = await Promise.all(promises);
      const tableRowsData = [];

      // 조직 데이터에서 사용자 정보 가져오기
      const getUserInfo = (email) => {
        if (window.organizationManager) {
          return window.organizationManager.findMemberByEmail(email);
        }
        return null;
      };

      results.forEach(({ doc, email, dateStr }) => {
        if (!doc.exists) return;

        const data = doc.data();
        const gpsData = Array.isArray(data.gps) ? data.gps : [];
        if (gpsData.length === 0) return;

        const userInfo = getUserInfo(email);
        if (!userInfo) return;

        // 거리 계산 로직 (기존과 동일)
        let distance = 0;

        if (gpsData.length > 0) {
          const firstGps = gpsData[0]?.gps;
          if (firstGps) {
            const [lat1, lng1] = firstGps.split(",").map(Number);
            if (!isNaN(lat1) && !isNaN(lng1)) {
              distance += this.calculateDistance(
                this.OFFICE_LAT,
                this.OFFICE_LNG,
                lat1,
                lng1
              );
            }
          }
        }

        for (let i = 0; i < gpsData.length - 1; i++) {
          const startGps = gpsData[i]?.gps;
          const endGps = gpsData[i + 1]?.gps;
          if (startGps && endGps) {
            const [lat1, lng1] = startGps.split(",").map(Number);
            const [lat2, lng2] = endGps.split(",").map(Number);
            if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
              distance += this.calculateDistance(lat1, lng1, lat2, lng2);
            }
          }
        }

        // 요일 및 공휴일 체크
        const currentDate = new Date(dateStr);
        const dayOfWeek = currentDate.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayType = isWeekend ? "휴일" : "평일";

        tableRowsData.push({
          date: dateStr,
          name: userInfo.name,
          email: email,
          dayType: dayType,
          gpsCount: gpsData.length,
          distance: (distance / 1000).toFixed(2),
        });
      });

      // 날짜 내림차순 정렬
      tableRowsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      return tableRowsData;
    } catch (error) {
      console.error("❌ 상세 테이블 데이터 조회 실패:", error);
      return [];
    }
  }

  /**
   * 캐시된 레코드 가져오기 - 2025.01.21 13:30 생성
   */
  getCachedRecord(email) {
    return this.cachedRecordMap[email] || null;
  }

  /**
   * 초기화 상태 확인 - 2025.01.21 13:30 생성
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * 캐시 새로고침 - 2025.01.21 13:30 생성
   */
  async refreshCache() {
    console.log("🔄 출퇴근 데이터 캐시 새로고침");
    await this.preloadTodayRecords();
  }

  /**
 * 내외근 현황 카드 업데이트 - 2025.08.19 16:30 수정: UI 메시지 개선
 * 계산된 데이터를 HTML 카드에 반영, 선택된 사용자가 없을 때 안내 메시지
 */
updateAttendanceCard() {
  try {
    const attendanceData = this.getAttendanceStatus();

    // HTML 요소들 찾기
    const officeCountEl = document.getElementById("office-worker-count");
    const fieldCountEl = document.getElementById("field-worker-count");
    const officeRatioEl = document.getElementById("office-ratio");
    const remoteRatioEl = document.getElementById("remote-ratio");

    // 요소 존재 확인
    if (!officeCountEl || !fieldCountEl || !officeRatioEl || !remoteRatioEl) {
      console.error("❌ 내외근 현황 카드 요소를 찾을 수 없습니다.");
      return false;
    }

    // 카드 업데이트
    officeCountEl.textContent = attendanceData.office;
    fieldCountEl.textContent = attendanceData.remote;
    officeRatioEl.textContent = `${attendanceData.officeRatio}%`;
    remoteRatioEl.textContent = `${attendanceData.remoteRatio}%`;

    // 🆕 2025.08.19 16:30 추가: 선택된 사용자가 없을 때 안내 메시지
    if (attendanceData.total === 0) {
      console.log("📭 내외근 현황 카드: 선택된 사용자 없음 (0/0 표시)");
    } else {
      console.log("✅ 내외근 현황 카드 업데이트 완료:", {
        내근: attendanceData.office,
        외근재택: attendanceData.remote,
        내근비율: `${attendanceData.officeRatio}%`,
        외근비율: `${attendanceData.remoteRatio}%`,
      });
    }

    return true;
  } catch (error) {
    console.error("❌ 내외근 현황 카드 업데이트 실패:", error);
    return false;
  }
}

  /**
   * 모든 통계 카드 업데이트 - 2025.01.21 14:05 생성
   * 내외근, 휴가자 수 등 모든 카드를 한번에 업데이트
   */
  async updateAllStatsCards() {
    console.log("📊 모든 통계 카드 업데이트 시작...");

    try {
      // 선택된 사용자 수 로깅
      const selectedEmails = this.getSelectedUserEmails();
      console.log(`👥 현재 선택된 사용자: ${selectedEmails.length}명`);

      // 1. 내외근 현황 카드 업데이트
      const attendanceUpdated = this.updateAttendanceCard();
      console.log(
        `📊 내외근 현황 카드 업데이트: ${attendanceUpdated ? "성공" : "실패"}`
      );

      // 2. 휴가자 수 카드 업데이트 (기존 로직 활용)
      if (window.worktimeModalManager) {
        await window.worktimeModalManager.updateVacationCard("today");
        console.log("📊 휴가자 수 카드 업데이트: 성공");
      } else {
        console.warn("⚠️ worktimeModalManager를 찾을 수 없음");
      }

      console.log("✅ 모든 통계 카드 업데이트 완료");
    } catch (error) {
      console.error("❌ 통계 카드 업데이트 중 오류:", error);
    }
  }
}

// 전역 인스턴스 생성
const worktimeDataManager = new WorktimeDataManager();

// 전역 접근 가능하도록 설정
window.worktimeDataManager = worktimeDataManager;
