-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — CRM migration: manageable Inventory Categories
--
-- Replaces the fixed inventory_items.category ENUM('CAIRAN','VITAMIN','ALAT',
-- 'OBAT','LAINNYA') with a real lookup table (inventory_categories) so admins
-- can add/rename/deactivate/delete categories from the CRM UI instead of
-- being stuck with a hardcoded list.
--
-- Order matters — run top to bottom. Each statement is safe to re-run
-- individually (CREATE TABLE IF NOT EXISTS, ON DUPLICATE KEY UPDATE for the
-- seed, and the later ALTERs simply error harmlessly if already applied).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `inventory_categories` (
    `id`          VARCHAR(191) NOT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `sort_order`  INTEGER      NOT NULL DEFAULT 0,
    `is_active`   BOOLEAN      NOT NULL DEFAULT true,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `inventory_categories_name_key` (`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed with the exact same identifiers the old ENUM used, so the backfill
-- join below matches every existing row.
INSERT INTO `inventory_categories` (`id`, `name`, `sort_order`, `is_active`) VALUES
    (REPLACE(UUID(),'-',''), 'CAIRAN',  1, true),
    (REPLACE(UUID(),'-',''), 'VITAMIN', 2, true),
    (REPLACE(UUID(),'-',''), 'ALAT',    3, true),
    (REPLACE(UUID(),'-',''), 'OBAT',    4, true),
    (REPLACE(UUID(),'-',''), 'LAINNYA', 5, true)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Add the new FK column, backfill from the old enum value, then lock it down.
ALTER TABLE `inventory_items` ADD COLUMN `category_id` VARCHAR(191) NULL AFTER `category`;

UPDATE `inventory_items` i
JOIN `inventory_categories` c ON c.name = i.category
SET i.category_id = c.id;

ALTER TABLE `inventory_items` MODIFY COLUMN `category_id` VARCHAR(191) NOT NULL;
ALTER TABLE `inventory_items` ADD INDEX `inventory_items_category_id_idx` (`category_id`);
ALTER TABLE `inventory_items`
    ADD CONSTRAINT `inventory_items_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Old ENUM column no longer needed (also drops its lone index automatically).
ALTER TABLE `inventory_items` DROP COLUMN `category`;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of inventory-categories migration.
-- ─────────────────────────────────────────────────────────────────────────────
