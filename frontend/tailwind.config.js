/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0d1416",
          900: "#162124",
          800: "#203136",
        },
        sand: {
          50: "#f8f5ed",
          100: "#efe6d7",
          200: "#e0ceb0",
        },
        teal: {
          500: "#24b7a8",
          600: "#159a8b",
        },
        coral: {
          500: "#ef7c5f",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 60px rgba(7, 16, 18, 0.22)",
      },
    },
  },
  plugins: [],
};

