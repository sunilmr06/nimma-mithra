from flask import Blueprint, jsonify
from app.models.campus import Building, Floor, Room, Category

campus_bp = Blueprint('campus', __name__, url_prefix='/api/v1/campus')

@campus_bp.route('/hierarchy', methods=['GET'])
def get_hierarchy():
    """
    Returns full hierarchy of buildings, floors, rooms, and categories
    for instantaneous, responsive cascading selection in the UI.
    """
    buildings = Building.query.all()
    categories = Category.query.filter_by(is_active=True).all()

    building_list = [b.to_dict(include_floors=True) for b in buildings]
    category_list = [c.to_dict() for c in categories]

    return jsonify({
        'buildings': building_list,
        'categories': category_list
    }), 200

@campus_bp.route('/buildings', methods=['GET'])
def get_buildings():
    buildings = Building.query.all()
    return jsonify({'buildings': [b.to_dict() for b in buildings]}), 200

@campus_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.filter_by(is_active=True).all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200
