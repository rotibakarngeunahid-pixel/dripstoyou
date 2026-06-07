<?php
// CRUD /api/admin/faqs.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
$id = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db = getDb();

function decodeFaqText(string $value): array {
    $decoded = json_decode($value, true);
    if (is_array($decoded)) {
        return [
            'en' => (string)($decoded['en'] ?? ''),
            'id' => (string)($decoded['id'] ?? ''),
        ];
    }
    return ['en' => '', 'id' => $value];
}

function encodeFaqText(string $en, string $id): string {
    return json_encode(['en' => $en, 'id' => $id], JSON_UNESCAPED_UNICODE);
}

function formatFaq(array $faq): array {
    $question = decodeFaqText($faq['question']);
    $answer = decodeFaqText($faq['answer']);
    return [
        'id' => $faq['id'],
        'questionEn' => $question['en'],
        'answerEn' => $answer['en'],
        'questionId' => $question['id'],
        'answerId' => $answer['id'],
        'sortOrder' => (int)$faq['sort_order'],
        'isActive' => (bool)$faq['is_active'],
    ];
}

function findFaq(PDO $db, string $id): array {
    $stmt = $db->prepare('SELECT * FROM faqs WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $faq = $stmt->fetch();
    if (!$faq) jsonError('FAQ tidak ditemukan', 404);
    return $faq;
}

if ($method === 'GET') {
    if ($id) jsonSuccess(formatFaq(findFaq($db, $id)));
    $rows = $db->query('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC')->fetchAll();
    jsonSuccess(array_map('formatFaq', $rows));
}

if ($method === 'POST') {
    $body = getBodyJson();
    $questionEn = str_clean($body['questionEn'] ?? '', 500);
    $answerEn = str_clean($body['answerEn'] ?? '', 10000);
    $questionId = str_clean($body['questionId'] ?? '', 500);
    $answerId = str_clean($body['answerId'] ?? '', 10000);
    if (($questionEn === '' || $answerEn === '') && ($questionId === '' || $answerId === '')) {
        jsonError('Isi pertanyaan dan jawaban lengkap untuk minimal satu bahasa', 422);
    }

    $newId = generateId();
    $db->prepare(
        'INSERT INTO faqs (id, question, answer, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([
        $newId,
        encodeFaqText($questionEn, $questionId),
        encodeFaqText($answerEn, $answerId),
        (int)($body['sortOrder'] ?? 0),
        isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : 1,
    ]);

    jsonSuccess(formatFaq(findFaq($db, $newId)), 'FAQ berhasil ditambahkan', 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) jsonError('ID FAQ wajib diisi', 400);
    findFaq($db, $id);
    $body = getBodyJson();
    $updates = [];
    $params = [];

    $hasLocalizedText =
        array_key_exists('questionEn', $body) ||
        array_key_exists('answerEn', $body) ||
        array_key_exists('questionId', $body) ||
        array_key_exists('answerId', $body);
    if ($hasLocalizedText) {
        $current = findFaq($db, $id);
        $currentQuestion = decodeFaqText($current['question']);
        $currentAnswer = decodeFaqText($current['answer']);
        $questionEn = str_clean($body['questionEn'] ?? $currentQuestion['en'], 500);
        $answerEn = str_clean($body['answerEn'] ?? $currentAnswer['en'], 10000);
        $questionId = str_clean($body['questionId'] ?? $currentQuestion['id'], 500);
        $answerId = str_clean($body['answerId'] ?? $currentAnswer['id'], 10000);
        if (($questionEn === '' || $answerEn === '') && ($questionId === '' || $answerId === '')) {
            jsonError('Isi pertanyaan dan jawaban lengkap untuk minimal satu bahasa', 422);
        }
        $updates[] = 'question = ?';
        $params[] = encodeFaqText($questionEn, $questionId);
        $updates[] = 'answer = ?';
        $params[] = encodeFaqText($answerEn, $answerId);
    }
    if (array_key_exists('sortOrder', $body)) {
        $updates[] = 'sort_order = ?';
        $params[] = (int)$body['sortOrder'];
    }
    if (array_key_exists('isActive', $body)) {
        $updates[] = 'is_active = ?';
        $params[] = $body['isActive'] ? 1 : 0;
    }

    if (!empty($updates)) {
        $params[] = $id;
        $db->prepare('UPDATE faqs SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    jsonSuccess(formatFaq(findFaq($db, $id)), 'FAQ berhasil diperbarui');
}

if ($method === 'DELETE') {
    if (!$id) jsonError('ID FAQ wajib diisi', 400);
    findFaq($db, $id);
    $db->prepare('DELETE FROM faqs WHERE id = ?')->execute([$id]);
    jsonSuccess(null, 'FAQ berhasil dihapus');
}

jsonError('Method not allowed', 405);
