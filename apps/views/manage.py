from flask import Blueprint, render_template, request, session, url_for, redirect
from ..models.model import *
from ..tools.tools import *

blue_manage = Blueprint("blue_manage", __name__)


@blue_manage.route('/manage', methods=['GET', 'POST'])
def manage():
    title = Config.query.filter_by(name="website_title").first()
    if request.method == "GET":
        return render_template("manage/login.html", website_title=title.value)
    elif request.method == "POST":
        username = request.form.get('username')
        password = pwd_convert(request.form.get('password'))
        login_status = User.query.filter_by(username=username, password=password).count()  # 查找数据库中是有记录， 有为1 没有为0

        if login_status == 1:
            # 设置session
            session['username'] = username
            session.permanent = True  # 长期有效
            history = History(username=username, time=datetime.now(), type="login")

            # 提交插入
            db.session.add(history)
            db.session.commit()

            return redirect(url_for('blue_manage.admin'))
        else:
            return render_template('manage/login.html', msg="账号或密码错误!")


@blue_manage.route('/admin', methods=['GET', 'POST'])
@auth
def admin():
    if request.method == 'GET':
        title = Config.query.filter_by(name="website_title").first()
        obj = History.query.filter_by(username=session.get("username")).order_by(History.id.desc()).first()

        data = env()
        data['server_ip'] = request.environ.get('SERVER_NAME')
        data['server_port'] = request.environ.get('SERVER_PORT')
        data['username'] = obj.username
        data['website_title'] = title.value
        data['login_time'] = obj.time
        print(data)
        return render_template("manage/admin.html", **data)


@blue_manage.route('/user', methods=['GET', 'POST'])
@auth
def user():
    if request.method == 'GET':
        title = Config.query.filter_by(name="website_title").first()
        return render_template("manage/user.html", website_title=title.value)


@blue_manage.route('/logout', methods=['GET'])
@auth
def logout():
    response = redirect('/')
    session.clear()
    return response
