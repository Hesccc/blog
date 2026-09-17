import datetime
import jwt
from flask import Blueprint, request, jsonify, current_app, g
from apps.exts import db
from apps.models.model import User
from apps.tools.tools import verify_and_upgrade_password, generate_password
from .middleware import token_required

api_auth = Blueprint('api_auth', __name__)

@api_auth.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'msg': 'Username and password are required!'}), 400
        
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'msg': 'User not found!'}), 400
        
    if not verify_and_upgrade_password(user, password, db.session):
        return jsonify({'msg': 'Incorrect password!'}), 400
        
    # Generate JWT token using timezone-aware UTC datetime
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    pwd_ts = int(user.update_time.timestamp()) if user.update_time else int(user.create_time.timestamp()) if user.create_time else 0
    token = jwt.encode({
        'username': user.username,
        'pwd_ts': pwd_ts,
        'exp': now_utc + datetime.timedelta(days=1)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'username': user.username,
        'name': user.name,
        'email': user.email
    })

@api_auth.route('/api/auth/me', methods=['GET'])
@token_required
def me():
    return jsonify({
        'username': g.current_user.username,
        'name': g.current_user.name,
        'email': g.current_user.email,
        'description': g.current_user.description
    })

@api_auth.route('/api/manage/user/password', methods=['PUT'])
@token_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not old_password or not new_password:
        return jsonify({'msg': '原密码与新密码均不能为空'}), 400

    if len(new_password) < 8:
        return jsonify({'msg': '新密码长度至少需要 8 位'}), 400

    user = g.current_user
    if not verify_and_upgrade_password(user, old_password, db.session):
        return jsonify({'msg': '原密码错误，请核对后重试'}), 400

    user.password = generate_password(new_password)
    user.update_time = datetime.datetime.now()
    db.session.commit()

    return jsonify({'msg': '密码修改成功，请使用新密码重新登录'})

