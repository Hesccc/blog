from flask import Blueprint, render_template, request, session, url_for, redirect, make_response, jsonify
from ..models.model import *
from ..tools.tools import *
from sqlalchemy.sql import text

blue_manage = Blueprint("blue_manage", __name__)


@blue_manage.route('/manage', methods=['GET', 'POST'])
def manage():
    title = Config.query.filter_by(name="website_title").first()

    if request.method == "GET":
        return render_template("manage/m_login.html", website_title=title.value)

    elif request.method == "POST":
        username = request.form.get('user')
        password = request.form.get('pwd')
        password = pwd_convert(password)
        # 查找数据库中是有记录， 有为1 没有为0
        login_status = User.query.filter_by(username=username, password=password).count()

        if login_status == 1:
            # 设置session
            session['username'] = username
            session.permanent = True  # 长期有效

            # 记录登录日志
            history = History(username=username, time=datetime.now(), type="login")
            db.session.add(history)
            db.session.commit()
            db.session.close()

            return redirect(url_for('blue_manage.index'))
        else:
            return render_template('manage/m_login.html', msg="账号或密码错误!", website_title=title.value)


@blue_manage.route('/manage/index', methods=['GET', 'POST'])
@auth
def index():
    data = env()
    if request.method == 'GET':
        config = Config.query.all()
        for conf in config:
            data[conf.name] = conf.value
        # his = History.query.filter_by(username=session.get("username")).order_by(History.id.desc()).first()
        # user = User.query.filter_by(username=session.get("username")).first()

        # 多表联合查询,获取user和history的数据
        username, history = db.session.query(User, History).join(History, User.username == History.username). \
            filter(User.username == "admin"). \
            filter(History.type == "login"). \
            order_by(History.time.desc()).first()

        data['server_ip'] = request.environ.get('SERVER_NAME')
        data['server_port'] = request.environ.get('SERVER_PORT')
        data['name'] = username.name
        data['login_time'] = history.time
        return render_template("manage/m_index.html", **data)


# 用户信息修改
@blue_manage.route('/manage/user', methods=['GET', 'POST'])
@auth
def user():  # 修改用户资料
    # 获取网站标题
    title = Config.query.filter_by(name="website_title").first()

    if request.method == 'GET':
        users = User.query.all()
        return render_template("manage/m_user.html", website_title=title.value, users=users)
    elif request.method == 'POST':
        # 获取网页提交的数据
        username = request.form.get('username')
        email = request.form.get('email')
        name = request.form.get('name')
        desc = request.form.get('desc')

        old_pwd = pwd_convert(request.form.get('old_pwd'))
        new_pwd = pwd_convert(request.form.get('new_pwd'))
        users = User.query.filter_by(username=username).first()
        # 修改密码
        if old_pwd == users.password:
            users.password = new_pwd
            users.username = username
            users.name = name
            users.email = email
            users.desc = desc
            db.session.commit()  # 提交数据
            msg = "密码或资料修改成功！"
        else:
            msg = "密码或资料修改失败与旧密码不匹配！"

        users = User.query.all()
        return render_template("manage/m_user.html", website_title=title.value, users=users, msg=msg)


# 文章列表展示
@blue_manage.route('/manage/posts', methods=['GET', 'POST'])
@auth
def posts():
    if request.method == 'GET':
        title = Config.query.filter_by(name="website_title").first()  # 获取网站标题
        per_page = 10  # 每页显示的记录数
        page = request.args.get('page', 1, type=int)  # 获取URL参数中的页码，默认为第一页
        try:
            # 获取当前文章数据，查找deleted等于0的数据
            PostsData = Posts.query.filter(Posts.deleted == "0").paginate(page=page, per_page=per_page, error_out=False)

            # 获取文章标签信息
            TagsData = db.session.query(PostTags.post_id, Tags.name, Tags.slug, Tags.color). \
                join(Posts, Posts.id == PostTags.post_id). \
                join(Tags, Tags.id == PostTags.tag_id).filter(PostTags.deleted == 0).all()

            # 获取文章分类信息
            CategoriesData = db.session.query(PostCategories.post_id, Categories.name, Categories.slug,
                                              Categories.color). \
                join(Posts, Posts.id == PostCategories.post_id). \
                join(Categories, Categories.id == PostCategories.category_id).filter(PostCategories.deleted == 0).all()

            CategoriesDataList = db.session.query(Categories).all()
            TagsDataList = db.session.query(Tags).all()

        except Exception as E:
            TagsData = None
            PostsData = None
            CategoriesData = None
            CategoriesDataList = None
            TagsDataList = None
        return render_template("manage/m_post.html", website_title=title.value, posts=PostsData, tags=TagsData,
                               categories=CategoriesData, CategoriesDataList=CategoriesDataList,
                               TagsDataList=TagsDataList)

    elif request.method == "POST":
        PostsIDList = request.form.getlist("PostsID")
        ActionStatus = request.form.get("status")
        if ActionStatus is not None and ActionStatus == "delete":
            for PostsID in PostsIDList:
                Posts.query.filter(Posts.id == PostsID).update({Posts.deleted: 1})  # 文章表
                PostTags.query.filter(PostTags.post_id == PostsID).update({PostTags.deleted: 1})  # 文章与标签关联表
                PostCategories.query.filter(PostCategories.post_id == PostsID).update({PostTags.deleted: 1})  # 文章与分类关联表
                db.session.commit()
            return redirect('posts')
        # 文章状态,0:已发布,1:审核中,2:编辑中,3:草稿

        # 发布
        elif ActionStatus is not None and ActionStatus == "release":
            for PostsID in PostsIDList:
                Posts.query.filter(Posts.id == PostsID).update({Posts.status: 0})  # 文章表
                db.session.commit()
            return redirect('posts')

        # 草稿
        elif ActionStatus is not None and ActionStatus == "draft":
            for PostsID in PostsIDList:
                Posts.query.filter(Posts.id == PostsID).update({Posts.status: 3})  # 文章表
                db.session.commit()
            return redirect('posts')


# 文章编辑
@blue_manage.route('/manage/PostsEdit', methods=['GET', 'POST'])
@auth
def PostsEdit():
    pass


# 文章新增
@blue_manage.route('/manage/PostsInsert', methods=['GET', 'POST'])
@auth
def PostsInsert():
    if request.method == 'GET':
        title = Config.query.filter_by(name="website_title").first()  # 获取网站标题
        return render_template("manage/m_insert.html", website_title=title.value)


# 文章删除
@blue_manage.route('/manage/PostsDelete', methods=['GET', 'POST'])
@auth
def PostsDelete():
    if request.method == "POST":
        PostsIDList = request.form.getlist("PostsID")

        print(request.method)
        print(PostsIDList)
        return "PostsIDList"
        # for PostsID in PostsIDList:
        #     Posts.query.filter(Posts.id == PostsID).update({Posts.deleted: 1})  # 文章表
        #     PostTags.query.filter(PostTags.post_id == PostsID).update({PostTags.deleted: 1})  # 文章与标签关联表
        #     PostCategories.query.filter(PostCategories.post_id == PostsID).update({PostTags.deleted: 1})  # 文章与分类关联表
        #     db.session.commit()


# 修改博客系统设置
@blue_manage.route('/manage/system', methods=['GET', 'POST'])
@auth
def system():
    if request.method == 'GET':
        rows = Config.query.all()
        return render_template("manage/m_system.html", rows=rows)

    elif request.method == "POST":
        # 获取提交的数据
        website_title = request.form.get('website_title')
        website_url = request.form.get('website_url')
        website_keywords = request.form.get('website_keywords')
        website_desc = request.form.get('website_desc')
        website_icp = request.form.get('website_icp')

        # 修改数据
        Config.query.filter_by(name="website_title").update({Config.value: website_title})
        Config.query.filter_by(name="website_url").update({Config.value: website_url})
        Config.query.filter_by(name="website_keywords").update({Config.value: website_keywords})
        Config.query.filter_by(name="website_desc").update({Config.value: website_desc})
        Config.query.filter_by(name="website_icp").update({Config.value: website_icp})

        # 提交数据
        db.session.commit()

        # 返回数据
        return render_template("manage/m_system.html", rows=Config.query.all(), msg="修改成功")


# 分类管理
@blue_manage.route('/manage/categories', methods=['GET', 'POST'])
@auth
def categories():
    pass


# 标签管理
@blue_manage.route('/manage/tag', methods=['GET', 'POST'])
@auth
def tag():
    pass


# 评论管理
@blue_manage.route('/manage/comment', methods=['GET', 'POST'])
@auth
def comment():
    pass


# 链接管理
@blue_manage.route('/manage/links', methods=['GET', 'POST'])
@auth
def links():
   return render_template('manage/m_ioc.html')


# 账号注销功能
@blue_manage.route('/manage/logout', methods=['GET'])
@auth
def logout():
    # 获取注销用户
    username = session.get("username")

    # 记录登出日志
    history = History(username=username, time=datetime.now(), type="logout")
    db.session.add(history)
    db.session.commit()

    response = redirect('/')
    session.clear()
    return response


# 处理500和404错误
@blue_manage.errorhandler(500)
def handle_server_error(error):
    # 自定义错误处理逻辑
    return render_template("500.html"), 500


@blue_manage.errorhandler(400)
def handle_server_error(error):
    # 自定义错误处理逻辑
    return render_template("400.html"), 500
