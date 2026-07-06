import type { Metadata } from 'next';

// Every /consent/[token] link is private and single-use — never let it get
// indexed, cached, or previewed by crawlers/link-unfurlers.
export const metadata: Metadata = {
  title: 'Informed Consent',
  robots: { index: false, follow: false, nocache: true },
};

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
