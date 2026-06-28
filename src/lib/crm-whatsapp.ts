// WhatsApp deep-link generator for the CRM.
// Replaces {placeholders} in a template and builds a wa.me link.

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let msg = template;
  for (const [key, val] of Object.entries(variables)) {
    msg = msg.replaceAll(`{${key}}`, val ?? '');
  }
  return msg;
}

export function normalizePhoneToWA(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
}

export function generateWALink(phone: string, message: string): string {
  const clean = normalizePhoneToWA(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
