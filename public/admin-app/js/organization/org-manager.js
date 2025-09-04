// 조직 관리 핵심 모듈 - 2025.08.14 생성
// 기존 firebaseOrgManager에서 분리한 조직 관리 핵심 로직

/**
 * 조직 관리 클래스
 * 조직도 데이터 로드, 관리, 권한 체크 등 핵심 로직 담당
 */
class OrganizationManager {
    constructor() {
        this.orgData = [];
        this.filteredMembers = new Set(); // 필터링된 멤버들의 이메일 저장
        this.searchTerm = ''; // 현재 검색어
        this.isInitialized = false;
        this.loadPromise = null; // 중복 로딩 방지
        
        console.log('🏢 OrganizationManager 생성자 호출');
    }

    /**
     * 조직 관리자 초기화
     */
    async init() {
        try {
            console.log('🏢 조직 관리 시스템 초기화 중...');
            
            // 조직도 데이터 로드
            await this.loadOrganizationData();
            
            // 검색 기능 초기화
            this.initializeSearch();
            
            this.isInitialized = true;
            console.log('✅ 조직 관리 시스템 초기화 완료');
            
        } catch (error) {
            console.error('❌ 조직 관리 시스템 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 조직도 데이터 로드
     * 2025.08.14 수정: records 컬렉션 구조에 맞게 수정
     */
    async loadOrganizationData() {
        // 중복 로딩 방지
        if (this.loadPromise) {
            return await this.loadPromise;
        }

        this.loadPromise = this._loadOrganizationDataInternal();
        
        try {
            await this.loadPromise;
        } finally {
            this.loadPromise = null;
        }
    }

    /**
     * 내부 조직도 데이터 로드 함수
     */
    async _loadOrganizationDataInternal() {
        try {
            console.log('📊 조직도 데이터 로드 중...');
            
            // Firebase 대기
            await this.waitForFirebase();
            
            // records 컬렉션에서 조직도 데이터 로드
            const snapshot = await window.firebaseFirestore.collection('records').get();
            const members = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // 사용자 메타데이터가 있는 문서만 포함
                if (data.name && data.department0) {
                    members.push({
                        id: doc.id,
                        email: doc.id, // records에서는 문서 ID가 이메일
                        ...data
                    });
                }
            });
            
            // 부서별로 그룹화
            this.orgData = this.groupByDepartment(members);
            
            // UI 렌더링은 별도 모듈에서 처리
            this.notifyDataChanged();
            
            console.log(`✅ 조직도 데이터 로드 완료: ${members.length}명`);
            
            // 통계 업데이트
            this.updateStatistics(members);
            
        } catch (error) {
            console.error('❌ 조직도 데이터 로드 실패:', error);
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
     * 부서별 그룹화
     */
    groupByDepartment(members) {
        const departments = {};
        
        members.forEach(member => {
            const deptName = member.department0 || '미지정';
            
            if (!departments[deptName]) {
                departments[deptName] = {
                    department: deptName,
                    subDepartments: {}
                };
            }
            
            // 2차 그룹핑 (department)
            const subDeptName = member.department || '미지정';
            if (!departments[deptName].subDepartments[subDeptName]) {
                departments[deptName].subDepartments[subDeptName] = {
                    department: subDeptName,
                    members: []
                };
            }
            
            departments[deptName].subDepartments[subDeptName].members.push({
                name: member.name,
                position: member.level || '직급미지정',
                duty: member.duty || '업무미지정',
                email: member.email,
                tel: member.tel || '연락처미지정',
                memberID: member.memberID,
                keymanager: member.keymanager || '',
                department0: deptName,
                department: subDeptName
            });
        });
        
        // 객체를 배열로 변환하고 정렬
        const result = Object.values(departments).map(dept => ({
            ...dept,
            subDepartments: Object.values(dept.subDepartments).sort((a, b) => 
                a.department.localeCompare(b.department)
            )
        })).sort((a, b) => a.department.localeCompare(b.department));
        
        return result;
    }

    /**
     * 통계 업데이트
     */
    updateStatistics(members) {
        const stats = {
            totalUsers: members.length,
            activeUsers: members.filter(m => this.isActiveUser(m)).length,
            keyManagers: members.filter(m => m.keymanager === 'O').length,
            departments: [...new Set(members.map(m => m.department0))].length
        };
        
        // UI 업데이트
        this.updateStatisticsUI(stats);
        
        // 통계 변경 이벤트 발송
        document.dispatchEvent(new CustomEvent('orgStatsUpdated', {
            detail: stats
        }));
    }

    /**
     * 활성 사용자 체크 (30일 기준)
     */
    isActiveUser(member) {
        if (!member.lastLoginAt) return false;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const lastLogin = member.lastLoginAt.toDate ? 
            member.lastLoginAt.toDate() : 
            new Date(member.lastLoginAt);
            
        return lastLogin > thirtyDaysAgo;
    }

    /**
     * 통계 UI 업데이트
     */
    updateStatisticsUI(stats) {
        const elements = {
            'total-users': stats.totalUsers,
            'active-users': stats.activeUsers,
            'key-managers': stats.keyManagers,
            'total-departments': stats.departments
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    /**
     * 데이터 변경 알림
     */
    notifyDataChanged() {
        document.dispatchEvent(new CustomEvent('orgDataChanged', {
            detail: {
                orgData: this.orgData,
                filteredMembers: Array.from(this.filteredMembers),
                searchTerm: this.searchTerm
            }
        }));
    }

    /**
     * 검색 기능 초기화
     */
    initializeSearch() {
        const searchInput = document.getElementById('task-search');
        if (searchInput) {
            // 기존 이벤트 리스너 제거를 위해 새로 설정
            searchInput.oninput = (e) => {
                this.searchTerm = e.target.value.trim().toLowerCase();
                this.notifyDataChanged();
            };
        }
    }

    /**
     * 검색어 설정
     */
    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase();
        this.notifyDataChanged();
    }

    /**
     * 검색어 가져오기
     */
    getSearchTerm() {
        return this.searchTerm;
    }

    /**
     * 필터링된 조직도 데이터 가져오기
     */
    getFilteredOrgData() {
        if (!this.searchTerm) {
            return this.orgData;
        }
        
        return this.orgData.map(dept0 => ({
            ...dept0,
            subDepartments: dept0.subDepartments.map(subDept => ({
                ...subDept,
                members: subDept.members.filter(member => 
                    member.name.toLowerCase().includes(this.searchTerm) ||
                    member.position.toLowerCase().includes(this.searchTerm) ||
                    member.duty.toLowerCase().includes(this.searchTerm) ||
                    member.email.toLowerCase().includes(this.searchTerm)
                )
            })).filter(subDept => subDept.members.length > 0)
        })).filter(dept0 => dept0.subDepartments.length > 0);
    }

    /**
     * 전체 조직도 데이터 가져오기
     */
    getOrgData() {
        return this.orgData;
    }

    /**
     * 멤버 필터 토글
     */
    toggleMemberFilter(email, isSelected) {
        if (isSelected) {
            this.filteredMembers.add(email);
        } else {
            this.filteredMembers.delete(email);
        }
        
        // 필터 적용 알림
        this.applyDataFilter();
        this.updateFilterStatus();
    }

    /**
     * 데이터 필터 적용
     */
    applyDataFilter() {
        const currentUserData = window.authUtils?.getCurrentUser();
        if (!currentUserData) return;
        
        const currentUserEmail = currentUserData.email;
        const isKeyManager = currentUserData.keymanager === 'O';
        const currentDept0 = currentUserData.department0;
        
        // 필터링된 멤버가 있을 때만 필터 적용
        if (this.filteredMembers.size > 0) {
            console.log('📊 조직 필터 적용됨:', {
                filteredMembers: Array.from(this.filteredMembers),
                currentUser: currentUserEmail,
                isKeyManager,
                currentDept0
            });
            
            // 다른 모듈에서 이 이벤트를 받아 처리할 수 있도록 커스텀 이벤트 발생
            const filterEvent = new CustomEvent('orgFilterChanged', {
                detail: {
                    filteredMembers: Array.from(this.filteredMembers),
                    currentUserEmail,
                    isKeyManager,
                    currentDept0
                }
            });
            document.dispatchEvent(filterEvent);
        } else {
            // 필터 해제
            const clearFilterEvent = new CustomEvent('orgFilterCleared');
            document.dispatchEvent(clearFilterEvent);
        }
    }

    /**
     * 필터 상태 업데이트
     */
    updateFilterStatus() {
        const statusEvent = new CustomEvent('orgFilterStatusChanged', {
            detail: {
                filteredCount: this.filteredMembers.size,
                filteredMembers: Array.from(this.filteredMembers)
            }
        });
        document.dispatchEvent(statusEvent);
    }

    /**
     * 모든 필터 해제
     */
    clearAllFilters() {
        this.filteredMembers.clear();
        this.applyDataFilter();
        this.updateFilterStatus();
        
        // UI에서 체크박스 해제 이벤트 발송
        document.dispatchEvent(new CustomEvent('orgFilterCleared'));
    }

    /**
     * 필터링된 멤버 목록 가져오기
     */
    getFilteredMembers() {
        return Array.from(this.filteredMembers);
    }

    /**
     * 권한 체크 함수
     */
    canViewMemberData(targetMemberEmail) {
        const currentUserData = window.authUtils?.getCurrentUser();
        if (!currentUserData) return false;
        
        return window.authUtils?.canAccessUserData(targetMemberEmail) || false;
    }

    /**
     * 이메일로 멤버 찾기
     */
    findMemberByEmail(email) {
        for (const dept0 of this.orgData) {
            for (const subDept of dept0.subDepartments) {
                const member = subDept.members.find(m => m.email === email);
                if (member) {
                    return {
                        ...member,
                        department0: dept0.department,
                        department: subDept.department
                    };
                }
            }
        }
        return null;
    }

    /**
     * 부서별 멤버 목록 가져오기
     */
    getMembersByDepartment(department0, department = null) {
        const dept = this.orgData.find(d => d.department === department0);
        if (!dept) return [];
        
        if (department) {
            const subDept = dept.subDepartments.find(sd => sd.department === department);
            return subDept ? subDept.members : [];
        }
        
        // 전체 하위 부서의 멤버들 반환
        return dept.subDepartments.flatMap(sd => sd.members);
    }

    /**
     * 전체 멤버 수 가져오기
     */
    getTotalMemberCount() {
        return this.orgData.reduce((total, dept0) => {
            return total + dept0.subDepartments.reduce((subTotal, subDept) => {
                return subTotal + subDept.members.length;
            }, 0);
        }, 0);
    }

    /**
     * 부서 목록 가져오기
     */
    getDepartmentList() {
        return this.orgData.map(dept => ({
            department0: dept.department,
            subDepartments: dept.subDepartments.map(sub => sub.department),
            memberCount: dept.subDepartments.reduce((count, sub) => count + sub.members.length, 0)
        }));
    }

    /**
     * 키매니저 목록 가져오기
     */
    getKeyManagers() {
        const keyManagers = [];
        
        this.orgData.forEach(dept0 => {
            dept0.subDepartments.forEach(subDept => {
                subDept.members.forEach(member => {
                    if (member.keymanager === 'O') {
                        keyManagers.push(member);
                    }
                });
            });
        });
        
        return keyManagers;
    }

    /**
     * 조직도 새로고침
     */
    async refresh() {
        console.log('🔄 조직도 데이터 새로고침');
        await this.loadOrganizationData();
    }

    /**
     * 초기화 상태 확인
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 디버깅용 조직 상태 정보 출력
     */
    debugOrgState() {
        const orgState = {
            isInitialized: this.isInitialized,
            totalDepartments: this.orgData.length,
            totalMembers: this.getTotalMemberCount(),
            filteredMembers: this.filteredMembers.size,
            searchTerm: this.searchTerm,
            keyManagers: this.getKeyManagers().length
        };
        
        console.table(orgState);
        return orgState;
    }
}

// 전역 인스턴스 생성
const organizationManager = new OrganizationManager();

// 전역 접근 가능하도록 설정
window.organizationManager = organizationManager;

console.log('📦 org-manager.js 로드 완료 - 2025.01.21 13:40');