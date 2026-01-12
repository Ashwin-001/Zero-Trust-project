# Zero Trust Portal - Login Credentials

## Authentication Method

This Zero Trust system uses **cryptographic key-based authentication** instead of traditional username/password credentials.

Users authenticate by entering their **private cryptographic identity key** on the login page.

---

## Test/Demo Credentials

### Admin User
- **Username**: `admin`
- **Private Key**: `pk_admin_secret`
- **Role**: Admin
- **Password** (backend only): `password123`

### Standard User
- **Username**: `user`
- **Private Key**: `pk_user_secret`
- **Role**: User
- **Password** (backend only): `password123`

---

## How to Login

1. Navigate to the login page (Zero Trust Portal)
2. In the "Identity Key" field, enter one of the private keys:
   - For admin access: `pk_admin_secret`
   - For user access: `pk_user_secret`
3. Click the **AUTHENTICATE** button
4. You will be redirected to the dashboard

---

## Creating Test Users

If the users don't exist in the database, run the user creation script:

```bash
cd /Users/srivatsan/Desktop/Zero-Trust-project/implementation
python create_users.py
```

This will create both admin and user accounts with their respective private keys.

---

## User Registration API

To create new users programmatically, use the registration endpoint:

**Endpoint**: `POST /api/auth/register`

**Payload**:
```json
{
  "username": "newuser",
  "password": "securepassword",
  "role": "user",
  "private_key": "your_unique_private_key_here"
}
```

**Note**: The `private_key` field is what users will use to authenticate on the login page.

---

## Security Notes

⚠️ **Important**: These are test credentials for development purposes only.

- In production, private keys should be:
  - Cryptographically generated (not simple strings)
  - Securely stored
  - Never hardcoded
  - Properly encrypted in the database

- The current implementation stores private keys in plaintext for demo purposes
- Consider implementing proper key management for production use
