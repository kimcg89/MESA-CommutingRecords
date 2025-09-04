// 관리자 앱 메인 진입점 - 2025.08.18 수정: ES6 모듈 문법 제거
// 모든 모듈을 초기화하고 애플리케이션을 시작하는 메인 파일

/**
 * 관리자 애플리케이션 클래스 - 2025.08.18 수정: ES6 모듈 오류 해결
 * 모든 모듈의 초기화와 생명주기를 관리
 */
class AdminApp {
  constructor() {
    this.initialized = false;
    this.modules = new Map();
    this.initStartTime = Date.now();

    console.log("🚀 관리자 앱 생성자 호출");
  }

  /**
   * 애플리케이션 초기화 - 2025.08.18 수정: 안정성 강화
   * 단계별로 모듈들을 초기화
   */
  async initialize() {
    try {
      console.log("📋 관리자 앱 초기화 시작...");

      // 1. Firebase 초기화
      await this.initializeFirebase();

      // 2. 기본 UI 초기화
      this.initializeUI();

      // 3. 인증 시스템 초기화 (기존 코드 호환)
      await this.initializeAuth();

      // 4. 이벤트 리스너 설정
      this.setupEventListeners();

      // 5. 초기화 완료
      this.finalize();
    } catch (error) {
      console.error("❌ 관리자 앱 초기화 실패:", error);
      this.showInitializationError(error);
    }
  }

  /**
   * Firebase 초기화 - 2025.08.18 수정: 오류 처리 강화
   */
  async initializeFirebase() {
    console.log("🔥 Firebase 초기화 중...");

    try {
      if (window.firebaseInitializer) {
        const success = await window.firebaseInitializer.initialize();
        if (!success) {
          throw new Error("Firebase 초기화 실패");
        }
      } else {
        console.warn("⚠️ firebaseInitializer를 찾을 수 없음. 기존 방식 사용");
        // 기존 방식 fallback
        if (typeof initializeFirebase === "function") {
          initializeFirebase();
        }
      }

      console.log("✅ Firebase 초기화 완료");
    } catch (error) {
      console.error("❌ Firebase 초기화 중 오류:", error);
      throw error;
    }
  }

  /**
   * UI 초기화 - 2025.08.18 수정: 안전한 UI 초기화
   */
  initializeUI() {
    console.log("🎨 UI 초기화 중...");

    try {
      // 모달 매니저 초기화
      if (window.modalManager) {
        window.modalManager.init();
        this.modules.set("modal", window.modalManager);
      }

      // 기존 UI 요소들 초기화
      this.initializeBasicUI();

      console.log("✅ UI 초기화 완료");
    } catch (error) {
      console.error("❌ UI 초기화 중 오류:", error);
    }
  }

  /**
   * 기본 UI 요소 초기화 - 2025.08.18 수정: 현재 시간 포함
   */
  initializeBasicUI() {
    // 사용자 정보 표시 초기화
    const userNameEl = document.querySelector(".user-name-compact");
    const userDeptEl = document.querySelector(".user-dept-compact");

    if (userNameEl) userNameEl.textContent = "로딩 중...";
    if (userDeptEl)
      userDeptEl.innerHTML =
        '로딩중... <button class="logout-btn-icon" title="로그인">🔓</button>';

    // 통계 카드 초기화
    const statElements = [
      "total-users",
      "active-users",
      "total-departments",
      "key-managers",
    ];
    statElements.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "0";
    });
  }
/**
   * 인증 시스템 초기화 (기존 코드 호환) - 2025.08.19 14:05 수정: GPS 매니저 초기화 추가
   */
  async initializeAuth() {
    console.log("🔐 인증 시스템 초기화 중...");

    try {
      // 기존 firebaseAuthManager 초기화
      if (window.firebaseAuthManager) {
        await window.firebaseAuthManager.init();
        this.modules.set("auth", window.firebaseAuthManager);
      }

      // 기존 firebaseOrgManager 초기화
      if (window.firebaseOrgManager) {
        await window.firebaseOrgManager.loadOrganizationData();
        this.modules.set("org", window.firebaseOrgManager);
      }

      // 2025.01.21 15:45 추가: OrganizationManager 초기화
      if (window.organizationManager) {
        await window.organizationManager.init();
        this.modules.set("organizationManager", window.organizationManager);
        console.log("✅ OrganizationManager 초기화 완료");
      }

      // 2025.01.21 13:30 추가: 출퇴근 데이터 매니저 초기화
      if (window.worktimeDataManager) {
        await window.worktimeDataManager.init();
        this.modules.set("worktime", window.worktimeDataManager);
        console.log("✅ 출퇴근 데이터 매니저 초기화 완료");
      }

      // 2025.01.21 13:35 추가: 출퇴근 모달 매니저 초기화
      if (window.worktimeModalManager) {
        window.worktimeModalManager.init();
        this.modules.set("worktimeModal", window.worktimeModalManager);
        console.log("✅ 출퇴근 모달 매니저 초기화 완료");
      }

      // 2025.01.21 15:45 추가: 출퇴근 필터 매니저 초기화 (가장 마지막)
      if (window.worktimeFilterManager) {
        window.worktimeFilterManager.init();
        this.modules.set("worktimeFilter", window.worktimeFilterManager);
        console.log("✅ 출퇴근 필터 매니저 초기화 완료");
      }

      // 🆕 2025.08.19 14:05 추가: GPS 관련 모듈들 초기화
      await this.initializeGpsModules();

      // 🆕 2025.08.19 수정: 근무건수 분석 모듈들 초기화 추가
      await this.initializeAnalyticsModules();

      // 초기 통계 로드
      setTimeout(async () => {
        await this.loadInitialStats();
      }, 2000);

      console.log("✅ 인증 시스템 초기화 완료");
    } catch (error) {
      console.warn("⚠️ 인증 시스템 초기화 중 오류:", error);
    }
  }

  /**
   * GPS 모듈들 초기화 - 2025.08.19 14:10 생성
   * GPS 관련 모든 모듈을 순서대로 초기화
   */
  async initializeGpsModules() {
    console.log("🗺️ GPS 모듈들 초기화 중...");

    try {
      // 1. GPS 데이터 처리기 초기화
      if (window.gpsDataProcessor) {
        await window.gpsDataProcessor.init();
        this.modules.set("gpsDataProcessor", window.gpsDataProcessor);
        console.log("✅ GPS 데이터 처리기 초기화 완료");
      }

      // 2. GPS 마커 매니저는 별도 초기화 불필요 (생성자에서 완료)
      if (window.gpsMarkerManager) {
        this.modules.set("gpsMarkerManager", window.gpsMarkerManager);
        console.log("✅ GPS 마커 매니저 등록 완료");
      }

      // 3. GPS 경로 그리기 매니저도 별도 초기화 불필요
      if (window.gpsPathDrawer) {
        this.modules.set("gpsPathDrawer", window.gpsPathDrawer);
        console.log("✅ GPS 경로 그리기 매니저 등록 완료");
      }

      // 4. GPS 전체 매니저 초기화 (가장 마지막)
      if (window.worktimeGpsManager) {
        await window.worktimeGpsManager.init();
        this.modules.set("worktimeGpsManager", window.worktimeGpsManager);
        console.log("✅ GPS 전체 매니저 초기화 완료");
      }

      console.log("🎉 모든 GPS 모듈 초기화 완료");

    } catch (error) {
      console.error("❌ GPS 모듈 초기화 실패:", error);
      // GPS 초기화 실패해도 전체 앱은 계속 동작하도록 함
    }
  }

  /**
   * 근무건수 분석 모듈들 초기화 - 2025.08.19 수정: 새로 추가
   * 분석 관련 모든 모듈을 순서대로 초기화
   */
  async initializeAnalyticsModules() {
    console.log("📊 분석 모듈들 초기화 중...");

    try {
      // 1. 분석 데이터 매니저 초기화 (가장 먼저)
      if (window.worktimeAnalyticsManager) {
        await window.worktimeAnalyticsManager.init();
        this.modules.set("worktimeAnalyticsManager", window.worktimeAnalyticsManager);
        console.log("✅ 근무건수 분석 매니저 초기화 완료");
      }

      // 2. 차트 매니저 초기화
      if (window.worktimeChartManager) {
        await window.worktimeChartManager.init();
        this.modules.set("worktimeChartManager", window.worktimeChartManager);
        console.log("✅ 근무건수 차트 매니저 초기화 완료");
      }

      // 3. 상세 현황 매니저 초기화 (가장 마지막)
      if (window.worktimeDetailManager) {
        await window.worktimeDetailManager.init();
        this.modules.set("worktimeDetailManager", window.worktimeDetailManager);
        console.log("✅ 일자별 상세 현황 매니저 초기화 완료");
      }

      console.log("🎉 모든 분석 모듈 초기화 완료");

    } catch (error) {
      console.error("❌ 분석 모듈 초기화 실패:", error);
      // 분석 초기화 실패해도 전체 앱은 계속 동작하도록 함
    }
  }

  /**
   * 초기 통계 로드 - 2025.01.21 14:05 수정
   * 출퇴근 통계 카드 업데이트 추가
   */
  async loadInitialStats() {
    try {
      if (
        window.firebaseAuthManager &&
        window.firebaseAuthManager.isLoggedIn() &&
        window.adminUtils
      ) {
        const stats = await window.adminUtils.getUserStats();
        if (stats) {
          console.log("📊 관리자 통계 로드 완료:", stats);

          // 기본 통계 UI 업데이트
          const elements = {
            "total-users": stats.totalUsers || 0,
            "active-users": stats.activeUsers || 0,
            "total-departments": stats.departments || 0,
            "key-managers": stats.keyManagers || 0,
          };

          Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
          });
        }
      }

      // 2025.01.21 14:05 추가: 출퇴근 통계 카드 업데이트
      if (window.worktimeDataManager && window.worktimeDataManager.isReady()) {
        await window.worktimeDataManager.updateAllStatsCards();
        console.log("📊 출퇴근 통계 카드 초기 로드 완료");
      }
    } catch (error) {
      console.error("❌ 초기 통계 로드 실패:", error);
    }
  }

  /**
   * 이벤트 리스너 설정 - 2025.08.18 수정: 현재 시간 포함
   */
  setupEventListeners() {
    console.log("🎧 이벤트 리스너 설정 중...");

    // 조직도 필터 이벤트
    document.addEventListener("orgFilterChanged", (e) => {
      console.log("📊 조직도 필터 변경됨:", e.detail);
      this.handleOrgFilterChange(e.detail);
    });

    document.addEventListener("orgFilterCleared", () => {
      console.log("🔄 조직도 필터 해제됨");
      this.handleOrgFilterClear();
    });

    // 윈도우 리사이즈 이벤트
    window.addEventListener(
      "resize",
      this.debounce(() => {
        this.handleResize();
      }, 250)
    );

    // 에러 처리
    window.addEventListener("error", (e) => {
      console.error("💥 전역 에러 발생:", e.error);
      this.handleGlobalError(e.error);
    });

    console.log("✅ 이벤트 리스너 설정 완료");
  }

  /**
   * 조직도 필터 변경 처리 - 2025.08.18 수정: 로깅 개선
   */
  handleOrgFilterChange(filterData) {
    // 다른 모듈들이 필터 변경에 반응하도록 처리
    // 예: todoManager.applyFilter(filterData), taskManager.applyFilter(filterData)

    if (window.AdminUtils) {
      window.AdminUtils.log("info", "조직도 필터 적용", filterData);
    }
  }

  /**
   * 조직도 필터 해제 처리 - 2025.08.18 수정: 로깅 개선
   */
  handleOrgFilterClear() {
    // 다른 모듈들이 필터 해제에 반응하도록 처리

    if (window.AdminUtils) {
      window.AdminUtils.log("info", "조직도 필터 해제");
    }
  }

  /**
   * 윈도우 리사이즈 처리
   */
  handleResize() {
    // 반응형 UI 조정이 필요한 경우 처리
    console.log("📱 윈도우 리사이즈 감지");
  }

  /**
   * 전역 에러 처리 - 2025.08.18 수정: 현재 시간 포함
   */
  handleGlobalError(error) {
    if (window.AdminUtils) {
      window.AdminUtils.log("error", "전역 에러", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(), // 2025.08.18 추가: 현재 시간 포함
      });
    }
  }

  /**
   * 디바운스 유틸리티
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
   * 초기화 완료 처리 - 2025.08.18 수정: 현재 시간 포함
   */
  finalize() {
    this.initialized = true;
    const initTime = Date.now() - this.initStartTime;

    console.log(`🎉 관리자 앱 초기화 완료! (${initTime}ms)`);
    console.log("📦 로드된 모듈들:", Array.from(this.modules.keys()));

    if (window.AdminUtils) {
      window.AdminUtils.log("info", "관리자 앱 초기화 완료", {
        initTime,
        modules: Array.from(this.modules.keys()),
        timestamp: new Date().toISOString(), // 2025.08.18 추가: 현재 시간 포함
      });
    }

    // 초기화 완료 이벤트 발송
    document.dispatchEvent(
      new CustomEvent("adminAppReady", {
        detail: { initTime, modules: this.modules },
      })
    );
  }

  /**
   * 초기화 에러 표시 - 2025.08.18 수정: 현재 시간 포함
   */
  showInitializationError(error) {
    const timestamp = new Date().toLocaleString("ko-KR");
    const errorHtml = `
            <div style="
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%);
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                text-align: center;
            ">
                <h3 style="color: #ef4444; margin: 0 0 16px 0;">⚠️ 초기화 오류</h3>
                <p style="margin: 0 0 16px 0; color: #6b7280;">
                    관리자 앱을 초기화하는 중 오류가 발생했습니다.
                </p>
                <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af;">
                    ${error.message}
                </p>
                <p style="margin: 0 0 16px 0; font-size: 10px; color: #d1d5db;">
                    발생 시간: ${timestamp}
                </p>
                <button onclick="location.reload()" style="
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 4px; 
                    cursor: pointer;
                ">
                    페이지 새로고침
                </button>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", errorHtml);
  }

  /**
   * 모듈 가져오기
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * 앱 상태 확인
   */
  isReady() {
    return this.initialized;
  }
}

/**
 * 전역 앱 인스턴스 생성 및 초기화 - 2025.08.18 수정: 안전한 초기화
 */
let adminApp = null;

function initializeAdminApp() {
  if (!adminApp) {
    adminApp = new AdminApp();
    setGlobalAdminApp(adminApp); // 2025.01.21 13:50 추가: 전역 설정
    adminApp.initialize();
  } else {
    console.log("⚠️ 관리자 앱이 이미 초기화되었습니다.");
  }
}

/**
 * DOM 로드 완료 시 앱 초기화 - 2025.08.18 수정: 현재 시간 로깅 추가
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM 로드 완료, 앱 초기화 시작 -", new Date().toISOString());
    initializeAdminApp();
  });
} else {
  // 이미 로드가 완료된 경우 즉시 실행
  console.log("📄 DOM 이미 로드됨, 앱 즉시 초기화 -", new Date().toISOString());
  setTimeout(initializeAdminApp, 100); // 약간의 지연을 두어 안정성 확보
}

// 2025.01.21 13:50 수정: 전역 접근 가능하도록 설정 개선
window.adminApp = null; // 초기값 설정
window.initializeAdminApp = initializeAdminApp;

// 앱 인스턴스를 전역에 설정하는 함수
function setGlobalAdminApp(appInstance) {
  window.adminApp = appInstance;
  console.log("🌐 AdminApp 전역 설정 완료:", appInstance);
}

// 디버깅용 함수들 - 2025.08.18 수정: 현재 시간 포함
window.debugAdmin = function () {
  const timestamp = new Date().toISOString();
  console.log("=== 관리자 앱 디버깅 ===", timestamp);
  console.log("앱 인스턴스:", adminApp);
  console.log("초기화 상태:", adminApp?.isReady());
  console.log("로드된 모듈들:", adminApp?.modules);
  console.log("Firebase 상태:", window.firebaseInitializer?.isInitialized());
  console.log("=== 디버깅 완료 ===");
};

// 2025.01.21 15:45 추가: 모듈 상태 디버깅 함수
window.debugModules = function () {
  console.log("=== 모듈 상태 디버깅 ===");
  console.log("worktimeFilterManager:", {
    exists: typeof window.worktimeFilterManager !== "undefined",
    isReady: window.worktimeFilterManager?.isReady?.(),
    methods: window.worktimeFilterManager
      ? Object.getOwnPropertyNames(
          Object.getPrototypeOf(window.worktimeFilterManager)
        )
      : "N/A",
  });
  console.log("organizationManager:", {
    exists: typeof window.organizationManager !== "undefined",
    isReady: window.organizationManager?.isReady?.(),
    methods: window.organizationManager
      ? Object.getOwnPropertyNames(
          Object.getPrototypeOf(window.organizationManager)
        )
      : "N/A",
  });
  console.log("firebaseOrgManager:", {
    exists: typeof window.firebaseOrgManager !== "undefined",
    filteredMembers: window.firebaseOrgManager?.filteredMembers?.size || 0,
  });
  console.log("=== 디버깅 완료 ===");
};

console.log("📦 app.js 로드 완료 - 2025.01.21 13:40");
