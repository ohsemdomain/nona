import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout, ProtectedRoute } from "@/src/component";
import { CategoryPage } from "@/src/page/category";
import { ItemPage } from "@/src/page/item";
import { OrderPage, OrderFormPage } from "@/src/page/order";
import { LoginPage, RegisterPage } from "@/src/page/auth";

export const router = createBrowserRouter([
	// Public auth routes (no layout)
	{
		path: "/login",
		element: <LoginPage />,
	},
	{
		path: "/register",
		element: <RegisterPage />,
	},
	// Protected routes (with layout)
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<Layout />
			</ProtectedRoute>
		),
		children: [
			{
				index: true,
				element: <Navigate to="/category" replace />,
			},
			{
				path: "category",
				element: <CategoryPage />,
			},
			{
				path: "item",
				element: <ItemPage />,
			},
			{
				path: "order",
				element: <OrderPage />,
			},
			{
				path: "order/new",
				element: <OrderFormPage />,
			},
			{
				path: "order/:id/edit",
				element: <OrderFormPage />,
			},
		],
	},
]);
