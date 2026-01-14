import { format, formatDistanceToNow } from "date-fns";

export function getLocalDate(): Date {
	return new Date();
}

export function toUTC(date: Date): number {
	return date.getTime();
}

export function fromUTC(timestamp: number): Date {
	return new Date(timestamp);
}

export function formatDate(timestamp: number): string {
	return format(fromUTC(timestamp), "dd.MM.yy");
}

export function formatDateTime(timestamp: number): string {
	return format(fromUTC(timestamp), "dd.MM.yy h:mma");
}

export function formatRelative(timestamp: number): string {
	return formatDistanceToNow(fromUTC(timestamp), { addSuffix: true });
}

export function nowUTC(): number {
	return toUTC(getLocalDate());
}
