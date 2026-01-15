import {
	createContext,
	useContext,
	forwardRef,
	type ComponentPropsWithoutRef,
	type ElementRef,
} from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { clsx } from "clsx";
import { Z_INDEX } from "@/src/lib/zIndex";

// Size context
type DropdownSize = "sm" | "md" | "lg";

const DropdownContext = createContext<{ size: DropdownSize }>({ size: "md" });

const useDropdownSize = () => useContext(DropdownContext);

const sizeConfig = {
	sm: { height: "h-8", text: "text-xs", icon: "h-3 w-3" },
	md: { height: "h-9", text: "text-sm", icon: "h-4 w-4" },
	lg: { height: "h-10", text: "text-base", icon: "h-5 w-5" },
};

// Root
interface DropdownProp extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> {
	size?: DropdownSize;
}

function Dropdown({ size = "md", children, ...props }: DropdownProp) {
	return (
		<DropdownContext.Provider value={{ size }}>
			<DropdownMenuPrimitive.Root {...props}>{children}</DropdownMenuPrimitive.Root>
		</DropdownContext.Provider>
	);
}

// Trigger
const DropdownTrigger = DropdownMenuPrimitive.Trigger;

// Group
const DropdownGroup = DropdownMenuPrimitive.Group;

// Portal
const DropdownPortal = DropdownMenuPrimitive.Portal;

// Sub
const DropdownSub = DropdownMenuPrimitive.Sub;

// Radio Group
const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Content
const DropdownContent = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.Content>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, style, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={clsx(
				"min-w-[180px] overflow-hidden rounded border border-geist-border bg-geist-bg p-1 shadow-lg",
				"data-[state=open]:animate-in data-[state=closed]:animate-out",
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
				"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
				"data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				className,
			)}
			style={{ zIndex: Z_INDEX.toast, ...style }}
			{...props}
		/>
	</DropdownMenuPrimitive.Portal>
));
DropdownContent.displayName = DropdownMenuPrimitive.Content.displayName;

// Item
interface DropdownItemProp
	extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
	variant?: "default" | "danger";
}

const DropdownItem = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.Item>,
	DropdownItemProp
>(({ className, variant = "default", children, ...props }, ref) => {
	const { size } = useDropdownSize();
	const config = sizeConfig[size];

	return (
		<DropdownMenuPrimitive.Item
			ref={ref}
			className={clsx(
				"relative flex cursor-pointer select-none items-center gap-2 rounded px-2 outline-none transition-colors",
				config.height,
				config.text,
				"focus:bg-geist-bg-secondary",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				variant === "danger" ? "text-geist-error focus:text-geist-error" : "text-geist-fg",
				className,
			)}
			{...props}
		>
			{children}
		</DropdownMenuPrimitive.Item>
	);
});
DropdownItem.displayName = DropdownMenuPrimitive.Item.displayName;

// Checkbox Item
const DropdownCheckboxItem = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
	const { size } = useDropdownSize();
	const config = sizeConfig[size];

	return (
		<DropdownMenuPrimitive.CheckboxItem
			ref={ref}
			className={clsx(
				"relative flex cursor-pointer select-none items-center gap-2 rounded px-2 pl-8 outline-none transition-colors",
				config.height,
				config.text,
				"text-geist-fg focus:bg-geist-bg-secondary",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			checked={checked}
			{...props}
		>
			<span className="absolute left-2 flex items-center justify-center">
				<DropdownMenuPrimitive.ItemIndicator>
					<Check className={config.icon} />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
});
DropdownCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// Radio Item
const DropdownRadioItem = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
	const { size } = useDropdownSize();
	const config = sizeConfig[size];

	return (
		<DropdownMenuPrimitive.RadioItem
			ref={ref}
			className={clsx(
				"relative flex cursor-pointer select-none items-center gap-2 rounded px-2 pl-8 outline-none transition-colors",
				config.height,
				config.text,
				"text-geist-fg focus:bg-geist-bg-secondary",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		>
			<span className="absolute left-2 flex items-center justify-center">
				<DropdownMenuPrimitive.ItemIndicator>
					<Circle className="h-2 w-2 fill-current" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
});
DropdownRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// Label
const DropdownLabel = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.Label>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => {
	const { size } = useDropdownSize();
	const config = sizeConfig[size];

	return (
		<DropdownMenuPrimitive.Label
			ref={ref}
			className={clsx(
				"px-2 py-1.5 font-medium text-geist-fg-muted",
				config.text,
				className,
			)}
			{...props}
		/>
	);
});
DropdownLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// Separator
const DropdownSeparator = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.Separator>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Separator
		ref={ref}
		className={clsx("-mx-1 my-1 h-px bg-geist-border", className)}
		{...props}
	/>
));
DropdownSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// Sub Trigger
const DropdownSubTrigger = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => {
	const { size } = useDropdownSize();
	const config = sizeConfig[size];

	return (
		<DropdownMenuPrimitive.SubTrigger
			ref={ref}
			className={clsx(
				"relative flex cursor-pointer select-none items-center gap-2 rounded px-2 outline-none transition-colors",
				config.height,
				config.text,
				"text-geist-fg focus:bg-geist-bg-secondary",
				"data-[state=open]:bg-geist-bg-secondary",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronRight className={clsx("ml-auto", config.icon)} />
		</DropdownMenuPrimitive.SubTrigger>
	);
});
DropdownSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// Sub Content
const DropdownSubContent = forwardRef<
	ElementRef<typeof DropdownMenuPrimitive.SubContent>,
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, style, ...props }, ref) => (
	<DropdownMenuPrimitive.SubContent
		ref={ref}
		className={clsx(
			"min-w-[180px] overflow-hidden rounded border border-geist-border bg-geist-bg p-1 shadow-lg",
			"data-[state=open]:animate-in data-[state=closed]:animate-out",
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
			"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
			"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
			"data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
			className,
		)}
		style={{ zIndex: Z_INDEX.toast, ...style }}
		{...props}
	/>
));
DropdownSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// Shortcut (visual only, not from Radix)
interface DropdownShortcutProp extends React.HTMLAttributes<HTMLSpanElement> {}

function DropdownShortcut({ className, ...props }: DropdownShortcutProp) {
	return (
		<span
			className={clsx("ml-auto text-xs tracking-widest text-geist-fg-muted", className)}
			{...props}
		/>
	);
}

export {
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownCheckboxItem,
	DropdownRadioGroup,
	DropdownRadioItem,
	DropdownLabel,
	DropdownSeparator,
	DropdownSub,
	DropdownSubTrigger,
	DropdownSubContent,
	DropdownShortcut,
	DropdownGroup,
	DropdownPortal,
};
