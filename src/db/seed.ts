import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import path from 'path';
import * as schema from './schema';
import 'dotenv/config';
import { calculateMolarMass } from '../utils/chemistry';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  // Connect to database
  const dbPath = path.join(process.cwd(), process.env.DB_PATH || 'sqlite.db');
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });
  
  try {
    // Check if already seeded
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length > 0) {
      console.log('✅ Database already has data, skipping seed');
      return;
    }

    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp

    // 1. Create a demo user
    console.log('📝 Creating demo user...');
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const newUser: typeof schema.users.$inferInsert = {
      id: userId,
      email: 'demo@chemistrylab.com',
      username: 'chemist_demo',
      passwordHash: hashedPassword,
      isEmailVerified: true,
      settings: JSON.stringify({ theme: 'light' }),
    }

    await db.insert(schema.users).values(newUser);

    // 2. Add common chemicals
    console.log('🧪 Adding chemicals...');
    const chemicals = [
      {
        name: 'Water',
        formula: 'H2O',
        colorHex: '#ffffff',
        color: 'Colorless',
        state: 'liquid' as const,
        solubleInWater: true,
        opacity: 0.01,
        hasRefraction: true,
        molarMass: 18.015, // g/mol
      },
      {
        name: 'Hydrochloric Acid',
        formula: 'HCl',
        colorHex: '#fffacd',
        color: 'Yellow',
        state: 'liquid' as const,
        solubleInWater: true,
        opacity: 0.01,
        hasRefraction: true,
        molarMass: 36.458, // g/mol
      },
      {
        name: 'Sodium Hydroxide',
        formula: 'NaOH',
        colorHex: '#ffffff',
        color: 'White',
        state: 'solid' as const,
        solubleInWater: true,
        opacity: 1,
        hasRefraction: true,
        molarMass: 39.997, // g/mol
      },
      {
        name: 'Sodium Chloride',
        formula: 'NaCl',
        colorHex: '#ffffff',
        color: 'White',
        state: 'solid' as const,
        solubleInWater: true,
        opacity: 1,
        hasRefraction: true,
        molarMass: 58.443, // g/mol
      },
      {
        name: 'Ethanol',
        formula: 'C2H5OH',
        colorHex: '#ffffff',
        color: 'Colorless',
        state: 'liquid' as const,
        solubleInWater: true,
        opacity: 0.01,
        hasRefraction: true,
        molarMass: 46.068, // g/mol
      },
      {
        name: 'Copper Sulfate Pentahydrate',
        formula: 'CuSO4.5H2O',
        colorHex: '#87CEEB',
        color: 'Sky Blue',
        state: 'solid' as const,
        solubleInWater: true,
        opacity: 1,
        hasRefraction: true,
        molarMass: 249.685, // g/mol
      },
    ];

    for (const chem of chemicals) {
      const computedMolarMass = calculateMolarMass(chem.formula);
      await db.insert(schema.chemicals).values({
        id: uuidv4(),
        createdById: userId,
        isPublic: true,
        ...chem,
        molarMass: computedMolarMass ?? (chem as any).molarMass,
      });
    }

    // 2.5 Add equipment types
    console.log('🧱 Adding equipment types...');
    const beakerTypeId = uuidv4();
    const testTubeTypeId = uuidv4();
    const flaskTypeId = uuidv4();

    await db.insert(schema.equipmentTypes).values([
      {
        id: beakerTypeId,
        name: 'Beaker',
        type: 'beaker',
        defaultCapacity: 250,
        description: 'A cylindrical laboratory glass vessel with a flat bottom',
        isPublic: 1,
      },
      {
        id: testTubeTypeId,
        name: 'Test Tube',
        type: 'testTube',
        defaultCapacity: 50,
        description: 'A small cylinder of thin glass closed at one end',
        isPublic: 1,
      },
      {
        id: flaskTypeId,
        name: 'Flask',
        type: 'flask',
        defaultCapacity: 500,
        description: 'A conical flask with a narrow neck for mixing and heating',
        isPublic: 1,
      },
    ]);

    // 2.6 Users start with empty workspace - no default equipment instances
    console.log('✓ Equipment types added (users start with empty workspace)');

    // 3. Add some reactions
    console.log('⚗️ Adding reactions...');
    const reactions = [
      {
        equation: 'HCl + NaOH → NaCl + H2O',
        reactants: ['HCl', 'NaOH'],
        products: ['NaCl', 'H2O'],
        color: '#FFFFFF',
        bubbles: false,
        heat: true,
        isVerified: true,
        isPublic: true,
      },
      {
        equation: 'CuSO4 + 5H2O → CuSO4·5H2O',
        reactants: ['CuSO4', 'H2O'],
        products: ['CuSO4·5H2O'],
        reactionType: 'hydration',
        color: '#3B7A9E',
        precipitate: true,
        visualDescription: 'Blue crystals form',
        isVerified: true,
        isPublic: true,
      },
    ];

    for (const reaction of reactions) {
      await db.insert(schema.reactions).values({
        id: uuidv4(),
        createdById: userId,
        ...reaction,
      });
    }

    // 4. Create a demo workspace
    console.log('🔬 Creating demo workspace...');
    const defaultLabState = {
      equipment: {},
      chemicals: {},
      activeReactions: {},
      reactionHistory: [],
      labTemperature: 25,
      isFumeHoodActive: false,
      safetyGoggles: true,
    };

    const workspaceId = uuidv4();
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      userId: userId,
      name: 'My Chemistry Lab',
      description: 'My first workspace',
      labState: JSON.stringify(defaultLabState),
      labTemperature: 25,
      isFumeHoodActive: false,
    });

    // 5. Add workspace inventory with various concentrations
    console.log('🧪 Adding workspace inventory items...');
    
    // Get the chemical IDs we just created
    const allChemicals = await db.select().from(schema.chemicals);
    const getChemicalId = (formula: string) => {
      const chem = allChemicals.find(c => c.formula === formula);
      return chem?.id || '';
    };

    const workspaceInventoryItems = [
      {
        // 50% HCl solution
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('HCl'),
        concentration: 50,
        volume: 100, // 100 mL available
        molarConcentration: 13.7, // ~50% HCl is approximately 13.7 M
        label: 'Diluted HCl',
        containerType: 'bottle',
      },
      {
        // 10% NaOH solution
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('NaOH'),
        concentration: 10,
        volume: 150, // 150 mL available
        molarConcentration: 2.5, // ~10% NaOH is approximately 2.5 M
        label: 'Diluted NaOH',
        containerType: 'bottle',
      },
      {
        // Saturated NaCl solution (~26% at 25°C)
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('NaCl'),
        concentration: 26,
        volume: 200, // 200 mL available
        molarConcentration: 6.1, // Saturated NaCl is about 6.1 M
        label: 'Saturated Salt Solution',
        containerType: 'flask',
      },
      {
        // 70% Ethanol solution
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('C2H5OH'),
        concentration: 70,
        volume: 500, // 500 mL available
        molarConcentration: 12.1, // ~70% ethanol is approximately 12.1 M
        label: 'Rubbing Alcohol (70%)',
        containerType: 'bottle',
      },
      {
        // 5% Copper Sulfate solution
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('CuSO4.5H2O'),
        concentration: 5,
        volume: 250, // 250 mL available
        molarConcentration: 0.2, // ~5% CuSO4·5H2O is approximately 0.2 M
        label: 'Dilute Copper Sulfate',
        containerType: 'beaker',
      },
      {
        // Pure water (100%)
        id: uuidv4(),
        workspaceId: workspaceId,
        chemicalId: getChemicalId('H2O'),
        concentration: 100,
        volume: 1000, // 1000 mL available
        label: 'Distilled Water',
        containerType: 'bottle',
      },
    ];

    for (const item of workspaceInventoryItems) {
      if (item.chemicalId) { // Only insert if chemical exists
        await db.insert(schema.workspaceInventory).values(item);
      }
    }

    console.log('✅ Seed completed successfully!');
    console.log(`📊 Added: ${chemicals.length} chemicals, 3 equipment types, ${reactions.length} reactions, ${workspaceInventoryItems.length} workspace inventory items`);
    console.log('🔑 Demo login: demo@chemistrylab.com / demo123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});