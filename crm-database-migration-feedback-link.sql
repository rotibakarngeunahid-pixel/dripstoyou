-- ─────────────────────────────────────────────────────────────────────────────
-- DRIP TO YOU Bali — Feedback Link Migration (additive, run after crm-database-migration.sql)
--
-- Adds shareable, expiring public links so a client can rate & comment on a
-- completed treatment themselves (no login), mirroring consent_links.
--
-- HOW TO RUN (once):
--   1. Open phpMyAdmin (Rumahweb / cPanel)
--   2. Select database: rotw4785_dripstoyou
--   3. Open the "SQL" tab
--   4. Paste the entire contents of this file and click "Go"
-- ─────────────────────────────────────────────────────────────────────────────

-- ── feedback_links — one-time-use public tokens (token itself stored hashed) ───
CREATE TABLE IF NOT EXISTS `feedback_links` (
    `id`                  VARCHAR(191) NOT NULL,
    `booking_id`          VARCHAR(191) NOT NULL,
    `token_hash`          VARCHAR(255) NOT NULL,
    `created_by_staff_id` VARCHAR(191) NULL,
    `expires_at`          DATETIME(3)  NOT NULL,
    `sent_at`             DATETIME(3)  NULL,
    `viewed_at`           DATETIME(3)  NULL,
    `used_at`             DATETIME(3)  NULL,
    `revoked_at`          DATETIME(3)  NULL,
    `created_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `feedback_links_token_hash_key` (`token_hash`),
    INDEX `feedback_links_booking_id_idx` (`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── feedbacks — one feedback per booking, submitted by the client via link ─────
CREATE TABLE IF NOT EXISTS `feedbacks` (
    `id`                 VARCHAR(191) NOT NULL,
    `booking_id`         VARCHAR(191) NOT NULL,
    `feedback_link_id`   VARCHAR(191) NULL,
    `rating`             TINYINT      NOT NULL,
    `comment_encrypted`  TEXT         NULL,
    `meets_expectation`  ENUM('YA', 'TIDAK', 'SEBAGIAN') NULL,
    `submitted_at`       DATETIME(3)  NOT NULL,
    `ip_address_hash`    VARCHAR(64)  NULL,
    `created_at`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `feedbacks_booking_id_key` (`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── Foreign keys ───────────────────────────────────────────────────────────────
ALTER TABLE `feedback_links`
    ADD CONSTRAINT `feedback_links_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `feedback_links_created_by_staff_id_fkey`
    FOREIGN KEY (`created_by_staff_id`) REFERENCES `crm_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `feedbacks`
    ADD CONSTRAINT `feedbacks_booking_id_fkey`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `feedbacks_feedback_link_id_fkey`
    FOREIGN KEY (`feedback_link_id`) REFERENCES `feedback_links`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of migration. No seed/setup step needed — feedback-link.php,
-- feedback-public.php, and feedback.php work immediately once these tables exist.
-- ─────────────────────────────────────────────────────────────────────────────
