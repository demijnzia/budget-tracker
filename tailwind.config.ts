import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1E7",
        "paper-dark": "#111712",
        ink: "#1F2A24",
        "ink-soft": "#4B5A50",
        rule: "#C4CFBB",
        "rule-dark": "#2A362E",
        debit: "#B3452F",
        credit: "#3B6B4A",
        gold: "#C9962C",
        card: "#F6F8F1",
        "card-dark": "#182018",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  darkMode: "media",
  plugins: [],
};
export default config;
