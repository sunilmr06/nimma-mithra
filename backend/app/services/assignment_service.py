from datetime import datetime
from app.extensions import db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.assignment import ComplaintAssignment
from app.models.history import ComplaintStatusHistory, Notification

class AssignmentService:
    @staticmethod
    def get_staff_workload():
        """
        Calculates active tasks and completed tasks for each staff member.
        """
        staff_members = User.query.filter_by(role='staff', is_active=True).all()
        workload = []

        for staff in staff_members:
            # Active tasks assigned to this staff
            active_assignments = ComplaintAssignment.query.filter_by(
                staff_id=staff.id,
                is_active=True
            ).all()

            active_complaints = [
                a.complaint for a in active_assignments 
                if a.complaint and a.complaint.status in ['assigned', 'in_progress', 'reopened']
            ]

            # Completed tasks
            completed_assignments = ComplaintAssignment.query.filter_by(
                staff_id=staff.id
            ).join(Complaint).filter(Complaint.status == 'resolved').count()

            workload.append({
                'staff_id': staff.id,
                'name': staff.name,
                'email': staff.email,
                'specialization': staff.specialization or 'General Maintenance',
                'department': staff.department or 'Facilities',
                'active_tasks_count': len(active_complaints),
                'completed_tasks_count': completed_assignments,
                'is_available': len(active_complaints) < 8  # Flag availability based on load
            })

        return workload

    @staticmethod
    def assign_complaint(complaint_id: str, staff_id: str, admin_user: User, remarks: str = ""):
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")

        staff = User.query.filter_by(id=staff_id, role='staff', is_active=True).first()
        if not staff:
            raise ValueError("Staff member not found or inactive.")

        old_status = complaint.status

        # Deactivate any previous active assignment
        active_assignments = ComplaintAssignment.query.filter_by(
            complaint_id=complaint.id,
            is_active=True
        ).all()

        for a in active_assignments:
            a.is_active = False
            a.unassigned_at = datetime.utcnow()

        # Create new assignment record
        new_assignment = ComplaintAssignment(
            complaint_id=complaint.id,
            staff_id=staff.id,
            assigned_by=admin_user.id,
            remarks=remarks,
            assigned_at=datetime.utcnow(),
            is_active=True
        )
        db.session.add(new_assignment)

        # Update complaint status to 'assigned' if it was submitted or acknowledged
        if complaint.status in ['submitted', 'acknowledged', 'reopened']:
            complaint.status = 'assigned'
            complaint.updated_at = datetime.utcnow()

            # Record in status history
            history = ComplaintStatusHistory(
                complaint_id=complaint.id,
                old_status=old_status,
                new_status=complaint.status,
                updated_by=admin_user.id,
                remarks=f"Assigned to {staff.name}. {remarks}".strip()
            )
            db.session.add(history)

        # Create notification for staff
        notif = Notification(
            user_id=staff.id,
            complaint_id=complaint.id,
            title="New Task Assigned",
            message=f"You have been assigned complaint #{complaint.complaint_number}: '{complaint.title}'."
        )
        db.session.add(notif)

        db.session.commit()
        return new_assignment
