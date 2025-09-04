// 출퇴근 필터 매니저 - 2025.08.19 20:30 완성
// 조직도 필터와 worktime 필터를 완전 양방향으로 연동

/**
 * 출퇴근 필터 통합 관리 클래스
 * 조직도 필터(사용자 선택)와 worktime 필터(기간/부서/팀/직급)를 완전 양방향 연동
 */
class WorktimeFilterManager {
  constructor() {
    this.isInitialized = false;

    // 현재 필터 상태
    this.currentFilters = {
      // 기간 필터
      period: "month", // 🆕 2025.08.19 20:30 수정: 기본값을 month로 변경
      startDate: null,
      endDate: null,

      // 조직 필터
      department: "all",
      team: "all",
      position: "all",

      // 선택된 사용자 (조직도에서)
      selectedUsers: new Set(),
    };

    // 양방향 연동 상태 관리
    this.syncState = {
      isUpdatingFromOrg: false, // 조직도에서 업데이트 중인지
      isUpdatingFromWorktime: false, // Worktime에서 업데이트 중인지
      lastUpdateSource: null, // 마지막 업데이트 소스 ('org' | 'worktime')
    };

    console.log('🔗 WorktimeFilterManager 생성 - 2025.08.19 20:30');
  }

  /**
   * 초기화 함수 - 2025.08.19 20:30 수정: 기본 기간 설정 개선
   */
  async init() {
    try {
      console.log('🔧 통합 필터 매니저 초기화 시작...');
      
      // 기본 필터 값 설정 (1개월 기본값)
      this.setDefaultFilters();
      
      // HTML 요소에서 현재 상태 로드
      this.loadCurrentFilterState();
      
      // 이벤트 리스너 설정
      this.setupFilterEventListeners();
      
      // 양방향 연동 설정
      this.setupBidirectionalIntegration();
      
      // 🆕 2025.08.19 20:30 추가: 기본 기간을 1개월로 설정
      this.ensureDefaultPeriod();
      
      this.isInitialized = true;
      console.log('✅ 통합 필터 매니저 초기화 완료');
      
      // 초기 필터 상태 알림
      this.notifyFilterChange('initialization');
      
    } catch (error) {
      console.error('❌ 통합 필터 매니저 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 필터 설정 - 2025.08.19 20:30 신규 생성
   */
  setDefaultFilters() {
    // 기본 기간을 1개월로 설정
    this.currentFilters.period = 'month';
    this.setDefaultDateRange('month');
    
    console.log('📅 기본 필터 설정:', {
      period: this.currentFilters.period,
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate
    });
  }

  /**
   * 기본 기간 보장 - 2025.08.19 20:30 신규 생성
   */
  ensureDefaultPeriod() {
    // HTML select 요소의 기본값 확인 및 설정
    const periodSelect = document.getElementById('worktime-period-select');
    if (periodSelect) {
      // 기본값이 설정되지 않았다면 1개월로 설정
      if (!periodSelect.value || periodSelect.value === '') {
        periodSelect.value = 'month';
        console.log('📅 기간 선택 기본값을 1개월로 설정');
      }
      
      // 필터 상태에도 반영
      this.currentFilters.period = periodSelect.value;
      
      // 선택된 기간에 맞는 날짜 범위 설정
      this.setDefaultDateRange(this.currentFilters.period);
    }
    
    console.log('📅 기본 기간 설정 완료:', {
      period: this.currentFilters.period,
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate
    });
  }

  /**
   * 완전 양방향 연동 설정 - 2025.01.21 15:30 신규 생성
   * 조직도 ↔ Worktime 필터 간의 완전 양방향 연동
   */
  setupBidirectionalIntegration() {
    // 1. 조직도 → Worktime 연동
    document.addEventListener('orgFilterChanged', (e) => {
      if (this.syncState.isUpdatingFromWorktime) {
        console.log('🔄 [연동] Worktime 업데이트 중이므로 조직도 이벤트 무시');
        return;
      }

      this.syncState.isUpdatingFromOrg = true;
      this.syncState.lastUpdateSource = 'org';
      
      console.log('🔄 [연동] 조직도 → Worktime 동기화 시작');
      this.syncFromOrganization(e.detail);
      
      this.syncState.isUpdatingFromOrg = false;
    });

    document.addEventListener('orgFilterCleared', () => {
      if (this.syncState.isUpdatingFromWorktime) return;
      
      this.syncState.isUpdatingFromOrg = true;
      console.log('🔄 [연동] 조직도 필터 해제 → Worktime 동기화');
      this.clearOrgChartSelectionSmart();
      this.syncState.isUpdatingFromOrg = false;
    });

    // 2. Worktime → 조직도 연동
    document.addEventListener('worktimeFilterChanged', (e) => {
      if (this.syncState.isUpdatingFromOrg) {
        console.log('🔄 [연동] 조직도 업데이트 중이므로 Worktime 이벤트 무시');
        return;
      }

      if (e.detail.source === 'worktimeFilterManager') {
        console.log('🔄 [연동] 자체 이벤트이므로 무시');
        return;
      }

      this.syncState.isUpdatingFromWorktime = true;
      this.syncState.lastUpdateSource = 'worktime';
      
      console.log('🔄 [연동] Worktime → 조직도 동기화 시작');
      this.syncToOrganization(e.detail);
      
      this.syncState.isUpdatingFromWorktime = false;
    });

    console.log('🔗 완전 양방향 연동 설정 완료');
  }

  /**
 * 조직도에서 동기화 - 2025.08.19 20:45 수정: 스마트 필터링 적용
 */
syncFromOrganization(detail) {
  try {
    if (!window.organizationManager) return;

    const selectedEmails = window.organizationManager.getFilteredMembers();
    const previousCount = this.currentFilters.selectedUsers.size;
    
    // 선택된 사용자 업데이트
    this.currentFilters.selectedUsers = new Set(selectedEmails);
    
    console.log(`🔄 [조직→필터] 사용자 동기화: ${previousCount} → ${selectedEmails.length}명`);
    
    // 🆕 2025.08.19 20:45 수정: 스마트 필터링 적용
    this.syncFiltersFromUsers(selectedEmails);

  } catch (error) {
    console.error('❌ [연동] 조직도 동기화 실패:', error);
  }
}

/**
 * 사용자 기반 스마트 필터 동기화 - 2025.08.19 20:45 신규 생성
 * 부서/팀/직급을 모두 분석하여 같으면 설정, 다르면 "전체"로 리셋
 */
syncFiltersFromUsers(selectedEmails) {
  if (!window.organizationManager) {
    console.log('🔄 [스마트필터] organizationManager 없음 - 전체 리셋');
    this.resetAllFiltersToAll();
    return;
  }

  if (selectedEmails.length === 0) {
    console.log('🔄 [스마트필터] 선택된 사용자 없음 - 전체 리셋');
    this.resetAllFiltersToAll();
    return;
  }

  try {
    // 선택된 사용자들의 속성 분석
    const userAttributes = this.analyzeUserAttributes(selectedEmails);
    
    console.log('📊 [스마트필터] 사용자 속성 분석:', {
      departments: userAttributes.departments.size,
      teams: userAttributes.teams.size,
      positions: userAttributes.positions.size,
      selectedCount: selectedEmails.length
    });

    // 각 필터별 스마트 설정
    this.applySmartDepartmentFilter(userAttributes.departments);
    this.applySmartTeamFilter(userAttributes.teams);
    this.applySmartPositionFilter(userAttributes.positions);

    console.log('✅ [스마트필터] 필터 동기화 완료');

  } catch (error) {
    console.error('❌ [스마트필터] 필터 동기화 실패:', error);
    this.resetAllFiltersToAll();
  }
}

/**
 * 사용자 속성 분석 - 2025.08.19 20:45 신규 생성
 */
analyzeUserAttributes(selectedEmails) {
  const departments = new Set();
  const teams = new Set();
  const positions = new Set();

  selectedEmails.forEach(email => {
    const member = window.organizationManager.findMemberByEmail(email);
    if (member) {
      // 부서 정보 (department0 = 상위부서)
      if (member.department0) {
        departments.add(member.department0);
      }
      
      // 팀 정보 (department = 하위팀)  
      if (member.department) {
        teams.add(member.department);
      }
      
      // 직급 정보
      if (member.position) {
        positions.add(member.position);
      }

      console.log(`👤 [분석] ${member.name}: 부서=${member.department0}, 팀=${member.department}, 직급=${member.position}`);
    }
  });

  return { departments, teams, positions };
}

/**
 * 스마트 부서 필터 적용 - 2025.08.19 20:45 신규 생성
 */
applySmartDepartmentFilter(departments) {
  const departmentSelect = document.getElementById('worktime-department-filter');
  if (!departmentSelect) return;

  if (departments.size === 1) {
    // 단일 부서: 해당 부서로 설정
    const department = Array.from(departments)[0];
    const isValidOption = this.isValidSelectOption(departmentSelect, department);
    
    if (isValidOption) {
      this.currentFilters.department = department;
      departmentSelect.value = department;
      console.log(`🏢 [스마트필터] 부서 설정: ${department}`);
    } else {
      this.currentFilters.department = 'all';
      departmentSelect.value = 'all';
      console.log(`🏢 [스마트필터] 부서 옵션 없음, 전체로 설정: ${department}`);
    }
  } else {
    // 복수 부서 또는 부서 없음: 전체로 리셋
    this.currentFilters.department = 'all';
    departmentSelect.value = 'all';
    console.log(`🏢 [스마트필터] 부서 다름 (${departments.size}개) - 전체로 리셋`);
  }
}

/**
 * 스마트 팀 필터 적용 - 2025.08.19 20:45 신규 생성
 */
applySmartTeamFilter(teams) {
  const teamSelect = document.getElementById('worktime-team-filter');
  if (!teamSelect) return;

  if (teams.size === 1) {
    // 단일 팀: 해당 팀으로 설정
    const team = Array.from(teams)[0];
    const isValidOption = this.isValidSelectOption(teamSelect, team);
    
    if (isValidOption) {
      this.currentFilters.team = team;
      teamSelect.value = team;
      console.log(`👥 [스마트필터] 팀 설정: ${team}`);
    } else {
      this.currentFilters.team = 'all';
      teamSelect.value = 'all';
      console.log(`👥 [스마트필터] 팀 옵션 없음, 전체로 설정: ${team}`);
    }
  } else {
    // 복수 팀 또는 팀 없음: 전체로 리셋
    this.currentFilters.team = 'all';
    teamSelect.value = 'all';
    console.log(`👥 [스마트필터] 팀 다름 (${teams.size}개) - 전체로 리셋`);
  }
}

/**
 * 스마트 직급 필터 적용 - 2025.08.19 20:45 신규 생성
 */
applySmartPositionFilter(positions) {
  const positionSelect = document.getElementById('worktime-position-filter');
  if (!positionSelect) return;

  if (positions.size === 1) {
    // 단일 직급: 해당 직급으로 설정
    const position = Array.from(positions)[0];
    const isValidOption = this.isValidSelectOption(positionSelect, position);
    
    if (isValidOption) {
      this.currentFilters.position = position;
      positionSelect.value = position;
      console.log(`💼 [스마트필터] 직급 설정: ${position}`);
    } else {
      this.currentFilters.position = 'all';
      positionSelect.value = 'all';
      console.log(`💼 [스마트필터] 직급 옵션 없음, 전체로 설정: ${position}`);
    }
  } else {
    // 복수 직급 또는 직급 없음: 전체로 리셋
    this.currentFilters.position = 'all';
    positionSelect.value = 'all';
    console.log(`💼 [스마트필터] 직급 다름 (${positions.size}개) - 전체로 리셋`);
  }
}

/**
 * Select 옵션 유효성 검사 - 2025.08.19 20:45 신규 생성
 */
isValidSelectOption(selectElement, value) {
  if (!selectElement || !value) return false;
  
  // select 요소의 옵션들 중에 해당 value가 있는지 확인
  const options = Array.from(selectElement.options);
  const hasOption = options.some(option => option.value === value);
  
  if (!hasOption) {
    console.log(`⚠️ [검증] Select 옵션에 "${value}" 없음. 사용 가능한 옵션:`, 
      options.map(opt => opt.value).filter(val => val !== 'all')
    );
  }
  
  return hasOption;
}

/**
 * 모든 필터를 "전체"로 리셋 - 2025.08.19 20:45 신규 생성
 */
resetAllFiltersToAll() {
  console.log('🔄 [스마트필터] 모든 필터를 전체로 리셋');
  
  // 필터 상태 리셋
  this.currentFilters.department = 'all';
  this.currentFilters.team = 'all';
  this.currentFilters.position = 'all';
  
  // HTML 요소 업데이트
  const departmentSelect = document.getElementById('worktime-department-filter');
  const teamSelect = document.getElementById('worktime-team-filter');
  const positionSelect = document.getElementById('worktime-position-filter');
  
  if (departmentSelect) departmentSelect.value = 'all';
  if (teamSelect) teamSelect.value = 'all';
  if (positionSelect) positionSelect.value = 'all';
}

  /**
   * Worktime에서 조직도로 동기화 - 2025.01.21 15:30 신규 생성
   */
  syncToOrganization(detail) {
    // 현재는 주로 조직도 → Worktime 방향이 주이므로 최소한의 구현
    console.log('🔄 [필터→조직] Worktime 변경사항 확인:', detail.changeType);
    
    // 필요 시 조직도 필터 업데이트 로직 추가
    if (detail.changeType === 'department' && detail.filters.department === 'all') {
      // 부서가 전체로 변경되면 조직도도 전체 선택 해제 고려
      this.considerOrgChartClear();
    }
  }

  /**
   * 조직도 클리어 고려 - 2025.01.21 15:30 신규 생성
   */
  considerOrgChartClear() {
    const currentlySelected = this.getFilteredUserEmails();
    
    // 현재 선택된 사용자와 조직도 선택이 크게 다르면 동기화
    if (window.organizationManager) {
      const orgSelected = window.organizationManager.getFilteredMembers();
      const intersection = currentlySelected.filter(email => orgSelected.includes(email));
      const overlapRatio = intersection.length > 0 ? 
        intersection.length / currentlySelected.length
        : 0;

      return overlapRatio < 0.3;
    }
  }

  /**
   * 조직도 모든 선택 해제 - 2025.01.21 15:30 신규 생성
   */
  clearAllOrgChartSelections() {
    try {
      // 모든 체크박스 해제
      const checkboxes = document.querySelectorAll('.member-filter-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });

      // 조직도 매니저 상태 초기화
      if (window.organizationManager) {
        window.organizationManager.filteredMembers.clear();
      }

      console.log('🔄 조직도 모든 선택 해제 완료 (스마트)');
    } catch (error) {
      console.error('❌ 조직도 선택 해제 실패:', error);
    }
  }

  /**
   * 조직도 스마트 선택 해제 - 2025.01.21 15:30 신규 생성
   */
  clearOrgChartSelectionSmart() {
    // 사용자의 의도를 고려한 스마트 해제
    if (this.syncState.lastUpdateSource === 'org') {
      // 조직도에서 시작된 변경이면 부드럽게 처리
      console.log('🔄 조직도 시작 변경 - 부드러운 해제');
      return;
    }

    this.clearAllOrgChartSelections();
  }

  /**
   * 현재 필터 상태 읽기 - 기존 함수 유지
   */
  loadCurrentFilterState() {
    try {
      // HTML 요소에서 현재 필터 값 읽기
      const periodSelect = document.getElementById('worktime-period-select');
      const departmentSelect = document.getElementById('worktime-department-filter');
      const teamSelect = document.getElementById('worktime-team-filter');
      const positionSelect = document.getElementById('worktime-position-filter');
      const startDateInput = document.getElementById('worktime-start-date');
      const endDateInput = document.getElementById('worktime-end-date');

      if (periodSelect) this.currentFilters.period = periodSelect.value;
      if (departmentSelect) this.currentFilters.department = departmentSelect.value;
      if (teamSelect) this.currentFilters.team = teamSelect.value;
      if (positionSelect) this.currentFilters.position = positionSelect.value;
      if (startDateInput && startDateInput.value) this.currentFilters.startDate = startDateInput.value;
      if (endDateInput && endDateInput.value) this.currentFilters.endDate = endDateInput.value;

      // 조직도에서 선택된 사용자 가져오기
      if (window.organizationManager) {
        const selectedEmails = window.organizationManager.getFilteredMembers();
        this.currentFilters.selectedUsers = new Set(selectedEmails);
      }

      console.log('📊 현재 필터 상태 로드 완료:', this.currentFilters);
    } catch (error) {
      console.error('❌ 필터 상태 로드 실패:', error);
    }
  }

  /**
   * Worktime 필터 이벤트 리스너 설정 - 기존 함수 유지
   */
  setupFilterEventListeners() {
    // 기간 필터 변경
    const periodSelect = document.getElementById('worktime-period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.handlePeriodChange(e.target.value);
      });
    }

    // 부서 필터 변경
    const departmentSelect = document.getElementById('worktime-department-filter');
    if (departmentSelect) {
      departmentSelect.addEventListener('change', (e) => {
        this.handleDepartmentChange(e.target.value);
      });
    }

    // 팀 필터 변경
    const teamSelect = document.getElementById('worktime-team-filter');
    if (teamSelect) {
      teamSelect.addEventListener('change', (e) => {
        this.handleTeamChange(e.target.value);
      });
    }

    // 직급 필터 변경
    const positionSelect = document.getElementById('worktime-position-filter');
    if (positionSelect) {
      positionSelect.addEventListener('change', (e) => {
        this.handlePositionChange(e.target.value);
      });
    }

    // 사용자 정의 날짜 변경
    const startDateInput = document.getElementById('worktime-start-date');
    const endDateInput = document.getElementById('worktime-end-date');

    if (startDateInput) {
      startDateInput.addEventListener('change', (e) => {
        this.handleDateChange('start', e.target.value);
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', (e) => {
        this.handleDateChange('end', e.target.value);
      });
    }

    console.log('🎧 Worktime 필터 이벤트 리스너 설정 완료');
  }

  /**
   * 기간 필터 변경 처리 - 2025.08.19 20:30 수정: 차트/테이블 연동 추가
   */
  handlePeriodChange(newPeriod) {
    console.log('📅 기간 필터 변경:', newPeriod);

    this.currentFilters.period = newPeriod;

    // 사용자 정의 날짜 입력 UI 토글
    const customInputs = document.getElementById('custom-date-inputs');
    if (customInputs) {
      if (newPeriod === 'custom') {
        customInputs.classList.add('show');
      } else {
        customInputs.classList.remove('show');
        // 기본 기간 설정
        this.setDefaultDateRange(newPeriod);
      }
    }

    // 🆕 2025.08.19 20:30 추가: 차트와 테이블 즉시 업데이트
    this.updateChartsAndTables();

    // 필터 변경 알림
    this.notifyFilterChange('period');
  }

  /**
   * 부서 필터 변경 처리 - 기존 함수 유지
   */
  handleDepartmentChange(newDepartment) {
    console.log('🏢 부서 필터 변경:', newDepartment);
    this.currentFilters.department = newDepartment;
    this.notifyFilterChange('department');
  }

  /**
   * 팀 필터 변경 처리 - 기존 함수 유지
   */
  handleTeamChange(newTeam) {
    console.log('👥 팀 필터 변경:', newTeam);
    this.currentFilters.team = newTeam;
    this.notifyFilterChange('team');
  }

  /**
   * 직급 필터 변경 처리 - 기존 함수 유지
   */
  handlePositionChange(newPosition) {
    console.log('💼 직급 필터 변경:', newPosition);
    this.currentFilters.position = newPosition;
    this.notifyFilterChange('position');
  }

  /**
   * 날짜 필터 변경 처리 - 기존 함수 유지
   */
  handleDateChange(type, newDate) {
    console.log(`📅 ${type} 날짜 변경:`, newDate);

    if (type === 'start') {
      this.currentFilters.startDate = newDate;
    } else if (type === 'end') {
      this.currentFilters.endDate = newDate;
    }

    // 필터 변경 알림
    this.notifyFilterChange('date');
  }

  /**
   * 기본 날짜 범위 설정 - 2025.08.19 20:30 수정: 옵션값 정리
   */
  setDefaultDateRange(period) {
    const today = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstToday = new Date(today.getTime() + kstOffset);

    let startDate = new Date(kstToday);
    let endDate = new Date(kstToday);

    switch (period) {
      case 'today':
        // 시작일과 종료일이 같음
        break;
      case 'week':  // 🆕 수정: month_1 → week
        startDate.setDate(kstToday.getDate() - 7);
        break;
      case 'month': // 🆕 수정: month_2 → month
        startDate.setDate(kstToday.getDate() - 30);
        break;
      case 'month_3':
        startDate.setDate(kstToday.getDate() - 90);
        break;
    }

    this.currentFilters.startDate = startDate.toISOString().split('T')[0];
    this.currentFilters.endDate = endDate.toISOString().split('T')[0];

    console.log(`📅 기본 날짜 범위 설정 (${period}):`, {
      start: this.currentFilters.startDate,
      end: this.currentFilters.endDate,
    });
  }

  /**
   * 차트와 테이블 업데이트 - 2025.08.19 20:30 수정: 안정성 개선
   */
  async updateChartsAndTables() {
    console.log("🔄 기간 변경에 따른 차트/테이블 업데이트 시작");

    try {
      // 현재 기간 정보 확인
      const periodInfo = this.getCurrentPeriodInfo();
      console.log("📅 적용할 기간 정보:", periodInfo);

      // 1. 차트 업데이트
      if (window.worktimeChartManager && window.worktimeChartManager.isReady()) {
        console.log("📊 차트 업데이트 중...");
        await window.worktimeChartManager.updateChart();
      } else {
        console.log("⏳ 차트 매니저가 준비되지 않음");
      }

      // 2. 테이블 업데이트  
      if (window.worktimeDetailManager && window.worktimeDetailManager.isReady()) {
        console.log("📋 테이블 업데이트 중...");
        await window.worktimeDetailManager.updateTable();
      } else {
        console.log("⏳ 테이블 매니저가 준비되지 않음");
      }

      // 3. 통계 카드 업데이트
      if (window.worktimeDataManager && window.worktimeDataManager.isReady()) {
        console.log("📈 통계 카드 업데이트 중...");
        await window.worktimeDataManager.updateAllStatsCards();
      } else {
        console.log("⏳ 데이터 매니저가 준비되지 않음");
      }

      console.log("✅ 차트/테이블 업데이트 완료");

    } catch (error) {
      console.error("❌ 차트/테이블 업데이트 실패:", error);
    }
  }

  /**
   * 현재 기간 정보 가져오기 - 2025.08.19 20:30 수정: 기본값 보장
   */
  getCurrentPeriodInfo() {
    // 기간이 설정되지 않았다면 기본값 적용
    if (!this.currentFilters.period) {
      this.ensureDefaultPeriod();
    }
    
    return {
      period: this.currentFilters.period || 'month',
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      dayCount: this.calculateDayCount()
    };
  }

  /**
   * 기간 일수 계산 - 2025.08.19 20:30 신규 생성
   */
  calculateDayCount() {
    if (!this.currentFilters.startDate || !this.currentFilters.endDate) {
      return 30; // 기본값
    }
    
    const start = new Date(this.currentFilters.startDate);
    const end = new Date(this.currentFilters.endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }

  /**
   * Worktime 필터 초기화 - 기존 함수 유지
   */
  resetWorktimeFilters() {
    this.currentFilters.department = 'all';
    this.currentFilters.team = 'all';
    this.currentFilters.position = 'all';

    // HTML 요소도 업데이트
    const departmentSelect = document.getElementById('worktime-department-filter');
    const teamSelect = document.getElementById('worktime-team-filter');
    const positionSelect = document.getElementById('worktime-position-filter');

    if (departmentSelect) departmentSelect.value = 'all';
    if (teamSelect) teamSelect.value = 'all';
    if (positionSelect) positionSelect.value = 'all';

    console.log('🔄 Worktime 필터 초기화 완료');
  }

  /**
   * 필터 변경 알림 - 2025.08.19 16:25 신규 생성/수정
   * 필터 변경 시 모든 관련 모듈에 이벤트 발생
   */
  notifyFilterChange(changeType, detail = null) {
    console.log(`🔔 [통합 필터 매니저] 필터 변경 알림: ${changeType}`);

    // 🆕 2025.08.19 16:25 추가: Worktime 필터 변경 이벤트 발생
    const eventDetail = {
      source: 'worktimeFilterManager',
      changeType: changeType,
      filters: { ...this.currentFilters },
      selectedUserCount: this.currentFilters.selectedUsers.size,
      timestamp: new Date().toISOString(),
    };

    if (detail) {
      eventDetail.originalDetail = detail;
    }

    // 커스텀 이벤트 발생
    const worktimeFilterEvent = new CustomEvent('worktimeFilterChanged', {
      detail: eventDetail,
      bubbles: true,
    });

    document.dispatchEvent(worktimeFilterEvent);
    console.log(`📤 [통합 필터 매니저] worktimeFilterChanged 이벤트 발생:`, eventDetail);
  }

  /**
   * 현재 필터 상태 가져오기 - 기존 함수 유지
   */
  getCurrentFilters() {
    return {
      ...this.currentFilters,
      selectedUsers: Array.from(this.currentFilters.selectedUsers),
    };
  }

  /**
   * 통합된 사용자 목록 가져오기 - 기존 함수 유지
   */
  getFilteredUserEmails() {
    return Array.from(this.currentFilters.selectedUsers);
  }

  /**
   * 날짜 범위 가져오기 - 기존 함수 유지
   */
  getDateRange() {
    if (this.currentFilters.period === 'custom') {
      return {
        start: this.currentFilters.startDate,
        end: this.currentFilters.endDate,
      };
    }

    // 기본 기간의 경우 동적 계산
    return {
      start: this.currentFilters.startDate,
      end: this.currentFilters.endDate,
    };
  }

  /**
   * 초기화 상태 확인 - 기존 함수 유지
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * 디버깅용 필터 상태 출력 - 기존 함수 유지
   */
  debugFilterState() {
    const state = {
      isInitialized: this.isInitialized,
      currentFilters: this.currentFilters,
      syncState: this.syncState,
      selectedUserCount: this.currentFilters.selectedUsers.size,
    };

    console.table(state);
    return state;
  }

  /**
   * 필터 상태 리셋 - 2025.08.19 20:30 신규 생성
   */
  resetAllFilters() {
    console.log('🔄 모든 필터 초기화');
    
    // 기간 필터 초기화
    this.currentFilters.period = 'month';
    this.setDefaultDateRange('month');
    
    // 조직 필터 초기화
    this.resetWorktimeFilters();
    
    // 선택된 사용자 초기화
    this.currentFilters.selectedUsers.clear();
    
    // HTML 요소 업데이트
    const periodSelect = document.getElementById('worktime-period-select');
    if (periodSelect) periodSelect.value = 'month';
    
    // 조직도 선택 해제
    this.clearAllOrgChartSelections();
    
    // 필터 변경 알림
    this.notifyFilterChange('reset');
    
    console.log('✅ 모든 필터 초기화 완료');
  }

  /**
   * 필터 통계 정보 - 2025.08.19 20:30 신규 생성
   */
  getFilterStats() {
    return {
      selectedUsers: this.currentFilters.selectedUsers.size,
      period: this.currentFilters.period,
      dayCount: this.calculateDayCount(),
      department: this.currentFilters.department,
      team: this.currentFilters.team,
      position: this.currentFilters.position,
      dateRange: {
        start: this.currentFilters.startDate,
        end: this.currentFilters.endDate
      }
    };
  }
}

// 전역 인스턴스 생성
const worktimeFilterManager = new WorktimeFilterManager();

// 전역 접근 가능하도록 설정
window.worktimeFilterManager = worktimeFilterManager;

console.log('📦 worktime-filter-manager.js 로드 완료 - 2025.08.19 20:30');