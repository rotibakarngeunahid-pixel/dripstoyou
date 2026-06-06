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
    bookNow: string; perSession: string; seeAll: string; seeMore: string;
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
    arrivalTime?: string; notInList?: string; contactUs?: string;
  };
  gallery: {
    eyebrow: string; title: string; titleEm: string; desc: string;
  };
  whyChooseUs: {
    eyebrow: string; title: string; titleEm: string; desc: string;
    items: { title: string; desc: string }[];
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
      pill: 'Tersedia di Seluruh Bali',
      line1: 'Hidrasi &', line2: 'Pemulihan', lineEm: 'Diantar ke Kamu',
      sub: 'Mobile IV therapy oleh tim medis bersertifikat — langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali. Tanpa perlu ke klinik, kami yang datang.',
      bookWa: 'Konsultasi via WhatsApp', seeAll: 'Lihat Semua Treatment',
    },
    benefits: {
      fast: 'Respon Cepat', fastDesc: 'Tim medis tiba dalam 60 menit ke lokasi Anda di Bali',
      licensed: 'Tim Bersertifikat', licensedDesc: 'Tenaga medis & perawat berlisensi resmi',
      mobile: 'Layanan Mobile', mobileDesc: 'Kami datang ke villa, hotel, Airbnb, atau mana saja',
      premium: 'Perawatan Premium', premiumDesc: 'Produk & peralatan medis steril berkualitas tinggi',
    },
    treatments: {
      eyebrow: 'Treatment Kami', title: 'Rasakan Manfaatnya', titleEm: 'dalam Hitungan Jam',
      desc: 'Setiap treatment dirancang oleh tenaga medis profesional untuk membantu mendukung pemulihan, energi, dan kesehatan optimal kamu di Bali.',
      bookNow: 'Book Sekarang', perSession: '/ sesi', seeAll: 'Lihat Semua Treatment', seeMore: 'Lihat Selengkapnya',
      badge: { popular: 'Populer', bestSeller: 'Terlaris', new: 'Baru' },
      cards: [
        { name: 'Hangover Recovery', detail: 'Rehidrasi cepat · Vitamin B & C · Anti-mual' },
        { name: 'Immune Booster',    detail: 'Vitamin C dosis tinggi · Zinc · Glutathione' },
        { name: 'Energy Boost',      detail: 'B-complex · Magnesium · Elektrolit lengkap' },
        { name: 'Beauty Glow',       detail: 'Glutathione · Peningkat kolagen · Antioksidan' },
      ],
    },
    howToBook: {
      eyebrow: 'Cara Kerja', title: 'Booking', titleEm: 'dalam 3 Langkah Mudah',
      sub: 'Prosesnya sangat mudah — cukup pilih treatment, isi form, dan tim medis profesional kami akan hadir ke lokasi kamu dalam waktu singkat.',
      steps: [
        { title: 'Pilih Treatment', desc: 'Jelajahi pilihan IV therapy kami dan tentukan treatment yang paling sesuai dengan kondisi serta kebutuhan kamu saat ini.' },
        { title: 'Isi Form Booking', desc: 'Isi form booking online dengan nama, nomor WhatsApp, tanggal, waktu, dan alamat lengkap lokasi kamu di Bali.' },
        { title: 'Tim Datang ke Kamu', desc: 'Tim medis profesional kami tiba dalam 60 menit, membawa semua perlengkapan yang dibutuhkan untuk memberikan treatment terbaik.' },
      ],
    },
    areas: {
      eyebrow: 'Area Layanan', title: 'Kami Menjangkau', titleEm: 'Seluruh Bali',
      desc: 'Dari pantai Canggu hingga resort Nusa Dua, dari kawasan budaya Ubud hingga tebing Uluwatu — tim kami siap hadir ke mana pun kamu berada di Bali.',
      areaCount: 'Area Dilayani', responseTime: 'Waktu Respons', coverage: 'Cakupan Bali Selatan',
      liveService: 'Layanan Aktif · 08:00 – 22:00 WITA',
      popular: '★ Populer', active: 'Aktif', ocean: 'Samudra Hindia', north: 'BALI UTARA',
      arrivalTime: 'Estimasi tiba', notInList: 'Area kamu tidak ada di list?', contactUs: 'Tanyakan via booking',
    },
    gallery: {
      eyebrow: 'Pengalaman Premium', title: 'Momen', titleEm: 'Drips To You',
      desc: 'IV therapy profesional yang diantarkan langsung ke villa, hotel, atau rumah Anda di Bali.',
    },
    whyChooseUs: {
      eyebrow: 'Kenapa Memilih Kami', title: 'Perbedaan', titleEm: 'Drips To You',
      desc: 'Kami percaya layanan kesehatan dan kebugaran yang luar biasa harus datang kepada Anda — di mana pun Anda berada di Bali.',
      items: [
        { title: 'Layanan Di Tempat yang Praktis', desc: 'Tanpa repot, tanpa perjalanan. Kami membawa layanan medis profesional langsung ke villa, hotel, rumah, atau kantor Anda di mana saja di Bali.' },
        { title: 'Tim Medis Ahli', desc: 'Kesehatan Anda berada di tangan yang tepat. Semua perawatan diberikan oleh tenaga kesehatan bersertifikat dan sangat berpengalaman.' },
        { title: 'Layanan Cepat & Responsif', desc: 'Tanpa antrean atau waktu tunggu yang lama. Tim kami siap merespons dengan cepat kapan pun Anda membutuhkan kami.' },
        { title: 'Dapat Diakses Siapa Saja', desc: 'Baik Anda seorang turis yang sedang menikmati liburan, ekspatriat, atau penduduk lokal, kami ada untuk Anda.' },
        { title: 'Aman, Nyaman & Terpercaya', desc: 'Nikmati perawatan kebugaran premium bebas stres dalam kenyamanan ruang Anda sendiri.' },
      ],
    },
    testimonials: {
      eyebrow: 'Testimoni', title: 'Apa Kata', titleEm: 'Tamu Kami',
      sub: 'Lebih dari 500 tamu di seluruh Bali telah mempercayakan pemulihan mereka kepada Drips To You - Bali.',
      cards: [
        { text: 'Pelayanannya luar biasa cepat dan profesional. Tim tiba ke villa kami hanya dalam 45 menit. Setelah treatment Hangover Recovery, saya langsung segar dan bisa lanjut liburan!', name: 'Sarah Johnson', loc: 'Villa di Seminyak', tag: 'Hangover Recovery' },
        { text: 'Tried the Hangover Recovery after a big night in Canggu. Felt genuinely better within 2 hours. Equipment was clearly sterile and the medical team was super professional. Absolutely worth it!', name: 'James Miller', loc: 'Hotel di Canggu', tag: 'Hangover Recovery' },
        { text: 'Tim medisnya sangat ramah, peralatan steril, dan kualitasnya jauh melebihi ekspektasi saya. Harga sangat worth it. Sudah jadi andalan setiap kali ke Bali — pasti repeat!', name: 'Maria Santos', loc: 'Airbnb di Ubud', tag: 'Immune Booster' },
      ],
    },
    cta: {
      badge: 'Tersedia 08:00 – 22:00 WITA', title: 'Siap Merasa', titleEm: 'Lebih Baik Sekarang?',
      sub: 'Jangan biarkan dehidrasi, kelelahan, atau rasa tidak enak badan merusak pengalaman Bali-mu. Tim medis kami siap hadir ke lokasi kamu dalam 60 menit.',
      bookNow: 'Book Sekarang', bookWa: 'Konsultasi via WhatsApp', seeAll: 'Lihat Semua Treatment',
    },
    footer: {
      brandDesc: 'Layanan mobile IV therapy premium yang hadir langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali. Dipercaya lebih dari 500 tamu.',
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
      pill: 'Available Across Bali',
      line1: 'Hydration &', line2: 'Recovery', lineEm: 'Delivered to You',
      sub: 'Mobile IV therapy by certified medical team — delivered straight to your villa, hotel, or Airbnb anywhere in Bali. No need to go anywhere.',
      bookWa: 'Consult via WhatsApp', seeAll: 'See All Treatments',
    },
    benefits: {
      fast: 'Fast Response', fastDesc: 'Medical team arrives within 60 minutes to your location',
      licensed: 'Licensed Team', licensedDesc: 'Certified medical professionals & registered nurses',
      mobile: 'Mobile Service', mobileDesc: 'We come to your villa, hotel, Airbnb, or anywhere',
      premium: 'Premium Care', premiumDesc: 'High-quality sterile medical products & equipment',
    },
    treatments: {
      eyebrow: 'Our Treatments', title: 'Feel the Difference', titleEm: 'in Hours',
      desc: 'Each treatment is designed by medical professionals to help support your recovery, energy, and overall wellbeing during your Bali stay.',
      bookNow: 'Book Now', perSession: '/ session', seeAll: 'See All Treatments', seeMore: 'Learn More',
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
      sub: 'The process is effortless — choose your treatment, fill in the form, and our professional medical team will be at your location in no time.',
      steps: [
        { title: 'Choose Treatment', desc: 'Browse our IV therapy options and select the treatment best suited for your current condition and what you need right now.' },
        { title: 'Fill Booking Form', desc: 'Complete the online booking form with your name, WhatsApp number, preferred date, time, and your Bali address.' },
        { title: 'Team Comes to You', desc: 'Our certified medical team arrives within 60 minutes, fully equipped to deliver the best treatment right at your location.' },
      ],
    },
    areas: {
      eyebrow: 'Coverage Area', title: 'We Cover', titleEm: 'All of Bali',
      desc: 'From Canggu beach clubs to Nusa Dua resorts, from Ubud rice terraces to Uluwatu cliffs — our team comes wherever you are in Bali.',
      areaCount: 'Areas Covered', responseTime: 'Response Time', coverage: 'South Bali Coverage',
      liveService: 'Active Service · 08:00 – 22:00 WITA',
      popular: '★ Popular', active: 'Active', ocean: 'Indian Ocean', north: 'NORTH BALI',
      arrivalTime: 'Est. arrival', notInList: "Your area not on the list?", contactUs: 'Ask via booking',
    },
    gallery: {
      eyebrow: 'Premium Experience', title: 'Drips To You', titleEm: 'Moments',
      desc: 'Professional IV therapy delivered directly to your villa, hotel, or home in Bali.',
    },
    whyChooseUs: {
      eyebrow: 'Why Choose Us', title: 'The Drips To You', titleEm: 'Difference',
      desc: 'We believe exceptional wellness care should come to you — wherever you are in Bali.',
      items: [
        { title: 'Convenient On-Site Service', desc: 'No hassle, no travel. We bring professional medical care directly to your villa, hotel, home, or office anywhere in Bali.' },
        { title: 'Expert Medical Team', desc: 'Your health is in good hands. All treatments are delivered by certified, highly experienced healthcare professionals.' },
        { title: 'Fast & Responsive Care', desc: 'No long queues or waiting times. Our team is ready to respond swiftly whenever you need us.' },
        { title: 'Accessible for Everyone', desc: 'Whether you are a tourist enjoying a vacation, an expat, or a local resident, we are here for you.' },
        { title: 'Safe, Comfortable & Trusted', desc: 'Experience premium, stress-free wellness care in the comfort of your own space.' },
      ],
    },
    testimonials: {
      eyebrow: 'Testimonials', title: 'What Our', titleEm: 'Guests Say',
      sub: 'Over 500 guests across Bali have trusted Drips To You - Bali for their recovery and wellness needs.',
      cards: [
        { text: 'The service was incredibly fast and professional. The team arrived at our villa in just 45 minutes. After the Hangover Recovery treatment, I felt completely refreshed — ready to keep exploring!', name: 'Sarah Johnson', loc: 'Villa in Seminyak', tag: 'Hangover Recovery' },
        { text: 'Tried the Hangover Recovery after a big night in Canggu. Genuinely felt better within 2 hours. Equipment was clearly sterile and the medical team was super professional. Absolutely worth it!', name: 'James Miller', loc: 'Hotel in Canggu', tag: 'Hangover Recovery' },
        { text: 'The medical team was incredibly friendly and the equipment looked sterile and top quality. Far exceeded my expectations. Absolutely worth every rupiah — this is now my go-to every time I visit Bali!', name: 'Maria Santos', loc: 'Airbnb in Ubud', tag: 'Immune Booster' },
      ],
    },
    cta: {
      badge: 'Available 08:00 – 22:00 WITA', title: 'Ready to Feel', titleEm: 'Better Right Now?',
      sub: "Don't let dehydration, fatigue, or illness ruin your Bali experience. Our medical team is ready to come to your location within 60 minutes.",
      bookNow: 'Book Now', bookWa: 'Consult via WhatsApp', seeAll: 'See All Treatments',
    },
    footer: {
      brandDesc: 'Premium mobile IV therapy delivered to your villa, hotel, or Airbnb across Bali. Trusted by 500+ guests.',
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
