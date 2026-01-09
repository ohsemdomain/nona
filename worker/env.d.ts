import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
    Bindings: {
        DB: D1Database;
        ASSETS: Fetcher;
        TRUSTED_ORIGINS?: string;
    };
}
