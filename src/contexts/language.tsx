'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'id' | 'en';

export interface Translations {
  nav: {
    treatments: string; howToBook: string; coverage: string;
    about: string; contact: string; bookNow: string;
  };
  hero: {
    pill: string; line1: string; line2: string; lineEm: string;
    sub: string; bookWa: string; seeAll: string;
  };
  benefits: {
    fast: string; fastDesc: string; licensed: string; licensedDesc: string;
    mobile: string; mobileDesc: string; premium: string; premiumDesc: string;
  };
  treatments: {
    eyebrow: string; title: string; titleEm: string; desc: string;
    bookNow: string; perSession: string; seeAll: string;
    badge: { popular: string; bestSeller: string; new: string };
    cards: { name: string; detail: string }[];
  };
  howToBook: {
    eyebrow: string; title: string; titleEm: string; sub: string;
    steps: { title: string; desc: string }[];
  };
  areas: {
    eyebrow: string; title: string; titleEm: string; desc: string;
    areaCount: string; responseTime: string; coverage: string;
    liveService: string; popular: string; active: string;
    ocean: string; north: string;
  };
  testimonials: {
    eyebrow: string; title: string; titleEm: string; sub: string;
    cards: { text: string; name: string; loc: string; tag: string }[];
  };
  cta: {
    badge: string; title: string; titleEm: string; sub: string;
    bookNow: string; bookWa: string; seeAll: string;
  };
  footer: {
    brandDesc: string; colTreatments: string; colInfo: string; colContact: string;
    seeAll: string; about: string; howToBook: string; faq: string;
    hours: string; copyright: string;
  };
}

export const translations: Record<Lang, Translations> = {
  id: {
    nav: {
      treatments: 'Treatment', howToBook: 'Cara Booking', coverage: 'Coverage',
      about: 'Tentang', contact: 'Kontak', bookNow: 'Book Sekarang',
    },
    hero: {
      pill: 'Tersedia di Bali', line1: 'Hidrasi &', line2: 'Pemulihan', lineEm: 'Diantar ke Kamu',
      sub: 'Mobile IV therapy oleh tim medis bersertifikat — langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali.',
      bookWa: 'Booking via WhatsApp', seeAll: 'Lihat Semua Treatment',
    },
    benefits: {
      fast: 'Respon Cepat', fastDesc: 'Tim tiba dalam 60 menit ke lokasi Anda',
      licensed: 'Tim Bersertifikat', licensedDesc: 'Tenaga medis & perawat bersertifikat',
      mobile: 'Layanan Mobile', mobileDesc: 'Datang ke villa, hotel, atau Airbnb',
      premium: 'Perawatan Premium', premiumDesc: 'Produk & peralatan medis berkualitas',
    },
    treatments: {
      eyebrow: 'Treatment Kami', title: 'Rasakan Manfaat', titleEm: 'dalam Hitungan Jam',
      desc: 'Pilih treatment yang sesuai kebutuhanmu — dari pemulihan hangover hingga energy boost dan glowing skin.',
      bookNow: 'Book Sekarang', perSession: '/ sesi', seeAll: 'Lihat Semua Treatment',
      badge: { popular: 'Populer', bestSeller: 'Terlaris', new: 'Baru' },
      cards: [
        { name: 'Hangover Recovery', detail: 'Rehidrasi cepat · Vitamin B & C · Anti-mual' },
        { name: 'Immune Booster',    detail: 'Vitamin C dosis tinggi · Zinc · Glutathione' },
        { name: 'Energy Boost',      detail: 'B-complex · Magnesium · Elektrolit lengkap' },
        { name: 'Beauty Glow',       detail: 'Glutathione · Peningkat kolagen · Antioksidan' },
      ],
    },
    howToBook: {
      eyebrow: 'Cara Kerja', title: 'Booking', titleEm: 'dalam 3 Langkah',
      sub: 'Semudah mengisi form online — tim medis profesional kami siap hadir ke lokasi kamu.',
      steps: [
        { title: 'Pilih Treatment', desc: 'Browse pilihan IV therapy kami dan tentukan treatment yang paling sesuai dengan kondisi & kebutuhanmu.' },
        { title: 'Isi Form Booking', desc: 'Isi form booking online — nama, nomor WhatsApp, tanggal, waktu, dan lokasi kamu di Bali.' },
        { title: 'Tim Datang ke Anda', desc: 'Tim medis profesional tiba dalam 60 menit, siap memberikan treatment terbaik langsung di tempatmu.' },
      ],
    },
    areas: {
      eyebrow: 'Area Layanan', title: 'Wilayah', titleEm: 'Layanan Kami',
      desc: 'Kami menjangkau seluruh kawasan wisata utama Bali — dari pantai barat hingga pegunungan Ubud dan semenanjung Bukit.',
      areaCount: 'Area Layanan', responseTime: 'Waktu Respons', coverage: 'Cakupan Bali Selatan',
      liveService: 'Layanan Aktif · 08:00 – 22:00 WITA',
      popular: '★ Populer', active: 'Aktif', ocean: 'Samudra Hindia', north: 'BALI UTARA',
    },
    testimonials: {
      eyebrow: 'Testimoni', title: 'Kata', titleEm: 'Mereka',
      sub: 'Lebih dari 500 tamu Bali telah merasakan manfaat IV therapy kami.',
      cards: [
        { text: 'Pelayanannya sangat cepat dan profesional. Tim datang ke villa kami dalam 45 menit. Setelah treatment, langsung bisa jalan-jalan lagi! Sangat recommended.', name: 'Sarah Johnson', loc: 'Villa di Seminyak', tag: 'Hangover Recovery' },
        { text: 'Tried the Hangover Recovery after a night in Canggu. Genuinely felt better within 2 hours. Equipment was clean and the team was super professional. Worth every rupiah!', name: 'James Miller', loc: 'Hotel di Canggu', tag: 'Hangover Recovery' },
        { text: 'Tim medisnya sangat ramah dan peralatan terlihat steril dan berkualitas tinggi. Harga worth it banget untuk kualitas yang diberikan. Pasti akan repeat!', name: 'Maria Santos', loc: 'Airbnb di Ubud', tag: 'Immune Booster' },
      ],
    },
    cta: {
      badge: 'Tersedia 08.00 – 22.00 WITA', title: 'Siap Merasa', titleEm: 'Lebih Baik?',
      sub: 'Jangan biarkan dehidrasi atau kelelahan merusak liburan Bali-mu. Tim medis profesional kami siap datang ke tempat kamu berada.',
      bookNow: 'Book Sekarang', bookWa: 'Booking via WhatsApp', seeAll: 'Lihat Semua Treatment',
    },
    footer: {
      brandDesc: 'Mobile IV Therapy premium yang datang langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali.',
      colTreatments: 'Treatment', colInfo: 'Info', colContact: 'Kontak',
      seeAll: 'Lihat Semua →', about: 'Tentang Kami', howToBook: 'Cara Booking',
      faq: 'FAQ', hours: '08:00 – 22:00 WITA',
      copyright: 'Hak cipta dilindungi. Mobile IV Therapy Premium di Bali.',
    },
  },
  en: {
    nav: {
      treatments: 'Treatments', howToBook: 'How to Book', coverage: 'Coverage',
      about: 'About', contact: 'Contact', bookNow: 'Book Now',
    },
    hero: {
      pill: 'Now Available in Bali', line1: 'Hydration &', line2: 'Recovery', lineEm: 'Delivered to You',
      sub: 'Mobile IV therapy by certified medical team — delivered to your villa, hotel, or Airbnb across Bali.',
      bookWa: 'Book via WhatsApp', seeAll: 'See All Treatments',
    },
    benefits: {
      fast: 'Fast Response', fastDesc: 'Team arrives within 60 minutes to your location',
      licensed: 'Licensed Team', licensedDesc: 'Certified medical staff & registered nurses',
      mobile: 'Mobile Service', mobileDesc: 'We come to your villa, hotel, or Airbnb',
      premium: 'Premium Care', premiumDesc: 'High-quality medical products & equipment',
    },
    treatments: {
      eyebrow: 'Our Treatments', title: 'Feel Good', titleEm: 'in Hours',
      desc: 'Choose the treatment that suits your needs — from hangover recovery to energy boost and glowing skin.',
      bookNow: 'Book Now', perSession: '/ session', seeAll: 'See All Treatments',
      badge: { popular: 'Popular', bestSeller: 'Best Seller', new: 'New' },
      cards: [
        { name: 'Hangover Recovery', detail: 'Fast rehydration · Vitamin B & C · Anti-nausea' },
        { name: 'Immune Booster',    detail: 'High-dose Vitamin C · Zinc · Glutathione' },
        { name: 'Energy Boost',      detail: 'B-complex · Magnesium · Full electrolytes' },
        { name: 'Beauty Glow',       detail: 'Glutathione · Collagen boost · Antioxidants' },
      ],
    },
    howToBook: {
      eyebrow: 'How It Works', title: 'Book in', titleEm: '3 Simple Steps',
      sub: 'As easy as filling an online form — our professional medical team is ready to come to you.',
      steps: [
        { title: 'Choose Treatment', desc: 'Browse our IV therapy options and select the treatment best suited for your current condition and needs.' },
        { title: 'Fill Booking Form', desc: 'Fill out the online booking form — your name, WhatsApp number, preferred date, time, and Bali location.' },
        { title: 'Team Comes to You', desc: 'Our professional medical team arrives within 60 minutes, ready to deliver the best treatment right at your location.' },
      ],
    },
    areas: {
      eyebrow: 'Coverage Area', title: 'Our Service', titleEm: 'Areas',
      desc: 'We cover all major tourist areas in Bali — from the western beaches to Ubud highlands and the Bukit peninsula.',
      areaCount: 'Service Areas', responseTime: 'Response Time', coverage: 'South Bali Coverage',
      liveService: 'Active Service · 08:00 – 22:00 WITA',
      popular: '★ Popular', active: 'Active', ocean: 'Indian Ocean', north: 'NORTH BALI',
    },
    testimonials: {
      eyebrow: 'Testimonials', title: 'What Our', titleEm: 'Guests Say',
      sub: 'Over 500 Bali guests have experienced the benefits of our IV therapy.',
      cards: [
        { text: 'The service was incredibly fast and professional. The team arrived at our villa in just 45 minutes. After the treatment, we were ready to explore again! Highly recommended.', name: 'Sarah Johnson', loc: 'Villa in Seminyak', tag: 'Hangover Recovery' },
        { text: 'Tried the Hangover Recovery after a night in Canggu. Genuinely felt better within 2 hours. Equipment was clean and the team was super professional. Worth every rupiah!', name: 'James Miller', loc: 'Hotel in Canggu', tag: 'Hangover Recovery' },
        { text: 'The medical team was very friendly and the equipment looked sterile and high quality. Absolutely worth it for the quality provided. Will definitely repeat!', name: 'Maria Santos', loc: 'Airbnb in Ubud', tag: 'Immune Booster' },
      ],
    },
    cta: {
      badge: 'Available 08:00 – 22:00 WITA', title: 'Ready to Feel', titleEm: 'Better?',
      sub: "Don't let dehydration or fatigue ruin your Bali holiday. Our professional medical team is ready to come to you.",
      bookNow: 'Book Now', bookWa: 'Book via WhatsApp', seeAll: 'See All Treatments',
    },
    footer: {
      brandDesc: 'Premium mobile IV therapy delivered to your villa, hotel, or Airbnb anywhere in Bali.',
      colTreatments: 'Treatments', colInfo: 'Info', colContact: 'Contact',
      seeAll: 'See All →', about: 'About Us', howToBook: 'How to Book',
      faq: 'FAQ', hours: '08:00 – 22:00 WITA',
      copyright: 'All rights reserved. Premium Mobile IV Therapy in Bali.',
    },
  },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'id',
  setLang: () => {},
  t: translations.id,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('id');
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
