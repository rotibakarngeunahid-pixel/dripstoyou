import { getWaNumber, formatWaDisplay } from '@/lib/whatsapp';
import SiteFooterClient from './SiteFooterClient';

interface Props {
  waNumber?: string;
}

export default function SiteFooter({ waNumber: waOverride }: Props) {
  const waNumber = waOverride ?? getWaNumber();
  const displayNumber = formatWaDisplay(waNumber);
  return <SiteFooterClient waNumber={waNumber} displayNumber={displayNumber} />;
}
