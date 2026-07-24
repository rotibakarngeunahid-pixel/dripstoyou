-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — migration: fitur Blog (docs/PRD-Blog.md §5)
--
-- Membuat dua tabel baru: `blog_categories` dan `blog_posts`.
-- Konvensi mengikuti tabel `products` yang sudah ada di database-setup.sql:
--   • PK `VARCHAR(191)` (diisi generateId() = 30 char hex, BUKAN CHAR(36) —
--     PRD menyebut CHAR(36) tapi seluruh codebase memakai VARCHAR(191)).
--   • Timestamp `DATETIME(3)`.
--   • Slug unik dengan regex `^[a-z0-9-]+$` (divalidasi di app layer).
--
-- Aman dijalankan berulang: CREATE TABLE IF NOT EXISTS + ON DUPLICATE KEY.
-- Foreign key dipasang di ALTER terpisah di bawah supaya tabel tetap terbuat
-- meski shared hosting menolak FK.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `blog_categories` (
    `id`               VARCHAR(191) NOT NULL,
    `name`             VARCHAR(120) NOT NULL,
    `slug`             VARCHAR(160) NOT NULL,
    `description`      VARCHAR(500) NULL,
    `meta_title`       VARCHAR(70)  NULL,
    `meta_description` VARCHAR(200) NULL,
    `sort_order`       INTEGER      NOT NULL DEFAULT 0,
    `is_active`        BOOLEAN      NOT NULL DEFAULT true,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blog_categories_slug_key` (`slug`),
    INDEX `blog_categories_active_sort_idx` (`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_posts` (
    `id`               VARCHAR(191) NOT NULL,
    `category_id`      VARCHAR(191) NULL,
    `title`            VARCHAR(200) NOT NULL,
    `slug`             VARCHAR(200) NOT NULL,
    `excerpt`          VARCHAR(500) NULL,
    -- `content`        : HTML hasil render Markdown (turunan, disimpan untuk reuse).
    -- `content_source` : Markdown mentah — INI sumber kebenaran yang dirender ulang
    --                    di halaman publik, sehingga tidak ada HTML dari DB yang
    --                    pernah dipercaya mentah-mentah (lihat src/lib/markdown.ts).
    `content`          MEDIUMTEXT   NOT NULL,
    `content_source`   MEDIUMTEXT   NULL,
    `cover_image_url`  VARCHAR(500) NULL,
    `cover_image_alt`  VARCHAR(255) NULL,
    `meta_title`       VARCHAR(70)  NULL,
    `meta_description` VARCHAR(200) NULL,
    `canonical_url`    VARCHAR(500) NULL,
    `og_image_url`     VARCHAR(500) NULL,
    `author_name`      VARCHAR(120) NULL,
    `author_admin_id`  VARCHAR(191) NULL,
    `status`           ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
    `published_at`     DATETIME(3)  NULL,
    `reading_minutes`  INTEGER      NULL,
    `view_count`       INTEGER      NOT NULL DEFAULT 0,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blog_posts_slug_key` (`slug`),
    -- Query publik: WHERE status='published' AND published_at <= NOW() ORDER BY published_at DESC
    INDEX `blog_posts_status_published_idx` (`status`, `published_at`),
    INDEX `blog_posts_category_idx` (`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kategori awal — silakan diubah/ditambah dari /admin/blog/categories.
INSERT INTO `blog_categories` (`id`, `name`, `slug`, `description`, `sort_order`, `is_active`)
VALUES
    (REPLACE(UUID(),'-',''), 'IV Therapy Education', 'iv-therapy-education',
     'How IV drips work, what is inside them, and what to expect during a visit.', 1, true),
    (REPLACE(UUID(),'-',''), 'Recovery & Wellness', 'recovery-wellness',
     'Hydration, recovery, and everyday wellness topics for travellers in Bali.', 2, true),
    (REPLACE(UUID(),'-',''), 'Bali Travel Tips', 'bali-travel-tips',
     'Practical guides for staying well while travelling around Bali.', 3, true)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Foreign key: artikel tetap hidup kalau kategorinya dihapus (category_id → NULL).
-- Jalankan terpisah; abaikan error 1826/1022 kalau constraint sudah ada.
ALTER TABLE `blog_posts`
    ADD CONSTRAINT `blog_posts_category_fk`
    FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL;
