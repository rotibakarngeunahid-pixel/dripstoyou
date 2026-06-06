const WA_DEFAULT = '6281200000000';

export function normalizeWhatsAppNumber(input: string): string {
  let digits = input.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('08')) {
    digits = '62' + digits.slice(1);
  }
  if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  if (!digits.startsWith('62')) {
    throw new Error('Nomor WhatsApp harus nomor Indonesia yang valid (diawali 08, 62, atau +62).');
  }
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Panjang nomor WhatsApp tidak valid (10–15 digit).');
  }
  return digits;
}

export function getWaNumber(): string {
  try {
    return normalizeWhatsAppNumber(process.env.WHATSAPP_NUMBER ?? WA_DEFAULT);
  } catch {
    return WA_DEFAULT;
  }
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const canonical = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${canonical}?text=${encodeURIComponent(message)}`;
}

export function waBookingUrl(treatment: string, price?: string): string {
  const waNumber = getWaNumber();
  const text = price
    ? `Halo Drips To You - Bali, saya ingin booking ${treatment} (${price})`
    : `Halo Drips To You - Bali, saya ingin booking ${treatment}`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}

export function waGeneralUrl(text?: string): string {
  const waNumber = getWaNumber();
  const msg = text ?? 'Halo Drips To You - Bali, saya ingin informasi lebih lanjut';
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}

export function formatWaDisplay(raw: string): string {
  try {
    const digits = normalizeWhatsAppNumber(raw);
    const rest = digits.slice(2);
    if (rest.length <= 3) return `+62 ${rest}`;
    if (rest.length <= 7) return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`;
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  } catch {
    return `+${raw}`;
  }
}
