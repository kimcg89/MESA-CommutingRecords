// 출퇴근 모달 관리 모듈 - 2025.01.21 13:35 생성
// 기존 script.js의 모달 함수들을 모듈화

/**
 * 출퇴근 관련 모달 관리 클래스
 * 내외근 상세보기, 휴가자 상세보기 모달 관리
 */
class WorktimeModalManager {
    constructor() {
        this.isInitialized = false;
        console.log('🗂️ WorktimeModalManager 생성 - 2025.01.21 13:35');
    }

    /**
     * 초기화 함수 - 2025.01.21 13:35 생성
     */
    init() {
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ WorktimeModalManager 초기화 완료');
    }

    /**
     * 이벤트 리스너 설정 - 2025.01.21 13:35 생성
     */
    setupEventListeners() {
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAttendanceDetailModal();
                this.closeVacationDetailModal();
            }
        });

        // 모달 외부 클릭으로 닫기
        document.addEventListener('click', (event) => {
            const attendanceModal = document.getElementById('attendance-detail-modal');
            const vacationModal = document.getElementById('vacation-detail-modal');
            
            if (attendanceModal?.style.display === 'flex' && event.target === attendanceModal) {
                this.closeAttendanceDetailModal();
            }
            if (vacationModal?.style.display === 'flex' && event.target === vacationModal) {
                this.closeVacationDetailModal();
            }
        });
    }

    /**
 * 출퇴근 상세보기 모달 열기 - 2025.08.20 17:30 수정: start,gps,end 모든 데이터에서 최신 시간 데이터 선택
 * 기존: GPS 데이터만 확인 → 수정: 모든 출퇴근 데이터 중 가장 마지막 시간 데이터 표시
 */
async openAttendanceDetailModal() {
    const modal = document.getElementById('attendance-detail-modal');
    const tbody = document.getElementById('attendance-detail-body');
    
    if (!modal || !tbody) {
        console.error('❌ 출퇴근 상세보기 모달 요소를 찾을 수 없습니다.');
        return;
    }

    modal.style.display = 'flex';
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">불러오는 중...</td></tr>`;

    // 출퇴근 데이터 매니저에서 선택된 사용자 가져오기
    if (!window.worktimeDataManager || !window.worktimeDataManager.isReady()) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">데이터 매니저가 준비되지 않았습니다.</td></tr>`;
        return;
    }

    const selectedEmails = window.worktimeDataManager.getSelectedUserEmails();
    
    if (selectedEmails.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">표시할 직원을 선택하세요.</td></tr>`;
        return;
    }

    // 테이블 데이터 생성
    tbody.innerHTML = '';
    
    selectedEmails.forEach((email) => {
        // 조직 데이터에서 사용자 정보 가져오기
        const userInfo = this.getUserInfo(email);
        const record = window.worktimeDataManager.getCachedRecord(email);
        
        if (!userInfo || !record) {
            return;
        }

        // 🆕 2025.08.20 17:30 수정: start, gps, end 모든 데이터에서 최신 시간 데이터 찾기
        console.log('🔍 모든 출퇴근 데이터 분석:', email, {
            start: record.start?.length || 0,
            gps: record.gps?.length || 0,
            end: record.end?.length || 0
        });

        // 모든 출퇴근 데이터를 하나의 배열로 병합
        const allAttendanceData = [];

        // start 배열 추가 (출근 데이터)
        if (Array.isArray(record.start) && record.start.length > 0) {
            record.start.forEach(item => {
                allAttendanceData.push({
                    ...item,
                    dataType: 'start',
                    timestamp: this.parseTimeToTimestamp(item.time || '00:00')
                });
            });
            console.log(`📍 start 데이터 추가: ${record.start.length}개`);
        }

        // gps 배열 추가 (GPS 데이터)
        if (Array.isArray(record.gps) && record.gps.length > 0) {
            record.gps.forEach(item => {
                allAttendanceData.push({
                    ...item,
                    dataType: 'gps',
                    timestamp: this.parseTimeToTimestamp(item.time || '12:00')
                });
            });
            console.log(`📍 gps 데이터 추가: ${record.gps.length}개`);
        }

        // end 배열 추가 (퇴근 데이터)
        if (Array.isArray(record.end) && record.end.length > 0) {
            record.end.forEach(item => {
                allAttendanceData.push({
                    ...item,
                    dataType: 'end',
                    timestamp: this.parseTimeToTimestamp(item.time || '18:00')
                });
            });
            console.log(`📍 end 데이터 추가: ${record.end.length}개`);
        }

        // 데이터가 없으면 건너뛰기
        if (allAttendanceData.length === 0) {
            console.log(`⚠️ ${email}: 출퇴근 데이터가 없습니다.`);
            return;
        }

        // 시간순으로 정렬하여 가장 마지막 데이터 선택
        allAttendanceData.sort((a, b) => a.timestamp - b.timestamp);
        const latestData = allAttendanceData[allAttendanceData.length - 1];

        console.log(`📍 ${email} 최신 데이터 선택:`, {
            dataType: latestData.dataType,
            time: latestData.time,
            totalCount: allAttendanceData.length
        });

        // 🔧 2025.08.20 17:30 수정: 위치 유형 판별 로직 개선
        console.log('🔍 최신 출퇴근 엔트리 분석:', email, latestData);
        
        // 최신 데이터 전체를 determineLocationType에 전달
        const gpsType = window.worktimeDataManager.determineLocationType(latestData);
        
        // 위치 유형 한글 표시
        const gpsLabel = gpsType === 'office' ? '내근' : 
                       gpsType === 'remote' ? '재택/외근' : '미확인';

        console.log(`📍 ${email} 위치 유형: ${gpsType} -> ${gpsLabel} (${latestData.dataType} 데이터)`);

        // 주소 또는 GPS 좌표 표시
        const locationDisplay = latestData.address && latestData.address.trim() !== '' ? 
                              latestData.address : latestData.gps;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${userInfo.name}</td>
            <td>${userInfo.department0 || '-'}</td>
            <td>${userInfo.level || userInfo.position || '-'}</td>
            <td>${gpsLabel}</td>
            <td>${locationDisplay}</td>
            <td>${latestData.time}</td>
        `;
        tbody.appendChild(row);
    });

    if (tbody.children.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">선택된 직원의 데이터가 없습니다.</td></tr>`;
    }
}

/**
 * 시간 문자열을 타임스탬프로 변환 - 2025.08.20 17:30 생성
 * 출퇴근 데이터 시간 비교를 위한 유틸리티 함수
 * @param {string} timeString - 시간 문자열 (예: "09:30:15")
 * @returns {number} 타임스탬프
 */
parseTimeToTimestamp(timeString) {
    if (!timeString || typeof timeString !== 'string') {
        return 0;
    }

    try {
        // 오늘 날짜에 시간을 결합하여 타임스탬프 생성
        const today = new Date().toISOString().split('T')[0];
        const dateTimeString = `${today}T${timeString}`;
        const timestamp = new Date(dateTimeString).getTime();
        
        if (isNaN(timestamp)) {
            console.warn(`⚠️ 잘못된 시간 형식: ${timeString}`);
            return 0;
        }
        
        return timestamp;
    } catch (error) {
        console.error(`❌ 시간 파싱 오류: ${timeString}`, error);
        return 0;
    }
}

    /**
     * 출퇴근 상세보기 모달 닫기 - 2025.01.21 13:35 생성
     */
    closeAttendanceDetailModal() {
        const modal = document.getElementById('attendance-detail-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 휴가자 상세보기 모달 열기 - 2025.01.21 13:35 생성
     * 기존 openVacationDetailModal() 함수 참고
     */
    async openVacationDetailModal() {
        const modal = document.getElementById('vacation-detail-modal');
        const tbody = document.getElementById('vacation-detail-body');
        
        if (!modal || !tbody) {
            console.error('❌ 휴가자 상세보기 모달 요소를 찾을 수 없습니다.');
            return;
        }

        modal.style.display = 'flex';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">불러오는 중...</td></tr>`;

        // 현재 활성 탭 확인
        const activeTab = document.querySelector('.period-tab.active');
        let period = 'today';
        if (activeTab?.textContent.includes('주')) {
            period = 'week';
        } else if (activeTab?.textContent.includes('달')) {
            period = 'month';
        }

        // 기간 설정
        const kstOffset = 9 * 60 * 60 * 1000;
        const now = new Date(Date.now() + kstOffset);
        let start = new Date(now);
        let end = new Date(now);

        if (period === 'week') {
            start.setDate(now.getDate() - now.getDay());
            end.setDate(start.getDate() + 6);
        } else if (period === 'month') {
            start.setDate(1);
            end.setMonth(now.getMonth() + 1, 0);
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const selectedEmails = window.worktimeDataManager.getSelectedUserEmails();
        
        if (selectedEmails.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">상세 정보를 보려면 직원을 선택하세요.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';

        try {
            const promises = [];
            
            selectedEmails.forEach((email) => {
                const userInfo = this.getUserInfo(email);
                if (!userInfo) return;

                const promise = window.firebaseFirestore
                    .collection('records')
                    .doc(email)
                    .collection('dates')
                    .where(firebase.firestore.FieldPath.documentId(), '>=', startStr)
                    .where(firebase.firestore.FieldPath.documentId(), '<=', endStr)
                    .get()
                    .then((dateSnap) => {
                        dateSnap.forEach((doc) => {
                            if (!Array.isArray(doc.data().vacation)) return;
                            
                            doc.data().vacation.forEach((v) => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${userInfo.name}</td>
                                    <td>${userInfo.department0 || '-'}</td>
                                    <td>${userInfo.level || userInfo.position || '-'}</td>
                                    <td>${v.type || '-'}</td>
                                    <td>${v.start}</td>
                                    <td>${v.end}</td>
                                    <td>${doc.id}</td>
                                `;
                                tbody.appendChild(row);
                            });
                        });
                    });
                
                promises.push(promise);
            });

            await Promise.all(promises);

            if (tbody.children.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">선택된 사용자는 해당 기간에 휴가 기록이 없습니다.</td></tr>`;
            }

        } catch (error) {
            console.error('❌ 휴가자 상세보기 데이터 로드 실패:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">데이터 로드에 실패했습니다.</td></tr>`;
        }
    }

    /**
     * 휴가자 상세보기 모달 닫기 - 2025.01.21 13:35 생성
     */
    closeVacationDetailModal() {
        const modal = document.getElementById('vacation-detail-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 사용자 정보 가져오기 헬퍼 함수 - 2025.01.21 13:35 생성
     */
    getUserInfo(email) {
        if (window.organizationManager && window.organizationManager.findMemberByEmail) {
            return window.organizationManager.findMemberByEmail(email);
        }
        return null;
    }

    /**
     * 휴가 기간 탭 전환 - 2025.01.21 13:35 생성
     * 기존 switchVacationPeriod() 함수 참고
     */
    switchVacationPeriod(period) {
        // 모든 탭에서 active 클래스 제거
        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 클릭된 탭에 active 클래스 추가
        const targetTab = document.querySelector(`.period-tab[onclick*="${period}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // 휴가자 수 카드 업데이트
        if (window.worktimeDataManager && window.worktimeDataManager.isReady()) {
            this.updateVacationCard(period);
        }
    }

    /**
     * 휴가자 수 카드 업데이트 - 2025.01.21 13:35 생성
     */
    async updateVacationCard(period) {
        try {
            const vacationData = await window.worktimeDataManager.getVacationData(period);
            
            const vacationCountEl = document.getElementById('vacation-count');
            const annualLeaveEl = document.getElementById('annual-leave-count');
            const compLeaveEl = document.getElementById('half-comp-leave-count');
            
            if (vacationCountEl) vacationCountEl.textContent = `${vacationData.total}명`;
            if (annualLeaveEl) annualLeaveEl.textContent = `${vacationData.annualLeave}명`;
            if (compLeaveEl) compLeaveEl.textContent = `${vacationData.compLeave}명`;
            
        } catch (error) {
            console.error('❌ 휴가자 수 카드 업데이트 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
const worktimeModalManager = new WorktimeModalManager();

// 전역 접근 가능하도록 설정
window.worktimeModalManager = worktimeModalManager;

// 전역 함수로 노출 (기존 HTML onclick 호환성)
window.openAttendanceDetailModal = function() {
    worktimeModalManager.openAttendanceDetailModal();
};

window.closeAttendanceDetailModal = function() {
    worktimeModalManager.closeAttendanceDetailModal();
};

window.openVacationDetailModal = function() {
    worktimeModalManager.openVacationDetailModal();
};

window.closeVacationDetailModal = function() {
    worktimeModalManager.closeVacationDetailModal();
};

window.switchVacationPeriod = function(period) {
    worktimeModalManager.switchVacationPeriod(period);
};

console.log('📦 worktime-modal-manager.js 로드 완료 - 2025.01.21 13:35');