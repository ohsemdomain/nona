import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/src/component";
import { api, handleApiError } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";

interface AppSetting {
	id: number;
	key: string;
	value: string;
	updatedAt: number;
	updatedBy: string | null;
}

const SETTING_KEY = "public_link_expiry_day:order";
const DEFAULT_VALUE = "30";

export function PublicLinkSetting() {
	const queryClient = useQueryClient();
	const [expiryDay, setExpiryDay] = useState(DEFAULT_VALUE);
	const [isDirty, setIsDirty] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: queryKey.setting.detail(SETTING_KEY),
		queryFn: () => api.get<AppSetting | { key: string; value: null }>(`/setting/${SETTING_KEY}`),
	});

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

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="h-6 w-48 animate-pulse rounded bg-geist-bg-secondary" />
				<div className="h-10 w-64 animate-pulse rounded bg-geist-bg-secondary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-geist-fg">Link Expiry</h3>
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
					<span className="text-sm text-geist-fg-muted">days</span>
				</div>
			</div>

			<div className="flex justify-end pt-4">
				<Button
					onClick={handleSave}
					disabled={!isDirty || mutation.isPending}
				>
					{mutation.isPending ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	);
}
