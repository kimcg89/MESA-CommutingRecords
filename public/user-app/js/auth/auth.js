// auth.js
// 사용자 인증 관련 기능 관리 (2025년 1월 31일 16:15 생성됨)

// 인증 관련 전역 변수
let currentUser = null;

// Firebase 준비 완료 후 인증 관련 기능 초기화
document.addEventListener('firebaseReady', (event) => {
  initializeAuth();
});

// 인증 시스템 초기화 (2025년 1월 31일 16:15 생성됨)
function initializeAuth() {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const loadingScreen = document.getElementById("loading-screen");

  // 페이지 로드 시 저장된 정보 불러오기 (2025년 1월 31일 16:15 수정됨)
  if (localStorage.getItem("rememberMe") === "true") {
    usernameInput.value = localStorage.getItem("username") || "";
    passwordInput.value = localStorage.getItem("password") || "";
    rememberMeCheckbox.checked = true;
  }

  // 로그인 폼 제출 시 저장 (2025년 1월 31일 16:15 수정됨)
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (rememberMeCheckbox.checked) {
      // Remember Me 체크 시 사용자 정보 저장
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("username", usernameInput.value);
      localStorage.setItem("password", passwordInput.value);
    } else {
      // 체크 해제 시 사용자 정보 삭제
      localStorage.setItem("rememberMe", "false");
      localStorage.removeItem("username");
      localStorage.removeItem("password");
    }
  });

  // Firebase 인증 상태 변화 감지 (2025년 1월 31일 16:15 수정됨)
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
      console.log("로그인된 사용자:", user.email);
      await handleUserLogin(user);
    } else {
      console.error("로그인된 사용자가 없습니다.");
      handleUserLogout();
    }

    // 모든 초기 로딩 작업 완료 후 로딩 스크린 숨기기 (2025년 1월 31일 16:15 수정됨)
    if (loadingScreen) {
      loadingScreen.style.opacity = "0";
      loadingScreen.addEventListener(
        "transitionend",
        () => {
          loadingScreen.style.display = "none";
          loadingScreen.classList.add("hidden");
        },
        { once: true }
      );
    }
  });

  // 로그인 폼 제출 이벤트 리스너 (2025년 1월 31일 16:15 수정됨)
  loginForm.addEventListener("submit", handleLogin);
}

// 사용자 로그인 처리 (2025년 1월 31일 16:15 생성됨)
async function handleUserLogin(user) {
  // 로그인 상태에서 화면 전환
  const container = document.querySelector(".container");
  const loginSectionContainer = document.querySelector(".loginSectionContainer");
  
  container.style.display = "block";
  loginSectionContainer.style.display = "none";

  // 잔여 연차 및 보상휴가 정보 업데이트
  if (typeof updateLeaveBalances === 'function') {
    await updateLeaveBalances(user.email);
  }

  // 주간 달력 초기화 (일요일 시작)
  if (typeof getSunday === 'function' && typeof updateWeekDates === 'function' && typeof loadWeeklyData === 'function') {
    currentSunday = getSunday(new Date());
    updateWeekDates();
    loadWeeklyData();
  }

  // 출근/퇴근 버튼 상태 초기화
  if (typeof updateStartButton === 'function') updateStartButton();
  if (typeof updateEndButton === 'function') updateEndButton();
}

// 사용자 로그아웃 처리 (2025년 1월 31일 16:15 생성됨)
function handleUserLogout() {
  showLoginScreen();
}

// 로그인 창 보이기 (2025년 1월 31일 16:15 수정됨)
function showLoginScreen() {
  document.querySelector(".container").style.display = "none";
  document.querySelector(".loginSectionContainer").style.display = "block";
  document.getElementById("calendar-container").innerHTML =
    "<p>로그인 후 이용할 수 있습니다.</p>";
}

// 로그인 처리 함수 (2025년 1월 31일 16:15 생성됨)
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // 로그인 성공은 onAuthStateChanged에서 처리됨
  } catch (error) {
    console.error("로그인 실패:", error.message);
    if (typeof showNoticeModal === 'function') {
      showNoticeModal("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }
}

// 로그아웃 함수 (선택 사항 - 현재 주석 처리됨) (2025년 1월 31일 16:15 생성됨)
// async function handleLogout() {
//   try {
//     await auth.signOut();
//     console.log("로그아웃 성공");
//   } catch (error) {
//     console.error("로그아웃 실패:", error.message);
//   }
// }

// 현재 사용자 정보 반환 함수 (2025년 1월 31일 16:15 생성됨)
function getCurrentUser() {
  return currentUser;
}

// 다른 파일에서 사용할 수 있도록 전역 함수로 내보내기 (2025년 1월 31일 16:15 생성됨)
window.AuthModule = {
  getCurrentUser,
  showLoginScreen
};