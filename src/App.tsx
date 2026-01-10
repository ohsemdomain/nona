import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { RootErrorBoundary } from "./component";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/AuthProvider";

function App() {
	return (
		<RootErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
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
