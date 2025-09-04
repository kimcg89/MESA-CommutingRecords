/*
 * 연장근무신청 통합 진입점 (overtime-integration.js)
 * 생성일: 2025년 8월 25일 16:30
 * 용도: 기존 시스템과 연장근무신청 모듈 연결 및 통합 관리
 */

/**
 * 연장근무신청 통합 관리 클래스 (2025년 8월 25일 16:30 생성됨)
 */
class OvertimeIntegration {
    constructor() {
        this.isInitialized = false;
        this.modules = {
            ui: null,
            calendar: null,
            core: null,
            firestore: null
        };
    }
    
    /**
     * 연장근무신청 시스템 통합 초기화 (2025년 8월 25일 16:30 생성됨)
     */
    initialize() {
        // 모듈 준비 확인
        this.checkModuleAvailability();
        
        // UI 이벤트 설정
        this.setupUIEvents();
        
        // 기존 시스템과 연결
        this.connectToExistingSystem();
        
        this.isInitialized = true;
        console.log("🔹 연장근무신청 통합 시스템 초기화 완료");
    }
    
    /**
     * 모듈 가용성 검사 (2025년 8월 25일 16:30 생성됨)
     */
    checkModuleAvailability() {
        // UI 모듈 확인
        if (window.OvertimeUI) {
            this.modules.ui = window.OvertimeUI;
            console.log("✅ 연장근무 UI 모듈 연결됨");
        } else {
            console.warn("⚠️ 연장근무 UI 모듈이 로드되지 않았습니다.");
        }
        
        // 달력 모듈 확인
        if (window.OvertimeCalendar) {
            this.modules.calendar = window.OvertimeCalendar;
            console.log("✅ 연장근무 달력 모듈 연결됨");
        } else {
            console.warn("⚠️ 연장근무 달력 모듈이 로드되지 않았습니다.");
        }
        
        // 핵심 로직 모듈 확인
        if (window.OvertimeCore) {
            this.modules.core = window.OvertimeCore;
            console.log("✅ 연장근무 핵심 로직 모듈 연결됨");
        } else {
            console.warn("⚠️ 연장근무 핵심 로직 모듈이 로드되지 않았습니다.");
        }
        
        // Firestore 모듈 확인
        if (window.OvertimeFirestore) {
            this.modules.firestore = window.OvertimeFirestore;
            console.log("✅ 연장근무 Firestore 모듈 연결됨");
        } else {
            console.warn("⚠️ 연장근무 Firestore 모듈이 로드되지 않았습니다.");
        }
    }
    
    /**
     * UI 이벤트 설정 (2025년 8월 25일 16:30 생성됨)
     */
    setupUIEvents() {
        // 연장근무신청 버튼 이벤트 연결
        this.connectOvertimeButton();
        
        // 기존 modalCore.js와 통합
        this.integrateWithModalCore();
        
        console.log("🔹 연장근무 UI 이벤트 설정 완료");
    }
    
    /**
     * 연장근무신청 버튼 연결 (2025년 8월 25일 17:45 수정됨)
     */
    connectOvertimeButton() {
        // HTML 구조에 맞춰 정확한 선택자 사용
        const overtimeButtons = [
            // 실제 HTML 구조: .bottom > .button:nth-child(2) 
            document.querySelector('.bottom .button:nth-child(2)'),
            // 다른 가능한 선택자들
            document.querySelector('[data-action="overtime"]'),
            // 텍스트로 찾기
            ...Array.from(document.querySelectorAll('.button')).filter(btn => 
                btn.textContent && btn.textContent.includes('연장근무신청')
            )
        ].filter(Boolean); // null 값 제거
        
        console.log("🔍 연장근무 버튼 검색 결과:", overtimeButtons.length + "개 발견");
        
        overtimeButtons.forEach((button, index) => {
            if (button && button.textContent.includes('연장근무신청')) {
                console.log(`🔍 버튼 ${index + 1} 텍스트:`, button.textContent);
                
                // 기존 (X) 표시 제거
                const textElement = button.querySelector('p');
                if (textElement && textElement.textContent.includes('(X)')) {
                    textElement.textContent = textElement.textContent.replace('(X)', '');
                    console.log("✅ (X) 표시 제거됨");
                }
                
                // 클릭 이벤트 추가
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🔹 연장근무신청 버튼 클릭됨");
                    this.openOvertimeModal();
                });
                
                // 버튼 활성화 스타일 적용
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                
                console.log(`🔹 연장근무신청 버튼 ${index + 1} 연결 완료`);
                return; // 첫 번째로 찾은 버튼만 연결
            }
        });
        
        // 버튼을 찾지 못한 경우 디버그 정보 출력
        if (overtimeButtons.length === 0) {
            console.warn("⚠️ 연장근무신청 버튼을 찾을 수 없습니다.");
            console.log("🔍 사용 가능한 .button 요소들:");
            document.querySelectorAll('.button').forEach((btn, idx) => {
                console.log(`  버튼 ${idx + 1}:`, btn.textContent?.trim());
            });
        }
    }
    
    /**
     * 기존 modalCore.js와 통합 (2025년 8월 25일 16:30 생성됨)
     */
    integrateWithModalCore() {
        // 기존 isModalOpen 함수에 연장근무 모달 추가
        if (window.ModalCore) {
            const originalIsModalOpen = window.ModalCore.isModalOpen;
            
            window.ModalCore.isModalOpen = function() {
                const overtimeModal = document.getElementById("overtime-modal");
                const isOvertimeOpen = overtimeModal && 
                    overtimeModal.style.display !== "none" && 
                    overtimeModal.style.display !== "";
                
                return originalIsModalOpen() || isOvertimeOpen;
            };
            
            // 기존 closeAllModals 함수에 연장근무 모달 추가
            const originalCloseAllModals = window.ModalCore.closeAllModals;
            
            window.ModalCore.closeAllModals = function() {
                originalCloseAllModals();
                
                // 연장근무 모달도 닫기
                const overtimeOverlay = document.getElementById("modal-overlay-overtime");
                const overtimeModal = document.getElementById("overtime-modal");
                
                if (overtimeOverlay) overtimeOverlay.style.display = "none";
                if (overtimeModal) overtimeModal.style.display = "none";
            };
            
            console.log("🔹 기존 modalCore.js와 통합 완료");
        }
    }
    
    /**
     * 기존 시스템과 연결 (2025년 8월 25일 16:30 생성됨)
     */
    connectToExistingSystem() {
        // 기존 modal.js와 연결
        if (window.ModalModule) {
            // 연장근무 모달 열기 함수를 전역에 등록
            window.ModalModule.openOvertimeModal = () => this.openOvertimeModal();
            
            console.log("🔹 기존 modal.js 시스템과 연결 완료");
        }
        
        // 기존 알림 시스템 활용
        this.setupNotificationIntegration();
        
        // 기존 히스토리 시스템 연동 (필요시)
        this.setupHistoryIntegration();
    }
    
    /**
     * 알림 시스템 통합 (2025년 8월 25일 16:30 생성됨)
     */
    setupNotificationIntegration() {
        // 기존 showNoticeModal 함수 활용을 위한 래퍼
        this.showNotice = (message) => {
            if (window.ModalModule && typeof window.ModalModule.showNoticeModal === 'function') {
                window.ModalModule.showNoticeModal(message);
            } else if (window.showNoticeModal) {
                window.showNoticeModal(message);
            } else {
                alert(message); // 폴백
            }
        };
        
        console.log("🔹 알림 시스템 통합 완료");
    }
    
    /**
     * 히스토리 시스템 연동 (2025년 8월 25일 16:30 생성됨)
     */
    setupHistoryIntegration() {
        // 연장근무신청 후 히스토리 업데이트가 필요한 경우
        if (window.updateHistoryList) {
            this.updateHistory = () => {
                try {
                    window.updateHistoryList();
                    console.log("🔹 히스토리 업데이트 완료");
                } catch (error) {
                    console.error("🔸 히스토리 업데이트 실패:", error);
                }
            };
        }
    }
    
    /**
     * 연장근무 모달 열기 (통합 진입점) (2025년 8월 25일 16:30 생성됨)
     */
    openOvertimeModal() {
        try {
            // 1. 다른 모달들이 열려있으면 닫기
            if (window.ModalCore && window.ModalCore.closeAllModals) {
                window.ModalCore.closeAllModals();
            }
            
            // 2. 연장근무 모달 열기
            if (this.modules.ui && this.modules.ui.openOvertimeModal) {
                this.modules.ui.openOvertimeModal();
            } else {
                // 폴백: 직접 모달 열기
                this.fallbackOpenModal();
            }
            
            console.log("🔹 연장근무 모달 열기 완료");
            
        } catch (error) {
            console.error("🔸 연장근무 모달 열기 실패:", error);
            this.showNotice("연장근무신청 모달을 열 수 없습니다. 페이지를 새로고침 해주세요.");
        }
    }
    
    /**
     * 폴백 모달 열기 (모듈 로드 실패시) (2025년 8월 25일 16:30 생성됨)
     */
    fallbackOpenModal() {
        const overlay = document.getElementById("modal-overlay-overtime");
        const modal = document.getElementById("overtime-modal");
        
        if (overlay && modal) {
            overlay.style.display = "block";
            modal.style.display = "block";
            
            // 기본 닫기 이벤트만 설정
            overlay.addEventListener('click', this.fallbackCloseModal);
            
            console.log("🔹 폴백 모드로 모달 열기");
        } else {
            console.error("🔸 연장근무 모달 요소를 찾을 수 없습니다.");
        }
    }
    
    /**
     * 폴백 모달 닫기 (2025년 8월 25일 16:30 생성됨)
     */
    fallbackCloseModal() {
        const overlay = document.getElementById("modal-overlay-overtime");
        const modal = document.getElementById("overtime-modal");
        
        if (overlay) overlay.style.display = "none";
        if (modal) modal.style.display = "none";
    }
    
    /**
     * 연장근무신청 완료 후 처리 (2025년 8월 25일 16:30 생성됨)
     * @param {Object} result - 처리 결과
     */
    onOvertimeRequestComplete(result) {
        if (result.success) {
            // 성공 알림
            this.showNotice(result.message || "연장근무신청이 완료되었습니다.");
            
            // 히스토리 업데이트
            if (this.updateHistory) {
                setTimeout(() => this.updateHistory(), 500);
            }
            
            // 주간 달력 업데이트 (필요시)
            if (window.loadWeeklyData) {
                setTimeout(() => window.loadWeeklyData(), 500);
            }
        } else {
            // 실패 알림
            this.showNotice(result.message || "연장근무신청에 실패했습니다.");
        }
    }
    
    /**
     * 시스템 상태 체크 (2025년 8월 25일 16:30 생성됨)
     * @returns {Object} 시스템 상태
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: {
                ui: !!this.modules.ui,
                calendar: !!this.modules.calendar,
                core: !!this.modules.core,
                firestore: !!this.modules.firestore
            },
            firebase: !!(window.db && window.auth),
            modalSystem: !!window.ModalCore
        };
    }
    
    /**
     * 디버그 정보 출력 (2025년 8월 25일 16:30 생성됨)
     */
    debugInfo() {
        const status = this.getSystemStatus();
        console.table(status);
        return status;
    }
}

// 전역 인스턴스 생성 (2025년 8월 25일 16:30 생성됨)
window.overtimeIntegration = new OvertimeIntegration();

// Firebase 준비 완료 후 초기화
document.addEventListener("firebaseReady", () => {
    setTimeout(() => {
        window.overtimeIntegration.initialize();
    }, 500); // 다른 모듈들이 로드될 시간을 확보
});

// DOM 준비 완료 후에도 초기화 (Firebase 이벤트 없을 경우 대비)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (!window.overtimeIntegration.isInitialized) {
            window.overtimeIntegration.initialize();
        }
    }, 2000);
});

// 전역 모듈로 내보내기 (2025년 8월 25일 16:30 생성됨)
window.OvertimeIntegration = {
    initialize: () => window.overtimeIntegration.initialize(),
    openOvertimeModal: () => window.overtimeIntegration.openOvertimeModal(),
    onOvertimeRequestComplete: (result) => window.overtimeIntegration.onOvertimeRequestComplete(result),
    getSystemStatus: () => window.overtimeIntegration.getSystemStatus(),
    debugInfo: () => window.overtimeIntegration.debugInfo()
};

// 개발 환경에서 디버그 함수를 전역으로 노출
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    window.debugOvertime = () => window.overtimeIntegration.debugInfo();
}