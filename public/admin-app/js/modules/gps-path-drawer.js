// GPS 경로 그리기 모듈 - 2025.08.19 11:30 생성
// 네이버 지도에 사용자별 이동 경로선 그리기 및 관리

/**
 * GPS 경로 그리기 매니저 클래스
 * 마커가 2개 이상일 때 시간순으로 경로선을 그리고 관리
 */
class GpsPathDrawer {
    constructor() {
        this.paths = new Map(); // userEmail -> polyline[]
        this.currentMap = null;
        
        console.log('🛤️ GpsPathDrawer 생성 - 2025.08.19 11:30');
    }

    /**
     * 지도 인스턴스 설정 - 2025.08.19 11:35 생성
     * @param {naver.maps.Map} mapInstance - 네이버 지도 인스턴스
     */
    setMap(mapInstance) {
        this.currentMap = mapInstance;
        console.log('🗺️ 경로 그리기용 지도 인스턴스 설정 완료');
    }

    /**
     * 사용자의 이동 경로 그리기 - 2025.08.19 11:35 생성
     * @param {string} userEmail - 사용자 이메일
     * @param {Array} gpsData - 시간순 정렬된 GPS 데이터 배열
     * @param {object} userColor - 사용자 색상 정보
     * @returns {Array} 생성된 경로선 배열
     */
    drawUserPath(userEmail, gpsData, userColor) {
        if (!this.currentMap) {
            console.error('❌ 지도 인스턴스가 설정되지 않았습니다.');
            return [];
        }

        if (!Array.isArray(gpsData) || gpsData.length < 2) {
            console.log(`📍 경로 그리기 불가: ${userEmail} (포인트 ${gpsData?.length || 0}개)`);
            return [];
        }

        // 기존 경로 제거
        this.removeUserPath(userEmail);

        console.log(`🛤️ ${userEmail}의 경로 그리기 시작: ${gpsData.length}개 포인트`);

        const userPaths = [];

        try {
            // 연속된 GPS 포인트들을 연결하는 경로선 생성
            for (let i = 0; i < gpsData.length - 1; i++) {
                const startPoint = gpsData[i];
                const endPoint = gpsData[i + 1];

                // 유효한 좌표인지 확인
                if (!startPoint.isValidCoordinate || !endPoint.isValidCoordinate) {
                    console.warn(`⚠️ 유효하지 않은 좌표: ${i} -> ${i + 1}`);
                    continue;
                }

                // 경로선 생성
                const pathLine = this.createPathLine(
                    startPoint,
                    endPoint,
                    userColor,
                    i + 1 // 구간 번호
                );

                if (pathLine) {
                    pathLine.userEmail = userEmail;
                    pathLine.segmentNumber = i + 1;
                    pathLine.startPoint = startPoint;
                    pathLine.endPoint = endPoint;
                    
                    userPaths.push(pathLine);
                }
            }

            // 사용자별 경로 저장
            this.paths.set(userEmail, userPaths);
            
            console.log(`✅ ${userEmail}의 경로 그리기 완료: ${userPaths.length}개 구간`);
            return userPaths;

        } catch (error) {
            console.error(`❌ 경로 그리기 실패: ${userEmail}`, error);
            return [];
        }
    }

    /**
     * 개별 경로선 생성 - 2025.08.19 11:40 생성
     * @param {object} startPoint - 시작점 GPS 데이터
     * @param {object} endPoint - 끝점 GPS 데이터
     * @param {object} userColor - 사용자 색상 정보
     * @param {number} segmentNumber - 구간 번호
     * @returns {naver.maps.Polyline} 생성된 경로선
     */
    createPathLine(startPoint, endPoint, userColor, segmentNumber) {
        try {
            const startPosition = new naver.maps.LatLng(startPoint.latitude, startPoint.longitude);
            const endPosition = new naver.maps.LatLng(endPoint.latitude, endPoint.longitude);

            // 거리 계산 (미터)
            const distance = this.calculateDistance(
                startPoint.latitude, startPoint.longitude,
                endPoint.latitude, endPoint.longitude
            );

            // 경로선 스타일 설정
            const pathOptions = {
                map: this.currentMap,
                path: [startPosition, endPosition],
                strokeColor: userColor.bg,
                strokeWeight: 3,
                strokeOpacity: 0.8,
                strokeStyle: 'solid'
            };

            // 거리가 매우 짧은 경우 점선으로 표시
            if (distance < 50) { // 50미터 미만
                pathOptions.strokeStyle = 'shortdash';
                pathOptions.strokeOpacity = 0.6;
            }

            const polyline = new naver.maps.Polyline(pathOptions);

            // 경로선 클릭 이벤트
            naver.maps.Event.addListener(polyline, 'click', (e) => {
                this.onPathClick(polyline, e);
            });

            // 경로선에 정보 저장
            polyline.segmentInfo = {
                segmentNumber,
                distance: Math.round(distance),
                startTime: startPoint.time,
                endTime: endPoint.time,
                userEmail: startPoint.userEmail
            };

            return polyline;

        } catch (error) {
            console.error('❌ 개별 경로선 생성 실패:', error);
            return null;
        }
    }

    /**
     * 거리 계산 함수 - 2025.08.19 11:45 생성
     * @param {number} lat1 - 시작점 위도
     * @param {number} lng1 - 시작점 경도
     * @param {number} lat2 - 끝점 위도
     * @param {number} lng2 - 끝점 경도
     * @returns {number} 거리 (미터)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // 지구 반지름 (미터)
        const toRad = (deg) => (deg * Math.PI) / 180;
        
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    /**
     * 경로선 클릭 이벤트 핸들러 - 2025.08.19 11:50 생성
     * @param {naver.maps.Polyline} polyline - 클릭된 경로선
     * @param {object} e - 이벤트 객체
     */
    onPathClick(polyline, e) {
        const segmentInfo = polyline.segmentInfo;
        
        console.log(`🖱️ 경로선 클릭: ${segmentInfo.userEmail}, 구간 ${segmentInfo.segmentNumber}`);

        // 사용자 정보 가져오기
        let userName = segmentInfo.userEmail;
        try {
            if (window.organizationManager) {
                const userInfo = window.organizationManager.findMemberByEmail(segmentInfo.userEmail);
                userName = userInfo?.name || segmentInfo.userEmail;
            }
        } catch (error) {
            console.warn('사용자 정보 가져오기 실패:', error);
        }

        // 구간 정보창 내용 생성
        const infoContent = `
            <div style="padding: 10px; min-width: 200px; font-family: inherit;">
                <h4 style="margin: 0 0 8px 0; color: #374151;">${userName}</h4>
                <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
                    <div><strong>구간:</strong> ${segmentInfo.segmentNumber}번째 이동</div>
                    <div><strong>거리:</strong> ${segmentInfo.distance}m</div>
                    <div><strong>시작:</strong> ${segmentInfo.startTime}</div>
                    <div><strong>도착:</strong> ${segmentInfo.endTime}</div>
                </div>
            </div>
        `;

        // 기존 정보창 제거
        if (this.currentPathInfoWindow) {
            this.currentPathInfoWindow.close();
        }

        // 새 정보창 생성 및 표시
        this.currentPathInfoWindow = new naver.maps.InfoWindow({
            content: infoContent,
            borderWidth: 1,
            borderColor: '#d1d5db',
            backgroundColor: '#ffffff'
        });

        this.currentPathInfoWindow.open(this.currentMap, e.coord);
    }

    /**
     * 특정 사용자의 경로 제거 - 2025.08.19 11:55 생성
     * @param {string} userEmail - 사용자 이메일
     */
    removeUserPath(userEmail) {
        if (this.paths.has(userEmail)) {
            const userPaths = this.paths.get(userEmail);
            userPaths.forEach(path => {
                path.setMap(null);
            });
            this.paths.delete(userEmail);
            console.log(`🗑️ ${userEmail}의 경로 제거됨`);
        }
    }

    /**
     * 모든 경로 제거 - 2025.08.19 11:55 생성
     */
    removeAllPaths() {
        this.paths.forEach((userPaths, userEmail) => {
            userPaths.forEach(path => {
                path.setMap(null);
            });
        });
        this.paths.clear();
        
        // 경로 정보창도 닫기
        if (this.currentPathInfoWindow) {
            this.currentPathInfoWindow.close();
            this.currentPathInfoWindow = null;
        }
        
        console.log('🗑️ 모든 GPS 경로 제거됨');
    }

    /**
     * 사용자별 경로 표시/숨김 토글 - 2025.08.19 12:00 생성
     * @param {string} userEmail - 사용자 이메일
     * @param {boolean} visible - 표시 여부
     */
    toggleUserPath(userEmail, visible) {
        if (this.paths.has(userEmail)) {
            const userPaths = this.paths.get(userEmail);
            userPaths.forEach(path => {
                path.setMap(visible ? this.currentMap : null);
            });
            console.log(`👁️ ${userEmail} 경로 ${visible ? '표시' : '숨김'}`);
        }
    }

    /**
     * 사용자별 총 이동거리 계산 - 2025.08.19 12:00 생성
     * @param {string} userEmail - 사용자 이메일
     * @returns {number} 총 이동거리 (미터)
     */
    calculateTotalDistance(userEmail) {
        if (!this.paths.has(userEmail)) {
            return 0;
        }

        const userPaths = this.paths.get(userEmail);
        let totalDistance = 0;

        userPaths.forEach(path => {
            if (path.segmentInfo && path.segmentInfo.distance) {
                totalDistance += path.segmentInfo.distance;
            }
        });

        return totalDistance;
    }

    /**
     * 활성 경로 정보 가져오기 - 2025.08.19 12:05 생성
     * @returns {object} 활성 경로 통계
     */
    getActivePathsInfo() {
        const info = {
            totalUsers: this.paths.size,
            totalSegments: 0,
            userDetails: []
        };

        this.paths.forEach((userPaths, userEmail) => {
            const visiblePaths = userPaths.filter(path => path.getMap() !== null);
            const totalDistance = this.calculateTotalDistance(userEmail);
            
            if (visiblePaths.length > 0) {
                info.totalSegments += visiblePaths.length;
                
                info.userDetails.push({
                    email: userEmail,
                    segmentCount: visiblePaths.length,
                    totalDistance: totalDistance,
                    averageSegmentDistance: Math.round(totalDistance / visiblePaths.length)
                });
            }
        });

        return info;
    }

    /**
     * 경로 애니메이션 효과 - 2025.08.19 12:10 생성
     * @param {string} userEmail - 사용자 이메일
     * @param {number} duration - 애니메이션 지속시간 (밀리초)
     */
    animateUserPath(userEmail, duration = 2000) {
        if (!this.paths.has(userEmail)) {
            return;
        }

        const userPaths = this.paths.get(userEmail);
        const segmentDelay = duration / userPaths.length;

        console.log(`🎬 ${userEmail} 경로 애니메이션 시작`);

        // 모든 경로를 먼저 숨김
        userPaths.forEach(path => {
            path.setMap(null);
        });

        // 순차적으로 경로 표시
        userPaths.forEach((path, index) => {
            setTimeout(() => {
                path.setMap(this.currentMap);
                
                // 마지막 구간이면 애니메이션 완료 로그
                if (index === userPaths.length - 1) {
                    console.log(`✅ ${userEmail} 경로 애니메이션 완료`);
                }
            }, index * segmentDelay);
        });
    }

    /**
     * 경로 스타일 업데이트 - 2025.08.19 12:15 생성
     * @param {string} userEmail - 사용자 이메일
     * @param {object} newStyle - 새로운 스타일 옵션
     */
    updateUserPathStyle(userEmail, newStyle) {
        if (!this.paths.has(userEmail)) {
            return;
        }

        const userPaths = this.paths.get(userEmail);
        userPaths.forEach(path => {
            if (newStyle.strokeColor) path.setOptions({ strokeColor: newStyle.strokeColor });
            if (newStyle.strokeWeight) path.setOptions({ strokeWeight: newStyle.strokeWeight });
            if (newStyle.strokeOpacity) path.setOptions({ strokeOpacity: newStyle.strokeOpacity });
            if (newStyle.strokeStyle) path.setOptions({ strokeStyle: newStyle.strokeStyle });
        });

        console.log(`🎨 ${userEmail} 경로 스타일 업데이트 완료`);
    }
}

// 전역 인스턴스 생성
const gpsPathDrawer = new GpsPathDrawer();

// 전역 접근 가능하도록 설정
window.gpsPathDrawer = gpsPathDrawer;

console.log('📦 gps-path-drawer.js 로드 완료 - 2025.08.19 12:20');