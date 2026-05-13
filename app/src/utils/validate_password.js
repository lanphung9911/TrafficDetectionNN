/* Password policy used by both login and any future "create password" form.
   Keep these constants in sync with backend/src/schemas.py */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?`~";

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return "Password must contain at least 1 special character (e.g. !@#$%^&*).";
  }
  return null;
}

export const PASSWORD_HINT_TEXT =
  `At least ${PASSWORD_MIN_LENGTH} characters and 1 special character (e.g. !@#$%^&*).`;
