-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RLS helper function: get current campus_id from session variable
CREATE OR REPLACE FUNCTION current_campus_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.campus_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;
