/**
 * Database Reset Script
 *
 * Drops all tables, regenerates migrations, and seeds fresh data.
 *
 * Usage:
 *   bun run db:reset                    # Reset local + remote, then build
 *   bun run db:reset --local-only       # Reset local only
 *   bun run db:reset --skip-build       # Skip build step
 *   bun run db:reset --skip-seed        # Skip seeding (just reset schema)
 */

import { $ } from "bun";
import { resolve } from "path";
import { existsSync, readdirSync, unlinkSync, writeFileSync, mkdirSync } from "fs";

const ROOT = process.cwd();
const MIGRATIONS_DIR = resolve(ROOT, "worker/db/migrations");
const MIGRATIONS_META_DIR = resolve(MIGRATIONS_DIR, "meta");

// Parse CLI arguments
const args = process.argv.slice(2);
const localOnly = args.includes("--local-only");
const skipBuild = args.includes("--skip-build");
const skipSeed = args.includes("--skip-seed");

function log(emoji: string, message: string) {
	console.log(`${emoji} ${message}`);
}

function logStep(step: number, total: number, message: string) {
	console.log(`\n[$${step}/${total}] ${message}`);
}

async function runCommand(cmd: string, _description: string): Promise<boolean> {
	log("  ", `Running: ${cmd}`);
	try {
		const result = await $`${{ raw: cmd }}`.quiet();
		if (result.exitCode !== 0) {
			console.error(`  Error: ${result.stderr.toString()}`);
			return false;
		}
		return true;
	} catch (error) {
		console.error(`  Failed: ${error}`);
		return false;
	}
}

async function dropTables(remote: boolean) {
	const target = remote ? "--remote" : "--local";
	const label = remote ? "remote" : "local";

	log("  ", `Dropping tables (${label})...`);

	const success = await runCommand(
		`wrangler d1 execute DB ${target} --file=scripts/drop-tables.sql`,
		`Drop tables ${label}`,
	);

	if (!success) {
		log("  ", `Warning: Drop tables ${label} may have failed (tables might not exist yet)`);
	}
}

function cleanMigrations() {
	log("  ", "Cleaning migration files...");

	// Delete .sql files
	if (existsSync(MIGRATIONS_DIR)) {
		const sqlFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
		for (const file of sqlFiles) {
			unlinkSync(resolve(MIGRATIONS_DIR, file));
			log("  ", `Deleted: ${file}`);
		}
	}

	// Delete meta/*.json files (except create empty _journal.json)
	if (existsSync(MIGRATIONS_META_DIR)) {
		const metaFiles = readdirSync(MIGRATIONS_META_DIR).filter((f) => f.endsWith(".json"));
		for (const file of metaFiles) {
			unlinkSync(resolve(MIGRATIONS_META_DIR, file));
			log("  ", `Deleted: meta/${file}`);
		}
	} else {
		// Create meta directory if it doesn't exist
		mkdirSync(MIGRATIONS_META_DIR, { recursive: true });
	}

	// Create empty _journal.json (required by drizzle-kit)
	const emptyJournal = {
		version: "7",
		dialect: "sqlite",
		entries: [],
	};
	writeFileSync(
		resolve(MIGRATIONS_META_DIR, "_journal.json"),
		JSON.stringify(emptyJournal, null, 2),
	);
	log("  ", "Created empty _journal.json");
}

async function main() {
	console.log("=".repeat(60));
	console.log(" Database Reset Script");
	console.log("=".repeat(60));
	console.log(`Mode: ${localOnly ? "Local only" : "Local + Remote"}`);
	console.log(`Build: ${skipBuild ? "Skip" : "Yes"}`);
	console.log(`Seed: ${skipSeed ? "Skip" : "Yes"}`);
	console.log("=".repeat(60));

	const totalSteps = skipBuild ? (skipSeed ? 4 : 5) : (skipSeed ? 5 : 6);
	let step = 0;

	// Step 1: Drop tables (local)
	step++;
	logStep(step, totalSteps, "Dropping tables (local)");
	await dropTables(false);

	// Step 1b: Drop tables (remote) if not local-only
	if (!localOnly) {
		log("  ", "Dropping tables (remote)...");
		await dropTables(true);
	}

	// Step 2: Clean migration files
	step++;
	logStep(step, totalSteps, "Cleaning migration files");
	cleanMigrations();

	// Step 3: Generate new migrations
	step++;
	logStep(step, totalSteps, "Generating new migrations");
	const genSuccess = await runCommand("bunx drizzle-kit generate", "Generate migrations");
	if (!genSuccess) {
		log("  ", "Failed to generate migrations");
		process.exit(1);
	}

	// Step 4: Apply migrations
	step++;
	logStep(step, totalSteps, "Applying migrations");

	const migrateLocalSuccess = await runCommand(
		"wrangler d1 migrations apply DB --local",
		"Migrate local",
	);
	if (!migrateLocalSuccess) {
		log("  ", "Failed to migrate local database");
		process.exit(1);
	}

	if (!localOnly) {
		const migrateRemoteSuccess = await runCommand(
			"wrangler d1 migrations apply DB --remote",
			"Migrate remote",
		);
		if (!migrateRemoteSuccess) {
			log("  ", "Failed to migrate remote database");
			process.exit(1);
		}
	}

	// Step 5: Seed data
	if (!skipSeed) {
		step++;
		logStep(step, totalSteps, "Seeding data");

		// Seed RBAC (local)
		const seedRbacLocal = await runCommand(
			"wrangler d1 execute DB --local --file=scripts/seed-rbac.sql",
			"Seed RBAC local",
		);
		if (!seedRbacLocal) {
			log("  ", "Failed to seed RBAC data locally");
			process.exit(1);
		}

		// Seed RBAC (remote) if not local-only
		if (!localOnly) {
			const seedRbacRemote = await runCommand(
				"wrangler d1 execute DB --remote --file=scripts/seed-rbac.sql",
				"Seed RBAC remote",
			);
			if (!seedRbacRemote) {
				log("  ", "Failed to seed RBAC data remotely");
				process.exit(1);
			}
		}

		// Seed admin user (local only - uses bun:sqlite)
		const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "6C0GbAKB347uSzwx";

		log("  ", `Seeding admin user: ${adminEmail}`);
		const seedAdmin = await runCommand(
			`ADMIN_EMAIL="${adminEmail}" ADMIN_PASSWORD="${adminPassword}" bun run scripts/seed-admin.ts`,
			"Seed admin",
		);
		if (!seedAdmin) {
			log("  ", "Warning: Failed to seed admin user (may already exist)");
		}
	}

	// Step 6: Build
	if (!skipBuild) {
		step++;
		logStep(step, totalSteps, "Building");
		const buildSuccess = await runCommand("bun run build", "Build");
		if (!buildSuccess) {
			log("  ", "Failed to build");
			process.exit(1);
		}
	}

	console.log("\n" + "=".repeat(60));
	log("  ", "Database reset complete!");
	console.log("=".repeat(60));

	if (!skipSeed) {
		console.log("\nDefault admin credentials:");
		console.log(`  Email: ${process.env.ADMIN_EMAIL || "admin@test.com"}`);
		console.log(`  Password: ${process.env.ADMIN_PASSWORD || "6C0GbAKB347uSzwx"}`);
	}
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
