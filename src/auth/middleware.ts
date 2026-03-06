import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './tokens';
import { AuthPayload } from './types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
