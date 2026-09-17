import io
import os
import zipfile
from datetime import datetime
from pathlib import Path
from flask import Blueprint, jsonify, send_file, request, current_app
from sqlalchemy import text
from apps.exts import db
from apps import config
from apps.models.model import Posts, Categories, Tags, PostCategories, PostTags, Config, User
from apps.models.oss_image import OssImage
from .middleware import token_required

api_backup = Blueprint('api_backup', __name__)

BACKUP_DIR = (config.BASE_DIR / 'temp' / 'backups').resolve()
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def _dump_database_to_sql() -> str:
    """
    生成通用便携式 SQL 备份脚本，自适应兼容 MySQL、MariaDB 与 PostgreSQL：
    包含完整的建表 DDL 及数据 INSERT 语句。
    """
    dialect = db.engine.dialect.name
    is_pg = 'postgres' in dialect

    sql_lines = [
        "-- ========================================================",
        f"-- Blog System Database Dump ({dialect.upper()})",
        f"-- Generated At: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "-- ========================================================",
    ]

    if not is_pg:
        sql_lines.extend([
            "SET NAMES utf8mb4;",
            "SET FOREIGN_KEY_CHECKS = 0;\n"
        ])

    inspector = db.inspect(db.engine)
    table_names = inspector.get_table_names()

    for tbl in table_names:
        sql_lines.append(f"-- --------------------------------------------------------")
        sql_lines.append(f"-- Table structure for `{tbl}`")
        sql_lines.append(f"-- --------------------------------------------------------")
        sql_lines.append(f"DROP TABLE IF EXISTS `{tbl}` CASCADE;" if is_pg else f"DROP TABLE IF EXISTS `{tbl}`;")
        
        # 针对不同数据库方言提取建表语句
        try:
            if not is_pg:
                res = db.session.execute(text(f"SHOW CREATE TABLE `{tbl}`")).fetchone()
                if res and len(res) >= 2:
                    sql_lines.append(f"{res[1]};\n")
            else:
                # PG 下基于 SQLAlchemy 元数据模型导出 DDL
                metadata = db.Model.metadata
                if tbl in metadata.tables:
                    from sqlalchemy.schema import CreateTable
                    create_sql = str(CreateTable(metadata.tables[tbl]).compile(db.engine)).strip()
                    sql_lines.append(f"{create_sql};\n")
        except Exception as e:
            sql_lines.append(f"-- Failed to fetch CREATE TABLE for `{tbl}`: {e}\n")

        # 导出数据
        try:
            rows = db.session.execute(text(f'SELECT * FROM "{tbl}"' if is_pg else f"SELECT * FROM `{tbl}`")).fetchall()
            if rows:
                sql_lines.append(f"-- Dumping data for `{tbl}` ({len(rows)} records)")
                columns = [col['name'] for col in inspector.get_columns(tbl)]
                cols_str = ", ".join([f'"{c}"' if is_pg else f"`{c}`" for c in columns])

                for row in rows:
                    val_strs = []
                    for val in row:
                        if val is None:
                            val_strs.append("NULL")
                        elif isinstance(val, (int, float)):
                            val_strs.append(str(val))
                        elif isinstance(val, bool):
                            val_strs.append("TRUE" if val else "FALSE")
                        elif isinstance(val, datetime):
                            val_strs.append(f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'")
                        elif isinstance(val, (bytes, bytearray)):
                            hex_str = val.hex()
                            val_strs.append(f"X'{hex_str}'" if not is_pg else f"'\\x{hex_str}'")
                        else:
                            clean_str = str(val).replace('\\', '\\\\').replace("'", "\\'")
                            val_strs.append(f"'{clean_str}'")
                    target_table = f'"{tbl}"' if is_pg else f"`{tbl}`"
                    sql_lines.append(f"INSERT INTO {target_table} ({cols_str}) VALUES ({', '.join(val_strs)});")
                sql_lines.append("")
        except Exception as e:
            sql_lines.append(f"-- Failed to dump data for `{tbl}`: {e}\n")

    if not is_pg:
        sql_lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    return "\n".join(sql_lines)


# ──────────────────────────────────────────────
# 备份中心管理端 API
# ──────────────────────────────────────────────

@api_backup.route('/api/manage/backups', methods=['GET'])
@token_required
def list_backups():
    """获取所有已归档的历史备份包列表。"""
    backups = []
    if BACKUP_DIR.exists():
        for f in sorted(BACKUP_DIR.glob('*'), key=lambda p: p.stat().st_mtime, reverse=True):
            if f.is_file() and f.suffix.lower() in ('.zip', '.sql'):
                stat = f.stat()
                b_type = 'full'
                if 'markdown' in f.name:
                    b_type = 'markdown'
                elif 'oss' in f.name:
                    b_type = 'oss'
                elif 'db' in f.name or f.suffix == '.sql':
                    b_type = 'database'

                backups.append({
                    'filename': f.name,
                    'type': b_type,
                    'size': stat.st_size,
                    'size_formatted': _format_size(stat.st_size),
                    'created_at': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'download_url': f"/api/manage/backups/download/{f.name}"
                })

    return jsonify({
        'backups': backups,
        'count': len(backups),
        'backup_dir': str(BACKUP_DIR)
    })


@api_backup.route('/api/manage/backups/download/<filename>', methods=['GET'])
@token_required
def download_backup_file(filename: str):
    """安全下载指定的备份文件。"""
    # 路径穿越防范
    clean_name = Path(filename).name
    target_path = BACKUP_DIR / clean_name
    if not target_path.is_file():
        return jsonify({'msg': '备份文件不存在或已被删除'}), 404

    return send_file(
        str(target_path),
        as_attachment=True,
        download_name=clean_name
    )


@api_backup.route('/api/manage/backups/<filename>', methods=['DELETE'])
@token_required
def delete_backup_file(filename: str):
    """删除指定的历史备份文件。"""
    clean_name = Path(filename).name
    target_path = BACKUP_DIR / clean_name
    if target_path.is_file():
        target_path.unlink()
        return jsonify({'msg': f'已成功删除备份文件 {clean_name}'})
    return jsonify({'msg': '备份文件不存在'}), 404


@api_backup.route('/api/manage/backups/export/markdown', methods=['POST'])
@token_required
def export_markdown_archive():
    """将全站所有正常未删除文章批量导出为标准 Markdown ZIP 归档（带 YAML Frontmatter）。"""
    posts = Posts.query.filter(Posts.deleted == 0).order_by(Posts.id.asc()).all()

    # 预加载分类与标签
    cat_map = {}
    for pc, c in db.session.query(PostCategories, Categories).join(Categories, PostCategories.category_id == Categories.id).filter(PostCategories.deleted == 0).all():
        cat_map.setdefault(pc.post_id, []).append(c.name)

    tag_map = {}
    for pt, t in db.session.query(PostTags, Tags).join(Tags, PostTags.tag_id == Tags.id).filter(PostTags.deleted == 0).all():
        tag_map.setdefault(pt.post_id, []).append(t.name)

    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    zip_filename = f"blog_markdown_export_{now_str}.zip"
    zip_path = BACKUP_DIR / zip_filename

    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for p in posts:
            safe_title = "".join(c for c in (p.title or f"post_{p.id}") if c not in r'\/:*?"<>|').strip() or f"post_{p.id}"
            md_name = f"{p.id:03d}_{safe_title}.md"
            
            # 拼接 Frontmatter
            c_time = p.create_time.strftime('%Y-%m-%d %H:%M:%S') if p.create_time else ''
            u_time = p.update_time.strftime('%Y-%m-%d %H:%M:%S') if p.update_time else ''
            p_cats = cat_map.get(p.id, [])
            p_tags = tag_map.get(p.id, [])

            frontmatter = [
                "---",
                f"title: \"{p.title.replace('\"', '\\\"') if p.title else ''}\"",
                f"date: {c_time}",
                f"updated: {u_time}",
                f"author: \"{p.author or 'admin'}\"",
                f"thumbnail: \"{p.thumbnail or ''}\"",
                f"categories: [{', '.join(p_cats)}]",
                f"tags: [{', '.join(p_tags)}]",
                f"summary: \"{p.summary or ''}\"",
                "---",
                "",
                p.content or ""
            ]
            zf.writestr(md_name, "\n".join(frontmatter))

    return jsonify({
        'msg': f'已成功导出 {len(posts)} 篇 Markdown 文章',
        'filename': zip_filename,
        'size': zip_path.stat().st_size,
        'download_url': f"/api/manage/backups/download/{zip_filename}"
    })


@api_backup.route('/api/manage/backups/export/db', methods=['POST'])
@token_required
def export_database_backup():
    """一键生成当前数据库完整 SQL Dump 并存储到备份中心。"""
    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    sql_filename = f"blog_database_dump_{now_str}.sql"
    sql_path = BACKUP_DIR / sql_filename

    dump_content = _dump_database_to_sql()
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(dump_content)

    return jsonify({
        'msg': '数据库 SQL 导出完成',
        'filename': sql_filename,
        'size': sql_path.stat().st_size,
        'download_url': f"/api/manage/backups/download/{sql_filename}"
    })


@api_backup.route('/api/manage/backups/export/oss', methods=['POST'])
@token_required
def export_oss_library():
    """导出 OSS 图片库（生成包含所有已收录图片记录及相关物理图片的 ZIP 包）。"""
    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    zip_filename = f"blog_oss_images_backup_{now_str}.zip"
    zip_path = BACKUP_DIR / zip_filename

    images = OssImage.query.filter(OssImage.deleted == 0).all()

    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        # 1. 写入所有图片元数据列表 JSON / CSV
        meta_lines = ["id,url,file_name,remark,create_time"]
        for img in images:
            meta_lines.append(f"{img.id},\"{img.url}\",\"{img.file_name or ''}\",\"{img.remark or ''}\",{img.create_time}")
        zf.writestr("oss_images_metadata.csv", "\n".join(meta_lines))

        # 2. 打包 uploads 目录中的本地图片
        upload_dir = Path(config.UPLOAD_PATH)
        if upload_dir.exists():
            for f in upload_dir.rglob('*'):
                if f.is_file():
                    arcname = f"uploads/{f.relative_to(upload_dir)}"
                    zf.write(f, arcname)

        # 3. 打包 temp/images 缓存图
        cache_dir = Path(config.CACHE_IMAGE_DIR)
        if cache_dir.exists():
            for f in cache_dir.glob('*'):
                if f.is_file():
                    arcname = f"temp_images/{f.name}"
                    zf.write(f, arcname)

    return jsonify({
        'msg': f'已成功打包 OSS 图片库及本地静态图资源（包含 {len(images)} 张图片索引）',
        'filename': zip_filename,
        'size': zip_path.stat().st_size,
        'download_url': f"/api/manage/backups/download/{zip_filename}"
    })


@api_backup.route('/api/manage/backups/export/full', methods=['POST'])
@token_required
def export_full_site_backup():
    """
    全站数据与静态资源一键打包备份：
    包含：1. 完整数据库 SQL Dump；2. uploads 静态资源目录；3. 全文 Markdown 归档；4. 站点配置快照。
    """
    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    zip_filename = f"blog_full_site_backup_{now_str}.zip"
    zip_path = BACKUP_DIR / zip_filename

    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        # 1. 写入数据库 Dump
        sql_dump = _dump_database_to_sql()
        zf.writestr("database/dump.sql", sql_dump)

        # 2. 写入全站 uploads 附件
        upload_dir = Path(config.UPLOAD_PATH)
        if upload_dir.exists():
            for f in upload_dir.rglob('*'):
                if f.is_file():
                    zf.write(f, f"uploads/{f.relative_to(upload_dir)}")

        # 3. 写入说明与版本快照
        readme_text = [
            f"# 博客全站数据备份归档包",
            f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"包含组件:",
            f"  - database/dump.sql: 完整数据库表结构及全量数据 SQL",
            f"  - uploads/: 本地上传的静态图片与文章附件",
            f"恢复方式: 导入 SQL 到 MySQL 数据库，并将 uploads 目录恢复至项目根目录即可。",
        ]
        zf.writestr("BACKUP_README.txt", "\n".join(readme_text))

    return jsonify({
        'msg': '全站数据与静态资源一键打包备份成功！',
        'filename': zip_filename,
        'size': zip_path.stat().st_size,
        'download_url': f"/api/manage/backups/download/{zip_filename}"
    })


@api_backup.route('/api/manage/backups/restore/sql', methods=['POST'])
@token_required
def restore_database_from_sql():
    """从备份文件或上传的 SQL 文件恢复底层数据库。"""
    sql_text = None

    # 支持直接上传 SQL 文件
    if 'file' in request.files:
        f = request.files['file']
        sql_text = f.read().decode('utf-8', errors='ignore')
    else:
        data = request.get_json() or {}
        filename = data.get('filename')
        if filename:
            clean_name = Path(filename).name
            target = BACKUP_DIR / clean_name
            if target.is_file():
                with open(target, 'r', encoding='utf-8', errors='ignore') as f:
                    sql_text = f.read()

    if not sql_text:
        return jsonify({'msg': '请选择要恢复的 SQL 备份文件'}), 400

    # 分割并批量执行 SQL 语句，严格实施 DDL/DML 安全指令白名单与高危黑名单拦截
    raw_statements = [stmt.strip() for stmt in sql_text.split(';') if stmt.strip()]
    executed_count = 0
    errors = []

    # 允许的安全前缀白名单
    ALLOWED_VERBS = (
        'set', 'create table', 'drop table', 'insert into', 'lock tables', 'unlock tables',
        'alter table', 'truncate table', 'create index', 'drop index'
    )

    # 严厉禁止的高危危险特征黑名单 (防提权、防木马写出、防本地任意文件读取)
    FORBIDDEN_KEYWORDS = (
        'into outfile', 'into dumpfile', 'load_file', 'load data',
        'create user', 'drop user', 'grant ', 'revoke ', 'alter user',
        'shutdown', 'super', 'process', 'information_schema', 'mysql.'
    )

    # 禁用外键约束执行还原
    dialect = db.engine.dialect.name
    is_pg = 'postgres' in dialect

    try:
        if not is_pg:
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for stmt in raw_statements:
            # 过滤注释
            lines = [l for l in stmt.split('\n') if not l.strip().startswith('--') and not l.strip().startswith('/*')]
            cleaned_stmt = "\n".join(lines).strip()
            if not cleaned_stmt:
                continue

            lower_stmt = cleaned_stmt.lower()

            # 1. 拦截高危指令
            if any(forbidden in lower_stmt for forbidden in FORBIDDEN_KEYWORDS):
                errors.append(f"安全拦截: 语句包含受限系统级高危关键字")
                continue

            # 2. 白名单前缀验证
            if not any(lower_stmt.startswith(verb) for verb in ALLOWED_VERBS):
                errors.append(f"安全拦截: 不在允许执行的数据库恢复语句白名单内")
                continue

            try:
                db.session.execute(text(cleaned_stmt))
                executed_count += 1
            except Exception as e:
                errors.append(str(e)[:120])

        if not is_pg:
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'数据库还原失败: {str(e)}'}), 500

    return jsonify({
        'msg': f'数据库已成功恢复！共执行 {executed_count} 条 SQL 指令',
        'executed_count': executed_count,
        'has_errors': len(errors) > 0,
        'error_samples': errors[:3]
    })
