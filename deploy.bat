@echo off
echo ========================================
echo    현장 서비스 PWA GitHub 배포 스크립트
echo ========================================
echo.

echo [1/6] Git 설치 확인...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git이 설치되지 않았습니다.
    echo 📥 Git for Windows를 다운로드하세요: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git 설치 확인됨
echo.

echo [2/6] Git 사용자 정보 설정...
echo 현재 Git 사용자 정보:
git config --global user.name
git config --global user.email
echo.
echo Git 사용자 정보를 설정하려면:
echo git config --global user.name "Your Name"
echo git config --global user.email "your.email@example.com"
echo.

echo [3/6] Git 저장소 초기화...
if not exist ".git" (
    git init
    echo ✅ Git 저장소 초기화 완료
) else (
    echo ✅ Git 저장소가 이미 초기화되어 있습니다
)
echo.

echo [4/6] 원격 저장소 연결 확인...
git remote -v
echo.
echo 원격 저장소가 설정되지 않은 경우:
echo git remote add origin https://github.com/YOUR_USERNAME/field-service-pwa.git
echo.

echo [5/6] 파일 상태 확인...
git status
echo.

echo [6/6] 배포 준비 완료!
echo ========================================
echo    다음 단계:
echo ========================================
echo.
echo 1. GitHub에서 저장소 생성:
echo    - GitHub.com → New repository
echo    - Repository name: field-service-pwa
echo    - Public 또는 Private 선택
echo.
echo 2. 원격 저장소 연결 (아직 안 했다면):
echo    git remote add origin https://github.com/YOUR_USERNAME/field-service-pwa.git
echo.
echo 3. 파일 커밋 및 푸시:
echo    git add .
echo    git commit -m "Initial commit: Complete PWA"
echo    git push -u origin main
echo.
echo 4. GitHub Pages 활성화:
echo    - Settings → Pages → Deploy from a branch → gh-pages
echo.
echo 5. 배포 완료 후 접속:
echo    https://YOUR_USERNAME.github.io/field-service-pwa/
echo.
pause 