import bcrypt from 'bcryptjs';
import { User, IUser } from '../users/user.model.js';
import { LoginAttempt } from './loginAttempt.model.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

export class AuthService {
  static async register(input: RegisterInput): Promise<IUser> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      const err = new Error('Email already exists') as Error & { statusCode: number; code: string };
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = new User({
      email: input.email,
      passwordHash,
      refreshTokens: [],
    });

    await user.save();
    return user;
  }

  static async login(input: LoginInput): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const attempts = await LoginAttempt.countDocuments({ email: input.email });
    if (attempts >= 5) {
      const err = new Error('Account temporarily locked due to too many failed attempts. Try again later.') as Error & { statusCode: number; code: string };
      err.statusCode = 429;
      err.code = 'ACCOUNT_LOCKED';
      throw err;
    }

    const user = await User.findOne({ email: input.email });
    if (!user) {
      const err = new Error('Invalid email or password') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!user.passwordHash) {
      const err = new Error('This account was created using Google Sign-In. Please sign in with Google.') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      await LoginAttempt.create({ email: input.email });

      const err = new Error('Invalid email or password') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // Reset lockout on successful login
    await LoginAttempt.deleteMany({ email: input.email });

    const accessToken = signAccessToken(user._id, user.email);
    const refreshToken = signRefreshToken(user._id, user.email);

    // Hash refresh token with bcrypt before storing
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens.push(hashedToken);
    await user.save();

    return { user, accessToken, refreshToken };
  }

  static async googleLogin(googleAccessToken: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
    if (!response.ok) {
      const err = new Error('Invalid Google token') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const payload = (await response.json()) as { email: string; email_verified?: boolean; sub: string };
    const email = payload.email?.toLowerCase();
    if (!email) {
      const err = new Error('Google account has no email') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        refreshTokens: [],
      });
      await user.save();
    }

    const accessToken = signAccessToken(user._id, user.email);
    const refreshToken = signRefreshToken(user._id, user.email);

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens.push(hashedToken);
    await user.save();

    return { user, accessToken, refreshToken };
  }

  static async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error) {
      const err = new Error('Invalid or expired refresh token') as Error & { statusCode: number; code: string };
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number; code: string };
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    let tokenIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const isMatch = await bcrypt.compare(token, user.refreshTokens[i]);
      if (isMatch) {
        tokenIndex = i;
        break;
      }
    }

    if (tokenIndex === -1) {
      user.refreshTokens = [];
      await user.save();

      const err = new Error('Breach detected: Refresh token reused. All sessions revoked.') as Error & { statusCode: number; code: string };
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    const newAccessToken = signAccessToken(user._id, user.email);
    const newRefreshToken = signRefreshToken(user._id, user.email);

    const newHashedToken = await bcrypt.hash(newRefreshToken, 10);

    user.refreshTokens[tokenIndex] = newHashedToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(token: string): Promise<void> {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) return;

    let tokenIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const isMatch = await bcrypt.compare(token, user.refreshTokens[i]);
      if (isMatch) {
        tokenIndex = i;
        break;
      }
    }

    if (tokenIndex !== -1) {
      user.refreshTokens.splice(tokenIndex, 1);
      await user.save();
    }
  }
}
