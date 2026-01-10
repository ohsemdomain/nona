/**
 * Stable deep equality comparison.
 * Handles object key order differences correctly.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null) return false;
	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, i) => deepEqual(item, b[i]));
	}

	if (typeof a === "object" && typeof b === "object") {
		const aKeys = Object.keys(a as object).sort();
		const bKeys = Object.keys(b as object).sort();

		if (aKeys.length !== bKeys.length) return false;
		if (aKeys.some((key, i) => key !== bKeys[i])) return false;

		return aKeys.every((key) =>
			deepEqual(
				(a as Record<string, unknown>)[key],
				(b as Record<string, unknown>)[key],
			),
		);
	}

	return false;
}
