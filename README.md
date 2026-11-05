# 🏛️ CampusCare — Smart Campus Maintenance Management System

> **Centralized digital platform connecting students, maintenance staff, and administrators with intelligent duplicate complaint detection, an explainable priority scoring engine, and transparent real-time tracking.**

---

## 🚀 Live Demo & Presentation Scenario

CampusCare is designed to satisfy the complete hackathon demonstration scenario out-of-the-box:

1. **Student A (Alex Mercer)** reports a ceiling projector failure in **Block A, Room 101**.
2. **Student B (Priya Patel)** starts reporting the same projector failure.
3. **CampusCare Duplicate Engine** identifies the match and alerts Student B with exact similarity scoring (`68% - 85%+ Match`), location match, category match, and existing complaint details.
4. **Student B can choose either:**
   - **Support Existing Complaint**: Immediately increments affected users count and boosts complaint priority.
   - **Submit New Complaint Anyway**: Stores as a separate complaint record and preserves the duplicate relationship for administrative review (demonstrating that duplicates are never blocked!).
5. **Student C (Rahul Verma)** reports water leakage / sparking electrical hazard.
6. **Intelligent Priority Engine**: Displays dynamic recalculation in real-time as affected users increase or pending duration grows.
7. **Administrator (Dr. Sarah Mitchell)** reviews the Priority Queue, acknowledges complaints, and assigns staff with load balancing.
8. **Staff (Suresh Sharma / Rajesh Kumar)** receives task, starts work (`In Progress`), records repair notes with completion photos, and marks `Resolved`.
9. **Student Dashboard** reflects the updated lifecycle timeline, and **Admin Dashboard** updates operational analytics in real time.

---

## 🔑 Demo Accounts (1-Click Switcher Available in UI)

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Administrator** | Dr. Sarah Mitchell | `admin@campuscare.edu` | `Admin@123` | Campus Operations Lead |
| **Staff (Electrical)** | Rajesh Kumar | `rajesh.electrician@campuscare.edu` | `Staff@123` | Power Systems & Circuits |
| **Staff (Plumbing)** | Suresh Sharma | `suresh.plumber@campuscare.edu` | `Staff@123` | Water, Sanitation & Drainage |
| **Staff (Hardware)** | Anita Rao | `anita.it@campuscare.edu` | `Staff@123` | Projectors & Network Hardware |
| **Student (Reporter)** | Alex Mercer | `alex.student@campuscare.edu` | `Student@123` | Computer Science |
| **Student (Duplicate/Supporter)**| Priya Patel | `priya.student@campuscare.edu` | `Student@123` | Mechanical Engineering |

*Note: The application header includes a "Demo Switcher" dropdown to instantly swap sessions between roles with a single click during demonstrations.*

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS | High-performance SPA with custom SaaS dark theme |
| **Styling & Icons** | Tailwind CSS, Lucide React, Framer Motion | Smooth 150-300ms transitions, modal animations, alerts |
| **Data Visualization**| Recharts | Donut, Category Bar, Monthly Trends Line, and Priority Bar charts |
| **Backend** | Python 3 Flask, REST API | Modular application factory, Blueprints |
| **Authentication** | Flask-JWT-Extended, Werkzeug | Role-based `@role_required` access control, secure password hashing |
| **ORM & Database** | SQLAlchemy, PostgreSQL (Supabase) | SQLite local fallback for instant zero-dependency testing |
| **AI / NLP Duplicate Detection** | Scikit-learn (TF-IDF + Cosine Similarity) | Multi-factor similarity weighted engine |
| **Image Storage** | Supabase Storage (`complaint-images`) | Fallback to local uploads when running offline |

---

## 🧠 Core Engineering Highlights

### 1. Hybrid Duplicate Complaint Detection Engine
- **Stage 1 (Location Filtering - 40% Weight):** Hierarchical room/floor/building proximity scoring.
- **Stage 2 (Category Matching - 20% Weight):** Exact categorical alignment check.
- **Stage 3 (Description Semantic Overlap - 40% Weight):** Scikit-learn TF-IDF vectorization with n-grams (1, 2) and cosine similarity.
- **Combined Weighted Formula:**
  $$\text{Similarity Score} = (\text{Location} \times 0.40) + (\text{Category} \times 0.20) + (\text{Text} \times 0.40) \times 100$$
- **Threshold Interpretations:**
  - $\ge 85\%$: Strong possible duplicate
  - $65\% - 84\%$: Potentially related
  - $< 65\%$: No strong match
- **Business Rule:** Suggestions are advisory; students always retain the choice to submit a separate report or add their support.

### 2. Explainable Priority Scoring Engine
- **Formula (0 to 100 Score):**
  $$\text{Priority Score} = \text{Severity Score} (0\text{–}40) + \text{Affected Users Score} (0\text{–}30) + \text{Pending Time Score} (0\text{–}30)$$
  - **Severity Score:** $\text{Severity Level (1-5)} \times 8$
  - **Affected Users Score:** $\min(\text{Affected Users} \times 3, 30)$
  - **Pending Time Score:** $\min\left(\frac{\text{Pending Hours}}{24} \times 5, 30\right)$
- **Classification:**
  - `0–30`: Low | `31–60`: Medium | `61–80`: High | `81–100`: Critical
- **Safety Escalation:** Automatic hazard detection (sparking, exposed wiring, gas leaks, structural ceiling collapse) ensures immediate flagging.
- **Transparent Output:** "Why this priority?" collapsible accordion detailing point contributions and natural language explanation sentences.

---

## 📁 Repository Directory Structure

```text
campuscare/
├── backend/
│   ├── app/
│   │   ├── __init__.py               # Flask application factory, CORS, static uploads
│   │   ├── config.py                 # Configuration, JWT secrets, database URI
│   │   ├── extensions.py             # SQLAlchemy, JWTManager, CORS
│   │   ├── models/                   # PostgreSQL Data Models
│   │   │   ├── user.py               # Users (Student, Staff, Admin)
│   │   │   ├── campus.py             # Buildings, Floors, Rooms, Categories
│   │   │   ├── complaint.py          # Complaints, Supports, Duplicate relationships
│   │   │   ├── assignment.py         # Staff assignment history
│   │   │   └── history.py            # Status history transitions, Resolutions, Notifications
│   │   ├── routes/                   # REST API Blueprints
│   │   │   ├── auth.py               # Register, Login, Me, Logout
│   │   │   ├── complaints.py         # Submit, List, Check-duplicates, Support, Details
│   │   │   ├── admin.py              # Acknowledge, Assign staff, Update severity, Reopen
│   │   │   ├── staff.py              # Assigned tasks, Start work, Submit resolution
│   │   │   ├── analytics.py          # Summary KPIs, Charts distribution, Trends
│   │   │   └── campus.py             # Campus location hierarchy
│   │   ├── services/                 # Core Business Logic
│   │   │   ├── duplicate_detector.py # Scikit-learn TF-IDF + Cosine similarity engine
│   │   │   ├── priority_engine.py    # Explainable priority engine
│   │   │   ├── assignment_service.py # Workload calculations & task delegation
│   │   │   └── storage_service.py    # Supabase Storage + local fallback
│   │   └── utils/
│   │       ├── decorators.py         # @jwt_required_custom, @role_required
│   │       └── validators.py         # String sanitization & email format validation
│   ├── tests/
│   │   └── test_e2e.py               # 10 comprehensive end-to-end integration tests
│   ├── seed.py                       # Database seeding & demo scenario initializer
│   ├── run.py                        # Entrypoint script
│   ├── requirements.txt              # Production Python dependencies
│   ├── Procfile                      # Render start command (gunicorn run:app)
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Button, Badge, Card, Modal, StatCard
│   │   │   ├── layout/               # Navbar (with Demo Switcher), Sidebar, DashboardLayout
│   │   │   ├── complaints/           # PriorityExplainer, DuplicateWarningModal, Timeline, Card
│   │   │   └── charts/               # Donut, Bar, Trends Line, Priority charts
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth session & instant role switching
│   │   │   └── ToastContext.jsx      # Framer motion toast alerts
│   │   ├── pages/
│   │   │   ├── auth/                 # LoginPage, RegisterPage
│   │   │   ├── student/              # Dashboard, SubmitComplaint, MyComplaints, CampusFeed, Detail
│   │   │   ├── admin/                # AdminDashboard, ComplaintsQueue, StaffManagement, Analytics, Users
│   │   │   └── staff/                # StaffDashboard with Task Resolution modal
│   │   ├── services/                 # Frontend API client
│   │   ├── App.jsx                   # Role-guarded routing
│   │   └── index.css                 # Dark SaaS design system tokens
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json                   # Vercel SPA rewrites
│   └── .env.example
└── README.md
```

---

## 🏃 Quickstart (Local Development)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed database with the complete hackathon scenario
python seed.py

# Run Flask server (listens on port 5000)
python run.py
```
*Health Check: `http://localhost:5000/api/v1/health`*

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*Open `http://localhost:5173` in your browser.*

### 3. Run Automated Integration Tests
```bash
cd backend
python -m unittest tests/test_e2e.py
```

---

## 🌐 Production Deployment Guide

### A. Database & Storage: Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Under **Storage**, create a new bucket named `complaint-images`.
3. In **Settings > Database**, copy your `Connection string (URI)`.

### B. Backend: Render
1. Push the repository to GitHub.
2. In Render, create a new **Web Service** connecting your repository.
3. Set **Root Directory** to `backend`.
4. Environment variables to configure:
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   SECRET_KEY=your-production-secret-key
   JWT_SECRET_KEY=your-production-jwt-secret-key
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_STORAGE_BUCKET=complaint-images
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `gunicorn run:app`

### C. Frontend: Vercel
1. In Vercel, import your GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variable:
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```
6. Deploy! The `vercel.json` rewrite file ensures direct URL refreshes work smoothly with React Router.
