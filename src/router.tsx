import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout, ProtectedRoute, RouteErrorBoundary } from "@/src/component";
import { CategoryPage } from "@/src/page/category";
import { ItemPage } from "@/src/page/item";
import { OrderPage, OrderFormPage } from "@/src/page/order";
import { UserPage } from "@/src/page/user";
import { RolePage } from "@/src/page/role";
import { GeneralSettingPage, SettingPage, SystemLogPage } from "@/src/page/setting";
import { LoginPage } from "@/src/page/auth";

export const router = createBrowserRouter([
	// Public auth routes (no layout)
	{
		path: "/login",
		element: <LoginPage />,
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
			{
				path: "setting",
				element: <SettingPage />,
				errorElement: <RouteErrorBoundary />,
				children: [
					{
						index: true,
						element: <Navigate to="/setting/general" replace />,
					},
					{
						path: "general",
						element: <GeneralSettingPage />,
						errorElement: <RouteErrorBoundary />,
					},
					{
						path: "user",
						element: <UserPage />,
						errorElement: <RouteErrorBoundary />,
					},
					{
						path: "log",
						element: <SystemLogPage />,
						errorElement: <RouteErrorBoundary />,
					},
					{
						path: "role",
						element: <RolePage />,
						errorElement: <RouteErrorBoundary />,
					},
				],
			},
		],
	},
	// Catch-all 404
	{
		path: "*",
		element: <RouteErrorBoundary />,
	},
]);
