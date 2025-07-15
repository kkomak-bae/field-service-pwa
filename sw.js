/**
 * 현장 서비스 PWA Service Worker
 * PRD 요구사항: T002 - PWA 기능, T001 - 오프라인 지원
 */

const CACHE_NAME = 'field-service-pwa-v1.0.0';
const STATIC_CACHE_NAME = 'field-service-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'field-service-dynamic-v1.0.0';

// 캐시할 정적 파일들
const STATIC_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/js/barcode-scanner.js',
    '/js/video-recorder.js',
    '/js/address-search.js',
    '/js/storage.js',
    '/js/integrations.js',
    '/components/scanner.html',
    '/components/camera.html',
    '/components/form.html',
    '/components/dashboard.html',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// 외부 라이브러리 CDN
const EXTERNAL_LIBRARIES = [
    'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js',
    'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
];

/**
 * Service Worker 설치
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker 설치 중...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('정적 파일 캐싱 중...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('정적 파일 캐싱 완료');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('캐싱 실패:', error);
            })
    );
});

/**
 * Service Worker 활성화
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화 중...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 이전 캐시 삭제
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker 활성화 완료');
                return self.clients.claim();
            })
    );
});

/**
 * 네트워크 요청 가로채기
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // PWA 자체 리소스인 경우
    if (url.origin === self.location.origin) {
        event.respondWith(handlePWARequest(request));
    }
    // 외부 라이브러리인 경우
    else if (EXTERNAL_LIBRARIES.includes(request.url)) {
        event.respondWith(handleExternalLibrary(request));
    }
    // API 요청인 경우
    else if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
    }
    // 기타 요청
    else {
        event.respondWith(handleOtherRequest(request));
    }
});

/**
 * PWA 자체 리소스 처리
 */
async function handlePWARequest(request) {
    try {
        // 캐시에서 먼저 찾기
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 네트워크에서 가져오기
        const networkResponse = await fetch(request);
        
        // 성공한 경우 동적 캐시에 저장
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('PWA 리소스 요청 실패:', error);
        
        // 오프라인 페이지 반환
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

/**
 * 외부 라이브러리 처리
 */
async function handleExternalLibrary(request) {
    try {
        // 캐시에서 먼저 찾기
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 네트워크에서 가져오기
        const networkResponse = await fetch(request);
        
        // 성공한 경우 동적 캐시에 저장
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('외부 라이브러리 요청 실패:', error);
        
        // 오프라인 시 기본 동작
        return new Response('// 오프라인 모드', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
        });
    }
}

/**
 * API 요청 처리
 */
async function handleAPIRequest(request) {
    try {
        // 온라인 상태에서만 API 요청
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 성공한 응답을 IndexedDB에 저장
            await storeAPIResponse(request.url, await networkResponse.clone());
            return networkResponse;
        } else {
            throw new Error('API 요청 실패');
        }
    } catch (error) {
        console.error('API 요청 실패:', error);
        
        // 오프라인 시 저장된 데이터 반환
        const offlineData = await getOfflineData(request.url);
        if (offlineData) {
            return new Response(JSON.stringify(offlineData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 오프라인 데이터가 없으면 에러 반환
        return new Response(JSON.stringify({ 
            error: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.' 
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 기타 요청 처리
 */
async function handleOtherRequest(request) {
    try {
        // 네트워크 우선 전략
        const networkResponse = await fetch(request);
        
        // 성공한 경우 동적 캐시에 저장
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('기타 요청 실패:', error);
        throw error;
    }
}

/**
 * API 응답을 IndexedDB에 저장
 */
async function storeAPIResponse(url, response) {
    try {
        const data = await response.json();
        const db = await openDatabase();
        
        await db.put('apiCache', {
            url: url,
            data: data,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('API 응답 저장 실패:', error);
    }
}

/**
 * 오프라인 데이터 가져오기
 */
async function getOfflineData(url) {
    try {
        const db = await openDatabase();
        const cached = await db.get('apiCache', url);
        
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return cached.data;
        }
    } catch (error) {
        console.error('오프라인 데이터 조회 실패:', error);
    }
    
    return null;
}

/**
 * IndexedDB 열기
 */
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FieldServiceDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // API 캐시 저장소 생성
            if (!db.objectStoreNames.contains('apiCache')) {
                const store = db.createObjectStore('apiCache', { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            // 동기화 대기열 저장소 생성
            if (!db.objectStoreNames.contains('syncQueue')) {
                const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * 백그라운드 동기화
 */
self.addEventListener('sync', (event) => {
    console.log('백그라운드 동기화 시작:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

/**
 * 오프라인 데이터 동기화
 */
async function syncOfflineData() {
    try {
        const db = await openDatabase();
        const syncQueue = await db.getAll('syncQueue');
        
        for (const item of syncQueue) {
            try {
                // Slack 알림 전송
                if (item.type === 'slack') {
                    await sendSlackNotification(item.data);
                }
                
                // Jira 이슈 생성
                if (item.type === 'jira') {
                    await createJiraIssue(item.data);
                }
                
                // 동기화 완료 후 대기열에서 제거
                await db.delete('syncQueue', item.id);
                
            } catch (error) {
                console.error('동기화 실패:', error);
            }
        }
        
        console.log('백그라운드 동기화 완료');
    } catch (error) {
        console.error('백그라운드 동기화 실패:', error);
    }
}

/**
 * Slack 알림 전송
 */
async function sendSlackNotification(data) {
    // Slack Webhook API 호출
    const response = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Slack 알림 전송 실패');
    }
}

/**
 * Jira 이슈 생성
 */
async function createJiraIssue(data) {
    // Jira REST API 호출
    const response = await fetch('/api/jira/issue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Jira 이슈 생성 실패');
    }
}

/**
 * 푸시 알림 처리
 */
self.addEventListener('push', (event) => {
    console.log('푸시 알림 수신:', event);
    
    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인',
                icon: '/assets/icons/icon-192.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/assets/icons/icon-192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('현장 서비스 PWA', options)
    );
});

/**
 * 푸시 알림 클릭 처리
 */
self.addEventListener('notificationclick', (event) => {
    console.log('푸시 알림 클릭:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * 메시지 처리
 */
self.addEventListener('message', (event) => {
    console.log('Service Worker 메시지 수신:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

/**
 * 오프라인 페이지 생성
 */
self.addEventListener('fetch', (event) => {
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(`
                    <!DOCTYPE html>
                    <html lang="ko">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>오프라인 - 현장 서비스 PWA</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                background: #f8fafc;
                                color: #1e293b;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                min-height: 100vh;
                                margin: 0;
                                padding: 20px;
                            }
                            .offline-container {
                                text-align: center;
                                max-width: 400px;
                            }
                            .offline-icon {
                                font-size: 4rem;
                                margin-bottom: 20px;
                            }
                            h1 {
                                color: #2563eb;
                                margin-bottom: 10px;
                            }
                            p {
                                color: #64748b;
                                line-height: 1.6;
                            }
                            .retry-btn {
                                background: #2563eb;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                cursor: pointer;
                                margin-top: 20px;
                            }
                            .retry-btn:hover {
                                background: #1e40af;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="offline-container">
                            <div class="offline-icon">📡</div>
                            <h1>오프라인 상태</h1>
                            <p>네트워크 연결을 확인하고 다시 시도해주세요.</p>
                            <p>일부 기능은 오프라인에서도 사용할 수 있습니다.</p>
                            <button class="retry-btn" onclick="window.location.reload()">다시 시도</button>
                        </div>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                });
            })
        );
    }
});

console.log('Service Worker 로드됨'); 