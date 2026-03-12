import { auth } from '../config/firebaseAdmin.js';

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    
    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header');
    }

    const idToken = authHeader.slice(7);
    
    if (!idToken) {
      throw new AuthError('No token provided');
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken.uid) {
      throw new AuthError('Invalid token - no user ID');
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ error: error.message });
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export default requireAuth;
