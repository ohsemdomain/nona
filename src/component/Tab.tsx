import {
	createContext,
	useContext,
	useState,
	useCallback,
	useId,
	useEffect,
	type ReactNode,
	type KeyboardEvent,
} from "react";
import { clsx } from "clsx";

// ============================================
// Types
// ============================================

type TabVariant = "underline" | "pill";
type TabSize = "sm" | "md";

interface TabContextValue {
	activeTab: string;
	setActiveTab: (id: string) => void;
	tabIds: string[];
	registerTab: (id: string) => void;
	baseId: string;
	variant: TabVariant;
	size: TabSize;
}

// ============================================
// Context
// ============================================

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext() {
	const context = useContext(TabContext);
	if (!context) {
		throw new Error("Tab components must be used within a TabGroup");
	}
	return context;
}

// ============================================
// TabGroup (Root Container)
// ============================================

interface TabGroupProp {
	children: ReactNode;
	defaultTab?: string;
	activeTab?: string;
	onTabChange?: (tabId: string) => void;
	variant?: TabVariant;
	size?: TabSize;
	className?: string;
}

/**
 * Root container for tab system.
 * Provides context and manages tab state.
 */
export function TabGroup({
	children,
	defaultTab,
	activeTab: controlledActiveTab,
	onTabChange,
	variant = "underline",
	size = "md",
	className,
}: TabGroupProp) {
	const baseId = useId();
	const [internalActiveTab, setInternalActiveTab] = useState(defaultTab ?? "");
	const [tabIds, setTabIds] = useState<string[]>([]);

	const isControlled = controlledActiveTab !== undefined;
	const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

	const setActiveTab = useCallback(
		(id: string) => {
			if (!isControlled) {
				setInternalActiveTab(id);
			}
			onTabChange?.(id);
		},
		[isControlled, onTabChange],
	);

	const registerTab = useCallback((id: string) => {
		setTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
	}, []);

	return (
		<TabContext.Provider
			value={{
				activeTab,
				setActiveTab,
				tabIds,
				registerTab,
				baseId,
				variant,
				size,
			}}
		>
			<div className={clsx("flex flex-col", className)}>{children}</div>
		</TabContext.Provider>
	);
}

// ============================================
// TabList (Tab Button Container)
// ============================================

interface TabListProp {
	children: ReactNode;
	className?: string;
	"aria-label"?: string;
}

/**
 * Container for Tab buttons.
 * Handles keyboard navigation between tabs.
 */
export function TabList({
	children,
	className,
	"aria-label": ariaLabel,
}: TabListProp) {
	const { tabIds, setActiveTab, activeTab, variant } = useTabContext();

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		const currentIndex = tabIds.indexOf(activeTab);
		let newIndex = currentIndex;

		switch (e.key) {
			case "ArrowLeft":
				newIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
				break;
			case "ArrowRight":
				newIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
				break;
			case "Home":
				newIndex = 0;
				break;
			case "End":
				newIndex = tabIds.length - 1;
				break;
			default:
				return;
		}

		e.preventDefault();
		setActiveTab(tabIds[newIndex]);
	};

	const variantStyles: Record<TabVariant, string> = {
		underline: "border-b border-zinc-200 dark:border-zinc-700",
		pill: "bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1",
	};

	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			onKeyDown={handleKeyDown}
			className={clsx("flex gap-1", variantStyles[variant], className)}
		>
			{children}
		</div>
	);
}

// ============================================
// Tab (Individual Tab Button)
// ============================================

interface TabProp {
	id: string;
	children: ReactNode;
	disabled?: boolean;
	className?: string;
}

/**
 * Individual tab button.
 * Click or keyboard focus activates the corresponding panel.
 */
export function Tab({ id, children, disabled = false, className }: TabProp) {
	const { activeTab, setActiveTab, registerTab, baseId, variant, size } =
		useTabContext();
	const isActive = activeTab === id;

	// Register on mount
	useEffect(() => {
		registerTab(id);
	}, [id, registerTab]);

	const sizeStyles: Record<TabSize, string> = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2 text-sm",
	};

	const variantStyles: Record<
		TabVariant,
		{ base: string; active: string; inactive: string }
	> = {
		underline: {
			base: "-mb-px border-b-2 transition-colors",
			active:
				"border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100",
			inactive:
				"border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-600",
		},
		pill: {
			base: "rounded-md transition-colors",
			active:
				"bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100",
			inactive:
				"text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
		},
	};

	const styles = variantStyles[variant];

	return (
		<button
			type="button"
			role="tab"
			id={`${baseId}-tab-${id}`}
			aria-selected={isActive}
			aria-controls={`${baseId}-panel-${id}`}
			tabIndex={isActive ? 0 : -1}
			disabled={disabled}
			onClick={() => !disabled && setActiveTab(id)}
			className={clsx(
				"font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				sizeStyles[size],
				styles.base,
				isActive ? styles.active : styles.inactive,
				className,
			)}
		>
			{children}
		</button>
	);
}

// ============================================
// TabPanels (Panel Container)
// ============================================

interface TabPanelsProp {
	children: ReactNode;
	className?: string;
}

/**
 * Container for TabPanel components.
 */
export function TabPanels({ children, className }: TabPanelsProp) {
	return <div className={clsx("mt-4", className)}>{children}</div>;
}

// ============================================
// TabPanel (Individual Panel Content)
// ============================================

interface TabPanelProp {
	id: string;
	children: ReactNode;
	className?: string;
}

/**
 * Content panel shown when corresponding Tab is active.
 */
export function TabPanel({ id, children, className }: TabPanelProp) {
	const { activeTab, baseId } = useTabContext();
	const isActive = activeTab === id;

	if (!isActive) return null;

	return (
		<div
			role="tabpanel"
			id={`${baseId}-panel-${id}`}
			aria-labelledby={`${baseId}-tab-${id}`}
			tabIndex={0}
			className={clsx("focus:outline-none", className)}
		>
			{children}
		</div>
	);
}
