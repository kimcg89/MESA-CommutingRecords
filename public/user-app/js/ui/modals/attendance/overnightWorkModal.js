// overnightWorkModal.js - 철야/퇴근 선택 모달 (2025년 8월 26일 기존 구조 활용)

function showOvernightWorkModal() {
  return new Promise((resolve) => {
    // 기존 notice 모달의 정확한 구조 활용
    if (typeof window.ModalModule?.showNoticeModal === 'function') {
      
      // 임시 메시지로 모달 표시
      window.ModalModule.showNoticeModal("로딩 중...");
      
      // DOM이 생성된 후 내용 교체
      setTimeout(() => {
        const noticeMessage = document.getElementById('notice-message');
        
        if (noticeMessage) {
          // notice-message 요소의 내용만 교체 (기존 구조 유지)
          noticeMessage.innerHTML = `
            <div style="display: block; text-align: center; padding: 10px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: bold;">전날 퇴근기록이 없습니다</h3>
              <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">퇴근 유형을 선택해주세요</p>
              
              <div style="display: flex !important; gap: 15px; justify-content: center; margin-top: 20px;">
                <button id="overnightWorkBtnCustom" style="
                  display: flex !important;
                  flex-direction: column;
                  align-items: center;
                  padding: 15px 20px;
                  border: 2px solid #5B7CD1;
                  border-radius: 8px;
                  background: white;
                  color: #5B7CD1;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-family: inherit;
                  min-width: 100px;
                ">
                  <span style="font-size: 20px; margin-bottom: 5px;">🌙</span>
                  <span style="font-weight: bold; font-size: 14px; margin-bottom: 3px;">철야</span>
                  <span style="font-size: 10px; opacity: 0.8; text-align: center; line-height: 1.2;">전날 출근의<br>연장</span>
                </button>
                
                <button id="regularClockOutBtnCustom" style="
                  display: flex !important;
                  flex-direction: column;
                  align-items: center;
                  padding: 15px 20px;
                  border: 2px solid #4CAF50;
                  border-radius: 8px;
                  background: white;
                  color: #4CAF50;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-family: inherit;
                  min-width: 100px;
                ">
                  <span style="font-size: 20px; margin-bottom: 5px;">🏠</span>
                  <span style="font-weight: bold; font-size: 14px; margin-bottom: 3px;">퇴근</span>
                  <span style="font-size: 10px; opacity: 0.8; text-align: center; line-height: 1.2;">새로운 퇴근<br>기록</span>
                </button>
              </div>
            </div>
          `;
          
          // 호버 효과 추가
          const overnightBtn = document.getElementById('overnightWorkBtnCustom');
          const regularBtn = document.getElementById('regularClockOutBtnCustom');
          
          if (overnightBtn) {
            overnightBtn.addEventListener('mouseenter', () => {
              overnightBtn.style.background = '#f8f9ff';
              overnightBtn.style.transform = 'translateY(-2px)';
              overnightBtn.style.boxShadow = '0 4px 12px rgba(91, 124, 209, 0.3)';
            });
            overnightBtn.addEventListener('mouseleave', () => {
              overnightBtn.style.background = 'white';
              overnightBtn.style.transform = 'translateY(0)';
              overnightBtn.style.boxShadow = 'none';
            });
            overnightBtn.addEventListener('click', () => {
              window.ModalModule.closeModal();
              resolve('overnight');
            });
          }
          
          if (regularBtn) {
            regularBtn.addEventListener('mouseenter', () => {
              regularBtn.style.background = '#f8fff8';
              regularBtn.style.transform = 'translateY(-2px)';
              regularBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            });
            regularBtn.addEventListener('mouseleave', () => {
              regularBtn.style.background = 'white';
              regularBtn.style.transform = 'translateY(0)';
              regularBtn.style.boxShadow = 'none';
            });
            regularBtn.addEventListener('click', () => {
              window.ModalModule.closeModal();
              resolve('regular');
            });
          }
        }
      }, 100);
      
    } else {
      // fallback
      const isOvernight = confirm("전날 퇴근기록이 없습니다.\n\n확인: 철야근무\n취소: 새로운 퇴근");
      resolve(isOvernight ? 'overnight' : 'regular');
    }
  });
}

// 전역 모듈로 내보내기
window.OvernightWorkModal = {
  showOvernightWorkModal
};