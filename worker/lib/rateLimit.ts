import type { Context, Next } from "hono";

interface RateLimitConfig {
	limit: number; // Max requests
	window: number; // Time window in seconds
}

/**
 * Get rate limit key based on IP
 */
function getKey(prefix: string, c: Context<{ Bindings: Env }>): string {
	const ip = c.req.header("cf-connecting-ip") || "unknown";
	const minute = Math.floor(Date.now() / 1000 / 60); // Current minute bucket
	return `${prefix}:${ip}:${minute}`;
}

/**
 * Rate limit middleware factory
 */
export function rateLimit(prefix: string, config: RateLimitConfig) {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const key = getKey(prefix, c);
		const kv = c.env.NONA_KV_CACHE;

		// Get current count
		const current = await kv.get(key);
		const count = current ? parseInt(current, 10) : 0;

		if (count >= config.limit) {
			return c.json(
				{ error: "Too many requests. Please try again later." },
				429,
			);
		}

		// Increment counter with TTL
		await kv.put(key, String(count + 1), {
			expirationTtl: config.window,
		});

		// Add rate limit headers
		c.header("X-RateLimit-Limit", String(config.limit));
		c.header("X-RateLimit-Remaining", String(config.limit - count - 1));

		return next();
	};
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit("auth", { limit: 5, window: 900 }); // 5 per 15 min
export const apiRateLimit = rateLimit("api", { limit: 60, window: 60 }); // 60 per min
