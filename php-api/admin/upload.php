<?php
// POST /admin/upload.php — upload foto produk ke server hosting

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();

if (getMethod() !== 'POST') jsonError('Method not allowed', 405);

// ── Tentukan path dan URL upload ──────────────────────────────────────────────
// Path selalu dihitung dari lokasi file ini (php-api/admin/upload.php)
// sehingga tidak perlu UPLOAD_DIR di config.php.
$phpApiDir = realpath(__DIR__ . '/..') ?: dirname(__DIR__);
$uploadDir = $phpApiDir . '/uploads/products';

// URL publik — gunakan UPLOAD_BASE_URL dari config jika ada, atau auto-detect
if (defined('UPLOAD_BASE_URL')) {
    $uploadBaseUrl = rtrim(UPLOAD_BASE_URL, '/');
} else {
    $proto         = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host          = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // Hitung path php-api relatif terhadap document root
    $docRoot  = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $apiPath  = str_replace('\\', '/', $phpApiDir);
    $rootPath = str_replace('\\', '/', $docRoot);
    $relPath  = $docRoot ? ltrim(str_replace($rootPath, '', $apiPath), '/') : 'php-api';
    $uploadBaseUrl = $proto . '://' . $host . '/' . $relPath;
}

$maxSize = 5 * 1024 * 1024; // 5 MB

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

// ── Deteksi tipe via magic bytes ──────────────────────────────────────────────
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

// ── Buat folder jika belum ada ────────────────────────────────────────────────
if (!is_dir($uploadDir)) {
    $prevUmask = umask(0);
    $created   = mkdir($uploadDir, 0755, true);
    umask($prevUmask);

    if (!$created && !is_dir($uploadDir)) {
        $phpErr  = error_get_last();
        $errMsg  = $phpErr['message'] ?? 'unknown error';
        $parent  = dirname($uploadDir);
        $writable = is_writable($parent) ? 'writable' : 'NOT writable';
        jsonError(
            'Gagal membuat folder upload. ' .
            'Path: ' . $uploadDir . ' | ' .
            'Parent (' . $parent . '): ' . $writable . ' | ' .
            'Error: ' . $errMsg,
            500
        );
    }
}

if (!is_writable($uploadDir)) {
    jsonError('Folder upload tidak bisa ditulis: ' . $uploadDir, 500);
}

// ── Simpan file ───────────────────────────────────────────────────────────────
$filename = bin2hex(random_bytes(16)) . $ext;
$destPath = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    $phpErr = error_get_last();
    jsonError('Gagal menyimpan file. Dest: ' . $destPath . ' | Error: ' . ($phpErr['message'] ?? 'unknown'), 500);
}

// ── Audit & response ──────────────────────────────────────────────────────────
$publicUrl = $uploadBaseUrl . '/uploads/products/' . $filename;

auditLog('UPDATE_PRODUCT', $admin['admin_id'], 'Product', null, [
    'operation' => 'upload_image',
    'filename'  => $filename,
    'mime'      => $mime,
]);

jsonSuccess(['publicUrl' => $publicUrl, 'mimeType' => $mime], 'Upload berhasil');
