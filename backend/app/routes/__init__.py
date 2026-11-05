from app.routes.auth import auth_bp
from app.routes.complaints import complaints_bp
from app.routes.admin import admin_bp
from app.routes.staff import staff_bp
from app.routes.analytics import analytics_bp
from app.routes.campus import campus_bp

__all__ = [
    'auth_bp',
    'complaints_bp',
    'admin_bp',
    'staff_bp',
    'analytics_bp',
    'campus_bp'
]
