# 🚀 Onboard — Client Onboarding Portal

A full-stack SaaS platform that replaces scattered tools like HoneyBook and Dubsado — giving creative agencies a single place to onboard clients, manage projects, process payments, and deliver work.

> **Live Demo:** [onboard-portal.vercel.app](https://onboard-portal.vercel.app)
> **Backend API:** [onboard-portal.onrender.com](https://onboard-portal.onrender.com)

---

<!-- Add a hero screenshot here -->
<!-- ![Dashboard Preview](./screenshots/admin-dashboard.png) -->

## ✨ What It Does

**Admin** creates a client → Firebase auto-generates their account → client receives a password reset email → client logs in to their own portal → signs agreements, pays invoices, tracks project progress, downloads deliverables, and views monthly reports.

Two completely different interfaces from a single codebase — powered by role-based access control.

---

## 🏗 Architecture

| Layer | Technology | Hosted On | Role |
|-------|-----------|-----------|------|
| 🖥 **Frontend** | React + Tailwind CSS | Vercel | UI, routing, auth state |
| 🔥 **Auth** | Firebase Auth | Google Cloud | Login, register, sessions, password reset |
| 🚀 **Backend** | Express.js (Node) | Render | REST API, business logic, file handling |
| 🍃 **Database** | MongoDB Atlas | AWS | 7 collections, all business data |
| 💳 **Payments** | Stripe (test mode) | Stripe | Payment intents, invoice processing |

### How it connects

```
👤 User
 ↓
⚛️ React (Vercel) ←——→ 🔥 Firebase Auth (sessions + credentials)
 ↓
🚀 Express API (Render) ←——→ 💳 Stripe (payments)
 ↓
🍃 MongoDB Atlas (users, projects, invoices, agreements, timeline, deliverables, reports)
```

> **Key decision:** Firebase handles auth (password hashing, sessions, reset emails). MongoDB stores business data (roles, projects, invoices). Linked by `firebaseUid` — Firebase's simplicity + MongoDB's flexibility.

### Data Flow

| Action | Flow |
|--------|------|
| **Register** | React → Firebase (create account) → Express → MongoDB (save profile with role) |
| **Login** | React → Firebase (verify credentials, return UID) → Express → MongoDB (fetch profile with role) |
| **Add Client** | React → Firebase (create account + send password reset email) → Express → MongoDB (create user + project, link both) |
| **Pay Invoice** | React → Express → Stripe (create payment intent) → Express → MongoDB (mark invoice paid) |
| **Sign Agreement** | React → Express → MongoDB (update status, log signature + timestamp + IP) |
| **Page Refresh** | Firebase `onAuthStateChanged` auto-detects session → Express → MongoDB (fetch profile) |

---

## 🎯 Features

### Admin Portal
| Feature | Description |
|---------|-------------|
| **Dashboard** | Stats overview (clients, projects, pending invoices, revenue), recent clients table, quick action cards |
| **Client Management** | Add clients with auto Firebase account creation + password reset email, search/filter client list |
| **Agreements** | Create contracts with line-by-line terms, track signature status across all clients |
| **Invoices** | Create itemized invoices with auto-calculated totals, track payment status via Stripe |

### Client Portal
| Feature | Description |
|---------|-------------|
| **Dashboard** | Project overview with current phase, status, start date, and quick navigation cards |
| **Documents** | View and e-sign agreements (typed signature with timestamp + IP logging), pay invoices via Stripe |
| **Timeline** | Track project milestones grouped by phase with progress bar and status indicators |
| **Deliverables** | Download files uploaded by admin with category icons, file sizes, and download counts |
| **Reports** | View monthly performance reports with metrics grid, highlights, and next steps |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React (CRA) | UI components and routing |
| **Styling** | Tailwind CSS | Responsive utility-first design |
| **Auth** | Firebase Auth | Email/password auth, session persistence, password reset |
| **Backend** | Express.js | REST API with 20+ endpoints |
| **Database** | MongoDB Atlas | 7 interconnected collections |
| **Payments** | Stripe (test mode) | Payment intent creation and processing |
| **File Upload** | Multer | Server-side file handling |
| **Deployment** | Vercel + Render | Frontend CDN + Backend hosting |

---

## 📦 MongoDB Schema

```
USERS ←——→ PROJECTS
              ├── AGREEMENTS    (e-signatures, terms)
              ├── INVOICES      (line items, Stripe payments)
              ├── TIMELINE      (milestones, phases)
              ├── DELIVERABLES  (file uploads/downloads)
              └── REPORTS       (monthly performance)

Link: USERS.firebaseUid ←→ Firebase Auth
Link: USERS.projectId ←→ PROJECTS._id
Link: PROJECTS.clientId ←→ USERS._id
All other collections link via projectId
```

| Collection | Key Fields |
|------------|------------|
| `users` | firebaseUid, name, email, role (admin/client), projectId |
| `projects` | clientId, projectName, status, currentPhase, startDate |
| `agreements` | projectId, clientId, title, terms[], status, signedAt, signatureName |
| `invoices` | projectId, invoiceNumber, items[], total, status, stripePaymentId |
| `timeline` | projectId, phase, taskName, status, dueDate |
| `deliverables` | projectId, fileName, filePath, fileSize, category, downloadCount |
| `reports` | projectId, month, year, overview, metrics{}, highlights[], nextSteps[] |

All collections are linked via MongoDB `ObjectId` references — zero data duplication.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project (Email/Password auth enabled)
- Stripe account (test mode — free)

### 1. Clone & Install

```bash
git clone https://github.com/tanmaykatke21/onboard-portal.git
cd onboard-portal

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Environment Setup

Create `server/.env`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/onboard
PORT=9000
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
CLIENT_URL=http://localhost:3000
```

Update `client/src/config/firebase.js` with your Firebase config from the Firebase Console.

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

1. Open `http://localhost:3000/register` → create admin account
2. Go to Admin Dashboard → Clients → Add Client
3. Client receives password reset email → sets password → logs in
4. Client sees their portal with project info, documents, timeline

---

## 🧪 Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 3220` | 🔐 3D Secure required |

Use any future expiry date and any 3-digit CVC.

---

## 📁 Project Structure

```
onboard-portal/
│
├── client/                      # React frontend
│   └── src/
│       ├── components/          # Navbar, Layout, ProtectedRoute
│       ├── config/              # Firebase configuration
│       ├── context/             # AuthContext (login, register, logout, addClient)
│       ├── services/            # Axios API instance
│       └── pages/
│           ├── auth/            # Login, Register
│           ├── admin/           # Dashboard, ClientList, Agreements, Invoices
│           └── client/          # Dashboard, Documents, Timeline, Deliverables, Reports
│
├── server/                      # Express backend
│   ├── config/                  # MongoDB Atlas connection
│   ├── routes/                  # 8 route files (users, projects, agreements,
│   │                            #   invoices, timeline, deliverables, reports, stripe)
│   └── server.js                # Entry point with all middleware
│
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/users` | Create user profile after Firebase register |
| `GET` | `/api/users/firebase/:uid` | Get user by Firebase UID |
| `GET` | `/api/users?role=client` | Get all clients (admin) |
| `POST` | `/api/projects` | Create project + link to user |
| `GET` | `/api/projects/:id` | Get project details |
| `POST` | `/api/agreements` | Create agreement with terms |
| `PUT` | `/api/agreements/:id/sign` | Client signs agreement |
| `POST` | `/api/invoices` | Create itemized invoice |
| `GET` | `/api/invoices/project/:id` | Get invoices for a project |
| `POST` | `/api/stripe/create-payment-intent` | Create Stripe payment |
| `POST` | `/api/stripe/payment-success` | Mark invoice as paid |
| `POST` | `/api/timeline` | Create timeline task |
| `POST` | `/api/deliverables` | Upload file (multipart) |
| `GET` | `/api/deliverables/:id/download` | Download file |
| `POST` | `/api/reports` | Create monthly report |
| `GET` | `/api/health` | Health check |

---

## 📝 Key Technical Decisions

**Why Firebase Auth + MongoDB (not just one)?**
Firebase handles the hard parts of auth (password hashing, session tokens, email verification, Google sign-in) but doesn't support custom fields like roles or project associations. MongoDB stores all business data linked by `firebaseUid`. Best of both worlds.

**Why separate collections instead of nested documents?**
Invoices, agreements, deliverables, and reports all grow independently. Keeping them in separate collections linked by `projectId` avoids MongoDB's 16MB document limit, makes queries faster, and follows relational design principles.

**Why Stripe test mode?**
Full payment infrastructure is implemented and production-ready. Switching to live mode requires only changing the API keys — no code changes needed.

---

## 🛡 Security Considerations

- Passwords are never stored — Firebase handles all credential management
- Role-based route protection on both frontend (ProtectedRoute) and backend (middleware)
- E-signatures log timestamp + IP address for audit trail
- File uploads limited to 50MB with Multer
- CORS restricted to the frontend domain
- Environment variables for all sensitive keys

---

## 📈 Future Improvements

- [ ] Real-time notifications via WebSockets
- [ ] Firebase Admin SDK for server-side token verification
- [ ] Email notifications for invoice due dates
- [ ] Stripe Elements for embedded payment form
- [ ] Admin file upload UI (currently API-only)
- [ ] CI/CD pipeline with automated testing
- [ ] Error monitoring with Sentry

---

## 👤 Author

**Tanmay Katke**
- GitHub: [@tanmaykatke21](https://github.com/tanmaykatke21)
- LinkedIn: [linkedin.com/in/tanmaykatke](https://linkedin.com/in/tanmaykatke)

---

> **Note:** First load may take ~30 seconds due to Render's free tier cold start. Subsequent requests are fast.
