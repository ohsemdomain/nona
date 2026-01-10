import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { RootErrorBoundary } from "./component";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 1,
		},
	},
});

function App() {
	return (
		<RootErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
				<Toaster
					position="bottom-right"
					toastOptions={{
						duration: 3000,
						style: {
							background: "#18181b",
							color: "#fafafa",
						},
					}}
				/>
			</QueryClientProvider>
		</RootErrorBoundary>
	);
}

export default App;
