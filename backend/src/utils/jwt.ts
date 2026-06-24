import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';

interface TokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(userId: Types.ObjectId, email: string): string {
  const payload: TokenPayload = { userId: userId.toString(), email };
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(userId: Types.ObjectId, email: string): string {
  const payload: TokenPayload = { userId: userId.toString(), email };
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
