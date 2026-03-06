export interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SessionData {
  userId: string;
  email: string;
  username: string;
  signedInAt: Date;
  expiresAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

export interface VerifyEmailRequest {
  token: string;
}
