from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.history import ComplaintStatusHistory, Notification
from app.services.assignment_service import AssignmentService
from app.services.priority_engine import PriorityEngine
from app.utils.decorators import role_required
from app.utils.validators import is_valid_email, sanitize_string

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')

@admin_bp.route('/complaints', methods=['GET'])
@role_required('admin')
def get_all_complaints():
    status = request.args.get('status')
    category_id = request.args.get('category_id')
    priority_level = request.args.get('priority_level')
    building_id = request.args.get('building_id')
    sort_by = request.args.get('sort_by', 'priority')

    query = Complaint.query

    if status and status != 'all':
        query = query.filter(Complaint.status == status)
    if category_id and category_id != 'all':
        query = query.filter(Complaint.category_id == category_id)
    if priority_level and priority_level != 'all':
        query = query.filter(Complaint.priority_level == priority_level)

    if sort_by == 'priority':
        query = query.order_by(db.desc(Complaint.priority_score), db.desc(Complaint.created_at))
    elif sort_by == 'severity':
        query = query.order_by(db.desc(Complaint.severity), db.desc(Complaint.created_at))
    else:
        query = query.order_by(db.desc(Complaint.created_at))

    complaints = query.all()
    for c in complaints:
        if c.status not in ['resolved']:
            PriorityEngine.update_complaint_priority(c)
    db.session.commit()

    return jsonify({
        'count': len(complaints),
        'complaints': [c.to_dict(include_details=True) for c in complaints]
    }), 200

@admin_bp.route('/complaints/<id>/acknowledge', methods=['PATCH'])
@role_required('admin')
def acknowledge_complaint(id):
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    old_status = complaint.status
    complaint.status = 'acknowledged'
    complaint.updated_at = datetime.utcnow()

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status='acknowledged',
        updated_by=g.current_user.id,
        remarks='Complaint reviewed and acknowledged by Administrator.'
    )
    db.session.add(history)

    # Notify student
    notif = Notification(
        user_id=complaint.student_id,
        complaint_id=complaint.id,
        title="Complaint Acknowledged",
        message=f"Your complaint #{complaint.complaint_number} has been acknowledged by administration."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'message': 'Complaint acknowledged successfully.',
        'complaint': complaint.to_dict()
    }), 200

@admin_bp.route('/complaints/<id>/assign', methods=['PATCH'])
@role_required('admin')
def assign_staff(id):
    data = request.get_json() or {}
    staff_id = data.get('staff_id')
    remarks = sanitize_string(data.get('remarks', ''))

    if not staff_id:
        return jsonify({'error': 'Validation Error', 'message': 'Staff ID is required.'}), 400

    try:
        assignment = AssignmentService.assign_complaint(
            complaint_id=id,
            staff_id=staff_id,
            admin_user=g.current_user,
            remarks=remarks
        )
        complaint = Complaint.query.get(id)
        return jsonify({
            'message': 'Complaint assigned successfully.',
            'complaint': complaint.to_dict(include_details=True),
            'assignment': assignment.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({'error': 'Bad Request', 'message': str(e)}), 400

@admin_bp.route('/complaints/<id>/severity', methods=['PATCH'])
@role_required('admin')
def update_severity(id):
    data = request.get_json() or {}
    severity = data.get('severity')
    try:
        severity = int(severity)
        if not (1 <= severity <= 5):
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'error': 'Validation Error', 'message': 'Severity must be an integer between 1 and 5.'}), 400

    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    old_sev = complaint.severity
    complaint.severity = severity
    complaint.updated_at = datetime.utcnow()

    # Recalculate priority
    priority_res = PriorityEngine.update_complaint_priority(complaint)

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=complaint.status,
        new_status=complaint.status,
        updated_by=g.current_user.id,
        remarks=f"Severity level updated from {old_sev} to {severity} by Administrator."
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'message': 'Complaint severity updated successfully.',
        'complaint': complaint.to_dict(),
        'priority_explanation': priority_res
    }), 200

@admin_bp.route('/complaints/<id>/reopen', methods=['PATCH'])
@role_required('admin')
def reopen_complaint(id):
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    data = request.get_json() or {}
    remarks = sanitize_string(data.get('remarks', 'Reopened by Administrator.'))

    old_status = complaint.status
    complaint.status = 'reopened'
    complaint.is_reopened = True
    complaint.resolved_at = None
    complaint.updated_at = datetime.utcnow()

    PriorityEngine.update_complaint_priority(complaint)

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status='reopened',
        updated_by=g.current_user.id,
        remarks=remarks
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'message': 'Complaint reopened successfully.',
        'complaint': complaint.to_dict()
    }), 200

@admin_bp.route('/complaints/<id>/approve-cost', methods=['PATCH'])
@role_required('admin')
def review_resolution_cost(id):
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    resolution = complaint.latest_resolution
    if not resolution:
        return jsonify({'error': 'Bad Request', 'message': 'No resolution record found for this complaint.'}), 400

    data = request.get_json() or {}
    approved = data.get('approved', True)
    remarks = sanitize_string(data.get('remarks', ''))

    resolution.is_cost_approved = bool(approved)
    resolution.cost_status = 'approved' if approved else 'rejected'
    resolution.cost_approved_by = g.current_user.id
    resolution.cost_approved_at = datetime.utcnow()

    # Create history entry
    status_str = "approved" if approved else "rejected"
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=complaint.status,
        new_status=complaint.status,
        updated_by=g.current_user.id,
        remarks=f"Resolution cost of ₹{resolution.cost_amount:.2f} {status_str} by Administrator {g.current_user.name}. {remarks}".strip()
    )
    db.session.add(history)

    # Notify staff who resolved it
    notif = Notification(
        user_id=resolution.staff_id,
        complaint_id=complaint.id,
        title=f"Repair Cost {status_str.title()}",
        message=f"Administrator {g.current_user.name} has {status_str} your submitted cost of ₹{resolution.cost_amount:.2f} for #{complaint.complaint_number}."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'message': f'Resolution cost {status_str} successfully.',
        'complaint': complaint.to_dict(include_details=True),
        'resolution': resolution.to_dict()
    }), 200

@admin_bp.route('/staff', methods=['GET'])
@role_required('admin')
def get_staff_list():
    workload = AssignmentService.get_staff_workload()
    return jsonify({'staff': workload}), 200

@admin_bp.route('/staff', methods=['POST'])
@role_required('admin')
def create_staff():
    data = request.get_json() or {}
    name = sanitize_string(data.get('name'), 100)
    email = sanitize_string(data.get('email', '')).lower()
    password = data.get('password')
    specialization = sanitize_string(data.get('specialization'), 100)
    department = sanitize_string(data.get('department'), 100)
    phone = sanitize_string(data.get('phone'), 20)

    if not name or not email or not password or not specialization:
        return jsonify({'error': 'Validation Error', 'message': 'Name, email, password, and specialization are required.'}), 400

    if not is_valid_email(email):
        return jsonify({'error': 'Validation Error', 'message': 'Invalid email format.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Conflict', 'message': 'An account with this email already exists.'}), 409

    new_staff = User(
        name=name,
        email=email,
        role='staff',
        specialization=specialization,
        department=department or 'Maintenance & Facilities',
        phone=phone
    )
    new_staff.set_password(password)

    db.session.add(new_staff)
    db.session.commit()

    return jsonify({
        'message': 'Staff account created successfully.',
        'staff': new_staff.to_dict()
    }), 201

@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_users():
    role = request.args.get('role')
    query = User.query
    if role and role != 'all':
        query = query.filter_by(role=role)
    users = query.order_by(db.desc(User.created_at)).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200
