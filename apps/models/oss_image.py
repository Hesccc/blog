from ..exts import db
from datetime import datetime


class OssImage(db.Model):
    __tablename__ = 'oss_images'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.String(768), nullable=False, unique=True)    # utf8mb4: 768×4=3072字节，恰好达到InnoDB上限
    file_name = db.Column(db.String(512), nullable=True)             # 可选，文件名（从 URL 解析或手动填写）
    remark = db.Column(db.String(255), nullable=True)                # 可选备注
    deleted = db.Column(db.Integer, nullable=False, default=0)       # 软删除标记：0=正常 1=已删
    create_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    update_time = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
