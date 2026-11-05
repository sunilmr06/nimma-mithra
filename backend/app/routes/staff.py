from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.complaint import Complaint
from app.models.assignment import ComplaintAssignment
from app.models.history import ComplaintStatusHistory, ComplaintResolution, Notification
from app.services.storage_service import StorageService
from app.utils.decorators import role_required
from app.utils.validators import sanitize_string

staff_bp = Blueprint('staff', __name__, url_prefix='/api/v1/staff')

@staff_bp.route('/tasks', methods=['GET'])
@role_required('staff')
def get_assigned_tasks():
    current_staff = g.current_user
    status = request.args.get('status')

    # Query complaints that have an active assignment to this staff member
    query = Complaint.query.join(
        ComplaintAssignment, 
        (ComplaintAssignment.complaint_id == Complaint.id) & 
        (ComplaintAssignment.staff_id == current_staff.id) & 
        (ComplaintAssignment.is_active == True)
    )

    if status and status != 'all':
        query = query.filter(Complaint.status == status)

    tasks = query.order_by(db.desc(Complaint.priority_score)).all()

    return jsonify({
        'count': len(tasks),
        'tasks': [t.to_dict(include_details=True) for t in tasks]
    }), 200

@staff_bp.route('/tasks/<id>', methods=['GET'])
@role_required('staff')
def get_task_details(id):
    current_staff = g.current_user
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    # Verify staff assignment
    assignment = ComplaintAssignment.query.filter_by(
        complaint_id=complaint.id,
        staff_id=current_staff.id,
        is_active=True
    ).first()

    if not assignment and current_staff.role != 'admin':
        return jsonify({'error': 'Forbidden', 'message': 'You are not assigned to this complaint.'}), 403

    return jsonify({'task': complaint.to_dict(include_details=True)}), 200

@staff_bp.route('/tasks/<id>/status', methods=['PATCH'])
@role_required('staff')
def update_task_status(id):
    current_staff = g.current_user
    data = request.get_json() or {}
    new_status = data.get('status')
    remarks = sanitize_string(data.get('remarks', ''))

    allowed_statuses = ['in_progress', 'resolved']
    if new_status not in allowed_statuses:
        return jsonify({
            'error': 'Validation Error', 
            'message': f"Status can only be updated to: {', '.join(allowed_statuses)}"
        }), 400

    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    old_status = complaint.status
    complaint.status = new_status
    complaint.updated_at = datetime.utcnow()

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        updated_by=current_staff.id,
        remarks=remarks or f"Work status updated to {new_status} by {current_staff.name}."
    )
    db.session.add(history)

    # Notify student
    notif = Notification(
        user_id=complaint.student_id,
        complaint_id=complaint.id,
        title="Complaint Status Update",
        message=f"Maintenance for complaint #{complaint.complaint_number} is now '{new_status.replace('_', ' ').title()}'."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'message': f'Task status updated to {new_status}.',
        'task': complaint.to_dict(include_details=True)
    }), 200

@staff_bp.route('/tasks/<id>/resolution', methods=['POST'])
@role_required('staff')
def submit_resolution(id):
    current_staff = g.current_user
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Not Found', 'message': 'Complaint not found.'}), 404

    if request.is_json:
        data = request.get_json() or {}
        image_url = data.get('image_url')
    else:
        data = request.form.to_dict()
        image_file = request.files.get('photograph') or request.files.get('image')
        image_url = None
        if image_file:
            try:
                image_url = StorageService.upload_image(image_file, folder="resolutions")
            except Exception as e:
                return jsonify({'error': 'Upload Error', 'message': str(e)}), 400

    resolution_notes = sanitize_string(data.get('resolution_notes'), 2000)
    if not resolution_notes:
        return jsonify({'error': 'Validation Error', 'message': 'Resolution notes are required.'}), 400

    # Create resolution record
    resolution = ComplaintResolution(
        complaint_id=complaint.id,
        staff_id=current_staff.id,
        resolution_notes=resolution_notes,
        image_url=image_url,
        resolved_at=datetime.utcnow()
    )
    db.session.add(resolution)

    # Update complaint status
    old_status = complaint.status
    complaint.status = 'resolved'
    complaint.resolved_at = datetime.utcnow()
    complaint.updated_at = datetime.utcnow()

    # Record history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status='resolved',
        updated_by=current_staff.id,
        remarks=f"Resolved by {current_staff.name}. Notes: {resolution_notes}"
    )
    db.session.add(history)

    # Notify student
    notif = Notification(
        user_id=complaint.student_id,
        complaint_id=complaint.id,
        title="Issue Resolved!",
        message=f"Complaint #{complaint.complaint_number} has been resolved by {current_staff.name}."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'message': 'Issue resolved successfully.',
        'task': complaint.to_dict(include_details=True),
        'resolution': resolution.to_dict()
    }), 200
