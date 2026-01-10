import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
	plugins: [
		react(),
		cloudflare({
			inspectorPort: false,
		}),
	],
	resolve: {
		alias: {
			"@/shared": "/shared",
			"@/src": "/src",
			"@/worker": "/worker",
		},
	},
	server: {
		host: true,
	},
});
