/**
 * 오프라인 스토리지 모듈
 * PRD 요구사항: T001 - 오프라인 모드 지원
 * 기술: IndexedDB, Dexie.js
 */

class OfflineStorage {
    constructor() {
        this.db = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    /**
     * 스토리지 초기화
     */
    async init() {
        console.log('오프라인 스토리지 초기화');
        
        // 데이터베이스 초기화
        await this.initializeDatabase();
        
        // 네트워크 상태 모니터링
        this.setupNetworkMonitoring();
        
        // 동기화 대기열 로드
        await this.loadSyncQueue();
    }

    /**
     * 데이터베이스 초기화
     */
    async initializeDatabase() {
        try {
            // Dexie.js 데이터베이스 생성
            this.db = new Dexie('FieldServiceDB');
            
            // 데이터베이스 스키마 정의
            this.db.version(1).stores({
                // 작업 보고서 저장
                reports: 'id, equipmentCode, workLocation, timestamp, status',
                
                // 바코드 스캔 히스토리
                barcodeScans: 'id, code, format, timestamp',
                
                // 동영상 촬영 히스토리
                videoRecordings: 'id, filename, size, duration, timestamp',
                
                // 주소 검색 히스토리
                addressSearches: 'id, address, postcode, timestamp',
                
                // 동기화 대기열
                syncQueue: 'id, type, data, timestamp, retryCount',
                
                // API 캐시
                apiCache: 'url, data, timestamp',
                
                // 사용자 설정
                settings: 'key, value, timestamp'
            });

            await this.db.open();
            console.log('데이터베이스 초기화 완료');
            
        } catch (error) {
            console.error('데이터베이스 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 네트워크 상태 모니터링 설정
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });
    }

    /**
     * 온라인 상태 처리
     */
    async handleOnline() {
        console.log('네트워크 연결 복구됨');
        
        // 동기화 대기열 처리
        await this.processSyncQueue();
        
        // UI 업데이트
        this.updateOnlineStatus(true);
    }

    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        console.log('네트워크 연결 끊어짐');
        
        // UI 업데이트
        this.updateOnlineStatus(false);
    }

    /**
     * 온라인 상태 UI 업데이트
     * @param {boolean} isOnline - 온라인 상태
     */
    updateOnlineStatus(isOnline) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = isOnline ? '온라인' : '오프라인';
            statusElement.className = `status ${isOnline ? 'online' : 'offline'}`;
        }
    }

    /**
     * 작업 보고서 저장
     * @param {Object} report - 보고서 데이터
     * @returns {Promise<string>} 저장된 보고서 ID
     */
    async saveReport(report) {
        try {
            const reportId = report.id || this.generateId('REP');
            const reportData = {
                id: reportId,
                equipmentCode: report.equipment_code,
                workLocation: report.work_location,
                workDescription: report.work_description,
                attachments: report.attachments,
                timestamp: new Date().toISOString(),
                status: 'draft',
                ...report
            };

            await this.db.reports.put(reportData);
            console.log('보고서 저장됨:', reportId);
            
            return reportId;
        } catch (error) {
            console.error('보고서 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 작업 보고서 가져오기
     * @param {string} reportId - 보고서 ID
     * @returns {Promise<Object>} 보고서 데이터
     */
    async getReport(reportId) {
        try {
            const report = await this.db.reports.get(reportId);
            return report;
        } catch (error) {
            console.error('보고서 조회 실패:', error);
            return null;
        }
    }

    /**
     * 모든 보고서 가져오기
     * @returns {Promise<Array>} 보고서 목록
     */
    async getAllReports() {
        try {
            const reports = await this.db.reports.orderBy('timestamp').reverse().toArray();
            return reports;
        } catch (error) {
            console.error('보고서 목록 조회 실패:', error);
            return [];
        }
    }

    /**
     * 바코드 스캔 기록 저장
     * @param {Object} scanData - 스캔 데이터
     */
    async saveBarcodeScan(scanData) {
        try {
            const scanId = this.generateId('SCAN');
            const scanRecord = {
                id: scanId,
                code: scanData.code,
                format: scanData.format,
                timestamp: new Date().toISOString(),
                ...scanData
            };

            await this.db.barcodeScans.put(scanRecord);
            console.log('바코드 스캔 기록 저장됨:', scanId);
        } catch (error) {
            console.error('바코드 스캔 기록 저장 실패:', error);
        }
    }

    /**
     * 바코드 스캔 히스토리 가져오기
     * @param {number} limit - 가져올 개수
     * @returns {Promise<Array>} 스캔 히스토리
     */
    async getBarcodeScanHistory(limit = 50) {
        try {
            const scans = await this.db.barcodeScans
                .orderBy('timestamp')
                .reverse()
                .limit(limit)
                .toArray();
            return scans;
        } catch (error) {
            console.error('바코드 스캔 히스토리 조회 실패:', error);
            return [];
        }
    }

    /**
     * 동영상 촬영 기록 저장
     * @param {Object} recordingData - 촬영 데이터
     */
    async saveVideoRecording(recordingData) {
        try {
            const recordingId = this.generateId('VID');
            const recordingRecord = {
                id: recordingId,
                filename: recordingData.filename,
                size: recordingData.size,
                duration: recordingData.duration,
                timestamp: new Date().toISOString(),
                ...recordingData
            };

            await this.db.videoRecordings.put(recordingRecord);
            console.log('동영상 촬영 기록 저장됨:', recordingId);
        } catch (error) {
            console.error('동영상 촬영 기록 저장 실패:', error);
        }
    }

    /**
     * 동영상 촬영 히스토리 가져오기
     * @param {number} limit - 가져올 개수
     * @returns {Promise<Array>} 촬영 히스토리
     */
    async getVideoRecordingHistory(limit = 20) {
        try {
            const recordings = await this.db.videoRecordings
                .orderBy('timestamp')
                .reverse()
                .limit(limit)
                .toArray();
            return recordings;
        } catch (error) {
            console.error('동영상 촬영 히스토리 조회 실패:', error);
            return [];
        }
    }

    /**
     * 주소 검색 기록 저장
     * @param {Object} addressData - 주소 데이터
     */
    async saveAddressSearch(addressData) {
        try {
            const searchId = this.generateId('ADDR');
            const searchRecord = {
                id: searchId,
                address: addressData.address,
                postcode: addressData.postcode,
                timestamp: new Date().toISOString(),
                ...addressData
            };

            await this.db.addressSearches.put(searchRecord);
            console.log('주소 검색 기록 저장됨:', searchId);
        } catch (error) {
            console.error('주소 검색 기록 저장 실패:', error);
        }
    }

    /**
     * 주소 검색 히스토리 가져오기
     * @param {number} limit - 가져올 개수
     * @returns {Promise<Array>} 검색 히스토리
     */
    async getAddressSearchHistory(limit = 20) {
        try {
            const searches = await this.db.addressSearches
                .orderBy('timestamp')
                .reverse()
                .limit(limit)
                .toArray();
            return searches;
        } catch (error) {
            console.error('주소 검색 히스토리 조회 실패:', error);
            return [];
        }
    }

    /**
     * 동기화 대기열에 추가
     * @param {Object} syncItem - 동기화 항목
     */
    async addToSyncQueue(syncItem) {
        try {
            const queueId = this.generateId('SYNC');
            const queueItem = {
                id: queueId,
                type: syncItem.type,
                data: syncItem.data,
                timestamp: new Date().toISOString(),
                retryCount: 0,
                maxRetries: 3
            };

            await this.db.syncQueue.put(queueItem);
            this.syncQueue.push(queueItem);
            console.log('동기화 대기열에 추가됨:', queueId);
        } catch (error) {
            console.error('동기화 대기열 추가 실패:', error);
        }
    }

    /**
     * 동기화 대기열 로드
     */
    async loadSyncQueue() {
        try {
            this.syncQueue = await this.db.syncQueue.toArray();
            console.log('동기화 대기열 로드됨:', this.syncQueue.length);
        } catch (error) {
            console.error('동기화 대기열 로드 실패:', error);
            this.syncQueue = [];
        }
    }

    /**
     * 동기화 대기열 처리
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) {
            return;
        }

        console.log('동기화 대기열 처리 시작:', this.syncQueue.length);

        for (const item of this.syncQueue) {
            try {
                await this.processSyncItem(item);
                
                // 성공한 항목 제거
                await this.db.syncQueue.delete(item.id);
                this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
                
            } catch (error) {
                console.error('동기화 항목 처리 실패:', error);
                
                // 재시도 횟수 증가
                item.retryCount++;
                if (item.retryCount >= item.maxRetries) {
                    // 최대 재시도 횟수 초과 시 제거
                    await this.db.syncQueue.delete(item.id);
                    this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
                } else {
                    // 재시도 횟수 업데이트
                    await this.db.syncQueue.put(item);
                }
            }
        }

        console.log('동기화 대기열 처리 완료');
    }

    /**
     * 동기화 항목 처리
     * @param {Object} item - 동기화 항목
     */
    async processSyncItem(item) {
        switch (item.type) {
            case 'slack':
                await this.sendToSlack(item.data);
                break;
            case 'jira':
                await this.sendToJira(item.data);
                break;
            case 'report':
                await this.uploadReport(item.data);
                break;
            default:
                console.warn('알 수 없는 동기화 타입:', item.type);
        }
    }

    /**
     * Slack으로 전송
     * @param {Object} data - 전송할 데이터
     */
    async sendToSlack(data) {
        // 실제 Slack API 호출 구현
        console.log('Slack으로 전송:', data);
    }

    /**
     * Jira로 전송
     * @param {Object} data - 전송할 데이터
     */
    async sendToJira(data) {
        // 실제 Jira API 호출 구현
        console.log('Jira로 전송:', data);
    }

    /**
     * 보고서 업로드
     * @param {Object} data - 업로드할 데이터
     */
    async uploadReport(data) {
        // 실제 서버 업로드 구현
        console.log('보고서 업로드:', data);
    }

    /**
     * API 캐시 저장
     * @param {string} url - API URL
     * @param {Object} data - 캐시할 데이터
     */
    async saveAPICache(url, data) {
        try {
            const cacheItem = {
                url: url,
                data: data,
                timestamp: new Date().toISOString()
            };

            await this.db.apiCache.put(cacheItem);
            console.log('API 캐시 저장됨:', url);
        } catch (error) {
            console.error('API 캐시 저장 실패:', error);
        }
    }

    /**
     * API 캐시 가져오기
     * @param {string} url - API URL
     * @returns {Promise<Object|null>} 캐시된 데이터
     */
    async getAPICache(url) {
        try {
            const cacheItem = await this.db.apiCache.get(url);
            
            if (cacheItem) {
                // 24시간 이내 캐시만 유효
                const cacheAge = Date.now() - new Date(cacheItem.timestamp).getTime();
                if (cacheAge < 24 * 60 * 60 * 1000) {
                    return cacheItem.data;
                } else {
                    // 만료된 캐시 삭제
                    await this.db.apiCache.delete(url);
                }
            }
            
            return null;
        } catch (error) {
            console.error('API 캐시 조회 실패:', error);
            return null;
        }
    }

    /**
     * 설정 저장
     * @param {string} key - 설정 키
     * @param {any} value - 설정 값
     */
    async saveSetting(key, value) {
        try {
            const setting = {
                key: key,
                value: value,
                timestamp: new Date().toISOString()
            };

            await this.db.settings.put(setting);
            console.log('설정 저장됨:', key);
        } catch (error) {
            console.error('설정 저장 실패:', error);
        }
    }

    /**
     * 설정 가져오기
     * @param {string} key - 설정 키
     * @returns {Promise<any>} 설정 값
     */
    async getSetting(key) {
        try {
            const setting = await this.db.settings.get(key);
            return setting ? setting.value : null;
        } catch (error) {
            console.error('설정 조회 실패:', error);
            return null;
        }
    }

    /**
     * 고유 ID 생성
     * @param {string} prefix - ID 접두사
     * @returns {string} 고유 ID
     */
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 데이터베이스 통계 가져오기
     * @returns {Promise<Object>} 데이터베이스 통계
     */
    async getDatabaseStats() {
        try {
            const stats = {
                reports: await this.db.reports.count(),
                barcodeScans: await this.db.barcodeScans.count(),
                videoRecordings: await this.db.videoRecordings.count(),
                addressSearches: await this.db.addressSearches.count(),
                syncQueue: await this.db.syncQueue.count(),
                apiCache: await this.db.apiCache.count()
            };

            return stats;
        } catch (error) {
            console.error('데이터베이스 통계 조회 실패:', error);
            return {};
        }
    }

    /**
     * 데이터베이스 정리
     */
    async cleanupDatabase() {
        try {
            // 30일 이전 데이터 삭제
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            await this.db.barcodeScans
                .where('timestamp')
                .below(thirtyDaysAgo.toISOString())
                .delete();
            
            await this.db.videoRecordings
                .where('timestamp')
                .below(thirtyDaysAgo.toISOString())
                .delete();
            
            await this.db.addressSearches
                .where('timestamp')
                .below(thirtyDaysAgo.toISOString())
                .delete();
            
            await this.db.apiCache
                .where('timestamp')
                .below(thirtyDaysAgo.toISOString())
                .delete();
            
            console.log('데이터베이스 정리 완료');
        } catch (error) {
            console.error('데이터베이스 정리 실패:', error);
        }
    }

    /**
     * 데이터베이스 내보내기
     * @returns {Promise<Object>} 내보낼 데이터
     */
    async exportData() {
        try {
            const exportData = {
                reports: await this.db.reports.toArray(),
                barcodeScans: await this.db.barcodeScans.toArray(),
                videoRecordings: await this.db.videoRecordings.toArray(),
                addressSearches: await this.db.addressSearches.toArray(),
                settings: await this.db.settings.toArray(),
                exportDate: new Date().toISOString()
            };

            return exportData;
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            return null;
        }
    }

    /**
     * 데이터베이스 가져오기
     * @param {Object} importData - 가져올 데이터
     */
    async importData(importData) {
        try {
            if (importData.reports) {
                await this.db.reports.bulkPut(importData.reports);
            }
            if (importData.barcodeScans) {
                await this.db.barcodeScans.bulkPut(importData.barcodeScans);
            }
            if (importData.videoRecordings) {
                await this.db.videoRecordings.bulkPut(importData.videoRecordings);
            }
            if (importData.addressSearches) {
                await this.db.addressSearches.bulkPut(importData.addressSearches);
            }
            if (importData.settings) {
                await this.db.settings.bulkPut(importData.settings);
            }

            console.log('데이터 가져오기 완료');
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            throw error;
        }
    }

    /**
     * 데이터베이스 초기화
     */
    async clearDatabase() {
        try {
            await this.db.delete();
            await this.initializeDatabase();
            console.log('데이터베이스 초기화 완료');
        } catch (error) {
            console.error('데이터베이스 초기화 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
window.offlineStorage = new OfflineStorage();

// 전역 함수들
window.saveReport = function(report) {
    return window.offlineStorage.saveReport(report);
};

window.getReport = function(reportId) {
    return window.offlineStorage.getReport(reportId);
};

window.getAllReports = function() {
    return window.offlineStorage.getAllReports();
};

window.getDatabaseStats = function() {
    return window.offlineStorage.getDatabaseStats();
};

console.log('오프라인 스토리지 모듈 로드됨'); 