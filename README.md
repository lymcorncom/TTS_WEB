# TTS 语音合成应用

基于 Google Gemini API 的文本转语音 Web 应用，支持多种语音选项和语速调节。

## 功能特性

- 🎤 **文本转语音**: 使用 Google Gemini API 将文本转换为高质量语音
- 🔊 **多种语音**: 支持多种英语语音选项
- ⚡ **语速调节**: 可调节语音播放速度 (0.25x - 4.0x)
- 💾 **音频下载**: 支持下载生成的 MP3 音频文件
- 🎵 **在线播放**: 内置音频播放器，支持播放/暂停控制
- 💡 **本地存储**: API Key 安全存储在本地浏览器
- 📱 **响应式设计**: 支持桌面和移动设备

## 快速开始

### 1. 获取 API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 复制 API Key 备用

### 2. 部署应用

#### 方法一：直接使用
1. 下载所有文件到本地目录
2. 用浏览器打开 `index.html`
3. 输入 API Key 并保存
4. 开始使用

#### 方法二：Netlify 部署（推荐）
1. 将代码推送到 GitHub 仓库
2. 登录 [Netlify](https://netlify.com)
3. 点击 "New site from Git" 连接 GitHub 仓库
4. 部署设置保持默认即可
5. 访问生成的 Netlify 网址

详细部署说明请查看 [deploy.md](deploy.md)

#### 方法三：GitHub Pages 部署
1. Fork 此仓库
2. 在仓库设置中启用 GitHub Pages
3. 访问生成的网址

#### 方法三：本地服务器
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

## 使用说明

1. **设置 API Key**: 在页面顶部输入您的 Gemini API Key 并点击保存
2. **输入文本**: 在文本框中输入要转换的文本（最多 5000 字符）
3. **选择语音**: 从下拉菜单中选择喜欢的语音类型
4. **调节语速**: 使用滑块调节语音播放速度
5. **生成语音**: 点击"生成语音"按钮或使用快捷键 `Ctrl+Enter`
6. **播放/下载**: 生成完成后可以在线播放或下载音频文件

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Google Gemini Text-to-Speech API
- **音频格式**: MP3
- **存储**: LocalStorage (API Key)

## 文件结构

```
tts-app/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # 主要逻辑
└── README.md           # 说明文档
```

## API 限制

- 单次请求文本长度：最多 5000 字符
- 支持的语音：主要为英语语音
- 输出格式：MP3 音频文件
- 语速范围：0.25x - 4.0x

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 隐私说明

- API Key 仅存储在您的本地浏览器中
- 文本内容通过 HTTPS 安全传输到 Google API
- 不会在服务器端存储任何用户数据

## 故障排除

### 常见问题

1. **API Key 无效**
   - 确认 API Key 正确复制
   - 检查 API Key 是否已启用 Text-to-Speech 权限

2. **生成失败**
   - 检查网络连接
   - 确认文本长度不超过限制
   - 查看浏览器控制台错误信息

3. **音频无法播放**
   - 确认浏览器支持 MP3 格式
   - 检查浏览器音频权限设置

## 开发

### 本地开发
```bash
# 克隆仓库
git clone <repository-url>
cd tts-app

# 启动本地服务器
python -m http.server 8000
```

### 自定义修改
- 修改 `styles.css` 调整界面样式
- 编辑 `script.js` 添加新功能
- 更新 `index.html` 修改页面结构

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 基础 TTS 功能
- 多语音支持
- 语速调节
- 音频下载功能