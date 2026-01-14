import type { Config } from "tailwindcss";

export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		borderRadius: {
			none: "0px",
			sm: "2px",
			DEFAULT: "4px",
			md: "4px",
			lg: "6px",
			xl: "8px",
			full: "9999px",
		},
		fontSize: {
			"2xs": ["11px", { lineHeight: "16px" }],
			xs: ["12px", { lineHeight: "16px" }],
			sm: ["13px", { lineHeight: "20px" }],
			base: ["14px", { lineHeight: "20px" }],
			lg: ["16px", { lineHeight: "24px" }],
			xl: ["20px", { lineHeight: "28px" }],
			"2xl": ["24px", { lineHeight: "32px" }],
		},
		extend: {
			colors: {
				geist: {
					bg: "#ffffff",
					"bg-secondary": "#fafafa",
					border: "#eaeaea",
					"border-dark": "#333333",
					fg: "#171717",
					"fg-secondary": "#666666",
					"fg-muted": "#999999",
					success: "#0070f3",
					error: "#ee0000",
					warning: "#f5a623",
				},
			},
			fontFamily: {
				sans: ["Inter", "sans-serif"],
				mono: ["JetBrains Mono", "monospace"],
			},
			animation: {
				"fade-in": "fade-in 0.2s ease-out forwards",
				"slide-in-top": "slide-in-top 0.15s ease-out forwards",
			},
			keyframes: {
				"fade-in": {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				"slide-in-top": {
					"0%": { opacity: "0", transform: "translateY(-8px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
		},
	},
	plugins: [],
} satisfies Config;
