import Header from '@/components/public/Header';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import HomeContent from '@/components/public/HomeContent';

const WA_NUMBER = process.env.WHATSAPP_NUMBER ?? '6281200000000';

export default function HomePage() {
  return (
    <>
      <Header />
      <ScrollRevealInit />
      <HomeContent waNumber={WA_NUMBER} />
    </>
  );
}
