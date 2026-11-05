import sys
import os
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))



from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.campus import Building, Floor, Room, Category
from app.models.complaint import (
    Complaint, 
    ComplaintSupport, 
    ComplaintDuplicate,
    ComplaintLike,
    ComplaintComment,
    ComplaintFeedback
)
from app.models.assignment import ComplaintAssignment
from app.models.history import ComplaintStatusHistory, ComplaintResolution, Notification
from app.services.priority_engine import PriorityEngine

app = create_app()

def seed_database():
    with app.app_context():
        print("[SEED] Initializing database schema...")
        db.create_all()

        # Check if already seeded
        if User.query.filter_by(email='admin@campuscare.edu').first():
            print("Database already seeded. Cleaning and reseeding for pristine demo state...")
            ComplaintFeedback.query.delete()
            ComplaintComment.query.delete()
            ComplaintLike.query.delete()
            Notification.query.delete()
            ComplaintResolution.query.delete()
            ComplaintStatusHistory.query.delete()
            ComplaintAssignment.query.delete()
            ComplaintDuplicate.query.delete()
            ComplaintSupport.query.delete()
            Complaint.query.delete()
            Room.query.delete()
            Floor.query.delete()
            Building.query.delete()
            Category.query.delete()
            User.query.delete()
            db.session.commit()

        print("Creating Campus Buildings, Floors, and Rooms...")
        # Buildings
        b_a = Building(name="Block A (Science & Tech)", code="BLK-A", description="Science, Engineering, and Computer Labs")
        b_b = Building(name="Block B (Humanities & Admin)", code="BLK-B", description="Administrative Offices and Lecture Theatres")
        b_c = Building(name="Block C (Library & Media)", code="BLK-C", description="Central Library, Media Center, and Quiet Study")
        db.session.add_all([b_a, b_b, b_c])
        db.session.flush()

        # Floors for Block A
        f_a1 = Floor(building_id=b_a.id, floor_number=1, floor_name="Ground Floor")
        f_a2 = Floor(building_id=b_a.id, floor_number=2, floor_name="Second Floor")
        f_a3 = Floor(building_id=b_a.id, floor_number=3, floor_name="Third Floor")
        # Floors for Block B
        f_b1 = Floor(building_id=b_b.id, floor_number=1, floor_name="Ground Floor")
        f_b2 = Floor(building_id=b_b.id, floor_number=2, floor_name="First Floor")
        # Floors for Block C
        f_c1 = Floor(building_id=b_c.id, floor_number=1, floor_name="Ground Floor")
        db.session.add_all([f_a1, f_a2, f_a3, f_b1, f_b2, f_c1])
        db.session.flush()

        # Rooms
        r_101 = Room(floor_id=f_a1.id, room_number="101", room_type="Lecture Hall")
        r_102 = Room(floor_id=f_a1.id, room_number="102", room_type="Classroom")
        r_103 = Room(floor_id=f_a1.id, room_number="103", room_type="Electronics Lab")
        r_201 = Room(floor_id=f_a2.id, room_number="201", room_type="Computer Lab 1")
        r_202 = Room(floor_id=f_a2.id, room_number="202", room_type="Computer Lab 2")
        r_301 = Room(floor_id=f_a3.id, room_number="301", room_type="Seminar Hall")

        r_b101 = Room(floor_id=f_b1.id, room_number="101", room_type="Admin Office")
        r_b202 = Room(floor_id=f_b2.id, room_number="202", room_type="Faculty Room")

        r_c104 = Room(floor_id=f_c1.id, room_number="104", room_type="Study Hall")

        db.session.add_all([r_101, r_102, r_103, r_201, r_202, r_301, r_b101, r_b202, r_c104])
        db.session.flush()

        print("Creating Categories...")
        categories_data = [
            ("Electrical", "Lighting, power outlets, wiring, and main circuit issues"),
            ("Plumbing", "Water supply, drainage, leaks, and restroom fixtures"),
            ("Furniture", "Desks, chairs, whiteboards, and podiums"),
            ("Classroom Equipment", "Microphones, speakers, smart podiums, and screens"),
            ("Projector", "Ceiling projectors, display cables, and remote controllers"),
            ("Network / Wi-Fi", "Access points, ethernet ports, and internet dropouts"),
            ("Laboratory Equipment", "Oscilloscopes, microscopes, fume hoods, and lab fixtures"),
            ("Cleaning / Sanitation", "Trash disposal, spill cleanup, and sanitation supplies"),
            ("Infrastructure", "Doors, windows, ceilings, tiles, and AC/ventilation units"),
            ("Other", "Miscellaneous campus maintenance requirements")
        ]
        cat_map = {}
        for name, desc in categories_data:
            c = Category(name=name, description=desc)
            db.session.add(c)
            db.session.flush()
            cat_map[name] = c

        print("Creating Seed Users (Admin, Staff, Students)...")
        # 1 Admin
        admin = User(
            name="Dr. Sarah Mitchell",
            email="admin@campuscare.edu",
            role="admin",
            phone="+1 (555) 019-2834",
            department="Campus Operations & Administration"
        )
        admin.set_password("Admin@123")

        # 4 Staff with distinct specializations
        staff_elec = User(
            name="Rajesh Kumar",
            email="rajesh.electrician@campuscare.edu",
            role="staff",
            specialization="Electrical & Power Systems",
            department="Engineering Services",
            phone="+1 (555) 019-1122"
        )
        staff_elec.set_password("Staff@123")

        staff_plumb = User(
            name="Suresh Sharma",
            email="suresh.plumber@campuscare.edu",
            role="staff",
            specialization="Plumbing & Sanitation",
            department="Sanitation & Utilities",
            phone="+1 (555) 019-2233"
        )
        staff_plumb.set_password("Staff@123")

        staff_it = User(
            name="Anita Rao",
            email="anita.it@campuscare.edu",
            role="staff",
            specialization="Network & Projector Hardware",
            department="IT Infrastructure",
            phone="+1 (555) 019-3344"
        )
        staff_it.set_password("Staff@123")

        staff_furn = User(
            name="Vikram Singh",
            email="vikram.furniture@campuscare.edu",
            role="staff",
            specialization="Classroom Furniture & Infrastructure",
            department="Carpentry & Facilities",
            phone="+1 (555) 019-4455"
        )
        staff_furn.set_password("Staff@123")

        # 3 Students
        student_alex = User(
            name="Alex Mercer",
            email="alex.student@campuscare.edu",
            role="student",
            department="Computer Science & Engineering",
            phone="+1 (555) 019-5566"
        )
        student_alex.set_password("Student@123")

        student_priya = User(
            name="Priya Patel",
            email="priya.student@campuscare.edu",
            role="student",
            department="Mechanical Engineering",
            phone="+1 (555) 019-6677"
        )
        student_priya.set_password("Student@123")

        student_rahul = User(
            name="Rahul Verma",
            email="rahul.student@campuscare.edu",
            role="student",
            department="Electrical & Electronics",
            phone="+1 (555) 019-7788"
        )
        student_rahul.set_password("Student@123")

        db.session.add_all([
            admin, staff_elec, staff_plumb, staff_it, staff_furn,
            student_alex, student_priya, student_rahul
        ])
        db.session.flush()

        print("Creating Initial Demo Complaints & Realistic Scenarios...")
        now = datetime.utcnow()

        # Complaint 1: The Hackathon Demo Anchor
        # Student A (Alex) reports Projector Failure in Block A, Room 101
        c1_time = now - timedelta(hours=48)
        c1 = Complaint(
            complaint_number="CC-2026-0001",
            student_id=student_alex.id,
            category_id=cat_map["Projector"].id,
            room_id=r_101.id,
            title="Ceiling Projector not turning on or displaying HDMI signal",
            description="The Epson ceiling projector in Block A Room 101 has a blinking red lamp indicator and does not turn on. Professors and student groups cannot conduct presentations.",
            severity=4,
            status="submitted",
            affected_users_count=3,  # Alex + 2 supporters
            created_at=c1_time
        )
        PriorityEngine.update_complaint_priority(c1)
        db.session.add(c1)
        db.session.flush()

        # Add 2 supporters for Complaint 1
        sup1 = ComplaintSupport(complaint_id=c1.id, user_id=student_priya.id, created_at=c1_time + timedelta(hours=2))
        sup2 = ComplaintSupport(complaint_id=c1.id, user_id=student_rahul.id, created_at=c1_time + timedelta(hours=4))
        db.session.add_all([sup1, sup2])

        h1 = ComplaintStatusHistory(
            complaint_id=c1.id,
            old_status=None,
            new_status="submitted",
            updated_by=student_alex.id,
            remarks="Issue reported by student Alex Mercer.",
            created_at=c1_time
        )
        db.session.add(h1)

        # Complaint 2: Water leakage in Block B Room 202 (Assigned to Suresh Plumber)
        c2_time = now - timedelta(hours=28)
        c2 = Complaint(
            complaint_number="CC-2026-0002",
            student_id=student_priya.id,
            category_id=cat_map["Plumbing"].id,
            room_id=r_b202.id,
            title="Severe water leakage from ceiling AC pipe in Faculty Room 202",
            description="Water is continuously dripping near the filing cabinet in Room 202. Puddles are forming on the floor, posing a slip hazard.",
            severity=3,
            status="assigned",
            affected_users_count=2,
            created_at=c2_time
        )
        PriorityEngine.update_complaint_priority(c2)
        db.session.add(c2)
        db.session.flush()

        # Assignment for c2
        asg2 = ComplaintAssignment(
            complaint_id=c2.id,
            staff_id=staff_plumb.id,
            assigned_by=admin.id,
            remarks="Please inspect pipe insulation and drain line immediately.",
            assigned_at=c2_time + timedelta(hours=2),
            is_active=True
        )
        db.session.add(asg2)

        h2_1 = ComplaintStatusHistory(
            complaint_id=c2.id,
            old_status=None,
            new_status="submitted",
            updated_by=student_priya.id,
            remarks="Reported by Priya Patel",
            created_at=c2_time
        )
        h2_2 = ComplaintStatusHistory(
            complaint_id=c2.id,
            old_status="submitted",
            new_status="assigned",
            updated_by=admin.id,
            remarks="Assigned to Suresh Sharma (Plumbing & Sanitation)",
            created_at=c2_time + timedelta(hours=2)
        )
        db.session.add_all([h2_1, h2_2])

        # Complaint 3: Critical Safety Hazard in Electronics Lab (High priority / safety escalated)
        c3_time = now - timedelta(hours=6)
        c3 = Complaint(
            complaint_number="CC-2026-0003",
            student_id=student_rahul.id,
            category_id=cat_map["Electrical"].id,
            room_id=r_103.id,
            title="Exposed wiring and sparking switchboard near Lab Bench 4",
            description="Exposed wire bundle near power switchboard bench 4 is sparking when lab equipment is plugged in. Potential severe fire and shock hazard.",
            severity=5,
            status="in_progress",
            affected_users_count=4,
            created_at=c3_time
        )
        PriorityEngine.update_complaint_priority(c3)
        db.session.add(c3)
        db.session.flush()

        asg3 = ComplaintAssignment(
            complaint_id=c3.id,
            staff_id=staff_elec.id,
            assigned_by=admin.id,
            remarks="Emergency electrical hazard: isolate circuit breaker and replace conduit.",
            assigned_at=c3_time + timedelta(minutes=30),
            is_active=True
        )
        db.session.add(asg3)

        h3_1 = ComplaintStatusHistory(
            complaint_id=c3.id,
            old_status=None,
            new_status="submitted",
            updated_by=student_rahul.id,
            remarks="Emergency complaint submitted",
            created_at=c3_time
        )
        h3_2 = ComplaintStatusHistory(
            complaint_id=c3.id,
            old_status="submitted",
            new_status="assigned",
            updated_by=admin.id,
            remarks="Assigned to Rajesh Kumar",
            created_at=c3_time + timedelta(minutes=30)
        )
        h3_3 = ComplaintStatusHistory(
            complaint_id=c3.id,
            old_status="assigned",
            new_status="in_progress",
            updated_by=staff_elec.id,
            remarks="Arrived on site, main circuit breaker isolated.",
            created_at=c3_time + timedelta(hours=1)
        )
        db.session.add_all([h3_1, h3_2, h3_3])

        # Complaint 4: Resolved Issue - Broken study desk chair in Block C
        c4_time = now - timedelta(days=4)
        c4 = Complaint(
            complaint_number="CC-2026-0004",
            student_id=student_alex.id,
            category_id=cat_map["Furniture"].id,
            room_id=r_c104.id,
            title="Broken wheel and hydraulic lift on study carrel chair #12",
            description="The chair wheel snapped off and hydraulic cylinder is sunken, making it unusable.",
            severity=2,
            status="resolved",
            affected_users_count=1,
            created_at=c4_time,
            resolved_at=c4_time + timedelta(hours=18)
        )
        PriorityEngine.update_complaint_priority(c4)
        db.session.add(c4)
        db.session.flush()

        res4 = ComplaintResolution(
            complaint_id=c4.id,
            staff_id=staff_furn.id,
            resolution_notes="Replaced defective caster wheels and hydraulic cylinder with heavy-duty replacement parts. Tested and restored to service.",
            image_url=None,
            resolved_at=c4_time + timedelta(hours=18)
        )
        db.session.add(res4)

        h4_1 = ComplaintStatusHistory(
            complaint_id=c4.id,
            old_status=None,
            new_status="submitted",
            updated_by=student_alex.id,
            remarks="Submitted by student",
            created_at=c4_time
        )
        h4_2 = ComplaintStatusHistory(
            complaint_id=c4.id,
            old_status="in_progress",
            new_status="resolved",
            updated_by=staff_furn.id,
            remarks="Completed replacement and testing.",
            created_at=c4_time + timedelta(hours=18)
        )
        db.session.add_all([h4_1, h4_2])

        print("Seeding Likes, Comments & Public Feedback...")
        # Likes on c1 (Projector) and c3 (Electrical)
        like1 = ComplaintLike(complaint_id=c1.id, user_id=student_priya.id)
        like2 = ComplaintLike(complaint_id=c1.id, user_id=student_rahul.id)
        like3 = ComplaintLike(complaint_id=c3.id, user_id=student_alex.id)
        db.session.add_all([like1, like2, like3])

        # Comments on c1 (Projector issue discussion)
        comm1 = ComplaintComment(
            complaint_id=c1.id,
            user_id=student_priya.id,
            comment_text="Our group had a presentation today at 10 AM and had to move to another room because the HDMI output gave no signal.",
            created_at=c1_time + timedelta(hours=3)
        )
        comm2 = ComplaintComment(
            complaint_id=c1.id,
            user_id=student_rahul.id,
            comment_text="I verified the projector power cord too, lamp error LED is blinking orange.",
            created_at=c1_time + timedelta(hours=5)
        )
        db.session.add_all([comm1, comm2])

        # Public Feedback on resolved issue c4
        fb1 = ComplaintFeedback(
            complaint_id=c4.id,
            user_id=student_alex.id,
            rating=5,
            comment="Super fast response! Vikram replaced the wheels within a few hours and the chair rolls smoothly now. Great job!",
            created_at=c4_time + timedelta(hours=20)
        )
        fb2 = ComplaintFeedback(
            complaint_id=c4.id,
            user_id=student_priya.id,
            rating=5,
            comment="Verified in Room 104 study carrel. Much appreciated!",
            created_at=c4_time + timedelta(hours=22)
        )
        db.session.add_all([fb1, fb2])

        db.session.commit()
        print("Database seeded successfully with Demo Scenario data!")
        print("\nDemo Credentials:")
        print("  Admin:   admin@campuscare.edu / Admin@123")
        print("  Staff:   rajesh.electrician@campuscare.edu / Staff@123")
        print("  Staff:   suresh.plumber@campuscare.edu / Staff@123")
        print("  Staff:   anita.it@campuscare.edu / Staff@123")
        print("  Student: alex.student@campuscare.edu / Student@123")
        print("  Student: priya.student@campuscare.edu / Student@123")
        print("  Student: rahul.student@campuscare.edu / Student@123")

if __name__ == '__main__':
    seed_database()
