/*
 * 연장근무신청 핵심 로직 모듈 (overtime-core.js)
 * 생성일: 2025년 8월 25일 16:20
 * 수정일: 2025년 8월 25일 19:00 - records 컬렉션으로 변경 및 날짜 기반 requestId 적용
 * 용도: 연장근무신청의 핵심 비즈니스 로직 처리
 */

/**
 * 연장근무신청 핵심 로직 클래스 (2025년 8월 25일 16:20 생성됨)
 */
class OvertimeCore {
    constructor() {
        this.currentUser = null;
        this.overtimeData = {
            date: null,
            hours: null,
            client: null,
            reason: null,
            status: 'pending', // pending, approved, rejected
            createdAt: null,
            updatedAt: null
        };
    }
    
    /**
     * 연장근무 핵심 로직 초기화 (2025년 8월 25일 16:20 생성됨)
     */
    initialize() {
        // 사용자 정보 확인
        if (window.auth && window.auth.currentUser) {
            this.currentUser = window.auth.currentUser;
        }
        
        console.log("🔹 연장근무 핵심 로직 초기화 완료");
    }
    
    /**
     * 연장근무신청 데이터 유효성 검증 (2025년 8월 25일 16:52 수정됨)
     * @param {Object} formData - 폼 데이터
     * @returns {Object} 검증 결과 { isValid: boolean, errors: Array }
     */
    validateOvertimeData(formData) {
        const errors = [];
        
        // 날짜 검증 (2025년 8월 25일 19:25 수정됨 - 디버깅 로그 추가)
        if (!formData.date) {
            errors.push("날짜를 선택해주세요.");
        } else {
            // 문자열 기반 날짜 비교로 시간대 문제 해결
            const selectedDateString = formData.date; // "2025-08-25"
            const todayString = new Date().toISOString().split('T')[0]; // "2025-08-25"
            
            // 디버깅 로그 추가 (2025년 8월 25일 19:25)
            console.log("🔍 날짜 검증 디버깅:");
            console.log("  선택된 날짜:", selectedDateString);
            console.log("  오늘 날짜:", todayString);
            console.log("  비교 결과 (선택 < 오늘):", selectedDateString < todayString);
            console.log("  선택된 날짜 타입:", typeof selectedDateString);
            console.log("  오늘 날짜 타입:", typeof todayString);
            
            // 오늘 날짜까지 허용 (과거 날짜만 차단)
            if (selectedDateString < todayString) {
                console.log("❌ 과거 날짜로 판단됨");
                errors.push("과거 날짜는 선택할 수 없습니다.");
            } else {
                console.log("✅ 유효한 날짜");
            }
            
            // 너무 먼 미래 날짜 제한 (3개월 후까지)
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
            const threeMonthsLaterString = threeMonthsLater.toISOString().split('T')[0];
            
            if (selectedDateString > threeMonthsLaterString) {
                console.log("❌ 3개월 초과 미래 날짜");
                errors.push("3개월 이후 날짜는 선택할 수 없습니다.");
            }
        }
        
        // 시간 검증 (시간/분 분리 대응)
        let totalHours = 0;
        if (formData.time !== undefined) {
            // 기존 방식 (총 시간)
            totalHours = parseFloat(formData.time);
        } else if (formData.hours !== undefined && formData.minutes !== undefined) {
            // 새로운 방식 (시간/분 분리)
            totalHours = parseInt(formData.hours) + (parseInt(formData.minutes) / 60);
        }
        
        if (totalHours <= 0) {
            errors.push("연장근무 시간을 선택해주세요.");
        } else if (totalHours > 8) {
            errors.push("연장근무 시간은 최대 8시간까지 가능합니다.");
        }
        
        // 사유 검증
        if (!formData.reason || formData.reason.trim().length === 0) {
            errors.push("연장근무 사유를 입력해주세요.");
        } else if (formData.reason.trim().length < 2) {
            errors.push("연장근무 사유를 10자 이상 입력해주세요.");
        } else if (formData.reason.trim().length > 500) {
            errors.push("연장근무 사유는 500자 이하로 입력해주세요.");
        }
        
        // 고객사 검증 (선택사항이지만 입력 시 유효성 검증)
        if (formData.client && formData.client.trim().length > 100) {
            errors.push("고객사명은 100자 이하로 입력해주세요.");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 연장근무신청 데이터 준비 (2025년 8월 25일 19:15 수정됨 - deviceInfo 제거)
     * @param {Object} formData - 폼 데이터
     * @returns {Object} 처리된 연장근무신청 데이터
     */
    prepareOvertimeData(formData) {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
        const kstNow = new Date(now.getTime() + kstOffset);
        
        // 사용자 이메일 확인
        let userEmail = null;
        if (this.currentUser && this.currentUser.email) {
            userEmail = this.currentUser.email;
        } else if (window.currentUserEmail) {
            userEmail = window.currentUserEmail;
        }
        
        // 총 시간 계산 (시간/분 분리 대응)
        let totalHours = 0;
        if (formData.time !== undefined) {
            totalHours = parseFloat(formData.time);
        } else if (formData.hours !== undefined && formData.minutes !== undefined) {
            totalHours = parseInt(formData.hours) + (parseInt(formData.minutes) / 60);
        }
        
        // 연장근무신청 데이터 구성 (2025년 8월 25일 19:15 수정됨 - deviceInfo 제거)
        const overtimeRequestData = {
            userEmail: userEmail,
            date: formData.date, // YYYY-MM-DD 형식
            hours: totalHours,
            hoursBreakdown: {
                hours: parseInt(formData.hours) || 0,
                minutes: parseInt(formData.minutes) || 0
            },
            client: formData.client ? formData.client.trim() : null,
            reason: formData.reason.trim(),
            status: 'pending',
            createdAt: kstNow.toISOString(),
            updatedAt: kstNow.toISOString()
            // deviceInfo 제거됨
        };
        
        console.log("🔹 연장근무신청 데이터 준비 완료:", overtimeRequestData);
        
        return overtimeRequestData;
    }
    
    /**
     * 시간 형식 변환 유틸리티 (2025년 8월 25일 16:52 수정됨)
     * @param {number} hours - 시간 (소수점 포함)
     * @returns {string} 형식화된 시간 문자열
     */
    formatHours(hours) {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        
        if (minutes === 0) {
            return wholeHours > 0 ? `${wholeHours}시간` : "0분";
        } else if (wholeHours === 0) {
            return `${minutes}분`;
        } else {
            return `${wholeHours}시간 ${minutes}분`;
        }
    }
    
    /**
     * 연장근무신청 처리 (2025년 8월 25일 16:20 생성됨)
     * @param {Object} formData - 폼 데이터
     * @returns {Promise} 처리 결과
     */
    async processOvertimeRequest(formData) {
        try {
            // 1. 데이터 유효성 검증
            const validation = this.validateOvertimeData(formData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('\n'));
            }
            
            // 2. 연장근무신청 데이터 준비
            const overtimeData = this.prepareOvertimeData(formData);
            
            // 3. 중복 신청 검증
            const isDuplicate = await this.checkDuplicateRequest(overtimeData.date, overtimeData.userEmail);
            if (isDuplicate) {
                throw new Error("해당 날짜에 이미 연장근무신청이 존재합니다.");
            }
            
            // 4. Firebase에 저장
            if (window.OvertimeFirestore && typeof window.OvertimeFirestore.saveOvertimeRequest === 'function') {
                await window.OvertimeFirestore.saveOvertimeRequest(overtimeData);
            } else {
                // 개발 환경에서는 로컬 저장소에 임시 저장
                this.saveToLocalStorage(overtimeData);
            }
            
            // 5. 성공 처리
            console.log("🔹 연장근무신청 처리 성공:", overtimeData);
            return {
                success: true,
                data: overtimeData,
                message: "연장근무신청이 성공적으로 저장되었습니다."
            };
            
        } catch (error) {
            console.error("🔸 연장근무신청 처리 실패:", error);
            return {
                success: false,
                error: error.message,
                message: "연장근무신청 처리 중 오류가 발생했습니다."
            };
        }
    }
    
    /**
     * 중복 신청 검증 (2025년 8월 25일 19:00 수정됨)
     * @param {string} date - 신청 날짜 (YYYY-MM-DD)
     * @param {string} userEmail - 사용자 이메일
     * @returns {Promise<boolean>} 중복 여부
     */
    async checkDuplicateRequest(date, userEmail) {
        try {
            // OvertimeFirestore 모듈을 통한 중복 검증
            if (window.OvertimeFirestore && typeof window.OvertimeFirestore.checkDuplicateRequest === 'function') {
                return await window.OvertimeFirestore.checkDuplicateRequest(date, userEmail);
            }
            
            console.warn("🔸 OvertimeFirestore 모듈이 없어 중복 검증을 건너뜁니다.");
            return false;
            
        } catch (error) {
            console.error("🔸 중복 신청 검증 실패:", error);
            return false;
        }
    }
    
    /**
     * 로컬 저장소에 임시 저장 (개발용) (2025년 8월 25일 16:20 생성됨)
     * @param {Object} overtimeData - 연장근무신청 데이터
     */
    saveToLocalStorage(overtimeData) {
        try {
            let requests = this.getLocalStorageRequests();
            requests.push(overtimeData);
            localStorage.setItem('overtimeRequests', JSON.stringify(requests));
            console.log("🔹 로컬 저장소에 연장근무신청 저장 완료");
        } catch (error) {
            console.error("🔸 로컬 저장소 저장 실패:", error);
        }
    }
    
    /**
     * 로컬 저장소에서 연장근무신청 목록 조회 (개발용) (2025년 8월 25일 16:20 생성됨)
     * @returns {Array} 연장근무신청 목록
     */
    getLocalStorageRequests() {
        try {
            const requests = localStorage.getItem('overtimeRequests');
            return requests ? JSON.parse(requests) : [];
        } catch (error) {
            console.error("🔸 로컬 저장소 조회 실패:", error);
            return [];
        }
    }
    
    /**
     * 날짜 형식 변환 유틸리티 (2025년 8월 25일 16:20 생성됨)
     * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD)
     * @returns {string} 형식화된 날짜 문자열
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
        const dayName = dayNames[date.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${dayName})`;
    }
}

// 전역 인스턴스 생성 (2025년 8월 25일 16:20 생성됨)
window.overtimeCore = new OvertimeCore();

// Firebase 준비 완료 후 초기화
document.addEventListener("firebaseReady", () => {
    window.overtimeCore.initialize();
});

// 전역 모듈로 내보내기 (2025년 8월 25일 19:00 수정됨)
window.OvertimeCore = {
    initialize: () => window.overtimeCore.initialize(),
    validateOvertimeData: (formData) => window.overtimeCore.validateOvertimeData(formData),
    prepareOvertimeData: (formData) => window.overtimeCore.prepareOvertimeData(formData),
    processOvertimeRequest: (formData) => window.overtimeCore.processOvertimeRequest(formData),
    checkDuplicateRequest: (date, userEmail) => window.overtimeCore.checkDuplicateRequest(date, userEmail),
    formatHours: (hours) => window.overtimeCore.formatHours(hours),
    formatDate: (dateString) => window.overtimeCore.formatDate(dateString)
};