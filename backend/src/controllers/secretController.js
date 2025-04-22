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

  // Start a transaction to ensure complete atomicity
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Lock the row exclusively while we check and update
    const lockQuery = `
      SELECT encrypted_secret, viewed, expires_at 
      FROM secrets 
      WHERE reference_id = $1 
      FOR UPDATE;
    `;

    const result = await client.query(lockQuery, [id]);

    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return res.status(404).json({ message: 'Secret not found.' });
    }

    const secret = result.rows[0];

    // Check if secret is already viewed or expired
    if (secret.viewed || secret.expires_at <= new Date()) {
      await client.query('COMMIT');
      return res.status(410).json({ message: 'Secret has expired or already been viewed.' });
    }

    // Mark as viewed and get the secret
    const updateQuery = `
      UPDATE secrets 
      SET viewed = TRUE 
      WHERE reference_id = $1 
      RETURNING encrypted_secret;
    `;

    const updateResult = await client.query(updateQuery, [id]);
    await client.query('COMMIT');

    res.status(200).json({ encryptedSecret: updateResult.rows[0].encrypted_secret });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error consuming secret ${id}:`, error);
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  createSecret,
  consumeSecret,
};