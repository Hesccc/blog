from ..exts import db
from datetime import datetime


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
    password = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)


class History(db.Model):
    __tablename__ = 'history'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID 主键，自增
    username = db.Column(db.String(100), nullable=False)
    time = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(20), nullable=True)
