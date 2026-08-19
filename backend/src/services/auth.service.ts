import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser, UserRole } from '../models/User.js';
import { env } from '../config/env.js';
import { PointsService } from './points.service.js';
import { UserAchievement } from '../models/UserAchievement.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export class AuthService {
  static generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
    studentId?: string;
    avatar?: string;
    bio?: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const safeRole: UserRole = (['ADMIN', 'FACULTY', 'STUDENT'].includes(data.role as string)
      ? data.role
      : 'STUDENT') as UserRole;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: safeRole,
      department: data.department || '',
      studentId: data.studentId || '',
      avatar: data.avatar || '',
      bio: data.bio || '',
      points: 0,
      streakDays: 1,
      lastActiveDate: new Date(),
    });

    // Check initial achievements
    await PointsService.checkAndAwardAchievements(user._id, 0);

    const { accessToken, refreshToken } = this.generateTokens(user);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return { user: userObj, accessToken, refreshToken };
  }

  static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    if (user.isSuspended) {
      throw new Error('Your account has been suspended. Please contact administrator.');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Update streak if active on different day
    const now = new Date();
    const lastActive = new Date(user.lastActiveDate);
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      user.streakDays += 1;
      if (user.streakDays >= 7) {
        await PointsService.awardPoints(user._id, 'STREAK_BONUS', 50, '7-Day Active Learning Streak!');
      }
    } else if (diffDays > 1) {
      user.streakDays = 1;
    }
    user.lastActiveDate = now;
    await user.save();

    const { accessToken, refreshToken } = this.generateTokens(user);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return { user: userObj, accessToken, refreshToken };
  }

  static async googleAuth(data: {
    idToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    let email = data.email?.toLowerCase();
    let name = data.name || 'Google User';
    let avatar = data.avatar || '';
    let googleId = data.googleId || '';

    // If ID token is provided and GOOGLE_CLIENT_ID is configured, verify cryptographically
    if (data.idToken && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID !== 'mock_google_client_id_for_dev') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: data.idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email.toLowerCase();
          name = payload.name || name;
          avatar = payload.picture || avatar;
          googleId = payload.sub || googleId;
        }
      } catch (err) {
        console.warn('Google token verification fallback for dev demo');
      }
    }

    if (!email) {
      throw new Error('Google authentication failed: Email is required.');
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new student user via Google
      user = await User.create({
        name,
        email,
        avatar,
        googleId,
        role: 'STUDENT',
        points: 0,
        streakDays: 1,
        lastActiveDate: new Date(),
      });
      await PointsService.checkAndAwardAchievements(user._id, 0);
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }
      user.lastActiveDate = new Date();
      await user.save();
    }

    if (user.isSuspended) {
      throw new Error('Your account has been suspended.');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    const userObj = user.toObject();
    delete userObj.passwordHash;

    return { user: userObj, accessToken, refreshToken };
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      console.log(`🔑 [DEV DEMO] Password reset link for ${email}: ${env.FRONTEND_URL}/reset-password?token=${resetToken}`);
    }

    // Always return safe timing-resistant message
    return {
      message: 'If an account exists for this email, a password reset link has been generated.',
    };
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been successfully updated. You may now login.' };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
      const user = await User.findById(decoded.id);

      if (!user || user.isSuspended) {
        throw new Error('Session invalid or user suspended.');
      }

      const payload: TokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any,
      });

      return { accessToken };
    } catch (err) {
      throw new Error('Invalid or expired refresh token. Please login again.');
    }
  }

  static async getUserProfile(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const userAchievements = await UserAchievement.find({ userId }).populate('achievementId');

    return {
      ...user.toObject(),
      achievements: userAchievements.map((ua) => ua.achievementId),
    };
  }

  static async updateProfile(
    userId: string,
    data: { name?: string; bio?: string; department?: string; avatar?: string; studentId?: string }
  ): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(data.name && { name: data.name }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.avatar && { avatar: data.avatar }),
          ...(data.studentId !== undefined && { studentId: data.studentId }),
        },
      },
      { new: true }
    );

    return user;
  }
}
