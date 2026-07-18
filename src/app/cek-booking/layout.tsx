import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

// Booking-status lookup is a utility page — keep it out of the index
// so it never competes with real landing pages.
export const metadata: Metadata = {
  title: 'Check Booking Status',
  description: 'Check the status of your Drips To You - Bali IV therapy booking using your booking code.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/cek-booking` },
};

export default function CekBookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
