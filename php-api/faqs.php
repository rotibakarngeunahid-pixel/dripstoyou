<?php
// GET /api/faqs.php — public FAQ list

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$stmt = $db->query('SELECT id, question, answer, sort_order FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC');
$faqs = $stmt->fetchAll();

foreach ($faqs as &$f) {
    $question = json_decode($f['question'], true);
    $answer = json_decode($f['answer'], true);
    $f = [
        'id' => $f['id'],
        'questionEn' => is_array($question) ? (string)($question['en'] ?? '') : '',
        'answerEn' => is_array($answer) ? (string)($answer['en'] ?? '') : '',
        'questionId' => is_array($question) ? (string)($question['id'] ?? '') : (string)$f['question'],
        'answerId' => is_array($answer) ? (string)($answer['id'] ?? '') : (string)$f['answer'],
        'sortOrder' => (int)$f['sort_order'],
    ];
}
unset($f);

jsonSuccess($faqs);
