from ..exts import db


class Config(db.Model):
    __tablename__ = 'config'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    value = db.Column(db.Text, nullable=False)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    username = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.DateTime, nullable=False)
    deleted = db.Column(db.Integer, default=0)
    update_time = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'


class History(db.Model):
    __tablename__ = 'history'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    username = db.Column(db.String(100), nullable=False)
    time = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(20), nullable=True)


class Posts(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    title = db.Column(db.String(100), nullable=False)
    author = db.Column(db.String(100), nullable=True)
    content = db.Column(db.Text, nullable=True)
    access_count = db.Column(db.Integer, nullable=True)
    thumbnail = db.Column(db.String(1024), nullable=True)
    status = db.Column(db.Integer, nullable=True)
    update_time = db.Column(db.DateTime, nullable=True)
    create_time = db.Column(db.DateTime, nullable=True)
    meta_description = db.Column(db.String(1023), nullable=True)
    summary = db.Column(db.String(600), nullable=True)  # AI 生成的文章内容摘要 (200字以内)
    deleted = db.Column(db.Integer)


class Categories(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    create_time = db.Column(db.DateTime, nullable=False)
    update_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    priority = db.Column(db.Integer, nullable=True)
    slug = db.Column(db.String(255), nullable=True)
    slug_name = db.Column(db.String(50), nullable=True)
    thumbnail = db.Column(db.String(1023), nullable=True)
    deleted = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(25), nullable=True)


class Tags(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    create_time = db.Column(db.DateTime, nullable=False)
    deleted = db.Column(db.Integer, nullable=False)
    update_time = db.Column(db.DateTime, nullable=True)
    name = db.Column(db.String(255), nullable=True)
    slug = db.Column(db.String(50), nullable=True)
    slug_name = db.Column(db.String(255), nullable=True)
    thumbnail = db.Column(db.String(1023), nullable=True)
    color = db.Column(db.String(25), nullable=True)


class PostTags(db.Model):
    __tablename__ = 'post_tags'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    create_time = db.Column(db.DateTime, nullable=False)
    deleted = db.Column(db.Integer, nullable=False)
    update_time = db.Column(db.DateTime, nullable=True)
    post_id = db.Column(db.Integer, nullable=True)
    tag_id = db.Column(db.Integer, nullable=True)


class PostCategories(db.Model):
    __tablename__ = 'post_categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    create_time = db.Column(db.DateTime, nullable=False)
    deleted = db.Column(db.Integer, nullable=False)
    update_time = db.Column(db.DateTime, nullable=True)
    category_id = db.Column(db.Integer, nullable=True)
    post_id = db.Column(db.Integer, nullable=True)
