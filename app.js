// 全局变量
let pdfFiles = [];
let fileNameCounts = {};

// DOM元素
const urlInput = document.getElementById('urlInput');
const emailInput = document.getElementById('emailInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const statusList = document.getElementById('statusList');

// 生成唯一文件名
function generateUniqueFileName(title) {
    // 清理文件名，移除非法字符
    let cleanTitle = title.replace(/[<>:"/\\|?*]/g, '').trim();
    if (!cleanTitle) {
        cleanTitle = 'untitled';
    }

    // 限制文件名长度
    if (cleanTitle.length > 100) {
        cleanTitle = cleanTitle.substring(0, 100);
    }

    // 处理重复文件名
    if (fileNameCounts[cleanTitle]) {
        fileNameCounts[cleanTitle]++;
        return `${cleanTitle}_${fileNameCounts[cleanTitle]}.pdf`;
    } else {
        fileNameCounts[cleanTitle] = 0;
        return `${cleanTitle}.pdf`;
    }
}

// 添加状态信息
function addStatus(message, type = 'processing', statusId = null) {
    let statusItem;

    // 如果没有提供statusId，生成一个新的
    if (!statusId) {
        statusId = `status-${Date.now()}`;
    }

    // 尝试查找现有状态项
    statusItem = document.getElementById(statusId);

    // 如果没有找到现有状态项，创建新的
    if (!statusItem) {
        statusItem = document.createElement('div');
        statusItem.id = statusId;
        statusItem.className = `status-item ${type}`;
        statusList.appendChild(statusItem);
    } else {
        // 更新现有状态项的类名
        statusItem.className = `status-item ${type}`;
    }

    if (type === 'processing') {
        statusItem.innerHTML = `<span class="spinner"></span> ${message}`;
    } else if (type === 'success') {
        statusItem.innerHTML = `✓ ${message}`;
    } else if (type === 'error') {
        statusItem.innerHTML = `✗ ${message}`;
    }

    statusList.scrollTop = statusList.scrollHeight;
    return statusId;
}

// 更新进度条
function updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    progressFill.style.width = `${percentage}%`;
    progressFill.textContent = `${percentage}%`;
}

// 生成PDF
async function generatePDFs() {
    const urls = urlInput.value.split('\n').filter(url => url.trim());

    if (urls.length === 0) {
        alert('请输入至少一个URL');
        return;
    }

    // 重置状态
    pdfFiles = [];
    fileNameCounts = {};
    statusList.innerHTML = '';
    progressSection.classList.add('active');
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    sendEmailBtn.disabled = true;

    const startStatusId = addStatus(`开始处理 ${urls.length} 个URL...`, 'processing');

    let successCount = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim();
        updateProgress(i, urls.length);

        // 为每个URL创建唯一的状态ID
        const statusId = `url-status-${i}`;

        try {
            addStatus(`正在处理: ${url}`, 'processing', statusId);

            // 调用后端API生成PDF
            const response = await fetch('/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const fileName = generateUniqueFileName(data.title);
                pdfFiles.push({
                    name: fileName,
                    data: data.pdf,
                    title: data.title
                });
                addStatus(`成功: ${data.title} -> ${fileName}`, 'success', statusId);
                successCount++;
            } else {
                throw new Error(data.error || '生成失败');
            }

        } catch (error) {
            addStatus(`失败: ${url} - ${error.message}`, 'error', statusId);
        }
    }

    updateProgress(urls.length, urls.length);

    // 更新开始状态为完成状态
    addStatus(`处理完成！成功: ${successCount}/${urls.length}`, successCount > 0 ? 'success' : 'error', startStatusId);

    generateBtn.disabled = false;

    if (pdfFiles.length > 0) {
        downloadBtn.disabled = false;
        sendEmailBtn.disabled = false;
    }
}

// 下载ZIP
async function downloadZIP() {
    if (pdfFiles.length === 0) {
        alert('没有可下载的PDF文件');
        return;
    }

    downloadBtn.disabled = true;
    const statusId = addStatus('正在生成ZIP压缩包...', 'processing');

    try {
        const zip = new JSZip();

        // 添加所有PDF文件到ZIP
        for (const file of pdfFiles) {
            // 将base64转换为二进制
            const binaryData = atob(file.data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
            }
            zip.file(file.name, bytes);
        }

        // 生成ZIP文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 创建下载链接
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdfs_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addStatus('ZIP文件下载成功！', 'success', statusId);
    } catch (error) {
        addStatus(`ZIP生成失败: ${error.message}`, 'error', statusId);
    } finally {
        downloadBtn.disabled = false;
    }
}

// 发送邮件
async function sendEmail() {
    const email = emailInput.value.trim();

    if (!email) {
        alert('请输入接收邮箱地址');
        return;
    }

    if (pdfFiles.length === 0) {
        alert('没有可发送的PDF文件');
        return;
    }

    sendEmailBtn.disabled = true;
    const statusId = addStatus('正在发送邮件...', 'processing');

    try {
        // 生成ZIP数据
        const zip = new JSZip();
        for (const file of pdfFiles) {
            const binaryData = atob(file.data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
            }
            zip.file(file.name, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 将ZIP转换为base64
        const reader = new FileReader();
        reader.readAsDataURL(zipBlob);

        reader.onloadend = async function() {
            try {
                const base64data = reader.result.split(',')[1];

                // 调用后端API发送邮件
                const response = await fetch('/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        zipData: base64data,
                        fileCount: pdfFiles.length
                    })
                });

                const data = await response.json();

                if (data.success) {
                    addStatus(`邮件发送成功到: ${email}`, 'success', statusId);
                } else {
                    throw new Error(data.error || '发送失败');
                }
            } catch (error) {
                addStatus(`邮件发送失败: ${error.message}`, 'error', statusId);
            } finally {
                sendEmailBtn.disabled = false;
            }
        };

    } catch (error) {
        addStatus(`邮件发送失败: ${error.message}`, 'error', statusId);
        sendEmailBtn.disabled = false;
    }
}

// 事件监听
generateBtn.addEventListener('click', generatePDFs);
downloadBtn.addEventListener('click', downloadZIP);
sendEmailBtn.addEventListener('click', sendEmail);
