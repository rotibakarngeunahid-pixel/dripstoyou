<?php
// POST /admin/upload.php — upload foto produk ke server hosting

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();

if (getMethod() !== 'POST') jsonError('Method not allowed', 405);

// ── Config ────────────────────────────────────────────────────────────────────
// Opsional: Tambahkan di config.php untuk override path upload:
//   define('UPLOAD_DIR', '/home/namauser/public_html/uploads/products');
//   define('UPLOAD_BASE_URL', 'https://dripstoyou.com');
//
// Jika UPLOAD_DIR tidak diset, file akan disimpan di folder uploads/products
// relatif terhadap document root hosting (public_html).

// Tentukan direktori upload
if (defined('UPLOAD_DIR')) {
    $uploadDir = rtrim(UPLOAD_DIR, '/');
} else {
    $docRoot   = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $uploadDir = $docRoot . '/uploads/products';
}

// Tentukan base URL publik — auto-detect dari request jika UPLOAD_BASE_URL tidak diset
if (defined('UPLOAD_BASE_URL')) {
    $uploadBaseUrl = rtrim(UPLOAD_BASE_URL, '/');
} else {
    $proto         = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $uploadBaseUrl = $proto . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}
$maxSize       = 5 * 1024 * 1024; // 5 MB

// ── Validasi file ─────────────────────────────────────────────────────────────
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['file']['error'] ?? -1;
    $msg = match ((int)$errCode) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Ukuran file melebihi batas maksimal',
        UPLOAD_ERR_NO_FILE  => 'Tidak ada file yang diupload',
        default             => 'Upload gagal (kode ' . $errCode . ')',
    };
    jsonError($msg, 400);
}

$file = $_FILES['file'];

if ($file['size'] === 0) jsonError('File kosong', 400);
if ($file['size'] > $maxSize) jsonError('Ukuran file maksimal 5MB', 400);

// ── Deteksi tipe via magic bytes (abaikan ekstensi asli) ──────────────────────
$handle = fopen($file['tmp_name'], 'rb');
$bytes  = $handle ? unpack('C*', fread($handle, 12)) : [];
if ($handle) fclose($handle);
$b = array_values($bytes ?: []);

if (count($b) >= 3 && $b[0] === 0xFF && $b[1] === 0xD8 && $b[2] === 0xFF) {
    $ext = '.jpg'; $mime = 'image/jpeg';
} elseif (count($b) >= 4 && $b[0] === 0x89 && $b[1] === 0x50 && $b[2] === 0x4E && $b[3] === 0x47) {
    $ext = '.png'; $mime = 'image/png';
} elseif (count($b) >= 12 && $b[0] === 0x52 && $b[1] === 0x49 && $b[2] === 0x46 && $b[3] === 0x46
       && $b[8] === 0x57 && $b[9] === 0x45 && $b[10] === 0x42 && $b[11] === 0x50) {
    $ext = '.webp'; $mime = 'image/webp';
} else {
    jsonError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.', 400);
}

// ── Simpan file ───────────────────────────────────────────────────────────────
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        jsonError('Gagal membuat folder upload: ' . $uploadDir, 500);
    }
}

$filename = bin2hex(random_bytes(16)) . $ext;
$destPath = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonError('Gagal menyimpan file ke server', 500);
}

// ── Audit & response ──────────────────────────────────────────────────────────
$publicUrl = $uploadBaseUrl . '/uploads/products/' . $filename;

auditLog('UPDATE_PRODUCT', $admin['admin_id'], 'Product', null, [
    'operation' => 'upload_image',
    'filename'  => $filename,
    'mime'      => $mime,
]);

jsonSuccess(['publicUrl' => $publicUrl, 'mimeType' => $mime], 'Upload berhasil');
