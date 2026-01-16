import { nanoid } from "nanoid";

const PUBLIC_ID_LENGTH = 7;
const LINK_ID_LENGTH = 9;

export function generatePublicId(): string {
	return nanoid(PUBLIC_ID_LENGTH);
}

export function generateLinkId(): string {
	return nanoid(LINK_ID_LENGTH);
}
