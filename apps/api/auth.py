import datetime
import jwt
from flask import Blueprint, request, jsonify, current_app, g
from apps.models.model import User
from apps.tools.tools import pwd_convert
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
        
    hashed_password = pwd_convert(password)
    if user.password != hashed_password:
        return jsonify({'msg': 'Incorrect password!'}), 400
        
    # Generate JWT token
    token = jwt.encode({
        'username': user.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
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
