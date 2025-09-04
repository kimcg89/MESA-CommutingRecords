// 관리자 패널 관리 모듈 - 2025.12.20 생성
// HTML에서 분리된 관리자 패널 전환 기능

/**
 * 관리자 패널 관리 클래스
 * 패널 전환, 네비게이션 상태 관리 등
 */
class AdminPanelManager {
    constructor() {
        this.currentPanel = 'org-management'; // 기본 패널
        this.panelHistory = []; // 패널 히스토리
        this.maxHistorySize = 10;
        
        console.log('🔧 AdminPanelManager 인스턴스 생성 -', new Date().toISOString());
    }

    /**
     * 관리자 패널 전환
     * @param {string} panelType - 패널 타입 ('org-management', 'user-management' 등)
     * @param {Event} event - 클릭 이벤트 (선택적)
     */
    showAdminPanel(panelType, event = null) {
        try {
            console.log('🔧 관리자 패널 전환:', panelType, '-', new Date().toISOString());
            
            // 현재 패널을 히스토리에 추가 (중복 제거)
            if (this.currentPanel !== panelType) {
                this.addToHistory(this.currentPanel);
                this.currentPanel = panelType;
            }
            
            // 활성 메뉴 상태 변경
            this.updateActiveMenu(event);
            
            // 패널 전환 이벤트 발송
            this.dispatchPanelChangeEvent(panelType);
            
            // 패널별 특별 처리
            this.handlePanelSpecificActions(panelType);
            
            console.log(`📋 ${panelType} 패널로 전환됨`);
            
        } catch (error) {
            console.error('❌ 패널 전환 실패:', error);
        }
    }

    /**
     * 활성 메뉴 상태 업데이트
     * @param {Event} event - 클릭 이벤트
     */
    updateActiveMenu(event) {
        try {
            // 모든 메뉴에서 active 클래스 제거
            document.querySelectorAll('.nav-link-grid').forEach(link => {
                link.classList.remove('active');
            });
            
            // 클릭된 메뉴에 active 클래스 추가
            if (event && event.target) {
                const clickedMenu = event.target.closest('.nav-link-grid');
                if (clickedMenu) {
                    clickedMenu.classList.add('active');
                }
            } else {
                // 이벤트가 없는 경우 프로그래밍적으로 활성화
                this.activateMenuByPanelType(this.currentPanel);
            }
            
        } catch (error) {
            console.error('❌ 메뉴 상태 업데이트 실패:', error);
        }
    }

    /**
     * 패널 타입으로 메뉴 활성화
     * @param {string} panelType - 패널 타입
     */
    activateMenuByPanelType(panelType) {
        const menuSelectors = {
            'org-management': '[onclick*="org-management"]',
            'user-management': '[onclick*="user-management"]',
            'attendance-management': '[onclick*="attendance-management"]',
            'system-settings': '[onclick*="system-settings"]'
        };
        
        const selector = menuSelectors[panelType];
        if (selector) {
            const menu = document.querySelector(selector);
            if (menu) {
                menu.classList.add('active');
            }
        }
    }

    /**
     * 패널 전환 이벤트 발송
     * @param {string} panelType - 패널 타입
     */
    dispatchPanelChangeEvent(panelType) {
        const event = new CustomEvent('adminPanelChanged', {
            detail: { 
                panelType, 
                previousPanel: this.panelHistory[this.panelHistory.length - 1] || null,
                timestamp: new Date().toISOString(),
                history: [...this.panelHistory]
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * 패널별 특별 처리
     * @param {string} panelType - 패널 타입
     */
    handlePanelSpecificActions(panelType) {
        switch (panelType) {
            case 'org-management':
                // 조직 관리 패널 특별 처리
                if (window.firebaseOrgManager) {
                    window.firebaseOrgManager.loadOrganizationData();
                }
                break;
                
            case 'user-management':
                // 사용자 관리 패널 특별 처리
                console.log('👥 사용자 관리 패널 활성화');
                break;
                
            case 'attendance-management':
                // 출퇴근 관리 패널 특별 처리
                console.log('⏰ 출퇴근 관리 패널 활성화');
                break;
                
            case 'system-settings':
                // 시스템 설정 패널 특별 처리
                console.log('⚙️ 시스템 설정 패널 활성화');
                break;
        }
    }

    /**
     * 히스토리에 패널 추가
     * @param {string} panelType - 패널 타입
     */
    addToHistory(panelType) {
        // 중복 제거
        const index = this.panelHistory.indexOf(panelType);
        if (index > -1) {
            this.panelHistory.splice(index, 1);
        }
        
        // 새로운 패널 추가
        this.panelHistory.push(panelType);
        
        // 히스토리 크기 제한
        if (this.panelHistory.length > this.maxHistorySize) {
            this.panelHistory.shift();
        }
    }

    /**
     * 이전 패널로 돌아가기
     */
    goBack() {
        if (this.panelHistory.length > 0) {
            const previousPanel = this.panelHistory.pop();
            this.showAdminPanel(previousPanel);
        }
    }

    /**
     * 현재 패널 정보 가져오기
     * @returns {object} 현재 패널 정보
     */
    getCurrentPanelInfo() {
        return {
            current: this.currentPanel,
            history: [...this.panelHistory],
            canGoBack: this.panelHistory.length > 0
        };
    }

    /**
     * 패널 키보드 단축키 설정
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + 숫자키로 패널 전환
            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                const shortcuts = {
                    '1': 'org-management',
                    '2': 'user-management', 
                    '3': 'attendance-management',
                    '4': 'system-settings'
                };
                
                const panelType = shortcuts[e.key];
                if (panelType) {
                    e.preventDefault();
                    this.showAdminPanel(panelType);
                }
            }
            
            // Alt + ← 로 이전 패널
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            }
        });
        
        console.log('⌨️ 패널 키보드 단축키 설정 완료 (Ctrl+1~4, Alt+←)');
    }

    /**
     * 패널 상태를 로컬스토리지에 저장
     */
    saveState() {
        try {
            const state = {
                currentPanel: this.currentPanel,
                history: this.panelHistory,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('adminPanelState', JSON.stringify(state));
            
        } catch (error) {
            console.error('❌ 패널 상태 저장 실패:', error);
        }
    }

    /**
     * 로컬스토리지에서 패널 상태 복원
     */
    loadState() {
        try {
            const saved = localStorage.getItem('adminPanelState');
            if (saved) {
                const state = JSON.parse(saved);
                
                // 1시간 이내의 상태만 복원
                const savedTime = new Date(state.timestamp);
                const now = new Date();
                const diffHours = (now - savedTime) / (1000 * 60 * 60);
                
                if (diffHours < 1) {
                    this.currentPanel = state.currentPanel || 'org-management';
                    this.panelHistory = state.history || [];
                    
                    // UI 상태 복원
                    this.activateMenuByPanelType(this.currentPanel);
                    
                    console.log('🔄 패널 상태 복원됨:', this.currentPanel);
                }
            }
            
        } catch (error) {
            console.error('❌ 패널 상태 복원 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
const adminPanelManager = new AdminPanelManager();

/**
 * 전역 함수: 관리자 패널 전환
 * HTML에서 직접 호출 가능
 * @param {string} panelType - 패널 타입
 */
function showAdminPanel(panelType) {
    adminPanelManager.showAdminPanel(panelType, window.event);
}

// 전역 접근 가능하도록 설정
window.adminPanelManager = adminPanelManager;
window.showAdminPanel = showAdminPanel;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminPanelManager.setupKeyboardShortcuts();
    adminPanelManager.loadState();
});

// 페이지 언로드 시 상태 저장
window.addEventListener('beforeunload', () => {
    adminPanelManager.saveState();
});

console.log('📦 admin-panels.js 로드 완료 -', new Date().toISOString());