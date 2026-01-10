export function nowUnix(): number {
	return Date.now();
}

export function timestamps() {
	const now = nowUnix();
	return {
		createdAt: now,
		updatedAt: now,
	};
}

export function updatedTimestamp() {
	return {
		updatedAt: nowUnix(),
	};
}
