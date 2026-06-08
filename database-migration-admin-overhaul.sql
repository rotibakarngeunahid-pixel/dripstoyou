-- Admin overhaul migration for existing Drips To You databases.
-- Safe to run multiple times — all statements are idempotent.

-- ── products.currency ────────────────────────────────────────────────────────
SET @col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'currency');
SET @sql = IF(@col = 0,
    "ALTER TABLE `products` ADD COLUMN `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR' AFTER `price_amount`",
    "SELECT 'products.currency already exists'");
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── products.price_amount type (safe to re-run on DECIMAL) ───────────────────
ALTER TABLE `products` MODIFY COLUMN `price_amount` DECIMAL(12,2) NOT NULL;

-- ── currency_settings table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `currency_settings` (
  `code` VARCHAR(10) NOT NULL,
  `symbol` VARCHAR(8) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `decimal_places` INTEGER NOT NULL DEFAULT 0,
  `manual_rate_to_idr` DECIMAL(18,6) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `currency_settings` (`code`, `symbol`, `name`, `decimal_places`, `is_active`) VALUES
  ('IDR', 'Rp', 'Indonesian Rupiah', 0, true),
  ('USD', '$', 'US Dollar', 2, true),
  ('AUD', 'A$', 'Australian Dollar', 2, true),
  ('EUR', '€', 'Euro', 2, true),
  ('SGD', 'S$', 'Singapore Dollar', 2, true)
ON DUPLICATE KEY UPDATE
  `symbol` = VALUES(`symbol`),
  `name` = VALUES(`name`),
  `decimal_places` = VALUES(`decimal_places`);

-- ── site_settings.default_currency ───────────────────────────────────────────
INSERT INTO `site_settings` (`key`, `value_encrypted_or_json`, `updated_by_admin_id`, `updated_at`)
VALUES ('default_currency', 'IDR', NULL, NOW())
ON DUPLICATE KEY UPDATE
  `value_encrypted_or_json` = VALUES(`value_encrypted_or_json`),
  `updated_at` = VALUES(`updated_at`);

-- ── faqs table (create base version if missing) ───────────────────────────────
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(191) NOT NULL,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── products.prices_json ─────────────────────────────────────────────────────
SET @col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'prices_json');
SET @sql = IF(@col = 0,
    'ALTER TABLE `products` ADD COLUMN `prices_json` JSON NULL AFTER `price_label`',
    "SELECT 'products.prices_json already exists'");
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── faqs.source_lang ─────────────────────────────────────────────────────────
SET @col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'source_lang');
SET @sql = IF(@col = 0,
    "ALTER TABLE `faqs` ADD COLUMN `source_lang` VARCHAR(10) NOT NULL DEFAULT 'auto'",
    "SELECT 'faqs.source_lang already exists'");
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── faqs.translations_json ────────────────────────────────────────────────────
SET @col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'translations_json');
SET @sql = IF(@col = 0,
    'ALTER TABLE `faqs` ADD COLUMN `translations_json` JSON NULL',
    "SELECT 'faqs.translations_json already exists'");
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
