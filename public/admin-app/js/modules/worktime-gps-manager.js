// GPS 전체 관리 모듈 - 2025.08.19 12:25 생성
// GPS 섹션의 모든 기능을 통합 관리하는 메인 컨트롤러

/**
 * GPS 전체 관리자 클래스
 * 데이터 처리, 마커, 경로 그리기, UI 이벤트를 통합 관리
 */
class WorktimeGpsManager {
    constructor() {
        this.isInitialized = false;
        this.currentDate = this.getTodayString();
        this.selectedUsers = new Set();
        this.mapInstance = null;
        
        // 기본 회사 위치 (기존 설정과 동일)
        this.OFFICE_POSITION = {
            lat: 37.53626,
            lng: 126.895005
        };
        
        console.log('🗺️ WorktimeGpsManager 생성 - 2025.08.19 12:25');
    }

    /**
     * GPS 매니저 초기화 - 2025.08.19 12:30 생성
     */
    async init() {
        try {
            console.log('🚀 GPS 매니저 초기화 시작...');
            
            // 1. 하위 모듈들 초기화 대기
            await this.waitForDependencies();
            
            // 2. 네이버 지도 초기화
            await this.initializeMap();
            
            // 3. 하위 모듈들에 지도 인스턴스 설정
            this.setupSubModules();
            
            // 4. UI 이벤트 설정
            this.setupEventListeners();
            
            // 5. 초기 날짜 표시
            this.updateDateDisplay();
            
            this.isInitialized = true;
            console.log('✅ GPS 매니저 초기화 완료');
            
            // 6. 초기 데이터 로드
            await this.loadInitialData();
            
        } catch (error) {
            console.error('❌ GPS 매니저 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 의존성 모듈 대기 - 2025.08.19 12:35 생성
     */
    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (window.gpsDataProcessor && 
                    window.gpsMarkerManager && 
                    window.gpsPathDrawer &&
                    window.firebaseFirestore) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }

    /**
     * 네이버 지도 초기화 - 2025.08.19 12:35 생성
     */
    async initializeMap() {
        const mapContainer = document.getElementById('worktime-naver-map');
        if (!mapContainer) {
            throw new Error('지도 컨테이너를 찾을 수 없습니다.');
        }

        // 네이버 지도 API 로드 대기
        await this.waitForNaverMaps();

        try {
            const mapOptions = {
                center: new naver.maps.LatLng(this.OFFICE_POSITION.lat, this.OFFICE_POSITION.lng),
                zoom: 15,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: naver.maps.MapTypeControlStyle.BUTTON,
                    position: naver.maps.Position.TOP_RIGHT
                },
                zoomControl: true,
                zoomControlOptions: {
                    style: naver.maps.ZoomControlStyle.SMALL,
                    position: naver.maps.Position.TOP_LEFT
                }
            };

            this.mapInstance = new naver.maps.Map(mapContainer, mapOptions);
            
            // 🗑️ 2025.08.19 14:15 제거: 회사 위치 마커 불필요
            
            console.log('✅ 네이버 지도 초기화 완료');
            
        } catch (error) {
            console.error('❌ 네이버 지도 초기화 실패:', error);
            mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">지도 로드에 실패했습니다.</div>';
            throw error;
        }
    }

    /**
     * 네이버 지도 API 로드 대기 - 2025.08.19 12:40 생성
     */
    async waitForNaverMaps() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5초 대기
            
            const checkNaver = () => {
                if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('네이버 지도 API 로드 시간 초과'));
                } else {
                    attempts++;
                    setTimeout(checkNaver, 100);
                }
            };
            
            checkNaver();
        });
    }

    /**
     * 🗑️ 2025.08.19 14:15 제거: 회사 위치 마커 관련 함수들 제거됨
     * - addOfficeMarker()
     * - showOfficeInfo()
     * 사용자 위치만 표시하도록 변경
     */

    /**
     * 하위 모듈들에 지도 인스턴스 설정 - 2025.08.19 12:55 생성
     */
    setupSubModules() {
        if (window.gpsMarkerManager) {
            window.gpsMarkerManager.setMap(this.mapInstance);
        }
        
        if (window.gpsPathDrawer) {
            window.gpsPathDrawer.setMap(this.mapInstance);
        }
        
        console.log('🔗 하위 모듈들에 지도 인스턴스 설정 완료');
    }

    /**
     * UI 이벤트 리스너 설정 - 2025.08.19 13:00 생성
     */
    setupEventListeners() {
  // 날짜 네비게이션 버튼들
  const prevDateBtn = document.getElementById('gps-prev-date');
  const nextDateBtn = document.getElementById('gps-next-date');
  const resetMapBtn = document.getElementById('reset-map-view-btn');

  if (prevDateBtn) {
    prevDateBtn.addEventListener('click', () => this.navigateDate(-1));
  }

  if (nextDateBtn) {
    nextDateBtn.addEventListener('click', () => this.navigateDate(1));
  }

  if (resetMapBtn) {
    resetMapBtn.addEventListener('click', () => this.resetMapView());
  }

  // 🆕 2025.08.19 16:20 강화: 모든 필터 이벤트 감지
  this.setupFilterEventListeners();

  console.log('🎧 GPS UI 이벤트 리스너 설정 완료');
}

// ✅ 신규 추가: setupFilterEventListeners() 함수
/**
 * 필터 이벤트 리스너 설정 - 2025.08.19 16:20 신규 생성
 * 조직도 및 Worktime 필터 변경 시 GPS 마커 자동 업데이트
 */
setupFilterEventListeners() {
  // 조직도 필터 변경 이벤트 (기존)
  document.addEventListener('organizationFilterChanged', (e) => {
    console.log('🗺️ [GPS 매니저] 조직도 필터 변경 감지');
    this.onOrganizationFilterChanged(e.detail);
  });

  // 조직도 필터 변경 이벤트 (새로운 이벤트명)
  document.addEventListener('orgFilterChanged', (e) => {
    console.log('🗺️ [GPS 매니저] 조직도 필터 변경 감지 (orgFilterChanged)');
    this.handleFilterChange('org', e.detail);
  });

  // 조직도 필터 해제 이벤트
  document.addEventListener('orgFilterCleared', () => {
    console.log('🗺️ [GPS 매니저] 조직도 필터 해제 감지');
    this.handleFilterChange('clear', null);
  });

  // Worktime 필터 변경 이벤트
  document.addEventListener('worktimeFilterChanged', (e) => {
    console.log('🗺️ [GPS 매니저] Worktime 필터 변경 감지');
    this.handleFilterChange('worktime', e.detail);
  });

  console.log('🎧 GPS 필터 이벤트 리스너 설정 완료');
}

// ✅ 신규 추가: handleFilterChange() 함수
/**
 * 필터 변경 처리 - 2025.08.19 16:20 신규 생성
 * 필터 변경 시 GPS 마커를 즉시 업데이트 (디바운싱 적용)
 */
handleFilterChange(source, detail) {
  console.log(`🔄 [GPS 매니저] 필터 변경 처리 시작 (출처: ${source})`);

  // 디바운싱으로 중복 호출 방지
  if (this.filterUpdateTimeout) {
    clearTimeout(this.filterUpdateTimeout);
  }

  this.filterUpdateTimeout = setTimeout(async () => {
    try {
      // 선택된 사용자 목록 업데이트
      this.updateSelectedUsers();
      
      const selectedCount = this.selectedUsers.size;
      console.log(`👥 [GPS 매니저] 필터 변경 후 선택된 사용자: ${selectedCount}명`);

      // GPS 데이터 다시 로드
      await this.loadGpsDataForCurrentDate();
      
      console.log('✅ [GPS 매니저] 필터 변경에 따른 GPS 업데이트 완료');
      
    } catch (error) {
      console.error('❌ [GPS 매니저] 필터 변경 처리 실패:', error);
    }
  }, 250); // 250ms 디바운싱
}

    /**
     * 날짜 표시 업데이트 - 2025.08.19 13:05 생성
     */
    updateDateDisplay() {
        const dateElement = document.getElementById('gps-current-date');
        if (dateElement) {
            dateElement.textContent = this.currentDate;
        }
    }

    /**
     * 날짜 네비게이션 - 2025.08.19 13:05 생성
     * @param {number} direction - 방향 (-1: 이전날, 1: 다음날)
     */
    navigateDate(direction) {
        const currentDateObj = new Date(this.currentDate);
        currentDateObj.setDate(currentDateObj.getDate() + direction);
        
        this.currentDate = this.formatDateString(currentDateObj);
        this.updateDateDisplay();
        
        console.log(`📅 날짜 변경: ${this.currentDate}`);
        
        // 새 날짜의 데이터 로드
        this.loadGpsDataForCurrentDate();
    }

    /**
     * 지도 기본 위치로 리셋 - 2025.08.19 13:10 생성
     */
    resetMapView() {
        if (this.mapInstance) {
            const officePosition = new naver.maps.LatLng(this.OFFICE_POSITION.lat, this.OFFICE_POSITION.lng);
            this.mapInstance.setCenter(officePosition);
            this.mapInstance.setZoom(15);
            
            console.log('🏢 지도 기본 위치로 리셋');
        }
    }

    /**
     * 오늘 날짜 문자열 가져오기 - 2025.08.19 14:30 수정: 한국 시간 정확히 계산
     * @returns {string} YYYY-MM-DD 형식 날짜
     */
    getTodayString() {
        // 현재 시간을 한국 시간(KST)로 정확히 변환
        const now = new Date();
        const kstOffset = 9 * 60; // 한국은 UTC+9 (분 단위)
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC 시간
        const kstTime = new Date(utc + (kstOffset * 60000)); // 한국 시간
        
        const year = kstTime.getFullYear();
        const month = String(kstTime.getMonth() + 1).padStart(2, '0');
        const day = String(kstTime.getDate()).padStart(2, '0');
        
        const todayString = `${year}-${month}-${day}`;
        console.log(`📅 오늘 날짜 계산: ${todayString} (현재 시간: ${now.toISOString()}, 한국 시간: ${kstTime.toISOString()})`);
        
        return todayString;
    }

    /**
     * 날짜 객체를 문자열로 변환 - 2025.08.19 13:15 생성
     * @param {Date} dateObj - 날짜 객체
     * @returns {string} YYYY-MM-DD 형식 문자열
     */
    formatDateString(dateObj) {
        return dateObj.toISOString().split('T')[0];
    }

    /**
     * 초기 데이터 로드 - 2025.08.19 14:45 수정: 날짜 표시 먼저 업데이트
     */
    async loadInitialData() {
        console.log('📊 초기 GPS 데이터 로드 시작...');
        
        // 🔧 현재 날짜를 다시 계산하여 표시 (실시간)
        this.currentDate = this.getTodayString();
        this.updateDateDisplay();
        
        // 선택된 사용자 목록 가져오기
        this.updateSelectedUsers();
        
        // 현재 날짜의 GPS 데이터 로드
        await this.loadGpsDataForCurrentDate();
    }

    /**
 * 선택된 사용자 목록 업데이트 - 2025.08.19 16:35 수정: 빈 데이터 처리 개선
 */
updateSelectedUsers() {
  const previousCount = this.selectedUsers.size;
  this.selectedUsers.clear();
  
  try {
    // 🆕 2025.08.19 16:35 강화: 통합 필터 매니저 우선 사용
    if (window.worktimeFilterManager && window.worktimeFilterManager.isReady()) {
      const filteredEmails = window.worktimeFilterManager.getFilteredUserEmails();
      if (filteredEmails.length > 0) {
        filteredEmails.forEach(email => this.selectedUsers.add(email));
        console.log(`👥 [GPS 매니저] 통합 필터 매니저에서 ${filteredEmails.length}명 가져옴`);
        this.logSelectedUsersChange(previousCount, this.selectedUsers.size);
        return;
      }
    }

    // 출퇴근 데이터 매니저에서 선택된 사용자 가져오기
    if (window.worktimeDataManager && window.worktimeDataManager.isReady()) {
      const selectedEmails = window.worktimeDataManager.getSelectedUserEmails();
      if (selectedEmails.length > 0) {
        selectedEmails.forEach(email => this.selectedUsers.add(email));
        console.log(`👥 [GPS 매니저] 출퇴근 데이터 매니저에서 ${selectedEmails.length}명 가져옴`);
        this.logSelectedUsersChange(previousCount, this.selectedUsers.size);
        return;
      }
    }
    
    // 조직도 필터에서 선택된 사용자 가져오기 (백업)
    if (window.organizationManager) {
      const filteredMembers = window.organizationManager.getFilteredMembers();
      if (filteredMembers && filteredMembers.length > 0) {
        filteredMembers.forEach(email => this.selectedUsers.add(email));
        console.log(`👥 [GPS 매니저] 조직도 매니저에서 ${filteredMembers.length}명 가져옴 (백업)`);
        this.logSelectedUsersChange(previousCount, this.selectedUsers.size);
        return;
      }
    }
    
    // 🆕 2025.08.19 16:35 수정: 모든 소스에서 선택된 사용자가 없으면 로깅만 하고 종료
    console.log("📭 [GPS 매니저] 모든 소스에서 선택된 사용자가 없음");
    this.logSelectedUsersChange(previousCount, this.selectedUsers.size);
    
  } catch (error) {
    console.error('❌ [GPS 매니저] 선택된 사용자 목록 업데이트 실패:', error);
  }
}

// ✅ 신규 추가: logSelectedUsersChange() 함수
/**
 * 선택된 사용자 변경 로깅 - 2025.08.19 16:20 신규 생성
 * 사용자 선택 변경 사항을 상세히 로깅
 */
logSelectedUsersChange(previousCount, currentCount) {
  if (previousCount !== currentCount) {
    console.log(`📊 [GPS 매니저] 선택된 사용자 변경: ${previousCount}명 → ${currentCount}명`);
    
    if (currentCount === 0) {
      console.warn('⚠️ [GPS 매니저] 선택된 사용자가 없습니다. GPS 마커가 표시되지 않습니다.');
    } else {
      console.log(`✅ [GPS 매니저] ${currentCount}명의 GPS 마커가 표시될 예정입니다.`);
    }
  }
}

    /**
 * 현재 날짜의 GPS 데이터 로드 - 2025.08.19 16:35 수정: 빈 데이터 처리 개선
 */
async loadGpsDataForCurrentDate() {
  if (!this.isInitialized) {
    console.warn('⚠️ GPS 매니저가 초기화되지 않았습니다.');
    return;
  }

  console.log(`🔍 GPS 데이터 로드 시작 - 날짜: ${this.currentDate}`);

  // 선택된 사용자 업데이트
  this.updateSelectedUsers();

  if (this.selectedUsers.size === 0) {
    console.log('📭 [GPS 매니저] 선택된 사용자가 없습니다. GPS 마커를 모두 제거합니다.');
    this.clearAllGpsDisplay();
    
    // 🆕 2025.08.19 16:35 추가: 빈 상태 UI 메시지 (선택적)
    this.showEmptyStateMessage();
    return;
  }

  try {
    console.log(`🔄 GPS 데이터 로드 시작: ${this.currentDate}, ${this.selectedUsers.size}명`);
    console.log('👥 선택된 사용자들:', Array.from(this.selectedUsers));
    
    // 🆕 2025.08.19 16:35 추가: 빈 상태 메시지 숨김
    this.hideEmptyStateMessage();
    
    // 🆕 2025.08.19 15:35 추가: 조직도 색상과 동기화
    if (window.gpsMarkerManager) {
      window.gpsMarkerManager.syncWithOrganizationColors();
    }
    
    // 모든 선택된 사용자의 GPS 데이터 로드
    const userEmailsArray = Array.from(this.selectedUsers);
    const gpsDataMap = await window.gpsDataProcessor.loadMultipleUsersGpsData(
      userEmailsArray, 
      this.currentDate
    );

    console.log(`📍 GPS 데이터 로드 완료: ${gpsDataMap.size}명의 데이터`);
    
    // 각 사용자별 데이터 상세 로그
    gpsDataMap.forEach((gpsData, userEmail) => {
      console.log(`👤 ${userEmail}: ${gpsData.length}개 GPS 포인트`);
      if (gpsData.length > 0) {
        console.log(`  📍 첫 번째 포인트:`, gpsData[0]);
        console.log(`  📍 마지막 포인트:`, gpsData[gpsData.length - 1]);
      }
    });

    // 기존 마커 및 경로 제거
    this.clearAllGpsDisplay();

    // 데이터가 있는 사용자들의 마커 및 경로 생성
    let totalMarkers = 0;
    let totalPaths = 0;
    const historyData = [];

    for (const [userEmail, gpsData] of gpsDataMap) {
      if (gpsData.length > 0) {
        console.log(`🗺️ ${userEmail} 마커 생성 중: ${gpsData.length}개 포인트`);
        
        // 사용자 색상 가져오기
        const userColor = window.gpsMarkerManager.getUserColor(userEmail);

        // 마커 생성
        const markers = window.gpsMarkerManager.createUserMarkers(userEmail, gpsData);
        totalMarkers += markers.length;
        console.log(`✅ ${userEmail} 마커 생성 완료: ${markers.length}개`);

        // 경로 생성 (2개 이상의 포인트가 있을 때)
        if (gpsData.length >= 2) {
          const paths = window.gpsPathDrawer.drawUserPath(userEmail, gpsData, userColor);
          totalPaths += paths.length;
          console.log(`✅ ${userEmail} 경로 생성 완료: ${paths.length}개 구간`);
        }

        // 히스토리 데이터 추가
        historyData.push({
          userEmail,
          gpsData,
          color: userColor
        });
      }
    }

    console.log(`✅ GPS 표시 완료: 마커 ${totalMarkers}개, 경로 ${totalPaths}개`);

    // 마커가 있으면 지도 범위 조정
    if (totalMarkers > 0) {
      setTimeout(() => {
        window.gpsMarkerManager.fitMapToMarkers();
      }, 500); // 약간의 지연을 두어 마커 생성 완료 후 실행
    } else {
      console.log('📭 [GPS 매니저] 표시할 GPS 마커가 없습니다.');
      this.showEmptyStateMessage();
    }

  } catch (error) {
    console.error('❌ GPS 데이터 로드 실패:', error);
  }
}

// ✅ 신규 추가: showEmptyStateMessage() 함수
/**
 * 빈 상태 메시지 표시 - 2025.08.19 16:35 신규 생성
 * 선택된 사용자가 없을 때 안내 메시지 표시 (선택적)
 */
showEmptyStateMessage() {
  const emptyMessageEl = document.getElementById('gps-empty-message');
  if (emptyMessageEl) {
    emptyMessageEl.style.display = 'block';
    emptyMessageEl.textContent = '조직도에서 사용자를 선택하면 GPS 위치가 표시됩니다.';
  }
  console.log('📭 [GPS 매니저] 빈 상태 메시지 표시');
}

// ✅ 신규 추가: hideEmptyStateMessage() 함수
/**
 * 빈 상태 메시지 숨김 - 2025.08.19 16:35 신규 생성
 */
hideEmptyStateMessage() {
  const emptyMessageEl = document.getElementById('gps-empty-message');
  if (emptyMessageEl) {
    emptyMessageEl.style.display = 'none';
  }
}

    /**
     * 모든 GPS 표시 제거 - 2025.08.19 13:30 생성
     */
    clearAllGpsDisplay() {
        if (window.gpsMarkerManager) {
            window.gpsMarkerManager.removeAllMarkers();
        }
        
        if (window.gpsPathDrawer) {
            window.gpsPathDrawer.removeAllPaths();
        }
        
        console.log('🗑️ 모든 GPS 표시 제거됨');
    }

    /**
     * 🗑️ 2025.08.19 16:00 제거: 히스토리 리스트 관련 함수들 제거됨
     * - updateHistoryList() 
     * - toggleUserDisplay()
     * 지도 UI만 사용하도록 간소화
     */

    /**
     * 특정 사용자에게 지도 중심 맞추기 - 2025.08.19 13:45 생성
     * @param {string} userEmail - 사용자 이메일
     */
    focusOnUser(userEmail) {
        if (!window.gpsMarkerManager || !this.mapInstance) {
            return;
        }

        const userMarkers = window.gpsMarkerManager.markers.get(userEmail);
        if (!userMarkers || userMarkers.length === 0) {
            console.log(`📍 ${userEmail}의 마커가 없습니다.`);
            return;
        }

        // 사용자의 모든 마커 위치 수집
        const positions = userMarkers.map(marker => marker.getPosition());

        if (positions.length === 1) {
            // 마커가 하나뿐이면 해당 위치로 이동
            this.mapInstance.setCenter(positions[0]);
            this.mapInstance.setZoom(17);
        } else {
            // 여러 마커가 있으면 모든 마커가 보이도록 범위 조정
            const bounds = new naver.maps.LatLngBounds();
            positions.forEach(position => bounds.extend(position));
            this.mapInstance.fitBounds(bounds);
        }

        console.log(`🎯 ${userEmail}에게 지도 중심 맞춤`);
    }

    /**
     * 조직도 필터 변경 이벤트 핸들러 - 2025.08.19 13:50 생성
     * @param {object} detail - 필터 변경 상세 정보
     */
    onOrganizationFilterChanged(detail) {
  console.log('🔄 [GPS 매니저] 조직도 필터 변경 감지 (레거시):', detail);
  
  // 새로운 통합 처리 함수 호출
  this.handleFilterChange('org_legacy', detail);
}

    /**
     * GPS 데이터 새로고침 - 2025.08.19 13:50 생성
     */
    async refreshGpsData() {
  console.log('🔄 [GPS 매니저] GPS 데이터 새로고침 시작');
  
  try {
    // 캐시 클리어
    if (window.gpsDataProcessor) {
      window.gpsDataProcessor.clearCache();
      console.log('🗑️ [GPS 매니저] GPS 데이터 캐시 클리어됨');
    }
    
    // 선택된 사용자 업데이트
    this.updateSelectedUsers();
    
    // 데이터 다시 로드
    await this.loadGpsDataForCurrentDate();
    
    console.log('✅ [GPS 매니저] GPS 데이터 새로고침 완료');
    
  } catch (error) {
    console.error('❌ [GPS 매니저] GPS 데이터 새로고침 실패:', error);
  }
}

    /**
     * 초기화 상태 확인 - 2025.08.19 13:55 생성
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 현재 상태 정보 - 2025.08.19 13:55 생성
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentDate: this.currentDate,
            selectedUsersCount: this.selectedUsers.size,
            mapCenter: this.mapInstance ? this.mapInstance.getCenter() : null,
            mapZoom: this.mapInstance ? this.mapInstance.getZoom() : null
        };
    }
}

// 전역 인스턴스 생성
const worktimeGpsManager = new WorktimeGpsManager();

// 전역 접근 가능하도록 설정
window.worktimeGpsManager = worktimeGpsManager;

console.log('📦 worktime-gps-manager.js 로드 완료 - 2025.08.19 14:00');