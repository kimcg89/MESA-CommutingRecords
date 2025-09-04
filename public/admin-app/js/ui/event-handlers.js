// 이벤트 핸들러 및 전역 초기화 - 2025.12.20 생성
// HTML에서 분리된 전역 이벤트 설정 및 초기화

/**
 * 관리자 앱 이벤트 핸들러 클래스
 * 전역 이벤트 리스너, 초기화, 상태 관리 등
 */
class AdminEventManager {
  constructor() {
    this.initialized = false;
    this.eventListeners = new Map();

    console.log(
      "🎧 AdminEventManager 인스턴스 생성 -",
      new Date().toISOString()
    );
  }

  /**
   * 이벤트 매니저 초기화
   * DOM 로드 완료 후 호출
   */
  init() {
    try {
      console.log("🎧 관리자 이벤트 매니저 초기화 시작...");

      // 기본 이벤트 설정
      this.setupGlobalEvents();
      this.setupErrorHandling();
      this.setupCustomEvents();

      // 성능 모니터링
      this.setupPerformanceMonitoring();

      this.initialized = true;
      console.log("✅ 관리자 이벤트 매니저 초기화 완료");
    } catch (error) {
      console.error("❌ 이벤트 매니저 초기화 실패:", error);
    }
  }

  /**
   * 전역 이벤트 설정
   */
  setupGlobalEvents() {
    // 윈도우 리사이즈 이벤트
    const resizeHandler = this.debounce(() => {
      this.handleResize();
    }, 250);

    window.addEventListener("resize", resizeHandler);
    this.eventListeners.set("resize", resizeHandler);

    // 에러 처리
    window.addEventListener("error", (e) => {
      this.handleGlobalError(e.error);
    });

    // Promise 에러 처리
    window.addEventListener("unhandledrejection", (e) => {
      this.handleUnhandledRejection(e.reason);
    });

    // 페이지 가시성 변경
    document.addEventListener("visibilitychange", () => {
      this.handleVisibilityChange();
    });

    console.log("🌐 전역 이벤트 리스너 설정 완료");
  }

  /**
   * 에러 처리 설정
   */
  setupErrorHandling() {
    // Firebase 관련 에러 처리
    document.addEventListener("firebaseError", (e) => {
      this.handleFirebaseError(e.detail);
    });

    // 조직도 관련 에러 처리
    document.addEventListener("orgError", (e) => {
      this.handleOrgError(e.detail);
    });

    console.log("🚨 에러 처리 설정 완료");
  }

  /**
   * 커스텀 이벤트 설정
   */
  setupCustomEvents() {
    // 관리자 패널 변경 이벤트
    document.addEventListener("adminPanelChanged", (e) => {
      this.handlePanelChange(e.detail);
    });

    // 조직도 필터 변경 이벤트
    document.addEventListener("orgFilterChanged", (e) => {
      this.handleOrgFilterChange(e.detail);
    });

    // 조직도 필터 해제 이벤트
    document.addEventListener("orgFilterCleared", () => {
      this.handleOrgFilterClear();
    });

    // 인증 상태 변경 이벤트
    document.addEventListener("authStateChanged", (e) => {
      this.handleAuthStateChange(e.detail);
    });

    // 2025.01.21 14:15 추가: Worktime 필터 변경 이벤트
    document.addEventListener("worktimeFilterChanged", (e) => {
      this.handleWorktimeFilterChange(e.detail);
    });

    console.log("🎯 커스텀 이벤트 리스너 설정 완료");
  }

  /**
   * Worktime 필터 변경 처리 - 2025.01.21 14:15 생성
   */
  handleWorktimeFilterChange(filterDetail) {
    console.log(
      "📊 Worktime 필터 변경됨:",
      filterDetail.changeType,
      filterDetail.filters
    );

    // 통계 카드 자동 업데이트
    if (window.worktimeDataManager && window.worktimeDataManager.isReady()) {
      setTimeout(() => {
        window.worktimeDataManager.updateAllStatsCards();
      }, 100);
    }
  }

  /**
   * 성능 모니터링 설정
   */
  setupPerformanceMonitoring() {
    // 페이지 로드 성능 측정
    window.addEventListener("load", () => {
      this.measurePageLoadPerformance();
    });

    // 메모리 사용량 모니터링 (브라우저 지원 시)
    if (performance.memory) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 60000); // 1분마다
    }

    console.log("📊 성능 모니터링 설정 완료");
  }

  /**
   * 윈도우 리사이즈 처리
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log(`📱 윈도우 리사이즈: ${width}x${height}`);

    // 모바일/태블릿 감지
    if (width <= 768) {
      document.body.classList.add("mobile-view");
      document.body.classList.remove("desktop-view");
    } else {
      document.body.classList.add("desktop-view");
      document.body.classList.remove("mobile-view");
    }

    // 리사이즈 이벤트 발송
    document.dispatchEvent(
      new CustomEvent("adminResize", {
        detail: { width, height },
      })
    );
  }

  /**
   * 전역 에러 처리
   * @param {Error} error - 발생한 에러
   */
  handleGlobalError(error) {
    console.error("💥 전역 에러 발생:", error);

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 관리자 로그 기록
    if (window.AdminUtils) {
      window.AdminUtils.log("error", "전역 에러", errorInfo);
    }

    // 심각한 에러인 경우 사용자에게 알림
    if (this.isCriticalError(error)) {
      this.showErrorNotification(error);
    }
  }

  /**
   * 처리되지 않은 Promise 에러 처리
   * @param {any} reason - 에러 원인
   */
  handleUnhandledRejection(reason) {
    console.error("💥 처리되지 않은 Promise 에러:", reason);

    if (window.AdminUtils) {
      window.AdminUtils.log("error", "처리되지 않은 Promise 에러", {
        reason: reason.toString(),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 페이지 가시성 변경 처리
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log("👁️ 페이지가 숨겨짐");
      // 페이지가 숨겨졌을 때 처리
      this.pauseBackgroundTasks();
    } else {
      console.log("👁️ 페이지가 표시됨");
      // 페이지가 다시 표시됐을 때 처리
      this.resumeBackgroundTasks();
    }
  }

  /**
   * Firebase 에러 처리
   * @param {object} errorDetail - 에러 상세 정보
   */
  handleFirebaseError(errorDetail) {
    console.error("🔥 Firebase 에러:", errorDetail);

    // 에러 타입별 처리
    switch (errorDetail.type) {
      case "auth":
        this.handleAuthError(errorDetail);
        break;
      case "firestore":
        this.handleFirestoreError(errorDetail);
        break;
      default:
        console.warn("알 수 없는 Firebase 에러 타입:", errorDetail.type);
    }
  }

  /**
   * 인증 에러 처리
   * @param {object} errorDetail - 에러 상세 정보
   */
  handleAuthError(errorDetail) {
    console.error("🔐 인증 에러:", errorDetail);

    // 세션 만료 등 특정 에러는 자동 로그아웃
    const criticalAuthErrors = [
      "auth/user-token-expired",
      "auth/user-disabled",
    ];

    if (criticalAuthErrors.includes(errorDetail.code)) {
      if (window.firebaseAuthManager) {
        window.firebaseAuthManager.logout();
      }
    }
  }

  /**
   * Firestore 에러 처리
   * @param {object} errorDetail - 에러 상세 정보
   */
  handleFirestoreError(errorDetail) {
    console.error("📊 Firestore 에러:", errorDetail);

    // 네트워크 에러인 경우 재시도 로직
    if (errorDetail.code === "unavailable") {
      this.scheduleRetry(errorDetail.operation);
    }
  }

  /**
   * 조직도 에러 처리
   * @param {object} errorDetail - 에러 상세 정보
   */
  handleOrgError(errorDetail) {
    console.error("🏢 조직도 에러:", errorDetail);

    if (window.modalManager) {
      window.modalManager.alert("조직도 로드 중 오류가 발생했습니다.", "error");
    }
  }

  /**
   * 패널 변경 처리
   * @param {object} detail - 패널 변경 상세 정보
   */
  handlePanelChange(detail) {
    console.log("🔧 패널 변경됨:", detail.panelType);

    // 패널 변경 시 특별 처리
    this.updatePageTitle(detail.panelType);
    this.trackPanelUsage(detail.panelType);
  }

  /**
   * 조직도 필터 변경 처리 - 2025.01.21 14:05 수정
   * 통계 카드 자동 업데이트 추가
   */
  handleOrgFilterChange(filterDetail) {
    console.log("📊 조직도 필터 변경됨:", filterDetail);
    console.log(
      `👥 필터된 사용자: ${filterDetail.filteredMembers?.length || 0}명`
    );

    // 필터 적용 상태를 UI에 반영
    this.updateFilterStatusUI(filterDetail);

    // 🆕 2025.08.19 16:15 강화: 모든 관련 모듈에 즉시 알림
    this.notifyAllModulesFilterChange("org", filterDetail);
  }

  /**
   * 조직도 필터 해제 처리 - 2025.01.21 14:05 수정
   * 통계 카드 자동 업데이트 추가
   */
  handleOrgFilterClear() {
    console.log("🔄 조직도 필터 해제됨");

    // 필터 해제 상태를 UI에 반영
    this.clearFilterStatusUI();

    // 🆕 2025.08.19 16:15 강화: 모든 관련 모듈에 즉시 알림
    this.notifyAllModulesFilterChange("clear", null);
  }

  // ✅ 신규 추가: notifyAllModulesFilterChange() 함수
  /**
   * 모든 관련 모듈에 필터 변경 알림 - 2025.08.19 16:15 신규 생성
   * 필터 변경 시 관련된 모든 모듈이 즉시 반응하도록 통합 처리
   */
  notifyAllModulesFilterChange(source, detail) {
    console.log(`🔔 필터 변경 알림 시작 (출처: ${source})`);

    // 디바운싱으로 중복 처리 방지
    if (this.filterNotifyTimeout) {
      clearTimeout(this.filterNotifyTimeout);
    }

    this.filterNotifyTimeout = setTimeout(async () => {
      try {
        // 1. 출퇴근 데이터 매니저 - 통계 카드 업데이트
        if (
          window.worktimeDataManager &&
          window.worktimeDataManager.isReady()
        ) {
          console.log("📊 출퇴근 통계 카드 업데이트 중...");
          await window.worktimeDataManager.updateAllStatsCards();
        }

        // 2. GPS 매니저 - 마커 업데이트
        if (window.worktimeGpsManager && window.worktimeGpsManager.isReady()) {
          console.log("🗺️ GPS 마커 업데이트 중...");
          await window.worktimeGpsManager.refreshGpsData();
        }

        // 3. 기타 필터 연동이 필요한 모듈들
        this.updateOtherModulesForFilter(source, detail);

        console.log("✅ 모든 모듈 필터 변경 알림 완료");
      } catch (error) {
        console.error("❌ 필터 변경 알림 처리 실패:", error);
      }
    }, 200); // 200ms 디바운싱
  }

  // ✅ 신규 추가: updateOtherModulesForFilter() 함수
  /**
   * 기타 모듈들의 필터 연동 처리 - 2025.08.19 16:15 신규 생성
   * 향후 추가되는 다른 모듈들의 필터 연동을 위한 확장 포인트
   */
  updateOtherModulesForFilter(source, detail) {
    // 업무 관리 모듈이 있다면
    if (
      window.todoManager &&
      typeof window.todoManager.applyFilter === "function"
    ) {
      window.todoManager.applyFilter(detail);
    }

    // 작업 관리 모듈이 있다면
    if (
      window.taskManager &&
      typeof window.taskManager.applyFilter === "function"
    ) {
      window.taskManager.applyFilter(detail);
    }

    // 통합 필터 매니저에 상태 동기화
    if (
      window.worktimeFilterManager &&
      window.worktimeFilterManager.isReady()
    ) {
      console.log("🔗 통합 필터 매니저와 동기화");
    }

    console.log("🔄 기타 모듈 필터 연동 처리 완료");
  }

  /**
   * 인증 상태 변경 처리
   * @param {object} detail - 인증 상태 상세 정보
   */
  handleAuthStateChange(detail) {
    console.log("🔐 인증 상태 변경됨:", detail.action);

    if (detail.action === "login") {
      this.onUserLogin(detail.userData);
    } else if (detail.action === "logout") {
      this.onUserLogout();
    }
  }

  /**
   * 사용자 로그인 처리
   * @param {object} userData - 사용자 데이터
   */
  onUserLogin(userData) {
    console.log("👤 사용자 로그인:", userData.name);

    // 환영 메시지 표시
    if (window.modalManager) {
      window.modalManager.alert(`${userData.name}님, 환영합니다!`, "success");
    }

    // 사용자 활동 추적 시작
    this.startUserActivityTracking();
  }

  /**
   * 사용자 로그아웃 처리
   */
  onUserLogout() {
    console.log("👋 사용자 로그아웃");

    // 사용자 활동 추적 중지
    this.stopUserActivityTracking();

    // 임시 데이터 정리
    this.clearTemporaryData();
  }

  /**
   * 페이지 로드 성능 측정
   */
  measurePageLoadPerformance() {
    if (performance.timing) {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`⚡ 페이지 로드 시간: ${loadTime}ms`);

      if (window.AdminUtils) {
        window.AdminUtils.log("info", "페이지 로드 성능", {
          loadTime,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * 메모리 사용량 확인
   */
  checkMemoryUsage() {
    if (performance.memory) {
      const memoryInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };

      console.log(
        `🧠 메모리 사용량: ${memoryInfo.used}MB / ${memoryInfo.total}MB`
      );

      // 메모리 사용량이 높으면 경고
      if (memoryInfo.used > memoryInfo.limit * 0.8) {
        console.warn(
          "⚠️ 메모리 사용량이 높습니다. 페이지 새로고침을 권장합니다."
        );
      }
    }
  }

  /**
   * 심각한 에러 여부 판단
   * @param {Error} error - 에러 객체
   * @returns {boolean} 심각한 에러 여부
   */
  isCriticalError(error) {
    const criticalPatterns = [
      /firebase/i,
      /auth/i,
      /network/i,
      /chunk load failed/i,
    ];

    return criticalPatterns.some(
      (pattern) => pattern.test(error.message) || pattern.test(error.stack)
    );
  }

  /**
   * 에러 알림 표시
   * @param {Error} error - 에러 객체
   */
  showErrorNotification(error) {
    if (window.modalManager) {
      window.modalManager.alert(
        "시스템 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.",
        "error"
      );
    }
  }

  /**
   * 배경 작업 일시 정지
   */
  pauseBackgroundTasks() {
    // 자동 새로고침 등 배경 작업 일시 정지
    console.log("⏸️ 배경 작업 일시 정지");
  }

  /**
   * 배경 작업 재개
   */
  resumeBackgroundTasks() {
    // 배경 작업 재개
    console.log("▶️ 배경 작업 재개");

    // 조직도 데이터 새로고침
    if (window.firebaseOrgManager) {
      window.firebaseOrgManager.loadOrganizationData();
    }
  }

  /**
   * 재시도 스케줄링
   * @param {string} operation - 재시도할 작업
   */
  scheduleRetry(operation) {
    console.log(`🔄 ${operation} 작업 재시도 예약`);

    setTimeout(() => {
      // 재시도 로직 구현
      console.log(`🔄 ${operation} 작업 재시도 실행`);
    }, 5000); // 5초 후 재시도
  }

  /**
   * 페이지 제목 업데이트
   * @param {string} panelType - 패널 타입
   */
  updatePageTitle(panelType) {
    const titles = {
      "org-management": "MESA 관리자 - 조직관리",
      "user-management": "MESA 관리자 - 사용자관리",
      "attendance-management": "MESA 관리자 - 출퇴근관리",
      "system-settings": "MESA 관리자 - 시스템설정",
    };

    document.title = titles[panelType] || "MESA 관리자 대시보드";
  }

  /**
   * 패널 사용량 추적
   * @param {string} panelType - 패널 타입
   */
  trackPanelUsage(panelType) {
    if (window.AdminUtils) {
      window.AdminUtils.log("info", "패널 사용", {
        panelType,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 필터 상태 UI 업데이트
   * @param {object} filterDetail - 필터 상세 정보
   */
  updateFilterStatusUI(filterDetail) {
    // 필터 상태 UI 업데이트 로직
    const userCount = filterDetail.filteredMembers?.length || 0;
    console.log(`🎯 필터 상태 UI 업데이트: ${userCount}명 선택됨`);

    // 🆕 2025.08.19 16:15 추가: 상태바에 필터 정보 표시
    this.showFilterStatusBadge(userCount, filterDetail);
  }

  /**
   * 필터 상태 배지 표시 - 2025.08.19 16:15 신규 생성
   * 현재 필터 상태를 사용자에게 시각적으로 표시
   */
  showFilterStatusBadge(userCount, filterDetail) {
    const statusElement = document.getElementById("filter-status-badge");

    if (statusElement) {
      if (userCount > 0) {
        statusElement.style.display = "inline-block";
        statusElement.textContent = `${userCount}명 선택됨`;
        statusElement.className = "filter-status-badge active";
      } else {
        statusElement.style.display = "none";
      }
    }

    console.log(
      `📊 필터 상태 배지 업데이트: ${userCount > 0 ? "표시" : "숨김"}`
    );
  }

  /**
   * 필터 상태 UI 해제
   */
  clearFilterStatusUI() {
    // 필터 상태 UI 해제 로직
    console.log("🔄 필터 상태 UI 해제");

    // 🆕 2025.08.19 16:15 추가: 상태바 숨김
    const statusElement = document.getElementById("filter-status-badge");
    if (statusElement) {
      statusElement.style.display = "none";
      statusElement.textContent = "";
    }

    console.log("🔄 필터 상태 배지 숨김 완료");
  }

  /**
   * 사용자 활동 추적 중지
   */
  stopUserActivityTracking() {
    console.log("📊 사용자 활동 추적 중지");
  }

  /**
   * 임시 데이터 정리
   */
  clearTemporaryData() {
    // 로컬스토리지 임시 데이터 정리
    const keysToRemove = ["adminPanelState", "tempUserData"];
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("🧹 임시 데이터 정리 완료");
  }

  /**
   * 디바운스 유틸리티
   * @param {Function} func - 실행할 함수
   * @param {number} wait - 대기 시간 (밀리초)
   * @returns {Function} 디바운스된 함수
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 이벤트 리스너 제거
   */
  cleanup() {
    this.eventListeners.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });

    this.eventListeners.clear();
    console.log("🧹 이벤트 리스너 정리 완료");
  }
}

// 전역 인스턴스 생성
const adminEventManager = new AdminEventManager();

// 전역 접근 가능하도록 설정
window.adminEventManager = adminEventManager;

// DOM 로드 완료 시 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    adminEventManager.init();
  });
} else {
  // 이미 로드된 경우 즉시 초기화
  adminEventManager.init();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  adminEventManager.cleanup();
});

console.log("📦 event-handlers.js 로드 완료 -", new Date().toISOString());
