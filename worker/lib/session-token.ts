/**
 * Session Token Utilities
 *
 * Creates and verifies HMAC-signed session tokens for fast client-side authentication.
 * The token is stored in localStorage and verified in background to avoid blocking UI.
 */

// Token expiry: 7 days
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Refresh threshold: 1 day remaining
const REFRESH_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000;

// Default secret for development (DO NOT use in production)
const DEV_SECRET = "dev-session-secret-do-not-use-in-production";

export interface SessionPayload {
	userId: string;
	publicId: string;
	email: string;
	name: string;
	role: string | null;
	permissions: string[];
	issuedAt: number;
	expiresAt: number;
}

export interface SignedSessionToken {
	payload: SessionPayload;
	signature: string;
}

function getSecret(env: Env): string {
	const secret = env.SESSION_TOKEN_SECRET;
	if (!secret) {
		// In development (localhost), use default secret with warning
		if (env.TRUSTED_ORIGIN?.includes("localhost")) {
			console.warn("Using dev secret - DO NOT use in production");
			return DEV_SECRET;
		}
		// In production, fail fast - secret must be configured
		throw new Error(
			"SESSION_TOKEN_SECRET environment variable is required in production. " +
			"Generate a secure random string (32+ characters) and set it in your environment."
		);
	}
	return secret;
}

async function hmacSign(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(data);

	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", key, messageData);
	const signatureArray = new Uint8Array(signature);

	// Convert to hex string
	return Array.from(signatureArray)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function hmacVerify(
	data: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const expectedSignature = await hmacSign(data, secret);
	// Timing-safe comparison
	if (signature.length !== expectedSignature.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	return result === 0;
}

export async function createSessionToken(
	env: Env,
	user: {
		id: string;
		publicId: string;
		email: string;
		name: string;
		role: string | null;
		permissions: string[];
	},
): Promise<SignedSessionToken> {
	const now = Date.now();
	const payload: SessionPayload = {
		userId: user.id,
		publicId: user.publicId,
		email: user.email,
		name: user.name,
		role: user.role,
		permissions: user.permissions,
		issuedAt: now,
		expiresAt: now + TOKEN_EXPIRY_MS,
	};

	const secret = getSecret(env);
	const payloadString = JSON.stringify(payload);
	const signature = await hmacSign(payloadString, secret);

	return { payload, signature };
}

export async function verifySessionToken(
	env: Env,
	token: SignedSessionToken,
): Promise<boolean> {
	const secret = getSecret(env);
	const payloadString = JSON.stringify(token.payload);
	const isValid = await hmacVerify(payloadString, token.signature, secret);

	if (!isValid) {
		return false;
	}

	// Check expiry
	if (token.payload.expiresAt < Date.now()) {
		return false;
	}

	return true;
}

export function shouldRefreshToken(token: SignedSessionToken): boolean {
	const timeRemaining = token.payload.expiresAt - Date.now();
	return timeRemaining < REFRESH_THRESHOLD_MS;
}

export function isTokenExpired(expiresAt: number): boolean {
	return expiresAt < Date.now();
}
