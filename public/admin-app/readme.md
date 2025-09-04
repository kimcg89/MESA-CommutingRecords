admin-app/
├── index.html                          # 메인 HTML 파일
├── admin-firebase.js                   # Firebase 통합 관리 모듈
├── css/
│   ├── base.css                       # 기본 CSS 변수 및 스타일
│   ├── components.css                 # 공통 컴포넌트 스타일
│   ├── layout.css                     # 레이아웃 스타일
│   ├── organization.css               # 조직도 전용 스타일
│   ├── responsive.css                 # 반응형 디자인
│   └── worktime.css                   # 출퇴근 현황 스타일
└── js/
    ├── app.js                         # 메인 애플리케이션 진입점
    ├── config/
    │   ├── admin-config.js            # 관리자 설정 및 상수
    │   ├── firebase-api-config.dev.js # 개발용 Firebase 설정
    │   ├── firebase-api-config.js     # 배포용 Firebase 설정
    │   ├── firebase-config.js         # Firebase 초기화 설정
    │   └── naver-api-config.js        # 네이버 API 설정
    ├── modules/
    │   ├── admin-auth.js              # 관리자 인증 모듈
    │   ├── auth-utils.js              # 인증 유틸리티
    │   └── org-manager.js             # 조직 관리 핵심 모듈
    └── ui/
        ├── admin-panels.js            # 관리자 패널 관리
        ├── event-handlers.js          # 이벤트 핸들러 관리
        └── modal-manager.js           # 모달 관리

        📋 파일별 상세 스키마
🏗️ Core Application Files
index.html

역할: 메인 HTML 구조
주요 섹션:

사이드바 (조직도, 네비게이션)
메인 컨텐츠 (출퇴근 현황 대시보드)
통계 카드, 차트, GPS 지도


의존성: CSS, Firebase SDK, 네이버 지도 API

app.js

클래스: AdminApp
주요 메서드:

initialize(): 애플리케이션 초기화
initializeFirebase(): Firebase 초기화
initializeUI(): UI 초기화
setupEventListeners(): 이벤트 리스너 설정



🔧 Configuration Files
admin-config.js

상수 객체들:

ADMIN_CONFIG: 권한 설정, 메뉴 설정
ERROR_MESSAGES: 에러 메시지 상수
SUCCESS_MESSAGES: 성공 메시지 상수
STATS_CONFIG: 통계 설정


유틸리티: AdminUtils 클래스

firebase-config.js

클래스: FirebaseInitializer
주요 메서드:

initialize(): Firebase 서비스 초기화
isInitialized(): 초기화 상태 확인



🔐 Authentication & Authorization
admin-auth.js

클래스: AdminAuthManager
주요 메서드:

init(): 인증 시스템 초기화
handleUserLogin(): 사용자 로그인 처리
showLoginModal(): 로그인 모달 표시
isAdminUser(): 관리자 권한 체크



auth-utils.js

클래스: AuthUtils
주요 메서드:

requireAuth(): 로그인 확인
requireAdminAuth(): 관리자 권한 확인
canAccessUserData(): 데이터 접근 권한 체크
checkPasswordStrength(): 비밀번호 강도 체크



🏢 Organization Management
org-manager.js

클래스: OrganizationManager
주요 메서드:

loadOrganizationData(): 조직도 데이터 로드
groupByDepartment(): 부서별 그룹화
toggleMemberFilter(): 멤버 필터 토글
canViewMemberData(): 멤버 데이터 접근 권한



🎨 UI Management
modal-manager.js

클래스: ModalManager
주요 메서드:

open(): 모달 열기
close(): 모달 닫기
confirm(): 확인 대화상자
alert(): 알림 대화상자



admin-panels.js

클래스: AdminPanelManager
주요 메서드:

showAdminPanel(): 패널 전환
updateActiveMenu(): 활성 메뉴 상태 업데이트
setupKeyboardShortcuts(): 키보드 단축키 설정



event-handlers.js

클래스: AdminEventManager
주요 메서드:

setupGlobalEvents(): 전역 이벤트 설정
handleResize(): 윈도우 리사이즈 처리
handleGlobalError(): 전역 에러 처리



🎨 CSS Architecture
base.css

CSS 변수 정의
기본 리셋 및 스타일
로딩 상태 스타일

layout.css

사이드바 스타일
메인 컨텐츠 레이아웃
네비게이션 스타일

components.css

버튼 스타일
폼 스타일
검색 박스 스타일
필터 상태 표시

organization.css

부서 헤더 스타일
멤버 아이템 스타일
사용자 아바타 및 배지
필터링 관련 스타일

worktime.css

출퇴근 현황 전용 스타일
필터 컨트롤
통계 카드
GPS 섹션 및 지도

🔄 Legacy Integration
admin-firebase.js

주요 객체들:

firebaseAuthManager: 인증 관리
firebaseOrgManager: 조직도 관리
firebaseDataManager: 데이터 관리
adminUtils: 관리자 유틸리티


기능: 기존 코드와의 호환성 유지

🔗 주요 의존성 관계
app.js (메인)
├── firebase-config.js → Firebase 초기화
├── admin-auth.js → 인증 관리
├── org-manager.js → 조직 관리
├── modal-manager.js → UI 모달
├── admin-panels.js → 패널 관리
└── event-handlers.js → 이벤트 관리

CSS 계층:
base.css (기본) → layout.css → components.css → organization.css/worktime.css