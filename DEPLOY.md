# Deployment Guide — AlgoTerm

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────┐
│   Frontend   │────▶│   Backend   │────▶│ Postgres │
│  Vite/React  │     │   FastAPI   │     │    DB    │
│  (Static)    │     │  (Python)   │     │          │
└─────────────┘     └─────────────┘     └──────────┘
    Vercel /           Render /           Supabase /
    Netlify            Railway            Neon
```

---

## Option 1: Vercel (Frontend) + Render (Backend) — Recommended Free

### Step 1: Prepare the Backend

1. **Add `joblib` to requirements** (needed for ML models):
   ```
   # backend/requirements.txt — already has everything needed
   # Add aiosqlite if you want SQLite instead of Postgres:
   aiosqlite
   ```

2. **Create `backend/Procfile`** (for Render):
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Set up a free Postgres database**:
   - Go to [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
   - Create a project, copy the connection string
   - Format: `postgresql+asyncpg://user:pass@host/dbname`

### Step 2: Deploy Backend on Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   | Setting | Value |
   |---|---|
   | **Root Directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
5. Add **Environment Variable**:
   - `DATABASE_URL` = `postgresql+asyncpg://user:pass@host/dbname`
6. Click **Deploy**. Note the URL (e.g. `https://algoterm-api.onrender.com`)

### Step 3: Prepare Frontend for Production

Update `frontend/src/api.js` to use the deployed backend URL:

```javascript
// frontend/src/api.js — line 3
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
```

### Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo
3. Settings:
   | Setting | Value |
   |---|---|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
4. Add **Environment Variable**:
   - `VITE_API_URL` = `https://algoterm-api.onrender.com/api/v1`
5. Click **Deploy**

### Step 5: Configure Redirects for SPA

Create `frontend/public/_redirects` (for Netlify) or `frontend/vercel.json`:

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Option 2: Railway (Full Stack) — Simplest

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Add **two services** from the same repo:
   - **Backend**: Root = `backend/`, Start = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Frontend**: Root = `frontend/`, Build = `npm run build`, static site
4. Add a **Postgres plugin** directly in Railway
5. Railway auto-injects `DATABASE_URL`
6. Set `VITE_API_URL` in the frontend service to the backend's Railway URL

---

## Option 3: VPS (DigitalOcean / AWS EC2)

### Server Setup
```bash
# SSH into your server
sudo apt update && sudo apt install -y python3.11 python3.11-venv nodejs npm nginx certbot

# Clone repo
git clone https://github.com/your-username/algo-trading-platform.git
cd algo-trading-platform
```

### Backend
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
echo 'DATABASE_URL=postgresql+asyncpg://user:pass@localhost/algoterm' > .env

# Run with Gunicorn (production)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

### Frontend
```bash
cd ../frontend
npm install
VITE_API_URL=https://yourdomain.com/api/v1 npm run build
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend — serve static files
    location / {
        root /path/to/algo-trading-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL
```bash
sudo certbot --nginx -d yourdomain.com
```

### Systemd Service (Keep backend running)
```ini
# /etc/systemd/system/algoterm.service
[Unit]
Description=AlgoTerm Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/algo-trading-platform/backend
Environment=DATABASE_URL=postgresql+asyncpg://user:pass@localhost/algoterm
ExecStart=/path/to/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable algoterm
sudo systemctl start algoterm
```

---

## Quick Checklist Before Deploying

- [ ] Push all code to GitHub
- [ ] Update `frontend/src/api.js` line 3 to use `import.meta.env.VITE_API_URL || '/api/v1'`
- [ ] Create `frontend/vercel.json` for SPA routing
- [ ] Have a Postgres connection string ready
- [ ] Train ML model locally first (`/api/v1/ml/train/{symbol}`) — model file will need to be included in deploy or retrained on server
