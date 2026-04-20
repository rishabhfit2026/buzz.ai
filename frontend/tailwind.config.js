/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f4efe6",
        ink: {
          950: "#10131a",
          900: "#161b24",
          800: "#1e2531"
        },
        coral: "#ef6f5e",
        mint: "#7dd3b0",
        gold: "#f5c46b"
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        display: ["Instrument Serif", "serif"]
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0, 0, 0, 0.25)"
      },
      backgroundImage: {
        aura: "radial-gradient(circle at top left, rgba(239,111,94,0.22), transparent 35%), radial-gradient(circle at top right, rgba(125,211,176,0.18), transparent 30%), linear-gradient(180deg, #161b24 0%, #10131a 65%)"
      }
    }
  },
  plugins: []
};

