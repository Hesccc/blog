from flask import Flask
from .views.index import blue_index
from .views.manage import blue_manage
from .views.blog import blue_blog
from .exts import init_exts
from . import config
import datetime

def create_apps():
    app = Flask(__name__)

    # 注册蓝图
    app.register_blueprint(blueprint=blue_index)
    app.register_blueprint(blueprint=blue_manage)
    app.register_blueprint(blueprint=blue_blog)

    # 注册DB数据库
    app.config.from_object(config)
    app.secret_key = '123123'
    app.permanent_session_lifetime = datetime.timedelta(days=7)

    # {'DEBUG': False,
    #  'TESTING': False,
    #  'PROPAGATE_EXCEPTIONS': None,
    #  'SECRET_KEY': None,
    #  'PERMANENT_SESSION_LIFETIME': datetime.timedelta(days=31),
    #  'USE_X_SENDFILE': False,
    #  'SERVER_NAME': None,
    #  'APPLICATION_ROOT': '/',
    #  'SESSION_COOKIE_NAME': 'session',
    #  'SESSION_COOKIE_DOMAIN': None,
    #  'SESSION_COOKIE_PATH': None,
    #  'SESSION_COOKIE_HTTPONLY': True,
    #  'SESSION_COOKIE_SECURE': False,
    #  'SESSION_COOKIE_SAMESITE': None,
    #  'SESSION_REFRESH_EACH_REQUEST': True,
    #  'MAX_CONTENT_LENGTH': None,
    #  'SEND_FILE_MAX_AGE_DEFAULT': None,
    #  'TRAP_BAD_REQUEST_ERRORS': None,
    #  'TRAP_HTTP_EXCEPTIONS': False,
    #  'EXPLAIN_TEMPLATE_LOADING': False,
    #  'PREFERRED_URL_SCHEME': 'http',
    #  'TEMPLATES_AUTO_RELOAD': None,
    #  'MAX_COOKIE_SIZE': 4093,
    #  'DATABASE': 'blogdb',
    #  'DB_URI': 'mysql+pymysql://root:root@10.10.0.100:3306/blogdb?charset=utf8',
    #  'HOSTNAME': '10.10.0.100',
    #  'PASSWORD': 'root',
    #  'PORT': '3306',
    #  'SQLALCHEMY_DATABASE_URI': 'mysql+pymysql://root:root@10.10.0.100:3306/blogdb?charset=utf8',
    #  'SQLALCHEMY_TRACK_MODIFICATIONS': True,
    #  'USERNAME': 'root'
    #  }

    init_exts(app=app)
    return app
