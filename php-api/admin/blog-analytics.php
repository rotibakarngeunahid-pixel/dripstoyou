<?php
// GET /api/admin/blog-analytics.php?scope=overview|series|top|detail
//
// Read-only aggregated blog traffic analytics for Super Admin + Admin Blog
// (CONTENT_ADMIN). Piggybacks on the existing `blog` module permission
// (view) instead of a separate module key — this capability mirrors exactly
// who can already see/manage the blog, it isn't meant to be independently
// grantable (ADMIN_OPERASIONAL has blog => none, so it's excluded too).
//
// All aggregation happens here in SQL (GROUP BY), never by shipping raw
// event rows to the frontend for it to sum.
//
// scope=overview          -> KPI totals for ?from=&to=
// scope=series             -> {date,views,uniqueVisitors}[] for ?from=&to=&granularity=&postId=
// scope=top                -> paginated posts + aggregated stats, ?sort=&q=&page=&per_page=
// scope=detail&postId=xxx  -> one article's performance + series + device/browser/os/referrer breakdowns

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$admin = requireAuth();
requireAdminModule($admin, 'blog', 'view');

$db = getDb();

$scope = isset($_GET['scope']) ? str_clean($_GET['scope'], 20) : 'overview';
[$from, $to] = resolveDateRange($_GET['from'] ?? null, $_GET['to'] ?? null);

switch ($scope) {
    case 'overview':
        jsonSuccess(computeBlogOverview($db, $from, $to));
        break;

    case 'series':
        $postId = (isset($_GET['postId']) && is_string($_GET['postId']) && $_GET['postId'] !== '')
            ? str_clean($_GET['postId'], 191) : null;
        $granularity = resolveGranularity($_GET['granularity'] ?? null, $from, $to);
        jsonSuccess([
            'series'      => computeBlogSeries($db, $from, $to, $granularity, $postId),
            'granularity' => $granularity,
            'range'       => ['from' => $from, 'to' => $to],
        ]);
        break;

    case 'top':
        $sort    = isset($_GET['sort']) ? str_clean($_GET['sort'], 20) : 'views';
        $q       = isset($_GET['q']) ? str_clean($_GET['q'], 120) : '';
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
        jsonSuccess(computeBlogTop($db, $from, $to, $sort, $q, $page, $perPage));
        break;

    case 'detail':
        $postId = isset($_GET['postId']) ? str_clean($_GET['postId'], 191) : '';
        if ($postId === '') jsonError('postId required', 400);

        $postStmt = $db->prepare('SELECT id, title, slug, status, published_at FROM blog_posts WHERE id = ? LIMIT 1');
        $postStmt->execute([$postId]);
        $post = $postStmt->fetch();
        if (!$post) jsonError('Article not found', 404);

        $granularity = resolveGranularity($_GET['granularity'] ?? null, $from, $to);
        jsonSuccess(computeBlogDetail($db, $post, $from, $to, $granularity));
        break;

    default:
        jsonError('Unknown scope', 400);
}

// ── Date range / granularity ─────────────────────────────────────────────────

function resolveDateRange($fromRaw, $toRaw): array {
    $today = date('Y-m-d');
    $from  = (is_string($fromRaw) && parseDateYmdStrict($fromRaw) !== null) ? $fromRaw : date('Y-m-d', strtotime('-29 days'));
    $to    = (is_string($toRaw) && parseDateYmdStrict($toRaw) !== null) ? $toRaw : $today;

    if ($from > $to) { [$from, $to] = [$to, $from]; }
    if ($to > $today) $to = $today;

    $maxSpanDays = 366;
    if ((strtotime($to) - strtotime($from)) / 86400 > $maxSpanDays) {
        $from = date('Y-m-d', strtotime($to . " -{$maxSpanDays} days"));
    }
    return [$from, $to];
}

function resolveGranularity($raw, string $from, string $to): string {
    $allowed = ['day', 'week', 'month'];
    if (is_string($raw) && in_array($raw, $allowed, true)) return $raw;

    $days = (int)round((strtotime($to) - strtotime($from)) / 86400) + 1;
    if ($days > 180) return 'month';
    if ($days > 45) return 'week';
    return 'day';
}

function dayBoundsExclusive(string $from, string $to): array {
    return [$from . ' 00:00:00', date('Y-m-d', strtotime($to . ' +1 day')) . ' 00:00:00'];
}

// ── Overview ──────────────────────────────────────────────────────────────────

function computeBlogOverview(PDO $db, string $from, string $to): array {
    [$fromDt, $toDt] = dayBoundsExclusive($from, $to);

    $totalArticles  = (int)$db->query('SELECT COUNT(*) FROM blog_posts')->fetchColumn();
    $totalPublished = (int)$db->query("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'")->fetchColumn();

    $rangeStmt = $db->prepare(
        "SELECT SUM(event_type = 'view') AS views,
                COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) AS uniqueVisitors,
                SUM(event_type IN ('cta_click','link_click')) AS interactions
         FROM blog_post_events WHERE created_at >= ? AND created_at < ?"
    );
    $rangeStmt->execute([$fromDt, $toDt]);
    $rangeRow            = $rangeStmt->fetch();
    $totalViews          = (int)($rangeRow['views'] ?? 0);
    $totalUniqueVisitors = (int)($rangeRow['uniqueVisitors'] ?? 0);
    $totalInteractions   = (int)($rangeRow['interactions'] ?? 0);

    // Previous period of equal length, immediately before $from — for growth %.
    $rangeDays  = max(1, (int)round((strtotime($toDt) - strtotime($fromDt)) / 86400));
    $prevToDt   = $fromDt;
    $prevFromDt = date('Y-m-d H:i:s', strtotime($fromDt . " -{$rangeDays} days"));
    $rangeStmt->execute([$prevFromDt, $prevToDt]);
    $prevViews = (int)($rangeStmt->fetch()['views'] ?? 0);
    // Guard divide-by-zero: no previous data -> null ("Baru", not shown as a %),
    // both zero -> flat 0, never a divide-by-zero or Infinity.
    $growthPct = $prevViews > 0
        ? round((($totalViews - $prevViews) / $prevViews) * 100, 1)
        : ($totalViews > 0 ? null : 0.0);

    $todayStart    = date('Y-m-d') . ' 00:00:00';
    $tomorrowStart = date('Y-m-d', strtotime('+1 day')) . ' 00:00:00';
    $viewsToday = siteViewsInRange($db, $todayStart, $tomorrowStart);
    $views7d    = siteViewsInRange($db, date('Y-m-d', strtotime('-6 days')) . ' 00:00:00', $tomorrowStart);
    $views30d   = siteViewsInRange($db, date('Y-m-d', strtotime('-29 days')) . ' 00:00:00', $tomorrowStart);

    $avgViewsPerArticle = $totalPublished > 0 ? round($totalViews / $totalPublished, 1) : 0.0;

    $topStmt = $db->prepare(
        "SELECT p.id, p.title, p.slug, COUNT(*) AS views
         FROM blog_post_events e
         JOIN blog_posts p ON p.id = e.post_id
         WHERE e.event_type = 'view' AND e.created_at >= ? AND e.created_at < ?
         GROUP BY p.id, p.title, p.slug
         ORDER BY views DESC
         LIMIT 1"
    );
    $topStmt->execute([$fromDt, $toDt]);
    $topArticle = $topStmt->fetch();
    if ($topArticle) $topArticle['views'] = (int)$topArticle['views'];

    return [
        'totalArticles'       => $totalArticles,
        'totalPublished'      => $totalPublished,
        'totalViews'          => $totalViews,
        'totalUniqueVisitors' => $totalUniqueVisitors,
        'totalInteractions'   => $totalInteractions,
        'avgViewsPerArticle'  => $avgViewsPerArticle,
        'topArticle'          => $topArticle ?: null,
        'viewsToday'          => $viewsToday,
        'views7d'             => $views7d,
        'views30d'            => $views30d,
        'growthPct'           => $growthPct,
        'previousViews'       => $prevViews,
        'range'               => ['from' => $from, 'to' => $to],
    ];
}

function siteViewsInRange(PDO $db, string $fromDt, string $toDt): int {
    $stmt = $db->prepare("SELECT COUNT(*) FROM blog_post_events WHERE event_type = 'view' AND created_at >= ? AND created_at < ?");
    $stmt->execute([$fromDt, $toDt]);
    return (int)$stmt->fetchColumn();
}

// ── Series (traffic over time) ───────────────────────────────────────────────

function computeBlogSeries(PDO $db, string $from, string $to, string $granularity, ?string $postId): array {
    [$fromDt, $toDt] = dayBoundsExclusive($from, $to);

    switch ($granularity) {
        case 'week':
            $bucketExpr = "DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')";
            break;
        case 'month':
            $bucketExpr = "DATE_FORMAT(created_at, '%Y-%m-01')";
            break;
        default:
            $bucketExpr = 'DATE(created_at)';
    }

    $params = [$fromDt, $toDt];
    $postFilter = '';
    if ($postId !== null && $postId !== '') {
        $postFilter = ' AND post_id = ?';
        $params[] = $postId;
    }

    $stmt = $db->prepare(
        "SELECT {$bucketExpr} AS bucket,
                SUM(event_type = 'view') AS views,
                COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) AS uniqueVisitors
         FROM blog_post_events
         WHERE created_at >= ? AND created_at < ?{$postFilter}
         GROUP BY bucket
         ORDER BY bucket ASC"
    );
    $stmt->execute($params);

    return array_map(static function (array $row): array {
        return [
            'date'           => (string)$row['bucket'],
            'views'          => (int)$row['views'],
            'uniqueVisitors' => (int)$row['uniqueVisitors'],
        ];
    }, $stmt->fetchAll());
}

// ── Top articles ──────────────────────────────────────────────────────────────

function computeBlogTop(PDO $db, string $from, string $to, string $sort, string $q, int $page, int $perPage): array {
    [$fromDt, $toDt] = dayBoundsExclusive($from, $to);
    $offset = ($page - 1) * $perPage;

    $where = ['1 = 1'];
    $countParams = [];
    if ($q !== '') {
        $where[] = 'p.title LIKE :q';
        $countParams[':q'] = '%' . $q . '%';
    }
    $whereSql = implode(' AND ', $where);

    $countStmt = $db->prepare("SELECT COUNT(*) FROM blog_posts p WHERE {$whereSql}");
    $countStmt->execute($countParams);
    $total = (int)$countStmt->fetchColumn();

    $orderMap = [
        'views'  => 'views DESC, p.title ASC',
        'clicks' => 'clicks DESC, p.title ASC',
        'recent' => 'lastViewedAt IS NULL, lastViewedAt DESC',
        'least'  => 'views ASC, p.title ASC',
    ];
    $orderSql = $orderMap[$sort] ?? $orderMap['views'];

    // views/clicks aggregated in separate subqueries (not a single GROUP BY
    // over a join) so posts with zero events still appear via LEFT JOIN,
    // and no post row gets duplicated across event types — a single query,
    // no N+1.
    $sql = "SELECT p.id, p.title, p.slug, p.status, p.published_at,
                   COALESCE(v.views, 0) AS views,
                   COALESCE(v.uniqueVisitors, 0) AS uniqueVisitors,
                   COALESCE(c.clicks, 0) AS clicks,
                   v.lastViewedAt AS lastViewedAt
            FROM blog_posts p
            LEFT JOIN (
                SELECT post_id, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS uniqueVisitors, MAX(created_at) AS lastViewedAt
                FROM blog_post_events
                WHERE event_type = 'view' AND created_at >= :vFrom AND created_at < :vTo
                GROUP BY post_id
            ) v ON v.post_id = p.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) AS clicks
                FROM blog_post_events
                WHERE event_type IN ('cta_click','link_click') AND created_at >= :cFrom AND created_at < :cTo
                GROUP BY post_id
            ) c ON c.post_id = p.id
            WHERE {$whereSql}
            ORDER BY {$orderSql}
            LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);
    foreach ($countParams as $name => $value) {
        $stmt->bindValue($name, $value, PDO::PARAM_STR);
    }
    $stmt->bindValue(':vFrom', $fromDt, PDO::PARAM_STR);
    $stmt->bindValue(':vTo', $toDt, PDO::PARAM_STR);
    $stmt->bindValue(':cFrom', $fromDt, PDO::PARAM_STR);
    $stmt->bindValue(':cTo', $toDt, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $items = array_map(static function (array $r): array {
        return [
            'id'             => $r['id'],
            'title'          => $r['title'],
            'slug'           => $r['slug'],
            'status'         => $r['status'],
            'publishedAt'    => $r['published_at'],
            'views'          => (int)$r['views'],
            'uniqueVisitors' => (int)$r['uniqueVisitors'],
            'clicks'         => (int)$r['clicks'],
            'lastViewedAt'   => $r['lastViewedAt'],
        ];
    }, $stmt->fetchAll());

    return [
        'items'      => $items,
        'pagination' => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => $total > 0 ? (int)ceil($total / $perPage) : 0,
        ],
    ];
}

// ── Per-article detail ───────────────────────────────────────────────────────

function computeBlogDetail(PDO $db, array $post, string $from, string $to, string $granularity): array {
    [$fromDt, $toDt] = dayBoundsExclusive($from, $to);
    $postId = $post['id'];

    $perfStmt = $db->prepare(
        "SELECT SUM(event_type = 'view') AS views,
                COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) AS uniqueVisitors,
                SUM(event_type IN ('cta_click','link_click')) AS interactions
         FROM blog_post_events
         WHERE post_id = ? AND created_at >= ? AND created_at < ?"
    );
    $perfStmt->execute([$postId, $fromDt, $toDt]);
    $perf = $perfStmt->fetch();

    $tomorrowStart = date('Y-m-d', strtotime('+1 day')) . ' 00:00:00';
    $viewsToday = countPostViews($db, $postId, date('Y-m-d') . ' 00:00:00', $tomorrowStart);
    $views7d    = countPostViews($db, $postId, date('Y-m-d', strtotime('-6 days')) . ' 00:00:00', $tomorrowStart);
    $views30d   = countPostViews($db, $postId, date('Y-m-d', strtotime('-29 days')) . ' 00:00:00', $tomorrowStart);

    return [
        'post' => [
            'id'          => $post['id'],
            'title'       => $post['title'],
            'slug'        => $post['slug'],
            'status'      => $post['status'],
            'publishedAt' => $post['published_at'],
        ],
        'performance' => [
            'views'          => (int)($perf['views'] ?? 0),
            'uniqueVisitors' => (int)($perf['uniqueVisitors'] ?? 0),
            'interactions'   => (int)($perf['interactions'] ?? 0),
            'viewsToday'     => $viewsToday,
            'views7d'        => $views7d,
            'views30d'       => $views30d,
        ],
        'series' => computeBlogSeries($db, $from, $to, $granularity, $postId),
        'breakdowns' => [
            'device'   => blogEventBreakdown($db, $postId, $fromDt, $toDt, 'device_type'),
            'browser'  => blogEventBreakdown($db, $postId, $fromDt, $toDt, 'browser'),
            'os'       => blogEventBreakdown($db, $postId, $fromDt, $toDt, 'os'),
            'referrer' => blogEventBreakdown($db, $postId, $fromDt, $toDt, 'referrer_source'),
            'country'  => blogEventBreakdown($db, $postId, $fromDt, $toDt, 'country'),
        ],
        'range' => ['from' => $from, 'to' => $to],
    ];
}

function countPostViews(PDO $db, string $postId, string $fromDt, string $toDt): int {
    $stmt = $db->prepare("SELECT COUNT(*) FROM blog_post_events WHERE post_id = ? AND event_type = 'view' AND created_at >= ? AND created_at < ?");
    $stmt->execute([$postId, $fromDt, $toDt]);
    return (int)$stmt->fetchColumn();
}

// $column is only ever one of the hardcoded values below (never interpolated
// from raw user input) before it reaches the SQL string.
function blogEventBreakdown(PDO $db, string $postId, string $fromDt, string $toDt, string $column): array {
    $allowed = ['device_type', 'browser', 'os', 'referrer_source', 'country'];
    if (!in_array($column, $allowed, true)) return [];

    $stmt = $db->prepare(
        "SELECT {$column} AS label, COUNT(*) AS cnt
         FROM blog_post_events
         WHERE post_id = ? AND event_type = 'view' AND created_at >= ? AND created_at < ? AND {$column} IS NOT NULL
         GROUP BY {$column}
         ORDER BY cnt DESC
         LIMIT 8"
    );
    $stmt->execute([$postId, $fromDt, $toDt]);

    return array_map(static function (array $r): array {
        return ['label' => (string)$r['label'], 'count' => (int)$r['cnt']];
    }, $stmt->fetchAll());
}
