import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import {
	Button,
	EmptyState,
	PermissionGuard,
} from "@/src/component";
import { api, handleApiError } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { PERMISSION } from "@/shared/constant/permission";
import { NumberFormatSetting } from "./NumberFormatSetting";

interface AppSetting {
	id: number;
	key: string;
	value: string;
	updatedAt: number;
	updatedBy: string | null;
}

const SETTING_KEY = "public_link_expiry_day:order";
const DEFAULT_VALUE = "30";

export function GeneralSettingPage() {
	const queryClient = useQueryClient();
	const [expiryDay, setExpiryDay] = useState(DEFAULT_VALUE);
	const [isDirty, setIsDirty] = useState(false);

	const { data, isLoading, isError } = useQuery({
		queryKey: queryKey.setting.detail(SETTING_KEY),
		queryFn: () => api.get<AppSetting | { key: string; value: null }>(`/setting/${SETTING_KEY}`),
	});

	// Sync state with fetched data
	useEffect(() => {
		if (data?.value) {
			setExpiryDay(data.value);
		}
	}, [data]);

	const mutation = useMutation({
		mutationFn: (value: string) => api.put<AppSetting>(`/setting/${SETTING_KEY}`, { value }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKey.setting.detail(SETTING_KEY) });
			toast.success("Setting saved");
			setIsDirty(false);
		},
		onError: handleApiError,
	});

	const handleChange = (value: string) => {
		setExpiryDay(value);
		setIsDirty(true);
	};

	const handleSave = () => {
		const numValue = Number.parseInt(expiryDay, 10);
		if (Number.isNaN(numValue) || numValue < 1) {
			toast.error("Please enter a valid number (minimum 1 day)");
			return;
		}
		mutation.mutate(expiryDay);
	};

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
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="shrink-0 border-b border-geist-border bg-geist-bg px-4 py-3">
					<h1 className="text-lg font-semibold text-geist-fg">General</h1>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto bg-geist-bg p-4">
					{isLoading ? (
						<div className="space-y-4">
							<div className="h-6 w-48 animate-pulse rounded bg-geist-bg-secondary" />
							<div className="h-10 w-64 animate-pulse rounded bg-geist-bg-secondary" />
						</div>
					) : isError ? (
						<EmptyState
							title="Unable to load setting"
							message="There was an error loading the setting."
						/>
					) : (
						<div className="max-w-md space-y-6">
							<div className="rounded-lg border border-geist-border bg-geist-bg p-4">
								<div className="flex items-start gap-3">
									<Settings className="mt-0.5 h-5 w-5 text-geist-fg-muted" />
									<div className="flex-1">
										<h3 className="font-medium text-geist-fg">
											Public Link Expiry
										</h3>
										<p className="mt-1 text-sm text-geist-fg-muted">
											Default number of days before a shared public link expires.
										</p>
										<div className="mt-4 flex items-center gap-3">
											<input
												type="number"
												min="1"
												value={expiryDay}
												onChange={(e) => handleChange(e.target.value)}
												className="w-24 rounded border border-geist-border bg-geist-bg px-3 py-2 text-sm text-geist-fg focus:border-geist-fg focus:outline-none"
											/>
											<span className="text-sm text-geist-fg-muted">day</span>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									onClick={handleSave}
									disabled={!isDirty || mutation.isPending}
								>
									{mutation.isPending ? "Saving..." : "Save"}
								</Button>
							</div>

							<div className="border-t border-geist-border pt-6">
								<h2 className="text-lg font-semibold text-geist-fg mb-4">Number Format</h2>
								<NumberFormatSetting entityType="order" label="Order Number Format" />
							</div>
						</div>
					)}
				</div>
			</div>
		</PermissionGuard>
	);
}
