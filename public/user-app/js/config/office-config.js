// office-config.js
// 사무실 위치 및 Wi-Fi 설정 파일 (2025년 8월 14일 개선됨)

// 사무실 위치 설정
const OFFICE_CONFIG = {
  // GPS 기반 설정
  location: {
    // 매사
    latitude: 37.5362819,
    longitude: 126.8949029,
    // 내근으로 인정하는 반경 (미터 단위)
    radius: 300
  },
  
  // Wi-Fi 기반 설정
  wifi: {
    // Wi-Fi 체크 활성화 여부
    enabled: false,
    
    // 사무실 Wi-Fi SSID 목록
    ssids: ["MESA_RND_5G", "MESA_RND_2.4G", "MESA&TOK_2G", "MESA&TOK_5G"],
    
    // 사무실 Wi-Fi BSSID(MAC 주소) 목록 (더 정확한 체크용)
    bssids: ["0C:91:92:50:DB:29", "0C:91:92:50:DB:29", "0C:91:92:50:DB:29", "0C:91:92:50:DB:29"],
    
    // Wi-Fi 신호 강도 임계값 (dBm) - 선택적
    minSignalStrength: -70,
    
    // Wi-Fi 디버그 모드
    debug: true
  },
  
  // 근무구분 자동 설정 규칙
  workTypeRules: {
    // GPS 체크 우선순위
    gpsCheckPriority: 1,
    // Wi-Fi 체크 우선순위
    wifiCheckPriority: 2,
    
    // 기본 근무구분 (위치 정보 없을 때)
    defaultWorkType: null, // null이면 수동 선택
    
    // 자동 설정 시 메모 내용
    autoMemoText: {
      office: "자동 설정 (사무실 위치)",
      wifi: "자동 설정 (사무실 Wi-Fi)",
      manual: "수동 선택"
    }
  },
  
  // 디버그 모드 (콘솔에 상세 로그 출력)
  debug: true,
  
  // 설정 버전 (향후 호환성 관리용)
  version: "1.0"
};

// 디버그 로그 개선 함수 (2025년 8월 14일 추가됨)
function debugLog(message, data = null) {
  if (OFFICE_CONFIG.debug) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
      console.log(`🏢 [${timestamp}] ${message}:`, data);
    } else {
      console.log(`🏢 [${timestamp}] ${message}`);
    }
  }
}

// 사무실 설정 검증 함수 (2025년 8월 14일 추가됨)
function validateOfficeConfig() {
  const config = OFFICE_CONFIG;
  const issues = [];

  // 위치 설정 검증
  if (!config.location.latitude || !config.location.longitude) {
    issues.push("❌ 사무실 위치 좌표가 설정되지 않았습니다.");
  }
  
  if (config.location.radius <= 0) {
    issues.push("❌ 사무실 반경이 올바르지 않습니다.");
  }

  // 좌표 범위 검증
  if (Math.abs(config.location.latitude) > 90) {
    issues.push("❌ 위도 값이 유효하지 않습니다 (-90 ~ 90).");
  }
  
  if (Math.abs(config.location.longitude) > 180) {
    issues.push("❌ 경도 값이 유효하지 않습니다 (-180 ~ 180).");
  }

  // Wi-Fi 설정 검증 (활성화된 경우만)
  if (config.wifi.enabled) {
    if (!config.wifi.ssids || config.wifi.ssids.length === 0) {
      issues.push("⚠️ Wi-Fi가 활성화되었지만 SSID가 설정되지 않았습니다.");
    }
  }

  if (issues.length > 0) {
    console.warn("🚨 사무실 설정 문제 발견:");
    issues.forEach(issue => console.warn(issue));
    return false;
  }

  debugLog("✅ 사무실 설정 검증 완료");
  return true;
}

// 현재 위치에서 사무실까지의 거리 계산 (2025년 8월 14일 추가됨)
async function calculateDistanceToOffice() {
  try {
    debugLog("📍 현재 위치 확인 중...");
    
    // 현재 위치 가져오기
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        enableHighAccuracy: true
      });
    });

    const { latitude, longitude } = position.coords;
    const office = OFFICE_CONFIG.location;

    // 거리 계산 (Haversine 공식)
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (latitude * Math.PI) / 180;
    const φ2 = (office.latitude * Math.PI) / 180;
    const Δφ = ((office.latitude - latitude) * Math.PI) / 180;
    const Δλ = ((office.longitude - longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const result = {
      distance: Math.round(distance),
      isInOffice: distance <= office.radius,
      latitude,
      longitude,
      office: {
        latitude: office.latitude,
        longitude: office.longitude,
        radius: office.radius
      }
    };

    debugLog("📏 사무실 거리 계산 완료", result);
    return result;

  } catch (error) {
    debugLog("❌ 거리 계산 실패", error.message);
    return null;
  }
}

// 사무실 위치 업데이트 함수 (2025년 8월 14일 개선됨)
function updateOfficeLocation(latitude, longitude, radius = 500) {
  // 입력값 검증
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    console.error("❌ 올바르지 않은 좌표값입니다.");
    return false;
  }
  
  if (radius <= 0) {
    console.error("❌ 반경은 0보다 커야 합니다.");
    return false;
  }

  const oldLocation = { ...OFFICE_CONFIG.location };
  
  OFFICE_CONFIG.location.latitude = latitude;
  OFFICE_CONFIG.location.longitude = longitude;
  OFFICE_CONFIG.location.radius = radius;
  
  debugLog('📍 사무실 위치 업데이트', {
    old: oldLocation,
    new: OFFICE_CONFIG.location
  });
  
  // 검증 후 저장
  if (validateOfficeConfig()) {
    saveConfigToStorage();
    return true;
  } else {
    // 검증 실패 시 원복
    OFFICE_CONFIG.location = oldLocation;
    console.error("❌ 위치 업데이트 실패: 검증 실패");
    return false;
  }
}

// Wi-Fi 설정 업데이트 함수 (2025년 8월 14일 개선됨)
function updateOfficeWifi(ssids, bssids = []) {
  if (!Array.isArray(ssids)) {
    console.error("❌ SSID는 배열이어야 합니다.");
    return false;
  }
  
  if (!Array.isArray(bssids)) {
    console.error("❌ BSSID는 배열이어야 합니다.");
    return false;
  }

  const oldWifi = { ...OFFICE_CONFIG.wifi };
  
  OFFICE_CONFIG.wifi.ssids = ssids;
  OFFICE_CONFIG.wifi.bssids = bssids;
  
  debugLog('📡 사무실 Wi-Fi 설정 업데이트', {
    old: { ssids: oldWifi.ssids, bssids: oldWifi.bssids },
    new: { ssids, bssids }
  });
  
  // 검증 후 저장
  if (validateOfficeConfig()) {
    saveConfigToStorage();
    return true;
  } else {
    // 검증 실패 시 원복
    OFFICE_CONFIG.wifi.ssids = oldWifi.ssids;
    OFFICE_CONFIG.wifi.bssids = oldWifi.bssids;
    console.error("❌ Wi-Fi 설정 업데이트 실패: 검증 실패");
    return false;
  }
}

// Wi-Fi 체크 활성화/비활성화 (2025년 8월 14일 개선됨)
function enableWifiCheck(enabled = true) {
  OFFICE_CONFIG.wifi.enabled = enabled;
  
  debugLog(`📡 Wi-Fi 체크 ${enabled ? '활성화' : '비활성화'}`);
  
  if (enabled && validateOfficeConfig()) {
    saveConfigToStorage();
    return true;
  } else if (!enabled) {
    saveConfigToStorage();
    return true;
  } else {
    console.error("❌ Wi-Fi 활성화 실패: 설정 검증 실패");
    return false;
  }
}

// 설정 내보내기 (JSON) (2025년 8월 14일 추가됨)
function exportConfig() {
  const configData = {
    ...OFFICE_CONFIG,
    exportedAt: new Date().toISOString(),
    exportedBy: "office-config.js v" + OFFICE_CONFIG.version
  };
  
  const dataStr = JSON.stringify(configData, null, 2);
  debugLog("📤 설정 내보내기 완료");
  
  return dataStr;
}

// 설정 가져오기 (JSON) (2025년 8월 14일 추가됨)
function importConfig(configJson) {
  try {
    const newConfig = JSON.parse(configJson);
    
    // 기본 구조 검증
    if (!newConfig.location || !newConfig.wifi) {
      throw new Error("올바르지 않은 설정 구조입니다.");
    }

    // 백업 생성
    const backup = { ...OFFICE_CONFIG };
    
    // 설정 적용
    Object.assign(OFFICE_CONFIG, newConfig);
    
    // 검증 실행
    if (validateOfficeConfig()) {
      // 로컬 스토리지에 저장
      saveConfigToStorage();
      debugLog("📥 설정 가져오기 완료");
      return true;
    } else {
      // 검증 실패 시 백업으로 복원
      Object.assign(OFFICE_CONFIG, backup);
      throw new Error("가져온 설정이 검증에 실패했습니다.");
    }
    
  } catch (error) {
    console.error("❌ 설정 가져오기 실패:", error);
    return false;
  }
}

// 설정 로컬 스토리지에 저장 (2025년 8월 14일 개선됨)
function saveConfigToStorage() {
  try {
    const configData = {
      ...OFFICE_CONFIG,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem('officeConfig', JSON.stringify(configData));
    debugLog("💾 설정 저장 완료");
    return true;
  } catch (error) {
    console.error("❌ 설정 저장 실패:", error);
    return false;
  }
}

// 설정 로드 개선 (2025년 8월 14일 개선됨)
function loadOfficeConfig() {
  try {
    const saved = localStorage.getItem('officeConfig');
    if (saved) {
      const config = JSON.parse(saved);
      
      // 버전 호환성 체크
      if (config.version && config.version !== OFFICE_CONFIG.version) {
        console.warn(`⚠️ 다른 버전의 설정 파일입니다. (저장됨: ${config.version}, 현재: ${OFFICE_CONFIG.version})`);
      }
      
      // 필수 필드 체크
      if (config.location && config.wifi) {
        Object.assign(OFFICE_CONFIG, config);
        debugLog("📂 저장된 설정 로드 완료");
        
        // 로드 후 검증
        validateOfficeConfig();
      } else {
        throw new Error("저장된 설정의 구조가 올바르지 않습니다.");
      }
    } else {
      debugLog("📂 저장된 설정이 없습니다. 기본 설정 사용");
      // 기본 설정으로 초기 검증
      validateOfficeConfig();
    }
  } catch (error) {
    console.error("❌ 설정 로드 실패:", error);
    debugLog("📂 기본 설정으로 복원");
    // 기본 설정으로 초기 검증
    validateOfficeConfig();
  }
}

// 설정 초기화 (2025년 8월 14일 추가됨)
function resetConfig() {
  const defaultConfig = {
    location: {
      latitude: 37.5362819,
      longitude: 126.8949029,
      radius: 500
    },
    wifi: {
      enabled: false,
      ssids: ["MESA_RND_5G", "MESA_RND_2.4G", "MESA&TOK_2G", "MESA&TOK_5G"],
      bssids: ["0C:91:92:50:DB:29", "0C:91:92:50:DB:29", "0C:91:92:50:DB:29", "0C:91:92:50:DB:29"],
      minSignalStrength: -70,
      debug: true
    },
    workTypeRules: {
      gpsCheckPriority: 1,
      wifiCheckPriority: 2,
      defaultWorkType: null,
      autoMemoText: {
        office: "자동 설정 (사무실 위치)",
        wifi: "자동 설정 (사무실 Wi-Fi)",
        manual: "수동 선택"
      }
    },
    debug: true,
    version: "1.0"
  };

  Object.assign(OFFICE_CONFIG, defaultConfig);
  saveConfigToStorage();
  debugLog("🔄 설정 초기화 완료");
  return true;
}

// 페이지 로드 시 설정 불러오기
document.addEventListener('DOMContentLoaded', () => {
  debugLog("🚀 office-config.js 초기화 시작");
  loadOfficeConfig();
  debugLog("✅ office-config.js 초기화 완료");
});

// 전역 사용을 위한 내보내기 (2025년 8월 14일 개선됨)
window.OfficeConfig = {
  OFFICE_CONFIG,
  updateOfficeLocation,
  updateOfficeWifi,
  enableWifiCheck,
  loadOfficeConfig,
  validateOfficeConfig,
  calculateDistanceToOffice,
  exportConfig,
  importConfig,
  saveConfigToStorage,
  resetConfig,
  debugLog
};