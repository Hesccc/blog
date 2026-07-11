from flask import Flask
from flask_cors import CORS
from .exts import init_exts
from . import config
from .api.auth import api_auth
from .api.posts import api_posts
from .api.config import api_config
import datetime


def create_apps():
    app = Flask(__name__)
    
    # 启用跨域资源共享 (CORS) - 允许前端端口访问 /api 路由
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 注册 API 蓝图
    app.register_blueprint(blueprint=api_auth)
    app.register_blueprint(blueprint=api_posts)
    app.register_blueprint(blueprint=api_config)

    # 注册DB数据库
    app.config.from_object(config)
    app.secret_key = '123123'
    app.permanent_session_lifetime = datetime.timedelta(days=7)

    init_exts(app=app)

    return app

