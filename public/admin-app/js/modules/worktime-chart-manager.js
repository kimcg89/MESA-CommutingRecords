// 근무건수 분석 차트 관리 모듈 - 2025.08.19 17:15 생성
// 일자별 출근/퇴근/GPS 데이터 건수를 차트로 시각화

/**
 * 근무건수 분석 차트 관리 클래스
 * Chart.js를 사용하여 Line Chart with Area Fill 생성
 */
class WorktimeChartManager {
  constructor() {
    this.isInitialized = false;
    this.chartInstance = null;
    this.chartCanvas = null;
    
    // 차트 설정
    this.chartConfig = {
      dateRange: 30, // 기본 30일
      currentEndDate: new Date(),
      updateInterval: null
    };
    
    console.log('📈 WorktimeChartManager 생성 - 2025.08.19 17:15');
  }

  /**
 * 초기화 함수 - 2025.08.19 20:15 수정: 초기 데이터 로드 추가
 */
async init() {
  try {
    console.log('📈 근무건수 차트 매니저 초기화 시작...');
    
    // Chart.js 로드 확인
    await this.waitForChartJS();
    
    // 분석 매니저 대기
    await this.waitForAnalyticsManager();
    
    // 차트 캔버스 설정
    this.setupChartCanvas();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 차트 생성
    await this.createChart();
    
    this.isInitialized = true;
    console.log('✅ 근무건수 차트 매니저 초기화 완료');
    
    // 🆕 2025.08.19 20:15 추가: 초기 데이터 로드
    setTimeout(async () => {
      await this.loadInitialData();
    }, 2000);
    
  } catch (error) {
    console.error('❌ 근무건수 차트 매니저 초기화 실패:', error);
    throw error;
  }
}

  /**
   * Chart.js 로드 대기 - 2025.08.19 17:15 생성
   */
  async waitForChartJS() {
    return new Promise((resolve) => {
      const checkChart = () => {
        if (typeof Chart !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkChart, 100);
        }
      };
      checkChart();
    });
  }

  /**
   * 분석 매니저 로드 대기 - 2025.08.19 17:15 생성
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
   * 차트 캔버스 설정 - 2025.08.19 수정: 기존 HTML 구조 활용
   */
  setupChartCanvas() {
    // 기존 HTML에서 차트 캔버스 찾기 (worktime-chart ID 사용)
    this.chartCanvas = document.getElementById('worktime-chart');
    
    if (!this.chartCanvas) {
      console.error('❌ worktime-chart 캔버스 요소를 찾을 수 없습니다.');
      
      // 대안: 상위 컨테이너를 찾아서 캔버스 생성
      const chartSection = document.querySelector('.worktime-chart-container');
      if (chartSection) {
        console.log('🔄 차트 캔버스를 동적으로 생성합니다.');
        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.id = 'worktime-chart';
        this.chartCanvas.width = 400;
        this.chartCanvas.height = 300;
        this.chartCanvas.style.maxHeight = '300px';
        chartSection.appendChild(this.chartCanvas);
      } else {
        console.error('❌ 차트 섹션을 찾을 수 없습니다.');
        return;
      }
    }

    // 기존 캔버스 크기 조정
    if (this.chartCanvas) {
      this.chartCanvas.style.maxHeight = '400px';
      this.chartCanvas.style.width = '100%';
    }

    console.log('🎨 기존 차트 캔버스 설정 완료');
  }

  /**
 * 이벤트 리스너 설정 - 2025.08.19 20:15 수정: 분석 매니저 이벤트 추가
 */
setupEventListeners() {
  // 조직도 필터 변경 이벤트
  document.addEventListener('orgFilterChanged', (e) => {
    console.log('📈 [차트] 조직도 필터 변경 감지');
    this.handleFilterChange();
  });

  document.addEventListener('orgFilterCleared', () => {
    console.log('📈 [차트] 조직도 필터 해제 감지');
    this.handleFilterChange();
  });

  // Worktime 필터 변경 이벤트
  document.addEventListener('worktimeFilterChanged', (e) => {
    console.log('📈 [차트] Worktime 필터 변경 감지');
    this.handleFilterChange();
  });

  // 🆕 2025.08.19 20:15 추가: 분석 매니저 준비 완료 이벤트
  document.addEventListener('analyticsManagerReady', (e) => {
    console.log('📈 [차트] 분석 매니저 준비 완료 감지');
    setTimeout(async () => {
      await this.loadInitialData();
    }, 500);
  });

  console.log('🎧 차트 이벤트 리스너 설정 완료');
}

/**
 * 초기 데이터 로드 - 2025.08.19 20:15 신규 생성
 */
async loadInitialData() {
  try {
    console.log('🚀 [차트] 초기 데이터 로드 시작');
    
    // 분석 매니저 준비 확인
    if (!window.worktimeAnalyticsManager || !window.worktimeAnalyticsManager.isReady()) {
      console.log('⏳ [차트] 분석 매니저 대기 중...');
      return;
    }
    
    // 선택된 사용자 확인
    const selectedEmails = window.worktimeAnalyticsManager.getSelectedUserEmails();
    if (selectedEmails.length === 0) {
      console.log('📭 [차트] 선택된 사용자가 없어 기본 차트 표시');
      await this.updateChart(); // 빈 차트라도 표시
      return;
    }
    
    console.log(`🎯 [차트] ${selectedEmails.length}명 사용자 데이터로 초기 차트 생성`);
    
    // 차트 업데이트
    await this.updateChart();
    
    console.log('✅ [차트] 초기 데이터 로드 완료');
    
  } catch (error) {
    console.error('❌ [차트] 초기 데이터 로드 실패:', error);
    
    // 오류 시에도 빈 차트 생성
    try {
      await this.updateChart();
    } catch (fallbackError) {
      console.error('❌ [차트] 빈 차트 생성도 실패:', fallbackError);
    }
  }
}

  /**
 * 필터 변경 처리 - 2025.08.19 20:15 수정: 디바운싱 추가
 */
handleFilterChange() {
  // 디바운싱으로 중복 호출 방지
  if (this.filterUpdateTimeout) {
    clearTimeout(this.filterUpdateTimeout);
  }

  this.filterUpdateTimeout = setTimeout(async () => {
    try {
      console.log('📈 [차트] 필터 변경에 따른 차트 업데이트');
      await this.updateChart();
    } catch (error) {
      console.error('❌ [차트] 필터 변경 처리 실패:', error);
    }
  }, 300);
}

  /**
   * 차트 생성 - 2025.08.19 17:15 생성
   */
  async createChart() {
    if (!this.chartCanvas) {
      console.error('❌ 차트 캔버스가 없습니다.');
      return;
    }

    try {
      // 기존 차트 제거
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      // 차트 데이터 준비
      const chartData = await this.prepareChartData();

      // Chart.js 설정
      const config = {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            title: {
              display: true,
              text: '근무건수 분석',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: '날짜'
              },
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'GPS 건수'
              },
              beginAtZero: true,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          elements: {
            line: {
              tension: 0.3 // 곡선 부드럽게
            },
            point: {
              radius: 4,
              hoverRadius: 6
            }
          }
        }
      };

      // 차트 생성
      this.chartInstance = new Chart(this.chartCanvas.getContext('2d'), config);
      console.log('✅ 근무건수 차트 생성 완료');

    } catch (error) {
      console.error('❌ 차트 생성 실패:', error);
    }
  }

/**
 * 차트 데이터 준비 - 2025.08.19 20:00 수정: 날짜 처리 오류 수정
 */
async prepareChartData() {
  try {
    console.log('📊 [차트] 데이터 준비 시작 (기존 함수 활용)');

    // 기간 필터 정보 가져오기
    const periodInfo = this.getPeriodInfo();
    console.log('📊 [차트] 적용할 기간:', periodInfo);

    // 선택된 사용자 확인
    const selectedEmails = window.worktimeAnalyticsManager?.getSelectedUserEmails() || [];
    
    if (selectedEmails.length === 0) {
      console.log('📊 [차트] 선택된 사용자 없음 - 빈 차트 반환');
      return this.createEmptyChartData();
    }

    // 🆕 기존 getDailyDetailData 함수 활용
    const detailData = await window.worktimeAnalyticsManager.getDailyDetailData(
      selectedEmails, 
      periodInfo.startDate, 
      periodInfo.endDate
    );

    console.log(`📊 [차트] 기존 상세 데이터 로드 완료: ${detailData.length}건`);

    // 기존 상세 데이터를 차트용으로 변환
    const chartData = this.transformDetailDataToChart(detailData, periodInfo);

    console.log('📊 [차트] 데이터 준비 완료:', chartData.datasets.length, '개 데이터셋');
    return chartData;

  } catch (error) {
    console.error('❌ [차트] 데이터 준비 실패:', error);
    return this.createEmptyChartData();
  }
}

/**
 * 상세 데이터를 차트 데이터로 변환 - 2025.08.19 20:00 수정: 날짜 처리 개선
 */
transformDetailDataToChart(detailData, periodInfo) {
  // 날짜 라벨 생성 (문자열 배열)
  const dateLabels = this.generateDateLabels(periodInfo.startDate, periodInfo.endDate);
  console.log('📊 [차트] 생성된 날짜 라벨:', dateLabels.slice(0, 5), '...');
  
  const datasets = [];

  // 사용자별로 그룹화
  const userDataMap = {};
  detailData.forEach(row => {
    if (!userDataMap[row.userEmail]) {
      userDataMap[row.userEmail] = {};
    }
    userDataMap[row.userEmail][row.date] = row.gpsCount || 0;
  });

  // 사용자별 데이터셋 생성
  Object.keys(userDataMap).forEach((userEmail, index) => {
    const userData = userDataMap[userEmail];
    const userInfo = window.worktimeAnalyticsManager.getUserInfo(userEmail);
    const userColor = window.worktimeAnalyticsManager.getUserColor(userEmail);

    // 각 날짜별 데이터 포인트 생성
    const dataPoints = dateLabels.map(dateStr => {
      return userData[dateStr] || 0;
    });

    datasets.push({
      label: userInfo?.name || userEmail,
      data: dataPoints,
      borderColor: userColor.bg,
      backgroundColor: userColor.bg + '20',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: userColor.bg,
      pointBorderColor: userColor.border,
      pointRadius: 4,
      pointHoverRadius: 6
    });
  });

  // 🔧 날짜 라벨 포맷팅 - 문자열을 Date로 변환 후 포맷
  const formattedLabels = dateLabels.map(dateStr => {
    return this.formatDateLabel(dateStr, periodInfo.dayCount);
  });

  return {
    labels: formattedLabels,
    datasets: datasets
  };
}

/**
 * 기간 정보 가져오기 - 2025.08.19 20:00 수정: 안정성 개선
 */
getPeriodInfo() {
  // 필터 매니저에서 기간 정보 가져오기
  if (window.worktimeFilterManager && window.worktimeFilterManager.getCurrentPeriodInfo) {
    const periodInfo = window.worktimeFilterManager.getCurrentPeriodInfo();
    console.log('📊 [차트] 필터 매니저에서 기간 정보:', periodInfo);
    return periodInfo;
  }

  // 기본값 (1개월) - 실제 데이터가 있을 가능성이 높은 최근 30일
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setDate(today.getDate() - 30);

  const defaultPeriod = {
    period: 'month',
    startDate: oneMonthAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    dayCount: 30
  };

  console.log('📊 [차트] 기본 기간 정보 사용:', defaultPeriod);
  return defaultPeriod;
}

/**
 * 분석 데이터를 차트 데이터로 변환 - 2025.08.19 19:05 신규 생성
 */
transformAnalyticsToChart(analyticsData, periodInfo) {
  const labels = this.generateDateLabels(periodInfo.startDate, periodInfo.endDate);
  const datasets = [];

  // 사용자별 데이터셋 생성
  Object.keys(analyticsData).forEach((userEmail, index) => {
    const userData = analyticsData[userEmail];
    const userInfo = window.worktimeAnalyticsManager.getUserInfo(userEmail);
    const userColor = window.worktimeAnalyticsManager.getUserColor(userEmail);

    const dataPoints = labels.map(date => {
      return userData[date]?.total || 0;
    });

    datasets.push({
      label: userInfo?.name || userEmail,
      data: dataPoints,
      borderColor: userColor.bg,
      backgroundColor: userColor.bg + '20',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: userColor.bg,
      pointBorderColor: userColor.border,
      pointRadius: 4,
      pointHoverRadius: 6
    });
  });

  return {
    labels: labels.map(date => this.formatDateLabel(date, periodInfo.dayCount)),
    datasets: datasets
  };
}

/**
 * 날짜 라벨 생성 - 2025.08.19 20:00 수정: 문자열 배열 반환
 */
generateDateLabels(startDate, endDate) {
  const labels = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    // 문자열 형태로 저장
    labels.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  console.log(`📊 [차트] 날짜 라벨 생성: ${labels.length}개 (${labels[0]} ~ ${labels[labels.length-1]})`);
  return labels;
}

/**
 * 날짜 라벨 포맷 - 2025.08.19 20:00 수정: 문자열을 Date로 변환
 */
formatDateLabel(dateStr, dayCount) {
  // 🔧 문자열을 Date 객체로 변환
  const date = new Date(dateStr);
  
  // Date 객체 유효성 확인
  if (isNaN(date.getTime())) {
    console.error('❌ 유효하지 않은 날짜:', dateStr);
    return dateStr; // 원본 반환
  }
  
  if (dayCount <= 7) {
    // 1주일 이하: 월/일 (요일)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day}(${weekday})`;
  } else if (dayCount <= 31) {
    // 1개월 이하: 월/일
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  } else {
    // 그 이상: 월/일 (5일 간격)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return day % 5 === 0 || day === 1 ? `${month}/${day}` : '';
  }
}

/**
 * 빈 차트 데이터 생성 - 2025.08.19 20:00 수정: 안정성 개선
 */
createEmptyChartData() {
  return {
    labels: ['데이터 없음'],
    datasets: [{
      label: '선택된 사용자 없음',
      data: [0],
      borderColor: '#e5e7eb',
      backgroundColor: '#f3f4f6',
      tension: 0.4
    }]
  };
}

/**
 * 차트 업데이트 - 2025.08.19 20:00 수정: 오류 처리 강화
 */
async updateChart() {
  if (!this.chartInstance) {
    console.log('📊 [차트] 차트 인스턴스가 없어 새로 생성');
    await this.createChart();
    return;
  }

  try {
    console.log('📊 [차트] 차트 데이터 업데이트 시작');
    
    // 새로운 데이터 준비
    const newData = await this.prepareChartData();
    
    // 차트 데이터 업데이트
    this.chartInstance.data = newData;
    this.chartInstance.update('active');

    console.log('✅ [차트] 차트 업데이트 완료');

  } catch (error) {
    console.error('❌ [차트] 차트 업데이트 실패:', error);
    
    // 오류 시 빈 차트로 대체
    if (this.chartInstance) {
      this.chartInstance.data = this.createEmptyChartData();
      this.chartInstance.update('none');
    }
  }
}

  /**
   * 색상 투명도 변환 - 2025.08.19 17:15 생성
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


  /**
   * 날짜 범위 변경 - 2025.08.19 17:15 생성
   */
  async changeDateRange(days) {
    this.chartConfig.dateRange = days;
    console.log(`📈 차트 날짜 범위 변경: ${days}일`);
    await this.updateChart();
  }

  /**
   * 날짜 네비게이션 - 이전 - 2025.08.19 17:15 생성
   */
  async navigatePrevious() {
    this.chartConfig.currentEndDate.setDate(this.chartConfig.currentEndDate.getDate() - 1);
    console.log('📈 차트 이전 날짜로 이동');
    await this.updateChart();
  }

  /**
   * 날짜 네비게이션 - 다음 - 2025.08.19 17:15 생성
   */
  async navigateNext() {
    const today = new Date();
    if (this.chartConfig.currentEndDate < today) {
      this.chartConfig.currentEndDate.setDate(this.chartConfig.currentEndDate.getDate() + 1);
      console.log('📈 차트 다음 날짜로 이동');
      await this.updateChart();
    } else {
      console.log('📈 오늘 날짜보다 앞으로 이동할 수 없습니다.');
    }
  }

  /**
   * 오늘로 이동 - 2025.08.19 17:15 생성
   */
  async navigateToday() {
    this.chartConfig.currentEndDate = new Date();
    console.log('📈 차트 오늘 날짜로 이동');
    await this.updateChart();
  }

  /**
   * 차트 새로고침 - 2025.08.19 17:15 생성
   */
  async refreshChart() {
    console.log('🔄 차트 새로고침');
    
    // 분석 매니저 캐시 클리어
    if (window.worktimeAnalyticsManager) {
      window.worktimeAnalyticsManager.clearCache();
    }
    
    // 차트 업데이트
    await this.updateChart();
  }

  /**
   * 차트 제거 - 2025.08.19 17:15 생성
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    
    if (this.filterUpdateTimeout) {
      clearTimeout(this.filterUpdateTimeout);
    }
    
    console.log('🗑️ 차트 인스턴스 제거됨');
  }

  /**
   * 초기화 상태 확인 - 2025.08.19 17:15 생성
   */
  isReady() {
    return this.isInitialized && this.chartInstance !== null;
  }

  /**
   * 현재 차트 상태 정보 - 2025.08.19 17:15 생성
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasChart: this.chartInstance !== null,
      dateRange: this.chartConfig.dateRange,
      currentEndDate: this.chartConfig.currentEndDate.toISOString().split('T')[0],
      datasetsCount: this.chartInstance?.data?.datasets?.length || 0
    };
  }
}

// 전역 인스턴스 생성
const worktimeChartManager = new WorktimeChartManager();

// 전역 접근 가능하도록 설정
window.worktimeChartManager = worktimeChartManager;

console.log('📦 worktime-chart-manager.js 로드 완료 - 2025.08.19 17:15');