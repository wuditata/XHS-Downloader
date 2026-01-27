document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settings-form');
    const resultDiv = document.getElementById('result');

    settingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(settingsForm);
        const config = {};
        
        for (const [key, value] of formData.entries()) {
            if (value === 'on') {
                config[key] = true;
            } else if (!isNaN(value)) {
                config[key] = parseInt(value);
            } else {
                config[key] = value;
            }
        }

        resultDiv.innerHTML = '<p>保存中...</p>';

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ config: config })
            });

            const data = await response.json();
            
            if (data.success) {
                resultDiv.innerHTML = '<p class="success">配置保存成功！</p>';
            } else {
                resultDiv.innerHTML = `<p class="error">保存失败：${data.error}</p>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p class="error">请求失败：${error.message}</p>`;
        }
    });
});