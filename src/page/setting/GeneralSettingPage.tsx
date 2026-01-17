import { useSearchParams } from "react-router-dom";
import { Link, Hash } from "lucide-react";
import {
	MasterDetail,
	MasterList,
	MasterListItem,
	EmptyState,
	PermissionGuard,
} from "@/src/component";
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
			<MasterDetail selectedId={selectedTab}>
				<MasterList
					header={
						<div className="border-b border-geist-border px-5 py-5">
							<h1 className="text-lg font-semibold text-geist-fg">General</h1>
						</div>
					}
				>
					{CATEGORY_LIST.map(({ id, label, icon: Icon }) => (
						<MasterListItem
							key={id}
							isSelected={selectedTab === id}
							onClick={() => handleSelectTab(id)}
						>
							<div className="flex items-center gap-3">
								<Icon className="h-4 w-4 text-geist-fg-muted" />
								<span>{label}</span>
							</div>
						</MasterListItem>
					))}
				</MasterList>

				<div className="flex h-full flex-1 flex-col rounded-lg border border-geist-border bg-geist-bg">
					{/* Header */}
					<div className="shrink-0 border-b border-geist-border px-6 py-5">
						<h2 className="text-base font-semibold text-geist-fg">
							{selectedCategory?.label}
						</h2>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-auto p-6">
						<div className="max-w-lg">
							{renderDetailContent()}
						</div>
					</div>
				</div>
			</MasterDetail>
		</PermissionGuard>
	);
}
