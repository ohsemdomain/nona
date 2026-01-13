import { clsx } from "clsx";

const baseClass = "animate-pulse bg-zinc-200  rounded";

type SkeletonWidth = "full" | "3/4" | "1/2" | "1/3" | "1/4";
type SkeletonSize = "xs" | "sm" | "base" | "lg" | "xl";

const widthMap: Record<SkeletonWidth, string> = {
	full: "w-full",
	"3/4": "w-3/4",
	"1/2": "w-1/2",
	"1/3": "w-1/3",
	"1/4": "w-1/4",
};

const textSizeMap: Record<SkeletonSize, string> = {
	xs: "h-3",
	sm: "h-4",
	base: "h-5",
	lg: "h-6",
	xl: "h-7",
};

interface SkeletonTextProp {
	width?: SkeletonWidth;
	size?: SkeletonSize;
	className?: string;
}

export function SkeletonText({
	width = "full",
	size = "base",
	className,
}: SkeletonTextProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={clsx(baseClass, widthMap[width], textSizeMap[size], className)}
		/>
	);
}

interface SkeletonBoxProp {
	width?: string;
	height?: string;
	className?: string;
}

export function SkeletonBox({
	width = "w-full",
	height = "h-24",
	className,
}: SkeletonBoxProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={clsx(baseClass, width, height, className)}
		/>
	);
}

type CircleSize = "sm" | "md" | "lg" | "xl";

const circleSizeMap: Record<CircleSize, string> = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-10 w-10",
	xl: "h-12 w-12",
};

interface SkeletonCircleProp {
	size?: CircleSize;
	className?: string;
}

export function SkeletonCircle({ size = "md", className }: SkeletonCircleProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={clsx(baseClass, "rounded-full", circleSizeMap[size], className)}
		/>
	);
}

type AvatarSize = "sm" | "md" | "lg";

const avatarSizeMap: Record<AvatarSize, string> = {
	sm: "h-8 w-8",
	md: "h-10 w-10",
	lg: "h-12 w-12",
};

interface SkeletonAvatarProp {
	size?: AvatarSize;
	withText?: boolean;
	className?: string;
}

export function SkeletonAvatar({
	size = "md",
	withText = false,
	className,
}: SkeletonAvatarProp) {
	return (
		<div className={clsx("flex items-center gap-3", className)}>
			<div
				role="presentation"
				aria-hidden="true"
				className={clsx(baseClass, "rounded-full", avatarSizeMap[size])}
			/>
			{withText && (
				<div className="flex-1 space-y-2">
					<SkeletonText width="3/4" size="sm" />
					<SkeletonText width="1/2" size="xs" />
				</div>
			)}
		</div>
	);
}
