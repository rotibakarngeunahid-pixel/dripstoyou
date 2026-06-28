import type { Metadata } from 'next';
import CRMShell from './CRMShell';

export const metadata: Metadata = {
  title: 'CRM — Drips To You Bali',
  robots: 'noindex, nofollow',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <CRMShell>{children}</CRMShell>;
}
