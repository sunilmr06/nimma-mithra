import os
from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    # Automatically create tables if not existing
    db.create_all()
    try:
        from app.models.user import User
        if not User.query.filter_by(role='admin').first():
            from seed import seed_database
            seed_database()
    except Exception as e:
        app.logger.warning(f"Auto-seed check: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
