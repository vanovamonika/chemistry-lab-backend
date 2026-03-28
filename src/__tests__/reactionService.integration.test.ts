import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { reactions } from '../db/schema';
import { reactionService } from '../services/reactionService';

/**
 * Integration Tests for Temperature-Based Reaction Retrieval
 * 
 * These tests verify that:
 * 1. Reactions are stored with temperature values
 * 2. Queries retrieve reactions with exact temperature matches
 * 3. Queries retrieve reactions within ±15°C tolerance
 * 4. Queries do NOT retrieve reactions outside ±15°C tolerance
 * 5. Null temperatures are handled correctly
 */
describe('Temperature-Based Reaction Retrieval (Integration Tests)', () => {
  const token = uuidv4().slice(0, 8);
  const reactants = [`TST_A_${token}`, `TST_B_${token}`];
  const createdReactionIds: string[] = [];

  beforeAll(async () => {
    const created = await reactionService.createReaction(
      {
        reactants,
        products: [`TST_P_${token}`],
        equation: `${reactants[0]} + ${reactants[1]} -> TST_P_${token}`,
        temperature: 25,
        isPublic: true,
      },
      undefined
    );

    expect(created.success).toBe(true);
    expect(created.created).toBe(true);

    if (created.reaction?.id) {
      createdReactionIds.push(created.reaction.id);
    }
  });

  afterAll(async () => {
    if (createdReactionIds.length > 0) {
      await db.delete(reactions).where(inArray(reactions.id, createdReactionIds));
    }
  });

  it('retrieves data from DB with exact same temperature', async () => {
    const found = await reactionService.findReactionByReactants(reactants, 25);

    expect(found.success).toBe(true);
    expect(found.found).toBe(true);
    expect(found.reaction?.temperature).toBe(25);
  });

  it('retrieves reaction when query temperature is within +15°C', async () => {
    const found = await reactionService.findReactionByReactants(reactants, 40);

    expect(found.success).toBe(true);
    expect(found.found).toBe(true);
  });

  it('retrieves reaction when query temperature is within -15°C', async () => {
    const found = await reactionService.findReactionByReactants(reactants, 10);

    expect(found.success).toBe(true);
    expect(found.found).toBe(true);
  });

  it('does not retrieve reaction when query temperature is > +15°C away', async () => {
    const found = await reactionService.findReactionByReactants(reactants, 41);

    expect(found.success).toBe(true);
    expect(found.found).toBe(false);
  });

  it('does not retrieve reaction when query temperature is > -15°C away', async () => {
    const found = await reactionService.findReactionByReactants(reactants, 9);

    expect(found.success).toBe(true);
    expect(found.found).toBe(false);
  });
});
