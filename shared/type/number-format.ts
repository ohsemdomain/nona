export const DATE_PLACEHOLDER = ["[YYYY]", "[YY]", "[MM]", "[DD]"] as const;
export const DIGIT_PLACEHOLDER = [
	"[2DIGIT]",
	"[3DIGIT]",
	"[4DIGIT]",
	"[5DIGIT]",
	"[6DIGIT]",
	"[7DIGIT]",
	"[8DIGIT]",
] as const;

export type DatePlaceholder = (typeof DATE_PLACEHOLDER)[number];
export type DigitPlaceholder = (typeof DIGIT_PLACEHOLDER)[number];

export const DEFAULT_FORMAT: Record<string, string> = {
	order: "ORD[YY][3DIGIT][MM][DD]",
	invoice: "[MM][4DIGIT][YY][DD]",
	quote: "[MM][4DIGIT][YY][DD]",
};
