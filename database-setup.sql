-- DRIP TO YOU Bali — Database Setup SQL
-- Import file ini ke phpMyAdmin Rumahweb SEBELUM deploy Vercel
-- Jalankan di database: rotw4785_dripstoyou

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN_OPERASIONAL', 'CONTENT_ADMIN') NOT NULL DEFAULT 'ADMIN_OPERASIONAL',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
    `mfa_secret_encrypted` VARCHAR(500) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `admin_id` VARCHAR(191) NOT NULL,
    `session_token_hash` VARCHAR(255) NOT NULL,
    `ip_address_hash` VARCHAR(255) NULL,
    `user_agent_hash` VARCHAR(255) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_sessions_session_token_hash_idx`(`session_token_hash`),
    INDEX `admin_sessions_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `email_hash` VARCHAR(255) NOT NULL,
    `ip_address_hash` VARCHAR(255) NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `failure_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_attempts_email_hash_created_at_idx`(`email_hash`, `created_at`),
    INDEX `login_attempts_ip_address_hash_created_at_idx`(`ip_address_hash`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `product_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `full_description` TEXT NULL,
    `price_amount` DECIMAL(12,2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
    `price_label` VARCHAR(100) NULL,
    `prices_json` JSON NULL,
    `duration_minutes` INTEGER NULL,
    `image_url` VARCHAR(500) NULL,
    `label` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `show_on_homepage` BOOLEAN NOT NULL DEFAULT false,
    `homepage_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_is_active_show_on_homepage_idx`(`is_active`, `show_on_homepage`),
    INDEX `products_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_benefits` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `benefit_text` VARCHAR(500) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `booking_code` VARCHAR(20) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone_encrypted` VARCHAR(500) NOT NULL,
    `customer_phone_last4` VARCHAR(4) NOT NULL,
    `booking_date` DATE NOT NULL,
    `booking_time` VARCHAR(5) NOT NULL,
    `people_count` INTEGER NOT NULL DEFAULT 1,
    `location_type` ENUM('VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA') NOT NULL,
    `service_area_id` VARCHAR(191) NULL,
    `address_encrypted` TEXT NOT NULL,
    `notes_encrypted` TEXT NULL,
    `status` ENUM('BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'BARU',
    `source` ENUM('WEBSITE', 'MANUAL_ADMIN') NOT NULL DEFAULT 'WEBSITE',
    `created_by_admin_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_booking_code_key`(`booking_code`),
    INDEX `bookings_status_booking_date_idx`(`status`, `booking_date`),
    INDEX `bookings_customer_phone_last4_idx`(`customer_phone_last4`),
    INDEX `bookings_booking_date_idx`(`booking_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `old_status` ENUM('BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL,
    `new_status` ENUM('BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL,
    `changed_by_admin_id` VARCHAR(191) NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_settings` (
    `id` VARCHAR(191) NOT NULL,
    `day_of_week` INTEGER NOT NULL,
    `is_open` BOOLEAN NOT NULL DEFAULT true,
    `open_time` VARCHAR(5) NOT NULL DEFAULT '08:00',
    `close_time` VARCHAR(5) NOT NULL DEFAULT '22:00',
    `slot_duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `max_bookings_per_slot` INTEGER NOT NULL DEFAULT 3,
    `min_prebooking_minutes` INTEGER NOT NULL DEFAULT 120,

    UNIQUE INDEX `schedule_settings_day_of_week_key`(`day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocked_dates` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `reason` VARCHAR(200) NULL,
    `is_full_day` BOOLEAN NOT NULL DEFAULT true,
    `start_time` VARCHAR(5) NULL,
    `end_time` VARCHAR(5) NULL,
    `created_by_admin_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blocked_dates_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_areas` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `estimated_arrival_minutes` INTEGER NULL,
    `extra_fee_amount` INTEGER NULL,
    `note` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `service_areas_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value_encrypted_or_json` TEXT NOT NULL,
    `updated_by_admin_id` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currency_settings` (
    `code` VARCHAR(10) NOT NULL,
    `symbol` VARCHAR(8) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `decimal_places` INTEGER NOT NULL DEFAULT 0,
    `manual_rate_to_idr` DECIMAL(18,6) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `source_lang` VARCHAR(10) NOT NULL DEFAULT 'auto',
    `translations_json` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` VARCHAR(191) NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `treatment_tag` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_items` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(300) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legal_pages` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PRIVACY_POLICY', 'TERMS_CONDITIONS', 'MEDICAL_DISCLAIMER') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `updated_by_admin_id` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `legal_pages_type_key`(`type`),
    UNIQUE INDEX `legal_pages_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actor_admin_id` VARCHAR(191) NULL,
    `action` ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_BOOKING', 'UPDATE_BOOKING_STATUS', 'DELETE_BOOKING', 'EXPORT_BOOKINGS', 'UPDATE_SCHEDULE', 'UPDATE_WHATSAPP', 'UPDATE_AREA', 'UPDATE_LEGAL_PAGE', 'UPDATE_ADMIN', 'CREATE_ADMIN', 'DELETE_ADMIN') NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` VARCHAR(100) NULL,
    `metadata_json` TEXT NULL,
    `ip_address_hash` VARCHAR(255) NULL,
    `user_agent_hash` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_admin_id_created_at_idx`(`actor_admin_id`, `created_at`),
    INDEX `audit_logs_action_created_at_idx`(`action`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_events` (
    `id` VARCHAR(191) NOT NULL,
    `event_type` ENUM('BRUTE_FORCE_LOGIN', 'RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_ADMIN', 'INVALID_CSRF', 'SUSPICIOUS_UPLOAD') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `actor_admin_id` VARCHAR(191) NULL,
    `ip_address_hash` VARCHAR(255) NULL,
    `metadata_json` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `security_events_event_type_created_at_idx`(`event_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_benefits` ADD CONSTRAINT `product_benefits_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_faqs` ADD CONSTRAINT `product_faqs_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_service_area_id_fkey` FOREIGN KEY (`service_area_id`) REFERENCES `service_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_status_history` ADD CONSTRAINT `booking_status_history_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_status_history` ADD CONSTRAINT `booking_status_history_changed_by_admin_id_fkey` FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocked_dates` ADD CONSTRAINT `blocked_dates_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_updated_by_admin_id_fkey` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legal_pages` ADD CONSTRAINT `legal_pages_updated_by_admin_id_fkey` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_admin_id_fkey` FOREIGN KEY (`actor_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `security_events` ADD CONSTRAINT `security_events_actor_admin_id_fkey` FOREIGN KEY (`actor_admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedCurrencySettings
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
