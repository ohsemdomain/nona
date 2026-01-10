import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: (failureCount, error) => {
				// Don't retry on 401 (unauthorized)
				if (error instanceof Response && error.status === 401) {
					return false;
				}
				return failureCount < 1;
			},
		},
	},
});
