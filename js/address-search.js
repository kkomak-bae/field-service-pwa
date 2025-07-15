/**
 * 주소 검색 모듈
 * PRD 요구사항: F003 - 주소 검색
 * 기술: Daum 우편번호 API
 */

class AddressSearch {
    constructor() {
        this.searchHistory = [];
        this.maxHistorySize = 20;
        this.currentAddress = null;
        this.daumPostcode = null;
        
        this.init();
    }

    /**
     * 주소 검색기 초기화
     */
    init() {
        console.log('주소 검색기 초기화');
        
        // Daum 우편번호 API 로드
        this.loadDaumPostcodeAPI();
        
        // 검색 히스토리 로드
        this.loadSearchHistory();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    /**
     * Daum 우편번호 API 로드
     */
    loadDaumPostcodeAPI() {
        // 이미 로드된 경우 스킵
        if (window.daum && window.daum.Postcode) {
            this.daumPostcode = window.daum.Postcode;
            return;
        }

        // 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.onload = () => {
            this.daumPostcode = window.daum.Postcode;
            console.log('Daum 우편번호 API 로드 완료');
        };
        script.onerror = () => {
            console.error('Daum 우편번호 API 로드 실패');
        };
        document.head.appendChild(script);
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 주소 검색 버튼 이벤트
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.openSearch());
        }

        // 주소 입력 필드 이벤트
        const addressInput = document.getElementById('work-location');
        if (addressInput) {
            addressInput.addEventListener('focus', () => this.showSearchSuggestions());
            addressInput.addEventListener('input', (e) => this.handleAddressInput(e));
        }
    }

    /**
     * 주소 검색 열기
     */
    openSearch() {
        if (!this.daumPostcode) {
            this.showError('주소 검색 서비스를 불러올 수 없습니다.');
            return;
        }

        const postcode = new this.daumPostcode({
            oncomplete: (data) => {
                this.handleAddressSelected(data);
            },
            onclose: () => {
                console.log('주소 검색 창이 닫혔습니다.');
            }
        });

        postcode.open();
    }

    /**
     * 주소 선택 처리
     * @param {Object} data - 선택된 주소 데이터
     */
    handleAddressSelected(data) {
        console.log('선택된 주소:', data);

        // 주소 정보 구성
        const addressInfo = {
            postcode: data.zonecode,
            address: data.address,
            addressType: data.addressType,
            bname: data.bname,
            bname1: data.bname1,
            bname2: data.bname2,
            sido: data.sido,
            sigungu: data.sigungu,
            sigunguCode: data.sigunguCode,
            bcode: data.bcode,
            roadAddress: data.roadAddress,
            roadAddressEnglish: data.roadAddressEnglish,
            jibunAddress: data.jibunAddress,
            jibunAddressEnglish: data.jibunAddressEnglish,
            autoRoadAddress: data.autoRoadAddress,
            autoJibunAddress: data.autoJibunAddress,
            userLanguageType: data.userLanguageType,
            noSelected: data.noSelected,
            userSelectedType: data.userSelectedType,
            roadnameCode: data.roadnameCode,
            roadname: data.roadname,
            buildingCode: data.buildingCode,
            buildingName: data.buildingName,
            apartment: data.apartment,
            jibunAddressEnglish: data.jibunAddressEnglish,
            roadAddressEnglish: data.roadAddressEnglish,
            selectedAddress: data.selectedAddress,
            timestamp: new Date().toISOString()
        };

        this.currentAddress = addressInfo;

        // 주소 입력 필드에 설정
        this.setAddressToInput(addressInfo);

        // 검색 히스토리에 추가
        this.addToSearchHistory(addressInfo);

        // GPS 좌표 가져오기 (선택적)
        this.getGPSFromAddress(addressInfo.address);

        // 성공 알림
        this.showSuccess('주소가 선택되었습니다.');
    }

    /**
     * 주소를 입력 필드에 설정
     * @param {Object} addressInfo - 주소 정보
     */
    setAddressToInput(addressInfo) {
        const addressInput = document.getElementById('work-location');
        if (addressInput) {
            // 도로명 주소 우선, 없으면 지번 주소
            const displayAddress = addressInfo.roadAddress || addressInfo.address;
            addressInput.value = displayAddress;
            
            // 입력 이벤트 발생
            addressInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    /**
     * 주소로부터 GPS 좌표 가져오기
     * @param {string} address - 주소
     */
    async getGPSFromAddress(address) {
        try {
            // 카카오 지도 API를 사용한 좌표 변환 (실제 구현 시 API 키 필요)
            const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
                headers: {
                    'Authorization': 'KakaoAK YOUR_API_KEY' // 실제 API 키로 교체 필요
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.documents && data.documents.length > 0) {
                    const coords = data.documents[0];
                    this.currentAddress.latitude = parseFloat(coords.y);
                    this.currentAddress.longitude = parseFloat(coords.x);
                    console.log('GPS 좌표:', { lat: coords.y, lng: coords.x });
                }
            }
        } catch (error) {
            console.error('GPS 좌표 변환 실패:', error);
            // GPS 없이도 계속 진행
        }
    }

    /**
     * 주소 입력 처리
     * @param {Event} event - 입력 이벤트
     */
    handleAddressInput(event) {
        const value = event.target.value;
        
        // 입력값이 변경되면 현재 주소 초기화
        if (value !== this.currentAddress?.address) {
            this.currentAddress = null;
        }
    }

    /**
     * 검색 제안 표시
     */
    showSearchSuggestions() {
        // 최근 검색 히스토리 표시
        const recentSearches = this.getSearchHistory().slice(0, 5);
        
        if (recentSearches.length > 0) {
            this.showSearchDropdown(recentSearches);
        }
    }

    /**
     * 검색 드롭다운 표시
     * @param {Array} suggestions - 제안 목록
     */
    showSearchDropdown(suggestions) {
        // 기존 드롭다운 제거
        const existingDropdown = document.querySelector('.address-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // 새 드롭다운 생성
        const dropdown = document.createElement('div');
        dropdown.className = 'address-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
        `;

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = suggestion.address;
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f1f5f9;
            `;
            
            item.addEventListener('click', () => {
                this.setAddressToInput(suggestion);
                dropdown.remove();
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8fafc';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            dropdown.appendChild(item);
        });

        // 입력 필드에 드롭다운 추가
        const addressInput = document.getElementById('work-location');
        if (addressInput) {
            addressInput.parentNode.style.position = 'relative';
            addressInput.parentNode.appendChild(dropdown);
        }

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== addressInput) {
                dropdown.remove();
            }
        });
    }

    /**
     * 검색 히스토리에 추가
     * @param {Object} addressInfo - 주소 정보
     */
    addToSearchHistory(addressInfo) {
        // 중복 제거
        this.searchHistory = this.searchHistory.filter(item => 
            item.address !== addressInfo.address
        );

        // 맨 앞에 추가
        this.searchHistory.unshift(addressInfo);

        // 히스토리 크기 제한
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }

        // 로컬 스토리지에 저장
        this.saveSearchHistory();
    }

    /**
     * 검색 히스토리 저장
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('addressSearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('검색 히스토리 저장 실패:', error);
        }
    }

    /**
     * 검색 히스토리 로드
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('addressSearchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('검색 히스토리 로드 실패:', error);
            this.searchHistory = [];
        }
    }

    /**
     * 검색 히스토리 가져오기
     * @returns {Array} 검색 히스토리
     */
    getSearchHistory() {
        return this.searchHistory;
    }

    /**
     * 현재 주소 정보 가져오기
     * @returns {Object|null} 현재 주소 정보
     */
    getCurrentAddress() {
        return this.currentAddress;
    }

    /**
     * 주소 검색 (F003 요구사항)
     */
    search() {
        this.openSearch();
    }

    /**
     * 주소 유효성 검사
     * @param {string} address - 검사할 주소
     * @returns {boolean} 유효성 여부
     */
    validateAddress(address) {
        if (!address || address.trim().length === 0) {
            return false;
        }

        // 기본적인 주소 형식 검사
        const addressPattern = /^[가-힣0-9\s\-()]+$/;
        return addressPattern.test(address.trim());
    }

    /**
     * 주소 정규화
     * @param {string} address - 정규화할 주소
     * @returns {string} 정규화된 주소
     */
    normalizeAddress(address) {
        return address
            .trim()
            .replace(/\s+/g, ' ') // 연속된 공백을 하나로
            .replace(/[^\w\s가-힣\-()]/g, ''); // 특수문자 제거 (하이픈과 괄호 제외)
    }

    /**
     * 주소 검색 API 호출 (대체 방법)
     * @param {string} query - 검색 쿼리
     * @returns {Promise<Array>} 검색 결과
     */
    async searchAddressAPI(query) {
        try {
            // 실제 구현 시에는 적절한 주소 검색 API 사용
            // 여기서는 예시로 로컬 검색을 시뮬레이션
            const results = this.searchHistory.filter(item =>
                item.address.toLowerCase().includes(query.toLowerCase())
            );
            
            return results;
        } catch (error) {
            console.error('주소 검색 API 호출 실패:', error);
            return [];
        }
    }

    /**
     * GPS 좌표로 주소 가져오기
     * @param {number} latitude - 위도
     * @param {number} longitude - 경도
     * @returns {Promise<Object|null>} 주소 정보
     */
    async getAddressFromGPS(latitude, longitude) {
        try {
            // 실제 구현 시에는 역지오코딩 API 사용
            // 여기서는 예시로 반환
            return {
                address: `GPS 기반 주소 (${latitude}, ${longitude})`,
                latitude: latitude,
                longitude: longitude,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('GPS 기반 주소 검색 실패:', error);
            return null;
        }
    }

    /**
     * 현재 위치 기반 주소 검색
     */
    async getCurrentLocationAddress() {
        try {
            const position = await this.getCurrentPosition();
            const addressInfo = await this.getAddressFromGPS(
                position.coords.latitude,
                position.coords.longitude
            );
            
            if (addressInfo) {
                this.currentAddress = addressInfo;
                this.setAddressToInput(addressInfo);
                this.addToSearchHistory(addressInfo);
                this.showSuccess('현재 위치 기반 주소가 설정되었습니다.');
            }
        } catch (error) {
            console.error('현재 위치 기반 주소 검색 실패:', error);
            this.showError('현재 위치를 가져올 수 없습니다.');
        }
    }

    /**
     * 현재 위치 가져오기
     * @returns {Promise<GeolocationPosition>} 위치 정보
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('지리 위치를 지원하지 않습니다.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    /**
     * 검색 히스토리 지우기
     */
    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('addressSearchHistory');
        console.log('주소 검색 히스토리가 지워졌습니다.');
    }

    /**
     * 에러 처리
     * @param {string} message - 에러 메시지
     */
    handleError(message) {
        console.error('주소 검색 에러:', message);
        this.showError(message);
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
}

// 전역 인스턴스 생성
window.addressSearch = new AddressSearch();

// 전역 함수들
window.openAddressSearch = function() {
    window.addressSearch.openSearch();
};

window.searchAddress = function() {
    window.addressSearch.search();
};

window.getCurrentLocationAddress = function() {
    window.addressSearch.getCurrentLocationAddress();
};

console.log('주소 검색 모듈 로드됨'); 