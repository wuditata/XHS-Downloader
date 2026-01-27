from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

from ..application import XHS
from ..module import Settings, ROOT

class WebServer:
    def __init__(self):
        self.app = FastAPI(
            title="XHS-Downloader Web",
            description="小红书下载器 Web 界面",
        )
        self.settings = Settings()
        self.xhs = None
        self._setup_routes()
        self._setup_static_files()
        self._setup_templates()

    def _setup_static_files(self):
        static_dir = Path(__file__).parent / "static"
        self.app.mount("/static", StaticFiles(directory=static_dir), name="static")

    def _setup_templates(self):
        templates_dir = Path(__file__).parent / "templates"
        self.templates = Jinja2Templates(directory=templates_dir)

    def _setup_routes(self):
        # 使用 lifespan 事件处理器替代 deprecated 的 on_event 方法
        @self.app.lifespan
        async def lifespan(app):
            # 启动时
            if not self.xhs:
                self.xhs = XHS(**self.settings.run())
                await self.xhs.__aenter__()
                # 确保数据记录器已初始化
                if hasattr(self.xhs, 'data_recorder') and hasattr(self.xhs.data_recorder, 'cursor'):
                    print("数据记录器已初始化")
            yield
            # 关闭时
            if self.xhs:
                await self.xhs.__aexit__(None, None, None)

        @self.app.get("/", response_class=HTMLResponse)
        async def index(request: Request):
            return self.templates.TemplateResponse("index.html", {"request": request})

        @self.app.get("/history", response_class=HTMLResponse)
        async def history(request: Request):
            return self.templates.TemplateResponse("history.html", {"request": request})

        @self.app.get("/settings", response_class=HTMLResponse)
        async def settings(request: Request):
            config = self.settings.run()
            return self.templates.TemplateResponse("settings.html", {"request": request, "config": config})

        @self.app.get("/preview", response_class=HTMLResponse)
        async def preview(request: Request):
            return self.templates.TemplateResponse("preview.html", {"request": request})

        @self.app.post("/api/download")
        async def download(data: dict):
            if not self.xhs:
                return JSONResponse({"error": "服务未初始化"})
            
            try:
                urls = data.get("urls", "")
                if not urls:
                    return JSONResponse({"error": "请提供下载地址"})
                
                results = await self.xhs.extract(urls, download=True)
                return JSONResponse({"success": True, "results": results})
            except Exception as e:
                return JSONResponse({"error": str(e)})

        @self.app.get("/api/history")
        async def get_history():
            if not self.xhs:
                return JSONResponse({"error": "服务未初始化"})
            
            try:
                # 从数据记录器获取历史数据
                # 实现按用户分组的逻辑
                history = await self.xhs.data_recorder.select_all()
                
                # 按用户分组
                grouped_history = {}
                for item in history:
                    author_id = item.get("作者ID", "默认")
                    if author_id not in grouped_history:
                        grouped_history[author_id] = []
                    grouped_history[author_id].append(item)
                
                return JSONResponse({"success": True, "history": grouped_history})
            except Exception as e:
                return JSONResponse({"error": str(e)})

        @self.app.get("/api/settings")
        async def get_settings():
            config = self.settings.run()
            return JSONResponse({"success": True, "config": config})

        @self.app.post("/api/settings")
        async def update_settings(data: dict):
            try:
                config = data.get("config", {})
                self.settings.update(config)
                return JSONResponse({"success": True})
            except Exception as e:
                return JSONResponse({"error": str(e)})

        @self.app.get("/api/preview")
        async def get_preview():
            if not self.xhs:
                return JSONResponse({"error": "服务未初始化"})
            
            try:
                # 获取下载的图片列表
                # 这里需要实现图片预览的逻辑
                images = []
                return JSONResponse({"success": True, "images": images})
            except Exception as e:
                return JSONResponse({"error": str(e)})

    async def run(self, host="0.0.0.0", port=5557):
        import uvicorn
        config = uvicorn.Config(self.app, host=host, port=port)
        server = uvicorn.Server(config)
        await server.serve()
