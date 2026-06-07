'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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
    termsConditions: string; privacyPolicy: string; waFloatMessage: string;
  };
  treatmentsPage: {
    eyebrow: string; title: string; titleEm: string; subtitle: string;
    bookNow: string; detail: string; durationText: string; backHome: string;
  };
  treatmentDetail: {
    backAll: string; durationText: string; orderBtn: string; askWa: string;
    benefitsTitle: string; aboutTitle: string; faqTitle: string;
    ctaTitle: string; ctaSubtitle: string; bookBtn: string;
    askWaFirst: string; waMessage: string;
  };
  aboutPage: {
    eyebrow: string; title: string; titleEm: string; subtitle: string;
    bookNow: string; chatWa: string;
    missionTitle: string; missionP1: string; missionP2: string;
    howItWorksTitle: string; howItWorksSub: string;
    safetyTitle: string; safetyP1: string; safetyP2: string;
    areasTitle: string; areasSub: string; checkAreaBtn: string;
    ctaTitle: string; ctaSub: string; ctaBookBtn: string; ctaWaBtn: string;
    waMessage: string;
    values: { label: string; title: string; desc: string }[];
    steps: { num: string; title: string; desc: string }[];
  };
  contactPage: {
    eyebrow: string; title: string; subtitle: string;
    waTag: string; waTitle: string; waDesc: string; waBtn: string;
    bookingTag: string; bookingTitle: string; bookingDesc: string; bookingBtn: string;
    hoursTitle: string; hoursDesc: string;
  };
  faqPage: {
    eyebrow: string; title: string; subtitle: string;
    emptyState: string; stillQ: string; stillQDesc: string;
    askBtn: string; waMessage: string;
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
      sub: 'Tim medis bersertifikat datang langsung ke villa, hotel, atau Airbnb Anda di seluruh Bali. Nyaman, aman, dan terpersonalisasi untuk kebutuhan Anda.',
      bookWa: 'Konsultasi via WhatsApp', seeAll: 'Lihat Treatment',
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
      colTreatments: 'Treatment', colInfo: 'Informasi', colContact: 'Kontak',
      seeAll: 'Lihat Semua →', about: 'Tentang Kami', howToBook: 'Cara Booking',
      faq: 'FAQ', hours: '08:00 – 22:00 WITA',
      copyright: 'Hak cipta dilindungi. Mobile IV Therapy Premium di Bali.',
      termsConditions: 'Syarat & Ketentuan',
      privacyPolicy: 'Kebijakan Privasi',
      waFloatMessage: 'Halo Drips To You - Bali, saya ingin informasi lebih lanjut',
    },
    treatmentsPage: {
      eyebrow: 'Treatment Kami',
      title: 'IV Therapy di',
      titleEm: 'Mana Saja',
      subtitle: 'Semua treatment dirancang oleh tenaga medis profesional dan diantar langsung ke lokasi Anda di Bali.',
      bookNow: 'Book Sekarang',
      detail: 'Detail',
      durationText: 'sekitar {n} menit',
      backHome: 'Kembali ke Beranda',
    },
    treatmentDetail: {
      backAll: '← Semua Treatment',
      durationText: 'sekitar {n} menit',
      orderBtn: 'Pesan {name}',
      askWa: 'Tanya via WhatsApp',
      benefitsTitle: 'Kandungan & Manfaat',
      aboutTitle: 'Tentang Treatment Ini',
      faqTitle: 'FAQ',
      ctaTitle: 'Siap mencoba {name}?',
      ctaSubtitle: 'Tim medis kami siap hadir ke lokasi Anda dalam 30–60 menit setelah jadwal dikonfirmasi.',
      bookBtn: 'Booking {name} Sekarang',
      askWaFirst: 'Tanya dulu via WhatsApp',
      waMessage: 'Halo, saya ingin tanya tentang treatment {name}',
    },
    aboutPage: {
      eyebrow: 'Tentang Kami',
      title: 'Kesehatan di',
      titleEm: 'Ujung Jari Anda',
      subtitle: 'Drips To You - Bali membantu tamu dan warga Bali mendapatkan IV therapy tanpa meninggalkan kenyamanan tempat menginap.',
      bookNow: 'Booking Sekarang',
      chatWa: 'Chat WhatsApp',
      missionTitle: 'Misi Kami',
      missionP1: 'Kami percaya perawatan kesehatan premium harus mudah diakses. Dengan menghadirkan tenaga medis langsung ke villa, hotel, Airbnb, atau rumah Anda, proses pemulihan menjadi lebih praktis dan nyaman.',
      missionP2: 'Setiap sesi IV therapy dilakukan oleh tenaga medis terlisensi dengan peralatan steril berstandar medis. Keselamatan, kebersihan, dan komunikasi yang jelas menjadi prioritas utama.',
      howItWorksTitle: 'Cara Kerja Layanan',
      howItWorksSub: 'Dari booking hingga treatment selesai — mudah dan aman.',
      safetyTitle: 'Keamanan & Kenyamanan',
      safetyP1: 'Layanan kami dirancang untuk membantu mendukung pemulihan dan hidrasi tubuh. Bukan untuk kondisi darurat medis. Jika Anda mengalami kondisi darurat, segera hubungi layanan gawat darurat setempat.',
      safetyP2: 'Setiap team member kami memiliki lisensi medis aktif. Peralatan sekali pakai dan steril digunakan pada setiap sesi.',
      areasTitle: 'Area Layanan',
      areasSub: 'Kami melayani area wisata dan hunian utama di Bali.',
      checkAreaBtn: 'Cek Ketersediaan Area',
      ctaTitle: 'Siap Mencoba?',
      ctaSub: 'Tim medis kami siap hadir ke lokasi Anda di Bali. Booking sekarang atau konsultasikan kebutuhan Anda.',
      ctaBookBtn: 'Booking Sekarang',
      ctaWaBtn: 'Chat di WhatsApp',
      waMessage: 'Halo, saya ingin tahu lebih lanjut tentang Drips To You Bali',
      values: [
        { label: 'Medis', title: 'Tenaga Medis Profesional', desc: 'Treatment dilakukan oleh perawat dan dokter berlisensi dengan pengalaman klinis.' },
        { label: 'On-call', title: 'Datang ke Lokasi', desc: 'Tim datang ke villa, hotel, Airbnb, atau rumah di area utama Bali.' },
        { label: 'Steril', title: 'Peralatan Sekali Pakai', desc: 'Semua alat treatment disiapkan steril dan mengikuti standar medis.' },
        { label: 'Cepat', title: 'Respons 30–60 Menit', desc: 'Jadwal dikonfirmasi via WhatsApp dan tim bergerak sesuai area layanan.' },
      ],
      steps: [
        { num: '01', title: 'Pilih Treatment', desc: 'Pilih treatment sesuai kebutuhan dari website atau tanyakan via WhatsApp.' },
        { num: '02', title: 'Isi Form Booking', desc: 'Lengkapi data diri, tanggal, waktu, dan lokasi Anda.' },
        { num: '03', title: 'Konfirmasi WhatsApp', desc: 'Tim kami menghubungi Anda untuk konfirmasi jadwal dan detail.' },
        { num: '04', title: 'Tim Datang ke Lokasi', desc: 'Tenaga medis hadir ke lokasi Anda dalam waktu yang disepakati.' },
        { num: '05', title: 'Treatment Selesai', desc: 'Nikmati treatment dalam kenyamanan tempat Anda. Aman dan profesional.' },
      ],
    },
    contactPage: {
      eyebrow: 'Kontak',
      title: 'Butuh Bantuan?',
      subtitle: 'Tim kami siap membantu konsultasi treatment, pengecekan area layanan, dan konfirmasi booking.',
      waTag: 'WhatsApp',
      waTitle: 'Chat Langsung',
      waDesc: 'Respons tercepat untuk konsultasi treatment dan pertanyaan umum.',
      waBtn: 'Chat via WhatsApp',
      bookingTag: 'Booking',
      bookingTitle: 'Form Website',
      bookingDesc: 'Pilih treatment, tanggal, waktu, dan lokasi layanan untuk booking langsung.',
      bookingBtn: 'Buka Form Booking',
      hoursTitle: 'Jam Layanan',
      hoursDesc: 'Setiap hari pukul 08:00 – 22:00 WITA. Estimasi kedatangan bergantung pada area layanan dan ketersediaan tim.',
    },
    faqPage: {
      eyebrow: 'FAQ',
      title: 'Ada Pertanyaan?',
      subtitle: 'Temukan jawaban tentang proses booking, keamanan treatment, area layanan, dan konfirmasi jadwal.',
      emptyState: 'FAQ akan segera tersedia. Silakan hubungi kami via WhatsApp untuk pertanyaan.',
      stillQ: 'Masih ada pertanyaan?',
      stillQDesc: 'Tim kami siap membantu Anda melalui WhatsApp.',
      askBtn: 'Tanya via WhatsApp',
      waMessage: 'Halo, saya punya pertanyaan tentang layanan Drips To You - Bali',
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
      sub: 'Certified medical team comes directly to your villa, hotel, or Airbnb across Bali. Comfortable, safe, and personalized for your needs.',
      bookWa: 'Consult via WhatsApp', seeAll: 'View Treatments',
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
      arrivalTime: 'Est. arrival', notInList: 'Your area not on the list?', contactUs: 'Ask via booking',
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
      colTreatments: 'Treatments', colInfo: 'Information', colContact: 'Contact',
      seeAll: 'See All →', about: 'About Us', howToBook: 'How to Book',
      faq: 'FAQ', hours: '08:00 – 22:00 WITA',
      copyright: 'All rights reserved. Premium Mobile IV Therapy in Bali.',
      termsConditions: 'Terms & Conditions',
      privacyPolicy: 'Privacy Policy',
      waFloatMessage: 'Hi Drips To You - Bali, I would like more information',
    },
    treatmentsPage: {
      eyebrow: 'Our Treatments',
      title: 'IV Therapy',
      titleEm: 'Anywhere You Are',
      subtitle: 'Every treatment is designed by medical professionals and delivered directly to your location in Bali.',
      bookNow: 'Book Now',
      detail: 'Details',
      durationText: 'approx. {n} min',
      backHome: 'Back to Home',
    },
    treatmentDetail: {
      backAll: '← All Treatments',
      durationText: 'approx. {n} min',
      orderBtn: 'Book {name}',
      askWa: 'Ask via WhatsApp',
      benefitsTitle: 'Ingredients & Benefits',
      aboutTitle: 'About This Treatment',
      faqTitle: 'FAQ',
      ctaTitle: 'Ready to try {name}?',
      ctaSubtitle: 'Our medical team is ready to come to your location within 30–60 minutes after your schedule is confirmed.',
      bookBtn: 'Book {name} Now',
      askWaFirst: 'Ask via WhatsApp First',
      waMessage: "Hi, I'd like to ask about the {name} treatment",
    },
    aboutPage: {
      eyebrow: 'About Us',
      title: 'Wellness',
      titleEm: 'at Your Fingertips',
      subtitle: 'Drips To You - Bali helps guests and Bali residents get IV therapy without leaving the comfort of their accommodation.',
      bookNow: 'Book Now',
      chatWa: 'Chat on WhatsApp',
      missionTitle: 'Our Mission',
      missionP1: 'We believe premium healthcare should be easily accessible. By bringing licensed medical professionals directly to your villa, hotel, Airbnb, or home, recovery becomes more convenient and comfortable.',
      missionP2: 'Every IV therapy session is performed by licensed medical staff using sterile, medical-grade equipment. Safety, hygiene, and clear communication are our top priorities.',
      howItWorksTitle: 'How the Service Works',
      howItWorksSub: 'From booking to treatment completion — easy and safe.',
      safetyTitle: 'Safety & Comfort',
      safetyP1: 'Our service is designed to help support recovery and hydration. It is not intended for medical emergencies. If you experience an emergency, please contact local emergency services immediately.',
      safetyP2: 'Every team member holds an active medical license. Disposable sterile equipment is used for every session.',
      areasTitle: 'Service Areas',
      areasSub: 'We serve the main tourist and residential areas across Bali.',
      checkAreaBtn: 'Check Area Availability',
      ctaTitle: 'Ready to Give It a Try?',
      ctaSub: 'Our medical team is ready to come to your location in Bali. Book now or consult us about your needs.',
      ctaBookBtn: 'Book Now',
      ctaWaBtn: 'Chat on WhatsApp',
      waMessage: "Hi, I'd like to learn more about Drips To You Bali",
      values: [
        { label: 'Medical', title: 'Professional Medical Staff', desc: 'Treatments are performed by licensed nurses and doctors with clinical experience.' },
        { label: 'On-call', title: 'We Come to You', desc: 'Team arrives at your villa, hotel, Airbnb, or home in key Bali areas.' },
        { label: 'Sterile', title: 'Single-Use Equipment', desc: 'All treatment equipment is prepared sterile and meets medical standards.' },
        { label: 'Fast', title: '30–60 Minute Response', desc: 'Schedule confirmed via WhatsApp and team dispatched to your service area.' },
      ],
      steps: [
        { num: '01', title: 'Choose Your Treatment', desc: 'Select the right treatment from our website or ask us via WhatsApp.' },
        { num: '02', title: 'Fill the Booking Form', desc: 'Enter your details, preferred date, time, and location.' },
        { num: '03', title: 'WhatsApp Confirmation', desc: 'Our team contacts you to confirm the schedule and details.' },
        { num: '04', title: 'Team Arrives', desc: 'Our medical staff arrives at your location at the agreed time.' },
        { num: '05', title: 'Treatment Complete', desc: 'Enjoy the treatment in the comfort of your space. Safe and professional.' },
      ],
    },
    contactPage: {
      eyebrow: 'Contact',
      title: 'Need Help?',
      subtitle: 'Our team is ready to assist with treatment consultations, service area checks, and booking confirmations.',
      waTag: 'WhatsApp',
      waTitle: 'Chat Directly',
      waDesc: 'Fastest response for treatment consultations and general questions.',
      waBtn: 'Chat via WhatsApp',
      bookingTag: 'Booking',
      bookingTitle: 'Website Form',
      bookingDesc: 'Choose your treatment, date, time, and service location to book directly.',
      bookingBtn: 'Open Booking Form',
      hoursTitle: 'Service Hours',
      hoursDesc: 'Every day from 08:00 – 22:00 WITA. Estimated arrival depends on the service area and team availability.',
    },
    faqPage: {
      eyebrow: 'FAQ',
      title: 'Have a Question?',
      subtitle: 'Find answers about the booking process, treatment safety, service areas, and schedule confirmation.',
      emptyState: 'FAQs will be available soon. Please contact us via WhatsApp for any questions.',
      stillQ: 'Still have questions?',
      stillQDesc: 'Our team is ready to help you via WhatsApp.',
      askBtn: 'Ask via WhatsApp',
      waMessage: 'Hi, I have a question about Drips To You - Bali services',
    },
  },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('drip-lang') as Lang | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'id' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('drip-lang', l);
    setLangState(l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
