import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from './schema/index';
import 'dotenv/config';

const runMigrations = async () => {
  console.log('🔄 Running migrations...');
  
  const dbPath = path.join(process.cwd(), 'sqlite.db');
  console.log(`📁 Database path: ${dbPath}`);
  
  try {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });
    
    // This will run migrations on the database
    migrate(db, { 
      migrationsFolder: path.join(__dirname, 'migrations')
    });
    
    console.log('✅ Migrations completed successfully!');
    
    sqlite.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations
runMigrations();