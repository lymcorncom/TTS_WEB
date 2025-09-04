/**
 * PreviewManager.js
 * 预览管理器
 */

export class PreviewManager {
    constructor() {
        this.previewWindow = null;
        this.gameUrl = '../20250806t171210/index.html';
        this.previewData = null;
    }

    /**
     * 初始化预览管理器
     */
    init() {
        console.log('初始化预览管理器...');
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听窗口关闭事件
        window.addEventListener('beforeunload', () => {
            this.closePreview();
        });
    }

    /**
     * 打开预览
     */
    openPreview(config = null) {
        try {
            // 如果已有预览窗口，先关闭
            if (this.previewWindow && !this.previewWindow.closed) {
                this.previewWindow.close();
            }

            // 构建预览URL
            let previewUrl = this.gameUrl;
            
            if (config) {
                // 将配置数据编码到URL参数中
                const configParam = encodeURIComponent(JSON.stringify(config));
                previewUrl += `?preview=true&config=${configParam}`;
            }

            // 打开新窗口
            this.previewWindow = window.open(
                previewUrl,
                'gamePreview',
                'width=1200,height=800,scrollbars=yes,resizable=yes'
            );

            if (this.previewWindow) {
                this.previewWindow.focus();
                console.log('预览窗口已打开');
                return true;
            } else {
                throw new Error('无法打开预览窗口，可能被浏览器阻止');
            }
        } catch (error) {
            console.error('打开预览失败:', error);
            this.showError('打开预览失败: ' + error.message);
            return false;
        }
    }

    /**
     * 关闭预览
     */
    closePreview() {
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close();
            this.previewWindow = null;
            console.log('预览窗口已关闭');
        }
    }

    /**
     * 刷新预览
     */
    refreshPreview(config = null) {
        if (this.previewWindow && !this.previewWindow.closed) {
            if (config) {
                // 更新配置并刷新
                this.updatePreviewConfig(config);
            } else {
                // 简单刷新
                this.previewWindow.location.reload();
            }
        } else {
            // 重新打开预览
            this.openPreview(config);
        }
    }

    /**
     * 更新预览配置
     */
    updatePreviewConfig(config) {
        if (this.previewWindow && !this.previewWindow.closed) {
            try {
                // 通过postMessage发送配置更新
                this.previewWindow.postMessage({
                    type: 'configUpdate',
                    config: config
                }, '*');
                
                console.log('预览配置已更新');
            } catch (error) {
                console.error('更新预览配置失败:', error);
                // 如果postMessage失败，则刷新页面
                this.previewWindow.location.reload();
            }
        }
    }

    /**
     * 预览特定场景
     */
    previewScene(sceneId, config = null) {
        const previewConfig = {
            ...config,
            startScene: sceneId,
            previewMode: true
        };
        
        return this.openPreview(previewConfig);
    }

    /**
     * 预览故事
     */
    previewStory(storyId, config = null) {
        const previewConfig = {
            ...config,
            startStory: storyId,
            previewMode: true
        };
        
        return this.openPreview(previewConfig);
    }

    /**
     * 预览事件
     */
    previewEvent(eventId, config = null) {
        const previewConfig = {
            ...config,
            triggerEvent: eventId,
            previewMode: true
        };
        
        return this.openPreview(previewConfig);
    }

    /**
     * 预览角色
     */
    previewCharacter(characterId, config = null) {
        const previewConfig = {
            ...config,
            focusCharacter: characterId,
            previewMode: true
        };
        
        return this.openPreview(previewConfig);
    }

    /**
     * 创建预览快照
     */
    createSnapshot(name, config) {
        const snapshot = {
            name,
            config: JSON.parse(JSON.stringify(config)), // 深拷贝
            timestamp: new Date().toISOString(),
            id: this.generateId()
        };

        // 保存到本地存储
        const snapshots = this.getSnapshots();
        snapshots.push(snapshot);
        localStorage.setItem('previewSnapshots', JSON.stringify(snapshots));

        console.log('预览快照已创建:', name);
        return snapshot;
    }

    /**
     * 获取预览快照列表
     */
    getSnapshots() {
        try {
            const snapshots = localStorage.getItem('previewSnapshots');
            return snapshots ? JSON.parse(snapshots) : [];
        } catch (error) {
            console.error('获取预览快照失败:', error);
            return [];
        }
    }

    /**
     * 删除预览快照
     */
    deleteSnapshot(snapshotId) {
        const snapshots = this.getSnapshots();
        const filtered = snapshots.filter(s => s.id !== snapshotId);
        localStorage.setItem('previewSnapshots', JSON.stringify(filtered));
        console.log('预览快照已删除:', snapshotId);
    }

    /**
     * 加载预览快照
     */
    loadSnapshot(snapshotId) {
        const snapshots = this.getSnapshots();
        const snapshot = snapshots.find(s => s.id === snapshotId);
        
        if (snapshot) {
            return this.openPreview(snapshot.config);
        } else {
            throw new Error('未找到指定的预览快照');
        }
    }

    /**
     * 检查预览窗口状态
     */
    isPreviewOpen() {
        return this.previewWindow && !this.previewWindow.closed;
    }

    /**
     * 获取预览窗口引用
     */
    getPreviewWindow() {
        return this.previewWindow;
    }

    /**
     * 设置游戏URL
     */
    setGameUrl(url) {
        this.gameUrl = url;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 创建错误提示
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    /**
     * 导出预览配置
     */
    exportPreviewConfig(config) {
        const exportData = {
            type: 'preview-config',
            timestamp: new Date().toISOString(),
            config: config
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `preview-config-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 导入预览配置
     */
    async importPreviewConfig(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.type === 'preview-config' && data.config) {
                return this.openPreview(data.config);
            } else {
                throw new Error('无效的预览配置文件格式');
            }
        } catch (error) {
            console.error('导入预览配置失败:', error);
            this.showError('导入预览配置失败: ' + error.message);
            return false;
        }
    }

    /**
     * 获取预览统计信息
     */
    getPreviewStats() {
        return {
            isOpen: this.isPreviewOpen(),
            gameUrl: this.gameUrl,
            snapshotCount: this.getSnapshots().length,
            lastPreviewTime: this.lastPreviewTime || null
        };
    }

    /**
     * 设置预览选项
     */
    setPreviewOptions(options) {
        this.previewOptions = {
            ...this.previewOptions,
            ...options
        };
    }

    /**
     * 获取预览选项
     */
    getPreviewOptions() {
        return this.previewOptions || {
            autoRefresh: false,
            showDebugInfo: false,
            enableHotReload: false
        };
    }
}