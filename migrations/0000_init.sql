CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`date` text NOT NULL,
	`staff_id` integer NOT NULL,
	`shift_code` text NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignments_schedule_staff_date_code_uq` ON `assignments` (`schedule_id`,`staff_id`,`date`,`shift_code`);--> statement-breakpoint
CREATE TABLE `holidays` (
	`date` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year_month` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`seed` text,
	`generated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_year_month_unique` ON `schedules` (`year_month`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shift_types` (
	`code` text NOT NULL,
	`applies_to` text NOT NULL,
	`label` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`hours` real NOT NULL,
	`weekday_only` integer DEFAULT false NOT NULL,
	`holiday_only` integer DEFAULT false NOT NULL,
	`sort_no` integer DEFAULT 0 NOT NULL,
	`note` text,
	PRIMARY KEY(`code`, `applies_to`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_no` integer NOT NULL,
	`name` text NOT NULL,
	`role_type` text NOT NULL,
	`allowed_shifts` text DEFAULT '[]' NOT NULL,
	`flags` text DEFAULT '{}' NOT NULL,
	`phone` text,
	`pin_hash` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_order_no_unique` ON `staff` (`order_no`);