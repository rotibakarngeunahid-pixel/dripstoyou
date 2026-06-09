'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage, type Lang } from '@/contexts/language';

export type LegalSlug = 'terms-conditions' | 'privacy-policy';

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocument = {
  title: string;
  description: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
};

const LAST_UPDATED: Record<Lang, string> = {
  en: '7 June 2026',
  id: '7 Juni 2026',
};

const TOC_LABEL: Record<Lang, string> = {
  en: 'Contents',
  id: 'Daftar Isi',
};

const BACK_TOP_LABEL: Record<Lang, string> = {
  en: 'Top',
  id: 'Atas',
};

const DOCUMENTS: Record<LegalSlug, Record<Lang, LegalDocument>> = {
  'terms-conditions': {
    en: {
      title: 'Terms and Conditions',
      description: 'Governs your use of our website, booking channels, and mobile IV therapy services in Bali.',
      updatedLabel: 'Last updated',
      intro: 'These Terms and Conditions govern your use of the Drips To You - Bali website, booking form, WhatsApp channels, and mobile wellness services. By submitting a booking request or receiving a service, you confirm that you have read and accepted these terms.',
      sections: [
        {
          title: '1. About Our Service',
          paragraphs: [
            'Drips To You - Bali coordinates mobile IV therapy and related wellness services at eligible villas, hotels, homes, offices, and other locations in Bali. Services are subject to location coverage, staff availability, clinical assessment, and applicable professional standards.',
            'The website provides general service information only. It does not provide a diagnosis, prescription, or a substitute for an in-person assessment by a qualified medical professional.',
          ],
        },
        {
          title: '2. Not an Emergency Service',
          paragraphs: [
            'Our service is not designed for emergencies. Do not use the website or WhatsApp booking channel when you have severe symptoms, chest pain, breathing difficulty, loss of consciousness, signs of stroke, severe allergic reaction, uncontrolled bleeding, or another urgent condition. Contact local emergency services or go to the nearest hospital immediately.',
          ],
        },
        {
          title: '3. Booking and Confirmation',
          paragraphs: [
            'A submitted form is a booking request, not a confirmed appointment. An appointment is confirmed only after our team verifies the treatment, date, time, location, price, and availability with you.',
            'Arrival estimates are not guarantees. Traffic, weather, distance, staff availability, access restrictions, and circumstances outside our reasonable control may affect the schedule.',
          ],
        },
        {
          title: '4. Clinical Screening and Consent',
          paragraphs: [
            'Before treatment, you may be asked about symptoms, medical history, allergies, medications, pregnancy, recent procedures, and other information relevant to safety. You must answer accurately and completely.',
            'Treatment will proceed only after the attending qualified professional considers it appropriate and obtains any required informed consent. You may ask questions or withdraw consent before treatment begins.',
          ],
        },
        {
          title: '5. Eligibility and Right to Decline',
          paragraphs: [
            'A requested treatment may not be suitable for every person. We or the attending professional may decline, change, postpone, or stop a service when it may be unsafe, outside the service scope, inconsistent with professional judgment, or affected by an unsuitable location.',
            'Age restrictions, guardian consent, pregnancy, medical conditions, medications, intoxication, allergies, or inability to provide informed consent may affect eligibility.',
          ],
        },
        {
          title: '6. Customer Responsibilities',
          paragraphs: ['You agree to:'],
          bullets: [
            'provide accurate identity, contact, location, and health-related information;',
            'ensure safe and reasonable access to the service location;',
            'follow preparation, aftercare, and safety instructions;',
            'inform the attending professional immediately if you feel unwell; and',
            'treat staff respectfully and provide a safe working environment.',
          ],
        },
        {
          title: '7. Prices, Travel Fees, and Payment',
          paragraphs: [
            'Website prices may be updated from time to time. The final price, any travel surcharge, payment method, and included services will be communicated before the appointment is confirmed.',
            'You are responsible for agreed charges for completed services and any disclosed products or add-ons. Promotions cannot be exchanged for cash and may have separate conditions.',
          ],
        },
        {
          title: '8. Rescheduling, Cancellation, and No-Show',
          paragraphs: [
            'Please request changes as early as possible. A cancellation, no-show, inaccessible location, or late change after staff have been dispatched may result in a reasonable call-out or cancellation charge if that charge was disclosed during confirmation.',
            'We may reschedule or cancel when necessary for safety, staffing, weather, traffic, equipment, or other operational reasons. When appropriate, we will offer a new schedule or address any prepaid amount according to the confirmed arrangement.',
          ],
        },
        {
          title: '9. Risks, Results, and Aftercare',
          paragraphs: [
            'All medical and wellness procedures carry potential risks and individual responses vary. No specific outcome, recovery time, or result is guaranteed. The attending professional will explain material information relevant to the proposed service.',
            'Follow all aftercare instructions and seek appropriate medical help if symptoms persist, worsen, or a concerning reaction occurs.',
          ],
        },
        {
          title: '10. Third-Party Services',
          paragraphs: [
            'Our website may use or link to third-party services such as WhatsApp, hosting, maps, payment services, or accommodation communication channels. Their separate terms and privacy practices apply to your use of those services.',
          ],
        },
        {
          title: '11. Intellectual Property',
          paragraphs: [
            'Website text, branding, graphics, photographs, and other content owned by Drips To You - Bali may not be copied, republished, or commercially used without permission, except as allowed by law.',
          ],
        },
        {
          title: '12. Liability',
          paragraphs: [
            'Nothing in these terms excludes liability that cannot legally be excluded. To the extent permitted by law, we are not responsible for indirect losses or delays caused by inaccurate customer information, third-party platforms, inaccessible locations, network failures, force majeure, or events outside our reasonable control.',
          ],
        },
        {
          title: '13. Governing Law and Changes',
          paragraphs: [
            'These terms are governed by the laws of the Republic of Indonesia. The parties should first attempt to resolve a dispute in good faith before using other remedies available under applicable law.',
            'We may update these terms to reflect service, operational, or legal changes. The version displayed on this page applies from its stated update date.',
          ],
        },
        {
          title: '14. Contact',
          paragraphs: [
            'Questions about these terms can be sent to hello@dripstoyou.com or through the official WhatsApp contact shown on this website.',
          ],
        },
      ],
    },
    id: {
      title: 'Syarat dan Ketentuan',
      description: 'Mengatur penggunaan website, kanal booking, dan layanan mobile IV therapy Drips To You di Bali.',
      updatedLabel: 'Terakhir diperbarui',
      intro: 'Syarat dan Ketentuan ini mengatur penggunaan website, formulir booking, kanal WhatsApp, dan layanan wellness mobile Drips To You - Bali. Dengan mengirim permintaan booking atau menerima layanan, Anda menyatakan telah membaca dan menyetujui ketentuan ini.',
      sections: [
        {
          title: '1. Tentang Layanan Kami',
          paragraphs: [
            'Drips To You - Bali mengoordinasikan layanan IV therapy mobile dan layanan wellness terkait di villa, hotel, rumah, kantor, atau lokasi lain yang memenuhi syarat di Bali. Layanan bergantung pada cakupan area, ketersediaan tim, asesmen klinis, dan standar profesi yang berlaku.',
            'Informasi di website bersifat umum dan bukan diagnosis, resep, atau pengganti pemeriksaan langsung oleh tenaga medis yang berwenang.',
          ],
        },
        {
          title: '2. Bukan Layanan Gawat Darurat',
          paragraphs: [
            'Layanan kami tidak ditujukan untuk kondisi darurat. Jangan menggunakan website atau kanal booking WhatsApp apabila Anda mengalami nyeri dada, kesulitan bernapas, kehilangan kesadaran, tanda stroke, reaksi alergi berat, perdarahan yang tidak terkendali, atau kondisi mendesak lainnya. Segera hubungi layanan darurat setempat atau rumah sakit terdekat.',
          ],
        },
        {
          title: '3. Booking dan Konfirmasi',
          paragraphs: [
            'Formulir yang dikirim merupakan permintaan booking, bukan jadwal yang otomatis terkonfirmasi. Jadwal dinyatakan terkonfirmasi setelah tim kami memverifikasi treatment, tanggal, waktu, lokasi, harga, dan ketersediaan.',
            'Estimasi kedatangan bukan jaminan waktu pasti. Lalu lintas, cuaca, jarak, ketersediaan tim, akses lokasi, dan keadaan di luar kendali wajar kami dapat memengaruhi jadwal.',
          ],
        },
        {
          title: '4. Skrining Klinis dan Persetujuan',
          paragraphs: [
            'Sebelum treatment, Anda dapat diminta memberikan informasi mengenai gejala, riwayat kesehatan, alergi, obat, kehamilan, prosedur terbaru, dan informasi lain yang relevan untuk keselamatan. Anda wajib memberikan informasi yang akurat dan lengkap.',
            'Treatment hanya dilakukan setelah tenaga profesional yang bertugas menilai bahwa tindakan tersebut sesuai dan memperoleh persetujuan tindakan yang diperlukan. Anda berhak bertanya atau menarik persetujuan sebelum treatment dimulai.',
          ],
        },
        {
          title: '5. Kelayakan dan Hak Menolak Layanan',
          paragraphs: [
            'Treatment tertentu mungkin tidak sesuai untuk semua orang. Kami atau tenaga profesional yang bertugas dapat menolak, mengubah, menunda, atau menghentikan layanan apabila dinilai tidak aman, berada di luar lingkup layanan, bertentangan dengan pertimbangan profesional, atau lokasi tidak memadai.',
            'Usia, persetujuan wali, kehamilan, kondisi medis, penggunaan obat, kondisi mabuk, alergi, atau ketidakmampuan memberikan persetujuan dapat memengaruhi kelayakan.',
          ],
        },
        {
          title: '6. Tanggung Jawab Pelanggan',
          paragraphs: ['Anda setuju untuk:'],
          bullets: [
            'memberikan data identitas, kontak, lokasi, dan kesehatan secara akurat;',
            'menyediakan akses lokasi yang aman dan wajar;',
            'mengikuti instruksi persiapan, perawatan setelah tindakan, dan keselamatan;',
            'segera memberi tahu tenaga yang bertugas apabila merasa tidak nyaman; dan',
            'memperlakukan tim dengan hormat serta menyediakan lingkungan kerja yang aman.',
          ],
        },
        {
          title: '7. Harga, Biaya Perjalanan, dan Pembayaran',
          paragraphs: [
            'Harga di website dapat berubah. Harga final, biaya perjalanan tambahan, metode pembayaran, dan layanan yang termasuk akan disampaikan sebelum jadwal dikonfirmasi.',
            'Anda bertanggung jawab atas biaya yang telah disepakati untuk layanan yang diberikan serta produk atau tambahan yang telah diinformasikan. Promo tidak dapat ditukar dengan uang dan dapat memiliki syarat tersendiri.',
          ],
        },
        {
          title: '8. Penjadwalan Ulang, Pembatalan, dan No-Show',
          paragraphs: [
            'Mohon ajukan perubahan secepat mungkin. Pembatalan, no-show, lokasi yang tidak dapat diakses, atau perubahan terlambat setelah tim berangkat dapat dikenakan biaya kunjungan atau pembatalan yang wajar apabila telah diinformasikan saat konfirmasi.',
            'Kami dapat menjadwalkan ulang atau membatalkan demi keselamatan, ketersediaan tim, cuaca, lalu lintas, peralatan, atau alasan operasional lainnya. Jika sesuai, kami akan menawarkan jadwal baru atau menangani dana yang telah dibayar sesuai kesepakatan yang dikonfirmasi.',
          ],
        },
        {
          title: '9. Risiko, Hasil, dan Perawatan Lanjutan',
          paragraphs: [
            'Setiap tindakan medis dan wellness memiliki potensi risiko serta respons yang berbeda pada setiap orang. Tidak ada hasil atau waktu pemulihan tertentu yang dijamin. Tenaga yang bertugas akan menjelaskan informasi material yang relevan dengan layanan yang diusulkan.',
            'Ikuti seluruh instruksi setelah treatment dan cari pertolongan medis yang sesuai apabila gejala menetap, memburuk, atau terjadi reaksi yang mengkhawatirkan.',
          ],
        },
        {
          title: '10. Layanan Pihak Ketiga',
          paragraphs: [
            'Website dapat menggunakan atau menautkan layanan pihak ketiga seperti WhatsApp, hosting, peta, pembayaran, atau kanal komunikasi akomodasi. Ketentuan dan praktik privasi pihak ketiga berlaku secara terpisah.',
          ],
        },
        {
          title: '11. Kekayaan Intelektual',
          paragraphs: [
            'Teks, merek, grafis, foto, dan konten website milik Drips To You - Bali tidak boleh disalin, dipublikasikan ulang, atau digunakan secara komersial tanpa izin, kecuali diperbolehkan oleh hukum.',
          ],
        },
        {
          title: '12. Tanggung Gugat',
          paragraphs: [
            'Tidak ada bagian ketentuan ini yang menghapus tanggung jawab yang secara hukum tidak dapat dikecualikan. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung atau keterlambatan akibat informasi pelanggan yang tidak akurat, platform pihak ketiga, lokasi yang tidak dapat diakses, gangguan jaringan, keadaan kahar, atau kejadian di luar kendali wajar kami.',
          ],
        },
        {
          title: '13. Hukum yang Berlaku dan Perubahan',
          paragraphs: [
            'Ketentuan ini tunduk pada hukum Republik Indonesia. Para pihak terlebih dahulu akan berupaya menyelesaikan sengketa dengan itikad baik sebelum menggunakan upaya lain yang tersedia berdasarkan hukum.',
            'Kami dapat memperbarui ketentuan ini untuk menyesuaikan perubahan layanan, operasional, atau hukum. Versi pada halaman ini berlaku sejak tanggal pembaruan yang tercantum.',
          ],
        },
        {
          title: '14. Kontak',
          paragraphs: [
            'Pertanyaan mengenai ketentuan ini dapat dikirim ke hello@dripstoyou.com atau melalui kontak WhatsApp resmi pada website.',
          ],
        },
      ],
    },
  },
  'privacy-policy': {
    en: {
      title: 'Privacy Policy',
      description: 'How we collect, use, store, and protect your personal data when you use our services.',
      updatedLabel: 'Last updated',
      intro: 'This Privacy Policy explains how Drips To You - Bali collects, uses, stores, and shares personal data when you visit our website, submit a booking, communicate through WhatsApp, or receive our services. Health information is sensitive personal data and is handled with additional care.',
      sections: [
        {
          title: '1. Data We Collect',
          paragraphs: ['Depending on how you interact with us, we may collect:'],
          bullets: [
            'identity and contact data, such as name, phone number, email, and WhatsApp details;',
            'booking data, including selected treatment, date, time, number of guests, location type, service area, address, and notes;',
            'health-related information you voluntarily provide or that is recorded as required for screening, consent, treatment, safety, and follow-up;',
            'communications with our team, including booking confirmations and support messages;',
            'payment and transaction references where applicable; and',
            'technical data such as IP-derived security records, browser information, device information, and website logs.',
          ],
        },
        {
          title: '2. How We Use Personal Data',
          paragraphs: ['We process personal data to:'],
          bullets: [
            'respond to inquiries and manage booking requests;',
            'confirm identity, schedule, location, eligibility, and service details;',
            'support clinical screening, informed consent, treatment delivery, safety, and follow-up;',
            'process payments and maintain operational, accounting, and legal records;',
            'secure our systems, prevent misuse, investigate incidents, and enforce our terms;',
            'improve our website and service quality; and',
            'send marketing only where permitted and with an available opt-out.',
          ],
        },
        {
          title: '3. Basis for Processing',
          paragraphs: [
            'Depending on the context, we process data with your consent, to take steps requested before providing a service, to perform an agreed service, to comply with legal obligations, to protect vital interests, or for legitimate operational and security interests permitted by applicable law.',
            'Where explicit consent is required for sensitive personal data or a particular communication, you may withdraw that consent. Withdrawal does not affect processing already carried out lawfully and may limit our ability to provide a requested service.',
          ],
        },
        {
          title: '4. Health Information',
          paragraphs: [
            'Health information is used only for legitimate service, safety, professional, recordkeeping, and legal purposes. Please do not submit unnecessary health details through public or insecure channels. Our team may move sensitive discussions to a more appropriate channel or conduct them in person.',
          ],
        },
        {
          title: '5. Sharing of Data',
          paragraphs: ['We do not sell personal data. We may share only what is reasonably necessary with:'],
          bullets: [
            'authorized staff and qualified professionals involved in your booking or service;',
            'technology, hosting, communications, payment, security, and business service providers acting under appropriate obligations;',
            'your hotel, villa, host, or representative when you ask us to coordinate access or when reasonably necessary for the requested visit;',
            'professional advisers, insurers, regulators, law enforcement, courts, or other parties where required or permitted by law; and',
            'a successor organization in a legitimate restructuring, subject to applicable safeguards.',
          ],
        },
        {
          title: '6. WhatsApp and International Processing',
          paragraphs: [
            'When you use WhatsApp or another third-party platform, that provider processes information under its own terms. Data may be processed or stored outside Indonesia. We use such channels for convenience and take reasonable steps to limit the information shared to what is necessary.',
          ],
        },
        {
          title: '7. Retention',
          paragraphs: [
            'We retain personal data only for as long as reasonably necessary for booking, service, safety, accounting, dispute handling, legal, and professional recordkeeping purposes. Retention periods vary by data type and applicable requirements. Data that is no longer needed will be deleted, anonymized, or securely isolated where appropriate.',
          ],
        },
        {
          title: '8. Security',
          paragraphs: [
            'We use reasonable administrative, technical, and organizational safeguards, including access controls and protection of selected booking fields. No internet transmission or storage system is completely secure, so absolute security cannot be guaranteed.',
            'If a personal data incident occurs, we will assess and handle it in accordance with applicable obligations.',
          ],
        },
        {
          title: '9. Your Rights',
          paragraphs: [
            'Subject to applicable Indonesian data protection law, including Law No. 27 of 2022 on Personal Data Protection, you may have rights to obtain information about processing, access data, correct inaccurate data, end or restrict certain processing, withdraw consent, object to certain automated decisions, request deletion where applicable, and seek available remedies.',
            'We may need to verify your identity and may retain information where continued storage is required by law or legitimate professional obligations.',
          ],
        },
        {
          title: '10. Cookies, Website Logs, and Location',
          paragraphs: [
            'The website may use essential storage or similar technologies for functionality, preferences such as language selection, security, and performance. We do not use optional advertising cookies unless they are separately disclosed and, where required, consented to.',
            'The booking form includes an optional "Use my current location" button. If you click it, your browser will request permission to access your device\'s GPS coordinates. These coordinates are sent to OpenStreetMap\'s Nominatim service (a third-party geocoding API) solely to look up a human-readable address, which is then pre-filled into the address field for your convenience. Your coordinates are never stored on our servers and are never shared with us. If you deny location access or do not use the button, no location data is collected. You remain free to type your address manually.',
          ],
        },
        {
          title: '11. Children',
          paragraphs: [
            'Our booking service is not intended to let children independently consent to medical treatment or submit sensitive information. A parent or legal guardian must be involved where required, and treatment remains subject to professional assessment.',
          ],
        },
        {
          title: '12. Policy Changes and Contact',
          paragraphs: [
            'We may update this policy to reflect changes in law, technology, or our services. The current version and update date will remain available on this page.',
            'For privacy questions or requests, contact hello@dripstoyou.com or use the official WhatsApp contact shown on this website.',
          ],
        },
      ],
    },
    id: {
      title: 'Kebijakan Privasi',
      description: 'Cara kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda.',
      updatedLabel: 'Terakhir diperbarui',
      intro: 'Kebijakan Privasi ini menjelaskan cara Drips To You - Bali mengumpulkan, menggunakan, menyimpan, dan membagikan data pribadi ketika Anda mengunjungi website, mengirim booking, berkomunikasi melalui WhatsApp, atau menerima layanan. Informasi kesehatan merupakan data pribadi spesifik dan ditangani dengan kehati-hatian tambahan.',
      sections: [
        {
          title: '1. Data yang Kami Kumpulkan',
          paragraphs: ['Bergantung pada interaksi Anda dengan kami, data yang dapat dikumpulkan meliputi:'],
          bullets: [
            'data identitas dan kontak seperti nama, nomor telepon, email, dan informasi WhatsApp;',
            'data booking seperti treatment, tanggal, waktu, jumlah tamu, tipe lokasi, area layanan, alamat, dan catatan;',
            'informasi kesehatan yang Anda berikan secara sukarela atau yang perlu dicatat untuk skrining, persetujuan, treatment, keselamatan, dan tindak lanjut;',
            'komunikasi dengan tim, termasuk konfirmasi booking dan pesan dukungan;',
            'referensi pembayaran dan transaksi apabila berlaku; serta',
            'data teknis seperti catatan keamanan berbasis IP, informasi browser, perangkat, dan log website.',
          ],
        },
        {
          title: '2. Cara Kami Menggunakan Data',
          paragraphs: ['Kami memproses data pribadi untuk:'],
          bullets: [
            'menjawab pertanyaan dan mengelola permintaan booking;',
            'mengonfirmasi identitas, jadwal, lokasi, kelayakan, dan detail layanan;',
            'mendukung skrining klinis, persetujuan tindakan, pemberian layanan, keselamatan, dan tindak lanjut;',
            'memproses pembayaran serta menyimpan catatan operasional, akuntansi, dan hukum;',
            'mengamankan sistem, mencegah penyalahgunaan, menyelidiki insiden, dan menegakkan ketentuan;',
            'meningkatkan website dan kualitas layanan; serta',
            'mengirim pemasaran hanya jika diperbolehkan dan menyediakan pilihan berhenti berlangganan.',
          ],
        },
        {
          title: '3. Dasar Pemrosesan',
          paragraphs: [
            'Sesuai konteksnya, kami memproses data berdasarkan persetujuan Anda, langkah yang Anda minta sebelum layanan diberikan, pelaksanaan layanan yang disepakati, kewajiban hukum, perlindungan kepentingan vital, atau kepentingan operasional dan keamanan yang sah sesuai hukum.',
            'Jika persetujuan eksplisit diperlukan untuk data pribadi spesifik atau komunikasi tertentu, Anda dapat menarik persetujuan tersebut. Penarikan tidak membatalkan pemrosesan yang sebelumnya dilakukan secara sah dan dapat membatasi kemampuan kami memberikan layanan.',
          ],
        },
        {
          title: '4. Informasi Kesehatan',
          paragraphs: [
            'Informasi kesehatan hanya digunakan untuk tujuan layanan, keselamatan, profesi, pencatatan, dan hukum yang sah. Jangan mengirim detail kesehatan yang tidak diperlukan melalui kanal publik atau tidak aman. Tim dapat memindahkan pembahasan sensitif ke kanal yang lebih sesuai atau melakukannya secara langsung.',
          ],
        },
        {
          title: '5. Pembagian Data',
          paragraphs: ['Kami tidak menjual data pribadi. Data hanya dapat dibagikan secara wajar dan terbatas kepada:'],
          bullets: [
            'staf berwenang dan tenaga profesional yang terlibat dalam booking atau layanan;',
            'penyedia teknologi, hosting, komunikasi, pembayaran, keamanan, dan layanan bisnis yang terikat kewajiban yang sesuai;',
            'hotel, villa, host, atau perwakilan Anda jika Anda meminta koordinasi akses atau jika diperlukan untuk kunjungan yang diminta;',
            'penasihat profesional, perusahaan asuransi, regulator, penegak hukum, pengadilan, atau pihak lain jika diwajibkan atau diizinkan hukum; serta',
            'organisasi penerus dalam restrukturisasi yang sah dengan perlindungan yang berlaku.',
          ],
        },
        {
          title: '6. WhatsApp dan Pemrosesan Internasional',
          paragraphs: [
            'Saat menggunakan WhatsApp atau platform pihak ketiga lain, penyedia tersebut memproses informasi berdasarkan ketentuannya sendiri. Data dapat diproses atau disimpan di luar Indonesia. Kami menggunakan kanal tersebut untuk kemudahan dan membatasi informasi yang dibagikan sebatas yang diperlukan.',
          ],
        },
        {
          title: '7. Retensi Data',
          paragraphs: [
            'Kami menyimpan data hanya selama diperlukan secara wajar untuk booking, layanan, keselamatan, akuntansi, penanganan sengketa, hukum, dan kewajiban pencatatan profesi. Jangka waktu berbeda menurut jenis data dan persyaratan yang berlaku. Data yang tidak lagi diperlukan akan dihapus, dianonimkan, atau diisolasi secara aman jika sesuai.',
          ],
        },
        {
          title: '8. Keamanan',
          paragraphs: [
            'Kami menerapkan perlindungan administratif, teknis, dan organisasional yang wajar, termasuk kontrol akses dan perlindungan pada data booking tertentu. Tidak ada transmisi internet atau sistem penyimpanan yang sepenuhnya aman sehingga keamanan mutlak tidak dapat dijamin.',
            'Apabila terjadi insiden data pribadi, kami akan menilai dan menanganinya sesuai kewajiban yang berlaku.',
          ],
        },
        {
          title: '9. Hak Anda',
          paragraphs: [
            'Sesuai hukum pelindungan data Indonesia, termasuk Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda dapat memiliki hak untuk memperoleh informasi pemrosesan, mengakses data, memperbaiki data yang tidak akurat, mengakhiri atau membatasi pemrosesan tertentu, menarik persetujuan, mengajukan keberatan atas keputusan otomatis tertentu, meminta penghapusan jika berlaku, dan menggunakan upaya hukum yang tersedia.',
            'Kami dapat meminta verifikasi identitas dan tetap menyimpan informasi apabila diwajibkan hukum atau kewajiban profesi yang sah.',
          ],
        },
        {
          title: '10. Cookie, Log Website, dan Lokasi',
          paragraphs: [
            'Website dapat menggunakan penyimpanan esensial atau teknologi serupa untuk fungsi, preferensi seperti pilihan bahasa, keamanan, dan kinerja. Kami tidak menggunakan cookie iklan opsional kecuali diinformasikan secara terpisah dan, jika diwajibkan, telah mendapat persetujuan.',
            'Form booking memiliki tombol opsional "Gunakan lokasi saya". Jika Anda mengkliknya, browser akan meminta izin mengakses koordinat GPS perangkat Anda. Koordinat ini dikirim ke layanan Nominatim dari OpenStreetMap (API geocoding pihak ketiga) semata-mata untuk mendapatkan alamat yang dapat dibaca, yang kemudian diisi otomatis ke kolom alamat sebagai kemudahan. Koordinat Anda tidak pernah disimpan di server kami dan tidak pernah dibagikan kepada kami. Jika Anda menolak akses lokasi atau tidak menggunakan tombol tersebut, tidak ada data lokasi yang dikumpulkan. Anda tetap bebas mengetik alamat secara manual.',
          ],
        },
        {
          title: '11. Anak',
          paragraphs: [
            'Layanan booking tidak ditujukan agar anak memberikan persetujuan tindakan medis secara mandiri atau mengirim informasi sensitif. Orang tua atau wali wajib terlibat apabila dipersyaratkan dan treatment tetap bergantung pada asesmen profesional.',
          ],
        },
        {
          title: '12. Perubahan Kebijakan dan Kontak',
          paragraphs: [
            'Kami dapat memperbarui kebijakan ini untuk menyesuaikan perubahan hukum, teknologi, atau layanan. Versi terkini dan tanggal pembaruan akan tersedia di halaman ini.',
            'Untuk pertanyaan atau permintaan terkait privasi, hubungi hello@dripstoyou.com atau gunakan kontak WhatsApp resmi pada website.',
          ],
        },
      ],
    },
  },
};

export default function LegalContent({ slug }: { slug: LegalSlug }) {
  const { lang } = useLanguage();
  const doc = DOCUMENTS[slug][lang];
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const match = entry.target.id.match(/^ls-(\d+)$/);
            if (match) setActiveIdx(parseInt(match[1]) - 1);
          }
        });
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
    );

    doc.sections.forEach((_, i) => {
      const el = document.getElementById(`ls-${i + 1}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [doc.sections, lang]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const closeMobileToc = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <main className="page-shell">
      {/* Hero */}
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <p className="legal-hero-updated">
            {doc.updatedLabel}: {LAST_UPDATED[lang]}
          </p>
          <h1 className="legal-hero-title">{doc.title}</h1>
          <p className="legal-hero-desc">{doc.description}</p>
        </div>
      </section>

      {/* Page body */}
      <div className="legal-body">

        {/* Mobile TOC — accordion */}
        <details ref={detailsRef} className="legal-toc-mobile">
          <summary className="legal-toc-summary">
            <span>{TOC_LABEL[lang]}</span>
            <svg
              className="legal-toc-chevron"
              width="18" height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <nav className="legal-toc-nav legal-toc-nav--mobile" aria-label="Page contents">
            {doc.sections.map((s, i) => (
              <a
                key={i}
                href={`#ls-${i + 1}`}
                className={`legal-toc-link${activeIdx === i ? ' active' : ''}`}
                onClick={closeMobileToc}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </details>

        {/* Desktop sidebar TOC */}
        <aside className="legal-toc-sidebar" aria-label="Page contents">
          <p className="legal-toc-label">{TOC_LABEL[lang]}</p>
          <nav className="legal-toc-nav">
            {doc.sections.map((s, i) => (
              <a
                key={i}
                href={`#ls-${i + 1}`}
                className={`legal-toc-link${activeIdx === i ? ' active' : ''}`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main article */}
        <article className="legal-article">
          <p className="legal-intro">{doc.intro}</p>

          {doc.sections.map((section, i) => (
            <section key={i} id={`ls-${i + 1}`} className="legal-section">
              <h2 className="legal-section-heading">{section.title}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="legal-para">{p}</p>
              ))}
              {section.bullets && (
                <ul className="legal-list">
                  {section.bullets.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          className="legal-back-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <svg
            width="15" height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span>{BACK_TOP_LABEL[lang]}</span>
        </button>
      )}
    </main>
  );
}
