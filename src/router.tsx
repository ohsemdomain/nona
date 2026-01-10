import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout, ProtectedRoute, RouteErrorBoundary } from "@/src/component";
import { CategoryPage } from "@/src/page/category";
import { ItemPage } from "@/src/page/item";
import { OrderPage, OrderFormPage } from "@/src/page/order";
import { LoginPage, RegisterPage } from "@/src/page/auth";

export const router = createBrowserRouter([
	// Public auth routes (no layout)
	{
		path: "/login",
		element: <LoginPage />,
		errorElement: <RouteErrorBoundary />,
	},
	{
		path: "/register",
		element: <RegisterPage />,
		errorElement: <RouteErrorBoundary />,
	},
	// Protected routes (with layout)
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<Layout />
			</ProtectedRoute>
		),
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				index: true,
				element: <Navigate to="/category" replace />,
			},
			{
				path: "category",
				element: <CategoryPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "item",
				element: <ItemPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "order",
				element: <OrderPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "order/new",
				element: <OrderFormPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "order/:id/edit",
				element: <OrderFormPage />,
				errorElement: <RouteErrorBoundary />,
			},
		],
	},
	// Catch-all 404
	{
		path: "*",
		element: <RouteErrorBoundary />,
	},
]);
