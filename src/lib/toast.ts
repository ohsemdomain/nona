import toast from "react-hot-toast";

export const TOAST = {
    created: (entity: string) => toast.success(`${entity} created`),
    updated: (entity: string) => toast.success(`${entity} updated`),
    deleted: (entity: string) => toast.success(`${entity} deleted`),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
};
