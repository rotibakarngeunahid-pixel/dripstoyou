-- ─────────────────────────────────────────────────────────────────────────────
-- DRIP TO YOU Bali — Consent Link Migration (additive, run after crm-database-migration.sql)
--
-- Adds shareable, expiring public links so a client can fill informed consent
-- themselves (instead of only the nurse handing over her phone in person).
--
-- HOW TO RUN (once):
--   1. Open phpMyAdmin (Rumahweb / cPanel)
--   2. Select database: rotw4785_dripstoyou
--   3. Open the "SQL" tab
--   4. Paste the entire contents of this file and click "Go"
-- ─────────────────────────────────────────────────────────────────────────────

-- ── consent_links — one-time-use public tokens (token itself stored hashed) ────
CREATE TABLE IF NOT EXISTS `consent_links` (
    `id`                  VARCHAR(191) NOT NULL,
    `booking_id`          VARCHAR(191) NOT NULL,
    `token_hash`          VARCHAR(255) NOT NULL,
    `created_by_staff_id` VARCHAR(191) NULL,
    `expires_at`          DATETIME(3)  NOT NULL,
    `used_at`             DATETIME(3)  NULL,
    `revoked_at`          DATETIME(3)  NULL,
    `created_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consent_links_token_hash_key` (`token_hash`),
    INDEX `consent_links_booking_id_idx` (`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── consents — track who actually typed the consent in (legal evidence) ────────
ALTER TABLE `consents`
    ADD COLUMN `filled_by` ENUM('NURSE', 'CLIENT') NOT NULL DEFAULT 'NURSE' AFTER `consent_language`,
    ADD COLUMN `consent_link_id` VARCHAR(191) NULL AFTER `filled_by`;

-- ── Foreign keys ───────────────────────────────────────────────────────────────
ALTER TABLE `consent_links`
    ADD CONSTRAINT `consent_links_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `consent_links_created_by_staff_id_fkey`
    FOREIGN KEY (`created_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `consents`
    ADD CONSTRAINT `consents_consent_link_id_fkey`
    FOREIGN KEY (`consent_link_id`) REFERENCES `consent_links`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of migration. No seed/setup step needed — consent-link.php and
-- consent-public.php work immediately once these tables/columns exist.
-- ─────────────────────────────────────────────────────────────────────────────
