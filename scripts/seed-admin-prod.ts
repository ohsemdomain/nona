/**
 * Seed Admin Script for Production (Remote D1)
 *
 * Creates the first admin user on remote D1 via wrangler.
 *
 * Usage:
 *   ADMIN_EMAIL="admin@company.com" ADMIN_PASSWORD="secure-password" bun run db:seed-admin:prod
 */

import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { execFileSync } from "child_process";

function wranglerExec(command: string): string {
	return execFileSync("bunx", ["wrangler", "d1", "execute", "DB", "--remote", "--command", command], {
		encoding: "utf-8",
	});
}

function parseWranglerResult(output: string): { id?: number | string }[] {
	// Find the JSON array in the output (starts with [ and ends with ])
	const startIdx = output.indexOf("[");
	const endIdx = output.lastIndexOf("]");
	if (startIdx === -1 || endIdx === -1) return [];

	try {
		const jsonStr = output.slice(startIdx, endIdx + 1);
		const parsed = JSON.parse(jsonStr);
		return parsed[0]?.results || [];
	} catch {
		return [];
	}
}

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;
	const adminName = process.env.ADMIN_NAME || "Admin";

	if (!adminEmail || !adminPassword) {
		console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD env variables");
		console.error(
			"   Example: ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=test123 bun run db:seed-admin:prod",
		);
		process.exit(1);
	}

	// Validate email format (basic check)
	if (!adminEmail.includes("@") || adminEmail.includes("'")) {
		console.error("❌ Invalid email format");
		process.exit(1);
	}

	// Check if admin already exists
	console.log("🔍 Checking if admin exists...");
	const existingUser = parseWranglerResult(
		wranglerExec(`SELECT id FROM user WHERE email = '${adminEmail}'`),
	);
	if (existingUser.length > 0) {
		console.log("⏭️  Admin already exists, skipping");
		process.exit(0);
	}

	// Hash password
	console.log("🔐 Hashing password...");
	const hashedPassword = await hashPassword(adminPassword);

	// Generate IDs
	const userId = nanoid();
	const publicId = nanoid(7);
	const accountId = nanoid();
	const now = Date.now();

	// Check if Admin role exists
	console.log("📋 Setting up Admin role...");
	const existingRole = parseWranglerResult(
		wranglerExec("SELECT id FROM role WHERE name = 'Admin'"),
	);

	let roleId: number;

	if (existingRole.length > 0) {
		roleId = existingRole[0].id as number;
		console.log(`   Using existing Admin role (id: ${roleId})`);
	} else {
		// Create Admin role
		wranglerExec(
			`INSERT INTO role (name, description, created_at) VALUES ('Admin', 'Full system access', ${now})`,
		);

		// Get the role ID
		const newRole = parseWranglerResult(
			wranglerExec("SELECT id FROM role WHERE name = 'Admin'"),
		);
		roleId = newRole[0].id as number;
		console.log(`   Created Admin role (id: ${roleId})`);

		// Get all permissions and assign to Admin role
		const permissionList = parseWranglerResult(wranglerExec("SELECT id FROM permission"));

		for (const perm of permissionList) {
			wranglerExec(
				`INSERT INTO role_permission (role_id, permission_id) VALUES (${roleId}, ${perm.id})`,
			);
		}
		console.log(`   Assigned ${permissionList.length} permissions to Admin role`);
	}

	// Insert user
	console.log("👤 Creating admin user...");
	wranglerExec(
		`INSERT INTO user (id, public_id, name, email, email_verified, role_id, created_at, updated_at) VALUES ('${userId}', '${publicId}', '${adminName}', '${adminEmail}', 1, ${roleId}, ${now}, ${now})`,
	);

	// Insert account (for email/password auth)
	// Escape single quotes in password hash
	const escapedPassword = hashedPassword.replace(/'/g, "''");
	wranglerExec(
		`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES ('${accountId}', '${adminEmail}', 'credential', '${userId}', '${escapedPassword}', ${now}, ${now})`,
	);

	console.log("✅ Admin created successfully on remote!");
	console.log(`   Email: ${adminEmail}`);
	console.log(`   Role: Admin`);
}

main().catch((err) => {
	console.error("❌ Error:", err.message);
	process.exit(1);
});
