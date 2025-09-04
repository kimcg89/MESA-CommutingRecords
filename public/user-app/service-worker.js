const CACHE_NAME = "my-pwa-cache-v1"; // 캐시 버전 (2025년 8월 14일 수정됨)
const RUNTIME_CACHE = "runtime-cache-v2"; // 런타임 캐시 (2025년 8월 14일 생성됨)

// 환경별 경로 감지
function getBasePath() {
  const url = self.location.href;
  const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
  const isDevPort = ["5000", "5001", "3000", "5501", "5502"].some((port) =>
    url.includes(`:${port}`)
  );

  console.log("🌐 현재 URL:", url);

  if (isLocalhost && isDevPort) {
    console.log("🔧 개발 환경 감지: /public/user-app/ 경로 사용");
    return "/public/user-app";
  }

  console.log("🚀 Firebase 배포 환경 감지: 루트 경로 사용");
  return "";
}

// 핵심 파일만 사전 캐싱
function createCoreUrlsToCache() {
  const basePath = getBasePath();
  const coreFiles = [
    "/",
    "/index.html",
    "/styles.css",
    "/script.js",
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
  ];

  const urls = coreFiles.map((file) => {
    if (file === "/") return basePath + "/";
    return basePath + file;
  });

  console.log("📦 핵심 파일 사전 캐싱 목록:", urls);
  return urls;
}

// 런타임 캐싱 대상
function shouldCacheAtRuntime(url) {
  const cachePatterns = [
    /\/js\//,
    /\/image\//,
    /\.css$/,
    /\.js$/,
    /\.png$/,
    /\.jpg$/,
    /\.svg$/,
  ];
  return cachePatterns.some((pattern) => pattern.test(url));
}

const coreUrlsToCache = createCoreUrlsToCache();

// 설치 이벤트
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker 설치 중...", CACHE_NAME);

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 핵심 파일 캐싱 시작:", CACHE_NAME);

      return Promise.allSettled(
        coreUrlsToCache.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response.clone());
              } else {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`
                );
              }
            })
            .then(() => {
              console.log(`✅ 캐싱 성공: ${url}`);
            })
            .catch((err) => {
              console.warn(`❌ 캐싱 실패 - ${url}:`, err.message);
              return null;
            })
        )
      ).then((results) => {
        const successful = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(`📊 캐싱 결과: 성공 ${successful}개, 실패 ${failed}개`);

        if (failed > 0) {
          console.warn(
            `⚠️ ${failed}개 파일 캐싱 실패 - 런타임에 다시 시도됩니다`
          );
        }
      });
    })
  );
});

// 활성화 이벤트
self.addEventListener("activate", (event) => {
  console.log("🎉 Service Worker 활성화됨:", CACHE_NAME);

  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches
        .keys()
        .then((cacheNames) => {
          console.log("🗑️ 기존 캐시 정리 시작...");
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                console.log(`🗑️ 이전 캐시 삭제: ${cacheName}`);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          console.log("✅ 캐시 정리 완료");
        }),
    ])
  );
});

// fetch 이벤트: 네트워크 우선 + 런타임 캐싱
self.addEventListener("fetch", (event) => {
  if (
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("firebase") ||
    event.request.method === "POST"
  ) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const url = event.request.url;

          // 반환용 복제본
          const responseToReturn = networkResponse.clone();

          if (shouldCacheAtRuntime(url)) {
            const cacheName = coreUrlsToCache.some((coreUrl) =>
              url.includes(coreUrl)
            )
              ? CACHE_NAME
              : RUNTIME_CACHE;

            caches.open(cacheName).then((cache) => {
              console.log(`🔄 런타임 캐싱: ${url}`);
              cache.put(event.request, networkResponse); // 원본 사용
            });
          }

          return responseToReturn; // 복제본 반환
        }

        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("📱 캐시에서 응답:", event.request.url);
            return cachedResponse;
          }

          return caches.open(RUNTIME_CACHE).then((runtimeCache) => {
            return runtimeCache.match(event.request).then((runtimeResponse) => {
              if (runtimeResponse) {
                console.log("🔄 런타임 캐시에서 응답:", event.request.url);
                return runtimeResponse;
              }

              if (event.request.destination === "document") {
                const basePath = getBasePath();
                const indexPath = basePath + "/index.html";
                return caches.match(indexPath);
              }

              return new Response(
                "네트워크 및 캐시에서 응답을 찾을 수 없습니다.",
                { status: 404, statusText: "Not Found" }
              );
            });
          });
        });
      })
  );
});
