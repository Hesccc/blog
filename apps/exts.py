from flask_sqlalchemy import SQLAlchemy  # 导入SQLAlchemy包
from flask_migrate import Migrate

db = SQLAlchemy()  # ORM 创建数据库sqlalchemy工具对象
migrate = Migrate()  # 创建对象

def init_exts(app):
    db.init_app(app=app)
    migrate.init_app(app=app, db=db)

