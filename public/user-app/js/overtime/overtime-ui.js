/*
 * 연장근무신청 UI 관리 모듈 (overtime-ui.js)
 * 생성일: 2025년 8월 25일 16:00
 * 수정일: 2025년 8월 25일 20:10 - 함수 정의 순서 완전 재구성
 * 용도: 연장근무신청 모달의 UI 이벤트 및 상태 관리
 */

// 연장근무 UI 상태 변수
let overtimeSelectedDate = null;

// =================================================================
// 연장근무 전용 Notice Modal 관련 함수들 (최우선 정의)
// =================================================================

/**
 * 연장근무 전용 notice 모달 생성
 */
function createOvertimeNoticeModal(message) {
    removeOvertimeNoticeModal();
    
    const overlay = document.createElement('div');
    overlay.id = 'overtime-notice-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const modal = document.createElement('div');
    modal.className = 'overtime-notice-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        width: 80%;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10002;
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
            ${message}
        </div>
        <button id="overtime-notice-confirm" style="
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
        ">확인</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const confirmBtn = modal.querySelector('#overtime-notice-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            console.log("연장근무 전용 notice 확인 버튼 클릭됨");
            removeOvertimeNoticeModal();
        });
    }
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            removeOvertimeNoticeModal();
        }
    });
    
    console.log("연장근무 전용 notice 모달 생성 완료:", message);
    return { overlay, modal };
}

/**
 * 연장근무 전용 notice 모달 제거
 */
function removeOvertimeNoticeModal() {
    const overlay = document.getElementById('overtime-notice-overlay');
    if (overlay) {
        overlay.remove();
        console.log("연장근무 전용 오버레이 제거");
    }
    
    const modal = document.querySelector('.overtime-notice-modal');
    if (modal) {
        modal.remove();
        console.log("연장근무 전용 모달 제거");
    }
    
    const tempOverlay = document.getElementById('temp-notice-overlay');
    if (tempOverlay) {
        tempOverlay.remove();
        console.log("기존 임시 오버레이도 제거");
    }
}

/**
 * 연장근무 전용 notice 모달 표시
 */
function showOvertimeNoticeModal(message) {
    console.log("연장근무 전용 notice 모달 표시:", message);
    
    const overtimeModal = document.getElementById('overtime-modal');
    const overtimeOverlay = document.getElementById('modal-overlay-overtime');
    
    if (overtimeModal) {
        overtimeModal.style.zIndex = '9000';
    }
    if (overtimeOverlay) {
        overtimeOverlay.style.zIndex = '8999';
    }
    
    createOvertimeNoticeModal(message);
}

/**
 * 성공 메시지 표시 후 자동 모달 닫기
 */
function showSuccessMessageAndClose(message) {
    console.log("성공 메시지 표시 및 자동 닫기 처리:", message);
    
    showOvertimeNoticeModal(message);
    
    setTimeout(() => {
        console.log("2초 경과 - 자동으로 모달 닫기 시작");
        
        removeOvertimeNoticeModal();
        closeOvertimeModal();
        
        const overtimeModal = document.getElementById('overtime-modal');
        const overtimeOverlay = document.getElementById('modal-overlay-overtime');
        
        if (overtimeModal) {
            overtimeModal.style.zIndex = '';
            console.log("overtime-modal z-index 원상복구");
        }
        
        if (overtimeOverlay) {
            overtimeOverlay.style.zIndex = '';
            console.log("overtime-overlay z-index 원상복구");
        }
        
        console.log("자동 모달 닫기 완료 (2초 후)");
        
    }, 2000);
}

// =================================================================
// 기본 모달 관련 함수들
// =================================================================

/**
 * 연장근무신청 모달 열기
 */
function openOvertimeModal() {
    const overlay = document.getElementById("modal-overlay-overtime");
    const modal = document.getElementById("overtime-modal");
    
    if (overlay && modal) {
        overlay.style.display = "block";
        modal.style.display = "block";
        
        console.log("연장근무 달력 초기화 시작...");
        
        if (window.OvertimeCalendar && typeof window.OvertimeCalendar.initialize === 'function') {
            try {
                window.OvertimeCalendar.initialize();
                console.log("연장근무 달력 초기화 성공");
            } catch (error) {
                console.error("연장근무 달력 초기화 실패:", error);
                setTimeout(() => {
                    if (window.OvertimeCalendar && typeof window.OvertimeCalendar.render === 'function') {
                        window.OvertimeCalendar.render();
                    }
                }, 100);
            }
        } else {
            console.warn("연장근무 달력 모듈이 로드되지 않았습니다.");
            console.log("사용 가능한 OvertimeCalendar 함수들:");
            if (window.OvertimeCalendar) {
                console.log("- initialize:", typeof window.OvertimeCalendar.initialize);
                console.log("- render:", typeof window.OvertimeCalendar.render);
                console.log("- reset:", typeof window.OvertimeCalendar.reset);
            } else {
                console.log("- OvertimeCalendar 객체 자체가 없음");
            }
        }
        
        resetOvertimeForm();
        
        console.log("연장근무신청 모달 열림");
    } else {
        console.error("연장근무 모달 요소를 찾을 수 없습니다:");
        console.log("- overlay:", !!overlay);
        console.log("- modal:", !!modal);
    }
}

/**
 * 연장근무신청 모달 닫기
 */
function closeOvertimeModal() {
    const overlay = document.getElementById("modal-overlay-overtime");
    const modal = document.getElementById("overtime-modal");
    
    if (overlay && modal) {
        overlay.style.display = "none";
        modal.style.display = "none";
        
        if (window.OvertimeCalendar && typeof window.OvertimeCalendar.reset === 'function') {
            window.OvertimeCalendar.reset();
        }
        
        overtimeSelectedDate = null;
        
        console.log("연장근무신청 모달 닫힘");
    }
}

/**
 * 연장근무 달력 초기화 - DEPRECATED
 */
function initializeOvertimeCalendar() {
    console.warn("initializeOvertimeCalendar는 더 이상 사용되지 않습니다. overtime-calendar.js 모듈을 사용하세요.");
    
    if (window.OvertimeCalendar && typeof window.OvertimeCalendar.initialize === 'function') {
        window.OvertimeCalendar.initialize();
    }
}

/**
 * 연장근무 달력 렌더링 - DEPRECATED
 */
function renderOvertimeCalendar() {
    console.warn("renderOvertimeCalendar는 더 이상 사용되지 않습니다. overtime-calendar.js 모듈을 사용하세요.");
    
    if (window.OvertimeCalendar && typeof window.OvertimeCalendar.render === 'function') {
        window.OvertimeCalendar.render();
    }
}

/**
 * 연장근무 날짜 선택 - UI 상태 업데이트만 처리
 */
function updateSelectedDate(selectedDate) {
    overtimeSelectedDate = selectedDate;
    console.log("UI: 연장근무 날짜 선택됨:", selectedDate?.toISOString().split('T')[0]);
}

/**
 * 선택된 날짜 가져오기
 */
function getSelectedDate() {
    if (window.OvertimeCalendar && typeof window.OvertimeCalendar.getSelectedDate === 'function') {
        return window.OvertimeCalendar.getSelectedDate();
    }
    
    return overtimeSelectedDate;
}

/**
 * 연장근무 폼 초기화
 */
function resetOvertimeForm() {
    const hoursSelect = document.getElementById("overtime-hours");
    const minutesSelect = document.getElementById("overtime-minutes");
    if (hoursSelect) hoursSelect.value = "";
    if (minutesSelect) minutesSelect.value = "0";
    
    const clientInput = document.getElementById("overtime-client-input");
    if (clientInput) clientInput.value = "";
    
    const reasonTextarea = document.getElementById("overtime-reason-textarea");
    if (reasonTextarea) reasonTextarea.value = "";
    
    const selectedDateDisplay = document.getElementById("overtime-selected-date");
    if (selectedDateDisplay) selectedDateDisplay.style.display = "none";
    
    hideAllOvertimeErrors();
    
    overtimeSelectedDate = null;
}

/**
 * 모든 에러 메시지 숨기기
 */
function hideAllOvertimeErrors() {
    const errorElements = [
        "overtime-time-error",
        "overtime-reason-error"
    ];
    
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = "none";
    });
    
    const fieldElements = [
        "overtime-hours",
        "overtime-minutes", 
        "overtime-reason-textarea"
    ];
    
    fieldElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove("field-error");
    });
}

/**
 * 연장근무신청 폼 검증
 */
function validateOvertimeForm() {
    let isValid = true;
    
    const selectedDate = getSelectedDate();
    if (!selectedDate) {
        showOvertimeNoticeModal("날짜를 선택해주세요.");
        isValid = false;
    }
    
    const hoursSelect = document.getElementById("overtime-hours");
    const minutesSelect = document.getElementById("overtime-minutes");
    const timeError = document.getElementById("overtime-time-error");
    
    const hours = parseInt(hoursSelect?.value) || 0;
    const minutes = parseInt(minutesSelect?.value) || 0;
    const totalHours = hours + (minutes / 60);
    
    if (totalHours <= 0) {
        if (timeError) timeError.style.display = "block";
        if (hoursSelect) hoursSelect.classList.add("field-error");
        if (minutesSelect) minutesSelect.classList.add("field-error");
        isValid = false;
    } else {
        if (timeError) timeError.style.display = "none";
        if (hoursSelect) hoursSelect.classList.remove("field-error");
        if (minutesSelect) minutesSelect.classList.remove("field-error");
    }
    
    const reasonTextarea = document.getElementById("overtime-reason-textarea");
    const reasonError = document.getElementById("overtime-reason-error");
    
    if (!reasonTextarea?.value.trim()) {
        if (reasonError) reasonError.style.display = "block";
        if (reasonTextarea) reasonTextarea.classList.add("field-error");
        isValid = false;
    } else {
        if (reasonError) reasonError.style.display = "none";
        if (reasonTextarea) reasonTextarea.classList.remove("field-error");
    }
    
    return isValid;
}

/**
 * 연장근무신청 저장 처리
 */
function saveOvertimeRequest() {
    if (!validateOvertimeForm()) {
        return;
    }
    
    const selectedDate = getSelectedDate();
    if (!selectedDate) {
        showOvertimeNoticeModal("날짜를 선택해주세요.");
        return;
    }
    
    const hoursSelect = document.getElementById("overtime-hours");
    const minutesSelect = document.getElementById("overtime-minutes");
    const hours = parseInt(hoursSelect?.value) || 0;
    const minutes = parseInt(minutesSelect?.value) || 0;
    const totalHours = hours + (minutes / 60);
    
    const formData = {
        date: selectedDate.toISOString().split('T')[0],
        time: totalHours,
        hours: hours,
        minutes: minutes,
        client: document.getElementById("overtime-client-input")?.value.trim() || null,
        reason: document.getElementById("overtime-reason-textarea")?.value.trim(),
        createdAt: new Date().toISOString()
    };
    
    console.log("연장근무신청 데이터:", formData);
    
    if (window.OvertimeCore && typeof window.OvertimeCore.processOvertimeRequest === 'function') {
        console.log("OvertimeCore 모듈을 통한 처리 시작");
        
        window.OvertimeCore.processOvertimeRequest(formData)
            .then((result) => {
                console.log("OvertimeCore 처리 결과:", result);
                
                if (result.success) {
                    console.log("성공 - 자동 닫기 적용");
                    showSuccessMessageAndClose(result.message || "연장근무신청이 성공적으로 저장되었습니다.");
                } else {
                    console.log("실패 - 에러 메시지 표시");
                    showOvertimeNoticeModal(result.message || "저장에 실패했습니다.");
                }
            })
            .catch((error) => {
                console.error("OvertimeCore 처리 실패:", error);
                showOvertimeNoticeModal("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
            });
    } else {
        if (window.OvertimeFirestore && typeof window.OvertimeFirestore.saveOvertimeRequest === 'function') {
            if (window.OvertimeCore && typeof window.OvertimeCore.prepareOvertimeData === 'function') {
                const processedData = window.OvertimeCore.prepareOvertimeData(formData);
                
                window.OvertimeFirestore.saveOvertimeRequest(processedData)
                    .then((result) => {
                        if (result && result.success && result.message) {
                            showSuccessMessageAndClose(result.message);
                        } else {
                            showSuccessMessageAndClose("연장근무신청이 저장되었습니다.");
                        }
                    })
                    .catch((error) => {
                        console.error("연장근무신청 저장 실패:", error);
                        showOvertimeNoticeModal("저장에 실패했습니다. 다시 시도해주세요.");
                    });
            }
        } else {
            const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
            const devMessage = `연장근무신청이 저장되었습니다. (개발 모드)\n날짜: ${formData.date}\n시간: ${timeString}\n고객사: ${formData.client || '없음'}\n사유: ${formData.reason}`;
            
            console.log("개발 모드 - 임시 처리");
            showSuccessMessageAndClose(devMessage);
        }
    }
}

/**
 * 연장근무 UI 이벤트 초기화
 */
function initializeOvertimeUI() {
    const overlay = document.getElementById("modal-overlay-overtime");
    if (overlay) {
        overlay.removeEventListener("click", closeOvertimeModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeOvertimeModal();
            }
        });
    }
    
    const cancelBtn = document.getElementById("cancel-overtime");
    if (cancelBtn) {
        cancelBtn.removeEventListener("click", closeOvertimeModal);
        cancelBtn.addEventListener("click", closeOvertimeModal);
    }
    
    const saveBtn = document.getElementById("save-overtime");
    if (saveBtn) {
        saveBtn.removeEventListener("click", saveOvertimeRequest);
        saveBtn.addEventListener("click", saveOvertimeRequest);
    }
    
    const escKeyHandler = (event) => {
        if (event.key === "Escape") {
            const modal = document.getElementById("overtime-modal");
            if (modal && modal.style.display === "block") {
                closeOvertimeModal();
            }
        }
    };
    
    document.removeEventListener("keydown", escKeyHandler);
    document.addEventListener("keydown", escKeyHandler);
    
    console.log("연장근무 UI 이벤트 초기화 완료");
}

// Firebase 준비 완료 후 초기화
document.addEventListener("firebaseReady", initializeOvertimeUI);

// DOM 로드 완료 후에도 초기화 (Firebase 이벤트 없을 경우 대비)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initializeOvertimeUI, 1000);
});

// 전역 모듈로 내보내기
window.OvertimeUI = {
    openOvertimeModal,
    closeOvertimeModal,
    initializeOvertimeCalendar,
    renderOvertimeCalendar,
    updateSelectedDate,
    getSelectedDate,
    validateOvertimeForm,
    saveOvertimeRequest,
    showSuccessMessageAndClose,
    createOvertimeNoticeModal,
    removeOvertimeNoticeModal,
    showOvertimeNoticeModal,
    initializeOvertimeUI,
    resetOvertimeForm,
    hideAllOvertimeErrors
};