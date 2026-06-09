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
    emptyState: string;
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
    areasTitle: string; areasSub: string; areasEmpty: string; checkAreaBtn: string;
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
    hoursDaily: string; hoursDailyTime: string;
    hoursAfter: string; hoursAfterDesc: string;
    hoursLicensed: string;
    responseTimeTitle: string; responseTimeDesc: string;
    serviceAreaTitle: string; serviceAreaDesc: string;
    urgentTitle: string; urgentDesc: string;
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
      treatments: 'Treatment', howToBook: 'Cara Booking', coverage: 'Cakupan',
      about: 'Tentang', contact: 'Kontak', bookNow: 'Pesan Sekarang',
    },
    hero: {
      pill: 'Tersedia di Area Layanan Aktif',
      line1: 'Hidrasi &', line2: 'Pemulihan', lineEm: 'Diantar ke Kamu',
      sub: 'Tim medis bersertifikat datang langsung ke villa, hotel, atau Airbnb Anda di area layanan aktif. Nyaman, aman, dan disesuaikan dengan kebutuhan Anda.',
      bookWa: 'Konsultasi via WhatsApp', seeAll: 'Lihat Treatment',
    },
    benefits: {
      fast: 'Respons Cepat', fastDesc: 'Estimasi kedatangan mengikuti area layanan dan ketersediaan tim',
      licensed: 'Tim Bersertifikat', licensedDesc: 'Tenaga medis & perawat berlisensi resmi',
      mobile: 'Layanan Mobile', mobileDesc: 'Kami datang ke villa, hotel, Airbnb, atau di mana pun Anda berada',
      premium: 'Perawatan Premium', premiumDesc: 'Produk & peralatan medis steril berkualitas tinggi',
    },
    treatments: {
      eyebrow: 'Treatment Kami', title: 'Rasakan Manfaatnya', titleEm: 'dalam Hitungan Jam',
      desc: 'Setiap treatment dirancang oleh tenaga medis profesional untuk membantu mendukung pemulihan, energi, dan kesehatan optimal Anda selama di Bali.',
      bookNow: 'Pesan Sekarang', perSession: '/ sesi', seeAll: 'Lihat Semua Treatment', seeMore: 'Lihat Selengkapnya',
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
      sub: 'Prosesnya sangat mudah — cukup pilih treatment, isi form, lalu tim kami akan mengonfirmasi area, jadwal, dan detail layanan.',
      steps: [
        { title: 'Pilih Treatment', desc: 'Jelajahi pilihan IV therapy kami dan tentukan treatment yang paling sesuai dengan kondisi serta kebutuhan Anda saat ini.' },
        { title: 'Isi Form Booking', desc: 'Isi form booking online dengan nama, nomor WhatsApp, tanggal, waktu, dan alamat lengkap lokasi Anda di Bali.' },
        { title: 'Tim Datang ke Anda', desc: 'Tim medis profesional kami tiba sesuai jadwal yang dikonfirmasi dengan seluruh perlengkapan yang dibutuhkan.' },
      ],
    },
    areas: {
      eyebrow: 'Area Layanan', title: 'Cakupan', titleEm: 'Aktif Kami',
      desc: 'Tim kami melayani area aktif yang sudah ditentukan di Bali. Pilih lokasi saat booking untuk melihat ketersediaan.',
      areaCount: 'Area Dilayani', responseTime: 'Waktu Respons', coverage: 'Cakupan Bali Selatan',
      liveService: 'Layanan mengikuti jadwal aktif',
      popular: '★ Populer', active: 'Aktif', ocean: 'Samudra Hindia', north: 'BALI UTARA',
      arrivalTime: 'Estimasi tiba', notInList: 'Area Anda tidak ada di daftar?', contactUs: 'Tanyakan via booking',
    },
    gallery: {
      eyebrow: 'Pengalaman Premium', title: 'Momen', titleEm: 'Drips To You',
      desc: 'IV therapy profesional yang diantarkan langsung ke villa, hotel, atau rumah Anda di Bali.',
    },
    whyChooseUs: {
      eyebrow: 'Kenapa Memilih Kami', title: 'Keunggulan', titleEm: 'Drips To You',
      desc: 'Kami percaya layanan kesehatan dan kebugaran yang baik seharusnya mudah dijangkau di area yang bisa kami layani.',
      items: [
        { title: 'Langsung ke Lokasi Anda', desc: 'Tidak perlu ke klinik atau antre. Kami menghadirkan layanan medis profesional langsung ke villa, hotel, rumah, atau kantor dalam area layanan aktif.' },
        { title: 'Tim Medis Berpengalaman', desc: 'Kesehatan Anda ada di tangan yang tepat. Semua treatment dilakukan oleh tenaga kesehatan bersertifikat dengan jam terbang tinggi.' },
        { title: 'Cepat & Siap Membantu', desc: 'Tidak ada antrean, tidak perlu menunggu lama. Tim kami siap merespons dengan cepat kapan pun Anda membutuhkan.' },
        { title: 'Untuk Semua Orang', desc: 'Turis, ekspatriat, atau warga lokal — kami hadir untuk semua orang yang berada di area layanan kami.' },
        { title: 'Aman, Nyaman & Tepercaya', desc: 'Nikmati treatment premium tanpa repot, dalam kenyamanan tempat Anda sendiri.' },
      ],
    },
    cta: {
      badge: 'Layanan mobile di area aktif', title: 'Siap Merasa', titleEm: 'Lebih Baik Sekarang?',
      sub: 'Jangan biarkan dehidrasi, kelelahan, atau badan tidak fit merusak pengalaman Bali Anda. Tim medis kami siap hadir sesuai area dan jadwal yang dikonfirmasi.',
      bookNow: 'Pesan Sekarang', bookWa: 'Konsultasi via WhatsApp', seeAll: 'Lihat Semua Treatment',
    },
    footer: {
      brandDesc: 'Layanan mobile IV therapy premium yang hadir langsung ke villa, hotel, atau Airbnb Anda di area layanan aktif kami.',
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
      bookNow: 'Pesan Sekarang',
      detail: 'Detail',
      durationText: 'sekitar {n} menit',
      backHome: 'Kembali ke Beranda',
      emptyState: 'Belum ada treatment tersedia. Hubungi kami via WhatsApp.',
    },
    treatmentDetail: {
      backAll: '← Semua Treatment',
      durationText: 'sekitar {n} menit',
      orderBtn: 'Pesan {name}',
      askWa: 'Tanya via WhatsApp',
      benefitsTitle: 'Kandungan & Manfaat',
      aboutTitle: 'Tentang Treatment Ini',
      faqTitle: 'FAQ',
      ctaTitle: 'Tertarik mencoba {name}?',
      ctaSubtitle: 'Tim medis kami siap hadir ke lokasi Anda sesuai area dan jadwal yang dikonfirmasi.',
      bookBtn: 'Pesan {name} Sekarang',
      askWaFirst: 'Tanya dulu via WhatsApp',
      waMessage: 'Halo, saya ingin tahu lebih lanjut tentang treatment {name}',
    },
    aboutPage: {
      eyebrow: 'Tentang Kami',
      title: 'Kesehatan di',
      titleEm: 'Ujung Jari Anda',
      subtitle: 'Drips To You - Bali membantu tamu dan warga Bali mendapatkan IV therapy tanpa perlu meninggalkan kenyamanan tempat menginap.',
      bookNow: 'Pesan Sekarang',
      chatWa: 'Chat di WhatsApp',
      missionTitle: 'Misi Kami',
      missionP1: 'Kami percaya perawatan kesehatan premium harus mudah diakses. Dengan menghadirkan tenaga medis langsung ke villa, hotel, Airbnb, atau rumah Anda, proses pemulihan menjadi lebih praktis dan nyaman.',
      missionP2: 'Setiap sesi IV therapy dilakukan oleh tenaga medis berlisensi dengan peralatan steril berstandar medis. Keselamatan, kebersihan, dan komunikasi yang jelas adalah prioritas utama kami.',
      howItWorksTitle: 'Cara Kerja Layanan',
      howItWorksSub: 'Dari booking hingga treatment selesai — mudah dan aman.',
      safetyTitle: 'Keamanan & Kenyamanan',
      safetyP1: 'Layanan kami dirancang untuk membantu mendukung pemulihan dan hidrasi tubuh — bukan untuk kondisi darurat medis. Jika Anda mengalami kondisi darurat, segera hubungi layanan gawat darurat setempat.',
      safetyP2: 'Setiap anggota tim kami memiliki lisensi medis aktif. Peralatan sekali pakai dan steril digunakan di setiap sesi.',
      areasTitle: 'Area Layanan',
      areasSub: 'Kami melayani area wisata dan hunian utama di Bali.',
      areasEmpty: 'Belum ada area layanan aktif. Hubungi kami untuk konfirmasi lokasi.',
      checkAreaBtn: 'Cek Ketersediaan Area',
      ctaTitle: 'Siap Mencoba?',
      ctaSub: 'Tim medis kami siap hadir ke lokasi Anda di Bali. Pesan sekarang atau konsultasikan kebutuhan Anda dengan kami.',
      ctaBookBtn: 'Pesan Sekarang',
      ctaWaBtn: 'Chat di WhatsApp',
      waMessage: 'Halo, saya ingin tahu lebih lanjut tentang Drips To You Bali',
      values: [
        { label: 'Medis', title: 'Tenaga Medis Profesional', desc: 'Treatment dilakukan oleh perawat dan dokter berlisensi dengan pengalaman klinis.' },
        { label: 'On-call', title: 'Datang ke Lokasi Anda', desc: 'Tim datang ke villa, hotel, Airbnb, atau rumah di area utama Bali.' },
        { label: 'Steril', title: 'Peralatan Sekali Pakai', desc: 'Semua alat treatment disiapkan steril dan memenuhi standar medis.' },
        { label: 'Cepat', title: 'Respons Terkoordinasi', desc: 'Jadwal dikonfirmasi via WhatsApp dan tim bergerak sesuai area layanan.' },
      ],
      steps: [
        { num: '01', title: 'Pilih Treatment', desc: 'Pilih treatment yang sesuai kebutuhan dari website atau tanyakan via WhatsApp.' },
        { num: '02', title: 'Isi Form Booking', desc: 'Lengkapi data diri, tanggal, waktu, dan lokasi Anda.' },
        { num: '03', title: 'Konfirmasi via WhatsApp', desc: 'Tim kami akan menghubungi Anda untuk konfirmasi jadwal dan detail.' },
        { num: '04', title: 'Tim Datang ke Lokasi', desc: 'Tenaga medis hadir ke lokasi Anda pada waktu yang disepakati.' },
        { num: '05', title: 'Treatment Selesai', desc: 'Nikmati treatment dalam kenyamanan tempat Anda. Aman dan profesional.' },
      ],
    },
    contactPage: {
      eyebrow: 'Kontak',
      title: 'Ada yang Bisa Kami Bantu?',
      subtitle: 'Tim kami siap membantu untuk konsultasi treatment, pengecekan area layanan, dan konfirmasi booking.',
      waTag: 'WhatsApp',
      waTitle: 'Chat Langsung',
      waDesc: 'Cara tercepat untuk konsultasi treatment dan pertanyaan umum.',
      waBtn: 'Chat via WhatsApp',
      bookingTag: 'Booking',
      bookingTitle: 'Form Website',
      bookingDesc: 'Pilih treatment, tanggal, waktu, dan lokasi layanan untuk booking langsung.',
      bookingBtn: 'Buka Form Booking',
      hoursTitle: 'Jam Layanan',
      hoursDesc: 'Jam layanan mengikuti jadwal aktif. Estimasi kedatangan bergantung pada area layanan dan ketersediaan tim.',
      hoursDaily: 'Setiap Hari',
      hoursDailyTime: '08.00 – 21.00 WITA',
      hoursAfter: 'Di Luar Jam',
      hoursAfterDesc: 'Atas permintaan',
      hoursLicensed: 'Tenaga berlisensi. Perawatan premium, di mana saja.',
      responseTimeTitle: 'Waktu Respons',
      responseTimeDesc: 'Kami biasanya merespons dalam hitungan menit selama jam operasional.',
      serviceAreaTitle: 'Area Layanan',
      serviceAreaDesc: 'Melayani semua area utama di Bali dan sekitarnya.',
      urgentTitle: 'Butuh bantuan segera?',
      urgentDesc: 'Untuk permintaan mendesak, hubungi kami via WhatsApp untuk respons tercepat.',
    },
    faqPage: {
      eyebrow: 'FAQ',
      title: 'Ada Pertanyaan?',
      subtitle: 'Temukan jawaban seputar proses booking, keamanan treatment, area layanan, dan konfirmasi jadwal.',
      emptyState: 'FAQ akan segera tersedia. Hubungi kami via WhatsApp untuk pertanyaan lebih lanjut.',
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
      pill: 'Available in Active Service Areas',
      line1: 'Hydration &', line2: 'Recovery', lineEm: 'Delivered to You',
      sub: 'A certified medical team comes directly to your villa, hotel, or Airbnb within active service areas. Comfortable, safe, and tailored to your needs.',
      bookWa: 'Consult via WhatsApp', seeAll: 'View Treatments',
    },
    benefits: {
      fast: 'Fast Response', fastDesc: 'Arrival estimates follow the service area and team availability',
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
      sub: 'The process is straightforward — choose your treatment, complete the form, and our team will confirm the area, schedule, and service details.',
      steps: [
        { title: 'Choose Treatment', desc: 'Browse our IV therapy options and select the treatment best suited for your current condition and what you need right now.' },
        { title: 'Fill Booking Form', desc: 'Complete the online booking form with your name, WhatsApp number, preferred date, time, and your Bali address.' },
        { title: 'Team Comes to You', desc: 'Our certified medical team arrives at the confirmed time with the equipment needed for your service.' },
      ],
    },
    areas: {
      eyebrow: 'Coverage Area', title: 'Our Active', titleEm: 'Service Areas',
      desc: 'Our team serves the active Bali coverage areas configured by our team. Select your location during booking to check availability.',
      areaCount: 'Areas Covered', responseTime: 'Response Time', coverage: 'South Bali Coverage',
      liveService: 'Service follows the active schedule',
      popular: '★ Popular', active: 'Active', ocean: 'Indian Ocean', north: 'NORTH BALI',
      arrivalTime: 'Est. arrival', notInList: 'Your area not on the list?', contactUs: 'Ask via booking',
    },
    gallery: {
      eyebrow: 'Premium Experience', title: 'Drips To You', titleEm: 'Moments',
      desc: 'Professional IV therapy delivered directly to your villa, hotel, or home in Bali.',
    },
    whyChooseUs: {
      eyebrow: 'Why Choose Us', title: 'The Drips To You', titleEm: 'Difference',
      desc: 'We believe quality wellness care should be easy to access wherever our mobile team can safely provide service.',
      items: [
        { title: 'Convenient On-Site Service', desc: 'No hassle and no travel. We bring professional medical care directly to your villa, hotel, home, or office within active service areas.' },
        { title: 'Expert Medical Team', desc: 'Your health is in good hands. All treatments are delivered by certified, highly experienced healthcare professionals.' },
        { title: 'Fast & Responsive Care', desc: 'No long queues or waiting times. Our team is ready to respond swiftly whenever you need us.' },
        { title: 'Accessible for Everyone', desc: 'Whether you are a tourist enjoying a vacation, an expat, or a local resident, we are here for you.' },
        { title: 'Safe, Comfortable & Trusted', desc: 'Experience premium, stress-free wellness care in the comfort of your own space.' },
      ],
    },
    cta: {
      badge: 'Mobile service in active areas', title: 'Ready to Feel', titleEm: 'Better Right Now?',
      sub: "Don't let dehydration, fatigue, or feeling unwell disrupt your Bali experience. Our medical team is ready to come based on the confirmed area and schedule.",
      bookNow: 'Book Now', bookWa: 'Consult via WhatsApp', seeAll: 'See All Treatments',
    },
    footer: {
      brandDesc: 'Premium mobile IV therapy delivered to your villa, hotel, or Airbnb within our active service areas.',
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
      emptyState: 'No treatments are available yet. Please contact us via WhatsApp.',
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
      ctaSubtitle: 'Our medical team is ready to come to your location based on the confirmed area and schedule.',
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
      areasSub: 'We serve the tourist and residential locations listed as active service areas.',
      areasEmpty: 'Service areas have not been configured yet. Please contact us to confirm your location.',
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
        { label: 'Fast', title: 'Coordinated Response', desc: 'Schedule confirmed via WhatsApp and team dispatched to your service area.' },
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
      hoursDesc: 'Service hours follow the active schedule. Estimated arrival depends on the service area and team availability.',
      hoursDaily: 'Daily',
      hoursDailyTime: '8:00 AM – 9:00 PM',
      hoursAfter: 'After Hours',
      hoursAfterDesc: 'By request',
      hoursLicensed: 'Licensed professionals. Premium care, anywhere.',
      responseTimeTitle: 'Response Time',
      responseTimeDesc: 'We typically respond within minutes during operating hours.',
      serviceAreaTitle: 'Service Area',
      serviceAreaDesc: 'Proudly serving all major areas across Bali and surrounding regions.',
      urgentTitle: 'Need urgent assistance?',
      urgentDesc: 'For urgent requests, please reach out via WhatsApp for the fastest support.',
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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
