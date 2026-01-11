import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";
import * as auditSchema from "./audit-schema";

const allSchema = { ...schema, ...authSchema, ...auditSchema };

export function createDb(d1: D1Database) {
	return drizzle(d1, { schema: allSchema });
}

export type Database = ReturnType<typeof createDb>;

export * from "./schema";
export * from "./auth-schema";
export * from "./audit-schema";
