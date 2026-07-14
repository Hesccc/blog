from flask import Blueprint, request, jsonify, g
from datetime import datetime
from apps.exts import db
from apps.models.model import Posts, Categories, Tags, PostTags, PostCategories
from .middleware import token_required

api_posts = Blueprint('api_posts', __name__)

def serialize_post(post):
    # Fetch categories for this post
    categories = db.session.query(Categories).join(PostCategories, Categories.id == PostCategories.category_id)\
        .filter(PostCategories.post_id == post.id, PostCategories.deleted == 0, Categories.deleted == 0).all()
    # Fetch tags for this post
    tags = db.session.query(Tags).join(PostTags, Tags.id == PostTags.tag_id)\
        .filter(PostTags.post_id == post.id, PostTags.deleted == 0, Tags.deleted == 0).all()
        
    return {
        'id': post.id,
        'title': post.title,
        'author': post.author,
        'content': post.content,
        'access_count': post.access_count,
        'thumbnail': post.thumbnail,
        'status': post.status,
        'create_time': post.create_time.isoformat() if post.create_time else None,
        'update_time': post.update_time.isoformat() if post.update_time else None,
        'meta_description': post.meta_description,
        'categories': [{'id': c.id, 'name': c.name, 'slug': c.slug, 'color': c.color} for c in categories],
        'tags': [{'id': t.id, 'name': t.name, 'slug': t.slug, 'color': t.color} for t in tags]
    }

# ----------------- PUBLIC ENDPOINTS -----------------

@api_posts.route('/api/posts', methods=['GET'])
def get_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category_slug = request.args.get('category')
    tag_slug = request.args.get('tag')
    search = request.args.get('search')
    
    query = Posts.query.filter(Posts.deleted == 0, Posts.status == 0)
    
    if category_slug:
        query = query.join(PostCategories, Posts.id == PostCategories.post_id)\
                     .join(Categories, Categories.id == PostCategories.category_id)\
                     .filter(Categories.slug == category_slug, PostCategories.deleted == 0, Categories.deleted == 0)
                     
    if tag_slug:
        query = query.join(PostTags, Posts.id == PostTags.post_id)\
                     .join(Tags, Tags.id == PostTags.tag_id)\
                     .filter(Tags.slug == tag_slug, PostTags.deleted == 0, Tags.deleted == 0)
                     
    if search:
        query = query.filter(Posts.title.like(f'%{search}%') | Posts.content.like(f'%{search}%'))
        
    # Order by create_time descending
    query = query.order_by(Posts.create_time.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'posts': [serialize_post(p) for p in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    })

@api_posts.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_detail(post_id):
    post = Posts.query.filter(Posts.id == post_id, Posts.deleted == 0, Posts.status == 0).first_or_404()
    
    # Increment access count
    post.access_count = (post.access_count or 0) + 1
    db.session.commit()
    
    return jsonify(serialize_post(post))

@api_posts.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Categories.query.filter(Categories.deleted == 0).order_by(Categories.priority.desc(), Categories.id.asc()).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'slug': c.slug,
        'description': c.description,
        'color': c.color,
        'parent_id': c.parent_id
    } for c in categories])

@api_posts.route('/api/tags', methods=['GET'])
def get_tags():
    tags = Tags.query.filter(Tags.deleted == 0).order_by(Tags.id.asc()).all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'slug': t.slug,
        'color': t.color
    } for t in tags])

# ----------------- ADMIN ENDPOINTS -----------------

@api_posts.route('/api/manage/posts', methods=['GET'])
@token_required
def manage_get_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search')
    
    query = Posts.query.filter(Posts.deleted == 0)
    if search:
        query = query.filter(Posts.title.like(f'%{search}%'))
        
    query = query.order_by(Posts.create_time.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'posts': [serialize_post(p) for p in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })

@api_posts.route('/api/manage/posts/<int:post_id>', methods=['GET'])
@token_required
def manage_get_post_detail(post_id):
    post = Posts.query.filter(Posts.id == post_id, Posts.deleted == 0).first_or_404()
    return jsonify(serialize_post(post))

@api_posts.route('/api/manage/posts', methods=['POST'])
@token_required
def manage_create_post():
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content', '')
    status = data.get('status', 0)  # 0: published, 3: draft
    category_id = data.get('category_id')
    tag_ids = data.get('tag_ids', [])
    thumbnail = data.get('thumbnail')
    meta_description = data.get('meta_description')
    
    if not title:
        return jsonify({'msg': 'Title is required!'}), 400
        
    new_post = Posts(
        title=title,
        content=content,
        author=g.current_user.username,
        access_count=0,
        thumbnail=thumbnail,
        status=status,
        meta_description=meta_description or (content[:150] if content else ''),
        deleted=0,
        create_time=datetime.now(),
        update_time=datetime.now()
    )
    db.session.add(new_post)
    db.session.flush()  # Generates new_post.id
    
    if category_id:
        post_cat = PostCategories(post_id=new_post.id, category_id=category_id, deleted=0, create_time=datetime.now(), update_time=datetime.now())
        db.session.add(post_cat)
        
    if tag_ids:
        for tag_id in tag_ids:
            post_tag = PostTags(post_id=new_post.id, tag_id=tag_id, deleted=0, create_time=datetime.now(), update_time=datetime.now())
            db.session.add(post_tag)
            
    db.session.commit()
    return jsonify(serialize_post(new_post)), 217

@api_posts.route('/api/manage/posts/<int:post_id>', methods=['PUT'])
@token_required
def manage_update_post(post_id):
    post = Posts.query.filter(Posts.id == post_id, Posts.deleted == 0).first_or_404()
    
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    status = data.get('status')
    category_id = data.get('category_id')
    tag_ids = data.get('tag_ids')
    _SENTINEL = object()
    thumbnail = data.get('thumbnail', _SENTINEL)
    meta_description = data.get('meta_description')
    
    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
        if meta_description is None:
            post.meta_description = content[:150]
    if status is not None:
        post.status = status
    # thumbnail 字段：传字符串则更新，传 null 则清空，不传则不修改
    if thumbnail is not _SENTINEL:
        post.thumbnail = thumbnail  # None 也合法，代表清空
    if meta_description is not None:
        post.meta_description = meta_description
        
    post.update_time = datetime.now()
    
    # Update category relations
    if category_id is not None:
        # Delete old category relations
        PostCategories.query.filter(PostCategories.post_id == post.id).delete()
        if category_id:
            post_cat = PostCategories(post_id=post.id, category_id=category_id, deleted=0, create_time=datetime.now(), update_time=datetime.now())
            db.session.add(post_cat)
            
    # Update tag relations
    if tag_ids is not None:
        # Delete old tag relations
        PostTags.query.filter(PostTags.post_id == post.id).delete()
        for tag_id in tag_ids:
            post_tag = PostTags(post_id=post.id, tag_id=tag_id, deleted=0, create_time=datetime.now(), update_time=datetime.now())
            db.session.add(post_tag)
            
    db.session.commit()
    return jsonify(serialize_post(post))

@api_posts.route('/api/manage/posts/<int:post_id>', methods=['DELETE'])
@token_required
def manage_delete_post(post_id):
    post = Posts.query.filter(Posts.id == post_id, Posts.deleted == 0).first_or_404()
    post.deleted = 1
    post.update_time = datetime.now()
    
    # Also soft delete relations
    PostCategories.query.filter(PostCategories.post_id == post_id).update({PostCategories.deleted: 1})
    PostTags.query.filter(PostTags.post_id == post_id).update({PostTags.deleted: 1})
    
    db.session.commit()
    return jsonify({'msg': 'Post deleted successfully!'})

# ----------------- CATEGORY & TAG MANAGEMENT -----------------

@api_posts.route('/api/manage/categories', methods=['POST'])
@token_required
def manage_create_category():
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug')
    description = data.get('description', '')
    color = data.get('color', '#41baff')
    parent_id = data.get('parent_id', 0)
    
    if not name or not slug:
        return jsonify({'msg': 'Name and slug are required!'}), 400
        
    # Check if slug exists
    exists = Categories.query.filter(Categories.slug == slug, Categories.deleted == 0).first()
    if exists:
        return jsonify({'msg': 'Category slug already exists!'}), 400
        
    cat = Categories(
        name=name,
        slug=slug,
        description=description,
        color=color,
        parent_id=parent_id,
        deleted=0,
        create_time=datetime.now(),
        update_time=datetime.now()
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({
        'id': cat.id,
        'name': cat.name,
        'slug': cat.slug,
        'description': cat.description,
        'color': cat.color,
        'parent_id': cat.parent_id
    }), 217

@api_posts.route('/api/manage/categories/<int:cat_id>', methods=['PUT'])
@token_required
def manage_update_category(cat_id):
    cat = Categories.query.filter(Categories.id == cat_id, Categories.deleted == 0).first_or_404()
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug')
    description = data.get('description')
    color = data.get('color')
    parent_id = data.get('parent_id')
    
    if name is not None:
        cat.name = name
    if slug is not None:
        # Check slug uniqueness
        exists = Categories.query.filter(Categories.slug == slug, Categories.id != cat_id, Categories.deleted == 0).first()
        if exists:
            return jsonify({'msg': 'Category slug already exists!'}), 400
        cat.slug = slug
    if description is not None:
        cat.description = description
    if color is not None:
        cat.color = color
    if parent_id is not None:
        cat.parent_id = parent_id
        
    cat.update_time = datetime.now()
    db.session.commit()
    return jsonify({
        'id': cat.id,
        'name': cat.name,
        'slug': cat.slug,
        'description': cat.description,
        'color': cat.color,
        'parent_id': cat.parent_id
    })

@api_posts.route('/api/manage/categories/<int:cat_id>', methods=['DELETE'])
@token_required
def manage_delete_category(cat_id):
    cat = Categories.query.filter(Categories.id == cat_id, Categories.deleted == 0).first_or_404()
    cat.deleted = 1
    cat.update_time = datetime.now()
    db.session.commit()
    return jsonify({'msg': 'Category deleted successfully!'})

@api_posts.route('/api/manage/tags', methods=['POST'])
@token_required
def manage_create_tag():
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug')
    color = data.get('color', '#41baff')
    
    if not name or not slug:
        return jsonify({'msg': 'Name and slug are required!'}), 400
        
    # Check if slug exists
    exists = Tags.query.filter(Tags.slug == slug, Tags.deleted == 0).first()
    if exists:
        return jsonify({'msg': 'Tag slug already exists!'}), 400
        
    tag = Tags(
        name=name,
        slug=slug,
        color=color,
        deleted=0,
        create_time=datetime.now(),
        update_time=datetime.now()
    )
    db.session.add(tag)
    db.session.commit()
    return jsonify({
        'id': tag.id,
        'name': tag.name,
        'slug': tag.slug,
        'color': tag.color
    }), 217

@api_posts.route('/api/manage/tags/<int:tag_id>', methods=['PUT'])
@token_required
def manage_update_tag(tag_id):
    tag = Tags.query.filter(Tags.id == tag_id, Tags.deleted == 0).first_or_404()
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug')
    color = data.get('color')
    
    if name is not None:
        tag.name = name
    if slug is not None:
        exists = Tags.query.filter(Tags.slug == slug, Tags.id != tag_id, Tags.deleted == 0).first()
        if exists:
            return jsonify({'msg': 'Tag slug already exists!'}), 400
        tag.slug = slug
    if color is not None:
        tag.color = color
        
    tag.update_time = datetime.now()
    db.session.commit()
    return jsonify({
        'id': tag.id,
        'name': tag.name,
        'slug': tag.slug,
        'color': tag.color
    })

@api_posts.route('/api/manage/tags/<int:tag_id>', methods=['DELETE'])
@token_required
def manage_delete_tag(tag_id):
    tag = Tags.query.filter(Tags.id == tag_id, Tags.deleted == 0).first_or_404()
    tag.deleted = 1
    tag.update_time = datetime.now()
    db.session.commit()
    return jsonify({'msg': 'Tag deleted successfully!'})
