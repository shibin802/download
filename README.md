# 批量URL转PDF工具

一个功能强大的网页应用，支持批量将URL转换为PDF文件，特别优化了微信公众号文章的转换效果。

## 功能特点

- ✅ 批量URL转PDF：支持一次性输入多个URL进行批量转换
- ✅ 智能文件命名：自动使用网页标题命名，重复文件名自动添加数字后缀
- ✅ 公众号支持：特别优化微信公众号文章的PDF生成效果
- ✅ ZIP打包下载：将所有PDF文件打包成ZIP压缩包下载
- ✅ 邮件发送：支持将ZIP压缩包直接发送到指定邮箱
- ✅ 实时进度：显示转换进度和每个URL的处理状态
- ✅ 美观界面：现代化的渐变色UI设计

## 技术栈

### 前端
- HTML5 + CSS3
- JavaScript (ES6+)
- JSZip (ZIP文件生成)

### 后端
- Node.js
- Express (Web框架)
- Puppeteer (无头浏览器，PDF生成)
- Nodemailer (邮件发送)

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置邮件服务（可选）

如果需要使用邮件发送功能，请编辑 `server.js` 文件中的邮件配置：

```javascript
const EMAIL_CONFIG = {
    service: 'gmail', // 邮件服务提供商
    auth: {
        user: 'your-email@gmail.com', // 你的邮箱
        pass: 'your-app-password' // 应用专用密码
    }
};
```

#### Gmail配置说明：
1. 登录Gmail账户
2. 进入"管理您的Google账户" > "安全性"
3. 启用"两步验证"
4. 生成"应用专用密码"
5. 将生成的密码填入配置中

#### 其他邮箱服务：
- QQ邮箱：service: 'QQ'
- 163邮箱：service: '163'
- Outlook：service: 'Outlook365'

### 3. 启动服务器

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

### 4. 访问应用

在浏览器中打开：`http://localhost:3000`

## 使用方法

### 基本使用

1. **输入URL**：在文本框中输入要转换的URL，每行一个
   ```
   https://example.com/article1
   https://mp.weixin.qq.com/s/xxxxx
   https://example.com/article2
   ```

2. **生成PDF**：点击"生成PDF"按钮，等待转换完成

3. **下载ZIP**：转换完成后，点击"下载ZIP"按钮下载所有PDF文件

### 邮件发送

1. 在"接收邮箱"输入框中输入邮箱地址
2. 生成PDF后，点击"发送邮件"按钮
3. 系统会将ZIP压缩包发送到指定邮箱

## 支持的URL类型

- ✅ 普通网页
- ✅ 微信公众号文章 (mp.weixin.qq.com)
- ✅ 博客文章
- ✅ 新闻网站
- ✅ 技术文档

## 文件命名规则

- 使用网页标题作为文件名
- 自动清理非法字符（`< > : " / \ | ? *`）
- 文件名长度限制为100字符
- 重复文件名自动添加数字后缀（例如：`文章_1.pdf`, `文章_2.pdf`）

## 注意事项

1. **网络要求**：需要稳定的网络连接访问目标URL
2. **超时设置**：每个URL的处理超时时间为60秒
3. **内存占用**：批量处理大量URL时可能占用较多内存
4. **公众号限制**：某些公众号文章可能有访问限制
5. **邮件大小**：邮件附件大小受邮箱服务商限制（通常25MB）

## 故障排除

### Puppeteer安装失败

如果Puppeteer安装失败，可以尝试：

```bash
# 设置淘宝镜像
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer
```

或使用环境变量：

```bash
# Windows
set PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors
npm install puppeteer

# Linux/Mac
PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors npm install puppeteer
```

### 公众号文章无法访问

某些公众号文章可能需要登录或有其他限制，建议：
- 在浏览器中先确认URL可以正常访问
- 尝试使用文章的原始链接

### 邮件发送失败

检查以下几点：
- 邮箱配置是否正确
- 是否启用了应用专用密码
- 网络是否允许SMTP连接
- 附件大小是否超过限制

## 项目结构

```
.
├── index.html          # 前端页面
├── app.js             # 前端JavaScript逻辑
├── server.js          # 后端服务器
├── package.json       # 项目配置
└── README.md          # 说明文档
```

## 开发计划

- [ ] 支持自定义PDF页面大小
- [ ] 支持PDF水印
- [ ] 支持批量导入URL文件
- [ ] 支持更多邮件服务商
- [ ] 添加用户认证
- [ ] 支持云存储集成

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请提交Issue。
