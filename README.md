# 현장 서비스 PWA (Field Service PWA)

현장 서비스 업무를 위한 Progressive Web Application으로, 바코드/QR코드 스캔, 동영상 촬영, 주소 검색, 자동 보고서 생성 등의 기능을 제공합니다.

## 🚀 주요 기능

### 📱 핵심 기능
- **바코드/QR코드 스캔**: QuaggaJS를 이용한 실시간 스캔
- **동영상 촬영**: HD 720p 이상, 최대 5분 촬영 지원
- **주소 검색**: Daum 우편번호 API 연동
- **오프라인 지원**: IndexedDB 기반 로컬 스토리지
- **PWA 기능**: 홈 화면 설치, 오프라인 동작

### 🔗 외부 연동
- **Slack 연동**: 작업 완료 알림 전송
- **Jira 연동**: 이슈 생성 및 업데이트
- **동기화**: 온라인 시 자동 데이터 동기화

### 📊 보고서 기능
- **자동 보고서 생성**: 촬영된 동영상과 스캔 데이터 기반
- **작업 이력 관리**: 완료된 작업 목록 및 상세 정보
- **데이터 내보내기**: CSV/PDF 형식 지원

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/field-service-pwa.git
cd field-service-pwa
```

### 2. 로컬 서버 실행
```bash
# Python 3 사용
python -m http.server 8000

# 또는 Node.js 사용
npx http-server -p 8000

# 또는 Live Server (VS Code 확장)
```

### 3. 브라우저에서 접속
```
http://localhost:8000
```

## 📱 PWA 설치

### 모바일 브라우저
1. 브라우저에서 앱 접속
2. "홈 화면에 추가" 또는 "설치" 옵션 선택
3. 앱 아이콘으로 바로 실행 가능

### 데스크톱 브라우저
1. Chrome/Edge에서 앱 접속
2. 주소창 옆 설치 아이콘 클릭
3. "설치" 버튼 클릭

## 🔧 설정

### API 키 설정
`js/integrations.js` 파일에서 다음 API 키들을 설정하세요:

```javascript
const SLACK_WEBHOOK_URL = 'your-slack-webhook-url';
const JIRA_BASE_URL = 'your-jira-instance-url';
const JIRA_USERNAME = 'your-jira-username';
const JIRA_API_TOKEN = 'your-jira-api-token';
```

### Daum 우편번호 API
`index.html`에서 Daum 우편번호 API 스크립트를 추가하세요:

```html
<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
```

## 📁 프로젝트 구조

```
field-service-pwa/
├── index.html              # 메인 HTML 파일
├── manifest.json           # PWA 매니페스트
├── sw.js                  # 서비스 워커
├── app.js                 # 메인 애플리케이션 로직
├── style.css              # 스타일시트
├── components/            # UI 컴포넌트
│   ├── dashboard.html     # 메인 대시보드
│   ├── scanner.html       # 바코드 스캐너
│   ├── camera.html        # 동영상 촬영
│   └── form.html          # 보고서 폼
├── js/                    # JavaScript 모듈
│   ├── barcode-scanner.js # 바코드 스캔 기능
│   ├── video-recorder.js  # 동영상 촬영 기능
│   ├── address-search.js  # 주소 검색 기능
│   ├── storage.js         # 로컬 스토리지
│   └── integrations.js    # 외부 API 연동
├── assets/                # 정적 자원
│   ├── icons/            # PWA 아이콘
│   └── images/           # 이미지 파일
└── docs/                 # 문서
```

## 🎯 사용법

### 1. 작업 시작
- 대시보드에서 "새 작업 시작" 버튼 클릭
- 작업 정보 입력 (고객명, 작업 유형, 주소 등)

### 2. 바코드 스캔
- 스캐너 탭에서 카메라 권한 허용
- 바코드/QR코드를 카메라에 비춤
- 자동으로 스캔 결과 저장

### 3. 동영상 촬영
- 카메라 탭에서 "촬영 시작" 버튼 클릭
- 최대 5분까지 촬영 가능
- "촬영 중지" 후 자동 저장

### 4. 보고서 작성
- 폼 탭에서 작업 내용 입력
- 스캔된 데이터와 촬영된 동영상 자동 첨부
- "보고서 생성" 버튼으로 완료

### 5. 외부 연동
- Slack: 작업 완료 시 자동 알림
- Jira: 이슈 생성 및 업데이트
- 오프라인 시 동기화 대기열에 저장

## 🔒 보안 고려사항

- HTTPS 환경에서 실행 권장
- API 키는 환경변수로 관리
- 사용자 데이터는 로컬에만 저장
- 외부 전송 시 암호화 적용

## 🐛 문제 해결

### 카메라 접근 오류
- 브라우저에서 카메라 권한 확인
- HTTPS 환경에서 실행 확인

### 오프라인 동작 문제
- 서비스 워커 등록 확인
- 브라우저 개발자 도구에서 확인

### API 연동 오류
- API 키 설정 확인
- 네트워크 연결 상태 확인

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**현장 서비스 PWA** - 현장 업무의 디지털화를 위한 최적의 솔루션

---

## 🎉 배포 상태
- 배포일: 2025-07-15
- 상태: ✅ 완료
- URL: https://kkomak-bae.github.io/field-service-pwa/
