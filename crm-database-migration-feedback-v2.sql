-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — migration: Feedback form v2 (additive)
--
-- Expands the single-question feedback form (overall rating + optional
-- comment + optional expectation match) into the full multi-section form:
-- nurse rating + aspect checkboxes, punctuality, comfort rating, referral
-- source, and rebook intent.
--
-- Additive only — every new column is nullable, existing rows are untouched.
-- `feedbacks.rating` keeps its meaning (now labelled "Overall Rating" in the
-- UI) and `meets_expectation` keeps its existing enum values (YA/TIDAK/
-- SEBAGIAN map to Yes/No/Partially) — old feedback rows stay fully readable.
-- Safe to re-run: ignore "Duplicate column name" if already applied.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `feedbacks`
    ADD COLUMN `nurse_rating` TINYINT NULL AFTER `rating`,
    ADD COLUMN `nurse_aspects_json` JSON NULL AFTER `nurse_rating`,
    ADD COLUMN `punctuality` VARCHAR(20) NULL AFTER `meets_expectation`,
    ADD COLUMN `comfort_rating` TINYINT NULL AFTER `punctuality`,
    ADD COLUMN `referral_source` VARCHAR(30) NULL AFTER `comfort_rating`,
    ADD COLUMN `referral_source_other` VARCHAR(191) NULL AFTER `referral_source`,
    ADD COLUMN `rebook_intent` VARCHAR(20) NULL AFTER `referral_source_other`;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of feedback-v2 migration.
-- ─────────────────────────────────────────────────────────────────────────────
