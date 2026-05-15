# CRIMSON — AI-Powered Crime Reporting & Predictive Policing System with Victim Support Management

A full-stack web application for Sri Lanka's public safety ecosystem.
Supports three roles: Citizens, Police Officers, and Administrators.

---

## Features

### Citizens
- Crime reporting with category, location, and evidence upload
- Real-time crime heatmap
- SOS emergency alerts
- AI-powered chatbot assistant
- Support ticket system

### Police Officers
- Case management dashboard
- Offender & victim records
- Predictive analytics (crime forecasting, hotspots)
- Secure officer-to-officer chat
- Report review workflow

### Administrators
- User & officer management
- Role-based permission control
- System health monitoring
- Audit log
- Data import/export management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router v7 |
| Backend | Node.js, Express.js 5, MongoDB Atlas |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| ML Service | Python, FastAPI, Keras (LSTM), scikit-learn |
| Maps | Leaflet.js |
| i18n | i18next (EN / SI / TA) |

---

## ML Models

- **LSTM** — Crime volume time-series forecasting
- **DBSCAN** — Crime hotspot clustering
- **Random Forest** — Offender recidivism prediction
- **NLP** — Crime category classification
- **Vulnerability Scoring** — District-level risk assessment

---

## Project Structure

```
CRIMSON/
├── backend/         # Express.js REST API
├── frontend/        # React + Vite SPA
└── ml-service/      # FastAPI ML inference server
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account

### 1. Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI, JWT_SECRET, PORT
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --port 8000
```

---

## Environment Variables

.env
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
PORT=5000
GEMINI_API_KEY=your_gemini_key
```

---

## Demo Login Credentials (For Evaluation Only)

Use the following demo accounts to access role-based dashboards.

### Officer Demo Login
- Full Name: Officer Silva
- District: Colombo
- Email: officer@crimson.gov.lk
- Password: Officer@1234

### Admin Demo Login
- Email: admin@crimson.gov.lk
- Password: Admin@1234






