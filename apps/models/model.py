from ..exts import db


def __repr__(self):
    return '<User %r>' % self.name


class Config(db.Model):
    __tablename__ = 'config'  # 设置表名
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    name = db.Column(db.String(200), nullable=False)  # 第一列name，字符串型，200个字符以内，不可为空
    value = db.Column(db.String(500), nullable=False)  # 第二列value，字符串型，500个字符以内，不可为空


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    username = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text(100), nullable=False)
    create_time = db.Column(db.DateTime, nullable=False)
    deleted = db.Column(db.Integer)
    update_time = db.Column(db.DateTime, nullable=False)


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
    content = db.Column(db.Text(2048), nullable=True)
    access_count = db.Column(db.Integer, nullable=True)
    thumbnail = db.Column(db.String(1024), nullable=True)
    status = db.Column(db.Integer, nullable=True)
    update_time = db.Column(db.DateTime, nullable=True)
    create_time = db.Column(db.DateTime, nullable=True)
    meta_description = db.Column(db.String(1023), nullable=True)
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
