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
            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'msg': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'msg': 'Token is invalid!'}), 401
            
        return f(*args, **kwargs)
        
    return decorated
