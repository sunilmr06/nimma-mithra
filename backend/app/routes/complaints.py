import os
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.complaint import Complaint, ComplaintSupport, ComplaintDuplicate
from app.models.campus import Room, Category
from app.models.history import ComplaintStatusHistory
from app.services.duplicate_detector import DuplicateDetector
from app.services.priority_engine import PriorityEngine
from app.services.storage_service import StorageService
from app.utils.decorators import jwt_required_custom, role_required
from app.utils.validators import sanitize_string

complaints_bp = Blueprint('complaints', __name__, url_prefix='/api/v1/complaints')

def generate_complaint_number():
    year = datetime.utcnow().strftime('%Y')
    count = Complaint.query.count() + 1
    return f"CC-{year}-{count:04d}"

@complaints_bp.route('/check-duplicates', methods=['POST'])
@jwt_required_custom
def check_duplicates():
    """
    Module 3: Pre-submission duplicate detection.
    Never blocks submission; returns list of similar complaints.
    """
    data = request.get_json() or {}
    title = sanitize_string(data.get('title'), 200)
    description = sanitize_string(data.get('description'), 2000)
    category_id = data.get('category_id')
    room_id = data.get('room_id')

    if not title or not description or not category_id or not room_id:
        return jsonify({'error': 'Validation Error', 'message': 'Title, description, category, and room are required.'}), 400

    duplicates = DuplicateDetector.find_duplicates(
        title=title,
        description=description,
        category_id=category_id,
        room_id=room_id,
        min_threshold=65.0
    )

    return jsonify({
        'found_duplicates': len(duplicates) > 0,
        'count': len(duplicates),
        'duplicates': duplicates
    }), 200

@complaints_bp.route('', methods=['POST'])
@jwt_required_custom
def create_complaint():
    """
    Module 2: Submit a complaint.
    Supports either JSON payload or multipart/form-data with image upload.
    """
    current_user = g.current_user
    
    # Handle form data or JSON
    if request.is_json:
        data = request.get_json() or {}
        image_url = data.get('image_url')
    else:
        data = request.form.to_dict()
        image_file = request.files.get('photograph') or request.files.get('image')
        image_url = None
        if image_file:
            try:
                image_url = StorageService.upload_image(image_file, folder="complaints")
            except Exception as e:
                return jsonify({'error': 'Upload Error', 'message': str(e)}), 400

    title = sanitize_string(data.get('title'), 200)
    description = sanitize_string(data.get('description'), 4000)
    category_id = data.get('category_id')
    room_id = data.get('room_id')
    severity = int(data.get('severity', 3))

    if not title or not description or not category_id or not room_id:
        return jsonify({'error': 'Validation Error', 'message': 'Title, description, category, and room are required.'}), 400

    # Validate room and category existence
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'error': 'Validation Error', 'message': 'Selected room is invalid.'}), 400

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Validation Error', 'message': 'Selected category is invalid.'}), 400

    complaint_num = generate_complaint_number()

    new_complaint = Complaint(
        complaint_number=complaint_num,
        student_id=current_user.id,
        category_id=category_id,
        room_id=room_id,
        title=title,
        description=description,
        image_url=image_url,
        severity=severity,
        status='submitted',
        affected_users_count=1,
        created_at=datetime.utcnow()
    )

    # Initial priority calculation
    priority_res = PriorityEngine.calculate_priority(
        severity=new_complaint.severity,
        affected_users=1,
        created_at=new_complaint.created_at,
        title=new_complaint.title,
        description=new_complaint.description
    )
    new_complaint.priority_score = priority_res['priority_score']
    new_complaint.priority_level = priority_res['priority_level']

    db.session.add(new_complaint)
    db.session.flush()  # Generate complaint ID

    # Record initial status in history
    history = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        old_status=None,
        new_status='submitted',
        updated_by=current_user.id,
        remarks='Complaint submitted by student.'
    )
    db.session.add(history)

    # Check and log duplicate relationships if user submitted anyway
    duplicates = DuplicateDetector.find_duplicates(
        title=title,
        description=description,
        category_id=category_id,
        room_id=room_id,
        exclude_complaint_id=new_complaint.id,
        min_threshold=50.0
    )

    for dup in duplicates:
        dup_record = ComplaintDuplicate(
            complaint_id=new_complaint.id,
            similar_complaint_id=dup['complaint_id'],
            similarity_score=dup['similarity_score'],
            detection_reason={
                'interpretation': dup['interpretation'],
                'reasons': dup['reasons'],
                'breakdown': dup['breakdown']
            }
        )
        db.session.add(dup_record)

    db.session.commit()

    return jsonify({
        'message': 'Complaint submitted successfully.',
        'complaint': new_complaint.to_dict(include_details=True, current_user_id=current_user.id),
        'priority_explanation': priority_res
    }), 201

@complaints_bp.route('', methods=['GET'])
@jwt_required_custom
def list_complaints():
    current_user = g.current_user
    status = request.args.get('status')
    category_id = request.args.get('category_id')
    priority_level = request.args.get('priority_level')
    building_id = request.args.get('building_id')
    search = request.args.get('search')
    sort_by = request.args.get('sort_by', 'priority')  # 'priority', 'date', 'severity'

    query = Complaint.query

    if status and status != 'all':
        query = query.filter(Complaint.status == status)

    if category_id and category_id != 'all':
        query = query.filter(Complaint.category_id == category_id)

    if priority_level and priority_level != 'all':
        query = query.filter(Complaint.priority_level == priority_level)

    if building_id and building_id != 'all':
        query = query.join(Room).join(Room.floor).filter_by(building_id=building_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            db.or_(
                Complaint.title.ilike(search_filter),
                Complaint.description.ilike(search_filter),
                Complaint.complaint_number.ilike(search_filter)
            )
        )

    # Sorting
    if sort_by == 'priority':
        query = query.order_by(db.desc(Complaint.priority_score), db.desc(Complaint.created_at))
    elif sort_by == 'severity':
        query = query.order_by(db.desc(Complaint.severity), db.desc(Complaint.created_at))
    else:
        query = query.order_by(db.desc(Complaint.created_at))

    complaints = query.all()

    # Recalculate priority scores dynamically on fetch to ensure pending time points stay fresh!
    for c in complaints:
        if c.status not in ['resolved']:
            PriorityEngine.update_complaint_priority(c)
    db.session.commit()

    return jsonify({
        'count': len(complaints),
        'complaints': [c.to_dict(current_user_id=current_user.id) for c in complaints]
    }), 200

@complaints_bp.route('/my', methods=['GET'])
@jwt_required_custom
def my_complaints():
    """
    Returns complaints submitted by current student.
    """
    current_user = g.current_user
    complaints = Complaint.query.filter_by(student_id=current_user.id).order_by(db.desc(Complaint.created_at)).all()
    
    for c in complaints:
        if c.status not in ['resolved']:
            PriorityEngine.update_complaint_priority(c)
    db.session.commit()

    return jsonify({
        'count': len(complaints),
        'complaints': [c.to_dict(current_user_id=current_user.id) for c in complaints]
    }), 200

@complaints_bp.route('/<id>', methods=['GET'])
@jwt_required_custom
def get_complaint(id):
    current_user = g.current_user
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    # Calculate dynamic priority breakdown
    priority_details = PriorityEngine.calculate_priority(
        severity=complaint.severity,
        affected_users=complaint.affected_users_count,
        created_at=complaint.created_at,
        title=complaint.title,
        description=complaint.description
    )

    # Keep stored score aligned
    complaint.priority_score = priority_details['priority_score']
    complaint.priority_level = priority_details['priority_level']
    db.session.commit()

    data = complaint.to_dict(include_details=True, current_user_id=current_user.id)
    data['priority_details'] = priority_details

    return jsonify({'complaint': data}), 200

@complaints_bp.route('/<id>/support', methods=['POST'])
@jwt_required_custom
def support_complaint(id):
    """
    Module 3 / Module 4: Student supports an existing complaint.
    Bumps affected users count and recalculates priority score immediately.
    """
    current_user = g.current_user
    if current_user.role != 'student':
        return jsonify({'error': 'Forbidden', 'message': 'Only students can support complaints.'}), 403

    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    if complaint.student_id == current_user.id:
        return jsonify({'error': 'Bad Request', 'message': 'You cannot support your own complaint.'}), 400

    existing_support = ComplaintSupport.query.filter_by(complaint_id=complaint.id, user_id=current_user.id).first()
    if existing_support:
        return jsonify({'error': 'Conflict', 'message': 'You have already supported this complaint.'}), 409

    support = ComplaintSupport(
        complaint_id=complaint.id,
        user_id=current_user.id
    )
    db.session.add(support)

    # Recalculate affected users: creator (1) + unique supporters
    complaint.affected_users_count = 1 + complaint.supports.count() + 1
    
    # Recalculate priority
    priority_res = PriorityEngine.update_complaint_priority(complaint)
    complaint.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Successfully supported complaint.',
        'complaint': complaint.to_dict(current_user_id=current_user.id),
        'priority_explanation': priority_res
    }), 200

@complaints_bp.route('/<id>/support', methods=['DELETE'])
@jwt_required_custom
def remove_support(id):
    current_user = g.current_user
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    support = ComplaintSupport.query.filter_by(complaint_id=complaint.id, user_id=current_user.id).first()
    if not support:
        return jsonify({'error': 'Bad Request', 'message': 'Support record not found.'}), 400

    db.session.delete(support)
    db.session.flush()

    complaint.affected_users_count = max(1, 1 + complaint.supports.count())
    PriorityEngine.update_complaint_priority(complaint)
    complaint.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Support removed successfully.',
        'complaint': complaint.to_dict(current_user_id=current_user.id)
    }), 200

@complaints_bp.route('/<id>/history', methods=['GET'])
@jwt_required_custom
def get_complaint_history(id):
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    history = [h.to_dict() for h in complaint.status_history.order_by('created_at').all()]
    return jsonify({'history': history}), 200
