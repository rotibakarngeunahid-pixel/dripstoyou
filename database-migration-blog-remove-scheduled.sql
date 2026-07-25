-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — migration: hapus fitur "tayang berjadwal" (docs/PRD-Blog.md §7.4)
--
-- Status `scheduled` dicabut: endpoint publik (php-api/blog.php) selalu
-- memfilter `status='published'` secara eksplisit, jadi artikel `scheduled`
-- tidak pernah tayang otomatis saat `published_at` tiba — gate yang
-- didokumentasikan di PRD tidak pernah benar-benar berjalan. Daripada
-- diperbaiki, fitur ini dihapus dan publish kembali selalu manual.
--
-- Aman dijalankan berulang: UPDATE dulu (baris `scheduled` → `draft`, sama
-- seperti perilakunya di publik selama ini), baru ALTER ENUM.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE `blog_posts` SET `status` = 'draft' WHERE `status` = 'scheduled';

ALTER TABLE `blog_posts`
    MODIFY `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft';
