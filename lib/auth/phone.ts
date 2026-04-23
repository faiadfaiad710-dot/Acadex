const PHONE_LOGIN_DOMAIN = "phone.academic.local";

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

export function phoneToLoginEmail(phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  return `${normalized.replace(/^\+/, "plus")}@${PHONE_LOGIN_DOMAIN}`;
}

export function credentialToEmail(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return phoneToLoginEmail(trimmed);
}
