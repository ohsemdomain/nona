export type {
	Category,
	CreateCategoryInput,
	UpdateCategoryInput,
} from "./category";
export type {
	Item,
	ItemCategory,
	CreateItemInput,
	UpdateItemInput,
} from "./item";
export type {
	Order,
	OrderLine,
	OrderLineItem,
	OrderStatus,
	CreateOrderInput,
	UpdateOrderInput,
	CreateOrderLineInput,
} from "./order";
export { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "./order";
export type { User, CreateUserInput, UpdateUserInput } from "./user";
export type {
	Role,
	RoleWithPermission,
	CreateRoleInput,
	UpdateRoleInput,
	Permission,
	PermissionGroup,
} from "./role";

/**
 * Entity types for CRUD operations.
 * Used by useResource, useFormModal, useMasterDetail, and cache invalidation.
 */
export type Entity = "category" | "item" | "order" | "user";
export type {
	AuditAction,
	AuditResource,
	AuditFieldChange,
	AuditActor,
	AuditLogEntry,
	AuditLogListResponse,
} from "./audit";
export { AUDIT_ACTION, AUDIT_RESOURCE } from "./audit";
