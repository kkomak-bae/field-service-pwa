# API 참조 문서

## 개요
현장 서비스 PWA의 JavaScript 모듈 API 참조 문서입니다.

## 모듈 목록

### 1. 바코드 스캐너 (barcode-scanner.js)

#### 클래스: BarcodeScanner

```javascript
const scanner = new BarcodeScanner(containerId, options);
```

**매개변수:**
- `containerId` (string): 스캐너를 렌더링할 DOM 요소의 ID
- `options` (object): 스캐너 설정 옵션

**옵션:**
```javascript
{
  width: 640,           // 스캐너 너비
  height: 480,          // 스캐너 높이
  formats: ['code_128', 'ean_13', 'qr_code'], // 지원 형식
  onDetected: callback  // 스캔 성공 시 콜백
}
```

**메서드:**

##### start()
스캐너를 시작합니다.
```javascript
scanner.start();
```

##### stop()
스캐너를 중지합니다.
```javascript
scanner.stop();
```

##### isRunning()
스캐너 실행 상태를 확인합니다.
```javascript
const running = scanner.isRunning();
```

### 2. 동영상 촬영 (video-recorder.js)

#### 클래스: VideoRecorder

```javascript
const recorder = new VideoRecorder(containerId, options);
```

**매개변수:**
- `containerId` (string): 비디오 요소를 렌더링할 DOM 요소의 ID
- `options` (object): 녹화 설정 옵션

**옵션:**
```javascript
{
  width: 1280,          // 비디오 너비
  height: 720,          // 비디오 높이
  maxDuration: 300000,  // 최대 녹화 시간 (ms)
  quality: 'high'       // 품질 설정
}
```

**메서드:**

##### startRecording()
녹화를 시작합니다.
```javascript
recorder.startRecording();
```

##### stopRecording()
녹화를 중지하고 파일을 반환합니다.
```javascript
const videoBlob = await recorder.stopRecording();
```

##### getRecordingTime()
현재 녹화 시간을 반환합니다.
```javascript
const time = recorder.getRecordingTime();
```

### 3. 주소 검색 (address-search.js)

#### 클래스: AddressSearch

```javascript
const addressSearch = new AddressSearch();
```

**메서드:**

##### openPostcode()
Daum 우편번호 팝업을 엽니다.
```javascript
addressSearch.openPostcode({
  onComplete: (data) => {
    console.log(data.address);
  }
});
```

##### searchAddress(query)
주소 검색을 수행합니다.
```javascript
const results = await addressSearch.searchAddress('서울시 강남구');
```

### 4. 로컬 스토리지 (storage.js)

#### 클래스: StorageManager

```javascript
const storage = new StorageManager();
```

**메서드:**

##### saveWorkReport(report)
작업 보고서를 저장합니다.
```javascript
await storage.saveWorkReport({
  id: 'unique-id',
  customerName: '고객명',
  workType: '점검',
  address: '주소',
  barcodeData: '스캔된 바코드',
  videoUrl: 'video-blob-url',
  timestamp: new Date()
});
```

##### getWorkReports()
저장된 모든 작업 보고서를 반환합니다.
```javascript
const reports = await storage.getWorkReports();
```

##### deleteWorkReport(id)
특정 작업 보고서를 삭제합니다.
```javascript
await storage.deleteWorkReport('report-id');
```

##### syncToServer()
서버와 동기화를 수행합니다.
```javascript
await storage.syncToServer();
```

### 5. 외부 연동 (integrations.js)

#### 클래스: SlackIntegration

```javascript
const slack = new SlackIntegration(webhookUrl);
```

**메서드:**

##### sendNotification(message)
Slack에 알림을 전송합니다.
```javascript
await slack.sendNotification({
  text: '작업이 완료되었습니다.',
  attachments: [{
    title: '작업 보고서',
    fields: [
      { title: '고객명', value: 'ABC 회사' },
      { title: '작업 유형', value: '점검' }
    ]
  }]
});
```

#### 클래스: JiraIntegration

```javascript
const jira = new JiraIntegration(baseUrl, username, apiToken);
```

**메서드:**

##### createIssue(issueData)
Jira에 이슈를 생성합니다.
```javascript
const issue = await jira.createIssue({
  projectKey: 'PROJ',
  summary: '현장 점검 완료',
  description: '점검 내용...',
  issueType: 'Task'
});
```

##### updateIssue(issueKey, updateData)
기존 이슈를 업데이트합니다.
```javascript
await jira.updateIssue('PROJ-123', {
  summary: '업데이트된 제목',
  description: '업데이트된 내용'
});
```

## 이벤트 시스템

### 전역 이벤트

```javascript
// 작업 보고서 저장 완료
document.addEventListener('workReportSaved', (event) => {
  console.log('보고서 저장됨:', event.detail);
});

// 동기화 완료
document.addEventListener('syncCompleted', (event) => {
  console.log('동기화 완료:', event.detail);
});

// 오류 발생
document.addEventListener('error', (event) => {
  console.error('오류 발생:', event.detail);
});
```

## 오류 처리

모든 API는 Promise를 반환하며, 오류 발생 시 다음과 같이 처리합니다:

```javascript
try {
  await storage.saveWorkReport(report);
} catch (error) {
  console.error('저장 실패:', error.message);
  // 사용자에게 오류 알림
}
```

## 브라우저 호환성

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 성능 고려사항

- 바코드 스캔: 실시간 처리로 CPU 사용량 주의
- 동영상 녹화: 메모리 사용량 모니터링 필요
- 오프라인 저장: IndexedDB 용량 제한 확인 