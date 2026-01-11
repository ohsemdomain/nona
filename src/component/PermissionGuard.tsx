import type { ReactNode } from "react";
import { usePermission } from "@/src/hook/usePermission";
import type { PermissionValue } from "@/shared/constant/permission";

interface PermissionGuardProps {
	/**
	 * Permission required to render children.
	 * Use single permission or array for "any of" behavior.
	 */
	permission: PermissionValue | PermissionValue[];
	/**
	 * Content to render when user has permission
	 */
	children: ReactNode;
	/**
	 * Content to render when user lacks permission (default: null)
	 */
	fallback?: ReactNode;
	/**
	 * If true, requires ALL permissions in array (default: false = any)
	 */
	requireAll?: boolean;
}

/**
 * Conditionally renders children based on user permissions.
 *
 * @example
 * // Single permission
 * <PermissionGuard permission={PERMISSION.CATEGORY_DELETE}>
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGuard permission={[PERMISSION.ITEM_CREATE, PERMISSION.ITEM_UPDATE]}>
 *   <EditForm />
 * </PermissionGuard>
 *
 * @example
 * // All permissions required
 * <PermissionGuard permission={[PERMISSION.USER_READ, PERMISSION.USER_UPDATE]} requireAll>
 *   <UserEditor />
 * </PermissionGuard>
 */
export function PermissionGuard({
	permission,
	children,
	fallback = null,
	requireAll = false,
}: PermissionGuardProps) {
	const { hasPermission, hasAnyPermission, hasAllPermissions } =
		usePermission();

	const permissionList = Array.isArray(permission) ? permission : [permission];

	const allowed = requireAll
		? hasAllPermissions(...permissionList)
		: permissionList.length === 1
			? hasPermission(permissionList[0])
			: hasAnyPermission(...permissionList);

	if (!allowed) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
