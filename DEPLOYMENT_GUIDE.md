# Nimma Mithra — Full Stack Cloud Deployment Guide

This guide covers deploying **Nimma Mithra** (Smart Campus Maintenance Management System) to free production cloud hosting:

- **Frontend**: [Vercel](https://vercel.com) (React 18 + Vite + Tailwind CSS)
- **Backend API**: [Render](https://render.com) (Python Flask + Gunicorn WSGI)
- **Database**: [Supabase](https://supabase.com) (Managed PostgreSQL)
- **Storage** *(Optional)*: Supabase Storage Bucket

---

## Architecture Overview

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Vercel (React Frontend)     │       │    Render (Python Flask API)    │
│  https://nimma-mithra.vercel.app│ ───►  │ https://nimma-mithra.onrender...│
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           ▼
                                          ┌─────────────────────────────────┐
                                          │      Supabase (PostgreSQL)      │
                                          │  aws-0-xx.pooler.supabase.com   │
                                          └─────────────────────────────────┘
```

---

## Phase 1: Database Setup (Supabase PostgreSQL)

1. Go to [supabase.com](https://supabase.com) and create an account or sign in.
2. Click **New Project**:
   - **Name**: `nimma-mithra` (or `campuscare`)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Choose the region closest to your users (e.g. `South Asia (Mumbai)` or `Singapore`).
   - Click **Create new project** (takes ~1-2 minutes to provision).
3. Retrieve your PostgreSQL connection string:
   - In Supabase, go to **Project Settings** (gear icon) ➔ **Database**.
   - Scroll to **Connection string** ➔ Select the **URI** tab.
   - Select **Mode: Session** (Port `5432` or `6543`).
   - Copy the URI string. It looks like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the password you chose in Step 2.
4. *(Optional) Image Storage Bucket*:
   - In Supabase, click **Storage** in the sidebar.
   - Click **New Bucket**.
   - **Bucket name**: `complaint-images`
   - Toggle **Public bucket** to `ON`.
   - Click **Save**.
   - In **Project Settings** ➔ **API**, copy your **Project URL** and **`service_role` secret key**.

---

## Phase 2: Backend API Deployment (Render.com)

1. Push your repository to GitHub (ensure branch is `main` or `master`).
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. On the Render Dashboard, click **New +** ➔ **Web Service**.
4. Select **Build and deploy from a Git repository** ➔ Click **Next**.
5. Choose your repository and configure the service:

| Setting | Value |
|---|---|
| **Name** | `nimma-mithra-api` |
| **Region** | Singapore / Frankfurt / Oregon |
| **Branch** | `main` (or `master`) |
| **Root Directory** | `backend` *(Important!)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn run:app` |
| **Instance Type** | `Free` |

6. Scroll down to **Environment Variables** and add the following:

| Key | Value | Description |
|---|---|---|
| `FLASK_ENV` | `production` | Enables production mode |
| `SECRET_KEY` | *(generate random 32-char string)* | Flask session secret |
| `JWT_SECRET_KEY` | *(generate random 32-char string)* | JWT signing secret |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | `24` | Token lifespan |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]...` | Your Supabase PostgreSQL URI |
| `FRONTEND_URL` | `*` | *(Update to your Vercel URL after Phase 3)* |
| `MAX_CONTENT_LENGTH` | `5242880` | 5 MB upload limit |
| `SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | *(Optional, for Supabase storage)* |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | *(Optional, for Supabase storage)* |
| `SUPABASE_STORAGE_BUCKET` | `complaint-images` | Bucket name |

7. Click **Deploy Web Service**.
8. Render will build and launch your Flask service.
   - On the first deployment, `backend/run.py` will **automatically connect to Supabase, create all PostgreSQL tables**, and **auto-seed the campus infrastructure and master administrator (`admin@techfusion.com` / `Admin@123`)**!
9. Once deployment finishes, copy your live backend URL from the top of Render (e.g. `https://nimma-mithra-api.onrender.com`).
10. Test your backend by visiting:
    ```
    https://nimma-mithra-api.onrender.com/api/v1/health
    ```
    You should see:
    ```json
    {"application": "CampusCare", "status": "healthy", "version": "1.0.0"}
    ```

---

## Phase 3: Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Locate your GitHub repository and click **Import**.
4. Configure the Project Settings:
   - **Framework Preset**: `Vite` (detected automatically)
   - **Root Directory**: Click **Edit** and choose `frontend` *(Important!)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://nimma-mithra-api.onrender.com/api/v1` *(Your Render backend URL with `/api/v1`)* |

6. Click **Deploy**.
7. Vercel will install npm packages, compile the Vite production bundle, and output your live URL (e.g., `https://nimma-mithra.vercel.app`).

---

## Phase 4: Final Link & Verification

1. **Update Allowed CORS Origin**:
   - Go back to your [Render Dashboard](https://dashboard.render.com) ➔ `nimma-mithra-api` ➔ **Environment**.
   - Change `FRONTEND_URL` from `*` to your exact Vercel URL (e.g. `https://nimma-mithra.vercel.app`).
   - Click **Save Changes** (Render will automatically redeploy).
2. **Test Live System**:
   - Open your Vercel URL (`https://nimma-mithra.vercel.app`).
   - Navigate to the **Admin Portal** at `/admin/login`.
   - Sign in with:
     - **Email**: `admin@techfusion.com`
     - **Password**: `Admin@123`
   - Create staff accounts in **Staff Management** (`/admin/staff`).
   - Register students at `/register`.
   - File, assign, track, resolve with repair costs, and approve complaints!

---

## Production FAQ & Troubleshooting

### 1. Render Free Tier Spin-Down
Render's free tier spins down inactive web services after 15 minutes of inactivity. When a new request arrives, it may take 20–40 seconds to spin back up (cold start). Subsequent requests respond instantly.

### 2. SQLAlchemy / psycopg2 URI Format
Render and Supabase URIs may start with `postgres://`. The backend code in `backend/app/config.py` automatically rewrites this to `postgresql://` to maintain compatibility with SQLAlchemy 2.x.

### 3. Vercel Client-Side Routing
Client-side routes (`/admin/login`, `/student/tracker`, etc.) are handled via `frontend/vercel.json` rewrites, ensuring browser page refreshes will not produce 404 errors.
