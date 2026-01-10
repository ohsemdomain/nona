import { CONFIG } from "./config";
import { handleApiError } from "./error";
import { handleUnauthorized } from "./auth";

type RequestOption = Omit<RequestInit, "body"> & {
	body?: unknown;
};

async function request<T>(
	endpoint: string,
	options: RequestOption = {},
): Promise<T> {
	const { body, headers, ...rest } = options;

	const response = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
		...rest,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		// Handle 401 - session expired or invalid
		if (response.status === 401) {
			await handleUnauthorized();
			throw response;
		}
		throw response;
	}

	return response.json();
}

export const api = {
	get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

	post: <T>(endpoint: string, body: unknown) =>
		request<T>(endpoint, { method: "POST", body }),

	put: <T>(endpoint: string, body: unknown) =>
		request<T>(endpoint, { method: "PUT", body }),

	delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

export { handleApiError };
