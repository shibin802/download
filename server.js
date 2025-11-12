// 加载环境变量配置
try {
    require('dotenv').config({ path: '.env.local' });
} catch (e) {
    // 如果dotenv不存在，手动加载.env.local文件
    const fs = require('fs');
    const path = require('path');
    try {
        const envPath = path.join(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    } catch (err) {
        console.warn('无法加载.env.local文件:', err.message);
    }
}

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

// 根据环境选择合适的 puppeteer
let puppeteer;
let chromium;
let usePuppeteerCore = false;

if (process.env.VERCEL) {
    // Vercel 环境使用 puppeteer-core 和 @sparticuz/chromium
    puppeteer = require('puppeteer-core');
    chromium = require('@sparticuz/chromium');
    usePuppeteerCore = true;
} else {
    // 本地环境优先使用常规 puppeteer
    try {
        puppeteer = require('puppeteer');
        console.log('使用 puppeteer (自带 Chrome)');
    } catch (e) {
        // 如果没有 puppeteer，使用 puppeteer-core
        puppeteer = require('puppeteer-core');
        usePuppeteerCore = true;
        console.log('使用 puppeteer-core (需要指定 Chrome 路径)');
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 邮件配置（从环境变量读取）
const EMAIL_CONFIG = {
    host: 'smtp.163.com',
    port: 465,
    secure: true, // 使用 SSL
    auth: {
        user: process.env.EMAIL_USER || 'shibinrun@163.com',
        pass: process.env.EMAIL_PASSWORD
    }
};

// 生成PDF的API
app.post('/generate-pdf', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: '缺少URL参数' });
    }

    let browser;
    try {
        console.log(`开始处理URL: ${url}`);

        // 启动浏览器
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process',
                '--no-zygote'
            ]
        };

        // 根据环境设置 executablePath
        if (process.env.VERCEL) {
            // Vercel 环境使用 chromium
            launchOptions.executablePath = await chromium.executablePath();
            launchOptions.args = chromium.args;
        } else if (usePuppeteerCore) {
            // 本地使用 puppeteer-core 时，必须指定 Chrome 路径
            if (process.env.CHROME_PATH) {
                launchOptions.executablePath = process.env.CHROME_PATH;
            } else {
                // 尝试常见的 Chrome 安装路径
                const possiblePaths = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '/usr/bin/google-chrome',
                    '/usr/bin/chromium-browser'
                ];

                const fs = require('fs');
                for (const chromePath of possiblePaths) {
                    if (fs.existsSync(chromePath)) {
                        launchOptions.executablePath = chromePath;
                        console.log(`找到 Chrome: ${chromePath}`);
                        break;
                    }
                }

                if (!launchOptions.executablePath) {
                    throw new Error('未找到 Chrome 浏览器。请设置 CHROME_PATH 环境变量或安装 puppeteer 包');
                }
            }
        }
        // 本地环境如果安装了 puppeteer，会自动找到 Chrome

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        // 设置用户代理，模拟真实浏览器
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 设置视口
        await page.setViewport({
            width: 1920,
            height: 1080
        });

        // 访问页面，增加超时时间
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // 针对微信公众号的特殊处理：替换懒加载图片
        if (url.includes('mp.weixin.qq.com')) {
            console.log('检测到微信公众号文章，处理懒加载图片...');
            await page.evaluate(() => {
                // 替换微信懒加载图片的 data-src 为 src
                const lazyImages = document.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => {
                    if (img.dataset.src && !img.src.startsWith('http')) {
                        img.src = img.dataset.src;
                    }
                });

                // 处理其他可能的懒加载属性
                const dataSrcImages = document.querySelectorAll('img[data-original], img[data-lazy-src]');
                dataSrcImages.forEach(img => {
                    if (img.dataset.original) {
                        img.src = img.dataset.original;
                    } else if (img.dataset.lazySrc) {
                        img.src = img.dataset.lazySrc;
                    }
                });
            });
        }

        // 模拟用户滚动页面，触发懒加载图片
        console.log('开始模拟滚动页面，触发懒加载图片...');
        await page.evaluate(async () => {
            // 获取页面总高度
            const getScrollHeight = () => document.documentElement.scrollHeight;

            let currentPosition = 0;
            const scrollStep = 300; // 每次滚动300px
            const scrollDelay = 300; // 每次滚动后等待300ms

            while (currentPosition < getScrollHeight()) {
                window.scrollTo(0, currentPosition);
                currentPosition += scrollStep;
                await new Promise(resolve => setTimeout(resolve, scrollDelay));
            }

            // 滚动到底部
            window.scrollTo(0, getScrollHeight());
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 滚动回顶部
            window.scrollTo(0, 0);
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        console.log('页面滚动完成，开始等待图片加载...');

        // 等待所有图片加载完成
        const imageStats = await page.evaluate(async () => {
            const images = Array.from(document.images);
            const totalImages = images.length;

            const results = await Promise.all(
                images.map(img => {
                    if (img.complete && img.naturalHeight !== 0) {
                        return Promise.resolve({ loaded: true, src: img.src });
                    }
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({ loaded: false, src: img.src, reason: 'timeout' });
                        }, 5000); // 单张图片最多等待15秒

                        img.addEventListener('load', () => {
                            clearTimeout(timeout);
                            resolve({ loaded: true, src: img.src });
                        });

                        img.addEventListener('error', () => {
                            clearTimeout(timeout);
                            resolve({ loaded: false, src: img.src, reason: 'error' });
                        });
                    });
                })
            );

            const loadedCount = results.filter(r => r.loaded).length;
            return { total: totalImages, loaded: loadedCount, results };
        });

        console.log(`图片加载统计: ${imageStats.loaded}/${imageStats.total} 张图片加载成功`);
        if (imageStats.loaded < imageStats.total) {
            const failed = imageStats.results.filter(r => !r.loaded);
            console.log(`未加载的图片: ${failed.length} 张`);
            failed.slice(0, 3).forEach(f => {
                console.log(`  - ${f.src.substring(0, 100)}... (${f.reason})`);
            });
        }

        // 额外等待确保渲染完成
        await page.waitForTimeout(2000);

        // 获取页面标题
        let title = await page.title();
        if (!title || title.trim() === '') {
            title = 'untitled';
        }

        console.log(`页面标题: ${title}`);

        // 针对微信公众号文章的特殊处理
        if (url.includes('mp.weixin.qq.com')) {
            try {
                // 等待文章内容加载
                await page.waitForSelector('#js_content', { timeout: 10000 });

                // 隐藏不必要的元素
                await page.evaluate(() => {
                    // 隐藏顶部导航
                    const topBar = document.querySelector('#js_top_ad_area');
                    if (topBar) topBar.style.display = 'none';

                    // 隐藏底部推荐
                    const bottomAd = document.querySelector('#js_bottom_ad_area');
                    if (bottomAd) bottomAd.style.display = 'none';

                    // 隐藏相关文章推荐
                    const relatedArticles = document.querySelector('.related_area');
                    if (relatedArticles) relatedArticles.style.display = 'none';

                    // 隐藏评论区
                    const comments = document.querySelector('#js_cmt_area');
                    if (comments) comments.style.display = 'none';
                });

                console.log('已应用微信公众号文章优化');
            } catch (e) {
                console.log('微信公众号特殊处理失败，继续常规处理');
            }
        }

        // 生成PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        // 转换为base64
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log(`PDF生成成功: ${title}`);

        res.json({
            success: true,
            title: title,
            pdf: pdfBase64
        });

    } catch (error) {
        console.error('生成PDF失败:', error);
        res.json({
            success: false,
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// 发送邮件的API
app.post('/send-email', async (req, res) => {
    const { email, zipData, fileCount } = req.body;

    if (!email || !zipData) {
        return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    try {
        // 检查邮件配置
        if (EMAIL_CONFIG.auth.user === 'your-email@gmail.com') {
            return res.json({
                success: false,
                error: '请先在server.js中配置邮件服务器信息'
            });
        }

        // 创建邮件传输器
        const transporter = nodemailer.createTransport(EMAIL_CONFIG);

        // 将base64转换为Buffer
        const zipBuffer = Buffer.from(zipData, 'base64');

        // 发送邮件
        const info = await transporter.sendMail({
            from: EMAIL_CONFIG.auth.user,
            to: email,
            subject: `批量PDF文件 - ${fileCount}个文件`,
            text: `您好，\n\n附件中包含了 ${fileCount} 个PDF文件的压缩包。\n\n此邮件由批量URL转PDF工具自动发送。`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>批量PDF文件</h2>
                    <p>您好，</p>
                    <p>附件中包含了 <strong>${fileCount}</strong> 个PDF文件的压缩包。</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">此邮件由批量URL转PDF工具自动发送。</p>
                </div>
            `,
            attachments: [
                {
                    filename: `pdfs_${Date.now()}.zip`,
                    content: zipBuffer
                }
            ]
        });

        console.log('邮件发送成功:', info.messageId);

        res.json({
            success: true,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('发送邮件失败:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('请在浏览器中打开 http://localhost:3000');
});
