<?php
// GET /api/about.php

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$stored = json_decode(getSiteSetting('about_content', '') ?? '', true);
jsonSuccess(is_array($stored) ? $stored : ['en' => [], 'id' => []]);
