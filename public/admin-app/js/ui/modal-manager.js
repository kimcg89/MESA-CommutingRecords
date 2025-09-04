// 모달 관리 모듈 - 2025.12.20 생성
// HTML에서 분리된 모달 매니저

/**
 * 모달 관리 클래스
 * 모달 창 열기, 닫기, 관리 기능 제공
 */
class ModalManager {
    constructor() {
        this.modal = null;
        this.isInitialized = false;
        
        console.log('🗂️ ModalManager 인스턴스 생성 -', new Date().toISOString());
    }

    /**
     * 모달 매니저 초기화
     * DOM이 로드된 후 호출
     */
    init() {
        try {
            this.modal = document.getElementById("universal-modal");
            
            if (!this.modal) {
                console.warn('⚠️ universal-modal 요소를 찾을 수 없습니다. 동적으로 생성합니다.');
                this.createModalElement();
            }
            
            this.isInitialized = true;
            console.log('🗂️ 모달 매니저 초기화 완료 -', new Date().toISOString());
            
        } catch (error) {
            console.error('❌ 모달 매니저 초기화 실패:', error);
        }
    }

    /**
     * 모달 요소 동적 생성
     * HTML에 모달이 없는 경우 자동 생성
     */
    createModalElement() {
        const modalHtml = `
            <div id="universal-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modal-title">제목</h3>
                        <button class="modal-close" onclick="modalManager.close()">
                            &times;
                        </button>
                    </div>
                    <div class="modal-body" id="modal-body">
                        <!-- 모달 내용이 동적으로 생성됩니다 -->
                    </div>
                    <div class="modal-footer" id="modal-footer">
                        <!-- 모달 버튼들이 동적으로 생성됩니다 -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById("universal-modal");
        
        console.log('🏗️ 모달 요소 동적 생성 완료');
    }

    /**
     * 모달 창 열기
     * @param {string} title - 모달 제목
     * @param {string} bodyHtml - 모달 본문 HTML
     * @param {string} footerHtml - 모달 푸터 HTML (선택적)
     */
    open(title, bodyHtml, footerHtml = '') {
        try {
            if (!this.isInitialized) {
                this.init();
            }

            if (!this.modal) {
                console.error('❌ 모달 요소를 찾을 수 없습니다.');
                return;
            }

            // 모달 내용 설정
            const titleElement = document.getElementById("modal-title");
            const bodyElement = document.getElementById("modal-body");
            const footerElement = document.getElementById("modal-footer");

            if (titleElement) titleElement.textContent = title;
            if (bodyElement) bodyElement.innerHTML = bodyHtml;
            if (footerElement) footerElement.innerHTML = footerHtml;

            // 모달 표시
            this.modal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            // 접근성: 포커스 설정
            const firstInput = this.modal.querySelector('input, button, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }

            console.log('📂 모달 열림:', title);
            
        } catch (error) {
            console.error('❌ 모달 열기 실패:', error);
        }
    }

    /**
     * 모달 창 닫기
     */
    close() {
        try {
            if (!this.modal) {
                console.warn('⚠️ 닫을 모달이 없습니다.');
                return;
            }

            this.modal.style.display = "none";
            document.body.style.overflow = "auto";
            
            console.log('📂 모달 닫힘');
            
        } catch (error) {
            console.error('❌ 모달 닫기 실패:', error);
        }
    }

    /**
     * 모달 상태 확인
     * @returns {boolean} 모달이 열려있는지 여부
     */
    isOpen() {
        return this.modal && this.modal.style.display === "block";
    }

    /**
     * ESC 키로 모달 닫기 설정
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    /**
     * 모달 외부 클릭으로 닫기 설정
     */
    setupClickOutside() {
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    }

    /**
     * 확인 대화상자 표시
     * @param {string} message - 확인 메시지
     * @param {function} onConfirm - 확인 시 콜백
     * @param {function} onCancel - 취소 시 콜백 (선택적)
     */
    confirm(message, onConfirm, onCancel = null) {
        const bodyHtml = `
            <div style="text-align: center; padding: 20px;">
                <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">${message}</p>
            </div>
        `;
        
        const footerHtml = `
            <button class="btn btn-outline" onclick="modalManager.close(); ${onCancel ? 'modalManager.handleCancel()' : ''}">취소</button>
            <button class="btn btn-primary" onclick="modalManager.close(); modalManager.handleConfirm()">확인</button>
        `;
        
        // 임시로 콜백 저장
        this._tempConfirmCallback = onConfirm;
        this._tempCancelCallback = onCancel;
        
        this.open('확인', bodyHtml, footerHtml);
    }

    /**
     * 확인 콜백 처리
     */
    handleConfirm() {
        if (this._tempConfirmCallback && typeof this._tempConfirmCallback === 'function') {
            this._tempConfirmCallback();
        }
        this._tempConfirmCallback = null;
        this._tempCancelCallback = null;
    }

    /**
     * 취소 콜백 처리
     */
    handleCancel() {
        if (this._tempCancelCallback && typeof this._tempCancelCallback === 'function') {
            this._tempCancelCallback();
        }
        this._tempConfirmCallback = null;
        this._tempCancelCallback = null;
    }

    /**
     * 알림 대화상자 표시
     * @param {string} message - 알림 메시지
     * @param {string} type - 알림 타입 ('info', 'success', 'warning', 'error')
     */
    alert(message, type = 'info') {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        const bodyHtml = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 15px;">${icons[type]}</div>
                <p style="margin: 0; font-size: 16px; line-height: 1.5; color: ${colors[type]};">${message}</p>
            </div>
        `;
        
        const footerHtml = `
            <button class="btn btn-primary" onclick="modalManager.close()">확인</button>
        `;
        
        this.open(type === 'error' ? '오류' : '알림', bodyHtml, footerHtml);
    }
}

// 전역 인스턴스 생성
const modalManager = new ModalManager();

// 전역 접근 가능하도록 설정
window.modalManager = modalManager;

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        modalManager.init();
        modalManager.setupKeyboardEvents();
        modalManager.setupClickOutside();
    });
} else {
    // 이미 로드된 경우 즉시 초기화
    modalManager.init();
    modalManager.setupKeyboardEvents();
    modalManager.setupClickOutside();
}

console.log('📦 modal-manager.js 로드 완료 -', new Date().toISOString());