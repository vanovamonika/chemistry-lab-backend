import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import path from 'path';
import * as schema from './schema';
import 'dotenv/config';

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
      },
    ];

    for (const chem of chemicals) {
      await db.insert(schema.chemicals).values({
        id: uuidv4(),
        createdById: userId,
        isPublic: true,
        ...chem,
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
        reactants: JSON.stringify(['HCl', 'NaOH']),
        products: JSON.stringify(['NaCl', 'H2O']),
        color: '#FFFFFF',
        bubbles: false,
        heat: true,
        isVerified: true,
        isPublic: true,
      },
      {
        equation: 'CuSO4 + 5H2O → CuSO4·5H2O',
        reactants: JSON.stringify(['CuSO4', 'H2O']),
        products: JSON.stringify(['CuSO4·5H2O']),
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

    await db.insert(schema.workspaces).values({
      id: uuidv4(),
      userId: userId,
      name: 'My Chemistry Lab',
      description: 'My first workspace',
      labState: JSON.stringify(defaultLabState),
      labTemperature: 25,
      isFumeHoodActive: false,
    });

    console.log('✅ Seed completed successfully!');
    console.log(`📊 Added: ${chemicals.length} chemicals, 2 equipment types, 2 equipment instances, ${reactions.length} reactions`);
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