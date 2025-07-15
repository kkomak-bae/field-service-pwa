/**
 * 외부 서비스 연동 모듈
 * PRD 요구사항: I001 - Slack 연동, I002 - Jira 연동
 */

class Integrations {
    constructor() {
        this.slackWebhookUrl = null;
        this.jiraConfig = null;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    /**
     * 연동 모듈 초기화
     */
    init() {
        console.log('외부 서비스 연동 모듈 초기화');
        
        // 설정 로드
        this.loadConfigurations();
        
        // 네트워크 상태 모니터링
        this.setupNetworkMonitoring();
    }

    /**
     * 설정 로드
     */
    loadConfigurations() {
        // Slack 설정 로드
        this.slackWebhookUrl = localStorage.getItem('slackWebhookUrl');
        
        // Jira 설정 로드
        const jiraConfig = localStorage.getItem('jiraConfig');
        if (jiraConfig) {
            this.jiraConfig = JSON.parse(jiraConfig);
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
    handleOnline() {
        console.log('네트워크 연결 복구됨 - 연동 서비스 활성화');
    }

    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        console.log('네트워크 연결 끊어짐 - 연동 서비스 비활성화');
    }

    /**
     * Slack 설정
     * @param {string} webhookUrl - Slack Webhook URL
     */
    setSlackWebhook(webhookUrl) {
        this.slackWebhookUrl = webhookUrl;
        localStorage.setItem('slackWebhookUrl', webhookUrl);
        console.log('Slack Webhook 설정됨');
    }

    /**
     * Jira 설정
     * @param {Object} config - Jira 설정
     */
    setJiraConfig(config) {
        this.jiraConfig = config;
        localStorage.setItem('jiraConfig', JSON.stringify(config));
        console.log('Jira 설정됨');
    }

    /**
     * Slack 알림 전송 (I001 요구사항)
     * @param {Object} data - 전송할 데이터
     * @returns {Promise<boolean>} 전송 성공 여부
     */
    async sendSlackNotification(data) {
        if (!this.slackWebhookUrl) {
            console.warn('Slack Webhook URL이 설정되지 않았습니다.');
            return false;
        }

        if (!this.isOnline) {
            console.log('오프라인 상태 - Slack 알림을 대기열에 추가');
            await this.addToSyncQueue('slack', data);
            return false;
        }

        try {
            const message = this.formatSlackMessage(data);
            
            const response = await fetch(this.slackWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            if (response.ok) {
                console.log('Slack 알림 전송 성공');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Slack 알림 전송 실패:', error);
            
            // 실패한 경우 대기열에 추가
            await this.addToSyncQueue('slack', data);
            return false;
        }
    }

    /**
     * Slack 메시지 포맷팅
     * @param {Object} data - 원본 데이터
     * @returns {Object} Slack 메시지 형식
     */
    formatSlackMessage(data) {
        const timestamp = new Date().toLocaleString('ko-KR');
        
        return {
            text: `🔧 현장 서비스 작업 완료`,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "🔧 현장 서비스 작업 완료",
                        emoji: true
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*장비 코드:*\n${data.equipment_code || 'N/A'}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*작업 장소:*\n${data.work_location || 'N/A'}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*작업 내용:*\n${data.work_description || 'N/A'}`
                    }
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `⏰ ${timestamp}`
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Jira 이슈 생성 (I002 요구사항)
     * @param {Object} data - 이슈 데이터
     * @returns {Promise<boolean>} 생성 성공 여부
     */
    async createJiraIssue(data) {
        if (!this.jiraConfig) {
            console.warn('Jira 설정이 완료되지 않았습니다.');
            return false;
        }

        if (!this.isOnline) {
            console.log('오프라인 상태 - Jira 이슈 생성을 대기열에 추가');
            await this.addToSyncQueue('jira', data);
            return false;
        }

        try {
            const issueData = this.formatJiraIssue(data);
            
            const response = await fetch(`${this.jiraConfig.baseUrl}/rest/api/2/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${this.jiraConfig.username}:${this.jiraConfig.apiToken}`)}`
                },
                body: JSON.stringify(issueData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Jira 이슈 생성 성공:', result.key);
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Jira 이슈 생성 실패:', error);
            
            // 실패한 경우 대기열에 추가
            await this.addToSyncQueue('jira', data);
            return false;
        }
    }

    /**
     * Jira 이슈 포맷팅
     * @param {Object} data - 원본 데이터
     * @returns {Object} Jira 이슈 형식
     */
    formatJiraIssue(data) {
        const timestamp = new Date().toLocaleString('ko-KR');
        
        return {
            fields: {
                project: {
                    key: this.jiraConfig.projectKey
                },
                summary: `현장 서비스 작업 - ${data.equipment_code || '장비 코드 없음'}`,
                description: `
*작업 장소:* ${data.work_location || 'N/A'}
*작업 내용:* ${data.work_description || 'N/A'}
*작업 시간:* ${timestamp}

---
*자동 생성된 이슈입니다.*
                `.trim(),
                issuetype: {
                    name: "Task"
                },
                priority: {
                    name: "Medium"
                },
                labels: ["field-service", "auto-generated"]
            }
        };
    }

    /**
     * 동기화 대기열에 추가
     * @param {string} type - 동기화 타입
     * @param {Object} data - 동기화할 데이터
     */
    async addToSyncQueue(type, data) {
        try {
            if (window.offlineStorage) {
                await window.offlineStorage.addToSyncQueue({
                    type: type,
                    data: data
                });
                console.log(`${type} 동기화 항목이 대기열에 추가됨`);
            }
        } catch (error) {
            console.error('동기화 대기열 추가 실패:', error);
        }
    }

    /**
     * 작업 완료 알림 전송
     * @param {Object} reportData - 보고서 데이터
     */
    async sendWorkCompletionNotification(reportData) {
        const promises = [];

        // Slack 알림 전송
        if (this.slackWebhookUrl) {
            promises.push(this.sendSlackNotification(reportData));
        }

        // Jira 이슈 생성
        if (this.jiraConfig) {
            promises.push(this.createJiraIssue(reportData));
        }

        try {
            const results = await Promise.allSettled(promises);
            const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
            
            if (successCount > 0) {
                this.showSuccess(`${successCount}개의 서비스로 알림이 전송되었습니다.`);
            } else {
                this.showWarning('알림 전송이 실패했습니다. 오프라인 대기열에 저장되었습니다.');
            }
        } catch (error) {
            console.error('알림 전송 실패:', error);
            this.showError('알림 전송 중 오류가 발생했습니다.');
        }
    }

    /**
     * Slack 설정 테스트
     * @param {string} webhookUrl - 테스트할 Webhook URL
     * @returns {Promise<boolean>} 테스트 성공 여부
     */
    async testSlackConnection(webhookUrl) {
        try {
            const testMessage = {
                text: "🔧 현장 서비스 PWA 연결 테스트",
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "현장 서비스 PWA에서 Slack 연동 테스트를 수행했습니다."
                        }
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: `⏰ ${new Date().toLocaleString('ko-KR')}`
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testMessage)
            });

            return response.ok;
        } catch (error) {
            console.error('Slack 연결 테스트 실패:', error);
            return false;
        }
    }

    /**
     * Jira 연결 테스트
     * @param {Object} config - Jira 설정
     * @returns {Promise<boolean>} 테스트 성공 여부
     */
    async testJiraConnection(config) {
        try {
            const response = await fetch(`${config.baseUrl}/rest/api/2/myself`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(`${config.username}:${config.apiToken}`)}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Jira 연결 테스트 실패:', error);
            return false;
        }
    }

    /**
     * 설정 UI 표시
     */
    showSettingsUI() {
        const settingsHTML = `
            <div class="settings-modal">
                <div class="settings-content">
                    <h3>외부 서비스 설정</h3>
                    
                    <div class="setting-section">
                        <h4>Slack 설정</h4>
                        <input type="text" id="slack-webhook" placeholder="Slack Webhook URL" value="${this.slackWebhookUrl || ''}">
                        <button onclick="testSlackConnection()">연결 테스트</button>
                    </div>
                    
                    <div class="setting-section">
                        <h4>Jira 설정</h4>
                        <input type="text" id="jira-url" placeholder="Jira Base URL" value="${this.jiraConfig?.baseUrl || ''}">
                        <input type="text" id="jira-username" placeholder="Jira Username" value="${this.jiraConfig?.username || ''}">
                        <input type="password" id="jira-token" placeholder="Jira API Token" value="${this.jiraConfig?.apiToken || ''}">
                        <input type="text" id="jira-project" placeholder="Jira Project Key" value="${this.jiraConfig?.projectKey || ''}">
                        <button onclick="testJiraConnection()">연결 테스트</button>
                    </div>
                    
                    <div class="setting-actions">
                        <button onclick="saveIntegrationsSettings()">설정 저장</button>
                        <button onclick="closeSettingsUI()">닫기</button>
                    </div>
                </div>
            </div>
        `;

        // 기존 모달 제거
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 새 모달 추가
        document.body.insertAdjacentHTML('beforeend', settingsHTML);
    }

    /**
     * 설정 저장
     */
    saveSettings() {
        const slackWebhook = document.getElementById('slack-webhook')?.value;
        const jiraUrl = document.getElementById('jira-url')?.value;
        const jiraUsername = document.getElementById('jira-username')?.value;
        const jiraToken = document.getElementById('jira-token')?.value;
        const jiraProject = document.getElementById('jira-project')?.value;

        if (slackWebhook) {
            this.setSlackWebhook(slackWebhook);
        }

        if (jiraUrl && jiraUsername && jiraToken && jiraProject) {
            this.setJiraConfig({
                baseUrl: jiraUrl,
                username: jiraUsername,
                apiToken: jiraToken,
                projectKey: jiraProject
            });
        }

        this.showSuccess('설정이 저장되었습니다.');
        this.closeSettingsUI();
    }

    /**
     * 설정 UI 닫기
     */
    closeSettingsUI() {
        const modal = document.querySelector('.settings-modal');
        if (modal) {
            modal.remove();
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
     * 연동 상태 확인
     * @returns {Object} 연동 상태
     */
    getIntegrationStatus() {
        return {
            slack: {
                configured: !!this.slackWebhookUrl,
                online: this.isOnline
            },
            jira: {
                configured: !!this.jiraConfig,
                online: this.isOnline
            }
        };
    }
}

// 전역 인스턴스 생성
window.integrations = new Integrations();

// 전역 함수들
window.sendSlackNotification = function(data) {
    return window.integrations.sendSlackNotification(data);
};

window.createJiraIssue = function(data) {
    return window.integrations.createJiraIssue(data);
};

window.sendWorkCompletionNotification = function(reportData) {
    return window.integrations.sendWorkCompletionNotification(reportData);
};

window.showIntegrationsSettings = function() {
    window.integrations.showSettingsUI();
};

window.testSlackConnection = async function() {
    const webhookUrl = document.getElementById('slack-webhook')?.value;
    if (!webhookUrl) {
        window.integrations.showError('Slack Webhook URL을 입력해주세요.');
        return;
    }

    const success = await window.integrations.testSlackConnection(webhookUrl);
    if (success) {
        window.integrations.showSuccess('Slack 연결 테스트 성공!');
    } else {
        window.integrations.showError('Slack 연결 테스트 실패. URL을 확인해주세요.');
    }
};

window.testJiraConnection = async function() {
    const config = {
        baseUrl: document.getElementById('jira-url')?.value,
        username: document.getElementById('jira-username')?.value,
        apiToken: document.getElementById('jira-token')?.value,
        projectKey: document.getElementById('jira-project')?.value
    };

    if (!config.baseUrl || !config.username || !config.apiToken || !config.projectKey) {
        window.integrations.showError('모든 Jira 설정을 입력해주세요.');
        return;
    }

    const success = await window.integrations.testJiraConnection(config);
    if (success) {
        window.integrations.showSuccess('Jira 연결 테스트 성공!');
    } else {
        window.integrations.showError('Jira 연결 테스트 실패. 설정을 확인해주세요.');
    }
};

window.saveIntegrationsSettings = function() {
    window.integrations.saveSettings();
};

window.closeSettingsUI = function() {
    window.integrations.closeSettingsUI();
};

console.log('외부 서비스 연동 모듈 로드됨'); 