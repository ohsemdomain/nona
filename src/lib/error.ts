import { TOAST } from "./toast";

export interface ApiError {
    message: string;
    status?: number;
}

export function handleApiError(error: unknown): ApiError {
    if (error instanceof Response) {
        const message = `Request failed: ${error.status}`;
        TOAST.error(message);
        return { message, status: error.status };
    }

    if (error instanceof Error) {
        TOAST.error(error.message);
        return { message: error.message };
    }

    const message = "An unexpected error occurred";
    TOAST.error(message);
    return { message };
}
