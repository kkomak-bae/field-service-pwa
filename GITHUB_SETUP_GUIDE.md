# 🚀 GitHub 연동 및 배포 가이드

## 📋 사전 준비

### 1. Git 설치 (Windows)
```bash
# Git for Windows 다운로드
# https://git-scm.com/download/win
```

### 2. GitHub 계정 준비
- GitHub 계정이 필요합니다
- 저장소 생성 권한이 있어야 합니다

## 🔧 단계별 설정

### 1단계: Git 초기 설정

#### Git 사용자 정보 설정
```bash
# Git 사용자 이름 설정
git config --global user.name "Your Name"

# Git 이메일 설정 (GitHub 계정과 동일하게)
git config --global user.email "your.email@example.com"
```

#### 현재 프로젝트 Git 초기화
```bash
# 현재 디렉토리에서 Git 초기화
git init

# Git 상태 확인
git status
```

### 2단계: GitHub 저장소 생성

#### GitHub에서 새 저장소 생성
1. GitHub.com에 로그인
2. 우측 상단 **"+"** 버튼 클릭 → **"New repository"**
3. 저장소 설정:
   - **Repository name**: `field-service-pwa`
   - **Description**: `현장 서비스 PWA - 바코드 스캔, 동영상 촬영, 작업 보고서 관리`
   - **Visibility**: Public (또는 Private)
   - **Initialize this repository with**: 체크하지 않음
4. **"Create repository"** 클릭

#### 원격 저장소 연결
```bash
# 원격 저장소 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/field-service-pwa.git

# 원격 저장소 확인
git remote -v
```

### 3단계: 파일 커밋 및 푸시

#### 모든 파일 추가
```bash
# 모든 파일을 스테이징 영역에 추가
git add .

# 스테이징된 파일 확인
git status
```

#### 첫 번째 커밋
```bash
# 초기 커밋 생성
git commit -m "Initial commit: Complete PWA with all features and icons"

# 커밋 히스토리 확인
git log --oneline
```

#### GitHub에 푸시
```bash
# main 브랜치로 푸시
git push -u origin main

# 또는 master 브랜치인 경우
git push -u origin master
```

### 4단계: GitHub Pages 활성화

#### GitHub 저장소 설정
1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - **Deploy from a branch** 선택
   - **Branch**: `gh-pages` 선택
   - **Folder**: `/ (root)` 선택
5. **Save** 클릭

#### GitHub Actions 권한 설정
1. **Settings** → **Actions** → **General**
2. **Workflow permissions** 섹션에서:
   - **Read and write permissions** 선택
   - **Allow GitHub Actions to create and approve pull requests** 체크
3. **Save** 클릭

### 5단계: 자동 배포 확인

#### Actions 탭에서 배포 진행 상황 확인
1. GitHub 저장소에서 **Actions** 탭 클릭
2. **Deploy to GitHub Pages** 워크플로우 실행 확인
3. 배포 완료까지 대기 (보통 2-3분 소요)

#### Pages 탭에서 URL 확인
1. **Settings** → **Pages**
2. 배포 완료 후 URL 확인:
   ```
   https://YOUR_USERNAME.github.io/field-service-pwa/
   ```

## 🛠️ 문제 해결

### Git 인증 오류
```bash
# Personal Access Token 사용 (권장)
# GitHub → Settings → Developer settings → Personal access tokens → Generate new token

# 또는 GitHub CLI 사용
gh auth login
```

### 브랜치 이름 오류
```bash
# 현재 브랜치 확인
git branch

# 브랜치 이름 변경 (필요시)
git branch -M main
```

### 푸시 거부 오류
```bash
# 원격 저장소 강제 업데이트 (주의: 기존 내용 삭제됨)
git push -f origin main
```

## 📱 배포 후 테스트

### PWA 설치 테스트
1. 배포 URL 접속
2. 모바일: "홈 화면에 추가" 선택
3. 데스크톱: 주소창 옆 설치 아이콘 클릭

### 기능 테스트
- [ ] 바코드 스캔
- [ ] 동영상 촬영
- [ ] 주소 검색
- [ ] 오프라인 동작

## 🔗 예상 결과

### 배포 URL
```
https://YOUR_USERNAME.github.io/field-service-pwa/
```

### PWA 설치
- **모바일**: 브라우저에서 "홈 화면에 추가"
- **데스크톱**: 주소창 옆 설치 아이콘

## 📊 모니터링

### GitHub Actions
- **Actions** 탭에서 배포 상태 확인
- 워크플로우 실행 로그 확인

### GitHub Pages
- **Settings** → **Pages**에서 배포 상태 확인
- 방문자 통계 확인 (Public 저장소의 경우)

---

**🚀 이 가이드를 따라하면 현장 서비스 PWA가 전 세계 어디서나 접속 가능한 완전한 웹 애플리케이션으로 배포됩니다!** 