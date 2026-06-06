<?php
// GET /api/admin/seed.php?secret=YOUR_SEED_SECRET — one-time database seeding
// PENTING: Jalankan sekali setelah setup database. Hapus atau amankan setelahnya.

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$secret = $_GET['secret'] ?? '';
if (!defined('SEED_SECRET') || empty($secret) || $secret !== SEED_SECRET) {
    jsonError('Forbidden', 403);
}

$db  = getDb();
$log = [];

try {
    // ── Service Areas ─────────────────────────────────────────────────────────
    $areas = [
        ['Seminyak',        'seminyak',        1,  60],
        ['Canggu',          'canggu',          2,  45],
        ['Kuta',            'kuta',            3,  30],
        ['Ubud',            'ubud',            4,  90],
        ['Nusa Dua',        'nusa-dua',        5,  60],
        ['Jimbaran',        'jimbaran',        6,  45],
        ['Legian',          'legian',          7,  30],
        ['Sanur',           'sanur',           8,  60],
        ['Denpasar',        'denpasar',        9,  45],
        ['Uluwatu',         'uluwatu',         10, 60],
        ['Petitenget',      'petitenget',      11, 30],
        ['Bukit Peninsula', 'bukit-peninsula', 12, 75],
    ];
    $inserted = 0;
    foreach ($areas as [$name, $slug, $order, $eta]) {
        $chk = $db->prepare('SELECT id FROM service_areas WHERE slug = ? LIMIT 1');
        $chk->execute([$slug]);
        if (!$chk->fetch()) {
            $db->prepare('INSERT INTO service_areas (id, name, slug, is_active, estimated_arrival_minutes, sort_order) VALUES (?, ?, ?, 1, ?, ?)')
               ->execute([generateId(), $name, $slug, $eta, $order]);
            $inserted++;
        }
    }
    $log[] = "✓ $inserted service areas seeded (skipped existing)";

    // ── Product Category ──────────────────────────────────────────────────────
    $chk = $db->prepare('SELECT id FROM product_categories WHERE slug = ? LIMIT 1');
    $chk->execute(['iv-therapy']);
    $catRow = $chk->fetch();
    if (!$catRow) {
        $catId = generateId();
        $db->prepare('INSERT INTO product_categories (id, name, slug, sort_order, is_active) VALUES (?, ?, ?, 1, 1)')
           ->execute([$catId, 'IV Therapy', 'iv-therapy']);
    } else {
        $catId = $catRow['id'];
    }
    $log[] = '✓ Product category ready';

    // ── Products ──────────────────────────────────────────────────────────────
    $products = [
        ['Hangover Recovery', 'hangover-recovery', 'Rehidrasi cepat, vitamin B & C, anti-nausea', 750000, 'IDR 750.000', 45, 'Popular',    true, 1, 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?auto=compress&cs=tinysrgb&w=800'],
        ['Immune Booster',    'immune-booster',    'Vitamin C high-dose, zinc, glutathione',        650000, 'IDR 650.000', 45, 'Best Seller', true, 2, 'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=800'],
        ['Energy Boost',      'energy-boost',      'B-complex, magnesium, elektrolit penuh',        550000, 'IDR 550.000', 45, null,          true, 3, 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=800'],
        ['Beauty Glow',       'beauty-glow',       'Glutathione, collagen boost, antioksidan',      700000, 'IDR 700.000', 45, 'New',         true, 4, 'https://images.pexels.com/photos/3985338/pexels-photo-3985338.jpeg?auto=compress&cs=tinysrgb&w=800'],
    ];
    $now = date('Y-m-d H:i:s');
    $pInserted = 0;
    foreach ($products as [$name, $slug, $desc, $price, $priceLabel, $dur, $label, $show, $order, $img]) {
        $chk = $db->prepare('SELECT id FROM products WHERE slug = ? LIMIT 1');
        $chk->execute([$slug]);
        if (!$chk->fetch()) {
            $db->prepare(
                'INSERT INTO products (id, category_id, name, slug, short_description, price_amount, price_label, duration_minutes, image_url, label, is_active, show_on_homepage, homepage_order, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)'
            )->execute([generateId(), $catId, $name, $slug, $desc, $price, $priceLabel, $dur, $img, $label, $show ? 1 : 0, $order, $now, $now]);
            $pInserted++;
        }
    }
    $log[] = "✓ $pInserted products seeded";

    // ── Schedule ──────────────────────────────────────────────────────────────
    $sInserted = 0;
    for ($dow = 0; $dow <= 6; $dow++) {
        $chk = $db->prepare('SELECT id FROM schedule_settings WHERE day_of_week = ? LIMIT 1');
        $chk->execute([$dow]);
        if (!$chk->fetch()) {
            $db->prepare('INSERT INTO schedule_settings (id, day_of_week, is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot, min_prebooking_minutes) VALUES (?, ?, 1, ?, ?, 60, 3, 120)')
               ->execute([generateId(), $dow, '08:00', '22:00']);
            $sInserted++;
        }
    }
    $log[] = "✓ $sInserted schedule settings seeded";

    // ── Testimonials ──────────────────────────────────────────────────────────
    $testimonials = [
        ['Sarah Johnson', 5, 'Pelayanannya sangat cepat dan profesional. Tim datang ke villa kami dalam 45 menit. Setelah treatment, langsung bisa jalan-jalan lagi!', 'Hangover Recovery'],
        ['James Miller',  5, "Tried the Hangover Recovery after a night in Canggu. Genuinely felt better within 2 hours. Equipment was clean and the team was super professional.", 'Hangover Recovery'],
        ['Maria Santos',  5, 'Tim medisnya sangat ramah dan peralatan terlihat steril. Harga worth it banget untuk kualitas yang diberikan. Pasti akan repeat!', 'Immune Booster'],
    ];
    $tInserted = 0;
    foreach ($testimonials as [$cName, $rating, $content, $tag]) {
        $chk = $db->prepare('SELECT id FROM testimonials WHERE customer_name = ? LIMIT 1');
        $chk->execute([$cName]);
        if (!$chk->fetch()) {
            $db->prepare('INSERT INTO testimonials (id, customer_name, rating, content, treatment_tag, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)')
               ->execute([generateId(), $cName, $rating, $content, $tag, $tInserted + 1]);
            $tInserted++;
        }
    }
    $log[] = "✓ $tInserted testimonials seeded";

    // ── FAQs ──────────────────────────────────────────────────────────────────
    $faqs = [
        ['Berapa lama proses IV therapy berlangsung?', 'Proses IV therapy berlangsung sekitar 30-60 menit tergantung jenis treatment yang dipilih. Tim medis kami akan mempersiapkan dan memantau proses secara penuh.'],
        ['Apakah aman dilakukan di villa atau hotel?', 'Ya, aman. Tim medis kami membawa semua peralatan steril yang diperlukan. Kami hanya membutuhkan tempat duduk atau berbaring yang nyaman untuk Anda.'],
        ['Berapa lama waktu respons setelah booking?', 'Tim kami biasanya tiba dalam 30-60 menit setelah konfirmasi booking. Kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal.'],
        ['Area mana saja yang dicakup?', 'Kami melayani seluruh area wisata utama Bali termasuk Seminyak, Canggu, Kuta, Ubud, Nusa Dua, Jimbaran, Legian, Sanur, Denpasar, Uluwatu, Petitenget, dan Bukit Peninsula.'],
        ['Apakah ada biaya tambahan?', 'Harga yang tertera sudah termasuk biaya kunjungan ke lokasi Anda di area layanan kami. Untuk area yang sangat jauh, mungkin ada biaya perjalanan tambahan yang akan dikomunikasikan sebelum treatment.'],
    ];
    $fInserted = 0;
    foreach ($faqs as $i => [$q, $a]) {
        $chk = $db->prepare('SELECT id FROM faqs WHERE question = ? LIMIT 1');
        $chk->execute([$q]);
        if (!$chk->fetch()) {
            $db->prepare('INSERT INTO faqs (id, question, answer, sort_order, is_active) VALUES (?, ?, ?, ?, 1)')
               ->execute([generateId(), $q, $a, $i + 1]);
            $fInserted++;
        }
    }
    $log[] = "✓ $fInserted FAQs seeded";

    // ── Site Settings ─────────────────────────────────────────────────────────
    $now = date('Y-m-d H:i:s');
    $settings = [
        ['whatsapp_number',       defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '6281200000000'],
        ['business_hours',        '08:00-22:00'],
        ['response_time_minutes', '60'],
        ['site_name',             'DRIP TO YOU Bali'],
        ['site_email',            'hello@dripstoyou.com'],
    ];
    $ssInserted = 0;
    foreach ($settings as [$key, $val]) {
        $chk = $db->prepare("SELECT `key` FROM site_settings WHERE `key` = ? LIMIT 1");
        $chk->execute([$key]);
        if (!$chk->fetch()) {
            $db->prepare("INSERT INTO site_settings (`key`, value_encrypted_or_json, updated_at) VALUES (?, ?, ?)")
               ->execute([$key, $val, $now]);
            $ssInserted++;
        }
    }
    $log[] = "✓ $ssInserted site settings seeded";

    // ── Super Admin ───────────────────────────────────────────────────────────
    $cnt = (int)$db->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    if ($cnt === 0) {
        $hash = hashPassword('AdminDrip2025!');
        $now2 = date('Y-m-d H:i:s');
        $db->prepare(
            'INSERT INTO admins (id, name, email, password_hash, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
        )->execute([generateId(), 'Super Admin', 'admin@dripstoyou.com', $hash, 'SUPER_ADMIN', $now2, $now2]);
        $log[] = '✓ Super admin dibuat: admin@dripstoyou.com / AdminDrip2025!';
    } else {
        $log[] = '✓ Admin sudah ada — dilewati';
    }

    jsonSuccess(['log' => $log], 'Seeding selesai');

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Seeding gagal', 'log' => $log]);
    exit;
}
