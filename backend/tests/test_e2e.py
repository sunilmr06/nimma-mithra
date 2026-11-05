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

class TechFusionE2ETestCase(unittest.TestCase):
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

    def test_02_admin_login(self):
        # Admin attempting login via standard student/staff login must be rejected
        res_blocked = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@techfusion.com',
            'password': 'Admin@123'
        })
        self.assertEqual(res_blocked.status_code, 403)
        self.assertIn('Admin Portal', res_blocked.get_json()['message'])

        # Dedicated Admin login endpoint succeeds
        res_admin = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@techfusion.com',
            'password': 'Admin@123'
        })
        self.assertEqual(res_admin.status_code, 200)
        data = res_admin.get_json()
        self.assertIn('access_token', data)
        self.assertEqual(data['user']['role'], 'admin')

    def test_03_admin_creates_staff_and_student_registers(self):
        # Admin login
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@techfusion.com',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        # Admin creates electrical technician staff
        res_staff = self.client.post('/api/v1/admin/staff', headers=admin_headers, json={
            'name': 'Rajesh Kumar',
            'email': 'rajesh.staff@techfusion.com',
            'password': 'Staff@123',
            'specialization': 'Electrical & Power Systems',
            'department': 'Facilities Management',
            'phone': '+91 91234 56789'
        })
        self.assertEqual(res_staff.status_code, 201)
        self.assertEqual(res_staff.get_json()['staff']['role'], 'staff')

        # Student registers account
        res_stud = self.client.post('/api/v1/auth/register', json={
            'name': 'Alex Mercer',
            'email': 'alex.student@techfusion.com',
            'password': 'Student@123',
            'department': 'Computer Science',
            'phone': '+91 99887 76655'
        })
        self.assertEqual(res_stud.status_code, 201)
        self.assertEqual(res_stud.get_json()['user']['role'], 'student')

        # Additional student registers
        res_stud2 = self.client.post('/api/v1/auth/register', json={
            'name': 'Priya Patel',
            'email': 'priya.student@techfusion.com',
            'password': 'Student@123',
            'department': 'Mechanical Engineering',
            'phone': '+91 99887 76656'
        })
        self.assertEqual(res_stud2.status_code, 201)

    def test_04_student_submits_complaint_and_duplicate_detection(self):
        # Login student Alex
        stud_login = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@techfusion.com',
            'password': 'Student@123'
        })
        stud_token = stud_login.get_json()['access_token']
        stud_headers = {'Authorization': f'Bearer {stud_token}'}

        with self.app.app_context():
            r101 = Room.query.filter_by(room_number='101').first()
            cat_elec = Category.query.filter_by(name='Electrical').first()
            room_id = r101.id
            cat_id = cat_elec.id

        # Student Alex submits complaint 1
        comp_res = self.client.post('/api/v1/complaints', headers=stud_headers, json={
            'title': 'Ceiling lights flickering and emitting humming noise',
            'description': 'Main fluorescent tubes in Room 101 flicker continuously when switched on.',
            'category_id': cat_id,
            'room_id': room_id,
            'severity': 3
        })
        self.assertEqual(comp_res.status_code, 201)
        c1 = comp_res.get_json()['complaint']
        self.assertEqual(c1['status'], 'submitted')

        # Student Priya checks duplicates for similar electrical issue in Room 101
        dup_check = self.client.post('/api/v1/complaints/check-duplicates', headers=stud_headers, json={
            'title': 'Lights flickering badly in Room 101',
            'description': 'The fluorescent tubes in Room 101 keep flickering and making noise',
            'category_id': cat_id,
            'room_id': room_id
        })
        self.assertEqual(dup_check.status_code, 200)
        self.assertTrue(dup_check.get_json()['found_duplicates'])
        self.assertTrue(len(dup_check.get_json()['duplicates']) > 0)

    def test_05_admin_acknowledgement_and_assignment(self):
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@techfusion.com',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        with self.app.app_context():
            c1 = Complaint.query.first()
            c1_id = c1.id

        # Admin acknowledges complaint
        ack_res = self.client.patch(f'/api/v1/admin/complaints/{c1_id}/acknowledge', headers=admin_headers)
        self.assertEqual(ack_res.status_code, 200)
        self.assertEqual(ack_res.get_json()['complaint']['status'], 'acknowledged')

        # Get staff list
        staff_res = self.client.get('/api/v1/admin/staff', headers=admin_headers)
        staff_id = staff_res.get_json()['staff'][0]['staff_id']

        # Assign staff
        assign_res = self.client.patch(f'/api/v1/admin/complaints/{c1_id}/assign', headers=admin_headers, json={
            'staff_id': staff_id,
            'remarks': 'Assigned to Rajesh for light ballast replacement.'
        })
        self.assertEqual(assign_res.status_code, 200)
        self.assertEqual(assign_res.get_json()['complaint']['status'], 'assigned')

    def test_06_staff_completes_issue_with_cost_and_notifies_both(self):
        # Staff logs in
        staff_login = self.client.post('/api/v1/auth/login', json={
            'email': 'rajesh.staff@techfusion.com',
            'password': 'Staff@123'
        })
        staff_token = staff_login.get_json()['access_token']
        staff_headers = {'Authorization': f'Bearer {staff_token}'}

        with self.app.app_context():
            c1 = Complaint.query.first()
            c1_id = c1.id

        # Staff starts work
        start_res = self.client.patch(f'/api/v1/staff/tasks/{c1_id}/status', headers=staff_headers, json={
            'status': 'in_progress',
            'remarks': 'Replacing fluorescent tube starter and electronic ballast.'
        })
        self.assertEqual(start_res.status_code, 200)
        self.assertEqual(start_res.get_json()['task']['status'], 'in_progress')

        # Staff resolves task and submits repair cost
        resolve_res = self.client.post(f'/api/v1/staff/tasks/{c1_id}/resolution', headers=staff_headers, json={
            'resolution_notes': 'Replaced ballast unit and installed two new LED tube lights. Tested operational.',
            'cost_amount': 480.0
        })
        self.assertEqual(resolve_res.status_code, 200)
        res_data = resolve_res.get_json()
        self.assertEqual(res_data['task']['status'], 'resolved')
        self.assertEqual(res_data['resolution']['cost_amount'], 480.0)
        self.assertEqual(res_data['resolution']['cost_status'], 'pending')

    def test_07_notifications_and_admin_cost_approval(self):
        # 1. Check student received notification
        stud_login = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@techfusion.com',
            'password': 'Student@123'
        })
        stud_token = stud_login.get_json()['access_token']
        stud_headers = {'Authorization': f'Bearer {stud_token}'}

        stud_notifs = self.client.get('/api/v1/notifications', headers=stud_headers)
        self.assertEqual(stud_notifs.status_code, 200)
        self.assertTrue(len(stud_notifs.get_json()['notifications']) > 0)
        self.assertIn('Resolved', stud_notifs.get_json()['notifications'][0]['title'])

        # 2. Check admin received notification with cost
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@techfusion.com',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        admin_notifs = self.client.get('/api/v1/notifications', headers=admin_headers)
        self.assertEqual(admin_notifs.status_code, 200)
        self.assertTrue(len(admin_notifs.get_json()['notifications']) > 0)
        self.assertIn('Cost', admin_notifs.get_json()['notifications'][0]['title'])

        # 3. Admin approves cost
        with self.app.app_context():
            c1 = Complaint.query.first()
            c1_id = c1.id

        cost_res = self.client.patch(f'/api/v1/admin/complaints/{c1_id}/approve-cost', headers=admin_headers, json={
            'approved': True,
            'remarks': 'Approved LED tubes and ballast replacement expense.'
        })
        self.assertEqual(cost_res.status_code, 200)
        self.assertTrue(cost_res.get_json()['resolution']['is_cost_approved'])
        self.assertEqual(cost_res.get_json()['resolution']['cost_status'], 'approved')

        # 4. Staff receives notification about approval
        staff_login = self.client.post('/api/v1/auth/login', json={
            'email': 'rajesh.staff@techfusion.com',
            'password': 'Staff@123'
        })
        staff_token = staff_login.get_json()['access_token']
        staff_headers = {'Authorization': f'Bearer {staff_token}'}

        staff_notifs = self.client.get('/api/v1/notifications', headers=staff_headers)
        self.assertEqual(staff_notifs.status_code, 200)
        self.assertTrue(any('Approved' in n['title'] for n in staff_notifs.get_json()['notifications']))

if __name__ == '__main__':
    unittest.main()
