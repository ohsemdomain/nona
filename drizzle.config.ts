import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: ["./worker/db/schema.ts", "./worker/db/auth-schema.ts"],
	out: "./worker/db/migrations",
	dialect: "sqlite",
});
