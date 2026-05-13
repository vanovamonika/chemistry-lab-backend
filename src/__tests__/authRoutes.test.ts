import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { userService } from '../services/userService';

/**
 * Tests for Authentication Logic
 * 
 * Verifies:
 * 1. User registration and validation
 * 2. Password hashing and comparison
 * 3. User profile retrieval
 * 4. Error handling for invalid credentials
 */
describe('Authentication Service Tests', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUsername = `testuser-${Date.now()}`;
  const testPassword = 'SecurePassword123!';
  let testUserId: string;

  beforeEach(async () => {
    // Clean up existing test user before each test
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Clean up after all tests
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('User Registration', () => {
    it('should register a new user with valid credentials', async () => {
      const result = await userService.registerUser(testEmail, testUsername, testPassword);

      expect(result.success).toBe(true);
      expect('user' in result).toBe(true);
      
      if ('user' in result && result.user) {
        expect(result.user.email).toBe(testEmail);
        expect(result.user.username).toBe(testUsername);
        testUserId = result.user.id;
      }
    });

    it('should reject duplicate email registration', async () => {
      // Register first user
      const first = await userService.registerUser(testEmail, testUsername, testPassword);
      expect(first.success).toBe(true);

      if ('user' in first && first.user?.id) {
        testUserId = first.user.id;
      }

      // Try to register with same email
      const duplicate = await userService.registerUser(
        testEmail,
        'anotheruser',
        testPassword
      );

      expect(duplicate.success).toBe(false);
      expect(duplicate.message).toContain('already registered');
    });

    it('should reject duplicate username', async () => {
      // Register first user
      const first = await userService.registerUser(testEmail, testUsername, testPassword);
      expect(first.success).toBe(true);

      if ('user' in first && first.user?.id) {
        testUserId = first.user.id;
      }

      // Try to register with same username but different email
      const duplicate = await userService.registerUser(
        `other-${Date.now()}@example.com`,
        testUsername,
        testPassword
      );

      expect(duplicate.success).toBe(false);
      expect(duplicate.message).toContain('Username');
    });

    it('should hash password and not store plaintext', async () => {
      const result = await userService.registerUser(testEmail, testUsername, testPassword);
      expect(result.success).toBe(true);

      if ('user' in result && result.user?.id) {
        testUserId = result.user.id;

        // Fetch user from DB
        const dbUser = await db.select().from(users).where(eq(users.id, testUserId)).limit(1);

        expect(dbUser[0]).toBeDefined();
        expect(dbUser[0].passwordHash).not.toBe(testPassword);
        expect(dbUser[0].passwordHash.length).toBeGreaterThan(20); // bcrypt hash is typically >50 chars
      }
    });
  });

  describe('Password Hashing & Comparison', () => {
    it('should hash password and allow correct comparison', async () => {
      const hashed = await userService.hashPassword(testPassword);

      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(20);

      const matches = await userService.comparePassword(testPassword, hashed);
      expect(matches).toBe(true);
    });

    it('should reject incorrect password comparison', async () => {
      const hashed = await userService.hashPassword(testPassword);
      const wrongMatches = await userService.comparePassword('WrongPassword123!', hashed);

      expect(wrongMatches).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashed = await userService.hashPassword(testPassword);
      const emptyMatches = await userService.comparePassword('', hashed);

      expect(emptyMatches).toBe(false);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register and verify test user before each login test
      const result = await userService.registerUser(testEmail, testUsername, testPassword);
      if ('user' in result && result.user?.id) {
        testUserId = result.user.id;

        // Manually verify email for login tests
        await db
          .update(users)
          .set({ isEmailVerified: true })
          .where(eq(users.id, testUserId));
      }
    });

    it('should authenticate user with correct credentials', async () => {
      const result = await userService.loginUser(testEmail, testPassword);

      expect(result.success).toBe(true);
      expect('token' in result).toBe(true);
      expect('user' in result).toBe(true);

      if ('user' in result && result.user) {
        expect(result.user.email).toBe(testEmail);
      }

      if ('token' in result) {
        expect(result.token).toBeTruthy();
      }
    });

    it('should reject login with incorrect password', async () => {
      const result = await userService.loginUser(testEmail, 'WrongPassword123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject login for non-existent user', async () => {
      const result = await userService.loginUser('nonexistent@example.com', testPassword);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject login if email not verified', async () => {
      const unverifiedEmail = `unverified-${Date.now()}@example.com`;
      const unverifiedUser = await userService.registerUser(
        unverifiedEmail,
        `user-${Date.now()}`,
        testPassword
      );

      expect(unverifiedUser.success).toBe(true);

      // Try to login without verifying email
      const result = await userService.loginUser(unverifiedEmail, testPassword);

      expect(result.success).toBe(false);
      expect(result.message).toContain('verify');

      // Clean up
      if ('user' in unverifiedUser && unverifiedUser.user?.id) {
        await db.delete(users).where(eq(users.id, unverifiedUser.user.id));
      }
    });
  });

  describe('User Profile Retrieval', () => {
    beforeEach(async () => {
      const result = await userService.registerUser(testEmail, testUsername, testPassword);
      if ('user' in result && result.user?.id) {
        testUserId = result.user.id;
      }
    });

    it('should retrieve user profile by ID', async () => {
      const result = await userService.getUserById(testUserId);

      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
      expect(result?.username).toBe(testUsername);
    });

    it('should return null for non-existent user ID', async () => {
      const result = await userService.getUserById('nonexistent-id-12345');

      expect(result).toBeNull();
    });
  });
});
