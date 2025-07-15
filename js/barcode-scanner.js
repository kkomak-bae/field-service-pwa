/**
 * 바코드 스캐너 모듈
 * PRD 요구사항: F001 - QR/바코드 스캐닝
 * 기술: QuaggaJS
 */

class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.currentStream = null;
        this.onScanCallback = null;
        this.onErrorCallback = null;
        this.scanHistory = [];
        this.maxHistorySize = 50;
        
        this.init();
    }

    /**
     * 스캐너 초기화
     */
    init() {
        console.log('바코드 스캐너 초기화');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 스캔 히스토리 로드
        this.loadScanHistory();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        const startBtn = document.getElementById('start-scan');
        const stopBtn = document.getElementById('stop-scan');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startScan());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopScan());
        }
    }

    /**
     * 스캔 시작
     * @param {Function} onScan - 스캔 성공 콜백
     * @param {Function} onError - 에러 콜백
     */
    async startScan(onScan = null, onError = null) {
        if (this.isScanning) {
            console.log('이미 스캔 중입니다.');
            return;
        }

        this.onScanCallback = onScan;
        this.onErrorCallback = onError;

        try {
            // 카메라 권한 요청
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 후면 카메라 우선
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.currentStream = stream;
            this.isScanning = true;

            // UI 업데이트
            this.updateUI(true);

            // Quagga 설정
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#interactive'),
                    constraints: {
                        width: 640,
                        height: 480,
                        facingMode: "environment"
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 2,
                frequency: 10,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader",
                        "2of5_reader",
                        "code_93_reader"
                    ]
                },
                locate: true
            }, (err) => {
                if (err) {
                    console.error('Quagga 초기화 실패:', err);
                    this.handleError('카메라를 초기화할 수 없습니다.');
                    return;
                }

                console.log('Quagga 초기화 성공');
                Quagga.start();
            });

            // 스캔 이벤트 리스너
            Quagga.onDetected(this.handleScanResult.bind(this));
            Quagga.onProcessed(this.handleProcessed.bind(this));

        } catch (error) {
            console.error('카메라 접근 실패:', error);
            this.handleError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
        }
    }

    /**
     * 스캔 중지
     */
    stopScan() {
        if (!this.isScanning) {
            return;
        }

        console.log('스캔 중지');
        
        // Quagga 중지
        Quagga.stop();
        
        // 스트림 정리
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        this.isScanning = false;
        this.updateUI(false);
    }

    /**
     * 스캔 결과 처리
     * @param {Object} result - 스캔 결과
     */
    handleScanResult(result) {
        const code = result.codeResult.code;
        const format = result.codeResult.format;
        
        console.log('스캔 결과:', { code, format });
        
        // 중복 스캔 방지 (1초 내)
        if (this.isRecentScan(code)) {
            return;
        }

        // 스캔 히스토리에 추가
        this.addToScanHistory(code, format);
        
        // UI 업데이트
        this.updateScanOutput(code, format);
        
        // 콜백 호출
        if (this.onScanCallback) {
            this.onScanCallback(code, format);
        }

        // 성공 알림
        this.showSuccess(`스캔 성공: ${code}`);
        
        // 자동 중지 (선택적)
        // this.stopScan();
    }

    /**
     * 처리된 프레임 처리
     * @param {Object} result - 처리 결과
     */
    handleProcessed(result) {
        const drawingCanvas = Quagga.canvas.ctx.overlay;
        const drawingCtx = drawingCanvas.getContext('2d');

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter((box) => box !== result.box).forEach((box) => {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "blue", lineWidth: 2 });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
        }
    }

    /**
     * 최근 스캔 확인
     * @param {string} code - 스캔된 코드
     * @returns {boolean} 최근 스캔 여부
     */
    isRecentScan(code) {
        const now = Date.now();
        const recentScans = this.scanHistory.filter(item => 
            item.code === code && (now - item.timestamp) < 1000
        );
        return recentScans.length > 0;
    }

    /**
     * 스캔 히스토리에 추가
     * @param {string} code - 스캔된 코드
     * @param {string} format - 바코드 형식
     */
    addToScanHistory(code, format) {
        const scanItem = {
            code: code,
            format: format,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        this.scanHistory.unshift(scanItem);
        
        // 히스토리 크기 제한
        if (this.scanHistory.length > this.maxHistorySize) {
            this.scanHistory = this.scanHistory.slice(0, this.maxHistorySize);
        }

        // 로컬 스토리지에 저장
        this.saveScanHistory();
    }

    /**
     * 스캔 히스토리 저장
     */
    saveScanHistory() {
        try {
            localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
        } catch (error) {
            console.error('스캔 히스토리 저장 실패:', error);
        }
    }

    /**
     * 스캔 히스토리 로드
     */
    loadScanHistory() {
        try {
            const saved = localStorage.getItem('scanHistory');
            if (saved) {
                this.scanHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('스캔 히스토리 로드 실패:', error);
            this.scanHistory = [];
        }
    }

    /**
     * UI 업데이트
     * @param {boolean} isScanning - 스캔 중 여부
     */
    updateUI(isScanning) {
        const startBtn = document.getElementById('start-scan');
        const stopBtn = document.getElementById('stop-scan');
        
        if (startBtn) {
            startBtn.disabled = isScanning;
            startBtn.textContent = isScanning ? '스캔 중...' : '스캔 시작';
        }
        
        if (stopBtn) {
            stopBtn.disabled = !isScanning;
        }
    }

    /**
     * 스캔 결과 출력 업데이트
     * @param {string} code - 스캔된 코드
     * @param {string} format - 바코드 형식
     */
    updateScanOutput(code, format) {
        const outputElement = document.getElementById('scan-output');
        if (!outputElement) return;

        const resultHTML = `
            <div class="scan-result-item">
                <div class="scan-code">${code}</div>
                <div class="scan-format">${format}</div>
                <div class="scan-time">${new Date().toLocaleTimeString('ko-KR')}</div>
            </div>
        `;

        outputElement.innerHTML = resultHTML + outputElement.innerHTML;
    }

    /**
     * 폼용 스캔 (F001 요구사항)
     */
    scanForForm() {
        this.startScan((code, format) => {
            // 장비 코드 입력 필드에 자동 입력
            const equipmentCodeInput = document.getElementById('equipment-code');
            if (equipmentCodeInput) {
                equipmentCodeInput.value = code;
                
                // 입력 이벤트 발생
                equipmentCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                this.showSuccess('바코드가 입력되었습니다.');
            }
        }, (error) => {
            this.showError('바코드 스캔에 실패했습니다.');
        });
    }

    /**
     * 에러 처리
     * @param {string} message - 에러 메시지
     */
    handleError(message) {
        console.error('스캐너 에러:', message);
        
        if (this.onErrorCallback) {
            this.onErrorCallback(message);
        }
        
        this.showError(message);
        this.stopScan();
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
     * 스캔 히스토리 가져오기
     * @returns {Array} 스캔 히스토리
     */
    getScanHistory() {
        return this.scanHistory;
    }

    /**
     * 스캔 히스토리 지우기
     */
    clearScanHistory() {
        this.scanHistory = [];
        localStorage.removeItem('scanHistory');
        console.log('스캔 히스토리가 지워졌습니다.');
    }

    /**
     * 지원하는 바코드 형식 목록
     * @returns {Array} 지원 형식 목록
     */
    getSupportedFormats() {
        return [
            'code_128',
            'ean_13',
            'ean_8',
            'code_39',
            'code_39_vin',
            'codabar',
            'upc_a',
            'upc_e',
            'i2of5',
            '2of5',
            'code_93'
        ];
    }
}

// 전역 인스턴스 생성
window.barcodeScanner = new BarcodeScanner();

// 전역 함수들
window.startBarcodeScan = function() {
    window.barcodeScanner.startScan();
};

window.stopBarcodeScan = function() {
    window.barcodeScanner.stopScan();
};

window.scanForForm = function() {
    window.barcodeScanner.scanForForm();
};

console.log('바코드 스캐너 모듈 로드됨'); 