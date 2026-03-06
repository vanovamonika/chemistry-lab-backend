import nodemailer from 'nodemailer';

const GMAIL_USER = (process.env.GMAIL_USER || '').trim();
const GMAIL_PASSWORD = (process.env.GMAIL_PASSWORD || '').trim(); // Use app-specific password for Gmail
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Log email configuration on startup (sanitized)
console.log('[Email Service] Configuration:');
console.log('[Email Service] GMAIL_USER:', GMAIL_USER ? '✓ configured' : '✗ missing');
console.log('[Email Service] GMAIL_PASSWORD:', GMAIL_PASSWORD ? `✓ configured (${GMAIL_PASSWORD.length} chars)` : '✗ missing');
console.log('[Email Service] FRONTEND_URL:', FRONTEND_URL);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!GMAIL_USER || !GMAIL_PASSWORD) {
      console.warn('[Email] Gmail credentials not configured. Email not sent.');
      console.warn('[Email] GMAIL_USER:', GMAIL_USER ? 'configured' : 'missing');
      console.warn('[Email] GMAIL_PASSWORD:', GMAIL_PASSWORD ? 'configured' : 'missing');
      return false;
    }

    const mailOptions = {
      from: GMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log(`[Email] Attempting to send email to ${options.to}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`[Email] Email sent successfully to ${options.to}`, result.response);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    if (error instanceof Error) {
      console.error('[Email] Error message:', error.message);
      console.error('[Email] Error stack:', error.stack);
    }
    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<boolean> => {
  const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <h1>Welcome to Virtual Chemistry Lab!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Verify Email
    </a>
    <p>Or copy this link: ${verificationLink}</p>
    <p>This link will expire in 24 hours.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your email - Virtual Chemistry Lab',
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Reset Password
    </a>
    <p>Or copy this link: ${resetLink}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - Virtual Chemistry Lab',
    html,
  });
};

export const sendWelcomeEmail = async (email: string, username: string): Promise<boolean> => {
  const html = `
    <h1>Welcome, ${username}!</h1>
    <p>Your account has been successfully created.</p>
    <p>You can now log in to the Virtual Chemistry Lab and start experimenting!</p>
    <a href="${FRONTEND_URL}/login" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Go to Login
    </a>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Virtual Chemistry Lab!',
    html,
  });
};
