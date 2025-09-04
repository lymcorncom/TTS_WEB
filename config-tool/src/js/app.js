/**
 * app.js
 * 配置工具主应用
 */

import { ConfigManager } from './modules/ConfigManager.js';
import { UIManager } from './modules/UIManager.js';

class ConfigToolApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.uiManager = new UIManager();
        this.currentConfig = null;
        this.currentSection = 'visual';
        this.isDirty = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('初始化配置工具...');
        
        try {
            // 初始化管理器
            await this.configManager.init();
            this.uiManager.init();
            
            // 初始化UI
            this.initializeUI();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载默认配置
            await this.loadDefaultConfig();
            
            console.log('配置工具初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 初始化导航
        this.initNavigation();
        
        // 初始化模态框
        this.initModals();
        
        // 初始化工具栏
        this.initToolbar();
        
        // 设置默认视图
        this.showSection('visual');
    }

    /**
     * 初始化导航
     */
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });
    }

    /**
     * 初始化模态框
     */
    initModals() {
        // 创建确认对话框
        this.uiManager.createModal('confirm', {
            title: '确认操作',
            content: '<p id="confirm-message"></p>',
            confirmText: '确认',
            cancelText: '取消'
        });

        // 创建新建配置对话框
        this.uiManager.createModal('new-config', {
            title: '新建配置',
            content: this.getNewConfigModalContent(),
            confirmText: '创建',
            cancelText: '取消',
            onConfirm: (data) => this.handleNewConfig()
        });

        // 创建导入配置对话框
        this.uiManager.createModal('import-config', {
            title: '导入配置',
            content: this.getImportConfigModalContent(),
            confirmText: '导入',
            cancelText: '取消',
            onConfirm: () => this.handleImportConfig()
        });
    }

    /**
     * 初始化工具栏
     */
    initToolbar() {
        // 新建按钮
        document.getElementById('new-config').addEventListener('click', () => {
            this.uiManager.showModal('new-config');
        });

        // 保存按钮
        document.getElementById('save-config').addEventListener('click', () => {
            this.saveCurrentConfig();
        });

        // 导入按钮
        document.getElementById('import-config').addEventListener('click', () => {
            this.uiManager.showModal('import-config');
        });

        // 导出按钮
        document.getElementById('export-config').addEventListener('click', () => {
            this.exportCurrentConfig();
        });

        // 预览按钮
        document.getElementById('preview-config').addEventListener('click', () => {
            this.previewConfig();
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听配置变化
        document.addEventListener('config-changed', (e) => {
            this.markDirty();
        });

        // 监听窗口关闭
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
            }
        });

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCurrentConfig();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.uiManager.showModal('new-config');
                        break;
                    case 'o':
                        e.preventDefault();
                        this.uiManager.showModal('import-config');
                        break;
                }
            }
        });
    }

    /**
     * 显示指定部分
     */
    showSection(section) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // 隐藏所有内容区域
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.remove('active');
        });

        // 显示目标内容区域
        const targetContent = document.getElementById(`${section}-content`);
        if (targetContent) {
            targetContent.classList.add('active');
            this.currentSection = section;
            
            // 渲染对应内容
            this.renderSectionContent(section);
        }
    }

    /**
     * 渲染部分内容
     */
    async renderSectionContent(section) {
        const container = document.getElementById(`${section}-content`);
        if (!container) return;

        this.uiManager.showLoading(container, '加载配置中...');

        try {
            switch (section) {
                case 'visual':
                    await this.renderVisualConfig(container);
                    break;
                case 'events':
                    await this.renderEventsConfig(container);
                    break;
                case 'stories':
                    await this.renderStoriesConfig(container);
                    break;
                case 'characters':
                    await this.renderCharactersConfig(container);
                    break;
                case 'system':
                    await this.renderSystemConfig(container);
                    break;
                default:
                    container.innerHTML = '<p>未知的配置部分</p>';
            }
        } catch (error) {
            console.error('渲染内容失败:', error);
            container.innerHTML = `<p class="error">加载失败: ${error.message}</p>`;
        } finally {
            this.uiManager.hideLoading(container);
        }
    }

    /**
     * 渲染视觉配置
     */
    async renderVisualConfig(container) {
        const config = await this.configManager.getConfig('visual');
        
        container.innerHTML = `
            <div class="config-section">
                <h3>视觉资源配置</h3>
                <div class="config-grid">
                    <div class="config-card">
                        <h4>背景图片</h4>
                        <div id="bg-config"></div>
                    </div>
                    <div class="config-card">
                        <h4>角色立绘</h4>
                        <div id="cg-config"></div>
                    </div>
                    <div class="config-card">
                        <h4>人偶模型</h4>
                        <div id="dolls-config"></div>
                    </div>
                    <div class="config-card">
                        <h4>NPC头像</h4>
                        <div id="npc-config"></div>
                    </div>
                </div>
            </div>
        `;

        // 渲染各个配置部分
        this.renderVisualSection('bg', config.bg || {});
        this.renderVisualSection('cg', config.cg || {});
        this.renderVisualSection('dolls', config.dolls || {});
        this.renderVisualSection('npc', config.npc || {});
    }

    /**
     * 渲染视觉配置部分
     */
    renderVisualSection(type, data) {
        const container = document.getElementById(`${type}-config`);
        if (!container) return;

        const items = Object.entries(data).map(([key, value]) => ({
            key,
            path: value,
            type
        }));

        const columns = [
            { key: 'key', label: '键名', sortable: true },
            { key: 'path', label: '文件路径', sortable: false },
            { 
                key: 'preview', 
                label: '预览', 
                render: (value, item) => {
                    if (item.path && (item.path.endsWith('.jpg') || item.path.endsWith('.png') || item.path.endsWith('.gif'))) {
                        return `<img src="../20250806t171210/${item.path}" alt="${item.key}" style="max-width: 50px; max-height: 50px;">`;
                    }
                    return '无预览';
                }
            }
        ];

        const actions = [
            {
                label: '编辑',
                class: 'btn-primary',
                handler: (item) => this.editVisualItem(type, item)
            },
            {
                label: '删除',
                class: 'btn-danger',
                handler: (item) => this.deleteVisualItem(type, item)
            }
        ];

        this.uiManager.createTable(container, items, columns, { actions });

        // 添加新增按钮
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.textContent = `添加${this.getTypeLabel(type)}`;
        addButton.addEventListener('click', () => this.addVisualItem(type));
        container.appendChild(addButton);
    }

    /**
     * 渲染事件配置
     */
    async renderEventsConfig(container) {
        const config = await this.configManager.getConfig('events');
        
        container.innerHTML = `
            <div class="config-section">
                <h3>事件配置</h3>
                <div class="toolbar">
                    <button id="add-event" class="btn btn-primary">添加事件</button>
                    <button id="import-events" class="btn btn-secondary">批量导入</button>
                </div>
                <div id="events-table"></div>
            </div>
        `;

        // 渲染事件表格
        const events = Object.entries(config).map(([id, event]) => ({
            id,
            ...event
        }));

        const columns = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: '名称', sortable: true },
            { key: 'type', label: '类型', sortable: true },
            { key: 'trigger', label: '触发条件', render: (value) => JSON.stringify(value) },
            { key: 'probability', label: '概率', sortable: true }
        ];

        const actions = [
            {
                label: '编辑',
                class: 'btn-primary',
                handler: (event) => this.editEvent(event)
            },
            {
                label: '复制',
                class: 'btn-secondary',
                handler: (event) => this.duplicateEvent(event)
            },
            {
                label: '删除',
                class: 'btn-danger',
                handler: (event) => this.deleteEvent(event)
            }
        ];

        this.uiManager.createTable(
            document.getElementById('events-table'),
            events,
            columns,
            { actions }
        );

        // 绑定工具栏事件
        document.getElementById('add-event').addEventListener('click', () => {
            this.addEvent();
        });

        document.getElementById('import-events').addEventListener('click', () => {
            this.importEvents();
        });
    }

    /**
     * 渲染故事配置
     */
    async renderStoriesConfig(container) {
        const config = await this.configManager.getConfig('stories');
        
        container.innerHTML = `
            <div class="config-section">
                <h3>故事配置</h3>
                <div class="toolbar">
                    <button id="add-story" class="btn btn-primary">添加故事</button>
                    <button id="story-editor" class="btn btn-secondary">故事编辑器</button>
                </div>
                <div id="stories-table"></div>
            </div>
        `;

        // 渲染故事表格
        const stories = Object.entries(config).map(([id, story]) => ({
            id,
            ...story
        }));

        const columns = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'title', label: '标题', sortable: true },
            { key: 'type', label: '类型', sortable: true },
            { 
                key: 'scenes', 
                label: '场景数', 
                render: (value) => Array.isArray(value) ? value.length : 0 
            }
        ];

        const actions = [
            {
                label: '编辑',
                class: 'btn-primary',
                handler: (story) => this.editStory(story)
            },
            {
                label: '预览',
                class: 'btn-secondary',
                handler: (story) => this.previewStory(story)
            },
            {
                label: '删除',
                class: 'btn-danger',
                handler: (story) => this.deleteStory(story)
            }
        ];

        this.uiManager.createTable(
            document.getElementById('stories-table'),
            stories,
            columns,
            { actions }
        );

        // 绑定工具栏事件
        document.getElementById('add-story').addEventListener('click', () => {
            this.addStory();
        });

        document.getElementById('story-editor').addEventListener('click', () => {
            this.openStoryEditor();
        });
    }

    /**
     * 渲染角色配置
     */
    async renderCharactersConfig(container) {
        const config = await this.configManager.getConfig('characters');
        
        container.innerHTML = `
            <div class="config-section">
                <h3>角色配置</h3>
                <div class="toolbar">
                    <button id="add-character" class="btn btn-primary">添加角色</button>
                    <button id="character-templates" class="btn btn-secondary">角色模板</button>
                </div>
                <div id="characters-table"></div>
            </div>
        `;

        // 渲染角色表格
        const characters = Object.entries(config).map(([id, character]) => ({
            id,
            ...character
        }));

        const columns = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'profile.name', label: '姓名', sortable: true },
            { key: 'profile.age', label: '年龄', sortable: true },
            { key: 'stats.intelligence', label: '智力', sortable: true },
            { key: 'stats.stamina', label: '体力', sortable: true }
        ];

        const actions = [
            {
                label: '编辑',
                class: 'btn-primary',
                handler: (character) => this.editCharacter(character)
            },
            {
                label: '复制',
                class: 'btn-secondary',
                handler: (character) => this.duplicateCharacter(character)
            },
            {
                label: '删除',
                class: 'btn-danger',
                handler: (character) => this.deleteCharacter(character)
            }
        ];

        this.uiManager.createTable(
            document.getElementById('characters-table'),
            characters,
            columns,
            { actions }
        );

        // 绑定工具栏事件
        document.getElementById('add-character').addEventListener('click', () => {
            this.addCharacter();
        });

        document.getElementById('character-templates').addEventListener('click', () => {
            this.showCharacterTemplates();
        });
    }

    /**
     * 渲染系统配置
     */
    async renderSystemConfig(container) {
        const config = await this.configManager.getConfig('system');
        
        container.innerHTML = `
            <div class="config-section">
                <h3>系统配置</h3>
                <div class="config-tabs">
                    <button class="tab-btn active" data-tab="time">时间系统</button>
                    <button class="tab-btn" data-tab="economy">经济系统</button>
                    <button class="tab-btn" data-tab="balance">平衡性</button>
                    <button class="tab-btn" data-tab="ui">界面设置</button>
                </div>
                <div class="tab-content">
                    <div id="time-tab" class="tab-panel active"></div>
                    <div id="economy-tab" class="tab-panel"></div>
                    <div id="balance-tab" class="tab-panel"></div>
                    <div id="ui-tab" class="tab-panel"></div>
                </div>
            </div>
        `;

        // 绑定标签页切换
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchSystemTab(tab);
            });
        });

        // 渲染默认标签页
        this.switchSystemTab('time');
    }

    /**
     * 切换系统配置标签页
     */
    switchSystemTab(tab) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // 更新面板状态
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');

        // 渲染对应内容
        this.renderSystemTab(tab);
    }

    /**
     * 渲染系统标签页内容
     */
    async renderSystemTab(tab) {
        const container = document.getElementById(`${tab}-tab`);
        const config = await this.configManager.getConfig('system');

        switch (tab) {
            case 'time':
                this.renderTimeSystemConfig(container, config.time || {});
                break;
            case 'economy':
                this.renderEconomySystemConfig(container, config.economy || {});
                break;
            case 'balance':
                this.renderBalanceConfig(container, config.balance || {});
                break;
            case 'ui':
                this.renderUIConfig(container, config.ui || {});
                break;
        }
    }

    /**
     * 加载默认配置
     */
    async loadDefaultConfig() {
        try {
            // 尝试加载现有配置
            const hasConfig = await this.configManager.hasConfig();
            if (!hasConfig) {
                // 创建默认配置
                await this.configManager.createDefaultConfig();
            }
            
            this.currentConfig = await this.configManager.getCurrentConfig();
            this.updateTitle();
            
        } catch (error) {
            console.error('加载配置失败:', error);
            this.showError('加载配置失败: ' + error.message);
        }
    }

    /**
     * 保存当前配置
     */
    async saveCurrentConfig() {
        if (!this.currentConfig) return;

        try {
            this.uiManager.showLoading(document.body, '保存中...');
            
            await this.configManager.saveConfig(this.currentConfig);
            
            this.isDirty = false;
            this.updateTitle();
            this.showSuccess('配置已保存');
            
        } catch (error) {
            console.error('保存失败:', error);
            this.showError('保存失败: ' + error.message);
        } finally {
            this.uiManager.hideLoading(document.body);
        }
    }

    /**
     * 导出当前配置
     */
    async exportCurrentConfig() {
        if (!this.currentConfig) return;

        try {
            const exported = await this.configManager.exportConfig();
            
            // 创建下载链接
            const blob = new Blob([exported], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `config-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('配置已导出');
            
        } catch (error) {
            console.error('导出失败:', error);
            this.showError('导出失败: ' + error.message);
        }
    }

    /**
     * 预览配置
     */
    previewConfig() {
        // 在新窗口中打开游戏预览
        const gameUrl = '../20250806t171210/index.html';
        window.open(gameUrl, '_blank');
    }

    /**
     * 标记为已修改
     */
    markDirty() {
        this.isDirty = true;
        this.updateTitle();
    }

    /**
     * 更新标题
     */
    updateTitle() {
        const title = document.querySelector('title');
        const header = document.querySelector('h1');
        const suffix = this.isDirty ? ' *' : '';
        
        if (title) title.textContent = `配置工具${suffix}`;
        if (header) header.textContent = `配置工具${suffix}`;
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    /**
     * 获取新建配置模态框内容
     */
    getNewConfigModalContent() {
        return `
            <div class="form-field">
                <label for="config-name">配置名称</label>
                <input type="text" id="config-name" name="name" placeholder="输入配置名称" required>
            </div>
            <div class="form-field">
                <label for="config-description">描述</label>
                <textarea id="config-description" name="description" placeholder="输入配置描述" rows="3"></textarea>
            </div>
            <div class="form-field">
                <label for="config-template">基于模板</label>
                <select id="config-template" name="template">
                    <option value="">空白配置</option>
                    <option value="default">默认配置</option>
                    <option value="demo">演示配置</option>
                </select>
            </div>
        `;
    }

    /**
     * 获取导入配置模态框内容
     */
    getImportConfigModalContent() {
        return `
            <div class="form-field">
                <label for="import-file">选择配置文件</label>
                <input type="file" id="import-file" accept=".json" required>
            </div>
            <div class="form-field">
                <label>
                    <input type="checkbox" id="merge-config" name="merge">
                    合并到当前配置（否则替换）
                </label>
            </div>
        `;
    }

    /**
     * 处理新建配置
     */
    async handleNewConfig() {
        const name = document.getElementById('config-name').value;
        const description = document.getElementById('config-description').value;
        const template = document.getElementById('config-template').value;

        if (!name.trim()) {
            this.showError('请输入配置名称');
            return false;
        }

        try {
            await this.configManager.createConfig(name, description, template);
            this.currentConfig = await this.configManager.getCurrentConfig();
            this.isDirty = false;
            this.updateTitle();
            this.showSuccess('配置创建成功');
            
            // 刷新当前视图
            this.renderSectionContent(this.currentSection);
            
            return true;
        } catch (error) {
            this.showError('创建失败: ' + error.message);
            return false;
        }
    }

    /**
     * 处理导入配置
     */
    async handleImportConfig() {
        const fileInput = document.getElementById('import-file');
        const mergeCheckbox = document.getElementById('merge-config');

        if (!fileInput.files.length) {
            this.showError('请选择配置文件');
            return false;
        }

        try {
            const file = fileInput.files[0];
            const content = await file.text();
            const config = JSON.parse(content);

            await this.configManager.importConfig(config, mergeCheckbox.checked);
            this.currentConfig = await this.configManager.getCurrentConfig();
            this.isDirty = false;
            this.updateTitle();
            this.showSuccess('配置导入成功');
            
            // 刷新当前视图
            this.renderSectionContent(this.currentSection);
            
            return true;
        } catch (error) {
            this.showError('导入失败: ' + error.message);
            return false;
        }
    }

    /**
     * 获取类型标签
     */
    getTypeLabel(type) {
        const labels = {
            bg: '背景',
            cg: '立绘',
            dolls: '人偶',
            npc: 'NPC'
        };
        return labels[type] || type;
    }

    // 以下是各种编辑操作的占位方法，实际实现会更复杂
    editVisualItem(type, item) { console.log('编辑视觉项目:', type, item); }
    deleteVisualItem(type, item) { console.log('删除视觉项目:', type, item); }
    addVisualItem(type) { console.log('添加视觉项目:', type); }
    editEvent(event) { console.log('编辑事件:', event); }
    duplicateEvent(event) { console.log('复制事件:', event); }
    deleteEvent(event) { console.log('删除事件:', event); }
    addEvent() { console.log('添加事件'); }
    importEvents() { console.log('导入事件'); }
    editStory(story) { console.log('编辑故事:', story); }
    previewStory(story) { console.log('预览故事:', story); }
    deleteStory(story) { console.log('删除故事:', story); }
    addStory() { console.log('添加故事'); }
    openStoryEditor() { console.log('打开故事编辑器'); }
    editCharacter(character) { console.log('编辑角色:', character); }
    duplicateCharacter(character) { console.log('复制角色:', character); }
    deleteCharacter(character) { console.log('删除角色:', character); }
    addCharacter() { console.log('添加角色'); }
    showCharacterTemplates() { console.log('显示角色模板'); }
    renderTimeSystemConfig(container, config) { container.innerHTML = '<p>时间系统配置</p>'; }
    renderEconomySystemConfig(container, config) { container.innerHTML = '<p>经济系统配置</p>'; }
    renderBalanceConfig(container, config) { container.innerHTML = '<p>平衡性配置</p>'; }
    renderUIConfig(container, config) { container.innerHTML = '<p>界面配置</p>'; }
}

// 导出应用类
export { ConfigToolApp };

// 全局初始化
window.addEventListener('DOMContentLoaded', async () => {
    const app = new ConfigToolApp();
    await app.init();
    
    // 将应用实例挂载到全局，便于调试
    window.configApp = app;
});