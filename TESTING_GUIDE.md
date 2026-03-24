# Zero Trust Framework - Testing & Evaluation Guide

## 📋 Comprehensive Testing Plan

This guide provides detailed testing procedures for evaluating all aspects of the Zero Trust Security Framework.

---

## ✅ Phase 1: Setup Verification (5 minutes)

### Backend Startup Check
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Expected Output:**
```
 * Serving Flask app 'app'
 * Running on http://0.0.0.0:5000
```

**Verification:**
- [ ] Backend runs without errors
- [ ] Listening on port 5000
- [ ] No missing dependencies

### Frontend Startup Check
```bash
cd frontend
npm install
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view zerotrust-frontend in the browser.

  Local:            http://localhost:3000
```

**Verification:**
- [ ] Frontend compiles successfully
- [ ] Runs on port 3000
- [ ] Opens in browser automatically

---

## ✅ Phase 2: Authentication Testing (10 minutes)

### Test 2.1: Successful Login
**Objective:** Verify authentication module works

**Steps:**
1. Navigate to `http://localhost:3000`
2. Enter username: `admin_user`
3. Enter password: `admin_pass`
4. Click "Login"

**Expected:**
- ✅ Login successful
- ✅ Redirected to Access Request page
- ✅ User info displayed: "admin_user (admin - IT)"
- ✅ JWT token stored in localStorage

**Verify in browser console:**
```javascript
localStorage.getItem('auth_token')
// Should return JWT token starting with eyJ...
```

### Test 2.2: Failed Login Attempt
**Objective:** Test authentication failure handling

**Steps:**
1. On login page, enter username: `admin_user`
2. Enter wrong password: `wrong_pass`
3. Click "Login"

**Expected:**
- ✅ Error message: "Invalid credentials"
- ✅ Not logged in
- ✅ Stays on login page

### Test 2.3: Account Lockout
**Objective:** Verify lockout mechanism after 5 failed attempts

**Steps:**
1. Attempt login 5 times with wrong password
2. Try 6th login attempt

**Expected:**
- ✅ After 5 failures: "Account locked. Try again in 15 minutes."
- ✅ Cannot login with correct password
- ✅ Lockout message displayed

### Test 2.4: Demo User Loading
**Objective:** Verify demo credentials feature

**Steps:**
1. On login page, click "Show Demo Credentials"
2. Click on `john_employee` card

**Expected:**
- ✅ Credentials auto-populated
- ✅ Login successful
- ✅ User: "john_employee (employee - Finance)"

---

## ✅ Phase 3: RBAC Testing (15 minutes)

### Test 3.1: Admin Access to Unrestricted Resource
**Objective:** Verify admin can access admin-only resources

**Steps:**
1. Login as `admin_user`
2. Select resource: "IT Infrastructure" (Admin required)
3. Click "Request Access"

**Expected Decision:**
- ✅ Decision: **ALLOW**
- ✅ Reason includes: "Role 'admin' has permission"
- ✅ Risk Score: LOW (< 20)
- ✅ ABAC Score: HIGH (> 0.9)

### Test 3.2: Employee Access to Employee-Only Resource
**Objective:** Verify employee can access employee resources

**Steps:**
1. Login as `john_employee`
2. Select resource: "Public Company Files" (Viewer role sufficient)
3. Click "Request Access"

**Expected Decision:**
- ✅ Decision: **ALLOW**
- ✅ Risk Score: LOW (< 20)

### Test 3.3: Viewer Access Denied to Employee Resource
**Objective:** Verify role-based denial

**Steps:**
1. Login as `jane_viewer`
2. Select resource: "Financial Database" (Employee+ required)
3. Click "Request Access"

**Expected Decision:**
- ✅ Decision: **DENY**
- ✅ Reason includes: "role 'viewer' lacks permission"

### Test 3.4: Role Hierarchy Verification
**Instructions to verify in code:**
Open `backend/modules/rbac.py` and check:
- [ ] Role hierarchy levels defined (Guest:0, Viewer:1, Employee:2, Admin:3)
- [ ] Permissions correctly assigned per role
- [ ] `is_role_superior()` logic correct

---

## ✅ Phase 4: ABAC Testing (15 minutes)

### Test 4.1: Department Mismatch Denial
**Objective:** Verify ABAC denies cross-department access

**Steps:**
1. Login as `john_employee` (Finance dept)
2. Select: "HR Personnel Records" (HR dept required)
3. Click "Request Access"

**Expected Decision:**
- ✅ Decision: **DENY**
- ✅ Detailed evaluation →ABAC → department_score: 0.0
- ✅ Message: "Department 'Finance' not in required departments"

### Test 4.2: Device Trust Score Impact
**Objective:** Verify device trust affects decision

**Scenario A - High Trust:**
1. Login as `john_employee`
2. Set Device Trust: **80**
3. Request: "API Secrets"
4. Expected: **ALLOW** or **CONDITIONAL**

**Scenario B - Low Trust:**
1. Login (auto-logout or new session)
2. Set Device Trust: **20**
3. Request: "API Secrets"
4. Expected Decision: **CONDITIONAL** with message about device trust

**Verify in Detailed Evaluation:**
- device_trust_score changes from 1.0 to < 1.0
- Risk score increases

### Test 4.3: Location-Based Access
**Objective:** Verify location attribute matters

**Scenario A - Office Location:**
1. Login as `jane_viewer` with Location: **Office**
2. Request: "HR Personnel Records" (Office-only)

**Scenario B - Remote Location:**
1. Logout and login again
2. Select Location: **Remote**
3. Request: "HR Personnel Records"
4. Expected: **DENY** (location not allowed)

**Verify:**
- [ ] Office location → location_score: 1.0
- [ ] Remote location → location_score: 0.0

### Test 4.4: ABAC Weighted Scoring
**Instructions to verify in code:**
Open `backend/modules/abac.py` and check:
- [ ] Four attributes evaluated (department, device, location, sensitivity)
- [ ] Weights sum to 1.0 (0.3 + 0.25 + 0.2 + 0.25)
- [ ] Final score is weighted average

---

## ✅ Phase 5: Risk Scoring Testing (15 minutes)

### Test 5.1: Off-Hours Access Risk
**Objective:** Verify time-based risk scoring

**Steps:**
1. Open browser developer console
2. Check current time of day
3. If 9 AM - 6 PM: Risk from time should be 0
4. Modify system time to 2 AM and request access
5. Expected: time_of_access risk factor increases

**Or verify in code:**
Open `backend/modules/risk_scoring.py`:
- [ ] Business hours: 8 AM - 6 PM = 0 risk
- [ ] Late night: 20:00 - 06:00 = 0.5 risk
- [ ] Early morning: 06:00 - 08:00 = 0.2 risk

### Test 5.2: Location Change Risk
**Objective:** Verify impossible travel detection

**Steps:**
1. Request access from "Office"
2. Immediately make another request from "Mobile"
3. Expected: location_change risk score increases
4. Third request from "Remote" → even higher risk

### Test 5.3: Device Risk
**Objective:** Verify device trust vs sensitivity mismatch

**High Sensitivity Resource - Low Trust Device:**
1. Login with Device Trust: **30**
2. Request: "IT Infrastructure" (sensitivity 5/5, needs 80 trust)
3. Expected Decision: **CONDITIONAL** (high device risk)

**Verify:**
- device_risk score: > 0.5
- Risk Score: > 50 (MEDIUM or HIGH)

### Test 5.4: Risk Score Calculation
**Instructions to verify in code:**
Open `backend/modules/risk_scoring.py`:
- [ ] Six risk factors identified with weights
- [ ] Weights: 0.15 + 0.1 + 0.15 + 0.2 + 0.15 + 0.1 = 0.85
- [ ] Score normalized to 0-100 range
- [ ] Risk levels: LOW(<20), MEDIUM(20-50), HIGH(50-75), CRITICAL(75+)

---

## ✅ Phase 6: Decision Engine Testing (15 minutes)

### Test 6.1: RBAC Hard Requirement
**Objective:** Verify RBAC failure = automatic DENY

**Steps:**
1. Login as `jane_viewer` (lowest role)
2. Try to access "API Secrets" (requires admin)
3. Expected: **DENY**
4. Check: No conditional access possible, pure denial

### Test 6.2: Conditional Access Decision
**Objective:** Verify CONDITIONAL decision conditions

**Setup:**
1. Login as `remote_employee`
2. Set Device Trust: **40** (below 70 need)
3. Request: "API Secrets"

**Expected Decision:**
- ✅ Decision: **CONDITIONAL**
- ✅ Conditions section shows:
  - ✓ Multi-factor Auth Required
  - ✓ Session Monitoring Required
  - ✓ All Actions Will Be Logged
- ✅ Time Limit: 240 minutes (4 hours for medium risk)

### Test 6.3: Escalation to DENY
**Objective:** Verify critical risk → DENY

**Setup:**
1. Login with Device Trust: **10** (very low)
2. Late night access (modify system time to 2 AM)
3. Request high-sensitivity resource

**Expected:**
- ✅ Symptoms: High overall risk score (> 85)
- ✅ Decision: **DENY**
- ✅ Reason: "CRITICAL risk score"

### Test 6.4: Verify Decision Rules
**Instructions to verify in code:**
Open `backend/modules/decision_engine.py`:
- [ ] Rule 1: RBAC fail → DENY
- [ ] Rule 2: Critical risk (≥85) → DENY
- [ ] Rule 3: High risk (≥70) or poor ABAC (<0.6) → CONDITIONAL
- [ ] Rule 4: All pass → ALLOW
- [ ] Time limits calculated based on risk

---

## ✅ Phase 7: Blockchain Audit Testing (15 minutes)

### Test 7.1: Access Decision Logged
**Objective:** Verify every decision creates blockchain block

**Steps:**
1. Login as any user
2. Request access to: "Public Company Files"
3. Note the audit_block_id and hash in response
4. Go to "Audit Logs" page
5. Expected: Latest entry matches block_id and hash

**Verify Response:**
```json
{
  "decision": {
    ...
    "audit_block_id": 42,
    "audit_hash": "a3b4c5d6e7f8..."
  }
}
```

### Test 7.2: Audit Trail Filtering
**Objective:** Verify audit log filtering works

**Steps (as admin):**
1. Login as `admin_user`
2. Go to "Audit Logs"
3. Click "Denied" filter
4. Verify: Only DENY decisions shown
5. Click "High Risk" filter
6. Verify: Only risk score > 70 shown
7. Click "My History" filter
8. Verify: Only admin_user entries shown

### Test 7.3: Chain Integrity Verification
**Objective:** Verify blockchain integrity check

**Steps (admin only):**
1. Login as `admin_user`
2. Go to "Audit Logs"
3. View page and look for blockchain status
4. Expected: Green checkmark with "Integrity Verified"
5. Total Blocks: Should match audit entries + 1 (genesis block)

**Verify in Console:**
```bash
curl -X GET http://localhost:5000/api/audit/chain-integrity \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Response should show:
```json
{
  "integrity_verified": true,
  "message": "Blockchain integrity verified",
  "total_blocks": 5
}
```

### Test 7.4: Blockchain Export
**Objective:** Verify chain can be exported

**Steps (admin):**
```bash
curl -X GET http://localhost:5000/api/audit/export \
  -H "Authorization: Bearer <ADMIN_TOKEN>" > chain.json
```

**Verify:**
- [ ] File contains array of blocks
- [ ] Each block has: block_id, user_id, resource_id, decision, hash
- [ ] Hash chaining visible (previous_hash matches previous block's hash)

---

## ✅ Phase 8: API Endpoint Testing (10 minutes)

### Test 8.1: Authentication Endpoints
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_user","password":"admin_pass"}'

# Expected: 200 with token

# Test verify token
TOKEN="<token_from_above>"
curl -X POST http://localhost:5000/api/auth/verify-token \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 with user_id
```

- [ ] Login returns 200 with token
- [ ] Invalid credentials return 401
- [ ] Token verification works
- [ ] Logout clears session

### Test 8.2: Access Control Endpoints
```bash
# Get resources
curl http://localhost:5000/api/access/resources \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 with resource array

# Request access
curl -X POST http://localhost:5000/api/access/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resource_id":"resource_financial_data"}'

# Expected: 200 with decision
```

- [ ] Resources endpoint returns array
- [ ] Access request returns decision
- [ ] Decision contains all required fields
- [ ] Unauthorized returns 401

### Test 8.3: Audit Endpoints
```bash
# Get audit trail
curl "http://localhost:5000/api/audit/trail" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 with audit entries

# Admin only
curl "http://localhost:5000/api/audit/chain-integrity" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 (admin) or 403 (non-admin)
```

- [ ] Audit trail accessible by all
- [ ] Filtering works (user, resource, decision)
- [ ] Admin endpoints return 403 for non-admin
- [ ] Chain integrity verifiable

---

## ✅ Phase 9: Frontend UI Testing (10 minutes)

### Test 9.1: Login Page
- [ ] Username field accepts input
- [ ] Password field masks input
- [ ] Device Trust slider works (0-100)
- [ ] Location dropdown shows 3 options
- [ ] Demo credentials button toggles list
- [ ] Error messages display after failed login
- [ ] Successfully logged in users redirect to Access page

### Test 9.2: Access Request Page
- [ ] Resource dropdown populated
- [ ] Selecting resource shows details
- [ ] Location dropdown changeable
- [ ] Device Trust slider works
- [ ] "Request Access" button triggers API call
- [ ] Decision displays in real-time
- [ ] Decision badge colors correct (green=ALLOW, orange=CONDITIONAL, red=DENY)
- [ ] Detailed evaluation shows all components

### Test 9.3: Decision Display
- [ ] Decision badge visible
- [ ] Risk score displayed with color
- [ ] ABAC score shown as percentage
- [ ] Recommendations list shown for CONDITIONAL/DENY
- [ ] Conditions detailed (MFA, monitoring, time limits)
- [ ] Audit block ID visible

### Test 9.4: Audit Log Page
- [ ] Audit trail table displays
- [ ] Filter buttons (All, Denied, High Risk, My History)
- [ ] Filtering changes data shown
- [ ] Admin sees blockchain status
- [ ] Admin sees statistics (Allow, Conditional, Deny counts)
- [ ] Table shows: Block ID, User, Resource, Decision, Risk, Timestamp
- [ ] Risk badges color-coded

### Test 9.5: Navigation
- [ ] NavBar visible when logged in
- [ ] User info displayed
- [ ] Navigation buttons work
- [ ] Logout button clears session
- [ ] Logo clickable (if implemented)

---

## ✅ Phase 10: Security Verification (10 minutes)

### Test 10.1: Password Security
**Verify in code:**
Open `backend/modules/authentication.py`:
- [ ] PBKDF2 macro used (not plain hashlib)
- [ ] 100,000 iterations configured
- [ ] Random salt generated
- [ ] Salt length: 16 bytes (token_hex(16))
- [ ] Constant-time comparison used (hmac.compare_digest)

### Test 10.2: Authentication Security
**Verify:**
- [ ] Failed attempt tracking in memory
- [ ] Lockout after 5 attempts
- [ ] Lockout duration: 15 minutes constant
- [ ] JWT tokens have expiration
- [ ] Authorization header required for protected routes

### Test 10.3: API Security
**Verify:**
- [ ] All endpoints except /health require auth
- [ ] JWT token validated on protected routes
- [ ] CORS configured properly
- [ ] No SQL injection (using object models)
- [ ] No sensitive data in logs

### Test 10.4: Blockchain Security
**Verify:**
- [ ] SHA-256 used for block hashing
- [ ] Hash includes all block data
- [ ] Previous hash in each block
- [ ] Genesis block has "0" * 64 as previous hash
- [ ] Integrity check verifies chain continuity

---

## 📊 Code Quality Checklist

### Code Organization
- [ ] Clear module separation
- [ ] Logical function grouping
- [ ] Proper file naming
- [ ] Consistent indentation
- [ ] Readable variable names

### Documentation
- [ ] Module docstrings
- [ ] Function docstrings
- [ ] Parameter descriptions
- [ ] Return value descriptions
- [ ] Inline comments for complex logic

### Error Handling
- [ ] Try-except blocks used appropriately
- [ ] Meaningful error messages
- [ ] No unhandled exceptions
- [ ] Proper HTTP status codes returned
- [ ] Frontend error display

### Testing Capability
- [ ] Debug mode available
- [ ] Logging functional
- [ ] API testable with curl
- [ ] Frontend console accessible
- [ ] Easy to trace decision logic

---

## 🎯 Eval Scoring Guide

### Full Points (100%)
- ✅ All components working correctly
- ✅ All tests pass
- ✅ Security best practices followed
- ✅ Code well-organized and documented
- ✅ UI intuitive and responsive

### Deduction Checklist
| Issue | Deduction |
|-------|-----------|
| Missing component | -20 |
| Component partially works | -10 |
| Security flaw (e.g., plain passwords) | -15 |
| Poor code organization | -5 |
| Inadequate documentation | -5 |
| UI issues/crashes | -5 |

---

## ✨ Demo Sequence (30 minutes)

**For evaluators with limited time:**

1. **Setup (5 min)**
   - Start backend: `python app.py`
   - Start frontend: `npm start`
   - Open browser

2. **Authentication (3 min)**
   - Failed login test → show lockout
   - Successful login (admin_user)

3. **RBAC Demo (5 min)**
   - Admin accesses admin resource → ALLOW
   - Logout, login as viewer
   - Viewer tries employee resource → DENY
   - Show role hierarchy in code

4. **ABAC Demo (5 min)**
   - Login as Finance employee
   - Try HR resource (wrong dept) → DENY
   - Show ABAC scoring in response

5. **Risk Scoring (5 min)**
   - Set device trust to 20 (low)
   - Request sensitive resource → CONDITIONAL
   - Show risk factors breakdown

6. **Blockchain Audit (7 min)**
   - Make several requests
   - Go to Audit Logs
   - Show all decisions logged
   - Admin: Verify chain integrity
   - Show hash chaining

---

## 📝 Final Checklist

Before presenting for evaluation:

- [ ] Backend installed and running
- [ ] Frontend installed and running
- [ ] All demo users accessible
- [ ] All demo resources accessible
- [ ] No console errors
- [ ] JWT token working
- [ ] CORS enabled
- [ ] Audit logs functional
- [ ] Chain integrity verified
- [ ] Documentation complete
- [ ] README readable
- [ ] SETUP_GUIDE tested and verified

---

**Ready for Evaluation:** ✅

**Estimated Evaluation Time:** 45-60 minutes  
**Quick Demo Time:** 30 minutes  
**Code Review Time:** 20 minutes
