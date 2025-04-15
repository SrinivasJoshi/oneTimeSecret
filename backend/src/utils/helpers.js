const crypto = require('crypto');

function generateReferenceId(bytes = 16) {
  // Generate secure random bytes and encode as URL-safe base64
  return crypto.randomBytes(bytes).toString('base64url');
}

module.exports = {
  generateReferenceId,
};