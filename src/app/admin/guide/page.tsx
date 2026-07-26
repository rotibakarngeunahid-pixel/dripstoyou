import type { Metadata } from 'next';
import GuideContent from './GuideContent';

export const metadata: Metadata = { title: 'Panduan Admin Blog - Drips To You - Bali' };

export default function AdminGuidePage() {
  return <GuideContent />;
}
