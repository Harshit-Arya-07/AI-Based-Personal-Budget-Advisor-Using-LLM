# BudgetAI - Migrated Architecture

A modern fintech budget tracking application with AI-powered insights, built with Next.js and Express.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 with Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Auth**: Firebase Client SDK

### Backend
- **Runtime**: Node.js with Express
- **Database**: Firebase Firestore
- **Auth**: Firebase Admin SDK
- **AI**: Google Gemini 1.5 Flash

## Project Structure

```
migrated/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebaseAdmin.js    # Firebase Admin init
│   │   │   └── gemini.js           # Gemini AI config
│   │   ├── controllers/
│   │   │   └── budgetController.js # All API handlers
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # Firebase token verification
│   │   ├── routes/
│   │   │   └── budgetRoutes.js     # API routes
│   │   ├── services/
│   │   │   ├── firestoreService.js # Firestore CRUD operations
│   │   │   └── financeService.js   # Financial calculations
│   │   ├── app.js                  # Express app setup
│   │   └── server.js               # Server entry point
│   └── package.json
│
└── frontend/                   # Next.js frontend
    ├── app/
    │   ├── (dashboard)/        # Protected route group
    │   │   ├── dashboard/
    │   │   ├── expenses/
    │   │   ├── analytics/
    │   │   ├── history/
    │   │   ├── ai-chat/
    │   │   ├── profile/
    │   │   └── layout.tsx      # Dashboard layout with auth
    │   ├── page.tsx            # Login page
    │   ├── layout.tsx          # Root layout
    │   └── globals.css         # Global styles
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── BottomNav.tsx
    │   ├── BalanceCard.tsx
    │   ├── AIInsights.tsx
    │   ├── Analytics.tsx
    │   ├── ExpenseTracker.tsx
    │   ├── RecentTransactions.tsx
    │   ├── FinancialHealthScore.tsx
    │   ├── BurnRateProjection.tsx
    │   ├── CategoryTrendWarnings.tsx
    │   ├── SavingsGoals.tsx
    │   ├── WhatIfSimulator.tsx
    │   ├── AIChat.tsx
    │   └── Profile.tsx
    ├── lib/
    │   ├── types.ts            # TypeScript types
    │   ├── firebase.ts         # Firebase client init
    │   ├── api.ts              # API client functions
    │   ├── financialHealth.ts  # Health score calculation
    │   ├── burnRateProjection.ts
    │   ├── categoryTrends.ts
    │   ├── savingsGoals.ts
    │   ├── whatIfSimulator.ts
    │   └── utils.ts
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore enabled
- Gemini API key from Google AI Studio

### 1. Backend Setup

```bash
cd migrated/backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env with your credentials:
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
# - GEMINI_API_KEY

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd migrated/frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local

# Edit .env.local with your credentials:
# - NEXT_PUBLIC_API_URL (default: http://localhost:3000)
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID

# Start development server
npm run dev
```

### 3. Firebase Configuration

1. Go to Firebase Console > Project Settings
2. Under "Service accounts", generate a new private key for backend
3. Under "General" > "Your apps", get the web config for frontend
4. Enable Google Authentication in Firebase Console > Authentication
5. Set up Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /budgets/{budgetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget/profile` | Get user profile |
| PUT | `/api/budget/profile` | Update user settings |
| GET | `/api/budget/expenses` | Get all expenses |
| POST | `/api/budget/expenses` | Add new expense |
| DELETE | `/api/budget/expenses/:id` | Delete expense |
| GET | `/api/budget/goals` | Get savings goals |
| POST | `/api/budget/goals` | Add new goal |
| DELETE | `/api/budget/goals/:id` | Delete goal |
| GET | `/api/budget/history` | Get expense history |
| GET | `/api/budget/budgets` | Get monthly budget |
| POST | `/api/budget/analyze` | AI financial analysis |
| POST | `/api/budget/chat` | AI chat assistant |

## Features

- 🔐 **Secure Authentication**: Google Sign-In with Firebase
- 💰 **Expense Tracking**: Add, view, and delete expenses
- 📊 **Analytics**: Visual spending breakdowns with charts
- 🎯 **Savings Goals**: Track progress towards financial goals
- 🤖 **AI Insights**: Gemini-powered financial analysis
- 💬 **AI Chat**: Ask questions about your finances
- 📈 **Financial Health**: Score and recommendations
- 🔥 **Burn Rate**: Spending projection analysis
- ⚠️ **Spending Alerts**: Category trend warnings
- 🔮 **What-If Simulator**: Scenario planning tool

## Design System

### Colors
- **Primary Navy**: `#0B1A3E`
- **Indigo**: `#4F6EF7`
- **Purple**: `#8B5CF6`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Destructive**: `#DC3545`

### Typography
- Font: System font stack (SF Pro, Inter, etc.)
- Heading weights: 600-700
- Body weights: 400-500

## Development

```bash
# Run both frontend and backend
# Terminal 1 (Backend):
cd migrated/backend && npm run dev

# Terminal 2 (Frontend):
cd migrated/frontend && npm run dev
```

Frontend runs on `http://localhost:3001`
Backend runs on `http://localhost:3000`

## License

MIT
