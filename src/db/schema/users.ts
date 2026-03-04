import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),
  emailVerificationToken: text('email_verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: integer('reset_password_expires', { mode: 'timestamp' }),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  settings: text('settings', { mode: 'json' }), // JSON preferences
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;