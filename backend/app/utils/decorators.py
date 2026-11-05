from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User

def jwt_required_custom(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            current_user = User.query.get(user_id)
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Unauthorized', 'message': 'User account inactive or not found.'}), 401
            g.current_user = current_user
        except Exception as e:
            return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required_custom
        def wrapper(*args, **kwargs):
            current_user = getattr(g, 'current_user', None)
            if not current_user or current_user.role not in allowed_roles:
                return jsonify({
                    'error': 'Forbidden',
                    'message': f'Access restricted. Requires one of roles: {", ".join(allowed_roles)}'
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
