const PHONE_LOGIN_DOMAIN = "code.academic.local";

export function normalizeLoginCode(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return digits;
}

export function codeToLoginEmail(code: string) {
  const normalized = normalizeLoginCode(code);
  if (!normalized) return "";
  return `${normalized}@${PHONE_LOGIN_DOMAIN}`;
}

export function credentialToEmail(value: string) {
  return codeToLoginEmail(value);
}
