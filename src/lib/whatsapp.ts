const WA_NUMBER = process.env.WHATSAPP_NUMBER ?? '6281200000000';

export function waBookingUrl(treatment: string, price?: string): string {
  const text = price
    ? `Halo DRIP TO YOU Bali, saya ingin booking ${treatment} (${price})`
    : `Halo DRIP TO YOU Bali, saya ingin booking ${treatment}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function waGeneralUrl(text?: string): string {
  const msg = text ?? 'Halo DRIP TO YOU Bali, saya ingin informasi lebih lanjut';
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function getWaNumber(): string {
  return WA_NUMBER;
}

export function formatWaNumber(raw: string): string {
  return `+${raw.slice(0, 2)} ${raw.slice(2, 5)}-${raw.slice(5, 9)}-${raw.slice(9)}`;
}
