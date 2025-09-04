// functions/index.js
// Firebase Functions - API 키 숨김 처리 (2025년 8월 5일 21:30 작성됨)
// 네이버 API 추가 (2025년 8월 5일 23:15 추가됨)
// .env 파일 지원 추가 (2025년 8월 6일 수정됨)

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");

// 환경변수 로드 - 로컬 개발 환경용 (2025년 8월 6일 추가됨)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// API 엔드포인트 함수
exports.api = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.replace("/api", "");

      console.log(`🔥 Functions 요청: ${method} ${path}`);

      // 사용자 인증 확인
      const idToken = req.headers.authorization?.replace("Bearer ", "");
      if (!idToken) {
        return res.status(401).json({ error: "인증 토큰이 필요합니다." });
      }

      // 토큰 검증
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userEmail = decodedToken.email;

      console.log(`👤 인증된 사용자: ${userEmail}`);

      // API 라우팅
      switch (path) {
        case "/records":
          return handleRecords(req, res, userEmail);
        case "/attendance":
          return handleAttendance(req, res, userEmail);
        default:
          return res
            .status(404)
            .json({ error: "API 엔드포인트를 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("❌ Functions 오류:", error);
      return res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  });
});

// 출퇴근 기록 처리 (2025년 8월 5일 21:30 작성됨)
async function handleRecords(req, res, userEmail) {
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        // 기록 조회
        const { date } = req.query;
        const recordRef = db.collection("records").doc(userEmail);

        if (date) {
          // 특정 날짜 기록 조회
          const dateDoc = await recordRef.collection("dates").doc(date).get();
          return res.json(dateDoc.exists ? dateDoc.data() : null);
        } else {
          // 전체 기록 조회
          const snapshot = await recordRef.collection("dates").get();
          const records = {};
          snapshot.forEach((doc) => {
            records[doc.id] = doc.data();
          });
          return res.json(records);
        }

      case "POST":
        // 기록 저장
        const { date: saveDate, data } = req.body;
        await db
          .collection("records")
          .doc(userEmail)
          .collection("dates")
          .doc(saveDate)
          .set(data, { merge: true });

        return res.json({ success: true, message: "기록이 저장되었습니다." });

      case "DELETE":
        // 기록 삭제
        const { date: deleteDate } = req.query;
        await db
          .collection("records")
          .doc(userEmail)
          .collection("dates")
          .doc(deleteDate)
          .delete();

        return res.json({ success: true, message: "기록이 삭제되었습니다." });

      default:
        return res
          .status(405)
          .json({ error: "지원되지 않는 HTTP 메서드입니다." });
    }
  } catch (error) {
    console.error("❌ Records 처리 오류:", error);
    return res.status(500).json({ error: "기록 처리 중 오류가 발생했습니다." });
  }
}

// 출퇴근 처리 (2025년 8월 5일 21:30 작성됨)
async function handleAttendance(req, res, userEmail) {
  const { method } = req;

  try {
    if (method === "POST") {
      const { type, timestamp, location } = req.body; // type: 'start' | 'end'
      const today = new Date().toISOString().split("T")[0];

      const attendanceData = {
        [type]: {
          timestamp: timestamp,
          location: location || null,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      };

      await db
        .collection("records")
        .doc(userEmail)
        .collection("dates")
        .doc(today)
        .set(attendanceData, { merge: true });

      return res.json({
        success: true,
        message: `${type === "start" ? "출근" : "퇴근"} 기록이 저장되었습니다.`,
      });
    }

    return res.status(405).json({ error: "지원되지 않는 HTTP 메서드입니다." });
  } catch (error) {
    console.error("❌ Attendance 처리 오류:", error);
    return res
      .status(500)
      .json({ error: "출퇴근 처리 중 오류가 발생했습니다." });
  }
}

// 🆕 네이버 API 주소 변환 함수 - Web Service API 사용 (2025년 8월 6일 수정됨)
exports.getAddressFromCoords = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "Missing lat or lng" });
      return;
    }

    try {
      // Web Service API 사용 (Maps API의 일부) (2025년 8월 6일 수정됨)
      const ncpClientID = process.env.NAVER_CLIENT_ID || "dfu49htc2u";
      
      // Geocoder 서비스 URL (Web Dynamic Map에 포함된 기능)
      const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/reverse?coords=${lng},${lat}&output=json&orders=roadaddr,addr`;
      
      console.log("🌐 좌표 수신됨:", { lat, lng });
      console.log("📡 API URL:", url);
      
      const response = await fetch(url, {
        headers: {
          // Web Service API는 Client ID만 필요 (2025년 8월 6일 수정됨)
          "X-NCP-APIGW-API-KEY-ID": ncpClientID,
          "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET || "",
        },
      });

      console.log("📨 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API 에러:", errorText);
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 API 응답:", JSON.stringify(data, null, 2));

      const result = data.results?.[0];
      if (!result) {
        throw new Error("주소 정보를 찾을 수 없습니다.");
      }

      // 주소 구성
      let address = '';
      
      // 도로명 주소 우선
      if (result.land?.addition0?.value) {
        address = result.land.addition0.value;
      }
      // 지번 주소
      else if (result.region && result.land) {
        const region = result.region;
        const land = result.land;
        address = `${region.area1?.name || ''} ${region.area2?.name || ''} ${region.area3?.name || ''} ${land.name || ''}`.trim();
      }

      console.log("✅ 생성된 주소:", address);
      res.json({ address: address || "주소를 찾을 수 없습니다" });

    } catch (error) {
      console.error("🔥 주소 변환 중 예외 발생:", error);
      res.status(500).json({ 
        error: "주소 변환 실패", 
        details: error.message 
      });
    }
  });
});