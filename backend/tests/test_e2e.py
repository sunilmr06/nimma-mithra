import sys
import os
import unittest
import json

# Put backend root on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


from app import create_app
from app.extensions import db
from app.models.campus import Room, Category
from app.models.complaint import Complaint
from seed import seed_database

class CampusCareE2ETestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            seed_database()

    def test_01_health_check(self):
        res = self.client.get('/api/v1/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('application'), 'CampusCare')

    def test_02_auth_login_roles(self):
        # Admin login
        res = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('access_token', data)
        self.assertEqual(data['user']['role'], 'admin')
        admin_token = data['access_token']

        # Student login
        res_stud = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        self.assertEqual(res_stud.status_code, 200)
        self.assertEqual(res_stud.get_json()['user']['role'], 'student')

        # Staff login
        res_staff = self.client.post('/api/v1/auth/login', json={
            'email': 'suresh.plumber@campuscare.edu',
            'password': 'Staff@123'
        })
        self.assertEqual(res_staff.status_code, 200)
        self.assertEqual(res_staff.get_json()['user']['role'], 'staff')

    def test_03_campus_hierarchy(self):
        res = self.client.get('/api/v1/campus/hierarchy')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data['buildings']) > 0)
        self.assertTrue(len(data['categories']) > 0)

    def test_04_duplicate_detection_pre_submit(self):
        # Login as student Priya
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'priya.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        with self.app.app_context():
            r101 = Room.query.filter_by(room_number='101').first()
            cat_proj = Category.query.filter_by(name='Projector').first()
            room_id = r101.id
            cat_id = cat_proj.id

        # Student B checks duplicate for projector issue in room 101
        dup_res = self.client.post('/api/v1/complaints/check-duplicates', headers=headers, json={
            'title': 'Ceiling Projector is completely broken and blacked out',
            'description': 'The projector in Room 101 has red lamp flashing and won\'t show HDMI display',
            'category_id': cat_id,
            'room_id': room_id
        })
        self.assertEqual(dup_res.status_code, 200)
        data = dup_res.get_json()
        self.assertTrue(data['found_duplicates'])
        self.assertTrue(len(data['duplicates']) > 0)
        top_dup = data['duplicates'][0]
        self.assertEqual(top_dup['complaint_number'], 'CC-2026-0001')
        self.assertGreaterEqual(top_dup['similarity_score'], 65.0)

    def test_05_support_existing_complaint_and_priority_bump(self):
        # Login as student Rahul
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'rahul.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        with self.app.app_context():
            c2 = Complaint.query.filter_by(complaint_number='CC-2026-0002').first()
            c2_id = c2.id
            old_affected = c2.affected_users_count
            old_priority = float(c2.priority_score)

        # Support complaint CC-2026-0002
        res = self.client.post(f'/api/v1/complaints/{c2_id}/support', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['complaint']['affected_users_count'], old_affected + 1)
        # Priority must have increased
        self.assertGreater(float(data['complaint']['priority_score']), old_priority)

    def test_06_submit_separate_duplicate_and_preserve_relation(self):
        # Register new student
        reg_res = self.client.post('/api/v1/auth/register', json={
            'name': 'Test Submitter',
            'email': 'test.submitter@campuscare.edu',
            'password': 'Password@123',
            'department': 'CS'
        })
        self.assertEqual(reg_res.status_code, 201)
        token = reg_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        with self.app.app_context():
            r101 = Room.query.filter_by(room_number='101').first()
            cat_proj = Category.query.filter_by(name='Projector').first()
            room_id = r101.id
            cat_id = cat_proj.id

        # Student submits separate complaint anyway
        create_res = self.client.post('/api/v1/complaints', headers=headers, json={
            'title': 'Separate Report: Projector in 101 not functioning',
            'description': 'I need this fixed for my team project presentation specifically.',
            'category_id': cat_id,
            'room_id': room_id,
            'severity': 4
        })
        self.assertEqual(create_res.status_code, 201)
        comp_data = create_res.get_json()['complaint']
        self.assertIn('complaint_number', comp_data)

        # Verify duplicate record preserved for admin review
        with self.app.app_context():
            new_c = Complaint.query.get(comp_data['id'])
            dups = new_c.duplicate_records.all()
            self.assertTrue(len(dups) > 0)
            self.assertEqual(dups[0].similar_complaint.complaint_number, 'CC-2026-0001')

    def test_07_admin_acknowledgement_and_assignment(self):
        # Login as Admin
        admin_login = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {admin_token}'}

        with self.app.app_context():
            c1 = Complaint.query.filter_by(complaint_number='CC-2026-0001').first()
            c1_id = c1.id

        # Acknowledge
        ack_res = self.client.patch(f'/api/v1/admin/complaints/{c1_id}/acknowledge', headers=headers)
        self.assertEqual(ack_res.status_code, 200)
        self.assertEqual(ack_res.get_json()['complaint']['status'], 'acknowledged')

        # Get staff member
        staff_res = self.client.get('/api/v1/admin/staff', headers=headers)
        staff_id = staff_res.get_json()['staff'][0]['staff_id']

        # Assign
        assign_res = self.client.patch(f'/api/v1/admin/complaints/{c1_id}/assign', headers=headers, json={
            'staff_id': staff_id,
            'remarks': 'Assigned for urgent repair.'
        })
        self.assertEqual(assign_res.status_code, 200)
        self.assertEqual(assign_res.get_json()['complaint']['status'], 'assigned')

    def test_08_staff_status_update_and_resolution(self):
        # Login as staff (Suresh Sharma)
        staff_login = self.client.post('/api/v1/auth/login', json={
            'email': 'suresh.plumber@campuscare.edu',
            'password': 'Staff@123'
        })
        staff_token = staff_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {staff_token}'}

        with self.app.app_context():
            c2 = Complaint.query.filter_by(complaint_number='CC-2026-0002').first()
            c2_id = c2.id

        # Staff updates status to in_progress
        status_res = self.client.patch(f'/api/v1/staff/tasks/{c2_id}/status', headers=headers, json={
            'status': 'in_progress',
            'remarks': 'Replaced cracked drain trap on ceiling unit.'
        })
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.get_json()['task']['status'], 'in_progress')

        # Staff marks resolved with notes
        resolve_res = self.client.post(f'/api/v1/staff/tasks/{c2_id}/resolution', headers=headers, json={
            'resolution_notes': 'Drain line cleared, pressurized pipe tested, no further water leakage detected.'
        })
        self.assertEqual(resolve_res.status_code, 200)
        self.assertEqual(resolve_res.get_json()['task']['status'], 'resolved')
        self.assertIsNotNone(resolve_res.get_json()['task']['resolved_at'])

    def test_09_analytics_endpoints(self):
        admin_login = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {admin_token}'}

        # Summary
        res = self.client.get('/api/v1/analytics/summary', headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn('total_complaints', res.get_json())
        self.assertIn('avg_resolution_time_hours', res.get_json())

        # Categories
        res = self.client.get('/api/v1/analytics/categories', headers=headers)
        self.assertEqual(res.status_code, 200)

        # Trends
        res = self.client.get('/api/v1/analytics/trends', headers=headers)
        self.assertEqual(res.status_code, 200)

        # Priority
        res = self.client.get('/api/v1/analytics/priority', headers=headers)
        self.assertEqual(res.status_code, 200)

        # Staff performance
        res = self.client.get('/api/v1/analytics/staff-performance', headers=headers)
        self.assertEqual(res.status_code, 200)

    def test_10_admin_reopen_complaint(self):
        admin_login = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {admin_token}'}

        with self.app.app_context():
            # c4 was resolved in seed
            c4 = Complaint.query.filter_by(complaint_number='CC-2026-0004').first()
            c4_id = c4.id

        reopen_res = self.client.patch(f'/api/v1/admin/complaints/{c4_id}/reopen', headers=headers, json={
            'remarks': 'Chair wheel became loose again, requested heavy-duty caster replacement.'
        })
        self.assertEqual(reopen_res.status_code, 200)
        self.assertEqual(reopen_res.get_json()['complaint']['status'], 'reopened')
        self.assertTrue(reopen_res.get_json()['complaint']['is_reopened'])

if __name__ == '__main__':
    unittest.main()
