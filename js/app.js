// Prasia_todo/js/app.js

import { storageManager } from './storage.js';
import { initGNB, updateGNB } from './gnb.js';
import { initSidebar, updateSidebar } from './sidebar.js';
import { initOnboarding } from './onboarding.js';
import { initHome, updateHome } from './home.js';
import { initAccounts, updateAccounts } from './accounts.js';
import { initCharacters, updateCharacters } from './characters.js';

/**
 * 메인 애플리케이션
 * PRD v4 요구사항: 계정 시스템, 온보딩, 전역 상태 관리
 */

class PrasiaTodoApp {
    constructor() {
        this.isInitialized = false;
        this.currentPage = 'home';
        this.currentContent = null;
        this.gnb = null;
        this.sidebar = null;
        
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        try {
            console.log('부캐맹약작 앱 초기화 중...');
            
            // UI 초기화
            this.initializeUI();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 초기 페이지 렌더링
            this.renderInitialPage();
            
            this.isInitialized = true;
            console.log('앱 초기화 완료');
            
        } catch (error) {
            console.error('앱 초기화 실패:', error);
            this.showError('앱 초기화에 실패했습니다.');
        }
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        // GNB 초기화
        this.gnb = initGNB();
        
        // 사이드바 초기화
        this.sidebar = initSidebar();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 페이지 네비게이션 이벤트
        window.addEventListener('navigate', (e) => {
            this.navigateToPage(e.detail.page, e.detail);
        });

        // 계정 변경 이벤트
        window.addEventListener('accountChanged', (e) => {
            this.handleAccountChange(e.detail.accountId);
        });

        // 키보드 단축키
        this.setupKeyboardShortcuts();
    }

    /**
     * 키보드 단축키 설정
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 1-5: 페이지 이동
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const pages = ['home', 'accounts', 'characters', 'tasks', 'settings'];
                const pageIndex = parseInt(e.key) - 1;
                if (pages[pageIndex]) {
                    this.navigateToPage(pages[pageIndex]);
                }
            }
            
            // Ctrl/Cmd + H: 홈으로
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.navigateToPage('home');
            }
        });
    }

    /**
     * 초기 페이지 렌더링
     */
    renderInitialPage() {
        const accounts = storageManager.getAccounts();
        
        if (accounts.length === 0) {
            // 계정이 없으면 온보딩 화면 표시
            this.showOnboarding();
        } else {
            // 계정이 있으면 홈 화면 표시
            this.navigateToPage('home');
        }
    }

    /**
     * 온보딩 화면 표시
     */
    showOnboarding() {
        this.clearContent();
        const onboardingElement = initOnboarding();
        this.currentContent = onboardingElement;
        document.body.appendChild(onboardingElement);
    }

    /**
     * 페이지 네비게이션
     */
    navigateToPage(page, options = {}) {
        console.log(`페이지 이동: ${page}`, options);
        
        this.currentPage = page;
        this.clearContent();
        
        let pageElement = null;
        
        switch (page) {
            case 'home':
                pageElement = initHome();
                break;
            case 'accounts':
                pageElement = initAccounts();
                break;
            case 'characters':
                pageElement = initCharacters();
                break;
            case 'tasks':
                // TODO: Tasks 페이지 구현
                pageElement = this.createPlaceholderPage('Tasks', '할일 관리 페이지는 준비 중입니다.');
                break;
            case 'settings':
                // TODO: Settings 페이지 구현
                pageElement = this.createPlaceholderPage('Settings', '설정 페이지는 준비 중입니다.');
                break;
            default:
                console.warn(`알 수 없는 페이지: ${page}`);
                pageElement = this.createPlaceholderPage('404', '페이지를 찾을 수 없습니다.');
        }
        
        if (pageElement) {
            this.currentContent = pageElement;
            document.body.appendChild(pageElement);
            
            // 사이드바 활성 상태 업데이트
            if (this.sidebar) {
                this.sidebar.setActivePage(page);
            }
        }
    }

    /**
     * 계정 변경 처리
     */
    handleAccountChange(accountId) {
        console.log(`계정 변경: ${accountId}`);
        
        // 현재 페이지가 계정에 의존적인 경우 새로고침
        const accountDependentPages = ['home', 'characters', 'tasks'];
        if (accountDependentPages.includes(this.currentPage)) {
            this.refreshCurrentPage();
        }
    }

    /**
     * 현재 페이지 새로고침
     */
    refreshCurrentPage() {
        switch (this.currentPage) {
            case 'home':
                updateHome();
                break;
            case 'accounts':
                updateAccounts();
                break;
            case 'characters':
                updateCharacters();
                break;
            case 'tasks':
                // TODO: Tasks 페이지 새로고침
                break;
            case 'settings':
                // TODO: Settings 페이지 새로고침
                break;
        }
    }

    /**
     * 콘텐츠 영역 클리어
     */
    clearContent() {
        if (this.currentContent && this.currentContent.parentNode) {
            this.currentContent.parentNode.removeChild(this.currentContent);
        }
        this.currentContent = null;
    }

    /**
     * 플레이스홀더 페이지 생성
     */
    createPlaceholderPage(title, message) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-page';
        placeholder.innerHTML = `
            <div class="placeholder-container">
                <h1 class="placeholder-title">${title}</h1>
                <p class="placeholder-message">${message}</p>
                <button class="btn btn-primary" onclick="app.navigateToPage('home')">
                    홈으로 돌아가기
                </button>
            </div>
        `;
        return placeholder;
    }

    /**
     * 에러 표시
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-overlay';
        errorDiv.innerHTML = `
            <div class="error-container">
                <h2>오류 발생</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    페이지 새로고침
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * 앱 상태 확인
     */
    getAppStatus() {
        const accounts = storageManager.getAccounts();
        const selectedAccount = storageManager.getSelectedAccount();
        
        return {
            initialized: this.isInitialized,
            currentPage: this.currentPage,
            accountsCount: accounts.length,
            selectedAccount: selectedAccount ? selectedAccount.name : null,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * 앱 재시작
     */
    restart() {
        try {
            // 모든 데이터 저장
            // storageManager는 자동으로 저장되므로 별도 처리 불필요
            
            // 페이지 새로고침
            window.location.reload();
        } catch (error) {
            console.error('앱 재시작 실패:', error);
        }
    }
}

// 전역 앱 인스턴스 생성
const app = new PrasiaTodoApp();

// 전역에서 접근 가능하도록 설정
window.app = app;
window.storageManager = storageManager;

// 개발자 도구용 디버그 함수들
window.debug = {
    getAppStatus: () => app.getAppStatus(),
    getAccounts: () => storageManager.getAccounts(),
    getSelectedAccount: () => storageManager.getSelectedAccount(),
    getCharacters: (accountId) => storageManager.getCharacters(accountId),
    restart: () => app.restart()
};

// 내보내기
export default app;