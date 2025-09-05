/**
 * UI 컴포넌트 및 뷰 전환 관리
 * PRD 요구사항: 보드/리스트/캘린더 뷰 전환, 모달 관리
 */

class UIManager {
    constructor() {
        this.currentView = 'board';
        this.currentFilter = 'all';
        this.currentSort = 'updated';
        this.selectedCharacter = 'all';
        this.draggedTask = null;
        this.modals = new Map();
        
        this.init();
    }

    /**
     * UI 초기화
     */
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupModals();
        this.loadSettings();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 뷰 전환 버튼
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // 필터 및 정렬
        const filterSelect = document.getElementById('filterSelect');
        const sortSelect = document.getElementById('sortSelect');
        const characterSelect = document.getElementById('characterSelect');

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.refreshTasks();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.refreshTasks();
            });
        }

        if (characterSelect) {
            characterSelect.addEventListener('change', (e) => {
                this.selectedCharacter = e.target.value;
                this.refreshTasks();
            });
        }

        // 검색
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTasks(e.target.value);
                }, 300);
            });
        }

        // 사이드바 네비게이션
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                const action = link.dataset.action;
                
                if (view) {
                    this.switchView(view);
                } else if (action) {
                    this.handleNavAction(action);
                }
                
                // 활성 상태 업데이트
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // 플로팅 액션 버튼
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.toggleFabMenu();
            });
        }

        // FAB 메뉴 아이템
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleFabAction(action);
                this.toggleFabMenu();
            });
        });

        // 캘린더 네비게이션
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(-1);
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(1);
            });
        }
    }

    /**
     * 드래그 앤 드롭 설정
     */
    setupDragAndDrop() {
        // 드래그 시작
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                this.draggedTask = e.target.dataset.taskId;
                e.target.classList.add('dragging');
            }
        });

        // 드래그 종료
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
            }
        });

        // 드롭 영역 설정
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedTask) {
                    const newStatus = list.closest('.column').dataset.status;
                    this.moveTask(this.draggedTask, newStatus);
                }
            });
        });
    }

    /**
     * 모달 설정
     */
    setupModals() {
        // 모달 닫기 버튼
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // 모달 배경 클릭으로 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * 설정 로드
     */
    loadSettings() {
        const settings = storageManager.loadSettings();
        this.currentView = settings.currentView || 'board';
        this.currentFilter = settings.currentFilter || 'all';
        this.currentSort = settings.currentSort || 'updated';
        this.selectedCharacter = settings.selectedCharacter || 'all';
        
        this.updateUI();
    }

    /**
     * 설정 저장
     */
    saveSettings() {
        const settings = storageManager.loadSettings();
        settings.currentView = this.currentView;
        settings.currentFilter = this.currentFilter;
        settings.currentSort = this.currentSort;
        settings.selectedCharacter = this.selectedCharacter;
        
        storageManager.saveSettings(settings);
    }

    /**
     * 뷰 전환
     */
    switchView(view) {
        // 뷰 버튼 활성 상태 업데이트
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 뷰 컨테이너 전환
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
        });
        
        const targetView = document.getElementById(`${view}View`);
        if (targetView) {
            targetView.classList.add('active');
        }

        this.currentView = view;
        this.saveSettings();
        this.refreshTasks();
    }

    /**
     * 네비게이션 액션 처리
     */
    handleNavAction(action) {
        switch (action) {
            case 'add-character':
                this.showCharacterModal();
                break;
            case 'character-dashboard':
                this.switchView('characterDashboard');
                break;
        }
    }

    /**
     * FAB 액션 처리
     */
    handleFabAction(action) {
        switch (action) {
            case 'add-task':
                this.showTaskModal();
                break;
            case 'add-template':
                this.showTemplateModal();
                break;
        }
    }

    /**
     * FAB 메뉴 토글
     */
    toggleFabMenu() {
        const menu = document.getElementById('fabMenu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    /**
     * 모달 표시
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.modals.set(modalId, true);
            
            // 포커스 관리
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * 모달 닫기
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            this.modals.delete(modalId);
        }
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        this.modals.forEach((_, modalId) => {
            this.closeModal(modalId);
        });
    }

    /**
     * 할일 모달 표시
     */
    showTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');
        
        if (taskId) {
            // 수정 모드
            const task = this.getTaskById(taskId);
            if (task) {
                title.textContent = '할일 수정';
                this.populateTaskForm(task);
            }
        } else {
            // 추가 모드
            title.textContent = '새 할일 추가';
            form.reset();
        }
        
        this.populateCharacterSelect();
        this.showModal('taskModal');
    }

    /**
     * 부캐 모달 표시
     */
    showCharacterModal(characterId = null) {
        const modal = document.getElementById('characterModal');
        const title = document.getElementById('characterModalTitle');
        const form = document.getElementById('characterForm');
        
        if (characterId) {
            // 수정 모드
            const character = this.getCharacterById(characterId);
            if (character) {
                title.textContent = '부캐 수정';
                this.populateCharacterForm(character);
            }
        } else {
            // 추가 모드
            title.textContent = '새 부캐 추가';
            form.reset();
        }
        
        this.showModal('characterModal');
    }

    /**
     * 부캐 편집 모달 표시 (이름, 레벨, 서버만)
     */
    showCharacterEditModal(characterId) {
        const character = this.getCharacterById(characterId);
        if (!character) {
            console.error('부캐를 찾을 수 없습니다:', characterId);
            return;
        }

        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById('characterEditModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 편집 모달 생성
        const modal = document.createElement('div');
        modal.id = 'characterEditModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">부캐 편집</h3>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-content">
                    <form id="characterEditForm">
                        <div class="form-group">
                            <label for="editCharacterName" class="form-label">부캐 이름</label>
                            <input type="text" id="editCharacterName" class="form-input" value="${character.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editCharacterLevel" class="form-label">레벨</label>
                            <input type="number" id="editCharacterLevel" class="form-input" value="${character.level}" min="1" max="100" required>
                        </div>
                        <div class="form-group">
                            <label for="editCharacterServer" class="form-label">서버</label>
                            <select id="editCharacterServer" class="form-select" required>
                                <option value="">서버를 선택하세요</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editCharacterChannel" class="form-label">채널</label>
                            <select id="editCharacterChannel" class="form-select" required>
                                <option value="">채널을 선택하세요</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="uiManager.closeModal('characterEditModal')">취소</button>
                    <button type="button" class="btn btn-primary" onclick="uiManager.saveCharacterEdit('${characterId}')">저장</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('characterEditModal');

        // 서버 옵션 채우기
        this.populateServerOptions();
        
        // 현재 서버 선택
        const serverSelect = document.getElementById('editCharacterServer');
        serverSelect.value = character.server;
        
        // 채널 옵션 업데이트
        this.updateChannelOptions(character.server);
        
        // 서버 변경 시 채널 옵션 업데이트
        serverSelect.addEventListener('change', (e) => {
            this.updateChannelOptions(e.target.value);
        });
    }

    /**
     * 서버 옵션 채우기
     */
    populateServerOptions() {
        const serverSelect = document.getElementById('editCharacterServer');
        if (!serverSelect) return;

        // SERVERS 데이터 가져오기 (data.js에서 import 필요)
        const servers = {
            '아우리엘': ['01', '04', '05'],
            '론도': ['02', '03', '04'],
            '라인소프': ['01', '02', '03', '05'],
            '시길': ['01', '04'],
            '아민타': ['01', '02', '03', '05'],
            '이오스': ['01', '02', '03'],
            '가리안': ['03', '04', '05'],
            '벨세이즈': ['01', '03', '04'],
            '사도바': ['01', '02', '04'],
            '제롬': ['01', '04', '05'],
            '아티산': ['01', '02', '04'],
            '엘렌': ['01', '02', '04'],
            '나세르': ['01', '02', '03', '05'],
            '필레츠': ['01', '03', '05'],
            '타리아': ['01', '02', '03', '04'],
            '카렐': ['01', '02', '04', '05'],
            '나스카': ['02', '03'],
            '벤아트': ['01', '02', '03'],
            '페넬로페': ['01', '02', '03'],
            '마커스': ['03', '04', '05', '06', '07'],
            '르비안트': ['03'],
            '카시미르': ['01', '02'],
            '트렌체': ['01', '02', '03'],
            '바이람': ['01', '02', '03', '04'],
            '메르비스': ['01', '02', '03']
        };

        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (serverSelect.children.length > 1) {
            serverSelect.removeChild(serverSelect.lastChild);
        }

        // 서버 옵션 추가
        Object.keys(servers).forEach(serverName => {
            const option = document.createElement('option');
            option.value = serverName;
            option.textContent = serverName;
            serverSelect.appendChild(option);
        });
    }

    /**
     * 채널 옵션 업데이트
     */
    updateChannelOptions(serverName) {
        const channelSelect = document.getElementById('editCharacterChannel');
        if (!channelSelect) return;

        const servers = {
            '아우리엘': ['01', '04', '05'],
            '론도': ['02', '03', '04'],
            '라인소프': ['01', '02', '03', '05'],
            '시길': ['01', '04'],
            '아민타': ['01', '02', '03', '05'],
            '이오스': ['01', '02', '03'],
            '가리안': ['03', '04', '05'],
            '벨세이즈': ['01', '03', '04'],
            '사도바': ['01', '02', '04'],
            '제롬': ['01', '04', '05'],
            '아티산': ['01', '02', '04'],
            '엘렌': ['01', '02', '04'],
            '나세르': ['01', '02', '03', '05'],
            '필레츠': ['01', '03', '05'],
            '타리아': ['01', '02', '03', '04'],
            '카렐': ['01', '02', '04', '05'],
            '나스카': ['02', '03'],
            '벤아트': ['01', '02', '03'],
            '페넬로페': ['01', '02', '03'],
            '마커스': ['03', '04', '05', '06', '07'],
            '르비안트': ['03'],
            '카시미르': ['01', '02'],
            '트렌체': ['01', '02', '03'],
            '바이람': ['01', '02', '03', '04'],
            '메르비스': ['01', '02', '03']
        };

        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (channelSelect.children.length > 1) {
            channelSelect.removeChild(channelSelect.lastChild);
        }

        if (serverName && servers[serverName]) {
            servers[serverName].forEach(channel => {
                const option = document.createElement('option');
                option.value = channel;
                option.textContent = channel;
                channelSelect.appendChild(option);
            });
        }
    }

    /**
     * 부캐 편집 저장
     */
    saveCharacterEdit(characterId) {
        const name = document.getElementById('editCharacterName').value.trim();
        const level = parseInt(document.getElementById('editCharacterLevel').value);
        const server = document.getElementById('editCharacterServer').value;
        const channel = document.getElementById('editCharacterChannel').value;

        // 유효성 검사
        if (!name) {
            alert('부캐 이름을 입력해주세요.');
            return;
        }
        if (!level || level < 1 || level > 100) {
            alert('레벨은 1-100 사이의 숫자여야 합니다.');
            return;
        }
        if (!server) {
            alert('서버를 선택해주세요.');
            return;
        }
        if (!channel) {
            alert('채널을 선택해주세요.');
            return;
        }

        try {
            // 캐릭터 업데이트
            const updated = storageManager.updateCharacter(characterId, {
                name: name,
                level: level,
                server: server,
                serverChannel: channel
            });

            if (updated) {
                this.closeModal('characterEditModal');
                this.refreshCharacterUI(); // 부캐 UI 새로고침
                showToast('부캐 정보가 수정되었습니다.', 'success');
            } else {
                alert('부캐 정보 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('부캐 편집 실패:', error);
            alert('부캐 정보 수정 중 오류가 발생했습니다.');
        }
    }

    /**
     * 부캐 UI 새로고침
     */
    refreshCharacterUI() {
        // 현재 뷰가 부캐 대시보드인 경우 새로고침
        if (this.currentView === 'characterDashboard') {
            this.renderCharacterDashboard();
        }
        
        // 홈 화면의 부캐 정보도 새로고침
        const homeCharacters = document.querySelectorAll('.character-item');
        homeCharacters.forEach(characterElement => {
            const characterId = characterElement.dataset.characterId;
            if (characterId) {
                const character = this.getCharacterById(characterId);
                if (character) {
                    // 부캐 이름 업데이트
                    const nameElement = characterElement.querySelector('.character-name');
                    if (nameElement) {
                        nameElement.textContent = character.name;
                    }
                    
                    // 부캐 레벨 업데이트
                    const levelElement = characterElement.querySelector('.character-level .level-value');
                    if (levelElement) {
                        levelElement.textContent = character.level;
                    }
                    
                    // 부캐 서버 업데이트
                    const serverElement = characterElement.querySelector('.character-server');
                    if (serverElement) {
                        serverElement.textContent = `${character.server} • ${character.serverChannel}`;
                    }
                }
            }
        });
    }

    /**
     * 템플릿 모달 표시
     */
    showTemplateModal() {
        this.populateTemplateCharacterSelection();
        this.updateTemplatePreview();
        this.showModal('templateModal');
    }

    /**
     * 할일 폼 채우기
     */
    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskCharacter').value = task.characterId;
        document.getElementById('taskType').value = task.type;
        document.getElementById('taskRegion').value = task.region;
        document.getElementById('taskLocation').value = task.location;
        document.getElementById('taskTobelStep').value = task.tobelStep || '';
        document.getElementById('taskFavorStage').value = task.favorStage;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskNotes').value = task.notes;
        document.getElementById('taskTags').value = task.tags.join(', ');
        
        if (task.dueAt) {
            document.getElementById('taskDueDate').value = new Date(task.dueAt).toISOString().slice(0, 16);
        }
        if (task.notifyAt) {
            document.getElementById('taskNotifyDate').value = new Date(task.notifyAt).toISOString().slice(0, 16);
        }
    }

    /**
     * 부캐 폼 채우기
     */
    populateCharacterForm(character) {
        document.getElementById('characterName').value = character.name;
        document.getElementById('characterServer').value = character.server;
        document.getElementById('characterFaction').value = character.faction;
        document.getElementById('characterColor').value = character.color;
    }

    /**
     * 부캐 선택 옵션 채우기
     */
    populateCharacterSelect() {
        const select = document.getElementById('taskCharacter');
        const characters = storageManager.loadCharacters().filter(char => char.isActive);
        
        select.innerHTML = '<option value="">부캐를 선택하세요</option>';
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.id;
            option.textContent = character.name;
            select.appendChild(option);
        });
    }

    /**
     * 템플릿 부캐 선택 채우기
     */
    populateTemplateCharacterSelection() {
        const container = document.getElementById('templateCharacterSelection');
        const characters = storageManager.loadCharacters().filter(char => char.isActive);
        
        container.innerHTML = '';
        characters.forEach(character => {
            const option = document.createElement('div');
            option.className = 'character-option';
            option.innerHTML = `
                <input type="checkbox" id="char_${character.id}" value="${character.id}">
                <label for="char_${character.id}">
                    <div class="character-avatar" style="background-color: ${character.color}">
                        ${character.name.charAt(0)}
                    </div>
                    <span>${character.name}</span>
                </label>
            `;
            
            option.addEventListener('click', () => {
                option.classList.toggle('selected');
                this.updateTemplatePreview();
            });
            
            container.appendChild(option);
        });
    }

    /**
     * 템플릿 미리보기 업데이트
     */
    updateTemplatePreview() {
        const selectedCharacters = Array.from(document.querySelectorAll('.character-option.selected'))
            .map(option => option.querySelector('input').value);
        
        const preview = templateManager.createTemplatePreview('맹약 준비', selectedCharacters);
        const previewList = document.getElementById('templatePreviewList');
        
        if (preview && previewList) {
            previewList.innerHTML = '';
            preview.tasks.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${task.characterName}</strong>: ${task.title}
                    ${task.checklistCount > 0 ? ` (${task.checklistCount}개 체크리스트)` : ''}
                `;
                previewList.appendChild(li);
            });
        }
    }

    /**
     * 할일 이동
     */
    moveTask(taskId, newStatus) {
        try {
            const tasks = storageManager.loadTasks();
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].setStatus(newStatus);
                storageManager.saveTasks(tasks);
                this.refreshTasks();
                showToast('할일 상태가 변경되었습니다.', 'success');
            }
        } catch (error) {
            console.error('할일 이동 실패:', error);
            showToast('할일 이동에 실패했습니다.', 'error');
        }
    }

    /**
     * 할일 새로고침
     */
    refreshTasks() {
        const tasks = this.getFilteredTasks();
        
        switch (this.currentView) {
            case 'board':
                this.renderBoardView(tasks);
                break;
            case 'list':
                this.renderListView(tasks);
                break;
            case 'calendar':
                this.renderCalendarView(tasks);
                break;
            case 'characterDashboard':
                this.renderCharacterDashboard();
                break;
        }
    }

    /**
     * 필터링된 할일 조회
     */
    getFilteredTasks() {
        let tasks = storageManager.loadTasks();
        
        // 상태 필터
        if (this.currentFilter !== 'all') {
            tasks = tasks.filter(task => task.status === this.currentFilter);
        }
        
        // 부캐 필터
        if (this.selectedCharacter !== 'all') {
            tasks = tasks.filter(task => task.characterId === this.selectedCharacter);
        }
        
        // 정렬
        tasks = this.sortTasks(tasks, this.currentSort);
        
        return tasks;
    }

    /**
     * 할일 정렬
     */
    sortTasks(tasks, sortBy) {
        return tasks.sort((a, b) => {
            switch (sortBy) {
                case 'due':
                    if (!a.dueAt && !b.dueAt) return 0;
                    if (!a.dueAt) return 1;
                    if (!b.dueAt) return -1;
                    return a.dueAt - b.dueAt;
                case 'priority':
                    return b.priority - a.priority;
                case 'region':
                    return a.region.localeCompare(b.region);
                case 'updated':
                default:
                    return b.updatedAt - a.updatedAt;
            }
        });
    }

    /**
     * 보드 뷰 렌더링
     */
    renderBoardView(tasks) {
        const columns = {
            todo: document.getElementById('todoTasks'),
            doing: document.getElementById('doingTasks'),
            done: document.getElementById('doneTasks')
        };
        
        // 각 컬럼 초기화
        Object.values(columns).forEach(column => {
            if (column) column.innerHTML = '';
        });
        
        // 할일을 상태별로 분류
        const tasksByStatus = {
            todo: tasks.filter(task => task.status === 'todo'),
            doing: tasks.filter(task => task.status === 'doing'),
            done: tasks.filter(task => task.status === 'done')
        };
        
        // 각 컬럼에 할일 렌더링
        Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
            const column = columns[status];
            if (column) {
                statusTasks.forEach(task => {
                    const taskElement = this.createTaskCard(task);
                    column.appendChild(taskElement);
                });
            }
        });
        
        // 컬럼 헤더의 할일 수 업데이트
        this.updateColumnCounts(tasksByStatus);
    }

    /**
     * 리스트 뷰 렌더링
     */
    renderListView(tasks) {
        const container = document.getElementById('listTasks');
        if (!container) return;
        
        container.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = this.createTaskListItem(task);
            container.appendChild(taskElement);
        });
    }

    /**
     * 캘린더 뷰 렌더링
     */
    renderCalendarView(tasks) {
        const currentDate = new Date();
        this.renderCalendar(currentDate, tasks);
        
        // 오늘 완료된 할일 수 표시
        this.updateTodayTaskCount(tasks);
    }

    /**
     * 캘린더 렌더링
     */
    renderCalendar(date, tasks) {
        const monthNames = [
            '1월', '2월', '3월', '4월', '5월', '6월',
            '7월', '8월', '9월', '10월', '11월', '12월'
        ];
        
        const currentMonth = document.getElementById('currentMonth');
        if (currentMonth) {
            currentMonth.textContent = `${date.getFullYear()}년 ${monthNames[date.getMonth()]}`;
        }
        
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 달력 그리드 생성
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayElement = this.createCalendarDay(cellDate, tasks, date);
            grid.appendChild(dayElement);
        }
    }

    /**
     * 오늘 완료된 할일 수 업데이트
     */
    updateTodayTaskCount(tasks) {
        const today = new Date();
        const todayString = today.toDateString();
        
        // 오늘 완료된 할일 수 계산 (모든 캐릭터 합계)
        const todayCompletedTasks = tasks.filter(task => {
            if (task.status !== 'done') return false;
            if (!task.updatedAt) return false;
            const taskDate = new Date(task.updatedAt);
            return taskDate.toDateString() === todayString;
        });
        
        // 캐릭터별 완료 건수 계산
        const characterCounts = {};
        todayCompletedTasks.forEach(task => {
            const character = this.getCharacterById(task.characterId);
            if (character) {
                const charName = character.name;
                characterCounts[charName] = (characterCounts[charName] || 0) + 1;
            }
        });
        
        // 오늘 할일 수 표시 요소 찾기 또는 생성
        let todayCountElement = document.getElementById('todayTaskCount');
        if (!todayCountElement) {
            // 캘린더 헤더에 오늘 할일 수 표시 추가
            const calendarHeader = document.querySelector('.calendar-header');
            if (calendarHeader) {
                todayCountElement = document.createElement('div');
                todayCountElement.id = 'todayTaskCount';
                todayCountElement.className = 'today-task-count';
                todayCountElement.style.cssText = `
                    background: #0D6DFD;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-top: 10px;
                    display: inline-block;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                `;
                calendarHeader.appendChild(todayCountElement);
            }
        }
        
        if (todayCountElement) {
            // 총 완료 건수와 캐릭터별 상세 정보 표시
            const totalCount = todayCompletedTasks.length;
            const characterDetails = Object.entries(characterCounts)
                .map(([name, count]) => `${name}(${count})`)
                .join(', ');
            
            todayCountElement.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 4px;">
                    📊 오늘 총 완료: <strong>${totalCount}건</strong>
                </div>
                ${characterDetails ? `<div style="font-size: 12px; opacity: 0.9;">${characterDetails}</div>` : ''}
            `;
        }
    }

    /**
     * 캘린더 날짜 셀 생성
     */
    createCalendarDay(date, tasks, currentMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (date.getMonth() !== currentMonth.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = date.getDate();
        dayElement.appendChild(dayHeader);
        
        // 해당 날짜의 할일들
        const dayTasks = tasks.filter(task => {
            if (!task.dueAt) return false;
            const taskDate = new Date(task.dueAt);
            return taskDate.toDateString() === date.toDateString();
        });
        
        if (dayTasks.length > 0) {
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'calendar-tasks';
            
            dayTasks.slice(0, 3).forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'calendar-task';
                taskElement.textContent = task.title;
                taskElement.addEventListener('click', () => {
                    this.showTaskModal(task.id);
                });
                tasksContainer.appendChild(taskElement);
            });
            
            if (dayTasks.length > 3) {
                const moreElement = document.createElement('div');
                moreElement.className = 'calendar-task';
                moreElement.textContent = `+${dayTasks.length - 3}개 더`;
                tasksContainer.appendChild(moreElement);
            }
            
            dayElement.appendChild(tasksContainer);
        }
        
        return dayElement;
    }

    /**
     * 부캐 대시보드 렌더링
     */
    renderCharacterDashboard() {
        const container = document.getElementById('characterCards');
        if (!container) return;
        
        const characters = storageManager.loadCharacters().filter(char => char.isActive);
        const tasks = storageManager.loadTasks();
        
        container.innerHTML = '';
        
        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character, tasks);
            container.appendChild(characterCard);
        });
    }

    /**
     * 할일 카드 생성
     */
    createTaskCard(task) {
        const characters = storageManager.loadCharacters();
        const character = characters.find(char => char.id === task.characterId);
        
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = task.id;
        card.draggable = true;
        
        const progress = task.getProgress();
        const priorityClass = task.getPriorityClass();
        
        card.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-character" style="background-color: ${character?.color || '#6366f1'}">
                    ${character?.name || '알 수 없음'}
                </div>
            </div>
            <div class="task-meta">
                <div class="task-meta-item">
                    <span>📋</span>
                    <span>${task.type}</span>
                </div>
                ${task.region ? `
                    <div class="task-meta-item">
                        <span>📍</span>
                        <span>${task.region}</span>
                    </div>
                ` : ''}
                <div class="task-meta-item">
                    <span>⚡</span>
                    <span class="task-priority ${priorityClass}">${task.getPriorityText()}</span>
                </div>
                ${task.dueAt ? `
                    <div class="task-meta-item">
                        <span>⏰</span>
                        <span>${new Date(task.dueAt).toLocaleDateString()}</span>
                    </div>
                ` : ''}
            </div>
            ${task.checklist.length > 0 ? `
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="task-btn primary" onclick="uiManager.editTask('${task.id}')">수정</button>
                <button class="task-btn" onclick="uiManager.toggleTaskStatus('${task.id}')">
                    ${task.status === 'done' ? '되돌리기' : '완료'}
                </button>
                <button class="task-btn danger" onclick="uiManager.deleteTask('${task.id}')">삭제</button>
            </div>
        `;
        
        return card;
    }

    /**
     * 할일 리스트 아이템 생성
     */
    createTaskListItem(task) {
        const characters = storageManager.loadCharacters();
        const character = characters.find(char => char.id === task.characterId);
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.taskId = task.id;
        
        const priorityClass = task.getPriorityClass();
        
        item.innerHTML = `
            <div class="list-item-title">${task.title}</div>
            <div class="list-item-character" style="color: ${character?.color || '#6366f1'}">
                ${character?.name || '알 수 없음'}
            </div>
            <div class="list-item-status">${task.getStatusText()}</div>
            <div class="list-item-priority">
                <span class="task-priority ${priorityClass}">${task.getPriorityText()}</span>
            </div>
            <div class="list-item-due">
                ${task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-'}
            </div>
            <div class="list-item-actions">
                <button class="task-btn primary" onclick="uiManager.editTask('${task.id}')">수정</button>
                <button class="task-btn" onclick="uiManager.toggleTaskStatus('${task.id}')">
                    ${task.status === 'done' ? '되돌리기' : '완료'}
                </button>
                <button class="task-btn danger" onclick="uiManager.deleteTask('${task.id}')">삭제</button>
            </div>
        `;
        
        return item;
    }

    /**
     * 부캐 카드 생성
     */
    createCharacterCard(character, tasks) {
        const characterTasks = tasks.filter(task => task.characterId === character.id);
        const completedTasks = characterTasks.filter(task => task.status === 'done');
        const inProgressTasks = characterTasks.filter(task => task.status === 'doing');
        const todoTasks = characterTasks.filter(task => task.status === 'todo');
        
        const card = document.createElement('div');
        card.className = 'character-card';
        
        // 진행률 계산
        const totalProgress = characterTasks.length > 0 ? 
            Math.round((completedTasks.length / characterTasks.length) * 100) : 0;
        
        // 다음 할일들 (최대 3개)
        const nextTasks = todoTasks.slice(0, 3);
        
        card.innerHTML = `
            <div class="character-header">
                <div class="character-avatar" style="background-color: ${character.color}">
                    ${character.name.charAt(0)}
                </div>
                <div class="character-info">
                    <h3>${character.name}</h3>
                    <div class="character-meta">
                        ${character.server} • 레벨 ${character.level}
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn btn-sm btn-secondary" onclick="uiManager.showCharacterEditModal('${character.id}')">
                        편집
                    </button>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-item">
                    <span class="progress-label">전체 진행률</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${totalProgress}%"></div>
                    </div>
                    <span class="progress-text">${totalProgress}%</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">완료된 할일</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${characterTasks.length > 0 ? (completedTasks.length / characterTasks.length) * 100 : 0}%"></div>
                    </div>
                    <span class="progress-text">${completedTasks.length}/${characterTasks.length}</span>
                </div>
            </div>
            <div class="next-tasks">
                <h4>다음 할일</h4>
                ${nextTasks.length > 0 ? nextTasks.map(task => `
                    <div class="next-task-item">
                        <span>📋</span>
                        <span>${task.title}</span>
                    </div>
                `).join('') : '<div class="next-task-item">할일이 없습니다</div>'}
            </div>
        `;
        
        return card;
    }

    /**
     * 컬럼 카운트 업데이트
     */
    updateColumnCounts(tasksByStatus) {
        Object.entries(tasksByStatus).forEach(([status, tasks]) => {
            const countElement = document.querySelector(`[data-status="${status}"] .task-count`);
            if (countElement) {
                countElement.textContent = tasks.length;
            }
        });
    }

    /**
     * 할일 검색
     */
    searchTasks(query) {
        if (!query.trim()) {
            this.refreshTasks();
            return;
        }
        
        const tasks = this.getFilteredTasks();
        const filteredTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.notes.toLowerCase().includes(query.toLowerCase()) ||
            task.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        // 현재 뷰에 따라 렌더링
        switch (this.currentView) {
            case 'board':
                this.renderBoardView(filteredTasks);
                break;
            case 'list':
                this.renderListView(filteredTasks);
                break;
        }
    }

    /**
     * 캘린더 네비게이션
     */
    navigateCalendar(direction) {
        // 캘린더 네비게이션 로직
        // 현재는 기본 구현만 제공
        console.log(`캘린더 ${direction > 0 ? '다음' : '이전'} 달로 이동`);
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        // 뷰 버튼 활성 상태
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${this.currentView}"]`)?.classList.add('active');
        
        // 필터 및 정렬 값 설정
        const filterSelect = document.getElementById('filterSelect');
        const sortSelect = document.getElementById('sortSelect');
        const characterSelect = document.getElementById('characterSelect');
        
        if (filterSelect) filterSelect.value = this.currentFilter;
        if (sortSelect) sortSelect.value = this.currentSort;
        if (characterSelect) characterSelect.value = this.selectedCharacter;
    }

    /**
     * 유틸리티 메서드들
     */
    getTaskById(taskId) {
        const tasks = storageManager.loadTasks();
        return tasks.find(task => task.id === taskId);
    }

    getCharacterById(characterId) {
        const characters = storageManager.loadCharacters();
        return characters.find(char => char.id === characterId);
    }

    editTask(taskId) {
        this.showTaskModal(taskId);
    }

    toggleTaskStatus(taskId) {
        const task = this.getTaskById(taskId);
        if (task) {
            const newStatus = task.status === 'done' ? 'todo' : 'done';
            task.setStatus(newStatus);
            
            const tasks = storageManager.loadTasks();
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = task;
                storageManager.saveTasks(tasks);
                this.refreshTasks();
                
                // 캘린더 뷰인 경우 오늘 완료 건수 업데이트
                if (this.currentView === 'calendar') {
                    this.updateTodayTaskCount(tasks);
                }
                
                showToast(`할일이 ${newStatus === 'done' ? '완료' : '되돌려졌'}습니다.`, 'success');
            }
        }
    }

    deleteTask(taskId) {
        if (confirm('정말로 이 할일을 삭제하시겠습니까?')) {
            const tasks = storageManager.loadTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            storageManager.saveTasks(filteredTasks);
            this.refreshTasks();
            
            // 캘린더 뷰인 경우 오늘 완료 건수 업데이트
            if (this.currentView === 'calendar') {
                this.updateTodayTaskCount(filteredTasks);
            }
            
            showToast('할일이 삭제되었습니다.', 'success');
        }
    }
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#0D6DFD'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 애니메이션
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 3초 후 제거
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 전역 UI 매니저 인스턴스
const uiManager = new UIManager();

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
}

