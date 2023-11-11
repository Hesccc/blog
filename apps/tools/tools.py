import hashlib
import functools
import platform
import importlib
from datetime import datetime
from flask import session, redirect, url_for


def pwd_convert(passwd: str):
    hl = hashlib.md5()
    hl.update(passwd.encode(encoding='utf8'))
    password = hl.hexdigest()
    return password


def auth(func):
    @functools.wraps(func)
    def inner(*args, **kwargs):
        username = session.get("username")
        if not username:
            return redirect(url_for('blue_index.index'))
        return func(*args, **kwargs)

    return inner


def env():
    env_data = {
        # 操作系统
        'os': platform.system(),
        # 运行环境
        'run_env': "Python:" + platform.python_version() + "; OS:" + platform.system() + "; flask:" + importlib.metadata.version(
            "flask") + "; flask_sqlalchemy:" + importlib.metadata.version("flask_sqlalchemy"),
        'python_v': platform.python_version(),
        'flask_v': importlib.metadata.version("flask"),
        'blog_v': "v1.1.0",
        'datetime': datetime.now(),
        'db_type': 'Mysql',
        'SQLAlchemy_v': importlib.metadata.version("flask_sqlalchemy")
    }

    return env_data
