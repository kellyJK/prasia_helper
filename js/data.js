// Prasia_todo/js/data.js

/**
 * @typedef {object} Account
 * @property {string} id - Unique ID for the account (UUID)
 * @property {string} name - Account name
 * @property {boolean} isPrimary - Whether this is the primary account
 * @property {object} covenants - Covenant certificate purchase status
 * @property {Array<string>} covenants.purchased - List of purchased faction IDs
 * @property {number} covenants.total - Total number of factions (16)
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

/**
 * @typedef {object} Character
 * @property {string} id - Unique ID for the character (UUID)
 * @property {string} accountId - ID of the account this character belongs to
 * @property {string} name - Character's nickname
 * @property {string} server - Server name (e.g., "아우리엘")
 * @property {string} serverChannel - Server channel (e.g., "01")
 * @property {string} color - Representative color (HEX)
 * @property {boolean} isActive - Whether the character is active
 * @property {number} level - Character's current level
 * @property {object} zones - Quest completion count per stronghold (0-20)
 * @property {string} zones.크론 - Quest count for 크론 region strongholds
 * @property {string} zones.라인소프 - Quest count for 라인소프 region strongholds
 * @property {string} zones.시길 - Quest count for 시길 region strongholds
 * @property {string} zones.아민타 - Quest count for 아민타 region strongholds
 * @property {string} zones.론도 - Quest count for 론도 region strongholds
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

/**
 * @typedef {object} Task
 * @property {string} id - Unique ID for the task (UUID)
 * @property {string} characterId - ID of the character this task belongs to
 * @property {string} title - Task title
 * @property {string} [notes] - Additional notes
 * @property {'의뢰'|'토벌'|'우호도'|'구매'|'기타'} type - Task type
 * @property {'todo'|'doing'|'done'|'archived'} status - Task status
 * @property {number} [priority] - Priority (1-5)
 * @property {string} [region] - Region (e.g., "론도")
 * @property {string} [location] - Specific location/stronghold (e.g., "파도맞이 주둔지")
 * @property {number} [tobelStep] - Tobel step (1 or 15)
 * @property {'결속'|'신의'|'맹약'} [favorStage] - Favor stage
 * @property {number} [dueAt] - Due date timestamp
 * @property {number} [notifyAt] - Notification time timestamp
 * @property {Array<string>} [tags] - Tags (e.g., "20마을")
 * @property {Array<{id: string, label: string, done: boolean}>} [checklist] - Checklist items
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

/**
 * @typedef {object} Settings
 * @property {boolean} notif - Notification enabled
 * @property {object} quietHours - Quiet hours settings
 * @property {string} quietHours.start - Start time (HH:MM)
 * @property {string} quietHours.end - End time (HH:MM)
 * @property {string} theme - Theme setting (auto|light|dark)
 * @property {string|null} selectedAccountId - Currently selected account ID
 */

// Predefined lists for dropdowns and validation
export const REGIONS = ['크론', '라인소프', '시길', '아민타', '론도'];

export const STRONGHOLDS = {
    '크론': ['서리절벽 주둔지', '눈바람 해안 주둔지', '백야성 요새', '눈꽃빙하 주둔지'],
    '라인소프': ['파도맞이 주둔지', '황금항 요새', '무법지대 주둔지', '운하미로 주둔지', '용암터 주둔지', '소금 벌판 주둔지', '떠오른 바다 주둔지'],
    '시길': ['잊혀진 신전 주둔지', '모래칼날 주둔지', '잿빛달 요새'],
    '아민타': ['거울숲 요새', '검은숲 주둔지', '은빛장원 주둔지', '축제수림 주둔지', '숲의 무덤 주둔지', '푸른불꽃 주둔지'],
    '론도': ['론도 대성채', '토룡곡 주둔지', '통곡의 고성 주둔지', '안개호수 주둔지', '어둠노을 주둔지', '붉은 나락 주둔지']
};

export const SERVERS = {
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

export const FACTIONS = [
    '카시미르연합',
    '아슬라니스',
    '황혼의형제들',
    '신기루연대',
    '타라프',
    '채움의탑',
    '얽힘공단',
    '직조공길드',
    '붉은닻',
    '파도몰이',
    '깃털펜',
    '백야수',
    '수풀민',
    '묘지기',
    '안개지기',
    '사이노드'
];

export const TASK_TYPES = ['의뢰', '토벌', '우호도', '구매', '기타'];
export const TASK_STATUSES = ['todo', 'doing', 'done', 'archived'];
export const FAVOR_STAGES = ['결속', '신의', '맹약'];

// Utility functions
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getCurrentTimestamp() {
    return Date.now();
}

// Default settings
export const DEFAULT_SETTINGS = {
    notif: true,
    quietHours: { start: "01:00", end: "08:00" },
    theme: "auto",
    selectedAccountId: null
};

// Schema version for migration
export const SCHEMA_VERSION = 4;