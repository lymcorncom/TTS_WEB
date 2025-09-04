/**
 * 配置工具主入口文件
 * 负责初始化应用和协调各个模块
 */

import { ConfigManager } from './modules/ConfigManager.js';
import { UIManager } from './modules/UIManager.js';
import { ValidationManager } from './modules/ValidationManager.js';
import { PreviewManager } from './modules/PreviewManager.js';
import { HistoryManager } from './modules/HistoryManager.js';

class ConfigTool {
    constructor() {
        this.configManager = new ConfigManager();
        this.uiManager = new UIManager();
        this.validationManager = new ValidationManager();
        this.previewManager = new PreviewManager();
        this.historyManager = new HistoryManager();
        
        this.currentTab = 'visual-config';
        this.unsavedChanges = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化配置工具...');
            
            // 初始化各个管理器
            await this.configManager.init();
            this.uiManager.init();
            this.validationManager.init();
            this.previewManager.init();
            this.historyManager.init();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载初始数据
            await this.loadInitialData();
            
            // 渲染初始界面
            this.renderCurrentTab();
            
            console.log('配置工具初始化完成');
            this.showMessage('配置工具已就绪', 'success');
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.showMessage('初始化失败: ' + error.message, 'error');
        }
    }

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 头部按钮事件
        document.getElementById('save-all-btn').addEventListener('click', () => {
            this.saveAllConfigs();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportConfigs();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            this.importConfigs();
        });

        // 模态框事件
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        // 点击模态框背景关闭
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.hideModal();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveAllConfigs();
                        break;
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.historyManager.redo();
                        } else {
                            e.preventDefault();
                            this.historyManager.undo();
                        }
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // 监听配置变化
        document.addEventListener('config-changed', (e) => {
            this.unsavedChanges = true;
            this.updateSaveButtonState();
        });

        // 页面关闭前提醒
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return e.returnValue;
            }
        });
    }

    /**
     * 切换标签页
     */
    switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;
        this.renderCurrentTab();
    }

    /**
     * 渲染当前标签页内容
     */
    async renderCurrentTab() {
        try {
            switch (this.currentTab) {
                case 'visual-config':
                    await this.renderVisualConfig();
                    break;
                case 'events-config':
                    await this.renderEventsConfig();
                    break;
                case 'stories-config':
                    await this.renderStoriesConfig();
                    break;
                case 'character-config':
                    await this.renderCharacterConfig();
                    break;
                case 'attributes-config':
                    await this.renderAttributesConfig();
                    break;
                case 'time-config':
                    await this.renderTimeConfig();
                    break;
                case 'economy-config':
                    await this.renderEconomyConfig();
                    break;
                case 'balance-config':
                    await this.renderBalanceConfig();
                    break;
                case 'preview':
                    await this.renderPreview();
                    break;
                case 'validation':
                    await this.renderValidation();
                    break;
                case 'history':
                    await this.renderHistory();
                    break;
            }
        } catch (error) {
            console.error('渲染标签页失败:', error);
            this.showMessage('渲染失败: ' + error.message, 'error');
        }
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            // 从游戏项目中加载现有配置
            await this.configManager.loadFromGameProject('../20250806t171210');
            
            // 初始化历史记录
            this.historyManager.saveSnapshot('初始状态');
            
        } catch (error) {
            console.warn('加载初始数据失败，使用默认配置:', error);
            // 使用默认配置
            await this.configManager.loadDefaults();
        }
    }

    /**
     * 渲染视觉配置面板
     */
    async renderVisualConfig() {
        const visualConfig = this.configManager.getConfig('visual');
        
        // 渲染角色配置
        this.renderCharactersConfig(visualConfig.characters);
        
        // 渲染背景配置
        this.renderBackgroundsConfig(visualConfig.backgrounds);
        
        // 渲染CG配置
        this.renderCGConfig(visualConfig.cg);
        
        // 渲染音频配置
        this.renderAudioConfig(visualConfig.audio);
    }

    /**
     * 渲染角色配置
     */
    renderCharactersConfig(characters) {
        const container = document.getElementById('characters-config');
        if (!container) return;
        
        container.innerHTML = '';

        if (!characters || Object.keys(characters).length === 0) {
            container.innerHTML = '<p class="empty-state">暂无角色配置</p>';
            return;
        }

        Object.entries(characters).forEach(([key, characterPath]) => {
            const characterDiv = document.createElement('div');
            characterDiv.className = 'character-config-item';
            characterDiv.innerHTML = `
                <div class="config-item-header">
                    <h4>${key}</h4>
                    <div class="config-item-actions">
                        <button class="btn btn-small btn-secondary" onclick="configTool.editCharacter('${key}')">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="configTool.deleteCharacter('${key}')">删除</button>
                    </div>
                </div>
                <div class="character-preview">
                    <img src="../20250806t171210/${characterPath}" alt="${key}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH</text></svg>'"
                         style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;">
                    <div class="character-path">${characterPath}</div>
                </div>
            `;
            container.appendChild(characterDiv);
        });

        // 添加新角色按钮
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.textContent = '添加新角色';
        addButton.onclick = () => this.addNewCharacter();
        container.appendChild(addButton);
    }

    /**
     * 渲染NPC配置
     */
    renderNPCConfig(npc) {
        const container = document.getElementById('npc-config');
        if (!container) return;
        
        container.innerHTML = '';

        if (!npc || Object.keys(npc).length === 0) {
            container.innerHTML = '<p class="empty-state">暂无NPC配置</p>';
            return;
        }

        const npcGrid = document.createElement('div');
        npcGrid.className = 'npc-grid';
        npcGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;';

        Object.entries(npc).forEach(([key, path]) => {
            const npcDiv = document.createElement('div');
            npcDiv.className = 'npc-item';
            npcDiv.style.cssText = 'border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; text-align: center;';
            npcDiv.innerHTML = `
                <img src="../20250806t171210/${path}" alt="${key}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5QQ+WbvueJhzwvdGV4dD48L3N2Zz4='">
                <div style="font-weight: 500; margin-bottom: 0.5rem;">${key}</div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.5rem;">${path}</div>
                <div>
                    <button class="btn btn-small btn-secondary" onclick="configTool.editNPC('${key}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="configTool.deleteNPC('${key}')">删除</button>
                </div>
            `;
            npcGrid.appendChild(npcDiv);
        });

        container.appendChild(npcGrid);

        // 添加新NPC按钮
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.textContent = '添加新NPC';
        addButton.style.marginTop = '1rem';
        addButton.onclick = () => this.addNewNPC();
        container.appendChild(addButton);
    }

    /**
     * 渲染背景配置
     */
    renderBackgroundsConfig(backgrounds) {
        const container = document.getElementById('backgrounds-config');
        if (!container) return;
        
        container.innerHTML = '';

        if (!backgrounds || Object.keys(backgrounds).length === 0) {
            container.innerHTML = '<p class="empty-state">暂无背景配置</p>';
            return;
        }

        const backgroundsGrid = document.createElement('div');
        backgroundsGrid.className = 'backgrounds-grid';
        backgroundsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;';

        Object.entries(backgrounds).forEach(([key, path]) => {
            const bgDiv = document.createElement('div');
            bgDiv.className = 'background-item';
            bgDiv.style.cssText = 'border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; text-align: center;';
            bgDiv.innerHTML = `
                <img src="../20250806t171210/${path}" alt="${key}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuiDjOaZr+WbvueJhzwvdGV4dD48L3N2Zz4='">
                <div style="font-weight: 500; margin-bottom: 0.5rem;">${key}</div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.5rem;">${path}</div>
                <div>
                    <button class="btn btn-small btn-secondary" onclick="configTool.editBackground('${key}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="configTool.deleteBackground('${key}')">删除</button>
                </div>
            `;
            backgroundsGrid.appendChild(bgDiv);
        });

        container.appendChild(backgroundsGrid);

        // 添加新背景按钮
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.textContent = '添加新背景';
        addButton.style.marginTop = '1rem';
        addButton.onclick = () => this.addNewBackground();
        container.appendChild(addButton);
    }

    /**
     * 渲染CG配置
     */
    renderCGConfig(cg) {
        const container = document.getElementById('cg-config');
        if (!container) return;
        
        container.innerHTML = '';

        if (!cg || Object.keys(cg).length === 0) {
            container.innerHTML = '<p class="empty-state">暂无CG配置</p>';
            return;
        }

        const cgGrid = document.createElement('div');
        cgGrid.className = 'cg-grid';
        cgGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;';

        Object.entries(cg).forEach(([key, path]) => {
            const cgDiv = document.createElement('div');
            cgDiv.className = 'cg-item';
            cgDiv.style.cssText = 'border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; text-align: center;';
            cgDiv.innerHTML = `
                <img src="../20250806t171210/${path}" alt="${key}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNH5Zu+54mH</text></svg>='">
                <div style="font-weight: 500; margin-bottom: 0.5rem;">${key}</div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.5rem;">${path}</div>
                <div>
                    <button class="btn btn-small btn-secondary" onclick="configTool.editCG('${key}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="configTool.deleteCG('${key}')">删除</button>
                </div>
            `;
            cgGrid.appendChild(cgDiv);
        });

        container.appendChild(cgGrid);

        // 添加新CG按钮
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.textContent = '添加新CG';
        addButton.style.marginTop = '1rem';
        addButton.onclick = () => this.addNewCG();
        container.appendChild(addButton);
    }

    /**
     * 渲染音频配置
     */
    renderAudioConfig(audio) {
        const container = document.getElementById('audio-config');
        if (!container) return;
        
        container.innerHTML = '';

        if (!audio) {
            container.innerHTML = '<p class="empty-state">暂无音频配置</p>';
            return;
        }

        // BGM配置
        const bgmSection = document.createElement('div');
        bgmSection.innerHTML = `
            <h4>背景音乐 (BGM)</h4>
            <div id="bgm-list" class="audio-list"></div>
            <button class="btn btn-secondary btn-small" onclick="configTool.addNewBGM()">添加BGM</button>
        `;
        container.appendChild(bgmSection);

        const bgmList = bgmSection.querySelector('#bgm-list');
        const bgmData = audio.bgm || {};
        
        if (Object.keys(bgmData).length === 0) {
            bgmList.innerHTML = '<p class="empty-state">暂无BGM配置</p>';
        } else {
            Object.entries(bgmData).forEach(([key, path]) => {
                const audioDiv = document.createElement('div');
                audioDiv.className = 'audio-item';
                audioDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border: 1px solid #e9ecef; border-radius: 4px; margin-bottom: 0.5rem;';
                audioDiv.innerHTML = `
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${key}</div>
                        <div style="font-size: 0.8rem; color: #6c757d;">${path}</div>
                    </div>
                    <audio controls style="width: 200px;">
                        <source src="../20250806t171210/${path}" type="audio/mpeg">
                        您的浏览器不支持音频播放
                    </audio>
                    <div>
                        <button class="btn btn-small btn-secondary" onclick="configTool.editBGM('${key}')">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="configTool.deleteBGM('${key}')">删除</button>
                    </div>
                `;
                bgmList.appendChild(audioDiv);
            });
        }

        // SE配置
        const seSection = document.createElement('div');
        seSection.style.marginTop = '2rem';
        seSection.innerHTML = `
            <h4>音效 (SE)</h4>
            <div id="se-list" class="audio-list"></div>
            <button class="btn btn-secondary btn-small" onclick="configTool.addNewSE()">添加音效</button>
        `;
        container.appendChild(seSection);

        const seList = seSection.querySelector('#se-list');
        Object.entries(audio.se || {}).forEach(([key, path]) => {
            const audioDiv = document.createElement('div');
            audioDiv.className = 'audio-item';
            audioDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border: 1px solid #e9ecef; border-radius: 4px; margin-bottom: 0.5rem;';
            audioDiv.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${key}</div>
                    <div style="font-size: 0.8rem; color: #6c757d;">${path}</div>
                </div>
                <audio controls style="width: 200px;">
                    <source src="../20250806t171210/${path}" type="audio/wav">
                    您的浏览器不支持音频播放
                </audio>
                <div>
                    <button class="btn btn-small btn-secondary" onclick="configTool.editSE('${key}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="configTool.deleteSE('${key}')">删除</button>
                </div>
            `;
            seList.appendChild(audioDiv);
        });
    }

    /**
     * 渲染事件配置
     */
    async renderEventsConfig() {
        const events = this.configManager.getConfig('events');
        const container = document.getElementById('events-list');
        container.innerHTML = '';

        Object.entries(events).forEach(([eventId, event]) => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            eventDiv.innerHTML = `
                <div class="event-header">
                    <div>
                        <div class="event-title">${event.name}</div>
                        <div class="event-id">${eventId}</div>
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-small btn-secondary" onclick="configTool.editEvent('${eventId}')">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="configTool.deleteEvent('${eventId}')">删除</button>
                    </div>
                </div>
                <div class="event-description">${event.description}</div>
                <div class="event-conditions">
                    <h4>触发条件:</h4>
                    <div class="condition-list">
                        ${(event.conditions || []).map(condition => 
                            `<span class="condition-tag">${condition.type}: ${condition.value}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="event-effects">
                    <h4>效果:</h4>
                    <div class="effect-list">
                        ${(event.effects || []).map(effect => 
                            `<span class="effect-tag">${effect.type}: ${effect.name || ''} ${effect.value}</span>`
                        ).join('')}
                    </div>
                </div>
                ${event.story ? `<div style="margin-top: 0.5rem;"><span class="condition-tag">关联剧情: ${event.story}</span></div>` : ''}
            `;
            container.appendChild(eventDiv);
        });

        // 绑定添加事件按钮
        document.getElementById('add-event-btn').onclick = () => this.addNewEvent();
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info') {
        // 创建消息元素
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // 插入到页面顶部
        const content = document.querySelector('.content');
        content.insertBefore(message, content.firstChild);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    /**
     * 显示模态框
     */
    showModal(title, content, onConfirm = null) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('show');
        
        // 绑定确认按钮事件
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.onclick = () => {
            if (onConfirm) {
                onConfirm();
            }
            this.hideModal();
        };
    }

    /**
     * 隐藏模态框
     */
    hideModal() {
        document.getElementById('modal').classList.remove('show');
    }

    /**
     * 更新保存按钮状态
     */
    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-all-btn');
        if (this.unsavedChanges) {
            saveBtn.textContent = '保存所有配置 *';
            saveBtn.classList.add('btn-warning');
            saveBtn.classList.remove('btn-primary');
        } else {
            saveBtn.textContent = '保存所有配置';
            saveBtn.classList.add('btn-primary');
            saveBtn.classList.remove('btn-warning');
        }
    }

    /**
     * 保存所有配置
     */
    async saveAllConfigs() {
        try {
            this.showMessage('正在保存配置...', 'info');
            
            await this.configManager.saveAllConfigs();
            
            this.unsavedChanges = false;
            this.updateSaveButtonState();
            
            // 保存历史记录
            this.historyManager.saveSnapshot('保存所有配置');
            
            this.showMessage('配置保存成功', 'success');
            
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showMessage('保存失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出配置
     */
    async exportConfigs() {
        try {
            const configs = this.configManager.getAllConfigs();
            const dataStr = JSON.stringify(configs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `game-config-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            
            this.showMessage('配置导出成功', 'success');
            
        } catch (error) {
            console.error('导出配置失败:', error);
            this.showMessage('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导入配置
     */
    importConfigs() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                const configs = JSON.parse(text);
                
                this.configManager.loadConfigs(configs);
                this.renderCurrentTab();
                
                this.unsavedChanges = true;
                this.updateSaveButtonState();
                
                this.showMessage('配置导入成功', 'success');
                
            } catch (error) {
                console.error('导入配置失败:', error);
                this.showMessage('导入失败: ' + error.message, 'error');
            }
        };
        input.click();
    }

    /**
     * 渲染剧情配置
     */
    async renderStoriesConfig() {
        const stories = this.configManager.getConfig('stories');
        const container = document.getElementById('stories-list');
        container.innerHTML = '';

        Object.entries(stories).forEach(([storyId, story]) => {
            const storyDiv = document.createElement('div');
            storyDiv.className = 'story-item';
            storyDiv.innerHTML = `
                <div class="story-header">
                    <div>
                        <div class="story-title">${story.title}</div>
                        <div class="story-id">${storyId}</div>
                    </div>
                    <div class="story-actions">
                        <button class="btn btn-small btn-secondary" onclick="configTool.editStory('${storyId}')">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="configTool.deleteStory('${storyId}')">删除</button>
                    </div>
                </div>
                <div class="story-type">类型: ${story.type || '未分类'}</div>
                <div class="story-scenes">
                    <h4>场景数量: ${(story.scenes || []).length}</h4>
                    <div class="scene-preview">
                        ${(story.scenes || []).slice(0, 3).map((scene, index) => 
                            `<div class="scene-item">
                                <span class="scene-speaker">${scene.speaker || '旁白'}</span>: 
                                <span class="scene-text">${(scene.text || '').substring(0, 50)}${scene.text && scene.text.length > 50 ? '...' : ''}</span>
                            </div>`
                        ).join('')}
                        ${(story.scenes || []).length > 3 ? `<div class="scene-more">还有 ${story.scenes.length - 3} 个场景...</div>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(storyDiv);
        });

        // 绑定添加剧情按钮
        const addStoryBtn = document.getElementById('add-story-btn');
        if (addStoryBtn) {
            addStoryBtn.onclick = () => this.addNewStory();
        }
    }

    // 占位方法，将在后续实现
    async renderCharacterConfig() { /* TODO */ }
    async renderAttributesConfig() { /* TODO */ }
    async renderTimeConfig() { /* TODO */ }
    async renderEconomyConfig() { /* TODO */ }
    async renderBalanceConfig() { /* TODO */ }
    async renderPreview() { /* TODO */ }
    async renderValidation() { /* TODO */ }
    async renderHistory() { /* TODO */ }

    // 编辑方法占位
    editCharacter(key) { console.log('编辑角色:', key); }
    deleteCharacter(key) { console.log('删除角色:', key); }
    addNewCharacter() { console.log('添加新角色'); }
    editBackground(key) { console.log('编辑背景:', key); }
    deleteBackground(key) { console.log('删除背景:', key); }
    addNewBackground() { console.log('添加新背景'); }
    editCG(key) { console.log('编辑CG:', key); }
    deleteCG(key) { console.log('删除CG:', key); }
    addNewCG() { console.log('添加新CG'); }
    editBGM(key) { console.log('编辑BGM:', key); }
    deleteBGM(key) { console.log('删除BGM:', key); }
    addNewBGM() { console.log('添加新BGM'); }
    editSE(key) { console.log('编辑SE:', key); }
    deleteSE(key) { console.log('删除SE:', key); }
    addNewSE() { console.log('添加新SE'); }
    editEvent(key) { console.log('编辑事件:', key); }
    deleteEvent(key) { console.log('删除事件:', key); }
    editStory(key) { console.log('编辑剧情:', key); }
    deleteStory(key) { console.log('删除剧情:', key); }

    /**
     * 添加新事件
     */
    addNewEvent() {
        this.showModal('添加新事件', `
            <div class="form-section">
                <div class="form-field">
                    <label>事件ID</label>
                    <input type="text" id="new-event-id" placeholder="event_001">
                </div>
                <div class="form-field">
                    <label>事件名称</label>
                    <input type="text" id="new-event-name" placeholder="事件名称">
                </div>
                <div class="form-field">
                    <label>事件类型</label>
                    <select id="new-event-type">
                        <option value="random">随机事件</option>
                        <option value="main">主线事件</option>
                        <option value="special">特殊事件</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>事件描述</label>
                    <textarea id="new-event-description" placeholder="事件描述" rows="3"></textarea>
                </div>
                <div class="form-field">
                    <label>触发概率 (0-1)</label>
                    <input type="number" id="new-event-probability" min="0" max="1" step="0.1" value="0.3">
                </div>
            </div>
        `, () => {
            const id = document.getElementById('new-event-id').value;
            const name = document.getElementById('new-event-name').value;
            const type = document.getElementById('new-event-type').value;
            const description = document.getElementById('new-event-description').value;
            const probability = parseFloat(document.getElementById('new-event-probability').value);

            if (!id || !name) {
                this.showMessage('请填写事件ID和名称', 'error');
                return;
            }

            // 创建新事件
            const newEvent = {
                id: id,
                name: name,
                type: type,
                description: description,
                trigger: { probability: probability },
                conditions: [],
                effects: []
            };

            // 添加到配置
            const events = this.configManager.getConfig('events');
            events[id] = newEvent;
            this.configManager.setConfig('events', events);

            // 重新渲染
            this.renderEventsConfig();
            this.showMessage('事件添加成功', 'success');
        });
    }

    /**
     * 添加新剧情
     */
    addNewStory() {
        this.showModal('添加新剧情', `
            <div class="form-section">
                <div class="form-field">
                    <label>剧情ID</label>
                    <input type="text" id="new-story-id" placeholder="story_001">
                </div>
                <div class="form-field">
                    <label>剧情标题</label>
                    <input type="text" id="new-story-title" placeholder="剧情标题">
                </div>
                <div class="form-field">
                    <label>剧情类型</label>
                    <select id="new-story-type">
                        <option value="main">主线剧情</option>
                        <option value="side">支线剧情</option>
                        <option value="event">事件剧情</option>
                        <option value="ending">结局剧情</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>初始场景</label>
                    <div class="scene-editor">
                        <input type="text" id="new-scene-speaker" placeholder="说话者" value="旁白">
                        <textarea id="new-scene-text" placeholder="对话内容" rows="3"></textarea>
                        <input type="text" id="new-scene-background" placeholder="背景 (可选)">
                    </div>
                </div>
            </div>
        `, () => {
            const id = document.getElementById('new-story-id').value;
            const title = document.getElementById('new-story-title').value;
            const type = document.getElementById('new-story-type').value;
            const speaker = document.getElementById('new-scene-speaker').value;
            const text = document.getElementById('new-scene-text').value;
            const background = document.getElementById('new-scene-background').value;

            if (!id || !title) {
                this.showMessage('请填写剧情ID和标题', 'error');
                return;
            }

            // 创建新剧情
            const newStory = {
                id: id,
                title: title,
                type: type,
                scenes: []
            };

            // 如果有初始场景内容，添加第一个场景
            if (text) {
                const scene = {
                    speaker: speaker || '旁白',
                    text: text
                };
                if (background) {
                    scene.background = background;
                }
                newStory.scenes.push(scene);
            }

            // 添加到配置
            const stories = this.configManager.getConfig('stories');
            stories[id] = newStory;
            this.configManager.setConfig('stories', stories);

            // 重新渲染
            this.renderStoriesConfig();
            this.showMessage('剧情添加成功', 'success');
        });
    }
}

// 创建全局实例
const configTool = new ConfigTool();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    configTool.init();
});

// 导出到全局作用域供HTML调用
window.configTool = configTool;