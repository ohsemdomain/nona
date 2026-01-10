import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/src/component";
import { CategoryPage } from "@/src/page/category";
import { ItemPage } from "@/src/page/item";
import { OrderPage, OrderFormPage } from "@/src/page/order";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
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
