// location-utils.js
// 위치 관련 유틸리티 함수들 (2025년 8월 14일 수정됨)
// 사무실 위치 및 Wi-Fi 설정은 office-config.js에서 관리하도록 변경

// 클라이언트 사이드 네이버 지오코딩 (2025년 8월 14일 생성됨)
async function getAddressFromCoordinates(latitude, longitude, retryCount = 2) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(
        `🗺️ 네이버 지오코딩 시작 (시도 ${attempt}/${retryCount}): ${latitude}, ${longitude}`
      );

      // 네이버 지도 API가 로드되었는지 확인
      if (typeof naver === "undefined" || !naver.maps || !naver.maps.Service) {
        console.warn("네이버 지도 API가 아직 로드되지 않았습니다. 대기 중...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (
          typeof naver === "undefined" ||
          !naver.maps ||
          !naver.maps.Service
        ) {
          throw new Error("네이버 지도 API를 로드할 수 없습니다");
        }
      }

      // Promise로 래핑하여 콜백을 async/await로 사용
      const address = await new Promise((resolve, reject) => {
        naver.maps.Service.reverseGeocode(
          {
            coords: new naver.maps.LatLng(latitude, longitude),
            orders: [
              naver.maps.Service.OrderType.ROAD_ADDR,
              naver.maps.Service.OrderType.ADDR,
            ].join(","),
          },
          function (status, response) {
            if (status !== naver.maps.Service.Status.OK) {
              console.error("네이버 지오코딩 실패:", status);
              reject(new Error("주소 변환 실패"));
              return;
            }

            const result = response.v2;
            let addressText = "";

            // 도로명 주소 우선
            if (result.roadAddress) {
              addressText = result.roadAddress;
              console.log("도로명 주소:", addressText);
            }
            // 지번 주소
            else if (result.address) {
              const addr = result.address;
              addressText = `${
                addr.jibunAddress || addr.roadAddress || ""
              }`.trim();
              console.log("지번 주소:", addressText);
            }
            // 상세 주소 구성
            else if (result.results && result.results.length > 0) {
              const item = result.results[0];
              if (item.land) {
                addressText = [
                  item.region?.area1?.name,
                  item.region?.area2?.name,
                  item.region?.area3?.name,
                  item.land?.name,
                  item.land?.number1,
                  item.land?.number2,
                ]
                  .filter(Boolean)
                  .join(" ");
              }
            }

            if (!addressText) {
              addressText = "주소를 찾을 수 없습니다";
            }

            console.log("✅ 주소 변환 성공:", addressText);
            resolve(addressText);
          }
        );
      });

      return address;
    } catch (error) {
      console.warn(
        `네이버 지오코딩 실패 (시도 ${attempt}/${retryCount}):`,
        error
      );
      if (attempt === retryCount) {
        console.error("❌ 모든 시도 실패, 기본값 반환");
        return "주소 정보 사용 불가";
      }

      // 재시도 전 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// GPS 정보를 가져오는 함수 (최대 3회 재시도) (2025년 8월 14일 생성됨)
async function getCurrentLocation(retryCount = 3, timeout = 3000) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
          { timeout, enableHighAccuracy: true }
        );
      });

      return { latitude: coords.latitude, longitude: coords.longitude };
    } catch (error) {
      console.warn(`GPS 요청 실패 (시도 ${attempt}/${retryCount}):`, error);
      if (attempt === retryCount) {
        return { latitude: "위치 정보 사용 불가", longitude: "" };
      }
    }
  }
}

// 두 지점 간 거리 계산 (Haversine 공식) (2025년 8월 14일 생성됨)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 거리
}

// 위치 기반 근무 구분 판별 (2025년 8월 14일 수정됨)
function determineWorkType(latitude, longitude) {
  if (latitude === "위치 정보 사용 불가" || !latitude || !longitude) {
    return null; // 위치 정보 없음
  }

  // office-config.js에서 설정 가져오기 (2025년 8월 14일 수정됨)
  const officeConfig = window.OfficeConfig?.OFFICE_CONFIG?.location;
  const wifiConfig = window.OfficeConfig?.OFFICE_CONFIG?.wifi;
  
  if (!officeConfig) {
    console.warn("⚠️ 사무실 설정을 찾을 수 없습니다. office-config.js를 확인하세요.");
    return null;
  }

  // Wi-Fi 체크 (office-config.js 설정 사용) (2025년 8월 14일 수정됨)
  if (wifiConfig?.enabled && typeof checkOfficeWifi === "function") {
    const isOfficeWifi = checkOfficeWifi();
    if (isOfficeWifi) {
      return "내근";
    }
  }

  // GPS 기반 거리 체크
  const distance = calculateDistance(
    latitude,
    longitude,
    officeConfig.latitude,
    officeConfig.longitude
  );

  console.log(`📍 사무실로부터의 거리: ${distance.toFixed(0)}미터 (기준: ${officeConfig.radius}m)`);

  if (distance <= officeConfig.radius) {
    return "내근";
  }

  return null; // 반경 밖 - 선택 필요
}

// Wi-Fi 체크 함수 (office-config.js 설정 사용) (2025년 8월 14일 수정됨)
function checkOfficeWifi() {
  const wifiConfig = window.OfficeConfig?.OFFICE_CONFIG?.wifi;
  
  if (!wifiConfig || !wifiConfig.enabled) {
    return false;
  }

  // 향후 구현 예정
  // navigator.connection API 또는 다른 방법으로 Wi-Fi 정보 확인
  // wifiConfig.ssids, wifiConfig.bssids 사용
  
  if (wifiConfig.debug) {
    console.log("📡 Wi-Fi 체크 실행 (구현 예정):", wifiConfig);
  }
  
  return false;
}

// 전역 모듈로 내보내기 (2025년 8월 14일 수정됨)
window.LocationUtils = {
  getAddressFromCoordinates,
  getCurrentLocation,
  calculateDistance,
  determineWorkType,
  checkOfficeWifi,
};