import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../db';
import { reactions, users } from '../db/schema';
import { inArray, eq } from 'drizzle-orm';
import { reactionService } from '../services/reactionService';
import { userService } from '../services/userService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tests for Reaction API and Authorization
 * 
 * Verifies:
 * 1. API validation with Zod schemas
 * 2. Finding reactions in database
 * 3. Saving reactions to database
 * 4. Verification authorization (only approved verifiers can verify)
 * 5. Public vs private reaction access control
 */
describe('Reaction API Tests', () => {
  const testToken = uuidv4().slice(0, 8);
  const reactants = [`TST_HCl_${testToken}`, `TST_NaOH_${testToken}`];
  const products = [`TST_NaCl_${testToken}`, `TST_H2O_${testToken}`];
  const equation = `${reactants[0]} + ${reactants[1]} -> ${products[0]} + ${products[1]}`;

  let createdReactionIds: string[] = [];
  let verifierUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Create test users
    const verifier = await userService.registerUser(
      `verifier-${testToken}@test.com`,
      `verifier-${testToken}`,
      'TestPassword123!'
    );

    const regular = await userService.registerUser(
      `regular-${testToken}@test.com`,
      `regular-${testToken}`,
      'TestPassword123!'
    );

    if ('user' in verifier && verifier.user?.id) {
      verifierUserId = verifier.user.id;
      // Mark as approved reaction verifier
      await db
        .update(users)
        .set({
          isReactionVerifierApproved: true,
          reactionVerifierApprovalStatus: 'approved',
        })
        .where(eq(users.id, verifierUserId));
    }

    if ('user' in regular && regular.user?.id) {
      regularUserId = regular.user.id;
    }
  });

  afterAll(async () => {
    // Clean up reactions
    if (createdReactionIds.length > 0) {
      await db.delete(reactions).where(inArray(reactions.id, createdReactionIds));
    }

    // Clean up users
    if (verifierUserId) {
      await db.delete(users).where(eq(users.id, verifierUserId));
    }
    if (regularUserId) {
      await db.delete(users).where(eq(users.id, regularUserId));
    }
  });

  describe('Finding Reactions', () => {
    beforeAll(async () => {
      // Create a test reaction
      const created = await reactionService.createReaction(
        {
          reactants,
          products,
          equation,
          temperature: 25,
          isPublic: true,
        },
        undefined
      );

      if (created.reaction?.id) {
        createdReactionIds.push(created.reaction.id);
      }
    });

    it('should find reaction by reactants with matching temperature', async () => {
      const result = await reactionService.findReactionByReactants(reactants, 25);

      expect(result.success).toBe(true);
      expect(result.found).toBe(true);
      expect(result.reaction?.products).toEqual(products);
      expect(result.reaction?.temperature).toBe(25);
    });

    it('should find reaction within temperature tolerance (+10°C)', async () => {
      const result = await reactionService.findReactionByReactants(reactants, 35);

      expect(result.success).toBe(true);
      expect(result.found).toBe(true);
    });

    it('should find reaction within temperature tolerance (-10°C)', async () => {
      const result = await reactionService.findReactionByReactants(reactants, 15);

      expect(result.success).toBe(true);
      expect(result.found).toBe(true);
    });

    it('should NOT find reaction outside temperature tolerance', async () => {
      const result = await reactionService.findReactionByReactants(reactants, 50); // +25°C

      expect(result.success).toBe(true);
      expect(result.found).toBe(false);
    });

    it('should handle missing reactants gracefully', async () => {
      const result = await reactionService.findReactionByReactants(['OnlyOne']);

      expect(result.success).toBe(true);
      expect(result.found).toBe(false);
      expect(result.message).toContain('At least two reactants');
    });
  });

  describe('Creating Reactions', () => {
    it('should create a public reaction', async () => {
      const localReactants = [`CRT1_HCl_${testToken}`, `CRT1_NaOH_${testToken}`];
      const localProducts = [`CRT1_NaCl_${testToken}`, `CRT1_H2O_${testToken}`];
      const localEquation = `${localReactants[0]} + ${localReactants[1]} -> ${localProducts[0]} + ${localProducts[1]}`;

      const result = await reactionService.createReaction(
        {
          reactants: localReactants,
          products: localProducts,
          equation: localEquation,
          temperature: 20,
          isPublic: true,
        },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(result.reaction).toBeDefined();
      expect(result.reaction?.isPublic).toBe(true);

      if (result.reaction?.id) {
        createdReactionIds.push(result.reaction.id);
      }
    });

    it('should create a reaction with verification metadata', async () => {
      const localReactants = [`CRT2_HCl_${testToken}`, `CRT2_NaOH_${testToken}`];
      const localProducts = [`CRT2_NaCl_${testToken}`, `CRT2_H2O_${testToken}`];
      const localEquation = `${localReactants[0]} + ${localReactants[1]} -> ${localProducts[0]} + ${localProducts[1]}`;

      const result = await reactionService.createReaction(
        {
          reactants: localReactants,
          products: localProducts,
          equation: localEquation,
          temperature: 22,
          isPublic: true,
          isVerified: true,
        },
        verifierUserId
      );

      expect(result.success).toBe(true);
      expect(result.reaction?.isVerified).toBe(true);
      expect(result.reaction?.verifiedById).toBe(verifierUserId);

      if (result.reaction?.id) {
        createdReactionIds.push(result.reaction.id);
      }
    });

    it('should require at least one product', async () => {
      const result = await reactionService.createReaction(
        {
          reactants,
          products: [],
          equation,
          temperature: 25,
        },
        undefined
      );

      expect(result.success).toBe(false);
    });

    it('should require at least two reactants', async () => {
      const result = await reactionService.createReaction(
        {
          reactants: ['OnlyOne'],
          products,
          equation,
          temperature: 25,
        },
        undefined
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Verification Authorization', () => {
    let unverifiedReactionId: string;

    beforeAll(async () => {
      // Create an unverified reaction
      const created = await reactionService.createReaction(
        {
          reactants: [`TST_Verify_A_${testToken}`, `TST_Verify_B_${testToken}`],
          products: [`TST_Verify_P_${testToken}`],
          equation: 'A + B -> P',
          temperature: 25,
          isPublic: true,
          isVerified: false,
        },
        undefined
      );

      if (created.reaction?.id) {
        unverifiedReactionId = created.reaction.id;
        createdReactionIds.push(unverifiedReactionId);
      }
    });

    it('should allow verified user to mark reaction as verified', async () => {
      const result = await reactionService.verifyReaction(unverifiedReactionId, verifierUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('verified');
    });

    it('should prevent non-approved user from verifying reactions', async () => {
      // Create another unverified reaction
      const created = await reactionService.createReaction(
        {
          reactants: [`TST_Verify2_A_${testToken}`, `TST_Verify2_B_${testToken}`],
          products: [`TST_Verify2_P_${testToken}`],
          equation: 'A2 + B2 -> P2',
          temperature: 25,
          isPublic: true,
          isVerified: false,
        },
        undefined
      );

      if (created.reaction?.id) {
        createdReactionIds.push(created.reaction.id);

        // Try to verify with regular user
        const verifyResult = await reactionService.verifyReaction(
          created.reaction.id,
          regularUserId
        );

        expect(verifyResult.success).toBe(false);
        expect(verifyResult.message).toContain('Only approved users can verify reactions');
      }
    });

    it('should handle verification of non-existent reaction', async () => {
      const result = await reactionService.verifyReaction(
        'nonexistent-reaction-id',
        verifierUserId
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Public vs Private Reactions', () => {
    it('should create public reaction accessible to all', async () => {
      const publicResult = await reactionService.createReaction(
        {
          reactants: [`PUBLIC_A_${testToken}`, `PUBLIC_B_${testToken}`],
          products: [`PUBLIC_P_${testToken}`],
          equation: 'PublicA + PublicB -> PublicP',
          isPublic: true,
        },
        undefined
      );

      expect(publicResult.success).toBe(true);
      expect(publicResult.reaction?.isPublic).toBe(true);

      if (publicResult.reaction?.id) {
        createdReactionIds.push(publicResult.reaction.id);

        // Should be findable
        const found = await reactionService.findReactionByReactants(
          [`PUBLIC_A_${testToken}`, `PUBLIC_B_${testToken}`],
          undefined
        );

        expect(found.found).toBe(true);
      }
    });

    it('should create private reaction', async () => {
      const privateResult = await reactionService.createReaction(
        {
          reactants: [`PRIVATE_A_${testToken}`, `PRIVATE_B_${testToken}`],
          products: [`PRIVATE_P_${testToken}`],
          equation: 'PrivateA + PrivateB -> PrivateP',
          isPublic: false,
        },
        regularUserId
      );

      expect(privateResult.success).toBe(true);
      expect(privateResult.reaction?.isPublic).toBe(false);

      if (privateResult.reaction?.id) {
        createdReactionIds.push(privateResult.reaction.id);
      }
    });
  });

  describe('Temperature Validation', () => {
    it('should accept temperature as number', async () => {
      const result = await reactionService.createReaction(
        {
          reactants: [`TEMP_A_${testToken}`, `TEMP_B_${testToken}`],
          products: [`TEMP_P_${testToken}`],
          equation: 'TempA + TempB -> TempP',
          temperature: 25.5,
          isPublic: true,
        },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.reaction?.temperature).toBe(25.5);

      if (result.reaction?.id) {
        createdReactionIds.push(result.reaction.id);
      }
    });

    it('should accept negative temperature', async () => {
      const result = await reactionService.createReaction(
        {
          reactants: [`COOL_A_${testToken}`, `COOL_B_${testToken}`],
          products: [`COOL_P_${testToken}`],
          equation: 'CoolA + CoolB -> CoolP',
          temperature: -10,
          isPublic: true,
        },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.reaction?.temperature).toBe(-10);

      if (result.reaction?.id) {
        createdReactionIds.push(result.reaction.id);
      }
    });
  });
});
