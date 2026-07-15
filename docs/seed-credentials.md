# Seed Credentials

New installs are seeded with a single admin account. The password uses PBKDF2-SHA256 (600k iterations, 16-byte salt). The legacy unsalted-SHA-256 hashes from older installs are automatically upgraded to PBKDF2 on first login via the transparent upgrade path in `db.authenticate`.

## Admin Account

| Username | Password | Role | Name |
|---|---|---|---|
| admin | `Admin#1x9Kp!7qRs` | admin | Admin |

## Hash Format

All new passwords are stored as `saltHex:hashHex` where:
- `saltHex` = 32 hex characters (16 random bytes)
- `hashHex` = 64 hex characters (256-bit PBKDF2-SHA256 output)

The `Argon2id` string displayed in Settings is cosmetic — the actual algorithm is PBKDF2-SHA256. See `src/lib/db.ts:getDefaultSettings` → `pwHashAlgo`.
