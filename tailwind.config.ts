import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fafafa",
          100: "#f4f4f5",
          500: "#71717a",
          600: "#52525b",
          900: "#18181b",
        },
        sucuk: {
          50: "#fafafa",
          100: "#f4f4f5",
          500: "#18181b",
          600: "#09090b",
        },
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "in": "in 0.3s ease-out",
      },
      keyframes: {
        in: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
