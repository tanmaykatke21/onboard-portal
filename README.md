# Onboard — Client Onboarding Portal

A full-stack SaaS platform for creative agencies to manage their entire client lifecycle — from onboarding and contracts to payments and deliverables.

## Tech Stack

- **Frontend:** React (CRA) + Tailwind CSS
- **Backend:** Express.js + MongoDB Atlas
- **Auth:** Firebase Authentication
- **Payments:** Stripe (test mode)
- **File Storage:** Multer (local uploads)

## Features

### Admin Portal
- **Dashboard** — Stats overview, recent clients, quick actions
- **Client Management** — Add clients (auto-creates Firebase account + sends password reset email), search/filter
- **Agreements** — Create contracts with terms, track signature status
- **Invoices** — Line-item invoices, Stripe payment processing, payment tracking

### Client Portal
- **Dashboard** — Project overview, current phase, quick navigation
- **Documents** — View and e-sign agreements, pay invoices with Stripe
- **Timeline** — Track project milestones and progress
- **Deliverables** — Download files uploaded by admin
- **Reports** — View monthly performance reports with metrics

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project (with Email/Password auth enabled)
- Stripe account (test mode)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd onboard-portal

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Copy `server/.env.example` to `server/.env` and fill in:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/onboard
PORT=5000
STRIPE_SECRET_KEY=sk_test_xxxx
CLIENT_URL=http://localhost:3000
```

Update `client/src/config/firebase.js` with your Firebase config.

### 3. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm start
```

### 4. Test

1. Go to `http://localhost:3000/register` → create admin account
2. Go to Admin Dashboard → Add a client
3. Client receives password reset email → sets password → logs in
4. Client sees their portal with project info

## Folder Structure

```
onboard-portal/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Navbar, Layout, ProtectedRoute
│       ├── config/          # Firebase config
│       ├── context/         # AuthContext
│       ├── pages/
│       │   ├── admin/       # AdminDashboard, ClientList, Agreements, Invoices
│       │   ├── auth/        # Login, Register
│       │   └── client/      # ClientDashboard, Documents, Timeline, Deliverables, Reports
│       ├── services/        # Axios API config
│       └── App.js           # All routes
│
└── server/                  # Express backend
    ├── config/              # MongoDB connection
    ├── routes/              # users, projects, agreements, invoices, timeline, deliverables, reports, stripe
    └── server.js            # Entry point
```

## MongoDB Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| users | User profiles & roles | firebaseUid, name, email, role, projectId |
| projects | Client projects | clientId, projectName, status, currentPhase |
| agreements | Contracts & signatures | projectId, clientId, terms, status, signedAt |
| invoices | Billing & payments | projectId, items, total, status, stripePaymentId |
| timeline | Project milestones | projectId, phase, taskName, status |
| deliverables | File uploads | projectId, fileName, filePath, category |
| reports | Monthly performance | projectId, month, metrics, highlights |

## Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 3220 | 3D Secure required |

Use any future date for expiry and any 3 digits for CVC.
