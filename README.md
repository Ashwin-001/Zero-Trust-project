# 🔐 Zero Trust Security Framework

## Academic Project: Demonstrating Zero Trust Principles

**Project Title:** A Zero Trust Security Framework Integrating RBAC, ABAC, Risk Scoring, Blockchain Auditing, and Privacy-Preserving Authentication

**Designed for:** Final-year BE Computer Science Project

---

## 🎯 Project Overview

This is a comprehensive academic implementation of a **Zero Trust Security Framework** that demonstrates modern security principles:

- **Authentication**: Privacy-preserving mechanisms with hashed passwords and challenge-response patterns
- **RBAC**: Role-based access control with role hierarchies (admin, employee, viewer)
- **ABAC**: Attribute-based access control considering departments, device trust, location
- **Risk Scoring**: Contextual risk evaluation based on access patterns and environmental factors
- **Decision Engine**: Comprehensive access decisions (Allow, Conditional, Deny)
- **Blockchain Audit**: Immutable audit trail with hash chaining for tamper detection

---

## 🏗️ Project Structure

```
ZeroTrust/
├── backend/                          # Flask Python Backend
│   ├── app.py                       # Flask application entry point
│   ├── config.py                    # Configuration management
│   ├── requirements.txt             # Python dependencies
│   │
│   ├── modules/                     # Core security modules
│   │   ├── authentication.py        # Privacy-preserving auth
│   │   ├── rbac.py                  # Role-Based Access Control
│   │   ├── abac.py                  # Attribute-Based Access Control
│   │   ├── risk_scoring.py          # Risk scoring engine
│   │   ├── decision_engine.py       # Decision making logic
│   │   └── blockchain_audit.py      # Blockchain-based audit logging
│   │
│   ├── routes/                      # REST API endpoints
│   │   ├── auth_routes.py           # Authentication endpoints
│   │   ├── access_routes.py         # Access control endpoints
│   │   └── audit_routes.py          # Audit logging endpoints
│   │
│   └── models/                      # Data models
│       └── user.py                  # User and Resource models
│
├── frontend/                         # React Frontend
│   ├── package.json                 # Node dependencies
│   ├── src/
│   │   ├── App.js                   # Main application component
│   │   ├── App.css                  # Application styles
│   │   ├── index.js                 # React entry point
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── LoginPage.js         # User login with demo accounts
│   │   │   ├── AccessRequestPage.js # Access request with decision display
│   │   │   ├── AuditLogPage.js      # Audit log viewer
│   │   │   └── DecisionPage.js      # Decision results
│   │   │
│   │   ├── components/              # Reusable components
│   │   │   └── NavBar.js            # Navigation bar
│   │   │
│   │   └── services/
│   │       └── api.js               # API communication layer
│   │
│   └── public/
│       └── index.html               # HTML template
│
└── README.md                         # This file
```

---

## 🔐 System Components

### 1. **Authentication Module** (`modules/authentication.py`)
- Privacy-preserving password hashing using PBKDF2 with salt
- Challenge-response mechanism inspired by Zero Knowledge Proofs
- Account lockout after failed attempts (max 5 attempts, 15-min lockout)
- Constant-time comparison to prevent timing attacks

**Key Features:**
- Secure password hashing: `hashlib.pbkdf2_hmac` with 100,000 iterations
- Salt-based password storage
- Failed attempt tracking
- Login rate limiting

### 2. **RBAC Module** (`modules/rbac.py`)
Hierarchical role-based permissions system:

**Roles:**
- **Admin** (Level 3): Full system access
  - Permissions: `read_all_resources`, `write_all_resources`, `delete_all_resources`, `view_audit_logs`, `manage_users`
- **Employee** (Level 2): Department-specific access
  - Permissions: `read_own_department_resources`, `write_own_department_resources`, `read_shared_resources`
- **Viewer** (Level 1): Read-only access
  - Permissions: `read_own_department_resources`, `read_shared_resources`
- **Guest** (Level 0): Limited access
  - Permissions: `read_public_resources`

### 3. **ABAC Module** (`modules/abac.py`)
Attribute-based evaluation with weighted scoring:

**Attributes Evaluated:**
1. **Department Match** (Weight: 0.3) - User department vs. resource requirements
2. **Device Trust** (Weight: 0.25) - Device security score vs. minimum requirement
3. **Location Verification** (Weight: 0.2) - Current location allowed for resource
4. **Sensitivity/Clearance** (Weight: 0.25) - Role clearance vs. resource sensitivity

**Scoring:** Returns weighted score (0-1) and individual attribute evaluation

### 4. **Risk Scoring Engine** (`modules/risk_scoring.py`)
Multi-factor risk assessment (0-100 scale):

**Risk Factors:**
- **Login Attempts** (15%): Failed login history
- **Time of Access** (10%): Off-hours access detection
- **Location Change** (15%): Impossible travel detection
- **Device Risk** (20%): Device trust mismatch
- **Resource Sensitivity** (15%): Sensitivity level mismatch
- **Department Mismatch** (10%): Unauthorized department access
- **Access Pattern Anomaly** (15%): Deviation from normal behavior

**Risk Levels:**
- LOW: 0-20
- MEDIUM: 20-50
- HIGH: 50-75
- CRITICAL: 75-100

### 5. **Decision Engine** (`modules/decision_engine.py`)
Applies Zero Trust decision logic:

**Decision Rules:**
1. **RBAC FAIL** → **DENY** (hard stop)
2. **Critical Risk (≥85)** → **DENY**
3. **High Risk (≥70) OR Poor ABAC (<0.6)** → **CONDITIONAL**
   - Conditions: MFA, session monitoring, time limits
4. **All Checks Pass** → **ALLOW**

**Conditional Requirements:**
- Multi-Factor Auth
- Session Monitoring
- Time-Limited Access (15-480 minutes based on risk)
- One-Time Approval (if needed)
- Resource Logging

### 6. **Blockchain Audit System** (`modules/blockchain_audit.py`)
Immutable audit trail with hash chaining:

**Features:**
- **Block Structure**: Block ID, User ID, Resource ID, Decision, Risk Score, Timestamp
- **Hash Chaining**: Each block contains hash of previous block (SHA-256)
- **Genesis Block**: System-created first block
- **Integrity Verification**: Detect tampering by verifying chain continuity
- **Filtering**: Query by user, resource, or decision type

**Audit Capabilities:**
- View complete audit trail
- Filter by user, resource, or decision
- Export blockchain for external verification
- Chain integrity verification
- Statistical analysis (allow/deny/conditional counts)

---

## 👥 Example Users

Pre-configured demo accounts for testing:

| Username | Password | Role | Department | Device Trust | Location |
|----------|----------|------|------------|--------------|----------|
| `admin_user` | `admin_pass` | Admin | IT | 95 | Office |
| `john_employee` | `emp_pass` | Employee | Finance | 70 | Office |
| `jane_viewer` | `viewer_pass` | Viewer | HR | 60 | Remote |
| `remote_employee` | `remote_pass` | Employee | IT | 45 | Remote |

---

## 📦 Example Resources

Pre-configured resources for access testing:

| Resource ID | Name | Type | Sensitivity | Required Role | Required Dept |
|------------|------|------|------------|---------------|----------------|
| `resource_financial_data` | Financial Database | database | 5/5 | Employee | Finance, Admin |
| `resource_hr_records` | HR Personnel Records | database | 4/5 | Employee | HR, Admin |
| `resource_company_files` | Public Company Files | file_share | 1/5 | Viewer | (any) |
| `resource_it_servers` | IT Infrastructure | infrastructure | 5/5 | Admin | IT |
| `resource_api_key` | API Secrets | credential | 5/5 | Employee | IT, Dev |

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- MongoDB (optional, in-memory storage used for demo)

### Backend Setup

#### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Run Flask Backend
```bash
python app.py
```

**Output:**
```
 * Running on http://0.0.0.0:5000
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

#### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

#### 2. Start React Development Server
```bash
npm start
```

**Output:**
```
Compiled successfully!

You can now view zerotrust-frontend in the browser.

  Local:            http://localhost:3000
```

The frontend will open at `http://localhost:3000`

---

## 📡 API Endpoints

### Authentication Endpoints

**POST `/api/auth/login`**
- Login with credentials
- Parameters: `username`, `password`, `device_trust_score`, `location`
- Returns: JWT token and user info

**POST `/api/auth/register`**
- Register new user
- Parameters: `username`, `password`, `email`, `role`, `department`
- Returns: Confirmation with user details

**POST `/api/auth/logout`**
- Logout user
- Returns: Confirmation message

**GET `/api/auth/users`**
- Get all users (demo endpoint)
- Returns: List of all registered users

### Access Control Endpoints

**POST `/api/access/request`**
- Request access to a resource
- Parameters: `resource_id`, `current_location`, `device_trust_score`
- Returns: Access decision with evaluation details

**GET `/api/access/resources`**
- Get all available resources
- Returns: List of resources with metadata

**GET `/api/access/decision-stats`**
- Get decision statistics
- Returns: Allow/Deny/Conditional counts

### Audit Endpoints

**GET `/api/audit/trail`**
- Get audit trail (with optional filters)
- Query params: `user_id`, `resource_id`, `decision`
- Returns: Filtered audit logs

**GET `/api/audit/trail/<user_id>`**
- Get audit history for specific user
- Returns: User's access decisions

**GET `/api/audit/denied-attempts`**
- Get all denied access attempts
- Returns: List of denied decisions

**GET `/api/audit/chain-integrity`** (Admin only)
- Verify blockchain integrity
- Returns: Integrity status and total blocks

**GET `/api/audit/statistics`** (Admin only)
- Get audit statistics
- Returns: Decision counts and averages

**GET `/api/audit/export`** (Admin only)
- Export entire blockchain
- Returns: Complete chain data

---

## 🧪 Testing the System

### Test Scenario 1: Admin Access
1. Login as `admin_user` / `admin_pass`
2. Request access to `resource_it_servers`
3. Expected: **ALLOW** (admin has all permissions)

### Test Scenario 2: Unauthorized Department
1. Login as `john_employee` / `emp_pass`
2. Request access to `resource_hr_records`
3. Expected: **DENY** (Finance dept not in HR required depts)

### Test Scenario 3: Conditional Access (High Risk)
1. Login as `remote_employee` / `remote_pass`
2. Set device trust to 30 (low)
3. Request access to `resource_api_key`
4. Expected: **CONDITIONAL** (device trust too low)

### Test Scenario 4: Location-Based Denial
1. Login with location = "Remote"
2. Request access to `resource_hr_records` (Office-only)
3. Expected: **DENY** (location not allowed)

### Test Scenario 5: Audit Log View
1. Login as admin
2. Go to "Audit Logs" tab
3. Verify: Shows all access decisions with blockchain integrity

---

## 🔒 Security Features

### Privacy-Preserving Authentication
- ✓ PBKDF2 password hashing (100,000 iterations)
- ✓ Random salt per user (16 bytes)
- ✓ Constant-time password comparison
- ✓ Account lockout (5 attempts, 15 minutes)
- ✓ Challenge-response mechanism for enhanced auth

### Zero Trust Principles
- ✓ Never trust by default - all access is evaluated
- ✓ Verify explicitly - RBAC + ABAC + Risk scoring
- ✓ Assume breach - comprehensive audit logging
- ✓ Secure every layer - JWT tokens with expiration
- ✓ Context-aware - location, device, time-based decisions

### Blockchain Audit
- ✓ Immutable audit trail (hash chaining)
- ✓ Tamper detection (integrity verification)
- ✓ Transparent logging (all decisions recorded)
- ✓ Traceability (block-by-block tracking)

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Login      │   Access     │   Decision   │  Audit Log   │  │
│  │   Page       │   Request    │   Display    │   Viewer     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                          ↓                                        │
│                   API Service Layer                              │
│                   (JWT Token Auth)                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Flask)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Handlers                              │  │
│  │  ┌────────┬──────────┬────────────────────────────────┐  │  │
│  │  │ Auth   │ Access   │ Audit                          │  │  │
│  │  └────────┴──────────┴────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Zero Trust Decision Pipeline                     │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐   │  │
│  │  │  Auth    │→ │ RBAC    │→ │  ABAC    │→ │ Risk    │   │  │
│  │  │ Module   │  │ Module  │  │ Module   │  │ Scoring │   │  │
│  │  └──────────┘  └─────────┘  └──────────┘  └────┬────┘   │  │
│  │                                                  ↓         │  │
│  │                                             ┌──────────┐   │  │
│  │                                             │Decision  │   │  │
│  │                                             │Engine    │   │  │
│  │                                             └────┬─────┘   │  │
│  │                                                  ↓         │  │
│  │                                          ┌──────────────┐  │  │
│  │                                          │Blockchain    │  │  │
│  │                                          │Audit Log     │  │  │
│  │                                          └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Example API Calls

### 1. Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_employee",
    "password": "emp_pass",
    "device_trust_score": 70,
    "location": "Office"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "john_employee",
    "email": "john@company.com",
    "role": "employee",
    "department": "Finance",
    "device_trust_score": 70,
    "location": "Office"
  }
}
```

### 2. Access Request
```bash
curl -X POST http://localhost:5000/api/access/request \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "resource_financial_data",
    "current_location": "Office",
    "device_trust_score": 70
  }'
```

**Response with ALLOW Decision:**
```json
{
  "decision": {
    "decision": "ALLOW",
    "reason": "Access granted. All security checks passed.",
    "risk_level": "LOW",
    "rbac_status": "PASSED",
    "abac_score": 0.95,
    "risk_score": 15.43,
    "recommendations": [],
    "timestamp": "2024-03-14T10:30:00",
    "user_id": "john_employee",
    "resource_id": "resource_financial_data",
    "audit_block_id": 42,
    "audit_hash": "a3b4c5d6e7f8..."
  },
  "detailed_evaluation": {
    "rbac": {
      "passed": true,
      "reason": "Role 'employee' has permission 'read_database_resources'"
    },
    "abac": {
      "weighted_score": 0.95,
      "department_score": 1.0,
      "device_trust_score": 1.0,
      "location_score": 1.0,
      "sensitivity_score": 0.87
    },
    "risk": {
      "overall_score": 15.43,
      "risk_level": "LOW",
      "factors": {
        "login_attempts": 0.0,
        "time_of_access": 0.0,
        "location_change": 0.0,
        "device_risk": 0.0,
        "department_mismatch": 0.0,
        "access_pattern": 0.15
      }
    }
  }
}
```

### 3. Get Audit Trail (Admin)
```bash
curl -X GET "http://localhost:5000/api/audit/trail?user_id=john_employee" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response:**
```json
{
  "audit_trail": [
    {
      "block_id": 1,
      "user_id": "john_employee",
      "resource_id": "resource_financial_data",
      "decision": "ALLOW",
      "risk_score": 15.43,
      "timestamp": "2024-03-14T10:30:00",
      "previous_hash": "b4c5d6e7f8g9...",
      "hash": "a3b4c5d6e7f8..."
    }
  ],
  "count": 1
}
```

---

## 🎓 Academic Learning Outcomes

This project demonstrates:

1. **Security Architecture**: Designing multi-layered security systems
2. **Access Control Models**: Implementation of RBAC and ABAC
3. **Risk Management**: Contextual risk assessment and scoring
4. **Blockchain Technology**: Hash chaining for immutable auditing
5. **Full Stack Development**: Both backend and frontend implementation
6. **API Design**: RESTful API design and JWT authentication
7. **Database Design**: Data modeling for security systems
8. **System Integration**: Combining multiple security modules

---

## 🔍 Evaluation Criteria

The system can be evaluated on:

### Functionality (30%)
- ✅ All modules working correctly
- ✅ Access decisions align with policy
- ✅ Audit trail complete and accurate

### Security (30%)
- ✅ Proper authentication implementation
- ✅ Risk scoring logic sound
- ✅ Blockchain integrity maintained
- ✅ No obvious security flaws

### Code Quality (20%)
- ✅ Clean, modular code
- ✅ Proper error handling
- ✅ Documentation and comments
- ✅ Separation of concerns

### User Interface (10%)
- ✅ Intuitive and user-friendly
- ✅ Clear presentation of decisions
- ✅ Responsive design

### Documentation (10%)
- ✅ Clear explanation of system
- ✅ Setup instructions
- ✅ Test scenarios
- ✅ Architecture diagrams

---

## 📚 References & Further Reading

### Zero Trust Architecture
- NIST SP 800-207: Zero Trust Architecture
- Zero Trust Model by Google

### Access Control
- NIST SP 800-53: Access Control
- XACML (eXtensible Access Control Markup Language)
- ABAC standards and best practices

### Blockchain & Audit Logging
- Bitcoin Whitepaper (Nakamoto, 2008)
- Hash-based data structures
- Immutable audit trails

### Authentication Security
- OWASP Authentication Cheat Sheet
- PBKDF2, bcrypt, Argon2 comparison
- Zero Knowledge Proofs (Schnorr protocol)

---

## 📧 Support & Documentation

For questions or clarifications about specific modules, refer to:
- In-code documentation in each module
- Function docstrings with parameter descriptions
- Test scenarios in this README

---

## ✨ Key Takeaways

This system demonstrates that **Zero Trust Security is not a single tool** but a **comprehensive approach** combining:

1. **Strong Authentication**: Hashed passwords, secure comparison
2. **Policy Enforcement**: RBAC for roles, ABAC for attributes
3. **Risk Assessment**: Contextual evaluation of access requests
4. **Immutable Auditing**: Blockchain-based tamper-proof logs
5. **Transparency**: Clear explanations of access decisions

**Remember**: Zero Trust means never trust, always verify!

---

## 📄 License

This project is created for academic purposes. Use freely for educational and research purposes.

---

**Project Version:** 1.0.0  
**Created:** March 2024  
**For:** Final Year BE Computer Science Project
