import { useCallback } from "react";
import { useAuth } from "@/src/lib/AuthProvider";
import { ROLE, type PermissionValue } from "@/shared/constant/permission";

export function usePermission() {
	const { role, permissions } = useAuth();

	const hasPermission = useCallback(
		(permission: PermissionValue | string): boolean => {
			return permissions.includes(permission);
		},
		[permissions],
	);

	const hasAnyPermission = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			return requiredPermissions.some((p) => permissions.includes(p));
		},
		[permissions],
	);

	const hasAllPermissions = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			return requiredPermissions.every((p) => permissions.includes(p));
		},
		[permissions],
	);

	const isAdmin = role === ROLE.ADMIN;
	const isUser = role === ROLE.USER;
	const isViewer = role === ROLE.VIEWER;

	return {
		role,
		permissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isAdmin,
		isUser,
		isViewer,
	};
}
