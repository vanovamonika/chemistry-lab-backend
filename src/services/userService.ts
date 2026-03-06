import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, generateEmailVerificationToken } from '../auth/tokens';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from './emailService';

const SALT_ROUNDS = 10;

export const userService = {
  /**
   * Hash a password using bcrypt
   */
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Compare a plain password with a hashed password
   */
  comparePassword: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Register a new user
   */
  registerUser: async (email: string, username: string, password: string) => {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: 'Email already registered',
        };
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername.length > 0) {
        return {
          success: false,
          message: 'Username already taken',
        };
      }

      // Hash the password
      const passwordHash = await userService.hashPassword(password);

      // Generate verification token
      const verificationToken = generateEmailVerificationToken();

      // Create new user
      const userId = uuidv4();
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          email,
          username,
          passwordHash,
          emailVerificationToken: verificationToken,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      return {
        success: true,
        message: 'User registered successfully. Please verify your email.',
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          username: newUser[0].username,
        },
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        message: 'Error registering user',
      };
    }
  },

  /**
   * Login a user
   */
  loginUser: async (email: string, password: string) => {
    try {
      // Find user by email
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (foundUsers.length === 0) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      const user = foundUsers[0];

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
        };
      }

      // Verify password
      const isPasswordValid = await userService.comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      // Update last login
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      return {
        success: false,
        message: 'Error logging in',
      };
    }
  },

  /**
   * Verify user email
   */
  verifyEmail: async (token: string) => {
    try {
      // Find user by verification token
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (foundUsers.length === 0) {
        return {
          success: false,
          message: 'Invalid verification token',
        };
      }

      const user = foundUsers[0];

      // Update user to mark email as verified
      await db
        .update(users)
        .set({
          isEmailVerified: true,
          emailVerificationToken: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: 'Error verifying email',
      };
    }
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string) => {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (foundUsers.length === 0) {
        // Return success even if user doesn't exist (for security)
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      const user = foundUsers[0];
      const resetToken = generateEmailVerificationToken();

      // Update reset token and expiry
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1); // 1 hour expiry

      await db
        .update(users)
        .set({
          resetPasswordToken: resetToken,
          resetPasswordExpires: expiryTime,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);

      return {
        success: true,
        message: 'Password reset link sent to your email',
      };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return {
        success: false,
        message: 'Error processing password reset request',
      };
    }
  },

  /**
   * Reset password using token
   */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.resetPasswordToken, token))
        .limit(1);

      if (foundUsers.length === 0) {
        return {
          success: false,
          message: 'Invalid reset token',
        };
      }

      const user = foundUsers[0];

      // Check if token is expired
      if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
        return {
          success: false,
          message: 'Reset token has expired',
        };
      }

      // Hash new password
      const passwordHash = await userService.hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Error resetting password',
      };
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (foundUsers.length === 0) {
        return null;
      }

      const user = foundUsers[0];
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (
    userId: string,
    updates: {
      username?: string;
      avatar?: string;
      settings?: any;
    }
  ) => {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (foundUsers.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.username) {
        // Check if new username is taken by someone else
        const existingUsername = await db
          .select()
          .from(users)
          .where(eq(users.username, updates.username))
          .limit(1);

        if (existingUsername.length > 0 && existingUsername[0].id !== userId) {
          return {
            success: false,
            message: 'Username already taken',
          };
        }

        updateData.username = updates.username;
      }

      if (updates.avatar !== undefined) {
        updateData.avatar = updates.avatar;
      }

      if (updates.settings !== undefined) {
        updateData.settings = updates.settings;
      }

      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
          username: updatedUser[0].username,
          avatar: updatedUser[0].avatar,
        },
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        message: 'Error updating profile',
      };
    }
  },

  /**
   * Change password
   */
  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (foundUsers.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const user = foundUsers[0];

      // Verify current password
      const isPasswordValid = await userService.comparePassword(currentPassword, user.passwordHash);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Hash new password
      const newPasswordHash = await userService.hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: 'Error changing password',
      };
    }
  },
};
