// public/js/config/firebase-api.js
// Firebase API 통합 버전 (2025년 8월 6일 생성됨)
// firebase-api-hybrid.js를 대체 - 직접 Firestore 접근 방식
// 로컬 개발과 배포 환경 모두 지원

window.FirebaseAPI = {
  // 인증 토큰 가져오기
  async getAuthToken() {
    if (firebase.auth().currentUser) {
      return await firebase.auth().currentUser.getIdToken();
    }
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  },

  // 현재 사용자 이메일 가져오기
  getCurrentUserEmail() {
    const user = firebase.auth().currentUser;
    return user ? user.email : null;
  },

  // 출퇴근 기록 조회 - 직접 Firestore 접근 (2025년 8월 6일 수정됨)
  async getRecords(date = null) {
    console.log('📊 Firestore에서 기록 조회');
    const userEmail = this.getCurrentUserEmail();
    if (!userEmail) throw new Error('로그인이 필요합니다.');

    try {
      const recordRef = firebase.firestore().collection('records').doc(userEmail);
      
      if (date) {
        const dateDoc = await recordRef.collection('dates').doc(date).get();
        return dateDoc.exists ? dateDoc.data() : null;
      } else {
        const snapshot = await recordRef.collection('dates').get();
        const records = {};
        snapshot.forEach(doc => {
          records[doc.id] = doc.data();
        });
        return records;
      }
    } catch (error) {
      console.error('❌ 기록 조회 오류:', error);
      throw error;
    }
  },

  // 출퇴근 기록 저장 - 직접 Firestore 접근 (2025년 8월 6일 수정됨)
  async saveRecord(date, data) {
    console.log('💾 Firestore에 기록 저장');
    const userEmail = this.getCurrentUserEmail();
    if (!userEmail) throw new Error('로그인이 필요합니다.');

    try {
      await firebase.firestore()
        .collection('records')
        .doc(userEmail)
        .collection('dates')
        .doc(date)
        .set(data, { merge: true });
      
      return { success: true, message: '기록이 저장되었습니다.' };
    } catch (error) {
      console.error('❌ 기록 저장 오류:', error);
      throw error;
    }
  },

  // 출퇴근 등록
  async recordAttendance(type, timestamp, location = null) {
    const today = new Date().toISOString().split('T')[0];
    const attendanceData = {
      [type]: {
        timestamp: timestamp,
        location: location || null,
        recordedAt: new Date().toISOString()
      }
    };

    return await this.saveRecord(today, attendanceData);
  },

  // 기록 삭제 (추가 기능)
  async deleteRecord(date) {
    console.log('🗑️ Firestore에서 기록 삭제');
    const userEmail = this.getCurrentUserEmail();
    if (!userEmail) throw new Error('로그인이 필요합니다.');

    try {
      await firebase.firestore()
        .collection('records')
        .doc(userEmail)
        .collection('dates')
        .doc(date)
        .delete();
      
      return { success: true, message: '기록이 삭제되었습니다.' };
    } catch (error) {
      console.error('❌ 기록 삭제 오류:', error);
      throw error;
    }
  }
};

console.log('✅ Firebase API 로드 완료 (통합 버전)');