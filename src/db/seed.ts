import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
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
      console.log('✅ Database already has data, ensuring verified demo reaction exists...');

      const demoUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, 'demo@chemistrylab.com'))
        .limit(1);

      if (demoUser.length > 0) {
        const existingVerifiedReaction = await db
          .select()
          .from(schema.reactions)
          .where(eq(schema.reactions.equation, 'HCl + NaOH → NaCl + H2O'))
          .limit(1);

        if (existingVerifiedReaction.length === 0) {
          const now = new Date();
          await db.insert(schema.reactions).values({
            id: uuidv4(),
            equation: 'HCl + NaOH → NaCl + H2O',
            reactants: ['HCl', 'NaOH'],
            products: ['NaCl', 'H2O'],
            temperature: 25,
            color: '#FFFFFF',
            bubbles: false,
            heat: true,
            isVerified: true,
            verifiedById: demoUser[0].id,
            verifiedAt: now,
            isPublic: true,
            createdById: demoUser[0].id,
            createdAt: now,
            updatedAt: now,
          });
          console.log('✅ Added missing verified demo reaction for guest testing');
        } else {
          await db
            .update(schema.reactions)
            .set({
              temperature: existingVerifiedReaction[0].temperature ?? 25,
              isVerified: true,
              verifiedById: existingVerifiedReaction[0].verifiedById ?? demoUser[0].id,
              verifiedAt: existingVerifiedReaction[0].verifiedAt ?? new Date(),
              isPublic: true,
              updatedAt: new Date(),
            })
            .where(eq(schema.reactions.id, existingVerifiedReaction[0].id));
          console.log('✅ Verified demo reaction already exists');
        }
      }

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
        density: 1.0, // g/mL
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
        density: 1.19, // g/mL
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
        density: 2.13, // g/mL
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
        density: 2.165, // g/mL
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
        density: 0.789, // g/mL
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
        density: 2.284, // g/mL
      },
      {
        name: 'Copper(II) Hydroxide',
        formula: 'Cu(OH)2',
        colorHex: '#6EC1E4',
        color: 'Light Blue',
        state: 'solid' as const,
        solubleInWater: false,
        opacity: 1,
        hasRefraction: true,
        molarMass: 97.56, // g/mol
        density: 3.37, // g/mL
      },
      {
        name: 'Sodium Sulfate',
        formula: 'Na2SO4',
        colorHex: '#ffffff',
        color: 'White',
        state: 'solid' as const,
        solubleInWater: true,
        opacity: 1,
        hasRefraction: true,
        molarMass: 142.04, // g/mol
        density: 2.664, // g/mL
      },
    ];

    for (const chem of chemicals) {
      const computedMolarMass = calculateMolarMass(chem.formula);
      const resolvedMolarMass = computedMolarMass ?? (chem as any).molarMass;

      if (!resolvedMolarMass || resolvedMolarMass <= 0) {
        throw new Error(`Seed validation failed: missing/invalid molar mass for ${chem.name} (${chem.formula})`);
      }

      if (!chem.density || chem.density <= 0) {
        throw new Error(`Seed validation failed: missing/invalid density for ${chem.name} (${chem.formula})`);
      }

      await db.insert(schema.chemicals).values({
        id: uuidv4(),
        createdById: userId,
        isPublic: true,
        ...chem,
        molarMass: resolvedMolarMass,
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
        temperature: 25,
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
        temperature: 25,
        reactionType: 'hydration',
        color: '#3B7A9E',
        precipitate: true,
        visualDescription: 'Blue crystals form',
        isVerified: true,
        isPublic: true,
      },
      {
        equation: 'AgNO3 + NaCl → AgCl + NaNO3',
        reactants: ['AgNO3', 'NaCl'],
        products: ['AgCl', 'NaNO3'],
        temperature: 25,
        reactionType: 'double displacement',
        precipitate: true,
        color: '#FFFFFF',
        visualDescription: 'White precipitate (AgCl) forms',
        isVerified: true,
        isPublic: true,
      },
    ];

    for (const reaction of reactions) {
      await db.insert(schema.reactions).values({
        id: uuidv4(),
        verifiedById: userId,
        verifiedAt: new Date(),
        createdById: userId,
        ...reaction,
      });
    }

    // 4. Create a demo workspace
    console.log('🔬 Creating demo workspace...');
    const workspaceId = uuidv4();

    // Create workspace first so workspace inventory FK references are valid
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      userId: userId,
      name: 'My Chemistry Lab',
      description: 'My first workspace',
      labState: JSON.stringify({
        equipment: {},
        chemicals: {},
        workspaceInventory: [],
        activeReactions: {},
        reactionHistory: [],
        labTemperature: 25,
        isFumeHoodActive: false,
        safetyGoggles: true,
      }),
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

    const hclId = getChemicalId('HCl');
    const naohId = getChemicalId('NaOH');
    const naclId = getChemicalId('NaCl');
    const ethanolId = getChemicalId('C2H5OH');
    const cuso4Id = getChemicalId('CuSO4.5H2O');

    const hclInventoryId = uuidv4();
    const naohInventoryId = uuidv4();
    const naclInventoryId = uuidv4();
    const ethanolInventoryId = uuidv4();
    const cuso4InventoryId = uuidv4();

    const workspaceInventoryItems = [
      {
        // 50% HCl solution
        id: hclInventoryId,
        workspaceId: workspaceId,
        chemicalId: hclId,
        concentration: 50,
        volume: 100, // 100 mL available
        molarConcentration: 13.7, // ~50% HCl is approximately 13.7 M
        label: 'Diluted HCl',
        containerType: 'bottle',
      },
      {
        // 10% NaOH solution
        id: naohInventoryId,
        workspaceId: workspaceId,
        chemicalId: naohId,
        concentration: 10,
        volume: 150, // 150 mL available
        weight: 16.7,
        molarConcentration: 2.5, // ~10% NaOH is approximately 2.5 M
        label: 'Diluted NaOH',
        containerType: 'bottle',
      },
      {
        // Saturated NaCl solution (~26% at 25°C)
        id: naclInventoryId,
        workspaceId: workspaceId,
        chemicalId: naclId,
        concentration: 26,
        volume: 200, // 200 mL available
        weight: 70.3,
        molarConcentration: 6.1, // Saturated NaCl is about 6.1 M
        label: 'Saturated Salt Solution',
        containerType: 'flask',
      },
      {
        // 70% Ethanol solution
        id: ethanolInventoryId,
        workspaceId: workspaceId,
        chemicalId: ethanolId,
        concentration: 70,
        volume: 200, // 200 mL available
        molarConcentration: 12.1, // ~70% ethanol is approximately 12.1 M
        label: 'Rubbing Alcohol (70%)',
        containerType: 'bottle',
      },
      {
        // 5% Copper Sulfate solution
        id: cuso4InventoryId,
        workspaceId: workspaceId,
        chemicalId: cuso4Id,
        concentration: 5,
        volume: 250, // 250 mL available
        weight: 13.2,
        molarConcentration: 0.2, // ~5% CuSO4·5H2O is approximately 0.2 M
        label: 'Dilute Copper Sulfate',
        containerType: 'beaker',
      },
    ];

    for (const item of workspaceInventoryItems) {
      if (item.chemicalId) { // Only insert if chemical exists
        await db.insert(schema.workspaceInventory).values(item);
      }
    }

    // 6. Seed equipment with actual physical storage locations for workspace inventory items
    console.log('🧰 Adding seeded equipment instances with linked inventory contents...');

    const beaker1Id = uuidv4();
    const testTube1Id = uuidv4();
    const flask1Id = uuidv4();
    const flask2Id = uuidv4();
    const testTube2Id = uuidv4();

    const seededEquipmentState = {
      [beaker1Id]: {
        id: beaker1Id,
        type: 'beaker',
        typeId: beakerTypeId,
        name: 'Beaker A',
        position: { x: 220, y: 360 },
        contents: [
          {
            chemicalId: hclId,
            color: '#fffacd',
            state: 'aqueous',
            volume: 100,
            weight: undefined,
            molarConcentration: 13.7,
            workspaceInventoryItemId: hclInventoryId,
          },
        ],
        capacity: 250,
        currentVolume: 100,
        temperature: 25,
        isReacting: false,
      },
      [testTube1Id]: {
        id: testTube1Id,
        type: 'beaker',
        typeId: beakerTypeId,
        name: 'Beaker B',
        position: { x: 420, y: 360 },
        contents: [
          {
            chemicalId: naohId,
            color: '#ffffff',
            state: 'aqueous',
            volume: 150,
            weight: 16.7,
            molarConcentration: 2.5,
            workspaceInventoryItemId: naohInventoryId,
          },
        ],
        capacity: 250,
        currentVolume: 150,
        temperature: 25,
        isReacting: false,
      },
      [flask1Id]: {
        id: flask1Id,
        type: 'flask',
        typeId: flaskTypeId,
        name: 'Flask A',
        position: { x: 620, y: 360 },
        contents: [
          {
            chemicalId: naclId,
            color: '#ffffff',
            state: 'aqueous',
            volume: 200,
            weight: 70.3,
            molarConcentration: 6.1,
            workspaceInventoryItemId: naclInventoryId,
          },
        ],
        capacity: 500,
        currentVolume: 200,
        temperature: 25,
        isReacting: false,
      },
      [flask2Id]: {
        id: flask2Id,
        type: 'flask',
        typeId: flaskTypeId,
        name: 'Flask B',
        position: { x: 820, y: 360 },
        contents: [
          {
            chemicalId: ethanolId,
            color: '#ffffff',
            state: 'aqueous',
            volume: 200,
            weight: undefined,
            molarConcentration: 12.1,
            workspaceInventoryItemId: ethanolInventoryId,
          },
        ],
        capacity: 500,
        currentVolume: 200,
        temperature: 25,
        isReacting: false,
      },
      [testTube2Id]: {
        id: testTube2Id,
        type: 'beaker',
        typeId: beakerTypeId,
        name: 'Beaker C',
        position: { x: 1020, y: 360 },
        contents: [
          {
            chemicalId: cuso4Id,
            color: '#87CEEB',
            state: 'aqueous',
            volume: 250,
            weight: 13.2,
            molarConcentration: 0.2,
            workspaceInventoryItemId: cuso4InventoryId,
          },
        ],
        capacity: 250,
        currentVolume: 250,
        temperature: 25,
        isReacting: false,
      },
    };

    const defaultLabState = {
      equipment: seededEquipmentState,
      chemicals: {},
      workspaceInventory: workspaceInventoryItems,
      activeReactions: {},
      reactionHistory: [],
      labTemperature: 25,
      isFumeHoodActive: false,
      safetyGoggles: true,
    };

    await db
      .update(schema.workspaces)
      .set({
        labState: JSON.stringify(defaultLabState),
        labTemperature: 25,
        isFumeHoodActive: false,
      })
      .where(eq(schema.workspaces.id, workspaceId));

    await db.insert(schema.equipmentInstances).values([
      {
        id: beaker1Id,
        userId,
        typeId: beakerTypeId,
        name: 'Beaker A',
        currentWorkspaceId: workspaceId,
        positionX: 220,
        positionY: 360,
        contents: seededEquipmentState[beaker1Id].contents,
        temperature: 25,
        isReacting: 0,
      },
      {
        id: testTube1Id,
        userId,
        typeId: beakerTypeId,
        name: 'Beaker B',
        currentWorkspaceId: workspaceId,
        positionX: 420,
        positionY: 360,
        contents: seededEquipmentState[testTube1Id].contents,
        temperature: 25,
        isReacting: 0,
      },
      {
        id: flask1Id,
        userId,
        typeId: flaskTypeId,
        name: 'Flask A',
        currentWorkspaceId: workspaceId,
        positionX: 620,
        positionY: 360,
        contents: seededEquipmentState[flask1Id].contents,
        temperature: 25,
        isReacting: 0,
      },
      {
        id: flask2Id,
        userId,
        typeId: flaskTypeId,
        name: 'Flask B',
        currentWorkspaceId: workspaceId,
        positionX: 820,
        positionY: 360,
        contents: seededEquipmentState[flask2Id].contents,
        temperature: 25,
        isReacting: 0,
      },
      {
        id: testTube2Id,
        userId,
        typeId: beakerTypeId,
        name: 'Beaker C',
        currentWorkspaceId: workspaceId,
        positionX: 1020,
        positionY: 360,
        contents: seededEquipmentState[testTube2Id].contents,
        temperature: 25,
        isReacting: 0,
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`📊 Added: ${chemicals.length} chemicals, 3 equipment types, ${reactions.length} reactions, ${workspaceInventoryItems.length} workspace inventory items, 5 equipment instances`);
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