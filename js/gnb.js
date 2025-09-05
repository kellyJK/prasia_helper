// Prasia_todo/js/gnb.js

import { storageManager } from './storage.js';

/**
 * Global Navigation Bar (GNB) 컴포넌트
 * PRD v4 요구사항: 로고 + 계정 선택 셀렉트
 */

class GNB {
    constructor() {
        this.element = null;
        this.accountSelect = null;
        this.currentAccountId = null;
    }

    /**
     * GNB 렌더링
     */
    render() {
        const gnb = document.createElement('header');
        gnb.className = 'gnb';
        gnb.innerHTML = `
            <div class="gnb-container">
                <div class="gnb-left">
                    <button class="gnb-logo" data-action="navigate" data-page="home">
                        부캐맹약작
                    </button>
                </div>
                <div class="gnb-right">
                    <select class="gnb-account-select" id="accountSelect">
                        <option value="">계정을 선택하세요</option>
                    </select>
                </div>
            </div>
        `;

        this.element = gnb;
        this.accountSelect = gnb.querySelector('#accountSelect');
        
        this.bindEvents();
        this.updateAccountSelect();
        
        return gnb;
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 로고 클릭 - 홈으로 이동
        this.element.querySelector('.gnb-logo').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToPage('home');
        });

        // 계정 선택 변경
        this.accountSelect.addEventListener('change', (e) => {
            const accountId = e.target.value;
            if (accountId) {
                this.selectAccount(accountId);
            }
        });
    }

    /**
     * 계정 선택 드롭다운 업데이트
     */
    updateAccountSelect() {
        const accounts = storageManager.getAccounts();
        const selectedAccount = storageManager.getSelectedAccount();
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (this.accountSelect.children.length > 1) {
            this.accountSelect.removeChild(this.accountSelect.lastChild);
        }

        if (accounts.length === 0) {
            this.accountSelect.disabled = true;
            this.accountSelect.innerHTML = '<option value="">계정이 없습니다</option>';
            return;
        }

        this.accountSelect.disabled = false;
        
        // 계정 옵션 추가
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.isPrimary ? `${account.name} (본)` : account.name;
            option.selected = selectedAccount && account.id === selectedAccount.id;
            this.accountSelect.appendChild(option);
        });

        this.currentAccountId = selectedAccount ? selectedAccount.id : null;
    }

    /**
     * 계정 선택
     */
    selectAccount(accountId) {
        if (this.currentAccountId === accountId) {
            return; // 이미 선택된 계정
        }

        storageManager.selectAccount(accountId);
        this.currentAccountId = accountId;
        
        // 전역 이벤트 발생 (다른 컴포넌트들이 반응하도록)
        window.dispatchEvent(new CustomEvent('accountChanged', {
            detail: { accountId }
        }));

        console.log(`계정 변경: ${accountId}`);
    }

    /**
     * 페이지 네비게이션
     */
    navigateToPage(page) {
        window.dispatchEvent(new CustomEvent('navigate', {
            detail: { page }
        }));
    }

    /**
     * GNB 업데이트 (계정 변경 시 호출)
     */
    update() {
        this.updateAccountSelect();
    }

    /**
     * GNB 제거
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.accountSelect = null;
    }
}

// 전역 GNB 인스턴스
let gnbInstance = null;

/**
 * GNB 초기화 및 렌더링
 */
export function initGNB() {
    if (gnbInstance) {
        gnbInstance.destroy();
    }
    
    gnbInstance = new GNB();
    const gnbElement = gnbInstance.render();
    
    // body에 GNB 추가
    document.body.insertBefore(gnbElement, document.body.firstChild);
    
    return gnbInstance;
}

/**
 * GNB 업데이트
 */
export function updateGNB() {
    if (gnbInstance) {
        gnbInstance.update();
    }
}

/**
 * GNB 인스턴스 가져오기
 */
export function getGNB() {
    return gnbInstance;
}

export default GNB;

