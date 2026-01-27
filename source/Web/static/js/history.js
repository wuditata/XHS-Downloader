document.addEventListener('DOMContentLoaded', async function() {
    const historyContent = document.getElementById('history-content');
    const totalCountSpan = document.getElementById('total-count');
    const statCards = document.querySelectorAll('.stat-content h3');
    const refreshBtn = document.querySelector('.header-btn');

    let totalCount = 0;
    let userCount = 0;
    let todayCount = 0;
    let favoriteCount = 0;

    function updateStats() {
        statCards[0].textContent = totalCount;
        statCards[1].textContent = userCount;
        statCards[2].textContent = todayCount;
        statCards[3].textContent = favoriteCount;
    }

    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data.success) {
                const history = data.history;
                
                // 计算统计数据
                totalCount = 0;
                const authors = Object.keys(history);
                userCount = authors.length;
                
                const today = new Date().toDateString();
                todayCount = 0;
                favoriteCount = 0;
                
                authors.forEach(authorId => {
                    const items = history[authorId];
                    totalCount += items.length;
                    
                    items.forEach(item => {
                        // 统计今日新增
                        const createTime = item['采集时间'] || '';
                        if (createTime && new Date(createTime).toDateString() === today) {
                            todayCount++;
                        }
                        
                        // 统计收藏数
                        const likes = parseInt(item['点赞数'] || item['点赞'] || 0);
                        if (likes > favoriteCount) {
                            favoriteCount = likes;
                        }
                    });
                });

                updateStats();
                totalCountSpan.textContent = `${totalCount} 条记录`;

                if (authors.length === 0) {
                    historyContent.innerHTML = `
                        <div class="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <h3>暂无下载历史</h3>
                            <p>开始下载后即可查看历史记录</p>
                        </div>
                    `;
                    return;
                }

                let html = '';
                
                authors.forEach(authorId => {
                    const authorItems = history[authorId];
                    html += `
                        <div class="group-section">
                            <div class="group-header">
                                <div class="group-avatar">${authorId.charAt(0).toUpperCase()}</div>
                                <div class="group-info">
                                    <h3>${authorId}</h3>
                                    <p>${authorItems.length} 个作品</p>
                                </div>
                            </div>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>作品标题</th>
                                            <th>作品类型</th>
                                            <th>发布时间</th>
                                            <th>采集时间</th>
                                            <th>点赞数</th>
                                            <th>收藏数</th>
                                            <th>评论数</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;
                    
                    authorItems.forEach(item => {
                        html += `
                            <tr>
                                <td title="${item['作品标题'] || ''}">${item['作品标题'] || '未知'}</td>
                                <td><span class="tag">${item['作品类型'] || '未知'}</span></td>
                                <td>${item['发布时间'] || '未知'}</td>
                                <td>${item['采集时间'] || '未知'}</td>
                                <td>${item['点赞数'] || item['点赞'] || '0'}</td>
                                <td>${item['收藏数'] || item['收藏'] || '0'}</td>
                                <td>${item['评论数'] || item['评论'] || '0'}</td>
                            </tr>
                        `;
                    });
                    
                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                });
                
                historyContent.innerHTML = html;
            } else {
                historyContent.innerHTML = `
                    <div class="empty-state">
                        <h3>获取历史记录失败</h3>
                        <p>${data.error || '请稍后重试'}</p>
                    </div>
                `;
            }
        } catch (error) {
            historyContent.innerHTML = `
                <div class="empty-state">
                    <h3>请求失败</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // 加载历史记录
    loadHistory();

    // 刷新按钮功能
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadHistory();
        });
    }
});