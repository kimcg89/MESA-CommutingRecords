// GPS 마커 관리 모듈 - 2025.08.19 10:30 생성
// 네이버 지도에 사용자별 색상으로 번호 마커 생성 및 관리

/**
 * GPS 마커 매니저 클래스
 * 조직도 색상과 일치하는 사용자별 마커 생성 및 관리
 */
class GpsMarkerManager {
    constructor() {
        this.markers = new Map(); // userEmail -> marker[]
        this.userColorIndex = new Map(); // userEmail -> colorIndex
        this.colorPalette = this.initializeColorPalette();
        this.currentMap = null;
        
        console.log('🗺️ GpsMarkerManager 생성 - 2025.08.19 10:30');
    }

    /**
     * 색상 팔레트 초기화 - 2025.08.19 15:40 수정: organization.css와 정확히 일치
     * organization.css의 user-color 팔레트와 동일한 색상 사용
     */
    initializeColorPalette() {
        return [
            { bg: '#ef4444', border: '#dc2626' }, // user-color-0 - var(--color-danger) 실제값
            { bg: '#f97316', border: '#ea580c' }, // user-color-1 - 주황
            { bg: '#eab308', border: '#ca8a04' }, // user-color-2 - 노랑
            { bg: '#22c55e', border: '#16a34a' }, // user-color-3 - 초록
            { bg: '#06b6d4', border: '#0891b2' }, // user-color-4 - var(--color-info) 실제값
            { bg: '#3b82f6', border: '#2563eb' }, // user-color-5 - var(--color-primary) 실제값
            { bg: '#8b5cf6', border: '#7c3aed' }, // user-color-6 - 보라
            { bg: '#ec4899', border: '#db2777' }, // user-color-7 - 분홍
            { bg: '#f43f5e', border: '#e11d48' }, // user-color-8 - 장미
            { bg: '#84cc16', border: '#65a30d' }, // user-color-9 - 라임
            { bg: '#10b981', border: '#059669' }, // user-color-10 - var(--color-success) 실제값
            { bg: '#14b8a6', border: '#0d9488' }, // user-color-11 - 청록
            { bg: '#0ea5e9', border: '#0284c7' }, // user-color-12 - 스카이
            { bg: '#6366f1', border: '#4f46e5' }, // user-color-13 - 인디고
            { bg: '#a855f7', border: '#9333ea' }  // user-color-14 - 바이올렛
        ];
    }

    /**
     * 지도 인스턴스 설정 - 2025.08.19 10:40 생성
     * @param {naver.maps.Map} mapInstance - 네이버 지도 인스턴스
     */
    setMap(mapInstance) {
        this.currentMap = mapInstance;
        console.log('🗺️ 지도 인스턴스 설정 완료');
    }

    /**
     * 사용자 색상 인덱스 가져오기 - 2025.08.19 15:30 수정: 조직도 색상과 완전 동기화
     * 조직도에서 사용하는 색상 인덱스와 동일하게 매핑
     * @param {string} userEmail - 사용자 이메일
     * @returns {number} 색상 인덱스 (0-14)
     */
    getUserColorIndex(userEmail) {
        if (this.userColorIndex.has(userEmail)) {
            return this.userColorIndex.get(userEmail);
        }

        let colorIndex = 5; // 기본값 (파랑)
        
        try {
            // 1차: organizationManager에서 사용자 정보 및 색상 인덱스 가져오기
            if (window.organizationManager) {
                const userInfo = window.organizationManager.findMemberByEmail(userEmail);
                if (userInfo && userInfo.colorIndex !== undefined) {
                    colorIndex = userInfo.colorIndex % this.colorPalette.length;
                    console.log(`🎨 organizationManager에서 색상 인덱스 가져옴: ${userEmail} -> ${colorIndex}`);
                }
            }
            // 2차: firebaseOrgManager에서 색상 인덱스 계산 (기존 방식과 동일)
            else if (window.firebaseOrgManager) {
                const allMembers = window.firebaseOrgManager.getAllMembers();
                if (allMembers && Array.isArray(allMembers)) {
                    const userIndex = allMembers.findIndex(member => member.email === userEmail);
                    if (userIndex >= 0) {
                        colorIndex = userIndex % this.colorPalette.length;
                        console.log(`🎨 firebaseOrgManager에서 색상 인덱스 계산: ${userEmail} -> ${colorIndex} (인덱스: ${userIndex})`);
                    }
                }
            }
            // 3차: DOM에서 user-color 클래스 찾기
            else {
                const userElements = document.querySelectorAll(`[data-user-email="${userEmail}"]`);
                if (userElements.length > 0) {
                    for (let i = 0; i < this.colorPalette.length; i++) {
                        if (userElements[0].classList.contains(`user-color-${i}`)) {
                            colorIndex = i;
                            console.log(`🎨 DOM에서 user-color 클래스 발견: ${userEmail} -> user-color-${colorIndex}`);
                            break;
                        }
                    }
                }
            }
            
            // 마지막 대안: 이메일 해시 기반
            if (colorIndex === 5) { // 기본값이 그대로면 해시 사용
                colorIndex = this.hashEmailToColorIndex(userEmail);
                console.log(`🎨 이메일 해시 기반 색상: ${userEmail} -> ${colorIndex}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ 사용자 색상 인덱스 가져오기 실패: ${userEmail}`, error);
            colorIndex = this.hashEmailToColorIndex(userEmail);
        }

        this.userColorIndex.set(userEmail, colorIndex);
        console.log(`🎨 최종 사용자 색상 매핑: ${userEmail} -> ${colorIndex} (색상: ${this.colorPalette[colorIndex].bg})`);
        
        return colorIndex;
    }

    /**
     * CSS 변수값 실시간 추출 - 2025.08.19 15:45 생성
     * organization.css의 실제 CSS 변수값을 가져와서 정확한 색상 매핑
     */
    extractCssVariableColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        
        // CSS 변수값 추출
        const cssVars = {
            'color-danger': computedStyle.getPropertyValue('--color-danger').trim(),
            'color-info': computedStyle.getPropertyValue('--color-info').trim(),
            'color-primary': computedStyle.getPropertyValue('--color-primary').trim(),
            'color-primary-dark': computedStyle.getPropertyValue('--color-primary-dark').trim(),
            'color-success': computedStyle.getPropertyValue('--color-success').trim()
        };
        
        console.log('🎨 추출된 CSS 변수값:', cssVars);
        
        // 변수값이 있으면 팔레트 업데이트
        if (cssVars['color-danger']) {
            this.colorPalette[0].bg = cssVars['color-danger']; // user-color-0
        }
        if (cssVars['color-info']) {
            this.colorPalette[4].bg = cssVars['color-info']; // user-color-4
        }
        if (cssVars['color-primary']) {
            this.colorPalette[5].bg = cssVars['color-primary']; // user-color-5
        }
        if (cssVars['color-primary-dark']) {
            this.colorPalette[5].border = cssVars['color-primary-dark']; // user-color-5 border
        }
        if (cssVars['color-success']) {
            this.colorPalette[10].bg = cssVars['color-success']; // user-color-10
        }
        
        console.log('✅ CSS 변수 기반 색상 팔레트 업데이트 완료');
        return cssVars;
    }
    
    syncWithOrganizationColors() {
        console.log('🔄 조직도와 GPS 마커 색상 동기화 시작...');
        
        // 기존 캐시 클리어
        this.userColorIndex.clear();
        
        // DOM에서 모든 사용자 아바타 요소 찾기
        const userAvatars = document.querySelectorAll('.user-avatar[data-user-email]');
        let syncedCount = 0;
        
        userAvatars.forEach(avatar => {
            const userEmail = avatar.getAttribute('data-user-email');
            if (!userEmail) return;
            
            // user-color-N 클래스 찾기
            for (let i = 0; i < this.colorPalette.length; i++) {
                if (avatar.classList.contains(`user-color-${i}`)) {
                    this.userColorIndex.set(userEmail, i);
                    console.log(`🎨 동기화: ${userEmail} -> user-color-${i}`);
                    syncedCount++;
                    break;
                }
            }
        });
        
        console.log(`✅ 조직도 색상 동기화 완료: ${syncedCount}명`);
        return syncedCount;
    }
    /**
     * @param {string} email - 사용자 이메일
     * @returns {number} 색상 인덱스
     */
    hashEmailToColorIndex(email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return Math.abs(hash) % this.colorPalette.length;
    }

    /**
     * 사용자 색상 정보 가져오기 - 2025.08.19 10:45 생성
     * @param {string} userEmail - 사용자 이메일
     * @returns {object} 색상 정보 { bg, border, index }
     */
    getUserColor(userEmail) {
        const colorIndex = this.getUserColorIndex(userEmail);
        const color = this.colorPalette[colorIndex];
        
        return {
            bg: color.bg,
            border: color.border,
            index: colorIndex
        };
    }

    /**
     * 커스텀 마커 HTML 생성 - 2025.08.19 15:20 수정: 원형 숫자 + 사용자명 형태
     * @param {number} sequenceNumber - 순서 번호
     * @param {object} color - 색상 정보
     * @param {string} userEmail - 사용자 이메일
     * @param {string} userName - 사용자 이름
     * @returns {string} 마커 HTML
     */
    createMarkerHTML(sequenceNumber, color, userEmail, userName = null) {
        // 사용자 이름이 없으면 이메일에서 추출
        if (!userName) {
            userName = userEmail.split('@')[0];
        }
        
        return `
            <div style="
                position: relative;
                background: ${color.bg};
                border: 2px solid white;
                border-radius: 18px;
                padding: 6px 8px 6px 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: bold;
                font-size: 13px;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            " 
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.5)'" 
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 10px rgba(0,0,0,0.4)'"
            data-user-email="${userEmail}"
            data-sequence="${sequenceNumber}">
                <!-- 사용자명 -->
                <span style="font-size: 12px;">${userName}</span>
                
                <!-- 원형 숫자 -->
                <div style="
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 11px;
                    color: ${color.bg};
                    text-shadow: none;
                ">
                    ${sequenceNumber}
                </div>
            </div>
        `;
    }

    /**
     * 사용자의 GPS 마커 생성 - 2025.08.19 15:05 수정: 사용자명 전달
     * @param {string} userEmail - 사용자 이메일
     * @param {Array} gpsData - 처리된 GPS 데이터 배열
     * @returns {Array} 생성된 마커 배열
     */
    createUserMarkers(userEmail, gpsData) {
        if (!this.currentMap) {
            console.error('❌ 지도 인스턴스가 설정되지 않았습니다.');
            return [];
        }

        if (!Array.isArray(gpsData) || gpsData.length === 0) {
            console.log(`📍 GPS 데이터가 없음: ${userEmail}`);
            return [];
        }

        // 기존 마커 제거
        this.removeUserMarkers(userEmail);

        const userColor = this.getUserColor(userEmail);
        const userMarkers = [];

        // 사용자 이름 가져오기
        let userName = userEmail.split('@')[0]; // 기본값
        try {
            if (window.organizationManager) {
                const userInfo = window.organizationManager.findMemberByEmail(userEmail);
                userName = userInfo?.name || userName;
            }
        } catch (error) {
            console.warn('사용자 정보 가져오기 실패:', error);
        }

        console.log(`🗺️ ${userEmail}(${userName})의 마커 생성 시작: ${gpsData.length}개 포인트`);

        gpsData.forEach((gpsPoint, index) => {
            try {
                const position = new naver.maps.LatLng(gpsPoint.latitude, gpsPoint.longitude);
                
                // 커스텀 마커 HTML 생성 (사용자명 포함)
                const markerHTML = this.createMarkerHTML(
                    gpsPoint.sequenceNumber || (index + 1),
                    userColor,
                    userEmail,
                    userName
                );

                // 네이버 지도 마커 생성
                const marker = new naver.maps.Marker({
                    position: position,
                    map: this.currentMap,
                    icon: {
                        content: markerHTML,
                        anchor: new naver.maps.Point(35, 18) // 통합 마커 중심점
                    },
                    title: `${userName} - ${gpsPoint.sequenceNumber || (index + 1)}번째 위치`
                });

                // 마커에 GPS 데이터 저장
                marker.gpsData = gpsPoint;
                marker.userEmail = userEmail;
                marker.userName = userName;
                marker.sequenceNumber = gpsPoint.sequenceNumber || (index + 1);

                // 마커 클릭 이벤트
                naver.maps.Event.addListener(marker, 'click', () => {
                    this.onMarkerClick(marker);
                });

                userMarkers.push(marker);

            } catch (error) {
                console.error(`❌ 마커 생성 실패: ${userEmail}, 포인트 ${index}`, error);
            }
        });

        // 사용자별 마커 저장
        this.markers.set(userEmail, userMarkers);
        
        console.log(`✅ ${userName}의 마커 생성 완료: ${userMarkers.length}개`);
        return userMarkers;
    }

    /**
     * 마커 클릭 이벤트 핸들러 - 2025.08.19 15:25 수정: 간소화된 정보창
     * @param {naver.maps.Marker} marker - 클릭된 마커
     */
    onMarkerClick(marker) {
        const gpsData = marker.gpsData;
        const userName = marker.userName;
        
        console.log(`🖱️ 마커 클릭: ${userName}, 순서 ${marker.sequenceNumber}`);

        // 🔧 간소화된 정보창 내용 (이름 + 시간만)
        const infoContent = `
            <div style="padding: 8px 12px; min-width: 120px; font-family: inherit;">
                <div style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 4px;">
                    ${userName}
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                    기록 시간: ${gpsData.time}
                </div>
            </div>
        `;

        // 기존 정보창 제거
        if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
        }

        // 새 정보창 생성 및 표시
        this.currentInfoWindow = new naver.maps.InfoWindow({
            content: infoContent,
            borderWidth: 1,
            borderColor: '#d1d5db',
            backgroundColor: '#ffffff',
            anchorSize: new naver.maps.Size(10, 10),
            pixelOffset: new naver.maps.Point(0, -10)
        });

        this.currentInfoWindow.open(this.currentMap, marker);
    }

    /**
     * 특정 사용자의 마커 제거 - 2025.08.19 11:05 생성
     * @param {string} userEmail - 사용자 이메일
     */
    removeUserMarkers(userEmail) {
        if (this.markers.has(userEmail)) {
            const userMarkers = this.markers.get(userEmail);
            userMarkers.forEach(marker => {
                marker.setMap(null);
            });
            this.markers.delete(userEmail);
            console.log(`🗑️ ${userEmail}의 마커 제거됨`);
        }
    }

    /**
     * 모든 마커 제거 - 2025.08.19 11:05 생성
     */
    removeAllMarkers() {
        this.markers.forEach((userMarkers, userEmail) => {
            userMarkers.forEach(marker => {
                marker.setMap(null);
            });
        });
        this.markers.clear();
        
        // 정보창도 닫기
        if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
            this.currentInfoWindow = null;
        }
        
        console.log('🗑️ 모든 GPS 마커 제거됨');
    }

    /**
     * 사용자별 마커 표시/숨김 토글 - 2025.08.19 11:10 생성
     * @param {string} userEmail - 사용자 이메일
     * @param {boolean} visible - 표시 여부
     */
    toggleUserMarkers(userEmail, visible) {
        if (this.markers.has(userEmail)) {
            const userMarkers = this.markers.get(userEmail);
            userMarkers.forEach(marker => {
                marker.setMap(visible ? this.currentMap : null);
            });
            console.log(`👁️ ${userEmail} 마커 ${visible ? '표시' : '숨김'}`);
        }
    }

    /**
     * 활성 마커 정보 가져오기 - 2025.08.19 11:10 생성
     * @returns {object} 활성 마커 통계
     */
    getActiveMarkersInfo() {
        const info = {
            totalUsers: this.markers.size,
            totalMarkers: 0,
            userDetails: []
        };

        this.markers.forEach((userMarkers, userEmail) => {
            const visibleMarkers = userMarkers.filter(marker => marker.getMap() !== null);
            info.totalMarkers += visibleMarkers.length;
            
            if (visibleMarkers.length > 0) {
                const userColor = this.getUserColor(userEmail);
                info.userDetails.push({
                    email: userEmail,
                    markerCount: visibleMarkers.length,
                    colorIndex: userColor.index,
                    colorHex: userColor.bg
                });
            }
        });

        return info;
    }

    /**
     * 지도 범위를 모든 마커에 맞게 조정 - 2025.08.19 11:15 생성
     */
    fitMapToMarkers() {
        if (!this.currentMap) return;

        const allPositions = [];
        
        this.markers.forEach((userMarkers) => {
            userMarkers.forEach(marker => {
                if (marker.getMap() !== null) { // 표시된 마커만
                    allPositions.push(marker.getPosition());
                }
            });
        });

        if (allPositions.length === 0) {
            console.log('📍 표시할 마커가 없음');
            return;
        }

        if (allPositions.length === 1) {
            // 마커가 하나뿐이면 해당 위치로 이동
            this.currentMap.setCenter(allPositions[0]);
            this.currentMap.setZoom(16);
        } else {
            // 여러 마커가 있으면 모든 마커가 보이도록 범위 조정
            const bounds = new naver.maps.LatLngBounds();
            allPositions.forEach(position => {
                bounds.extend(position);
            });
            this.currentMap.fitBounds(bounds);
        }

        console.log(`🗺️ 지도 범위 조정 완료: ${allPositions.length}개 마커`);
    }

    /**
     * 색상 범례 정보 생성 - 2025.08.19 11:20 생성
     * @returns {Array} 사용자별 색상 범례 배열
     */
    createColorLegend() {
        const legend = [];
        
        this.markers.forEach((userMarkers, userEmail) => {
            if (userMarkers.length > 0) {
                const userColor = this.getUserColor(userEmail);
                let userName = userEmail;
                
                // 사용자명 가져오기
                try {
                    if (window.organizationManager) {
                        const userInfo = window.organizationManager.findMemberByEmail(userEmail);
                        userName = userInfo?.name || userEmail;
                    }
                } catch (error) {
                    console.warn('사용자 정보 가져오기 실패:', error);
                }
                
                legend.push({
                    email: userEmail,
                    name: userName,
                    color: userColor.bg,
                    borderColor: userColor.border,
                    markerCount: userMarkers.length,
                    visible: userMarkers.some(marker => marker.getMap() !== null)
                });
            }
        });
        
        return legend.sort((a, b) => a.name.localeCompare(b.name));
    }
}

// 전역 인스턴스 생성
const gpsMarkerManager = new GpsMarkerManager();

// 전역 접근 가능하도록 설정
window.gpsMarkerManager = gpsMarkerManager;

console.log('📦 gps-marker-manager.js 로드 완료 - 2025.08.19 11:25');