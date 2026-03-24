# Zero Trust Framework - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- Terminal/Command Prompt

### Step 1: Install Backend
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start Backend Server
```bash
python app.py
```
✅ Backend runs at: `http://localhost:5000`

### Step 3: Install Frontend (New Terminal)
```bash
cd frontend
npm install
npm start
```
✅ Frontend opens at: `http://localhost:3000`

### Step 4: Login & Test
Use these credentials:
- Username: `admin_user` / Password: `admin_pass`
- Username: `john_employee` / Password: `emp_pass`

---

## 🧪 Quick Test Scenarios

### ✅ Scenario 1: Successful Access (Admin)
1. Login: `admin_user` / `admin_pass`
2. Request → `Resource: IT Infrastructure`
3. Result: **ALLOW** ✓

### ⚠️ Scenario 2: Conditional Access (Low Device Trust)
1. Login: `john_employee` / `emp_pass`
2. Device Trust: Set to **20** (low)
3. Request → `Resource: API Secrets`
4. Result: **CONDITIONAL** with MFA requirement

### ❌ Scenario 3: Denied Access (Wrong Department)
1. Login: `john_employee` / `emp_pass` (Finance dept)
2. Request → `Resource: HR Personnel Records` (HR only)
3. Result: **DENY** ✗

### 📊 Scenario 4: Review Audit Logs
1. Login as `admin_user`
2. Go to "Audit Logs"
3. Verify all decisions recorded with blockchain hashes

---

## 📦 System Architecture

```
FRONTEND (React)           BACKEND (Python Flask)       AUDIT (Blockchain)
┌──────────────┐          ┌─────────────────────┐      ┌──────────────┐
│ Login Page   │ ──JWT──> │ Auth Module         │      │ Block 1      │
│ Access Form  │          │ RBAC Module         │ ───> │ Block 2      │
│ Audit Viewer │          │ ABAC Module         │      │ Block 3 (Hash)
└──────────────┘          │ Risk Scoring Engine │      └──────────────┘
    :3000                  │ Decision Engine     │
                           └─────────────────────┘
                               :5000
```

---

## 🔐 Key Features

| Feature | Status | Demo |
|---------|--------|------|
| Privacy-Preserving Auth | ✅ | Try failed login 5x → Lockout |
| RBAC with Hierarchy | ✅ | Admin can access anything; Viewer limited |
| ABAC (Dept, Device, Location) | ✅ | Change device trust, see decision change |
| Risk Scoring (0-100) | ✅ | Late-night access = higher risk |
| Blockchain Audit | ✅ | Admin: Check chain integrity |
| Decision Engine | ✅ | See ALLOW/CONDITIONAL/DENY rationale |

---

## 🆘 Troubleshooting

**Backend won't start?**
- Check Python 3.8+ installed: `python --version`
- Install deps: `pip install -r requirements.txt`

**Frontend won't open?**
- Clear browser cache or use incognito mode
- Check port 3000 is free: `lsof -i :3000`

**API calls failing?**
- Ensure backend running on `:5000`
- Check browser console (F12) for CORS errors
- Verify JWT token in Authorization header

**MongoDB not available?**
- System uses in-memory storage by default (no DB needed)

---

## 📝 Example Users

```
┌─────────────────┬─────────┬──────────┬────────────┐
│ Username        │ Role    │ Dept     │ Device%    │
├─────────────────┼─────────┼──────────┼────────────┤
│ admin_user      │ Admin   │ IT       │ 95% Trusted│
│ john_employee   │ Emp     │ Finance  │ 70% Trusted│
│ jane_viewer     │ Viewer  │ HR       │ 60% Trusted│
│ remote_employee │ Emp     │ IT       │ 45% Trusted│
└─────────────────┴─────────┴──────────┴────────────┘
All passwords visible in LoginPage.js (demo only)
```

---

## 🧩 API Endpoints (Quick Reference)

### Auth
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/users` - List all users

### Access
- `POST /api/access/request` - Request access (main endpoint)
- `GET /api/access/resources` - List available resources

### Audit
- `GET /api/audit/trail` - View audit log
- `GET /api/audit/chain-integrity` - Verify blockchain (admin)
- `GET /api/audit/statistics` - See allow/deny/conditional stats (admin)

---

## 💡 What Each Module Does

| Module | Purpose | Example |
|--------|---------|---------|
| **Authentication** | Verifies user identity | Hashes password, prevents brute force |
| **RBAC** | Role-based permissions | Admin can manage all; Viewer read-only |
| **ABAC** | Context-aware rules | Finance employee can't access HR data |
| **Risk Scoring** | Evaluates access risk (0-100) | Off-hours access = high risk |
| **Decision Engine** | Makes final decision | If risk HIGH → CONDITIONAL access |
| **Blockchain Audit** | Immutable log of all decisions | Can verify no data was deleted |

---

## 🎯 Academic Use Cases

### Use Case 1: Demonstrate RBAC Failure
- Login as `jane_viewer`
- Try to access Finance Database → **DENY** (viewer role insufficient)
- Check audit log → shows denial reason

### Use Case 2: Show ABAC Evaluating Context
- Login as `john_employee` (Finance dept)
- Change location to "Remote" and try HR Records → **DENY** (wrong dept)
- Same user, different context = different decision

### Use Case 3: Risk Scoring in Action
- Login with device trust: 30 (untrusted device)
- Request sensitive resource → **CONDITIONAL** (high risk)
- Increase device trust to 80 → **ALLOW**
- Demonstrates risk-aware access control

### Use Case 4: Blockchain Audit Verification
- Make multiple access requests
- Admin reviews audit log → block ID, hash, decision
- Verify: Each block's hash matches previous block's reference
- System demonstrates immutable audit trail

---

## 📊 What Gets Logged (Blockchain)

Each access decision creates a block with:
```json
{
  "block_id": 42,
  "user_id": "john_employee",
  "resource_id": "resource_financial_data",
  "decision": "ALLOW",
  "risk_score": 25.5,
  "timestamp": "2024-03-14T10:30:00",
  "previous_hash": "abc123...",
  "hash": "def456..."
}
```

**Why Blockchain?**
- ✅ Tamper-proof: Changing one block breaks entire chain
- ✅ Transparent: All decisions visible
- ✅ Traceable: Every access audited
- ✅ Immutable: Can't delete history

---

## 🚀 Next Steps

1. **Understand the Flow**
   - User logs in → Authentication module
   - Requests resource → RBAC + ABAC evaluation
   - Risk scoring applied → Decision engine finalizes
   - Result logged → Blockchain audit

2. **Modify & Experiment**
   - Change thresholds in Decision Engine (`modules/decision_engine.py`)
   - Add custom ABAC policies (`modules/abac.py`)
   - Create new users with different attributes

3. **Extend the System**
   - Add database persistence (MongoDB/PostgreSQL)
   - Implement MFA for conditional access
   - Add email notifications on denials
   - Create analytics dashboard for patterns

---

## 📚 Files to Review

**For security understanding:**
- `modules/authentication.py` - Password hashing, lockout logic
- `modules/rbac.py` - Role hierarchy and permissions
- `modules/decision_engine.py` - Access decision rules

**For API understanding:**
- `routes/auth_routes.py` - Authentication endpoints
- `routes/access_routes.py` - Access decision endpoint
- `routes/audit_routes.py` - Audit logging endpoints

**For UI understanding:**
- `frontend/src/pages/AccessRequestPage.js` - Main decision display
- `frontend/src/pages/AuditLogPage.js` - Blockchain viewer
- `frontend/src/services/api.js` - API communication

---

## ✅ Project Checklist

- [x] Authentication module with hashed passwords
- [x] RBAC with role hierarchies
- [x] ABAC with department/device/location criteria
- [x] Risk scoring engine with multiple factors
- [x] Decision engine (Allow/Conditional/Deny)
- [x] Blockchain-based audit logging
- [x] REST API with all endpoints
- [x] React frontend with 4 main pages
- [x] Demo users and resources
- [x] Documentation and setup guide

---

**Status:** ✅ Ready for Evaluation

**Next Run:** `python backend/app.py` → `npm start` in frontend
