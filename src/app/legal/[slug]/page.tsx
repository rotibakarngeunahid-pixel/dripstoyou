import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/* ── Static fallback content ──────────────────────────────────────────────── */
const STATIC_LEGAL: Record<string, { title: string; content: string }> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `Drips To You - Bali respects your privacy and is committed to protecting the personal information you share with us when using our website, booking form, WhatsApp communication, or related services.

Information We Collect
We may collect your name, phone number, location or service address, preferred appointment date and time, selected treatment, notes you provide, and communication history related to your booking.

How We Use Your Information
We use your information to process bookings, confirm appointment details, contact you through WhatsApp or phone, provide on-site service coordination, improve our website, and maintain internal service records.

Medical and Service Notes
Any health-related notes you provide are used only to help our team understand your request before service. Online information does not replace direct medical assessment by qualified healthcare professionals.

Data Sharing
We do not sell your personal information. Information may be shared only with authorized team members or healthcare professionals involved in delivering your requested service.

WhatsApp Communication
By submitting a booking or contacting us through WhatsApp, you agree that we may communicate with you through WhatsApp for booking confirmation, schedule updates, and service coordination.

Data Security
We take reasonable steps to protect your information from unauthorized access, misuse, or disclosure. However, no online system can be guaranteed to be completely secure.

Your Rights
You may request correction or deletion of your personal information by contacting us through the official contact details listed on our website.

Updates
We may update this Privacy Policy from time to time. The latest version will be available on this page.`,
  },
  'terms-conditions': {
    title: 'Terms and Conditions',
    content: `By using the Drips To You - Bali website or booking our services, you agree to the following terms and conditions.

Service Nature
Drips To You - Bali provides mobile wellness and IV therapy services delivered to villas, hotels, homes, offices, or other eligible locations in Bali, subject to team availability and coverage area.

Booking Confirmation
Submitting a booking request does not automatically guarantee a confirmed appointment. Our team will contact you to confirm availability, location, schedule, treatment suitability, and final details.

Medical Disclaimer
Information on this website is for general service information only and is not a substitute for professional medical advice, diagnosis, or emergency care. Final treatment eligibility may be assessed by qualified healthcare professionals.

Emergency Conditions
Our service is not intended for medical emergencies. If you experience severe symptoms, chest pain, difficulty breathing, loss of consciousness, severe allergic reaction, or any urgent condition, please contact emergency services or visit the nearest hospital immediately.

Eligibility
Certain treatments may not be suitable for everyone. We reserve the right to decline or recommend postponing treatment based on safety considerations, health condition, age, pregnancy status, medication use, or other relevant factors.

Coverage Area
Service availability depends on coverage area, travel distance, team schedule, weather, traffic, and location accessibility. Additional travel fees may apply for certain areas if stated during confirmation.

Reschedule and Cancellation
Reschedule and cancellation requests should be made as early as possible. Late cancellations or changes may be subject to operational limitations or fees depending on team dispatch status.

Pricing and Payment
Prices, packages, and promotions may change without prior notice. Final price will be confirmed before service. Payment method and timing will be communicated during booking confirmation.

Customer Responsibility
Customers are responsible for providing accurate contact details, full location address, relevant health information, and a safe environment for the team to deliver service.

Limitation of Liability
To the maximum extent permitted by applicable law, Drips To You - Bali is not responsible for delays, service limitations, or issues caused by inaccurate information, inaccessible location, third-party platforms, network problems, or circumstances beyond our control.

Changes to Terms
We may update these Terms and Conditions from time to time. The latest version will be available on this page.`,
  },
};

type LegalData = { title: string; content: string; updatedAt: string };

async function getLegalPage(slug: string): Promise<LegalData | null> {
  /* 1. Try Prisma */
  try {
    const page = await prisma.legalPage.findFirst({ where: { slug, isPublished: true } });
    if (page) {
      return { title: page.title, content: page.content, updatedAt: page.updatedAt.toISOString() };
    }
  } catch {
    /* DB unavailable — fall through */
  }

  /* 2. Try PHP proxy */
  try {
    const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (phpBase) {
      const res = await fetch(
        `${phpBase}/legal.php?slug=${encodeURIComponent(slug)}`,
        { cache: 'no-store', signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        if (d) return { title: d.title as string, content: d.content as string, updatedAt: d.updated_at as string };
      }
    }
  } catch {
    /* fall through */
  }

  /* 3. Static fallback for known pages */
  const staticPage = STATIC_LEGAL[slug];
  if (staticPage) {
    return { ...staticPage, updatedAt: new Date('2026-06-06').toISOString() };
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: 'Not Found' };
  return { title: `${page.title} - Drips To You - Bali`, robots: 'noindex' };
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <h1 className="page-title">{page.title}</h1>
            <p className="page-subtitle">
              Last updated:{' '}
              {new Date(page.updatedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </section>

        <section className="page-section narrow">
          <article className="content-card legal-content">
            {page.content.split('\n\n').map((block, i) => {
              const trimmed = block.trim();
              if (!trimmed) return null;
              /* Lines with no leading whitespace that are short = headings */
              const lines = trimmed.split('\n');
              if (lines.length === 1 && trimmed.length < 60 && !trimmed.endsWith('.')) {
                return <h2 key={i} className="legal-heading">{trimmed}</h2>;
              }
              return <p key={i} className="legal-para">{trimmed}</p>;
            })}
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
