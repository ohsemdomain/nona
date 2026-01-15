import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../db";

export function createAuth(env: Env) {
	const db = createDb(env.DB);

	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: "sqlite",
		}),
		emailAndPassword: {
			enabled: true,
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 day
			updateAge: 60 * 60 * 24, // 1 day
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5, // 5 minute
			},
		},
		trustedOrigins: env.TRUSTED_ORIGIN?.split(",") ?? [],
	});
}

export type Auth = ReturnType<typeof createAuth>;
