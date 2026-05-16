/* Email-domain policy per role.
   Keep ROLE_EMAIL_DOMAIN in sync with backend/src/schemas.py */
export const ROLE_EMAIL_DOMAIN = {
  DataScientist: "@datascientist.com",
  User: "@user.com",
  Admin: "@admin.com",
};

export function getExpectedDomain(role) {
  return ROLE_EMAIL_DOMAIN[role] || null;
}

export function validateEmailForRole(email, role) {
  if (!role) {
    return "Please select a role first.";
  }
  const expected = getExpectedDomain(role);
  if (!expected) {
    return `Unknown role '${role}'.`;
  }
  if (typeof email !== "string" || email.length === 0) {
    return "Email is required.";
  }
  if (!email.toLowerCase().endsWith(expected)) {
    return `Email for role '${role}' must end with '${expected}'.`;
  }
  return null;
}

export function emailHintForRole(role) {
  const expected = getExpectedDomain(role);
  if (!expected) return "Select a role to see the required email domain.";
  return `Email for ${role} must end with ${expected}`;
}
