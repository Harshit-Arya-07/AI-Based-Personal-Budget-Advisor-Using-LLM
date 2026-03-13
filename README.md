# BudgetAI

AI-powered personal finance companion that helps users track expenses, analyze spending behavior, and get actionable budgeting guidance through a modern dashboard + chat assistant.

---

## ✨ Highlights

- 📊 Smart dashboard for income, expenses, trends, and health score
- 🤖 AI insights + conversational finance assistant (Gemini)
- 🎯 Savings goals and monthly progress tracking
- 🔐 Firebase Authentication + Firestore user-scoped data model
- 📱 Responsive UI with dashboard pages for analytics, history, profile, and settings

---

## 🧱 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Firebase Client SDK

### Backend
- Node.js + Express
- Firebase Admin SDK
- Firestore
- Google Gemini API

---

## 📂 Project Structure

```bash
BudgetAI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── frontend/
    ├── app/
    ├── components/
    ├── lib/
    └── package.json
```

---

## 🚀 Quick Start (Local)

### 1) Prerequisites

- Node.js 18+
- Firebase project (Auth + Firestore enabled)
- Gemini API key

### 2) Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set these variables in `backend/.env`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `PORT` (optional)
- `GEMINI_TIMEOUT_MS` (optional)

### 3) Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Set these variables in `frontend/.env.local`:

- `NEXT_PUBLIC_BACKEND_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 4) Run App

- Frontend: `http://localhost:3001`
- Backend health: `http://localhost:3000/health`

---

## 🌐 Deployment (Recommended)

- **Frontend:** Vercel
- **Backend:** Render

### Backend (Render)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add backend env vars

### Frontend (Vercel)
- Root directory: `frontend`
- Framework: Next.js
- Set `NEXT_PUBLIC_BACKEND_URL` to your Render URL

---

## 🔌 Core API Routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET/POST/DELETE | `/api/budget/expenses` | Expense management |
| GET/POST/DELETE | `/api/budget/goals` | Goals management |
| GET | `/api/budget/history` | Expense history |
| POST | `/api/budget/analyze` | AI analysis |
| POST | `/api/budget/chat/send` | AI chat response |
| GET/DELETE | `/api/budget/chat/history` | Chat history |
| GET/PUT | `/api/budget/chat/personality` | AI personality mode |

---

## 🛡️ Security Notes

- Never commit `.env` files.
- Rotate keys immediately if exposed (Firebase service account, Gemini API key).
- Keep Firebase Auth authorized domains updated for deployed frontend URLs.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## 📄 License

MIT
