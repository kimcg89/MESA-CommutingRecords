// 출퇴근 분석 데이터 처리 모듈 - 2025.08.19 19:45 완성
// 근무건수 분석과 일자별 상세 현황을 위한 공통 데이터 처리

/**
 * 출퇴근 분석 데이터 처리 클래스
 * 거리 계산, 색상 매핑, 데이터 집계 등 공통 로직 담당
 */
class WorktimeAnalyticsManager {
  constructor() {
    this.isInitialized = false;

    // 본사 좌표 (기존 worktime-data-manager와 동일)
    this.OFFICE_LAT = 37.53626;
    this.OFFICE_LNG = 126.895005;

    // 데이터 캐시
    this.dataCache = new Map();
    this.lastCacheTime = null;

    console.log("📊 WorktimeAnalyticsManager 생성 - 2025.08.19 19:45");
  }

  /**
   * 초기화 함수 - 2025.08.19 20:10 수정: 초기화 완료 이벤트 발생
   */
  async init() {
    try {
      console.log("📊 출퇴근 분석 매니저 초기화 시작...");

      // Firebase 준비 대기
      await this.waitForFirebase();

      // 캐시 정리 (메모리 최적화)
      this.cleanupOldCache();

      // 필터 변경 이벤트 리스너 설정
      this.setupFilterEventListeners();

      this.isInitialized = true;
      console.log("✅ 출퇴근 분석 매니저 초기화 완료");

      // 🆕 2025.08.19 20:10 추가: 초기화 완료 이벤트 발생
      this.notifyInitializationComplete();

      // 초기화 완료 후 캐시 사전 로드 (백그라운드)
      setTimeout(() => {
        this.preloadInitialCache();
      }, 2000);
    } catch (error) {
      console.error("❌ 출퇴근 분석 매니저 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 초기화 완료 알림 - 2025.08.19 20:10 신규 생성
   */
  notifyInitializationComplete() {
    console.log("📢 [분석] 초기화 완료 이벤트 발생");

    // 커스텀 이벤트 발생
    const event = new CustomEvent("analyticsManagerReady", {
      detail: {
        source: "worktimeAnalyticsManager",
        timestamp: new Date().toISOString(),
        hasData: this.dataCache.size > 0,
      },
      bubbles: true,
    });

    document.dispatchEvent(event);

    // 추가 지연 후 차트/테이블 업데이트 트리거
    setTimeout(() => {
      this.triggerInitialDataLoad();
    }, 1000);
  }

  /**
   * 초기 데이터 로드 트리거 - 2025.08.19 20:10 신규 생성
   */
  async triggerInitialDataLoad() {
    try {
      console.log("🚀 [분석] 초기 데이터 로드 트리거");

      const selectedEmails = this.getSelectedUserEmails();
      if (selectedEmails.length === 0) {
        console.log("📭 [분석] 선택된 사용자가 없어 초기 로드 생략");
        return;
      }

      console.log(
        `🎯 [분석] 선택된 사용자 ${selectedEmails.length}명에 대한 초기 로드 시작`
      );

      // 차트 매니저 업데이트
      if (
        window.worktimeChartManager &&
        window.worktimeChartManager.isReady()
      ) {
        console.log("📊 [분석] 차트 초기 업데이트 요청");
        await window.worktimeChartManager.updateChart();
      }

      // 테이블 매니저 업데이트
      if (
        window.worktimeDetailManager &&
        window.worktimeDetailManager.isReady()
      ) {
        console.log("📋 [분석] 테이블 초기 업데이트 요청");
        await window.worktimeDetailManager.updateTable();
      }

      console.log("✅ [분석] 초기 데이터 로드 완료");
    } catch (error) {
      console.error("❌ [분석] 초기 데이터 로드 실패:", error);
    }
  }

  /**
   * Firebase 초기화 대기 - 2025.08.19 17:10 생성
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
   * 필터 변경 이벤트 리스너 설정 - 2025.08.19 수정: 새로 추가
   */
  setupFilterEventListeners() {
    // 조직도 필터 변경 이벤트
    document.addEventListener("orgFilterChanged", (e) => {
      console.log("📊 [분석] 조직도 필터 변경 감지");
      this.handleFilterChange();
    });

    document.addEventListener("orgFilterCleared", () => {
      console.log("📊 [분석] 조직도 필터 해제 감지");
      this.handleFilterChange();
    });

    // Worktime 필터 변경 이벤트
    document.addEventListener("worktimeFilterChanged", (e) => {
      console.log("📊 [분석] Worktime 필터 변경 감지");
      this.handleFilterChange();
    });

    console.log("🎧 분석 필터 이벤트 리스너 설정 완료");
  }

  /**
   * 필터 변경 처리 - 2025.08.19 수정: 새로 추가
   */
  handleFilterChange() {
    // 디바운싱으로 중복 호출 방지
    if (this.filterUpdateTimeout) {
      clearTimeout(this.filterUpdateTimeout);
    }

    this.filterUpdateTimeout = setTimeout(() => {
      try {
        console.log("📊 [분석] 필터 변경에 따른 캐시 클리어");
        this.clearCache();
      } catch (error) {
        console.error("❌ [분석] 필터 변경 처리 실패:", error);
      }
    }, 300);
  }

  /**
   * 초기 캐시 사전 로드 - 2025.08.19 17:10 생성
   */
  async preloadInitialCache() {
    try {
      const selectedEmails = this.getSelectedUserEmails();
      if (selectedEmails.length > 0) {
        await this.preloadAnalyticsCache(selectedEmails, 30);
      }
    } catch (error) {
      console.error("❌ 초기 캐시 사전 로드 실패:", error);
    }
  }

  /**
   * 사용자 일일 레코드 가져오기 - 2025.08.19 수정: 디버깅 강화
   * 캐시 우선 → Firebase 직접 쿼리 → 분석용 캐시 저장
   */
  async getUserDayRecords(userEmail, dateStr) {
    const cacheKey = `${userEmail}_${dateStr}`;

    console.log(`🔍 getUserDayRecords 호출: ${userEmail}, ${dateStr}`);

    // 1. 분석용 캐시에서 먼저 확인
    if (this.dataCache.has(cacheKey)) {
      console.log(`📦 분석용 캐시에서 반환: ${cacheKey}`);
      return this.dataCache.get(cacheKey);
    }

    // 2. worktime-data-manager의 기존 캐시 확인 (오늘 데이터만)
    const isCurrentDateToday = this.isToday(dateStr);
    console.log(`📅 날짜 ${dateStr}가 오늘인가? ${isCurrentDateToday}`);

    if (
      window.worktimeDataManager &&
      window.worktimeDataManager.getCachedRecord &&
      isCurrentDateToday
    ) {
      const cachedRecord =
        window.worktimeDataManager.getCachedRecord(userEmail);
      if (cachedRecord) {
        console.log(`📦 기존 캐시에서 오늘 데이터 반환: ${userEmail}`);
        this.dataCache.set(cacheKey, cachedRecord);
        return cachedRecord;
      } else {
        console.log(`📭 기존 캐시에 오늘 데이터 없음: ${userEmail}`);
      }
    }

    // 3. Firebase에서 직접 쿼리 (모든 경우에 대해 시도)
    try {
      console.log(`🔍 Firebase에서 직접 쿼리 시도: ${userEmail}, ${dateStr}`);
      const record = await this.queryFirebaseRecord(userEmail, dateStr);

      if (record) {
        // 분석용 캐시에 저장
        this.dataCache.set(cacheKey, record);
        console.log(
          `✅ Firebase 쿼리 성공 및 캐시 저장: ${userEmail}, ${dateStr}`,
          {
            start: record.start?.length || 0,
            gps: record.gps?.length || 0,
            end: record.end?.length || 0,
          }
        );
        return record;
      } else {
        console.log(`📭 Firebase에 데이터 없음: ${userEmail}, ${dateStr}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Firebase 쿼리 실패: ${userEmail}, ${dateStr}`, error);
      return null;
    }
  }

  /**
   * Firebase에서 특정 날짜 레코드 직접 쿼리 - 2025.08.19 수정: 새로 추가
   */
  async queryFirebaseRecord(userEmail, dateStr) {
    if (!window.firebaseFirestore) {
      console.error("❌ Firebase Firestore가 초기화되지 않았습니다.");
      return null;
    }

    try {
      console.log(
        `📄 Firebase 문서 쿼리: records/${userEmail}/dates/${dateStr}`
      );

      const docRef = window.firebaseFirestore
        .collection("records")
        .doc(userEmail)
        .collection("dates")
        .doc(dateStr);

      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`📭 문서 없음: ${userEmail} ${dateStr}`);
        return null;
      }

      const data = doc.data();
      console.log(`📊 Firebase 데이터 로드 성공:`, {
        userEmail,
        dateStr,
        start: data.start?.length || 0,
        gps: data.gps?.length || 0,
        end: data.end?.length || 0,
      });

      return data;
    } catch (error) {
      console.error(`❌ Firebase 쿼리 오류: ${userEmail}, ${dateStr}`, error);
      return null;
    }
  }

  /**
   * 오늘 날짜인지 확인 - 2025.08.19 수정: 디버깅 추가
   */
  isToday(dateStr) {
    const now = new Date();

    // 로컬 시간으로 오늘 날짜 계산
    const localToday = now.toISOString().split("T")[0];

    // KST 시간으로 오늘 날짜 계산
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const kstToday = kstDate.toISOString().split("T")[0];

    console.log(
      `📅 날짜 비교 - 입력: ${dateStr}, 로컬: ${localToday}, KST: ${kstToday}`
    );

    const result = dateStr === localToday || dateStr === kstToday;
    console.log(`📅 isToday 결과: ${result}`);

    return result;
  }

  /**
   * 거리 계산 함수 - 2025.08.19 17:10 생성
   * Haversine 공식 사용
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

    return R * c; // 미터 단위
  }

  /**
   * 총 이동거리 계산 - 2025.08.19 수정: 비동기 처리 및 오류 수정
   * 데이터 상황에 따른 유연한 계산 (예외 처리 포함)
   */
  async calculateTotalDistance(userEmail, dateStr) {
    try {
      const records = await this.getUserDayRecords(userEmail, dateStr);
      if (!records) {
        console.log(`📍 ${userEmail} ${dateStr}: 레코드 없음`);
        return 0;
      }

      let totalDistance = 0;
      const locations = [];

      console.log(`📍 ${userEmail} ${dateStr} 거리 계산 시작:`, {
        start: records.start?.length || 0,
        gps: records.gps?.length || 0,
        end: records.end?.length || 0,
      });

      // 모든 위치 데이터 수집 (시간순 정렬)
      if (records.start?.length > 0) {
        records.start.forEach((startData, index) => {
          console.log(`🔍 start[${index}] 검사:`, startData);
          console.log(`🔍 start[${index}].gps:`, startData.gps);
          console.log(`🔍 start[${index}].gps 타입:`, typeof startData.gps);

          if (startData.gps && this.isValidLocation(startData.gps)) {
            locations.push({
              ...this.parseLocation(startData.gps),
              time: startData.time || "00:00",
              type: "start",
            });
            console.log(`✅ start 위치 추가 성공: ${startData.gps}`);
          } else {
            console.log(`❌ start 위치 추가 실패: ${startData.gps}`);
          }
        });
      }

      if (records.gps?.length > 0) {
        records.gps.forEach((gpsData, index) => {
          console.log(`🔍 gps[${index}] 검사:`, gpsData);
          console.log(`🔍 gps[${index}].gps:`, gpsData.gps);
          console.log(`🔍 gps[${index}].gps 타입:`, typeof gpsData.gps);

          if (gpsData.gps && this.isValidLocation(gpsData.gps)) {
            locations.push({
              ...this.parseLocation(gpsData.gps),
              time: gpsData.time || "12:00",
              type: "gps",
            });
            console.log(`✅ gps 위치 추가 성공: ${gpsData.gps}`);
          } else {
            console.log(`❌ gps 위치 추가 실패: ${gpsData.gps}`);
          }
        });
      }

      if (records.end?.length > 0) {
        records.end.forEach((endData, index) => {
          console.log(`🔍 end[${index}] 검사:`, endData);
          console.log(`🔍 end[${index}].gps:`, endData.gps);
          console.log(`🔍 end[${index}].gps 타입:`, typeof endData.gps);

          if (endData.gps && this.isValidLocation(endData.gps)) {
            locations.push({
              ...this.parseLocation(endData.gps),
              time: endData.time || "18:00",
              type: "end",
            });
            console.log(`✅ end 위치 추가 성공: ${endData.gps}`);
          } else {
            console.log(`❌ end 위치 추가 실패: ${endData.gps}`);
          }
        });
      }

      // 시간순 정렬
      locations.sort((a, b) => a.time.localeCompare(b.time));

      if (locations.length === 0) {
        console.log(`📍 ${userEmail} ${dateStr}: 유효한 위치 데이터 없음`);
        return 0;
      }

      if (locations.length === 1) {
        // 위치 하나만 존재: 본사 ~ 해당 위치
        totalDistance = this.calculateDistance(
          this.OFFICE_LAT,
          this.OFFICE_LNG,
          locations[0].lat,
          locations[0].lng
        );
        console.log(
          `📍 ${userEmail} ${dateStr}: 위치 1개, 본사 거리 ${(
            totalDistance / 1000
          ).toFixed(2)}km`
        );
        return totalDistance;
      }

      // 여러 위치 존재: 본사 → 첫 위치 + 위치간 이동거리
      // 1. 본사 → 첫 위치
      totalDistance += this.calculateDistance(
        this.OFFICE_LAT,
        this.OFFICE_LNG,
        locations[0].lat,
        locations[0].lng
      );

      // 2. 위치간 순차적 이동거리
      for (let i = 0; i < locations.length - 1; i++) {
        const segmentDistance = this.calculateDistance(
          locations[i].lat,
          locations[i].lng,
          locations[i + 1].lat,
          locations[i + 1].lng
        );
        totalDistance += segmentDistance;
        console.log(
          `📍 구간 ${i + 1}: ${(segmentDistance / 1000).toFixed(2)}km`
        );
      }

      console.log(
        `📍 ${userEmail} ${dateStr}: ${locations.length}개 위치, 총 ${(
          totalDistance / 1000
        ).toFixed(2)}km`
      );
      return totalDistance;
    } catch (error) {
      console.error(`❌ ${userEmail} ${dateStr} 거리 계산 실패:`, error);
      return 0;
    }
  }

  /**
   * 위치 데이터 유효성 검사 - 2025.08.19 18:30 수정: GPS 정규식 패턴 개선
   */
  isValidLocation(locationStr) {
    if (!locationStr || typeof locationStr !== "string") {
      console.log(
        `❌ 유효하지 않은 위치 데이터: ${typeof locationStr}`,
        locationStr
      );
      return false;
    }

    console.log(`🔍 위치 데이터 검증: ${locationStr}`);

    // "위도: 37.536302, 경도: 127.994929" 형식 지원
    if (locationStr.includes("위도:") && locationStr.includes("경도:")) {
      const latMatch = locationStr.match(/위도:\s*([-+]?\d+(?:\.\d+)?)/);
      const lngMatch = locationStr.match(/경도:\s*([-+]?\d+(?:\.\d+)?)/);

      console.log(`🔍 정규식 매칭 결과: lat=${latMatch}, lng=${lngMatch}`);

      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        const isValid =
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180;
        console.log(
          `✅ 한글 형식 GPS 검증: lat=${lat}, lng=${lng}, valid=${isValid}`
        );
        return isValid;
      } else {
        console.log(
          `❌ 정규식 매칭 실패: latMatch=${!!latMatch}, lngMatch=${!!lngMatch}`
        );
        return false;
      }
    }

    // 기본 "lat,lng" 형식
    const coords = locationStr.split(",");
    if (coords.length !== 2) {
      console.log(`❌ 좌표 형식 오류: ${coords.length}개 요소`);
      return false;
    }

    const lat = parseFloat(coords[0].trim());
    const lng = parseFloat(coords[1].trim());

    const isValid =
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    console.log(
      `✅ 기본 형식 GPS 검증: lat=${lat}, lng=${lng}, valid=${isValid}`
    );
    return isValid;
  }

  /**
   * 위치 문자열 파싱 - 2025.08.19 18:30 수정: GPS 정규식 패턴 개선
   */
  parseLocation(locationStr) {
    console.log(`🔍 위치 파싱 시작: ${locationStr}`);

    // "위도: 37.536302, 경도: 127.994929" 형식 - 정규식 수정
    if (locationStr.includes("위도:") && locationStr.includes("경도:")) {
      const latMatch = locationStr.match(/위도:\s*([-+]?\d+(?:\.\d+)?)/);
      const lngMatch = locationStr.match(/경도:\s*([-+]?\d+(?:\.\d+)?)/);

      console.log(
        `🔍 파싱 정규식 매칭: lat=${latMatch?.[1]}, lng=${lngMatch?.[1]}`
      );

      if (latMatch && lngMatch) {
        const result = {
          lat: parseFloat(latMatch[1]),
          lng: parseFloat(lngMatch[1]),
        };
        console.log(`✅ 한글 형식 파싱 결과:`, result);
        return result;
      }
    }

    // 기본 "lat,lng" 형식
    const coords = locationStr.split(",");
    const result = {
      lat: parseFloat(coords[0].trim()),
      lng: parseFloat(coords[1].trim()),
    };
    console.log(`✅ 기본 형식 파싱 결과:`, result);
    return result;
  }

  /**
   * 일자별 상세 데이터 생성 - 2025.08.19 수정: 비동기 처리 추가
   */
  async getDailyDetailData(userEmails, startDate, endDate) {
    const result = [];

    console.log(`📊 [분석] 일자별 상세 데이터 생성: ${userEmails.length}명`);

    for (const userEmail of userEmails) {
      // 사용자 정보 가져오기
      const userInfo = this.getUserInfo(userEmail);
      const userColor = this.getUserColor(userEmail);

      // 날짜 범위 순회
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);

      while (currentDate <= lastDate) {
        const dateStr = currentDate.toISOString().split("T")[0];

        try {
          // ✅ await 추가: 비동기 호출 올바르게 처리
          const records = await this.getUserDayRecords(userEmail, dateStr);

          // 평일/휴일 구분
          const dayType = this.getDayType(currentDate);

          // 🆕 2025.08.19 수정: start + gps + end 총 GPS 건수 계산
          const startCount = records?.start?.length || 0;
          const gpsCount = records?.gps?.length || 0;
          const endCount = records?.end?.length || 0;
          const totalGpsCount = startCount + gpsCount + endCount;

          // 이동거리 계산 (비동기)
          const totalDistance = await this.calculateTotalDistance(
            userEmail,
            dateStr
          );

          console.log(
            `📊 [분석] ${userEmail} ${dateStr}: start(${startCount}) + gps(${gpsCount}) + end(${endCount}) = 총 ${totalGpsCount}건, 거리 ${(
              totalDistance / 1000
            ).toFixed(2)}km`
          );

          result.push({
            date: dateStr,
            userEmail: userEmail,
            userName: userInfo?.name || userEmail,
            department: userInfo?.department || "-",
            position: userInfo?.position || "-",
            dayType: dayType,
            gpsCount: totalGpsCount, // 🆕 총 GPS 건수로 변경
            totalDistance: totalDistance,
            userColor: userColor,
          });
        } catch (error) {
          console.error(`❌ [분석] ${userEmail} ${dateStr} 처리 실패:`, error);

          // 오류 시에도 기본 데이터 추가
          result.push({
            date: dateStr,
            userEmail: userEmail,
            userName: userInfo?.name || userEmail,
            department: userInfo?.department || "-",
            position: userInfo?.position || "-",
            dayType: this.getDayType(currentDate),
            gpsCount: 0,
            totalDistance: 0,
            userColor: userColor,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // 날짜 내림차순 정렬
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`📊 [분석] 일자별 상세 데이터 생성 완료: ${result.length}건`);

    return result;
  }

  /**
   * 차트용 데이터 변환 - 2025.08.19 19:45 신규 생성
   * 기존 getDailyDetailData() 결과를 차트 형식으로 변환
   */
  transformDetailDataForChart(detailData) {
    const result = {};

    // 사용자별로 그룹화
    detailData.forEach((row) => {
      if (!result[row.userEmail]) {
        result[row.userEmail] = {};
      }

      result[row.userEmail][row.date] = {
        start: 0, // 기존 데이터에는 구분이 없으므로 전체를 total로
        gps: 0,
        end: 0,
        total: row.gpsCount || 0,
      };
    });

    console.log(
      `📊 [차트] 상세 데이터를 차트용으로 변환 완료:`,
      Object.keys(result).length,
      "명"
    );
    return result;
  }

  /**
   * 평일/휴일 구분 - 2025.08.19 17:10 생성
   */
  getDayType(date) {
    const day = date.getDay();
    return day === 0 || day === 6 ? "휴일" : "평일";
  }

  /**
   * 사용자 정보 가져오기 - 2025.08.19 17:10 생성
   */
  getUserInfo(userEmail) {
    if (
      window.organizationManager &&
      window.organizationManager.findMemberByEmail
    ) {
      return window.organizationManager.findMemberByEmail(userEmail);
    }
    return null;
  }

  /**
   * 사용자 색상 가져오기 - 2025.08.19 17:10 생성
   */
  getUserColor(userEmail) {
    // 기본 색상 팔레트
    const colorPalette = [
      { bg: "#ef4444", border: "#dc2626" }, // 빨강
      { bg: "#f97316", border: "#ea580c" }, // 주황
      { bg: "#eab308", border: "#ca8a04" }, // 노랑
      { bg: "#22c55e", border: "#16a34a" }, // 초록
      { bg: "#06b6d4", border: "#0891b2" }, // 하늘
      { bg: "#3b82f6", border: "#2563eb" }, // 파랑
      { bg: "#8b5cf6", border: "#7c3aed" }, // 보라
      { bg: "#ec4899", border: "#db2777" }, // 분홍
      { bg: "#10b981", border: "#059669" }, // 에메랄드
      { bg: "#f59e0b", border: "#d97706" }, // 앰버
      { bg: "#84cc16", border: "#65a30d" }, // 라임
      { bg: "#14b8a6", border: "#0d9488" }, // 틸
      { bg: "#6366f1", border: "#4f46e5" }, // 인디고
      { bg: "#a855f7", border: "#9333ea" }, // 바이올렛
      { bg: "#f43f5e", border: "#e11d48" }, // 로즈
    ];

    // 이메일 해시 기반 색상 선택
    let hash = 0;
    for (let i = 0; i < userEmail.length; i++) {
      const char = userEmail.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const index = Math.abs(hash) % colorPalette.length;
    return { ...colorPalette[index], index };
  }

  /**
   * 선택된 사용자 이메일 목록 가져오기 - 2025.08.19 17:10 생성
   */
  getSelectedUserEmails() {
    if (
      window.worktimeDataManager &&
      window.worktimeDataManager.getSelectedUserEmails
    ) {
      return window.worktimeDataManager.getSelectedUserEmails();
    }
    return [];
  }

  /**
   * 초기화 상태 확인 - 2025.08.19 17:10 생성
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * 캐시 클리어 - 2025.08.19 17:10 생성
   */
  clearCache() {
    this.dataCache.clear();
    this.lastCacheTime = null;
    console.log("🗑️ 분석 데이터 캐시 클리어됨");
  }

  /**
   * 분석용 캐시 사전 로드 - 2025.08.19 수정: 새로 추가
   * 선택된 사용자들의 최근 30일 데이터를 미리 로드
   */
  async preloadAnalyticsCache(userEmails, days = 30) {
    if (!userEmails || userEmails.length === 0) {
      console.log("📭 사전 로드할 사용자가 없습니다.");
      return;
    }

    console.log(
      `📦 분석용 캐시 사전 로드 시작: ${userEmails.length}명, ${days}일`
    );

    const today = new Date();
    const loadPromises = [];

    userEmails.forEach((userEmail) => {
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        const dateStr = targetDate.toISOString().split("T")[0];

        // 캐시에 없는 데이터만 로드
        const cacheKey = `${userEmail}_${dateStr}`;
        if (!this.dataCache.has(cacheKey)) {
          loadPromises.push(this.getUserDayRecords(userEmail, dateStr));
        }
      }
    });

    try {
      await Promise.all(loadPromises);
      console.log(
        `✅ 분석용 캐시 사전 로드 완료: ${loadPromises.length}개 쿼리`
      );
    } catch (error) {
      console.error("❌ 분석용 캐시 사전 로드 실패:", error);
    }
  }

  /**
   * 캐시 크기 관리 - 2025.08.19 수정: 새로 추가
   * 오래된 캐시 데이터 정리 (메모리 최적화)
   */
  cleanupOldCache() {
    const today = new Date();
    const maxAge = 60; // 60일 이상된 캐시 삭제
    let deletedCount = 0;

    for (const [cacheKey, data] of this.dataCache.entries()) {
      try {
        const [userEmail, dateStr] = cacheKey.split("_");
        const cacheDate = new Date(dateStr);
        const daysDiff = Math.floor(
          (today - cacheDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > maxAge) {
          this.dataCache.delete(cacheKey);
          deletedCount++;
        }
      } catch (error) {
        // 잘못된 캐시 키는 삭제
        this.dataCache.delete(cacheKey);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🗑️ 오래된 캐시 정리 완료: ${deletedCount}개 삭제`);
    }
  }

  /**
   * 캐시 통계 정보 - 2025.08.19 수정: 새로 추가
   */
  getCacheStats() {
    const stats = {
      totalEntries: this.dataCache.size,
      users: new Set(),
      dateRange: { oldest: null, newest: null },
    };

    for (const cacheKey of this.dataCache.keys()) {
      try {
        const [userEmail, dateStr] = cacheKey.split("_");
        stats.users.add(userEmail);

        const date = new Date(dateStr);
        if (!stats.dateRange.oldest || date < stats.dateRange.oldest) {
          stats.dateRange.oldest = date;
        }
        if (!stats.dateRange.newest || date > stats.dateRange.newest) {
          stats.dateRange.newest = date;
        }
      } catch (error) {
        // 무시
      }
    }

    stats.userCount = stats.users.size;
    delete stats.users; // Set 객체 제거

    return stats;
  }

  /**
   * 특정 날짜 데이터 강제 테스트 - 2025.08.19 수정: 디버깅용
   */
  async testSpecificDate(userEmail, dateStr) {
    console.log(`🧪 특정 날짜 데이터 테스트: ${userEmail}, ${dateStr}`);

    try {
      const record = await this.queryFirebaseRecord(userEmail, dateStr);

      if (record) {
        console.log(`✅ 테스트 성공!`, {
          userEmail,
          dateStr,
          start: record.start?.length || 0,
          gps: record.gps?.length || 0,
          end: record.end?.length || 0,
          vacation: record.vacation ? "휴가 있음" : "휴가 없음",
          rawData: record,
        });

        return record;
      } else {
        console.log(`❌ 테스트 실패: 데이터 없음`);
        return null;
      }
    } catch (error) {
      console.error(`❌ 테스트 오류:`, error);
      return null;
    }
  }
}

// 전역 인스턴스 생성
const worktimeAnalyticsManager = new WorktimeAnalyticsManager();

// 전역 접근 가능하도록 설정
window.worktimeAnalyticsManager = worktimeAnalyticsManager;

console.log("📦 worktime-analytics.js 로드 완료 - 2025.08.19 19:45");
