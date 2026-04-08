'use strict';

const express = require('express');
const router = express.Router();

/**
 * POST /api/waitlist/signup
 * Body: { email, name?, neighborhood?, age_range?, interests? }
 * Returns 201 with the created record, or 409 on duplicate email.
 */
router.post('/signup', async (req, res) => {
  const db = req.app.locals.db;
  const { email, name, neighborhood, age_range, interests } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'invalid email address' });
  }

  try {
    const result = await db.query(
      `INSERT INTO waitlist (email, name, neighborhood, age_range, interests)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, neighborhood, age_range, interests, signed_up_at`,
      [
        normalizedEmail,
        name ? name.trim() : null,
        neighborhood ? neighborhood.trim() : null,
        age_range || null,
        Array.isArray(interests) && interests.length > 0 ? interests : null,
      ]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    // Unique violation — duplicate email
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This email is already on the waitlist.' });
    }
    console.error('waitlist signup error code:', err.code);
    console.error('waitlist signup error message:', err.message);
    console.error('waitlist signup error full:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * GET /api/waitlist
 * Returns all waitlist entries ordered by most recent first, plus total count.
 */
router.get('/', async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT id, email, name, neighborhood, age_range, interests, signed_up_at
       FROM waitlist
       ORDER BY signed_up_at DESC`
    );

    return res.json({
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error('waitlist fetch error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * GET /api/waitlist/count
 * Returns just the total count of waitlist signups.
 */
router.get('/count', async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query('SELECT COUNT(*)::int AS count FROM waitlist');
    return res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error('waitlist count error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
