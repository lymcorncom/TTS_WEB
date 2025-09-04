/**
 * ConfigManager.js
 * 配置管理器 - 负责配置文件的读取、编辑、保存和验证
 */

export class ConfigManager {
    constructor() {
        this.configs = new Map();
        this.currentConfig = null;
        this.gameProjectPath = '../20250806t171210';
        this.configPaths = {
            visual: 'src/data/visualConfig.js',
            events: 'src/data/events.js',
            stories: 'src/data/stories.js',
            characters: 'src/core/DollsStatus.js',
            system: 'src/data/systemConfig.js'
        };
    }

    /**
     * 初始化配置管理器
     */
    async init() {
        console.log('初始化配置管理器...');
        
        try {
            // 加载所有配置文件
            await this.loadAllConfigs();
            console.log('配置管理器初始化完成');
        } catch (error) {
            console.error('配置管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载所有配置文件
     */
    async loadAllConfigs() {
        const loadPromises = Object.entries(this.configPaths).map(async ([type, path]) => {
            try {
                const config = await this.loadConfigFile(type, path);
                this.configs.set(type, config);
                console.log(`已加载 ${type} 配置`);
            } catch (error) {
                console.warn(`加载 ${type} 配置失败:`, error);
                // 设置默认配置
                this.configs.set(type, this.getDefaultConfig(type));
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * 加载配置文件
     */
    async loadConfigFile(type, relativePath) {
        // 由于浏览器安全限制，无法直接读取本地文件
        // 这里使用模拟数据，实际项目中需要通过服务器API获取
        console.log(`模拟加载配置文件: ${type} from ${relativePath}`);
        
        return this.getDefaultConfig(type);
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig(type) {
        switch (type) {
            case 'visual':
                return {
                    bg: {
                        'hub': 'assets/bg/hub.jpg',
                        'planning': 'assets/bg/planning.jpg',
                        'execution': 'assets/bg/execution.jpg'
                    },
                    cg: {
                        'character1_normal': 'assets/cg/character1_normal.png',
                        'character1_happy': 'assets/cg/character1_happy.png'
                    },
                    dolls: {
                        'doll1': 'assets/dolls/doll1.png',
                        'doll2': 'assets/dolls/doll2.png'
                    },
                    npc: {
                        'npc1': 'assets/npc/npc1.png',
                        'npc2': 'assets/npc/npc2.png'
                    }
                };

            case 'events':
                return {
                    'event_001': {
                        id: 'event_001',
                        name: '示例事件',
                        type: 'random',
                        trigger: { week: 1, probability: 0.3 },
                        effects: { intelligence: 1 },
                        description: '这是一个示例事件'
                    }
                };

            case 'stories':
                return {
                    'story_001': {
                        id: 'story_001',
                        title: '示例故事',
                        type: 'main',
                        scenes: [
                            {
                                speaker: 'narrator',
                                text: '这是故事的开始...',
                                background: 'hub'
                            }
                        ]
                    }
                };

            case 'characters':
                return {
                    'character1': {
                        id: 'character1',
                        profile: {
                            name: '示例角色',
                            age: 18,
                            birthday: '2006-01-01',
                            height: 160,
                            weight: 50,
                            bloodType: 'A',
                            hobby: '阅读',
                            personality: '温和'
                        },
                        stats: {
                            intelligence: 50,
                            stamina: 50,
                            stress: 0,
                            mood: 50
                        },
                        traits: ['聪明', '勤奋']
                    }
                };

            case 'system':
                return {
                    time: {
                        startWeek: 1,
                        maxWeeks: 52,
                        weekDays: 7
                    },
                    economy: {
                        startMoney: 1000,
                        weeklyAllowance: 200
                    },
                    balance: {
                        maxStats: 100,
                        statDecayRate: 0.1
                    },
                    ui: {
                        theme: 'default',
                        language: 'zh-cn'
                    }
                };

            default:
                return {};
        }
    }

    /**
     * 获取指定类型的配置
     */
    async getConfig(type) {
        if (!this.configs.has(type)) {
            await this.loadConfigFile(type, this.configPaths[type] || '');
        }
        return this.configs.get(type) || {};
    }

    /**
     * 设置配置
     */
    setConfig(type, config) {
        this.configs.set(type, config);
        this.markDirty();
    }

    /**
     * 更新配置项
     */
    updateConfig(type, path, value) {
        const config = this.configs.get(type) || {};
        this.setNestedValue(config, path, value);
        this.configs.set(type, config);
        this.markDirty();
    }

    /**
     * 删除配置项
     */
    deleteConfig(type, path) {
        const config = this.configs.get(type) || {};
        this.deleteNestedValue(config, path);
        this.configs.set(type, config);
        this.markDirty();
    }

    /**
     * 获取当前完整配置
     */
    async getCurrentConfig() {
        const config = {};
        for (const [type, data] of this.configs) {
            config[type] = data;
        }
        return config;
    }

    /**
     * 获取所有配置
     */
    getAllConfigs() {
        const config = {};
        for (const [type, data] of this.configs) {
            config[type] = data;
        }
        return config;
    }

    /**
     * 检查是否有配置
     */
    async hasConfig() {
        return this.configs.size > 0;
    }

    /**
     * 保存所有配置
     */
    async saveAllConfigs() {
        console.log('保存所有配置...');
        
        try {
            const configData = {
                metadata: this.currentConfig || {
                    name: '游戏配置',
                    description: '自动保存的配置',
                    version: '1.0.0',
                    savedAt: new Date().toISOString()
                },
                data: {}
            };
            
            for (const [type, data] of this.configs) {
                configData.data[type] = data;
            }
            
            localStorage.setItem('gameConfig', JSON.stringify(configData));
            console.log('所有配置已保存到本地存储');
            
        } catch (error) {
            console.error('保存所有配置失败:', error);
            throw error;
        }
    }

    /**
     * 加载配置数据
     */
    loadConfigs(configs) {
        console.log('加载配置数据...');
        
        try {
            this.configs.clear();
            
            if (configs.data) {
                for (const [type, data] of Object.entries(configs.data)) {
                    this.configs.set(type, data);
                }
            } else {
                // 直接是配置数据
                for (const [type, data] of Object.entries(configs)) {
                    this.configs.set(type, data);
                }
            }
            
            if (configs.metadata) {
                this.currentConfig = configs.metadata;
            }
            
            this.markDirty();
            console.log('配置数据加载完成');
            
        } catch (error) {
            console.error('加载配置数据失败:', error);
            throw error;
        }
    }

    /**
     * 创建默认配置
     */
    async createDefaultConfig() {
        const types = Object.keys(this.configPaths);
        for (const type of types) {
            this.configs.set(type, this.getDefaultConfig(type));
        }
        console.log('已创建默认配置');
    }

    /**
     * 创建新配置
     */
    async createConfig(name, description, template) {
        console.log(`创建新配置: ${name}, 模板: ${template}`);
        
        // 清空现有配置
        this.configs.clear();
        
        // 根据模板创建配置
        if (template === 'default' || template === 'demo') {
            await this.createDefaultConfig();
        }
        
        // 设置元数据
        this.currentConfig = {
            name,
            description,
            template,
            createdAt: new Date().toISOString(),
            version: '1.0.0'
        };
        
        this.markDirty();
    }

    /**
     * 保存配置
     */
    async saveConfig(config) {
        console.log('保存配置到本地存储...');
        
        try {
            // 由于浏览器限制，这里保存到 localStorage
            const configData = {
                metadata: this.currentConfig,
                data: {}
            };
            
            for (const [type, data] of this.configs) {
                configData.data[type] = data;
            }
            
            localStorage.setItem('gameConfig', JSON.stringify(configData));
            console.log('配置已保存到本地存储');
            
        } catch (error) {
            console.error('保存配置失败:', error);
            throw error;
        }
    }

    /**
     * 导入配置
     */
    async importConfig(importedConfig, merge = false) {
        console.log('导入配置...', { merge });
        
        try {
            if (!merge) {
                // 替换模式：清空现有配置
                this.configs.clear();
            }
            
            // 导入配置数据
            if (importedConfig.data) {
                for (const [type, data] of Object.entries(importedConfig.data)) {
                    if (merge && this.configs.has(type)) {
                        // 合并模式：深度合并
                        const existing = this.configs.get(type);
                        const merged = this.deepMerge(existing, data);
                        this.configs.set(type, merged);
                    } else {
                        // 直接设置
                        this.configs.set(type, data);
                    }
                }
            }
            
            // 更新元数据
            if (importedConfig.metadata) {
                this.currentConfig = {
                    ...importedConfig.metadata,
                    importedAt: new Date().toISOString()
                };
            }
            
            this.markDirty();
            console.log('配置导入完成');
            
        } catch (error) {
            console.error('导入配置失败:', error);
            throw error;
        }
    }

    /**
     * 导出配置
     */
    async exportConfig() {
        const configData = {
            metadata: {
                ...this.currentConfig,
                exportedAt: new Date().toISOString()
            },
            data: {}
        };
        
        for (const [type, data] of this.configs) {
            configData.data[type] = data;
        }
        
        return JSON.stringify(configData, null, 2);
    }

    /**
     * 验证配置
     */
    validateConfig(type, config) {
        const errors = [];
        
        switch (type) {
            case 'visual':
                errors.push(...this.validateVisualConfig(config));
                break;
            case 'events':
                errors.push(...this.validateEventsConfig(config));
                break;
            case 'stories':
                errors.push(...this.validateStoriesConfig(config));
                break;
            case 'characters':
                errors.push(...this.validateCharactersConfig(config));
                break;
            case 'system':
                errors.push(...this.validateSystemConfig(config));
                break;
        }
        
        return errors;
    }

    /**
     * 验证视觉配置
     */
    validateVisualConfig(config) {
        const errors = [];
        
        ['bg', 'cg', 'dolls', 'npc'].forEach(category => {
            if (config[category]) {
                Object.entries(config[category]).forEach(([key, path]) => {
                    if (!path || typeof path !== 'string') {
                        errors.push(`${category}.${key}: 路径无效`);
                    }
                });
            }
        });
        
        return errors;
    }

    /**
     * 验证事件配置
     */
    validateEventsConfig(config) {
        const errors = [];
        
        Object.entries(config).forEach(([id, event]) => {
            if (!event.name) {
                errors.push(`事件 ${id}: 缺少名称`);
            }
            if (!event.type) {
                errors.push(`事件 ${id}: 缺少类型`);
            }
            if (event.probability && (event.probability < 0 || event.probability > 1)) {
                errors.push(`事件 ${id}: 概率值无效`);
            }
        });
        
        return errors;
    }

    /**
     * 验证故事配置
     */
    validateStoriesConfig(config) {
        const errors = [];
        
        Object.entries(config).forEach(([id, story]) => {
            if (!story.title) {
                errors.push(`故事 ${id}: 缺少标题`);
            }
            if (!story.scenes || !Array.isArray(story.scenes)) {
                errors.push(`故事 ${id}: 缺少场景数据`);
            }
        });
        
        return errors;
    }

    /**
     * 验证角色配置
     */
    validateCharactersConfig(config) {
        const errors = [];
        
        Object.entries(config).forEach(([id, character]) => {
            if (!character.profile || !character.profile.name) {
                errors.push(`角色 ${id}: 缺少姓名`);
            }
            if (!character.stats) {
                errors.push(`角色 ${id}: 缺少属性数据`);
            }
        });
        
        return errors;
    }

    /**
     * 验证系统配置
     */
    validateSystemConfig(config) {
        const errors = [];
        
        if (config.time) {
            if (!config.time.maxWeeks || config.time.maxWeeks <= 0) {
                errors.push('时间系统: 最大周数无效');
            }
        }
        
        if (config.balance) {
            if (!config.balance.maxStats || config.balance.maxStats <= 0) {
                errors.push('平衡系统: 最大属性值无效');
            }
        }
        
        return errors;
    }

    /**
     * 设置嵌套值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * 删除嵌套值
     */
    deleteNestedValue(obj, path) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                return;
            }
            current = current[key];
        }
        
        delete current[keys[keys.length - 1]];
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 标记为已修改
     */
    markDirty() {
        // 触发配置变化事件
        const event = new CustomEvent('config-manager-changed');
        document.dispatchEvent(event);
    }

    /**
     * 获取配置统计信息
     */
    getConfigStats() {
        const stats = {};
        
        for (const [type, config] of this.configs) {
            stats[type] = {
                itemCount: this.countConfigItems(config),
                size: JSON.stringify(config).length
            };
        }
        
        return stats;
    }

    /**
     * 计算配置项数量
     */
    countConfigItems(obj) {
        if (!obj || typeof obj !== 'object') return 0;
        
        let count = 0;
        for (const value of Object.values(obj)) {
            if (value && typeof value === 'object') {
                count += this.countConfigItems(value);
            } else {
                count++;
            }
        }
        
        return count;
    }

    /**
     * 从游戏项目加载配置
     */
    async loadFromGameProject() {
        console.log('从游戏项目加载配置...');
        
        try {
            // 由于浏览器安全限制，这里使用模拟数据
            // 实际项目中需要通过服务器API获取
            await this.loadAllConfigs();
            console.log('游戏项目配置加载完成');
        } catch (error) {
            console.error('从游戏项目加载配置失败:', error);
            throw error;
        }
    }

    /**
     * 加载默认配置
     */
    async loadDefaults() {
        console.log('加载默认配置...');
        
        try {
            await this.createDefaultConfig();
            console.log('默认配置加载完成');
        } catch (error) {
            console.error('加载默认配置失败:', error);
            throw error;
        }
    }

    /**
     * 搜索配置
     */
    searchConfig(query, type = null) {
        const results = [];
        const searchTypes = type ? [type] : Array.from(this.configs.keys());
        
        for (const configType of searchTypes) {
            const config = this.configs.get(configType);
            if (config) {
                this.searchInObject(config, query, configType, '', results);
            }
        }
        
        return results;
    }

    /**
     * 在对象中搜索
     */
    searchInObject(obj, query, type, path, results) {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type,
                    path: currentPath,
                    key,
                    value,
                    match: 'value'
                });
            } else if (key.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type,
                    path: currentPath,
                    key,
                    value,
                    match: 'key'
                });
            } else if (value && typeof value === 'object') {
                this.searchInObject(value, query, type, currentPath, results);
            }
        }
    }
}
