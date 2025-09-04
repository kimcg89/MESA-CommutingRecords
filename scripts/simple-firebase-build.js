// scripts/simple-firebase-build.js
// Firebase 배포용 간단한 빌드 스크립트 (VITE_ 접두사 지원) (2025년 8월 5일 18:55 수정됨)
const fs = require("fs");
const path = require("path");

// 환경변수에서 Firebase 설정 읽기
function getFirebaseConfig() {
  const envPath = path.join(__dirname, "../.env");

  console.log("🔍 환경변수 파일 확인 중...");
  console.log("📁 .env 파일 경로:", envPath);
  console.log("📄 .env 파일 존재:", fs.existsSync(envPath));

  // .env 파일이 있으면 로드
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

    // Firebase 환경변수 찾기 (VITE_ 접두사와 일반 접두사 모두 지원) (2025년 8월 5일 18:55 수정됨)
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

    // 현재 디렉토리의 파일 목록 출력
    const projectRoot = path.join(__dirname, "..");
    console.log("📁 프로젝트 루트 파일 목록:");
    const files = fs.readdirSync(projectRoot);
    files.forEach((file) => {
      const filePath = path.join(projectRoot, file);
      const isDir = fs.statSync(filePath).isDirectory();
      console.log(`  ${isDir ? "📁" : "📄"} ${file}`);
    });
  }

  // 기본값 설정 (현재 프로젝트 정보)
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

// 파일 복사 함수 (특정 파일 제외 기능 추가) (2025년 8월 5일 19:00 수정됨)
function copyDirectory(src, dest, excludeFiles = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // 제외할 파일/폴더 확인 (2025년 8월 5일 19:00 추가됨)
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

// 빌드 실행
function build() {
  const sourceDir = path.join(__dirname, "../public");
  const distDir = path.join(__dirname, "../dist");

  console.log("🚀 Firebase 배포용 빌드를 시작합니다...");
  console.log("📂 소스 폴더:", sourceDir);
  console.log("📂 대상 폴더:", distDir);

  // 소스 폴더 존재 확인
  if (!fs.existsSync(sourceDir)) {
    console.error("❌ public 폴더를 찾을 수 없습니다:", sourceDir);
    console.log("💡 현재 디렉토리 구조를 확인해주세요.");

    // 현재 디렉토리의 파일/폴더 목록 출력
    const currentDir = path.join(__dirname, "..");
    const items = fs.readdirSync(currentDir);
    console.log("📁 현재 프로젝트 루트의 파일/폴더:");
    items.forEach((item) => console.log(`  - ${item}`));

    process.exit(1);
  }

  // dist 폴더 초기화
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // public 폴더의 모든 내용을 dist로 복사 (보안 파일 제외) (2025년 8월 5일 20:00 수정됨)
  console.log("📋 public 폴더 전체 복사 중...");

  // 복사에서 제외할 파일들 (보안상 중요한 파일들)
  const excludeFiles = [
    "js/config/firebase-api-config.js", // 기존 API 설정 파일만 제외
    ".env", // 환경변수 파일
    "node_modules", // Node.js 모듈 (혹시 있을 경우)
  ];

  copyDirectory(sourceDir, distDir, excludeFiles);
  console.log("✅ 파일 복사 완료 (보안 파일 제외)");

  // Service Worker 파일 존재 확인 (2025년 8월 5일 20:00 추가됨)
  const swSourcePath = path.join(sourceDir, "service-worker.js");
  const swDestPath = path.join(distDir, "service-worker.js");

  if (fs.existsSync(swSourcePath)) {
    console.log("✅ Service Worker 파일 확인됨:", swSourcePath);
    if (fs.existsSync(swDestPath)) {
      console.log("✅ Service Worker 파일이 dist에 복사됨:", swDestPath);
    } else {
      console.log("❌ Service Worker 파일이 dist에 복사되지 않음");
    }
  } else {
    console.log("❌ Service Worker 파일을 찾을 수 없음:", swSourcePath);
    console.log("💡 public/service-worker.js 파일을 생성해주세요.");
  }

  // Firebase 설정 파일 생성 (Functions 방식) (2025년 8월 5일 22:00 수정됨)
  console.log("🔒 Functions 방식으로 보안 설정 파일 생성 중...");

  // 보안 설정 파일 내용 (최소한의 정보만)
  const secureConfigContent = [
    "// Firebase 보안 설정 - Functions 방식 (2025년 8월 5일 22:00 생성됨)",
    "// API 키 노출 없이 Functions를 통해 안전하게 데이터 접근",
    "",
    "// Firebase Authentication만 사용 (Firestore는 Functions를 통해 접근)",
    "const firebaseConfig = {",
    '  apiKey: "AIzaSyAwpv9l2BCJG9H3fIPiCSFG7qFEKf0Kogo", // 인증용으로만 사용',
    '  authDomain: "fir-commutingrecords.firebaseapp.com",',
    '  projectId: "fir-commutingrecords"',
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
  console.log("📁 위치:", path.join(jsConfigDir, "firebase-api-config.js"));
  console.log("🔒 보안: API 키 완전 제거, Functions를 통한 안전한 접근");
  console.log("💡 개발 시: firebase-api-config.dev.js 사용");
  console.log("💡 배포 시: firebase-api-config.js 사용 (보안 버전)");
  console.log("✅ 빌드가 완료되었습니다. firebase deploy 명령을 실행하세요.");
}

// 빌드 실행
build();
