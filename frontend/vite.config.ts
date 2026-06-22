import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { mlDevPlugin } from "./vite-plugin-ml-dev";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.SMARTML_API_KEY && !process.env.SMARTML_API_KEY) {
    process.env.SMARTML_API_KEY = env.SMARTML_API_KEY;
  }

  return {
    plugins: [mlDevPlugin(), react()],
    server: {
      port: 5173,
      proxy: {
        "^/api/(?!ml/).*": "http://localhost:3001",
        "/ws": {
          target: "ws://localhost:3001",
          ws: true,
        },
      },
    },
  };
});
