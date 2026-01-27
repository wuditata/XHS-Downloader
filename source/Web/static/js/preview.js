document.addEventListener('DOMContentLoaded', async function() {
    const imageGallery = document.getElementById('image-gallery');
    const imageCountSpan = document.getElementById('image-count');
    const statCards = document.querySelectorAll('.stat-content h3');
    const refreshBtn = document.querySelector('.header-btn');

    let totalImages = 0;
    let viewedImages = 0;
    let userGroups = 0;
    let todayViews = 0;

    function updateStats() {
        statCards[0].textContent = totalImages;
        statCards[1].textContent = viewedImages;
        statCards[2].textContent = userGroups;
        statCards[3].textContent = todayViews;
    }

    async function loadImages() {
        try {
            const response = await fetch('/api/preview');
            const data = await response.json();
            
            if (data.success) {
                const images = data.images;
                
                // 计算统计数据
                totalImages = images.length;
                viewedImages = Math.floor(Math.random() * totalImages); // 模拟数据
                userGroups = new Set(images.map(img => img.authorId || 'default')).size;
                todayViews = Math.floor(Math.random() * totalImages); // 模拟数据

                updateStats();
                imageCountSpan.textContent = `${totalImages} 张图片`;

                if (images.length === 0) {
                    imageGallery.innerHTML = `
                        <div class="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <h3>暂无图片</h3>
                            <p>下载图片后即可在此预览</p>
                        </div>
                    `;
                    return;
                }

                let html = '';
                
                images.forEach(image => {
                    html += `
                        <div class="gallery-item" onclick="previewImage('${image.url}')">
                            <img src="${image.url}" alt="${image.title || '图片'}" loading="lazy">
                            <div class="gallery-item-info">
                                <p title="${image.title || ''}">${image.title || '未命名'}</p>
                            </div>
                        </div>
                    `;
                });
                
                imageGallery.innerHTML = html;
            } else {
                imageGallery.innerHTML = `
                    <div class="empty-state">
                        <h3>获取图片失败</h3>
                        <p>${data.error || '请稍后重试'}</p>
                    </div>
                `;
            }
        } catch (error) {
            imageGallery.innerHTML = `
                <div class="empty-state">
                    <h3>请求失败</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // 图片预览功能
    window.previewImage = function(url) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 900px;">
                <div class="modal-header">
                    <h3 class="modal-title">图片预览</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 0;">
                    <img src="${url}" alt="预览图片" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                </div>
                <div class="modal-footer">
                    <a href="${url}" download class="btn btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        下载图片
                    </a>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    // 加载图片
    loadImages();

    // 刷新按钮功能
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadImages();
        });
    }
});