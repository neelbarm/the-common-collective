-- Waitlist table migration
-- Run once on startup to ensure the table exists

CREATE TABLE IF NOT EXISTS waitlist (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT,
  neighborhood TEXT,
  age_range    TEXT,
  interests    TEXT[],
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
