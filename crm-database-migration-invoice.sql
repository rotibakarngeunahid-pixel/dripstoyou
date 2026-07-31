-- ─────────────────────────────────────────────────────────────────────────────
-- DRIP TO YOU Bali — CRM Invoice feature migration
--
-- HOW TO RUN (once):
--   1. Open phpMyAdmin (Rumahweb / cPanel)
--   2. Select database: rotw4785_dripstoyou
--   3. Open the "SQL" tab
--   4. Paste the entire contents of this file and click "Go"
--
-- Additive only: new columns on `bookings`/`treatments`, an ENUM widen on
-- `payments.method`, and one new small table (`invoices` — invoice
-- numbering + issuance snapshot, not a duplicate transaction ledger; the
-- actual booking/payment/treatment data stays joined live at read time).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. bookings — add-on / other charge + discount (invoice line items) ────────
ALTER TABLE `bookings`
    ADD COLUMN `addon_label`    VARCHAR(100)  NULL,
    ADD COLUMN `addon_fee`      DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN `other_label`    VARCHAR(100)  NULL DEFAULT 'Other',
    ADD COLUMN `other_fee`      DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN `discount_type`  ENUM('NONE','PERCENT','NOMINAL') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ── 2. treatments — supervising doctor (free text, same treatment as nurse name) ─
ALTER TABLE `treatments`
    ADD COLUMN `doctor_name` VARCHAR(100) NULL;

-- ── 3. payments — add Credit/Debit Card as a real payment method ───────────────
ALTER TABLE `payments`
    MODIFY COLUMN `method` ENUM('CASH','TRANSFER','QRIS','CARD','DP_CASH','DP_TRANSFER','DP_QRIS','DP_CARD') NOT NULL;

-- ── 4. invoices — invoice numbering + issuance snapshot ────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
    `id`                  VARCHAR(191) NOT NULL,
    `booking_id`          VARCHAR(191) NOT NULL,
    `invoice_number`      VARCHAR(30)  NOT NULL,
    `issued_date`         DATE         NOT NULL,
    `issued_time`         VARCHAR(5)   NOT NULL,
    `payment_method`      VARCHAR(20)  NULL,
    `created_by_staff_id` VARCHAR(191) NULL,
    `created_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_booking_id_key` (`booking_id`),
    UNIQUE INDEX `invoices_invoice_number_key` (`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `invoices`
    ADD CONSTRAINT `invoices_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `invoices_created_by_staff_id_fkey`
    FOREIGN KEY (`created_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of invoice migration.
-- ─────────────────────────────────────────────────────────────────────────────
