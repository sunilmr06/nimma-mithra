# 🏛️ Nimma Mithra (ನಿಮ್ಮ ಮಿತ್ರ) — Smart Campus Maintenance & Issue Tracking System

> **A transparent, student-first digital platform connecting students, maintenance technicians, and campus administrators. Featuring intelligent duplicate detection, explainable priority scoring, an X (Twitter)-style live campus feed, real-time issue lifecycle tracking, and public quality feedback on solved issues.**

---

## ✨ Key Features & Enhancements

1. **🏛️ Rebranded to "Nimma Mithra" (ನಿಮ್ಮ ಮಿತ್ರ)**
   - Custom dark SaaS aesthetic with indigo & cyan accents, responsive on all devices.
   - 1-click **Instant Role Switcher** in navigation for seamless demonstration among Admin, Staff, and Student accounts.

2. **📊 Dashboard (Replaced Overview)**
   - Role-specific dynamic dashboards:
     - **Students**: Summary counts, active tracking widgets, quick report action, personal complaint history.
     - **Technicians (Staff)**: Task backlog, in-progress jobs, completion documentation modal with photos.
     - **Administrators**: Operational KPIs, priority queue, category distributions, monthly trends, technician workload balancing.

3. **📍 Issue Tracker (Track the Process of User-Posted Issues)**
   - Visual 5-step lifecycle stepper for every reported maintenance issue:
     1. **Report Submitted**: Stored & duplicate check completed.
     2. **Reviewed & Acknowledged**: Verified by university administrators.
     3. **Staff Assigned**: Dispatched to specialized technician (Electrical, Plumbing, IT, etc.).
     4. **Work In Progress**: Technician actively repairing on-site.
     5. **Issue Resolved**: Completed with repair notes and photo proof.
   - Dynamic progress percentage (20%, 40%, 60%, 80%, 100%) and pending duration indicators.

4. **🌟 Public Feedback (For All Solved Issues)**
   - Public quality assurance portal for completed campus repairs.
   - **Campus Satisfaction Score** (e.g., ⭐ 4.8 / 5.0) with star distribution breakdown.
   - Each completed item displays:
     - Before & after/completion photographs.
     - Technician notes on parts replaced and repairs executed.
     - Verified student star ratings & written reviews.
   - Interactive **"Rate a Solved Issue"** dialog allowing students to publish 1–5 star reviews.

5. **📱 Public Feed (X / Twitter-Style Campus Stream)**
   - Modern social stream of maintenance posts, updates, and community activity:
     - Filter tabs: **All Posts**, **Trending 🔥**, **Resolved ✅**, **My Reports 📝**.
     - **Interactive Like / Heart ❤️**: Live counter with instant toggle.
     - **Comments & Discussion Thread 💬**: Real-time replies, advice, and updates.
     - **Community Support 🚀**: Upvote existing complaints to escalate priority and prevent duplicates.
     - **Share 🔗**: Quick copy-to-clipboard link sharing.

6. **👤 User Profile & Avatar Upload**
   - Profile management with customizable photo avatar (drag & drop or click to upload).
   - Editable fields: Full Name, Department / Program, Phone Number, Bio / Status message.
   - Role badge, account email, and activity statistics.

7. **🚪 Logout**
   - Prominently accessible in the Top Navbar user dropdown, the Sidebar navigation footer, and the Profile page.

---

## 🔑 Demo Accounts (1-Click Switcher in Navbar)

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Administrator** | Dr. Sarah Mitchell | `admin@campuscare.edu` | `Admin@123` | Campus Operations Lead |
| **Staff (Electrical)** | Rajesh Kumar | `rajesh.electrician@campuscare.edu` | `Staff@123` | Power Systems & Circuits |
| **Staff (Plumbing)** | Suresh Sharma | `suresh.plumber@campuscare.edu` | `Staff@123` | Water, Sanitation & Drainage |
| **Staff (Hardware)** | Anita Rao | `anita.it@campuscare.edu` | `Staff@123` | Projectors & Network Hardware |
| **Student (Reporter)** | Alex Mercer | `alex.student@campuscare.edu` | `Student@123` | Computer Science |
| **Student (Duplicate/Supporter)**| Priya Patel | `priya.student@campuscare.edu` | `Student@123` | Mechanical Engineering |

---

## 🏃 Running the Application

### 1. Start Backend Server
```powershell
cd backend
python run.py
```
*Health Check: `http://localhost:5000/api/v1/health`*

### 2. Start Frontend Dev Server
```powershell
cd frontend
npm.cmd run dev
```
*Open `http://localhost:5173` in your browser.*

### 3. Run Automated Tests
```powershell
cd backend
python -m unittest tests/test_e2e.py
```
*(14 of 14 unit and integration tests passing)*
