-- ─────────────────────────────────────────────────────────────────────────────
-- DRIP TO YOU Bali — Blog Analytics Migration (additive, run after database-migration-blog.sql)
--
-- Adds first-party event tracking for the public blog (page views, CTA
-- clicks, in-article link clicks). No PII stored: `visitor_id` is a random
-- client-generated cookie value, `ip_hash` is a one-way SHA-256 hash used
-- only for abuse rate-limiting. `event_type` is a free VARCHAR (not ENUM) so
-- new event types can be added later without another migration.
--
-- HOW TO RUN (once):
--   1. Open phpMyAdmin (Rumahweb / cPanel)
--   2. Select the production database
--   3. Open the "SQL" tab
--   4. Paste the entire contents of this file and click "Go"
-- ─────────────────────────────────────────────────────────────────────────────

-- ── blog_post_events — raw analytics events, one row per view/click ────────────
CREATE TABLE IF NOT EXISTS `blog_post_events` (
    `id`              VARCHAR(191) NOT NULL,
    `post_id`         VARCHAR(191) NOT NULL,
    `event_type`      VARCHAR(40)  NOT NULL,
    `visitor_id`      VARCHAR(64)  NOT NULL,
    `ip_hash`         VARCHAR(64)  NOT NULL,
    `referrer_host`   VARCHAR(255) NULL,
    `referrer_source` VARCHAR(40)  NULL,
    `device_type`     VARCHAR(20)  NULL,
    `browser`         VARCHAR(30)  NULL,
    `os`              VARCHAR(30)  NULL,
    `country`         VARCHAR(2)   NULL,
    `meta_json`       VARCHAR(500) NULL,
    `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blog_post_events_post_type_created_idx` (`post_id`, `event_type`, `created_at`),
    INDEX `blog_post_events_type_created_idx` (`event_type`, `created_at`),
    INDEX `blog_post_events_visitor_idx` (`visitor_id`, `post_id`, `created_at`),
    INDEX `blog_post_events_iphash_created_idx` (`ip_hash`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Foreign key ──────────────────────────────────────────────────────────────
ALTER TABLE `blog_post_events`
    ADD CONSTRAINT `blog_post_events_post_id_fkey`
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of migration. No seed/setup step needed — blog-track.php and
-- admin/blog-analytics.php work immediately once this table exists.
-- `blog_posts.view_count` already exists (database-migration-blog.sql) and
-- starts getting incremented by blog-track.php once deployed; no ALTER needed.
-- ─────────────────────────────────────────────────────────────────────────────
