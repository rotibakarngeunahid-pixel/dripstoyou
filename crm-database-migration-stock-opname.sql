-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — CRM migration: Stock Opname (physical stock take)
--
-- Adds a proper stock-opname (physical count reconciliation) trail on top of
-- the existing inventory_items / stock_movements tables:
--   - stock_opnames       — one row per counting session (header)
--   - stock_opname_items  — one row per item counted in that session (detail,
--                           full snapshot even when counted == system so the
--                           session proves every active item was checked)
--
-- Run this once against the production DB (see php-api/crm-database-migration.sql
-- for the base CRM schema this extends). Safe to re-run: CREATE TABLE IF NOT
-- EXISTS + the ALTER MODIFY are idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- Widen the existing movement-source enum so opname-driven adjustments are
-- distinguishable from ad-hoc manual adjustments in the stock ledger.
ALTER TABLE `stock_movements`
    MODIFY COLUMN `reference_type` ENUM('PURCHASE_ORDER','TREATMENT','MANUAL','STOCK_OPNAME') NULL;

CREATE TABLE IF NOT EXISTS `stock_opnames` (
    `id`                     VARCHAR(191) NOT NULL,
    `opname_date`            DATE         NOT NULL,
    `notes`                  VARCHAR(500) NULL,
    `total_items`            INTEGER      NOT NULL DEFAULT 0,
    `total_variance`         INTEGER      NOT NULL DEFAULT 0,
    `performed_by_staff_id`  VARCHAR(191) NULL,
    `created_at`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_opnames_created_at_idx` (`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_opname_items` (
    `id`                 VARCHAR(191) NOT NULL,
    `stock_opname_id`    VARCHAR(191) NOT NULL,
    `inventory_item_id`  VARCHAR(191) NULL,
    `item_name`          VARCHAR(200) NOT NULL,
    `unit`               VARCHAR(20)  NOT NULL DEFAULT 'pcs',
    `system_qty`         INTEGER      NOT NULL,
    `counted_qty`        INTEGER      NOT NULL,
    `variance`           INTEGER      NOT NULL,

    INDEX `stock_opname_items_stock_opname_id_idx` (`stock_opname_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Foreign keys ───────────────────────────────────────────────────────────────
ALTER TABLE `stock_opnames`
    ADD CONSTRAINT `stock_opnames_performed_by_staff_id_fkey`
    FOREIGN KEY (`performed_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `stock_opname_items`
    ADD CONSTRAINT `stock_opname_items_stock_opname_id_fkey`
    FOREIGN KEY (`stock_opname_id`) REFERENCES `stock_opnames`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `stock_opname_items_inventory_item_id_fkey`
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of stock-opname migration.
-- ─────────────────────────────────────────────────────────────────────────────
