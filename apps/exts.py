from flask_sqlalchemy import SQLAlchemy  # 导入SQLAlchemy包
from flask_migrate import Migrate
from datetime import datetime
from apps.tools.tools import generate_password

db = SQLAlchemy()  # ORM 创建数据库sqlalchemy工具对象
migrate = Migrate()  # 创建对象


def init_exts(app):
    db.init_app(app=app)
    migrate.init_app(app=app, db=db)

    # 自动创建表与初始化数据 (带重试保护，避免冷启动数据库瞬时不可达导致 Gunicorn worker 崩溃)
    with app.app_context():
        import time
        import logging
        logger = logging.getLogger(__name__)

        initialized = False
        for attempt in range(1, 11):
            try:
                from apps.models.model import Config, User, Categories, Tags, Posts
                from apps.models.oss_image import OssImage  # noqa: F401
                from sqlalchemy import text
                db.create_all()
                initialized = True
                break
            except Exception as e:
                logger.warning(f"Database connection attempt {attempt}/10 failed: {e}")
                time.sleep(2)

        if not initialized:
            logger.error("Could not initialize database on startup. Workers will run in degraded mode.")
            return

        # 仅针对 MySQL 方言执行历史老库升级
        try:
            bind = db.session.get_bind()
            if bind and bind.dialect.name == 'mysql':
                db.session.execute(text('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL'))
                db.session.execute(text('ALTER TABLE posts MODIFY COLUMN content LONGTEXT'))
                cols = [c[0] for c in db.session.execute(text('DESCRIBE posts')).fetchall()]
                if 'summary' not in cols:
                    db.session.execute(text('ALTER TABLE posts ADD COLUMN summary VARCHAR(600) NULL'))
                db.session.commit()
        except Exception:
            db.session.rollback()

        # 检查是否为空白数据库（Config 表为空）
        if Config.query.first() is None:
            # 种子配置
            configs = [
                Config(id=1, name='website_url', value='https://hesc.info'),
                Config(id=2, name='website_title', value='AeroNote'),
                Config(id=3, name='website_keywords', value='Splunk;Python;Shell;MySQL;Linux;Docker;AI'),
                Config(id=4, name='website_desc', value='记录技术沉淀 · 分享生活思考 · 散漫而行'),
                Config(id=5, name='website_icp', value='湘ICP备20003211号-2'),
                Config(id=6, name='about_profile_subtitle', value='💻 不专业的黑客 / 安全运营 / Splunk专家 / 技术博主'),
                Config(id=7, name='homepage_subtitle', value='记录技术 · 分享生活 · 散漫而行')
            ]
            db.session.add_all(configs)

            # 种子管理员
            if User.query.filter_by(username='admin').first() is None:
                admin_user = User(
                    id=1,
                    username='admin',
                    password=generate_password('admin'),
                    email='mr.hesc@outlook.com',
                    name='管理员',
                    description='管理员账号',
                    create_time=datetime.now(),
                    update_time=datetime.now(),
                    deleted=0
                )
                db.session.add(admin_user)

            # 种子分类
            if Categories.query.first() is None:
                categories = [
                    Categories(id=1, name='默认分类', description='这是你的默认分类，如不需要，删除即可。', slug='default', color='#41baff', create_time=datetime.now(), update_time=datetime.now(), deleted=0, parent_id=0),
                    Categories(id=2, name='Oracle', description='Oracle', slug='oracle', color='#41baff', create_time=datetime.now(), update_time=datetime.now(), deleted=0, parent_id=0),
                    Categories(id=3, name='Splunk', description='Splunk分类', slug='splunk', color='#41baff', create_time=datetime.now(), update_time=datetime.now(), deleted=0, parent_id=0)
                ]
                db.session.add_all(categories)

            # 种子标签
            if Tags.query.first() is None:
                tags = [
                    Tags(id=1, name='Oracle', slug='oracle', color='#c12323', create_time=datetime.now(), deleted=0),
                    Tags(id=2, name='Nginx', slug='nginx', color='#06bb5a', create_time=datetime.now(), deleted=0),
                    Tags(id=3, name='Linux', slug='linux', color='#2d7ac7', create_time=datetime.now(), deleted=0)
                ]
                db.session.add_all(tags)

            # 种子初始文章
            if Posts.query.first() is None:
                hello_post = Posts(
                    id=1,
                    title='Hello World',
                    author='admin',
                    content='欢迎使用个人技术博客系统！这是你的第一篇文章。',
                    access_count=0,
                    status=0,
                    create_time=datetime.now(),
                    update_time=datetime.now(),
                    deleted=0
                )
            try:
                db.session.commit()
            except Exception as e:
                logger.warning(f"种子数据写入告警: {e}")
                db.session.rollback()


