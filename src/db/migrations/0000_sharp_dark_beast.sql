CREATE TABLE `chemical_content` (
	`id` text PRIMARY KEY NOT NULL,
	`chemical_id` text NOT NULL,
	`equipment_instance_id` text NOT NULL,
	`volume` real NOT NULL,
	`weight` real,
	`molar_concentration` real,
	`color` text NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`chemical_id`) REFERENCES `chemicals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipment_instance_id`) REFERENCES `equipment_instances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chemicals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`formula` text NOT NULL,
	`color_hex` text,
	`color` text,
	`state` text NOT NULL,
	`soluble_in_water` integer DEFAULT true,
	`opacity` real DEFAULT 1,
	`has_refraction` integer DEFAULT false,
	`molar_mass` real,
	`density` real,
	`is_public` integer DEFAULT false,
	`created_by_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type_id` text NOT NULL,
	`name` text,
	`current_workspace_id` text,
	`position_x` real,
	`position_y` real,
	`contents` text,
	`temperature` real DEFAULT 25,
	`is_reacting` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`type_id`) REFERENCES `equipment_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`default_capacity` real NOT NULL,
	`description` text,
	`icon` text,
	`is_public` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `favorite_chemicals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`favorite_id` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorites_unique_index` (
	`user_id` text NOT NULL,
	`favorite_type` text NOT NULL,
	`favorite_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`reactants` text NOT NULL,
	`products` text NOT NULL,
	`equation` text NOT NULL,
	`reaction_type` text,
	`temperature` real,
	`pressure` real,
	`conditions` text,
	`color` text,
	`bubbles` integer DEFAULT false,
	`heat` integer DEFAULT false,
	`precipitate` integer DEFAULT false,
	`gas` text,
	`visual_description` text,
	`safety_warnings` text,
	`is_verified` integer DEFAULT false,
	`verified_by_id` text,
	`verified_at` integer,
	`is_public` integer DEFAULT false,
	`created_by_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_email_verified` integer DEFAULT false,
	`email_verification_token` text,
	`reset_password_token` text,
	`reset_password_expires` integer,
	`avatar` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	`last_login_at` integer,
	`settings` text,
	`is_reaction_verifier_approved` integer DEFAULT false,
	`reaction_verifier_approval_status` text DEFAULT 'not_requested',
	`reaction_verifier_requested_at` integer,
	`reaction_verifier_approved_at` integer,
	`reaction_verifier_approval_request` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `workspace_history` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`chemical_id` text NOT NULL,
	`concentration` real DEFAULT 100 NOT NULL,
	`volume` real,
	`weight` real,
	`molar_concentration` real,
	`container_type` text,
	`label` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chemical_id`) REFERENCES `chemicals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`lab_state` text NOT NULL,
	`equipment_positions` text,
	`active_reactions` text,
	`lab_temperature` real DEFAULT 25,
	`is_fume_hood_active` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
