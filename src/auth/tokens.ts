import jwt from 'jsonwebtoken';
import { AuthPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d'; // 7 days

export const generateToken = (payload: Omit<AuthPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY as any,
  });
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const generateEmailVerificationToken = (): string => {
  // Generate a simple random token
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const decodeToken = (token: string): AuthPayload | null => {
  try {
    const payload = jwt.decode(token) as AuthPayload;
    return payload;
  } catch (error) {
    return null;
  }
};
