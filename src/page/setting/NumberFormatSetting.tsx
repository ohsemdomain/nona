import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@/src/component";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import toast from "react-hot-toast";
import { DATE_PLACEHOLDER, DIGIT_PLACEHOLDER } from "@/shared/type/number-format";

interface NumberFormatSettingProp {
	entityType: string;
	label: string;
}

export function NumberFormatSetting({ entityType, label }: NumberFormatSettingProp) {
	const queryClient = useQueryClient();
	const [pattern, setPattern] = useState("");
	const [preview, setPreview] = useState("");
	const [previewError, setPreviewError] = useState("");

	// Fetch current pattern
	const { data, isLoading } = useQuery({
		queryKey: queryKey.numberFormat.detail(entityType),
		queryFn: () => api.get<{ pattern: string }>(`/setting/number-format/${entityType}`),
	});

	// Update local state when data loads
	useEffect(() => {
		if (data?.pattern) {
			setPattern(data.pattern);
		}
	}, [data?.pattern]);

	// Fetch preview when pattern changes (debounced)
	useEffect(() => {
		if (!pattern) {
			setPreview("");
			setPreviewError("");
			return;
		}

		const timeout = setTimeout(async () => {
			try {
				const result = await api.get<{ preview?: string; error?: string }>(
					`/setting/number-format/${entityType}/preview?pattern=${encodeURIComponent(pattern)}`
				);
				if (result.error) {
					setPreviewError(result.error);
					setPreview("");
				} else {
					setPreview(result.preview || "");
					setPreviewError("");
				}
			} catch {
				setPreviewError("Failed to generate preview");
				setPreview("");
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [pattern, entityType]);

	// Save mutation
	const saveMutation = useMutation({
		mutationFn: (newPattern: string) =>
			api.post(`/setting/number-format/${entityType}`, { pattern: newPattern }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKey.numberFormat.detail(entityType) });
			toast.success("Format saved");
		},
		onError: (error: any) => {
			toast.error(error?.message || "Failed to save");
		},
	});

	const insertPlaceholder = (placeholder: string) => {
		setPattern((prev) => prev + placeholder);
	};

	if (isLoading) {
		return <div className="animate-pulse h-32 bg-geist-bg-muted rounded" />;
	}

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-geist-fg mb-1">{label}</label>
				<Input
					value={pattern}
					onChange={(e) => setPattern(e.target.value)}
					placeholder="e.g., ORD[YY][MM][4DIGIT]"
				/>
			</div>

			{preview && (
				<div className="text-sm">
					<span className="text-geist-fg-muted">Preview: </span>
					<span className="font-mono text-geist-fg">{preview}</span>
				</div>
			)}

			{previewError && (
				<div className="text-sm text-red-500">{previewError}</div>
			)}

			<div className="space-y-2">
				<div className="text-xs text-geist-fg-muted">Date placeholder:</div>
				<div className="flex flex-wrap gap-1">
					{DATE_PLACEHOLDER.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => insertPlaceholder(p)}
							className="px-2 py-1 text-xs font-mono bg-geist-bg-muted hover:bg-geist-bg-hover rounded border border-geist-border"
						>
							{p}
						</button>
					))}
				</div>

				<div className="text-xs text-geist-fg-muted">Sequence placeholder:</div>
				<div className="flex flex-wrap gap-1">
					{DIGIT_PLACEHOLDER.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => insertPlaceholder(p)}
							className="px-2 py-1 text-xs font-mono bg-geist-bg-muted hover:bg-geist-bg-hover rounded border border-geist-border"
						>
							{p}
						</button>
					))}
				</div>
			</div>

			<Button
				onClick={() => saveMutation.mutate(pattern)}
				disabled={saveMutation.isPending || !!previewError || !pattern}
			>
				{saveMutation.isPending ? "Saving..." : "Save"}
			</Button>
		</div>
	);
}
