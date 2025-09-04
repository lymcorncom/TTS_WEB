# Netlify 部署指南

## 自动部署（推荐）

### 1. GitHub 连接部署
1. 将代码推送到 GitHub 仓库
2. 登录 [Netlify](https://netlify.com)
3. 点击 "New site from Git"
4. 选择 GitHub 并授权
5. 选择您的仓库
6. 部署设置：
   - **Build command**: `echo 'Static site - no build required'`
   - **Publish directory**: `.` (根目录)
7. 点击 "Deploy site"

### 2. 拖拽部署
1. 将所有文件打包成 ZIP
2. 登录 [Netlify](https://netlify.com)
3. 直接拖拽 ZIP 文件到部署区域

## 手动部署

### 使用 Netlify CLI
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 初始化站点
netlify init

# 部署
netlify deploy

# 生产部署
netlify deploy --prod
```

## 环境变量设置（可选）

如果需要在 Netlify 中设置环境变量：

1. 进入站点设置
2. 选择 "Environment variables"
3. 添加变量（本应用不需要服务器端环境变量）

## 自定义域名

1. 在 Netlify 站点设置中选择 "Domain management"
2. 添加自定义域名
3. 配置 DNS 记录指向 Netlify

## 配置文件说明

- `netlify.toml`: 主要配置文件，包含构建设置、头部信息、重定向规则
- `_headers`: HTTP 头部配置，用于安全性和缓存
- `_redirects`: 重定向规则配置

## 部署后测试

部署完成后，请测试以下功能：
- [ ] 页面正常加载
- [ ] API Key 保存功能
- [ ] 文本转语音功能
- [ ] 音频播放功能
- [ ] 音频下载功能
- [ ] 响应式设计

## 故障排除

### 常见问题

1. **CORS 错误**
   - 检查 `netlify.toml` 中的 CSP 设置
   - 确认 API 请求 URL 正确

2. **静态文件缓存问题**
   - 清除浏览器缓存
   - 检查 `_headers` 文件中的缓存设置

3. **API 调用失败**
   - 确认 Google Gemini API Key 有效
   - 检查网络连接和 API 配额

## 性能优化

- 启用了静态资源缓存
- 配置了安全头部
- 使用了内容安全策略 (CSP)

## 安全设置

应用已配置以下安全措施：
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content Security Policy
- Referrer Policy