// Firebase 설정 및 초기화 - 2025.12.20 수정: 중복 변수 선언 해결
// 관리자 앱 전용 Firebase 설정

/**
 * Firebase 초기화 대기 함수
 * Firebase SDK가 로드될 때까지 대기
 */
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseAuth && window.firebaseFirestore) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

/**
 * Firebase 서비스 초기화 및 전역 설정
 * 2025.12.20 수정: 기존 firebaseConfig 사용하여 중복 선언 방지
 */
class FirebaseInitializer {
    constructor() {
        this.initialized = false;
        this.auth = null;
        this.firestore = null;
    }

    /**
     * Firebase 초기화 실행
     */
    async initialize() {
        try {
            console.log('🔥 Firebase 초기화 시작...');
            
            // firebaseConfig가 로드되었는지 확인
            if (typeof window.firebaseConfig === 'undefined') {
                console.error('❌ firebaseConfig가 로드되지 않았습니다. firebase-api-config.dev.js를 먼저 로드하세요.');
                throw new Error('Firebase 설정이 없습니다.');
            }

            // Firebase 앱 초기화 (이미 선언된 firebaseConfig 사용)
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase 앱 초기화 완료');
            }

            // Firebase 서비스 초기화
            this.auth = firebase.auth();
            this.firestore = firebase.firestore();

            // 전역 변수로 설정 (기존 코드 호환성)
            window.firebaseAuth = this.auth;
            window.firebaseFirestore = this.firestore;

            this.initialized = true;
            console.log('✅ Firebase 서비스 초기화 완료 (관리자 모드)');

            return true;
        } catch (error) {
            console.error('❌ Firebase 초기화 실패:', error);
            return false;
        }
    }

    /**
     * Firebase 초기화 상태 확인
     */
    isInitialized() {
        return this.initialized && this.auth && this.firestore;
    }

    /**
     * Firebase 서비스 getter
     */
    getAuth() {
        return this.auth;
    }

    getFirestore() {
        return this.firestore;
    }
}

// Firebase 초기화 인스턴스 생성
const firebaseInitializer = new FirebaseInitializer();

// 전역 접근 가능하도록 설정
window.firebaseInitializer = firebaseInitializer;
window.waitForFirebase = waitForFirebase;

// 즉시 초기화 실행
firebaseInitializer.initialize();