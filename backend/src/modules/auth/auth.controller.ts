import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'jid';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/', // Accessible to refresh and logout endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching JWT_REFRESH_EXPIRES_IN
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);
      setRefreshCookie(res, refreshToken);
      res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (!token) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
        });
        return;
      }

      const { accessToken, refreshToken } = await AuthService.refresh(token);
      setRefreshCookie(res, refreshToken);
      res.status(200).json({
        success: true,
        data: {
          accessToken,
        },
      });
    } catch (error) {
      // If refresh failed (e.g. token expired/invalid/breached), clear cookie
      clearRefreshCookie(res);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (token) {
        await AuthService.logout(token);
      }
      clearRefreshCookie(res);
      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Google Access Token is required' },
        });
        return;
      }

      const { user, accessToken: appAccessToken, refreshToken } = await AuthService.googleLogin(accessToken);
      setRefreshCookie(res, refreshToken);
      res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
          },
          accessToken: appAccessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
