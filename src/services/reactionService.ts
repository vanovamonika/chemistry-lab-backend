import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { reactions } from '../db/schema';

export type CreateReactionInput = {
  reactants: string[];
  products: string[];
  equation?: string;
  reactionType?: string;
  temperature?: number;
  pressure?: number;
  conditions?: string;
  color?: string;
  bubbles?: boolean;
  heat?: boolean;
  precipitate?: boolean;
  gas?: string;
  visualDescription?: string;
  safetyWarnings?: string[];
  isVerified?: boolean;
  isPublic?: boolean;
};

const normalizeFormula = (formula: string): string =>
  formula.replace(/\s+/g, '').toLowerCase();

const normalizeReactants = (reactantsList: string[]): string[] =>
  reactantsList
    .map(normalizeFormula)
    .filter(Boolean)
    .sort();

const REACTION_TEMPERATURE_TOLERANCE_C = 15;

const isTemperatureWithinTolerance = (
  storedTemperature: number | null,
  targetTemperature?: number
): boolean => {
  if (typeof targetTemperature !== 'number' || Number.isNaN(targetTemperature)) {
    return true;
  }

  if (typeof storedTemperature !== 'number' || Number.isNaN(storedTemperature)) {
    return false;
  }

  return Math.abs(storedTemperature - targetTemperature) <= REACTION_TEMPERATURE_TOLERANCE_C;
};

const extractFormula = (entry: unknown): string | null => {
  if (typeof entry === 'string') {
    return entry;
  }

  if (entry && typeof entry === 'object' && 'formula' in entry) {
    const candidate = (entry as { formula?: unknown }).formula;
    return typeof candidate === 'string' ? candidate : null;
  }

  return null;
};

const parseFormulaArray = (value: unknown): string[] => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(extractFormula)
          .filter((formula): formula is string => Boolean(formula));
      }
    } catch {
      // ignore invalid JSON and fall through
    }
  }

  if (!Array.isArray(value)) return [];
  return value
    .map(extractFormula)
    .filter((formula): formula is string => Boolean(formula));
};

export const reactionService = {
  findReactionByReactants: async (reactantsInput: string[], temperature?: number) => {
    try {
      const normalizedTarget = normalizeReactants(reactantsInput);

      if (normalizedTarget.length < 2) {
        return {
          success: true,
          found: false,
          message: 'At least two reactants are required',
        };
      }

      const allReactions = await db.select().from(reactions);

      const matched = allReactions.find((reaction) => {
        const storedReactants = parseFormulaArray(reaction.reactants);
        const normalizedStored = normalizeReactants(storedReactants);

        if (normalizedStored.length !== normalizedTarget.length) {
          return false;
        }

        const reactantsMatch = normalizedStored.every((item, index) => item === normalizedTarget[index]);
        if (!reactantsMatch) return false;

        return isTemperatureWithinTolerance(reaction.temperature, temperature);
      });

      if (!matched) {
        return {
          success: true,
          found: false,
          message: 'Reaction not found in database',
        };
      }

      return {
        success: true,
        found: true,
        reaction: {
          ...matched,
          reactants: parseFormulaArray(matched.reactants),
          products: parseFormulaArray(matched.products),
        },
      };
    } catch (error) {
      console.error('Error finding reaction by reactants:', error);
      return {
        success: false,
        found: false,
        message: 'Error finding reaction',
      };
    }
  },

  createReaction: async (input: CreateReactionInput, userId?: string) => {
    try {
      const existing = await reactionService.findReactionByReactants(input.reactants, input.temperature);
      if (existing.success && existing.found && existing.reaction) {
        return {
          success: true,
          created: false,
          message: 'Reaction already exists',
          reaction: existing.reaction,
        };
      }

      const savedReaction = await db
        .insert(reactions)
        .values({
          id: uuidv4(),
          reactants: input.reactants,
          products: input.products,
          equation: input.equation || `${input.reactants.join(' + ')} -> ${input.products.join(' + ')}`,
          reactionType: input.reactionType,
          temperature: input.temperature,
          pressure: input.pressure,
          conditions: input.conditions,
          color: input.color,
          bubbles: input.bubbles,
          heat: input.heat,
          precipitate: input.precipitate,
          gas: input.gas,
          visualDescription: input.visualDescription,
          safetyWarnings: input.safetyWarnings,
          isVerified: input.isVerified,
          isPublic: input.isPublic ?? true,
          createdById: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        created: true,
        message: 'Reaction saved successfully',
        reaction: savedReaction[0],
      };
    } catch (error) {
      console.error('Error creating reaction:', error);
      return {
        success: false,
        created: false,
        message: 'Error creating reaction',
      };
    }
  },

  getReactionById: async (id: string) => {
    try {
      const found = await db.select().from(reactions).where(eq(reactions.id, id)).limit(1);

      if (found.length === 0) {
        return {
          success: false,
          message: 'Reaction not found',
        };
      }

      return {
        success: true,
        reaction: {
          ...found[0],
          reactants: parseFormulaArray(found[0].reactants),
          products: parseFormulaArray(found[0].products),
        },
      };
    } catch (error) {
      console.error('Error fetching reaction by id:', error);
      return {
        success: false,
        message: 'Error fetching reaction',
      };
    }
  },
};
