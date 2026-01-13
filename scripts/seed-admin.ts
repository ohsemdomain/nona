/**
 * Seed Admin Script
 *
 * Creates the first admin user via direct D1 database access.
 *
 * Usage:
 *   ADMIN_EMAIL="admin@company.com" ADMIN_PASSWORD="secure-password" bun run db:seed-admin
 */

import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { Database } from "bun:sqlite";
import { resolve } from "path";
import { existsSync, readdirSync } from "fs";

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;
	const adminName = process.env.ADMIN_NAME || "Admin";

	if (!adminEmail || !adminPassword) {
		console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD env variables");
		console.error(
			"   Example: ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=test123 bun run db:seed-admin",
		);
		process.exit(1);
	}

	// Find the D1 database file
	const wranglerState = resolve(process.cwd(), ".wrangler/state/v3/d1");
	if (!existsSync(wranglerState)) {
		console.error("❌ D1 database not found. Run migrations first:");
		console.error("   bun run db:migrate");
		process.exit(1);
	}

	// Find the miniflare-D1DatabaseObject directory
	const dirs = readdirSync(wranglerState);
	const d1Dir = dirs.find((d) => d.startsWith("miniflare-D1DatabaseObject"));
	if (!d1Dir) {
		console.error("❌ D1 database directory not found");
		process.exit(1);
	}

	// Find the .sqlite file
	const d1Path = resolve(wranglerState, d1Dir);
	const files = readdirSync(d1Path);
	const sqliteFile = files.find((f) => f.endsWith(".sqlite"));
	if (!sqliteFile) {
		console.error("❌ SQLite database file not found");
		process.exit(1);
	}

	const dbPath = resolve(d1Path, sqliteFile);
	console.log(`📁 Using database: ${dbPath}`);

	// Open database
	const db = new Database(dbPath);

	// Check if admin exists
	const existing = db
		.prepare("SELECT id FROM user WHERE email = ?")
		.get(adminEmail);
	if (existing) {
		console.log("⏭️  Admin already exists, skipping");
		db.close();
		process.exit(0);
	}

	// Get or create admin role
	let adminRole = db
		.prepare("SELECT id FROM role WHERE name = 'Admin'")
		.get() as { id: number } | undefined;

	if (!adminRole) {
		console.log("📋 Creating Admin role with all permissions...");

		// Create the Admin role
		db.prepare(
			"INSERT INTO role (name, description, created_at) VALUES (?, ?, ?)",
		).run("Admin", "Full system access", Date.now());

		adminRole = db
			.prepare("SELECT id FROM role WHERE name = 'Admin'")
			.get() as { id: number };

		// Get all permissions
		const permissionList = db
			.prepare("SELECT id FROM permission")
			.all() as { id: number }[];

		// Assign all permissions to Admin role
		const insertRolePermission = db.prepare(
			"INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)",
		);

		for (const perm of permissionList) {
			insertRolePermission.run(adminRole.id, perm.id);
		}

		console.log(
			`   Assigned ${permissionList.length} permissions to Admin role`,
		);
	}

	// Hash password
	console.log("🔐 Hashing password...");
	const hashedPassword = await hashPassword(adminPassword);

	// Generate IDs
	const userId = nanoid();
	const publicId = nanoid(7); // Short public ID
	const accountId = nanoid();
	const now = Date.now();

	// Insert user
	db.prepare(
		`INSERT INTO user (id, public_id, name, email, email_verified, role_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	).run(userId, publicId, adminName, adminEmail, 1, adminRole.id, now, now);

	// Insert account (for email/password auth)
	db.prepare(
		`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
	).run(accountId, adminEmail, "credential", userId, hashedPassword, now, now);

	console.log("✅ Admin created successfully");
	console.log(`   Email: ${adminEmail}`);
	console.log(`   Role: Admin`);

	db.close();
}

main().catch((err) => {
	console.error("❌ Error:", err.message);
	process.exit(1);
});
