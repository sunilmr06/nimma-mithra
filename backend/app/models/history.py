import uuid
from datetime import datetime
from app.extensions import db

class ComplaintStatusHistory(db.Model):
    __tablename__ = 'complaint_status_history'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    old_status = db.Column(db.String(30), nullable=True)
    new_status = db.Column(db.String(30), nullable=False)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    updater = db.relationship('User', foreign_keys=[updated_by])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'updated_by': self.updated_by,
            'updater_name': self.updater.name if self.updater else 'System',
            'updater_role': self.updater.role if self.updater else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComplaintResolution(db.Model):
    __tablename__ = 'complaint_resolutions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    staff_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    resolution_notes = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text, nullable=True)
    cost_amount = db.Column(db.Float, default=0.0, nullable=True)
    is_cost_approved = db.Column(db.Boolean, default=False)
    cost_status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    cost_approved_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    cost_approved_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('User', foreign_keys=[staff_id])
    approver = db.relationship('User', foreign_keys=[cost_approved_by])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'staff_id': self.staff_id,
            'staff_name': self.staff.name if self.staff else None,
            'resolution_notes': self.resolution_notes,
            'image_url': self.image_url,
            'cost_amount': float(self.cost_amount) if self.cost_amount is not None else 0.0,
            'is_cost_approved': bool(self.is_cost_approved),
            'cost_status': self.cost_status or ('approved' if self.is_cost_approved else 'pending'),
            'cost_approved_by': self.cost_approved_by,
            'cost_approved_by_name': self.approver.name if self.approver else None,
            'cost_approved_at': self.cost_approved_at.isoformat() if self.cost_approved_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'complaint_id': self.complaint_id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
