-- Migrations manual untuk tabel baru PRD Rev.V2
-- Jalankan SQL ini di database MySQL setelah memastikan koneksi aktif.
-- Command alternatif: npx prisma db push (setelah database berjalan)

-- ─────────────────────────────────────────────
-- Update tabel faqs (tambah kolom category, timestamps)
-- ─────────────────────────────────────────────
ALTER TABLE faqs
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER id,
  ADD COLUMN IF NOT EXISTS created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Tambah index
CREATE INDEX IF NOT EXISTS faqs_is_active_sort_order_idx ON faqs(is_active, sort_order);

-- ─────────────────────────────────────────────
-- Tabel social_links (BARU)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
  id            VARCHAR(191) NOT NULL,
  platform      ENUM('WHATSAPP','INSTAGRAM','TIKTOK','FACEBOOK','GOOGLE_MAPS','EMAIL','WEBSITE','CUSTOM') NOT NULL,
  label         VARCHAR(100) NOT NULL,
  value         VARCHAR(500) NOT NULL,
  normalized_url VARCHAR(500) NULL,
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX social_links_is_active_sort_order_idx (is_active, sort_order)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- Update enum AuditAction (tambah nilai baru)
-- ─────────────────────────────────────────────
ALTER TABLE audit_logs
  MODIFY COLUMN action ENUM(
    'LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT',
    'CREATE_PRODUCT','UPDATE_PRODUCT','DELETE_PRODUCT',
    'CREATE_BOOKING','UPDATE_BOOKING_STATUS','DELETE_BOOKING','EXPORT_BOOKINGS',
    'UPDATE_SCHEDULE','UPDATE_WHATSAPP','UPDATE_AREA','UPDATE_LEGAL_PAGE',
    'UPDATE_ADMIN','CREATE_ADMIN','DELETE_ADMIN',
    'UPDATE_ABOUT','UPDATE_FAQ','UPDATE_SOCIAL_LINK'
  ) NOT NULL;

-- ─────────────────────────────────────────────
-- Tabel legal_pages (BARU)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_pages (
  id                 VARCHAR(191) NOT NULL,
  type               ENUM('PRIVACY_POLICY','TERMS_CONDITIONS','MEDICAL_DISCLAIMER') NOT NULL,
  title              VARCHAR(200) NOT NULL,
  slug               VARCHAR(100) NOT NULL,
  content            LONGTEXT     NOT NULL,
  is_published       TINYINT(1)   NOT NULL DEFAULT 1,
  updated_by_admin_id VARCHAR(191) NULL,
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY legal_pages_type_key (type),
  UNIQUE KEY legal_pages_slug_key (slug),
  CONSTRAINT legal_pages_updated_by_admin_id_fkey
    FOREIGN KEY (updated_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default legal pages
INSERT IGNORE INTO legal_pages (id, type, title, slug, content, is_published, updated_at) VALUES
  (UUID(), 'PRIVACY_POLICY',     'Kebijakan Privasi',    'privacy-policy',     'Konten kebijakan privasi akan ditambahkan segera.',    1, NOW()),
  (UUID(), 'TERMS_CONDITIONS',   'Syarat & Ketentuan',   'terms-conditions',   'Konten syarat dan ketentuan akan ditambahkan segera.', 1, NOW()),
  (UUID(), 'MEDICAL_DISCLAIMER', 'Disclaimer Medis',     'medical-disclaimer', 'Konten disclaimer medis akan ditambahkan segera.',     1, NOW());
