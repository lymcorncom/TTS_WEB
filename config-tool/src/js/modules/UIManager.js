/**
 * UIManager.js
 * UI管理器 - 负责界面交互和组件管理
 */

export class UIManager {
    constructor() {
        this.modals = new Map();
        this.forms = new Map();
        this.currentModal = null;
    }

    /**
     * 初始化UI管理器
     */
    init() {
        console.log('初始化UI管理器...');
        this.initializeComponents();
        this.bindGlobalEvents();
    }

    /**
     * 初始化组件
     */
    initializeComponents() {
        // 初始化表单验证
        this.initFormValidation();
        
        // 初始化拖拽排序
        this.initDragAndDrop();
        
        // 初始化工具提示
        this.initTooltips();
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 表单自动保存
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.handleFormInput(e);
            }
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    /**
     * 创建模态框
     */
    createModal(id, options = {}) {
        const modal = {
            id,
            title: options.title || '标题',
            content: options.content || '',
            size: options.size || 'medium', // small, medium, large
            closable: options.closable !== false,
            onConfirm: options.onConfirm,
            onCancel: options.onCancel,
            confirmText: options.confirmText || '确认',
            cancelText: options.cancelText || '取消'
        };

        this.modals.set(id, modal);
        return modal;
    }

    /**
     * 显示模态框
     */
    showModal(id, data = {}) {
        const modal = this.modals.get(id);
        if (!modal) {
            console.error('模态框不存在:', id);
            return;
        }

        const modalElement = document.getElementById('modal');
        const titleElement = document.getElementById('modal-title');
        const bodyElement = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        // 设置内容
        titleElement.textContent = modal.title;
        bodyElement.innerHTML = typeof modal.content === 'function' 
            ? modal.content(data) 
            : modal.content;

        // 设置按钮文本
        confirmBtn.textContent = modal.confirmText;
        cancelBtn.textContent = modal.cancelText;

        // 绑定事件
        confirmBtn.onclick = () => {
            if (modal.onConfirm) {
                const result = modal.onConfirm(data);
                if (result !== false) {
                    this.hideModal();
                }
            } else {
                this.hideModal();
            }
        };

        cancelBtn.onclick = () => {
            if (modal.onCancel) {
                modal.onCancel(data);
            }
            this.hideModal();
        };

        // 显示模态框
        modalElement.classList.add('show');
        this.currentModal = id;

        // 聚焦到第一个输入框
        setTimeout(() => {
            const firstInput = bodyElement.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    /**
     * 隐藏模态框
     */
    hideModal() {
        const modalElement = document.getElementById('modal');
        modalElement.classList.remove('show');
        this.currentModal = null;
    }

    /**
     * 创建表单
     */
    createForm(id, fields, options = {}) {
        const form = {
            id,
            fields,
            validation: options.validation || {},
            onSubmit: options.onSubmit,
            onChange: options.onChange,
            autoSave: options.autoSave || false
        };

        this.forms.set(id, form);
        return this.renderForm(form);
    }

    /**
     * 渲染表单
     */
    renderForm(form) {
        const formElement = document.createElement('form');
        formElement.id = form.id;
        formElement.className = 'config-form';

        form.fields.forEach(field => {
            const fieldElement = this.createFormField(field);
            formElement.appendChild(fieldElement);
        });

        // 绑定表单事件
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.onSubmit) {
                const data = this.getFormData(form.id);
                form.onSubmit(data);
            }
        });

        formElement.addEventListener('change', (e) => {
            if (form.onChange) {
                const data = this.getFormData(form.id);
                form.onChange(data, e.target);
            }
        });

        return formElement;
    }

    /**
     * 创建表单字段
     */
    createFormField(field) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-field';

        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', field.name);
        fieldDiv.appendChild(label);

        let input;
        switch (field.type) {
            case 'text':
            case 'number':
            case 'email':
            case 'url':
                input = document.createElement('input');
                input.type = field.type;
                break;
            case 'textarea':
                input = document.createElement('textarea');
                if (field.rows) input.rows = field.rows;
                break;
            case 'select':
                input = document.createElement('select');
                if (field.options) {
                    field.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        input.appendChild(optionElement);
                    });
                }
                break;
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                break;
            case 'file':
                input = document.createElement('input');
                input.type = 'file';
                if (field.accept) input.accept = field.accept;
                break;
            default:
                input = document.createElement('input');
                input.type = 'text';
        }

        input.name = field.name;
        input.id = field.name;
        
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        if (field.value !== undefined) {
            if (field.type === 'checkbox') {
                input.checked = field.value;
            } else {
                input.value = field.value;
            }
        }

        fieldDiv.appendChild(input);

        // 添加帮助文本
        if (field.help) {
            const helpText = document.createElement('small');
            helpText.className = 'form-help';
            helpText.textContent = field.help;
            fieldDiv.appendChild(helpText);
        }

        return fieldDiv;
    }

    /**
     * 获取表单数据
     */
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    data[key] = input.checked;
                } else if (input.type === 'number') {
                    data[key] = parseFloat(value) || 0;
                } else {
                    data[key] = value;
                }
            }
        }

        return data;
    }

    /**
     * 设置表单数据
     */
    setFormData(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value;
                }
            }
        });
    }

    /**
     * 创建数据表格
     */
    createTable(container, data, columns, options = {}) {
        const table = document.createElement('table');
        table.className = 'data-table';

        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            if (column.sortable) {
                th.classList.add('sortable');
                th.addEventListener('click', () => {
                    this.sortTable(table, column.key);
                });
            }
            headerRow.appendChild(th);
        });

        if (options.actions) {
            const actionTh = document.createElement('th');
            actionTh.textContent = '操作';
            headerRow.appendChild(actionTh);
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 创建表体
        const tbody = document.createElement('tbody');
        this.renderTableRows(tbody, data, columns, options);
        table.appendChild(tbody);

        // 清空容器并添加表格
        container.innerHTML = '';
        container.appendChild(table);

        return table;
    }

    /**
     * 渲染表格行
     */
    renderTableRows(tbody, data, columns, options) {
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = this.getNestedValue(item, column.key);
                
                if (column.render) {
                    td.innerHTML = column.render(value, item, index);
                } else {
                    td.textContent = value;
                }
                
                row.appendChild(td);
            });

            // 添加操作列
            if (options.actions) {
                const actionTd = document.createElement('td');
                actionTd.className = 'actions';
                
                options.actions.forEach(action => {
                    const button = document.createElement('button');
                    button.className = `btn btn-small ${action.class || 'btn-secondary'}`;
                    button.textContent = action.label;
                    button.addEventListener('click', () => {
                        action.handler(item, index);
                    });
                    actionTd.appendChild(button);
                });
                
                row.appendChild(actionTd);
            }

            tbody.appendChild(row);
        });
    }

    /**
     * 获取嵌套对象的值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : '';
        }, obj);
    }

    /**
     * 表格排序
     */
    sortTable(table, key) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const isAscending = !table.dataset.sortAsc || table.dataset.sortAsc === 'false';
        
        rows.sort((a, b) => {
            const aValue = a.cells[0].textContent.trim();
            const bValue = b.cells[0].textContent.trim();
            
            if (isAscending) {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });

        // 重新排列行
        rows.forEach(row => tbody.appendChild(row));
        
        // 更新排序状态
        table.dataset.sortAsc = isAscending.toString();
    }

    /**
     * 创建标签编辑器
     */
    createTagEditor(container, tags = [], options = {}) {
        const editor = document.createElement('div');
        editor.className = 'tag-editor';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = options.placeholder || '输入标签后按回车添加';
        input.className = 'tag-input';

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';

        // 渲染现有标签
        this.renderTags(tagsContainer, tags, options);

        // 绑定输入事件
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                e.preventDefault();
                const newTag = input.value.trim();
                if (!tags.includes(newTag)) {
                    tags.push(newTag);
                    this.renderTags(tagsContainer, tags, options);
                    if (options.onChange) {
                        options.onChange(tags);
                    }
                }
                input.value = '';
            }
        });

        editor.appendChild(input);
        editor.appendChild(tagsContainer);

        container.innerHTML = '';
        container.appendChild(editor);

        return { tags, update: () => this.renderTags(tagsContainer, tags, options) };
    }

    /**
     * 渲染标签
     */
    renderTags(container, tags, options) {
        container.innerHTML = '';
        
        tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'trait-tag';
            tagElement.innerHTML = `
                ${tag}
                <button type="button" class="trait-remove" data-index="${index}">×</button>
            `;
            
            // 绑定删除事件
            const removeBtn = tagElement.querySelector('.trait-remove');
            removeBtn.addEventListener('click', () => {
                tags.splice(index, 1);
                this.renderTags(container, tags, options);
                if (options.onChange) {
                    options.onChange(tags);
                }
            });
            
            container.appendChild(tagElement);
        });
    }

    /**
     * 显示加载状态
     */
    showLoading(element, text = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading"></div>
                <span>${text}</span>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(loading);
    }

    /**
     * 隐藏加载状态
     */
    hideLoading(element) {
        const loading = element.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 显示确认对话框
     */
    showConfirm(message, onConfirm, onCancel) {
        this.showModal('confirm', {
            title: '确认操作',
            content: `<p>${message}</p>`,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                return true;
            },
            onCancel: onCancel
        });
    }

    /**
     * 初始化表单验证
     */
    initFormValidation() {
        // 实时验证
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.validateField(e.target);
            }
        }, true);
    }

    /**
     * 验证字段
     */
    validateField(field) {
        const errors = [];
        
        // 必填验证
        if (field.required && !field.value.trim()) {
            errors.push('此字段为必填项');
        }
        
        // 类型验证
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                errors.push('请输入有效的邮箱地址');
            }
        }
        
        if (field.type === 'url' && field.value) {
            try {
                new URL(field.value);
            } catch {
                errors.push('请输入有效的URL地址');
            }
        }
        
        // 显示错误信息
        this.showFieldErrors(field, errors);
        
        return errors.length === 0;
    }

    /**
     * 显示字段错误
     */
    showFieldErrors(field, errors) {
        // 移除现有错误信息
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // 更新字段样式
        field.classList.toggle('error', errors.length > 0);
        
        // 显示新错误信息
        if (errors.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errors[0];
            field.parentNode.appendChild(errorDiv);
        }
    }

    /**
     * 初始化拖拽排序
     */
    initDragAndDrop() {
        // 为可排序列表添加拖拽功能
        document.addEventListener('dragstart', (e) => {
            if (e.target.matches('.sortable-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.matches('.sortable-item')) {
                e.target.classList.remove('dragging');
            }
        });
    }

    /**
     * 初始化工具提示
     */
    initTooltips() {
        // 为带有 data-tooltip 属性的元素添加工具提示
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.tooltip) {
                this.hideTooltip();
            }
        });
    }

    /**
     * 显示工具提示
     */
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
        
        setTimeout(() => tooltip.classList.add('show'), 10);
    }

    /**
     * 隐藏工具提示
     */
    hideTooltip() {
        const tooltip = document.querySelector('.tooltip-popup');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * 处理表单输入
     */
    handleFormInput(e) {
        // 自动保存逻辑
        if (e.target.dataset.autoSave) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(() => {
                this.autoSaveForm(e.target.form);
            }, 1000);
        }
        
        // 触发配置变化事件
        const event = new CustomEvent('config-changed', {
            detail: { field: e.target.name, value: e.target.value }
        });
        document.dispatchEvent(event);
    }

    /**
     * 自动保存表单
     */
    autoSaveForm(form) {
        if (!form) return;
        
        const formData = this.getFormData(form.id);
        console.log('自动保存表单数据:', formData);
        
        // 这里可以调用保存API
    }

    /**
     * 处理键盘导航
     */
    handleKeyboardNavigation(e) {
        // Tab键导航增强
        if (e.key === 'Tab') {
            // 可以添加自定义的Tab导航逻辑
        }
        
        // Escape键关闭模态框
        if (e.key === 'Escape' && this.currentModal) {
            this.hideModal();
        }
    }
}