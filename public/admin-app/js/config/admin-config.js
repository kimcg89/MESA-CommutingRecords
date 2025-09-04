// 관리자 앱 설정 - 2025.08.18 수정: ES6 모듈 문법 제거
// 관리자 대시보드 관련 설정 및 상수

/**
 * 관리자 권한 설정
 */
const ADMIN_CONFIG = {
    // 권한 레벨
    PERMISSION_LEVELS: {
        KEY_MANAGER: 'O',        // 키매니저 권한
        ADMIN: 'admin',          // 일반 관리자 권한
        USER: 'user'             // 일반 사용자
    },

    // 관리자 메뉴 설정
    ADMIN_MENUS: {
        ORG_MANAGEMENT: 'org-management',
        USER_MANAGEMENT: 'user-management', 
        ATTENDANCE_MANAGEMENT: 'attendance-management',
        SYSTEM_SETTINGS: 'system-settings'
    },

    // 데이터 컬렉션 이름
    COLLECTIONS: {
        RECORDS: 'records',
        TODOS: 'todos',
        TASKS: 'tasks',
        ADMIN_LOGS: 'admin-logs',
        SYSTEM_SETTINGS: 'system-settings'
    },

    // UI 설정
    UI_SETTINGS: {
        MODAL_FADE_DURATION: 300,
        TOAST_DURATION: 3000,
        AUTO_REFRESH_INTERVAL: 300000, // 5분
        SEARCH_DEBOUNCE_DELAY: 300
    },

    // 페이지네이션 설정
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },

    // 파일 업로드 설정
    FILE_UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['application/json', 'text/csv', 'application/vnd.ms-excel']
    }
};

/**
 * 에러 메시지 상수
 */
const ERROR_MESSAGES = {
    AUTH: {
        INVALID_EMAIL: '유효하지 않은 이메일 주소입니다.',
        USER_DISABLED: '비활성화된 계정입니다.',
        USER_NOT_FOUND: '존재하지 않는 계정입니다.',
        WRONG_PASSWORD: '비밀번호가 올바르지 않습니다.',
        EMAIL_ALREADY_IN_USE: '이미 사용 중인 이메일 주소입니다.',
        WEAK_PASSWORD: '비밀번호가 너무 약합니다.',
        NETWORK_REQUEST_FAILED: '네트워크 오류가 발생했습니다.',
        INVALID_CREDENTIAL: '로그인 정보가 올바르지 않습니다.',
        TOO_MANY_REQUESTS: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도하세요.',
        INSUFFICIENT_PERMISSION: '관리자 권한이 필요합니다.'
    },
    DATA: {
        LOAD_FAILED: '데이터 로드에 실패했습니다.',
        SAVE_FAILED: '데이터 저장에 실패했습니다.',
        DELETE_FAILED: '데이터 삭제에 실패했습니다.',
        VALIDATION_FAILED: '입력 데이터가 유효하지 않습니다.'
    },
    SYSTEM: {
        UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
        SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.'
    }
};

/**
 * 성공 메시지 상수
 */
const SUCCESS_MESSAGES = {
    USER: {
        CREATED: '사용자가 성공적으로 생성되었습니다.',
        UPDATED: '사용자 정보가 업데이트되었습니다.',
        DELETED: '사용자가 삭제되었습니다.'
    },
    ORG: {
        UPDATED: '조직 정보가 업데이트되었습니다.',
        DEPT_CREATED: '부서가 생성되었습니다.',
        DEPT_DELETED: '부서가 삭제되었습니다.'
    },
    SYSTEM: {
        BACKUP_COMPLETED: '데이터 백업이 완료되었습니다.',
        SETTINGS_SAVED: '시스템 설정이 저장되었습니다.'
    }
};

/**
 * 관리자 통계 설정
 */
const STATS_CONFIG = {
    // 활성 사용자 기준 (일)
    ACTIVE_USER_DAYS: 30,
    
    // 차트 색상
    CHART_COLORS: {
        PRIMARY: '#3b82f6',
        SUCCESS: '#10b981', 
        WARNING: '#f59e0b',
        INFO: '#06b6d4',
        DANGER: '#ef4444'
    },

    // 새로고침 간격 (밀리초)
    REFRESH_INTERVALS: {
        STATS: 60000,       // 1분
        LOGS: 30000,        // 30초
        ATTENDANCE: 300000  // 5분
    }
};

/**
 * 유틸리티 함수들 - 2025.08.18 수정: 관리자 전용 유틸리티 추가
 */
const AdminUtils = {
    /**
     * 권한 체크 함수
     */
    checkPermission(userData, requiredLevel = ADMIN_CONFIG.PERMISSION_LEVELS.KEY_MANAGER) {
        if (!userData) return false;
        
        switch (requiredLevel) {
            case ADMIN_CONFIG.PERMISSION_LEVELS.KEY_MANAGER:
                return userData.keymanager === 'O';
            case ADMIN_CONFIG.PERMISSION_LEVELS.ADMIN:
                return userData.keymanager === 'O' || userData.role === 'admin' || userData.isAdmin === true;
            default:
                return true;
        }
    },

    /**
     * 에러 메시지 가져오기
     */
    getErrorMessage(errorCode, category = 'SYSTEM') {
        return ERROR_MESSAGES[category]?.[errorCode] || ERROR_MESSAGES.SYSTEM.UNKNOWN_ERROR;
    },

    /**
     * 성공 메시지 가져오기
     */
    getSuccessMessage(messageCode, category) {
        return SUCCESS_MESSAGES[category]?.[messageCode] || '작업이 완료되었습니다.';
    },

    /**
     * 로깅 함수 - 2025.08.18 수정: 현재 시간 포함
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logData = {
            timestamp,
            level,
            message,
            data
        };

        if (level === 'error') {
            console.error(`[ADMIN] ${timestamp}:`, message, data);
        } else if (level === 'warn') {
            console.warn(`[ADMIN] ${timestamp}:`, message, data);
        } else {
            console.log(`[ADMIN] ${timestamp}:`, message, data);
        }

        return logData;
    }
};

// 전역 접근 가능하도록 설정
window.ADMIN_CONFIG = ADMIN_CONFIG;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
window.STATS_CONFIG = STATS_CONFIG;
window.AdminUtils = AdminUtils;

console.log('📦 admin-config.js 로드 완료 - 2025.01.21 13:40');