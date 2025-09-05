/**
 * 템플릿 시스템
 * PRD 요구사항: 맹약 준비 템플릿 자동 생성
 */

class TemplateManager {
    constructor() {
        this.templates = new Map();
        this.init();
    }

    /**
     * 템플릿 시스템 초기화
     */
    init() {
        // 기본 템플릿 등록
        this.registerTemplate(COVENANT_TEMPLATE);
        
        // 추가 템플릿들 등록
        this.registerTemplate(this.createLevelingTemplate());
        this.registerTemplate(this.createDailyTemplate());
        this.registerTemplate(this.createWeeklyTemplate());
    }

    /**
     * 템플릿 등록
     */
    registerTemplate(template) {
        this.templates.set(template.name, template);
    }

    /**
     * 템플릿 조회
     */
    getTemplate(name) {
        return this.templates.get(name);
    }

    /**
     * 모든 템플릿 조회
     */
    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * 템플릿 적용
     */
    applyTemplate(templateName, characterIds) {
        try {
            const template = this.getTemplate(templateName);
            if (!template) {
                throw new Error(`템플릿을 찾을 수 없습니다: ${templateName}`);
            }

            if (!Array.isArray(characterIds) || characterIds.length === 0) {
                throw new Error('적용할 부캐를 선택해주세요.');
            }

            const characters = storageManager.loadCharacters();
            const tasks = storageManager.loadTasks();
            const newTasks = [];

            // 선택된 부캐들에 대해 템플릿 적용
            for (const characterId of characterIds) {
                const character = characters.find(char => char.id === characterId);
                if (!character) {
                    console.warn(`부캐를 찾을 수 없습니다: ${characterId}`);
                    continue;
                }

                // 템플릿의 각 할일을 부캐별로 생성
                for (const templateTask of template.tasks) {
                    const task = new Task({
                        characterId: characterId,
                        title: templateTask.title,
                        type: templateTask.type || '기타',
                        region: templateTask.region || '',
                        location: templateTask.location || '',
                        tobelStep: templateTask.tobelStep || null,
                        favorStage: templateTask.favorStage || '',
                        tags: [...(templateTask.tags || [])],
                        priority: templateTask.priority || 2,
                        status: 'todo'
                    });

                    // 체크리스트 추가
                    if (templateTask.checklist && templateTask.checklist.length > 0) {
                        for (const item of templateTask.checklist) {
                            task.addChecklistItem(item);
                        }
                    }

                    newTasks.push(task);
                }
            }

            // 새 할일들을 기존 할일 목록에 추가
            const allTasks = [...tasks, ...newTasks];
            storageManager.saveTasks(allTasks);

            const message = `${templateName} 템플릿이 ${characterIds.length}개 부캐에 적용되었습니다. (${newTasks.length}개 할일 생성)`;
            showToast(message, 'success');

            return {
                success: true,
                templateName: templateName,
                characterCount: characterIds.length,
                taskCount: newTasks.length
            };

        } catch (error) {
            console.error('템플릿 적용 실패:', error);
            showToast(`템플릿 적용 실패: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 템플릿 미리보기 생성
     */
    createTemplatePreview(templateName, characterIds) {
        try {
            const template = this.getTemplate(templateName);
            if (!template) {
                throw new Error(`템플릿을 찾을 수 없습니다: ${templateName}`);
            }

            const characters = storageManager.loadCharacters();
            const preview = {
                templateName: template.name,
                description: template.description,
                characterCount: characterIds.length,
                totalTasks: template.tasks.length * characterIds.length,
                tasks: []
            };

            // 각 부캐별로 할일 미리보기 생성
            for (const characterId of characterIds) {
                const character = characters.find(char => char.id === characterId);
                if (!character) continue;

                for (const templateTask of template.tasks) {
                    preview.tasks.push({
                        characterName: character.name,
                        title: templateTask.title,
                        type: templateTask.type || '기타',
                        region: templateTask.region || '',
                        checklistCount: templateTask.checklist ? templateTask.checklist.length : 0
                    });
                }
            }

            return preview;

        } catch (error) {
            console.error('템플릿 미리보기 생성 실패:', error);
            return null;
        }
    }

    /**
     * 레벨링 템플릿 생성
     */
    createLevelingTemplate() {
        return {
            name: '레벨링',
            description: '효율적인 레벨업을 위한 할일 목록',
            tasks: [
                {
                    title: '일일 퀘스트 완료',
                    type: '의뢰',
                    tags: ['일일', '레벨업'],
                    checklist: [
                        '일일 퀘스트 1',
                        '일일 퀘스트 2',
                        '일일 퀘스트 3',
                        '일일 퀘스트 4',
                        '일일 퀘스트 5'
                    ]
                },
                {
                    title: '던전 클리어',
                    type: '토벌',
                    tags: ['던전', '레벨업'],
                    checklist: [
                        '일반 던전 3회',
                        '하드 던전 2회',
                        '헬 던전 1회'
                    ]
                },
                {
                    title: '경험치 부스터 사용',
                    type: '기타',
                    tags: ['부스터', '레벨업'],
                    checklist: [
                        '경험치 부스터 활성화',
                        '경험치 부스터 시간 확인'
                    ]
                }
            ]
        };
    }

    /**
     * 일일 템플릿 생성
     */
    createDailyTemplate() {
        return {
            name: '일일 루틴',
            description: '매일 해야 할 기본적인 할일들',
            tasks: [
                {
                    title: '일일 출석',
                    type: '기타',
                    tags: ['일일', '출석'],
                    checklist: [
                        '출석 체크',
                        '출석 보상 수령'
                    ]
                },
                {
                    title: '일일 미션',
                    type: '의뢰',
                    tags: ['일일', '미션'],
                    checklist: [
                        '일일 미션 1',
                        '일일 미션 2',
                        '일일 미션 3'
                    ]
                },
                {
                    title: '에너지 소모',
                    type: '기타',
                    tags: ['일일', '에너지'],
                    checklist: [
                        '에너지 확인',
                        '에너지 소모 계획'
                    ]
                }
            ]
        };
    }

    /**
     * 주간 템플릿 생성
     */
    createWeeklyTemplate() {
        return {
            name: '주간 루틴',
            description: '주간 단위로 해야 할 할일들',
            tasks: [
                {
                    title: '주간 던전',
                    type: '토벌',
                    tags: ['주간', '던전'],
                    checklist: [
                        '주간 던전 1',
                        '주간 던전 2',
                        '주간 던전 3'
                    ]
                },
                {
                    title: '주간 보스',
                    type: '토벌',
                    tags: ['주간', '보스'],
                    checklist: [
                        '주간 보스 1',
                        '주간 보스 2'
                    ]
                },
                {
                    title: '주간 상점',
                    type: '구매',
                    tags: ['주간', '상점'],
                    checklist: [
                        '주간 상점 확인',
                        '필요한 아이템 구매'
                    ]
                }
            ]
        };
    }

    /**
     * 커스텀 템플릿 생성
     */
    createCustomTemplate(name, description, tasks) {
        const template = {
            name: name,
            description: description,
            tasks: tasks
        };

        this.registerTemplate(template);
        return template;
    }

    /**
     * 템플릿 삭제
     */
    deleteTemplate(name) {
        if (name === '맹약 준비') {
            throw new Error('기본 템플릿은 삭제할 수 없습니다.');
        }

        const deleted = this.templates.delete(name);
        if (deleted) {
            showToast(`템플릿 "${name}"이 삭제되었습니다.`, 'info');
        }
        return deleted;
    }

    /**
     * 템플릿 내보내기
     */
    exportTemplate(name) {
        try {
            const template = this.getTemplate(name);
            if (!template) {
                throw new Error(`템플릿을 찾을 수 없습니다: ${name}`);
            }

            const exportData = {
                ...template,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `template-${name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`템플릿 "${name}"이 내보내기되었습니다.`, 'success');
            return true;

        } catch (error) {
            console.error('템플릿 내보내기 실패:', error);
            showToast(`템플릿 내보내기 실패: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 템플릿 가져오기
     */
    importTemplate(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // 템플릿 유효성 검사
                        if (!this.validateTemplate(data)) {
                            throw new Error('잘못된 템플릿 형식입니다.');
                        }

                        // 템플릿 등록
                        this.registerTemplate(data);
                        
                        showToast(`템플릿 "${data.name}"이 가져오기되었습니다.`, 'success');
                        resolve(true);

                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('파일 읽기 실패'));
                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 템플릿 유효성 검사
     */
    validateTemplate(template) {
        try {
            // 기본 구조 확인
            if (typeof template !== 'object' || template === null) {
                return false;
            }

            // 필수 필드 확인
            if (!template.name || !template.description || !Array.isArray(template.tasks)) {
                return false;
            }

            // 할일 유효성 검사
            for (const task of template.tasks) {
                if (!task.title || typeof task.title !== 'string') {
                    return false;
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 템플릿 통계
     */
    getTemplateStats() {
        const templates = this.getAllTemplates();
        const stats = {
            totalTemplates: templates.length,
            totalTasks: 0,
            templates: []
        };

        for (const template of templates) {
            const taskCount = template.tasks ? template.tasks.length : 0;
            stats.totalTasks += taskCount;
            stats.templates.push({
                name: template.name,
                description: template.description,
                taskCount: taskCount
            });
        }

        return stats;
    }

    /**
     * 템플릿 검색
     */
    searchTemplates(query) {
        const templates = this.getAllTemplates();
        const lowerQuery = query.toLowerCase();

        return templates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            (template.tasks && template.tasks.some(task => 
                task.title.toLowerCase().includes(lowerQuery)
            ))
        );
    }

    /**
     * 템플릿 복제
     */
    cloneTemplate(originalName, newName) {
        try {
            const original = this.getTemplate(originalName);
            if (!original) {
                throw new Error(`원본 템플릿을 찾을 수 없습니다: ${originalName}`);
            }

            const cloned = {
                ...original,
                name: newName,
                description: `${original.description} (복사본)`
            };

            this.registerTemplate(cloned);
            showToast(`템플릿 "${newName}"이 생성되었습니다.`, 'success');
            return cloned;

        } catch (error) {
            console.error('템플릿 복제 실패:', error);
            showToast(`템플릿 복제 실패: ${error.message}`, 'error');
            return null;
        }
    }
}

// 전역 템플릿 매니저 인스턴스
const templateManager = new TemplateManager();

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateManager, templateManager };
}

