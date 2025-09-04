// 인증 관련 유틸리티 함수들 - 2025.08.14 생성
// 권한 체크, 인증 상태 확인 등의 유틸리티 함수 모음

/**
 * 인증 유틸리티 클래스
 * 다양한 인증 관련 헬퍼 함수들을 제공
 */
class AuthUtils {
    constructor() {
        this.authManager = null;
    }

    /**
     * AuthManager 인스턴스 설정
     */
    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    /**
     * 현재 사용자가 로그인되어 있는지 확인
     * 로그인되어 있지 않으면 로그인 모달 표시
     */
    requireAuth() {
        if (!this.authManager || !this.authManager.isLoggedIn()) {
            alert('로그인이 필요합니다.');
            if (this.authManager) {
                this.authManager.showLoginModal();
            }
            return false;
        }
        return true;
    }

    /**
     * 관리자 권한 확인
     * keymanager 권한이 필요한 작업에 사용
     */
    requireAdminAuth() {
        if (!this.requireAuth()) {
            return false;
        }
        
        const userData = this.authManager.getCurrentUserData();
        if (!userData || !this.isKeyManager(userData)) {
            alert('관리자 권한이 필요합니다.');
            return false;
        }
        
        return true;
    }

    /**
     * 키매니저 권한 체크
     */
    isKeyManager(userData = null) {
        const user = userData || this.authManager?.getCurrentUserData();
        if (!user) return false;
        
        return user.keymanager === 'O';
    }

    /**
     * 일반 관리자 권한 체크 (키매니저 또는 admin 역할)
     */
    isAdmin(userData = null) {
        const user = userData || this.authManager?.getCurrentUserData();
        if (!user) return false;
        
        return user.keymanager === 'O' || 
               user.role === 'admin' || 
               user.isAdmin === true;
    }

    /**
     * 현재 사용자 정보 가져오기 (간편 함수)
     */
    getCurrentUser() {
        return this.authManager?.getCurrentUserData() || null;
    }

    /**
     * 현재 사용자의 이메일 가져오기
     */
    getCurrentUserEmail() {
        const user = this.getCurrentUser();
        return user?.email || null;
    }

    /**
     * 현재 사용자의 부서 정보 가져오기
     */
    getCurrentUserDepartment() {
        const user = this.getCurrentUser();
        return {
            department0: user?.department0 || '미지정',
            department: user?.department || '미지정'
        };
    }

    /**
     * 특정 사용자의 데이터에 접근할 권한이 있는지 확인
     * @param {string} targetUserEmail - 접근하려는 사용자의 이메일
     * @param {object} targetUserData - 접근하려는 사용자의 데이터 (선택적)
     */
    canAccessUserData(targetUserEmail, targetUserData = null) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        // 1. 본인 데이터는 항상 접근 가능
        if (currentUser.email === targetUserEmail) return true;
        
        // 2. 키매니저는 모든 데이터 접근 가능
        if (this.isKeyManager(currentUser)) return true;
        
        // 3. 같은 department0 내에서만 접근 가능 (targetUserData가 있는 경우)
        if (targetUserData && currentUser.department0 === targetUserData.department0) {
            return true;
        }
        
        return false;
    }

    /**
     * 부서별 접근 권한 체크
     * @param {string} department0 - 접근하려는 부서명
     */
    canAccessDepartment(department0) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        // 키매니저는 모든 부서 접근 가능
        if (this.isKeyManager(currentUser)) return true;
        
        // 같은 department0만 접근 가능
        return currentUser.department0 === department0;
    }

    /**
     * 사용자 역할에 따른 메뉴 표시 여부 결정
     * @param {string} menuType - 메뉴 타입 ('user-management', 'system-settings' 등)
     */
    canAccessMenu(menuType) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        // 키매니저는 모든 메뉴 접근 가능
        if (this.isKeyManager(currentUser)) return true;
        
        // 메뉴별 접근 권한 설정
        const menuPermissions = {
            'org-management': true,          // 모든 관리자 접근 가능
            'user-management': false,        // 키매니저만 접근 가능
            'attendance-management': true,   // 모든 관리자 접근 가능
            'system-settings': false        // 키매니저만 접근 가능
        };
        
        return menuPermissions[menuType] || false;
    }

    /**
     * 로그인 상태 변경 감지를 위한 콜백 등록
     * @param {function} callback - 상태 변경 시 호출될 콜백 함수
     */
    onAuthStateChange(callback) {
        if (this.authManager) {
            this.authManager.addAuthStateListener(callback);
        }
    }

    /**
     * 로그인 상태 변경 감지 콜백 제거
     * @param {function} callback - 제거할 콜백 함수
     */
    offAuthStateChange(callback) {
        if (this.authManager) {
            this.authManager.removeAuthStateListener(callback);
        }
    }

    /**
     * Firebase 인증 상태 확인
     */
    isFirebaseReady() {
        return window.firebaseAuth && window.firebaseFirestore;
    }

    /**
     * 세션 만료 체크 및 자동 로그아웃
     */
    checkSessionExpiry() {
        const user = this.authManager?.getCurrentUser();
        if (!user) return;
        
        // Firebase 토큰 갱신 체크
        user.getIdToken(true).catch(error => {
            console.error('🔑 토큰 갱신 실패:', error);
            if (error.code === 'auth/user-token-expired') {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                this.authManager.logout();
            }
        });
    }

    /**
     * 비밀번호 강도 체크
     * @param {string} password - 체크할 비밀번호
     */
    checkPasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = {
            length: password.length >= minLength,
            upperCase: hasUpperCase,
            lowerCase: hasLowerCase,
            numbers: hasNumbers,
            specialChar: hasSpecialChar
        };
        
        const strength = Object.values(score).filter(Boolean).length;
        
        return {
            score: strength,
            isStrong: strength >= 4,
            isMedium: strength >= 3,
            isWeak: strength < 3,
            requirements: score,
            message: this.getPasswordStrengthMessage(strength)
        };
    }

    /**
     * 비밀번호 강도 메시지 반환
     */
    getPasswordStrengthMessage(strength) {
        switch (strength) {
            case 5: return '매우 강함';
            case 4: return '강함';
            case 3: return '보통';
            case 2: return '약함';
            case 1: return '매우 약함';
            default: return '사용 불가';
        }
    }

    /**
     * 이메일 형식 검증
     * @param {string} email - 검증할 이메일
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * MESA 이메일 도메인 검증
     * @param {string} email - 검증할 이메일
     */
    validateMesaEmail(email) {
        if (!this.validateEmail(email)) return false;
        return email.endsWith('@mesa.kr') || email.endsWith('@mesa.co.kr');
    }

    /**
     * 로그인 시도 제한 체크
     */
    checkLoginAttempts(email) {
        const key = `login_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        const now = Date.now();
        const lockoutTime = 15 * 60 * 1000; // 15분
        
        // 15분이 지났으면 시도 횟수 리셋
        if (now - attempts.lastAttempt > lockoutTime) {
            attempts.count = 0;
        }
        
        return {
            isLocked: attempts.count >= 5 && (now - attempts.lastAttempt < lockoutTime),
            remainingAttempts: Math.max(0, 5 - attempts.count),
            lockoutTimeRemaining: Math.max(0, lockoutTime - (now - attempts.lastAttempt))
        };
    }

    /**
     * 로그인 시도 기록
     */
    recordLoginAttempt(email, success = false) {
        const key = `login_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        if (success) {
            // 성공 시 시도 횟수 리셋
            localStorage.removeItem(key);
        } else {
            // 실패 시 시도 횟수 증가
            attempts.count++;
            attempts.lastAttempt = Date.now();
            localStorage.setItem(key, JSON.stringify(attempts));
        }
    }

    /**
     * 사용자 활동 로그 기록
     * @param {string} action - 수행한 액션
     * @param {object} data - 추가 데이터
     */
    logUserActivity(action, data = {}) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        const logData = {
            timestamp: new Date().toISOString(),
            userEmail: currentUser.email,
            userName: currentUser.name,
            userDepartment: currentUser.department0,
            action: action,
            data: data,
            userAgent: navigator.userAgent,
            ip: 'client-side' // 클라이언트에서는 실제 IP를 가져올 수 없음
        };
        
        // AdminUtils를 통해 로그 기록
        if (window.AdminUtils) {
            window.AdminUtils.log('info', `사용자 활동: ${action}`, logData);
        }
        
        // Firestore에 관리자 로그 저장 (키매니저만)
        if (this.isKeyManager(currentUser)) {
            this.saveAdminLog(logData);
        }
    }

    /**
     * 관리자 로그를 Firestore에 저장
     */
    async saveAdminLog(logData) {
        try {
            if (window.firebaseFirestore) {
                await window.firebaseFirestore.collection('admin-logs').add({
                    ...logData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('❌ 관리자 로그 저장 실패:', error);
        }
    }

    /**
     * 토큰 만료 시간 확인
     */
    async getTokenExpirationTime() {
        try {
            const user = this.authManager?.getCurrentUser();
            if (!user) return null;
            
            const token = await user.getIdTokenResult();
            return new Date(token.expirationTime);
        } catch (error) {
            console.error('❌ 토큰 정보 조회 실패:', error);
            return null;
        }
    }

    /**
     * 자동 로그아웃 타이머 설정
     * @param {number} minutes - 비활성 시간 (분)
     */
    setupAutoLogout(minutes = 60) {
        let timeout;
        const timeoutDuration = minutes * 60 * 1000;
        
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                alert(`${minutes}분간 비활성 상태였습니다. 보안을 위해 자동 로그아웃됩니다.`);
                this.authManager?.logout();
            }, timeoutDuration);
        };
        
        // 사용자 활동 감지 이벤트들
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // 초기 타이머 설정
        resetTimer();
        
        return () => {
            clearTimeout(timeout);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer, true);
            });
        };
    }

    /**
     * 디버깅용 인증 상태 정보 출력
     */
    debugAuthState() {
        const authState = {
            isLoggedIn: this.authManager?.isLoggedIn() || false,
            currentUser: this.getCurrentUser(),
            isKeyManager: this.isKeyManager(),
            isAdmin: this.isAdmin(),
            firebaseReady: this.isFirebaseReady()
        };
        
        console.table(authState);
        return authState;
    }
}

// 전역 인스턴스 생성
const authUtils = new AuthUtils();

// 전역 접근 가능하도록 설정
window.authUtils = authUtils;

console.log('📦 auth-utils.js 로드 완료 - 2025.01.21 13:40');