export type TranslationLang = 'id' | 'en';

type PhrasePair = readonly [string, string];

const ID_MARKERS = [
  'yang', 'dan', 'atau', 'dengan', 'untuk', 'tidak', 'kami', 'anda', 'kamu',
  'di', 'ke', 'dari', 'dalam', 'adalah', 'bisa', 'akan', 'segera', 'pilih',
  'isi', 'jadwal', 'lokasi', 'layanan', 'area', 'treatment', 'perawatan',
  'tubuh', 'kesehatan', 'pemulihan',
];

const EN_MARKERS = [
  'the', 'and', 'or', 'with', 'for', 'not', 'we', 'you', 'your', 'our',
  'in', 'to', 'from', 'is', 'are', 'can', 'will', 'choose', 'schedule',
  'location', 'service', 'area', 'treatment', 'care', 'body', 'health',
  'recovery',
];

const ID_TO_EN_PHRASES: PhrasePair[] = [
  ['drips to you - bali', 'Drips To You - Bali'],
  ['drips to you bali', 'Drips To You Bali'],
  ['iv therapy', 'IV therapy'],
  ['iv drip', 'IV drip'],
  ['mobile iv therapy', 'mobile IV therapy'],
  ['terapi iv', 'IV therapy'],
  ['tim medis bersertifikat datang langsung ke lokasi anda di bali', 'a certified medical team comes directly to your location in Bali'],
  ['infus vitamin', 'vitamin IV drip'],
  ['tim medis bersertifikat', 'certified medical team'],
  ['tenaga medis bersertifikat', 'certified medical professionals'],
  ['tenaga medis profesional', 'professional medical staff'],
  ['tenaga kesehatan bersertifikat', 'certified healthcare professionals'],
  ['perawat berlisensi', 'licensed nurses'],
  ['dokter berlisensi', 'licensed doctors'],
  ['peralatan steril', 'sterile equipment'],
  ['peralatan medis steril', 'sterile medical equipment'],
  ['sekali pakai', 'single-use'],
  ['standar medis', 'medical standards'],
  ['layanan mobile', 'mobile service'],
  ['layanan iv therapy mobile', 'mobile IV therapy service'],
  ['layanan wellness mobile', 'mobile wellness service'],
  ['layanan kesehatan', 'health service'],
  ['layanan aktif', 'active service'],
  ['area layanan aktif', 'active service areas'],
  ['area layanan', 'service area'],
  ['cakupan area', 'service coverage'],
  ['cakupan bali selatan', 'South Bali coverage'],
  ['estimasi tiba', 'estimated arrival'],
  ['estimasi kedatangan', 'estimated arrival'],
  ['jam layanan', 'service hours'],
  ['jadwal aktif', 'active schedule'],
  ['ketersediaan tim', 'team availability'],
  ['konfirmasi jadwal', 'schedule confirmation'],
  ['konfirmasi booking', 'booking confirmation'],
  ['form booking', 'booking form'],
  ['formulir booking', 'booking form'],
  ['pesan sekarang', 'book now'],
  ['booking sekarang', 'book now'],
  ['buat booking', 'make a booking'],
  ['kode booking', 'booking code'],
  ['cek ketersediaan', 'check availability'],
  ['ketersediaan area', 'area availability'],
  ['tanggal dan waktu', 'date and time'],
  ['tanggal', 'date'],
  ['waktu', 'time'],
  ['alamat lengkap', 'full address'],
  ['nomor whatsapp', 'WhatsApp number'],
  ['nama lengkap', 'full name'],
  ['jumlah peserta', 'number of guests'],
  ['jumlah tamu', 'number of guests'],
  ['catatan tambahan', 'additional notes'],
  ['syarat dan ketentuan', 'terms and conditions'],
  ['kebijakan privasi', 'privacy policy'],
  ['konsultasi via whatsapp', 'consult via WhatsApp'],
  ['chat di whatsapp', 'chat on WhatsApp'],
  ['tanya via whatsapp', 'ask via WhatsApp'],
  ['hubungi kami', 'contact us'],
  ['hubungi kami via whatsapp', 'contact us via WhatsApp'],
  ['datang langsung ke lokasi anda', 'come directly to your location'],
  ['datang ke lokasi anda', 'come to your location'],
  ['tim datang ke anda', 'our team comes to you'],
  ['kami datang ke lokasi anda', 'we come to your location'],
  ['villa, hotel, atau airbnb', 'villa, hotel, or Airbnb'],
  ['villa, hotel, airbnb', 'villa, hotel, Airbnb'],
  ['villa atau hotel', 'villa or hotel'],
  ['villa, hotel, rumah, atau kantor', 'villa, hotel, home, or office'],
  ['rumah atau kantor', 'home or office'],
  ['di bali', 'in Bali'],
  ['selama di bali', 'during your Bali stay'],
  ['pengalaman bali', 'Bali experience'],
  ['hangover recovery', 'Hangover Recovery'],
  ['pemulihan hangover', 'Hangover Recovery'],
  ['pemulihan mabuk', 'Hangover Recovery'],
  ['immune booster', 'Immune Booster'],
  ['peningkat imun', 'Immune Booster'],
  ['daya tahan tubuh', 'immune system'],
  ['energy boost', 'Energy Boost'],
  ['penambah energi', 'Energy Boost'],
  ['beauty glow', 'Beauty Glow'],
  ['rehidrasi cepat', 'fast rehydration'],
  ['hidrasi tubuh', 'body hydration'],
  ['mendukung hidrasi', 'support hydration'],
  ['mendukung pemulihan', 'support recovery'],
  ['membantu pemulihan', 'help support recovery'],
  ['membantu mendukung pemulihan', 'help support recovery'],
  ['energi dan kesehatan', 'energy and wellness'],
  ['kesehatan optimal', 'optimal wellness'],
  ['produk berkualitas tinggi', 'high-quality products'],
  ['produk medis steril', 'sterile medical products'],
  ['nyaman dan aman', 'comfortable and safe'],
  ['aman dan nyaman', 'safe and comfortable'],
  ['aman dan profesional', 'safe and professional'],
  ['cepat dan responsif', 'fast and responsive'],
  ['respons cepat', 'fast response'],
  ['nyaman, aman, dan disesuaikan dengan kebutuhan anda', 'comfortable, safe, and tailored to your needs'],
  ['disesuaikan dengan kebutuhan anda', 'tailored to your needs'],
  ['sesuai kebutuhan anda', 'suited to your needs'],
  ['sesuai kondisi anda', 'suited to your condition'],
  ['kebutuhan anda saat ini', 'your current needs'],
  ['dalam hitungan jam', 'within hours'],
  ['dalam kenyamanan tempat anda', 'in the comfort of your space'],
  ['tanpa perlu meninggalkan kenyamanan', 'without leaving the comfort'],
  ['tidak perlu ke klinik', 'no need to visit a clinic'],
  ['tidak perlu antre', 'no queues'],
  ['tidak ada antrean', 'no queues'],
  ['tidak perlu menunggu lama', 'no long waiting times'],
  ['prosesnya sangat mudah', 'the process is very simple'],
  ['pilih treatment', 'choose your treatment'],
  ['isi form booking', 'fill out the booking form'],
  ['isi formulir booking', 'fill out the booking form'],
  ['tim kami akan menghubungi anda', 'our team will contact you'],
  ['tim kami siap membantu', 'our team is ready to help'],
  ['tim kami siap hadir', 'our team is ready to come'],
  ['tim medis kami siap hadir', 'our medical team is ready to come'],
  ['jadwal yang dikonfirmasi', 'confirmed schedule'],
  ['area dan jadwal yang dikonfirmasi', 'confirmed area and schedule'],
  ['area layanan dan ketersediaan tim', 'service area and team availability'],
  ['tergantung treatment', 'depending on the treatment'],
  ['tergantung kebutuhan', 'depending on your needs'],
  ['tergantung kondisi', 'depending on your condition'],
  ['biasanya memakan waktu', 'usually takes'],
  ['biasanya berlangsung', 'usually lasts'],
  ['sekitar', 'approximately'],
  ['menit', 'minutes'],
  ['jam', 'hours'],
  ['vitamin c dosis tinggi', 'high-dose Vitamin C'],
  ['vitamin b dan c', 'Vitamin B and C'],
  ['vitamin b & c', 'Vitamin B and C'],
  ['anti mual', 'anti-nausea'],
  ['anti-mual', 'anti-nausea'],
  ['elektrolit lengkap', 'complete electrolytes'],
  ['b-complex', 'B-complex'],
  ['glutathione', 'glutathione'],
  ['zinc', 'zinc'],
  ['magnesium', 'magnesium'],
  ['antioksidan', 'antioxidants'],
  ['peningkat kolagen', 'collagen support'],
  ['detoks ringan', 'gentle detox support'],
  ['rasa lelah', 'fatigue'],
  ['badan tidak fit', 'feeling unwell'],
  ['dehidrasi', 'dehydration'],
  ['kelelahan', 'fatigue'],
  ['pemulihan', 'recovery'],
  ['hidrasi', 'hydration'],
  ['energi', 'energy'],
  ['kebugaran', 'wellness'],
  ['kesehatan', 'wellness'],
  ['perawatan premium', 'premium care'],
  ['pengalaman premium', 'premium experience'],
  ['treatment premium', 'premium treatment'],
  ['treatment ini', 'this treatment'],
  ['tentang treatment ini', 'about this treatment'],
  ['kandungan dan manfaat', 'ingredients and benefits'],
  ['kandungan & manfaat', 'ingredients and benefits'],
  ['pertanyaan yang sering ditanyakan', 'frequently asked questions'],
  ['sesi iv therapy', 'IV therapy session'],
  ['sesi treatment', 'treatment session'],
  ['sebelum treatment', 'before treatment'],
  ['setelah treatment', 'after treatment'],
  ['kondisi darurat medis', 'medical emergency'],
  ['layanan gawat darurat', 'emergency service'],
  ['segera hubungi layanan gawat darurat setempat', 'contact local emergency services immediately'],
  ['hubungi layanan gawat darurat setempat', 'contact local emergency services'],
  ['rumah sakit terdekat', 'nearest hospital'],
  ['riwayat kesehatan', 'medical history'],
  ['alergi', 'allergies'],
  ['kehamilan', 'pregnancy'],
  ['obat-obatan', 'medications'],
  ['obat', 'medications'],
  ['persetujuan tindakan', 'informed consent'],
  ['skrining klinis', 'clinical screening'],
  ['asesmen klinis', 'clinical assessment'],
  ['tidak cocok untuk semua orang', 'may not be suitable for everyone'],
  ['tidak ditujukan untuk kondisi darurat', 'not intended for emergencies'],
  ['bukan untuk kondisi darurat medis', 'not for medical emergencies'],
  ['harga final', 'final price'],
  ['biaya perjalanan', 'travel fee'],
  ['metode pembayaran', 'payment method'],
  ['penjadwalan ulang', 'rescheduling'],
  ['pembatalan', 'cancellation'],
  ['no-show', 'no-show'],
  ['perawatan lanjutan', 'aftercare'],
  ['hasil tidak dijamin', 'results are not guaranteed'],
  ['setiap orang', 'each person'],
  ['turis', 'tourists'],
  ['ekspatriat', 'expats'],
  ['warga lokal', 'local residents'],
  ['semua orang', 'everyone'],
  ['populer', 'popular'],
  ['terlaris', 'best seller'],
  ['baru', 'new'],
];

const ID_TO_EN_WORDS: Record<string, string> = {
  ada: 'available',
  aktif: 'active',
  alamat: 'address',
  aman: 'safe',
  anda: 'you',
  atau: 'or',
  bali: 'Bali',
  baru: 'new',
  bantuan: 'help',
  berapa: 'how much',
  bersertifikat: 'certified',
  berkualitas: 'quality',
  berlisensi: 'licensed',
  booking: 'booking',
  datang: 'come',
  dengan: 'with',
  dokter: 'doctor',
  energi: 'energy',
  harga: 'price',
  hidrasi: 'hydration',
  hotel: 'hotel',
  isi: 'fill',
  jadwal: 'schedule',
  kami: 'we',
  kamu: 'you',
  kebutuhan: 'needs',
  kesehatan: 'wellness',
  konfirmasi: 'confirmation',
  konsultasi: 'consultation',
  langsung: 'directly',
  layanan: 'service',
  lokasi: 'location',
  medis: 'medical',
  membantu: 'help',
  mendukung: 'support',
  menikmati: 'enjoy',
  nyaman: 'comfortable',
  pemulihan: 'recovery',
  peralatan: 'equipment',
  perawatan: 'care',
  pilih: 'choose',
  premium: 'premium',
  profesional: 'professional',
  rumah: 'home',
  sekarang: 'now',
  sesuai: 'according to',
  steril: 'sterile',
  tersedia: 'available',
  tim: 'team',
  treatment: 'treatment',
  tubuh: 'body',
  untuk: 'for',
  villa: 'villa',
  vitamin: 'vitamin',
  waktu: 'time',
  yang: 'that',
};

const EN_TO_ID_PHRASES: PhrasePair[] = [
  ['certified medical team', 'tim medis bersertifikat'],
  ['professional medical staff', 'tenaga medis profesional'],
  ['mobile iv therapy', 'IV therapy mobile'],
  ['iv therapy', 'IV therapy'],
  ['active service areas', 'area layanan aktif'],
  ['service area', 'area layanan'],
  ['booking form', 'form booking'],
  ['book now', 'pesan sekarang'],
  ['consult via whatsapp', 'konsultasi via WhatsApp'],
  ['chat on whatsapp', 'chat di WhatsApp'],
  ['ask via whatsapp', 'tanya via WhatsApp'],
  ['come directly to your location', 'datang langsung ke lokasi Anda'],
  ['come to your location', 'datang ke lokasi Anda'],
  ['villa, hotel, or airbnb', 'villa, hotel, atau Airbnb'],
  ['in bali', 'di Bali'],
  ['hangover recovery', 'Hangover Recovery'],
  ['immune booster', 'Immune Booster'],
  ['energy boost', 'Energy Boost'],
  ['beauty glow', 'Beauty Glow'],
  ['fast rehydration', 'rehidrasi cepat'],
  ['high-dose vitamin c', 'Vitamin C dosis tinggi'],
  ['anti-nausea', 'anti-mual'],
  ['complete electrolytes', 'elektrolit lengkap'],
  ['ingredients and benefits', 'kandungan dan manfaat'],
  ['frequently asked questions', 'pertanyaan yang sering ditanyakan'],
  ['terms and conditions', 'syarat dan ketentuan'],
  ['privacy policy', 'kebijakan privasi'],
  ['medical emergency', 'kondisi darurat medis'],
  ['emergency service', 'layanan gawat darurat'],
  ['clinical screening', 'skrining klinis'],
  ['informed consent', 'persetujuan tindakan'],
  ['final price', 'harga final'],
];

const EN_TO_ID_WORDS: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_EN_WORDS).map(([id, en]) => [en.toLowerCase(), id]),
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyCapitalization(source: string, translated: string): string {
  if (!source || !translated) return translated;
  if (source === source.toUpperCase() && /[A-Z]/.test(source)) return translated.toUpperCase();
  if (/^[A-Z]/.test(source)) return translated.charAt(0).toUpperCase() + translated.slice(1);
  return translated;
}

function replacePhrases(text: string, phrases: PhrasePair[]): string {
  return phrases
    .slice()
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((current, [from, to]) => {
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(from)})(?=$|[^\\p{L}\\p{N}])`, 'giu');
      return current.replace(pattern, (match, prefix: string, source: string) => {
        return `${prefix}${applyCapitalization(source, to)}`;
      });
    }, text);
}

function replaceWords(text: string, words: Record<string, string>): string {
  return text.replace(/\p{L}[\p{L}'-]*/gu, (word) => {
    const lower = word.toLowerCase();
    const translated = words[lower];
    return translated ? applyCapitalization(word, translated) : word;
  });
}

function cleanupEnglish(text: string): string {
  return text
    .replace(/\bteam we\b/gi, 'our team')
    .replace(/\bteam our\b/gi, 'our team')
    .replace(/\bcertified medical team come\b/gi, 'certified medical team comes')
    .replace(/\bmedical team come\b/gi, 'medical team comes')
    .replace(/\bour team come\b/gi, 'our team comes')
    .replace(/\bwe team\b/gi, 'our team')
    .replace(/\byou needs\b/gi, 'your needs')
    .replace(/\byou location\b/gi, 'your location')
    .replace(/\byou address\b/gi, 'your address')
    .replace(/\bfor you\b/gi, 'for you')
    .replace(/\bavailable at service area\b/gi, 'available in the service area')
    .replace(/\baccording to you needs\b/gi, 'according to your needs')
    .replace(/\bthat comfortable\b/gi, 'comfortable')
    .replace(/\bservice active\b/gi, 'active service')
    .replace(/\barea service\b/gi, 'service area')
    .replace(/\bmedical team certified\b/gi, 'certified medical team')
    .replace(/\bcome directly to you\b/gi, 'come directly to you')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function cleanupIndonesian(text: string): string {
  return text
    .replace(/\btim kami\b/gi, 'tim kami')
    .replace(/\barea layanan\b/gi, 'area layanan')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function detectLanguage(text: string): TranslationLang {
  const lower = text.toLowerCase();
  const tokens = lower.match(/\p{L}+/gu) ?? [];
  let idScore = 0;
  let enScore = 0;

  for (const token of tokens) {
    if (ID_MARKERS.includes(token)) idScore += 1;
    if (EN_MARKERS.includes(token)) enScore += 1;
  }

  for (const [phrase] of ID_TO_EN_PHRASES) {
    if (lower.includes(phrase)) idScore += phrase.includes(' ') ? 2 : 1;
  }
  for (const [phrase] of EN_TO_ID_PHRASES) {
    if (lower.includes(phrase)) enScore += phrase.includes(' ') ? 2 : 1;
  }

  return idScore >= enScore ? 'id' : 'en';
}

export function translateOffline(
  text: string,
  targetLang: TranslationLang,
  sourceLang: TranslationLang | 'auto' = 'auto',
): string {
  if (!text.trim()) return text;

  const source = sourceLang === 'auto' ? detectLanguage(text) : sourceLang;
  if (source === targetLang) return text;

  const lines = text.split(/(\r?\n)/);
  return lines.map((line) => {
    if (/^\r?\n$/.test(line) || !line.trim()) return line;

    if (source === 'id' && targetLang === 'en') {
      return cleanupEnglish(replaceWords(replacePhrases(line, ID_TO_EN_PHRASES), ID_TO_EN_WORDS));
    }

    if (source === 'en' && targetLang === 'id') {
      return cleanupIndonesian(replaceWords(replacePhrases(line, EN_TO_ID_PHRASES), EN_TO_ID_WORDS));
    }

    return line;
  }).join('');
}

export function translateTextsOffline(
  texts: string[],
  targetLang: TranslationLang,
  sourceLang: TranslationLang | 'auto' = 'auto',
): string[] {
  return texts.map((text) => translateOffline(text, targetLang, sourceLang));
}
