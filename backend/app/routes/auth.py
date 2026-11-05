from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user import User
from app.utils.validators import is_valid_email, sanitize_string
from app.utils.decorators import jwt_required_custom

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Public student registration. Staff/Admin must be created by Admin.
    """
    data = request.get_json() or {}
    name = sanitize_string(data.get('name'), 100)
    email = sanitize_string(data.get('email', '')).lower()
    password = data.get('password')
    department = sanitize_string(data.get('department'), 100)
    phone = sanitize_string(data.get('phone'), 20)

    if not name or not email or not password:
        return jsonify({'error': 'Validation Error', 'message': 'Name, email, and password are required.'}), 400

    if not is_valid_email(email):
        return jsonify({'error': 'Validation Error', 'message': 'Invalid email format.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Validation Error', 'message': 'Password must be at least 6 characters.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Conflict', 'message': 'An account with this email already exists.'}), 409

    new_user = User(
        name=name,
        email=email,
        role='student',
        department=department or 'Undergraduate',
        phone=phone
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    token = create_access_token(identity=new_user.id)
    return jsonify({
        'message': 'Registration successful.',
        'access_token': token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Unified role-aware login for students, staff, and admins.
    """
    data = request.get_json() or {}
    email = sanitize_string(data.get('email', '')).lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Validation Error', 'message': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid email or password.'}), 401

    if not user.is_active:
        return jsonify({'error': 'Forbidden', 'message': 'Account is deactivated. Please contact an administrator.'}), 403

    token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'Login successful.',
        'access_token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required_custom
def get_current_user():
    return jsonify({'user': g.current_user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Client will clear stored token
    return jsonify({'message': 'Logged out successfully.'}), 200
