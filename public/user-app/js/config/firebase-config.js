// firebase-config.js
// Firebase 초기화 및 설정 관리 (2025년 8월 5일 17:45 수정됨)

// Firebase가 로드된 후 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  // Firebase 라이브러리 로드 확인
  if (typeof firebase === 'undefined') {
    console.error('Firebase 라이브러리가 로드되지 않았습니다.');
    return;
  }

  // Firebase 설정 파일 로드 확인 (2025년 8월 5일 17:45 추가됨)
  if (!window.firebaseConfig) {
    console.error('Firebase 설정이 로드되지 않았습니다.');
    return;
  }

  // Firebase 앱 초기화 (2025년 8월 5일 17:45 수정됨)
  firebase.initializeApp(window.firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  // 전역 변수로 설정 (기존 코드 호환성 유지)
  window.db = db;
  window.auth = auth;

  // Firebase 초기화 완료 이벤트 발생
  const firebaseReadyEvent = new CustomEvent('firebaseReady', {
    detail: { db, auth }
  });
  document.dispatchEvent(firebaseReadyEvent);

  console.log('Firebase 초기화 완료');
});