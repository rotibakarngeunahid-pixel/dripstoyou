-- ─────────────────────────────────────────────────────────────────────────────
-- DRIP TO YOU Bali — CRM Internal Database Migration
--
-- HOW TO RUN (once):
--   1. Open phpMyAdmin (Rumahweb / cPanel)
--   2. Select database: rotw4785_dripstoyou
--   3. Open the "SQL" tab
--   4. Paste the entire contents of this file and click "Go"
--
-- This migration is ADDITIVE — it only CREATEs new tables and ADDs new columns.
-- It never modifies or drops existing website/admin columns, so the public site
-- and /admin panel keep working unchanged.
--
-- Conventions follow the existing schema (see database-setup.sql):
--   VARCHAR(191) primary/foreign keys, utf8mb4_unicode_ci, DATETIME(3).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. crm_staff — CRM user accounts (separate from website `admins`) ──────────
CREATE TABLE IF NOT EXISTS `crm_staff` (
    `id`               VARCHAR(191) NOT NULL,
    `name`             VARCHAR(100) NOT NULL,
    `email`            VARCHAR(255) NOT NULL,
    `password_hash`    VARCHAR(255) NOT NULL,
    `role`             ENUM('OWNER', 'ADMIN', 'NURSE', 'FINANCE') NOT NULL DEFAULT 'ADMIN',
    `is_active`        BOOLEAN      NOT NULL DEFAULT true,
    `permissions_json` JSON         NULL,
    `phone_encrypted`  VARCHAR(500) NULL,
    `avatar_url`       VARCHAR(500) NULL,
    `last_login_at`    DATETIME(3)  NULL,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `crm_staff_email_key` (`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 2. crm_sessions — bearer-token sessions for CRM staff ──────────────────────
CREATE TABLE IF NOT EXISTS `crm_sessions` (
    `id`                 VARCHAR(191) NOT NULL,
    `staff_id`           VARCHAR(191) NOT NULL,
    `session_token_hash` VARCHAR(255) NOT NULL,
    `ip_address_hash`    VARCHAR(255) NULL,
    `expires_at`         DATETIME(3)  NOT NULL,
    `revoked_at`         DATETIME(3)  NULL,
    `created_at`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_sessions_session_token_hash_idx` (`session_token_hash`),
    INDEX `crm_sessions_staff_id_idx` (`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 3. patients — patient database (PII encrypted at app layer) ─────────────────
CREATE TABLE IF NOT EXISTS `patients` (
    `id`                      VARCHAR(191) NOT NULL,
    `name`                    VARCHAR(100) NOT NULL,
    `phone_encrypted`         VARCHAR(500) NOT NULL,
    `phone_last4`             VARCHAR(4)   NOT NULL,
    `email_encrypted`         VARCHAR(500) NULL,
    `dob`                     DATE         NULL,
    `address_encrypted`       TEXT         NULL,
    `area_id`                 VARCHAR(191) NULL,
    `nationality`             VARCHAR(50)  NULL DEFAULT 'WNI',
    `special_notes_encrypted` TEXT         NULL,
    `booking_count`           INTEGER      NOT NULL DEFAULT 0,
    `total_spend`             DECIMAL(14,2) NOT NULL DEFAULT 0,
    `is_repeat`               BOOLEAN      NOT NULL DEFAULT false,
    `created_at`              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `patients_phone_last4_idx` (`phone_last4`),
    INDEX `patients_area_id_idx` (`area_id`),
    INDEX `patients_is_repeat_idx` (`is_repeat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 4. nurses — nurse roster (optionally linked to a CRM login) ─────────────────
CREATE TABLE IF NOT EXISTS `nurses` (
    `id`                VARCHAR(191) NOT NULL,
    `staff_id`          VARCHAR(191) NULL,
    `name`              VARCHAR(100) NOT NULL,
    `phone_encrypted`   VARCHAR(500) NOT NULL,
    `phone_last4`       VARCHAR(4)   NOT NULL,
    `email_encrypted`   VARCHAR(500) NULL,
    `is_active`         BOOLEAN      NOT NULL DEFAULT true,
    `availability_json` JSON         NULL,
    `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `nurses_staff_id_idx` (`staff_id`),
    INDEX `nurses_is_active_idx` (`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 5. bookings — ADD CRM columns (additive; existing columns untouched) ────────
-- NOTE: MySQL has no "ADD COLUMN IF NOT EXISTS". Run this section once. If you must
-- re-run, remove lines for columns that already exist (or ignore "duplicate column").
ALTER TABLE `bookings`
    ADD COLUMN `patient_id`           VARCHAR(191) NULL,
    ADD COLUMN `nurse_id`             VARCHAR(191) NULL,
    ADD COLUMN `crm_status` ENUM(
        'PENDING','NEED_CONFIRMATION','CONFIRMED','NURSE_ASSIGNED',
        'NURSE_ON_THE_WAY','SCREENING_STARTED','SCREENING_COMPLETED',
        'CONSENT_SIGNED','TREATMENT_IN_PROGRESS','TREATMENT_COMPLETED',
        'PAYMENT_COMPLETED','FOLLOW_UP','CLOSED','CANCELLED',
        'RESCHEDULED','NOT_ELIGIBLE','NO_SHOW'
    ) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `service_fee`          DECIMAL(12,2) NULL,
    ADD COLUMN `visit_fee`            DECIMAL(12,2) NULL,
    ADD COLUMN `total_fee`            DECIMAL(12,2) NULL,
    ADD COLUMN `booking_code_display` VARCHAR(20)  NULL,
    ADD INDEX `bookings_patient_id_idx` (`patient_id`),
    ADD INDEX `bookings_nurse_id_idx` (`nurse_id`),
    ADD INDEX `bookings_crm_status_idx` (`crm_status`);

-- ── 6. service_areas — ADD visit fee column (estimated_arrival_minutes exists) ──
ALTER TABLE `service_areas`
    ADD COLUMN `visit_fee_amount` DECIMAL(12,2) NULL;

-- ── 7. screenings — pre-treatment medical screening ────────────────────────────
CREATE TABLE IF NOT EXISTS `screenings` (
    `id`                       VARCHAR(191) NOT NULL,
    `booking_id`               VARCHAR(191) NOT NULL,
    `nurse_id`                 VARCHAR(191) NULL,
    `blood_pressure`           VARCHAR(20)  NULL,
    `temperature`              DECIMAL(4,1) NULL,
    `pulse`                    INTEGER      NULL,
    `has_allergy`              BOOLEAN      NOT NULL DEFAULT false,
    `allergy_notes_encrypted`  TEXT         NULL,
    `has_illness_history`      BOOLEAN      NOT NULL DEFAULT false,
    `illness_notes_encrypted`  TEXT         NULL,
    `taking_medication`        BOOLEAN      NOT NULL DEFAULT false,
    `medication_notes_encrypted` TEXT       NULL,
    `is_pregnant`              ENUM('YES','NO','NA') NOT NULL DEFAULT 'NA',
    `nurse_notes_encrypted`    TEXT         NULL,
    `conclusion`              ENUM('SAFE','NEEDS_REVIEW','NOT_RECOMMENDED') NOT NULL DEFAULT 'NEEDS_REVIEW',
    `submitted_at`             DATETIME(3)  NULL,
    `created_at`               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `screenings_booking_id_key` (`booking_id`),
    INDEX `screenings_nurse_id_idx` (`nurse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 8. consents — digital informed consent ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `consents` (
    `id`                       VARCHAR(191) NOT NULL,
    `booking_id`               VARCHAR(191) NOT NULL,
    `patient_name`             VARCHAR(100) NOT NULL,
    `patient_name_signed`      VARCHAR(100) NOT NULL,
    `signature_data_encrypted` TEXT         NULL,
    `agreed_at`                DATETIME(3)  NOT NULL,
    `ip_address_hash`          VARCHAR(255) NULL,
    `created_at`               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consents_booking_id_key` (`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 9. treatments — treatment notes + items used ───────────────────────────────
CREATE TABLE IF NOT EXISTS `treatments` (
    `id`                        VARCHAR(191) NOT NULL,
    `booking_id`                VARCHAR(191) NOT NULL,
    `nurse_id`                  VARCHAR(191) NULL,
    `checklist_json`            JSON         NULL,
    `items_used_json`           JSON         NULL,
    `nurse_notes_encrypted`     TEXT         NULL,
    `patient_condition_after`   VARCHAR(500) NULL,
    `follow_up_recommendation`  VARCHAR(500) NULL,
    `completed_at`              DATETIME(3)  NULL,
    `created_at`                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `treatments_booking_id_key` (`booking_id`),
    INDEX `treatments_nurse_id_idx` (`nurse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 10. inventory_items — medical stock ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inventory_items` (
    `id`             VARCHAR(191) NOT NULL,
    `name`           VARCHAR(200) NOT NULL,
    `category`       ENUM('CAIRAN','VITAMIN','ALAT','OBAT','LAINNYA') NOT NULL DEFAULT 'LAINNYA',
    `stock_current`  INTEGER      NOT NULL DEFAULT 0,
    `stock_minimum`  INTEGER      NOT NULL DEFAULT 5,
    `unit`           VARCHAR(20)  NOT NULL DEFAULT 'pcs',
    `expired_date`   DATE         NULL,
    `supplier`       VARCHAR(100) NULL,
    `price_per_unit` DECIMAL(12,2) NULL,
    `is_active`      BOOLEAN      NOT NULL DEFAULT true,
    `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `inventory_items_category_idx` (`category`),
    INDEX `inventory_items_is_active_idx` (`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 11. stock_movements — stock ledger (IN/OUT/ADJUSTMENT) ──────────────────────
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id`                     VARCHAR(191) NOT NULL,
    `inventory_item_id`      VARCHAR(191) NOT NULL,
    `type`                   ENUM('IN','OUT','ADJUSTMENT') NOT NULL,
    `quantity`               INTEGER      NOT NULL,
    `reference_type`         ENUM('PURCHASE_ORDER','TREATMENT','MANUAL') NULL,
    `reference_id`           VARCHAR(191) NULL,
    `notes`                  VARCHAR(500) NULL,
    `performed_by_staff_id`  VARCHAR(191) NULL,
    `created_at`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_inventory_item_id_idx` (`inventory_item_id`),
    INDEX `stock_movements_created_at_idx` (`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 12. purchase_orders ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `purchase_orders` (
    `id`                   VARCHAR(191) NOT NULL,
    `po_number`            VARCHAR(20)  NOT NULL,
    `supplier`             VARCHAR(100) NOT NULL,
    `order_date`           DATE         NOT NULL,
    `received_date`        DATE         NULL,
    `total_amount`         DECIMAL(14,2) NOT NULL DEFAULT 0,
    `status`               ENUM('DRAFT','ORDERED','RECEIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `notes`                TEXT         NULL,
    `created_by_staff_id`  VARCHAR(191) NULL,
    `created_at`           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `purchase_orders_po_number_key` (`po_number`),
    INDEX `purchase_orders_status_idx` (`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 13. purchase_order_items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
    `id`                  VARCHAR(191) NOT NULL,
    `purchase_order_id`   VARCHAR(191) NOT NULL,
    `inventory_item_id`   VARCHAR(191) NULL,
    `item_name`           VARCHAR(200) NOT NULL,
    `quantity`            INTEGER      NOT NULL,
    `price_per_unit`      DECIMAL(12,2) NOT NULL,
    `subtotal`            DECIMAL(14,2) NOT NULL,

    INDEX `purchase_order_items_purchase_order_id_idx` (`purchase_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 14. payments — booking payment tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
    `id`                    VARCHAR(191) NOT NULL,
    `booking_id`            VARCHAR(191) NOT NULL,
    `amount`                DECIMAL(12,2) NOT NULL,
    `method`                ENUM('CASH','TRANSFER','QRIS','DP_CASH','DP_TRANSFER','DP_QRIS') NOT NULL,
    `status`                ENUM('PAID','DP','UNPAID') NOT NULL DEFAULT 'UNPAID',
    `paid_at`               DATETIME(3)  NULL,
    `notes`                 VARCHAR(500) NULL,
    `recorded_by_staff_id`  VARCHAR(191) NULL,
    `created_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `payments_booking_id_idx` (`booking_id`),
    INDEX `payments_status_idx` (`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 15. expenses — operational expenses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `expenses` (
    `id`                    VARCHAR(191) NOT NULL,
    `category`              ENUM('MEDICAL_STOCK','NURSE_TRANSPORT','MARKETING','OPERATIONAL','OTHER') NOT NULL DEFAULT 'OTHER',
    `description`           VARCHAR(500) NOT NULL,
    `amount`                DECIMAL(12,2) NOT NULL,
    `expense_date`          DATE         NOT NULL,
    `reference_id`          VARCHAR(191) NULL,
    `recorded_by_staff_id`  VARCHAR(191) NULL,
    `created_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_category_idx` (`category`),
    INDEX `expenses_expense_date_idx` (`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 16. whatsapp_templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `whatsapp_templates` (
    `id`             VARCHAR(191) NOT NULL,
    `category`       ENUM('BOOKING_CONFIRMATION','REMINDER','NURSE_ASSIGNMENT','FOLLOW_UP','CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `name`           VARCHAR(100) NOT NULL,
    `body_template`  TEXT         NOT NULL,
    `is_active`      BOOLEAN      NOT NULL DEFAULT true,
    `sort_order`     INTEGER      NOT NULL DEFAULT 0,
    `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `whatsapp_templates_category_idx` (`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 17. crm_audit_logs — append-only CRM activity log ──────────────────────────
CREATE TABLE IF NOT EXISTS `crm_audit_logs` (
    `id`               VARCHAR(191) NOT NULL,
    `staff_id`         VARCHAR(191) NULL,
    `staff_name`       VARCHAR(100) NULL,
    `staff_role`       VARCHAR(20)  NULL,
    `module`           VARCHAR(50)  NOT NULL,
    `action`           VARCHAR(50)  NOT NULL,
    `entity_id`        VARCHAR(191) NULL,
    `detail`           TEXT         NULL,
    `ip_address_hash`  VARCHAR(255) NULL,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crm_audit_logs_staff_id_created_at_idx` (`staff_id`, `created_at`),
    INDEX `crm_audit_logs_module_created_at_idx` (`module`, `created_at`),
    INDEX `crm_audit_logs_created_at_idx` (`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Foreign keys ───────────────────────────────────────────────────────────────
ALTER TABLE `crm_sessions`
    ADD CONSTRAINT `crm_sessions_staff_id_fkey`
    FOREIGN KEY (`staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `patients`
    ADD CONSTRAINT `patients_area_id_fkey`
    FOREIGN KEY (`area_id`) REFERENCES `service_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `nurses`
    ADD CONSTRAINT `nurses_staff_id_fkey`
    FOREIGN KEY (`staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `bookings`
    ADD CONSTRAINT `bookings_patient_id_fkey`
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `bookings_nurse_id_fkey`
    FOREIGN KEY (`nurse_id`) REFERENCES `nurses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `screenings`
    ADD CONSTRAINT `screenings_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `screenings_nurse_id_fkey`
    FOREIGN KEY (`nurse_id`) REFERENCES `nurses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `consents`
    ADD CONSTRAINT `consents_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `treatments`
    ADD CONSTRAINT `treatments_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `treatments_nurse_id_fkey`
    FOREIGN KEY (`nurse_id`) REFERENCES `nurses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `stock_movements`
    ADD CONSTRAINT `stock_movements_inventory_item_id_fkey`
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `stock_movements_performed_by_staff_id_fkey`
    FOREIGN KEY (`performed_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `purchase_orders`
    ADD CONSTRAINT `purchase_orders_created_by_staff_id_fkey`
    FOREIGN KEY (`created_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `purchase_order_items`
    ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey`
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `purchase_order_items_inventory_item_id_fkey`
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payments`
    ADD CONSTRAINT `payments_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `payments_recorded_by_staff_id_fkey`
    FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `expenses`
    ADD CONSTRAINT `expenses_recorded_by_staff_id_fkey`
    FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `crm_audit_logs`
    ADD CONSTRAINT `crm_audit_logs_staff_id_fkey`
    FOREIGN KEY (`staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Seed: default WhatsApp templates ───────────────────────────────────────────
INSERT INTO `whatsapp_templates` (`id`, `category`, `name`, `body_template`, `is_active`, `sort_order`) VALUES
    (REPLACE(UUID(),'-',''), 'BOOKING_CONFIRMATION', 'Konfirmasi Booking',
     'Halo {nama} 👋\n\nBooking IV Therapy Anda sudah kami terima:\n🗓️ {tanggal} pukul {jam} WITA\n💉 {layanan}\n📍 {area}\n\nTim kami akan menghubungi Anda untuk konfirmasi. Terima kasih telah memilih Drips To You Bali! 🌿', true, 1),
    (REPLACE(UUID(),'-',''), 'REMINDER', 'Reminder Pasien',
     'Halo {nama}, ini pengingat untuk sesi IV Therapy Anda besok:\n🗓️ {tanggal} pukul {jam} WITA\n💉 {layanan}\n📍 {area}\n\nMohon pastikan Anda sudah cukup terhidrasi. Sampai jumpa! 🌿', true, 2),
    (REPLACE(UUID(),'-',''), 'NURSE_ASSIGNMENT', 'Penugasan Nurse',
     'Halo {nama}, nurse {nurse} akan menangani sesi IV Therapy Anda:\n🗓️ {tanggal} pukul {jam} WITA\n💉 {layanan}\n📍 {area}\n\nNurse kami akan menghubungi Anda saat dalam perjalanan. 🌿', true, 3),
    (REPLACE(UUID(),'-',''), 'FOLLOW_UP', 'Follow-up Pasca Treatment',
     'Halo {nama}, terima kasih telah mempercayakan IV Therapy Anda kepada Drips To You Bali. 🌿\n\nSemoga Anda merasa lebih segar! Jaga hidrasi 24 jam ke depan. Jika ada keluhan, jangan ragu menghubungi kami.', true, 4)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ─────────────────────────────────────────────────────────────────────────────
-- End of CRM migration. After importing, seed the first OWNER account by visiting
-- (once) the seed endpoint:  POST /php-api/crm/seed.php  with header
--   X-Seed-Secret: <SEED_SECRET from php-api/config.php>
-- ─────────────────────────────────────────────────────────────────────────────
