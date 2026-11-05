import sys
import os

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

app = create_app()

def seed_database():
    with app.app_context():
        print("[SEED] Initializing clean database schema...")
        db.create_all()

        # Clean any existing records
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

        print("[SEED] Creating Campus Infrastructure Master Data (Buildings, Floors, Rooms)...")
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

        print("[SEED] Creating Categories...")
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
        for name, desc in categories_data:
            c = Category(name=name, description=desc)
            db.session.add(c)
        db.session.flush()

        print("[SEED] Creating Administrator user (admin@techfusion.com)...")
        admin = User(
            name="Admin TechFusion",
            email="admin@techfusion.com",
            role="admin",
            phone="+91 98765 43210",
            department="Operations & Administration"
        )
        admin.set_password("Admin@123")
        db.session.add(admin)

        db.session.commit()
        print("[SEED] Clean database initialized successfully!")
        print("Master Admin Account:")
        print("  Email:    admin@techfusion.com")
        print("  Password: Admin@123")
        print("  Portal:   /admin/login")

if __name__ == '__main__':
    seed_database()
