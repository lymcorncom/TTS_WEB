/**
 * ValidationManager.js
 * 配置验证管理器
 */

export class ValidationManager {
    constructor() {
        this.validators = new Map();
        this.errors = [];
        this.warnings = [];
    }

    /**
     * 初始化验证管理器
     */
    init() {
        console.log('初始化验证管理器...');
        this.registerDefaultValidators();
    }

    /**
     * 注册默认验证器
     */
    registerDefaultValidators() {
        // 视觉配置验证器
        this.registerValidator('visual', (config) => {
            const errors = [];
            const categories = ['bg', 'cg', 'dolls', 'npc'];
            
            categories.forEach(category => {
                if (config[category]) {
                    Object.entries(config[category]).forEach(([key, path]) => {
                        if (!path || typeof path !== 'string') {
                            errors.push(`${category}.${key}: 路径无效`);
                        }
                        if (path && !this.isValidPath(path)) {
                            errors.push(`${category}.${key}: 路径格式不正确`);
                        }
                    });
                }
            });
            
            return errors;
        });

        // 事件配置验证器
        this.registerValidator('events', (config) => {
            const errors = [];
            
            Object.entries(config).forEach(([id, event]) => {
                if (!event.name) {
                    errors.push(`事件 ${id}: 缺少名称`);
                }
                if (!event.type) {
                    errors.push(`事件 ${id}: 缺少类型`);
                }
                if (event.probability !== undefined) {
                    if (typeof event.probability !== 'number' || event.probability < 0 || event.probability > 1) {
                        errors.push(`事件 ${id}: 概率值必须在0-1之间`);
                    }
                }
                if (event.trigger && typeof event.trigger !== 'object') {
                    errors.push(`事件 ${id}: 触发条件格式错误`);
                }
            });
            
            return errors;
        });

        // 故事配置验证器
        this.registerValidator('stories', (config) => {
            const errors = [];
            
            Object.entries(config).forEach(([id, story]) => {
                if (!story.title) {
                    errors.push(`故事 ${id}: 缺少标题`);
                }
                if (!story.scenes || !Array.isArray(story.scenes)) {
                    errors.push(`故事 ${id}: 缺少场景数据或格式错误`);
                } else {
                    story.scenes.forEach((scene, index) => {
                        if (!scene.text) {
                            errors.push(`故事 ${id} 场景 ${index}: 缺少文本内容`);
                        }
                    });
                }
            });
            
            return errors;
        });

        // 角色配置验证器
        this.registerValidator('characters', (config) => {
            const errors = [];
            
            Object.entries(config).forEach(([id, character]) => {
                if (!character.profile || !character.profile.name) {
                    errors.push(`角色 ${id}: 缺少姓名`);
                }
                if (!character.stats) {
                    errors.push(`角色 ${id}: 缺少属性数据`);
                } else {
                    const requiredStats = ['intelligence', 'stamina', 'stress', 'mood'];
                    requiredStats.forEach(stat => {
                        if (character.stats[stat] === undefined) {
                            errors.push(`角色 ${id}: 缺少${stat}属性`);
                        } else if (typeof character.stats[stat] !== 'number') {
                            errors.push(`角色 ${id}: ${stat}属性必须是数字`);
                        }
                    });
                }
            });
            
            return errors;
        });

        // 系统配置验证器
        this.registerValidator('system', (config) => {
            const errors = [];
            
            if (config.time) {
                if (!config.time.maxWeeks || config.time.maxWeeks <= 0) {
                    errors.push('时间系统: 最大周数必须大于0');
                }
                if (config.time.startWeek && config.time.startWeek < 1) {
                    errors.push('时间系统: 起始周数必须大于等于1');
                }
            }
            
            if (config.balance) {
                if (!config.balance.maxStats || config.balance.maxStats <= 0) {
                    errors.push('平衡系统: 最大属性值必须大于0');
                }
                if (config.balance.statDecayRate && (config.balance.statDecayRate < 0 || config.balance.statDecayRate > 1)) {
                    errors.push('平衡系统: 属性衰减率必须在0-1之间');
                }
            }
            
            return errors;
        });
    }

    /**
     * 注册验证器
     */
    registerValidator(type, validator) {
        this.validators.set(type, validator);
    }

    /**
     * 验证配置
     */
    validate(type, config) {
        const validator = this.validators.get(type);
        if (!validator) {
            console.warn(`未找到类型 ${type} 的验证器`);
            return [];
        }

        try {
            return validator(config) || [];
        } catch (error) {
            console.error(`验证 ${type} 配置时出错:`, error);
            return [`验证过程出错: ${error.message}`];
        }
    }

    /**
     * 验证所有配置
     */
    validateAll(configs) {
        this.errors = [];
        this.warnings = [];

        for (const [type, config] of Object.entries(configs)) {
            const typeErrors = this.validate(type, config);
            typeErrors.forEach(error => {
                this.errors.push({
                    type,
                    message: error,
                    severity: 'error'
                });
            });
        }

        return {
            errors: this.errors,
            warnings: this.warnings,
            isValid: this.errors.length === 0
        };
    }

    /**
     * 获取验证结果
     */
    getValidationResult() {
        return {
            errors: this.errors,
            warnings: this.warnings,
            isValid: this.errors.length === 0
        };
    }

    /**
     * 清除验证结果
     */
    clearValidation() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * 检查路径是否有效
     */
    isValidPath(path) {
        // 基本路径格式检查
        if (typeof path !== 'string' || path.trim() === '') {
            return false;
        }

        // 检查是否包含非法字符
        const invalidChars = ['<', '>', '|', '"', '*', '?'];
        if (invalidChars.some(char => path.includes(char))) {
            return false;
        }

        // 检查是否是相对路径
        if (path.startsWith('/') || path.includes('..')) {
            return false;
        }

        return true;
    }

    /**
     * 验证JSON格式
     */
    validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return { valid: true };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message 
            };
        }
    }

    /**
     * 验证必填字段
     */
    validateRequired(obj, requiredFields) {
        const missing = [];
        
        requiredFields.forEach(field => {
            if (this.getNestedValue(obj, field) === undefined) {
                missing.push(field);
            }
        });

        return missing;
    }

    /**
     * 验证数值范围
     */
    validateRange(value, min, max) {
        if (typeof value !== 'number') {
            return false;
        }
        return value >= min && value <= max;
    }

    /**
     * 验证枚举值
     */
    validateEnum(value, allowedValues) {
        return allowedValues.includes(value);
    }

    /**
     * 获取嵌套值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 添加自定义验证规则
     */
    addCustomRule(type, ruleName, ruleFunction) {
        if (!this.customRules) {
            this.customRules = new Map();
        }
        
        if (!this.customRules.has(type)) {
            this.customRules.set(type, new Map());
        }
        
        this.customRules.get(type).set(ruleName, ruleFunction);
    }

    /**
     * 执行自定义验证规则
     */
    executeCustomRules(type, config) {
        if (!this.customRules || !this.customRules.has(type)) {
            return [];
        }

        const errors = [];
        const rules = this.customRules.get(type);
        
        for (const [ruleName, ruleFunction] of rules) {
            try {
                const result = ruleFunction(config);
                if (result && Array.isArray(result)) {
                    errors.push(...result);
                } else if (result && typeof result === 'string') {
                    errors.push(result);
                }
            } catch (error) {
                errors.push(`自定义规则 ${ruleName} 执行失败: ${error.message}`);
            }
        }

        return errors;
    }
}