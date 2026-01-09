import { nanoid } from "nanoid";

const PUBLIC_ID_LENGTH = 7;

export function generatePublicId(): string {
    return nanoid(PUBLIC_ID_LENGTH);
}
