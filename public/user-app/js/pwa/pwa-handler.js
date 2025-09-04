// pwa-handler.js
// PWA(Progressive Web App) 관리 및 설치 기능 (2025년 1월 31일 17:15 생성됨)

// PWA 관련 전역 변수
let deferredPrompt = null;

// Firebase 준비 완료 후 PWA 초기화
document.addEventListener('firebaseReady', (event) => {
  initializePWA();
});

// DOM 로드 후에도 PWA 초기화 (Firebase보다 먼저 실행될 수 있음)
document.addEventListener('DOMContentLoaded', () => {
  initializePWA();
});

// PWA 시스템 초기화 (2025년 1월 31일 17:15 생성됨)
function initializePWA() {
  // 서비스워커 등록
  registerServiceWorker();
  
  // PWA 설치 이벤트 처리
  setupInstallPrompt();
  
  console.log('PWA 시스템 초기화 완료');
}

// 서비스워커 등록 (2025년 8월 22일 15:30 수정됨 - 환경별 스코프 동적 설정)
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // 환경 감지 로직 (2025년 8월 22일 15:30 수정됨)
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      const isDevPort = ['5000', '5001', '3000', '5501', '5502'].includes(window.location.port);
      const isDevelopment = isLocalhost && isDevPort;
      
      // Service Worker 경로와 스코프 설정 (2025년 8월 22일 15:30 추가됨)
      let swPath, scope;
      
      if (isDevelopment) {
        // 개발 환경: user-app 디렉토리 기준
        swPath = '/public/user-app/service-worker.js';
        scope = '/public/user-app/';
        console.log("🔧 개발 환경 - Service Worker 등록:", {
          swPath: swPath,
          scope: scope
        });
      } else {
        // 배포 환경: Firebase 배포 시 user-app이 루트가 됨
        swPath = '/service-worker.js';
        scope = '/';
        console.log("🚀 배포 환경 - Service Worker 등록:", {
          swPath: swPath,
          scope: scope
        });
      }
      
      console.log('Service Worker 등록 시도:', {
        swPath: swPath,
        scope: scope,
        hostname: window.location.hostname,
        port: window.location.port,
        currentURL: window.location.href,
        isDevelopment: isDevelopment
      });
      
      navigator.serviceWorker
        .register(swPath, { scope: scope })
        .then((registration) => {
          console.log("✅ Service Worker 등록 성공:", registration);
          console.log("등록된 스코프:", registration.scope);
          
          // 서비스워커 업데이트 감지 (2025년 8월 14일 수정됨 - 조용한 업데이트)
          registration.addEventListener('updatefound', () => {
            console.log("🔄 Service Worker 업데이트 발견");
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              console.log("Service Worker 상태 변경:", newWorker.state);
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log("🎉 새 버전이 백그라운드에서 준비되었습니다.");
                // 사용자 알림 제거 - 조용한 업데이트
              }
            });
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker 등록 실패:", error);
          console.log("ℹ️ Service Worker 없이 앱을 계속 실행합니다.");
          
          // 오류 상세 정보 로깅 (2025년 8월 22일 15:30 추가됨)
          console.log("오류 발생 환경:", {
            isDevelopment: isDevelopment,
            swPath: swPath,
            scope: scope,
            hostname: window.location.hostname,
            port: window.location.port
          });
        });
    });
  } else {
    console.warn("⚠️ 이 브라우저는 Service Worker를 지원하지 않습니다.");
  }
}

// PWA 설치 프롬프트 설정 (2025년 1월 31일 17:15 수정됨)
function setupInstallPrompt() {
  // beforeinstallprompt 이벤트 처리
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // 기본 동작 중단
    deferredPrompt = event; // 이벤트 객체 저장
    console.log("beforeinstallprompt 이벤트 발생");

    // 로그인 상태 확인 로직 추가
    const isLoggedIn = checkLoginStatus();
    const installButton = document.getElementById("installButton");

    if (installButton) {
      if (isLoggedIn) {
        installButton.style.display = "none"; // 로그인이 되어 있으면 버튼 숨김
      } else {
        installButton.style.display = "flex"; // 로그인이 되어 있지 않으면 버튼 표시
      }
    }
  });

  // 설치 버튼 클릭 이벤트
  const installButton = document.getElementById("installButton");
  if (installButton) {
    installButton.addEventListener("click", handleInstallClick);
  }

  // 앱이 이미 설치되었는지 확인
  window.addEventListener('appinstalled', (event) => {
    console.log('PWA가 성공적으로 설치되었습니다.');
    hideInstallButton();
    deferredPrompt = null;
  });
}

// 로그인 상태 확인 함수 (2025년 1월 31일 17:15 수정됨)
function checkLoginStatus() {
  // 로컬 스토리지에서 로그인 상태 확인
  const loggedInUser = localStorage.getItem("username");
  return !!loggedInUser; // 로그인 상태라면 true, 아니면 false 반환
}

// 설치 버튼 클릭 처리 (2025년 1월 31일 17:15 수정됨)
function handleInstallClick() {
  const installButton = document.getElementById("installButton");
  
  if (deferredPrompt) {
    // 설치 프로세스 실행
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("사용자가 설치를 수락했습니다.");
        hideInstallButton();
      } else {
        console.log("사용자가 설치를 거부했습니다.");
      }
      deferredPrompt = null; // 이벤트 초기화
    });
  } else {
    console.warn("설치 프롬프트를 사용할 수 없습니다.");
    
    // 수동 설치 안내 표시
    if (typeof showNoticeModal === 'function') {
      showNoticeModal(
        "브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해 주세요."
      );
    } else {
      alert("브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해 주세요.");
    }
  }
}

// 설치 버튼 숨기기 (2025년 1월 31일 17:15 생성됨)
function hideInstallButton() {
  const installButton = document.getElementById("installButton");
  if (installButton) {
    installButton.style.display = "none";
  }
}

// 설치 버튼 표시 (2025년 1월 31일 17:15 생성됨)
function showInstallButton() {
  const installButton = document.getElementById("installButton");
  if (installButton && deferredPrompt) {
    installButton.style.display = "flex";
  }
}

// 네트워크 상태 감지 (2025년 1월 31일 17:15 생성됨)
function setupNetworkStatus() {
  if ('onLine' in navigator) {
    window.addEventListener('online', () => {
      console.log('네트워크 연결이 복구되었습니다.');
      if (typeof showNoticeModal === 'function') {
        showNoticeModal('네트워크 연결이 복구되었습니다.');
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('네트워크 연결이 끊어졌습니다.');
      if (typeof showNoticeModal === 'function') {
        showNoticeModal('오프라인 모드입니다. 일부 기능이 제한될 수 있습니다.');
      }
    });
  }
}

// PWA 설치 상태 확인 (2025년 1월 31일 17:15 생성됨)
function isPWAInstalled() {
  // 스탠드얼론 모드로 실행 중인지 확인
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// PWA 실행 환경 감지 (2025년 1월 31일 17:15 생성됨)
function getPWADisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: browser)').matches) {
    return 'browser';
  }
  return 'unknown';
}

// 푸시 알림 권한 요청 (2025년 1월 31일 17:15 생성됨)
async function requestPushNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('푸시 알림 권한이 허용되었습니다.');
      return true;
    } else {
      console.log('푸시 알림 권한이 거부되었습니다.');
      return false;
    }
  }
  
  console.warn('이 브라우저는 푸시 알림을 지원하지 않습니다.');
  return false;
}

// 앱 데이터 캐시 관리 (2025년 1월 31일 17:15 생성됨)
function clearAppCache() {
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('앱 캐시가 모두 삭제되었습니다.');
      if (typeof showNoticeModal === 'function') {
        showNoticeModal('앱 캐시가 삭제되었습니다. 페이지를 새로고침합니다.');
      }
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });
  }
}

// PWA 진단 정보 수집 (2025년 1월 31일 17:15 생성됨)
function getPWADiagnostics() {
  const diagnostics = {
    isInstalled: isPWAInstalled(),
    displayMode: getPWADisplayMode(),
    isOnline: navigator.onLine,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    notificationSupported: 'Notification' in window,
    pushSupported: 'PushManager' in window,
    installPromptAvailable: !!deferredPrompt,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  console.log('PWA 진단 정보:', diagnostics);
  return diagnostics;
}

// 초기화 시 네트워크 상태 감지 설정
setupNetworkStatus();

// 페이지 로드 완료 시 PWA 상태 로깅
window.addEventListener('load', () => {
  console.log('PWA 로드 완료 - 진단 정보:', getPWADiagnostics());
});

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 8월 14일 수정됨 - showUpdateAvailable 제거)
window.PWAModule = {
  handleInstallClick,
  hideInstallButton,
  showInstallButton,
  isPWAInstalled,
  getPWADisplayMode,
  requestPushNotificationPermission,
  clearAppCache,
  getPWADiagnostics
};