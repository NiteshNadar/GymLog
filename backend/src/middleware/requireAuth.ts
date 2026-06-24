import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { verifyAccessToken } from '../utils/jwt.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      _id: new Types.ObjectId(payload.userId),
      email: payload.email,
    };
    next();
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' },
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Invalid token' },
    });
  }
}
