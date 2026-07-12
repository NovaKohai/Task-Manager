# Seed Credentials

New installs are seeded with 5 demo accounts. Each password uses PBKDF2-SHA256 (600k iterations, 16-byte salt). The legacy unsalted-SHA-256 hashes from older installs are automatically upgraded to PBKDF2 on first login via the transparent upgrade path in `db.authenticate`.

## Demo Accounts

| Username | Password | Role | Name |
|---|---|---|---|
| admin | `Admin#1x9Kp!7qRs` | admin | Admin User |
| jane | `Jane$2wL!mT3vN8` | manager | Jane Doe |
| alex | `Alex%3zQ&jH5cX0` | developer | Alex Liu |
| raj | `Raj@4aK*L7pM2n` | developer | Raj Johnson |
| maya | `Maya^5bR#nJ9sE` | developer | Maya Kapoor |

## Hash Format

All new passwords are stored as `saltHex:hashHex` where:
- `saltHex` = 32 hex characters (16 random bytes)
- `hashHex` = 64 hex characters (256-bit PBKDF2-SHA256 output)

The `Argon2id` string displayed in Settings is cosmetic — the actual algorithm is PBKDF2-SHA256. See `src/lib/db.ts:getDefaultSettings` → `pwHashAlgo`.