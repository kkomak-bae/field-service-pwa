@echo off
echo ========================================
echo    현장 서비스 PWA 실제 배포 실행
echo ========================================
echo.

echo ⚠️  주의: 이 스크립트는 실제로 GitHub에 푸시합니다!
echo.
set /p confirm="계속하시겠습니까? (y/N): "
if /i not "%confirm%"=="y" (
    echo 배포가 취소되었습니다.
    pause
    exit /b 0
)

echo.
echo [1/5] Git 상태 확인...
git status
echo.

echo [2/5] 모든 파일 추가...
git add .
echo ✅ 파일 추가 완료
echo.

echo [3/5] 커밋 생성...
git commit -m "Deploy: Complete PWA with all features and icons - %date% %time%"
echo ✅ 커밋 완료
echo.

echo [4/5] GitHub에 푸시...
git push origin main
if %errorlevel% equ 0 (
    echo ✅ 푸시 완료
) else (
    echo ❌ 푸시 실패
    echo 원격 저장소가 설정되지 않았을 수 있습니다.
    echo git remote add origin https://github.com/YOUR_USERNAME/field-service-pwa.git
    pause
    exit /b 1
)
echo.

echo [5/5] 배포 완료!
echo ========================================
echo    🚀 배포가 성공적으로 완료되었습니다!
echo ========================================
echo.
echo 다음 단계:
echo 1. GitHub 저장소에서 Actions 탭 확인
echo 2. 배포 진행 상황 모니터링 (2-3분 소요)
echo 3. Settings → Pages에서 URL 확인
echo 4. 배포 완료 후 접속:
echo    https://YOUR_USERNAME.github.io/field-service-pwa/
echo.
echo PWA 설치 테스트:
echo - 모바일: "홈 화면에 추가"
echo - 데스크톱: 주소창 옆 설치 아이콘
echo.
pause 