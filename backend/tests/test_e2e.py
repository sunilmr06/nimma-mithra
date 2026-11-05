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
        # Admin attempting login via standard student/staff login must be rejected
        res_blocked = self.client.post('/api/v1/auth/login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        self.assertEqual(res_blocked.status_code, 403)
        self.assertIn('Admin Portal', res_blocked.get_json()['message'])

        # Dedicated Admin login endpoint succeeds
        res_admin = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        self.assertEqual(res_admin.status_code, 200)
        data = res_admin.get_json()
        self.assertIn('access_token', data)
        self.assertEqual(data['user']['role'], 'admin')

        # Non-admin attempting admin-login endpoint must be rejected
        res_stud_admin = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        self.assertEqual(res_stud_admin.status_code, 403)

        # Student login via standard endpoint
        res_stud = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        self.assertEqual(res_stud.status_code, 200)
        self.assertEqual(res_stud.get_json()['user']['role'], 'student')

        # Staff login via standard endpoint
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
        # Login as Admin via dedicated admin endpoint
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
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

        # Staff marks resolved with notes and cost
        resolve_res = self.client.post(f'/api/v1/staff/tasks/{c2_id}/resolution', headers=headers, json={
            'resolution_notes': 'Drain line cleared, pressurized pipe tested, no further water leakage detected.',
            'cost_amount': 550.0
        })
        self.assertEqual(resolve_res.status_code, 200)
        self.assertEqual(resolve_res.get_json()['task']['status'], 'resolved')
        self.assertIsNotNone(resolve_res.get_json()['task']['resolved_at'])
        self.assertEqual(resolve_res.get_json()['resolution']['cost_amount'], 550.0)
        self.assertEqual(resolve_res.get_json()['resolution']['cost_status'], 'pending')

    def test_09_analytics_endpoints(self):
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
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
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
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

    def test_11_profile_update(self):
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.patch('/api/v1/auth/profile', headers=headers, json={
            'name': 'Alex Mercer Updated',
            'phone': '+1 (555) 999-8888',
            'bio': 'Passionate builder & student leader',
            'department': 'Computer Science & AI'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['user']['name'], 'Alex Mercer Updated')
        self.assertEqual(data['user']['bio'], 'Passionate builder & student leader')

    def test_12_likes_and_comments(self):
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'priya.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        with self.app.app_context():
            c1 = Complaint.query.filter_by(complaint_number='CC-2026-0001').first()
            c1_id = c1.id

        # Toggle like
        like_res = self.client.post(f'/api/v1/complaints/{c1_id}/like', headers=headers)
        self.assertEqual(like_res.status_code, 200)
        self.assertIn('liked', like_res.get_json())
        self.assertIn('likes_count', like_res.get_json())

        # Post comment
        comm_res = self.client.post(f'/api/v1/complaints/{c1_id}/comments', headers=headers, json={
            'comment_text': 'I spoke with the IT lab admin, replacement bulb is on order.'
        })
        self.assertEqual(comm_res.status_code, 201)
        self.assertIn('comment', comm_res.get_json())

        # Get comments
        get_comm = self.client.get(f'/api/v1/complaints/{c1_id}/comments', headers=headers)
        self.assertEqual(get_comm.status_code, 200)
        self.assertTrue(len(get_comm.get_json()['comments']) > 0)

    def test_13_public_feedback(self):
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        with self.app.app_context():
            c2 = Complaint.query.filter_by(complaint_number='CC-2026-0002').first()
            c2_id = c2.id

        # Submit feedback
        fb_res = self.client.post(f'/api/v1/complaints/{c2_id}/feedback', headers=headers, json={
            'rating': 5,
            'comment': 'Suresh arrived quickly and fixed the pipe leakage without mess. Excellent service!'
        })
        self.assertEqual(fb_res.status_code, 200)
        self.assertEqual(fb_res.get_json()['feedback']['rating'], 5)

        # Get public feedback overview
        get_fb = self.client.get('/api/v1/complaints/feedback', headers=headers)
        self.assertEqual(get_fb.status_code, 200)
        self.assertTrue(get_fb.get_json()['total_feedbacks'] > 0)
        self.assertGreaterEqual(get_fb.get_json()['average_rating'], 1.0)

    def test_14_issue_tracker_and_public_feed(self):
        login_res = self.client.post('/api/v1/auth/login', json={
            'email': 'alex.student@campuscare.edu',
            'password': 'Student@123'
        })
        token = login_res.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Issue Tracker
        tr_res = self.client.get('/api/v1/complaints/tracker', headers=headers)
        self.assertEqual(tr_res.status_code, 200)
        items = tr_res.get_json()['items']
        self.assertTrue(len(items) > 0)
        self.assertIn('tracking', items[0])
        self.assertIn('current_step', items[0]['tracking'])
        self.assertIn('progress_percentage', items[0]['tracking'])

        # Public Feed
        feed_res = self.client.get('/api/v1/complaints/public-feed?tab=all', headers=headers)
        self.assertEqual(feed_res.status_code, 200)
        feed_items = feed_res.get_json()['feed']
        self.assertTrue(len(feed_items) > 0)
        self.assertIn('likes_count', feed_items[0])
        self.assertIn('comments_count', feed_items[0])

    def test_15_notifications_and_cost_approval(self):
        # 1. Admin logs in via admin endpoint
        admin_login = self.client.post('/api/v1/auth/admin-login', json={
            'email': 'admin@campuscare.edu',
            'password': 'Admin@123'
        })
        admin_token = admin_login.get_json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        # 2. Check admin notifications (should have notification from staff resolution)
        notif_res = self.client.get('/api/v1/notifications', headers=admin_headers)
        self.assertEqual(notif_res.status_code, 200)
        self.assertTrue(len(notif_res.get_json()['notifications']) > 0)
        first_notif = notif_res.get_json()['notifications'][0]

        # 3. Mark single notification as read
        mark_read = self.client.patch(f'/api/v1/notifications/{first_notif["id"]}/read', headers=admin_headers)
        self.assertEqual(mark_read.status_code, 200)

        # 4. Mark all notifications as read
        mark_all = self.client.patch('/api/v1/notifications/read-all', headers=admin_headers)
        self.assertEqual(mark_all.status_code, 200)
        self.assertEqual(mark_all.get_json()['unread_count'], 0)

        # 5. Admin approves cost for resolved complaint (c2 was resolved in test_08 with cost 550.0)
        with self.app.app_context():
            c2 = Complaint.query.filter_by(complaint_number='CC-2026-0002').first()
            c2_id = c2.id

        cost_approve_res = self.client.patch(f'/api/v1/admin/complaints/{c2_id}/approve-cost', headers=admin_headers, json={
            'approved': True,
            'remarks': 'Approved pipe repair material expenses.'
        })
        self.assertEqual(cost_approve_res.status_code, 200)
        res_data = cost_approve_res.get_json()['resolution']
        self.assertTrue(res_data['is_cost_approved'])
        self.assertEqual(res_data['cost_status'], 'approved')
        self.assertEqual(res_data['cost_amount'], 550.0)

        # 6. Verify staff received notification about cost approval
        staff_login = self.client.post('/api/v1/auth/login', json={
            'email': 'suresh.plumber@campuscare.edu',
            'password': 'Staff@123'
        })
        staff_token = staff_login.get_json()['access_token']
        staff_headers = {'Authorization': f'Bearer {staff_token}'}

        staff_notifs = self.client.get('/api/v1/notifications', headers=staff_headers)
        self.assertEqual(staff_notifs.status_code, 200)
        self.assertTrue(any('Cost Approved' in n['title'] or 'Approved' in n['title'] for n in staff_notifs.get_json()['notifications']))

if __name__ == '__main__':
    unittest.main()
