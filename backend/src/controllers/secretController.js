const db = require('../services/db');
const { generateReferenceId } = require('../utils/helpers');

const SECRET_TTL_HOURS = 1; // Configurable TTL (1 hour)

// POST /api/secrets
const createSecret = async (req, res, next) => {
  const { encryptedSecret } = req.body;

  if (!encryptedSecret || typeof encryptedSecret !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid encryptedSecret in request body.' });
  }

  try {
    const referenceId = generateReferenceId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SECRET_TTL_HOURS * 60 * 60 * 1000);

    const insertQuery = `
      INSERT INTO secrets (reference_id, encrypted_secret, expires_at)
      VALUES ($1, $2, $3)
      RETURNING reference_id;
    `;
    const result = await db.query(insertQuery, [referenceId, encryptedSecret, expiresAt]);

    res.status(201).json({ referenceId: result.rows[0].reference_id });

  } catch (error) {
    console.error('Error creating secret:', error);
    next(error); // Pass error to global error handler
  }
};

// POST /api/secrets/:id/consume
const consumeSecret = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Missing reference ID in request path.' });
  }

  // Use DELETE ... RETURNING for atomicity.
  // This attempts to delete the record only if it matches the criteria (not viewed, not expired)
  // and returns the deleted row's data if successful.
  const consumeQuery = `
    DELETE FROM secrets
    WHERE reference_id = $1 AND viewed = FALSE AND expires_at > NOW()
    RETURNING encrypted_secret;
  `;

  try {
    const result = await db.query(consumeQuery, [id]);

    if (result.rows.length > 0) {
      // Successfully deleted (consumed)
      res.status(200).json({ encryptedSecret: result.rows[0].encrypted_secret });
    } else {
      // No rows deleted means it didn't exist, was already viewed, or expired
      // Check if it ever existed to differentiate 404 vs 410 (optional complexity)
      const checkExistsQuery = `SELECT 1 FROM secrets WHERE reference_id = $1`;
      const existsResult = await db.query(checkExistsQuery, [id]);
      if (existsResult.rows.length > 0) {
          // It existed but was already viewed or expired
          res.status(410).json({ message: 'Secret has expired or already been viewed.' });
      } else {
          // It never existed
          res.status(404).json({ message: 'Secret not found.' });
      }
    }
  } catch (error) {
    console.error(`Error consuming secret ${id}:`, error);
    next(error); // Pass error to global error handler
  }
};

module.exports = {
  createSecret,
  consumeSecret,
};