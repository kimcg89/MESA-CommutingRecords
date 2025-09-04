// functions/generate-config.js
// 개발/배포 설정 파일 모두 생성 (2025년 8월 18일 수정됨)
// admin-app 지원 추가

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 개발용 설정 파일 생성
function generateDevConfig() {
  const firebaseConfig = {
    apiKey: process.env.MY_FIREBASE_API_KEY,
    authDomain: process.env.MY_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.MY_FIREBASE_PROJECT_ID,
    storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.MY_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.MY_FIREBASE_APP_ID
  };

  const devConfigContent = `// public/user-app/js/config/firebase-api-config.dev.js
// 개발용 Firebase 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}
// 이 파일은 .env에서 자동 생성됩니다.

console.log('🔧 개발 모드: Firebase 설정을 로드합니다.');
console.log('📍 현재 URL:', window.location.href);

// 개발용 Firebase 설정 (.env 파일에서 생성됨)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// 전역 변수로 설정
window.firebaseConfig = firebaseConfig;

console.log('✅ Firebase 설정 로드 완료 (개발 모드)');
`;

  const devPath = path.join(__dirname, '../public/user-app/js/config/firebase-api-config.dev.js');
  const devDir = path.dirname(devPath);

  if (!fs.existsSync(devDir)) {
    fs.mkdirSync(devDir, { recursive: true });
  }

  fs.writeFileSync(devPath, devConfigContent, 'utf8');
  console.log('✅ 개발용 설정 파일 생성:', devPath);
}

// 배포용 설정 파일 생성 (dist 폴더용)
function generateProdConfig() {
  const firebaseConfig = {
    apiKey: process.env.MY_FIREBASE_API_KEY,
    authDomain: process.env.MY_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.MY_FIREBASE_PROJECT_ID,
    storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.MY_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.MY_FIREBASE_APP_ID
  };

  const prodConfigContent = `// dist/user-app/js/config/firebase-api-config.js
// 배포용 Firebase 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}
// 이 파일은 .env에서 자동 생성됩니다.

console.log('🚀 배포 모드: Firebase 설정을 로드합니다.');
console.log('📍 현재 URL:', window.location.href);

// Firebase 설정 (.env 파일에서 생성됨)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// 전역 변수로 설정
window.firebaseConfig = firebaseConfig;

console.log('✅ Firebase 설정 로드 완료 (배포 모드)');
`;

  // 개발용과 배포용 두 곳에 모두 생성
  const paths = [
    path.join(__dirname, '../public/user-app/js/config/firebase-api-config.js'),
    path.join(__dirname, '../dist/user-app/js/config/firebase-api-config.js')
  ];

  paths.forEach(prodPath => {
    const prodDir = path.dirname(prodPath);

    if (!fs.existsSync(prodDir)) {
      fs.mkdirSync(prodDir, { recursive: true });
    }

    fs.writeFileSync(prodPath, prodConfigContent, 'utf8');
    console.log('✅ 배포용 설정 파일 생성:', prodPath);
  });
}

// 네이버 설정 파일 생성
function generateNaverConfig() {
  const naverClientId = process.env.NAVER_CLIENT_ID;
  
  if (!naverClientId) {
    console.warn('⚠️ NAVER_CLIENT_ID가 설정되지 않았습니다.');
    return;
  }

  const naverConfigContent = `// public/user-app/js/config/naver-api-config.js
// 네이버 API 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}

const naverAPIConfig = {
  ncpClientID: "${naverClientId}",
  
  checkAPILoaded: function() {
    if (typeof naver !== 'undefined' && naver.maps && naver.maps.Service) {
      console.log('✅ 네이버 지도 API 로드 완료');
      return true;
    } else {
      console.log('⏳ 네이버 지도 API 로드 대기 중...');
      return false;
    }
  },
  
  testGeocode: async function(lat = 37.5665, lng = 126.978) {
    if (!this.checkAPILoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다');
      return;
    }
    
    return new Promise((resolve, reject) => {
      naver.maps.Service.reverseGeocode({
        coords: new naver.maps.LatLng(lat, lng),
        orders: [
          naver.maps.Service.OrderType.ROAD_ADDR,
          naver.maps.Service.OrderType.ADDR
        ].join(',')
      }, function(status, response) {
        if (status !== naver.maps.Service.Status.OK) {
          reject(new Error('지오코딩 실패'));
          return;
        }
        
        const result = response.v2;
        let address = '';
        if (result.roadAddress) {
          address = result.roadAddress;
        } else if (result.address) {
          address = result.address.jibunAddress || result.address.roadAddress || '';
        }
        
        resolve(address);
      });
    });
  }
};

window.naverAPIConfig = naverAPIConfig;

window.addEventListener('load', () => {
  setTimeout(() => {
    naverAPIConfig.checkAPILoaded();
  }, 1000);
});

console.log('✅ 네이버 API 설정 로드 완료');
`;

  // 개발용과 배포용 두 곳에 모두 생성
  const paths = [
    path.join(__dirname, '../public/user-app/js/config/naver-api-config.js'),
    path.join(__dirname, '../dist/user-app/js/config/naver-api-config.js')
  ];

  paths.forEach(naverPath => {
    const naverDir = path.dirname(naverPath);

    if (!fs.existsSync(naverDir)) {
      fs.mkdirSync(naverDir, { recursive: true });
    }

    fs.writeFileSync(naverPath, naverConfigContent, 'utf8');
    console.log('✅ 네이버 API 설정 파일 생성:', naverPath);
  });
}

// 2025.08.18 신규: admin-app용 개발 설정 파일 생성
function generateAdminDevConfig() {
  const firebaseConfig = {
    apiKey: process.env.MY_FIREBASE_API_KEY,
    authDomain: process.env.MY_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.MY_FIREBASE_PROJECT_ID,
    storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.MY_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.MY_FIREBASE_APP_ID
  };

  const adminDevConfigContent = `// public/admin-app/js/config/firebase-api-config.dev.js
// 관리자 앱 개발용 Firebase 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}
// 이 파일은 .env에서 자동 생성됩니다.

console.log('👑 관리자 개발 모드: Firebase 설정을 로드합니다.');
console.log('📍 현재 URL:', window.location.href);

// 관리자 앱 개발용 Firebase 설정 (.env 파일에서 생성됨)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// 전역 변수로 설정 (기존 호환성 유지)
window.firebaseConfig = firebaseConfig;

console.log('✅ 관리자 Firebase 설정 로드 완료 (개발 모드)');
`;

  const adminDevPath = path.join(__dirname, '../public/admin-app/js/config/firebase-api-config.dev.js');
  const adminDevDir = path.dirname(adminDevPath);

  if (!fs.existsSync(adminDevDir)) {
    fs.mkdirSync(adminDevDir, { recursive: true });
  }

  fs.writeFileSync(adminDevPath, adminDevConfigContent, 'utf8');
  console.log('✅ 관리자 개발용 설정 파일 생성:', adminDevPath);
}

// 2025.08.18 신규: admin-app용 배포 설정 파일 생성
function generateAdminProdConfig() {
  const firebaseConfig = {
    apiKey: process.env.MY_FIREBASE_API_KEY,
    authDomain: process.env.MY_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.MY_FIREBASE_PROJECT_ID,
    storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.MY_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.MY_FIREBASE_APP_ID
  };

  const adminProdConfigContent = `// admin-app/js/config/firebase-api-config.js
// 관리자 앱 배포용 Firebase 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}
// 이 파일은 .env에서 자동 생성됩니다.

console.log('👑 관리자 배포 모드: Firebase 설정을 로드합니다.');
console.log('📍 현재 URL:', window.location.href);

// 관리자 앱 배포용 Firebase 설정 (.env 파일에서 생성됨)
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// 전역 변수로 설정 (기존 호환성 유지)
window.firebaseConfig = firebaseConfig;

console.log('✅ 관리자 Firebase 설정 로드 완료 (배포 모드)');
`;

  // 개발용과 배포용 두 곳에 모두 생성
  const paths = [
    path.join(__dirname, '../public/admin-app/js/config/firebase-api-config.js'),
    path.join(__dirname, '../dist/admin-app/js/config/firebase-api-config.js')
  ];

  paths.forEach(adminProdPath => {
    const adminProdDir = path.dirname(adminProdPath);

    if (!fs.existsSync(adminProdDir)) {
      fs.mkdirSync(adminProdDir, { recursive: true });
    }

    fs.writeFileSync(adminProdPath, adminProdConfigContent, 'utf8');
    console.log('✅ 관리자 배포용 설정 파일 생성:', adminProdPath);
  });
}

// 2025.08.18 신규: admin-app용 네이버 설정 파일 생성 (선택적)
function generateAdminNaverConfig() {
  const naverClientId = process.env.NAVER_CLIENT_ID;
  
  if (!naverClientId) {
    console.warn('⚠️ NAVER_CLIENT_ID가 설정되지 않았습니다. 관리자용 네이버 API 설정을 건너뜁니다.');
    return;
  }

  const adminNaverConfigContent = `// public/admin-app/js/config/naver-api-config.js
// 관리자 앱용 네이버 API 설정 - 자동 생성됨
// 생성 시간: ${new Date().toISOString()}

const adminNaverAPIConfig = {
  ncpClientID: "${naverClientId}",
  
  checkAPILoaded: function() {
    if (typeof naver !== 'undefined' && naver.maps && naver.maps.Service) {
      console.log('✅ 관리자용 네이버 지도 API 로드 완료');
      return true;
    } else {
      console.log('⏳ 관리자용 네이버 지도 API 로드 대기 중...');
      return false;
    }
  },
  
  testGeocode: async function(lat = 37.5665, lng = 126.978) {
    if (!this.checkAPILoaded()) {
      console.error('네이버 지도 API가 로드되지 않았습니다');
      return;
    }
    
    console.log(\`👑 관리자 지오코딩 테스트: \${lat}, \${lng}\`);
    
    return new Promise((resolve, reject) => {
      naver.maps.Service.reverseGeocode({
        coords: new naver.maps.LatLng(lat, lng),
        orders: [
          naver.maps.Service.OrderType.ROAD_ADDR,
          naver.maps.Service.OrderType.ADDR
        ].join(',')
      }, function(status, response) {
        if (status !== naver.maps.Service.Status.OK) {
          reject(new Error('지오코딩 실패'));
          return;
        }
        
        const result = response.v2;
        let address = '';
        if (result.roadAddress) {
          address = result.roadAddress;
        } else if (result.address) {
          address = result.address.jibunAddress || result.address.roadAddress || '';
        }
        
        console.log('👑 관리자 변환된 주소:', address);
        resolve(address);
      });
    });
  }
};

window.adminNaverAPIConfig = adminNaverAPIConfig;

window.addEventListener('load', () => {
  setTimeout(() => {
    adminNaverAPIConfig.checkAPILoaded();
  }, 1000);
});

console.log('✅ 관리자용 네이버 API 설정 로드 완료');
`;

  // 개발용과 배포용 두 곳에 모두 생성
  const paths = [
    path.join(__dirname, '../public/admin-app/js/config/naver-api-config.js'),
    path.join(__dirname, '../dist/admin-app/js/config/naver-api-config.js')
  ];

  paths.forEach(adminNaverPath => {
    const adminNaverDir = path.dirname(adminNaverPath);

    if (!fs.existsSync(adminNaverDir)) {
      fs.mkdirSync(adminNaverDir, { recursive: true });
    }

    fs.writeFileSync(adminNaverPath, adminNaverConfigContent, 'utf8');
    console.log('✅ 관리자용 네이버 API 설정 파일 생성:', adminNaverPath);
  });
}

// admin-app용 설정 파일 생성 (기존 코드 호환성 유지) - 2025.12.20 수정: 기존 파일 보호
function generateAdminConfig() {
  // 기존 admin-firebase.js 파일은 건드리지 않음
  // 새로운 API 설정 파일만 생성
  console.log('✅ 관리자용 기존 파일 보호됨 (admin-firebase.js 유지)');
  console.log('💡 새로운 API 설정은 js/config/ 폴더에 생성됩니다.');
}

// 모든 설정 파일 생성 - 2025.08.18 수정: admin-app 지원 추가
function generateAllConfigs() {
  console.log('🔧 모든 설정 파일 생성 시작...');
  
  // 환경변수 확인
  const requiredEnvVars = [
    'MY_FIREBASE_API_KEY',
    'MY_FIREBASE_AUTH_DOMAIN',
    'MY_FIREBASE_PROJECT_ID',
    'MY_FIREBASE_STORAGE_BUCKET',
    'MY_FIREBASE_MESSAGING_SENDER_ID',
    'MY_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missingVars.length > 0) {
    console.error('❌ 필수 환경변수가 없습니다:', missingVars.join(', '));
    console.log('💡 .env 파일을 확인하세요.');
    process.exit(1);
  }
  
  // user-app 설정 생성
  console.log('📱 user-app 설정 파일 생성...');
  generateDevConfig();
  generateProdConfig();
  generateNaverConfig();
  
  // admin-app 설정 생성 - 2025.08.18 신규
  console.log('👑 admin-app 설정 파일 생성...');
  generateAdminDevConfig();
  generateAdminProdConfig();
  generateAdminNaverConfig();
  generateAdminConfig(); // 기존 호환성 유지
  
  console.log('🎉 모든 설정 파일 생성 완료!');
  console.log('📁 생성된 위치:');
  console.log('   - User App: public/user-app/js/config/');
  console.log('   - Admin App: public/admin-app/js/config/ & public/admin-app/admin-firebase.js');
  console.log('   - Dist: dist/user-app/js/config/ & dist/admin-app/');
}

// 스크립트 실행
if (require.main === module) {
  generateAllConfigs();
}

module.exports = { 
  generateDevConfig, 
  generateProdConfig, 
  generateNaverConfig, 
  generateAdminDevConfig,     // 2025.08.18 신규
  generateAdminProdConfig,    // 2025.08.18 신규
  generateAdminNaverConfig,   // 2025.08.18 신규
  generateAdminConfig,
  generateAllConfigs 
};