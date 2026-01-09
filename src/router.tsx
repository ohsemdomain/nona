import { createBrowserRouter, Navigate } from "react-router-dom";
import { CategoryPage } from "@/src/page/category";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/category" replace />,
    },
    {
        path: "/category",
        element: <CategoryPage />,
    },
]);
