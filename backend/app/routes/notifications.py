from flask import Blueprint, jsonify, g
from app.extensions import db
from app.models.history import Notification
from app.utils.decorators import jwt_required_custom

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')

@notifications_bp.route('', methods=['GET'])
@jwt_required_custom
def get_user_notifications():
    """
    Get all notifications for the current authenticated user.
    """
    user_id = g.current_user.id
    notifications = Notification.query.filter_by(user_id=user_id)\
        .order_by(db.desc(Notification.created_at))\
        .limit(50)\
        .all()
    
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'count': len(notifications),
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifications]
    }), 200

@notifications_bp.route('/<id>/read', methods=['PATCH'])
@jwt_required_custom
def mark_notification_read(id):
    """
    Mark a single notification as read.
    """
    user_id = g.current_user.id
    notification = Notification.query.filter_by(id=id, user_id=user_id).first()
    if not notification:
        return jsonify({'error': 'Not Found', 'message': 'Notification not found.'}), 404

    notification.is_read = True
    db.session.commit()

    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'message': 'Notification marked as read.',
        'unread_count': unread_count,
        'notification': notification.to_dict()
    }), 200

@notifications_bp.route('/read-all', methods=['PATCH'])
@jwt_required_custom
def mark_all_notifications_read():
    """
    Mark all unread notifications for current user as read.
    """
    user_id = g.current_user.id
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify({
        'message': 'All notifications marked as read.',
        'unread_count': 0
    }), 200
