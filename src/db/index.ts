import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema/index';  // Explicitly point to index
import path from 'path';
import 'dotenv/config';

const dbPath = path.join(process.cwd(), process.env.DB_PATH || 'sqlite.db');
console.log(`📁 Database path: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON;');

console.log('✅ Database connected');