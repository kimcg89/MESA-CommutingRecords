// scripts/multi-app-build.js
// Firebase 멀티 앱 배포용 빌드 스크립트
const fs = require("fs");
const path = require("path");

// 환경변수에서 Firebase 설정 읽기 (기존 함수 유지)
function getFirebaseConfig() {
  const envPath = path.join(__dirname, "../.env");

  console.log("🔍 환경변수 파일 확인 중...");
  console.log("📁 .env 파일 경로:", envPath);
  console.log("📄 .env 파일 존재:", fs.existsSync(envPath));

  if (fs.existsSync(envPath)) {
    console.log("✅ .env 파일을 찾았습니다.");

    const envContent = fs.readFileSync(envPath, "utf8");
    const envVars = {};
    const lines = envContent.split("\n");

    console.log("🔎 환경변수 파싱 중...");
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const equalIndex = trimmedLine.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          envVars[key] = value;
          console.log(
            `  ${index + 1}: ${key} = ${value ? "***설정됨***" : "빈값"}`
          );
        }
      }
    });

    console.log("📊 파싱된 환경변수 개수:", Object.keys(envVars).length);

    const getEnvValue = (key) => {
      return envVars[`VITE_${key}`] || envVars[key] || null;
    };

    const apiKey = getEnvValue("FIREBASE_API_KEY");

    if (apiKey) {
      console.log("✅ Firebase 환경변수를 사용합니다.");
      const config = {
        apiKey: apiKey,
        authDomain: getEnvValue("FIREBASE_AUTH_DOMAIN"),
        projectId: getEnvValue("FIREBASE_PROJECT_ID"),
        storageBucket: getEnvValue("FIREBASE_STORAGE_BUCKET"),
        messagingSenderId: getEnvValue("FIREBASE_MESSAGING_SENDER_ID"),
        appId: getEnvValue("FIREBASE_APP_ID"),
      };

      console.log("🔧 사용될 Firebase 설정:");
      Object.keys(config).forEach((key) => {
        console.log(`  ${key}: ${config[key] ? "✅ 설정됨" : "❌ 누락"}`);
      });

      return config;
    } else {
      console.log(
        "❌ FIREBASE_API_KEY 또는 VITE_FIREBASE_API_KEY를 찾을 수 없습니다."
      );
      console.log("💡 환경변수 키 목록을 확인해주세요:", Object.keys(envVars));
    }
  } else {
    console.log("❌ .env 파일을 찾을 수 없습니다.");
  }

  // 기본값 설정
  console.log("⚠️  환경변수가 설정되지 않아 기본값을 사용합니다.");
  return {
    apiKey: "AIzaSyAwpv9l2BCJG9H3fIPiCSFG7qFEKf0Kogo",
    authDomain: "fir-commutingrecords.firebaseapp.com",
    projectId: "fir-commutingrecords",
    storageBucket: "fir-commutingrecords.firebasestorage.app",
    messagingSenderId: "979998699838",
    appId: "1:979998699838:web:493aec3ffad98adb99bc6f",
  };
}

// 파일 복사 함수
function copyDirectory(src, dest, excludeFiles = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // 제외할 파일/폴더 확인
    const relativePath = path.relative(src, srcPath).replace(/\\/g, "/");
    const shouldExclude = excludeFiles.some((excludePattern) => {
      return (
        relativePath.includes(excludePattern) ||
        srcPath.includes(excludePattern)
      );
    });

    if (shouldExclude) {
      console.log(`🚫 제외됨: ${relativePath}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, excludeFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Firebase 보안 설정 파일 생성
function createSecureConfig(distDir) {
  const secureConfigContent = [
    "// Firebase 보안 설정 - Functions 방식",
    "// API 키 노출 없이 Functions를 통해 안전하게 데이터 접근",
    "",
    "// Firebase Authentication만 사용 (Firestore는 Functions를 통해 접근)",
    "const firebaseConfig = {",
    '  apiKey: "AIzaSyDKGe_Asc5qezw3-QIpgF7VkdGikodqk5w", // 인증용으로만 사용',
    '  authDomain: "mesa-commutingrecords.firebaseapp.com",',
    '  projectId: "mesa-commutingrecords"',
    "};",
    "",
    "// 전역 변수로 설정",
    "window.firebaseConfig = firebaseConfig;",
    "",
    'console.log("✅ Firebase 보안 설정 로드 완료 (Functions 사용)");',
  ].join("\n");

  // js/config 폴더 생성 및 설정 파일 저장
  const jsConfigDir = path.join(distDir, "js", "config");
  if (!fs.existsSync(jsConfigDir)) {
    fs.mkdirSync(jsConfigDir, { recursive: true });
  }

  // 보안 설정 파일 생성
  fs.writeFileSync(
    path.join(jsConfigDir, "firebase-api-config.js"),
    secureConfigContent,
    "utf8"
  );

  console.log("✅ Firebase 보안 설정 파일이 생성되었습니다.");
}

// 특정 앱 빌드
function buildApp(appName) {
  const srcDir = path.join(__dirname, `../public/${appName}`);
  const distDir = path.join(__dirname, `../dist/${appName}`);

  console.log(`🚀 ${appName} 앱 빌드를 시작합니다...`);
  console.log("📂 소스 폴더:", srcDir);
  console.log("📂 대상 폴더:", distDir);

  // 소스 폴더 존재 확인
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ ${appName} 폴더를 찾을 수 없습니다:`, srcDir);
    process.exit(1);
  }

  // dist 앱 폴더 초기화
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 복사에서 제외할 파일들
  const excludeFiles = [
    "js/config/firebase-api-config.js", // 기존 API 설정 파일만 제외
    ".env",
    "node_modules",
  ];

  copyDirectory(srcDir, distDir, excludeFiles);
  console.log(`✅ ${appName} 파일 복사 완료`);

  // Firebase 보안 설정 파일 생성
  createSecureConfig(distDir);

  console.log(`✅ ${appName} 앱 빌드가 완료되었습니다.`);
}

// 전체 앱 빌드
function buildAll() {
  const srcDir = path.join(__dirname, "../public");
  const distDir = path.join(__dirname, "../dist");

  console.log("🚀 모든 앱 빌드를 시작합니다...");
  console.log("🔍 검색 중인 폴더:", srcDir);
  console.log("📁 폴더 존재 여부:", fs.existsSync(srcDir));

  // dist 폴더 초기화
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 디버깅: public 폴더의 모든 항목 출력
  const allItems = fs.readdirSync(srcDir, { withFileTypes: true });
  console.log("📋 public 폴더의 모든 항목:");
  allItems.forEach(item => {
    console.log(`  ${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
  });

  // public 폴더에서 앱 목록 찾기 (디렉토리만)
  const apps = allItems
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log("📱 발견된 앱들:", apps);

  // 각 앱 빌드
  apps.forEach(app => {
    buildApp(app);
  });

  console.log("✅ 모든 앱 빌드가 완료되었습니다.");
}

// 메인 실행 로직
function main() {
  const args = process.argv.slice(2);
  const targetApp = args[0];

  if (targetApp) {
    // 특정 앱만 빌드
    buildApp(targetApp);
  } else {
    // 모든 앱 빌드
    buildAll();
  }
}

// 빌드 실행
main();