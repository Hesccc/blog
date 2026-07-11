import hashlib
import functools
import platform
import importlib
import logging  # 自定义日志模块
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
    import subprocess
    import psutil

    # 获取 Node.js 版本
    try:
        result = subprocess.run(['node', '-v'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
        node_v = result.stdout.strip() if result.returncode == 0 else "Unknown"
    except Exception:
        node_v = "Unknown"

    # 获取系统资源使用率
    try:
        cpu_usage = psutil.cpu_percent(interval=0.1)
        mem_usage = psutil.virtual_memory().percent
    except Exception:
        cpu_usage = 0.0
        mem_usage = 0.0

    env_data = {
        # 操作系统
        'os': platform.system(),
        # 运行环境
        'run_env': "Python:" + platform.python_version() + "; OS:" + platform.system() + "; flask:" + importlib.metadata.version(
            "flask") + "; flask_sqlalchemy:" + importlib.metadata.version("flask_sqlalchemy") + "; node:" + node_v,
        'python_v': platform.python_version(),
        'flask_v': importlib.metadata.version("flask"),
        'blog_v': "v1.1.0",
        'datetime': datetime.now(),
        'db_type': 'Mysql',
        'SQLAlchemy_v': importlib.metadata.version("flask_sqlalchemy"),
        'node_v': node_v,
        'cpu_usage': cpu_usage,
        'mem_usage': mem_usage
    }
    return env_data


def setup_custom_logger(name, log_file):
    formatter = logging.Formatter(fmt='%(asctime)s - %(levelname)s - %(module)s - %(message)s')

    handler = logging.FileHandler(log_file)
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)

    return logger
