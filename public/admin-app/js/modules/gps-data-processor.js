// GPS 데이터 처리 모듈 - 2025.08.19 10:00 생성
// Firebase에서 GPS 데이터를 가져와서 시간 순서대로 정렬하고 처리

/**
 * GPS 데이터 처리 클래스
 * Firebase에서 사용자별 GPS 데이터를 로드하고 시간순 정렬
 */
class GpsDataProcessor {
    constructor() {
        this.isInitialized = false;
        this.cachedGpsData = new Map(); // userEmail -> gpsData[]
        
        console.log('📍 GpsDataProcessor 생성 - 2025.08.19 10:00');
    }

    /**
     * 초기화 - 2025.08.19 10:00 생성
     */
    async init() {
        try {
            await this.waitForFirebase();
            this.isInitialized = true;
            console.log('✅ GpsDataProcessor 초기화 완료');
        } catch (error) {
            console.error('❌ GpsDataProcessor 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * Firebase 초기화 대기 - 2025.08.19 10:00 생성
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseFirestore) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    /**
     * 특정 날짜의 사용자 GPS 데이터 로드 - 2025.08.19 14:40 수정: 디버깅 강화
     * @param {string} userEmail - 사용자 이메일
     * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD)
     * @returns {Array} 시간순 정렬된 GPS 데이터 배열
     */
    async loadUserGpsData(userEmail, dateString) {
        if (!this.isInitialized) {
            console.error('❌ GpsDataProcessor가 초기화되지 않았습니다.');
            return [];
        }

        const cacheKey = `${userEmail}_${dateString}`;
        
        // 캐시에서 먼저 확인
        if (this.cachedGpsData.has(cacheKey)) {
            console.log(`📦 캐시에서 GPS 데이터 반환: ${userEmail}, ${dateString}`);
            return this.cachedGpsData.get(cacheKey);
        }

        try {
            console.log(`🔍 Firebase에서 GPS 데이터 로드: ${userEmail}, ${dateString}`);
            
            const docPath = `records/${userEmail}/dates/${dateString}`;
            console.log(`📄 문서 경로: ${docPath}`);
            
            const docRef = window.firebaseFirestore
                .collection('records')
                .doc(userEmail)
                .collection('dates')
                .doc(dateString);

            const doc = await docRef.get();
            
            if (!doc.exists) {
                console.log(`📭 GPS 데이터 없음: ${userEmail}, ${dateString}`);
                this.cachedGpsData.set(cacheKey, []);
                return [];
            }

            const data = doc.data();
            console.log(`📊 원본 문서 데이터:`, data);
            
            // 🆕 2025.08.19 15:10 추가: start, gps, end 배열을 모두 합치기
            let allGpsData = [];
            
            // start 배열 추가 (출근 데이터)
            if (Array.isArray(data.start) && data.start.length > 0) {
                const startData = data.start.map(item => ({
                    ...item,
                    dataType: 'start' // 데이터 유형 표시
                }));
                allGpsData = allGpsData.concat(startData);
                console.log(`📍 start 배열 추가: ${startData.length}개`);
            }
            
            // gps 배열 추가 (중간 GPS 데이터)
            if (Array.isArray(data.gps) && data.gps.length > 0) {
                const gpsData = data.gps.map(item => ({
                    ...item,
                    dataType: 'gps' // 데이터 유형 표시
                }));
                allGpsData = allGpsData.concat(gpsData);
                console.log(`📍 gps 배열 추가: ${gpsData.length}개`);
            }
            
            // end 배열 추가 (퇴근 데이터)
            if (Array.isArray(data.end) && data.end.length > 0) {
                const endData = data.end.map(item => ({
                    ...item,
                    dataType: 'end' // 데이터 유형 표시
                }));
                allGpsData = allGpsData.concat(endData);
                console.log(`📍 end 배열 추가: ${endData.length}개`);
            }
            
            console.log(`📍 전체 GPS 배열 크기: ${allGpsData.length} (start + gps + end)`);
            
            if (allGpsData.length === 0) {
                console.log(`📍 모든 GPS 배열이 비어있음: ${userEmail}, ${dateString}`);
                this.cachedGpsData.set(cacheKey, []);
                return [];
            }

            // 첫 번째와 마지막 GPS 항목 로그
            console.log(`🔍 첫 번째 GPS 항목 (${allGpsData[0].dataType}):`, allGpsData[0]);
            if (allGpsData.length > 1) {
                console.log(`🔍 마지막 GPS 항목 (${allGpsData[allGpsData.length - 1].dataType}):`, allGpsData[allGpsData.length - 1]);
            }

            // GPS 데이터 시간순 정렬 및 처리
            const processedGpsData = this.processGpsData(allGpsData, userEmail);
            
            // 캐시에 저장
            this.cachedGpsData.set(cacheKey, processedGpsData);
            
            console.log(`✅ GPS 데이터 로드 완료: ${userEmail}, ${processedGpsData.length}개 포인트`);
            return processedGpsData;

        } catch (error) {
            console.error(`❌ GPS 데이터 로드 실패: ${userEmail}, ${dateString}`, error);
            return [];
        }
    }

    /**
     * GPS 데이터 처리 및 정렬 - 2025.08.19 15:15 수정: 데이터 유형 표시
     * @param {Array} gpsArray - 원본 GPS 배열 (start + gps + end)
     * @param {string} userEmail - 사용자 이메일
     * @returns {Array} 처리된 GPS 데이터
     */
    processGpsData(gpsArray, userEmail) {
        return gpsArray
            .map((gpsItem, index) => {
                // GPS 데이터 구조 표준화
                const processedItem = {
                    originalIndex: index,
                    time: gpsItem.time || '',
                    gps: gpsItem.gps || '',
                    address: gpsItem.address || '',
                    memo: gpsItem.memo || {},
                    dataType: gpsItem.dataType || 'unknown', // 🆕 데이터 유형 (start/gps/end)
                    userEmail: userEmail
                };

                // GPS 좌표 파싱 - 2025.08.19 14:50 수정: 다양한 형식 지원
                if (processedItem.gps && typeof processedItem.gps === 'string') {
                    let lat, lng;
                    
                    // 형식 1: "위도: 37.536307, 경도: 126.894888" (한글 형식)
                    if (processedItem.gps.includes('위도:') && processedItem.gps.includes('경도:')) {
                        const latMatch = processedItem.gps.match(/위도:\s*([-+]?\d+\.?\d*)/);
                        const lngMatch = processedItem.gps.match(/경도:\s*([-+]?\d+\.?\d*)/);
                        
                        if (latMatch && lngMatch) {
                            lat = parseFloat(latMatch[1]);
                            lng = parseFloat(lngMatch[1]);
                            console.log(`📍 한글 형식 GPS 파싱 (${processedItem.dataType}): 위도=${lat}, 경도=${lng}`);
                        }
                    }
                    // 형식 2: "37.536307,126.894888" (기본 형식)
                    else if (processedItem.gps.includes(',')) {
                        const coords = processedItem.gps.split(',').map(coord => parseFloat(coord.trim()));
                        if (coords.length === 2) {
                            lat = coords[0];
                            lng = coords[1];
                            console.log(`📍 기본 형식 GPS 파싱 (${processedItem.dataType}): 위도=${lat}, 경도=${lng}`);
                        }
                    }
                    
                    // 파싱 결과 검증
                    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        processedItem.latitude = lat;
                        processedItem.longitude = lng;
                        processedItem.isValidCoordinate = true;
                        console.log(`✅ 유효한 GPS 좌표 (${processedItem.dataType}): ${lat}, ${lng}`);
                    } else {
                        processedItem.isValidCoordinate = false;
                        console.warn(`⚠️ 잘못된 GPS 좌표 (${processedItem.dataType}): ${processedItem.gps} -> lat=${lat}, lng=${lng}`);
                    }
                } else {
                    processedItem.isValidCoordinate = false;
                    console.warn(`⚠️ GPS 좌표가 문자열이 아님 (${processedItem.dataType}):`, processedItem.gps);
                }

                // 시간 파싱 및 정렬용 타임스탬프 생성
                processedItem.timestamp = this.parseTimeToTimestamp(processedItem.time);

                return processedItem;
            })
            .filter(item => item.isValidCoordinate) // 유효한 좌표만 필터링
            .sort((a, b) => a.timestamp - b.timestamp) // 시간순 정렬
            .map((item, index) => ({
                ...item,
                sequenceNumber: index + 1 // 1부터 시작하는 순서 번호
            }));
    }

    /**
     * 시간 문자열을 타임스탬프로 변환 - 2025.08.19 10:15 생성
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
            
            return isNaN(timestamp) ? 0 : timestamp;
        } catch (error) {
            console.warn(`⚠️ 시간 파싱 실패: ${timeString}`, error);
            return 0;
        }
    }

    /**
     * 여러 사용자의 GPS 데이터 동시 로드 - 2025.08.19 10:20 생성
     * @param {Array} userEmails - 사용자 이메일 배열
     * @param {string} dateString - 날짜 문자열
     * @returns {Map} userEmail -> gpsData[] 맵
     */
    async loadMultipleUsersGpsData(userEmails, dateString) {
        console.log(`🔄 다중 사용자 GPS 데이터 로드: ${userEmails.length}명, ${dateString}`);
        
        const results = new Map();
        
        // 병렬로 모든 사용자 데이터 로드
        const loadPromises = userEmails.map(async (email) => {
            const gpsData = await this.loadUserGpsData(email, dateString);
            return { email, gpsData };
        });

        try {
            const loadResults = await Promise.all(loadPromises);
            
            loadResults.forEach(({ email, gpsData }) => {
                if (gpsData.length > 0) {
                    results.set(email, gpsData);
                }
            });

            console.log(`✅ 다중 사용자 GPS 로드 완료: ${results.size}명의 데이터`);
            return results;

        } catch (error) {
            console.error('❌ 다중 사용자 GPS 로드 실패:', error);
            return results;
        }
    }

    /**
     * 캐시 클리어 - 2025.08.19 10:25 생성
     * @param {string} userEmail - 특정 사용자만 클리어 (선택사항)
     */
    clearCache(userEmail = null) {
        if (userEmail) {
            // 특정 사용자의 캐시만 클리어
            const keysToDelete = Array.from(this.cachedGpsData.keys())
                .filter(key => key.startsWith(`${userEmail}_`));
            
            keysToDelete.forEach(key => {
                this.cachedGpsData.delete(key);
            });
            
            console.log(`🗑️ ${userEmail}의 GPS 캐시 클리어됨`);
        } else {
            // 전체 캐시 클리어
            this.cachedGpsData.clear();
            console.log('🗑️ 전체 GPS 캐시 클리어됨');
        }
    }

    /**
     * 초기화 상태 확인 - 2025.08.19 10:25 생성
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 캐시 상태 정보 - 2025.08.19 10:25 생성
     */
    getCacheInfo() {
        return {
            totalCachedItems: this.cachedGpsData.size,
            cachedKeys: Array.from(this.cachedGpsData.keys())
        };
    }
}

// 전역 인스턴스 생성
const gpsDataProcessor = new GpsDataProcessor();

// 전역 접근 가능하도록 설정
window.gpsDataProcessor = gpsDataProcessor;

console.log('📦 gps-data-processor.js 로드 완료 - 2025.08.19 10:30');