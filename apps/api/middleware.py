from functools import wraps
import jwt
from flask import request, jsonify, current_app, g
from apps.models.model import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'msg': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(username=data['username']).first()
            if not current_user:
                return jsonify({'msg': 'User not found!'}), 401

            # 校验 Token 签发时的密码版本时间戳，如果密码已被修改，历史 Token 立即作废
            token_pwd_ts = data.get('pwd_ts')
            if token_pwd_ts is not None:
                current_pwd_ts = int(current_user.update_time.timestamp()) if current_user.update_time else int(current_user.create_time.timestamp()) if current_user.create_time else 0
                # 容忍 1 秒以内的数据库保存微差
                if abs(current_pwd_ts - token_pwd_ts) > 1:
                    return jsonify({'msg': '密码已被修改，请重新登录！'}), 401

            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'msg': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'msg': 'Token is invalid!'}), 401
            
        return f(*args, **kwargs)
        
    return decorated
