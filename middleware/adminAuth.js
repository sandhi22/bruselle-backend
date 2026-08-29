// Simple shared-secret admin check.
// The admin panel sends the key in the "x-admin-key" header.
// This is fine for a small single-owner store; if the store grows,
// swap this for real user accounts + hashed passwords + sessions/JWT.
function adminAuth(req, res, next) {
  const suppliedKey = req.header('x-admin-key');

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_KEY is not set.' });
  }

  if (suppliedKey && suppliedKey === process.env.ADMIN_KEY) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: invalid or missing admin key.' });
}

module.exports = adminAuth;
