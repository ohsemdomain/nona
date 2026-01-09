import { createBrowserRouter, Navigate } from "react-router-dom";
import { CategoryPage } from "@/src/page/category";
import { ItemPage } from "@/src/page/item";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/category" replace />,
    },
    {
        path: "/category",
        element: <CategoryPage />,
    },
    {
        path: "/item",
        element: <ItemPage />,
    },
]);
