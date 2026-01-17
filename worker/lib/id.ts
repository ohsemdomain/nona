import { nanoid } from "nanoid";

const LINK_ID_LENGTH = 9;
const PUBLIC_ID_LENGTH = 7;

export function generateLinkId(): string {
	return nanoid(LINK_ID_LENGTH);
}

// Only used for User entity (better-auth requires text id, so we need a separate publicId for URLs)
export function generatePublicId(): string {
	return nanoid(PUBLIC_ID_LENGTH);
}
