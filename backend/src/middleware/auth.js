const { clerkClient } = require('@clerk/express');
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Try verifying Clerk Token if Clerk Secret Key is set
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const client = clerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const sessionClaims = await client.verifyToken(token);
        req.user = {
          id: sessionClaims.sub,
          email: sessionClaims.email || sessionClaims.primary_email || '',
          clerkUser: true,
          claims: sessionClaims
        };
        return next();
      } catch (clerkErr) {
        // Fall back to legacy JWT verify below if Clerk fails
      }
    }

    // 2. Fallback to Legacy JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'antigravity_super_secret_key_123_career_path');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
