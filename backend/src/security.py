"""Password hashing helpers (bcrypt).

Storage format: bcrypt hashes are strings starting with "$2a$", "$2b$", or
"$2y$". Anything else stored in `password` is treated as legacy plain text
written before this module existed.
"""

import bcrypt

# bcrypt input is limited to 72 bytes; longer passwords are silently truncated.
# We accept that limit (matches FastAPI/passlib defaults) since our policy
# enforces only a minimum length, not a maximum.
_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


def hash_password(password: str) -> str:
    """Return a bcrypt hash for the given plain-text password."""
    if not isinstance(password, str):
        raise TypeError("password must be str")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def is_hashed(stored: str) -> bool:
    """Return True if the stored value looks like a bcrypt hash."""
    return isinstance(stored, str) and stored.startswith(_BCRYPT_PREFIXES)


def verify_password(plain_password: str, stored: str) -> bool:
    """Verify a password against the stored value.

    Supports two storage formats:
      * bcrypt hash (preferred): verified with constant-time bcrypt.checkpw
      * legacy plain text: direct equality (for transparent migration)

    Callers should call `hash_password` and persist the new hash whenever
    a legacy plain-text password is verified successfully.
    """
    if not isinstance(plain_password, str) or not isinstance(stored, str):
        return False
    if is_hashed(stored):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), stored.encode("utf-8"))
        except (ValueError, TypeError):
            return False
    return plain_password == stored
