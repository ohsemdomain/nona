import { useSearchParams } from "react-router-dom";
import { Link, Hash } from "lucide-react";
import { EmptyState, PermissionGuard } from "@/src/component";
import { PERMISSION } from "@/shared/constant/permission";
import { PublicLinkSetting } from "./PublicLinkSetting";
import { NumberFormatSetting } from "./NumberFormatSetting";

const CATEGORY_LIST = [
	{ id: "public-link", label: "Public Link", icon: Link },
	{ id: "number-format", label: "Number Format", icon: Hash },
] as const;

type CategoryId = (typeof CATEGORY_LIST)[number]["id"];

export function GeneralSettingPage() {
	const [searchParam, setSearchParam] = useSearchParams();
	const selectedTab = (searchParam.get("tab") as CategoryId) || "public-link";

	const handleSelectTab = (tabId: CategoryId) => {
		setSearchParam({ tab: tabId }, { replace: true });
	};

	const renderDetailContent = () => {
		switch (selectedTab) {
			case "public-link":
				return <PublicLinkSetting />;
			case "number-format":
				return <NumberFormatSetting entityType="order" label="Order Number Format" />;
			default:
				return null;
		}
	};

	const selectedCategory = CATEGORY_LIST.find((c) => c.id === selectedTab);

	return (
		<PermissionGuard
			permission={PERMISSION.SYSTEM_ADMIN}
			fallback={
				<EmptyState
					title="Access Denied"
					message="You do not have permission to manage setting."
				/>
			}
		>
			<div className="flex h-full">
				{/* Sidebar - hidden on mobile */}
				<div className="hidden w-60 shrink-0 border-r border-geist-border bg-geist-bg lg:block">
					<div className="p-4">
						<h2 className="px-2 pb-3 text-xs font-semibold uppercase tracking-wider text-geist-fg-muted">
							General
						</h2>
						<ul className="space-y-1">
							{CATEGORY_LIST.map(({ id, label, icon: Icon }) => (
								<li key={id}>
									<button
										type="button"
										onClick={() => handleSelectTab(id)}
										className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
											selectedTab === id
												? "bg-geist-bg-secondary text-geist-fg"
												: "text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg"
										}`}
									>
										<Icon className="h-4 w-4" />
										{label}
									</button>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Detail Panel */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* Mobile: Tab selector */}
					<div className="shrink-0 border-b border-geist-border bg-geist-bg px-4 py-3 lg:hidden">
						<select
							value={selectedTab}
							onChange={(e) => handleSelectTab(e.target.value as CategoryId)}
							className="w-full rounded border border-geist-border bg-geist-bg px-3 py-2 text-sm text-geist-fg"
						>
							{CATEGORY_LIST.map(({ id, label }) => (
								<option key={id} value={id}>
									{label}
								</option>
							))}
						</select>
					</div>

					{/* Header */}
					<div className="shrink-0 border-b border-geist-border bg-geist-bg px-6 py-4">
						<h1 className="text-lg font-semibold text-geist-fg">
							{selectedCategory?.label}
						</h1>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-auto bg-geist-bg p-6">
						<div className="max-w-lg">
							{renderDetailContent()}
						</div>
					</div>
				</div>
			</div>
		</PermissionGuard>
	);
}
