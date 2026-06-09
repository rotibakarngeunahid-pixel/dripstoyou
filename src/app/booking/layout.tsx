import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Mobile IV Therapy in Bali | Drips To You',
  description: 'Book your mobile IV therapy session in Bali in 3 easy steps. Choose your treatment, pick a schedule, and our certified medical team comes to you.',
  openGraph: {
    title: 'Book IV Therapy in Bali | Drips To You',
    description: 'Book your IV therapy session online. Certified medical team delivered to your villa, hotel, or home in Bali.',
    url: 'https://dripstoyou.com/booking',
  },
  alternates: { canonical: 'https://dripstoyou.com/booking' },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
