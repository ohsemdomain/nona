import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { appSetting } from "../db/schema";
import {
	DATE_PLACEHOLDER,
	DIGIT_PLACEHOLDER,
	DEFAULT_FORMAT,
} from "@/shared/type/number-format";

// Validate pattern has exactly one digit placeholder
export function validatePattern(pattern: string): {
	valid: boolean;
	error?: string;
} {
	const digitMatches = pattern.match(/\[\dDIGIT\]/g) || [];

	if (digitMatches.length === 0) {
		return {
			valid: false,
			error: "Format must contain one sequence placeholder like [4DIGIT]",
		};
	}
	if (digitMatches.length > 1) {
		return {
			valid: false,
			error: "Format can only contain one sequence placeholder",
		};
	}

	// Check for invalid placeholders
	const allPlaceholders = pattern.match(/\[[^\]]+\]/g) || [];
	const validPlaceholders = [
		...DATE_PLACEHOLDER,
		...DIGIT_PLACEHOLDER,
	] as readonly string[];

	for (const placeholder of allPlaceholders) {
		if (!validPlaceholders.includes(placeholder)) {
			return { valid: false, error: `Unknown placeholder ${placeholder}` };
		}
	}

	return { valid: true };
}

// Extract period key from pattern based on date placeholders used
function getPeriodKey(pattern: string, date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	let periodKey = "";

	if (pattern.includes("[YYYY]")) {
		periodKey += year;
	} else if (pattern.includes("[YY]")) {
		periodKey += String(year).slice(-2);
	}

	if (pattern.includes("[MM]")) {
		periodKey += month;
	}

	if (pattern.includes("[DD]")) {
		periodKey += day;
	}

	return periodKey || String(year); // Default to year if no date placeholders
}

// Replace date placeholders with actual values
function replaceDatePlaceholder(pattern: string, date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return pattern
		.replace(/\[YYYY\]/g, String(year))
		.replace(/\[YY\]/g, String(year).slice(-2))
		.replace(/\[MM\]/g, month)
		.replace(/\[DD\]/g, day);
}

// Get next sequence number atomically
async function getNextSequence(
	db: Database,
	sequenceKey: string,
): Promise<number> {
	const now = Date.now();

	// Insert with 0 if not exists (race-safe)
	await db
		.insert(appSetting)
		.values({ key: sequenceKey, value: "0", updatedAt: now })
		.onConflictDoNothing();

	// Now increment and return (guaranteed to exist)
	const updated = await db
		.update(appSetting)
		.set({
			value: sql`CAST(value AS INTEGER) + 1`,
			updatedAt: now,
		})
		.where(eq(appSetting.key, sequenceKey))
		.returning({ value: appSetting.value });

	return parseInt(updated[0].value);
}

// Generate preview without incrementing sequence
export function generatePreview(
	pattern: string,
	sequenceNumber: number = 42,
): string {
	const date = new Date();
	let result = replaceDatePlaceholder(pattern, date);

	// Replace digit placeholder
	const digitMatch = pattern.match(/\[(\d)DIGIT\]/);
	if (digitMatch) {
		const minDigits = parseInt(digitMatch[1]);
		const paddedSequence = String(sequenceNumber).padStart(minDigits, "0");
		result = result.replace(/\[\dDIGIT\]/, paddedSequence);
	}

	return result;
}

// Get format pattern for entity type
export async function getFormatPattern(
	db: Database,
	entityType: string,
): Promise<string> {
	const key = `number_format:${entityType}`;

	const setting = await db
		.select({ value: appSetting.value })
		.from(appSetting)
		.where(eq(appSetting.key, key))
		.limit(1);

	if (setting.length > 0) {
		return setting[0].value;
	}

	// Return and save default
	const defaultPattern = DEFAULT_FORMAT[entityType] || "[4DIGIT]";
	await db.insert(appSetting).values({
		key,
		value: defaultPattern,
		updatedAt: Date.now(),
	});

	return defaultPattern;
}

// Save format pattern for entity type
export async function saveFormatPattern(
	db: Database,
	entityType: string,
	pattern: string,
	userId?: string,
): Promise<void> {
	const key = `number_format:${entityType}`;
	const now = Date.now();

	const existing = await db
		.select({ id: appSetting.id })
		.from(appSetting)
		.where(eq(appSetting.key, key))
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(appSetting)
			.set({ value: pattern, updatedAt: now, updatedBy: userId })
			.where(eq(appSetting.key, key));
	} else {
		await db.insert(appSetting).values({
			key,
			value: pattern,
			updatedAt: now,
			updatedBy: userId,
		});
	}
}

// Main function: generate formatted number for entity
export async function generateFormattedNumber(
	db: Database,
	entityType: string,
): Promise<string> {
	const pattern = await getFormatPattern(db, entityType);
	const date = new Date();
	const periodKey = getPeriodKey(pattern, date);
	const sequenceKey = `number_sequence:${entityType}:${periodKey}`;

	const sequence = await getNextSequence(db, sequenceKey);

	let result = replaceDatePlaceholder(pattern, date);

	// Replace digit placeholder with padded sequence
	const digitMatch = pattern.match(/\[(\d)DIGIT\]/);
	if (digitMatch) {
		const minDigits = parseInt(digitMatch[1]);
		const paddedSequence = String(sequence).padStart(minDigits, "0");
		result = result.replace(/\[\dDIGIT\]/, paddedSequence);
	}

	return result;
}
