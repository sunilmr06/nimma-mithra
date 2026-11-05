import uuid
from datetime import datetime
from app.extensions import db

class ComplaintAssignment(db.Model):
    __tablename__ = 'complaint_assignments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    staff_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    unassigned_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    assigner = db.relationship('User', foreign_keys=[assigned_by])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'staff_id': self.staff_id,
            'staff_name': self.staff.name if self.staff else None,
            'assigned_by': self.assigned_by,
            'assigned_by_name': self.assigner.name if self.assigner else None,
            'remarks': self.remarks,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'unassigned_at': self.unassigned_at.isoformat() if self.unassigned_at else None,
            'is_active': self.is_active
        }
