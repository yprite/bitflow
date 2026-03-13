import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dot: {
          bg: '#f5f5f0',
          card: '#ffffff',
          border: '#d1d5db',
          text: '#1a1a1a',
          sub: '#6b7280',
          muted: '#9ca3af',
          green: '#00c853',
          red: '#e53935',
          blue: '#1e88e5',
          yellow: '#f9a825',
          accent: '#111111',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
