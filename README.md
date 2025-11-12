# 批量URL转PDF工具

一个支持批量将网页（包括微信公众号文章）转换为PDF的工具，支持本地运行和部署到Vercel。

## 功能特点

- ✅ 批量URL转PDF转换
- ✅ 支持微信公众号文章（自动处理懒加载图片）
- ✅ ZIP打包下载
- ✅ 邮件发送功能
- ✅ 支持本地开发和Vercel部署
- ✅ 无需本地安装Chrome（Vercel环境）
- ✅ 实时进度显示
- ✅ 智能文件命名

## 技术栈

- **后端**: Node.js + Express
- **PDF生成**: Puppeteer (本地) / Puppeteer-core + @sparticuz/chromium (Vercel)
- **邮件发送**: Nodemailer
- **前端**: 原生HTML/CSS/JavaScript

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/shibin802/download.git
cd download
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
PORT=3000

# 邮件配置（必填，用于邮件发送功能）
EMAIL_SERVICE=smtp.163.com
EMAIL_USER=your-email@163.com
EMAIL_PASSWORD=your-authorization-code

# Chrome路径（本地开发可选，有puppeteer时会自动使用）
# CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

#### 获取163邮箱授权码

1. 登录 [163邮箱](https://mail.163.com)
2. 设置 → POP3/SMTP/IMAP
3. 开启 SMTP 服务
4. 获取授权码（不是登录密码！）

### 4. 本地运行

```bash
npm start
```

访问 http://localhost:3000

## 部署到Vercel

### 方式一：通过Vercel CLI部署（推荐）

1. **安装Vercel CLI**

```bash
npm install -g vercel
```

2. **登录Vercel**

```bash
vercel login
```

3. **部署项目**

```bash
vercel
```

第一次部署时会询问一些配置问题，按提示操作即可。

4. **配置环境变量**

在Vercel Dashboard中设置环境变量：

- `EMAIL_USER`: 你的邮箱地址
- `EMAIL_PASSWORD`: 邮箱授权码
- `EMAIL_SERVICE`: smtp.163.com

或使用CLI设置：

```bash
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
vercel env add EMAIL_SERVICE
```

5. **生产环境部署**

```bash
vercel --prod
```

### 方式二：通过GitHub自动部署

1. **推送代码到GitHub**

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin master
```

2. **在Vercel中导入项目**

- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "Import Project"
- 选择你的GitHub仓库
- 配置环境变量（同上）
- 点击 "Deploy"

3. **自动部署**

之后每次推送到GitHub，Vercel会自动重新部署。

## 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| `PORT` | 服务器端口 | 否 | 3000 |
| `EMAIL_SERVICE` | SMTP服务器 | 是 | smtp.163.com |
| `EMAIL_USER` | 邮箱账号 | 是 | your@163.com |
| `EMAIL_PASSWORD` | 邮箱授权码 | 是 | authorization-code |
| `CHROME_PATH` | Chrome路径（本地） | 否 | C:\Program Files\Google Chrome\Application\chrome.exe |

## 使用说明

1. **输入URL列表**
   - 每行输入一个URL
   - 支持普通网页和微信公众号文章链接

2. **可选：输入接收邮箱**
   - 如果需要邮件发送，填写接收邮箱地址

3. **生成PDF**
   - 点击"生成PDF"按钮
   - 等待处理完成（会显示进度）

4. **下载或发送**
   - 点击"下载ZIP"下载所有PDF
   - 或点击"发送邮件"将ZIP发送到邮箱

## 项目结构

```
.
├── server.js           # 后端服务器（支持本地和Vercel）
├── index.html          # 前端页面
├── app.js             # 前端逻辑
├── package.json       # 依赖配置
├── vercel.json        # Vercel部署配置
├── .env.example       # 环境变量模板
├── .env.local         # 本地环境变量（不提交）
├── .gitignore         # Git忽略配置
└── README.md          # 项目文档
```

## 常见问题

### Q: 本地运行报错 "Cannot find module 'puppeteer'"

A: 运行 `npm install` 安装依赖，或设置 `CHROME_PATH` 环境变量指向Chrome安装路径。

### Q: Vercel部署后PDF生成失败

A: 检查以下几点：
1. 确保使用的是 `puppeteer-core` 而不是 `puppeteer`
2. 确认 `@sparticuz/chromium` 已正确安装
3. 查看Vercel日志排查具体错误

### Q: 邮件发送失败 "Missing credentials"

A:
1. 确认已在Vercel中配置环境变量
2. 确认使用的是邮箱授权码，不是登录密码
3. 确认SMTP服务器地址正确

### Q: 微信公众号文章图片不显示

A:
1. 程序已自动处理懒加载图片
2. 部分图片可能有防盗链，建议在浏览器中先打开文章
3. 可能需要等待更长时间让图片加载完成

### Q: PDF文件太大

A:
1. Vercel有50MB的限制
2. 建议一次处理的URL不要太多（5-10个为宜）
3. 可以多次转换，分批下载

## 技术说明

### 本地环境 vs Vercel环境

- **本地**: 使用 `puppeteer` + 本地Chrome
- **Vercel**: 使用 `puppeteer-core` + `@sparticuz/chromium`（无需本地Chrome）

代码会自动检测 `process.env.VERCEL` 环境变量来选择合适的配置。

### PDF生成流程

1. 使用Puppeteer打开目标URL
2. 等待页面加载完成（networkidle2）
3. 针对微信公众号文章进行特殊处理（懒加载图片）
4. 模拟滚动触发所有懒加载内容
5. 生成PDF并返回base64编码

## 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev  # 使用nodemon自动重启

# 或直接启动
npm start
```

### 调试

在 `server.js` 中已添加详细的console.log输出，可以通过日志追踪PDF生成过程。

## License

MIT

## 作者

shibin802

## 贡献

欢迎提交Issue和Pull Request！
