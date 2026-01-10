import type { Context } from "hono";

export interface ListResponse<T> {
	data: T[];
	total: number;
}

export function listResponse<T>(c: Context, data: T[], total: number) {
	return c.json<ListResponse<T>>({ data, total });
}

export function notFound(c: Context, message = "Not found") {
	return c.json({ error: message }, 404);
}

export function badRequest(c: Context, message: string) {
	return c.json({ error: message }, 400);
}

export function conflict(c: Context, message: string) {
	return c.json({ error: message }, 409);
}
