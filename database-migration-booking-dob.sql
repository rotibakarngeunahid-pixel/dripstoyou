-- ─────────────────────────────────────────────────────────────────────────────
-- Drips To You - Bali — migration: Date of Birth (DOB) on bookings
--
-- Captures the patient's date of birth at the moment of booking (public
-- website form) so age can always be derived from a permanent, accurate
-- source instead of a manually-typed "age" number that goes stale.
--
-- `patients.dob` already exists (see crm-database-migration.sql) — this adds
-- the same column to `bookings` because public-website bookings are created
-- before any `patients` row exists (patient linking only happens once a
-- booking reaches crm_status CONFIRMED — see crmEnsurePatientForBooking()).
-- The booking's dob is later copied onto the linked patient record.
--
-- Additive only — nullable, no default change to existing rows, so old
-- bookings/patients without a DOB keep working (frontend shows "-").
-- Safe to re-run: ignore "Duplicate column name" if already applied.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `bookings` ADD COLUMN `dob` DATE NULL AFTER `customer_phone_last4`;

-- ─────────────────────────────────────────────────────────────────────────────
-- End of booking-dob migration.
-- ─────────────────────────────────────────────────────────────────────────────
