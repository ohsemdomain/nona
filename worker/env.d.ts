interface Env {
	DB: D1Database;
	ASSETS: Fetcher;
	BROWSER: Fetcher;
	NONA_KV_CACHE: KVNamespace;
	R2: R2Bucket;
	TRUSTED_ORIGIN?: string;
	SESSION_TOKEN_SECRET?: string;
	BETTER_AUTH_SECRET?: string;
}
