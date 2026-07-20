import type { Metadata } from 'next';

// Every /feedback/[token] link is private and single-use — never let it get
// indexed, cached, or previewed by crawlers/link-unfurlers.
export const metadata: Metadata = {
  title: 'Feedback Treatment',
  robots: { index: false, follow: false, nocache: true },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
