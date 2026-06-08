-- Admin overhaul migration for existing Drips To You databases.

ALTER TABLE `products`
  ADD COLUMN `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR' AFTER `price_amount`;

ALTER TABLE `products`
  MODIFY COLUMN `price_amount` DECIMAL(12,2) NOT NULL;

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

INSERT INTO `site_settings` (`key`, `value_encrypted_or_json`, `updated_by_admin_id`, `updated_at`)
VALUES ('default_currency', 'IDR', NULL, NOW())
ON DUPLICATE KEY UPDATE
  `value_encrypted_or_json` = VALUES(`value_encrypted_or_json`),
  `updated_at` = VALUES(`updated_at`);

-- Create faqs table if it does not exist yet (for databases set up before FAQ feature was added).
-- If the table already exists this is a no-op.
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(191) NOT NULL,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add translation columns to faqs.
-- NOTE: MySQL 8 does not support ADD COLUMN IF NOT EXISTS.
-- If these columns already exist you will see "Duplicate column name" errors — that is safe to ignore.
ALTER TABLE `faqs`
  ADD COLUMN `source_lang` VARCHAR(10) NOT NULL DEFAULT 'auto',
  ADD COLUMN `translations_json` JSON NULL;
