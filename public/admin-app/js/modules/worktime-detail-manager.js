// 일자별 상세 현황 테이블 관리 모듈 - 2025.08.19 17:20 생성
// 날짜별 사용자 상세 정보를 테이블 형태로 표시

/**
 * 일자별 상세 현황 테이블 관리 클래스
 * 사용자별 GPS 건수, 이동거리 등을 테이블로 시각화
 */
class WorktimeDetailManager {
  constructor() {
    this.isInitialized = false;
    this.tableContainer = null;
    this.tableElement = null;
    
    // 테이블 설정
    this.tableConfig = {
      currentDate: new Date(),
      sortColumn: 'date',
      sortDirection: 'desc',
      maxRows: 50
    };
    
    console.log('📋 WorktimeDetailManager 생성 - 2025.08.19 17:20');
  }

  /**
 * 초기화 함수 - 2025.08.19 20:20 수정: 초기 데이터 로드 추가
 */
async init() {
  try {
    console.log('📋 일자별 상세 현황 매니저 초기화 시작...');
    
    // 분석 매니저 대기
    await this.waitForAnalyticsManager();
    
    // 테이블 컨테이너 설정
    this.setupTableContainer();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 테이블 생성
    await this.createTable();
    
    this.isInitialized = true;
    console.log('✅ 일자별 상세 현황 매니저 초기화 완료');
    
    // 🆕 2025.08.19 20:20 추가: 초기 데이터 로드
    setTimeout(async () => {
      await this.loadInitialData();
    }, 2500);
    
  } catch (error) {
    console.error('❌ 일자별 상세 현황 매니저 초기화 실패:', error);
    throw error;
  }
}

  /**
   * 분석 매니저 로드 대기 - 2025.08.19 17:20 생성
   */
  async waitForAnalyticsManager() {
    return new Promise((resolve) => {
      const checkAnalytics = () => {
        if (window.worktimeAnalyticsManager && window.worktimeAnalyticsManager.isReady()) {
          resolve();
        } else {
          setTimeout(checkAnalytics, 100);
        }
      };
      checkAnalytics();
    });
  }

  /**
   * 테이블 컨테이너 설정 - 2025.08.19 수정: 기존 HTML 구조 활용
   */
  setupTableContainer() {
    // 기존 HTML에서 테이블 tbody 찾기 (worktime-table-body ID 사용)
    this.tableContainer = document.getElementById('worktime-table-body');
    
    if (!this.tableContainer) {
      console.error('❌ worktime-table-body 테이블 요소를 찾을 수 없습니다.');
      
      // 대안: 상위 테이블 컨테이너를 찾아서 tbody 생성
      const tableWrapper = document.querySelector('.worktime-table-container .table-wrapper table');
      if (tableWrapper) {
        console.log('🔄 테이블 tbody를 동적으로 생성합니다.');
        this.tableContainer = document.createElement('tbody');
        this.tableContainer.id = 'worktime-table-body';
        tableWrapper.appendChild(this.tableContainer);
      } else {
        console.error('❌ 테이블 구조를 찾을 수 없습니다.');
        return;
      }
    }

    // 기존 테이블은 그대로 두고 tbody만 관리
    console.log('📋 기존 테이블 tbody 설정 완료');
  }

  /**
 * 이벤트 리스너 설정 - 2025.08.19 20:20 수정: 분석 매니저 이벤트 추가
 */
setupEventListeners() {
  // 조직도 필터 변경 이벤트
  document.addEventListener('orgFilterChanged', (e) => {
    console.log('📋 [테이블] 조직도 필터 변경 감지');
    this.handleFilterChange();
  });

  document.addEventListener('orgFilterCleared', () => {
    console.log('📋 [테이블] 조직도 필터 해제 감지');
    this.handleFilterChange();
  });

  // Worktime 필터 변경 이벤트
  document.addEventListener('worktimeFilterChanged', (e) => {
    console.log('📋 [테이블] Worktime 필터 변경 감지');
    this.handleFilterChange();
  });

  // 🆕 2025.08.19 20:20 추가: 분석 매니저 준비 완료 이벤트
  document.addEventListener('analyticsManagerReady', (e) => {
    console.log('📋 [테이블] 분석 매니저 준비 완료 감지');
    setTimeout(async () => {
      await this.loadInitialData();
    }, 800);
  });

  console.log('🎧 테이블 이벤트 리스너 설정 완료');
}

/**
 * 초기 데이터 로드 - 2025.08.19 20:20 신규 생성
 */
async loadInitialData() {
  try {
    console.log('🚀 [테이블] 초기 데이터 로드 시작');
    
    // 분석 매니저 준비 확인
    if (!window.worktimeAnalyticsManager || !window.worktimeAnalyticsManager.isReady()) {
      console.log('⏳ [테이블] 분석 매니저 대기 중...');
      return;
    }
    
    // 테이블 요소 확인
    if (!this.tableContainer) {
      console.log('❌ [테이블] 테이블 컨테이너가 없습니다.');
      return;
    }
    
    // 선택된 사용자 확인
    const selectedEmails = window.worktimeAnalyticsManager.getSelectedUserEmails();
    if (selectedEmails.length === 0) {
      console.log('📭 [테이블] 선택된 사용자가 없어 안내 메시지 표시');
      this.showNoUserMessage();
      return;
    }
    
    console.log(`🎯 [테이블] ${selectedEmails.length}명 사용자 데이터로 초기 테이블 생성`);
    
    // 테이블 데이터 로드
    await this.loadTableData();
    
    console.log('✅ [테이블] 초기 데이터 로드 완료');
    
  } catch (error) {
    console.error('❌ [테이블] 초기 데이터 로드 실패:', error);
    
    // 오류 시 오류 메시지 표시
    this.showErrorMessage(error.message);
  }
}

/**
 * 사용자 없음 메시지 표시 - 2025.08.19 20:20 신규 생성
 */
showNoUserMessage() {
  if (!this.tableContainer) return;
  
  this.tableContainer.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">
        조직도에서 사용자를 선택하면 상세 현황이 표시됩니다.
      </td>
    </tr>
  `;
}

/**
 * 오류 메시지 표시 - 2025.08.19 20:20 신규 생성
 */
showErrorMessage(message) {
  if (!this.tableContainer) return;
  
  this.tableContainer.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 20px; color: #dc2626;">
        데이터 로드 중 오류가 발생했습니다: ${message}
      </td>
    </tr>
  `;
}

  /**
 * 필터 변경 처리 - 2025.08.19 20:20 수정: 디바운싱 추가
 */
handleFilterChange() {
  // 디바운싱으로 중복 호출 방지
  if (this.filterUpdateTimeout) {
    clearTimeout(this.filterUpdateTimeout);
  }

  this.filterUpdateTimeout = setTimeout(async () => {
    try {
      console.log('📋 [테이블] 필터 변경에 따른 테이블 업데이트');
      await this.updateTable();
    } catch (error) {
      console.error('❌ [테이블] 필터 변경 처리 실패:', error);
    }
  }, 300);
}

  /**
   * 테이블 생성 - 2025.08.19 수정: 기존 HTML 구조 활용
   */
  async createTable() {
    if (!this.tableContainer) {
      console.error('❌ 테이블 컨테이너가 없습니다.');
      return;
    }

    try {
      // 기존 테이블 구조를 그대로 활용하고 데이터만 업데이트
      // thead는 이미 존재하므로 건드리지 않음
      
      // 기존 table 요소 찾기
      this.tableElement = this.tableContainer.closest('table');
      
      if (!this.tableElement) {
        console.error('❌ 상위 테이블 요소를 찾을 수 없습니다.');
        return;
      }

      // 기존 thead의 정렬 이벤트 리스너 추가
      this.setupSortingEvents();

      // 초기 데이터 로드
      await this.loadTableData();

      console.log('✅ 기존 테이블 구조 활용하여 상세 현황 테이블 설정 완료');

    } catch (error) {
      console.error('❌ 테이블 설정 실패:', error);
    }
  }


  /**
   * 정렬 이벤트 설정 - 2025.08.19 수정: 기존 thead 구조 활용
   */
  setupSortingEvents() {
    if (!this.tableElement) return;

    // 기존 thead의 th 요소들에 클릭 이벤트 추가
    const headerCells = this.tableElement.querySelectorAll('thead th');
    
    headerCells.forEach((th, index) => {
      // 기존 헤더에 정렬 기능 추가
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      
      // 데이터 속성 매핑 (기존 헤더 순서에 맞게)
      const columnMappings = ['date', 'category', 'userName', 'gpsCount', 'totalDistance'];
      const column = columnMappings[index] || `column${index}`;
      
      th.addEventListener('click', () => {
        this.handleSort(column);
      });

      // 정렬 표시 아이콘 추가
      if (!th.querySelector('.sort-icon')) {
        const sortIcon = document.createElement('span');
        sortIcon.className = 'sort-icon';
        sortIcon.style.marginLeft = '5px';
        sortIcon.style.opacity = '0.5';
        sortIcon.textContent = '⇅';
        th.appendChild(sortIcon);
      }
    });

    console.log('📋 기존 테이블 헤더에 정렬 이벤트 설정 완료');
  }

  /**
   * 테이블 정렬 - 2025.08.19 17:20 생성
   */
  async sortTable(column) {
    if (this.tableConfig.sortColumn === column) {
      // 같은 컬럼 클릭 시 방향 반전
      this.tableConfig.sortDirection = this.tableConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // 다른 컬럼 클릭 시 기본 정렬
      this.tableConfig.sortColumn = column;
      this.tableConfig.sortDirection = 'desc';
    }

    console.log(`📋 테이블 정렬: ${column} ${this.tableConfig.sortDirection}`);
    await this.loadTableData();
  }

/**
 * 테이블 데이터 로드 - 2025.08.19 19:40 수정: 기존 로직 보존하면서 기간 필터만 연동
 */
async loadTableData() {
  const tbody = this.tableContainer;
  if (!tbody) {
    console.error('❌ 테이블 tbody를 찾을 수 없습니다.');
    return;
  }

  try {
    // 선택된 사용자 확인
    const selectedEmails = window.worktimeAnalyticsManager?.getSelectedUserEmails() || [];
    
    if (selectedEmails.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">
            조직도에서 사용자를 선택하면 상세 현황이 표시됩니다.
          </td>
        </tr>
      `;
      return;
    }

    // 분석 매니저가 준비되지 않은 경우
    if (!window.worktimeAnalyticsManager || !window.worktimeAnalyticsManager.isReady()) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: #f59e0b;">
            분석 데이터를 로드하는 중입니다...
          </td>
        </tr>
      `;
      return;
    }

    // 🆕 2025.08.19 19:40 수정: 기간 필터 정보 가져오기 (기존 로직 보존)
    const periodInfo = this.getPeriodInfo();
    console.log(`📋 [테이블] 적용할 기간: ${periodInfo.startDate} ~ ${periodInfo.endDate} (${periodInfo.dayCount}일)`);

    // ✅ 기존 getDailyDetailData 함수 그대로 활용
    const detailData = await window.worktimeAnalyticsManager.getDailyDetailData(
      selectedEmails, 
      periodInfo.startDate, 
      periodInfo.endDate
    );

    console.log(`📋 [테이블] 로드된 원본 데이터:`, detailData.length, '건');

    // GPS 건수가 0인 데이터 필터링 (기존 로직 유지)
    const filteredData = detailData.filter(row => row.gpsCount > 0);
    console.log(`📋 [테이블] GPS 건수 > 0 필터링 후:`, filteredData.length, '건');

    // 데이터 정렬 (기존 로직 유지)
    this.sortData(filteredData);

    // 테이블 행 생성
    if (filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">
            선택된 기간(${periodInfo.dayCount}일)에 GPS 기록이 있는 데이터가 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    // 최대 행 수 제한 (기존 로직 유지)
    const limitedData = filteredData.slice(0, this.tableConfig.maxRows);
    
    tbody.innerHTML = limitedData.map(row => this.createTableRow(row)).join('');

    console.log(`📋 테이블 데이터 로드 완료: ${limitedData.length}행 표시 (GPS 0건 제외, ${periodInfo.dayCount}일간)`);

  } catch (error) {
    console.error('❌ 테이블 데이터 로드 실패:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: #dc2626;">
          데이터 로드 중 오류가 발생했습니다: ${error.message}
        </td>
      </tr>
    `;
  }
}

/**
 * 기간 정보 가져오기 - 2025.08.19 19:40 신규 생성 (최소한의 추가)
 */
getPeriodInfo() {
  // 필터 매니저에서 기간 정보 가져오기
  if (window.worktimeFilterManager && window.worktimeFilterManager.getCurrentPeriodInfo) {
    return window.worktimeFilterManager.getCurrentPeriodInfo();
  }

  // 기본값 (1개월) - 기존 로직과 동일
  const endDate = new Date(this.tableConfig.currentDate);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    period: 'month',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dayCount: 30
  };
}

/**
 * 기간 변경 처리 - 2025.08.19 19:10 신규 생성
 */
async handlePeriodChange(periodInfo) {
  console.log(`📋 [테이블] 기간 변경 처리: ${periodInfo.period} (${periodInfo.dayCount}일)`);
  
  // 테이블 데이터 새로고침
  await this.loadTableData();
}

  /**
 * 테이블 행 생성 - 2025.08.19 18:45 수정: 인라인 스타일 제거, CSS 클래스 기반으로 변경
 */
createTableRow(rowData) {
  const {
    date,
    userName,
    dayType,
    gpsCount,
    totalDistance,
    userColor
  } = rowData;

  // 날짜 포맷
  const formattedDate = this.formatDate(date);
  
  // 이동거리 포맷 (km 단위) - 수정된 계산
  const distanceKm = totalDistance > 0 ?
    (totalDistance / 1000).toFixed(2) : '0.00';
  
  // 🆕 2025.08.19 18:45 수정: 클래스 기반 스타일링으로 변경
  const isHoliday = dayType === '휴일';
  const rowClass = isHoliday ? 'holiday-row' : '';
  const dayTypeBadgeClass = isHoliday ? 'day-type-badge day-type-weekend' : 'day-type-badge day-type-weekday';
  
  // GPS 건수 강조
  const gpsCountClass = gpsCount >= 5 ? 'gps-count-high' : '';

  return `
    <tr class="${rowClass}">
      <td>${formattedDate}</td>
      <td>
        <span class="${dayTypeBadgeClass}">
          ${dayType}
        </span>
      </td>
      <td>
        <span class="user-name-badge" style="color: ${userColor.bg}; border-color: ${userColor.bg};">
          ${userName}
        </span>
      </td>
      <td>
        <span class="${gpsCountClass}">
          ${gpsCount} 건
        </span>
      </td>
      <td>
        <span class="distance-value">
          ${distanceKm} km
        </span>
      </td>
    </tr>
  `;
}

  /**
   * 정렬 이벤트 설정 - 2025.08.19 수정: 기존 HTML 헤더 활용
   */
  setupSortingEvents() {
    if (!this.tableElement) return;

    // 기존 thead의 th 요소들에 클릭 이벤트 추가
    const headerCells = this.tableElement.querySelectorAll('thead th');
    
    headerCells.forEach((th, index) => {
      // 기존 헤더에 정렬 기능 추가
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      
      // 데이터 속성 매핑 (기존 헤더 순서에 맞게) - 직급 제거
      const columnMappings = ['date', 'dayType', 'userName', 'gpsCount', 'totalDistance'];
      const column = columnMappings[index] || `column${index}`;
      
      th.addEventListener('click', () => {
        this.handleSort(column);
      });

      // 정렬 표시 아이콘 추가
      if (!th.querySelector('.sort-icon')) {
        const sortIcon = document.createElement('span');
        sortIcon.className = 'sort-icon';
        sortIcon.style.marginLeft = '5px';
        sortIcon.style.opacity = '0.5';
        sortIcon.textContent = '⇅';
        th.appendChild(sortIcon);
      }
    });

    console.log('📋 기존 테이블 헤더에 정렬 이벤트 설정 완료');
  }

  /**
   * 정렬 처리 - 2025.08.19 수정: 새로 추가
   */
  async handleSort(column) {
    if (this.tableConfig.sortColumn === column) {
      // 같은 컬럼 클릭 시 방향 반전
      this.tableConfig.sortDirection = this.tableConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // 다른 컬럼 클릭 시 기본 정렬
      this.tableConfig.sortColumn = column;
      this.tableConfig.sortDirection = 'desc';
    }

    console.log(`📋 테이블 정렬: ${column} ${this.tableConfig.sortDirection}`);
    await this.loadTableData();
  }

  /**
   * 데이터 정렬 - 2025.08.19 17:20 생성
   */
  sortData(data) {
    const { sortColumn, sortDirection } = this.tableConfig;
    
    data.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // 날짜 정렬
      if (sortColumn === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      // 숫자 정렬
      if (sortColumn === 'gpsCount' || sortColumn === 'totalDistance') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      // 문자열 정렬
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * 날짜 포맷 - 2025.08.19 17:20 생성
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
 * 테이블 업데이트 - 2025.08.19 19:10 수정: 기간 정보 포함
 */
async updateTable() {
  if (!this.tableElement) {
    console.log('📋 테이블이 없어 새로 생성');
    await this.createTable();
    return;
  }

  try {
    const periodInfo = this.getPeriodInfo();
    console.log(`📋 테이블 데이터 업데이트 시작 (${periodInfo.period}, ${periodInfo.dayCount}일)`);
    
    await this.loadTableData();
    console.log('✅ 테이블 업데이트 완료');
    
  } catch (error) {
    console.error('❌ 테이블 업데이트 실패:', error);
  }
}

  /**
   * 테이블 새로고침 - 2025.08.19 17:20 생성
   */
  async refreshTable() {
    console.log('🔄 테이블 새로고침');
    
    // 분석 매니저 캐시 클리어
    if (window.worktimeAnalyticsManager) {
      window.worktimeAnalyticsManager.clearCache();
    }
    
    // 테이블 업데이트
    await this.updateTable();
  }

  /**
   * 날짜 변경 - 2025.08.19 17:20 생성
   */
  async changeDate(newDate) {
    this.tableConfig.currentDate = new Date(newDate);
    console.log(`📋 테이블 기준 날짜 변경: ${newDate}`);
    await this.updateTable();
  }

  /**
   * 최대 행 수 변경 - 2025.08.19 17:20 생성
   */
  async changeMaxRows(maxRows) {
    this.tableConfig.maxRows = maxRows;
    console.log(`📋 테이블 최대 행 수 변경: ${maxRows}`);
    await this.loadTableData();
  }

  /**
   * 초기화 상태 확인 - 2025.08.19 17:20 생성
   */
  isReady() {
    return this.isInitialized && this.tableElement !== null;
  }

  /**
   * 현재 테이블 상태 정보 - 2025.08.19 17:20 생성
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasTable: this.tableElement !== null,
      currentDate: this.tableConfig.currentDate.toISOString().split('T')[0],
      sortColumn: this.tableConfig.sortColumn,
      sortDirection: this.tableConfig.sortDirection,
      maxRows: this.tableConfig.maxRows
    };
  }
}

// 전역 인스턴스 생성
const worktimeDetailManager = new WorktimeDetailManager();

// 전역 접근 가능하도록 설정
window.worktimeDetailManager = worktimeDetailManager;

console.log('📦 worktime-detail-manager.js 로드 완료 - 2025.08.19 17:20');