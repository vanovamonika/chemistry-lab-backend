import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService';
import { authMiddleware } from '../auth/middleware';
import {
  LoginRequest,
  SignupRequest,
  VerifyEmailRequest,
} from '../auth/types';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'Passwords do not match',
  path: ['newPasswordConfirm'],
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  avatar: z.string().url().optional(),
  settings: z.any().optional(),
});

/**
 * Register a new user
 * @param {string} email - User email address
 * @param {string} username - Unique username (3-20 chars)
 * @param {string} password - Password (min 6 chars)
 * @param {string} passwordConfirm - Password confirmation
 * @returns {Object} Success status and user data or error message
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { email, username, password } = validationResult.data;

    const result = await userService.registerUser(email, username, password);

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Login user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Object} JWT token and user data or error message
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { email, password } = validationResult.data;

    const result = await userService.loginUser(email, password);

    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Verify user email with token
 * @param {string} token - Email verification token
 * @returns {Object} Success status or error message
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const validationResult = verifyEmailSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { token } = validationResult.data;

    const result = await userService.verifyEmail(token);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Request password reset email
 * @param {string} email - User email address
 * @returns {Object} Success status or error message
 */
router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { email } = validationResult.data;

    const result = await userService.requestPasswordReset(email);

    res.status(200).json(result);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Resend email verification message
 * @param {string} email - User email address
 * @returns {Object} Success status or error message
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    console.log('[AuthRoutes] Resend verification request for:', req.body.email);
    
    const validationResult = resendVerificationSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.log('[AuthRoutes] Validation failed:', validationResult.error.flatten());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { email } = validationResult.data;

    const result = await userService.resendVerificationEmail(email);
    console.log('[AuthRoutes] Resend verification result:', {
      email,
      success: result.success,
      emailSent: (result as any).emailSent,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('[AuthRoutes] Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Reset password with reset token
 * @param {string} token - Password reset token
 * @param {string} password - New password
 * @param {string} passwordConfirm - Password confirmation
 * @returns {Object} Success status or error message
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { token, password } = validationResult.data;

    const result = await userService.resetPassword(token, password);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get current authenticated user profile
 * @requires Authentication token in header
 * @returns {Object} User profile data or error message
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Update user profile information
 * @requires Authentication token in header
 * @param {string} username - Updated username (optional)
 * @param {string} avatar - Avatar URL (optional)
 * @param {Object} settings - User settings object (optional)
 * @returns {Object} Updated user data or error message
 */
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const validationResult = updateProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const result = await userService.updateUserProfile(req.user.userId, validationResult.data);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Change user password
 * @requires Authentication token in header
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @param {string} newPasswordConfirm - Password confirmation
 * @returns {Object} Success status or error message
 */
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const validationResult = changePasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.flatten(),
      });
    }

    const { currentPassword, newPassword } = validationResult.data;

    const result = await userService.changePassword(req.user.userId, currentPassword, newPassword);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Logout user (client-side token deletion)
 * @requires Authentication token in header
 * @returns {Object} Success status or error message
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Since we're using JWT tokens, logout is handled on the client side
    // by deleting the token from local storage/session storage
    // However, you can implement token blacklisting here if needed

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Debug endpoint to test email configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  router.post('/debug/test-email', async (req: Request, res: Response) => {
    try {
      console.log('[Debug] Test email request');
      
      const { sendVerificationEmail } = await import('../services/emailService');
      
      const testToken = 'test-token-' + Date.now();
      const testEmail = req.body.email || process.env.GMAIL_USER;
      
      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'No email provided and GMAIL_USER not configured',
        });
      }

      console.log('[Debug] Sending test email to:', testEmail);
      const sent = await sendVerificationEmail(testEmail, testToken);
      
      console.log('[Debug] Test email result:', sent);
      
      res.json({
        success: true,
        message: 'Test email endpoint called',
        emailSent: sent,
        testEmail,
        gmailConfigured: !!process.env.GMAIL_USER,
      });
    } catch (error) {
      console.error('[Debug] Test email error:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing email',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export default router;
