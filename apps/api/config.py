from flask import Blueprint, request, jsonify
from apps.exts import db
from apps.models.model import Config
from apps.tools.tools import env
from .middleware import token_required

api_config = Blueprint('api_config', __name__)

@api_config.route('/api/config', methods=['GET'])
def get_config():
    configs = Config.query.all()
    config_dict = {c.name: c.value for c in configs}
    return jsonify(config_dict)

@api_config.route('/api/manage/config', methods=['PUT'])
@token_required
def update_config():
    data = request.get_json() or {}
    for name, value in data.items():
        if not name:
            continue
        conf = Config.query.filter_by(name=name).first()
        if conf:
            conf.value = str(value)
        else:
            new_conf = Config(name=name, value=str(value))
            db.session.add(new_conf)
    db.session.commit()
    
    # Return updated config
    configs = Config.query.all()
    config_dict = {c.name: c.value for c in configs}
    return jsonify(config_dict)

@api_config.route('/api/manage/env', methods=['GET'])
@token_required
def get_env():
    env_data = env()
    if 'datetime' in env_data:
        env_data['datetime'] = env_data['datetime'].isoformat()
    return jsonify(env_data)
