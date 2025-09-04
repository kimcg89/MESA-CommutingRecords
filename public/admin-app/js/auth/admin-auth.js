// 관리자 인증 관리 모듈 - 2025.08.14 생성
// 기존 firebaseAuthManager에서 분리한 관리자 전용 인증 모듈

/**
 * 관리자 인증 관리 클래스
 * Firebase 인증과 관리자 권한 관리를 담당
 */
class AdminAuthManager {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.authStateListeners = [];
        this.isInitialized = false;
        
        console.log('🔐 AdminAuthManager 생성자 호출');
    }

    /**
     * 인증 관리자 초기화
     * Firebase 대기 후 인증 상태 리스너 설정
     */
    async init() {
        try {
            console.log('🔐 관리자 인증 시스템 초기화 중...');
            
            // Firebase 초기화 대기
            await this.waitForFirebase();
            
            // 인증 상태 변화 감지 설정
            this.setupAuthStateListener();
            
            this.isInitialized = true;
            console.log('✅ 관리자 인증 시스템 초기화 완료');
            
        } catch (error) {
            console.error('❌ 관리자 인증 시스템 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * Firebase 초기화 대기
     */
    async waitForFirebase() {
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
     * 인증 상태 리스너 설정
     */
    setupAuthStateListener() {
        window.firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('👤 관리자 로그인됨:', user.email);
                await this.handleUserLogin(user);
            } else {
                console.log('👋 관리자 로그아웃됨');
                this.handleUserLogout();
            }
        });
    }

    /**
     * 사용자 로그인 처리
     * 2025.08.14 수정: records 컬렉션 구조에 맞게 수정
     */
    async handleUserLogin(user) {
        this.currentUser = user;
        
        try {
            // 사용자 데이터 조회
            const userData = await this.getUserData(user.email);
            if (userData) {
                this.currentUserData = userData;
                
                // 관리자 권한 체크 - 2025.08.14 수정: AdminUtils 사용
                if (!this.isAdminUser(userData)) {
                    alert('관리자 권한이 없습니다. 일반 사용자는 user-app을 사용해주세요.');
                    await this.logout();
                    return;
                }
                
                // UI 업데이트
                this.updateUserDisplay();
                
                // 인증 상태 리스너들에게 알림
                this.notifyAuthStateChange('login', userData);
                
                // 관리자 활동 로그 기록
                if (window.AdminUtils) {
                    window.AdminUtils.log('info', '관리자 로그인', {
                        email: user.email,
                        name: userData.name,
                        department: userData.department0
                    });
                }
                
            } else {
                console.warn('⚠️ 사용자 정보를 찾을 수 없습니다:', user.email);
                alert('사용자 정보를 찾을 수 없습니다. 먼저 출퇴근 기록 앱에서 프로필을 설정해주세요.');
                await this.logout();
            }
        } catch (error) {
            console.error('❌ 사용자 데이터 로드 실패:', error);
            alert('사용자 정보 로드에 실패했습니다.');
        }
    }

    /**
     * 관리자 권한 체크 함수
     * 2025.08.14 수정: AdminUtils 통합
     */
    isAdminUser(userData) {
        if (window.AdminUtils && window.ADMIN_CONFIG) {
            return window.AdminUtils.checkPermission(userData, window.ADMIN_CONFIG.PERMISSION_LEVELS.KEY_MANAGER);
        }
        
        // fallback 체크
        return userData && (
            userData.keymanager === 'O' || 
            userData.role === 'admin' ||
            userData.isAdmin === true
        );
    }

    /**
     * 사용자 로그아웃 처리
     */
    handleUserLogout() {
        this.currentUser = null;
        this.currentUserData = null;
        
        // UI 업데이트
        this.updateUserDisplay();
        
        // 인증 상태 리스너들에게 알림
        this.notifyAuthStateChange('logout', null);
        
        // 로그인 모달 표시
        this.showLoginModal();
    }

    /**
     * 인증 상태 변경 알림
     */
    notifyAuthStateChange(action, userData) {
        this.authStateListeners.forEach(listener => {
            try {
                listener(action, userData);
            } catch (error) {
                console.error('❌ 인증 상태 리스너 에러:', error);
            }
        });
    }

    /**
     * 인증 상태 리스너 추가
     */
    addAuthStateListener(callback) {
        this.authStateListeners.push(callback);
    }

    /**
     * 인증 상태 리스너 제거
     */
    removeAuthStateListener(callback) {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
        }
    }

    /**
     * 사용자 데이터 조회
     * 2025.08.14 수정: records 컬렉션에서 사용자 데이터 조회
     */
    async getUserData(email) {
        try {
            const userDoc = await window.firebaseFirestore.collection('records')
                .doc(email)
                .get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                
                // 사용자 메타데이터가 있는지 확인
                if (data.name && data.department0) {
                    return {
                        id: userDoc.id,
                        email: email,
                        ...data
                    };
                } else {
                    console.warn('⚠️ 사용자 메타데이터가 없습니다:', email);
                    return null;
                }
            } else {
                console.log('ℹ️ 사용자 문서가 없습니다:', email);
                return null;
            }
        } catch (error) {
            console.error('❌ 사용자 데이터 조회 실패:', error);
            return null;
        }
    }

    /**
     * 로그인 모달 표시
     */
    showLoginModal() {
        // modalManager가 초기화되었는지 확인
        if (typeof window.modalManager === 'undefined' || !window.modalManager.modal) {
            console.error('❌ modalManager가 아직 초기화되지 않았습니다.');
            setTimeout(() => this.showLoginModal(), 100);
            return;
        }
        
        const bodyHtml = `
            <div class="login-container">
                <div class="login-header">
                    <h2 style="text-align: center; margin-bottom: 20px; color: #333;">MESA 관리자 대시보드</h2>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">관리자 권한으로 로그인하세요</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">이메일</label>
                    <input type="email" class="form-control" id="login-email" placeholder="mesa.kr 이메일 주소" autocomplete="username">
                </div>
                <div class="form-group">
                    <label class="form-label">비밀번호</label>
                    <input type="password" class="form-control" id="login-password" placeholder="비밀번호를 입력하세요" autocomplete="current-password">
                </div>
                
                <div class="form-group">
                    <div class="login-options">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                            <input type="checkbox" id="remember-login"> 로그인 상태 유지
                        </label>
                        <a href="#" onclick="adminAuthManager.showResetPasswordModal()" style="font-size: 14px; color: #3b82f6; text-decoration: none;">비밀번호 찾기</a>
                    </div>
                </div>
                
                <div class="login-error" id="login-error" style="display: none; color: #ef4444; font-size: 14px; margin-top: 10px; text-align: center;"></div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #fbbf24;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;">⚠️ 관리자 전용</h4>
                    <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.4;">
                        이 시스템은 관리자만 사용할 수 있습니다.<br>
                        keymanager 권한이 있는 계정으로 로그인해주세요.
                    </p>
                </div>
            </div>
        `;
        
        const footerHtml = `
            <button class="btn btn-outline" onclick="window.open('../user-app/', '_blank')">일반 사용자 앱</button>
            <button class="btn btn-primary" onclick="adminAuthManager.login()" id="login-btn">
                <span id="login-btn-text">로그인</span>
                <span id="login-spinner" style="display: none;">로그인 중...</span>
            </button>
        `;
        
        window.modalManager.open('관리자 로그인', bodyHtml, footerHtml);
        
        // Enter 키로 로그인 처리
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            [emailInput, passwordInput].forEach(input => {
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.login();
                        }
                    });
                }
            });
            
            if (emailInput) emailInput.focus();
        }, 100);
    }

    /**
     * 비밀번호 재설정 모달 표시
     */
    showResetPasswordModal() {
        const bodyHtml = `
            <div class="reset-password-container">
                <div class="reset-header">
                    <h3 style="text-align: center; margin-bottom: 10px; color: #333;">비밀번호 재설정</h3>
                    <p style="text-align: center; color: #666; margin-bottom: 20px;">이메일로 재설정 링크를 보내드립니다</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">이메일</label>
                    <input type="email" class="form-control" id="reset-email" placeholder="등록된 이메일 주소">
                </div>
                
                <div class="reset-error" id="reset-error" style="display: none; color: #ef4444; font-size: 14px; margin-top: 10px;"></div>
                <div class="reset-success" id="reset-success" style="display: none; color: #10b981; font-size: 14px; margin-top: 10px;"></div>
            </div>
        `;
        
        const footerHtml = `
            <button class="btn btn-outline" onclick="adminAuthManager.showLoginModal()">로그인으로 돌아가기</button>
            <button class="btn btn-primary" onclick="adminAuthManager.resetPassword()">재설정 이메일 전송</button>
        `;
        
        window.modalManager.open('비밀번호 재설정', bodyHtml, footerHtml);
    }

    /**
     * 로그인 처리
     */
    async login() {
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const rememberLogin = document.getElementById('remember-login')?.checked;
        
        if (!email || !password) {
            this.showLoginError('이메일과 비밀번호를 모두 입력하세요.');
            return;
        }
        
        const loginBtn = document.getElementById('login-btn');
        const loginBtnText = document.getElementById('login-btn-text');
        const loginSpinner = document.getElementById('login-spinner');
        
        try {
            // 로딩 상태 표시
            if (loginBtn) loginBtn.disabled = true;
            if (loginBtnText) loginBtnText.style.display = 'none';
            if (loginSpinner) loginSpinner.style.display = 'inline';
            this.hideLoginError();
            
            // 지속성 설정
            if (rememberLogin) {
                await window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } else {
                await window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            }
            
            // Firebase 로그인
            await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            
            // 로그인 성공 시 모달 닫기
            window.modalManager.close();
            
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            this.showLoginError(this.getAuthErrorMessage(error.code));
        } finally {
            // 로딩 상태 해제
            if (loginBtn) loginBtn.disabled = false;
            if (loginBtnText) loginBtnText.style.display = 'inline';
            if (loginSpinner) loginSpinner.style.display = 'none';
        }
    }

    /**
     * 비밀번호 재설정
     */
    async resetPassword() {
        const email = document.getElementById('reset-email')?.value?.trim();
        
        if (!email) {
            this.showResetError('이메일 주소를 입력하세요.');
            return;
        }
        
        try {
            this.hideResetError();
            await window.firebaseAuth.sendPasswordResetEmail(email);
            this.showResetSuccess('비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인하세요.');
        } catch (error) {
            console.error('❌ 비밀번호 재설정 실패:', error);
            this.showResetError(this.getAuthErrorMessage(error.code));
        }
    }

    /**
     * 로그아웃 처리
     */
    async logout() {
        if (confirm('로그아웃 하시겠습니까?')) {
            try {
                await window.firebaseAuth.signOut();
            } catch (error) {
                console.error('❌ 로그아웃 실패:', error);
                alert('로그아웃에 실패했습니다.');
            }
        }
    }

    /**
     * 사용자 정보 표시 업데이트
     */
    updateUserDisplay() {
        if (this.currentUser && this.currentUserData) {
            const userData = this.currentUserData;
            const userNameEl = document.querySelector('.user-name-compact');
            const userDeptEl = document.querySelector('.user-dept-compact');
            
            if (userNameEl) userNameEl.textContent = userData.name;
            if (userDeptEl) {
                userDeptEl.innerHTML = `
                    ${userData.department || userData.department0 || '미지정'}
                    <button class="logout-btn-icon" onclick="adminAuthManager.logout()" title="로그아웃">🚪</button>
                `;
            }
            
            // 대시보드 제목도 업데이트
            const headerTitle = document.querySelector('.header h1');
            if (headerTitle) {
                headerTitle.textContent = `${userData.name}님의 관리자 대시보드`;
            }
        } else {
            const userNameEl = document.querySelector('.user-name-compact');
            const userDeptEl = document.querySelector('.user-dept-compact');
            
            if (userNameEl) userNameEl.textContent = '로그인 필요';
            if (userDeptEl) {
                userDeptEl.innerHTML = `
                    미로그인
                    <button class="logout-btn-icon" onclick="adminAuthManager.showLoginModal()" title="로그인">🔓</button>
                `;
            }
            
            // 대시보드 제목 초기화
            const headerTitle = document.querySelector('.header h1');
            if (headerTitle) {
                headerTitle.textContent = '관리자 대시보드';
            }
        }
    }

    /**
     * 현재 사용자 정보 getter
     */
    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUserData() {
        return this.currentUserData;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * 에러 메시지 헬퍼 메서드들
     */
    showLoginError(message) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    hideLoginError() {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    showResetError(message) {
        const errorEl = document.getElementById('reset-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    hideResetError() {
        const errorEl = document.getElementById('reset-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    showResetSuccess(message) {
        const successEl = document.getElementById('reset-success');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
        }
    }

    /**
     * Firebase Auth 에러 메시지 변환
     */
    getAuthErrorMessage(errorCode) {
        if (window.ERROR_MESSAGES && window.ERROR_MESSAGES.AUTH) {
            return window.ERROR_MESSAGES.AUTH[errorCode] || window.ERROR_MESSAGES.SYSTEM.UNKNOWN_ERROR;
        }
        
        // fallback 에러 메시지
        const errorMessages = {
            'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
            'auth/user-disabled': '비활성화된 계정입니다.',
            'auth/user-not-found': '존재하지 않는 계정입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/email-already-in-use': '이미 사용 중인 이메일 주소입니다.',
            'auth/weak-password': '비밀번호가 너무 약합니다.',
            'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
            'auth/invalid-credential': '로그인 정보가 올바르지 않습니다.',
            'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도하세요.'
        };
        
        return errorMessages[errorCode] || '로그인 중 오류가 발생했습니다.';
    }
}

// 전역 인스턴스 생성
const adminAuthManager = new AdminAuthManager();

// 전역 접근 가능하도록 설정
window.adminAuthManager = adminAuthManager;

console.log('📦 admin-auth.js 로드 완료 - 2025.01.21 13:40');