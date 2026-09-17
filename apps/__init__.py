from flask import Flask, send_from_directory
from flask_cors import CORS
from .exts import init_exts
from . import config
from .api.auth import api_auth
from .api.posts import api_posts
from .api.config import api_config
from .api.oss import api_oss
from .api.ai import api_ai
from .api.backup import api_backup
from .api.open import api_open
from .api.halo import api_halo
import datetime


def create_apps():
    app = Flask(__name__)
    
    # 启用跨域资源共享 (CORS) - 允许来源通过环境变量 CORS_ORIGINS 配置（默认 *，生产环境建议收紧）
    CORS(app, resources={
        r"/api/*": {"origins": config.CORS_ORIGINS},
        r"/apis/*": {"origins": config.CORS_ORIGINS},
        r"/uploads/*": {"origins": config.CORS_ORIGINS},
        r"/temp/*": {"origins": config.CORS_ORIGINS},
    })

    # 注册 API 蓝图
    app.register_blueprint(blueprint=api_auth)
    app.register_blueprint(blueprint=api_posts)
    app.register_blueprint(blueprint=api_config)
    app.register_blueprint(blueprint=api_oss)
    app.register_blueprint(blueprint=api_ai)
    app.register_blueprint(blueprint=api_backup)
    app.register_blueprint(blueprint=api_open)
    app.register_blueprint(blueprint=api_halo)

    # 静态上传文件访问
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(config.UPLOAD_PATH, filename)

    # 静态临时/缓存文件访问 (temp/images)
    @app.route('/temp/images/<path:filename>')
    def cached_temp_image(filename):
        return send_from_directory(config.CACHE_IMAGE_DIR, filename)

    # 注册DB数据库
    app.config.from_object(config)
    app.secret_key = config.SECRET_KEY
    app.permanent_session_lifetime = datetime.timedelta(days=7)

    init_exts(app=app)

    # 启动后台 AI 自动化提取与摘要调度任务
    from .tools.ai_scheduler import start_ai_scheduler
    start_ai_scheduler(app=app)

    return app

