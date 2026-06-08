<?php
// CRUD /api/admin/faqs.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
$id = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db = getDb();
ensureFaqTranslationSchema($db);

function ensureFaqTranslationSchema(PDO $db): void {
    if (!columnExists($db, 'faqs', 'source_lang')) {
        $db->exec("ALTER TABLE `faqs` ADD COLUMN `source_lang` VARCHAR(10) NOT NULL DEFAULT 'auto' AFTER `answer`");
    }
    if (!columnExists($db, 'faqs', 'translations_json')) {
        $db->exec("ALTER TABLE `faqs` ADD COLUMN `translations_json` JSON NULL AFTER `source_lang`");
    }
}

function decodeFaqText(?string $value): array {
    $decoded = json_decode((string)$value, true);
    if (is_array($decoded)) {
        return [
            'en' => (string)($decoded['en'] ?? ''),
            'id' => (string)($decoded['id'] ?? ''),
        ];
    }
    return ['en' => '', 'id' => (string)$value];
}

function encodeFaqText(string $en, string $id): string {
    return json_encode(['en' => $en, 'id' => $id], JSON_UNESCAPED_UNICODE);
}

function encodeFaqTranslations(string $questionEn, string $questionId, string $answerEn, string $answerId): string {
    return json_encode([
        'question' => ['en' => $questionEn, 'id' => $questionId],
        'answer' => ['en' => $answerEn, 'id' => $answerId],
    ], JSON_UNESCAPED_UNICODE);
}

function detectFaqLanguage(string $question, string $answer): string {
    $text = strtolower($question . ' ' . $answer);
    $idWords = ['yang', 'dan', 'atau', 'dalam', 'dengan', 'berapa', 'apakah', 'aman', 'kami', 'anda', 'untuk', 'tidak', 'bisa', 'lama', 'setelah'];
    $enWords = ['the', 'and', 'or', 'with', 'what', 'how', 'does', 'safe', 'after', 'before', 'can', 'you', 'we', 'our', 'your', 'long'];

    $idScore = 0;
    foreach ($idWords as $word) {
        if (preg_match('/\b' . preg_quote($word, '/') . '\b/u', $text)) $idScore++;
    }

    $enScore = 0;
    foreach ($enWords as $word) {
        if (preg_match('/\b' . preg_quote($word, '/') . '\b/u', $text)) $enScore++;
    }

    return $idScore >= $enScore ? 'id' : 'en';
}

function translateText(string $text, string $from, string $to): string {
    if (empty(trim($text))) return '';
    $url = 'https://api.mymemory.translated.net/get?q=' . urlencode($text) . '&langpair=' . $from . '|' . $to;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'DripstoyouFAQ/1.0',
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    if ($response === false) return '';
    $data = json_decode($response, true);
    if (!is_array($data) || !isset($data['responseData']['translatedText'])) return '';
    $translated = $data['responseData']['translatedText'];
    if (!is_string($translated) || empty(trim($translated))) return '';
    if ((int)($data['responseStatus'] ?? 0) !== 200) return '';
    return trim($translated);
}

function buildFaqTranslations(string $question, string $answer, string $sourceLang): array {
    $sourceLang = in_array($sourceLang, ['en', 'id'], true) ? $sourceLang : detectFaqLanguage($question, $answer);

    if ($sourceLang === 'id') {
        $questionId = $question;
        $answerId = $answer;
        $questionEn = translateText($questionId, 'id', 'en') ?: $questionId;
        $answerEn = translateText($answerId, 'id', 'en') ?: $answerId;
    } else {
        $questionEn = $question;
        $answerEn = $answer;
        $questionId = translateText($questionEn, 'en', 'id') ?: $questionEn;
        $answerId = translateText($answerEn, 'en', 'id') ?: $answerEn;
    }

    return [
        'sourceLang' => $sourceLang,
        'questionEn' => $questionEn,
        'answerEn' => $answerEn,
        'questionId' => $questionId,
        'answerId' => $answerId,
    ];
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
        'sourceLang' => $faq['source_lang'] ?? 'auto',
        'translations' => json_decode($faq['translations_json'] ?? '{}', true) ?: null,
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
    $question = str_clean($body['question'] ?? ($body['questionId'] ?? ($body['questionEn'] ?? '')), 500);
    $answer = str_clean($body['answer'] ?? ($body['answerId'] ?? ($body['answerEn'] ?? '')), 10000);
    if ($question === '' || $answer === '') {
        jsonError('Pertanyaan dan jawaban wajib diisi', 422);
    }

    $requestedSource = in_array($body['sourceLang'] ?? '', ['en', 'id'], true) ? $body['sourceLang'] : 'auto';
    $sourceLang = $requestedSource === 'auto' ? detectFaqLanguage($question, $answer) : $requestedSource;
    $translated = buildFaqTranslations($question, $answer, $sourceLang);
    $newId = generateId();

    $db->prepare(
        'INSERT INTO faqs (id, question, answer, source_lang, translations_json, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $newId,
        encodeFaqText($translated['questionEn'], $translated['questionId']),
        encodeFaqText($translated['answerEn'], $translated['answerId']),
        $translated['sourceLang'],
        encodeFaqTranslations($translated['questionEn'], $translated['questionId'], $translated['answerEn'], $translated['answerId']),
        (int)($body['sortOrder'] ?? 0),
        isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : 1,
    ]);

    jsonSuccess(formatFaq(findFaq($db, $newId)), 'FAQ berhasil ditambahkan', 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) jsonError('ID FAQ wajib diisi', 400);
    $current = findFaq($db, $id);
    $body = getBodyJson();
    $updates = [];
    $params = [];

    $hasTextUpdate =
        array_key_exists('question', $body) || array_key_exists('answer', $body) ||
        array_key_exists('questionEn', $body) || array_key_exists('answerEn', $body) ||
        array_key_exists('questionId', $body) || array_key_exists('answerId', $body);

    if (!empty($body['regenerateTranslation']) || $hasTextUpdate) {
        $currentQuestion = decodeFaqText($current['question']);
        $currentAnswer = decodeFaqText($current['answer']);
        $sourceLang = in_array($body['sourceLang'] ?? '', ['en', 'id'], true)
            ? $body['sourceLang']
            : (($current['source_lang'] ?? '') === 'en' || ($current['source_lang'] ?? '') === 'id'
                ? $current['source_lang']
                : 'auto');

        if ($hasTextUpdate) {
            $question = str_clean($body['question'] ?? ($body['questionId'] ?? ($body['questionEn'] ?? '')), 500);
            $answer = str_clean($body['answer'] ?? ($body['answerId'] ?? ($body['answerEn'] ?? '')), 10000);
            if ($question === '' || $answer === '') {
                jsonError('Pertanyaan dan jawaban wajib diisi', 422);
            }
        } else {
            $detectedSource = $sourceLang === 'auto' ? detectFaqLanguage($currentQuestion['id'] ?: $currentQuestion['en'], $currentAnswer['id'] ?: $currentAnswer['en']) : $sourceLang;
            $question = $detectedSource === 'id' ? ($currentQuestion['id'] ?: $currentQuestion['en']) : ($currentQuestion['en'] ?: $currentQuestion['id']);
            $answer = $detectedSource === 'id' ? ($currentAnswer['id'] ?: $currentAnswer['en']) : ($currentAnswer['en'] ?: $currentAnswer['id']);
            $sourceLang = $detectedSource;
        }

        $sourceLang = $sourceLang === 'auto' ? detectFaqLanguage($question, $answer) : $sourceLang;
        $translated = buildFaqTranslations($question, $answer, $sourceLang);
        $updates[] = 'question = ?';
        $params[] = encodeFaqText($translated['questionEn'], $translated['questionId']);
        $updates[] = 'answer = ?';
        $params[] = encodeFaqText($translated['answerEn'], $translated['answerId']);
        $updates[] = 'source_lang = ?';
        $params[] = $translated['sourceLang'];
        $updates[] = 'translations_json = ?';
        $params[] = encodeFaqTranslations($translated['questionEn'], $translated['questionId'], $translated['answerEn'], $translated['answerId']);
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

    jsonSuccess(formatFaq(findFaq($db, $id)), !empty($body['regenerateTranslation']) ? 'Terjemahan berhasil diperbarui' : 'FAQ berhasil diperbarui');
}

if ($method === 'DELETE') {
    if (!$id) jsonError('ID FAQ wajib diisi', 400);
    findFaq($db, $id);
    $db->prepare('DELETE FROM faqs WHERE id = ?')->execute([$id]);
    jsonSuccess(null, 'FAQ berhasil dihapus');
}

jsonError('Method not allowed', 405);
