'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// Make the pool available to route handlers via app.locals
app.locals.db = db;

// ── Run SQL migration on startup ──────────────────────────────────────────────

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'waitlist.sql'), 'utf8');
  await db.query(sql);
  console.log('Database migration applied.');
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ── Routes ────────────────────────────────────────────────────────────────────

app.post('/api/waitlist/signup', (req, res, next) => {
  console.log('POST /api/waitlist/signup received');
  console.log('Request body:', JSON.stringify(req.body));
  next();
});

const waitlistRouter = require('./routes/waitlist');
app.use('/api/waitlist', waitlistRouter);

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

runMigration()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`The Common Collective server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to apply database migration:', err);
    process.exit(1);
  });
