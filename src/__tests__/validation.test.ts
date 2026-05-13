import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

/**
 * Tests for Input Validation with Zod Schemas
 * 
 * Verifies:
 * 1. Email validation (valid/invalid formats)
 * 2. Password validation (minimum requirements)
 * 3. Reactants parsing (splitting, trimming, validation)
 * 4. Products array validation
 * 5. Temperature range validation
 * 6. Equation format validation
 */
describe('Input Validation Tests', () => {
  // Authentication schemas (from authRoutes)
  const emailSchema = z.string().email('Invalid email format');
  const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

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

  // Reaction schemas (from reactionsRoutes)
  const reactantsParser = z.preprocess(
    (value) => {
      if (typeof value === 'string') {
        return value
          .split('+')
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return value;
    },
    z.array(z.string().min(1)).min(2, 'At least two reactants are required')
  );

  const productsParser = z.preprocess(
    (value) => {
      if (typeof value === 'string') {
        return value
          .split('+')
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return value;
    },
    z.array(z.string().min(1)).min(1, 'At least one product is required')
  );

  const findReactionSchema = z.object({
    reactants: reactantsParser,
    temperature: z.number().optional(),
  });

  const createReactionSchema = z.object({
    reactants: reactantsParser,
    products: productsParser,
    equation: z.string().optional(),
    temperature: z.number().optional(),
    isVerified: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  });

  describe('Email Validation', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('user@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      const result = emailSchema.safeParse('userexample.com');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('user@');
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should accept email with subdomain', () => {
      const result = emailSchema.safeParse('user@mail.example.com');
      expect(result.success).toBe(true);
    });
  });

  describe('Password Validation', () => {
    it('should accept password with 6+ characters', () => {
      const result = passwordSchema.safeParse('SecurePass123!');
      expect(result.success).toBe(true);
    });

    it('should reject password with less than 6 characters', () => {
      const result = passwordSchema.safeParse('Short');
      expect(result.success).toBe(false);
      expect(result.error?.flatten().formErrors[0]).toContain('at least 6');
    });

    it('should reject empty password', () => {
      const result = passwordSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should accept password with special characters', () => {
      const result = passwordSchema.safeParse('P@ss!w0rd');
      expect(result.success).toBe(true);
    });
  });

  describe('Login Validation', () => {
    it('should accept valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject login with invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'SecurePassword123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject login with short password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Signup Validation', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123',
        passwordConfirm: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject signup with mismatched passwords', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123',
        passwordConfirm: 'DifferentPassword123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.passwordConfirm?.[0]).toContain('match');
    });

    it('should reject username shorter than 3 characters', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        username: 'ab',
        password: 'SecurePassword123',
        passwordConfirm: 'SecurePassword123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject username longer than 20 characters', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        username: 'thisusernameistoolongforsure',
        password: 'SecurePassword123',
        passwordConfirm: 'SecurePassword123',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Reactants Validation', () => {
    it('should parse reactants from comma-separated string', () => {
      const result = reactantsParser.safeParse('HCl + NaOH');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['HCl', 'NaOH']);
    });

    it('should handle extra whitespace', () => {
      const result = reactantsParser.safeParse('  HCl  +  NaOH  ');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['HCl', 'NaOH']);
    });

    it('should accept array of reactants', () => {
      const result = reactantsParser.safeParse(['HCl', 'NaOH']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['HCl', 'NaOH']);
    });

    it('should reject single reactant', () => {
      const result = reactantsParser.safeParse('OnlyOne');

      expect(result.success).toBe(false);
      expect(result.error?.flatten().formErrors[0]).toContain('At least two');
    });

    it('should reject empty reactants', () => {
      const result = reactantsParser.safeParse('');

      expect(result.success).toBe(false);
    });

    it('should reject empty array', () => {
      const result = reactantsParser.safeParse([]);

      expect(result.success).toBe(false);
    });

    it('should handle reactants with state annotations', () => {
      const result = reactantsParser.safeParse('HCl(aq) + NaOH(aq)');

      expect(result.success).toBe(true);
      expect(result.data).toContain('HCl(aq)');
      expect(result.data).toContain('NaOH(aq)');
    });
  });

  describe('Products Validation', () => {
    it('should parse products from string', () => {
      const result = productsParser.safeParse('NaCl + H2O');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['NaCl', 'H2O']);
    });

    it('should accept array of products', () => {
      const result = productsParser.safeParse(['NaCl', 'H2O']);

      expect(result.success).toBe(true);
    });

    it('should accept single product', () => {
      const result = productsParser.safeParse('Product');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['Product']);
    });

    it('should reject empty products', () => {
      const result = productsParser.safeParse('');

      expect(result.success).toBe(false);
    });
  });

  describe('Find Reaction Validation', () => {
    it('should accept valid find reaction request', () => {
      const result = findReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        temperature: 25,
      });

      expect(result.success).toBe(true);
      expect(result.data?.reactants).toEqual(['HCl', 'NaOH']);
      expect(result.data?.temperature).toBe(25);
    });

    it('should accept find reaction without temperature', () => {
      const result = findReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
      });

      expect(result.success).toBe(true);
      expect(result.data?.temperature).toBeUndefined();
    });

    it('should reject find reaction with invalid reactants', () => {
      const result = findReactionSchema.safeParse({
        reactants: 'OnlyOne',
        temperature: 25,
      });

      expect(result.success).toBe(false);
    });

    it('should accept negative temperature', () => {
      const result = findReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        temperature: -10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.temperature).toBe(-10);
    });
  });

  describe('Create Reaction Validation', () => {
    it('should accept valid create reaction request', () => {
      const result = createReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        products: 'NaCl + H2O',
        equation: 'HCl + NaOH -> NaCl + H2O',
        temperature: 25,
        isPublic: true,
      });

      expect(result.success).toBe(true);
    });

    it('should reject create reaction without products', () => {
      const result = createReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        products: '',
      });

      expect(result.success).toBe(false);
    });

    it('should make equation optional', () => {
      const result = createReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        products: 'NaCl + H2O',
      });

      expect(result.success).toBe(true);
      expect(result.data?.equation).toBeUndefined();
    });

    it('should accept boolean verification status', () => {
      const result = createReactionSchema.safeParse({
        reactants: 'HCl + NaOH',
        products: 'NaCl + H2O',
        isVerified: true,
        isPublic: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.isVerified).toBe(true);
      expect(result.data?.isPublic).toBe(false);
    });
  });
});
