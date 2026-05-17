-- Row Level Security policies for FAMS ERP
-- Apply after EF migrations have created the tables.
-- Run as the database owner (postgres). The application role (fams_user)
-- must NOT be the table owner so that RLS is enforced on it.
--
-- Session variables set per-connection by RlsConnectionInterceptor:
--   app.campus_id            TEXT   -- empty string means cross-campus access
--   app.cross_campus_access  TEXT   -- 'true' or 'false'

-- ── Helper already defined in init.sql ───────────────────────────────────────
-- current_campus_id() returns the campus UUID from the session variable,
-- or NULL if the variable is unset / empty (= cross-campus access granted).

-- ── students ──────────────────────────────────────────────────────────────────
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

CREATE POLICY students_campus_isolation ON students
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── attendances ───────────────────────────────────────────────────────────────
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances FORCE ROW LEVEL SECURITY;

CREATE POLICY attendances_campus_isolation ON attendances
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── results ───────────────────────────────────────────────────────────────────
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE results FORCE ROW LEVEL SECURITY;

CREATE POLICY results_campus_isolation ON results
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── fee_invoices ──────────────────────────────────────────────────────────────
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY fee_invoices_campus_isolation ON fee_invoices
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── fee_payments ──────────────────────────────────────────────────────────────
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY fee_payments_campus_isolation ON fee_payments
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── staff ─────────────────────────────────────────────────────────────────────
ALTER TABLE "StaffMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffMembers" FORCE ROW LEVEL SECURITY;

CREATE POLICY staff_campus_isolation ON "StaffMembers"
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── applications ──────────────────────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;

CREATE POLICY applications_campus_isolation ON applications
    USING (
        current_setting('app.cross_campus_access', true) = 'true'
        OR "CampusId" = current_campus_id()
    );

-- ── campuses (school-level isolation, not campus-level) ───────────────────────
-- Campuses are scoped by SchoolId, handled by FamsDbContext global query filter.
-- No RLS policy here — SystemAdmin must see all campuses regardless of campus_id.

-- ── Grant the application role SELECT/INSERT/UPDATE/DELETE (not DDL) ──────────
-- Ensure RLS is enforced: do NOT grant the app role ownership or BYPASSRLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON students        TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendances     TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON results         TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_invoices    TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_payments    TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StaffMembers"  TO fams_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON applications    TO fams_user;
