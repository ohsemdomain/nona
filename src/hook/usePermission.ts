import { useCallback } from "react";
import { useAuth } from "@/src/lib/AuthProvider";
import type { PermissionValue } from "@/shared/constant/permission";

export function usePermission() {
	const { role, permissions } = useAuth();

	const hasPermission = useCallback(
		(permission: PermissionValue | string): boolean => {
			// system:admin bypasses all checks
			if (permissions.includes("system:admin")) return true;
			return permissions.includes(permission);
		},
		[permissions],
	);

	const hasAnyPermission = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			if (permissions.includes("system:admin")) return true;
			return requiredPermissions.some((p) => permissions.includes(p));
		},
		[permissions],
	);

	const hasAllPermissions = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			if (permissions.includes("system:admin")) return true;
			return requiredPermissions.every((p) => permissions.includes(p));
		},
		[permissions],
	);

	const isAdmin = permissions.includes("system:admin");

	return {
		role,
		permissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isAdmin,
	};
}
