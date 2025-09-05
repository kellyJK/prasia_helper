/**
 * 알림 시스템
 * PRD 요구사항: 브라우저 Notification API + UI 토스트
 */

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.notifications = new Map(); // 알림 ID -> 알림 정보
        this.snoozeIntervals = [5, 15, 60]; // 5분, 15분, 60분
        this.checkInterval = null;
        this.isEnabled = true;
        
        this.init();
    }

    /**
     * 알림 시스템 초기화
     */
    async init() {
        try {
            // 브라우저 알림 권한 요청
            if ('Notification' in window) {
                this.permission = await this.requestPermission();
            } else {
                console.warn('이 브라우저는 알림을 지원하지 않습니다.');
            }
            
            // 알림 체크 시작
            this.startNotificationCheck();
            
            // 페이지 가시성 변경 감지
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseNotificationCheck();
                } else {
                    this.resumeNotificationCheck();
                }
            });
            
        } catch (error) {
            console.error('알림 시스템 초기화 실패:', error);
        }
    }

    /**
     * 브라우저 알림 권한 요청
     */
    async requestPermission() {
        try {
            if (!('Notification' in window)) {
                return 'denied';
            }
            
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showToast('알림이 활성화되었습니다.', 'success');
            } else if (permission === 'denied') {
                this.showToast('알림이 차단되었습니다. 브라우저 설정에서 허용해주세요.', 'warning');
            }
            
            return permission;
        } catch (error) {
            console.error('알림 권한 요청 실패:', error);
            return 'denied';
        }
    }

    /**
     * 알림 체크 시작
     */
    startNotificationCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // 1분마다 알림 체크
        this.checkInterval = setInterval(() => {
            this.checkNotifications();
        }, 60000);
        
        // 즉시 한 번 체크
        this.checkNotifications();
    }

    /**
     * 알림 체크 일시정지
     */
    pauseNotificationCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * 알림 체크 재개
     */
    resumeNotificationCheck() {
        if (!this.checkInterval) {
            this.startNotificationCheck();
        }
    }

    /**
     * 알림 체크 및 발송
     */
    async checkNotifications() {
        if (!this.isEnabled) return;
        
        try {
            const tasks = storageManager.loadTasks();
            const characters = storageManager.loadCharacters();
            const now = Date.now();
            
            for (const task of tasks) {
                // 알림 시간이 지났고, 아직 완료되지 않은 할일
                if (task.notifyAt && task.notifyAt <= now && !task.isCompleted()) {
                    const character = characters.find(char => char.id === task.characterId);
                    const characterName = character ? character.name : '알 수 없음';
                    
                    // 이미 발송된 알림인지 확인
                    const notificationId = `${task.id}_${task.notifyAt}`;
                    if (!this.notifications.has(notificationId)) {
                        await this.sendNotification(task, characterName);
                        this.notifications.set(notificationId, {
                            taskId: task.id,
                            sentAt: now,
                            characterName: characterName
                        });
                    }
                }
            }
        } catch (error) {
            console.error('알림 체크 실패:', error);
        }
    }

    /**
     * 알림 발송
     */
    async sendNotification(task, characterName) {
        try {
            const title = `[${characterName}] ${task.title}`;
            const body = this.createNotificationBody(task);
            const icon = '/icon.svg'; // 앱 아이콘
            
            // 브라우저 알림
            if (this.permission === 'granted') {
                const notification = new Notification(title, {
                    body: body,
                    icon: icon,
                    tag: `task_${task.id}`,
                    requireInteraction: true,
                    actions: [
                        { action: 'complete', title: '완료' },
                        { action: 'snooze_5', title: '5분 후' },
                        { action: 'snooze_15', title: '15분 후' },
                        { action: 'snooze_60', title: '1시간 후' }
                    ]
                });
                
                // 알림 클릭 이벤트
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    this.handleNotificationClick(task);
                };
                
                // 알림 액션 이벤트
                notification.addEventListener('action', (event) => {
                    this.handleNotificationAction(event.action, task);
                });
                
                // 10초 후 자동 닫기
                setTimeout(() => {
                    notification.close();
                }, 10000);
            }
            
            // 토스트 알림
            this.showToast(`${characterName}: ${task.title}`, 'info');
            
        } catch (error) {
            console.error('알림 발송 실패:', error);
        }
    }

    /**
     * 알림 본문 생성
     */
    createNotificationBody(task) {
        let body = '';
        
        if (task.type) {
            body += `유형: ${task.type}\n`;
        }
        
        if (task.region) {
            body += `지역: ${task.region}\n`;
        }
        
        if (task.dueAt) {
            const dueDate = new Date(task.dueAt);
            body += `마감: ${dueDate.toLocaleString()}\n`;
        }
        
        if (task.checklist && task.checklist.length > 0) {
            const completed = task.checklist.filter(item => item.done).length;
            body += `진행률: ${completed}/${task.checklist.length}`;
        }
        
        return body || '할일을 확인해주세요.';
    }

    /**
     * 알림 클릭 처리
     */
    handleNotificationClick(task) {
        // 해당 할일로 스크롤하거나 모달 열기
        if (window.app && window.app.showTaskModal) {
            window.app.showTaskModal(task.id);
        }
    }

    /**
     * 알림 액션 처리
     */
    handleNotificationAction(action, task) {
        switch (action) {
            case 'complete':
                this.completeTask(task);
                break;
            case 'snooze_5':
                this.snoozeTask(task, 5);
                break;
            case 'snooze_15':
                this.snoozeTask(task, 15);
                break;
            case 'snooze_60':
                this.snoozeTask(task, 60);
                break;
        }
    }

    /**
     * 할일 완료 처리
     */
    completeTask(task) {
        try {
            const tasks = storageManager.loadTasks();
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].setStatus('done');
                storageManager.saveTasks(tasks);
                
                this.showToast('할일이 완료되었습니다.', 'success');
                
                // UI 업데이트
                if (window.app && window.app.refreshTasks) {
                    window.app.refreshTasks();
                }
            }
        } catch (error) {
            console.error('할일 완료 처리 실패:', error);
        }
    }

    /**
     * 할일 스누즈 처리
     */
    snoozeTask(task, minutes) {
        try {
            const tasks = storageManager.loadTasks();
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            
            if (taskIndex !== -1) {
                const newNotifyAt = Date.now() + (minutes * 60 * 1000);
                tasks[taskIndex].notifyAt = newNotifyAt;
                tasks[taskIndex].updatedAt = Date.now();
                
                storageManager.saveTasks(tasks);
                
                this.showToast(`${minutes}분 후에 다시 알림을 받습니다.`, 'info');
                
                // UI 업데이트
                if (window.app && window.app.refreshTasks) {
                    window.app.refreshTasks();
                }
            }
        } catch (error) {
            console.error('할일 스누즈 처리 실패:', error);
        }
    }

    /**
     * 토스트 알림 표시
     */
    showToast(message, type = 'info', duration = 5000) {
        try {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            container.appendChild(toast);
            
            // 자동 제거
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
            
        } catch (error) {
            console.error('토스트 알림 표시 실패:', error);
        }
    }

    /**
     * 알림 설정 변경
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.startNotificationCheck();
            this.showToast('알림이 활성화되었습니다.', 'success');
        } else {
            this.pauseNotificationCheck();
            this.showToast('알림이 비활성화되었습니다.', 'info');
        }
    }

    /**
     * 부캐별 알림 설정
     */
    setCharacterNotifications(characterId, enabled) {
        try {
            const settings = storageManager.loadSettings();
            if (!settings.characterNotifications) {
                settings.characterNotifications = {};
            }
            
            settings.characterNotifications[characterId] = enabled;
            storageManager.saveSettings(settings);
            
            const character = storageManager.loadCharacters().find(char => char.id === characterId);
            const characterName = character ? character.name : '알 수 없음';
            const message = enabled ? `${characterName}의 알림이 활성화되었습니다.` : `${characterName}의 알림이 비활성화되었습니다.`;
            
            this.showToast(message, 'info');
        } catch (error) {
            console.error('부캐별 알림 설정 실패:', error);
        }
    }

    /**
     * 부캐별 알림 상태 확인
     */
    isCharacterNotificationEnabled(characterId) {
        try {
            const settings = storageManager.loadSettings();
            if (!settings.characterNotifications) {
                return true; // 기본값은 활성화
            }
            return settings.characterNotifications[characterId] !== false;
        } catch (error) {
            console.error('부캐별 알림 상태 확인 실패:', error);
            return true;
        }
    }

    /**
     * 알림 히스토리 조회
     */
    getNotificationHistory() {
        return Array.from(this.notifications.values());
    }

    /**
     * 알림 히스토리 클리어
     */
    clearNotificationHistory() {
        this.notifications.clear();
        this.showToast('알림 히스토리가 삭제되었습니다.', 'info');
    }

    /**
     * 알림 통계
     */
    getNotificationStats() {
        const history = this.getNotificationHistory();
        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayNotifications = history.filter(notif => notif.sentAt >= today.getTime());
        const weekNotifications = history.filter(notif => notif.sentAt >= (now - 7 * 24 * 60 * 60 * 1000));
        
        return {
            total: history.length,
            today: todayNotifications.length,
            thisWeek: weekNotifications.length,
            enabled: this.isEnabled,
            permission: this.permission
        };
    }

    /**
     * 알림 테스트
     */
    async testNotification() {
        try {
            if (this.permission !== 'granted') {
                await this.requestPermission();
                if (this.permission !== 'granted') {
                    this.showToast('알림 권한이 필요합니다.', 'warning');
                    return false;
                }
            }
            
            const testTask = {
                id: 'test',
                title: '알림 테스트',
                type: '기타',
                characterId: 'test'
            };
            
            await this.sendNotification(testTask, '테스트');
            return true;
        } catch (error) {
            console.error('알림 테스트 실패:', error);
            this.showToast('알림 테스트에 실패했습니다.', 'error');
            return false;
        }
    }

    /**
     * 정리 작업
     */
    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // 오래된 알림 히스토리 정리 (7일 이상)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        for (const [id, notification] of this.notifications.entries()) {
            if (notification.sentAt < weekAgo) {
                this.notifications.delete(id);
            }
        }
    }
}

// 전역 알림 매니저 인스턴스
const notificationManager = new NotificationManager();

// 전역 토스트 함수 (다른 모듈에서 사용)
window.showToast = (message, type, duration) => {
    notificationManager.showToast(message, type, duration);
};

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager, notificationManager };
}
