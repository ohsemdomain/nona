import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { role } from "./schema";

export const user = sqliteTable(
    "user",
    {
        id: text("id").primaryKey(),
        publicId: text("public_id").notNull().unique(),
        name: text("name").notNull(),
        email: text("email").notNull().unique(),
        emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
        image: text("image"),
        roleId: integer("role_id").references(() => role.id),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
        deletedAt: integer("deleted_at", { mode: "timestamp" }),
    },
    (table) => [
        index("user_role_id_idx").on(table.roleId),
        index("user_public_id_idx").on(table.publicId),
    ],
);

export const session = sqliteTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id),
    },
    (table) => [
        index("session_user_id_idx").on(table.userId),
        index("session_expires_at_idx").on(table.expiresAt),
    ],
);

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
        mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
        mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});
