import type { Config } from "tailwindcss";

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        borderRadius: {
            none: "0px",
            DEFAULT: "4px",
            full: "9999px",
        },
        extend: {
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                mono: ["Space Grotesk", "monospace"],
            },
            animation: {
                "fade-in": "fade-in 0.3s ease-out forwards",
                "slide-in-top": "slide-in-top 0.1s ease-out forwards",
            },
            keyframes: {
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "slide-in-top": {
                    "0%": { opacity: "0", transform: "translateY(-2rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
