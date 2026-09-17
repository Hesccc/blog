import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# 加载项目根目录下的 .env 文件
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

# 安全密钥
SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-please-change-in-env')
if SECRET_KEY == 'default-dev-secret-key-please-change-in-env':
    logging.warning('SECRET_KEY 正在使用内置默认值，生产环境务必在 .env 中配置随机强密钥！')

# CORS 允许的来源（逗号分隔），生产环境建议配置为具体前端域名
CORS_ORIGINS = [o.strip() for o in os.getenv('CORS_ORIGINS', '*').split(',') if o.strip()]

# 数据库配置 (支持 MySQL, MariaDB, PostgreSQL 等)
DB_TYPE = os.getenv('DB_TYPE', 'mysql').lower().strip()
HOSTNAME = os.getenv('DB_HOST', '127.0.0.1')
PORT = os.getenv('DB_PORT', '3306' if DB_TYPE not in ('postgres', 'postgresql') else '5432')
DATABASE = os.getenv('DB_NAME', 'blog')
USERNAME = os.getenv('DB_USER', 'root' if DB_TYPE not in ('postgres', 'postgresql') else 'postgres')
PASSWORD = os.getenv('DB_PASSWORD', '')

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DB_URI = DATABASE_URL
elif DB_TYPE in ('postgres', 'postgresql', 'pgsql'):
    DB_URI = f'postgresql+psycopg2://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}'
else:
    # 默认 MySQL / MariaDB (驱动 pymysql)
    DB_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}?charset=utf8mb4'

SQLALCHEMY_DATABASE_URI = DB_URI
SQLALCHEMY_TRACK_MODIFICATIONS = False

# 上传配置
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
UPLOAD_PATH = (BASE_DIR / UPLOAD_FOLDER).resolve()
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

# 外部图床本地缓存目录 (temp/images)
CACHE_IMAGE_DIR = (BASE_DIR / 'temp' / 'images').resolve()
CACHE_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# LLM 大模型配置 (OpenAI 兼容规范)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
