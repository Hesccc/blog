from flask_sqlalchemy import SQLAlchemy  # 导入SQLAlchemy包
from flask_migrate import Migrate
from datetime import datetime

db = SQLAlchemy()  # ORM 创建数据库sqlalchemy工具对象
migrate = Migrate()  # 创建对象


def init_exts(app):
    db.init_app(app=app)
    migrate.init_app(app=app, db=db)

    # 自动创建表与初始化数据
    with app.app_context():
        # 确保模型已经加载
        from apps.models.model import Config, User, Categories, Tags, Posts
        from apps.models.oss_image import OssImage  # noqa: F401 — 确保 oss_images 表被创建
        db.create_all()

        # 检查是否为空白数据库（Config 表为空）
        if Config.query.first() is None:
            # 种子配置
            configs = [
                Config(id=1, name='website_url', value='hesc.info'),
                Config(id=2, name='website_title', value='散漫的老何'),
                Config(id=3, name='website_keywords', value='Splunk;Python;Shell;Mysql;SQL'),
                Config(id=4, name='website_desc', value='这是一个使用Python Flask、HTML5、bootstrap开发的博客系统'),
                Config(id=5, name='website_icp', value='湘ICP备20003211号-1')
            ]
            db.session.add_all(configs)

            # 种子管理员
            if User.query.filter_by(username='admin').first() is None:
                admin_user = User(
                    id=1,
                    username='admin',
                    password='e6e061838856bf47e1de730719fb2609',
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
                    content='欢迎使用散漫的老何的博客系统！这是你的第一篇文章。',
                    access_count=0,
                    status=0,
                    create_time=datetime.now(),
                    update_time=datetime.now(),
                    deleted=0
                )
                db.session.add(hello_post)

            db.session.commit()


