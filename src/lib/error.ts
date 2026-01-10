import { TOAST } from "./toast";

export interface ApiError {
	message: string;
	status?: number;
}

export async function handleApiError(error: unknown): Promise<ApiError> {
	if (error instanceof Response) {
		// Try to extract error message from response body
		try {
			const body = (await error.json()) as { error?: string };
			const message = body.error || `Request failed: ${error.status}`;
			TOAST.error(message);
			return { message, status: error.status };
		} catch {
			const message = `Request failed: ${error.status}`;
			TOAST.error(message);
			return { message, status: error.status };
		}
	}

	if (error instanceof Error) {
		TOAST.error(error.message);
		return { message: error.message };
	}

	const message = "An unexpected error occurred";
	TOAST.error(message);
	return { message };
}
