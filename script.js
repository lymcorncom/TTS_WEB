class TTSApp {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyBGAP9ZFdEu8ZQwQtP0zhzex0cdT8ntlmQ';
        this.initializeElements();
        this.bindEvents();
        this.loadSavedApiKey();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveKeyBtn = document.getElementById('saveKey');
        this.textInput = document.getElementById('textInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.speedValue = document.getElementById('speedValue');
        this.generateBtn = document.getElementById('generateBtn');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.audioElement = document.getElementById('audioElement');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.btnText = document.querySelector('.btn-text');
        this.loading = document.querySelector('.loading');
    }

    bindEvents() {
        this.saveKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.speedRange.addEventListener('input', () => this.updateSpeedValue());
        this.generateBtn.addEventListener('click', () => this.generateSpeech());
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());
        this.playBtn.addEventListener('click', () => this.playAudio());
        this.pauseBtn.addEventListener('click', () => this.pauseAudio());
        
        // 回车键快捷生成
        this.textInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.generateSpeech();
            }
        });
    }

    loadSavedApiKey() {
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
            // 如果有默认API key，自动保存到localStorage
            if (this.apiKey === 'AIzaSyBGAP9ZFdEu8ZQwQtP0zhzex0cdT8ntlmQ') {
                localStorage.setItem('gemini_api_key', this.apiKey);
            }
        }
    }

    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            this.apiKey = key;
            localStorage.setItem('gemini_api_key', key);
            this.showMessage('API Key 已保存', 'success');
        } else {
            this.showError('请输入有效的 API Key');
        }
    }

    updateSpeedValue() {
        this.speedValue.textContent = this.speedRange.value;
    }

    async generateSpeech() {
        const text = this.textInput.value.trim();
        
        if (!this.apiKey) {
            this.showError('请先输入并保存 API Key');
            return;
        }

        if (!text) {
            this.showError('请输入要转换的文本');
            return;
        }

        if (text.length > 5000) {
            this.showError('文本长度不能超过 5000 字符');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            const audioData = await this.callGeminiTTS(text);
            this.displayAudio(audioData);
        } catch (error) {
            console.error('TTS 生成失败:', error);
            this.showError(`生成失败: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async callGeminiTTS(text) {
        const voice = this.voiceSelect.value;
        const speed = parseFloat(this.speedRange.value);

        // 判断是否为中文语音
        const isChinese = voice.startsWith('cmn-CN');
        
        const requestBody = {
            input: {
                text: text
            },
            voice: {
                languageCode: isChinese ? 'cmn-CN' : 'en-US',
                name: voice
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speed
            }
        };

        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
            throw new Error('API 响应格式不正确');
        }

        return data.audioContent;
    }

    displayAudio(base64AudioData) {
        try {
            // 创建音频 blob
            const audioBlob = this.base64ToBlob(base64AudioData, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 设置音频元素
            this.audioElement.src = audioUrl;
            this.audioElement.load();
            
            // 存储用于下载
            this.currentAudioBlob = audioBlob;
            this.currentAudioUrl = audioUrl;
            
            // 显示播放器
            this.audioPlayer.style.display = 'block';
            
            this.showMessage('语音生成成功！', 'success');
        } catch (error) {
            console.error('音频处理失败:', error);
            this.showError('音频处理失败，请重试');
        }
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    downloadAudio() {
        if (!this.currentAudioBlob) {
            this.showError('没有可下载的音频');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tts-audio-${timestamp}.mp3`;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = this.currentAudioUrl;
        downloadLink.download = filename;
        downloadLink.click();
    }

    playAudio() {
        if (this.audioElement.src) {
            this.audioElement.play().catch(error => {
                console.error('播放失败:', error);
                this.showError('播放失败，请检查音频文件');
            });
        }
    }

    pauseAudio() {
        if (this.audioElement.src) {
            this.audioElement.pause();
        }
    }

    setLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        if (isLoading) {
            this.btnText.style.display = 'none';
            this.loading.style.display = 'inline-block';
        } else {
            this.btnText.style.display = 'inline-block';
            this.loading.style.display = 'none';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // 创建临时消息元素
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#007bff'};
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TTSApp();
});