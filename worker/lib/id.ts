import { nanoid } from "nanoid";

const LINK_ID_LENGTH = 9;

export function generateLinkId(): string {
	return nanoid(LINK_ID_LENGTH);
}
