export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  if (cleaned.startsWith("0") && !cleaned.startsWith("+")) {
    cleaned = "+91" + cleaned.slice(1);
  }

  if (!cleaned.startsWith("+") && cleaned.length === 10) {
    cleaned = "+91" + cleaned;
  }

  return cleaned;
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith("+91") && normalized.length === 13) {
    const num = normalized.slice(3);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return normalized;
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length >= 12 && normalized.startsWith("+");
}

export function getWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizePhone(phone).replace("+", "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function getWhatsAppChatLink(phone: string): string {
  const normalized = normalizePhone(phone).replace("+", "");
  return `https://wa.me/${normalized}`;
}
