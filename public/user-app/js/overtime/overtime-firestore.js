/*
 * 연장근무신청 Firestore 데이터 처리 모듈 (overtime-firestore.js)
 * 생성일: 2025년 8월 25일 16:25
 * 수정일: 2025년 8월 25일 19:00 - records 컬렉션으로 변경 및 날짜 기반 requestId 적용
 * 용도: 연장근무신청 데이터의 Firebase Firestore 처리 전담
 */

/**
 * 연장근무신청 Firestore 처리 클래스 (2025년 8월 25일 16:25 생성됨)
 */
class OvertimeFirestore {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
    }
    
    /**
     * Firestore 연결 초기화 (2025년 8월 25일 16:25 생성됨)
     */
    initialize() {
        if (window.db && window.auth) {
            this.db = window.db;
            this.auth = window.auth;
            this.isInitialized = true;
            console.log("🔹 연장근무 Firestore 초기화 완료");
        } else {
            console.error("🔸 Firebase 연결이 준비되지 않았습니다.");
        }
    }
    
    /**
     * 연장근무신청 데이터 저장 (2025년 8월 25일 19:00 수정됨)
     * @param {Object} overtimeData - 연장근무신청 데이터
     * @returns {Promise} 저장 결과
     */
    async saveOvertimeRequest(overtimeData) {
        if (!this.isInitialized) {
            throw new Error("Firestore가 초기화되지 않았습니다.");
        }
        
        if (!overtimeData.userEmail) {
            throw new Error("사용자 이메일이 필요합니다.");
        }
        
        try {
            // Firestore 경로: records/{userEmail}/requests/{YYYY-MM-DD}
            const userEmailPath = overtimeData.userEmail;
            const requestId = overtimeData.date; // YYYY-MM-DD 형식 사용
            
            const docRef = this.db
                .collection("records")
                .doc(userEmailPath)
                .collection("requests")
                .doc(requestId);
            
            // 배치 작업으로 여러 문서 동시 저장
            const batch = this.db.batch();
            
            // 1. 연장근무신청 상세 데이터 저장 (2025년 8월 25일 19:15 수정됨 - deviceInfo 제거)
            batch.set(docRef, {
                requestId: requestId,
                date: overtimeData.date,
                hours: overtimeData.hours,
                hoursBreakdown: overtimeData.hoursBreakdown,
                client: overtimeData.client,
                reason: overtimeData.reason,
                status: overtimeData.status,
                createdAt: overtimeData.createdAt,
                updatedAt: overtimeData.updatedAt
                // deviceInfo 제거됨
            });
            
            // 2. 사용자별 요약 정보 업데이트 (records 문서에 병합)
            const userSummaryRef = this.db
                .collection("records")
                .doc(userEmailPath);
            
            batch.set(userSummaryRef, {
                userEmail: overtimeData.userEmail,
                lastOvertimeRequestDate: overtimeData.date,
                totalOvertimeRequests: firebase.firestore.FieldValue.increment(1),
                updatedAt: overtimeData.updatedAt
            }, { merge: true });
            
            // 3. 월별 통계 업데이트
            const monthKey = overtimeData.date.substring(0, 7); // YYYY-MM
            const monthlyStatsRef = this.db
                .collection("records")
                .doc(userEmailPath)
                .collection("monthlyStats")
                .doc(monthKey);
            
            batch.set(monthlyStatsRef, {
                month: monthKey,
                requestCount: firebase.firestore.FieldValue.increment(1),
                totalHours: firebase.firestore.FieldValue.increment(overtimeData.hours),
                updatedAt: overtimeData.updatedAt
            }, { merge: true });
            
            // 배치 실행
            await batch.commit();
            
            console.log("🔹 연장근무신청 Firestore 저장 성공:", requestId);
            
            return {
                success: true,
                requestId: requestId,
                message: "연장근무신청이 성공적으로 저장되었습니다."
            };
            
        } catch (error) {
            console.error("🔸 연장근무신청 Firestore 저장 실패:", error);
            throw new Error(`저장 실패: ${error.message}`);
        }
    }
    
    /**
     * 중복 신청 검증 (2025년 8월 25일 19:00 수정됨)
     * @param {string} date - 신청 날짜 (YYYY-MM-DD)
     * @param {string} userEmail - 사용자 이메일
     * @returns {Promise<boolean>} 중복 여부
     */
    async checkDuplicateRequest(date, userEmail) {
        if (!this.isInitialized) {
            console.warn("🔸 Firestore가 초기화되지 않아 중복 검증을 건너뜁니다.");
            return false;
        }
        
        try {
            // 날짜 기반 문서 ID 사용으로 단순화
            const docRef = this.db
                .collection("records")
                .doc(userEmail)
                .collection("requests")
                .doc(date);
            
            const doc = await docRef.get();
            
            // 문서가 존재하고 취소된 상태가 아닌 경우 중복으로 판단
            const isDuplicate = doc.exists && 
                (!doc.data().status || doc.data().status !== "cancelled");
            
            if (isDuplicate) {
                console.log("🔸 중복 연장근무신청 발견:", date);
            }
            
            return isDuplicate;
            
        } catch (error) {
            console.error("🔸 중복 신청 검증 실패:", error);
            return false; // 검증 실패 시 중복이 아닌 것으로 처리
        }
    }
    
    /**
     * 연장근무신청 목록 조회 (2025년 8월 25일 19:00 수정됨)
     * @param {string} userEmail - 사용자 이메일
     * @param {number} limit - 조회 개수 제한 (기본: 10)
     * @returns {Promise<Array>} 연장근무신청 목록
     */
    async getOvertimeRequests(userEmail, limit = 10) {
        if (!this.isInitialized) {
            throw new Error("Firestore가 초기화되지 않았습니다.");
        }
        
        try {
            const snapshot = await this.db
                .collection("records")
                .doc(userEmail)
                .collection("requests")
                .orderBy("date", "desc") // 날짜 기준으로 정렬
                .limit(limit)
                .get();
            
            const requests = [];
            snapshot.forEach(doc => {
                requests.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`🔹 연장근무신청 목록 조회 완료: ${requests.length}건`);
            return requests;
            
        } catch (error) {
            console.error("🔸 연장근무신청 목록 조회 실패:", error);
            throw new Error(`조회 실패: ${error.message}`);
        }
    }
    
    /**
     * 특정 날짜의 연장근무신청 조회 (2025년 8월 25일 19:00 수정됨)
     * @param {string} userEmail - 사용자 이메일
     * @param {string} date - 조회 날짜 (YYYY-MM-DD)
     * @returns {Promise<Object|null>} 연장근무신청 데이터
     */
    async getOvertimeRequestByDate(userEmail, date) {
        if (!this.isInitialized) {
            throw new Error("Firestore가 초기화되지 않았습니다.");
        }
        
        try {
            // 날짜 기반 문서 ID 사용으로 직접 조회
            const docRef = this.db
                .collection("records")
                .doc(userEmail)
                .collection("requests")
                .doc(date);
            
            const doc = await docRef.get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
            
        } catch (error) {
            console.error("🔸 특정 날짜 연장근무신청 조회 실패:", error);
            throw new Error(`조회 실패: ${error.message}`);
        }
    }
    
    /**
     * 연장근무신청 상태 업데이트 (2025년 8월 25일 19:00 수정됨)
     * @param {string} userEmail - 사용자 이메일
     * @param {string} date - 날짜 (YYYY-MM-DD) - 이제 requestId 역할
     * @param {string} status - 새로운 상태 (pending, approved, rejected, cancelled)
     * @param {string} comment - 상태 변경 사유 (선택)
     * @returns {Promise} 업데이트 결과
     */
    async updateOvertimeRequestStatus(userEmail, date, status, comment = null) {
        if (!this.isInitialized) {
            throw new Error("Firestore가 초기화되지 않았습니다.");
        }
        
        try {
            const now = new Date();
            const kstOffset = 9 * 60 * 60 * 1000;
            const kstNow = new Date(now.getTime() + kstOffset);
            
            const docRef = this.db
                .collection("records")
                .doc(userEmail)
                .collection("requests")
                .doc(date); // 날짜를 문서 ID로 사용
            
            const updateData = {
                status: status,
                updatedAt: kstNow.toISOString()
            };
            
            if (comment) {
                updateData.statusComment = comment;
            }
            
            await docRef.update(updateData);
            
            console.log(`🔹 연장근무신청 상태 업데이트 완료: ${date} -> ${status}`);
            
            return {
                success: true,
                message: "상태가 성공적으로 업데이트되었습니다."
            };
            
        } catch (error) {
            console.error("🔸 연장근무신청 상태 업데이트 실패:", error);
            throw new Error(`업데이트 실패: ${error.message}`);
        }
    }
    
    /**
     * 월별 연장근무 통계 조회 (2025년 8월 25일 19:00 수정됨)
     * @param {string} userEmail - 사용자 이메일
     * @param {string} month - 조회 월 (YYYY-MM)
     * @returns {Promise<Object|null>} 월별 통계 데이터
     */
    async getMonthlyOvertimeStats(userEmail, month) {
        if (!this.isInitialized) {
            throw new Error("Firestore가 초기화되지 않았습니다.");
        }
        
        try {
            const doc = await this.db
                .collection("records")
                .doc(userEmail)
                .collection("monthlyStats")
                .doc(month)
                .get();
            
            if (doc.exists) {
                return doc.data();
            } else {
                return {
                    month: month,
                    requestCount: 0,
                    totalHours: 0,
                    updatedAt: null
                };
            }
            
        } catch (error) {
            console.error("🔸 월별 연장근무 통계 조회 실패:", error);
            throw new Error(`조회 실패: ${error.message}`);
        }
    }
    
    /**
     * 연장근무신청 삭제 (취소) (2025년 8월 25일 19:00 수정됨)
     * @param {string} userEmail - 사용자 이메일
     * @param {string} date - 날짜 (YYYY-MM-DD) - 이제 requestId 역할
     * @returns {Promise} 삭제 결과
     */
    async cancelOvertimeRequest(userEmail, date) {
        // 실제로는 삭제하지 않고 상태를 'cancelled'로 변경
        return await this.updateOvertimeRequestStatus(userEmail, date, 'cancelled', '사용자 취소');
    }
}

// 전역 인스턴스 생성 (2025년 8월 25일 16:25 생성됨)
window.overtimeFirestore = new OvertimeFirestore();

// Firebase 준비 완료 후 초기화
document.addEventListener("firebaseReady", () => {
    window.overtimeFirestore.initialize();
});

// 전역 모듈로 내보내기 (2025년 8월 25일 19:00 수정됨)
window.OvertimeFirestore = {
    initialize: () => window.overtimeFirestore.initialize(),
    saveOvertimeRequest: (overtimeData) => window.overtimeFirestore.saveOvertimeRequest(overtimeData),
    checkDuplicateRequest: (date, userEmail) => window.overtimeFirestore.checkDuplicateRequest(date, userEmail),
    getOvertimeRequests: (userEmail, limit) => window.overtimeFirestore.getOvertimeRequests(userEmail, limit),
    getOvertimeRequestByDate: (userEmail, date) => window.overtimeFirestore.getOvertimeRequestByDate(userEmail, date),
    updateOvertimeRequestStatus: (userEmail, date, status, comment) => 
        window.overtimeFirestore.updateOvertimeRequestStatus(userEmail, date, status, comment),
    getMonthlyOvertimeStats: (userEmail, month) => window.overtimeFirestore.getMonthlyOvertimeStats(userEmail, month),
    cancelOvertimeRequest: (userEmail, date) => window.overtimeFirestore.cancelOvertimeRequest(userEmail, date)
};