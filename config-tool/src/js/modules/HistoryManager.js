/**
 * HistoryManager.js
 * 历史记录管理器
 */

export class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.isRecording = true;
    }

    /**
     * 初始化历史管理器
     */
    init() {
        console.log('初始化历史管理器...');
        this.loadHistory();
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.redo();
                        } else {
                            e.preventDefault();
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            }
        });

        // 监听配置变化
        document.addEventListener('config-changed', (e) => {
            if (this.isRecording) {
                this.recordChange(e.detail);
            }
        });
    }

    /**
     * 记录变化
     */
    recordChange(change) {
        const historyItem = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: change.type || 'modify',
            target: change.target || 'unknown',
            oldValue: change.oldValue,
            newValue: change.newValue,
            description: change.description || this.generateDescription(change)
        };

        // 如果当前不在历史记录的末尾，删除后面的记录
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // 添加新记录
        this.history.push(historyItem);
        this.currentIndex = this.history.length - 1;

        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        // 保存到本地存储
        this.saveHistory();

        // 触发历史变化事件
        this.dispatchHistoryEvent('history-changed', historyItem);

        console.log('记录历史变化:', historyItem.description);
    }

    /**
     * 撤销操作
     */
    undo() {
        if (!this.canUndo()) {
            console.log('无法撤销');
            return false;
        }

        const currentItem = this.history[this.currentIndex];
        this.currentIndex--;

        // 执行撤销操作
        this.applyChange(currentItem, true);

        // 触发撤销事件
        this.dispatchHistoryEvent('history-undo', currentItem);

        console.log('撤销操作:', currentItem.description);
        return true;
    }

    /**
     * 重做操作
     */
    redo() {
        if (!this.canRedo()) {
            console.log('无法重做');
            return false;
        }

        this.currentIndex++;
        const nextItem = this.history[this.currentIndex];

        // 执行重做操作
        this.applyChange(nextItem, false);

        // 触发重做事件
        this.dispatchHistoryEvent('history-redo', nextItem);

        console.log('重做操作:', nextItem.description);
        return true;
    }

    /**
     * 检查是否可以撤销
     */
    canUndo() {
        return this.currentIndex >= 0;
    }

    /**
     * 检查是否可以重做
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * 应用变化
     */
    applyChange(historyItem, isUndo) {
        // 暂停记录，避免循环
        this.pauseRecording();

        try {
            const targetValue = isUndo ? historyItem.oldValue : historyItem.newValue;
            
            // 根据变化类型执行相应操作
            switch (historyItem.type) {
                case 'modify':
                    this.applyModifyChange(historyItem.target, targetValue);
                    break;
                case 'add':
                    if (isUndo) {
                        this.applyDeleteChange(historyItem.target);
                    } else {
                        this.applyAddChange(historyItem.target, targetValue);
                    }
                    break;
                case 'delete':
                    if (isUndo) {
                        this.applyAddChange(historyItem.target, historyItem.oldValue);
                    } else {
                        this.applyDeleteChange(historyItem.target);
                    }
                    break;
                default:
                    console.warn('未知的变化类型:', historyItem.type);
            }
        } catch (error) {
            console.error('应用历史变化失败:', error);
        } finally {
            // 恢复记录
            this.resumeRecording();
        }
    }

    /**
     * 应用修改变化
     */
    applyModifyChange(target, value) {
        // 触发配置更新事件
        const event = new CustomEvent('history-apply-change', {
            detail: {
                type: 'modify',
                target: target,
                value: value
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 应用添加变化
     */
    applyAddChange(target, value) {
        const event = new CustomEvent('history-apply-change', {
            detail: {
                type: 'add',
                target: target,
                value: value
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 应用删除变化
     */
    applyDeleteChange(target) {
        const event = new CustomEvent('history-apply-change', {
            detail: {
                type: 'delete',
                target: target
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取历史记录
     */
    getHistory() {
        return this.history.slice();
    }

    /**
     * 获取当前历史索引
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveHistory();
        
        this.dispatchHistoryEvent('history-cleared');
        console.log('历史记录已清空');
    }

    /**
     * 创建检查点
     */
    createCheckpoint(description) {
        const checkpoint = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: 'checkpoint',
            description: description || '检查点',
            index: this.currentIndex
        };

        this.recordChange({
            type: 'checkpoint',
            description: checkpoint.description,
            target: 'system',
            newValue: checkpoint
        });

        console.log('创建检查点:', checkpoint.description);
        return checkpoint;
    }

    /**
     * 跳转到检查点
     */
    jumpToCheckpoint(checkpointId) {
        const checkpoint = this.history.find(item => 
            item.type === 'checkpoint' && item.newValue && item.newValue.id === checkpointId
        );

        if (!checkpoint) {
            console.error('未找到检查点:', checkpointId);
            return false;
        }

        const targetIndex = this.history.indexOf(checkpoint);
        
        // 执行多次撤销或重做到达目标位置
        while (this.currentIndex !== targetIndex) {
            if (this.currentIndex > targetIndex) {
                if (!this.undo()) break;
            } else {
                if (!this.redo()) break;
            }
        }

        console.log('跳转到检查点:', checkpoint.description);
        return true;
    }

    /**
     * 获取检查点列表
     */
    getCheckpoints() {
        return this.history
            .filter(item => item.type === 'checkpoint')
            .map(item => ({
                id: item.newValue.id,
                description: item.description,
                timestamp: item.timestamp,
                index: this.history.indexOf(item)
            }));
    }

    /**
     * 暂停记录
     */
    pauseRecording() {
        this.isRecording = false;
    }

    /**
     * 恢复记录
     */
    resumeRecording() {
        this.isRecording = true;
    }

    /**
     * 保存历史记录到本地存储
     */
    saveHistory() {
        try {
            const historyData = {
                history: this.history,
                currentIndex: this.currentIndex,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('configHistory', JSON.stringify(historyData));
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }

    /**
     * 从本地存储加载历史记录
     */
    loadHistory() {
        try {
            const historyData = localStorage.getItem('configHistory');
            if (historyData) {
                const data = JSON.parse(historyData);
                this.history = data.history || [];
                this.currentIndex = data.currentIndex || -1;
                console.log('历史记录已加载');
            }
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.history = [];
            this.currentIndex = -1;
        }
    }

    /**
     * 导出历史记录
     */
    exportHistory() {
        const exportData = {
            type: 'config-history',
            timestamp: new Date().toISOString(),
            history: this.history,
            currentIndex: this.currentIndex
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-history-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('历史记录已导出');
    }

    /**
     * 导入历史记录
     */
    async importHistory(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.type === 'config-history' && data.history) {
                this.history = data.history;
                this.currentIndex = data.currentIndex || -1;
                this.saveHistory();
                
                this.dispatchHistoryEvent('history-imported');
                console.log('历史记录已导入');
                return true;
            } else {
                throw new Error('无效的历史记录文件格式');
            }
        } catch (error) {
            console.error('导入历史记录失败:', error);
            return false;
        }
    }

    /**
     * 获取历史统计信息
     */
    getHistoryStats() {
        const checkpoints = this.getCheckpoints();
        const types = {};
        
        this.history.forEach(item => {
            types[item.type] = (types[item.type] || 0) + 1;
        });

        return {
            totalItems: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            checkpointCount: checkpoints.length,
            typeBreakdown: types,
            oldestItem: this.history[0]?.timestamp,
            newestItem: this.history[this.history.length - 1]?.timestamp
        };
    }

    /**
     * 生成变化描述
     */
    generateDescription(change) {
        switch (change.type) {
            case 'modify':
                return `修改 ${change.target}`;
            case 'add':
                return `添加 ${change.target}`;
            case 'delete':
                return `删除 ${change.target}`;
            case 'checkpoint':
                return change.description || '创建检查点';
            default:
                return `${change.type} ${change.target}`;
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 触发历史事件
     */
    dispatchHistoryEvent(type, data = null) {
        const event = new CustomEvent(type, {
            detail: {
                historyManager: this,
                data: data,
                stats: this.getHistoryStats()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 设置最大历史记录大小
     */
    setMaxHistorySize(size) {
        this.maxHistorySize = Math.max(1, size);
        
        // 如果当前历史记录超过新的限制，删除最旧的记录
        while (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
        
        this.saveHistory();
    }

    /**
     * 获取最大历史记录大小
     */
    getMaxHistorySize() {
        return this.maxHistorySize;
    }

    /**
     * 批量操作开始
     */
    beginBatch(description = '批量操作') {
        this.batchOperation = {
            description,
            startIndex: this.currentIndex,
            changes: []
        };
        this.pauseRecording();
    }

    /**
     * 批量操作结束
     */
    endBatch() {
        if (!this.batchOperation) {
            console.warn('没有进行中的批量操作');
            return;
        }

        this.resumeRecording();
        
        // 如果有变化，记录为单个批量操作
        if (this.batchOperation.changes.length > 0) {
            this.recordChange({
                type: 'batch',
                description: this.batchOperation.description,
                target: 'multiple',
                changes: this.batchOperation.changes
            });
        }

        this.batchOperation = null;
    }

    /**
     * 取消批量操作
     */
    cancelBatch() {
        if (!this.batchOperation) {
            console.warn('没有进行中的批量操作');
            return;
        }

        // 撤销批量操作期间的所有变化
        while (this.currentIndex > this.batchOperation.startIndex) {
            this.undo();
        }

        this.resumeRecording();
        this.batchOperation = null;
        console.log('批量操作已取消');
    }

    /**
     * 搜索历史记录
     */
    searchHistory(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        this.history.forEach((item, index) => {
            if (item.description.toLowerCase().includes(lowerQuery) ||
                item.target.toLowerCase().includes(lowerQuery) ||
                item.type.toLowerCase().includes(lowerQuery)) {
                results.push({
                    ...item,
                    index,
                    isCurrent: index === this.currentIndex
                });
            }
        });

        return results;
    }

    /**
     * 获取指定时间范围的历史记录
     */
    getHistoryByTimeRange(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);

        return this.history.filter(item => {
            const itemTime = new Date(item.timestamp);
            return itemTime >= start && itemTime <= end;
        });
    }

    /**
     * 获取指定类型的历史记录
     */
    getHistoryByType(type) {
        return this.history.filter(item => item.type === type);
    }

    /**
     * 压缩历史记录
     */
    compressHistory() {
        // 合并连续的相同类型操作
        const compressed = [];
        let currentGroup = null;

        this.history.forEach(item => {
            if (currentGroup && 
                currentGroup.type === item.type && 
                currentGroup.target === item.target &&
                this.canMergeItems(currentGroup, item)) {
                
                // 合并到当前组
                currentGroup.newValue = item.newValue;
                currentGroup.timestamp = item.timestamp;
                currentGroup.description = `${currentGroup.description} (合并)`;
            } else {
                // 开始新组
                if (currentGroup) {
                    compressed.push(currentGroup);
                }
                currentGroup = { ...item };
            }
        });

        if (currentGroup) {
            compressed.push(currentGroup);
        }

        // 更新历史记录
        const oldLength = this.history.length;
        this.history = compressed;
        this.currentIndex = Math.min(this.currentIndex, this.history.length - 1);
        
        this.saveHistory();
        console.log(`历史记录已压缩: ${oldLength} -> ${this.history.length}`);
        
        return oldLength - this.history.length;
    }

    /**
     * 保存快照
     */
    saveSnapshot(description = '快照') {
        const snapshot = {
            id: this.generateId(),
            description,
            timestamp: new Date().toISOString(),
            historyIndex: this.currentIndex,
            historyLength: this.history.length
        };

        console.log('保存历史快照:', description);
        return snapshot;
    }

    /**
     * 检查两个历史项是否可以合并
     */
    canMergeItems(item1, item2) {
        // 只合并修改操作，且时间间隔小于5秒
        if (item1.type !== 'modify' || item2.type !== 'modify') {
            return false;
        }

        const time1 = new Date(item1.timestamp);
        const time2 = new Date(item2.timestamp);
        const timeDiff = Math.abs(time2 - time1);

        return timeDiff < 5000; // 5秒内的操作可以合并
    }
}
