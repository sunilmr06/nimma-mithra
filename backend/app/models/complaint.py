import uuid
from datetime import datetime
from app.extensions import db

class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    student_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False, index=True)
    room_id = db.Column(db.String(36), db.ForeignKey('rooms.id'), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text, nullable=True)
    severity = db.Column(db.Integer, nullable=False, default=3)  # 1-5
    status = db.Column(db.String(30), nullable=False, default='submitted', index=True)
    
    affected_users_count = db.Column(db.Integer, default=1)
    priority_score = db.Column(db.Numeric(5, 2), nullable=True, index=True)
    priority_level = db.Column(db.String(20), nullable=True)  # low, medium, high, critical
    is_reopened = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    supports = db.relationship('ComplaintSupport', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    assignments = db.relationship('ComplaintAssignment', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    status_history = db.relationship('ComplaintStatusHistory', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    resolutions = db.relationship('ComplaintResolution', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('ComplaintLike', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('ComplaintComment', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    feedbacks = db.relationship('ComplaintFeedback', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    duplicate_records = db.relationship(
        'ComplaintDuplicate',
        foreign_keys='ComplaintDuplicate.complaint_id',
        backref='complaint',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    @property
    def active_assignment(self):
        return self.assignments.filter_by(is_active=True).first()

    @property
    def latest_resolution(self):
        return self.resolutions.order_by(db.desc('resolved_at')).first()

    def to_dict(self, include_details=False, current_user_id=None):
        room_data = self.room.to_dict() if self.room else None
        category_data = self.category.to_dict() if self.category else None
        student_data = {
            'id': self.student.id,
            'name': self.student.name,
            'email': self.student.email,
            'department': self.student.department,
            'avatar_url': getattr(self.student, 'avatar_url', None)
        } if self.student else None

        active_assign = self.active_assignment
        assigned_staff_data = None
        if active_assign and active_assign.staff:
            assigned_staff_data = {
                'id': active_assign.staff.id,
                'name': active_assign.staff.name,
                'email': active_assign.staff.email,
                'specialization': active_assign.staff.specialization,
                'avatar_url': getattr(active_assign.staff, 'avatar_url', None),
                'assigned_at': active_assign.assigned_at.isoformat() if active_assign.assigned_at else None,
                'remarks': active_assign.remarks
            }

        is_supported_by_me = False
        is_liked_by_me = False
        if current_user_id:
            is_supported_by_me = self.supports.filter_by(user_id=current_user_id).first() is not None
            is_liked_by_me = self.likes.filter_by(user_id=current_user_id).first() is not None

        # Calculate average feedback rating if present
        all_feedbacks = self.feedbacks.all()
        avg_rating = None
        if all_feedbacks:
            avg_rating = round(sum(f.rating for f in all_feedbacks) / len(all_feedbacks), 1)

        # Compute dynamic pending hours
        pending_hours = max(0.0, (datetime.utcnow() - self.created_at).total_seconds() / 3600.0)

        latest_res = self.latest_resolution
        resolution_data = latest_res.to_dict() if latest_res else None

        data = {
            'id': self.id,
            'complaint_number': self.complaint_number,
            'title': self.title,
            'description': self.description,
            'image_url': self.image_url,
            'severity': self.severity,
            'status': self.status,
            'affected_users_count': self.affected_users_count,
            'priority_score': float(self.priority_score) if self.priority_score is not None else 0.0,
            'priority_level': self.priority_level or 'low',
            'is_reopened': self.is_reopened,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'pending_hours': round(pending_hours, 1),
            'room': room_data,
            'category': category_data,
            'student': student_data,
            'assigned_staff': assigned_staff_data,
            'resolution': resolution_data,
            'is_supported_by_me': is_supported_by_me,
            'supports_count': self.supports.count(),
            'is_liked_by_me': is_liked_by_me,
            'likes_count': self.likes.count(),
            'comments_count': self.comments.count(),
            'feedbacks_count': len(all_feedbacks),
            'average_rating': avg_rating
        }

        if include_details:
            data['history'] = [h.to_dict() for h in self.status_history.order_by('created_at').all()]
            latest_res = self.latest_resolution
            data['resolution'] = latest_res.to_dict() if latest_res else None
            data['duplicates'] = [d.to_dict() for d in self.duplicate_records.all()]
            data['feedbacks'] = [f.to_dict() for f in all_feedbacks]
            data['comments'] = [c.to_dict() for c in self.comments.order_by(db.desc('created_at')).all()]

        return data


class ComplaintSupport(db.Model):
    __tablename__ = 'complaint_supports'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('complaint_id', 'user_id', name='uq_complaint_user_support'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComplaintDuplicate(db.Model):
    __tablename__ = 'complaint_duplicates'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    similar_complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    similarity_score = db.Column(db.Numeric(5, 2), nullable=False)
    detection_reason = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    similar_complaint = db.relationship('Complaint', foreign_keys=[similar_complaint_id])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'similar_complaint_id': self.similar_complaint_id,
            'similarity_score': float(self.similarity_score),
            'detection_reason': self.detection_reason,
            'similar_complaint_title': self.similar_complaint.title if self.similar_complaint else None,
            'similar_complaint_number': self.similar_complaint.complaint_number if self.similar_complaint else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComplaintLike(db.Model):
    __tablename__ = 'complaint_likes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('complaint_id', 'user_id', name='uq_complaint_user_like'),
    )


class ComplaintComment(db.Model):
    __tablename__ = 'complaint_comments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    author = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'author_name': self.author.name if self.author else 'User',
            'author_role': self.author.role if self.author else 'student',
            'author_avatar': getattr(self.author, 'avatar_url', None),
            'author_department': getattr(self.author, 'department', None),
            'comment_text': self.comment_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComplaintFeedback(db.Model):
    __tablename__ = 'complaint_feedbacks'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False, default=5)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    reviewer = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'complaint_title': self.complaint.title if self.complaint else None,
            'complaint_number': self.complaint.complaint_number if self.complaint else None,
            'category_name': self.complaint.category.name if self.complaint and self.complaint.category else 'General',
            'location_display': self.complaint.room.to_dict()['location_display'] if self.complaint and self.complaint.room else None,
            'resolution_notes': self.complaint.latest_resolution.resolution_notes if self.complaint and self.complaint.latest_resolution else None,
            'resolved_at': self.complaint.resolved_at.isoformat() if self.complaint and self.complaint.resolved_at else None,
            'staff_name': self.complaint.latest_resolution.staff.name if self.complaint and self.complaint.latest_resolution and self.complaint.latest_resolution.staff else None,
            'user_id': self.user_id,
            'user_name': self.reviewer.name if self.reviewer else 'Anonymous Student',
            'user_avatar': getattr(self.reviewer, 'avatar_url', None),
            'user_department': getattr(self.reviewer, 'department', None),
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

