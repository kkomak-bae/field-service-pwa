/**
 * 현장 서비스 PWA 메인 앱 로직
 * PRD 요구사항: F001-F004, I001-I002, T001-T002 기능 구현
 */

class FieldServiceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isOnline = navigator.onLine;
        this.init();
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('현장 서비스 PWA 초기화 중...');
        
        // 이벤트 리스너 등록
        this.setupEventListeners();
        
        // 네트워크 상태 모니터링
        this.setupNetworkMonitoring();
        
        // 데이터베이스 초기화
        await this.initializeDatabase();
        
        // 대시보드 데이터 로드
        await this.loadDashboardData();
        
        // PWA 설치 프롬프트 설정
        this.setupInstallPrompt();
        
        console.log('앱 초기화 완료');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 네비게이션 버튼 이벤트
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // 폼 제출 이벤트
        const form = document.getElementById('work-report-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // 네트워크 상태 변경 이벤트
        window.addEventListener('online', () => this.updateNetworkStatus(true));
        window.addEventListener('offline', () => this.updateNetworkStatus(false));
    }

    /**
     * 페이지 네비게이션
     * @param {string} pageName - 이동할 페이지 이름
     */
    navigateToPage(pageName) {
        // 현재 활성 페이지 비활성화
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            currentPage.classList.remove('active');
        }

        // 현재 활성 네비게이션 버튼 비활성화
        const currentNavBtn = document.querySelector('.nav-btn.active');
        if (currentNavBtn) {
            currentNavBtn.classList.remove('active');
        }

        // 새 페이지 활성화
        const newPage = document.getElementById(pageName);
        if (newPage) {
            newPage.classList.add('active');
        }

        // 새 네비게이션 버튼 활성화
        const newNavBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (newNavBtn) {
            newNavBtn.classList.add('active');
        }

        this.currentPage = pageName;
        this.onPageChange(pageName);
    }

    /**
     * 페이지 변경 시 추가 처리
     * @param {string} pageName - 변경된 페이지 이름
     */
    onPageChange(pageName) {
        switch (pageName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'scanner':
                this.initializeScanner();
                break;
            case 'camera':
                this.initializeCamera();
                break;
            case 'form':
                this.loadFormData();
                break;
        }
    }

    /**
     * 네트워크 상태 모니터링 설정
     */
    setupNetworkMonitoring() {
        this.updateNetworkStatus(this.isOnline);
        
        // 주기적 네트워크 상태 확인
        setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = navigator.onLine;
            
            if (wasOnline !== this.isOnline) {
                this.updateNetworkStatus(this.isOnline);
            }
        }, 5000);
    }

    /**
     * 네트워크 상태 업데이트
     * @param {boolean} isOnline - 온라인 상태
     */
    updateNetworkStatus(isOnline) {
        this.isOnline = isOnline;
        const statusElement = document.getElementById('connection-status');
        
        if (statusElement) {
            statusElement.textContent = isOnline ? '온라인' : '오프라인';
            statusElement.className = `status ${isOnline ? 'online' : 'offline'}`;
        }

        // 오프라인 시 동기화 대기열 처리
        if (isOnline) {
            this.syncOfflineData();
        }
    }

    /**
     * 데이터베이스 초기화
     */
    async initializeDatabase() {
        try {
            // Dexie.js 데이터베이스 초기화
            if (window.db) {
                await window.db.open();
                console.log('데이터베이스 연결 성공');
            }
        } catch (error) {
            console.error('데이터베이스 초기화 실패:', error);
        }
    }

    /**
     * 대시보드 데이터 로드
     */
    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // 최근 작업 목록 로드
            await this.loadRecentTasks();
            
            // 통계 데이터 로드
            await this.loadStatistics();
            
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            this.showError('대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 최근 작업 목록 로드
     */
    async loadRecentTasks() {
        const recentTasksContainer = document.getElementById('recent-tasks');
        if (!recentTasksContainer) return;

        try {
            // 로컬 스토리지에서 최근 작업 가져오기
            const recentTasks = JSON.parse(localStorage.getItem('recentTasks') || '[]');
            
            if (recentTasks.length === 0) {
                recentTasksContainer.innerHTML = '<p class="empty-state">아직 작업 기록이 없습니다.</p>';
                return;
            }

            const tasksHTML = recentTasks.slice(0, 5).map(task => `
                <div class="task-item">
                    <div class="task-title">${task.title}</div>
                    <div class="task-date">${new Date(task.date).toLocaleDateString('ko-KR')}</div>
                </div>
            `).join('');

            recentTasksContainer.innerHTML = tasksHTML;
        } catch (error) {
            console.error('최근 작업 로드 실패:', error);
        }
    }

    /**
     * 통계 데이터 로드
     */
    async loadStatistics() {
        try {
            // 총 작업 수
            const totalTasks = JSON.parse(localStorage.getItem('totalTasks') || '0');
            document.getElementById('total-tasks').textContent = totalTasks;

            // 이번 달 작업 수
            const thisMonthTasks = JSON.parse(localStorage.getItem('thisMonthTasks') || '0');
            document.getElementById('this-month').textContent = thisMonthTasks;
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
        }
    }

    /**
     * 바코드 스캐너 초기화
     */
    initializeScanner() {
        console.log('바코드 스캐너 초기화');
        // barcode-scanner.js에서 구현
    }

    /**
     * 카메라 초기화
     */
    initializeCamera() {
        console.log('카메라 초기화');
        // video-recorder.js에서 구현
    }

    /**
     * 폼 데이터 로드
     */
    loadFormData() {
        // 임시 저장된 폼 데이터 로드
        const savedFormData = localStorage.getItem('draftFormData');
        if (savedFormData) {
            try {
                const formData = JSON.parse(savedFormData);
                this.populateForm(formData);
            } catch (error) {
                console.error('폼 데이터 로드 실패:', error);
            }
        }
    }

    /**
     * 폼 데이터 채우기
     * @param {Object} formData - 폼 데이터
     */
    populateForm(formData) {
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = formData[key];
            }
        });
    }

    /**
     * 폼 제출 처리
     */
    async handleFormSubmit() {
        try {
            this.showLoading(true);
            
            // 폼 데이터 수집
            const formData = this.collectFormData();
            
            // 데이터 유효성 검사
            if (!this.validateFormData(formData)) {
                return;
            }

            // 보고서 생성
            const report = await this.generateReport(formData);
            
            // 로컬 저장
            await this.saveReport(report);
            
            // 외부 연동 (온라인 시)
            if (this.isOnline) {
                await this.sendToExternalServices(report);
            }

            // 성공 메시지
            this.showSuccess('작업 보고서가 성공적으로 생성되었습니다.');
            
            // 폼 초기화
            this.resetForm();
            
        } catch (error) {
            console.error('폼 제출 실패:', error);
            this.showError('보고서 생성에 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 폼 데이터 수집
     * @returns {Object} 폼 데이터
     */
    collectFormData() {
        const form = document.getElementById('work-report-form');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // 추가 메타데이터
        data.timestamp = new Date().toISOString();
        data.location = this.getCurrentLocation();
        data.deviceInfo = this.getDeviceInfo();

        return data;
    }

    /**
     * 폼 데이터 유효성 검사
     * @param {Object} formData - 폼 데이터
     * @returns {boolean} 유효성 여부
     */
    validateFormData(formData) {
        if (!formData.equipment_code?.trim()) {
            this.showError('장비 코드를 입력해주세요.');
            return false;
        }

        if (!formData.work_location?.trim()) {
            this.showError('작업 장소를 입력해주세요.');
            return false;
        }

        if (!formData.work_description?.trim()) {
            this.showError('작업 내용을 입력해주세요.');
            return false;
        }

        return true;
    }

    /**
     * 보고서 생성
     * @param {Object} formData - 폼 데이터
     * @returns {Object} 생성된 보고서
     */
    async generateReport(formData) {
        const report = {
            id: this.generateReportId(),
            ...formData,
            attachments: this.getAttachments(),
            generatedAt: new Date().toISOString()
        };

        return report;
    }

    /**
     * 보고서 ID 생성
     * @returns {string} 고유 ID
     */
    generateReportId() {
        return `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 첨부 파일 정보 가져오기
     * @returns {Object} 첨부 파일 정보
     */
    getAttachments() {
        const attachments = {
            video: document.getElementById('video-attachment')?.textContent || '없음',
            photo: document.getElementById('photo-attachment')?.textContent || '없음'
        };
        return attachments;
    }

    /**
     * 보고서 저장
     * @param {Object} report - 저장할 보고서
     */
    async saveReport(report) {
        try {
            // 로컬 스토리지에 저장
            const reports = JSON.parse(localStorage.getItem('reports') || '[]');
            reports.push(report);
            localStorage.setItem('reports', JSON.stringify(reports));

            // 최근 작업 목록 업데이트
            const recentTasks = JSON.parse(localStorage.getItem('recentTasks') || '[]');
            recentTasks.unshift({
                id: report.id,
                title: `작업 보고서 - ${report.equipment_code}`,
                date: report.generatedAt
            });
            localStorage.setItem('recentTasks', JSON.stringify(recentTasks.slice(0, 10)));

            // 통계 업데이트
            this.updateStatistics();

        } catch (error) {
            console.error('보고서 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 통계 업데이트
     */
    updateStatistics() {
        const totalTasks = parseInt(localStorage.getItem('totalTasks') || '0') + 1;
        localStorage.setItem('totalTasks', totalTasks.toString());

        const currentMonth = new Date().getMonth();
        const thisMonthTasks = parseInt(localStorage.getItem('thisMonthTasks') || '0') + 1;
        localStorage.setItem('thisMonthTasks', thisMonthTasks.toString());
    }

    /**
     * 외부 서비스로 전송
     * @param {Object} report - 전송할 보고서
     */
    async sendToExternalServices(report) {
        try {
            // Slack 연동 (I001)
            if (window.slackIntegration) {
                await window.slackIntegration.sendNotification(report);
            }

            // Jira 연동 (I002)
            if (window.jiraIntegration) {
                await window.jiraIntegration.createIssue(report);
            }
        } catch (error) {
            console.error('외부 서비스 전송 실패:', error);
            // 오프라인 대기열에 추가
            this.addToSyncQueue(report);
        }
    }

    /**
     * 동기화 대기열에 추가
     * @param {Object} report - 동기화할 보고서
     */
    addToSyncQueue(report) {
        const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        syncQueue.push(report);
        localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    }

    /**
     * 오프라인 데이터 동기화
     */
    async syncOfflineData() {
        const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        if (syncQueue.length === 0) return;

        try {
            for (const report of syncQueue) {
                await this.sendToExternalServices(report);
            }
            
            // 동기화 완료 후 대기열 비우기
            localStorage.removeItem('syncQueue');
            this.showSuccess('오프라인 데이터가 동기화되었습니다.');
        } catch (error) {
            console.error('오프라인 데이터 동기화 실패:', error);
        }
    }

    /**
     * 현재 위치 정보 가져오기
     * @returns {Object} 위치 정보
     */
    getCurrentLocation() {
        return {
            latitude: null,
            longitude: null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 디바이스 정보 가져오기
     * @returns {Object} 디바이스 정보
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 폼 초기화
     */
    resetForm() {
        const form = document.getElementById('work-report-form');
        if (form) {
            form.reset();
        }

        // 첨부 파일 상태 초기화
        document.getElementById('video-attachment').textContent = '없음';
        document.getElementById('photo-attachment').textContent = '없음';

        // 임시 저장 데이터 삭제
        localStorage.removeItem('draftFormData');
    }

    /**
     * 임시 저장
     */
    saveDraft() {
        const formData = this.collectFormData();
        localStorage.setItem('draftFormData', JSON.stringify(formData));
        this.showSuccess('임시 저장되었습니다.');
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 성공 메시지 표시
     * @param {string} message - 메시지
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 에러 메시지 표시
     * @param {string} message - 메시지
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 알림 표시
     * @param {string} message - 메시지
     * @param {string} type - 알림 타입
     */
    showNotification(message, type = 'info') {
        // 간단한 토스트 알림 구현
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * PWA 설치 프롬프트 설정
     */
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // 설치 버튼 표시 (필요시)
            console.log('PWA 설치 가능');
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA가 설치되었습니다');
            deferredPrompt = null;
        });
    }
}

// 전역 함수들 (HTML에서 직접 호출)
window.startBarcodeScan = function() {
    app.navigateToPage('scanner');
};

window.startVideoRecording = function() {
    app.navigateToPage('camera');
};

window.openAddressSearch = function() {
    app.navigateToPage('form');
    // 주소 검색 모달 열기
    if (window.addressSearch) {
        window.addressSearch.openSearch();
    }
};

window.scanForForm = function() {
    // 폼에서 바코드 스캔
    if (window.barcodeScanner) {
        window.barcodeScanner.scanForForm();
    }
};

window.searchAddress = function() {
    // 주소 검색
    if (window.addressSearch) {
        window.addressSearch.search();
    }
};

window.recordVideoForForm = function() {
    // 폼에서 동영상 촬영
    if (window.videoRecorder) {
        window.videoRecorder.recordForForm();
    }
};

window.takePhoto = function() {
    // 사진 촬영
    if (window.videoRecorder) {
        window.videoRecorder.takePhoto();
    }
};

window.saveDraft = function() {
    app.saveDraft();
};

// 앱 인스턴스 생성
const app = new FieldServiceApp(); 