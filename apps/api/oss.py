"""
OSS 图片库 API
--------------
说明：不对接 OSS SDK，图片库为纯 URL 收藏夹。
管理员手动添加 OSS 图片 URL，系统在 DB 中维护索引，支持文章封面随机兜底。
"""
import random as _random
from urllib.parse import urlparse, unquote

from flask import Blueprint, request, jsonify
from datetime import datetime

from apps.exts import db
from apps.models.oss_image import OssImage
from apps.models.model import Posts
from .middleware import token_required

api_oss = Blueprint('api_oss', __name__)


def _parse_filename(url: str) -> str:
    """从 URL 路径中解析出文件名。"""
    try:
        path = urlparse(url).path
        return unquote(path.split('/')[-1]) or url
    except Exception:
        return url


# ──────────────────────────────────────────────
# 公开接口（无需登录）
# ──────────────────────────────────────────────

@api_oss.route('/api/oss/random', methods=['GET'])
def oss_random_image():
    """
    随机返回一张图片的 URL，供前端文章卡片兜底使用。
    从 DB 直接随机取，性能好，无需遍历 OSS。
    """
    count = OssImage.query.filter(OssImage.deleted == 0).count()
    if count == 0:
        return jsonify({'url': None})

    # 随机偏移取一条，比 ORDER BY RAND() 在大表时更高效
    offset = _random.randint(0, count - 1)
    img = OssImage.query.filter(OssImage.deleted == 0).offset(offset).limit(1).first()
    if img:
        return jsonify({'url': img.url, 'id': img.id})
    return jsonify({'url': None})


# ──────────────────────────────────────────────
# 管理端接口（需要登录）
# ──────────────────────────────────────────────

@api_oss.route('/api/manage/oss/images', methods=['GET'])
@token_required
def oss_list_images():
    """分页获取图片库列表。"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)
    search = request.args.get('search', '').strip()

    query = OssImage.query.filter(OssImage.deleted == 0)
    if search:
        query = query.filter(OssImage.url.like(f'%{search}%') | OssImage.file_name.like(f'%{search}%'))

    query = query.order_by(OssImage.create_time.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'images': [_serialize_image(img) for img in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    })


@api_oss.route('/api/manage/oss/images', methods=['POST'])
@token_required
def oss_add_image():
    """手动新增一条图片 URL 到图片库。支持批量（传 urls 数组）。"""
    data = request.get_json() or {}
    urls = data.get('urls', [])
    single_url = data.get('url', '').strip()

    # 兼容单条和批量
    if single_url:
        urls = [single_url]

    if not urls:
        return jsonify({'msg': '请提供至少一个图片 URL'}), 400

    added = []
    skipped = []
    for raw_url in urls:
        url = raw_url.strip()
        if not url:
            continue
        # 去重：URL 已存在则跳过
        exists = OssImage.query.filter(OssImage.url == url, OssImage.deleted == 0).first()
        if exists:
            skipped.append(url)
            continue
        # 软删除后重新激活（同 URL 曾被删除）
        deleted_img = OssImage.query.filter(OssImage.url == url, OssImage.deleted == 1).first()
        if deleted_img:
            deleted_img.deleted = 0
            deleted_img.update_time = datetime.now()
            added.append(_serialize_image(deleted_img))
        else:
            img = OssImage(
                url=url,
                file_name=data.get('file_name') or _parse_filename(url),
                remark=data.get('remark', ''),
                deleted=0,
                create_time=datetime.now(),
                update_time=datetime.now(),
            )
            db.session.add(img)
            db.session.flush()
            added.append(_serialize_image(img))

    db.session.commit()
    return jsonify({
        'msg': f'成功添加 {len(added)} 张，跳过 {len(skipped)} 张（已存在）',
        'added': added,
        'skipped': skipped,
    }), 201


@api_oss.route('/api/manage/oss/images/<int:image_id>', methods=['PUT'])
@token_required
def oss_update_image(image_id: int):
    """修改图片备注或文件名。"""
    img = OssImage.query.filter(OssImage.id == image_id, OssImage.deleted == 0).first_or_404()
    data = request.get_json() or {}

    if 'file_name' in data and data['file_name'] is not None:
        img.file_name = data['file_name']
    if 'remark' in data:
        img.remark = data['remark']

    img.update_time = datetime.now()
    db.session.commit()
    return jsonify(_serialize_image(img))


@api_oss.route('/api/manage/oss/images/<int:image_id>', methods=['DELETE'])
@token_required
def oss_delete_image(image_id: int):
    """从图片库中移除（软删除），不影响 OSS 源文件。"""
    img = OssImage.query.filter(OssImage.id == image_id, OssImage.deleted == 0).first_or_404()
    img.deleted = 1
    img.update_time = datetime.now()
    db.session.commit()
    return jsonify({'msg': '已从图片库移除'})


@api_oss.route('/api/manage/oss/images/batch-delete', methods=['POST'])
@token_required
def oss_batch_delete():
    """批量从图片库中移除（软删除）。"""
    data = request.get_json() or {}
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'msg': '请提供要删除的图片 ID 列表'}), 400

    OssImage.query.filter(OssImage.id.in_(ids), OssImage.deleted == 0).update(
        {OssImage.deleted: 1, OssImage.update_time: datetime.now()},
        synchronize_session=False
    )
    db.session.commit()
    return jsonify({'msg': f'已移除 {len(ids)} 张图片'})


@api_oss.route('/api/manage/oss/import-from-posts', methods=['POST'])
@token_required
def oss_import_from_posts():
    """
    从文章 thumbnail 字段批量导入现有 OSS 链接到图片库。
    一键导入所有文章封面图，避免重复添加。
    """
    posts = Posts.query.filter(Posts.deleted == 0, Posts.thumbnail.isnot(None)).all()
    added = 0
    skipped = 0
    for post in posts:
        url = (post.thumbnail or '').strip()
        if not url:
            continue
        exists = OssImage.query.filter(OssImage.url == url).first()
        if exists:
            if exists.deleted == 1:
                exists.deleted = 0
                exists.update_time = datetime.now()
                added += 1
            else:
                skipped += 1
        else:
            img = OssImage(
                url=url,
                file_name=_parse_filename(url),
                remark=f'从文章「{post.title}」导入',
                deleted=0,
                create_time=datetime.now(),
                update_time=datetime.now(),
            )
            db.session.add(img)
            added += 1

    db.session.commit()
    return jsonify({'msg': f'导入完成：新增 {added} 张，跳过 {skipped} 张（已存在）', 'added': added, 'skipped': skipped})


# ──────────────────────────────────────────────
# 内部辅助函数
# ──────────────────────────────────────────────

def _serialize_image(img: OssImage) -> dict:
    return {
        'id': img.id,
        'url': img.url,
        'file_name': img.file_name or '',
        'remark': img.remark or '',
        'create_time': img.create_time.isoformat() if img.create_time else None,
        'update_time': img.update_time.isoformat() if img.update_time else None,
    }
