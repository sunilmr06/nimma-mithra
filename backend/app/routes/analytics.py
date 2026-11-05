from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app.extensions import db
from app.models.complaint import Complaint
from app.models.campus import Category, Building, Room
from app.models.assignment import ComplaintAssignment
from app.models.user import User
from app.services.assignment_service import AssignmentService
from app.utils.decorators import role_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/v1/analytics')

@analytics_bp.route('/summary', methods=['GET'])
@role_required('admin')
def get_summary():
    total_complaints = Complaint.query.count()
    pending_complaints = Complaint.query.filter(Complaint.status.in_(['submitted', 'acknowledged'])).count()
    ongoing_complaints = Complaint.query.filter(Complaint.status.in_(['assigned', 'in_progress', 'reopened'])).count()
    resolved_complaints = Complaint.query.filter_by(status='resolved').count()
    reopened_complaints = Complaint.query.filter_by(is_reopened=True).count()
    
    critical_issues = Complaint.query.filter(
        db.or_(Complaint.priority_level == 'critical', Complaint.severity == 5)
    ).count()

    high_priority_issues = Complaint.query.filter_by(priority_level='high').count()

    # Calculate average resolution time for resolved complaints
    resolved_list = Complaint.query.filter(Complaint.status == 'resolved', Complaint.resolved_at.isnot(None)).all()
    if resolved_list:
        total_hours = sum((c.resolved_at - c.created_at).total_seconds() / 3600.0 for c in resolved_list)
        avg_res_time = round(total_hours / len(resolved_list), 1)
    else:
        avg_res_time = 0.0

    return jsonify({
        'total_complaints': total_complaints,
        'pending_complaints': pending_complaints,
        'ongoing_complaints': ongoing_complaints,
        'resolved_complaints': resolved_complaints,
        'critical_issues': critical_issues,
        'high_priority_issues': high_priority_issues,
        'reopened_complaints': reopened_complaints,
        'avg_resolution_time_hours': avg_res_time
    }), 200

@analytics_bp.route('/categories', methods=['GET'])
@role_required('admin')
def get_category_distribution():
    categories = Category.query.all()
    data = []
    for cat in categories:
        count = Complaint.query.filter_by(category_id=cat.id).count()
        resolved = Complaint.query.filter_by(category_id=cat.id, status='resolved').count()
        data.append({
            'category_id': cat.id,
            'name': cat.name,
            'total': count,
            'resolved': resolved,
            'pending': count - resolved
        })
    # Sort highest count first
    data.sort(key=lambda x: x['total'], reverse=True)
    return jsonify({'categories': data}), 200

@analytics_bp.route('/status-distribution', methods=['GET'])
@role_required('admin')
def get_status_distribution():
    statuses = ['submitted', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'reopened']
    data = []
    for s in statuses:
        count = Complaint.query.filter_by(status=s).count()
        data.append({
            'status': s,
            'label': s.replace('_', ' ').title(),
            'count': count
        })
    return jsonify({'distribution': data}), 200

@analytics_bp.route('/trends', methods=['GET'])
@role_required('admin')
def get_trends():
    """
    Returns monthly / weekly complaint trends.
    """
    now = datetime.utcnow()
    # Group by last 6 months or recent weeks
    months = []
    for i in range(5, -1, -1):
        m_date = now - timedelta(days=i * 30)
        m_name = m_date.strftime('%b %Y')
        months.append((m_name, m_date.year, m_date.month))

    trends_data = []
    for m_name, yr, mo in months:
        # Approximate complaints for this month
        count = Complaint.query.filter(
            db.extract('year', Complaint.created_at) == yr,
            db.extract('month', Complaint.created_at) == mo
        ).count()
        resolved = Complaint.query.filter(
            db.extract('year', Complaint.resolved_at) == yr,
            db.extract('month', Complaint.resolved_at) == mo,
            Complaint.status == 'resolved'
        ).count()
        trends_data.append({
            'month': m_name,
            'reported': count,
            'resolved': resolved
        })

    return jsonify({'trends': trends_data}), 200

@analytics_bp.route('/priority', methods=['GET'])
@role_required('admin')
def get_priority_distribution():
    levels = ['low', 'medium', 'high', 'critical']
    data = []
    for lvl in levels:
        count = Complaint.query.filter_by(priority_level=lvl).count()
        data.append({
            'level': lvl,
            'label': lvl.capitalize(),
            'count': count
        })
    return jsonify({'priority_distribution': data}), 200

@analytics_bp.route('/staff-performance', methods=['GET'])
@role_required('admin')
def get_staff_performance():
    workload = AssignmentService.get_staff_workload()
    return jsonify({'staff_performance': workload}), 200
