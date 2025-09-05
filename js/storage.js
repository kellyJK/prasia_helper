// Prasia_todo/js/storage.js

import { generateUUID, getCurrentTimestamp, DEFAULT_SETTINGS, SCHEMA_VERSION } from './data.js';

/**
 * 로컬 스토리지 기반 데이터 관리 시스템
 * PRD v4 요구사항: Account 시스템, 마이그레이션 지원
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            meta: 'prasia.meta',
            accounts: 'prasia.accounts',
            characters: 'prasia.characters',
            tasks: 'prasia.tasks',
            settings: 'prasia.settings'
        };
    }

    /**
     * 스키마 버전 확인 및 마이그레이션
     */
    checkAndMigrate() {
        const meta = this.load(this.storageKeys.meta, { schemaVersion: 0 });
        const currentVersion = meta.schemaVersion || 0;

        if (currentVersion < SCHEMA_VERSION) {
            console.log(`마이그레이션 시작: v${currentVersion} → v${SCHEMA_VERSION}`);
            this.migrateToV4(currentVersion);
            this.save(this.storageKeys.meta, { schemaVersion: SCHEMA_VERSION });
            console.log('마이그레이션 완료');
        }
    }

    /**
     * v3 → v4 마이그레이션
     */
    migrateToV4(fromVersion) {
        // 기존 데이터 로드
        const oldCharacters = this.load('linea_todo_characters', []);
        const oldTasks = this.load('linea_todo_tasks', []);
        const oldSettings = this.load('linea_todo_settings', {});

        // Account 생성 (기존 캐릭터들을 하나의 계정으로 통합)
        if (oldCharacters.length > 0) {
            const defaultAccount = {
                id: generateUUID(),
                name: '기본 계정',
                isPrimary: true,
                covenants: {
                    purchased: [],
                    total: 16
                },
                createdAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp()
            };

            this.save(this.storageKeys.accounts, [defaultAccount]);

            // 캐릭터에 accountId 추가
            const migratedCharacters = oldCharacters.map(char => ({
                ...char,
                accountId: defaultAccount.id,
                level: char.level || 1,
                zones: {
                    크론: '0',
                    라인소프: '0',
                    시길: '0',
                    아민타: '0',
                    론도: '0'
                }
            }));

            this.save(this.storageKeys.characters, migratedCharacters);

            // 설정 마이그레이션
            const migratedSettings = {
                ...DEFAULT_SETTINGS,
                ...oldSettings,
                selectedAccountId: defaultAccount.id
            };

            this.save(this.storageKeys.settings, migratedSettings);
        }

        // 기존 할일 데이터 마이그레이션
        if (oldTasks.length > 0) {
            this.save(this.storageKeys.tasks, oldTasks);
        }

        // 기존 데이터 정리
        localStorage.removeItem('linea_todo_characters');
        localStorage.removeItem('linea_todo_tasks');
        localStorage.removeItem('linea_todo_settings');
    }

    /**
     * 데이터 저장
     */
    save(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error(`데이터 저장 실패 (${key}):`, error);
            return false;
        }
    }

    /**
     * 데이터 로드
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                return defaultValue;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error(`데이터 로드 실패 (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * 데이터 삭제
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`데이터 삭제 실패 (${key}):`, error);
            return false;
        }
    }

    // ===== Account 관리 =====

    /**
     * 계정 저장
     */
    saveAccounts(accounts) {
        return this.save(this.storageKeys.accounts, accounts);
    }

    /**
     * 계정 로드
     */
    getAccounts() {
        return this.load(this.storageKeys.accounts, []);
    }

    /**
     * 계정 추가
     */
    addAccount(accountData) {
        const accounts = this.getAccounts();
        const newAccount = {
            id: generateUUID(),
            name: accountData.name,
            isPrimary: accountData.isPrimary || false,
            covenants: {
                purchased: accountData.covenants?.purchased || [],
                total: 16
            },
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        };

        accounts.push(newAccount);
        this.saveAccounts(accounts);
        return newAccount;
    }

    /**
     * 계정 업데이트
     */
    updateAccount(accountId, updateData) {
        const accounts = this.getAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            accounts[accountIndex] = {
                ...accounts[accountIndex],
                ...updateData,
                updatedAt: getCurrentTimestamp()
            };
            this.saveAccounts(accounts);
            return accounts[accountIndex];
        }
        return null;
    }

    /**
     * 계정 삭제
     */
    deleteAccount(accountId) {
        const accounts = this.getAccounts();
        const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
        
        if (filteredAccounts.length !== accounts.length) {
            this.saveAccounts(filteredAccounts);
            
            // 해당 계정의 캐릭터들도 삭제
            const characters = this.getCharacters();
            const filteredCharacters = characters.filter(char => char.accountId !== accountId);
            this.saveCharacters(filteredCharacters);
            
            // 해당 계정의 할일들도 삭제
            const tasks = this.getTasks();
            const characterIds = new Set(filteredCharacters.map(char => char.id));
            const filteredTasks = tasks.filter(task => characterIds.has(task.characterId));
            this.saveTasks(filteredTasks);
            
            return true;
        }
        return false;
    }

    /**
     * 선택된 계정 가져오기
     */
    getSelectedAccount() {
        const settings = this.getSettings();
        const accounts = this.getAccounts();
        return accounts.find(acc => acc.id === settings.selectedAccountId) || accounts[0] || null;
    }

    /**
     * 계정 선택
     */
    selectAccount(accountId) {
        const settings = this.getSettings();
        settings.selectedAccountId = accountId;
        this.saveSettings(settings);
    }

    // ===== Character 관리 =====

    /**
     * 캐릭터 저장
     */
    saveCharacters(characters) {
        return this.save(this.storageKeys.characters, characters);
    }

    /**
     * 캐릭터 로드
     */
    getCharacters(accountId = null) {
        const characters = this.load(this.storageKeys.characters, []);
        if (accountId) {
            return characters.filter(char => char.accountId === accountId);
        }
        return characters;
    }

    /**
     * 캐릭터 추가
     */
    addCharacter(characterData) {
        const characters = this.getCharacters();
        const newCharacter = {
            id: generateUUID(),
            accountId: characterData.accountId,
            name: characterData.name,
            server: characterData.server,
            serverChannel: characterData.serverChannel,
            color: characterData.color || '#6366f1',
            isActive: characterData.isActive !== undefined ? characterData.isActive : true,
            level: characterData.level || 1,
            zones: {
                크론: '0',
                라인소프: '0',
                시길: '0',
                아민타: '0',
                론도: '0'
            },
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        };

        characters.push(newCharacter);
        this.saveCharacters(characters);
        return newCharacter;
    }

    /**
     * 캐릭터 업데이트
     */
    updateCharacter(characterId, updateData) {
        const characters = this.getCharacters();
        const characterIndex = characters.findIndex(char => char.id === characterId);
        
        if (characterIndex !== -1) {
            characters[characterIndex] = {
                ...characters[characterIndex],
                ...updateData,
                updatedAt: getCurrentTimestamp()
            };
            this.saveCharacters(characters);
            return characters[characterIndex];
        }
        return null;
    }

    /**
     * 캐릭터 삭제
     */
    deleteCharacter(characterId) {
        const characters = this.getCharacters();
        const filteredCharacters = characters.filter(char => char.id !== characterId);
        
        if (filteredCharacters.length !== characters.length) {
            this.saveCharacters(filteredCharacters);
            
            // 해당 캐릭터의 할일들도 삭제
            const tasks = this.getTasks();
            const filteredTasks = tasks.filter(task => task.characterId !== characterId);
            this.saveTasks(filteredTasks);
            
            return true;
        }
        return false;
    }

    // ===== Task 관리 =====

    /**
     * 할일 저장
     */
    saveTasks(tasks) {
        return this.save(this.storageKeys.tasks, tasks);
    }

    /**
     * 할일 로드
     */
    getTasks(characterId = null) {
        const tasks = this.load(this.storageKeys.tasks, []);
        if (characterId) {
            return tasks.filter(task => task.characterId === characterId);
        }
        return tasks;
    }

    /**
     * 할일 추가
     */
    addTask(taskData) {
        const tasks = this.getTasks();
        const newTask = {
            id: generateUUID(),
            characterId: taskData.characterId,
            title: taskData.title,
            notes: taskData.notes || '',
            type: taskData.type || '기타',
            status: taskData.status || 'todo',
            priority: taskData.priority || 1,
            region: taskData.region || '',
            location: taskData.location || '',
            tobelStep: taskData.tobelStep || null,
            favorStage: taskData.favorStage || '',
            dueAt: taskData.dueAt || null,
            notifyAt: taskData.notifyAt || null,
            tags: taskData.tags || [],
            checklist: taskData.checklist || [],
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        };

        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    }

    /**
     * 할일 업데이트
     */
    updateTask(taskId, updateData) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                ...updateData,
                updatedAt: getCurrentTimestamp()
            };
            this.saveTasks(tasks);
            return tasks[taskIndex];
        }
        return null;
    }

    /**
     * 할일 삭제
     */
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length !== tasks.length) {
            this.saveTasks(filteredTasks);
            return true;
        }
        return false;
    }

    // ===== Settings 관리 =====

    /**
     * 설정 저장
     */
    saveSettings(settings) {
        return this.save(this.storageKeys.settings, settings);
    }

    /**
     * 설정 로드
     */
    getSettings() {
        return this.load(this.storageKeys.settings, DEFAULT_SETTINGS);
    }

    /**
     * 설정 업데이트
     */
    updateSettings(updateData) {
        const settings = this.getSettings();
        const updatedSettings = { ...settings, ...updateData };
        this.saveSettings(updatedSettings);
        return updatedSettings;
    }

    // ===== 유틸리티 함수 =====

    /**
     * 데이터 초기화
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            this.remove(key);
        });
    }

    /**
     * 데이터 백업
     */
    exportData() {
        const data = {
            accounts: this.getAccounts(),
            characters: this.getCharacters(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: SCHEMA_VERSION
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prasia-todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    }

    /**
     * 데이터 가져오기
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.accounts) this.saveAccounts(data.accounts);
                    if (data.characters) this.saveCharacters(data.characters);
                    if (data.tasks) this.saveTasks(data.tasks);
                    if (data.settings) this.saveSettings(data.settings);
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file);
        });
    }
}

// 전역 스토리지 매니저 인스턴스
const storageManager = new StorageManager();

// 마이그레이션 실행
storageManager.checkAndMigrate();

// 내보내기
export { storageManager };
export default storageManager;