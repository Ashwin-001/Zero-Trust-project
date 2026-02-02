# Zero Trust Terminal - Startup Guide

## 1. Backend Setup (Django)

The backend handles authentication (Zero Trust), Blockchain logs, and AI analysis.

### Open Terminal 1:
```bash
cd implementation
# (Optional) Activate Virtual Env
# source .venv/bin/activate 

# Start Server
python3 manage.py runserver
```

> **Note**: I have already migrated the database and created these demo users for you:

| Username | Private Key (Password) | Role |
|----------|------------------------|------|
| **admin** | `pk_admin_secret` | Admin |
| **user** | `pk_user_secret` | User |
| **myssvm** | `pk_user_1_256` | User |

## 2. Frontend Setup (Terminal UI)

The frontend is now a pure Terminal interface.

### Open Terminal 2:
```bash
cd implementation/client
npm run dev
```

## 3. Usage

1. Open http://localhost:5173
2. Initial status will be `UNAUTHENTICATED`.
3. Login using the command:
   ```bash
   login admin pk_admin_secret
   ```
4. Once logged in, try:
   - `status` (See AI Security Report)
   - `logs` (Read Blockchain Audit Logs)
   - `chain` (Verify Ledger Integrity)
