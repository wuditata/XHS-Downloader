document.addEventListener('DOMContentLoaded', function() {
    const downloadForm = document.getElementById('download-form');
    const urlsInput = document.getElementById('urls');
    const resultDiv = document.getElementById('result');
    const taskListDiv = document.getElementById('task-list');
    const totalTasksSpan = document.querySelector('.tag.tag-primary');
    const statCards = document.querySelectorAll('.stat-content h3');
    
    let taskCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;

    function updateStats() {
        statCards[0].textContent = taskCount;
        statCards[1].textContent = successCount;
        statCards[2].textContent = pendingCount;
        statCards[3].textContent = errorCount;
    }

    function createTaskItem(url, status = 'pending') {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item animate-fade-in';
        taskItem.dataset.url = url;
        
        const statusClass = status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending';
        
        taskItem.innerHTML = `
            <div class="task-status ${statusClass}"></div>
            <div class="task-content">
                <div class="task-title">${url}</div>
                <div class="task-meta">${status === 'pending' ? '等待下载...' : status === 'success' ? '下载成功' : '下载失败'}</div>
            </div>
            <div class="task-actions">
                <span class="tag ${statusClass === 'success' ? 'tag-success' : statusClass === 'error' ? 'tag-warning' : 'tag-primary'}">
                    ${status === 'pending' ? '等待中' : status === 'success' ? '成功' : '失败'}
                </span>
            </div>
        `;
        
        return taskItem;
    }

    function updateTaskStatus(url, status, message = '') {
        const taskItem = document.querySelector(`.task-item[data-url="${url}"]`);
        if (taskItem) {
            const statusDiv = taskItem.querySelector('.task-status');
            const metaDiv = taskItem.querySelector('.task-meta');
            const actionSpan = taskItem.querySelector('.task-actions .tag');
            
            statusDiv.className = `task-status ${status}`;
            
            if (status === 'success') {
                metaDiv.textContent = message || '下载成功';
                actionSpan.className = 'tag tag-success';
                actionSpan.textContent = '成功';
                successCount++;
                pendingCount--;
            } else if (status === 'error') {
                metaDiv.textContent = message || '下载失败';
                actionSpan.className = 'tag tag-warning';
                actionSpan.textContent = '失败';
                errorCount++;
                pendingCount--;
            }
            
            updateStats();
        }
    }

    downloadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const urls = urlsInput.value.trim();
        if (!urls) {
            resultDiv.innerHTML = '<div class="message message-error">请输入下载地址</div>';
            return;
        }

        const urlList = urls.split('\n').filter(url => url.trim() !== '');
        if (urlList.length === 0) {
            resultDiv.innerHTML = '<div class="message message-error">请输入有效的下载地址</div>';
            return;
        }

        // 清空空状态
        if (taskListDiv.querySelector('.empty-state')) {
            taskListDiv.innerHTML = '';
        }

        // 添加任务到列表
        urlList.forEach(url => {
            const trimmedUrl = url.trim();
            if (trimmedUrl) {
                const taskItem = createTaskItem(trimmedUrl, 'pending');
                taskListDiv.appendChild(taskItem);
                taskCount++;
                pendingCount++;
            }
        });

        totalTasksSpan.textContent = `${taskCount} 个任务`;
        updateStats();
        resultDiv.innerHTML = '';

        // 发送下载请求
        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ urls: urls })
            });

            const data = await response.json();
            
            if (data.success) {
                resultDiv.innerHTML = '<div class="message message-success">下载任务已提交！</div>';
                
                // 更新任务状态
                if (data.results && Array.isArray(data.results)) {
                    data.results.forEach(result => {
                        if (result.success) {
                            updateTaskStatus(result.url, 'success', result.message || '下载成功');
                        } else {
                            updateTaskStatus(result.url, 'error', result.error || '下载失败');
                        }
                    });
                } else {
                    // 如果 results 不是数组，可能是单个结果
                    urlList.forEach(url => {
                        updateTaskStatus(url.trim(), 'success', '下载成功');
                    });
                }
            } else {
                resultDiv.innerHTML = `<div class="message message-error">下载失败：${data.error}</div>`;
                
                // 更新所有任务为失败状态
                urlList.forEach(url => {
                    updateTaskStatus(url.trim(), 'error', data.error);
                });
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="message message-error">请求失败：${error.message}</div>`;
            
            // 更新所有任务为失败状态
            urlList.forEach(url => {
                updateTaskStatus(url.trim(), 'error', error.message);
            });
        }

        // 清空输入框
        urlsInput.value = '';
    });

    // 刷新按钮功能
    const refreshBtn = document.querySelector('.header-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });
    }
});