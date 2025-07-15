/**
 * 동영상 촬영 모듈
 * PRD 요구사항: F002 - 동영상 촬영
 * 기술: MediaRecorder API
 */

class VideoRecorder {
    constructor() {
        this.isRecording = false;
        this.isPaused = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.currentStream = null;
        this.recordingStartTime = 0;
        this.recordingTimer = null;
        this.maxRecordingTime = 5 * 60 * 1000; // 5분 (밀리초)
        
        this.init();
    }

    /**
     * 촬영기 초기화
     */
    init() {
        console.log('동영상 촬영기 초기화');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 촬영 히스토리 로드
        this.loadRecordingHistory();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        const pauseBtn = document.getElementById('pause-recording');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startRecording());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopRecording());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
    }

    /**
     * 카메라 초기화
     * @returns {Promise<MediaStream>} 미디어 스트림
     */
    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, min: 1280 },
                    height: { ideal: 720, min: 720 },
                    facingMode: 'environment', // 후면 카메라 우선
                    frameRate: { ideal: 30, min: 24 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            this.currentStream = stream;
            
            // 비디오 프리뷰 설정
            const videoElement = document.getElementById('video-preview');
            if (videoElement) {
                videoElement.srcObject = stream;
            }

            return stream;
        } catch (error) {
            console.error('카메라 초기화 실패:', error);
            throw new Error('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
        }
    }

    /**
     * 촬영 시작
     */
    async startRecording() {
        if (this.isRecording) {
            console.log('이미 촬영 중입니다.');
            return;
        }

        try {
            // 카메라 초기화
            const stream = await this.initializeCamera();
            
            // MediaRecorder 설정
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000 // 2.5Mbps
            };

            // 지원하지 않는 경우 대체 옵션
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
            }
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            this.mediaRecorder = new MediaRecorder(stream, options);
            this.recordedChunks = [];
            this.isRecording = true;
            this.isPaused = false;
            this.recordingStartTime = Date.now();

            // 이벤트 리스너 설정
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('촬영 에러:', event.error);
                this.handleError('촬영 중 오류가 발생했습니다.');
            };

            // 촬영 시작
            this.mediaRecorder.start(1000); // 1초마다 데이터 수집
            
            // UI 업데이트
            this.updateUI(true);
            
            // 타이머 시작
            this.startTimer();
            
            console.log('촬영 시작');
            
        } catch (error) {
            console.error('촬영 시작 실패:', error);
            this.handleError(error.message);
        }
    }

    /**
     * 촬영 중지
     */
    stopRecording() {
        if (!this.isRecording) {
            return;
        }

        console.log('촬영 중지');
        
        // 타이머 중지
        this.stopTimer();
        
        // MediaRecorder 중지
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // 스트림 정리
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        this.isRecording = false;
        this.isPaused = false;
        this.updateUI(false);
    }

    /**
     * 일시정지/재개 토글
     */
    togglePause() {
        if (!this.isRecording) {
            return;
        }

        if (this.isPaused) {
            this.resumeRecording();
        } else {
            this.pauseRecording();
        }
    }

    /**
     * 촬영 일시정지
     */
    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.updatePauseUI(true);
            console.log('촬영 일시정지');
        }
    }

    /**
     * 촬영 재개
     */
    resumeRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.updatePauseUI(false);
            console.log('촬영 재개');
        }
    }

    /**
     * 타이머 시작
     */
    startTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            
            // 최대 촬영 시간 체크
            if (elapsed >= this.maxRecordingTime) {
                this.stopRecording();
                this.showWarning('최대 촬영 시간(5분)에 도달했습니다.');
                return;
            }
            
            // 타이머 표시 업데이트
            this.updateTimer(elapsed);
        }, 1000);
    }

    /**
     * 타이머 중지
     */
    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    /**
     * 타이머 표시 업데이트
     * @param {number} elapsed - 경과 시간 (밀리초)
     */
    updateTimer(elapsed) {
        const timeElement = document.getElementById('recording-time');
        const statusElement = document.getElementById('recording-status');
        
        if (timeElement) {
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (statusElement) {
            statusElement.textContent = this.isPaused ? '일시정지' : '촬영 중';
        }
    }

    /**
     * 촬영 완료 처리
     */
    handleRecordingComplete() {
        if (this.recordedChunks.length === 0) {
            console.log('촬영된 데이터가 없습니다.');
            return;
        }

        // 비디오 파일 생성
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // 촬영 정보
        const recordingInfo = {
            id: this.generateRecordingId(),
            url: url,
            blob: blob,
            size: blob.size,
            duration: Date.now() - this.recordingStartTime,
            timestamp: new Date().toISOString(),
            filename: `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`
        };

        // 촬영 히스토리에 추가
        this.addToRecordingHistory(recordingInfo);
        
        // 비디오 프리뷰 표시
        this.showVideoPreview(url);
        
        // 성공 알림
        this.showSuccess('동영상 촬영이 완료되었습니다.');
        
        console.log('촬영 완료:', recordingInfo);
    }

    /**
     * 촬영 ID 생성
     * @returns {string} 고유 ID
     */
    generateRecordingId() {
        return `VID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 비디오 프리뷰 표시
     * @param {string} videoUrl - 비디오 URL
     */
    showVideoPreview(videoUrl) {
        const videoElement = document.getElementById('recorded-video');
        if (videoElement) {
            videoElement.src = videoUrl;
            videoElement.style.display = 'block';
            
            // 기존 빈 상태 메시지 숨기기
            const emptyState = videoElement.nextElementSibling;
            if (emptyState && emptyState.classList.contains('empty-state')) {
                emptyState.style.display = 'none';
            }
        }
    }

    /**
     * 촬영 히스토리에 추가
     * @param {Object} recordingInfo - 촬영 정보
     */
    addToRecordingHistory(recordingInfo) {
        const history = this.getRecordingHistory();
        history.unshift(recordingInfo);
        
        // 히스토리 크기 제한 (최대 20개)
        if (history.length > 20) {
            history.splice(20);
        }
        
        // 로컬 스토리지에 저장
        this.saveRecordingHistory(history);
    }

    /**
     * 촬영 히스토리 저장
     * @param {Array} history - 촬영 히스토리
     */
    saveRecordingHistory(history) {
        try {
            // Blob은 저장할 수 없으므로 URL만 저장
            const historyForStorage = history.map(item => ({
                id: item.id,
                url: item.url,
                size: item.size,
                duration: item.duration,
                timestamp: item.timestamp,
                filename: item.filename
            }));
            
            localStorage.setItem('recordingHistory', JSON.stringify(historyForStorage));
        } catch (error) {
            console.error('촬영 히스토리 저장 실패:', error);
        }
    }

    /**
     * 촬영 히스토리 로드
     */
    loadRecordingHistory() {
        try {
            const saved = localStorage.getItem('recordingHistory');
            if (saved) {
                const history = JSON.parse(saved);
                // URL을 다시 Blob으로 변환 (필요시)
                return history;
            }
        } catch (error) {
            console.error('촬영 히스토리 로드 실패:', error);
        }
        return [];
    }

    /**
     * 촬영 히스토리 가져오기
     * @returns {Array} 촬영 히스토리
     */
    getRecordingHistory() {
        return this.loadRecordingHistory();
    }

    /**
     * UI 업데이트
     * @param {boolean} isRecording - 촬영 중 여부
     */
    updateUI(isRecording) {
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        const pauseBtn = document.getElementById('pause-recording');
        
        if (startBtn) {
            startBtn.disabled = isRecording;
            startBtn.textContent = isRecording ? '촬영 중...' : '촬영 시작';
        }
        
        if (stopBtn) {
            stopBtn.disabled = !isRecording;
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = !isRecording;
        }
    }

    /**
     * 일시정지 UI 업데이트
     * @param {boolean} isPaused - 일시정지 여부
     */
    updatePauseUI(isPaused) {
        const pauseBtn = document.getElementById('pause-recording');
        if (pauseBtn) {
            pauseBtn.textContent = isPaused ? '재개' : '일시정지';
        }
    }

    /**
     * 폼용 동영상 촬영 (F002 요구사항)
     */
    recordVideoForForm() {
        this.startRecording();
        
        // 촬영 완료 후 폼에 첨부
        this.onRecordingComplete = (recordingInfo) => {
            const videoAttachment = document.getElementById('video-attachment');
            if (videoAttachment) {
                videoAttachment.textContent = recordingInfo.filename;
            }
        };
    }

    /**
     * 사진 촬영
     */
    async takePhoto() {
        try {
            // 카메라 초기화
            const stream = await this.initializeCamera();
            
            // Canvas 생성
            const canvas = document.getElementById('video-canvas');
            const video = document.getElementById('video-preview');
            
            if (canvas && video) {
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // 비디오 프레임을 캔버스에 그리기
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Canvas를 Blob으로 변환
                canvas.toBlob((blob) => {
                    const photoInfo = {
                        id: this.generatePhotoId(),
                        blob: blob,
                        size: blob.size,
                        timestamp: new Date().toISOString(),
                        filename: `photo_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`
                    };
                    
                    // 폼에 첨부
                    const photoAttachment = document.getElementById('photo-attachment');
                    if (photoAttachment) {
                        photoAttachment.textContent = photoInfo.filename;
                    }
                    
                    this.showSuccess('사진이 촬영되었습니다.');
                }, 'image/jpeg', 0.9);
            }
            
            // 스트림 정리
            stream.getTracks().forEach(track => track.stop());
            
        } catch (error) {
            console.error('사진 촬영 실패:', error);
            this.handleError('사진 촬영에 실패했습니다.');
        }
    }

    /**
     * 사진 ID 생성
     * @returns {string} 고유 ID
     */
    generatePhotoId() {
        return `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 에러 처리
     * @param {string} message - 에러 메시지
     */
    handleError(message) {
        console.error('촬영기 에러:', message);
        this.showError(message);
        this.stopRecording();
    }

    /**
     * 성공 메시지 표시
     * @param {string} message - 메시지
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 경고 메시지 표시
     * @param {string} message - 메시지
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
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
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#2563eb'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * 지원하는 비디오 형식 확인
     * @returns {Array} 지원 형식 목록
     */
    getSupportedFormats() {
        const formats = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
            'video/ogg'
        ];
        
        return formats.filter(format => MediaRecorder.isTypeSupported(format));
    }

    /**
     * 촬영 히스토리 지우기
     */
    clearRecordingHistory() {
        localStorage.removeItem('recordingHistory');
        console.log('촬영 히스토리가 지워졌습니다.');
    }
}

// 전역 인스턴스 생성
window.videoRecorder = new VideoRecorder();

// 전역 함수들
window.startVideoRecording = function() {
    window.videoRecorder.startRecording();
};

window.stopVideoRecording = function() {
    window.videoRecorder.stopRecording();
};

window.recordVideoForForm = function() {
    window.videoRecorder.recordVideoForForm();
};

window.takePhoto = function() {
    window.videoRecorder.takePhoto();
};

console.log('동영상 촬영 모듈 로드됨'); 